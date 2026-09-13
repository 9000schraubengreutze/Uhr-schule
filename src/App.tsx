import { useEffect, useState, useMemo, useCallback, type CSSProperties } from 'react';
import { ClockSettings, ColorScheme } from './types';
import {
  loadSettings,
  saveSettings,
  storeLocalImage,
  loadStoredImage,
  removeStoredImage,
} from './utils/storage';
import { GRADIENT_PRESETS, CURATED_THEMES } from './utils/presets';
import { syncWithAtomicClock, AtomicTimeState } from './utils/atomicTime';
import { DigitalClock } from './components/DigitalClock';
import { ParticleBackground } from './components/ParticleBackground';
import { SmoothBackground } from './components/SmoothBackground';
import { MaterialSettingsDrawer } from './components/MaterialSettingsDrawer';
import { QuickControls } from './components/QuickControls';
import { GamesModal } from './games/GamesModal';
import { StopwatchModal } from './components/StopwatchModal';

export default function App() {
  const [settings, setSettings] = useState<ClockSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Online Atomic Clock synchronization state
  const [atomicState, setAtomicState] = useState<AtomicTimeState>({
    status: 'idle',
    offsetMs: 0,
    latencyMs: 0,
    lastSyncTime: null,
    syncSource: '',
    errorMessage: null,
  });

  // Perform time synchronization with online atomic clock servers
  const performSync = useCallback(async () => {
    setAtomicState((prev) => ({ ...prev, status: 'syncing', errorMessage: null }));
    try {
      const res = await syncWithAtomicClock();
      setAtomicState({
        status: 'synced',
        offsetMs: res.offsetMs,
        latencyMs: res.latencyMs,
        lastSyncTime: res.syncedAt,
        syncSource: res.source,
        errorMessage: null,
      });
    } catch (err: any) {
      console.warn('Atomic clock sync failed:', err);
      setAtomicState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Sync-Fehler',
      }));
    }
  }, []);

  // Sync on startup and re-sync periodically (every 5 minutes) or on window focus
  useEffect(() => {
    performSync();

    const interval = setInterval(performSync, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performSync]);

  // Load persistent local wallpaper image on startup
  useEffect(() => {
    let active = true;
    loadStoredImage().then((url) => {
      if (active && url) {
        setCustomImageUrl(url);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync settings changes to localStorage automatically
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed or not permitted:', err);
    }
  }, []);

  // Keyboard shortcuts (Esc, F, S, G)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        if (isGamesOpen) setIsGamesOpen(false);
        else if (isStopwatchOpen) setIsStopwatchOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        setIsGamesOpen((prev) => !prev);
      } else if (e.key === 'w' || e.key === 'W') {
        setIsStopwatchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGamesOpen, isSettingsOpen, isStopwatchOpen, toggleFullscreen]);

  const handleUploadImage = async (file: File) => {
    try {
      const objectUrl = await storeLocalImage(file);
      setCustomImageUrl(objectUrl);
      setSettings((prev) => ({
        ...prev,
        bgType: 'image',
        hasCustomImage: true,
      }));
    } catch (err) {
      console.error('Image upload failed', err);
    }
  };

  const handleRemoveImage = async () => {
    await removeStoredImage();
    if (customImageUrl) {
      URL.revokeObjectURL(customImageUrl);
    }
    setCustomImageUrl(null);
    setSettings((prev) => ({
      ...prev,
      hasCustomImage: false,
      bgType: prev.bgType === 'image' ? 'gradient' : prev.bgType,
    }));
  };

  // Quick light/dark mode switcher
  const handleToggleThemeMode = () => {
    setSettings((prev) => {
      const newMode = prev.themeMode === 'light' ? 'dark' : 'light';
      return {
        ...prev,
        themeMode: newMode,
        colorScheme: newMode as ColorScheme,
        bgColor: newMode === 'light' ? '#f8fafc' : '#0f172a',
        clockColor: newMode === 'light' ? '#0f172a' : '#f8fafc',
      };
    });
  };

  // Dynamically synchronize the application's CSS variables
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--clock-color', settings.clockColor);

    const activeTheme = CURATED_THEMES.find((t) => t.id === settings.themeId);
    const clockAccent = activeTheme?.clockAccent || `${settings.clockColor}40`;
    root.style.setProperty('--clock-accent', clockAccent);

    const accentColor = settings.accentColor || activeTheme?.accentColor || '#38bdf8';
    root.style.setProperty('--accent-color', accentColor);

    const accentGlow = activeTheme?.accentGlow || `${accentColor}40`;
    root.style.setProperty('--accent-glow', accentGlow);

    const surfaceBorder = activeTheme?.surfaceBorder || 'rgba(255, 255, 255, 0.15)';
    root.style.setProperty('--surface-border', surfaceBorder);

    root.style.setProperty('--bg-color', settings.bgColor);

    const uiBlur = typeof settings.backdropBlurIntensity === 'number' ? settings.backdropBlurIntensity : 16;
    root.style.setProperty('--ui-backdrop-blur', `${uiBlur}px`);
  }, [
    settings.clockColor,
    settings.themeId,
    settings.accentColor,
    settings.bgColor,
    settings.backdropBlurIntensity,
  ]);

  // Resolve current background gradient string directly
  const resolvedBgGradient = useMemo(() => {
    const activeTheme = CURATED_THEMES.find((t) => t.id === settings.themeId);
    let bgGradient = activeTheme?.gradientCss;
    if (!bgGradient) {
      if (settings.gradientPresetId === 'custom') {
        const { color1, color2, angle } = settings.customGradient;
        bgGradient = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
      } else {
        const matched = GRADIENT_PRESETS.find((p) => p.id === settings.gradientPresetId);
        bgGradient = matched ? matched.css : GRADIENT_PRESETS[0].css;
      }
    }
    return bgGradient;
  }, [settings.themeId, settings.gradientPresetId, settings.customGradient]);

  // Keep root CSS variable in sync as well
  useEffect(() => {
    document.documentElement.style.setProperty('--bg-gradient', resolvedBgGradient);
  }, [resolvedBgGradient]);

  // Compute active background styles with concrete values for smooth cross-fading
  const backgroundStyle = useMemo<CSSProperties>(() => {
    if (settings.bgType === 'color') {
      return {
        backgroundColor: settings.bgColor,
      };
    }

    if (settings.bgType === 'image' && customImageUrl) {
      return {
        backgroundImage: `url("${customImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    return {
      backgroundImage: resolvedBgGradient,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }, [settings.bgType, settings.bgColor, customImageUrl, resolvedBgGradient]);

  return (
    <div
      id="app-root"
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center font-inter select-none"
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          !target.closest('button') &&
          !target.closest('#settings-panel') &&
          !target.closest('#material-settings-backdrop')
        ) {
          toggleFullscreen();
        }
      }}
    >
      {/* Smoothly Cross-Fading Background Layer with optional blur & scale */}
      <SmoothBackground
        style={backgroundStyle}
        blur={settings.bgBlur}
      />

      {/* Dimming / Overlay Layer for maximum readability */}
      <div
        id="clock-overlay-layer"
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{
          backgroundColor: '#000000',
          opacity: settings.bgOverlayOpacity / 100,
        }}
      />

      {/* Animated Background Particles (e.g. Snow, Dust, Stars, Rain) */}
      <ParticleBackground
        effect={settings.particleEffect}
        intensity={settings.particleIntensity}
        color={settings.particleColor}
        speed={settings.particleSpeed}
      />

      {/* Quick Access Material 3 Top Controls */}
      <QuickControls
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGames={() => setIsGamesOpen(true)}
        onOpenStopwatch={() => setIsStopwatchOpen(true)}
        backdropBlur={settings.backdropBlurIntensity}
      />

      {/* Centerpiece: Clean, Gorgeous Digital Clock driven by Online Atomic Time */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-4">
        <DigitalClock
          settings={settings}
          offsetMs={atomicState.offsetMs}
          onUpdateWeatherUnit={(unit) => setSettings((prev) => ({ ...prev, weatherUnit: unit }))}
          onUpdateSettings={setSettings}
        />
      </main>

      {/* Stopwatch Modal with Lap Tracking & Pause/Resume */}
      <StopwatchModal
        isOpen={isStopwatchOpen}
        onClose={() => setIsStopwatchOpen(false)}
        settings={settings}
      />

      {/* Games Arcade Modal */}
      <GamesModal
        isOpen={isGamesOpen}
        onClose={() => setIsGamesOpen(false)}
        soundEnabled={settings.soundEnabled}
      />

      {/* Redesigned Material 3 Settings Drawer */}
      <MaterialSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenGames={() => setIsGamesOpen(true)}
        onOpenStopwatch={() => setIsStopwatchOpen(true)}
        settings={settings}
        onUpdateSettings={setSettings}
        onUploadImage={handleUploadImage}
        onRemoveImage={handleRemoveImage}
        atomicState={atomicState}
        onTriggerSync={performSync}
      />
    </div>
  );
}

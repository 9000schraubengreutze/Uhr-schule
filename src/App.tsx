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
import { AnalogSchoolClock } from './components/AnalogSchoolClock';
import { MaterialSettingsDrawer } from './components/MaterialSettingsDrawer';
import { QuizOverlay } from './components/QuizOverlay';
import { QuickControls } from './components/QuickControls';
import { syncWithAtomicClock, AtomicTimeState } from './utils/atomicTime';

export default function App() {
  const [settings, setSettings] = useState<ClockSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Atomic Clock Synchronization State
  const [atomicState, setAtomicState] = useState<AtomicTimeState>({
    status: 'idle',
    offsetMs: 0,
    latencyMs: 0,
    lastSyncTime: null,
    syncSource: 'Digitale Atomuhr (NTP)',
    errorMessage: null,
    isAtomicEnabled: settings.useAtomicSync,
  });

  const triggerSync = useCallback(async () => {
    if (!settings.useAtomicSync) return;
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
        isAtomicEnabled: true,
      });
    } catch (err) {
      console.warn('Atomic clock sync failed, using local time fallback:', err);
      setAtomicState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: (err as Error).message,
      }));
    }
  }, [settings.useAtomicSync]);

  // Initial sync & periodic sync every 10 minutes
  useEffect(() => {
    if (settings.useAtomicSync) {
      triggerSync();
      const interval = setInterval(triggerSync, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [settings.useAtomicSync, triggerSync]);

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

  // Keyboard shortcuts (Esc, F, S, Q)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isQuizOpen) setIsQuizOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.key === 'q' || e.key === 'Q') {
        setIsQuizOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isQuizOpen]);

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
      console.error('Image handling failed', err);
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

    const accentColor = settings.accentColor || activeTheme?.accentColor || '#3b82f6';
    root.style.setProperty('--accent-color', accentColor);

    const accentGlow = activeTheme?.accentGlow || `${accentColor}40`;
    root.style.setProperty('--accent-glow', accentGlow);

    const surfaceBorder = activeTheme?.surfaceBorder || 'rgba(255, 255, 255, 0.15)';
    root.style.setProperty('--surface-border', surfaceBorder);

    root.style.setProperty('--bg-color', settings.bgColor);

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
    root.style.setProperty('--bg-gradient', bgGradient);
  }, [
    settings.clockColor,
    settings.themeId,
    settings.accentColor,
    settings.bgColor,
    settings.gradientPresetId,
    settings.customGradient,
  ]);

  // Compute active background styles
  const backgroundStyle = useMemo<CSSProperties>(() => {
    if (settings.bgType === 'color') {
      return {
        backgroundColor: 'var(--bg-color, ' + settings.bgColor + ')',
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
      backgroundImage: 'var(--bg-gradient)',
    };
  }, [settings.bgType, settings.bgColor, customImageUrl]);

  return (
    <div
      id="app-root"
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center font-inter"
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          !target.closest('button') &&
          !target.closest('#settings-panel') &&
          !target.closest('#quiz-overlay-card') &&
          !target.closest('#school-clock-wrapper')
        ) {
          toggleFullscreen();
        }
      }}
    >
      {/* Background Layer with optional blur & scale */}
      <div
        id="clock-bg-layer"
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          ...backgroundStyle,
          filter: settings.bgBlur > 0 ? `blur(${settings.bgBlur}px)` : undefined,
          transform: settings.bgBlur > 0 ? 'scale(1.06)' : 'none',
        }}
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

      {/* Quick Access Material 3 Top Controls */}
      <QuickControls
        onOpenSettings={() => setIsSettingsOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        clockColor={settings.clockColor}
        onOpenQuiz={() => setIsQuizOpen(true)}
        colorScheme={settings.colorScheme}
        onToggleThemeMode={handleToggleThemeMode}
      />

      {/* Centerpiece: Interactive Material 3 Schuluhr */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-4">
        <AnalogSchoolClock
          settings={settings}
          onUpdateSettings={setSettings}
          offsetMs={settings.useAtomicSync ? atomicState.offsetMs : 0}
          onOpenQuiz={() => setIsQuizOpen(true)}
        />
      </main>

      {/* Interactive Quiz Mode Overlay */}
      <QuizOverlay
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        settings={settings}
        onSetClockTime={(h, m) => {
          setSettings((prev) => ({
            ...prev,
            isLiveMode: false,
            manualHour: h,
            manualMinute: m,
            manualSecond: 0,
          }));
        }}
      />

      {/* Redesigned Material 3 Settings Drawer */}
      <MaterialSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenQuiz={() => {
          setIsQuizOpen(true);
        }}
        onUploadImage={handleUploadImage}
        onRemoveImage={handleRemoveImage}
      />
    </div>
  );
}

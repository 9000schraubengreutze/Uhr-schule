import { useEffect, useState, useMemo, useCallback, useRef, type CSSProperties } from 'react';
import { ClockSettings, ColorScheme } from './types';
import {
  loadSettings,
  saveSettings,
  storeLocalImage,
  saveWallpaper,
  setActiveWallpaper,
  deleteSavedWallpaper,
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
import { MobileBatteryIndicator } from './components/MobileBatteryIndicator';
import { GamesModal } from './games/GamesModal';
import { StopwatchModal } from './components/StopwatchModal';
import { GeminiBackgroundModal } from './components/GeminiBackgroundModal';
import { GeminiChatModal } from './components/GeminiChatModal';
import { isTimeInZenSchedule } from './utils/zenSchedule';

export default function App() {
  const [settings, setSettings] = useState<ClockSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [isGeminiBgOpen, setIsGeminiBgOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isClockColorPickerOpen, setIsClockColorPickerOpen] = useState(false);

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
    const checkIsFullscreen = () => {
      const doc = document as any;
      return Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(checkIsFullscreen());
    };
    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Automated timer to toggle Zen mode based on user-defined schedule
  const lastZenScheduleStateRef = useRef<boolean | null>(null);
  const prevZenScheduleConfigRef = useRef<string>('');

  useEffect(() => {
    if (!settings.zenScheduleEnabled) {
      lastZenScheduleStateRef.current = null;
      return;
    }

    const currentConfigKey = `${settings.zenScheduleStartTime}-${settings.zenScheduleEndTime}`;
    if (prevZenScheduleConfigRef.current !== currentConfigKey) {
      // Configuration changed: reset state tracker to evaluate immediately
      prevZenScheduleConfigRef.current = currentConfigKey;
      lastZenScheduleStateRef.current = null;
    }

    const evaluateZenSchedule = () => {
      const now = new Date(settings.useAtomicSync ? Date.now() + atomicState.offsetMs : Date.now());
      const inSchedule = isTimeInZenSchedule(
        now,
        settings.zenScheduleStartTime || '22:00',
        settings.zenScheduleEndTime || '07:00'
      );

      // Trigger automatic toggle on initial enablement or when crossing schedule boundary
      if (lastZenScheduleStateRef.current === null) {
        lastZenScheduleStateRef.current = inSchedule;
        setIsZenMode(inSchedule);
      } else if (lastZenScheduleStateRef.current !== inSchedule) {
        lastZenScheduleStateRef.current = inSchedule;
        setIsZenMode(inSchedule);
      }
    };

    evaluateZenSchedule();
    const interval = setInterval(evaluateZenSchedule, 1000);
    return () => clearInterval(interval);
  }, [
    settings.zenScheduleEnabled,
    settings.zenScheduleStartTime,
    settings.zenScheduleEndTime,
    settings.useAtomicSync,
    atomicState.offsetMs,
  ]);

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
      if (isClockColorPickerOpen) {
        if (e.key === 'Escape') {
          setIsClockColorPickerOpen(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        if (isChatOpen) setIsChatOpen(false);
        else if (isGeminiBgOpen) setIsGeminiBgOpen(false);
        else if (isGamesOpen) setIsGamesOpen(false);
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
      } else if (e.key === 'b' || e.key === 'B') {
        setIsGeminiBgOpen((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsChatOpen((prev) => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZenMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGamesOpen, isSettingsOpen, isStopwatchOpen, isGeminiBgOpen, isChatOpen, isZenMode, isClockColorPickerOpen, toggleFullscreen]);

  const handleApplyOrUploadImage = async (
    file: File,
    promptOrName?: string,
    meta?: { id?: string; style?: string; mode?: 'create' | 'edit' | 'upload'; isAi?: boolean }
  ) => {
    try {
      const { objectUrl } = await saveWallpaper(file, {
        prompt: promptOrName || (meta?.isAi ? 'Gemini KI Wallpaper' : file.name || 'Eigenes Foto'),
        name: promptOrName ? promptOrName.slice(0, 42) : file.name || 'Eigenes Wallpaper',
        style: meta?.style || 'cinematic',
        mode: meta?.mode || (meta?.isAi ? 'create' : 'upload'),
        isAi: meta?.isAi !== false,
      });
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

  const handleSelectSavedWallpaper = async (id: string) => {
    try {
      const objectUrl = await setActiveWallpaper(id);
      if (objectUrl) {
        setCustomImageUrl(objectUrl);
        setSettings((prev) => ({
          ...prev,
          bgType: 'image',
          hasCustomImage: true,
        }));
      }
    } catch (err) {
      console.error('Failed to select wallpaper', err);
    }
  };

  const handleDeleteSavedWallpaper = async (id: string) => {
    try {
      await deleteSavedWallpaper(id);
      const remaining = await loadStoredImage();
      if (remaining) {
        setCustomImageUrl(remaining);
      } else {
        setCustomImageUrl(null);
        setSettings((prev) => ({
          ...prev,
          hasCustomImage: false,
          bgType: prev.bgType === 'image' ? 'gradient' : prev.bgType,
        }));
      }
    } catch (err) {
      console.error('Failed to delete wallpaper', err);
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
          !target.closest('#material-settings-backdrop') &&
          !target.closest('#clock-color-picker-backdrop')
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

      {/* Quick Access Material 3 Controls at Bottom */}
      <QuickControls
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGames={() => setIsGamesOpen(true)}
        onOpenStopwatch={() => setIsStopwatchOpen(true)}
        onOpenGeminiBg={() => setIsGeminiBgOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        backdropBlur={settings.backdropBlurIntensity}
        anyModalOpen={isSettingsOpen || isGamesOpen || isStopwatchOpen || isGeminiBgOpen || isChatOpen}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        disabled={isClockColorPickerOpen}
        zenScheduleEnabled={settings.zenScheduleEnabled}
        zenScheduleActive={isTimeInZenSchedule(
          new Date(settings.useAtomicSync ? Date.now() + atomicState.offsetMs : Date.now()),
          settings.zenScheduleStartTime || '22:00',
          settings.zenScheduleEndTime || '07:00'
        )}
        zenScheduleRange={`${settings.zenScheduleStartTime || '22:00'} – ${settings.zenScheduleEndTime || '07:00'}`}
      />

      {/* Subtle Mobile Battery Indicator (Appears when not in fullscreen mode) */}
      <MobileBatteryIndicator
        isFullscreen={isFullscreen}
        enabled={settings.showBatteryIndicator ?? true}
        backdropBlur={settings.backdropBlurIntensity}
        isZenMode={isZenMode}
      />

      {/* Centerpiece: Clean, Gorgeous Digital Clock driven by Online Atomic Time */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-4 pb-16 sm:pb-20">
        <DigitalClock
          settings={settings}
          offsetMs={atomicState.offsetMs}
          onUpdateSettings={setSettings}
          onColorPickerOpenChange={setIsClockColorPickerOpen}
          isZenMode={isZenMode}
          isSettingsOpen={isSettingsOpen}
        />
      </main>

      {/* Gemini AI Background & Image Studio Modal (Create & Edit using gemini-3.1-flash-image-preview) */}
      <GeminiBackgroundModal
        isOpen={isGeminiBgOpen}
        onClose={() => setIsGeminiBgOpen(false)}
        onApplyImage={handleApplyOrUploadImage}
        onSelectWallpaper={handleSelectSavedWallpaper}
        backdropBlur={settings.backdropBlurIntensity}
        accentColor={settings.accentColor}
        currentWallpaperUrl={customImageUrl}
      />

      {/* Gemini Multi-turn Chatbot Modal */}
      <GeminiChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        backdropBlur={settings.backdropBlurIntensity}
        accentColor={settings.accentColor}
      />

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
        onOpenGeminiBg={() => setIsGeminiBgOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        settings={settings}
        onUpdateSettings={setSettings}
        currentWallpaperUrl={customImageUrl}
        onSelectSavedWallpaper={handleSelectSavedWallpaper}
        onDeleteSavedWallpaper={handleDeleteSavedWallpaper}
        onUploadImage={(file) => handleApplyOrUploadImage(file, file.name, { isAi: false, mode: 'upload' })}
        onRemoveImage={handleRemoveImage}
        atomicState={atomicState}
        onTriggerSync={performSync}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
      />
    </div>
  );
}

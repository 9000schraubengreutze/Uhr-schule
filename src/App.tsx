import { useEffect, useState, useMemo, useCallback, type CSSProperties } from 'react';
import { ClockSettings } from './types';
import { loadSettings, saveSettings, storeLocalImage, loadStoredImage, removeStoredImage } from './utils/storage';
import { GRADIENT_PRESETS } from './utils/presets';
import { ClockDisplay } from './components/ClockDisplay';
import { SettingsDrawer } from './components/SettingsDrawer';
import { QuickControls } from './components/QuickControls';
import { syncWithAtomicClock, AtomicTimeState } from './utils/atomicTime';

export default function App() {
  const [settings, setSettings] = useState<ClockSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Re-sync when tab visibility is restored
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && settings.useAtomicSync) {
        triggerSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
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

  // Sync settings changes to localStorage
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

  // Keyboard shortcuts (Esc, F, S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

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

  // Compute active background styles
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

    // Default to gradient
    if (settings.gradientPresetId === 'custom') {
      const { color1, color2, angle } = settings.customGradient;
      return {
        backgroundImage: `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`,
      };
    }

    const matched = GRADIENT_PRESETS.find((p) => p.id === settings.gradientPresetId);
    return {
      backgroundImage: matched ? matched.css : GRADIENT_PRESETS[0].css,
    };
  }, [settings.bgType, settings.bgColor, settings.gradientPresetId, settings.customGradient, customImageUrl]);

  return (
    <div
      id="app-root"
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-inter"
      onDoubleClick={(e) => {
        // Toggle fullscreen on double click unless clicking on a button/modal
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('#settings-panel')) {
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

      {/* Quick Access Top Controls */}
      <QuickControls
        onOpenSettings={() => setIsSettingsOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        clockColor={settings.clockColor}
        isAtomicActive={atomicState.status === 'synced'}
        syncStatus={atomicState.status}
        offsetMs={atomicState.offsetMs}
        useAtomicSync={settings.useAtomicSync}
      />

      {/* Center Clock & Date Component with Atomic Time Precision */}
      <ClockDisplay
        settings={settings}
        offsetMs={settings.useAtomicSync ? atomicState.offsetMs : 0}
        isAtomicActive={atomicState.status === 'synced'}
        syncStatus={atomicState.status}
        onOpenSyncSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Glassmorphic Slide-over Panel */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onUploadImage={handleUploadImage}
        onRemoveImage={handleRemoveImage}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        atomicState={atomicState}
        onTriggerSync={triggerSync}
      />
    </div>
  );
}

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
import { DigitalClock } from './components/DigitalClock';
import { MaterialSettingsDrawer } from './components/MaterialSettingsDrawer';
import { QuickControls } from './components/QuickControls';

export default function App() {
  const [settings, setSettings] = useState<ClockSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Keyboard shortcuts (Esc, F, S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, toggleFullscreen]);

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
        colorScheme={settings.colorScheme}
        onToggleThemeMode={handleToggleThemeMode}
      />

      {/* Centerpiece: Clean, Gorgeous Digital Clock */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-4">
        <DigitalClock settings={settings} />
      </main>

      {/* Redesigned Material 3 Settings Drawer */}
      <MaterialSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onUploadImage={handleUploadImage}
        onRemoveImage={handleRemoveImage}
      />
    </div>
  );
}

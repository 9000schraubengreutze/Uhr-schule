import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Sliders,
  Sparkles,
  MousePointer,
  Layers,
  Plus,
  Gauge,
  Film,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { ClockSettings, LivelyTargetFps } from '../types';
import { DEFAULT_LIVELY_CONFIG } from '../utils/presets';
import { triggerHaptic } from '../utils/audio';

interface LivelyQuickBarProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onOpenCustomizer: () => void;
  onOpenAddWallpaper: () => void;
  showFeedback?: (msg: string) => void;
  isZenMode?: boolean;
  isAnyModalOpen?: boolean;
}

export const LivelyQuickBar: React.FC<LivelyQuickBarProps> = ({
  settings,
  onUpdateSettings,
  onOpenCustomizer,
  onOpenAddWallpaper,
  showFeedback,
  isZenMode = false,
  isAnyModalOpen = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isLiveActive =
    settings.bgType === 'animated' ||
    settings.bgType === 'video' ||
    settings.bgType === 'web' ||
    settings.liveWallpaperOverlayEnabled;
  const lively = settings.lively || DEFAULT_LIVELY_CONFIG;

  // Global hotkey 'P' to toggle Pause/Play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'p' || e.key === 'P') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lively.isPaused]);

  if (isZenMode || isAnyModalOpen || !isLiveActive) return null;

  const handleTogglePause = () => {
    triggerHaptic('selection');
    const nextPaused = !lively.isPaused;
    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        isPaused: nextPaused,
      },
    }));
    showFeedback?.(nextPaused ? 'Lively Wallpaper pausiert (0% CPU)' : 'Lively Wallpaper fortgesetzt');
  };

  const handleCycleFps = () => {
    triggerHaptic('selection');
    const fpsList: LivelyTargetFps[] = [15, 30, 60, 120];
    const currentIndex = fpsList.indexOf(lively.targetFps || 60);
    const nextFps = fpsList[(currentIndex + 1) % fpsList.length];

    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        targetFps: nextFps,
      },
    }));
    showFeedback?.(`Lively Framerate: ${nextFps} FPS`);
  };

  const handleToggleMouse = () => {
    triggerHaptic('selection');
    const nextVal = !lively.mouseInteraction;
    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        mouseInteraction: nextVal,
      },
    }));
    showFeedback?.(nextVal ? 'Maus-Interaktion aktiviert' : 'Maus-Interaktion deaktiviert');
  };

  const handleToggleParallax = () => {
    triggerHaptic('selection');
    const nextVal = !lively.enableParallax;
    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        enableParallax: nextVal,
      },
    }));
    showFeedback?.(nextVal ? '3D-Parallax aktiviert' : '3D-Parallax deaktiviert');
  };

  if (isCollapsed) {
    return (
      <div
        id="lively-quick-bar"
        className="fixed top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center p-1 rounded-2xl bg-slate-950/80 hover:bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-lg shadow-black/50 text-slate-200 select-none transition-all duration-200 animate-fade-in"
        style={{
          backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
          WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setIsCollapsed(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
          title="Lively Wallpaper-Schnellsteuerung ausklappen"
          aria-label="Lively Wallpaper-Schnellsteuerung ausklappen"
        >
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] font-semibold">
            {lively.isPaused ? 'Pausiert' : `${lively.targetFps || 60} FPS`}
          </span>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="lively-quick-bar"
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-xl shadow-xl shadow-black/60 text-slate-200 select-none animate-fade-in transition-all duration-200"
      style={{
        backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
        WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
      }}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={handleTogglePause}
        className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
          lively.isPaused
            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30'
            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30'
        }`}
        title={lively.isPaused ? 'Live-Hintergrund fortsetzen (Taste P)' : 'Live-Hintergrund pausieren (Taste P)'}
      >
        {lively.isPaused ? (
          <Play className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Pause className="w-3.5 h-3.5 fill-current" />
        )}
        <span className="text-[10px] hidden sm:inline">
          {lively.isPaused ? 'Pause' : 'Live'}
        </span>
      </button>

      {/* Target FPS Cycle */}
      <button
        type="button"
        onClick={handleCycleFps}
        className="px-2 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-[11px] font-mono font-semibold text-slate-300 border border-slate-800 cursor-pointer transition-colors flex items-center gap-1"
        title="Klicken zum Umschalten: 15 FPS (Akku) -> 30 FPS (Eco) -> 60 FPS -> 120 FPS"
      >
        <Gauge className="w-3 h-3 text-cyan-400" />
        <span>{lively.targetFps || 60} FPS</span>
      </button>

      {/* Mouse Interaction Toggle */}
      <button
        type="button"
        onClick={handleToggleMouse}
        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
          lively.mouseInteraction
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
        }`}
        title={lively.mouseInteraction ? 'Maus-Interaktion aktiv (Klicken zum Ausschalten)' : 'Maus-Interaktion aus (Klicken zum Einschalten)'}
      >
        <MousePointer className="w-3.5 h-3.5" />
      </button>

      {/* 3D Parallax Tilt Toggle */}
      <button
        type="button"
        onClick={handleToggleParallax}
        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
          lively.enableParallax
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
        }`}
        title={lively.enableParallax ? '3D-Parallax Neigung aktiv' : '3D-Parallax aus'}
      >
        <Layers className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Customize Dialog Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          onOpenCustomizer();
        }}
        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-colors"
        title="Lively Wallpaper anpassen (Shader, Farben, Geschwindigkeit, Maus-Radius)"
      >
        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden md:inline">Anpassen</span>
      </button>

      {/* Add Custom Wallpaper Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          onOpenAddWallpaper();
        }}
        className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all cursor-pointer shadow-sm shadow-cyan-600/30"
        title="Eigenes Video, Web-Stream oder WebGL-Seite als Wallpaper hinzufügen"
      >
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
      </button>

      {/* Collapse Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          setIsCollapsed(true);
        }}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer ml-0.5"
        title="Lively-Leiste einklappen"
        aria-label="Lively-Leiste einklappen"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

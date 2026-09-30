import React from 'react';
import {
  Film,
  Play,
  Pause,
  Gauge,
  MousePointer,
  Layers,
  Sliders,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ClockSettings, LivelyTargetFps } from '../types';
import { DEFAULT_LIVELY_CONFIG } from '../utils/presets';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';

interface LivelySettingsCardProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onOpenCustomizer?: () => void;
  onOpenAddWallpaper?: () => void;
  showFeedback?: (msg: string) => void;
}

export const LivelySettingsCard: React.FC<LivelySettingsCardProps> = ({
  settings,
  onUpdateSettings,
  onOpenCustomizer,
  onOpenAddWallpaper,
  showFeedback,
}) => {
  const lively = settings.lively || DEFAULT_LIVELY_CONFIG;

  const handleTogglePause = () => {
    triggerHaptic(settings.vibrationEnabled);
    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        isPaused: !prev.lively?.isPaused,
      },
    }));
    showFeedback?.(!lively.isPaused ? 'Live-Hintergrund pausiert (0% CPU)' : 'Live-Hintergrund fortgesetzt');
  };

  const handleSetFps = (fps: LivelyTargetFps) => {
    triggerHaptic(settings.vibrationEnabled);
    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        targetFps: fps,
      },
    }));
    showFeedback?.(`Ziel-Bildrate auf ${fps} FPS gesetzt`);
  };

  const handleToggleMouse = () => {
    triggerHaptic(settings.vibrationEnabled);
    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        mouseInteraction: !prev.lively?.mouseInteraction,
      },
    }));
    showFeedback?.(!lively.mouseInteraction ? 'Maus-Reaktivität aktiviert' : 'Maus-Reaktivität deaktiviert');
  };

  const handleToggleParallax = () => {
    triggerHaptic(settings.vibrationEnabled);
    onUpdateSettings((prev) => ({
      ...prev,
      lively: {
        ...(prev.lively || DEFAULT_LIVELY_CONFIG),
        enableParallax: !prev.lively?.enableParallax,
      },
    }));
    showFeedback?.(!lively.enableParallax ? '3D-Parallax Neigung aktiviert' : '3D-Parallax deaktiviert');
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">Live-Wallpaper & Effekte</h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                lively.isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                {lively.isPaused ? 'Pausiert (0% CPU)' : `${lively.targetFps || 60} FPS Aktiv`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live-Animationen, 3D-Parallax, Shader-Filter und Bildrate steuern
            </p>
          </div>
        </div>
      </div>

      {/* Main Action Buttons: Play/Pause, Anpassen, Add Wallpaper */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={handleTogglePause}
          className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
            lively.isPaused
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700'
          }`}
        >
          {lively.isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Fortsetzen</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 fill-current text-cyan-400" />
              <span>Pausieren (0% CPU)</span>
            </>
          )}
        </button>

        {/* Anpassen (Customizer Modal) */}
        {onOpenCustomizer && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(settings.vibrationEnabled);
              onOpenCustomizer();
            }}
            className="py-2.5 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Anpassen</span>
          </button>
        )}

        {/* Neues Live-Wallpaper hinzufügen (+) */}
        {onOpenAddWallpaper && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(settings.vibrationEnabled);
              onOpenAddWallpaper();
            }}
            className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer shadow-md shadow-cyan-600/25"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Neues Wallpaper</span>
          </button>
        )}
      </div>

      {/* Target FPS Selector */}
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ziel-Bildrate (FPS)</span>
          </span>
          <span className="font-mono text-cyan-300 font-bold">{lively.targetFps || 60} FPS</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {([15, 30, 60, 120] as LivelyTargetFps[]).map((fps) => {
            const isSelected = (lively.targetFps || 60) === fps;
            return (
              <button
                key={fps}
                type="button"
                onClick={() => handleSetFps(fps)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {fps} FPS
              </button>
            );
          })}
        </div>
      </div>

      {/* Mouse Reactivity & 3D Parallax Switches */}
      <div className="space-y-1 divide-y divide-slate-800/60 pt-1">
        <MaterialSwitch
          label="Maus- & Touch-Interaktivität"
          description="Live-Hintergrund reagiert interaktiv auf Mausbewegungen und Berührungen"
          checked={lively.mouseInteraction ?? true}
          onChange={handleToggleMouse}
        />

        <MaterialSwitch
          label="3D-Parallax Neigungseffekt"
          description="Erzeugt räumliche Tiefenwirkung bei Mausbewegungen über den Bildschirm"
          checked={lively.enableParallax ?? true}
          onChange={handleToggleParallax}
        />

        <MaterialSwitch
          label="Schwebende Schnellleiste auf Hauptbildschirm anzeigen"
          description="Blendet die kleine Schnellleiste oben rechts über der Uhr ein (standardmäßig deaktiviert)"
          checked={Boolean(settings.showLivelyQuickBar)}
          onChange={(v) => {
            onUpdateSettings((prev) => ({ ...prev, showLivelyQuickBar: v }));
            showFeedback?.(v ? 'Schnellleiste auf Hauptbildschirm aktiviert' : 'Schnellleiste ausgeblendet');
          }}
        />
      </div>
    </div>
  );
};

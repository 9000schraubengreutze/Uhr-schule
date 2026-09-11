import React from 'react';
import { Settings, Gamepad2, Timer } from 'lucide-react';

interface QuickControlsProps {
  onOpenSettings: () => void;
  onOpenGames?: () => void;
  onOpenStopwatch?: () => void;
  backdropBlur?: number;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  onOpenGames,
  onOpenStopwatch,
  backdropBlur,
}) => {
  const blurStyle = {
    backdropFilter: `blur(${backdropBlur ?? 16}px)`,
    WebkitBackdropFilter: `blur(${backdropBlur ?? 16}px)`,
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-end pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
        {/* Stopwatch Button */}
        {onOpenStopwatch && (
          <button
            id="open-stopwatch-btn"
            type="button"
            onClick={onOpenStopwatch}
            title="Stoppuhr öffnen (W)"
            aria-label="Stoppuhr öffnen"
            style={blurStyle}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Timer className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold">Stoppuhr</span>
          </button>
        )}

        {/* Games Button */}
        {onOpenGames && (
          <button
            id="open-games-btn"
            type="button"
            onClick={onOpenGames}
            title="Pausen-Spiele öffnen (G)"
            aria-label="Pausen-Spiele öffnen"
            style={blurStyle}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Games</span>
          </button>
        )}

        {/* Einstellungen Button */}
        <button
          id="open-settings-btn"
          type="button"
          onClick={onOpenSettings}
          title="Einstellungen öffnen (S)"
          aria-label="Einstellungen öffnen"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Einstellungen</span>
        </button>
      </div>
    </header>
  );
};



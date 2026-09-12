import React from 'react';
import { Settings, Gamepad2, Timer, Lock, GraduationCap, Coffee } from 'lucide-react';
import { SchoolStatusResult } from '../utils/timetable';

interface QuickControlsProps {
  onOpenSettings: () => void;
  onOpenGames?: () => void;
  onOpenStopwatch?: () => void;
  onOpenTimetable?: () => void;
  statusResult?: SchoolStatusResult;
  backdropBlur?: number;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  onOpenGames,
  onOpenStopwatch,
  onOpenTimetable,
  statusResult,
  backdropBlur,
}) => {
  const blurStyle = {
    backdropFilter: `blur(${backdropBlur ?? 16}px)`,
    WebkitBackdropFilter: `blur(${backdropBlur ?? 16}px)`,
  };

  const isGameAllowed = statusResult?.isGameAllowed ?? true;
  const isBreak = statusResult?.status === 'break';

  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-end pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
        {/* Stundenplan HO 2 Button */}
        {onOpenTimetable && (
          <button
            id="open-timetable-btn"
            type="button"
            onClick={onOpenTimetable}
            title="Stundenplan HO 2 (Frau Schmitz) öffnen"
            aria-label="Stundenplan öffnen"
            style={blurStyle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold hidden sm:inline">Stundenplan</span>
          </button>
        )}

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

        {/* Games Button with School Break Lock Status */}
        {onOpenGames && (
          <button
            id="open-games-btn"
            type="button"
            onClick={onOpenGames}
            title={
              isGameAllowed
                ? isBreak
                  ? `Pause aktiv (${statusResult?.currentBreak?.remainingMinutes} Min.) – Games frei!`
                  : 'Pausen-Spiele öffnen (G)'
                : `Unterrichtszeit: Games nur in den Pausen erlaubt! Nächste Pause: ${statusResult?.nextBreak?.start || '10:30'} Uhr`
            }
            aria-label="Pausen-Spiele öffnen"
            style={blurStyle}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all shadow-md active:scale-95 cursor-pointer ${
              !isGameAllowed
                ? 'bg-rose-950/60 hover:bg-rose-900/70 border-rose-800/70 text-rose-200'
                : isBreak
                ? 'bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-700/80 text-emerald-200 ring-1 ring-emerald-500/40'
                : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800/80 text-slate-200 hover:text-white'
            }`}
          >
            {!isGameAllowed ? (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-rose-200">
                  Games <span className="text-[11px] opacity-80">(Gesperrt)</span>
                </span>
              </>
            ) : isBreak ? (
              <>
                <Coffee className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300">
                  Pause <span className="text-[11px] opacity-80">({statusResult?.currentBreak?.remainingMinutes}m)</span>
                </span>
              </>
            ) : (
              <>
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold">Games</span>
              </>
            )}
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




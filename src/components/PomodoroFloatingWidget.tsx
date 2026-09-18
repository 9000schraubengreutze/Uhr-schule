import React from 'react';
import { Play, Pause, SkipForward, Flame, Coffee, Sun, BellOff, Volume2 } from 'lucide-react';
import { PomodoroController } from '../hooks/usePomodoro';
import { ClockSettings } from '../types';
import { triggerHaptic } from '../utils/audio';

interface PomodoroFloatingWidgetProps {
  pomodoro: PomodoroController;
  settings: ClockSettings;
  isZenMode: boolean;
  onOpenPomodoroSettings: () => void;
  className?: string;
}

export const PomodoroFloatingWidget: React.FC<PomodoroFloatingWidgetProps> = ({
  pomodoro,
  settings,
  isZenMode,
  onOpenPomodoroSettings,
  className = '',
}) => {
  const {
    phase,
    timeLeft,
    isRunning,
    completedSessions,
    currentCycle,
    toggle,
    skip,
  } = pomodoro;

  if (!settings.pomodoro.showWidgetOnClock) {
    return null;
  }

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const phaseConfig = {
    work: {
      label: 'Fokus',
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500',
      icon: Flame,
    },
    shortBreak: {
      label: 'Pause',
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
      icon: Coffee,
    },
    longBreak: {
      label: 'Erholung',
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-500',
      icon: Sun,
    },
  }[phase];

  const PhaseIcon = phaseConfig.icon;
  const isSilenced = isZenMode && (settings.pomodoro.silenceInZenMode ?? true);

  // In Zen mode, we keep the widget minimal, non-intrusive and semi-transparent
  return (
    <div
      id="pomodoro-floating-widget"
      className={`group transition-all duration-300 pointer-events-auto ${
        isZenMode
          ? 'opacity-40 hover:opacity-90 scale-95'
          : 'opacity-90 hover:opacity-100'
      } ${className}`}
    >
      <div
        className={`flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-lg transition-all ${
          isZenMode
            ? 'bg-slate-950/40 border-white/10 hover:border-white/20'
            : 'bg-slate-900/70 border-white/15 hover:border-white/30 hover:bg-slate-900/85'
        }`}
      >
        {/* Phase Pill / Icon & Click to open Settings */}
        <button
          type="button"
          onClick={() => {
            if (settings.vibrationEnabled) triggerHaptic(10);
            onOpenPomodoroSettings();
          }}
          title="Pomodoro-Einstellungen öffnen"
          className="flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
        >
          <span
            className={`w-2 h-2 rounded-full ${phaseConfig.dot} ${
              isRunning ? 'animate-pulse' : ''
            }`}
          />
          <PhaseIcon className={`w-3.5 h-3.5 ${phaseConfig.color}`} />
          <span className="text-xs font-bold tracking-tight text-slate-200 hidden sm:inline">
            {phaseConfig.label}
          </span>
        </button>

        {/* Big Digit Countdown */}
        <button
          type="button"
          onClick={() => {
            if (settings.vibrationEnabled) triggerHaptic(10);
            onOpenPomodoroSettings();
          }}
          className="font-mono text-sm sm:text-base font-extrabold tracking-tight text-white cursor-pointer hover:text-blue-300 transition-colors"
        >
          {formatMinutesSeconds(timeLeft)}
        </button>

        {/* Zen Silenced Status Badge */}
        {isSilenced ? (
          <span
            title="Zen-Modus aktiv: Signalton stummgeschaltet"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold"
          >
            <BellOff className="w-2.5 h-2.5 text-indigo-400" />
            <span className="hidden md:inline">Zen Stumm</span>
          </span>
        ) : (
          settings.pomodoro.soundAlert !== 'none' && (
            <span
              title="Signalton aktiv"
              className="text-slate-500 hover:text-slate-300 text-[10px] hidden md:inline-flex items-center"
            >
              <Volume2 className="w-3 h-3" />
            </span>
          )
        )}

        {/* Quick Cycle Indicator */}
        <div
          title={`Intervall ${currentCycle} von ${settings.pomodoro.longBreakInterval}`}
          className="hidden md:flex items-center gap-1 px-1 text-[10px] text-slate-400 font-mono"
        >
          <span>
            {currentCycle}/{settings.pomodoro.longBreakInterval}
          </span>
        </div>

        {/* Quick Play/Pause Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (settings.vibrationEnabled) triggerHaptic(15);
            toggle();
          }}
          title={isRunning ? 'Pausieren' : 'Starten'}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
          }`}
        >
          {isRunning ? (
            <Pause className="w-3 h-3 fill-current" />
          ) : (
            <Play className="w-3 h-3 fill-current ml-0.5" />
          )}
        </button>

        {/* Quick Skip Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (settings.vibrationEnabled) triggerHaptic(12);
            skip();
          }}
          title="Phase überspringen"
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <SkipForward className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

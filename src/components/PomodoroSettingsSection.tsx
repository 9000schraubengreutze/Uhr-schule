import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Flame,
  Coffee,
  Sun,
  Laptop,
} from 'lucide-react';
import { ClockSettings, PomodoroPhase, PomodoroSoundType } from '../types';
import { PomodoroController } from '../hooks/usePomodoro';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';
import { playPomodoroAlert, requestNotificationPermission } from '../utils/pomodoroAudio';

interface PomodoroSettingsSectionProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  pomodoro: PomodoroController;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  showFeedback: (msg: string) => void;
}

export const PomodoroSettingsSection: React.FC<PomodoroSettingsSectionProps> = ({
  settings,
  onUpdateSettings,
  pomodoro,
  isZenMode,
  onToggleZenMode,
  showFeedback,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
  });

  const {
    phase,
    timeLeft,
    totalDuration,
    isRunning,
    completedSessions,
    currentCycle,
    progressPercent,
    silencedAlert,
    dismissSilencedAlert,
    start,
    pause,
    reset,
    skip,
    switchPhase,
  } = pomodoro;

  const config = settings.pomodoro;

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    if (settings.vibrationEnabled) triggerHaptic(15);
    if (isRunning) {
      pause();
      showFeedback('Pomodoro pausiert');
    } else {
      start();
      showFeedback(
        phase === 'work' && config.autoZenModeDuringWork
          ? 'Pomodoro gestartet (Zen-Modus aktiviert)'
          : 'Pomodoro gestartet'
      );
    }
  };

  const handleReset = () => {
    if (settings.vibrationEnabled) triggerHaptic(10);
    reset();
    showFeedback('Timer zurückgesetzt');
  };

  const handleSkip = () => {
    if (settings.vibrationEnabled) triggerHaptic(15);
    skip();
    showFeedback('Phase übersprungen');
  };

  const handleSwitchPhase = (newPhase: PomodoroPhase) => {
    if (settings.vibrationEnabled) triggerHaptic(12);
    switchPhase(newPhase);
    showFeedback(
      newPhase === 'work'
        ? 'Auf Fokus-Arbeit gewechselt'
        : newPhase === 'shortBreak'
        ? 'Auf kurze Pause gewechselt'
        : 'Auf lange Pause gewechselt'
    );
  };

  const handleTestSound = () => {
    if (settings.vibrationEnabled) triggerHaptic(20);
    const { played, silencedByZen } = playPomodoroAlert(
      config.soundAlert,
      config.soundVolume,
      isZenMode,
      config.silenceInZenMode
    );
    if (silencedByZen) {
      showFeedback('🔕 Signalton stummgeschaltet, da Zen-Modus aktiv ist!');
    } else if (played) {
      showFeedback(`Test-Signal "${config.soundAlert}" abgespielt`);
    } else {
      showFeedback('Ton ist auf "Stumm" gestellt');
    }
  };

  const handleRequestNotifications = async () => {
    if (settings.vibrationEnabled) triggerHaptic(15);
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      showFeedback('Desktop-Benachrichtigungen aktiviert!');
    } else if (perm === 'denied') {
      showFeedback('Benachrichtigungen im Browser blockiert');
    }
  };

  const phaseColors = {
    work: {
      theme: 'from-rose-500 to-amber-500',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      progress: '#f43f5e',
      label: 'Fokus-Arbeitsphase',
      icon: Flame,
    },
    shortBreak: {
      theme: 'from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      progress: '#10b981',
      label: 'Kurze Pause',
      icon: Coffee,
    },
    longBreak: {
      theme: 'from-cyan-500 to-blue-500',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      progress: '#06b6d4',
      label: 'Lange Erholungspause',
      icon: Sun,
    },
  }[phase];

  const PhaseIcon = phaseColors.icon;

  return (
    <div id="pomodoro-settings-section" className="space-y-6">
      {/* Silenced Alert Notice Banner */}
      {silencedAlert && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <BellOff className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-medium">
              Der Signalton für den Phasenwechsel wurde wie gewünscht durch den aktiven Zen-Modus
              stummgeschaltet (Nicht stören).
            </span>
          </div>
          <button
            type="button"
            onClick={dismissSilencedAlert}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-200 cursor-pointer transition-colors shrink-0"
          >
            Ausblenden
          </button>
        </div>
      )}

      {/* Main Live Pomodoro Station Card */}
      <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl space-y-5">
        {/* Subtle Ambient Glow corresponding to Phase */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 bg-gradient-to-tr ${phaseColors.theme}`}
        />

        {/* Phase Badge & Session Indicators */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${phaseColors.badgeBg}`}
            >
              <PhaseIcon className="w-3.5 h-3.5" />
              <span>{phaseColors.label}</span>
            </span>

            {isRunning && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Läuft</span>
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-300 block">
              Zyklus {currentCycle} von {config.longBreakInterval}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {completedSessions} {completedSessions === 1 ? 'Intervall' : 'Intervalle'} abgeschlossen
            </span>
          </div>
        </div>

        {/* Big Countdown Timer Display */}
        <div className="relative z-10 flex flex-col items-center justify-center py-3">
          <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-white drop-shadow-md">
            {formatMinutesSeconds(timeLeft)}
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full max-w-xs mt-4 h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-300 shadow-sm"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: phaseColors.progress,
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
            <span>Dauer: {Math.round(totalDuration / 60)} Min</span>
            <span>•</span>
            <span>Fortschritt: {Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Primary Action Controls */}
        <div className="relative z-10 flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleReset}
            title="Auf Anfang dieser Phase zurücksetzen"
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 text-white shadow-lg active:scale-95 transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/40'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausieren</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Starten</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            title="Zur nächsten Phase springen"
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 active:scale-95 transition-all cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Phase Switcher Buttons */}
        <div className="relative z-10 pt-2 border-t border-slate-800/60 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSwitchPhase('work')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
              phase === 'work'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Fokus ({config.workDuration}m)
          </button>

          <button
            type="button"
            onClick={() => handleSwitchPhase('shortBreak')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
              phase === 'shortBreak'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Kurze Pause ({config.shortBreakDuration}m)
          </button>

          <button
            type="button"
            onClick={() => handleSwitchPhase('longBreak')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
              phase === 'longBreak'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Lange Pause ({config.longBreakDuration}m)
          </button>
        </div>
      </div>

      {/* ZEN-MODUS INTEGRATION & NOTIFICATION SILENCING CARD */}
      <div
        id="pomodoro-zen-integration-card"
        className="p-4 rounded-2xl bg-slate-900/70 border border-indigo-500/30 space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Zen-Modus Integration
              </span>
              <span className="text-[11px] text-slate-400 block">
                Ablenkungsfreier Fokus & Intelligente Stummschaltung
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleZenMode}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isZenMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Zen-Modus jetzt sofort umschalten (Taste: Z)"
          >
            {isZenMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zen aktiv</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Zen inaktiv</span>
              </>
            )}
          </button>
        </div>

        {/* Live Zen Mode Status Indicator Banner */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            isZenMode
              ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-200'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
          }`}
        >
          {isZenMode ? (
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <BellOff className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white block">
              {isZenMode
                ? 'Zen-Modus ist aktiv: Benachrichtigungen stumm'
                : 'Normalmodus: Töne & Benachrichtigungen bereit'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {isZenMode
                ? 'Signaltöne und Browser-Popups werden stummgeschaltet (Do Not Disturb).'
                : 'Aktivieren des Zen-Modus (Taste Z) schaltet störende Töne stumm.'}
            </span>
          </div>
        </div>

        {/* Integration Switches */}
        <div className="space-y-3 pt-1 border-t border-slate-800/70">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-200 font-medium block">
                Benachrichtigungen im Zen-Modus stummschalten
              </span>
              <span className="text-[10px] text-slate-500 block">
                Unterdrückt Signaltöne und Popups bei Phasenwechsel, solange der Zen-Modus aktiv ist
              </span>
            </div>
            <MaterialSwitch
              checked={config.silenceInZenMode ?? true}
              onChange={(checked) => {
                onUpdateSettings((prev) => ({
                  ...prev,
                  pomodoro: { ...prev.pomodoro, silenceInZenMode: checked },
                }));
                showFeedback(
                  checked
                    ? 'Benachrichtigungen werden im Zen-Modus stummgeschaltet'
                    : 'Signaltöne ertönen auch im Zen-Modus'
                );
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-200 font-medium block">
                Automatischer Zen-Modus bei Arbeitsphase
              </span>
              <span className="text-[10px] text-slate-500 block">
                Schaltet bei Start eines Fokus-Blocks automatisch in den ablenkungsfreien Zen-Modus
              </span>
            </div>
            <MaterialSwitch
              checked={config.autoZenModeDuringWork ?? true}
              onChange={(checked) => {
                onUpdateSettings((prev) => ({
                  ...prev,
                  pomodoro: { ...prev.pomodoro, autoZenModeDuringWork: checked },
                }));
                showFeedback(
                  checked
                    ? 'Automatischer Zen-Modus für Fokus aktiviert'
                    : 'Automatischer Zen-Modus deaktiviert'
                );
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-200 font-medium block">
                Zen-Modus bei Pausenbeginn aufheben
              </span>
              <span className="text-[10px] text-slate-500 block">
                Beendet den Zen-Modus automatisch, sobald die Pause startet, um entspannt durchzuatmen
              </span>
            </div>
            <MaterialSwitch
              checked={config.exitZenModeOnBreak ?? true}
              onChange={(checked) => {
                onUpdateSettings((prev) => ({
                  ...prev,
                  pomodoro: { ...prev.pomodoro, exitZenModeOnBreak: checked },
                }));
              }}
            />
          </div>
        </div>
      </div>

      {/* DURATION & INTERVAL CONFIGURATION */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Zeiten & Intervalle
          </span>
        </div>

        {/* Work Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Fokus-Arbeitszeit</span>
            <span className="font-bold text-rose-400">{config.workDuration} Minuten</span>
          </div>
          <input
            type="range"
            min={5}
            max={90}
            step={5}
            value={config.workDuration}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdateSettings((p) => ({
                ...p,
                pomodoro: { ...p.pomodoro, workDuration: val },
              }));
            }}
            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[15, 20, 25, 30, 45, 50, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() =>
                  onUpdateSettings((p) => ({
                    ...p,
                    pomodoro: { ...p.pomodoro, workDuration: mins },
                  }))
                }
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  config.workDuration === mins
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Short Break Duration */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Kurze Pause</span>
            <span className="font-bold text-emerald-400">{config.shortBreakDuration} Minuten</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={config.shortBreakDuration}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdateSettings((p) => ({
                ...p,
                pomodoro: { ...p.pomodoro, shortBreakDuration: val },
              }));
            }}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            {[3, 5, 10, 15].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() =>
                  onUpdateSettings((p) => ({
                    ...p,
                    pomodoro: { ...p.pomodoro, shortBreakDuration: mins },
                  }))
                }
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  config.shortBreakDuration === mins
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Long Break Duration */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Lange Pause</span>
            <span className="font-bold text-cyan-400">{config.longBreakDuration} Minuten</span>
          </div>
          <input
            type="range"
            min={5}
            max={45}
            step={5}
            value={config.longBreakDuration}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdateSettings((p) => ({
                ...p,
                pomodoro: { ...p.pomodoro, longBreakDuration: val },
              }));
            }}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() =>
                  onUpdateSettings((p) => ({
                    ...p,
                    pomodoro: { ...p.pomodoro, longBreakDuration: mins },
                  }))
                }
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  config.longBreakDuration === mins
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Long Break Interval */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Lange Pause nach wie vielen Zyklen?</span>
            <span className="font-bold text-slate-200">{config.longBreakInterval} Runden</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 4, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() =>
                  onUpdateSettings((p) => ({
                    ...p,
                    pomodoro: { ...p.pomodoro, longBreakInterval: num },
                  }))
                }
                className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  config.longBreakInterval === num
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {num} Runden
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AUTOMATION & SOUND ALERTS */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Automatisierung & Signalton
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-200 font-medium block">
                Pausen automatisch starten
              </span>
              <span className="text-[10px] text-slate-500 block">
                Startet die Pause ohne Klick, sobald die Fokuszeit abgelaufen ist
              </span>
            </div>
            <MaterialSwitch
              checked={config.autoStartBreaks ?? true}
              onChange={(checked) =>
                onUpdateSettings((p) => ({
                  ...p,
                  pomodoro: { ...p.pomodoro, autoStartBreaks: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-200 font-medium block">
                Fokus automatisch starten
              </span>
              <span className="text-[10px] text-slate-500 block">
                Startet den nächsten Arbeitsblock direkt nach Ende der Pause
              </span>
            </div>
            <MaterialSwitch
              checked={config.autoStartWork ?? false}
              onChange={(checked) =>
                onUpdateSettings((p) => ({
                  ...p,
                  pomodoro: { ...p.pomodoro, autoStartWork: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-200 font-medium block">
                Mini-Widget auf dem Hauptbildschirm
              </span>
              <span className="text-[10px] text-slate-500 block">
                Zeigt ein kompaktes Pomodoro-Statusband direkt an der Digitaluhr
              </span>
            </div>
            <MaterialSwitch
              checked={config.showWidgetOnClock ?? true}
              onChange={(checked) =>
                onUpdateSettings((p) => ({
                  ...p,
                  pomodoro: { ...p.pomodoro, showWidgetOnClock: checked },
                }))
              }
            />
          </div>
        </div>

        {/* Sound Selection */}
        <div className="pt-3 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Akustischer Signalton</span>
            <button
              type="button"
              onClick={handleTestSound}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Ton testen</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'chime' as PomodoroSoundType, label: 'Glockenspiel' },
              { id: 'bell' as PomodoroSoundType, label: 'Klangschale' },
              { id: 'gong' as PomodoroSoundType, label: 'Zen-Gong' },
              { id: 'digital' as PomodoroSoundType, label: 'Digital-Beep' },
              { id: 'none' as PomodoroSoundType, label: 'Stumm' },
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => {
                  onUpdateSettings((p) => ({
                    ...p,
                    pomodoro: { ...p.pomodoro, soundAlert: snd.id },
                  }));
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  config.soundAlert === snd.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          {config.soundAlert !== 'none' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Lautstärke</span>
                <span className="font-bold text-slate-200">
                  {Math.round((config.soundVolume ?? 0.75) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={config.soundVolume ?? 0.75}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings((p) => ({
                    ...p,
                    pomodoro: { ...p.pomodoro, soundVolume: val },
                  }));
                }}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Desktop Browser Notifications Permission */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 font-medium block">
                Desktop-Benachrichtigungen
              </span>
              <span className="text-[10px] text-slate-500 block">
                {notificationPermission === 'granted'
                  ? 'Aktiviert (wird im Zen-Modus stummgeschaltet)'
                  : notificationPermission === 'denied'
                  ? 'Im Browser blockiert'
                  : 'Benachrichtigung bei Tab-Wechsel'}
              </span>
            </div>
            {notificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestNotifications}
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Erlauben
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Aktiv</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

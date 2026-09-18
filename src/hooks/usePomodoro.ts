import { useState, useEffect, useRef, useCallback } from 'react';
import { ClockSettings, PomodoroPhase } from '../types';
import { playPomodoroAlert, sendPomodoroNotification } from '../utils/pomodoroAudio';

export interface UsePomodoroProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  isZenMode: boolean;
  onSetZenMode: (zen: boolean) => void;
  onShowFeedback?: (msg: string) => void;
}

export interface PomodoroController {
  phase: PomodoroPhase;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  completedSessions: number;
  currentCycle: number;
  progressPercent: number;
  silencedAlert: boolean;
  dismissSilencedAlert: () => void;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  switchPhase: (phase: PomodoroPhase) => void;
}

const POMODORO_STORAGE_KEY = 'webclock_pomodoro_runtime_v1';

export function usePomodoro({
  settings,
  isZenMode,
  onSetZenMode,
  onShowFeedback,
}: UsePomodoroProps): PomodoroController {
  const {
    workDuration = 25,
    shortBreakDuration = 5,
    longBreakDuration = 15,
    longBreakInterval = 4,
    autoStartBreaks = true,
    autoStartWork = false,
    autoZenModeDuringWork = true,
    exitZenModeOnBreak = true,
    silenceInZenMode = true,
    soundAlert = 'chime',
    soundVolume = 0.75,
  } = settings.pomodoro || {};

  // Retrieve initial runtime state or defaults
  const [phase, setPhase] = useState<PomodoroPhase>(() => {
    try {
      const saved = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phase && ['work', 'shortBreak', 'longBreak'].includes(parsed.phase)) {
          return parsed.phase;
        }
      }
    } catch {}
    return 'work';
  });

  const getDurationForPhase = useCallback(
    (p: PomodoroPhase) => {
      switch (p) {
        case 'work':
          return workDuration * 60;
        case 'shortBreak':
          return shortBreakDuration * 60;
        case 'longBreak':
          return longBreakDuration * 60;
      }
    },
    [workDuration, shortBreakDuration, longBreakDuration]
  );

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) {
          return parsed.timeLeft;
        }
      }
    } catch {}
    return workDuration * 60;
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.completedSessions === 'number') {
          return parsed.completedSessions;
        }
      }
    } catch {}
    return 0;
  });

  const [silencedAlert, setSilencedAlert] = useState<boolean>(false);

  // References for reliable interval timing across tab blurs
  const targetEndTimeRef = useRef<number | null>(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const isZenModeRef = useRef(isZenMode);
  isZenModeRef.current = isZenMode;
  const silenceInZenModeRef = useRef(silenceInZenMode);
  silenceInZenModeRef.current = silenceInZenMode;

  // Persist lightweight runtime state
  useEffect(() => {
    try {
      localStorage.setItem(
        POMODORO_STORAGE_KEY,
        JSON.stringify({
          phase,
          timeLeft,
          completedSessions,
        })
      );
    } catch {}
  }, [phase, timeLeft, completedSessions]);

  // If user adjusts durations in settings while paused, sync timeLeft
  const prevDurationsRef = useRef({ workDuration, shortBreakDuration, longBreakDuration });
  useEffect(() => {
    if (!isRunning) {
      const prev = prevDurationsRef.current;
      if (
        (phase === 'work' && prev.workDuration !== workDuration) ||
        (phase === 'shortBreak' && prev.shortBreakDuration !== shortBreakDuration) ||
        (phase === 'longBreak' && prev.longBreakDuration !== longBreakDuration)
      ) {
        setTimeLeft(getDurationForPhase(phase));
      }
    }
    prevDurationsRef.current = { workDuration, shortBreakDuration, longBreakDuration };
  }, [workDuration, shortBreakDuration, longBreakDuration, phase, isRunning, getDurationForPhase]);

  // Phase transition handler
  const handlePhaseComplete = useCallback(() => {
    const zenActive = isZenModeRef.current;
    const shouldSilence = silenceInZenModeRef.current;

    if (phase === 'work') {
      const nextCompleted = completedSessions + 1;
      setCompletedSessions(nextCompleted);

      const isLongBreak = nextCompleted % longBreakInterval === 0;
      const nextPhase: PomodoroPhase = isLongBreak ? 'longBreak' : 'shortBreak';
      const nextDuration = (isLongBreak ? longBreakDuration : shortBreakDuration) * 60;

      setPhase(nextPhase);
      setTimeLeft(nextDuration);

      // Zen mode integration: optionally exit Zen mode when break starts so user can relax
      if (exitZenModeOnBreak && zenActive) {
        onSetZenMode(false);
      }

      // Audio & notification check (silenced if in Zen mode)
      const { silencedByZen } = playPomodoroAlert(soundAlert, soundVolume, zenActive, shouldSilence);
      sendPomodoroNotification(
        'Fokus-Intervall beendet!',
        isLongBreak ? 'Großartig! Zeit für eine lange Erholungspause.' : 'Zeit für eine kurze Pause.',
        zenActive,
        shouldSilence
      );

      if (silencedByZen) {
        setSilencedAlert(true);
        onShowFeedback?.('🔕 Signalton stummgeschaltet (Zen-Modus aktiv)');
      } else {
        onShowFeedback?.(
          isLongBreak
            ? '🎉 4 Fokus-Intervalle geschafft! Zeit für eine lange Pause.'
            : '☕ Fokus-Intervall beendet! Zeit für eine kurze Pause.'
        );
      }

      setIsRunning(autoStartBreaks);
      if (autoStartBreaks) {
        targetEndTimeRef.current = Date.now() + nextDuration * 1000;
      } else {
        targetEndTimeRef.current = null;
      }
    } else {
      // Break completed -> Transition to Work
      const nextPhase: PomodoroPhase = 'work';
      const nextDuration = workDuration * 60;

      setPhase(nextPhase);
      setTimeLeft(nextDuration);

      // Zen mode integration: automatically engage Zen mode during work if enabled
      if (autoZenModeDuringWork && !zenActive) {
        onSetZenMode(true);
      }

      // Audio & notification check (silenced if in Zen mode)
      const { silencedByZen } = playPomodoroAlert(soundAlert, soundVolume, zenActive, shouldSilence);
      sendPomodoroNotification(
        'Pause beendet!',
        'Bereit für den nächsten Fokus-Block? Weiter so!',
        zenActive,
        shouldSilence
      );

      if (silencedByZen) {
        setSilencedAlert(true);
        onShowFeedback?.('🔕 Signalton stummgeschaltet (Zen-Modus aktiv)');
      } else {
        onShowFeedback?.('🎯 Pause beendet! Neuer Fokus-Block bereit.');
      }

      setIsRunning(autoStartWork);
      if (autoStartWork) {
        targetEndTimeRef.current = Date.now() + nextDuration * 1000;
      } else {
        targetEndTimeRef.current = null;
      }
    }
  }, [
    phase,
    completedSessions,
    longBreakInterval,
    longBreakDuration,
    shortBreakDuration,
    workDuration,
    exitZenModeOnBreak,
    autoZenModeDuringWork,
    autoStartBreaks,
    autoStartWork,
    soundAlert,
    soundVolume,
    onSetZenMode,
    onShowFeedback,
  ]);

  // Main tick loop
  useEffect(() => {
    if (!isRunning) {
      targetEndTimeRef.current = null;
      return;
    }

    if (!targetEndTimeRef.current) {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const diffMs = targetEndTimeRef.current - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(diffMs / 1000));

      setTimeLeft(nextSeconds);

      if (nextSeconds <= 0) {
        clearInterval(interval);
        handlePhaseComplete();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handlePhaseComplete]);

  // Controls
  const start = useCallback(() => {
    // If starting a work session and autoZenModeDuringWork is enabled, turn on Zen mode
    if (phase === 'work' && autoZenModeDuringWork && !isZenMode) {
      onSetZenMode(true);
    }
    targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  }, [phase, autoZenModeDuringWork, isZenMode, timeLeft, onSetZenMode]);

  const pause = useCallback(() => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setTimeLeft(getDurationForPhase(phase));
  }, [phase, getDurationForPhase]);

  const skip = useCallback(() => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    handlePhaseComplete();
  }, [handlePhaseComplete]);

  const switchPhase = useCallback(
    (newPhase: PomodoroPhase) => {
      setIsRunning(false);
      targetEndTimeRef.current = null;
      setPhase(newPhase);
      setTimeLeft(getDurationForPhase(newPhase));
    },
    [getDurationForPhase]
  );

  const dismissSilencedAlert = useCallback(() => {
    setSilencedAlert(false);
  }, []);

  const totalDuration = getDurationForPhase(phase);
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));
  const currentCycle = (completedSessions % longBreakInterval) + 1;

  return {
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
    toggle,
    reset,
    skip,
    switchPhase,
  };
}

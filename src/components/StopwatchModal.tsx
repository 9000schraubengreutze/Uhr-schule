import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Flag, X, Clock, Minimize2, Maximize2 } from 'lucide-react';
import { ClockSettings } from '../types';
import { triggerHaptic } from '../utils/audio';

interface StopwatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
}

interface LapRecord {
  lapNumber: number;
  lapTimeMs: number;
  totalTimeMs: number;
}

export const StopwatchModal: React.FC<StopwatchModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // High precision timer loop using requestAnimationFrame
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - elapsedMs;

      const update = () => {
        setElapsedMs(performance.now() - startTimeRef.current);
        animationFrameRef.current = requestAnimationFrame(update);
      };

      animationFrameRef.current = requestAnimationFrame(update);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning]);

  // Keyboard controls (Space: Start/Pause, L: Lap, R: Reset, Esc: Close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleStartPause();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleLap();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRunning, elapsedMs, laps]);

  // Format milliseconds into MM:SS.CC or HH:MM:SS.CC
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(minutes / 60);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return {
        main: `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds)}`,
        sub: `.${pad(hundredths)}`,
      };
    }
    return {
      main: `${pad(minutes)}:${pad(seconds)}`,
      sub: `.${pad(hundredths)}`,
    };
  };

  const handleToggleStartPause = () => {
    if (settings.vibrationEnabled) triggerHaptic(15);
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    if (settings.vibrationEnabled) triggerHaptic(20);
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning && elapsedMs === 0) return;
    if (settings.vibrationEnabled) triggerHaptic(10);

    const previousTotal = laps.length > 0 ? laps[0].totalTimeMs : 0;
    const currentLapTime = elapsedMs - previousTotal;

    const newLap: LapRecord = {
      lapNumber: laps.length + 1,
      lapTimeMs: currentLapTime,
      totalTimeMs: elapsedMs,
    };

    // Prepend to show latest lap at top
    setLaps((prev) => [newLap, ...prev]);
  };

  if (!isOpen) return null;

  const { main, sub } = formatTime(elapsedMs);

  // Calculate fastest and slowest laps for color coding
  let fastestLapIdx = -1;
  let slowestLapIdx = -1;
  if (laps.length >= 2) {
    let min = Infinity;
    let max = -Infinity;
    laps.forEach((l, idx) => {
      if (l.lapTimeMs < min) {
        min = l.lapTimeMs;
        fastestLapIdx = idx;
      }
      if (l.lapTimeMs > max) {
        max = l.lapTimeMs;
        slowestLapIdx = idx;
      }
    });
  }

  return (
    <AnimatePresence>
      <div
        id="stopwatch-modal-backdrop"
        className={`fixed z-50 transition-all ${
          isMinimized
            ? 'bottom-5 right-5 pointer-events-auto'
            : 'inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md p-4'
        }`}
        onClick={(e) => {
          if (!isMinimized && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          id="stopwatch-window"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className={`relative bg-slate-950/95 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col ${
            isMinimized
              ? 'w-72 p-3.5 border-blue-500/50 shadow-blue-500/10'
              : 'w-full max-w-md max-h-[90vh] p-6'
          }`}
          style={{
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 30px rgba(56,189,248,0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Stoppuhr
                </h3>
                {!isMinimized && (
                  <p className="text-[10px] text-slate-400">Präzise Rundenzeiten & Stoppfunktion</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                title={isMinimized ? 'Vergrößern' : 'Minimieren'}
                aria-label={isMinimized ? 'Vergrößern' : 'Minimieren'}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {isMinimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Schließen (Esc)"
                aria-label="Schließen"
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Time Display */}
          <div className="py-5 sm:py-7 flex flex-col items-center justify-center shrink-0">
            <div
              className={`font-mono-digital font-bold tabular-numbers tracking-tight flex items-baseline justify-center ${
                isMinimized ? 'text-3xl' : 'text-5xl sm:text-6xl'
              }`}
              style={{
                color: isRunning ? 'var(--accent-color, #38bdf8)' : '#f8fafc',
                textShadow: isRunning ? '0 0 25px rgba(56,189,248,0.35)' : 'none',
              }}
            >
              <span>{main}</span>
              <span className="text-2xl sm:text-3xl opacity-70 ml-0.5">{sub}</span>
            </div>
            {laps.length > 0 && !isMinimized && (
              <span className="mt-2 text-xs font-mono text-slate-400">
                Runde #{laps.length + 1}
              </span>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 py-2 shrink-0">
            {/* Reset Button */}
            <button
              id="stopwatch-reset-btn"
              type="button"
              onClick={handleReset}
              disabled={elapsedMs === 0 && !isRunning}
              title="Zurücksetzen (Taste R)"
              aria-label="Zurücksetzen"
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Start / Pause Button */}
            <button
              id="stopwatch-toggle-btn"
              type="button"
              onClick={handleToggleStartPause}
              title={isRunning ? 'Pause (Leertaste)' : 'Start (Leertaste)'}
              aria-label={isRunning ? 'Pause' : 'Start'}
              className={`flex-1 max-w-[150px] py-3 px-5 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-amber-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start</span>
                </>
              )}
            </button>

            {/* Lap Button */}
            <button
              id="stopwatch-lap-btn"
              type="button"
              onClick={handleLap}
              disabled={!isRunning}
              title="Rundenzeit stoppen (Taste L)"
              aria-label="Rundenzeit"
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-blue-400 hover:text-blue-300 border border-slate-800 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Laps List (Hidden when minimized) */}
          {!isMinimized && laps.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2 px-2">
                <span>Runde</span>
                <span>Rundenzeit</span>
                <span>Gesamtzeit</span>
              </div>
              <div className="overflow-y-auto space-y-1.5 max-h-48 pr-1 font-mono text-xs">
                {laps.map((lap, idx) => {
                  const isFastest = idx === fastestLapIdx;
                  const isSlowest = idx === slowestLapIdx;
                  const lapFormatted = formatTime(lap.lapTimeMs);
                  const totalFormatted = formatTime(lap.totalTimeMs);

                  let colorClass = 'text-slate-300';
                  let badge = null;
                  if (isFastest) {
                    colorClass = 'text-emerald-400 font-bold';
                    badge = (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 ml-1">
                        Schnellste
                      </span>
                    );
                  } else if (isSlowest) {
                    colorClass = 'text-rose-400';
                    badge = (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30 ml-1">
                        Langsamste
                      </span>
                    );
                  }

                  return (
                    <div
                      key={lap.lapNumber}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
                    >
                      <div className="flex items-center text-slate-400 font-medium">
                        <span>#{lap.lapNumber.toString().padStart(2, '0')}</span>
                        {badge}
                      </div>
                      <span className={colorClass}>
                        {lapFormatted.main}
                        <span className="opacity-70 text-[10px]">{lapFormatted.sub}</span>
                      </span>
                      <span className="text-slate-400">
                        {totalFormatted.main}
                        <span className="opacity-70 text-[10px]">{totalFormatted.sub}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          {!isMinimized && (
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
              <span>Leertaste: Start/Pause</span>
              <span>L: Runde</span>
              <span>R: Reset</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

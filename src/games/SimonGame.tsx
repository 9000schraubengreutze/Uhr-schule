import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Play,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { playSound, playTone } from './audio';
import { saveGameResult, getGameStats } from './storage';

interface SimonGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

type PadColor = 'green' | 'red' | 'yellow' | 'blue';

const PADS: {
  id: PadColor;
  label: string;
  keyHint: string;
  freq: number;
  bgOff: string;
  bgOn: string;
  glow: string;
  border: string;
}[] = [
  {
    id: 'green',
    label: 'Grün',
    keyHint: '1 / Q',
    freq: 329.63, // E4
    bgOff: 'bg-emerald-800/80',
    bgOn: 'bg-emerald-400',
    glow: 'shadow-emerald-500/80',
    border: 'border-emerald-600',
  },
  {
    id: 'red',
    label: 'Rot',
    keyHint: '2 / W',
    freq: 261.63, // C4
    bgOff: 'bg-rose-800/80',
    bgOn: 'bg-rose-400',
    glow: 'shadow-rose-500/80',
    border: 'border-rose-600',
  },
  {
    id: 'yellow',
    label: 'Gelb',
    keyHint: '3 / A',
    freq: 392.0, // G4
    bgOff: 'bg-amber-800/80',
    bgOn: 'bg-amber-300',
    glow: 'shadow-amber-400/80',
    border: 'border-amber-600',
  },
  {
    id: 'blue',
    label: 'Blau',
    keyHint: '4 / S',
    freq: 196.0, // G3
    bgOff: 'bg-sky-800/80',
    bgOn: 'bg-sky-400',
    glow: 'shadow-sky-500/80',
    border: 'border-sky-600',
  },
];

export const SimonGame: React.FC<SimonGameProps> = ({
  onBack,
  soundEnabled = true,
  onRestart,
}) => {
  const [sequence, setSequence] = useState<PadColor[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activePad, setActivePad] = useState<PadColor | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getGameStats('simon').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const [hasStarted, setHasStarted] = useState(false);
  const [repeatsAvailable, setRepeatsAvailable] = useState(1);

  const startTimeRef = useRef<number>(Date.now());
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Clear all pending timeouts on unmount or state change
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Flash a specific pad with sound
  const flashPad = useCallback(
    (color: PadColor, durationMs = 300) => {
      const pad = PADS.find((p) => p.id === color);
      if (pad) {
        playTone(pad.freq, durationMs / 1000, isMuted);
      }
      setActivePad(color);
      const timer = setTimeout(() => {
        setActivePad(null);
      }, durationMs);
      timeoutsRef.current.push(timer);
    },
    [isMuted]
  );

  // Playback the sequence to the player
  const playSequence = useCallback(
    (seq: PadColor[]) => {
      setIsPlayingSequence(true);
      setActivePad(null);
      setPlayerStep(0);

      // Speed increases as sequence grows
      const stepSpeed = Math.max(220, 500 - seq.length * 18);
      const flashDuration = Math.max(160, stepSpeed * 0.7);

      seq.forEach((color, idx) => {
        const timer = setTimeout(() => {
          flashPad(color, flashDuration);
          if (idx === seq.length - 1) {
            const endTimer = setTimeout(() => {
              setIsPlayingSequence(false);
            }, flashDuration + 100);
            timeoutsRef.current.push(endTimer);
          }
        }, (idx + 1) * stepSpeed);
        timeoutsRef.current.push(timer);
      });
    },
    [flashPad]
  );

  // Start new game
  const startGame = useCallback(() => {
    clearAllTimeouts();
    const firstColor = PADS[Math.floor(Math.random() * PADS.length)].id;
    const initialSeq: PadColor[] = [firstColor];
    setSequence(initialSeq);
    setScore(0);
    setIsGameOver(false);
    setHasStarted(true);
    setRepeatsAvailable(1);
    startTimeRef.current = Date.now();
    onRestart?.();

    // Small delay before starting playback
    const timer = setTimeout(() => {
      playSequence(initialSeq);
    }, 400);
    timeoutsRef.current.push(timer);
  }, [playSequence, onRestart]);

  // Replay current sequence
  const replayCurrentSequence = () => {
    if (isPlayingSequence || isGameOver || !hasStarted || repeatsAvailable <= 0) return;
    setRepeatsAvailable((r) => r - 1);
    clearAllTimeouts();
    playSequence(sequence);
  };

  // Handle Player pad tap
  const handlePadClick = (color: PadColor) => {
    if (isPlayingSequence || isGameOver || !hasStarted) return;

    flashPad(color, 250);

    // Check if player clicked correct color
    if (color === sequence[playerStep]) {
      const nextStep = playerStep + 1;
      if (nextStep === sequence.length) {
        // Round completed successfully!
        const nextScore = score + 1;
        setScore(nextScore);
        setIsPlayingSequence(true);

        // Sound fanfare for level up
        const winTimer = setTimeout(() => {
          playSound('score', isMuted);
        }, 200);
        timeoutsRef.current.push(winTimer);

        // Append next color
        const nextColor = PADS[Math.floor(Math.random() * PADS.length)].id;
        const nextSeq = [...sequence, nextColor];
        setSequence(nextSeq);
        setRepeatsAvailable(1);

        const nextRoundTimer = setTimeout(() => {
          playSequence(nextSeq);
        }, 900);
        timeoutsRef.current.push(nextRoundTimer);
      } else {
        setPlayerStep(nextStep);
      }
    } else {
      // Wrong pad clicked -> Game Over
      setIsGameOver(true);
      playSound('gameover', isMuted);
      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      const res = saveGameResult('simon', score, timeSpent);
      if (res.isNewHighscore) setHighScore(res.stats.highScore);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!hasStarted || isGameOver) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          startGame();
        }
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        startGame();
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        replayCurrentSequence();
        return;
      }

      if (isPlayingSequence) return;

      if (e.code === 'Digit1' || e.key === 'q' || e.key === 'Q' || e.key === 'ArrowUp') {
        handlePadClick('green');
      } else if (e.code === 'Digit2' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowRight') {
        handlePadClick('red');
      } else if (e.code === 'Digit3' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        handlePadClick('yellow');
      } else if (e.code === 'Digit4' || e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        handlePadClick('blue');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isGameOver, isPlayingSequence, playerStep, sequence, startGame, replayCurrentSequence]);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-between text-slate-100 select-none">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl shrink-0 gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zurück zum Menü"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
            Farben-Gedächtnis
          </span>
        </div>

        {/* Score Tally */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase">Level</span>
            <span className="font-bold text-emerald-400">{score}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{highScore}</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {hasStarted && !isGameOver && (
            <button
              type="button"
              onClick={replayCurrentSequence}
              disabled={isPlayingSequence || repeatsAvailable <= 0}
              className={`p-1.5 rounded-xl transition-colors ${
                repeatsAvailable > 0 && !isPlayingSequence
                  ? 'hover:bg-slate-800 text-amber-400 cursor-pointer'
                  : 'text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="Muster wiederholen (1x pro Runde)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Ton an' : 'Stumm'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={startGame}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Neustart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Console Board */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md min-h-0 relative">
        <div className="relative w-[min(300px,44vh)] h-[min(300px,44vh)] bg-slate-950/90 border-4 border-slate-800 rounded-full p-4 shadow-2xl flex items-center justify-center">
          {/* 4 Quadrants Grid */}
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-3">
            {PADS.map((pad, idx) => {
              const isActive = activePad === pad.id;
              // Corner rounding matching quadrant
              const roundedClass =
                idx === 0
                  ? 'rounded-tl-full'
                  : idx === 1
                  ? 'rounded-tr-full'
                  : idx === 2
                  ? 'rounded-bl-full'
                  : 'rounded-br-full';

              return (
                <button
                  key={pad.id}
                  type="button"
                  onClick={() => handlePadClick(pad.id)}
                  disabled={isPlayingSequence || !hasStarted || isGameOver}
                  className={`relative ${roundedClass} border-2 ${pad.border} transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center overflow-hidden ${
                    isActive
                      ? `${pad.bgOn} shadow-2xl ${pad.glow} scale-98 brightness-125`
                      : `${pad.bgOff} hover:brightness-115`
                  }`}
                >
                  <span className="text-[11px] font-mono font-bold text-white/50 tracking-wider">
                    {pad.keyHint}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Central Hub Disc */}
          <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900 border-4 border-slate-800 shadow-xl flex flex-col items-center justify-center p-2 text-center pointer-events-none">
            {!hasStarted ? (
              <button
                type="button"
                onClick={startGame}
                className="pointer-events-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start</span>
              </button>
            ) : isGameOver ? (
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-rose-400 font-bold uppercase">Game Over</span>
                <span className="text-xs text-slate-300 font-mono">Score: {score}</span>
                <button
                  type="button"
                  onClick={startGame}
                  className="pointer-events-auto mt-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Nochmal
                </button>
              </div>
            ) : isPlayingSequence ? (
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-amber-400 font-bold animate-pulse">Merk dir...</span>
                <span className="text-lg font-black text-white font-mono mt-0.5">{sequence.length}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Du bist dran!
                </span>
                <span className="text-xs text-slate-300 font-mono mt-0.5">
                  {playerStep}/{sequence.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Start Overlay if not started */}
        {!hasStarted && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="text-lg font-black text-amber-300 mb-1">Farben-Gedächtnis</div>
            <p className="text-xs text-slate-300 max-w-xs mb-3">
              Merke dir die Ton- und Farbreihenfolge und wiederhole sie fehlerfrei.
            </p>
            <button
              type="button"
              onClick={startGame}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Runde beginnen</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer controls hint */}
      <div className="text-[11px] text-slate-400 text-center mt-2 shrink-0 sm:hidden">
        Tippe die Farben an oder drücke 1, 2, 3, 4 (oder Q, W, A, S).
      </div>

      {/* Laptop Keyboard Controls Helper */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60 w-full max-w-md shrink-0">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 font-mono text-[10px] text-emerald-300">1 / Q</kbd> Grün
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-700 font-mono text-[10px] text-rose-300">2 / W</kbd> Rot
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700 font-mono text-[10px] text-amber-300">3 / A</kbd> Gelb
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-700 font-mono text-[10px] text-sky-300">4 / S</kbd> Blau
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">Leertaste / R</kbd> Start
        </span>
      </div>
    </div>
  );
};

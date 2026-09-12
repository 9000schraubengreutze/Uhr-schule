import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Hash,
  Flame,
  Zap,
  Skull,
  AlertTriangle,
  Award,
} from 'lucide-react';

export type MemoryDifficulty = 'normal' | 'hard' | 'expert' | 'chaos';

interface CardItem {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// 18 distinct emoji icons for expansive memory grids
const ALL_ICONS = [
  '🚀', '💡', '🎨', '🎵', '📚', '⚡', '🌟', '⏱️',
  '🔥', '💎', '🎯', '🔮', '🛡️', '🛸', '🧩', '🧪',
  '👑', '🪐',
];

interface DifficultyConfig {
  id: MemoryDifficulty;
  name: string;
  pairs: number;
  cols: number;
  flipBackMs: number;
  timeLimitSec?: number;
  shuffleOnMismatch?: boolean;
  desc: string;
  badgeColor: string;
}

const DIFFICULTY_CONFIGS: Record<MemoryDifficulty, DifficultyConfig> = {
  normal: {
    id: 'normal',
    name: 'Normal (4×4)',
    pairs: 8,
    cols: 4,
    flipBackMs: 850,
    desc: '8 Paare, klassisches Tempo ohne Zeitlimit.',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  },
  hard: {
    id: 'hard',
    name: 'Schwer (5×4)',
    pairs: 10,
    cols: 5,
    flipBackMs: 650,
    timeLimitSec: 75,
    desc: '10 Paare, schnelleres Zudecken & 75s Zeitdruck!',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  },
  expert: {
    id: 'expert',
    name: 'Experte (6×4)',
    pairs: 12,
    cols: 6,
    flipBackMs: 450,
    timeLimitSec: 60,
    desc: '12 Paare (24 Karten), blitzschnelles Zudecken & 60s Limit!',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
  },
  chaos: {
    id: 'chaos',
    name: 'Chaos (6×6)',
    pairs: 18,
    cols: 6,
    flipBackMs: 400,
    timeLimitSec: 90,
    shuffleOnMismatch: true,
    desc: '18 Paare (36 Karten), 90s Countdown & verdeckte Karten mischen sich bei Fehlern um!',
    badgeColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
  },
};

interface MemoryGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, soundEnabled = true, onRestart }) => {
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('hard');

  const generateDeck = useCallback((diff: MemoryDifficulty): CardItem[] => {
    const config = DIFFICULTY_CONFIGS[diff];
    const selectedIcons = ALL_ICONS.slice(0, config.pairs);
    const pairs = [...selectedIcons, ...selectedIcons];

    // Fisher-Yates Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    return pairs.map((symbol, id) => ({
      id,
      symbol,
      isFlipped: false,
      isMatched: false,
    }));
  }, []);

  const [cards, setCards] = useState<CardItem[]>(() => generateDeck('hard'));
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(DIFFICULTY_CONFIGS.hard.timeLimitSec || null);
  const [isStarted, setIsStarted] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [highScore, setHighScore] = useState(() => getGameStats('memory').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const lockRef = useRef(false);
  const timerIntervalRef = useRef<number | null>(null);

  const curConfig = DIFFICULTY_CONFIGS[difficulty];

  // Timer & Countdown Interval
  useEffect(() => {
    if (isStarted && !hasWon && !hasLost) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimer((t) => t + 1);
        if (curConfig.timeLimitSec) {
          setTimeLeft((prev) => {
            if (prev === null) return curConfig.timeLimitSec!;
            if (prev <= 1) {
              setHasLost(true);
              playSound('gameover', isMuted);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isStarted, hasWon, hasLost, curConfig.timeLimitSec, isMuted]);

  // Handle card click
  const handleCardClick = (index: number) => {
    if (lockRef.current || hasWon || hasLost) return;
    if (cards[index].isMatched || cards[index].isFlipped) return;

    if (!isStarted) setIsStarted(true);

    playSound('click', isMuted);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;

      const [firstIdx, secondIdx] = newFlipped;
      if (newCards[firstIdx].symbol === newCards[secondIdx].symbol) {
        // Match found!
        setTimeout(() => {
          playSound('score', isMuted);
          setCards((prev) => {
            const matched = [...prev];
            matched[firstIdx].isMatched = true;
            matched[secondIdx].isMatched = true;
            return matched;
          });
          setPairsFound((p) => {
            const next = p + 1;
            if (next === curConfig.pairs) {
              // Game Won!
              setHasWon(true);
              playSound('win', isMuted);
              // Difficulty multiplier for score
              const mult = difficulty === 'chaos' ? 2.5 : difficulty === 'expert' ? 2.0 : difficulty === 'hard' ? 1.5 : 1.0;
              const bonus = Math.max(100, Math.round((1200 - moves * 20 - timer * 6) * mult));
              if (bonus > highScore) setHighScore(bonus);
              saveGameResult('memory', bonus, timer);
            }
            return next;
          });
          setFlippedIndices([]);
          lockRef.current = false;
        }, 320);
      } else {
        // No match: flip back after difficulty specific delay
        setTimeout(() => {
          setCards((prev) => {
            let updated = prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            );

            // Chaos Mode Mechanic: Mismatch shuffles remaining unrevealed cards!
            if (curConfig.shuffleOnMismatch) {
              const unmatchedIndices: number[] = [];
              updated.forEach((c, idx) => {
                if (!c.isMatched && !c.isFlipped) {
                  unmatchedIndices.push(idx);
                }
              });

              if (unmatchedIndices.length > 2) {
                // Shuffle their symbols
                const symbols = unmatchedIndices.map((i) => updated[i].symbol);
                for (let s = symbols.length - 1; s > 0; s--) {
                  const r = Math.floor(Math.random() * (s + 1));
                  [symbols[s], symbols[r]] = [symbols[r], symbols[s]];
                }
                unmatchedIndices.forEach((targetIdx, i) => {
                  updated[targetIdx] = { ...updated[targetIdx], symbol: symbols[i] };
                });
              }
            }

            return updated;
          });
          setFlippedIndices([]);
          lockRef.current = false;
        }, curConfig.flipBackMs);
      }
    }
  };

  const resetGame = useCallback(
    (newDiff?: MemoryDifficulty) => {
      const activeDiff = newDiff || difficulty;
      const conf = DIFFICULTY_CONFIGS[activeDiff];
      setCards(generateDeck(activeDiff));
      setFlippedIndices([]);
      setMoves(0);
      setPairsFound(0);
      setTimer(0);
      setTimeLeft(conf.timeLimitSec || null);
      setIsStarted(false);
      setHasWon(false);
      setHasLost(false);
      setSelectedIdx(0);
      lockRef.current = false;
      onRestart?.();
    },
    [difficulty, generateDeck, onRestart]
  );

  const handleSelectDifficulty = (newDiff: MemoryDifficulty) => {
    setDifficulty(newDiff);
    resetGame(newDiff);
  };

  // Keyboard controls for laptop/desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (hasWon || hasLost) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          resetGame();
        }
        return;
      }

      const cols = curConfig.cols;
      const total = curConfig.pairs * 2;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setSelectedIdx((prev) => (prev - cols >= 0 ? prev - cols : prev));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setSelectedIdx((prev) => (prev + cols < total ? prev + cols : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setSelectedIdx((prev) => (prev % cols > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setSelectedIdx((prev) => (prev % cols < cols - 1 && prev + 1 < total ? prev + 1 : prev));
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleCardClick(selectedIdx);
      } else if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasWon, hasLost, resetGame, selectedIdx, curConfig, handleCardClick]);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-xl mx-auto h-full p-2 select-none overflow-y-auto">
      {/* Top Navigation & Status Matrix */}
      <div className="w-full flex flex-wrap items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-slate-800 px-3.5 py-2 rounded-2xl mb-2 shadow-xl gap-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
        >
          ← Menü
        </button>

        {/* Live Counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            <span>{moves} Züge</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {pairsFound}/{curConfig.pairs}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {curConfig.timeLimitSec ? (
              <span className={`font-bold ${timeLeft! <= 15 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                {timeLeft}s Rest
              </span>
            ) : (
              <span>{timer}s</span>
            )}
          </div>
        </div>

        {/* Audio & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border border-slate-700"
            title={isMuted ? 'Ton an' : 'Ton aus'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={() => resetGame()}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border border-slate-700"
            title="Neu starten"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Difficulty Switcher Bar (Normal, Schwer, Experte, Chaos) */}
      <div className="w-full flex flex-wrap items-center justify-between gap-1.5 px-1 mb-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {(['normal', 'hard', 'expert', 'chaos'] as MemoryDifficulty[]).map((dKey) => {
            const conf = DIFFICULTY_CONFIGS[dKey];
            const isSelected = difficulty === dKey;
            return (
              <button
                key={dKey}
                type="button"
                onClick={() => handleSelectDifficulty(dKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {dKey === 'chaos' && <Skull className="w-3 h-3 text-purple-400" />}
                {dKey === 'expert' && <Flame className="w-3 h-3 text-rose-400" />}
                {dKey === 'hard' && <Zap className="w-3 h-3 text-amber-400" />}
                <span>{conf.name}</span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800/80">
          {curConfig.desc}
        </div>
      </div>

      {/* Main Memory Cards Grid Arena */}
      <div className="relative bg-slate-900/90 border-2 border-slate-800 p-2.5 sm:p-3.5 rounded-3xl shadow-2xl w-full max-w-[min(480px,56vh)] aspect-square flex items-center justify-center">
        <div
          className={`grid gap-1.5 sm:gap-2 w-full h-full ${
            curConfig.cols === 6
              ? 'grid-cols-6'
              : curConfig.cols === 5
              ? 'grid-cols-5'
              : 'grid-cols-4'
          }`}
        >
          {cards.map((card, idx) => {
            const isOpen = card.isFlipped || card.isMatched;
            const isCursor = selectedIdx === idx;
            const isDense = curConfig.cols >= 5;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedIdx(idx);
                  handleCardClick(idx);
                }}
                onMouseEnter={() => setSelectedIdx(idx)}
                disabled={isOpen}
                className={`relative flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 transform perspective-1000 active:scale-95 cursor-pointer ${
                  isDense
                    ? 'text-lg sm:text-2xl'
                    : 'text-2xl sm:text-3xl'
                } ${
                  isCursor ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 z-10' : ''
                } ${
                  card.isMatched
                    ? 'bg-emerald-500/20 border-2 border-emerald-500/60 scale-95 opacity-85'
                    : isOpen
                    ? 'bg-blue-600/30 border-2 border-blue-500 shadow-md'
                    : 'bg-slate-800/95 hover:bg-slate-700 border border-slate-700 shadow-sm'
                }`}
              >
                {isOpen ? (
                  <span>{card.symbol}</span>
                ) : (
                  <div
                    className={`rounded-full bg-slate-700/60 ${
                      isDense ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Victory Overlay */}
        {hasWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-5 text-center z-20 animate-in fade-in">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-2 border border-emerald-500/30">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1">STARK GELÖST! 🎉</h2>
            <p className="text-xs text-slate-300 mb-4 max-w-xs">
              Schwierigkeit <strong className="text-white">[{curConfig.name}]</strong> in{' '}
              <span className="font-mono text-cyan-400 font-bold">{moves} Zügen</span> und{' '}
              <span className="font-mono text-amber-400 font-bold">{timer} Sekunden</span> gemeistert!
            </p>
            <button
              type="button"
              onClick={() => resetGame()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Nochmal spielen
            </button>
          </div>
        )}

        {/* Defeat / Timeout Overlay */}
        {hasLost && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-5 text-center z-20 animate-in fade-in">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 mb-2 border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-rose-500 mb-1">ZEIT ABGELAUFEN! ⏳</h2>
            <p className="text-xs text-slate-300 mb-4 max-w-xs">
              Der Countdown für <strong className="text-white">[{curConfig.name}]</strong> ist abgelaufen.
              Gefundene Paare: <span className="font-bold text-amber-400">{pairsFound}/{curConfig.pairs}</span>
            </p>
            <button
              type="button"
              onClick={() => resetGame()}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Erneut versuchen
            </button>
          </div>
        )}
      </div>

      {/* Keyboard Controls Guide */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60 w-full shrink-0">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
            WASD / Pfeile
          </kbd>{' '}
          Navigieren
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
            Leertaste / Enter
          </kbd>{' '}
          Aufdecken
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
            R
          </kbd>{' '}
          Neustart
        </span>
      </div>

      <div className="sm:hidden w-full max-w-xs mt-2 text-center text-[11px] text-slate-400">
        Finde alle Paare, bevor die Zeit abläuft!
      </div>
    </div>
  );
};

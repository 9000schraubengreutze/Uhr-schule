import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import { RotateCcw, Volume2, VolumeX, Sparkles, Clock, Hash } from 'lucide-react';

interface CardItem {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = ['🚀', '💡', '🎨', '🎵', '📚', '⚡', '🌟', '⏱️'];

interface MemoryGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, soundEnabled = true, onRestart }) => {
  const generateDeck = (): CardItem[] => {
    const pairs = [...ICONS, ...ICONS];
    // Shuffle
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
  };

  const [cards, setCards] = useState<CardItem[]>(generateDeck);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [highScore, setHighScore] = useState(() => getGameStats('memory').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const lockRef = useRef(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Timer interval
  useEffect(() => {
    if (isStarted && !hasWon) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isStarted, hasWon]);

  // Handle card click
  const handleCardClick = (index: number) => {
    if (lockRef.current) return;
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
            if (next === ICONS.length) {
              // Game Won!
              setHasWon(true);
              playSound('win', isMuted);
              const score = Math.max(100, 1000 - moves * 25 - timer * 8);
              if (score > highScore) setHighScore(score);
              saveGameResult('memory', score, timer);
            }
            return next;
          });
          setFlippedIndices([]);
          lockRef.current = false;
        }, 400);
      } else {
        // No match: flip back
        setTimeout(() => {
          setCards((prev) => {
            const reverted = [...prev];
            reverted[firstIdx].isFlipped = false;
            reverted[secondIdx].isFlipped = false;
            return reverted;
          });
          setFlippedIndices([]);
          lockRef.current = false;
        }, 900);
      }
    }
  };

  const resetGame = useCallback(() => {
    setCards(generateDeck());
    setFlippedIndices([]);
    setMoves(0);
    setPairsFound(0);
    setTimer(0);
    setIsStarted(false);
    setHasWon(false);
    lockRef.current = false;
    onRestart?.();
  }, [onRestart]);

  // Keyboard controls for laptop/desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (hasWon) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          resetGame();
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setSelectedIdx((prev) => (prev - 4 >= 0 ? prev - 4 : prev));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setSelectedIdx((prev) => (prev + 4 < 16 ? prev + 4 : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setSelectedIdx((prev) => (prev % 4 > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setSelectedIdx((prev) => (prev % 4 < 3 ? prev + 1 : prev));
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleCardClick(selectedIdx);
      } else if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasWon, resetGame, selectedIdx, cards, flippedIndices, isMuted, isStarted]);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto h-full p-2 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 px-4 py-2.5 rounded-2xl mb-3 shadow-lg">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          ← Zurück
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            <span>{moves} Züge</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {pairsFound}/{ICONS.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{timer}s</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title={isMuted ? 'Ton an' : 'Ton aus'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Neu starten"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Memory Cards Grid */}
      <div className="relative bg-slate-900/90 border-2 border-slate-800/90 p-3 rounded-3xl shadow-2xl w-full max-w-[min(340px,46vh)] aspect-square flex items-center justify-center">
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full h-full">
          {cards.map((card, idx) => {
            const isOpen = card.isFlipped || card.isMatched;
            const isCursor = selectedIdx === idx;
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
                className={`relative flex items-center justify-center rounded-2xl text-2xl sm:text-3xl transition-all duration-300 transform perspective-1000 active:scale-95 cursor-pointer ${
                  isCursor ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 z-10' : ''
                } ${
                  card.isMatched
                    ? 'bg-emerald-500/20 border-2 border-emerald-500/50 scale-95 opacity-90'
                    : isOpen
                    ? 'bg-blue-600/30 border-2 border-blue-500 shadow-md'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 shadow-sm'
                }`}
              >
                {isOpen ? (
                  <span>{card.symbol}</span>
                ) : (
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-700/60" />
                )}
              </button>
            );
          })}
        </div>

        {/* Win Overlay */}
        {hasWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in">
            <div className="text-2xl font-black text-amber-400 mb-1">🎉 Glückwunsch!</div>
            <div className="text-xs text-slate-300 mb-4">
              Gelöst in <span className="font-mono text-cyan-400 font-bold">{moves} Zügen</span> und{' '}
              <span className="font-mono text-amber-400 font-bold">{timer} Sekunden</span>!
            </div>
            <button
              type="button"
              onClick={resetGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Nochmal spielen
            </button>
          </div>
        )}
      </div>

      {/* Laptop Keyboard Controls Helper */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/60 w-full">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">WASD / Pfeile</kbd> Karte wählen
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">Leertaste / Enter</kbd> Aufdecken
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">R</kbd> Neustart
        </span>
      </div>

      {/* Bottom Hint */}
      <div className="sm:hidden w-full max-w-xs mt-3 pt-2 text-center text-xs text-slate-400 border-t border-slate-800/60">
        Tippe zwei Karten an, um Paare aufzudecken.
      </div>
    </div>
  );
};

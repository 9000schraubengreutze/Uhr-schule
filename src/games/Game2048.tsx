import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Volume2, VolumeX, Undo2 } from 'lucide-react';

const SIZE = 4;

type Board = number[][];

const TILE_COLORS: Record<number, string> = {
  2: 'bg-slate-700/80 text-slate-100',
  4: 'bg-slate-600/90 text-slate-100',
  8: 'bg-amber-600 text-amber-50 font-bold',
  16: 'bg-orange-600 text-orange-50 font-bold',
  32: 'bg-rose-600 text-rose-50 font-bold',
  64: 'bg-red-600 text-red-50 font-extrabold shadow-md',
  128: 'bg-yellow-500 text-yellow-950 font-extrabold shadow-lg',
  256: 'bg-yellow-400 text-yellow-950 font-extrabold shadow-lg',
  512: 'bg-emerald-500 text-emerald-950 font-extrabold shadow-xl',
  1024: 'bg-cyan-500 text-cyan-950 font-extrabold shadow-xl',
  2048: 'bg-purple-500 text-white font-black shadow-2xl animate-pulse',
  4096: 'bg-fuchsia-600 text-white font-black shadow-2xl',
};

interface Game2048Props {
  onBack: () => void;
  soundEnabled?: boolean;
}

export const Game2048: React.FC<Game2048Props> = ({ onBack, soundEnabled = true }) => {
  const getEmptyBoard = (): Board => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  const addRandomTile = (b: Board): Board => {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return b;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = b.map((row) => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const initBoard = (): Board => {
    let b = getEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    return b;
  };

  const [board, setBoard] = useState<Board>(initBoard);
  const [history, setHistory] = useState<{ board: Board; score: number } | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getGameStats('2048').highScore);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  const startTimeRef = useRef<number>(Date.now());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const checkGameOver = (b: Board): boolean => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) return false;
        if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return false;
        if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Slide and merge row to left
  const slideRow = (row: number[]): { newRow: number[]; points: number } => {
    const filtered = row.filter((val) => val !== 0);
    const newRow: number[] = [];
    let points = 0;

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        newRow.push(merged);
        points += merged;
        i++;
      } else {
        newRow.push(filtered[i]);
      }
    }

    while (newRow.length < SIZE) {
      newRow.push(0);
    }

    return { newRow, points };
  };

  const move = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (isGameOver) return;

      let hasChanged = false;
      let addedPoints = 0;
      const currentBoard = board.map((r) => [...r]);

      let newBoard = getEmptyBoard();

      if (direction === 'left') {
        for (let r = 0; r < SIZE; r++) {
          const { newRow, points } = slideRow(currentBoard[r]);
          newBoard[r] = newRow;
          addedPoints += points;
          if (newRow.some((val, idx) => val !== currentBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < SIZE; r++) {
          const reversed = [...currentBoard[r]].reverse();
          const { newRow, points } = slideRow(reversed);
          const restored = newRow.reverse();
          newBoard[r] = restored;
          addedPoints += points;
          if (restored.some((val, idx) => val !== currentBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < SIZE; c++) {
          const col = [currentBoard[0][c], currentBoard[1][c], currentBoard[2][c], currentBoard[3][c]];
          const { newRow, points } = slideRow(col);
          addedPoints += points;
          for (let r = 0; r < SIZE; r++) {
            newBoard[r][c] = newRow[r];
            if (newRow[r] !== currentBoard[r][c]) hasChanged = true;
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < SIZE; c++) {
          const col = [currentBoard[3][c], currentBoard[2][c], currentBoard[1][c], currentBoard[0][c]];
          const { newRow, points } = slideRow(col);
          const restored = newRow.reverse();
          addedPoints += points;
          for (let r = 0; r < SIZE; r++) {
            newBoard[r][c] = restored[r];
            if (restored[r] !== currentBoard[r][c]) hasChanged = true;
          }
        }
      }

      if (hasChanged) {
        setHistory({ board: currentBoard, score });
        const withTile = addRandomTile(newBoard);
        setBoard(withTile);
        const nextScore = score + addedPoints;
        setScore(nextScore);

        if (addedPoints > 0) {
          playSound('score', isMuted);
        } else {
          playSound('move', isMuted);
        }

        if (nextScore > highScore) {
          setHighScore(nextScore);
        }

        // Check 2048 win
        if (!hasWon && withTile.some((row) => row.some((v) => v >= 2048))) {
          setHasWon(true);
          playSound('win', isMuted);
        }

        // Check Game Over
        if (checkGameOver(withTile)) {
          setIsGameOver(true);
          playSound('gameover', isMuted);
          const timeSpent = (Date.now() - startTimeRef.current) / 1000;
          saveGameResult('2048', nextScore, timeSpent);
        }
      }
    },
    [board, hasWon, highScore, isGameOver, isMuted, score]
  );

  // Undo move
  const handleUndo = () => {
    if (!history) return;
    setBoard(history.board);
    setScore(history.score);
    setHistory(null);
    setIsGameOver(false);
    playSound('click', isMuted);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('left');
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('right');
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('up');
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('down');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        if (dx > 0) move('right');
        else move('left');
      }
    } else {
      if (Math.abs(dy) > 30) {
        if (dy > 0) move('down');
        else move('up');
      }
    }
  };

  const resetGame = () => {
    setBoard(initBoard());
    setScore(0);
    setHistory(null);
    setIsGameOver(false);
    setHasWon(false);
    startTimeRef.current = Date.now();
  };

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
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Punkte</div>
            <div className="text-sm font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Rekord</div>
            <div className="text-sm font-bold font-mono text-amber-400">{highScore}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {history && (
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Schritt rückgängig machen"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}
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

      {/* Main 2048 Board */}
      <div
        className="relative bg-slate-900/90 border-2 border-slate-800/90 p-3 rounded-3xl shadow-2xl w-full max-w-[340px] aspect-square flex flex-col justify-center items-center touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 gap-2.5 w-full h-full">
          {board.map((row, r) =>
            row.map((val, c) => {
              const colorClass = val ? TILE_COLORS[val] || 'bg-fuchsia-700 text-white' : 'bg-slate-950/60';
              return (
                <div
                  key={`${r}-${c}`}
                  className={`flex items-center justify-center rounded-2xl text-xl sm:text-2xl font-bold transition-all duration-150 select-none ${colorClass}`}
                >
                  {val > 0 ? val : ''}
                </div>
              );
            })
          )}
        </div>

        {/* Game Over / Win Overlays */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in duration-200">
            <div className="text-2xl font-extrabold text-rose-400 mb-1">Keine Züge mehr!</div>
            <div className="text-xs text-slate-300 mb-4">
              Endpunktzahl: <span className="font-mono text-cyan-400 font-bold">{score}</span>
            </div>
            <button
              type="button"
              onClick={resetGame}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Nochmal versuchen
            </button>
          </div>
        )}

        {hasWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in duration-200">
            <div className="text-2xl font-black text-amber-400 mb-1">🎉 2048 Erreicht!</div>
            <div className="text-xs text-slate-300 mb-4">Großartig! Du kannst weiterspielen für einen neuen Highscore.</div>
            <button
              type="button"
              onClick={() => setHasWon(false)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Weiterspielen
            </button>
          </div>
        )}
      </div>

      {/* Touch Directional Controls for Mobile */}
      <div className="w-full max-w-xs mt-3 pt-2 border-t border-slate-800/60 flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={() => move('up')}
          className="w-12 h-10 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
          aria-label="Hoch"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => move('left')}
            className="w-12 h-10 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
            aria-label="Links"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => move('down')}
            className="w-12 h-10 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
            aria-label="Runter"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => move('right')}
            className="w-12 h-10 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
            aria-label="Rechts"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

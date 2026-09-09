import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Volume2, VolumeX, Pause, Play } from 'lucide-react';

const GRID_SIZE = 20;

interface Point {
  x: number;
  y: number;
}

interface SnakeGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack, soundEnabled = true }) => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const nextDirectionRef = useRef<Point>({ x: 0, y: -1 });
  const [apple, setApple] = useState<Point>({ x: 5, y: 5 });
  const [goldenApple, setGoldenApple] = useState<Point | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getGameStats('snake').highScore);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  const startTimeRef = useRef<number>(Date.now());
  const gameLoopRef = useRef<number | null>(null);

  // Generate random apple not on snake
  const getRandomFreeCell = useCallback((currentSnake: Point[]): Point => {
    while (true) {
      const candidate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some((s) => s.x === candidate.x && s.y === candidate.y)) {
        return candidate;
      }
    }
  }, []);

  const changeDirection = useCallback((newDir: Point) => {
    const curr = nextDirectionRef.current;
    // Disallow 180-degree immediate reversal
    if (newDir.x === -curr.x && newDir.y === -curr.y) return;
    nextDirectionRef.current = newDir;
  }, []);

  // Tick step
  const tick = useCallback(() => {
    setSnake((prev) => {
      const dir = nextDirectionRef.current;
      setDirection(dir);

      const head = prev[0];
      const newHead: Point = {
        x: head.x + dir.x,
        y: head.y + dir.y,
      };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setIsGameOver(true);
        playSound('gameover', isMuted);
        const timeSpent = (Date.now() - startTimeRef.current) / 1000;
        saveGameResult('snake', score, timeSpent);
        return prev;
      }

      // Self collision
      if (prev.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        setIsGameOver(true);
        playSound('gameover', isMuted);
        const timeSpent = (Date.now() - startTimeRef.current) / 1000;
        saveGameResult('snake', score, timeSpent);
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Check regular apple
      if (newHead.x === apple.x && newHead.y === apple.y) {
        playSound('score', isMuted);
        const nextScore = score + 10;
        setScore(nextScore);
        if (nextScore > highScore) setHighScore(nextScore);

        setApple(getRandomFreeCell(newSnake));

        // 20% chance to spawn golden apple if none exists
        if (!goldenApple && Math.random() < 0.2) {
          setGoldenApple(getRandomFreeCell(newSnake));
        }
        return newSnake; // Grow snake
      }

      // Check golden apple
      if (goldenApple && newHead.x === goldenApple.x && newHead.y === goldenApple.y) {
        playSound('win', isMuted);
        const nextScore = score + 50;
        setScore(nextScore);
        if (nextScore > highScore) setHighScore(nextScore);
        setGoldenApple(null);
        return newSnake; // Grow snake
      }

      // Pop tail
      newSnake.pop();
      return newSnake;
    });
  }, [apple, goldenApple, getRandomFreeCell, highScore, isMuted, score]);

  // Main loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const speed = Math.max(90, 160 - Math.floor(score / 40) * 8);
    gameLoopRef.current = window.setInterval(tick, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isGameOver, isPaused, score, tick]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') changeDirection({ x: 0, y: -1 });
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') changeDirection({ x: 0, y: 1 });
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') changeDirection({ x: -1, y: 0 });
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') changeDirection({ x: 1, y: 0 });
      else if (e.key === 'p' || e.key === 'P') setIsPaused((p) => !p);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  const resetGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDirection({ x: 0, y: -1 });
    nextDirectionRef.current = { x: 0, y: -1 };
    setApple({ x: 5, y: 5 });
    setGoldenApple(null);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
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
            <div className="text-sm font-bold font-mono text-emerald-400">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Länge</div>
            <div className="text-sm font-bold font-mono text-cyan-400">{snake.length}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Rekord</div>
            <div className="text-sm font-bold font-mono text-amber-400">{highScore}</div>
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
            onClick={() => setIsPaused((p) => !p)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title={isPaused ? 'Fortsetzen' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
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

      {/* Snake Canvas / Grid Stage */}
      <div className="relative bg-slate-950/90 border-2 border-slate-800/90 p-2 rounded-3xl shadow-2xl w-full max-w-[340px] aspect-square flex items-center justify-center overflow-hidden">
        <div
          className="grid grid-cols-20 grid-rows-20 gap-[1px] w-full h-full bg-slate-900/40 p-1 rounded-2xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);

            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
            const isApple = apple.x === x && apple.y === y;
            const isGolden = goldenApple && goldenApple.x === x && goldenApple.y === y;

            return (
              <div
                key={index}
                className={`w-full h-full rounded-[2px] transition-all ${
                  isHead
                    ? 'bg-emerald-400 shadow-sm z-10 scale-105'
                    : isBody
                    ? 'bg-emerald-600/90'
                    : isGolden
                    ? 'bg-amber-400 animate-pulse rounded-full shadow-md scale-110'
                    : isApple
                    ? 'bg-rose-500 rounded-full shadow-sm scale-95'
                    : 'bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center z-20">
            <div className="text-2xl font-extrabold text-rose-400 mb-1">Game Over!</div>
            <div className="text-xs text-slate-300 mb-4">
              Punkte: <span className="font-mono text-emerald-400 font-bold">{score}</span> | Rekord:{' '}
              <span className="font-mono text-amber-400 font-bold">{highScore}</span>
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

        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 text-center z-20">
            <div className="text-lg font-bold text-slate-200 mb-2">Pausiert</div>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Weiter
            </button>
          </div>
        )}
      </div>

      {/* D-Pad On-Screen Controls */}
      <div className="w-full max-w-xs mt-3 pt-2 border-t border-slate-800/60 flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={() => changeDirection({ x: 0, y: -1 })}
          className="w-12 h-10 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
          aria-label="Hoch"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => changeDirection({ x: -1, y: 0 })}
            className="w-12 h-10 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
            aria-label="Links"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => changeDirection({ x: 0, y: 1 })}
            className="w-12 h-10 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
            aria-label="Runter"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => changeDirection({ x: 1, y: 0 })}
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

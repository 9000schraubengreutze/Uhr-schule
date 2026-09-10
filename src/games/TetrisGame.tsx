import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import { RotateCw, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, Volume2, VolumeX, ChevronsDown } from 'lucide-react';

const COLS = 10;
const ROWS = 20;

// Tetromino definitions
const TETROMINOES: Record<string, { shape: number[][]; color: string; border: string }> = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500', border: 'border-cyan-400' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-600', border: 'border-blue-400' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-amber-500', border: 'border-amber-400' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400', border: 'border-yellow-300' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-emerald-500', border: 'border-emerald-400' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500', border: 'border-purple-400' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-rose-500', border: 'border-rose-400' },
};

const TETRO_KEYS = Object.keys(TETROMINOES);

interface Piece {
  key: string;
  shape: number[][];
  x: number;
  y: number;
}

interface TetrisGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

export const TetrisGame: React.FC<TetrisGameProps> = ({ onBack, soundEnabled = true, onRestart }) => {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPieceKey, setNextPieceKey] = useState<string>(() =>
    TETRO_KEYS[Math.floor(Math.random() * TETRO_KEYS.length)]
  );
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(() => getGameStats('tetris').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  const startTimeRef = useRef<number>(Date.now());
  const dropTimerRef = useRef<number | null>(null);

  // Spawn a new piece
  const spawnPiece = useCallback((keyToSpawn?: string) => {
    const key = keyToSpawn || nextPieceKey;
    const nextKey = TETRO_KEYS[Math.floor(Math.random() * TETRO_KEYS.length)];
    setNextPieceKey(nextKey);

    const shape = TETROMINOES[key].shape;
    const piece: Piece = {
      key,
      shape,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0,
    };

    return piece;
  }, [nextPieceKey]);

  // Check collision helper
  const checkCollision = useCallback(
    (piece: Piece, testBoard: (string | null)[][], offsetX = 0, offsetY = 0): boolean => {
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const newX = piece.x + c + offsetX;
            const newY = piece.y + r + offsetY;

            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            if (newY >= 0 && testBoard[newY][newX] !== null) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  // Rotate piece matrix clockwise
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const res: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        res[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return res;
  };

  // Lock piece into board, check for lines, spawn next
  const lockPiece = useCallback(
    (piece: Piece) => {
      setBoard((prev) => {
        const nextBoard = prev.map((row) => [...row]);
        for (let r = 0; r < piece.shape.length; r++) {
          for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
              const by = piece.y + r;
              const bx = piece.x + c;
              if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
                nextBoard[by][bx] = piece.key;
              }
            }
          }
        }

        // Clear completed lines
        let cleared = 0;
        const filteredBoard = nextBoard.filter((row) => {
          const isFull = row.every((cell) => cell !== null);
          if (isFull) cleared++;
          return !isFull;
        });

        while (filteredBoard.length < ROWS) {
          filteredBoard.unshift(Array(COLS).fill(null));
        }

        if (cleared > 0) {
          playSound('clear', isMuted);
          const points = [0, 100, 300, 500, 800][cleared] * level;
          setScore((s) => {
            const nextScore = s + points;
            if (nextScore > highScore) setHighScore(nextScore);
            return nextScore;
          });
          setLines((l) => {
            const newLines = l + cleared;
            setLevel(Math.floor(newLines / 10) + 1);
            return newLines;
          });
        } else {
          playSound('drop', isMuted);
        }

        // Spawn next piece
        const nextP = spawnPiece();
        if (checkCollision(nextP, filteredBoard)) {
          // Game Over
          setIsGameOver(true);
          playSound('gameover', isMuted);
          const timeSpent = (Date.now() - startTimeRef.current) / 1000;
          saveGameResult('tetris', score, timeSpent);
          setCurrentPiece(null);
        } else {
          setCurrentPiece(nextP);
        }

        return filteredBoard;
      });
    },
    [checkCollision, highScore, isMuted, level, score, spawnPiece]
  );

  // Move piece
  const movePiece = useCallback(
    (dx: number, dy: number): boolean => {
      if (!currentPiece || isGameOver || isPaused) return false;

      if (!checkCollision(currentPiece, board, dx, dy)) {
        setCurrentPiece((prev) => (prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null));
        if (dx !== 0) playSound('move', isMuted);
        return true;
      }

      if (dy > 0) {
        lockPiece(currentPiece);
        return false;
      }
      return false;
    },
    [board, checkCollision, currentPiece, isGameOver, isPaused, isMuted, lockPiece]
  );

  // Rotate piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused) return;
    const rotated = rotateMatrix(currentPiece.shape);
    const candidate: Piece = { ...currentPiece, shape: rotated };

    // Wall kick simple check
    if (!checkCollision(candidate, board, 0, 0)) {
      setCurrentPiece(candidate);
      playSound('move', isMuted);
    } else if (!checkCollision(candidate, board, -1, 0)) {
      setCurrentPiece({ ...candidate, x: candidate.x - 1 });
      playSound('move', isMuted);
    } else if (!checkCollision(candidate, board, 1, 0)) {
      setCurrentPiece({ ...candidate, x: candidate.x + 1 });
      playSound('move', isMuted);
    }
  }, [board, checkCollision, currentPiece, isGameOver, isPaused, isMuted]);

  // Hard drop instantly
  const hardDrop = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused) return;
    let dropY = 0;
    while (!checkCollision(currentPiece, board, 0, dropY + 1)) {
      dropY++;
    }
    const dropped: Piece = { ...currentPiece, y: currentPiece.y + dropY };
    lockPiece(dropped);
  }, [board, checkCollision, currentPiece, isGameOver, isPaused, lockPiece]);

  // Game loop tick
  useEffect(() => {
    if (isGameOver || isPaused) return;

    if (!currentPiece) {
      const p = spawnPiece();
      setCurrentPiece(p);
      return;
    }

    const speed = Math.max(120, 800 - (level - 1) * 70);
    dropTimerRef.current = window.setInterval(() => {
      movePiece(0, 1);
    }, speed);

    return () => {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
    };
  }, [currentPiece, isGameOver, isPaused, level, movePiece, spawnPiece]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        movePiece(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        movePiece(1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        movePiece(0, 1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        rotatePiece();
      } else if (e.key === ' ') {
        hardDrop();
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hardDrop, movePiece, rotatePiece]);

  // Reset Game
  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    const p = spawnPiece();
    setCurrentPiece(p);
    onRestart?.();
  };

  // Compute ghost piece position
  const ghostY = React.useMemo(() => {
    if (!currentPiece) return 0;
    let gy = 0;
    while (!checkCollision(currentPiece, board, 0, gy + 1)) {
      gy++;
    }
    return currentPiece.y + gy;
  }, [board, checkCollision, currentPiece]);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto h-full p-2 select-none">
      {/* Top Game Bar */}
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

      {/* Main Game Stage + Next Piece Sidebar */}
      <div className="flex items-start justify-center gap-3 w-full flex-1 max-h-[62vh] relative">
        {/* Tetris Board */}
        <div className="relative bg-slate-950/90 border-2 border-slate-800/90 rounded-2xl p-1.5 shadow-2xl overflow-hidden flex flex-col items-center">
          <div
            className="grid grid-cols-10 gap-[1.5px] bg-slate-900/60 p-1 rounded-xl"
            style={{ width: 'min(58vw, 240px)', height: 'min(116vw, 480px)' }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                // Determine if this cell is filled by placed piece, current piece, or ghost piece
                let pieceColor = '';
                let isGhost = false;

                if (cell) {
                  pieceColor = TETROMINOES[cell].color;
                } else if (currentPiece) {
                  const pr = r - currentPiece.y;
                  const pc = c - currentPiece.x;
                  if (
                    pr >= 0 &&
                    pr < currentPiece.shape.length &&
                    pc >= 0 &&
                    pc < currentPiece.shape[pr].length &&
                    currentPiece.shape[pr][pc]
                  ) {
                    pieceColor = TETROMINOES[currentPiece.key].color;
                  } else {
                    // Ghost piece check
                    const gr = r - ghostY;
                    if (
                      gr >= 0 &&
                      gr < currentPiece.shape.length &&
                      pc >= 0 &&
                      pc < currentPiece.shape[gr].length &&
                      currentPiece.shape[gr][pc]
                    ) {
                      isGhost = true;
                    }
                  }
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-full h-full rounded-[3px] transition-colors ${
                      pieceColor
                        ? `${pieceColor} shadow-sm border border-white/20`
                        : isGhost
                        ? 'border border-cyan-500/40 bg-cyan-500/10'
                        : 'bg-slate-950/40'
                    }`}
                  />
                );
              })
            )}
          </div>

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center z-20">
              <div className="text-xl font-extrabold text-rose-400 mb-1">Spiel Vorbei!</div>
              <div className="text-xs text-slate-300 mb-3">
                Score: <span className="font-mono text-cyan-400 font-bold">{score}</span> | Level: {level}
              </div>
              <button
                type="button"
                onClick={resetGame}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Nochmal spielen
              </button>
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center z-20">
              <div className="text-lg font-bold text-slate-200 mb-2">Pausiert</div>
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Fortsetzen
              </button>
            </div>
          )}
        </div>

        {/* Next Piece & Level Info */}
        <div className="flex flex-col gap-2.5">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 w-20 text-center">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nächster
            </div>
            <div className="grid grid-cols-4 gap-0.5 w-12 h-12 mx-auto items-center justify-center bg-slate-950/60 p-1 rounded-lg">
              {TETROMINOES[nextPieceKey].shape.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`w-2.5 h-2.5 rounded-[2px] ${
                      val ? TETROMINOES[nextPieceKey].color : 'opacity-0'
                    }`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 w-20 text-center text-xs">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Level</div>
            <div className="font-mono font-bold text-emerald-400 text-sm">{level}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-2">
              Linien
            </div>
            <div className="font-mono font-bold text-slate-200 text-sm">{lines}</div>
          </div>
        </div>
      </div>

      {/* On-Screen Mobile Controls */}
      <div className="w-full max-w-sm mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => movePiece(-1, 0)}
            className="w-12 h-11 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
            aria-label="Links"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => movePiece(1, 0)}
            className="w-12 h-11 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl flex items-center justify-center text-slate-200 shadow-md cursor-pointer"
            aria-label="Rechts"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={rotatePiece}
            className="w-12 h-11 bg-blue-600/90 hover:bg-blue-500 active:scale-95 rounded-xl flex items-center justify-center text-white shadow-md cursor-pointer"
            aria-label="Drehen"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={hardDrop}
            className="w-12 h-11 bg-amber-600/90 hover:bg-amber-500 active:scale-95 rounded-xl flex items-center justify-center text-white shadow-md cursor-pointer"
            aria-label="Fallen lassen"
          >
            <ChevronsDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import { Flag, RotateCcw, Volume2, VolumeX, Bomb, Clock } from 'lucide-react';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-emerald-400',
  3: 'text-rose-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-cyan-400',
  7: 'text-pink-400',
  8: 'text-slate-100',
};

interface MinesweeperGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({ onBack, soundEnabled = true, onRestart }) => {
  const createEmptyBoard = (): Cell[][] =>
    Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => ({
        r,
        c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    );

  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard);
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [highScore, setHighScore] = useState(() => getGameStats('minesweeper').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  const timerIntervalRef = useRef<number | null>(null);

  // Timer loop
  useEffect(() => {
    if (minesPlaced && !isGameOver && !hasWon) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [minesPlaced, isGameOver, hasWon]);

  // Count flags placed
  const flagsCount = board.reduce(
    (acc, row) => acc + row.filter((c) => c.isFlagged).length,
    0
  );

  // Place mines ensuring the first clicked cell (and neighbors) are safe
  const populateMines = (firstR: number, firstC: number): Cell[][] => {
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);

      // Don't place on first click or already placed
      if (Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1) continue;
      if (newBoard[r][c].isMine) continue;

      newBoard[r][c].isMine = true;
      placed++;
    }

    // Calculate neighbor counts
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    return newBoard;
  };

  // Reveal cell recursively for blanks
  const revealCellRecursive = (
    currentBoard: Cell[][],
    r: number,
    c: number
  ) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const cell = currentBoard[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    if (cell.neighborMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            revealCellRecursive(currentBoard, r + dr, c + dc);
          }
        }
      }
    }
  };

  // Check win condition
  const checkWin = (testBoard: Cell[][]): boolean => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = testBoard[r][c];
        if (!cell.isMine && !cell.isRevealed) return false;
      }
    }
    return true;
  };

  // Click on cell
  const handleCellClick = (r: number, c: number) => {
    if (isGameOver || hasWon) return;

    if (flagMode) {
      handleToggleFlag(r, c);
      return;
    }

    let activeBoard = board;
    if (!minesPlaced) {
      activeBoard = populateMines(r, c);
      setMinesPlaced(true);
    }

    const target = activeBoard[r][c];
    if (target.isFlagged || target.isRevealed) return;

    // Hit a mine!
    if (target.isMine) {
      setIsGameOver(true);
      playSound('bomb', isMuted);
      // Reveal all mines
      const revealedMines = activeBoard.map((row) =>
        row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
      );
      setBoard(revealedMines);
      saveGameResult('minesweeper', Math.max(0, (ROWS * COLS - MINES) * 10 - timer), timer);
      return;
    }

    // Safe reveal
    const newBoard = activeBoard.map((row) => row.map((cell) => ({ ...cell })));
    revealCellRecursive(newBoard, r, c);
    playSound('click', isMuted);

    if (checkWin(newBoard)) {
      setHasWon(true);
      playSound('win', isMuted);
      const score = Math.max(100, 1000 - timer * 5);
      if (score > highScore) setHighScore(score);
      saveGameResult('minesweeper', score, timer);
    }

    setBoard(newBoard);
  };

  // Right-click / Toggle Flag
  const handleToggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isGameOver || hasWon) return;

    const cell = board[r][c];
    if (cell.isRevealed) return;

    const newBoard = board.map((row) => row.map((cl) => ({ ...cl })));
    newBoard[r][c].isFlagged = !cell.isFlagged;
    setBoard(newBoard);
    playSound('click', isMuted);
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setMinesPlaced(false);
    setIsGameOver(false);
    setHasWon(false);
    setTimer(0);
    onRestart?.();
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-400 font-mono font-bold text-sm">
            <Bomb className="w-4 h-4" />
            <span>{Math.max(0, MINES - flagsCount)}</span>
          </div>
          <button
            type="button"
            onClick={resetGame}
            className="text-xl p-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            title="Neu starten"
          >
            {isGameOver ? '😵' : hasWon ? '😎' : '😊'}
          </button>
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-sm">
            <Clock className="w-4 h-4" />
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
            title="Zurücksetzen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Minesweeper Grid Stage */}
      <div className="relative bg-slate-900/90 border-2 border-slate-800/90 p-3 rounded-3xl shadow-2xl w-full max-w-[340px] aspect-square flex flex-col items-center justify-center">
        <div className="grid grid-cols-9 gap-1 w-full h-full">
          {board.map((row, r) =>
            row.map((cell, c) => {
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleToggleFlag(r, c, e)}
                  className={`flex items-center justify-center rounded-lg text-sm font-black font-mono transition-all select-none cursor-pointer ${
                    cell.isRevealed
                      ? cell.isMine
                        ? 'bg-rose-600 text-white shadow-inner'
                        : 'bg-slate-950/80 border border-slate-800/60'
                      : 'bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border-b-2 border-slate-900 shadow-sm'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb className="w-4 h-4 text-white" />
                    ) : cell.neighborMines > 0 ? (
                      <span className={NUMBER_COLORS[cell.neighborMines]}>
                        {cell.neighborMines}
                      </span>
                    ) : (
                      ''
                    )
                  ) : cell.isFlagged ? (
                    <Flag className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ) : (
                    ''
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Win / Loss Overlays */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="text-2xl font-extrabold text-rose-400 mb-1">Mine getroffen!</div>
            <div className="text-xs text-slate-300 mb-4">Das Minenfeld ist explodiert.</div>
            <button
              type="button"
              onClick={resetGame}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {hasWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="text-2xl font-black text-emerald-400 mb-1">🎉 Gewonnen!</div>
            <div className="text-xs text-slate-300 mb-4">
              Zeit: <span className="font-mono text-amber-400 font-bold">{timer}s</span> | Alle Minen entschärft!
            </div>
            <button
              type="button"
              onClick={resetGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Noch eine Runde
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher for Mobile touch devices */}
      <div className="w-full max-w-xs mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setFlagMode(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            !flagMode
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Aufdecken</span>
        </button>
        <button
          type="button"
          onClick={() => setFlagMode(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            flagMode
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flag className="w-3.5 h-3.5 fill-current" />
          <span>Flagge setzen</span>
        </button>
      </div>
    </div>
  );
};

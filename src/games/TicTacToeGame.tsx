import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Users,
  Bot,
  Sparkles,
  Flame,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';

interface TicTacToeGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

export type Player = 'X' | 'O';
export type BoardCell = Player | null;
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'unbeatable';

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  onBack,
  soundEnabled = true,
  onRestart,
}) => {
  const [boardSize, setBoardSize] = useState<3 | 4>(3);
  const [mode, setMode] = useState<'ai' | '2p'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('unbeatable');
  const [board, setBoard] = useState<BoardCell[]>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningIndices, setWinningIndices] = useState<number[]>([]);
  const [cursorIdx, setCursorIdx] = useState(4);
  const [score, setScore] = useState({ x: 0, o: 0, draws: 0 });
  const [highScore, setHighScore] = useState(() => getGameStats('tictactoe').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  const startTimeRef = useRef(Date.now());

  // Check winning lines for 3x3 or 4x4
  const checkWinner = useCallback(
    (currentBoard: BoardCell[], size: number) => {
      const lines: number[][] = [];

      // Rows
      for (let r = 0; r < size; r++) {
        const row: number[] = [];
        for (let c = 0; c < size; c++) row.push(r * size + c);
        lines.push(row);
      }

      // Columns
      for (let c = 0; c < size; c++) {
        const col: number[] = [];
        for (let r = 0; r < size; r++) col.push(r * size + c);
        lines.push(col);
      }

      // Diagonals
      const diag1: number[] = [];
      const diag2: number[] = [];
      for (let i = 0; i < size; i++) {
        diag1.push(i * size + i);
        diag2.push(i * size + (size - 1 - i));
      }
      lines.push(diag1, diag2);

      // Check each line
      for (const line of lines) {
        const first = currentBoard[line[0]];
        if (first && line.every((idx) => currentBoard[idx] === first)) {
          return { winner: first, line };
        }
      }

      // Check draw
      if (currentBoard.every((cell) => cell !== null)) {
        return { winner: 'draw' as const, line: [] };
      }

      return null;
    },
    []
  );

  // Full Mathematical Minimax algorithm for perfect, mathematically unbeatable play
  const minimax = useCallback(
    (
      currentBoard: BoardCell[],
      depth: number,
      isMaximizing: boolean,
      alpha: number,
      beta: number,
      maxDepth = 6
    ): { score: number; bestMove?: number } => {
      const res = checkWinner(currentBoard, 3);
      if (res) {
        if (res.winner === 'O') return { score: 10 - depth };
        if (res.winner === 'X') return { score: depth - 10 };
        return { score: 0 };
      }

      if (depth >= maxDepth) {
        return { score: 0 };
      }

      const availableMoves: number[] = [];
      for (let i = 0; i < currentBoard.length; i++) {
        if (!currentBoard[i]) availableMoves.push(i);
      }

      if (isMaximizing) {
        let maxEval = -Infinity;
        let bestMove = availableMoves[0];

        for (const move of availableMoves) {
          currentBoard[move] = 'O';
          const evaluation = minimax(currentBoard, depth + 1, false, alpha, beta, maxDepth).score;
          currentBoard[move] = null;

          if (evaluation > maxEval) {
            maxEval = evaluation;
            bestMove = move;
          }
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
        return { score: maxEval, bestMove };
      } else {
        let minEval = Infinity;
        let bestMove = availableMoves[0];

        for (const move of availableMoves) {
          currentBoard[move] = 'X';
          const evaluation = minimax(currentBoard, depth + 1, true, alpha, beta, maxDepth).score;
          currentBoard[move] = null;

          if (evaluation < minEval) {
            minEval = evaluation;
            bestMove = move;
          }
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
        return { score: minEval, bestMove };
      }
    },
    [checkWinner]
  );

  // Minimax / Smart AI move solver
  const getBestMove = useCallback(
    (currentBoard: BoardCell[], size: number): number => {
      const available: number[] = [];
      currentBoard.forEach((cell, idx) => {
        if (!cell) available.push(idx);
      });
      if (available.length === 0) return 0;

      if (aiDifficulty === 'easy') {
        return available[Math.floor(Math.random() * available.length)];
      }

      // 1. Can AI win immediately in one move?
      for (const idx of available) {
        const copy = [...currentBoard];
        copy[idx] = 'O';
        const res = checkWinner(copy, size);
        if (res?.winner === 'O') return idx;
      }

      // 2. Can player win in one move? Must Block!
      for (const idx of available) {
        const copy = [...currentBoard];
        copy[idx] = 'X';
        const res = checkWinner(copy, size);
        if (res?.winner === 'X') return idx;
      }

      if (aiDifficulty === 'medium') {
        const center = size === 3 ? 4 : 5;
        if (available.includes(center)) return center;
        return available[Math.floor(Math.random() * available.length)];
      }

      // UNBEATABLE / MASTER AI
      if (size === 3) {
        if (aiDifficulty === 'unbeatable') {
          // Pure minimax solution
          const boardCopy = [...currentBoard];
          const result = minimax(boardCopy, 0, true, -Infinity, Infinity, 9);
          if (result.bestMove !== undefined && available.includes(result.bestMove)) {
            return result.bestMove;
          }
        }

        // Hard AI: Center priority, then corners, fork traps
        const center = 4;
        if (available.includes(center)) return center;

        // Opposite corners defense against fork
        const corners = [0, 2, 6, 8].filter((c) => available.includes(c));
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
      }

      // For 4x4: Strategic positional evaluation (Center quadrant > inner edges > corners)
      if (size === 4) {
        const innerQuadrant = [5, 6, 9, 10].filter((idx) => available.includes(idx));
        if (innerQuadrant.length > 0) {
          return innerQuadrant[Math.floor(Math.random() * innerQuadrant.length)];
        }

        // Block two-in-a-row threats
        for (const idx of available) {
          const copy = [...currentBoard];
          copy[idx] = 'X';
          // Count how many lines player progresses
          let playerThreats = 0;
          for (let r = 0; r < 4; r++) {
            const rowCells = [copy[r * 4], copy[r * 4 + 1], copy[r * 4 + 2], copy[r * 4 + 3]];
            if (rowCells.filter((c) => c === 'X').length >= 3 && rowCells.includes(null)) {
              playerThreats++;
            }
          }
          if (playerThreats > 0) return idx;
        }

        const corners = [0, 3, 12, 15].filter((c) => available.includes(c));
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
      }

      return available[Math.floor(Math.random() * available.length)];
    },
    [aiDifficulty, checkWinner, minimax]
  );

  // Reset current round
  const resetRound = useCallback(() => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningIndices([]);
    setCursorIdx(Math.floor((boardSize * boardSize) / 2));
    startTimeRef.current = Date.now();
    onRestart?.();
  }, [boardSize, onRestart]);

  // Trigger move at index
  const makeMove = useCallback(
    (idx: number) => {
      if (board[idx] || winner !== null) return;

      const nextBoard = [...board];
      nextBoard[idx] = turn;
      setBoard(nextBoard);
      playSound('click', isMuted);

      const winResult = checkWinner(nextBoard, boardSize);
      if (winResult) {
        setWinner(winResult.winner);
        if (winResult.winner === 'X') {
          playSound('win', isMuted);
          setWinningIndices(winResult.line);
          setScore((s) => ({ ...s, x: s.x + 1 }));
          const timeSpent = (Date.now() - startTimeRef.current) / 1000;
          const pts =
            mode === 'ai'
              ? aiDifficulty === 'unbeatable'
                ? 250
                : aiDifficulty === 'hard'
                ? 150
                : 100
              : 50;
          const res = saveGameResult('tictactoe', pts, timeSpent);
          if (res.isNewHighscore) setHighScore(res.stats.highScore);
        } else if (winResult.winner === 'O') {
          playSound('gameover', isMuted);
          setWinningIndices(winResult.line);
          setScore((s) => ({ ...s, o: s.o + 1 }));
        } else {
          playSound('clear', isMuted);
          setScore((s) => ({ ...s, draws: s.draws + 1 }));
        }
        return;
      }

      // Next turn
      setTurn((t) => (t === 'X' ? 'O' : 'X'));
    },
    [board, boardSize, checkWinner, isMuted, mode, turn, winner, aiDifficulty]
  );

  // Trigger AI move if it's O's turn in AI mode
  useEffect(() => {
    if (mode === 'ai' && turn === 'O' && winner === null) {
      const timer = setTimeout(() => {
        const move = getBestMove(board, boardSize);
        makeMove(move);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [board, boardSize, getBestMove, makeMove, mode, turn, winner]);

  // Handle Board Size Switch
  const handleChangeSize = (size: 3 | 4) => {
    setBoardSize(size);
    setBoard(Array(size * size).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningIndices([]);
    setCursorIdx(Math.floor((size * size) / 2));
  };

  // Keyboard navigation for Laptop / Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (winner !== null) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          resetRound();
        }
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        resetRound();
        return;
      }

      // Numpad direct placement for 3x3
      if (boardSize === 3 && e.key >= '1' && e.key <= '9') {
        const keyNum = parseInt(e.key, 10);
        const cellIdx = keyNum - 1;
        if (!mode || turn === 'X') makeMove(cellIdx);
        return;
      }

      // Grid cursor navigation
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setCursorIdx((curr) => (curr - boardSize >= 0 ? curr - boardSize : curr));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setCursorIdx((curr) => (curr + boardSize < boardSize * boardSize ? curr + boardSize : curr));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setCursorIdx((curr) => (curr % boardSize > 0 ? curr - 1 : curr));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setCursorIdx((curr) => (curr % boardSize < boardSize - 1 ? curr + 1 : curr));
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (!mode || turn === 'X') makeMove(cursorIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardSize, cursorIdx, makeMove, mode, resetRound, turn, winner]);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-between text-slate-100 select-none overflow-y-auto p-1">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl shrink-0 gap-2 mb-2 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Zurück zum Menü"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
            Tic Tac Toe
          </span>
        </div>

        {/* Score Matrix */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-xl text-xs font-mono">
          <span className="text-cyan-400 font-bold">X: {score.x}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Remis: {score.draws}</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">O: {score.o}</span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title={isMuted ? 'Ton an' : 'Stumm'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={resetRound}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Neustart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode & Grid Size Bar */}
      <div className="w-full max-w-md flex items-center justify-between px-1 mb-2 text-xs gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('ai');
              resetRound();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              mode === 'ai' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Gegen KI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('2p');
              resetRound();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              mode === '2p' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2 Spieler</span>
          </button>
        </div>

        {/* Grid Switcher 3x3 or 4x4 */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleChangeSize(3)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              boardSize === 3 ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            3×3
          </button>
          <button
            type="button"
            onClick={() => handleChangeSize(4)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              boardSize === 4 ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            4×4
          </button>
        </div>
      </div>

      {/* AI Difficulty Selector (Schwer & Unbesiegbar / Minimax) */}
      {mode === 'ai' && (
        <div className="w-full max-w-md flex items-center justify-between px-1 mb-2 shrink-0">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>KI-Stufe:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'medium', label: 'Mittel' },
                { id: 'hard', label: 'Schwer' },
                { id: 'unbeatable', label: 'Unbesiegbar (Minimax)' },
              ] as { id: AIDifficulty; label: string }[]
            ).map((item) => {
              const isSelected = aiDifficulty === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAiDifficulty(item.id);
                    resetRound();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? item.id === 'unbeatable'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.id === 'unbeatable' && <Flame className="w-3 h-3 text-amber-300" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Board Arena */}
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative">
        <div className="relative bg-slate-900/90 border-2 border-slate-800 p-3 sm:p-4 rounded-3xl shadow-2xl w-full max-w-[min(360px,46vh)] aspect-square flex flex-col items-center justify-center">
          <div
            className={`grid gap-2.5 w-full h-full ${
              boardSize === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-4 grid-rows-4'
            }`}
          >
            {board.map((cell, idx) => {
              const isCursor = cursorIdx === idx;
              const isWinningCell = winningIndices.includes(idx);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCursorIdx(idx);
                    makeMove(idx);
                  }}
                  onMouseEnter={() => setCursorIdx(idx)}
                  className={`relative flex items-center justify-center rounded-2xl font-black transition-all select-none cursor-pointer active:scale-95 ${
                    boardSize === 3 ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                  } ${
                    isWinningCell
                      ? 'bg-emerald-500/30 border-2 border-emerald-400 shadow-lg shadow-emerald-500/40 animate-pulse'
                      : isCursor
                      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
                      : ''
                  } ${
                    cell
                      ? 'bg-slate-950/80 border border-slate-800'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80'
                  }`}
                >
                  {cell === 'X' && (
                    <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                      X
                    </span>
                  )}
                  {cell === 'O' && (
                    <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                      O
                    </span>
                  )}
                  {!cell && (
                    <span className="text-slate-600/30 text-xs font-mono font-normal">
                      {idx + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Winner / Draw Overlay */}
          {winner && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in">
              <div className="text-2xl font-black mb-1">
                {winner === 'draw' ? (
                  <span className="text-slate-300">Unentschieden! 🤝</span>
                ) : winner === 'X' ? (
                  <span className="text-cyan-400">
                    {mode === 'ai' ? '🎉 Sieg über die KI!' : '🎉 Spieler X gewinnt!'}
                  </span>
                ) : (
                  <span className="text-rose-400">
                    {mode === 'ai' ? 'KI triumphiert! 🤖' : '🎉 Spieler O gewinnt!'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mb-4">
                {winner === 'draw'
                  ? 'Kein freies Feld mehr übrig.'
                  : `${boardSize} in einer Reihe vollendet.`}
              </p>
              <button
                type="button"
                onClick={resetRound}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nächste Runde</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Turn indicator */}
      {!winner && (
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-semibold">
          <span>Am Zug:</span>
          <span
            className={`px-2 py-0.5 rounded-md font-bold font-mono ${
              turn === 'X'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {turn === 'X' ? 'Spieler X' : mode === 'ai' ? 'KI (O)...' : 'Spieler O'}
          </span>
        </div>
      )}

      {/* Desktop Keyboard Helper */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60 w-full max-w-md shrink-0">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
            1-9
          </kbd>{' '}
          oder{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
            WASD / Pfeile
          </kbd>
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
            Leertaste / Enter
          </kbd>{' '}
          Setzen
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
            R
          </kbd>{' '}
          Neustart
        </span>
      </div>

      {/* Mobile hint */}
      <div className="sm:hidden text-[11px] text-slate-400 text-center mt-2 shrink-0">
        Tippe auf ein Feld, um dein Zeichen zu setzen.
      </div>
    </div>
  );
};

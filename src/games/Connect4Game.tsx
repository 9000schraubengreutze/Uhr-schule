import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Bot,
  Users,
  Undo2,
  Sparkles,
} from 'lucide-react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';

interface Connect4GameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

type Player = 'R' | 'Y'; // R: Red (Player 1), Y: Yellow (AI / Player 2)
type Cell = Player | null;

const ROWS = 6;
const COLS = 7;

export const Connect4Game: React.FC<Connect4GameProps> = ({
  onBack,
  soundEnabled = true,
  onRestart,
}) => {
  const [board, setBoard] = useState<Cell[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [turn, setTurn] = useState<Player>('R');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [isAiMode, setIsAiMode] = useState(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [scores, setScores] = useState({ red: 0, yellow: 0, draws: 0 });
  const [history, setHistory] = useState<Cell[][][]>([]);
  const [highScore, setHighScore] = useState(() => getGameStats('connect4').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  // Check 4-in-a-row
  const checkWin = useCallback((b: Cell[][]): { winner: Player; cells: [number, number][] } | null => {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = b[r][c];
        if (p && p === b[r][c + 1] && p === b[r][c + 2] && p === b[r][c + 3]) {
          return {
            winner: p,
            cells: [
              [r, c],
              [r, c + 1],
              [r, c + 2],
              [r, c + 3],
            ],
          };
        }
      }
    }

    // Check vertical
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = b[r][c];
        if (p && p === b[r + 1][c] && p === b[r + 2][c] && p === b[r + 3][c]) {
          return {
            winner: p,
            cells: [
              [r, c],
              [r + 1, c],
              [r + 2, c],
              [r + 3, c],
            ],
          };
        }
      }
    }

    // Check diagonal down-right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = b[r][c];
        if (p && p === b[r + 1][c + 1] && p === b[r + 2][c + 2] && p === b[r + 3][c + 3]) {
          return {
            winner: p,
            cells: [
              [r, c],
              [r + 1, c + 1],
              [r + 2, c + 2],
              [r + 3, c + 3],
            ],
          };
        }
      }
    }

    // Check diagonal up-right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = b[r][c];
        if (p && p === b[r - 1][c + 1] && p === b[r - 2][c + 2] && p === b[r - 3][c + 3]) {
          return {
            winner: p,
            cells: [
              [r, c],
              [r - 1, c + 1],
              [r - 2, c + 2],
              [r - 3, c + 3],
            ],
          };
        }
      }
    }

    return null;
  }, []);

  // Check if board is completely full
  const checkFull = (b: Cell[][]): boolean => {
    return b[0].every((cell) => cell !== null);
  };

  // Find lowest empty row in column
  const getOpenRow = (b: Cell[][], col: number): number => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][col] === null) return r;
    }
    return -1;
  };

  // Drop token logic
  const dropToken = useCallback(
    (col: number, player: Player) => {
      const openRow = getOpenRow(board, col);
      if (openRow === -1 || winner !== null) return false;

      const newBoard = board.map((row) => [...row]);
      newBoard[openRow][col] = player;
      setHistory((h) => [...h, board]);
      setBoard(newBoard);
      playSound('drop', isMuted);

      const winResult = checkWin(newBoard);
      if (winResult) {
        setWinner(winResult.winner);
        setWinningCells(winResult.cells);
        if (winResult.winner === 'R') {
          playSound('win', isMuted);
          setScores((s) => ({ ...s, red: s.red + 1 }));
          const timeSpent = (Date.now() - startTimeRef.current) / 1000;
          const points = isAiMode ? 100 : 50;
          const res = saveGameResult('connect4', points, timeSpent);
          if (res.isNewHighscore) setHighScore(res.stats.highScore);
        } else {
          playSound('gameover', isMuted);
          setScores((s) => ({ ...s, yellow: s.yellow + 1 }));
        }
        return true;
      }

      if (checkFull(newBoard)) {
        setWinner('draw');
        playSound('clear', isMuted);
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
        return true;
      }

      setTurn(player === 'R' ? 'Y' : 'R');
      return true;
    },
    [board, winner, isMuted, isAiMode, checkWin]
  );

  // Smart AI Move Evaluator
  const getAiMove = useCallback(
    (currentBoard: Cell[][]): number => {
      const validCols: number[] = [];
      for (let c = 0; c < COLS; c++) {
        if (getOpenRow(currentBoard, c) !== -1) {
          validCols.push(c);
        }
      }
      if (validCols.length === 0) return 3;

      if (aiDifficulty === 'easy') {
        return validCols[Math.floor(Math.random() * validCols.length)];
      }

      // 1. Can AI win immediately on this turn?
      for (const c of validCols) {
        const r = getOpenRow(currentBoard, c);
        currentBoard[r][c] = 'Y';
        const win = checkWin(currentBoard);
        currentBoard[r][c] = null;
        if (win?.winner === 'Y') return c;
      }

      // 2. Must AI block human's immediate win?
      for (const c of validCols) {
        const r = getOpenRow(currentBoard, c);
        currentBoard[r][c] = 'R';
        const win = checkWin(currentBoard);
        currentBoard[r][c] = null;
        if (win?.winner === 'R') return c;
      }

      if (aiDifficulty === 'medium') {
        // Prefer center column, then random
        if (validCols.includes(3) && Math.random() < 0.6) return 3;
        return validCols[Math.floor(Math.random() * validCols.length)];
      }

      // Hard AI: Center preference + avoid giving opponent a win right above us
      const safeCols = validCols.filter((c) => {
        const r = getOpenRow(currentBoard, c);
        if (r - 1 < 0) return true;
        // Would playing here allow human to win right above us?
        currentBoard[r - 1][c] = 'R';
        const opWin = checkWin(currentBoard);
        currentBoard[r - 1][c] = null;
        return opWin?.winner !== 'R';
      });

      const choices = safeCols.length > 0 ? safeCols : validCols;
      // Center column preference order: 3, 2, 4, 1, 5, 0, 6
      const priorityOrder = [3, 2, 4, 1, 5, 0, 6];
      for (const col of priorityOrder) {
        if (choices.includes(col)) return col;
      }

      return choices[0];
    },
    [aiDifficulty, checkWin]
  );

  // Trigger AI turn
  useEffect(() => {
    if (isAiMode && turn === 'Y' && winner === null) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiCol = getAiMove(board);
        dropToken(aiCol, 'Y');
        setIsAiThinking(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [turn, isAiMode, winner, board, getAiMove, dropToken]);

  // Restart match
  const handleRestart = useCallback(() => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setTurn('R');
    setWinner(null);
    setWinningCells([]);
    setHistory([]);
    startTimeRef.current = Date.now();
    onRestart?.();
  }, [onRestart]);

  // Undo move
  const handleUndo = useCallback(() => {
    if (history.length === 0 || winner !== null) return;
    const prevBoard = isAiMode && history.length >= 2 ? history[history.length - 2] : history[history.length - 1];
    setBoard(prevBoard);
    setHistory((h) => h.slice(0, isAiMode ? -2 : -1));
    setTurn('R');
    setWinner(null);
    setWinningCells([]);
  }, [history, isAiMode, winner]);

  // Keyboard navigation for laptop/desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (winner !== null) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          handleRestart();
        }
        return;
      }

      // Keys 1 to 7 directly drop in column
      if (e.key >= '1' && e.key <= '7') {
        const col = parseInt(e.key, 10) - 1;
        if (!isAiMode || turn === 'R') {
          dropToken(col, turn);
        }
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setHoverCol((prev) => (prev === null ? 3 : Math.max(0, prev - 1)));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setHoverCol((prev) => (prev === null ? 3 : Math.min(COLS - 1, prev + 1)));
      } else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
        const targetCol = hoverCol !== null ? hoverCol : 3;
        if (!isAiMode || turn === 'R') {
          dropToken(targetCol, turn);
        }
      } else if (e.key === 'z' || e.key === 'Z' || e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropToken, handleRestart, handleUndo, hoverCol, isAiMode, turn, winner]);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-between text-slate-100 select-none">
      {/* Header bar */}
      <div className="w-full max-w-lg flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl shrink-0 gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zurück zum Menü"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
            4 Gewinnt
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsAiMode(true);
              handleRestart();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
              isAiMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">vs Bot</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAiMode(false);
              handleRestart();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
              !isAiMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2 Spieler</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {history.length > 0 && winner === null && (
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Zug zurücknehmen"
            >
              <Undo2 className="w-4 h-4" />
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
            onClick={handleRestart}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Neues Spiel"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Score & Turn Status Bar */}
      <div className="w-full max-w-lg flex items-center justify-between px-4 py-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl mb-2 text-xs">
        {/* Red Player */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-xl transition-all ${
            turn === 'R' && winner === null
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold scale-105'
              : 'text-slate-400'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
          <span>{isAiMode ? 'Du (Rot)' : 'Spieler 1'}</span>
          <span className="font-mono text-rose-400 font-bold ml-1">{scores.red}</span>
        </div>

        {/* Status Center */}
        <div className="text-center font-semibold text-slate-300 text-xs">
          {winner === 'R' ? (
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Rot gewinnt!
            </span>
          ) : winner === 'Y' ? (
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {isAiMode ? 'Computer gewinnt!' : 'Gelb gewinnt!'}
            </span>
          ) : winner === 'draw' ? (
            <span className="text-slate-400">Unentschieden!</span>
          ) : isAiThinking ? (
            <span className="text-amber-400 animate-pulse">Bot überlegt...</span>
          ) : (
            <span className="text-slate-400">
              Am Zug:{' '}
              <strong className={turn === 'R' ? 'text-rose-400' : 'text-amber-400'}>
                {turn === 'R' ? 'Rot' : isAiMode ? 'Computer' : 'Gelb'}
              </strong>
            </span>
          )}
        </div>

        {/* Yellow Player */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-xl transition-all ${
            turn === 'Y' && winner === null
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold scale-105'
              : 'text-slate-400'
          }`}
        >
          <span className="font-mono text-amber-400 font-bold mr-1">{scores.yellow}</span>
          <span>{isAiMode ? 'Computer' : 'Spieler 2'}</span>
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
        </div>
      </div>

      {/* Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg min-h-0">
        {/* Column Arrow Indicators */}
        <div className="grid grid-cols-7 gap-2 sm:gap-2.5 w-full max-w-[min(360px,42vh)] px-3 mb-1">
          {Array.from({ length: COLS }).map((_, c) => {
            const isTargeted = hoverCol === c && winner === null && (!isAiMode || turn === 'R');
            return (
              <div
                key={c}
                className="flex items-center justify-center h-4 cursor-pointer"
                onClick={() => {
                  if (winner === null && (!isAiMode || turn === 'R')) {
                    dropToken(c, 'R');
                  }
                }}
              >
                <div
                  className={`w-2 h-2 border-b-2 border-r-2 transform rotate-45 transition-opacity ${
                    isTargeted ? 'border-rose-400 opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Connect4 Physical Blue Board */}
        <div
          className="relative bg-blue-700/90 border-4 border-blue-600 rounded-3xl p-3 sm:p-4 shadow-2xl w-full max-w-[min(360px,42vh)]"
          onMouseLeave={() => setHoverCol(null)}
        >
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {Array.from({ length: COLS }).map((_, c) => (
              <div
                key={c}
                onMouseEnter={() => setHoverCol(c)}
                onClick={() => {
                  if (winner === null && (!isAiMode || turn === 'R')) {
                    dropToken(c, 'R');
                  }
                }}
                className="flex flex-col gap-2 sm:gap-2.5 cursor-pointer group"
              >
                {Array.from({ length: ROWS }).map((_, r) => {
                  const cell = board[r][c];
                  const isWinning = winningCells.some(([wr, wc]) => wr === r && wc === c);

                  return (
                    <div
                      key={r}
                      className="relative w-full aspect-square rounded-full bg-slate-950/80 shadow-inner flex items-center justify-center overflow-hidden"
                    >
                      {cell && (
                        <div
                          className={`w-[90%] h-[90%] rounded-full shadow-md transition-transform duration-300 ${
                            cell === 'R'
                              ? 'bg-gradient-to-br from-rose-400 to-red-600 border-2 border-rose-300 shadow-rose-500/40'
                              : 'bg-gradient-to-br from-amber-300 to-yellow-500 border-2 border-amber-200 shadow-amber-500/40'
                          } ${isWinning ? 'ring-4 ring-white animate-bounce scale-105' : ''}`}
                        />
                      )}
                      {!cell && hoverCol === c && winner === null && (!isAiMode || turn === 'R') && (
                        <div className="w-[85%] h-[85%] rounded-full bg-rose-500/20 border border-rose-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Winning Banner Overlay */}
          {winner && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="text-2xl font-black mb-1">
                {winner === 'R' ? (
                  <span className="text-rose-400">Rot triumphiert! 🎉</span>
                ) : winner === 'Y' ? (
                  <span className="text-amber-400">
                    {isAiMode ? 'Computer gewinnt!' : 'Gelb triumphiert!'}
                  </span>
                ) : (
                  <span className="text-slate-300">Unentschieden!</span>
                )}
              </div>
              <p className="text-xs text-slate-300 mb-4">
                {winner === 'R'
                  ? 'Klasse Taktik! 4 in einer Reihe verbunden.'
                  : winner === 'Y'
                  ? 'Gute Runde, probiere es gleich nochmal!'
                  : 'Keine Züge mehr frei.'}
              </p>
              <button
                type="button"
                onClick={handleRestart}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nächste Runde</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Difficulty Selector if in Bot Mode */}
        {isAiMode && (
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <span className="text-[11px]">Schwierigkeit:</span>
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setAiDifficulty(diff)}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors text-[11px] cursor-pointer ${
                  aiDifficulty === diff
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {diff === 'easy' ? 'Leicht' : diff === 'medium' ? 'Normal' : 'Profi'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="text-[11px] text-slate-400 text-center mt-2 shrink-0 sm:hidden">
        Klicke oder tippe auf eine Spalte, um deinen Chip einzuwerfen.
      </div>

      {/* Laptop Keyboard Controls Helper */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60 w-full max-w-lg shrink-0">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">1-7</kbd> oder <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">← →</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">Leertaste / ↓</kbd> Einwerfen
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">Z</kbd> Zurück
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">R</kbd> Neustart
        </span>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Trophy,
  Users,
  Bot,
} from 'lucide-react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';

interface PongGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 70;
const BALL_RADIUS = 6;
const WINNING_SCORE = 7;

export const PongGame: React.FC<PongGameProps> = ({
  onBack,
  soundEnabled = true,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<'1p' | '2p'>('1p');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [highScore, setHighScore] = useState(() => getGameStats('pong').highScore);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  // Game internal physics state refs (to avoid stutter during 60fps animation)
  const p1YRef = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const p2YRef = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const ballRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 4.5,
    vy: 2.5,
    speed: 5,
  });
  const rallyRef = useRef(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);
  const startTimeRef = useRef<number>(Date.now());

  const resetBall = useCallback((towardsP2: boolean) => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: (towardsP2 ? 4 : -4),
      vy: (Math.random() * 4 - 2),
      speed: 4.5,
    };
    rallyRef.current = 0;
  }, []);

  const spawnHitParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color,
      });
    }
  };

  const startGame = useCallback(() => {
    p1YRef.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    p2YRef.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    setScore1(0);
    setScore2(0);
    setWinner(null);
    resetBall(Math.random() > 0.5);
    setGameState('playing');
    startTimeRef.current = Date.now();
    onRestart?.();
  }, [onRestart, resetBall]);

  // Main 60fps game loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. UPDATE PHYSICS if playing
      if (gameState === 'playing') {
        const p1Speed = 6;
        const p2Speed = 6;

        // Player 1 input (W / S, or ArrowUp/Down in 1P mode)
        if (keysRef.current['KeyW'] || (mode === '1p' && keysRef.current['ArrowUp'])) {
          p1YRef.current = Math.max(0, p1YRef.current - p1Speed);
        }
        if (keysRef.current['KeyS'] || (mode === '1p' && keysRef.current['ArrowDown'])) {
          p1YRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p1YRef.current + p1Speed);
        }

        // Player 2 input (2P: ArrowUp / ArrowDown, 1P: AI Bot)
        if (mode === '2p') {
          if (keysRef.current['ArrowUp']) {
            p2YRef.current = Math.max(0, p2YRef.current - p2Speed);
          }
          if (keysRef.current['ArrowDown']) {
            p2YRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p2YRef.current + p2Speed);
          }
        } else {
          // AI Paddle Movement
          const targetY = ballRef.current.y - PADDLE_HEIGHT / 2;
          const aiSpeed = aiDifficulty === 'easy' ? 3.2 : aiDifficulty === 'medium' ? 4.6 : 5.8;
          const errorMargin = aiDifficulty === 'easy' ? 18 : aiDifficulty === 'medium' ? 8 : 2;

          if (Math.abs(p2YRef.current - targetY) > errorMargin) {
            if (p2YRef.current < targetY) {
              p2YRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p2YRef.current + aiSpeed);
            } else {
              p2YRef.current = Math.max(0, p2YRef.current - aiSpeed);
            }
          }
        }

        // Ball movement
        const ball = ballRef.current;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Top / Bottom wall bounce
        if (ball.y - BALL_RADIUS <= 0) {
          ball.y = BALL_RADIUS;
          ball.vy = -ball.vy;
          playSound('click', isMuted);
          spawnHitParticles(ball.x, ball.y, '#38bdf8');
        } else if (ball.y + BALL_RADIUS >= CANVAS_HEIGHT) {
          ball.y = CANVAS_HEIGHT - BALL_RADIUS;
          ball.vy = -ball.vy;
          playSound('click', isMuted);
          spawnHitParticles(ball.x, ball.y, '#38bdf8');
        }

        // Left Paddle Collision (P1)
        const p1Left = 20;
        const p1Right = 20 + PADDLE_WIDTH;
        if (
          ball.x - BALL_RADIUS <= p1Right &&
          ball.x + BALL_RADIUS >= p1Left &&
          ball.y >= p1YRef.current &&
          ball.y <= p1YRef.current + PADDLE_HEIGHT
        ) {
          // Calculate bounce angle based on where ball hits paddle
          const hitOffset = (ball.y - (p1YRef.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          ball.speed = Math.min(10, ball.speed + 0.25);
          const angle = hitOffset * (Math.PI / 3); // Max 60 deg
          ball.vx = Math.abs(Math.cos(angle) * ball.speed);
          ball.vy = Math.sin(angle) * ball.speed;
          ball.x = p1Right + BALL_RADIUS;
          rallyRef.current += 1;
          playSound('click', isMuted);
          spawnHitParticles(p1Right, ball.y, '#38bdf8');
        }

        // Right Paddle Collision (P2 / AI)
        const p2Left = CANVAS_WIDTH - 20 - PADDLE_WIDTH;
        const p2Right = CANVAS_WIDTH - 20;
        if (
          ball.x + BALL_RADIUS >= p2Left &&
          ball.x - BALL_RADIUS <= p2Right &&
          ball.y >= p2YRef.current &&
          ball.y <= p2YRef.current + PADDLE_HEIGHT
        ) {
          const hitOffset = (ball.y - (p2YRef.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          ball.speed = Math.min(10, ball.speed + 0.25);
          const angle = hitOffset * (Math.PI / 3);
          ball.vx = -Math.abs(Math.cos(angle) * ball.speed);
          ball.vy = Math.sin(angle) * ball.speed;
          ball.x = p2Left - BALL_RADIUS;
          rallyRef.current += 1;
          playSound('click', isMuted);
          spawnHitParticles(p2Left, ball.y, '#f43f5e');
        }

        // Goal Check
        if (ball.x < 0) {
          // P2 scores
          const newP2Score = score2 + 1;
          setScore2(newP2Score);
          playSound('gameover', isMuted);
          if (newP2Score >= WINNING_SCORE) {
            setWinner('p2');
            setGameState('gameover');
          } else {
            resetBall(true);
          }
        } else if (ball.x > CANVAS_WIDTH) {
          // P1 scores
          const newP1Score = score1 + 1;
          setScore1(newP1Score);
          playSound('score', isMuted);
          if (newP1Score >= WINNING_SCORE) {
            setWinner('p1');
            setGameState('gameover');
            playSound('win', isMuted);
            const timeSpent = (Date.now() - startTimeRef.current) / 1000;
            const pts = (newP1Score - score2) * 50 + 100;
            const res = saveGameResult('pong', pts, timeSpent);
            if (res.isNewHighscore) setHighScore(res.stats.highScore);
          } else {
            resetBall(false);
          }
        }

        // Update particles
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.04;
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      }

      // 2. RENDER
      // Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dashed line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center circle
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 40, 0, Math.PI * 2);
      ctx.stroke();

      // Draw P1 Paddle (Blue)
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.fillRect(20, p1YRef.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw P2 Paddle (Rose)
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 10;
      ctx.fillRect(CANVAS_WIDTH - 20 - PADDLE_WIDTH, p2YRef.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw Ball with glow
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1.0;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [aiDifficulty, gameState, isMuted, mode, resetBall, score1, score2]);

  // Keyboard controls for Laptop / Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', ' '].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;

      if (e.code === 'Space') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        else if (gameState === 'idle' || gameState === 'gameover') startGame();
      } else if (e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
      } else if (e.key === 'r' || e.key === 'R') {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame]);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-between text-slate-100 select-none">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl shrink-0 gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zurück zum Menü"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm bg-gradient-to-r from-sky-400 to-rose-400 bg-clip-text text-transparent">
            Retro Pong
          </span>
        </div>

        {/* Mode & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-xl font-mono text-sm font-black">
            <span className="text-sky-400">{score1}</span>
            <span className="text-slate-600">:</span>
            <span className="text-rose-400">{score2}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{highScore}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
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

      {/* Mode & Difficulty Selector */}
      <div className="w-full max-w-xl flex items-center justify-between px-2 mb-1.5 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setMode('1p');
              startGame();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === '1p' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Gegen KI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('2p');
              startGame();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === '2p' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>2 Spieler</span>
          </button>
        </div>

        {mode === '1p' && (
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setAiDifficulty(diff)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  aiDifficulty === diff
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff === 'easy' ? 'Leicht' : diff === 'medium' ? 'Normal' : 'Profi'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Game Arena */}
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative">
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950 max-w-[min(500px,40vh)] aspect-[3/2] w-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain"
          />

          {/* Idle / Gameover / Pause Overlays */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
              <div className="text-2xl font-black text-sky-400 mb-1">Retro Pong</div>
              <p className="text-xs text-slate-300 mb-4 max-w-xs">
                Erster mit {WINNING_SCORE} Punkten gewinnt das Match!
              </p>
              <button
                type="button"
                onClick={startGame}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Spiel starten</span>
              </button>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
              <div className="text-xl font-black text-amber-400 mb-2">Spiel pausiert</div>
              <button
                type="button"
                onClick={() => setGameState('playing')}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Fortsetzen</span>
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in">
              <div className="text-2xl font-black mb-1">
                {winner === 'p1' ? (
                  <span className="text-sky-400">
                    {mode === '1p' ? '🎉 Sieg!' : '🎉 Spieler 1 gewinnt!'}
                  </span>
                ) : (
                  <span className="text-rose-400">
                    {mode === '1p' ? 'KI gewinnt!' : '🎉 Spieler 2 gewinnt!'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mb-4 font-mono">
                Endstand: {score1} : {score2}
              </p>
              <button
                type="button"
                onClick={startGame}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nochmal spielen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Keyboard Helper */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60 w-full max-w-xl shrink-0">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-sky-300">W / S</kbd> {mode === '2p' ? 'P1 Schläger' : 'Schläger'}
        </span>
        {mode === '2p' && (
          <>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-rose-300">↑ / ↓</kbd> P2 Schläger
            </span>
          </>
        )}
        {mode === '1p' && (
          <span className="text-slate-400 text-[11px]">(oder <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">↑ / ↓</kbd>)</span>
        )}
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">Leertaste / P</kbd> Pause
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">R</kbd> Neustart
        </span>
      </div>

      {/* Mobile Touch Controls */}
      <div className="sm:hidden w-full flex justify-between items-center px-4 mt-2 shrink-0">
        <div className="flex gap-2">
          <button
            type="button"
            onPointerDown={() => { keysRef.current['KeyW'] = true; }}
            onPointerUp={() => { keysRef.current['KeyW'] = false; }}
            className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-sky-600 font-bold text-lg flex items-center justify-center border border-slate-700 shadow"
          >
            ↑
          </button>
          <button
            type="button"
            onPointerDown={() => { keysRef.current['KeyS'] = true; }}
            onPointerUp={() => { keysRef.current['KeyS'] = false; }}
            className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-sky-600 font-bold text-lg flex items-center justify-center border border-slate-700 shadow"
          >
            ↓
          </button>
        </div>

        {mode === '2p' && (
          <div className="flex gap-2">
            <button
              type="button"
              onPointerDown={() => { keysRef.current['ArrowUp'] = true; }}
              onPointerUp={() => { keysRef.current['ArrowUp'] = false; }}
              className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-rose-600 font-bold text-lg flex items-center justify-center border border-slate-700 shadow"
            >
              ↑
            </button>
            <button
              type="button"
              onPointerDown={() => { keysRef.current['ArrowDown'] = true; }}
              onPointerUp={() => { keysRef.current['ArrowDown'] = false; }}
              className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-rose-600 font-bold text-lg flex items-center justify-center border border-slate-700 shadow"
            >
              ↓
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

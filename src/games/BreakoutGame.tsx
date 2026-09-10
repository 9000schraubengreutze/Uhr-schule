import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Heart,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';

interface BreakoutGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
}

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_COLORS = ['#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4'];
const BRICK_POINTS = [50, 40, 30, 20, 10];

export const BreakoutGame: React.FC<BreakoutGameProps> = ({
  onBack,
  soundEnabled = true,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [highScore, setHighScore] = useState(() => getGameStats('breakout').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  const startTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number | null>(null);

  // Game physics state refs to avoid closure staleness in animation loop
  const paddleRef = useRef({ x: 160, width: 80, height: 12 });
  const ballRef = useRef({ x: 200, y: 300, vx: 3.5, vy: -4, radius: 6 });
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysPressedRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Init bricks
  const initBricks = useCallback(() => {
    const bricks: Brick[] = [];
    const brickW = 42;
    const brickH = 14;
    const padding = 6;
    const offsetTop = 40;
    const offsetLeft = 11;

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: offsetLeft + c * (brickW + padding),
          y: offsetTop + r * (brickH + padding),
          width: brickW,
          height: brickH,
          color: BRICK_COLORS[r],
          points: BRICK_POINTS[r],
          alive: true,
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  // Reset ball to paddle
  const resetBall = useCallback(() => {
    paddleRef.current.x = 200 - paddleRef.current.width / 2;
    ballRef.current.x = 200;
    ballRef.current.y = 360;
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // slight tilt
    const speed = 4.5;
    ballRef.current.vx = speed * Math.sin(angle);
    ballRef.current.vy = -speed * Math.cos(angle);
  }, []);

  // Full game restart
  const handleStartOrReset = useCallback(() => {
    initBricks();
    resetBall();
    particlesRef.current = [];
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setHasWon(false);
    setIsStarted(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    onRestart?.();
  }, [initBricks, resetBall, onRestart]);

  // Create burst particles on brick hit
  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressedRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressedRef.current.right = true;
      } else if (e.key === ' ' || e.code === 'Space') {
        if (!isStarted || isGameOver || hasWon) {
          handleStartOrReset();
        } else {
          setIsPaused((p) => !p);
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (isStarted && !isGameOver && !hasWon) {
          setIsPaused((p) => !p);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        handleStartOrReset();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressedRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressedRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isStarted, isGameOver, hasWon, handleStartOrReset]);

  // Initialize on mount
  useEffect(() => {
    initBricks();
    resetBall();
  }, [initBricks, resetBall]);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localScore = score;
    let localLives = lives;

    const gameWidth = 400;
    const gameHeight = 440;

    const render = () => {
      if (isStarted && !isPaused && !isGameOver && !hasWon) {
        // 1. Move Paddle with keyboard
        const paddleSpeed = 6;
        if (keysPressedRef.current.left) {
          paddleRef.current.x = Math.max(0, paddleRef.current.x - paddleSpeed);
        }
        if (keysPressedRef.current.right) {
          paddleRef.current.x = Math.min(
            gameWidth - paddleRef.current.width,
            paddleRef.current.x + paddleSpeed
          );
        }

        // 2. Move Ball
        const ball = ballRef.current;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce walls
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
          playSound('move', isMuted);
        } else if (ball.x + ball.radius >= gameWidth) {
          ball.x = gameWidth - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          playSound('move', isMuted);
        }

        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          playSound('move', isMuted);
        }

        // Ball falls off bottom
        if (ball.y - ball.radius > gameHeight) {
          localLives -= 1;
          setLives(localLives);
          playSound('bomb', isMuted);

          if (localLives <= 0) {
            setIsGameOver(true);
            const timeSpent = (Date.now() - startTimeRef.current) / 1000;
            const res = saveGameResult('breakout', localScore, timeSpent);
            if (res.isNewHighscore) setHighScore(res.stats.highScore);
            return;
          } else {
            resetBall();
          }
        }

        // Paddle Collision
        const paddle = paddleRef.current;
        if (
          ball.y + ball.radius >= gameHeight - 35 &&
          ball.y - ball.radius <= gameHeight - 35 + paddle.height &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.width &&
          ball.vy > 0
        ) {
          // Calculate bounce angle based on where ball hits paddle
          const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          const maxAngle = (70 * Math.PI) / 180;
          const bounceAngle = hitPoint * maxAngle;
          const currentSpeed = Math.min(8, Math.hypot(ball.vx, ball.vy) + 0.08); // Slight speed up

          ball.vx = currentSpeed * Math.sin(bounceAngle);
          ball.vy = -currentSpeed * Math.cos(bounceAngle);
          ball.y = gameHeight - 35 - ball.radius;
          playSound('jump', isMuted);
        }

        // Bricks Collision
        let bricksLeft = 0;
        bricksRef.current.forEach((brick) => {
          if (!brick.alive) return;
          bricksLeft++;

          if (
            ball.x + ball.radius >= brick.x &&
            ball.x - ball.radius <= brick.x + brick.width &&
            ball.y + ball.radius >= brick.y &&
            ball.y - ball.radius <= brick.y + brick.height
          ) {
            brick.alive = false;
            localScore += brick.points;
            setScore(localScore);
            createExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
            playSound('score', isMuted);

            // Determine collision side
            const prevX = ball.x - ball.vx;
            if (prevX < brick.x || prevX > brick.x + brick.width) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }
          }
        });

        // Check Victory
        if (bricksLeft === 0) {
          setHasWon(true);
          playSound('win', isMuted);
          const timeSpent = (Date.now() - startTimeRef.current) / 1000;
          const bonus = localLives * 100;
          const finalScore = localScore + bonus;
          setScore(finalScore);
          const res = saveGameResult('breakout', finalScore, timeSpent);
          if (res.isNewHighscore) setHighScore(res.stats.highScore);
          return;
        }

        // Update particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }
      }

      // DRAWING
      ctx.clearRect(0, 0, gameWidth, gameHeight);

      // Background subtle grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, gameWidth, gameHeight);

      // Bricks
      bricksRef.current.forEach((brick) => {
        if (!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
        ctx.fill();

        // Brick top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(brick.x, brick.y, brick.width, 2);
      });

      // Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Paddle
      const paddle = paddleRef.current;
      const paddleGradient = ctx.createLinearGradient(
        paddle.x,
        gameHeight - 35,
        paddle.x + paddle.width,
        gameHeight - 35
      );
      paddleGradient.addColorStop(0, '#38bdf8');
      paddleGradient.addColorStop(0.5, '#60a5fa');
      paddleGradient.addColorStop(1, '#818cf8');
      ctx.fillStyle = paddleGradient;
      ctx.beginPath();
      ctx.roundRect(paddle.x, gameHeight - 35, paddle.width, paddle.height, 6);
      ctx.fill();

      // Ball
      const ball = ballRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isStarted, isPaused, isGameOver, hasWon, isMuted, resetBall, score, lives]);

  // Touch / Mouse paddle control on Canvas
  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const mouseX = (clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(
      0,
      Math.min(400 - paddleRef.current.width, mouseX - paddleRef.current.width / 2)
    );
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-between text-slate-100 select-none">
      {/* Top Controls Bar */}
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
          <span className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Breakout
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase">Score</span>
            <span className="font-bold text-cyan-300">{score}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{highScore}</span>
          </div>

          {/* Lives */}
          <div className="flex items-center gap-1 text-rose-500">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {isStarted && !isGameOver && !hasWon && (
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isPaused ? 'Fortsetzen' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
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
            onClick={handleStartOrReset}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Neustart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-md min-h-0">
        <canvas
          ref={canvasRef}
          width={400}
          height={440}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          className="w-full max-w-[min(360px,42vh)] aspect-[400/440] bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl touch-none cursor-pointer"
        />

        {/* Ready Overlay */}
        {!isStarted && (
          <div className="absolute inset-0 max-w-[360px] sm:max-w-[400px] mx-auto bg-slate-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-xl font-black text-cyan-400 mb-2">BRICK BREAKER</div>
            <p className="text-xs text-slate-300 max-w-xs mb-4">
              Steuere den Schläger mit Pfeiltasten, Maus oder Touch und zerstöre alle Steine!
            </p>
            <button
              type="button"
              onClick={handleStartOrReset}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Spiel starten</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 max-w-[360px] sm:max-w-[400px] mx-auto bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-2xl font-black text-rose-500 mb-1">Game Over</div>
            <div className="text-xs text-slate-400 mb-3">Alle Bälle verloren</div>
            <div className="text-sm font-mono text-cyan-400 font-bold mb-4">
              Punkte: {score} | Rekord: {highScore}
            </div>
            <button
              type="button"
              onClick={handleStartOrReset}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nochmal spielen</span>
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {hasWon && (
          <div className="absolute inset-0 max-w-[360px] sm:max-w-[400px] mx-auto bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-2xl font-black text-emerald-400 mb-1">Gewonnen! 🎉</div>
            <div className="text-xs text-slate-300 mb-3">
              Alle Steine geräumt! +{lives * 100} Lebens-Bonus
            </div>
            <div className="text-lg font-mono text-amber-300 font-bold mb-4">Score: {score}</div>
            <button
              type="button"
              onClick={handleStartOrReset}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Neue Runde</span>
            </button>
          </div>
        )}

        {/* Paused Overlay */}
        {isPaused && !isGameOver && !hasWon && (
          <div className="absolute inset-0 max-w-[360px] sm:max-w-[400px] mx-auto bg-slate-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="text-lg font-bold text-slate-200 mb-3">Pausiert</div>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Weiter
            </button>
          </div>
        )}
      </div>

      {/* Mobile touch paddle controls */}
      <div className="w-full max-w-md flex items-center justify-between gap-3 px-3 py-1.5 mt-2 shrink-0 sm:hidden">
        <button
          type="button"
          onTouchStart={() => (keysPressedRef.current.left = true)}
          onTouchEnd={() => (keysPressedRef.current.left = false)}
          onMouseDown={() => (keysPressedRef.current.left = true)}
          onMouseUp={() => (keysPressedRef.current.left = false)}
          className="flex-1 py-3 bg-slate-800/80 active:bg-blue-600/50 border border-slate-700/80 rounded-2xl flex items-center justify-center text-slate-200 active:text-white select-none transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          onTouchStart={() => (keysPressedRef.current.right = true)}
          onTouchEnd={() => (keysPressedRef.current.right = false)}
          onMouseDown={() => (keysPressedRef.current.right = true)}
          onMouseUp={() => (keysPressedRef.current.right = false)}
          className="flex-1 py-3 bg-slate-800/80 active:bg-blue-600/50 border border-slate-700/80 rounded-2xl flex items-center justify-center text-slate-200 active:text-white select-none transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Footer Instructions Hint for Laptop/Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60 w-full max-w-md shrink-0">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">← → / AD / Maus</kbd> Bewegen
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">Leertaste / P</kbd> Pause
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">R</kbd> Neustart
        </span>
      </div>
    </div>
  );
};

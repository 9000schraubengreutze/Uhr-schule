import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import { RotateCcw, Volume2, VolumeX, Play } from 'lucide-react';

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 440;
const GRAVITY = 0.28;
const JUMP_FORCE = -5.8;
const PIPE_SPEED = 2.0;
const PIPE_GAP = 120;
const PIPE_WIDTH = 52;
const BIRD_SIZE = 24;

interface FlappyBirdGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onBack, soundEnabled = true, onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getGameStats('flappy').highScore);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  const birdYRef = useRef(CANVAS_HEIGHT / 2);
  const birdVelocityRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  // Jump action
  const jump = useCallback(() => {
    if (gameState === 'ready') {
      setGameState('playing');
      startTimeRef.current = Date.now();
      birdVelocityRef.current = JUMP_FORCE;
      playSound('jump', isMuted);
    } else if (gameState === 'playing') {
      birdVelocityRef.current = JUMP_FORCE;
      playSound('jump', isMuted);
    }
  }, [gameState, isMuted]);

  // Reset
  const resetGame = useCallback(() => {
    birdYRef.current = CANVAS_HEIGHT / 2;
    birdVelocityRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameState('ready');
    onRestart?.();
  }, [onRestart]);

  // Main game animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      // Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle background grid stars / particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let i = 0; i < 15; i++) {
        const sx = ((i * 47) + frameCount * 0.2) % CANVAS_WIDTH;
        const sy = (i * 31) % (CANVAS_HEIGHT - 60);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Ground bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, CANVAS_HEIGHT - 32, CANVAS_WIDTH, 2);

      if (gameState === 'playing') {
        frameCount++;

        // Update bird physics
        birdVelocityRef.current += GRAVITY;
        birdYRef.current += birdVelocityRef.current;

        // Spawn pipes every ~100 frames
        if (frameCount % 105 === 0) {
          const minH = 50;
          const maxH = CANVAS_HEIGHT - 30 - PIPE_GAP - minH;
          const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
          pipesRef.current.push({
            x: CANVAS_WIDTH,
            topHeight: topH,
            bottomY: topH + PIPE_GAP,
            passed: false,
          });
        }

        // Update and draw pipes
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const pipe = pipesRef.current[i];
          pipe.x -= PIPE_SPEED;

          // Draw Top Pipe
          const gradTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
          gradTop.addColorStop(0, '#0284c7');
          gradTop.addColorStop(0.5, '#38bdf8');
          gradTop.addColorStop(1, '#0369a1');
          ctx.fillStyle = gradTop;
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
          // Pipe cap
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(pipe.x - 3, pipe.topHeight - 16, PIPE_WIDTH + 6, 16);

          // Draw Bottom Pipe
          const bottomH = CANVAS_HEIGHT - 30 - pipe.bottomY;
          const gradBottom = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
          gradBottom.addColorStop(0, '#0284c7');
          gradBottom.addColorStop(0.5, '#38bdf8');
          gradBottom.addColorStop(1, '#0369a1');
          ctx.fillStyle = gradBottom;
          ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, bottomH);
          // Pipe cap
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(pipe.x - 3, pipe.bottomY, PIPE_WIDTH + 6, 16);

          // Check score pass
          const birdX = 60;
          if (!pipe.passed && pipe.x + PIPE_WIDTH < birdX) {
            pipe.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            playSound('score', isMuted);
            if (scoreRef.current > highScore) {
              setHighScore(scoreRef.current);
            }
          }

          // Check pipe collision
          if (
            birdX + BIRD_SIZE / 2 > pipe.x &&
            birdX - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH
          ) {
            if (
              birdYRef.current - BIRD_SIZE / 2 < pipe.topHeight ||
              birdYRef.current + BIRD_SIZE / 2 > pipe.bottomY
            ) {
              // Hit pipe!
              setGameState('gameover');
              playSound('gameover', isMuted);
              const timeSpent = (Date.now() - startTimeRef.current) / 1000;
              saveGameResult('flappy', scoreRef.current, timeSpent);
            }
          }

          // Remove off-screen pipes
          if (pipe.x + PIPE_WIDTH < -10) {
            pipesRef.current.splice(i, 1);
          }
        }

        // Floor / ceiling collision
        if (birdYRef.current + BIRD_SIZE / 2 >= CANVAS_HEIGHT - 30) {
          birdYRef.current = CANVAS_HEIGHT - 30 - BIRD_SIZE / 2;
          setGameState('gameover');
          playSound('gameover', isMuted);
          const timeSpent = (Date.now() - startTimeRef.current) / 1000;
          saveGameResult('flappy', scoreRef.current, timeSpent);
        }
        if (birdYRef.current - BIRD_SIZE / 2 <= 0) {
          birdYRef.current = BIRD_SIZE / 2;
          birdVelocityRef.current = 0;
        }
      }

      // Draw Bird
      const birdX = 60;
      const birdY = birdYRef.current;
      ctx.save();
      ctx.translate(birdX, birdY);
      // Tilt bird based on velocity
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVelocityRef.current * 0.08));
      ctx.rotate(angle);

      // Bird body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(5.5, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(7, -1);
      ctx.lineTo(15, 2);
      ctx.lineTo(7, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, highScore, isMuted]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

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

      {/* Canvas Area */}
      <div
        className="relative bg-slate-950 border-2 border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden cursor-pointer touch-none"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        onClick={jump}
        onTouchStart={(e) => {
          e.preventDefault();
          jump();
        }}
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
            <div className="text-xl font-extrabold text-amber-400 mb-1">Flappy Bird</div>
            <div className="text-xs text-slate-200 mb-4">
              Tippe auf den Bildschirm oder drücke die Leertaste zum Fliegen!
            </div>
            <div className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2">
              <Play className="w-4 h-4 fill-white" />
              <span>Starten</span>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
            <div className="text-2xl font-extrabold text-rose-400 mb-1">Abgestürzt!</div>
            <div className="text-xs text-slate-300 mb-4">
              Punkte: <span className="font-mono text-cyan-400 font-bold">{score}</span> | Rekord:{' '}
              <span className="font-mono text-amber-400 font-bold">{highScore}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Nochmal fliegen
            </button>
          </div>
        )}
      </div>

      {/* Bottom Control Hint */}
      <div className="w-full max-w-xs mt-3 pt-2 text-center text-xs text-slate-400 border-t border-slate-800/60">
        Tippen / Leertaste zum Flattern
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { ParticleEffect } from '../types';

interface ParticleBackgroundProps {
  effect: ParticleEffect;
  intensity: number; // 10 to 100
  color: string; // Hex color string
  speed?: number; // 1 to 5 (default 2)
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  swayAngle: number;
  swaySpeed: number;
  pulsePhase: number;
  pulseSpeed: number;
  length?: number; // For rain
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || '#ffffff').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  effect,
  intensity,
  color,
  speed = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effect === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;

    // Parse color
    const rgb = hexToRgb(color);
    const speedFactor = Math.max(0.4, Math.min(3.0, (speed || 2) * 0.5));
    const intensityClamped = Math.max(10, Math.min(100, intensity || 50));

    // Handle high DPI
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Calculate particle count according to resolution and intensity
    const area = width * height;
    const baseDensity = effect === 'rain' ? 22000 : 16000;
    const computedCount = Math.round(
      (area / baseDensity) * (intensityClamped / 50)
    );
    const particleCount = Math.max(15, Math.min(220, computedCount));

    // Initialize particles
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      let vx = 0;
      let vy = 0;
      let radius = 2;
      let baseAlpha = 0.5;
      let length = 10;

      if (effect === 'snow') {
        radius = 1.2 + Math.random() * 2.8;
        vy = (0.5 + Math.random() * 1.3) * speedFactor;
        vx = (Math.random() - 0.5) * 0.4;
        baseAlpha = 0.35 + Math.random() * 0.55;
      } else if (effect === 'dust') {
        radius = 0.9 + Math.random() * 2.2;
        vx = (Math.random() - 0.5) * 0.35 * speedFactor;
        vy = (Math.random() - 0.5) * 0.35 * speedFactor;
        baseAlpha = 0.25 + Math.random() * 0.5;
      } else if (effect === 'stars') {
        radius = 0.8 + Math.random() * 2.0;
        vx = (Math.random() - 0.5) * 0.05 * speedFactor;
        vy = (Math.random() - 0.5) * 0.05 * speedFactor;
        baseAlpha = 0.3 + Math.random() * 0.6;
      } else if (effect === 'rain') {
        radius = 1.0;
        vy = (8 + Math.random() * 7) * speedFactor;
        vx = -1.2 * speedFactor;
        length = 10 + Math.random() * 18;
        baseAlpha = 0.25 + Math.random() * 0.45;
      } else if (effect === 'bubbles') {
        radius = 2.0 + Math.random() * 4.5;
        vy = -(0.5 + Math.random() * 1.1) * speedFactor;
        vx = (Math.random() - 0.5) * 0.3;
        baseAlpha = 0.25 + Math.random() * 0.4;
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        radius,
        baseAlpha,
        alpha: baseAlpha,
        swayAngle: Math.random() * Math.PI * 2,
        swaySpeed: 0.01 + Math.random() * 0.025,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.03,
        length,
      });
    }

    let lastTime = performance.now();

    // Render loop
    const render = (time: number) => {
      if (!isRunning) return;

      const dt = Math.min((time - lastTime) / 16.67, 2.5);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const colorPrefix = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b},`;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (effect === 'snow') {
          p.swayAngle += p.swaySpeed * dt * speedFactor;
          p.x += (p.vx + Math.sin(p.swayAngle) * 0.7) * dt;
          p.y += p.vy * dt;

          if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Draw snowflake with subtle soft edge
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${colorPrefix} ${p.alpha})`;
          ctx.fill();
        } else if (effect === 'dust') {
          p.pulsePhase += p.pulseSpeed * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Gentle bounce/wrap
          if (p.x < 0) p.x = width;
          else if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          else if (p.y > height) p.y = 0;

          // Smooth pulse
          const pulse = (Math.sin(p.pulsePhase) + 1) * 0.5;
          p.alpha = p.baseAlpha * (0.4 + 0.6 * pulse);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${colorPrefix} ${p.alpha})`;
          ctx.fill();
        } else if (effect === 'stars') {
          p.pulsePhase += p.pulseSpeed * 1.5 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const twinkle = Math.pow((Math.sin(p.pulsePhase) + 1) * 0.5, 2);
          p.alpha = p.baseAlpha * (0.2 + 0.8 * twinkle);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${colorPrefix} ${p.alpha})`;
          ctx.fill();

          // Subtle diamond sparkle for larger twinkling stars
          if (p.radius > 2.0 && twinkle > 0.85) {
            const sparkleLen = p.radius * 2.4;
            ctx.beginPath();
            ctx.moveTo(p.x - sparkleLen, p.y);
            ctx.lineTo(p.x + sparkleLen, p.y);
            ctx.moveTo(p.x, p.y - sparkleLen);
            ctx.lineTo(p.x, p.y + sparkleLen);
            ctx.strokeStyle = `${colorPrefix} ${p.alpha * 0.6})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        } else if (effect === 'rain') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          if (p.y > height + (p.length || 15)) {
            p.y = -(p.length || 15);
            p.x = Math.random() * (width + 100);
          }
          if (p.x < -20) p.x = width + 20;

          const len = p.length || 14;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (p.vx / p.vy) * len, p.y + len);
          ctx.strokeStyle = `${colorPrefix} ${p.alpha})`;
          ctx.lineWidth = 1.0;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else if (effect === 'bubbles') {
          p.swayAngle += p.swaySpeed * dt;
          p.x += (p.vx + Math.sin(p.swayAngle) * 0.4) * dt;
          p.y += p.vy * dt;

          if (p.y < -p.radius * 2) {
            p.y = height + p.radius * 2;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Glowing bubble circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${colorPrefix} ${p.alpha * 0.35})`;
          ctx.fill();
          ctx.strokeStyle = `${colorPrefix} ${p.alpha * 0.8})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Pause when page is hidden to preserve battery & CPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (!isRunning) {
          isRunning = true;
          lastTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effect, intensity, color, speed]);

  if (effect === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      id="particles-background-canvas"
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-[2] select-none"
    />
  );
};

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
  rotation: number;
  rotationSpeed: number;
  swayAngle: number;
  swaySpeed: number;
  driftAngleX: number;
  driftAngleY: number;
  pulsePhase: number;
  pulseSpeed: number;
  // Unique characteristics for specific particle types
  particleSubtype: 'crystal' | 'fluffy' | 'speck' | 'mote' | 'fiber' | 'star' | 'bubble';
  length?: number;
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
    const speedFactor = Math.max(0.35, Math.min(3.0, (speed || 2) * 0.5));
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
    const baseDensity = effect === 'rain' ? 22000 : 15000;
    const computedCount = Math.round(
      (area / baseDensity) * (intensityClamped / 50)
    );
    const particleCount = Math.max(16, Math.min(240, computedCount));

    // Initialize particles
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      let vx = 0;
      let vy = 0;
      let radius = 2;
      let baseAlpha = 0.5;
      let subtype: Particle['particleSubtype'] = 'speck';
      let length = 10;

      if (effect === 'snow') {
        // Snow has 3 subtypes: 6-arm ice crystals, fluffy flakes, and round pellets
        const rand = Math.random();
        if (rand < 0.4) {
          subtype = 'crystal'; // Hexagonal rotating snowflake crystal
          radius = 3.2 + Math.random() * 3.5;
          baseAlpha = 0.5 + Math.random() * 0.45;
        } else if (rand < 0.75) {
          subtype = 'fluffy'; // Soft fluffy snow puff with halo
          radius = 2.5 + Math.random() * 3.2;
          baseAlpha = 0.35 + Math.random() * 0.45;
        } else {
          subtype = 'speck'; // Fine crisp snowflake dot
          radius = 1.2 + Math.random() * 1.6;
          baseAlpha = 0.4 + Math.random() * 0.5;
        }

        // Snow MUST fall clearly downwards with gravity
        vy = (0.75 + Math.random() * 1.5) * speedFactor;
        vx = (Math.random() - 0.5) * 0.3;
      } else if (effect === 'dust') {
        // DUST does NOT fall! It stays suspended and floats in all directions (Brownian motion)
        const rand = Math.random();
        if (rand < 0.35) {
          subtype = 'fiber'; // Microscopic dust lint/fiber
          radius = 1.6 + Math.random() * 2.2;
          baseAlpha = 0.25 + Math.random() * 0.45;
        } else {
          subtype = 'mote'; // Ambient light mote with soft glowing halo
          radius = 1.0 + Math.random() * 2.6;
          baseAlpha = 0.2 + Math.random() * 0.55;
        }

        // Random hovering drift: NO downward bias!
        vx = (Math.random() - 0.5) * 0.3 * speedFactor;
        vy = (Math.random() - 0.5) * 0.25 * speedFactor;
      } else if (effect === 'stars') {
        subtype = 'star';
        radius = 0.8 + Math.random() * 2.2;
        vx = (Math.random() - 0.5) * 0.04 * speedFactor;
        vy = (Math.random() - 0.5) * 0.04 * speedFactor;
        baseAlpha = 0.3 + Math.random() * 0.6;
      } else if (effect === 'rain') {
        subtype = 'speck';
        radius = 1.0;
        vy = (9 + Math.random() * 7) * speedFactor;
        vx = -1.5 * speedFactor;
        length = 12 + Math.random() * 18;
        baseAlpha = 0.25 + Math.random() * 0.45;
      } else if (effect === 'bubbles') {
        subtype = 'bubble';
        radius = 2.5 + Math.random() * 4.5;
        vy = -(0.5 + Math.random() * 1.2) * speedFactor;
        vx = (Math.random() - 0.5) * 0.35;
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
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03 * speedFactor,
        swayAngle: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.02,
        driftAngleX: Math.random() * Math.PI * 2,
        driftAngleY: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.03,
        particleSubtype: subtype,
        length,
      });
    }

    let lastTime = performance.now();
    let globalWindTime = 0;

    // Render loop
    const render = (time: number) => {
      if (!isRunning) return;

      const dt = Math.min((time - lastTime) / 16.67, 2.5);
      lastTime = time;
      globalWindTime += 0.006 * dt;

      ctx.clearRect(0, 0, width, height);

      const colorPrefix = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b},`;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (effect === 'snow') {
          // ==================== SNOW PHYSICS & RENDERING ====================
          // Natural wind drift with oscillating horizontal flutter
          p.swayAngle += p.swaySpeed * dt * speedFactor;
          p.rotation += p.rotationSpeed * dt;

          const windGust = Math.sin(globalWindTime) * 0.6;
          p.x += (p.vx + Math.sin(p.swayAngle) * 1.1 + windGust) * dt;
          p.y += p.vy * dt;

          // Wrap around edges
          if (p.y > height + 15) {
            p.y = -15;
            p.x = Math.random() * width;
          }
          if (p.x < -15) p.x = width + 15;
          if (p.x > width + 15) p.x = -15;

          const drawAlpha = Math.min(1, p.alpha);

          if (p.particleSubtype === 'crystal') {
            // Draw 6-armed crystalline snowflake
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            ctx.strokeStyle = `${colorPrefix} ${drawAlpha * 0.9})`;
            ctx.lineWidth = 1.1;
            ctx.lineCap = 'round';
            ctx.beginPath();

            const r = p.radius;
            // 3 main crossbars = 6 spokes
            for (let a = 0; a < 3; a++) {
              const angle = (a * Math.PI) / 3;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              ctx.moveTo(-cos * r, -sin * r);
              ctx.lineTo(cos * r, sin * r);

              // Tiny decorative branches on larger crystals
              if (r > 4.2) {
                const bDist = r * 0.6;
                const bLen = r * 0.32;
                // Branch 1
                const bx = cos * bDist;
                const by = sin * bDist;
                ctx.moveTo(bx - sin * bLen, by + cos * bLen);
                ctx.lineTo(bx, by);
                ctx.lineTo(bx + sin * bLen, by - cos * bLen);
                // Branch 2 (opposite side)
                ctx.moveTo(-bx - sin * bLen, -by + cos * bLen);
                ctx.lineTo(-bx, -by);
                ctx.lineTo(-bx + sin * bLen, -by - cos * bLen);
              }
            }
            ctx.stroke();

            // Center crystal pip
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0.8, r * 0.22), 0, Math.PI * 2);
            ctx.fillStyle = `${colorPrefix} ${drawAlpha})`;
            ctx.fill();

            ctx.restore();
          } else if (p.particleSubtype === 'fluffy') {
            // Soft fluffy snowflake with gentle radial falloff
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.6);
            grad.addColorStop(0, `${colorPrefix} ${drawAlpha * 0.95})`);
            grad.addColorStop(0.4, `${colorPrefix} ${drawAlpha * 0.6})`);
            grad.addColorStop(1, `${colorPrefix} 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 1.6, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Crisp small snowflake dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${colorPrefix} ${drawAlpha})`;
            ctx.fill();
          }
        } else if (effect === 'dust') {
          // ==================== DUST PHYSICS & RENDERING ====================
          // Dust floats weightlessly with Brownian air currents (curling 2D motion, NOT falling)
          p.driftAngleX += 0.012 * dt * speedFactor;
          p.driftAngleY += 0.009 * dt * speedFactor;
          p.rotation += p.rotationSpeed * 0.6 * dt;

          // Wandering sinusoidal drift
          const wanderX = Math.sin(p.driftAngleX) * 0.45;
          const wanderY = Math.cos(p.driftAngleY) * 0.35;
          p.x += (p.vx + wanderX) * dt;
          p.y += (p.vy + wanderY) * dt;

          // Wrap edges smoothly
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;

          // Sunbeam / room light reflection pulse: dust catches the light then fades
          p.pulsePhase += p.pulseSpeed * 0.8 * dt;
          const lightGlimmer = Math.pow((Math.sin(p.pulsePhase) + 1) * 0.5, 1.8);
          const currentAlpha = p.baseAlpha * (0.2 + 0.8 * lightGlimmer);

          if (p.particleSubtype === 'fiber') {
            // Microscopic floating lint/fiber speck (curved pill line)
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            // Halo around fiber
            const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 2.2);
            haloGrad.addColorStop(0, `${colorPrefix} ${currentAlpha * 0.4})`);
            haloGrad.addColorStop(1, `${colorPrefix} 0)`);
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Tiny elongated fiber
            ctx.strokeStyle = `${colorPrefix} ${currentAlpha * 0.95})`;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-p.radius * 1.4, -p.radius * 0.3);
            ctx.quadraticCurveTo(0, p.radius * 0.5, p.radius * 1.4, -p.radius * 0.2);
            ctx.stroke();

            ctx.restore();
          } else {
            // Illuminated dust mote with wide diffuse ambient glow
            const glowRadius = p.radius * 2.6;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
            grad.addColorStop(0, `${colorPrefix} ${currentAlpha * 1.0})`);
            grad.addColorStop(0.35, `${colorPrefix} ${currentAlpha * 0.5})`);
            grad.addColorStop(1, `${colorPrefix} 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Bright pinhead core
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.6, p.radius * 0.45), 0, Math.PI * 2);
            ctx.fillStyle = `${colorPrefix} ${Math.min(1, currentAlpha * 1.3)})`;
            ctx.fill();
          }
        } else if (effect === 'stars') {
          // ==================== STARS ====================
          p.pulsePhase += p.pulseSpeed * 1.4 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const twinkle = Math.pow((Math.sin(p.pulsePhase) + 1) * 0.5, 2.2);
          const starAlpha = p.baseAlpha * (0.2 + 0.8 * twinkle);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${colorPrefix} ${starAlpha})`;
          ctx.fill();

          // 4-point sparkle cross on brighter twinkling stars
          if (p.radius > 1.6 && twinkle > 0.8) {
            const sparkleLen = p.radius * 2.5;
            ctx.beginPath();
            ctx.moveTo(p.x - sparkleLen, p.y);
            ctx.lineTo(p.x + sparkleLen, p.y);
            ctx.moveTo(p.x, p.y - sparkleLen);
            ctx.lineTo(p.x, p.y + sparkleLen);
            ctx.strokeStyle = `${colorPrefix} ${starAlpha * 0.7})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        } else if (effect === 'rain') {
          // ==================== RAIN ====================
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const len = p.length || 15;
          if (p.y > height + len) {
            p.y = -len;
            p.x = Math.random() * (width + 120);
          }
          if (p.x < -20) p.x = width + 20;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (p.vx / p.vy) * len, p.y + len);
          ctx.strokeStyle = `${colorPrefix} ${p.alpha})`;
          ctx.lineWidth = 1.1;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else if (effect === 'bubbles') {
          // ==================== BUBBLES ====================
          p.swayAngle += p.swaySpeed * dt;
          p.x += (p.vx + Math.sin(p.swayAngle) * 0.45) * dt;
          p.y += p.vy * dt;

          if (p.y < -p.radius * 2) {
            p.y = height + p.radius * 2;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Glowing bubble body
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${colorPrefix} ${p.alpha * 0.3})`;
          ctx.fill();
          ctx.strokeStyle = `${colorPrefix} ${p.alpha * 0.85})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();

          // Specular crescent light reflection inside bubble
          ctx.beginPath();
          ctx.arc(
            p.x - p.radius * 0.3,
            p.y - p.radius * 0.3,
            Math.max(0.6, p.radius * 0.28),
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `${colorPrefix} ${p.alpha * 0.9})`;
          ctx.fill();
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

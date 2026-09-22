import React, { useEffect, useRef } from 'react';
import { AnimatedBgId } from '../types';

interface AnimatedBackgroundCanvasProps {
  effectId: AnimatedBgId;
  speed?: number; // 0.25 to 2.5 (default 1.0)
  intensity?: number; // 20 to 100 (default 80)
  ecoMode?: boolean;
  isMiniPreview?: boolean;
  className?: string;
}

export const AnimatedBackgroundCanvas: React.FC<AnimatedBackgroundCanvasProps> = ({
  effectId,
  speed = 1.0,
  intensity = 80,
  ecoMode = false,
  isMiniPreview = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let isRunning = true;
    let lastTime = performance.now();
    let width = (canvas.width = canvas.clientWidth || (isMiniPreview ? 320 : window.innerWidth));
    let height = (canvas.height = canvas.clientHeight || (isMiniPreview ? 180 : window.innerHeight));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth || (isMiniPreview ? 320 : window.innerWidth);
      height = canvas.height = canvas.clientHeight || (isMiniPreview ? 180 : window.innerHeight);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Effect specific persistent state
    let simTime = 0;

    // --- State: Matrix Rain ---
    const matrixFontSize = isMiniPreview ? 10 : 16;
    let matrixColumns = Math.max(1, Math.floor(width / matrixFontSize));
    let matrixDrops: number[] = Array.from({ length: matrixColumns }, () =>
      Math.floor(Math.random() * -50)
    );
    const matrixChars =
      '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ'.split('');

    // --- State: Warp Speed ---
    const warpCount = isMiniPreview ? 50 : 160;
    const warpStars = Array.from({ length: warpCount }, () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * width,
      pz: 0,
    }));

    // --- State: Sakura Petals ---
    const sakuraCount = isMiniPreview ? 16 : 45;
    const sakuraPetals = Array.from({ length: sakuraCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: (isMiniPreview ? 4 : 8) + Math.random() * (isMiniPreview ? 5 : 10),
      vx: 0.8 + Math.random() * 1.4,
      vy: 0.9 + Math.random() * 1.5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.04,
      flip: Math.random() * Math.PI,
      vflip: 0.02 + Math.random() * 0.03,
      alpha: 0.5 + Math.random() * 0.45,
    }));

    // --- State: Fire Embers ---
    const emberCount = isMiniPreview ? 25 : 80;
    const embers = Array.from({ length: emberCount }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * 20,
      r: (isMiniPreview ? 1 : 1.5) + Math.random() * (isMiniPreview ? 1.5 : 2.5),
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(1.2 + Math.random() * 2.2),
      alpha: 0.4 + Math.random() * 0.6,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.03 + Math.random() * 0.04,
    }));

    // --- State: Cosmic Vortex ---
    const vortexCount = isMiniPreview ? 60 : 180;
    const vortexParticles = Array.from({ length: vortexCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * (Math.min(width, height) * 0.6);
      return {
        angle,
        dist,
        speed: 0.008 + (1 / dist) * 2.5,
        r: 1.0 + Math.random() * 2.0,
        hue: 220 + Math.random() * 60,
        alpha: 0.3 + Math.random() * 0.6,
      };
    });

    // --- State: Ocean Abyss Bubbles ---
    const bubbleCount = isMiniPreview ? 15 : 40;
    const bubbles = Array.from({ length: bubbleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.5 + Math.random() * 3.5,
      vy: -(0.4 + Math.random() * 0.9),
      sway: Math.random() * Math.PI * 2,
      alpha: 0.3 + Math.random() * 0.5,
    }));

    // --- State: Cyber Hex Pulses ---
    const hexRadius = isMiniPreview ? 20 : 36;
    const hexPackets = Array.from({ length: isMiniPreview ? 6 : 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.5),
      vy: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.2),
      life: Math.random() * 100,
      len: 20 + Math.random() * 35,
    }));

    const render = (currentTime: number) => {
      if (!isRunning) return;

      const elapsed = currentTime - lastTime;
      // Target 30 FPS for ecoMode or mini preview, 60 FPS normal
      const minInterval = ecoMode || isMiniPreview ? 33 : 16;
      if (elapsed < minInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = currentTime;

      const dt = Math.min(elapsed / 16.66, 2.5);
      const effSpeed = speed * (ecoMode ? 0.9 : 1.0);
      simTime += 0.016 * dt * effSpeed;

      const intMult = intensity / 100;

      // =========================================================================
      // 1. AURORA BOREALIS (Nordlichter)
      // =========================================================================
      if (effectId === 'aurora') {
        // Deep nocturnal sky background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#020612');
        bgGrad.addColorStop(0.6, '#061a1e');
        bgGrad.addColorStop(1, '#021815');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Distant twinkling stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < (isMiniPreview ? 15 : 45); i++) {
          const sx = (Math.sin(i * 99 + 1) * 0.5 + 0.5) * width;
          const sy = (Math.cos(i * 33 + 2) * 0.5 + 0.5) * (height * 0.65);
          const sa = (Math.sin(simTime * 2 + i) + 1) * 0.25 * intMult;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8 + (i % 2) * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${sa})`;
          ctx.fill();
        }

        // Aurora Curtains (3 undulating harmonic ribbon layers)
        const ribbons = [
          {
            color: `rgba(52, 211, 153, ${0.45 * intMult})`, // Emerald
            glow: `rgba(16, 185, 129, ${0.25 * intMult})`,
            baseY: height * 0.35,
            amp: height * 0.14,
            freq: 0.003,
            speedOffset: 0,
          },
          {
            color: `rgba(45, 212, 191, ${0.4 * intMult})`, // Cyan-teal
            glow: `rgba(20, 184, 166, ${0.2 * intMult})`,
            baseY: height * 0.42,
            amp: height * 0.16,
            freq: 0.0025,
            speedOffset: 1.2,
          },
          {
            color: `rgba(167, 139, 250, ${0.35 * intMult})`, // Soft violet
            glow: `rgba(139, 92, 246, ${0.18 * intMult})`,
            baseY: height * 0.28,
            amp: height * 0.12,
            freq: 0.002,
            speedOffset: 2.5,
          },
        ];

        for (const ribbon of ribbons) {
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += isMiniPreview ? 12 : 6) {
            const wave1 = Math.sin(x * ribbon.freq + simTime * 0.8 + ribbon.speedOffset);
            const wave2 = Math.cos(x * ribbon.freq * 2.2 - simTime * 0.5);
            const wave3 = Math.sin(x * 0.0008 + simTime * 0.3);
            const y = ribbon.baseY + (wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.1) * ribbon.amp;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();

          const rGrad = ctx.createLinearGradient(0, ribbon.baseY - ribbon.amp, 0, height);
          rGrad.addColorStop(0, ribbon.color);
          rGrad.addColorStop(0.5, ribbon.glow);
          rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = rGrad;
          ctx.fill();
        }
      }

      // =========================================================================
      // 2. 80s RETRO SYNTHWAVE
      // =========================================================================
      else if (effectId === 'synthwave') {
        const horizonY = height * 0.58;

        // Twilight Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, '#0f051d');
        skyGrad.addColorStop(0.5, '#2e0854');
        skyGrad.addColorStop(1, '#831843');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Ground Gradient
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        groundGrad.addColorStop(0, '#130426');
        groundGrad.addColorStop(1, '#05010a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        // Radiant Synthwave Sun
        const sunRadius = Math.min(width, height) * 0.22;
        const sunX = width * 0.5;
        const sunY = horizonY - sunRadius * 0.25;

        // Sun Glow Halo
        const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 2);
        sunGlow.addColorStop(0, `rgba(244, 63, 94, ${0.4 * intMult})`);
        sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Sun Core with Blinds Slices
        ctx.save();
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.clip();

        const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
        sunGrad.addColorStop(0, '#fef08a');
        sunGrad.addColorStop(0.5, '#f43f5e');
        sunGrad.addColorStop(1, '#a21caf');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

        // Horizontal Slice Bars
        const sliceCount = 8;
        for (let i = 0; i < sliceCount; i++) {
          const sy = sunY + (i / sliceCount) * sunRadius;
          const barHeight = (i / sliceCount) * (sunRadius * 0.12) + 2;
          ctx.fillStyle = '#0f051d';
          ctx.fillRect(sunX - sunRadius, sy, sunRadius * 2, barHeight);
        }
        ctx.restore();

        // Horizon Neon Line
        ctx.strokeStyle = `rgba(244, 63, 94, ${0.9 * intMult})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.stroke();

        // 3D Wireframe Ground Grid Lines
        ctx.strokeStyle = `rgba(217, 70, 239, ${0.65 * intMult})`;
        ctx.lineWidth = 1.2;

        // Perspective Vertical Grid Lines
        const vpX = width * 0.5;
        const lineCount = isMiniPreview ? 14 : 26;
        for (let i = -lineCount; i <= lineCount; i++) {
          const bottomX = vpX + i * (width / (lineCount * 0.65));
          ctx.beginPath();
          ctx.moveTo(vpX, horizonY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }

        // Horizontal Moving Grid Lines (perspective projection)
        const gridSpeed = (simTime * 28) % 1;
        const hLines = isMiniPreview ? 8 : 14;
        for (let i = 0; i < hLines; i++) {
          const progress = Math.pow((i + gridSpeed) / hLines, 2.4);
          const y = horizonY + progress * (height - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // =========================================================================
      // 3. CYBERPUNK MATRIX DIGITAL RAIN
      // =========================================================================
      else if (effectId === 'matrix') {
        // Semi-transparent background clear for silky phosphor motion trails
        ctx.fillStyle = 'rgba(2, 10, 6, 0.25)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${matrixFontSize}px monospace`;

        const newCols = Math.max(1, Math.floor(width / matrixFontSize));
        if (matrixDrops.length !== newCols) {
          matrixDrops = Array.from({ length: newCols }, () => Math.floor(Math.random() * -40));
        }

        for (let i = 0; i < matrixDrops.length; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * matrixFontSize;
          const y = matrixDrops[i] * matrixFontSize;

          // Glowing leading head character (bright white-lime)
          ctx.fillStyle = `rgba(240, 253, 244, ${0.95 * intMult})`;
          ctx.fillText(char, x, y);

          // Second trail character (bright green)
          const char2 = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          ctx.fillStyle = `rgba(34, 197, 94, ${0.85 * intMult})`;
          ctx.fillText(char2, x, y - matrixFontSize);

          // Reset drop if it passes bottom
          if (y > height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
          }
          matrixDrops[i] += 0.85 * dt * effSpeed;
        }
      }

      // =========================================================================
      // 4. DEEP SPACE COSMIC NEBULA
      // =========================================================================
      else if (effectId === 'nebula') {
        ctx.fillStyle = '#050713';
        ctx.fillRect(0, 0, width, height);

        // Distant Star Field
        for (let i = 0; i < (isMiniPreview ? 30 : 90); i++) {
          const sx = (Math.sin(i * 123.4) * 0.5 + 0.5) * width;
          const sy = (Math.cos(i * 56.7) * 0.5 + 0.5) * height;
          const twinkle = Math.sin(simTime * 1.5 + i * 2) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${(0.2 + twinkle * 0.6) * intMult})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.7 + (i % 3 === 0 ? 0.8 : 0), 0, Math.PI * 2);
          ctx.fill();
        }

        // Drifting Nebula Clouds (Radial Multi-Passes)
        const clouds = [
          {
            cx: width * 0.35 + Math.sin(simTime * 0.3) * (width * 0.08),
            cy: height * 0.4 + Math.cos(simTime * 0.25) * (height * 0.08),
            r: Math.min(width, height) * 0.45,
            c1: `rgba(99, 102, 241, ${0.35 * intMult})`, // Indigo
            c2: `rgba(147, 51, 234, ${0.15 * intMult})`,
          },
          {
            cx: width * 0.68 + Math.cos(simTime * 0.35) * (width * 0.09),
            cy: height * 0.58 + Math.sin(simTime * 0.2) * (height * 0.09),
            r: Math.min(width, height) * 0.5,
            c1: `rgba(236, 72, 153, ${0.32 * intMult})`, // Pink-Magenta
            c2: `rgba(79, 70, 229, ${0.12 * intMult})`,
          },
          {
            cx: width * 0.5 + Math.sin(simTime * 0.4 + 2) * (width * 0.07),
            cy: height * 0.3 + Math.cos(simTime * 0.3 + 1) * (height * 0.07),
            r: Math.min(width, height) * 0.4,
            c1: `rgba(56, 189, 248, ${0.3 * intMult})`, // Cyan
            c2: 'rgba(0, 0, 0, 0)',
          },
        ];

        for (const c of clouds) {
          const grad = ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, c.r);
          grad.addColorStop(0, c.c1);
          grad.addColorStop(0.5, c.c2);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =========================================================================
      // 5. LAVA LAMP FLUID MESH
      // =========================================================================
      else if (effectId === 'fluid-mesh') {
        ctx.fillStyle = '#12051d';
        ctx.fillRect(0, 0, width, height);

        const blobs = [
          {
            x: width * 0.3 + Math.sin(simTime * 0.7) * (width * 0.2),
            y: height * 0.35 + Math.cos(simTime * 0.6) * (height * 0.2),
            r: Math.min(width, height) * 0.45,
            color: `rgba(245, 158, 11, ${0.45 * intMult})`, // Amber
          },
          {
            x: width * 0.7 + Math.cos(simTime * 0.5) * (width * 0.22),
            y: height * 0.6 + Math.sin(simTime * 0.8) * (height * 0.22),
            r: Math.min(width, height) * 0.5,
            color: `rgba(225, 29, 72, ${0.42 * intMult})`, // Rose
          },
          {
            x: width * 0.5 + Math.sin(simTime * 0.9 + 1) * (width * 0.25),
            y: height * 0.75 + Math.cos(simTime * 0.65 + 1) * (height * 0.18),
            r: Math.min(width, height) * 0.42,
            color: `rgba(168, 85, 247, ${0.4 * intMult})`, // Purple
          },
        ];

        for (const b of blobs) {
          const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          grad.addColorStop(0, b.color);
          grad.addColorStop(0.65, b.color.replace(/[\d\.]+\)$/, '0.12)'));
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =========================================================================
      // 6. OCEAN ABYSS & CAUSTICS
      // =========================================================================
      else if (effectId === 'ocean-abyss') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#042f4c');
        bgGrad.addColorStop(0.5, '#02182b');
        bgGrad.addColorStop(1, '#010c17');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Sunlight Shafts penetrating from above
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const rayCount = isMiniPreview ? 5 : 10;
        for (let i = 0; i < rayCount; i++) {
          const rx = (width / rayCount) * i + Math.sin(simTime * 0.5 + i) * 35;
          const rayGrad = ctx.createLinearGradient(rx, 0, rx + 80, height);
          rayGrad.addColorStop(0, `rgba(56, 189, 248, ${0.28 * intMult})`);
          rayGrad.addColorStop(0.7, `rgba(14, 165, 233, ${0.08 * intMult})`);
          rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(rx - 20, 0);
          ctx.lineTo(rx + 60, 0);
          ctx.lineTo(rx + 160, height);
          ctx.lineTo(rx + 60, height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Rising Deep Sea Bubbles
        ctx.fillStyle = `rgba(186, 230, 253, ${0.6 * intMult})`;
        for (const b of bubbles) {
          b.y += b.vy * dt * effSpeed;
          b.sway += 0.03 * dt * effSpeed;
          const bx = b.x + Math.sin(b.sway) * 8;
          if (b.y < -10) {
            b.y = height + 10;
            b.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =========================================================================
      // 7. SUNSET WAVES
      // =========================================================================
      else if (effectId === 'sunset-waves') {
        const horizonY = height * 0.48;

        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, '#1c0a2a');
        skyGrad.addColorStop(0.5, '#5b1236');
        skyGrad.addColorStop(1, '#9a3412');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Sun Glow at Horizon
        const sunX = width * 0.5;
        const sunRadius = Math.min(width, height) * 0.16;
        const sunGrad = ctx.createRadialGradient(sunX, horizonY, 0, sunX, horizonY, sunRadius * 1.8);
        sunGrad.addColorStop(0, `rgba(254, 215, 170, ${0.85 * intMult})`);
        sunGrad.addColorStop(0.4, `rgba(249, 115, 22, ${0.5 * intMult})`);
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, horizonY, sunRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Rolling Twilight Waves (3 Tiers)
        const waveLayers = [
          { y: horizonY + 25, amp: 10, freq: 0.008, color: '#431407', alpha: 0.9 },
          { y: horizonY + 70, amp: 16, freq: 0.006, color: '#270e08', alpha: 0.95 },
          { y: horizonY + 130, amp: 22, freq: 0.004, color: '#130504', alpha: 1.0 },
        ];

        for (let i = 0; i < waveLayers.length; i++) {
          const l = waveLayers[i];
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += isMiniPreview ? 10 : 5) {
            const w1 = Math.sin(x * l.freq + simTime * (1.2 + i * 0.3));
            const w2 = Math.cos(x * l.freq * 1.8 - simTime * 0.8);
            const cy = l.y + (w1 * 0.7 + w2 * 0.3) * l.amp;
            ctx.lineTo(x, cy);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fillStyle = l.color;
          ctx.fill();

          // Golden crest reflection line
          ctx.strokeStyle = `rgba(251, 146, 60, ${0.35 * intMult})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      // =========================================================================
      // 8. MYSTIC FOREST MIST & FIREFLIES
      // =========================================================================
      else if (effectId === 'mystic-forest') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#020b08');
        bgGrad.addColorStop(0.6, '#062016');
        bgGrad.addColorStop(1, '#0a2e21');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Drifting horizontal mist ribbons
        const mistRibbons = [
          { y: height * 0.5, speed: 0.3, alpha: 0.22 * intMult },
          { y: height * 0.65, speed: -0.25, alpha: 0.28 * intMult },
          { y: height * 0.82, speed: 0.4, alpha: 0.32 * intMult },
        ];
        for (const m of mistRibbons) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, m.y);
          for (let x = 0; x <= width; x += isMiniPreview ? 15 : 8) {
            const my = m.y + Math.sin(x * 0.004 + simTime * m.speed) * 25;
            ctx.lineTo(x, my);
          }
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          const mistGrad = ctx.createLinearGradient(0, m.y - 30, 0, m.y + 60);
          mistGrad.addColorStop(0, `rgba(110, 231, 183, ${m.alpha})`);
          mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = mistGrad;
          ctx.fill();
          ctx.restore();
        }

        // Fireflies
        for (let i = 0; i < (isMiniPreview ? 14 : 35); i++) {
          const fx = (Math.sin(i * 47 + simTime * 0.4) * 0.45 + 0.5) * width;
          const fy = (Math.cos(i * 31 + simTime * 0.35) * 0.4 + 0.5) * height;
          const pulse = Math.pow((Math.sin(simTime * 2.2 + i * 2) + 1) * 0.5, 2);
          const alpha = pulse * intMult * 0.85;

          const glowGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 14);
          glowGrad.addColorStop(0, `rgba(253, 224, 71, ${alpha})`);
          glowGrad.addColorStop(0.4, `rgba(234, 179, 8, ${alpha * 0.4})`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(fx, fy, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(254, 240, 138, ${Math.min(1, alpha * 1.5)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =========================================================================
      // 9. CYBER HEX-GRID
      // =========================================================================
      else if (effectId === 'cyber-hex') {
        ctx.fillStyle = '#030d14';
        ctx.fillRect(0, 0, width, height);

        // Hex grid
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.16 * intMult})`;
        ctx.lineWidth = 1.0;

        const hxStep = hexRadius * Math.sqrt(3);
        const hyStep = hexRadius * 1.5;

        for (let y = 0; y < height + hexRadius * 2; y += hyStep) {
          const row = Math.floor(y / hyStep);
          const xOffset = (row % 2) * (hxStep / 2);
          for (let x = -hxStep; x < width + hxStep; x += hxStep) {
            const hx = x + xOffset;
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
              const angle = (Math.PI / 3) * a + Math.PI / 6;
              const px = hx + hexRadius * Math.cos(angle);
              const py = y + hexRadius * Math.sin(angle);
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }

        // Energy Circuit Pulses
        for (const p of hexPackets) {
          p.x += p.vx * dt * effSpeed;
          p.y += p.vy * dt * effSpeed;
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          const pGrad = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 15, p.y - p.vy * 15);
          pGrad.addColorStop(0, `rgba(34, 211, 238, ${0.9 * intMult})`);
          pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.strokeStyle = pGrad;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * p.len, p.y - p.vy * p.len);
          ctx.stroke();
        }
      }

      // =========================================================================
      // 10. SAKURA PETAL BREEZE
      // =========================================================================
      else if (effectId === 'sakura') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#1c0818');
        bgGrad.addColorStop(0.6, '#380a27');
        bgGrad.addColorStop(1, '#50072b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        for (const p of sakuraPetals) {
          p.x += (p.vx + Math.sin(simTime + p.y * 0.01) * 0.6) * dt * effSpeed;
          p.y += (p.vy + Math.cos(simTime * 0.8 + p.x * 0.01) * 0.3) * dt * effSpeed;
          p.rot += p.vrot * dt * effSpeed;
          p.flip += p.vflip * dt * effSpeed;

          if (p.x > width + 30) p.x = -30;
          if (p.y > height + 30) {
            p.y = -30;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.flip));

          ctx.fillStyle = `rgba(244, 114, 182, ${p.alpha * intMult})`;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.6, p.size * 0.6, p.size * 0.6, 0, p.size);
          ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.6, -p.size * 0.6, -p.size * 0.6, 0, -p.size);
          ctx.fill();
          ctx.restore();
        }
      }

      // =========================================================================
      // 11. QUANTUM WAVES (Harmonic Silk Curves)
      // =========================================================================
      else if (effectId === 'quantum-waves') {
        ctx.fillStyle = '#070514';
        ctx.fillRect(0, 0, width, height);

        const curveCount = isMiniPreview ? 5 : 12;
        for (let i = 0; i < curveCount; i++) {
          const t = i / curveCount;
          ctx.beginPath();
          for (let x = 0; x <= width; x += isMiniPreview ? 10 : 5) {
            const wave1 = Math.sin(x * 0.003 + simTime * 0.9 + i * 0.4);
            const wave2 = Math.cos(x * 0.002 - simTime * 0.6 + i * 0.3);
            const y = height * 0.5 + (wave1 + wave2) * (height * 0.22) * (0.6 + t * 0.4);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const hue = (simTime * 20 + i * 18) % 360;
          ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${0.5 * intMult})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      // =========================================================================
      // 12. BLACK HOLE COSMIC VORTEX
      // =========================================================================
      else if (effectId === 'cosmic-vortex') {
        ctx.fillStyle = '#020309';
        ctx.fillRect(0, 0, width, height);

        const centerX = width * 0.5;
        const centerY = height * 0.5;

        // Spiraling particles
        for (const p of vortexParticles) {
          p.angle += p.speed * dt * effSpeed;
          p.dist -= 0.15 * dt * effSpeed;
          if (p.dist < 20) {
            p.dist = Math.min(width, height) * 0.55 + Math.random() * 40;
          }

          const px = centerX + Math.cos(p.angle) * p.dist;
          const py = centerY + Math.sin(p.angle) * (p.dist * 0.55); // tilted accretion disk

          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.alpha * intMult})`;
          ctx.fill();
        }

        // Luminous Photon Ring
        const ringRadius = isMiniPreview ? 18 : 36;
        const ringGrad = ctx.createRadialGradient(centerX, centerY, ringRadius * 0.7, centerX, centerY, ringRadius * 1.5);
        ringGrad.addColorStop(0, `rgba(224, 231, 255, ${0.9 * intMult})`);
        ringGrad.addColorStop(0.5, `rgba(99, 102, 241, ${0.6 * intMult})`);
        ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark Event Horizon
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
      }

      // =========================================================================
      // 13. CAMPFIRE EMBERS
      // =========================================================================
      else if (effectId === 'fire-embers') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0c0202');
        bgGrad.addColorStop(0.65, '#200504');
        bgGrad.addColorStop(1, '#4a0b06');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Hearth Ambient Pulse
        const pulse = (Math.sin(simTime * 2.5) + 1) * 0.5;
        const hearthGrad = ctx.createRadialGradient(width * 0.5, height, 0, width * 0.5, height, height * 0.65);
        hearthGrad.addColorStop(0, `rgba(249, 115, 22, ${(0.35 + pulse * 0.15) * intMult})`);
        hearthGrad.addColorStop(0.6, `rgba(185, 28, 28, ${0.15 * intMult})`);
        hearthGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = hearthGrad;
        ctx.fillRect(0, 0, width, height);

        // Rising Sparks
        for (const e of embers) {
          e.y += e.vy * dt * effSpeed;
          e.sway += e.swaySpeed * dt * effSpeed;
          const ex = e.x + Math.sin(e.sway) * 12;

          if (e.y < -10) {
            e.y = height + 10;
            e.x = Math.random() * width;
          }

          const grad = ctx.createRadialGradient(ex, e.y, 0, ex, e.y, e.r * 2.5);
          grad.addColorStop(0, `rgba(254, 240, 138, ${e.alpha * intMult})`);
          grad.addColorStop(0.4, `rgba(249, 115, 22, ${e.alpha * 0.7 * intMult})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(ex, e.y, e.r * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =========================================================================
      // 14. HYPERSPACE WARP SPEED
      // =========================================================================
      else if (effectId === 'warp-speed') {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
        ctx.fillRect(0, 0, width, height);

        const cx = width * 0.5;
        const cy = height * 0.5;

        for (const star of warpStars) {
          star.pz = star.z;
          star.z -= 8.5 * dt * effSpeed;

          if (star.z <= 0) {
            star.z = width;
            star.pz = star.z;
            star.x = (Math.random() - 0.5) * width;
            star.y = (Math.random() - 0.5) * height;
          }

          const k = 180 / star.z;
          const px = star.x * k + cx;
          const py = star.y * k + cy;

          const pk = 180 / star.pz;
          const ppx = star.x * pk + cx;
          const ppy = star.y * pk + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const alpha = Math.min(1, (1 - star.z / width) * intMult);
            ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
            ctx.lineWidth = Math.max(0.8, (1 - star.z / width) * 2.8);
            ctx.beginPath();
            ctx.moveTo(ppx, ppy);
            ctx.lineTo(px, py);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Pause when tab is hidden to save battery & CPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [effectId, speed, intensity, ecoMode, isMiniPreview]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

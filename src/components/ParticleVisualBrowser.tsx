import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Snowflake,
  Star,
  CloudRain,
  CircleDot,
  Flame,
  Ban,
  Check,
  Eye,
  Info,
} from 'lucide-react';
import { ParticleEffect } from '../types';

interface ParticleVisualBrowserProps {
  selectedEffect: ParticleEffect;
  particleColor: string;
  onSelectEffect: (effect: ParticleEffect, label: string) => void;
  isGerman?: boolean;
  ecoMode?: boolean;
}

interface ParticleItemDef {
  id: ParticleEffect;
  titleEn: string;
  titleDe: string;
  subtitleEn: string;
  subtitleDe: string;
  tagEn: string;
  tagDe: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const PARTICLE_EFFECT_ITEMS: ParticleItemDef[] = [
  {
    id: 'stars',
    titleEn: 'Starfield',
    titleDe: 'Starfield (Sterne)',
    subtitleEn: 'Twinkling stars with 4-point sparkle cross',
    subtitleDe: 'Funkelnde Sterne mit 4-Punkt Glanzkreuzen',
    tagEn: 'Cosmic',
    tagDe: 'Kosmisch',
    icon: Star,
    accentColor: '#38bdf8', // sky
  },
  {
    id: 'rain',
    titleEn: 'Rainfall',
    titleDe: 'Rainfall (Regen)',
    subtitleEn: 'Gentle downward slanted rain streaks',
    subtitleDe: 'Lineare, sanft geneigte Regentropfen',
    tagEn: 'Calming',
    tagDe: 'Beruhigend',
    icon: CloudRain,
    accentColor: '#60a5fa', // blue
  },
  {
    id: 'fireflies',
    titleEn: 'Fireflies',
    titleDe: 'Fireflies (Glühwürmchen)',
    subtitleEn: 'Warm bioluminescent floating light pulses',
    subtitleDe: 'Pulsierende warme Lichtpunkte im sanften Flug',
    tagEn: 'Magical',
    tagDe: 'Magisch',
    icon: Flame,
    accentColor: '#f59e0b', // amber
  },
  {
    id: 'dust',
    titleEn: 'Floating Dust',
    titleDe: 'Floating Dust (Staub)',
    subtitleEn: 'Weightless motes catching sunlight in room',
    subtitleDe: 'Schwerelose Sonnenstrahl-Moten im Raum',
    tagEn: 'Atmospheric',
    tagDe: 'Atmosphärisch',
    icon: Sparkles,
    accentColor: '#a78bfa', // purple
  },
  {
    id: 'snow',
    titleEn: 'Snowfall',
    titleDe: 'Snowfall (Schneeflocken)',
    subtitleEn: 'Rotating crystalline flakes drifting on breeze',
    subtitleDe: 'Rotierende Eiskristalle & weicher Flockenwirbel',
    tagEn: 'Winter',
    tagDe: 'Winterlich',
    icon: Snowflake,
    accentColor: '#93c5fd', // ice blue
  },
  {
    id: 'bubbles',
    titleEn: 'Light Aura',
    titleDe: 'Light Aura (Licht-Aura)',
    subtitleEn: 'Rising glowing orbs with crescent reflection',
    subtitleDe: 'Aufsteigende leuchtende Sphären mit Glanzlicht',
    tagEn: 'Zen',
    tagDe: 'Meditativ',
    icon: CircleDot,
    accentColor: '#34d399', // emerald
  },
  {
    id: 'none',
    titleEn: 'No Particles',
    titleDe: 'Keine Partikel',
    subtitleEn: 'Clean background with zero CPU overhead',
    subtitleDe: 'Deaktiviert • Minimalste Prozessorbelastung',
    tagEn: 'Off',
    tagDe: 'Aus',
    icon: Ban,
    accentColor: '#64748b', // slate
  },
];

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

interface MiniParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
  rot: number;
  rotSpeed: number;
  len?: number;
  sway: number;
  swaySpeed: number;
}

/**
 * Lightweight Canvas component that simulates a miniature preview of each particle effect
 */
const MiniParticlePreview: React.FC<{
  effect: ParticleEffect;
  color: string;
  isSelected: boolean;
}> = ({ effect, color, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effect === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const w = (canvas.width = 160);
    const h = (canvas.height = 76);

    // Initialize 7-10 lightweight preview particles
    const count = effect === 'rain' ? 12 : effect === 'stars' ? 9 : 7;
    const particles: MiniParticle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx:
          effect === 'rain'
            ? -0.6
            : effect === 'snow'
            ? (Math.random() - 0.5) * 0.2
            : effect === 'bubbles'
            ? (Math.random() - 0.5) * 0.2
            : (Math.random() - 0.5) * 0.3,
        vy:
          effect === 'rain'
            ? 3.2 + Math.random() * 2.0
            : effect === 'snow'
            ? 0.5 + Math.random() * 0.7
            : effect === 'bubbles'
            ? -(0.4 + Math.random() * 0.6)
            : effect === 'stars'
            ? (Math.random() - 0.5) * 0.05
            : (Math.random() - 0.5) * 0.25,
        r:
          effect === 'stars'
            ? 1.0 + Math.random() * 1.5
            : effect === 'bubbles'
            ? 2.5 + Math.random() * 3.5
            : effect === 'snow'
            ? 1.5 + Math.random() * 2.5
            : effect === 'fireflies'
            ? 2.0 + Math.random() * 2.2
            : 1.2 + Math.random() * 1.8,
        alpha: 0.4 + Math.random() * 0.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.04,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        len: effect === 'rain' ? 8 + Math.random() * 8 : undefined,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.03,
      });
    }

    let animId: number;
    let isRunning = true;
    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isRunning) return;

      // Throttle preview rendering to ~30 FPS to prevent wasting any CPU
      if (time - lastTime < 30) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = time;

      const rgb = hexToRgb(color || '#ffffff');
      const prefix = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b},`;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (effect === 'stars') {
          p.pulse += p.pulseSpeed;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          const twinkle = Math.pow((Math.sin(p.pulse) + 1) * 0.5, 2);
          const a = p.alpha * (0.2 + 0.8 * twinkle);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `${prefix} ${a})`;
          ctx.fill();

          if (p.r > 1.5 && twinkle > 0.75) {
            const sl = p.r * 2.6;
            ctx.beginPath();
            ctx.moveTo(p.x - sl, p.y);
            ctx.lineTo(p.x + sl, p.y);
            ctx.moveTo(p.x, p.y - sl);
            ctx.lineTo(p.x, p.y + sl);
            ctx.strokeStyle = `${prefix} ${a * 0.75})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        } else if (effect === 'rain') {
          p.x += p.vx;
          p.y += p.vy;
          const len = p.len || 10;
          if (p.y > h + len) {
            p.y = -len;
            p.x = Math.random() * (w + 20);
          }
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + len);
          ctx.strokeStyle = `${prefix} ${p.alpha * 0.85})`;
          ctx.lineWidth = 1.1;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else if (effect === 'fireflies') {
          p.sway += p.swaySpeed;
          p.pulse += p.pulseSpeed;
          p.x += p.vx + Math.sin(p.sway) * 0.45;
          p.y += p.vy + Math.cos(p.sway) * 0.35;
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;
          if (p.y < -5) p.y = h + 5;
          if (p.y > h + 5) p.y = -5;

          const glow = Math.pow((Math.sin(p.pulse) + 1) * 0.5, 1.6);
          const a = p.alpha * (0.25 + 0.75 * glow);

          // Soft halo
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
          halo.addColorStop(0, `${prefix} ${a * 0.7})`);
          halo.addColorStop(0.4, `${prefix} ${a * 0.25})`);
          halo.addColorStop(1, `${prefix} 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
          ctx.fill();

          // Bright core
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.8, p.r * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `${prefix} ${Math.min(1, a * 1.4)})`;
          ctx.fill();
        } else if (effect === 'dust') {
          p.sway += p.swaySpeed;
          p.pulse += p.pulseSpeed;
          p.x += p.vx + Math.sin(p.sway) * 0.3;
          p.y += p.vy + Math.cos(p.sway) * 0.25;
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;
          if (p.y < -5) p.y = h + 5;
          if (p.y > h + 5) p.y = -5;

          const pulseVal = (Math.sin(p.pulse) + 1) * 0.5;
          const a = p.alpha * (0.3 + 0.7 * pulseVal);

          // Soft diffuse mote
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.2);
          grad.addColorStop(0, `${prefix} ${a * 0.85})`);
          grad.addColorStop(1, `${prefix} 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.6, p.r * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = `${prefix} ${a * 1.1})`;
          ctx.fill();
        } else if (effect === 'snow') {
          p.sway += p.swaySpeed;
          p.rot += p.rotSpeed;
          p.x += p.vx + Math.sin(p.sway) * 0.5;
          p.y += p.vy;
          if (p.y > h + 8) {
            p.y = -8;
            p.x = Math.random() * w;
          }
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;

          // Simple 4-line crystal snowflake
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.strokeStyle = `${prefix} ${p.alpha * 0.9})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-p.r, 0);
          ctx.lineTo(p.r, 0);
          ctx.moveTo(0, -p.r);
          ctx.lineTo(0, p.r);
          ctx.stroke();
          ctx.restore();
        } else if (effect === 'bubbles') {
          p.sway += p.swaySpeed;
          p.x += p.vx + Math.sin(p.sway) * 0.35;
          p.y += p.vy;
          if (p.y < -p.r * 2) {
            p.y = h + p.r * 2;
            p.x = Math.random() * w;
          }
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;

          // Glowing bubble ring
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `${prefix} ${p.alpha * 0.25})`;
          ctx.fill();
          ctx.strokeStyle = `${prefix} ${p.alpha * 0.8})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();

          // Highlight dot
          ctx.beginPath();
          ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, Math.max(0.5, p.r * 0.25), 0, Math.PI * 2);
          ctx.fillStyle = `${prefix} ${p.alpha * 0.85})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [effect, color]);

  if (effect === 'none') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/90 text-slate-500 group-hover:text-slate-400 transition-colors">
        <Ban className="w-5 h-5 mb-0.5 opacity-60" />
        <span className="text-[10px] font-mono opacity-50 tracking-wider">OFF</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full object-cover transition-opacity duration-300 ${
        isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'
      }`}
    />
  );
};

export const ParticleVisualBrowser: React.FC<ParticleVisualBrowserProps> = ({
  selectedEffect,
  particleColor,
  onSelectEffect,
  isGerman = true,
  ecoMode = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'calm' | 'motion'>('all');

  const filteredItems = PARTICLE_EFFECT_ITEMS.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'calm') {
      return ['stars', 'dust', 'bubbles', 'none'].includes(item.id);
    }
    if (filter === 'motion') {
      return ['rain', 'snow', 'fireflies', 'stars'].includes(item.id);
    }
    return true;
  });

  return (
    <div id="particle-visual-grid-browser" className="space-y-3">
      {/* Category Pills & Info Bar */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>{isGerman ? 'Visueller Effekt-Katalog:' : 'Visual Effect Catalog:'}</span>
        </span>

        {/* Filter Chips */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: isGerman ? 'Alle' : 'All' },
            { id: 'calm', label: isGerman ? 'Ruhig' : 'Calm' },
            { id: 'motion', label: isGerman ? 'Dynamisch' : 'Motion' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id as any)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                filter === cat.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Cards Grid with Live Canvas Previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredItems.map((item) => {
          const isSelected = selectedEffect === item.id;
          const Icon = item.icon;
          const title = isGerman ? item.titleDe : item.titleEn;
          const desc = isGerman ? item.subtitleDe : item.subtitleEn;
          const tag = isGerman ? item.tagDe : item.tagEn;

          return (
            <div
              key={item.id}
              onClick={() => onSelectEffect(item.id, title)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectEffect(item.id, title);
                }
              }}
              className={`group relative rounded-xl border text-left overflow-hidden transition-all duration-200 cursor-pointer select-none flex flex-col ${
                isSelected
                  ? 'bg-slate-900 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 scale-[1.015]'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Mini Animated Preview Stage Header */}
              <div className="relative w-full h-[72px] bg-slate-950/90 border-b border-slate-800/80 overflow-hidden">
                {/* Micro Animated Preview Canvas */}
                <MiniParticlePreview
                  effect={item.id}
                  color={particleColor}
                  isSelected={isSelected}
                />

                {/* Gradient Vignette on bottom of preview */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none opacity-60" />

                {/* Mood Tag Pill (Top Left) */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 pointer-events-none">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-slate-300">
                    {tag}
                  </span>
                </div>

                {/* Active Checkmark Pill (Top Right) */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow-md"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{isGerman ? 'Aktiv' : 'Active'}</span>
                  </motion.div>
                )}
              </div>

              {/* Card Meta Body */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isSelected ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <h4
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                    {desc}
                  </p>
                </div>

                {/* Bottom Status Row */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">
                    {item.id === 'none' ? '0 CPU' : ecoMode ? '30 FPS' : '60 FPS'}
                  </span>
                  <span
                    className={`font-semibold transition-colors ${
                      isSelected
                        ? 'text-amber-400'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    {isSelected
                      ? isGerman
                        ? 'Gewählt'
                        : 'Selected'
                      : isGerman
                      ? 'Auswählen →'
                      : 'Select →'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

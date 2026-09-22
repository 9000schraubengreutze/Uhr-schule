import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gauge,
  Activity,
  Cpu,
  Sparkles,
  Leaf,
  ChevronUp,
  ChevronDown,
  Layers,
  Minimize2,
  Maximize2,
  Info,
} from 'lucide-react';
import { ClockSettings } from '../types';
import { triggerHaptic } from '../utils/audio';

interface PerformanceInfoOverlayProps {
  settings: ClockSettings;
  onUpdateSettings?: React.Dispatch<React.SetStateAction<ClockSettings>>;
  showFeedback?: (msg: string) => void;
}

export const PerformanceInfoOverlay: React.FC<PerformanceInfoOverlayProps> = ({
  settings,
  onUpdateSettings,
  showFeedback,
}) => {
  const [fps, setFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const isGerman = settings.appLanguage !== 'en';

  // Live render FPS measurement loop
  useEffect(() => {
    let animId: number;
    let frames = 0;
    let lastSampleTime = performance.now();
    let lastFrameTime = performance.now();
    let frameDeltas: number[] = [];

    const measureLoop = (now: number) => {
      frames++;
      const delta = now - lastFrameTime;
      lastFrameTime = now;
      if (delta > 0 && delta < 200) {
        frameDeltas.push(delta);
      }

      // Sample every 650ms for stable, readable readings without jitter
      if (now - lastSampleTime >= 650) {
        const actualElapsedSec = (now - lastSampleTime) / 1000;
        const calculatedFps = Math.round(frames / actualElapsedSec);
        const avgDelta =
          frameDeltas.length > 0
            ? frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length
            : 16.6;

        setFps(Math.max(1, Math.min(240, calculatedFps)));
        setFrameTimeMs(parseFloat(avgDelta.toFixed(1)));

        frames = 0;
        frameDeltas = [];
        lastSampleTime = now;
      }

      animId = requestAnimationFrame(measureLoop);
    };

    animId = requestAnimationFrame(measureLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Compute live particle count matching ParticleBackground.tsx logic
  const particleStats = useMemo(() => {
    if (typeof window === 'undefined') {
      return { count: 0, targetFps: 60, effectLabel: 'Keine' };
    }

    const effect = settings.particleEffect;
    if (effect === 'none') {
      return {
        count: 0,
        targetFps: 0,
        effectLabel: isGerman ? 'Keine' : 'None',
      };
    }

    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    const area = width * height;
    const intensityClamped = Math.max(10, Math.min(100, settings.particleIntensity || 50));
    const ecoMode = !!settings.ecoMode;

    const baseDensity =
      effect === 'rain' ? (ecoMode ? 45000 : 22000) : (ecoMode ? 32000 : 15000);
    const computedCount = Math.round((area / baseDensity) * (intensityClamped / 50));
    const maxParticles = ecoMode ? 60 : 240;
    const minParticles = ecoMode ? 10 : 16;
    const particleCount = Math.max(minParticles, Math.min(maxParticles, computedCount));

    const effectNames: Record<string, { de: string; en: string }> = {
      snow: { de: 'Schnee', en: 'Snow' },
      dust: { de: 'Staub', en: 'Dust' },
      stars: { de: 'Sterne', en: 'Stars' },
      rain: { de: 'Regen', en: 'Rain' },
      bubbles: { de: 'Licht-Aura', en: 'Bubbles' },
      fireflies: { de: 'Glühwürmchen', en: 'Fireflies' },
    };

    return {
      count: particleCount,
      targetFps: ecoMode ? 30 : 60,
      effectLabel: effectNames[effect]?.[isGerman ? 'de' : 'en'] || effect,
    };
  }, [
    settings.particleEffect,
    settings.particleIntensity,
    settings.ecoMode,
    isGerman,
  ]);

  // Estimated CPU and GPU impact calculation
  const performanceImpact = useMemo(() => {
    let cpuPercent = 0.4; // Base clock update footprint
    const isEco = !!settings.ecoMode;

    // Particle overhead
    if (settings.particleEffect !== 'none') {
      const speed = settings.particleSpeed || 1.0;
      const count = particleStats.count;
      const effectWeight =
        settings.particleEffect === 'rain'
          ? 1.3
          : settings.particleEffect === 'snow'
          ? 1.2
          : settings.particleEffect === 'bubbles'
          ? 1.0
          : settings.particleEffect === 'fireflies'
          ? 1.05
          : 0.8;
      const fpsFactor = isEco ? 0.4 : 1.0;
      cpuPercent += count * 0.024 * effectWeight * Math.min(2, speed) * fpsFactor;
    }

    // Glow overhead
    if (settings.enableGlow) {
      cpuPercent += (settings.glowIntensity / 100) * 0.7;
    }

    // Backdrop filter blur overhead
    const blur = settings.backdropBlurIntensity ?? 16;
    if (blur > 0) {
      cpuPercent += (blur / 40) * 1.1;
    }

    // Breathing pulse overhead
    if (settings.enableBreathingAnimation && !isEco) {
      cpuPercent += 0.5;
    }

    // Seconds display overhead
    if (settings.showSeconds && !isEco) {
      cpuPercent += 0.3;
    }

    // Animated background GPU-canvas overhead
    if (settings.bgType === 'animated') {
      const spd = settings.animatedBgSpeed || 1.0;
      cpuPercent += (isEco ? 1.2 : 2.2) * Math.min(2.0, spd);
    }

    // Clamp between 0.4% and 15%
    const finalCpu = parseFloat(Math.min(15, Math.max(0.4, cpuPercent)).toFixed(1));

    let level: 'minimal' | 'low' | 'moderate' | 'high';
    let labelDe: string;
    let labelEn: string;
    let colorClass: string;
    let barWidthPercent: number;

    if (finalCpu <= 2.2) {
      level = 'minimal';
      labelDe = 'Minimal';
      labelEn = 'Minimal';
      colorClass = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      barWidthPercent = Math.max(12, Math.round((finalCpu / 15) * 100));
    } else if (finalCpu <= 5.0) {
      level = 'low';
      labelDe = 'Gering';
      labelEn = 'Low';
      colorClass = 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10';
      barWidthPercent = Math.round((finalCpu / 15) * 100);
    } else if (finalCpu <= 8.5) {
      level = 'moderate';
      labelDe = 'Moderat';
      labelEn = 'Moderate';
      colorClass = 'text-amber-300 border-amber-500/40 bg-amber-500/10';
      barWidthPercent = Math.round((finalCpu / 15) * 100);
    } else {
      level = 'high';
      labelDe = 'Erhöht';
      labelEn = 'Elevated';
      colorClass = 'text-rose-300 border-rose-500/40 bg-rose-500/10';
      barWidthPercent = Math.min(100, Math.round((finalCpu / 15) * 100));
    }

    return {
      estimatedCpu: finalCpu,
      level,
      label: isGerman ? labelDe : labelEn,
      colorClass,
      barWidthPercent,
    };
  }, [
    settings.particleEffect,
    settings.particleSpeed,
    settings.enableGlow,
    settings.glowIntensity,
    settings.backdropBlurIntensity,
    settings.enableBreathingAnimation,
    settings.showSeconds,
    settings.ecoMode,
    particleStats.count,
    isGerman,
  ]);

  // FPS status color
  const fpsStatusColor =
    fps >= 52
      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
      : fps >= 28
      ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/15 border-rose-500/30';

  if (isMinimized) {
    return (
      <div
        id="performance-info-minimized-pill"
        className="px-6 py-2 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false);
            triggerHaptic(settings.vibrationEnabled);
          }}
          className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer group"
          title={isGerman ? 'Performance-Info einblenden' : 'Show Performance Info'}
        >
          <Activity className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono font-medium">{fps} FPS</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            CPU: <span className="text-slate-300 font-medium">{performanceImpact.label}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false);
            triggerHaptic(settings.vibrationEnabled);
          }}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
          aria-label={isGerman ? 'Performance-Info vergrößern' : 'Expand Performance Info'}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="performance-info-overlay"
      className="border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md shrink-0 transition-all"
    >
      {/* Compact Status Bar Header (Always Visible) */}
      <div className="px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Live FPS & CPU Impact Summary */}
        <div
          onClick={() => {
            setIsExpanded(!isExpanded);
            triggerHaptic(settings.vibrationEnabled);
          }}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsExpanded(!isExpanded);
            }
          }}
          title={
            isGerman
              ? 'Klicken für detaillierte Partikel- & CPU-Analyse'
              : 'Click for detailed particle & CPU analysis'
          }
        >
          {/* FPS Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-mono font-semibold transition-colors ${fpsStatusColor}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{fps} FPS</span>
          </div>

          {/* CPU Impact Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-medium transition-colors ${performanceImpact.colorClass}`}
          >
            <Cpu className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">CPU:</span>
            <span className="font-semibold">{performanceImpact.label}</span>
            <span className="text-[10px] opacity-75 font-mono">
              (~{performanceImpact.estimatedCpu}%)
            </span>
          </div>

          {/* Active Particles Info Pill */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 truncate">
            <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">
              {particleStats.effectLabel}
              {particleStats.count > 0 && ` (${particleStats.count})`}
            </span>
          </div>

          {/* Eco Mode Tag */}
          {settings.ecoMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              <Leaf className="w-2.5 h-2.5" />
              Eco
            </span>
          )}
        </div>

        {/* Right: Actions (Expand/Collapse Details + Minimize) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            id="performance-info-toggle-btn"
            onClick={() => {
              setIsExpanded(!isExpanded);
              triggerHaptic(settings.vibrationEnabled);
            }}
            className="px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors flex items-center gap-1 cursor-pointer"
            aria-expanded={isExpanded}
          >
            <span className="text-[11px]">{isExpanded ? (isGerman ? 'Weniger' : 'Less') : (isGerman ? 'Details' : 'Details')}</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMinimized(true);
              triggerHaptic(settings.vibrationEnabled);
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isGerman ? 'Minimieren' : 'Minimize'}
            aria-label={isGerman ? 'Performance-Info minimieren' : 'Minimize Performance Info'}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Breakdown Drawer Card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-800/60 bg-slate-900/40 px-6 py-3 space-y-3"
          >
            {/* CPU Impact Meter Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  {isGerman ? 'Berechnete System- & CPU-Belastung:' : 'Calculated System & CPU Load:'}
                </span>
                <span className="font-mono text-slate-200 font-semibold">
                  ~{performanceImpact.estimatedCpu}%
                  <span className="text-slate-400 font-normal ml-1">
                    ({performanceImpact.label})
                  </span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    performanceImpact.level === 'minimal' || performanceImpact.level === 'low'
                      ? 'bg-emerald-400'
                      : performanceImpact.level === 'moderate'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                  style={{ width: `${performanceImpact.barWidthPercent}%` }}
                />
              </div>
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {/* Metric 1: FPS & Frametime */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <Gauge className="w-3 h-3 text-blue-400" />
                  <span>{isGerman ? 'Bildrate & Latenz' : 'Framerate & Latency'}</span>
                </div>
                <div className="font-mono font-semibold text-slate-200 text-xs">
                  {fps} FPS{' '}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({frameTimeMs} ms)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {settings.ecoMode
                    ? isGerman
                      ? 'Gedrosselt (~30 FPS Canvas)'
                      : 'Throttled (~30 FPS Canvas)'
                    : isGerman
                    ? 'Flüssige 60 Hz Wiedergabe'
                    : 'Smooth 60 Hz Playback'}
                </div>
              </div>

              {/* Metric 2: Particle Workload */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{isGerman ? 'Partikel-Workload' : 'Particle Workload'}</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs truncate">
                  {particleStats.effectLabel}:{' '}
                  <span className="font-mono text-purple-300">
                    {particleStats.count}{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      {isGerman ? 'Ptk.' : 'pts'}
                    </span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {settings.particleEffect === 'none'
                    ? isGerman
                      ? 'Canvas inaktiv (0% Last)'
                      : 'Canvas inactive (0% load)'
                    : `${settings.particleIntensity}% ${isGerman ? 'Intensität' : 'intensity'} • ${settings.particleSpeed || 1.0}x`}
                </div>
              </div>

              {/* Metric 3: Active Shader Effects */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  <span>{isGerman ? 'Grafikeffekte' : 'Graphic Effects'}</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs truncate">
                  {settings.backdropBlurIntensity ?? 16}px Blur
                  {settings.enableGlow && ' • Glow'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {settings.enableBreathingAnimation && !settings.ecoMode
                    ? isGerman
                      ? 'Pulsieren aktiv'
                      : 'Breathing pulse active'
                    : isGerman
                    ? 'Standard Rendering'
                    : 'Standard rendering'}
                </div>
              </div>
            </div>

            {/* Quick Toggle for Eco Mode to directly lower CPU Impact */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Leaf
                  className={`w-4 h-4 ${
                    settings.ecoMode ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-slate-300 text-[11px]">
                  {settings.ecoMode
                    ? isGerman
                      ? 'Eco-Modus ist aktiv (spart ~60% CPU & Akku)'
                      : 'Eco Mode active (saves ~60% CPU & battery)'
                    : isGerman
                    ? 'Eco-Modus zur CPU-Schonung aktivieren?'
                    : 'Activate Eco Mode to reduce CPU impact?'}
                </span>
              </div>

              {onUpdateSettings && (
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !settings.ecoMode;
                    onUpdateSettings((p) => ({ ...p, ecoMode: nextVal }));
                    if (showFeedback) {
                      showFeedback(
                        nextVal
                          ? isGerman
                            ? 'Eco-Modus aktiviert (CPU geschont)'
                            : 'Eco Mode activated (CPU saved)'
                          : isGerman
                          ? 'Eco-Modus deaktiviert (60 FPS)'
                          : 'Eco Mode deactivated (60 FPS)'
                      );
                    }
                    triggerHaptic(settings.vibrationEnabled);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    settings.ecoMode
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {settings.ecoMode
                    ? isGerman
                      ? 'Aktiviert'
                      : 'Enabled'
                    : isGerman
                    ? 'Aktivieren'
                    : 'Enable'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedBgId, LivelySettings } from '../types';
import { AnimatedBackgroundCanvas } from './AnimatedBackgroundCanvas';

interface SmoothAnimatedBackgroundProps {
  effectId: AnimatedBgId;
  speed?: number;
  intensity?: number;
  ecoMode?: boolean;
  blur?: number;
  blendMode?: React.CSSProperties['mixBlendMode'];
  opacity?: number; // 0.0 to 1.0 (default 1)
  lively?: Partial<LivelySettings>;
  className?: string;
}

/**
 * SmoothAnimatedBackground
 *
 * Implements a dual-buffer cross-fade transition between different
 * animated background scenes using hardware-accelerated CSS opacity transitions.
 * Supports Lively Wallpaper 3D parallax tilt, custom visual filters, and mixBlendMode.
 */
export const SmoothAnimatedBackground: React.FC<SmoothAnimatedBackgroundProps> = ({
  effectId,
  speed = 1.0,
  intensity = 80,
  ecoMode = false,
  blur = 0,
  blendMode,
  opacity,
  lively,
  className = '',
}) => {
  // Dual-buffer layers for silky-smooth CSS opacity cross-fades
  const [layerA, setLayerA] = useState<AnimatedBgId | null>(effectId);
  const [layerB, setLayerB] = useState<AnimatedBgId | null>(null);
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const prevEffectRef = useRef<AnimatedBgId>(effectId);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enableParallax = Boolean(lively?.enableParallax ?? true);
  const parallaxStrength = lively?.parallaxStrength ?? 16;

  // Lively 3D Mouse Parallax Tilt
  useEffect(() => {
    if (!enableParallax || typeof window === 'undefined') {
      setTilt({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      const normX = (e.clientX - halfW) / halfW;
      const normY = (e.clientY - halfH) / halfH;
      setTilt({
        x: -normY * (parallaxStrength * 0.35),
        y: normX * (parallaxStrength * 0.35),
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableParallax, parallaxStrength]);

  useEffect(() => {
    // If effectId has not changed, do nothing
    if (prevEffectRef.current === effectId) {
      return;
    }

    prevEffectRef.current = effectId;

    // Clear any in-flight timers from rapid consecutive clicks
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    if (activeLayer === 'A') {
      // 1. Mount new effect in Layer B with opacity-0
      setLayerB(effectId);

      // 2. Next tick: flip active layer to B so CSS opacity cross-fades
      transitionTimerRef.current = setTimeout(() => {
        setActiveLayer('B');
        transitionTimerRef.current = null;
      }, 35);

      // 3. Once the 700ms transition finishes, unmount Layer A to release CPU & GPU
      cleanupTimerRef.current = setTimeout(() => {
        setLayerA(null);
        cleanupTimerRef.current = null;
      }, 750);
    } else {
      // 1. Mount new effect in Layer A with opacity-0
      setLayerA(effectId);

      // 2. Next tick: flip active layer to A so CSS opacity cross-fades
      transitionTimerRef.current = setTimeout(() => {
        setActiveLayer('A');
        transitionTimerRef.current = null;
      }, 35);

      // 3. Once the 700ms transition finishes, unmount Layer B to release CPU & GPU
      cleanupTimerRef.current = setTimeout(() => {
        setLayerB(null);
        cleanupTimerRef.current = null;
      }, 750);
    }
  }, [effectId, activeLayer]);

  // Clean up all timers when component unmounts
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
    };
  }, []);

  // Compute visual shader filters (Lively Post-Processing)
  const filterParts: string[] = [];
  if (blur > 0) filterParts.push(`blur(${blur}px)`);
  if (lively?.hueShift) filterParts.push(`hue-rotate(${lively.hueShift}deg)`);
  if (typeof lively?.saturation === 'number' && lively.saturation !== 100) {
    filterParts.push(`saturate(${lively.saturation}%)`);
  }
  if (typeof lively?.brightness === 'number' && lively.brightness !== 100) {
    filterParts.push(`brightness(${lively.brightness}%)`);
  }
  if (typeof lively?.contrast === 'number' && lively.contrast !== 100) {
    filterParts.push(`contrast(${lively.contrast}%)`);
  }
  if (lively?.bloomIntensity && lively.bloomIntensity > 0) {
    filterParts.push(`drop-shadow(0 0 ${lively.bloomIntensity * 0.25}px rgba(56, 189, 248, 0.35))`);
  }

  const containerBlurStyle: React.CSSProperties = {
    filter: filterParts.length > 0 ? filterParts.join(' ') : undefined,
    transform: enableParallax
      ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.06)`
      : blur > 0
      ? 'scale(1.06)'
      : 'none',
    transition: enableParallax
      ? 'transform 120ms ease-out, filter 500ms ease, opacity 500ms ease'
      : 'filter 700ms ease, transform 700ms ease, opacity 500ms ease',
    mixBlendMode: blendMode || undefined,
    opacity: typeof opacity === 'number' ? Math.max(0, Math.min(1, opacity)) : 1,
  };

  return (
    <div
      id="smooth-animated-bg-container"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={containerBlurStyle}
    >
      {/* Buffer Layer A */}
      {layerA && (
        <div
          id="animated-bg-layer-a"
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out ${
            activeLayer === 'A' ? 'opacity-100 z-[2]' : 'opacity-0 z-[1]'
          }`}
          style={{ willChange: 'opacity' }}
        >
          <AnimatedBackgroundCanvas
            effectId={layerA}
            speed={speed}
            intensity={intensity}
            ecoMode={ecoMode}
            lively={lively}
          />
        </div>
      )}

      {/* Buffer Layer B */}
      {layerB && (
        <div
          id="animated-bg-layer-b"
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out ${
            activeLayer === 'B' ? 'opacity-100 z-[2]' : 'opacity-0 z-[1]'
          }`}
          style={{ willChange: 'opacity' }}
        >
          <AnimatedBackgroundCanvas
            effectId={layerB}
            speed={speed}
            intensity={intensity}
            ecoMode={ecoMode}
            lively={lively}
          />
        </div>
      )}
    </div>
  );
};


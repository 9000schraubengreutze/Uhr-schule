import React, { useState, useEffect, useRef } from 'react';
import { AnimatedBgId } from '../types';
import { AnimatedBackgroundCanvas } from './AnimatedBackgroundCanvas';

interface SmoothAnimatedBackgroundProps {
  effectId: AnimatedBgId;
  speed?: number;
  intensity?: number;
  ecoMode?: boolean;
  blur?: number;
  className?: string;
}

/**
 * SmoothAnimatedBackground
 *
 * Implements a dual-buffer cross-fade transition between different
 * animated background scenes using hardware-accelerated CSS opacity transitions.
 * When the user switches effects, the new canvas smoothly cross-dissolves over
 * 700ms while the outgoing canvas fades out. Once the transition completes,
 * the outgoing canvas unmounts to keep CPU and memory usage minimal.
 */
export const SmoothAnimatedBackground: React.FC<SmoothAnimatedBackgroundProps> = ({
  effectId,
  speed = 1.0,
  intensity = 80,
  ecoMode = false,
  blur = 0,
  className = '',
}) => {
  // Dual-buffer layers for silky-smooth CSS opacity cross-fades
  const [layerA, setLayerA] = useState<AnimatedBgId | null>(effectId);
  const [layerB, setLayerB] = useState<AnimatedBgId | null>(null);
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');

  const prevEffectRef = useRef<AnimatedBgId>(effectId);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const containerBlurStyle: React.CSSProperties = {
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    transform: blur > 0 ? 'scale(1.06)' : 'none',
    transition: 'filter 700ms ease, transform 700ms ease',
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
          />
        </div>
      )}
    </div>
  );
};

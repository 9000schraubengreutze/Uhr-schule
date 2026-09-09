import React, { useState, useEffect, useRef, type CSSProperties } from 'react';

interface SmoothBackgroundProps {
  style: CSSProperties;
  blur: number;
}

export const SmoothBackground: React.FC<SmoothBackgroundProps> = ({
  style,
  blur,
}) => {
  // Dual-buffer layers for silky-smooth CSS cross-fade transitions
  const [layerA, setLayerA] = useState<CSSProperties>(style);
  const [layerB, setLayerB] = useState<CSSProperties>(style);
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');

  const prevStyleKeyRef = useRef<string>('');

  // Serialize style keys and values to reliably detect theme/image/color changes
  const currentStyleKey = JSON.stringify(style);

  useEffect(() => {
    // Initial mount: record key and return
    if (!prevStyleKeyRef.current) {
      prevStyleKeyRef.current = currentStyleKey;
      return;
    }

    // If unchanged, do nothing
    if (prevStyleKeyRef.current === currentStyleKey) {
      return;
    }

    prevStyleKeyRef.current = currentStyleKey;

    let timer: NodeJS.Timeout;

    if (activeLayer === 'A') {
      // 1. Stage the new background into Layer B while B is transparent (opacity-0)
      setLayerB(style);
      // 2. Next tick, transition active layer to B so CSS opacity cross-fades
      timer = setTimeout(() => {
        setActiveLayer('B');
      }, 30);
    } else {
      // 1. Stage the new background into Layer A while A is transparent (opacity-0)
      setLayerA(style);
      // 2. Next tick, transition active layer to A so CSS opacity cross-fades
      timer = setTimeout(() => {
        setActiveLayer('A');
      }, 30);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [currentStyleKey, style, activeLayer]);

  const containerBlurStyle: CSSProperties = {
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    transform: blur > 0 ? 'scale(1.06)' : 'none',
    transition: 'filter 700ms ease, transform 700ms ease',
  };

  return (
    <div
      id="clock-bg-container"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={containerBlurStyle}
    >
      {/* Background Buffer Layer A */}
      <div
        id="clock-bg-layer-a"
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out ${
          activeLayer === 'A' ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
        }`}
        style={layerA}
      />

      {/* Background Buffer Layer B */}
      <div
        id="clock-bg-layer-b"
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out ${
          activeLayer === 'B' ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
        }`}
        style={layerB}
      />
    </div>
  );
};

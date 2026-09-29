import React, { useState, useEffect } from 'react';
import { LivelySettings } from '../types';

interface LivelyWebBackgroundProps {
  url: string;
  blur?: number;
  lively?: Partial<LivelySettings>;
  className?: string;
}

/**
 * LivelyWebBackground
 *
 * Renders interactive web pages, HTML5 canvas simulations, or WebGL shaders
 * as a fullscreen live wallpaper, matching Lively Wallpaper's Web Wallpaper engine.
 */
export const LivelyWebBackground: React.FC<LivelyWebBackgroundProps> = ({
  url,
  blur = 0,
  lively,
  className = '',
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const enableParallax = Boolean(lively?.enableParallax ?? true);
  const parallaxStrength = lively?.parallaxStrength ?? 16;

  // 3D Mouse Parallax Tilt
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

  const containerStyle: React.CSSProperties = {
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    transform: enableParallax
      ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.06)`
      : blur > 0
      ? 'scale(1.06)'
      : 'none',
    transition: 'transform 120ms ease-out, filter 700ms ease',
  };

  return (
    <div
      id="lively-web-wallpaper-container"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={containerStyle}
    >
      <iframe
        src={url}
        title="Lively Web Wallpaper"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        className="w-full h-full border-0 pointer-events-auto"
        loading="lazy"
      />
    </div>
  );
};

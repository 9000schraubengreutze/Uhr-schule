import React, { useRef, useEffect, useState } from 'react';
import { LivelySettings } from '../types';

interface LivelyVideoBackgroundProps {
  src: string;
  speed?: number;
  muted?: boolean;
  loop?: boolean;
  blur?: number;
  lively?: Partial<LivelySettings>;
  className?: string;
}

/**
 * LivelyVideoBackground
 *
 * Hardware-accelerated HTML5 video wallpaper player inspired by Lively Wallpaper.
 * Features customizable playback rate, looping, 3D mouse parallax tilt, and GPU shader color filters.
 */
export const LivelyVideoBackground: React.FC<LivelyVideoBackgroundProps> = ({
  src,
  speed = 1.0,
  muted = true,
  loop = true,
  blur = 0,
  lively,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const isPaused = Boolean(lively?.isPaused);
  const enableParallax = Boolean(lively?.enableParallax ?? true);
  const parallaxStrength = lively?.parallaxStrength ?? 16;

  // Handle Playback rate & Play/Pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = Math.max(0.25, Math.min(3.0, speed));

    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {
        // Autoplay policy fallback: mute and retry
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, [speed, isPaused, src]);

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

  // CSS Color & Visual Filter Styles
  const filterParts = [];
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
    filterParts.push(`drop-shadow(0 0 ${lively.bloomIntensity * 0.25}px rgba(56, 189, 248, 0.3))`);
  }

  const containerStyle: React.CSSProperties = {
    filter: filterParts.length > 0 ? filterParts.join(' ') : undefined,
    transform: enableParallax
      ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.06)`
      : blur > 0
      ? 'scale(1.06)'
      : 'none',
    transition: enableParallax
      ? 'transform 120ms ease-out, filter 500ms ease'
      : 'transform 700ms ease, filter 700ms ease',
  };

  return (
    <div
      id="lively-video-wallpaper-container"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={containerStyle}
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
};

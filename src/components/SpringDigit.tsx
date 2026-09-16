import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DigitTransition } from '../types';

export interface SpringDigitProps {
  digit: string;
  className?: string;
  id?: string;
  transitionType?: DigitTransition;
  durationMs?: number;
}

/**
 * SpringDigit (FluidClockDigit) renders an individual character or digit
 * with a subtle, silky fading transition whenever the value updates each second.
 */
export const SpringDigit: React.FC<SpringDigitProps> = ({
  digit,
  className = '',
  id,
  transitionType = 'fade',
  durationMs = 360,
}) => {
  if (transitionType === 'none') {
    return (
      <span
        id={id}
        className={`relative inline-block align-baseline select-none ${className}`}
        style={{ verticalAlign: 'baseline' }}
      >
        {digit}
      </span>
    );
  }

  const durationSec = Math.max(0.15, Math.min(0.8, (durationMs || 360) / 1000));
  const isFlip = transitionType === 'flip';

  // Determine transition configuration based on mode
  let initialStyle: any = { opacity: 0, scale: 0.96, y: '3%', filter: 'blur(3px)' };
  let animateStyle: any = { opacity: 1, scale: 1, y: '0%', filter: 'blur(0px)' };
  let exitStyle: any = { opacity: 0, scale: 1.04, y: '-3%', filter: 'blur(3px)' };
  let transitionEase: any = [0.16, 1, 0.3, 1]; // Fluid cubic ease-out

  if (transitionType === 'flip') {
    // 3D Flip transition with perspective and realistic lighting shift
    initialStyle = {
      opacity: 0,
      rotateX: -85,
      y: '-10%',
      scale: 0.95,
      filter: 'brightness(1.15)',
    };
    animateStyle = {
      opacity: 1,
      rotateX: 0,
      y: '0%',
      scale: 1,
      filter: 'brightness(1)',
    };
    exitStyle = {
      opacity: 0,
      rotateX: 85,
      y: '10%',
      scale: 0.95,
      filter: 'brightness(0.7)',
    };
    transitionEase = [0.22, 1, 0.36, 1];
  } else if (transitionType === 'crossfade') {
    // Pure in-place dissolve fade without vertical translation
    initialStyle = { opacity: 0 };
    animateStyle = { opacity: 1 };
    exitStyle = { opacity: 0 };
    transitionEase = [0.25, 1, 0.5, 1];
  } else if (transitionType === 'slide-fade') {
    // Kinetic slide combined with fading
    initialStyle = { opacity: 0, y: '16%', scale: 0.98 };
    animateStyle = { opacity: 1, y: '0%', scale: 1 };
    exitStyle = { opacity: 0, y: '-16%', scale: 0.98 };
    transitionEase = [0.16, 1, 0.3, 1];
  }

  return (
    <span
      id={id}
      className={`relative inline-block align-baseline ${isFlip ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
      style={{
        verticalAlign: 'baseline',
        perspective: isFlip ? '800px' : undefined,
        transformStyle: isFlip ? 'preserve-3d' : undefined,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={initialStyle}
          animate={animateStyle}
          exit={exitStyle}
          transition={{
            duration: durationSec,
            ease: transitionEase,
          }}
          style={
            isFlip
              ? {
                  transformOrigin: '50% 50%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }
              : undefined
          }
          className="inline-block will-change-transform will-change-[opacity,filter] select-none"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

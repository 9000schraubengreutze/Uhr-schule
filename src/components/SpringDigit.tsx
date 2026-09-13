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

  // Determine transition configuration based on mode
  let initialStyle: any = { opacity: 0, y: '4%', scale: 0.992 };
  let animateStyle: any = { opacity: 1, y: '0%', scale: 1 };
  let exitStyle: any = { opacity: 0, y: '-4%', scale: 0.992 };
  let transitionEase: any = [0.22, 1, 0.36, 1]; // Fluid cubic ease-out

  if (transitionType === 'crossfade') {
    // Pure in-place dissolve fade without any vertical translation
    initialStyle = { opacity: 0 };
    animateStyle = { opacity: 1 };
    exitStyle = { opacity: 0 };
    transitionEase = [0.25, 1, 0.5, 1];
  } else if (transitionType === 'slide-fade') {
    // Kinetic slide combined with fading
    initialStyle = { opacity: 0, y: '15%', scale: 0.985 };
    animateStyle = { opacity: 1, y: '0%', scale: 1 };
    exitStyle = { opacity: 0, y: '-15%', scale: 0.985 };
    transitionEase = [0.16, 1, 0.3, 1];
  }

  return (
    <span
      id={id}
      className={`relative inline-block overflow-hidden align-baseline ${className}`}
      style={{ verticalAlign: 'baseline' }}
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
          className="inline-block will-change-transform will-change-[opacity] select-none"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

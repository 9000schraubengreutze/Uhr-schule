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
 * SpringDigit (TactileClockDigit) renders an individual character or digit
 * with tactile, premium animations (such as 3D flip or precision slide)
 * whenever the value changes.
 */
export const SpringDigit: React.FC<SpringDigitProps> = ({
  digit,
  className = '',
  id,
  transitionType = 'flip',
  durationMs = 340,
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

  const durationSec = Math.max(0.18, Math.min(0.65, (durationMs || 340) / 1000));
  const isFlip = transitionType === 'flip';
  const isSlide = transitionType === 'slide';
  const isSlideFade = transitionType === 'slide-fade';

  // Default subtle fade animation styles
  let initialStyle: any = { opacity: 0, scale: 0.97, y: '3%', filter: 'blur(2px)' };
  let animateStyle: any = { opacity: 1, scale: 1, y: '0%', filter: 'blur(0px)' };
  let exitStyle: any = { opacity: 0, scale: 1.03, y: '-3%', filter: 'blur(2px)' };
  let transitionEase: any = [0.2, 1, 0.35, 1]; // Fluid cubic ease-out

  if (isFlip) {
    // Tactile 3D Split-Flap animation with realistic lighting dynamics and physics-inspired ease
    initialStyle = {
      opacity: 0,
      rotateX: -55,
      y: '-22%',
      scale: 0.98,
      filter: 'brightness(1.14)',
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
      rotateX: 55,
      y: '22%',
      scale: 0.98,
      filter: 'brightness(0.84)',
    };
    transitionEase = [0.2, 0.9, 0.35, 1]; // Snappy tactile snap with soft damping
  } else if (isSlide) {
    // Tactile mechanical tumbler / odometer precision slide
    initialStyle = {
      opacity: 0,
      y: '-60%',
      filter: 'blur(1px)',
    };
    animateStyle = {
      opacity: 1,
      y: '0%',
      filter: 'blur(0px)',
    };
    exitStyle = {
      opacity: 0,
      y: '60%',
      filter: 'blur(1px)',
    };
    transitionEase = [0.16, 1, 0.3, 1]; // Precision mechanical deceleration
  } else if (isSlideFade) {
    // Kinetic floating slide combined with gentle fading
    initialStyle = { opacity: 0, y: '25%', scale: 0.97 };
    animateStyle = { opacity: 1, y: '0%', scale: 1 };
    exitStyle = { opacity: 0, y: '-25%', scale: 0.97 };
    transitionEase = [0.2, 1, 0.35, 1];
  } else if (transitionType === 'crossfade') {
    // Pure in-place dissolve fade without vertical translation
    initialStyle = { opacity: 0 };
    animateStyle = { opacity: 1 };
    exitStyle = { opacity: 0 };
    transitionEase = [0.25, 1, 0.5, 1];
  }

  return (
    <span
      id={id}
      className={`relative inline-grid grid-cols-1 grid-rows-1 items-baseline select-none ${
        isFlip ? 'overflow-visible' : 'overflow-hidden'
      } ${className}`}
      style={{
        verticalAlign: 'baseline',
        perspective: isFlip ? '1200px' : undefined,
        transformStyle: isFlip ? 'preserve-3d' : undefined,
      }}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={digit}
          className="col-start-1 row-start-1 inline-block will-change-transform will-change-[opacity,filter] select-none text-center"
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
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

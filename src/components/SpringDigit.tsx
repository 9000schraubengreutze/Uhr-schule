import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SpringDigitProps {
  digit: string;
  className?: string;
  id?: string;
}

/**
 * SpringDigit renders a single character (digit or symbol) with a subtle spring animation
 * that slides up slightly and settles with a soft spring damper whenever the value changes.
 */
export const SpringDigit: React.FC<SpringDigitProps> = ({ digit, className = '', id }) => {
  return (
    <span
      id={id}
      className={`relative inline-block overflow-hidden align-baseline ${className}`}
      style={{ verticalAlign: 'baseline' }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: '26%', opacity: 0.28, scale: 0.985 }}
          animate={{ y: '0%', opacity: 1, scale: 1 }}
          exit={{ y: '-26%', opacity: 0, scale: 0.985 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 28,
            mass: 0.8,
          }}
          className="inline-block will-change-transform select-none"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

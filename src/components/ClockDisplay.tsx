import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { ClockSettings } from '../types';

interface ClockDisplayProps {
  settings: ClockSettings;
  offsetMs?: number;
  isAtomicActive?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  onOpenSyncSettings?: () => void;
}

export const ClockDisplay: React.FC<ClockDisplayProps> = ({
  settings,
  offsetMs = 0,
  isAtomicActive = false,
  syncStatus = 'synced',
  onOpenSyncSettings,
}) => {
  const [time, setTime] = useState<Date>(() => {
    const now = Date.now();
    return new Date(settings.useAtomicSync ? now + offsetMs : now);
  });

  const clockControls = useAnimation();
  const secondsControls = useAnimation();

  useEffect(() => {
    // High-precision clock tick: update every 50ms for instant second rollover
    let intervalId: NodeJS.Timeout;
    const update = () => {
      const now = Date.now();
      setTime(new Date(settings.useAtomicSync ? now + offsetMs : now));
    };
    intervalId = setInterval(update, 50);
    return () => clearInterval(intervalId);
  }, [settings.useAtomicSync, offsetMs]);

  // Format hours, minutes, seconds
  let hours = time.getHours();
  const rawMinutes = time.getMinutes();
  const rawSeconds = time.getSeconds();

  // Subtle breathing pulse animation triggered on every second tick
  useEffect(() => {
    if (settings.enableBreathingAnimation) {
      // Main clock container gentle breathing wave (scale 0.995 -> 1.012 -> 1.000)
      clockControls.start({
        scale: [0.995, 1.012, 1],
        opacity: [0.96, 1, 0.98],
        transition: {
          duration: 0.85,
          ease: [0.22, 1, 0.36, 1],
        },
      });

      // Micro-accent pulse on seconds digits
      if (settings.showSeconds) {
        secondsControls.start({
          scale: [0.985, 1.025, 1],
          transition: {
            duration: 0.65,
            ease: [0.16, 1, 0.3, 1],
          },
        });
      }
    } else {
      clockControls.set({ scale: 1, opacity: 1 });
      secondsControls.set({ scale: 1 });
    }
  }, [rawSeconds, settings.enableBreathingAnimation, settings.showSeconds, clockControls, secondsControls]);

  let ampm = '';
  if (!settings.is24Hour) {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
  }

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = rawMinutes.toString().padStart(2, '0');
  const formattedSeconds = rawSeconds.toString().padStart(2, '0');

  // Format German date
  const germanDate = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(time);

  // Determine font family class
  const fontClass =
    settings.clockFont === 'mono'
      ? 'font-mono-digital'
      : settings.clockFont === 'outfit'
      ? 'font-outfit'
      : 'font-inter';

  // Determine font weight class
  const weightClass =
    settings.clockWeight === '300'
      ? 'font-light'
      : settings.clockWeight === '400'
      ? 'font-normal'
      : settings.clockWeight === '800'
      ? 'font-extrabold'
      : 'font-semibold';

  // Format offset description
  const offsetDiffSec = Math.abs(offsetMs / 1000);
  const formattedOffset =
    offsetDiffSec < 0.05
      ? 'Exakt synchron'
      : `${offsetMs > 0 ? '+' : ''}${(offsetMs / 1000).toFixed(2)}s zur PC-Uhr`;

  return (
    <main
      id="clock-container"
      className="flex flex-col items-center justify-center text-center select-none z-10 px-4 py-8 max-w-7xl w-full mx-auto"
    >
      {/* Time Display with Bold Typography, subtle ambient drop shadow and gentle second breathing */}
      <motion.div
        id="digital-clock"
        animate={clockControls}
        className={`flex items-baseline justify-center tracking-tighter leading-none ${fontClass} ${weightClass} tabular-numbers drop-shadow-2xl transition-all duration-300 origin-center will-change-transform`}
        style={{
          color: settings.clockColor,
          filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.12))',
        }}
      >
        {/* Hours */}
        <span className="text-[clamp(4rem,18vw,13.5rem)] inline-block">
          {formattedHours}
        </span>

        {/* Colon 1 */}
        <span
          className={`text-[clamp(3.5rem,15vw,11.5rem)] px-1 sm:px-2 relative -top-[0.04em] font-normal transition-opacity duration-300 ${
            settings.showBlinkingSeparator && rawSeconds % 2 !== 0 ? 'opacity-30' : 'opacity-100'
          }`}
        >
          :
        </span>

        {/* Minutes */}
        <span className="text-[clamp(4rem,18vw,13.5rem)] inline-block">
          {formattedMinutes}
        </span>

        {/* Seconds (optional) */}
        {settings.showSeconds && (
          <>
            <span
              className={`text-[clamp(3.5rem,15vw,11.5rem)] px-1 sm:px-2 relative -top-[0.04em] font-normal transition-opacity duration-300 ${
                settings.showBlinkingSeparator && rawSeconds % 2 !== 0 ? 'opacity-30' : 'opacity-100'
              }`}
            >
              :
            </span>
            <motion.span
              animate={secondsControls}
              className="text-[clamp(3.2rem,14.5vw,11rem)] inline-block opacity-95 origin-center will-change-transform"
            >
              {formattedSeconds}
            </motion.span>
          </>
        )}

        {/* AM/PM indicator for 12-hour mode */}
        {!settings.is24Hour && (
          <span className="ml-3 sm:ml-5 text-[clamp(1rem,3vw,2.2rem)] tracking-wider font-semibold uppercase opacity-80 self-center py-1 px-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl">
            {ampm}
          </span>
        )}
      </motion.div>

      {/* Date Display: font-light tracking-[0.2em] uppercase opacity-70 */}
      {settings.showDate && (
        <div
          id="date-display"
          className="mt-3 sm:mt-5 text-[clamp(0.95rem,2.2vw,1.65rem)] font-light tracking-[0.2em] uppercase opacity-70 transition-all duration-300"
          style={{ color: settings.clockColor }}
        >
          {germanDate}
        </div>
      )}
    </main>
  );
};

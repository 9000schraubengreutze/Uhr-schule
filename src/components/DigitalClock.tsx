import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { ClockSettings } from '../types';
import { playTickSound } from '../utils/audio';

interface DigitalClockProps {
  settings: ClockSettings;
  offsetMs?: number;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({ settings, offsetMs = 0 }) => {
  // Directly calculate time based on online atomic clock offset
  const getCalculatedTime = () => {
    const nowMs = Date.now();
    return new Date(settings.useAtomicSync ? nowMs + offsetMs : nowMs);
  };

  const [time, setTime] = useState<Date>(getCalculatedTime);
  const lastSecondRef = useRef<number>(time.getSeconds());

  const clockControls = useAnimation();
  const secondsControls = useAnimation();

  useEffect(() => {
    // High-frequency polling (50ms) guarantees exact alignment with online atomic clock
    const interval = setInterval(() => {
      const nowMs = Date.now();
      const current = new Date(settings.useAtomicSync ? nowMs + offsetMs : nowMs);
      setTime(current);

      const curSec = current.getSeconds();
      if (curSec !== lastSecondRef.current) {
        lastSecondRef.current = curSec;
        if (settings.soundEnabled) {
          playTickSound(0.06);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [settings.soundEnabled, settings.useAtomicSync, offsetMs]);

  // Breathing pulse animation synchronized with device second tick
  useEffect(() => {
    if (settings.enableBreathingAnimation) {
      clockControls.start({
        scale: [0.996, 1.008, 1],
        transition: {
          duration: 0.85,
          ease: [0.22, 1, 0.36, 1],
        },
      });

      if (settings.showSeconds) {
        secondsControls.start({
          scale: [0.98, 1.03, 1],
          transition: {
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          },
        });
      }
    } else {
      clockControls.set({ scale: 1 });
      secondsControls.set({ scale: 1 });
    }
  }, [time.getSeconds(), settings.enableBreathingAnimation, settings.showSeconds, clockControls, secondsControls]);

  // Resolve target timezone (default to 'Europe/Berlin' so devices with wrong Windows timezones still show exact German atomic time)
  const targetTimeZone =
    !settings.timeZone || settings.timeZone === 'Europe/Berlin'
      ? 'Europe/Berlin'
      : settings.timeZone === 'auto'
      ? undefined
      : settings.timeZone;

  // High-precision time formatting in target timezone
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: targetTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !settings.is24Hour,
  }).formatToParts(time);

  const formattedHours = timeParts.find((p) => p.type === 'hour')?.value || '00';
  const formattedMinutes = timeParts.find((p) => p.type === 'minute')?.value || '00';
  const formattedSeconds = timeParts.find((p) => p.type === 'second')?.value || '00';
  const ampm =
    (!settings.is24Hour &&
      timeParts.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase()) ||
    '';

  const currentSecondsNum = parseInt(formattedSeconds, 10) || 0;

  // Date formatting based on selected language and target timezone
  const locale = settings.appLanguage === 'en' ? 'en-US' : 'de-DE';
  const formattedDate = new Intl.DateTimeFormat(locale, {
    timeZone: targetTimeZone,
    weekday: settings.showDayOfWeek ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(time);

  // Font family resolution
  const fontClass =
    settings.clockFont === 'mono'
      ? 'font-mono-digital'
      : settings.clockFont === 'outfit'
      ? 'font-outfit'
      : settings.clockFont === 'school'
      ? 'font-school'
      : 'font-inter';

  // Font weight resolution
  const weightClass =
    settings.clockWeight === '300'
      ? 'font-light'
      : settings.clockWeight === '400'
      ? 'font-normal'
      : settings.clockWeight === '800'
      ? 'font-extrabold'
      : 'font-semibold';

  // Colon blink logic
  const isColonVisible = !settings.showBlinkingSeparator || currentSecondsNum % 2 === 0;

  // Glow styling
  const glowStyle = settings.enableGlow
    ? {
        filter: 'drop-shadow(0 0 35px var(--accent-glow, rgba(56,189,248,0.35)))',
      }
    : {};

  return (
    <div
      id="digital-clock-centerpiece"
      className="flex flex-col items-center justify-center text-center select-none w-full max-w-5xl mx-auto px-4"
      style={{
        transform: `scale(${settings.clockScale / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className={`w-full flex flex-col items-center justify-center transition-all duration-300 ${
          settings.showCardContainer
            ? 'p-8 sm:p-12 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 shadow-2xl'
            : ''
        }`}
      >
        <motion.div
          animate={clockControls}
          className="flex flex-col items-center justify-center w-full will-change-transform"
        >
          {/* Main Digits Row */}
          <div
            id="digital-time-display"
            className={`flex items-baseline justify-center tracking-tighter leading-none ${fontClass} ${weightClass} tabular-numbers`}
            style={{
              color: 'var(--clock-color, ' + settings.clockColor + ')',
              ...glowStyle,
              transition: 'color 400ms ease, filter 400ms ease',
            }}
          >
            {/* Hours */}
            <span
              id="clock-hours"
              className="text-[clamp(4.5rem,19vw,14rem)] inline-block select-none"
            >
              {formattedHours}
            </span>

            {/* Colon Separator 1 */}
            <span
              id="clock-colon-1"
              aria-hidden="true"
              className={`text-[clamp(3.8rem,16vw,12rem)] px-1 sm:px-2 relative -top-[0.04em] font-normal transition-opacity duration-200 select-none ${
                isColonVisible ? 'opacity-100' : 'opacity-25'
              }`}
            >
              :
            </span>

            {/* Minutes */}
            <span
              id="clock-minutes"
              className="text-[clamp(4.5rem,19vw,14rem)] inline-block select-none"
            >
              {formattedMinutes}
            </span>

            {/* Optional Seconds */}
            {settings.showSeconds && (
              <>
                <span
                  id="clock-colon-2"
                  aria-hidden="true"
                  className={`text-[clamp(3.8rem,16vw,12rem)] px-1 sm:px-2 relative -top-[0.04em] font-normal transition-opacity duration-200 select-none ${
                    isColonVisible ? 'opacity-100' : 'opacity-25'
                  }`}
                >
                  :
                </span>
                <motion.span
                  id="clock-seconds"
                  animate={secondsControls}
                  className="text-[clamp(3.4rem,14.5vw,11rem)] inline-block opacity-90 select-none will-change-transform"
                >
                  {formattedSeconds}
                </motion.span>
              </>
            )}

            {/* 12-Hour AM / PM Badge */}
            {!settings.is24Hour && ampm && (
              <span
                id="clock-ampm-badge"
                className="ml-3 sm:ml-5 text-[clamp(1rem,3vw,2rem)] tracking-wider font-bold uppercase self-center py-1.5 px-3 sm:px-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-md transition-all select-none"
              >
                {ampm}
              </span>
            )}
          </div>

          {/* Optional Date String */}
          {settings.showDate && (
            <AnimatePresence mode="wait">
              <motion.div
                id="digital-date-display"
                key={formattedDate}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.85, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="mt-3 sm:mt-5 text-[clamp(0.95rem,2.2vw,1.6rem)] font-light tracking-[0.18em] uppercase select-none"
                style={{
                  color: 'var(--clock-color, ' + settings.clockColor + ')',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                {formattedDate}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
};

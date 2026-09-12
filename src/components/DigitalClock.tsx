import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Coffee, GraduationCap, Lock } from 'lucide-react';
import { ClockSettings } from '../types';
import { playTickSound } from '../utils/audio';
import { AdditionalTimeZonesBar } from './AdditionalTimeZonesBar';
import { SpringDigit } from './SpringDigit';
import { SchoolStatusResult } from '../utils/timetable';

interface DigitalClockProps {
  settings: ClockSettings;
  offsetMs?: number;
  statusResult?: SchoolStatusResult;
  onOpenTimetable?: () => void;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  settings,
  offsetMs = 0,
  statusResult,
  onOpenTimetable,
}) => {
  // Directly calculate time based on online atomic clock offset
  const getCalculatedTime = () => {
    const nowMs = Date.now();
    return new Date(settings.useAtomicSync ? nowMs + offsetMs : nowMs);
  };

  const [time, setTime] = useState<Date>(getCalculatedTime);
  const lastSecondRef = useRef<number>(time.getSeconds());

  const clockControls = useAnimation();
  const secondsControls = useAnimation();
  const colonControls = useAnimation();

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

  // Colon animation type and intensity
  const colonAnimType = settings.colonAnimation || (settings.showBlinkingSeparator ? 'blink' : 'pulse');
  const colonIntensity = typeof settings.colonPulseIntensity === 'number' ? settings.colonPulseIntensity : 0.6;

  // Pulse & ticking animation synchronized with device second tick
  useEffect(() => {
    const curSec = time.getSeconds();

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

    // Colon separator animation matching the ticking movement
    if (colonAnimType === 'pulse') {
      const scalePeak = 1 + 0.2 * colonIntensity;
      const minOpacity = 1 - 0.5 * colonIntensity;
      colonControls.start({
        scale: [1, scalePeak, 1],
        opacity: [minOpacity, 1, 1],
        transition: {
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        },
      });
    } else if (colonAnimType === 'glow') {
      const peakScale = 1 + 0.12 * colonIntensity;
      colonControls.start({
        scale: [1, peakScale, 1],
        filter: [
          'drop-shadow(0 0 2px var(--accent-color, #38bdf8))',
          `drop-shadow(0 0 ${20 * colonIntensity}px var(--accent-color, #38bdf8))`,
          'drop-shadow(0 0 2px var(--accent-color, #38bdf8))',
        ],
        transition: {
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        },
      });
    } else if (colonAnimType === 'bounce') {
      const yDelta = -5 * colonIntensity;
      colonControls.start({
        y: [0, yDelta, 0],
        transition: {
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1],
        },
      });
    } else if (colonAnimType === 'blink') {
      const isVisible = curSec % 2 === 0;
      colonControls.set({
        scale: 1,
        opacity: isVisible ? 1 : Math.max(0.1, 1 - colonIntensity),
        y: 0,
        filter: 'none',
      });
    } else {
      // static
      colonControls.set({ scale: 1, opacity: 1, y: 0, filter: 'none' });
    }
  }, [
    time.getSeconds(),
    settings.enableBreathingAnimation,
    settings.showSeconds,
    colonAnimType,
    colonIntensity,
    clockControls,
    secondsControls,
    colonControls,
  ]);

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

  // Date formatting based on selected dateFormat and target timezone
  const locale = settings.appLanguage === 'en' ? 'en-US' : 'de-DE';
  const dateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: targetTimeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(time);

  const dayVal = dateParts.find((p) => p.type === 'day')?.value || '01';
  const monthVal = dateParts.find((p) => p.type === 'month')?.value || '01';
  const yearVal = dateParts.find((p) => p.type === 'year')?.value || '2026';

  let dateCore = `${dayVal}.${monthVal}.${yearVal}`;
  if (settings.dateFormat === 'MM/DD/YYYY') {
    dateCore = `${monthVal}/${dayVal}/${yearVal}`;
  } else if (settings.dateFormat === 'YYYY-MM-DD') {
    dateCore = `${yearVal}-${monthVal}-${dayVal}`;
  }

  let formattedDate = dateCore;
  if (settings.showDayOfWeek) {
    const weekdayName = new Intl.DateTimeFormat(locale, {
      timeZone: targetTimeZone,
      weekday: 'long',
    }).format(time);
    formattedDate = `${weekdayName}, ${dateCore}`;
  }

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
            ? 'p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-700/50 shadow-2xl'
            : ''
        }`}
        style={
          settings.showCardContainer
            ? {
                backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
              }
            : undefined
        }
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
              className="text-[clamp(4.5rem,19vw,14rem)] inline-flex items-baseline select-none"
            >
              {formattedHours.split('').map((char, index) => (
                <SpringDigit
                  key={`h-${index}`}
                  digit={char}
                  id={`clock-hour-digit-${index}`}
                />
              ))}
            </span>

            {/* Colon Separator 1 */}
            <motion.span
              id="clock-colon-1"
              aria-hidden="true"
              animate={colonControls}
              className="text-[clamp(3.8rem,16vw,12rem)] px-1 sm:px-2 relative -top-[0.04em] font-normal select-none inline-block will-change-transform will-change-[filter,opacity]"
            >
              :
            </motion.span>

            {/* Minutes */}
            <span
              id="clock-minutes"
              className="text-[clamp(4.5rem,19vw,14rem)] inline-flex items-baseline select-none"
            >
              {formattedMinutes.split('').map((char, index) => (
                <SpringDigit
                  key={`m-${index}`}
                  digit={char}
                  id={`clock-minute-digit-${index}`}
                />
              ))}
            </span>

            {/* Optional Seconds */}
            {settings.showSeconds && (
              <>
                <motion.span
                  id="clock-colon-2"
                  aria-hidden="true"
                  animate={colonControls}
                  className="text-[clamp(3.8rem,16vw,12rem)] px-1 sm:px-2 relative -top-[0.04em] font-normal select-none inline-block will-change-transform will-change-[filter,opacity]"
                >
                  :
                </motion.span>
                <motion.span
                  id="clock-seconds"
                  animate={secondsControls}
                  className="text-[clamp(3.4rem,14.5vw,11rem)] inline-flex items-baseline opacity-90 select-none will-change-transform"
                >
                  {formattedSeconds.split('').map((char, index) => (
                    <SpringDigit
                      key={`s-${index}`}
                      digit={char}
                      id={`clock-second-digit-${index}`}
                    />
                  ))}
                </motion.span>
              </>
            )}

            {/* 12-Hour AM / PM Badge */}
            {!settings.is24Hour && ampm && (
              <span
                id="clock-ampm-badge"
                className="ml-3 sm:ml-5 text-[clamp(1rem,3vw,2rem)] tracking-wider font-bold uppercase self-center py-1.5 px-3 sm:px-4 rounded-2xl border border-white/20 bg-white/10 shadow-md transition-all select-none"
                style={{
                  backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                  WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                }}
              >
                {ampm}
              </span>
            )}
          </div>

          {/* Optional Date String */}
          {settings.showDate && (
            <div
              id="digital-date-display"
              className="mt-3 sm:mt-5 text-[clamp(0.95rem,2.2vw,1.6rem)] font-light tracking-[0.18em] uppercase select-none opacity-85 transition-colors duration-300"
              style={{
                color: 'var(--clock-color, ' + settings.clockColor + ')',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {formattedDate}
            </div>
          )}

          {/* Additional Time Zones (World Clock directly below main clock) */}
          {settings.showAdditionalTimeZones && (
            <AdditionalTimeZonesBar
              time={time}
              settings={settings}
              mainTimeZone={targetTimeZone}
            />
          )}

          {/* School Status / Timetable Badge */}
          {settings.showSchoolBadge && statusResult && (
            <div className="mt-3.5 sm:mt-4.5 flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenTimetable}
                title="Stundenplan HO 2 (Frau Schmitz) öffnen"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all cursor-pointer select-none active:scale-95 ${
                  statusResult.status === 'break'
                    ? 'bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-600/70 text-emerald-200'
                    : !statusResult.isGameAllowed
                    ? 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-700/80 text-slate-300'
                    : 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800 text-slate-400'
                }`}
                style={{
                  backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                  WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                }}
              >
                {statusResult.status === 'break' ? (
                  <>
                    <Coffee className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="font-semibold text-emerald-300">
                      {statusResult.currentBreak?.name} (noch {statusResult.currentBreak?.remainingMinutes} Min.) • Games frei!
                    </span>
                  </>
                ) : !statusResult.isGameAllowed ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      HO 2: {statusResult.currentPeriod}. Std. {statusResult.currentLesson?.subject} ({statusResult.currentLesson?.teacher}) • Pause {statusResult.nextBreak?.start || '10:30'} Uhr
                    </span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      HO 2 • {statusResult.status === 'weekend' ? 'Wochenende' : 'Freizeit'} • Stundenplan
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

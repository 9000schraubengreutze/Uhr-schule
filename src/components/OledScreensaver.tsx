import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, ShieldCheck, Battery, BatteryCharging, Power } from 'lucide-react';
import { ClockSettings } from '../types';

interface OledScreensaverProps {
  settings: ClockSettings;
  offsetMs?: number;
  onWake: () => void;
}

export const OledScreensaver: React.FC<OledScreensaverProps> = ({
  settings,
  offsetMs = 0,
  onWake,
}) => {
  const screensaverConfig = settings.screensaver;
  const brightness = (screensaverConfig?.brightness ?? 25) / 100;
  const antiBurnIn = screensaverConfig?.antiBurnInShift ?? true;
  const style = screensaverConfig?.displayStyle ?? 'minimal';

  // Real-time clock calculation
  const getNow = useCallback(() => {
    const nowMs = Date.now();
    return new Date(settings.useAtomicSync ? nowMs + offsetMs : nowMs);
  }, [settings.useAtomicSync, offsetMs]);

  const [currentTime, setCurrentTime] = useState<Date>(getNow);

  // Battery status state
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  // Anti-Burn-In periodic position shift (Orbiting)
  // Shifts coordinates subtly every 35 seconds to ensure static pixels never burn into OLED diodes
  const [shiftOffset, setShiftOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [microShift, setMicroShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Temporary wake hint opacity (fades out after 6 seconds to eliminate any static pixel burn-in)
  const [showWakeHint, setShowWakeHint] = useState(true);

  // Clock tick timer
  useEffect(() => {
    // If showSeconds is enabled, tick every 1000ms; otherwise, tick every 5000ms to save CPU
    const tickInterval = screensaverConfig?.showSeconds ? 1000 : 5000;
    const interval = setInterval(() => {
      setCurrentTime(getNow());
    }, tickInterval);

    return () => clearInterval(interval);
  }, [getNow, screensaverConfig?.showSeconds]);

  // Anti-Burn-In Pixel Orbiting: periodically shift position smoothly
  useEffect(() => {
    if (!antiBurnIn) {
      setShiftOffset({ x: 0, y: 0 });
      return;
    }

    // Set initial small offset
    const getRandomOffset = () => ({
      // Orbiting safe range: ±80px horizontal, ±50px vertical
      x: Math.round((Math.random() * 2 - 1) * 85),
      y: Math.round((Math.random() * 2 - 1) * 55),
    });

    setShiftOffset(getRandomOffset());

    const orbitInterval = setInterval(() => {
      setShiftOffset(getRandomOffset());
    }, 35000); // Shift every 35 seconds

    // Subpixel micro-jitter every 60s (±2px) to prevent subpixel edge phosphor fatigue
    const jitterInterval = setInterval(() => {
      setMicroShift({
        x: Math.round((Math.random() * 2 - 1) * 2),
        y: Math.round((Math.random() * 2 - 1) * 2),
      });
    }, 60000);

    return () => {
      clearInterval(orbitInterval);
      clearInterval(jitterInterval);
    };
  }, [antiBurnIn]);

  // Wake hint auto-fadeout
  useEffect(() => {
    setShowWakeHint(true);
    const hintTimer = setTimeout(() => {
      setShowWakeHint(false);
    }, 6500);

    return () => clearTimeout(hintTimer);
  }, []);

  // Battery detection API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);

          const updateBattery = () => {
            setBatteryLevel(Math.round(battery.level * 100));
            setIsCharging(battery.charging);
          };

          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);

          return () => {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
          };
        })
        .catch(() => {
          // Battery API not supported or rejected
        });
    }
  }, []);

  // Format time digits
  const { hoursStr, minutesStr, secondsStr, ampmStr } = useMemo(() => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    let ampm = '';
    if (!settings.is24Hour) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
    }

    return {
      hoursStr: hours.toString().padStart(2, '0'),
      minutesStr: minutes.toString().padStart(2, '0'),
      secondsStr: seconds.toString().padStart(2, '0'),
      ampmStr: ampm,
    };
  }, [currentTime, settings.is24Hour]);

  // Format minimalist date
  const dateFormatted = useMemo(() => {
    try {
      const locale = settings.appLanguage === 'en' ? 'en-US' : 'de-DE';
      return currentTime.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return '';
    }
  }, [currentTime, settings.appLanguage]);

  // Combined translation vector for Anti-Burn-In
  const totalTranslateX = shiftOffset.x + microShift.x;
  const totalTranslateY = shiftOffset.y + microShift.y;

  return (
    <motion.div
      id="oled-screensaver-overlay"
      role="dialog"
      aria-label="OLED Sleep Bildschirmschoner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      onClick={onWake}
      className="fixed inset-0 z-[120] cursor-pointer select-none overflow-hidden flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#000000', // PURE OLED TRUE BLACK: 0 nits, organic pixels unlit
      }}
    >
      {/* Anti-Burn-In Floating Container with slow, organic glide */}
      <div
        className="flex flex-col items-center justify-center p-6 text-center will-change-transform"
        style={{
          transform: `translate3d(${totalTranslateX}px, ${totalTranslateY}px, 0)`,
          transition: 'transform 4.5s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {/* Style: Minimalist Horizontal */}
        {style === 'minimal' && (
          <div className="flex flex-col items-center">
            <div className="flex items-baseline justify-center tracking-tight font-light select-none">
              <span
                className="text-7xl sm:text-8xl md:text-9xl font-extralight tracking-tight"
                style={{
                  color: `rgba(241, 245, 249, ${brightness})`,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {hoursStr}
              </span>

              {/* Subdued colon separator with very faint slow breath */}
              <span
                className="text-6xl sm:text-7xl md:text-8xl px-2 font-thin"
                style={{
                  color: `rgba(241, 245, 249, ${brightness * 0.75})`,
                }}
              >
                :
              </span>

              <span
                className="text-7xl sm:text-8xl md:text-9xl font-extralight tracking-tight"
                style={{
                  color: `rgba(241, 245, 249, ${brightness})`,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {minutesStr}
              </span>

              {/* Optional Subtle Seconds */}
              {screensaverConfig?.showSeconds && (
                <span
                  className="text-2xl sm:text-3xl md:text-4xl font-light ml-3"
                  style={{
                    color: `rgba(241, 245, 249, ${brightness * 0.5})`,
                  }}
                >
                  {secondsStr}
                </span>
              )}

              {/* Optional AM/PM */}
              {ampmStr && (
                <span
                  className="text-lg sm:text-xl font-medium uppercase ml-3 tracking-widest"
                  style={{
                    color: `rgba(241, 245, 249, ${brightness * 0.6})`,
                  }}
                >
                  {ampmStr}
                </span>
              )}
            </div>

            {/* Minimalist Date Under Time */}
            {screensaverConfig?.showDate && (
              <p
                className="mt-3 text-sm sm:text-base font-light tracking-wide capitalize"
                style={{
                  color: `rgba(203, 213, 225, ${brightness * 0.65})`,
                }}
              >
                {dateFormatted}
              </p>
            )}
          </div>
        )}

        {/* Style: Modern / Rounded Tabular */}
        {style === 'modern' && (
          <div className="flex flex-col items-center">
            <div
              className="px-8 py-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-center gap-2"
              style={{
                boxShadow: '0 0 30px rgba(0,0,0,0.8)',
              }}
            >
              <span
                className="text-7xl sm:text-8xl md:text-9xl font-medium tracking-tighter font-mono"
                style={{
                  color: `rgba(248, 250, 252, ${brightness})`,
                }}
              >
                {hoursStr}:{minutesStr}
              </span>

              {screensaverConfig?.showSeconds && (
                <span
                  className="text-3xl sm:text-4xl font-normal font-mono"
                  style={{
                    color: `rgba(248, 250, 252, ${brightness * 0.5})`,
                  }}
                >
                  {secondsStr}
                </span>
              )}

              {ampmStr && (
                <span
                  className="text-base font-bold uppercase tracking-wider ml-1"
                  style={{
                    color: `rgba(248, 250, 252, ${brightness * 0.6})`,
                  }}
                >
                  {ampmStr}
                </span>
              )}
            </div>

            {screensaverConfig?.showDate && (
              <p
                className="mt-4 text-xs sm:text-sm font-medium tracking-widest uppercase"
                style={{
                  color: `rgba(148, 163, 184, ${brightness * 0.7})`,
                }}
              >
                {dateFormatted}
              </p>
            )}
          </div>
        )}

        {/* Style: Vertical Stacked (Pixel / Android Always-On Display style) */}
        {style === 'vertical' && (
          <div className="flex flex-col items-center leading-none">
            <span
              className="text-8xl sm:text-9xl md:text-[11rem] font-extralight tracking-tighter"
              style={{
                color: `rgba(241, 245, 249, ${brightness})`,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {hoursStr}
            </span>
            <span
              className="text-8xl sm:text-9xl md:text-[11rem] font-extralight tracking-tighter -mt-4 sm:-mt-6"
              style={{
                color: `rgba(203, 213, 225, ${brightness * 0.85})`,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {minutesStr}
            </span>

            {screensaverConfig?.showDate && (
              <p
                className="mt-4 text-xs sm:text-sm font-light tracking-widest uppercase"
                style={{
                  color: `rgba(148, 163, 184, ${brightness * 0.6})`,
                }}
              >
                {dateFormatted}
              </p>
            )}
          </div>
        )}

        {/* Style: Dots / Minimal Dotted */}
        {style === 'dots' && (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4">
              <span
                className="text-7xl sm:text-8xl md:text-9xl font-light tracking-wider"
                style={{
                  color: `rgba(241, 245, 249, ${brightness})`,
                  fontFamily: 'monospace',
                }}
              >
                {hoursStr}
              </span>
              <div className="flex flex-col gap-3 py-2">
                <span
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                  style={{ backgroundColor: `rgba(241, 245, 249, ${brightness * 0.7})` }}
                />
                <span
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                  style={{ backgroundColor: `rgba(241, 245, 249, ${brightness * 0.7})` }}
                />
              </div>
              <span
                className="text-7xl sm:text-8xl md:text-9xl font-light tracking-wider"
                style={{
                  color: `rgba(241, 245, 249, ${brightness})`,
                  fontFamily: 'monospace',
                }}
              >
                {minutesStr}
              </span>
            </div>

            {screensaverConfig?.showDate && (
              <p
                className="mt-4 text-xs sm:text-sm font-light tracking-widest uppercase font-mono"
                style={{
                  color: `rgba(148, 163, 184, ${brightness * 0.6})`,
                }}
              >
                {dateFormatted}
              </p>
            )}
          </div>
        )}

        {/* Minimal Battery & Status Pill (Only if battery level exists and showBattery is on) */}
        {screensaverConfig?.showBattery && batteryLevel !== null && (
          <div
            className="mt-5 flex items-center gap-1.5 text-xs font-mono"
            style={{
              color: `rgba(148, 163, 184, ${brightness * 0.55})`,
            }}
          >
            {isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5" />
            ) : (
              <Battery className="w-3.5 h-3.5" />
            )}
            <span>{batteryLevel}%</span>
          </div>
        )}

        {/* OLED Protection Badge Indicator (Very faint) */}
        {antiBurnIn && (
          <div
            className="mt-3 flex items-center gap-1 text-[10px] tracking-wider uppercase"
            style={{
              color: `rgba(100, 116, 139, ${brightness * 0.4})`,
            }}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>OLED Pixel-Shift aktiv</span>
          </div>
        )}
      </div>

      {/* Temporary Wake-up Hint (Fades out after 6.5s to prevent static pixel burn-in) */}
      <AnimatePresence>
        {showWakeHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-8 flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02]"
            style={{
              color: `rgba(148, 163, 184, ${brightness * 0.6})`,
            }}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              Sleep-Zustand • Tippen, drücken oder bewegen zum Aufwecken
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

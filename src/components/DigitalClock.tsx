import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Coffee, GraduationCap, Lock, Palette } from 'lucide-react';
import { ClockSettings } from '../types';
import { playTickSound } from '../utils/audio';
import { AdditionalTimeZonesBar } from './AdditionalTimeZonesBar';
import { DailyQuoteWidget } from './DailyQuoteWidget';
import { SpringDigit } from './SpringDigit';
import { SchoolStatusResult } from '../utils/timetable';
import { ClockColorPickerPopover, ColorScope } from './ClockColorPickerPopover';
import { colorWithAlpha, calculateRadiatingTextShadow } from '../utils/colorUtils';

interface DigitalClockProps {
  settings: ClockSettings;
  offsetMs?: number;
  statusResult?: SchoolStatusResult;
  onOpenTimetable?: () => void;
  onUpdateSettings?: (updater: (prev: ClockSettings) => ClockSettings) => void;
  onColorPickerOpenChange?: (isOpen: boolean) => void;
  isZenMode?: boolean;
  isSettingsOpen?: boolean;
  isAnyMenuOpen?: boolean;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  settings,
  offsetMs = 0,
  statusResult,
  onOpenTimetable,
  onUpdateSettings,
  onColorPickerOpenChange,
  isZenMode,
  isSettingsOpen,
  isAnyMenuOpen,
}) => {
  // Directly calculate time based on online atomic clock offset
  const getCalculatedTime = () => {
    const nowMs = Date.now();
    return new Date(settings.useAtomicSync ? nowMs + offsetMs : nowMs);
  };

  const [time, setTime] = useState<Date>(getCalculatedTime);
  const lastSecondRef = useRef<number>(time.getSeconds());

  // Interactive clock color changing state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [colorPickerScope, setColorPickerScope] = useState<ColorScope>('all');
  const [isHovered, setIsHovered] = useState(false);
  const [isContainerHovered, setIsContainerHovered] = useState(false);

  const openColorPicker = (scope: ColorScope) => {
    setColorPickerScope(scope);
    setIsColorPickerOpen(true);
    onColorPickerOpenChange?.(true);
  };

  const closeColorPicker = () => {
    setIsColorPickerOpen(false);
    onColorPickerOpenChange?.(false);
  };

  const clockControls = useAnimation();
  const secondsControls = useAnimation();
  const colonControls = useAnimation();

  const containerRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLDivElement>(null);

  // CSS-based entrance animation states (triggered on screen wake, menu exits, or Zen mode toggle)
  const [entranceKey, setEntranceKey] = useState(0);
  const [isEntranceActive, setIsEntranceActive] = useState(true);
  const prevZenModeRef = useRef<boolean | undefined>(undefined);
  const prevMenuOpenRef = useRef<boolean | undefined>(undefined);

  const triggerEntranceAnimation = useCallback(() => {
    if (settings.enableEntranceAnimation === false) return;
    setEntranceKey((k) => k + 1);
    setIsEntranceActive(true);
  }, [settings.enableEntranceAnimation]);

  // 1. Trigger entrance when user wakes the screen / returns to window / tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        settings.enableEntranceAnimation !== false &&
        settings.entranceWakeScreenEnabled !== false
      ) {
        triggerEntranceAnimation();
      }
    };

    const handleWindowFocus = () => {
      if (
        settings.enableEntranceAnimation !== false &&
        settings.entranceWakeScreenEnabled !== false
      ) {
        triggerEntranceAnimation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [settings.enableEntranceAnimation, settings.entranceWakeScreenEnabled, triggerEntranceAnimation]);

  // 2. Trigger entrance when user exits any menu (settings drawer, games, stopwatch, chat, bg studio)
  const menuCurrentlyOpen = Boolean(isAnyMenuOpen ?? isSettingsOpen);
  useEffect(() => {
    if (prevMenuOpenRef.current === undefined) {
      prevMenuOpenRef.current = menuCurrentlyOpen;
      return;
    }
    if (prevMenuOpenRef.current === true && !menuCurrentlyOpen) {
      if (
        settings.enableEntranceAnimation !== false &&
        settings.entranceMenuExitEnabled !== false
      ) {
        triggerEntranceAnimation();
      }
    }
    prevMenuOpenRef.current = menuCurrentlyOpen;
  }, [menuCurrentlyOpen, settings.enableEntranceAnimation, settings.entranceMenuExitEnabled, triggerEntranceAnimation]);

  // 3. Trigger entrance when user toggles Zen mode
  useEffect(() => {
    if (prevZenModeRef.current === undefined) {
      prevZenModeRef.current = isZenMode;
      return;
    }
    if (prevZenModeRef.current !== isZenMode) {
      prevZenModeRef.current = isZenMode;
      if (
        settings.enableEntranceAnimation !== false &&
        settings.entranceZenToggleEnabled !== false
      ) {
        triggerEntranceAnimation();
      }
    }
  }, [isZenMode, settings.enableEntranceAnimation, settings.entranceZenToggleEnabled, triggerEntranceAnimation]);

  // 4. Listen for custom event trigger (e.g. settings drawer preview or external control)
  useEffect(() => {
    const handleEntranceTrigger = () => {
      if (settings.enableEntranceAnimation !== false) {
        triggerEntranceAnimation();
      }
    };
    window.addEventListener('trigger-clock-entrance', handleEntranceTrigger);
    return () => window.removeEventListener('trigger-clock-entrance', handleEntranceTrigger);
  }, [settings.enableEntranceAnimation, triggerEntranceAnimation]);

  const isEntranceEnabled = settings.enableEntranceAnimation !== false;
  const getEntranceClass = () => {
    if (!isEntranceEnabled || !isEntranceActive) return '';
    switch (settings.entranceAnimationType) {
      case 'slide-down':
        return 'animate-clock-slide-down';
      case 'fade-in':
        return 'animate-clock-fade-in';
      case 'rotate':
        return 'animate-clock-rotate';
      case 'zoom-in':
        return 'animate-clock-zoom';
      case 'flip':
        return 'animate-clock-flip';
      case 'slide-up':
      default:
        return 'animate-clock-slide-up';
    }
  };
  const entranceClass = getEntranceClass();

  const isAutoScaling = settings.autoScaleFontSize ?? true;

  // Initial font size estimation based on viewport dimensions
  const [autoFontSizePx, setAutoFontSizePx] = useState<number>(() => {
    if (typeof window === 'undefined') return 120;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const approx = Math.min(w * 0.16, h * 0.35);
    return Math.max(36, Math.min(480, Math.round(approx)));
  });

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
      : settings.clockFont === 'serif'
      ? 'font-serif-clock'
      : settings.clockFont === 'outfit'
      ? 'font-outfit'
      : settings.clockFont === 'school'
      ? 'font-school'
      : settings.clockFont === 'sans'
      ? 'font-sans-clock'
      : 'font-inter';

  // Tracking adjusted for typography style
  const trackingClass =
    settings.clockFont === 'serif'
      ? 'tracking-normal'
      : settings.clockFont === 'mono'
      ? 'tracking-tight'
      : 'tracking-tighter';

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

  // Glow effect parameters & radiating shadows
  const glowEnabled = Boolean(settings.enableGlow);
  const glowIntensity = typeof settings.glowIntensity === 'number' ? settings.glowIntensity : 55;
  const glowSpread = typeof settings.glowSpread === 'number' ? settings.glowSpread : 45;
  const glowIntensityFactor = glowEnabled ? Math.max(0, Math.min(1, glowIntensity / 100)) : 0;

  // Resolve individual segment colors (with fallback to main clockColor)
  const hoursColor = settings.hoursColor || settings.clockColor;
  const minutesColor = settings.minutesColor || settings.clockColor;
  const secondsColor = settings.secondsColor || settings.clockColor;
  const colonColor = settings.colonColor || settings.clockColor;

  // Custom or fallback color for radiating glow
  const primaryGlowColor = settings.glowColor || settings.clockColor || '#38bdf8';
  const hoursGlowColor = settings.glowColor || hoursColor;
  const minutesGlowColor = settings.glowColor || minutesColor;
  const secondsGlowColor = settings.glowColor || secondsColor;
  const colonGlowColor = settings.glowColor || colonColor;

  // Multi-layered radiating text shadows for each segment
  const hoursGlowShadow =
    glowEnabled && glowIntensityFactor > 0
      ? calculateRadiatingTextShadow(hoursGlowColor, glowIntensity, glowSpread)
      : undefined;

  const minutesGlowShadow =
    glowEnabled && glowIntensityFactor > 0
      ? calculateRadiatingTextShadow(minutesGlowColor, glowIntensity, glowSpread)
      : undefined;

  const secondsGlowShadow =
    glowEnabled && glowIntensityFactor > 0
      ? calculateRadiatingTextShadow(secondsGlowColor, glowIntensity, glowSpread)
      : undefined;

  const colonGlowShadow =
    glowEnabled && glowIntensityFactor > 0
      ? calculateRadiatingTextShadow(
          colonGlowColor,
          Math.max(10, Math.round(glowIntensity * 0.7)),
          Math.max(8, Math.round(glowSpread * 0.7))
        )
      : undefined;

  // Glow styling on overall container
  const glowStyle =
    glowEnabled && glowIntensityFactor > 0
      ? {
          filter: `drop-shadow(0 0 ${Math.max(4, Math.round(glowSpread * 0.4))}px ${colorWithAlpha(
            primaryGlowColor,
            0.38 * glowIntensityFactor
          )})`,
        }
      : {};

  // Dynamically calculate optimal font size based on container & browser window dimensions
  useEffect(() => {
    if (!isAutoScaling) return;

    const calculateOptimalFontSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const parentEl = container.parentElement;
      const availableWidth = parentEl?.clientWidth || container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
      const availableHeight = parentEl?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);

      // Padding factor: ensures clock breathes comfortably and fits within card/screen borders
      const paddingFactor = settings.showCardContainer ? 0.86 : 0.94;
      const targetWidth = Math.max(260, availableWidth * paddingFactor);

      // Usable height: subtract space needed for secondary elements
      let reservedHeight = 80;
      if (settings.showDate) reservedHeight += 46;
      if (settings.showAdditionalTimeZones) reservedHeight += 72;
      if (settings.showSchoolBadge && statusResult) reservedHeight += 48;
      if (settings.showCardContainer) reservedHeight += 76;

      const targetHeight = Math.max(90, (availableHeight - reservedHeight) * 0.78);

      // Em-width resolution based on active font typography and active segments
      const isMono = settings.clockFont === 'mono';
      const digitEm = isMono ? 0.62 : settings.clockFont === 'serif' ? 0.58 : 0.56;
      const colonEm = isMono ? 0.32 : 0.26;

      // Base hours + colon + minutes: 4 digits + 1 colon
      let totalEmWidth = 4 * digitEm + colonEm;

      // Seconds: + colon + 2 digits at 0.82em scale
      if (settings.showSeconds) {
        totalEmWidth += colonEm + 2 * (digitEm * 0.82);
      }

      // 12-Hour AM/PM badge
      if (!settings.is24Hour && ampm) {
        totalEmWidth += 1.15;
      }

      // Safety buffer for character padding & letter tracking
      totalEmWidth += 0.18;

      // Font size based on both width and height constraints
      const widthBasedFontSize = targetWidth / totalEmWidth;
      const heightBasedFontSize = targetHeight / 1.05;

      // Optimal font size ensuring clock fits both dimensions
      const optimalSize = Math.min(widthBasedFontSize, heightBasedFontSize);

      // Apply user fine-tuning scale (70% - 140%)
      const userMultiplier = (settings.clockScale || 100) / 100;
      let finalSize = Math.round(optimalSize * userMultiplier);

      // DOM measurement refinement if rendered to avoid any subpixel wrapping
      if (timeDisplayRef.current && timeDisplayRef.current.scrollWidth > 0) {
        const measuredWidth = timeDisplayRef.current.scrollWidth;
        if (measuredWidth > targetWidth + 4) {
          finalSize = Math.round(finalSize * (targetWidth / measuredWidth));
        }
      }

      const clampedSize = Math.max(32, Math.min(520, finalSize));
      setAutoFontSizePx(clampedSize);
    };

    calculateOptimalFontSize();

    let rafId: number | null = null;
    const scheduleCalc = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateOptimalFontSize);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleCalc();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
        if (containerRef.current.parentElement) {
          resizeObserver.observe(containerRef.current.parentElement);
        }
      }
    }

    window.addEventListener('resize', scheduleCalc);
    window.addEventListener('orientationchange', scheduleCalc);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleCalc);
      window.removeEventListener('orientationchange', scheduleCalc);
    };
  }, [
    isAutoScaling,
    settings.clockScale,
    settings.showSeconds,
    settings.is24Hour,
    settings.clockFont,
    settings.showDate,
    settings.showAdditionalTimeZones,
    settings.showSchoolBadge,
    settings.showCardContainer,
    statusResult,
    ampm,
  ]);

  return (
    <div
      ref={containerRef}
      id="digital-clock-centerpiece"
      onMouseEnter={() => setIsContainerHovered(true)}
      onMouseLeave={() => setIsContainerHovered(false)}
      className={`group/clock relative flex flex-col items-center justify-center text-center select-none w-full ${
        isAutoScaling
          ? settings.showCardContainer
            ? 'max-w-7xl mx-auto px-3 sm:px-6'
            : 'max-w-none px-2 sm:px-4'
          : 'max-w-5xl mx-auto px-4'
      }`}
      style={{
        transform: isAutoScaling ? undefined : `scale(${settings.clockScale / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Subtle Ambient Hover Glow Layer behind the entire clock container */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 sm:-inset-8 -z-10 rounded-[44px] overflow-visible transition-all duration-500 ease-out select-none will-change-transform"
        style={{
          opacity: isContainerHovered ? 1 : 0,
          transform: isContainerHovered ? 'scale(1.015)' : 'scale(0.98)',
          background: `radial-gradient(ellipse 75% 65% at 50% 50%, ${colorWithAlpha(
            primaryGlowColor,
            settings.showCardContainer ? 0.22 : 0.26
          )} 0%, ${colorWithAlpha(
            primaryGlowColor,
            settings.showCardContainer ? 0.08 : 0.1
          )} 48%, transparent 80%)`,
          filter: 'blur(36px)',
        }}
      />

      <div
        key={entranceKey}
        id="clock-display-entrance-wrapper"
        onAnimationEnd={() => setIsEntranceActive(false)}
        className={`w-full flex flex-col items-center justify-center transition-all duration-300 ${entranceClass} ${
          settings.showCardContainer
            ? 'p-8 sm:p-12 rounded-3xl bg-slate-900/60 border shadow-2xl hover:-translate-y-0.5'
            : 'hover:-translate-y-0.5'
        }`}
        style={
          settings.showCardContainer
            ? {
                backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                borderColor: isContainerHovered
                  ? colorWithAlpha(primaryGlowColor, 0.45)
                  : 'rgba(51, 65, 85, 0.5)',
                boxShadow: isContainerHovered
                  ? `0 30px 65px rgba(0,0,0,0.65), 0 0 35px ${colorWithAlpha(
                      primaryGlowColor,
                      0.22
                    )}, 0 0 14px ${colorWithAlpha(
                      primaryGlowColor,
                      0.14
                    )}, inset 0 0 24px ${colorWithAlpha(primaryGlowColor, 0.06)}`
                  : '0 25px 50px -12px rgba(0,0,0,0.5)',
                transition:
                  'border-color 300ms ease, box-shadow 350ms ease, backdrop-filter 300ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : {
                transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              }
        }
      >
        <motion.div
          animate={clockControls}
          className="flex flex-col items-center justify-center w-full will-change-transform"
        >
          {/* Main Digits Row with Click-To-Change-Color interactivity */}
          <div
            ref={timeDisplayRef}
            id="digital-time-display"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              openColorPicker('all');
            }}
            title="Klicken, um die Ziffernfarbe anzupassen"
            className={`relative flex items-baseline justify-center ${trackingClass} leading-none ${fontClass} ${weightClass} tabular-numbers group cursor-pointer`}
            style={{
              fontSize: isAutoScaling ? `${autoFontSizePx}px` : undefined,
              color: 'var(--clock-color, ' + settings.clockColor + ')',
              transform: isHovered ? 'scale(1.008)' : 'scale(1)',
              ...glowStyle,
              transition: 'color 400ms ease, filter 400ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Ambient Radiating Backlight Glow Layer (radiating from behind the digits) */}
            {glowEnabled && glowIntensityFactor > 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-8 sm:-inset-x-12 -inset-y-6 sm:-inset-y-8 -z-10 flex items-center justify-center select-none overflow-visible will-change-transform"
                style={{
                  opacity: Math.min(1, glowIntensityFactor * (isHovered ? 1.3 : 1.15)),
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transition: 'opacity 300ms ease, filter 300ms ease, transform 300ms ease',
                }}
              >
                {/* Primary wide diffused radiating aura */}
                <div
                  className="w-full h-full max-w-[115%] rounded-[60px]"
                  style={{
                    background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${colorWithAlpha(
                      primaryGlowColor,
                      0.55 * glowIntensityFactor
                    )} 0%, ${colorWithAlpha(
                      primaryGlowColor,
                      0.26 * glowIntensityFactor
                    )} 45%, ${colorWithAlpha(
                      primaryGlowColor,
                      0.07 * glowIntensityFactor
                    )} 75%, transparent 100%)`,
                    filter: `blur(${Math.round(glowSpread * 0.95)}px)`,
                    transform: 'translate3d(0, 0, 0)',
                  }}
                />
                {/* Secondary core hot glow radiating directly behind the digits */}
                <div
                  className="absolute inset-x-6 inset-y-3 rounded-[40px]"
                  style={{
                    background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${colorWithAlpha(
                      primaryGlowColor,
                      0.45 * glowIntensityFactor
                    )} 0%, ${colorWithAlpha(
                      primaryGlowColor,
                      0.12 * glowIntensityFactor
                    )} 60%, transparent 80%)`,
                    filter: `blur(${Math.max(4, Math.round(glowSpread * 0.42))}px)`,
                  }}
                />
              </div>
            )}

            {/* Hours */}
            <span
              id="clock-hours"
              onClick={(e) => {
                e.stopPropagation();
                openColorPicker('hours');
              }}
              title="Stunden: Klicken zum Ändern der Farbe"
              className={`${
                isAutoScaling ? 'text-[1em]' : 'text-[clamp(4.5rem,19vw,14rem)]'
              } inline-flex items-baseline select-none transition-all duration-200 ease-out hover:brightness-125 hover:scale-[1.03] hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(255,255,255,0.08)] active:scale-[0.97] rounded-2xl px-1.5`}
              style={{
                color: hoursColor,
                textShadow: hoursGlowShadow,
              }}
            >
              {formattedHours.split('').map((char, index) => (
                <SpringDigit
                  key={`h-${index}`}
                  digit={char}
                  id={`clock-hour-digit-${index}`}
                  transitionType={settings.digitTransition}
                  durationMs={settings.digitFadeDuration}
                />
              ))}
            </span>

            {/* Colon Separator 1 */}
            <motion.span
              id="clock-colon-1"
              aria-hidden="true"
              animate={colonControls}
              onClick={(e) => {
                e.stopPropagation();
                openColorPicker('all');
              }}
              title="Klicken, um Ziffernfarbe zu ändern"
              className={`${
                isAutoScaling ? 'text-[0.84em] px-[0.06em]' : 'text-[clamp(3.8rem,16vw,12rem)] px-1 sm:px-2'
              } relative -top-[0.04em] font-normal select-none inline-block will-change-transform will-change-[filter,opacity] hover:brightness-150 hover:scale-115 active:scale-90 transition-all duration-150 cursor-pointer`}
              style={{
                color: colonColor,
                textShadow: colonGlowShadow,
              }}
            >
              :
            </motion.span>

            {/* Minutes */}
            <span
              id="clock-minutes"
              onClick={(e) => {
                e.stopPropagation();
                openColorPicker('minutes');
              }}
              title="Minuten: Klicken zum Ändern der Farbe"
              className={`${
                isAutoScaling ? 'text-[1em]' : 'text-[clamp(4.5rem,19vw,14rem)]'
              } inline-flex items-baseline select-none transition-all duration-200 ease-out hover:brightness-125 hover:scale-[1.03] hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(255,255,255,0.08)] active:scale-[0.97] rounded-2xl px-1.5`}
              style={{
                color: minutesColor,
                textShadow: minutesGlowShadow,
              }}
            >
              {formattedMinutes.split('').map((char, index) => (
                <SpringDigit
                  key={`m-${index}`}
                  digit={char}
                  id={`clock-minute-digit-${index}`}
                  transitionType={settings.digitTransition}
                  durationMs={settings.digitFadeDuration}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    openColorPicker('all');
                  }}
                  title="Klicken, um Ziffernfarbe zu ändern"
                  className={`${
                    isAutoScaling ? 'text-[0.84em] px-[0.06em]' : 'text-[clamp(3.8rem,16vw,12rem)] px-1 sm:px-2'
                  } relative -top-[0.04em] font-normal select-none inline-block will-change-transform will-change-[filter,opacity] hover:brightness-150 hover:scale-115 active:scale-90 transition-all duration-150 cursor-pointer`}
                  style={{
                    color: colonColor,
                    textShadow: colonGlowShadow,
                  }}
                >
                  :
                </motion.span>
                <motion.span
                  id="clock-seconds"
                  animate={secondsControls}
                  onClick={(e) => {
                    e.stopPropagation();
                    openColorPicker('seconds');
                  }}
                  title="Sekunden: Klicken zum Ändern der Farbe"
                  className={`${
                    isAutoScaling ? 'text-[0.82em]' : 'text-[clamp(3.4rem,14.5vw,11rem)]'
                  } inline-flex items-baseline opacity-90 select-none will-change-transform transition-all duration-200 ease-out hover:brightness-125 hover:scale-[1.04] hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] active:scale-[0.97] rounded-2xl px-1.5`}
                  style={{
                    color: secondsColor,
                    textShadow: secondsGlowShadow,
                  }}
                >
                  {formattedSeconds.split('').map((char, index) => (
                    <SpringDigit
                      key={`s-${index}`}
                      digit={char}
                      id={`clock-second-digit-${index}`}
                      transitionType={settings.digitTransition}
                      durationMs={settings.digitFadeDuration}
                    />
                  ))}
                </motion.span>
              </>
            )}

            {/* 12-Hour AM / PM Badge */}
            {!settings.is24Hour && ampm && (
              <span
                id="clock-ampm-badge"
                className={`${
                  isAutoScaling
                    ? 'ml-[0.22em] text-[0.2em] py-[0.2em] px-[0.45em]'
                    : 'ml-3 sm:ml-5 text-[clamp(1rem,3vw,2rem)] py-1.5 px-3 sm:px-4'
                } tracking-wider font-bold uppercase self-center rounded-2xl border border-white/20 bg-white/10 shadow-md hover:bg-white/20 hover:scale-105 hover:border-white/35 active:scale-95 transition-all duration-200 cursor-pointer select-none`}
                style={{
                  backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                  WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                }}
              >
                {ampm}
              </span>
            )}
          </div>

          {/* Quick Hover Action Chip for Changing Color */}
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 mt-2.5 rounded-full text-xs font-medium border shadow-lg transition-all duration-200 ease-out cursor-pointer active:scale-95 ${
              isHovered
                ? 'opacity-100 translate-y-0 bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80 hover:border-blue-500/50 text-slate-200 hover:text-white hover:scale-105 hover:shadow-[0_6px_20px_rgba(59,130,246,0.25)]'
                : 'opacity-0 -translate-y-1 pointer-events-none'
            }`}
            style={{
              backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
              WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              openColorPicker('all');
            }}
            title="Klicken, um Ziffernfarbe zu ändern"
          >
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span>Farbe anpassen</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">(Ziffern anklicken)</span>
          </div>

          {/* Optional Date String */}
          {settings.showDate && (
            <div
              id="digital-date-display"
              className={`${
                isAutoScaling
                  ? 'mt-3 text-[clamp(0.95rem,0.16em,2rem)]'
                  : 'mt-3 sm:mt-5 text-[clamp(0.95rem,2.2vw,1.6rem)]'
              } font-light tracking-[0.18em] uppercase select-none opacity-85 transition-colors duration-300`}
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
              onUpdateSettings={onUpdateSettings}
            />
          )}

          {/* Optional Daily Quote Widget */}
          {settings.showDailyQuote && (
            <DailyQuoteWidget
              font={settings.quoteFont}
              color={settings.quoteColor}
              authorColor={settings.quoteAuthorColor}
              backdropBlur={settings.backdropBlurIntensity}
              isZenMode={isZenMode}
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

      {/* Interactive Clock & Digits Color Picker Modal */}
      {onUpdateSettings && (
        <ClockColorPickerPopover
          isOpen={isColorPickerOpen}
          onClose={closeColorPicker}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          initialScope={colorPickerScope}
        />
      )}
    </div>
  );
};

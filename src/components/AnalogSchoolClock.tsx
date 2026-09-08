import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ClockSettings } from '../types';
import { getSpokenTimePhrase } from '../utils/timePhrases';
import { playTickSound, triggerHaptic } from '../utils/audio';
import { Play, RotateCcw, Clock, Sparkles } from 'lucide-react';

interface AnalogSchoolClockProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  offsetMs?: number;
  onOpenQuiz?: () => void;
}

export const AnalogSchoolClock: React.FC<AnalogSchoolClockProps> = ({
  settings,
  onUpdateSettings,
  offsetMs = 0,
  onOpenQuiz,
}) => {
  const [now, setNow] = useState(() => new Date(Date.now() + offsetMs));
  const [isDraggingHand, setIsDraggingHand] = useState<'hour' | 'minute' | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Synchronize internal time
  useEffect(() => {
    if (!settings.isLiveMode) {
      return;
    }

    const updateTimer = () => {
      const current = new Date(Date.now() + offsetMs);
      setNow(current);

      if (settings.soundEnabled && settings.showSecondHand) {
        playTickSound(0.04);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [settings.isLiveMode, offsetMs, settings.soundEnabled, settings.showSecondHand]);

  // Compute effective hours, minutes, seconds
  const currentHours = settings.isLiveMode ? now.getHours() : settings.manualHour;
  const currentMinutes = settings.isLiveMode ? now.getMinutes() : settings.manualMinute;
  const currentSeconds = settings.isLiveMode ? now.getSeconds() : settings.manualSecond;
  const currentMillis = settings.isLiveMode ? now.getMilliseconds() : 0;

  // Angles in degrees
  // Minute hand: 6 degrees per minute + 0.1 deg per sec
  const minuteAngle = (currentMinutes + currentSeconds / 60) * 6;

  // Hour hand: 30 degrees per hour + 0.5 deg per minute
  const hourAngle = ((currentHours % 12) + currentMinutes / 60) * 30;

  // Second hand: 6 deg per sec (+ fractional if smooth)
  const secondAngle = settings.secondHandMode === 'smooth' && settings.isLiveMode
    ? (currentSeconds + currentMillis / 1000) * 6
    : currentSeconds * 6;

  // Spoken natural phrase
  const spokenPhrase = getSpokenTimePhrase(currentHours, currentMinutes, settings.timeLanguage);

  // Digital time formatted string
  const digitalTimeStr = (() => {
    let h = currentHours;
    let ampm = '';
    if (!settings.is24Hour) {
      ampm = h >= 12 ? ' PM' : ' AM';
      h = h % 12 || 12;
    }
    const hStr = h.toString().padStart(2, '0');
    const mStr = currentMinutes.toString().padStart(2, '0');
    const sStr = currentSeconds.toString().padStart(2, '0');
    return settings.showSeconds ? `${hStr}:${mStr}:${sStr}${ampm}` : `${hStr}:${mStr}${ampm}`;
  })();

  // Hand Dragging logic
  const handlePointerDown = (hand: 'hour' | 'minute', e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setIsDraggingHand(hand);

    // If currently in live mode, switch to manual mode on drag
    if (settings.isLiveMode) {
      onUpdateSettings((prev) => ({
        ...prev,
        isLiveMode: false,
        manualHour: now.getHours(),
        manualMinute: now.getMinutes(),
        manualSecond: now.getSeconds(),
      }));
    }

    if (settings.vibrationEnabled) {
      triggerHaptic(15);
    }
  };

  const calculateAngleFromPointer = useCallback((clientX: number, clientY: number): number => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angleRad = Math.atan2(dy, dx) + Math.PI / 2;
    if (angleRad < 0) angleRad += 2 * Math.PI;
    return (angleRad * 180) / Math.PI;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingHand) return;
    const deg = calculateAngleFromPointer(e.clientX, e.clientY);

    if (isDraggingHand === 'minute') {
      const calculatedMinute = Math.round(deg / 6) % 60;
      onUpdateSettings((prev) => {
        if (prev.manualMinute !== calculatedMinute) {
          if (prev.soundEnabled) playTickSound(0.03);
          return { ...prev, manualMinute: calculatedMinute };
        }
        return prev;
      });
    } else if (isDraggingHand === 'hour') {
      const roughHour12 = Math.round(deg / 30) % 12 || 12;
      onUpdateSettings((prev) => {
        const isPM = prev.manualHour >= 12;
        const newHour = isPM ? (roughHour12 === 12 ? 12 : roughHour12 + 12) : (roughHour12 === 12 ? 0 : roughHour12);
        if (prev.manualHour !== newHour) {
          if (prev.soundEnabled) playTickSound(0.04);
          return { ...prev, manualHour: newHour };
        }
        return prev;
      });
    }
  }, [isDraggingHand, calculateAngleFromPointer, onUpdateSettings]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingHand) {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      setIsDraggingHand(null);
    }
  }, [isDraggingHand]);

  // Quick Time Stepper Helpers
  const stepMinutes = (delta: number) => {
    onUpdateSettings((prev) => {
      let totalMinutes = prev.isLiveMode
        ? now.getHours() * 60 + now.getMinutes() + delta
        : prev.manualHour * 60 + prev.manualMinute + delta;

      if (totalMinutes < 0) totalMinutes += 24 * 60;
      totalMinutes = totalMinutes % (24 * 60);

      const newHour = Math.floor(totalMinutes / 60);
      const newMinute = totalMinutes % 60;

      if (prev.soundEnabled) playTickSound(0.05);
      if (prev.vibrationEnabled) triggerHaptic(10);

      return {
        ...prev,
        isLiveMode: false,
        manualHour: newHour,
        manualMinute: newMinute,
      };
    });
  };

  const returnToLive = () => {
    onUpdateSettings((prev) => ({ ...prev, isLiveMode: true }));
    if (settings.vibrationEnabled) triggerHaptic(20);
  };

  // Font family selector class
  const fontClass =
    settings.clockFont === 'mono'
      ? 'font-mono-digital'
      : settings.clockFont === 'outfit'
      ? 'font-outfit'
      : settings.clockFont === 'school'
      ? 'font-sans tracking-wide font-bold'
      : 'font-inter';

  return (
    <div
      id="school-clock-wrapper"
      className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 py-6 select-none z-10"
      style={{
        transform: `scale(${settings.clockScale / 100})`,
        transition: settings.enableAnimations ? 'transform 300ms ease-out' : 'none',
      }}
    >
      {/* Live / Manual Mode Status Pill */}
      <div className="flex items-center gap-3 mb-4">
        {settings.isLiveMode ? (
          <div
            id="live-mode-badge"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Jetzt-Modus (Echtzeit)
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              id="manual-mode-badge"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-md"
            >
              <Clock className="w-3.5 h-3.5" />
              Lernmodus (Interaktiv)
            </div>
            <button
              type="button"
              onClick={returnToLive}
              id="btn-return-live"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-medium transition-all shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Auf Jetzt zurückstellen
            </button>
          </div>
        )}

        {onOpenQuiz && (
          <button
            type="button"
            onClick={onOpenQuiz}
            id="btn-quick-quiz"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/80 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-purple-200" />
            Quiz starten
          </button>
        )}
      </div>

      {/* Analog Clock Face SVG */}
      <div className="relative w-full max-w-[380px] sm:max-w-[440px] aspect-square flex items-center justify-center drop-shadow-2xl">
        <svg
          ref={svgRef}
          viewBox="-200 -200 400 400"
          className="w-full h-full overflow-visible touch-none cursor-default"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Soft Ambient Bezel Shadow */}
            <radialGradient id="dial-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
            </radialGradient>

            {/* Hub Metallic Gradient */}
            <radialGradient id="hub-gradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="60%" stopColor={settings.accentColor} />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>

          {/* Clock Outer Ring & Dial Plate */}
          <circle
            cx="0"
            cy="0"
            r="192"
            fill={settings.themeMode === 'light' ? '#ffffff' : '#0f172a'}
            fillOpacity={settings.dialTransparency / 100}
            stroke={settings.ringColor}
            strokeWidth="8"
            className="transition-all duration-300"
          />

          {/* Ambient rim overlay */}
          <circle cx="0" cy="0" r="192" fill="url(#dial-shadow)" pointerEvents="none" />

          {/* Didactic Quarter / Half Colored Sectors */}
          {settings.showQuarterHalfSectors && (
            <g id="quarter-half-sectors" opacity="0.32" pointerEvents="none">
              {/* Quarter 1: Viertel nach (0 to 15 min = 0 to 90 deg) */}
              <path
                d="M 0 0 L 0 -186 A 186 186 0 0 1 186 0 Z"
                fill="#10b981"
                className="transition-colors duration-300"
              />
              {/* Quarter 2: Vor Halb / Halb (15 to 30 min = 90 to 180 deg) */}
              <path
                d="M 0 0 L 186 0 A 186 186 0 0 1 0 186 Z"
                fill="#f59e0b"
                className="transition-colors duration-300"
              />
              {/* Quarter 3: Nach Halb / Viertel vor (30 to 45 min = 180 to 270 deg) */}
              <path
                d="M 0 0 L 0 186 A 186 186 0 0 1 -186 0 Z"
                fill="#ef4444"
                className="transition-colors duration-300"
              />
              {/* Quarter 4: Vor der vollen Stunde (45 to 60 min = 270 to 360 deg) */}
              <path
                d="M 0 0 L -186 0 A 186 186 0 0 1 0 -186 Z"
                fill="#3b82f6"
                className="transition-colors duration-300"
              />
            </g>
          )}

          {/* Minute Guidelines / Tick Marks */}
          {settings.showHelpLines && (
            <g id="tick-marks">
              {Array.from({ length: 60 }).map((_, i) => {
                const isFiveMin = i % 5 === 0;
                const tickAngle = i * 6;
                const r1 = isFiveMin ? 168 : 176;
                const r2 = 184;
                const rad = (tickAngle * Math.PI) / 180;
                const x1 = Math.sin(rad) * r1;
                const y1 = -Math.cos(rad) * r1;
                const x2 = Math.sin(rad) * r2;
                const y2 = -Math.cos(rad) * r2;

                return (
                  <line
                    key={`tick-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isFiveMin
                        ? settings.minuteHandColor
                        : settings.themeMode === 'light'
                        ? '#64748b'
                        : '#94a3b8'
                    }
                    strokeWidth={isFiveMin ? 3.5 : 1.5}
                    strokeLinecap="round"
                    opacity={isFiveMin ? 0.9 : 0.45}
                  />
                );
              })}
            </g>
          )}

          {/* Minute Numbers (Minutenring 5, 10, 15 ... 60) */}
          {settings.showMinuteRing && (
            <g id="minute-numbers">
              {Array.from({ length: 12 }).map((_, i) => {
                const minVal = (i + 1) * 5;
                const minStr = minVal === 60 ? '60' : minVal.toString().padStart(2, '0');
                const angle = minVal * 6;
                const rad = (angle * Math.PI) / 180;
                const r = 154;
                const x = Math.sin(rad) * r;
                const y = -Math.cos(rad) * r + 4;

                return (
                  <text
                    key={`min-num-${minVal}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={settings.minuteHandColor}
                    className="font-mono-digital font-bold text-[11px] select-none"
                    opacity="0.9"
                  >
                    {minStr}
                  </text>
                );
              })}
            </g>
          )}

          {/* Primary Hour Numbers (1 to 12) */}
          {settings.showHourNumbers && (
            <g id="hour-numbers">
              {Array.from({ length: 12 }).map((_, i) => {
                const hourVal = i + 1;
                const angle = hourVal * 30;
                const rad = (angle * Math.PI) / 180;
                const r = settings.showMinuteRing ? 122 : 142;
                const x = Math.sin(rad) * r;
                const y = -Math.cos(rad) * r + 6;

                return (
                  <text
                    key={`hour-num-${hourVal}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={settings.themeMode === 'light' ? '#0f172a' : '#f8fafc'}
                    className={`${fontClass} font-extrabold text-[24px] select-none`}
                  >
                    {hourVal}
                  </text>
                );
              })}
            </g>
          )}

          {/* 24-Hour Inner Numbers (13 to 24) */}
          {settings.show24HourNumbers && (
            <g id="24-hour-numbers">
              {Array.from({ length: 12 }).map((_, i) => {
                const hour24Val = i + 13 === 24 ? 24 : i + 13;
                const angle = (i + 1) * 30;
                const rad = (angle * Math.PI) / 180;
                const r = 88;
                const x = Math.sin(rad) * r;
                const y = -Math.cos(rad) * r + 4;

                return (
                  <text
                    key={`hour24-num-${hour24Val}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={settings.hourHandColor}
                    className="font-mono-digital font-semibold text-[11px] select-none"
                    opacity="0.75"
                  >
                    {hour24Val}
                  </text>
                );
              })}
            </g>
          )}

          {/* --- HANDS --- */}

          {/* Hour Hand (Blue / Custom, Shorter, Broader) */}
          <g
            id="hour-hand-group"
            transform={`rotate(${hourAngle})`}
            onPointerDown={(e) => handlePointerDown('hour', e)}
            className="cursor-grab active:cursor-grabbing transition-transform duration-75"
          >
            {/* Invisible expanded hit target */}
            <line x1="0" y1="20" x2="0" y2="-100" stroke="transparent" strokeWidth="32" />
            {/* Counter-balance */}
            <line
              x1="0"
              y1="16"
              x2="0"
              y2="-90"
              stroke={settings.hourHandColor}
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Arrow/Pointer tip */}
            <polygon
              points="0,-104 -7,-86 7,-86"
              fill={settings.hourHandColor}
            />
            <circle cx="0" cy="-60" r="3" fill="#ffffff" opacity="0.9" />
          </g>

          {/* Minute Hand (Red / Custom, Longer, Leaner) */}
          <g
            id="minute-hand-group"
            transform={`rotate(${minuteAngle})`}
            onPointerDown={(e) => handlePointerDown('minute', e)}
            className="cursor-grab active:cursor-grabbing transition-transform duration-75"
          >
            {/* Invisible expanded hit target */}
            <line x1="0" y1="25" x2="0" y2="-155" stroke="transparent" strokeWidth="30" />
            {/* Hand shaft */}
            <line
              x1="0"
              y1="22"
              x2="0"
              y2="-145"
              stroke={settings.minuteHandColor}
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Arrow/Pointer tip reaching the minute track */}
            <polygon
              points="0,-162 -5,-142 5,-142"
              fill={settings.minuteHandColor}
            />
            <circle cx="0" cy="-100" r="2.5" fill="#ffffff" opacity="0.9" />
          </g>

          {/* Second Hand (Yellow / Delicate with Counter-Weight) */}
          {settings.showSecondHand && (
            <g
              id="second-hand-group"
              transform={`rotate(${secondAngle})`}
              pointerEvents="none"
              className={settings.secondHandMode === 'ticking' ? 'transition-transform duration-100' : ''}
            >
              <line
                x1="0"
                y1="34"
                x2="0"
                y2="-172"
                stroke={settings.secondHandColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="0" cy="22" r="5" fill={settings.secondHandColor} />
            </g>
          )}

          {/* Center Hub Cap */}
          <circle cx="0" cy="0" r="10" fill="url(#hub-gradient)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3.5" fill={settings.secondHandColor} />
        </svg>
      </div>

      {/* Spoken Time Phrase (e.g. "Viertel nach zehn") */}
      <motion.div
        key={spokenPhrase}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        id="spoken-time-phrase"
        className="mt-5 text-center"
      >
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 drop-shadow-sm">
          {spokenPhrase}
        </div>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
          {settings.timeLanguage === 'de-standard'
            ? 'Standarddeutsch'
            : settings.timeLanguage === 'de-regional'
            ? 'Regionaldeutsch'
            : 'English'}
        </p>
      </motion.div>

      {/* Optional Companion Digital Clock */}
      {settings.showDigitalClock && (
        <div
          id="companion-digital-clock"
          className="mt-3.5 px-5 py-2 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-lg flex items-center gap-2"
        >
          <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Digital:</span>
          <span
            className="font-mono-digital text-lg sm:text-xl font-bold tabular-numbers tracking-wider"
            style={{ color: settings.clockColor }}
          >
            {digitalTimeStr}
          </span>
        </div>
      )}

      {/* Manual Stepper Toolbar (for interactive learning or whiteboard use) */}
      <div
        id="manual-stepper-bar"
        className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/70 backdrop-blur-md shadow-sm"
      >
        <button
          type="button"
          onClick={() => stepMinutes(-60)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="Eine Stunde zurück"
        >
          -1 Std
        </button>
        <button
          type="button"
          onClick={() => stepMinutes(-15)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="15 Minuten zurück"
        >
          -15 Min
        </button>
        <button
          type="button"
          onClick={() => stepMinutes(-5)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="5 Minuten zurück"
        >
          -5 Min
        </button>

        <button
          type="button"
          onClick={returnToLive}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
            settings.isLiveMode
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
          }`}
        >
          <Play className="w-3 h-3 fill-current" />
          Jetzt
        </button>

        <button
          type="button"
          onClick={() => stepMinutes(5)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="5 Minuten vor"
        >
          +5 Min
        </button>
        <button
          type="button"
          onClick={() => stepMinutes(15)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="15 Minuten vor"
        >
          +15 Min
        </button>
        <button
          type="button"
          onClick={() => stepMinutes(60)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="Eine Stunde vor"
        >
          +1 Std
        </button>
      </div>
    </div>
  );
};

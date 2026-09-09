import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Globe } from 'lucide-react';
import { AdditionalTimeZone, ClockSettings } from '../types';

interface AdditionalTimeZonesBarProps {
  time: Date;
  settings: ClockSettings;
  mainTimeZone?: string;
}

interface ComputedZoneData {
  id: string;
  name: string;
  timeZone: string;
  formattedTime: string;
  ampm: string;
  offsetLabel: string;
  dayLabel: string;
  isDayTime: boolean;
}

export const AdditionalTimeZonesBar: React.FC<AdditionalTimeZonesBarProps> = ({
  time,
  settings,
  mainTimeZone,
}) => {
  const zones = settings.additionalTimeZones;

  // Resolve main clock timezone
  const effectiveMainTz =
    !mainTimeZone || mainTimeZone === 'auto' || mainTimeZone === 'Europe/Berlin'
      ? 'Europe/Berlin'
      : mainTimeZone;

  // Compute live data for each configured time zone
  const zoneList: ComputedZoneData[] = useMemo(() => {
    if (!zones || zones.length === 0) return [];

    return zones.map((z) => {
      try {
        // Format time in target zone
        const timeParts = new Intl.DateTimeFormat('en-GB', {
          timeZone: z.timeZone,
          hour: '2-digit',
          minute: '2-digit',
          second: settings.showSeconds ? '2-digit' : undefined,
          hour12: !settings.is24Hour,
        }).formatToParts(time);

        const hours = timeParts.find((p) => p.type === 'hour')?.value || '00';
        const minutes = timeParts.find((p) => p.type === 'minute')?.value || '00';
        const seconds = timeParts.find((p) => p.type === 'second')?.value;
        const ampm =
          (!settings.is24Hour &&
            timeParts.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase()) ||
          '';

        const formattedTime = seconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;

        // Compute offset and day difference relative to the main clock
        const getUtcTimestamp = (tz: string) => {
          const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23',
          }).formatToParts(time);

          const m: Record<string, number> = {};
          for (const p of parts) {
            if (p.type !== 'literal') m[p.type] = parseInt(p.value, 10);
          }
          return {
            timestamp: Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute),
            hour: m.hour,
            day: m.day,
            month: m.month,
            year: m.year,
          };
        };

        const mainData = getUtcTimestamp(effectiveMainTz);
        const targetData = getUtcTimestamp(z.timeZone);

        const diffHours = (targetData.timestamp - mainData.timestamp) / (1000 * 60 * 60);

        let offsetLabel = '';
        if (diffHours === 0) {
          offsetLabel = 'Gleich';
        } else if (diffHours > 0) {
          const formattedDiff = Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1);
          offsetLabel = `+${formattedDiff}h`;
        } else {
          const formattedDiff = Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1);
          offsetLabel = `${formattedDiff}h`;
        }

        let dayLabel = '';
        if (
          targetData.year > mainData.year ||
          targetData.month > mainData.month ||
          targetData.day > mainData.day
        ) {
          dayLabel = 'Morgen';
        } else if (
          targetData.year < mainData.year ||
          targetData.month < mainData.month ||
          targetData.day < mainData.day
        ) {
          dayLabel = 'Gestern';
        }

        const isDayTime = targetData.hour >= 6 && targetData.hour < 18;

        return {
          id: z.id,
          name: z.customLabel || z.name,
          timeZone: z.timeZone,
          formattedTime,
          ampm,
          offsetLabel,
          dayLabel,
          isDayTime,
        };
      } catch (err) {
        console.warn(`Error formatting timezone ${z.timeZone}:`, err);
        return {
          id: z.id,
          name: z.customLabel || z.name,
          timeZone: z.timeZone,
          formattedTime: '--:--',
          ampm: '',
          offsetLabel: '',
          dayLabel: '',
          isDayTime: true,
        };
      }
    });
  }, [zones, time, effectiveMainTz, settings.is24Hour, settings.showSeconds]);

  if (!settings.showAdditionalTimeZones || zoneList.length === 0) {
    return null;
  }

  // Font family resolution for matching the main clock
  const fontClass =
    settings.clockFont === 'mono'
      ? 'font-mono-digital'
      : settings.clockFont === 'outfit'
      ? 'font-outfit'
      : settings.clockFont === 'school'
      ? 'font-school'
      : 'font-inter';

  return (
    <motion.div
      id="additional-timezones-container"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3 }}
      className="mt-6 sm:mt-8 w-full flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 px-2"
    >
      <AnimatePresence>
        {zoneList.map((item) => (
          <motion.div
            key={item.id}
            id={`timezone-chip-${item.id}`}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="group flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 hover:border-slate-500/80 transition-all shadow-md select-none"
          >
            {/* Day / Night Indicator Icon */}
            <div
              className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800/80 group-hover:bg-slate-700/80 transition-colors"
              title={item.isDayTime ? 'Tag (06:00 - 18:00)' : 'Nacht (18:00 - 06:00)'}
            >
              {item.isDayTime ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
              )}
            </div>

            {/* City Name & Offsets */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight">
                  {item.name}
                </span>
                {item.dayLabel && (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.dayLabel}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {item.offsetLabel}
              </span>
            </div>

            {/* Digital Time */}
            <div className="flex items-baseline gap-1 pl-1 border-l border-slate-700/50">
              <span
                className={`text-sm sm:text-base font-bold tabular-numbers ${fontClass}`}
                style={{
                  color: 'var(--clock-color, ' + settings.clockColor + ')',
                }}
              >
                {item.formattedTime}
              </span>
              {item.ampm && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {item.ampm}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

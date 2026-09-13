import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Globe, Plus, X, SlidersHorizontal } from 'lucide-react';
import { AdditionalTimeZone, ClockSettings } from '../types';
import { SpringDigit } from './SpringDigit';
import { AddTimeZoneModal } from './AddTimeZoneModal';
import { PRESET_WORLD_TIMEZONES } from '../utils/presets';
import { triggerHaptic } from '../utils/audio';

interface AdditionalTimeZonesBarProps {
  time: Date;
  settings: ClockSettings;
  mainTimeZone?: string;
  onUpdateSettings?: (updater: (prev: ClockSettings) => ClockSettings) => void;
}

interface ComputedZoneData {
  id: string;
  name: string;
  timeZone: string;
  flag?: string;
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
  onUpdateSettings,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const zones = settings.additionalTimeZones || [];

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
        // Look up preset flag if not present
        const presetMatch = PRESET_WORLD_TIMEZONES.find((p) => p.timeZone === z.timeZone);
        const flag = z.flag || presetMatch?.flag || '🌐';

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
          flag,
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
          flag: '🌐',
          formattedTime: '--:--',
          ampm: '',
          offsetLabel: '',
          dayLabel: '',
          isDayTime: true,
        };
      }
    });
  }, [zones, time, effectiveMainTz, settings.is24Hour, settings.showSeconds]);

  // Handlers for adding, removing, and reordering timezones
  const handleAddTimeZone = (newZone: { name: string; timeZone: string; flag?: string; customLabel?: string }) => {
    if (!onUpdateSettings) return;

    onUpdateSettings((prev) => {
      // Check if already in list
      if (prev.additionalTimeZones.some((z) => z.timeZone === newZone.timeZone)) {
        return prev;
      }
      const item: AdditionalTimeZone = {
        id: `tz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: newZone.name,
        timeZone: newZone.timeZone,
        flag: newZone.flag,
        customLabel: newZone.customLabel,
      };
      return {
        ...prev,
        showAdditionalTimeZones: true,
        additionalTimeZones: [...(prev.additionalTimeZones || []), item],
      };
    });
  };

  const handleRemoveTimeZone = (id: string) => {
    if (!onUpdateSettings) return;
    if (settings.vibrationEnabled) triggerHaptic(10);

    onUpdateSettings((prev) => ({
      ...prev,
      additionalTimeZones: (prev.additionalTimeZones || []).filter((z) => z.id !== id),
    }));
  };

  const handleReorderTimeZones = (newZones: AdditionalTimeZone[]) => {
    if (!onUpdateSettings) return;
    onUpdateSettings((prev) => ({
      ...prev,
      additionalTimeZones: newZones,
    }));
  };

  // Font family resolution matching the main clock style
  const fontClass =
    settings.clockFont === 'mono'
      ? 'font-mono-digital'
      : settings.clockFont === 'outfit'
      ? 'font-outfit'
      : settings.clockFont === 'school'
      ? 'font-school'
      : 'font-inter';

  return (
    <>
      <motion.div
        id="additional-timezones-container"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }}
        className="mt-6 sm:mt-8 w-full flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 px-2"
      >
        <AnimatePresence>
          {zoneList.map((item, idx) => (
            <motion.div
              key={`${item.id || item.timeZone}-${idx}`}
              id={`timezone-chip-${item.id || idx}`}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              className="group relative flex items-center gap-2.5 sm:gap-3 pl-3 pr-3.5 sm:pl-3.5 sm:pr-4 py-2 sm:py-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-500/80 transition-all shadow-md select-none"
              style={{
                backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
              }}
            >
              {/* Day / Night & Flag */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-base sm:text-lg leading-none shrink-0" role="img" aria-label="Flag">
                  {item.flag || '🌐'}
                </span>
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800/80 group-hover:bg-slate-700/80 transition-colors"
                  title={item.isDayTime ? 'Tag (06:00 - 18:00)' : 'Nacht (18:00 - 06:00)'}
                >
                  {item.isDayTime ? (
                    <Sun className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Moon className="w-3 h-3 text-indigo-300" />
                  )}
                </div>
              </div>

              {/* City Name & Offsets */}
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight truncate max-w-[120px] sm:max-w-[160px]">
                    {item.name}
                  </span>
                  {item.dayLabel && (
                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      {item.dayLabel}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {item.offsetLabel}
                </span>
              </div>

              {/* Digital Time */}
              <div className="flex items-baseline gap-1 pl-1.5 sm:pl-2 border-l border-slate-700/50">
                <span
                  className={`text-sm sm:text-base font-bold tabular-numbers inline-flex items-baseline ${fontClass}`}
                  style={{
                    color: 'var(--clock-color, ' + settings.clockColor + ')',
                  }}
                >
                  {item.formattedTime.split('').map((char, charIdx) =>
                    char === ':' ? (
                      <span key={`colon-${charIdx}`} className="px-0.5 opacity-80">
                        :
                      </span>
                    ) : (
                      <SpringDigit
                        key={`tz-digit-${charIdx}`}
                        digit={char}
                        transitionType={settings.digitTransition}
                        durationMs={settings.digitFadeDuration}
                      />
                    )
                  )}
                </span>
                {item.ampm && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {item.ampm}
                  </span>
                )}
              </div>

              {/* Quick Remove Button on Hover/Touch */}
              {onUpdateSettings && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTimeZone(item.id);
                  }}
                  title={`${item.name} entfernen`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 -mr-1 rounded-lg bg-white/10 hover:bg-rose-500/30 text-slate-400 hover:text-rose-200 transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add / Manage Timezones Action Button directly on the clock display */}
        {onUpdateSettings && (
          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              id="btn-add-secondary-timezone"
              onClick={() => {
                if (settings.vibrationEnabled) triggerHaptic(12);
                setIsAddModalOpen(true);
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Weitere Weltzeitzone hinzufügen"
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-2xl bg-slate-900/60 hover:bg-blue-600/20 border border-slate-700/60 hover:border-blue-500/50 text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer select-none text-xs font-semibold"
              style={{
                backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
              }}
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Zeitzone</span>
            </motion.button>

            {zoneList.length >= 2 && (
              <motion.button
                type="button"
                id="btn-manage-secondary-timezones"
                onClick={() => {
                  if (settings.vibrationEnabled) triggerHaptic(10);
                  setIsAddModalOpen(true);
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                title="Zeitzonen verwalten & sortieren"
                className="inline-flex items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white transition-all shadow-sm cursor-pointer select-none"
                style={{
                  backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                  WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        )}
      </motion.div>

      {/* Global Add & Manage Timezone Modal */}
      <AddTimeZoneModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        activeTimeZones={zones}
        onAddTimeZone={handleAddTimeZone}
        onRemoveTimeZone={handleRemoveTimeZone}
        onReorderTimeZones={handleReorderTimeZones}
        mainTimeZone={effectiveMainTz}
        is24Hour={settings.is24Hour}
        backdropBlur={settings.backdropBlurIntensity}
        vibrationEnabled={settings.vibrationEnabled}
      />
    </>
  );
};

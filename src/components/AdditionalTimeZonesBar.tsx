import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Globe, Plus, X, SlidersHorizontal } from 'lucide-react';
import { AdditionalTimeZone, ClockSettings } from '../types';
import { SpringDigit } from './SpringDigit';
import { AddTimeZoneModal } from './AddTimeZoneModal';
import { PRESET_WORLD_TIMEZONES } from '../utils/presets';
import { triggerHaptic } from '../utils/audio';
import { colorWithAlpha } from '../utils/colorUtils';

interface AdditionalTimeZonesBarProps {
  time: Date;
  settings: ClockSettings;
  mainTimeZone?: string;
  onUpdateSettings?: (updater: (prev: ClockSettings) => ClockSettings) => void;
  isZenMode?: boolean;
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
  isZenMode = false,
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
          second: settings.worldClockShowSeconds ? '2-digit' : undefined,
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
      : settings.clockFont === 'serif'
      ? 'font-serif-clock'
      : settings.clockFont === 'outfit'
      ? 'font-outfit'
      : settings.clockFont === 'school'
      ? 'font-school'
      : settings.clockFont === 'sans'
      ? 'font-sans-clock'
      : 'font-inter';

  const layout = settings.worldClockLayout || 'rows';
  const showOffset = settings.worldClockShowOffset ?? true;
  const isAutoTheme = settings.worldClockAutoTheme !== false;
  const isLight = settings.themeMode === 'light';

  // Primary Theme / Clock color
  const primaryThemeColor = settings.clockColor || settings.accentColor || '#38bdf8';
  const accentColor = settings.accentColor || primaryThemeColor;

  // Harmonious dynamic theme styling based on Zen-Mode & Active Design/Theme
  const themeStyles = useMemo(() => {
    if (isZenMode) {
      // Ultra-clean, serene, zen-mode styling:
      // Translucent, borderless or ultra-fine hairline, minimal distraction
      return {
        containerBg: 'rgba(0, 0, 0, 0.28)',
        containerBorder: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.15) : 'rgba(255, 255, 255, 0.08)',
        containerShadow: 'none',
        cityTextColor: 'rgba(255, 255, 255, 0.75)',
        digitColor: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.95) : '#f8fafc',
        digitShadow: 'none',
        offsetTextColor: 'rgba(255, 255, 255, 0.45)',
        dividerColor: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.22) : 'rgba(255, 255, 255, 0.15)',
        dayBadgeBg: 'rgba(245, 158, 11, 0.15)',
        dayBadgeBorder: 'rgba(245, 158, 11, 0.25)',
        dayBadgeText: 'rgba(251, 191, 36, 0.85)',
        iconSunColor: '#fbbf24',
        iconMoonColor: isAutoTheme ? colorWithAlpha(accentColor, 0.85) : '#c7d2fe',
        sunMoonBg: 'rgba(255, 255, 255, 0.06)',
        hideActions: true,
      };
    }

    if (isLight) {
      // Light Mode Design: Frosted glass with refined dark typography & tinted accents
      return {
        containerBg: isAutoTheme
          ? `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, ${colorWithAlpha(primaryThemeColor, 0.12)} 100%)`
          : 'rgba(255, 255, 255, 0.75)',
        containerBorder: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.38) : 'rgba(203, 213, 225, 0.85)',
        containerShadow: isAutoTheme
          ? `0 6px 20px rgba(0, 0, 0, 0.05), 0 2px 10px ${colorWithAlpha(primaryThemeColor, 0.15)}`
          : '0 6px 20px rgba(0, 0, 0, 0.05)',
        cityTextColor: '#1e293b',
        digitColor: isAutoTheme
          ? (primaryThemeColor.toLowerCase() === '#ffffff' ? '#0f172a' : primaryThemeColor)
          : '#0f172a',
        digitShadow: 'none',
        offsetTextColor: '#64748b',
        dividerColor: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.3) : 'rgba(148, 163, 184, 0.4)',
        dayBadgeBg: 'rgba(245, 158, 11, 0.15)',
        dayBadgeBorder: 'rgba(245, 158, 11, 0.3)',
        dayBadgeText: '#b45309',
        iconSunColor: '#d97706',
        iconMoonColor: '#4f46e5',
        sunMoonBg: 'rgba(255, 255, 255, 0.85)',
        hideActions: false,
      };
    }

    // Dark Mode / Theme Active:
    // Harmonized with primary clock color, neon ambient glow, and translucent glass
    return {
      containerBg: isAutoTheme
        ? `radial-gradient(140% 120% at 50% 0%, ${colorWithAlpha(primaryThemeColor, 0.16)} 0%, rgba(15, 23, 42, 0.75) 100%)`
        : 'rgba(15, 23, 42, 0.75)',
      containerBorder: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.32) : 'rgba(51, 65, 85, 0.65)',
      containerShadow: isAutoTheme
        ? `0 8px 25px rgba(0, 0, 0, 0.45), 0 2px 10px ${colorWithAlpha(primaryThemeColor, 0.18)}`
        : '0 8px 25px rgba(0, 0, 0, 0.45)',
      cityTextColor: '#f1f5f9',
      digitColor: isAutoTheme ? primaryThemeColor : 'var(--clock-color, ' + settings.clockColor + ')',
      digitShadow: isAutoTheme && settings.enableGlow
        ? `0 0 10px ${colorWithAlpha(primaryThemeColor, 0.45)}`
        : 'none',
      offsetTextColor: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.75) : '#94a3b8',
      dividerColor: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.3) : 'rgba(51, 65, 85, 0.8)',
      dayBadgeBg: isAutoTheme ? colorWithAlpha(accentColor, 0.18) : 'rgba(245, 158, 11, 0.2)',
      dayBadgeBorder: isAutoTheme ? colorWithAlpha(accentColor, 0.35) : 'rgba(245, 158, 11, 0.3)',
      dayBadgeText: isAutoTheme ? accentColor : '#fcd34d',
      iconSunColor: '#fbbf24',
      iconMoonColor: isAutoTheme ? colorWithAlpha(accentColor, 0.9) : '#a5b4fc',
      sunMoonBg: isAutoTheme ? colorWithAlpha(primaryThemeColor, 0.14) : 'rgba(30, 41, 59, 0.8)',
      hideActions: false,
    };
  }, [isZenMode, isLight, isAutoTheme, primaryThemeColor, accentColor, settings.clockColor, settings.enableGlow]);

  return (
    <>
      {layout === 'rows' ? (
        /* Minimalist Rows Layout (kleine, minimalistische Zeilen unter der Hauptuhr) */
        <motion.div
          id="additional-timezones-rows-container"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
          className="mt-4 sm:mt-5 max-w-full flex items-center justify-center px-2"
        >
          <div
            className="inline-flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl transition-all duration-300 shadow-md select-none group/container"
            style={{
              background: themeStyles.containerBg,
              borderColor: themeStyles.containerBorder,
              borderWidth: 1,
              borderStyle: 'solid',
              boxShadow: themeStyles.containerShadow,
              backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
              WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
            }}
          >
            {zoneList.map((item, idx) => (
              <React.Fragment key={`${item.id || item.timeZone}-${idx}`}>
                <div
                  className="group/row inline-flex items-center gap-1.5 sm:gap-2 text-xs transition-colors cursor-pointer"
                  onClick={() => !themeStyles.hideActions && setIsAddModalOpen(true)}
                  title={`${item.name} (${item.timeZone}) • Klicken zum Verwalten`}
                >
                  <span className="text-sm leading-none shrink-0" role="img" aria-label="Flag">
                    {item.flag || '🌐'}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{ backgroundColor: themeStyles.sunMoonBg }}
                    title={item.isDayTime ? 'Tag (06:00 - 18:00)' : 'Nacht (18:00 - 06:00)'}
                  >
                    {item.isDayTime ? (
                      <Sun className="w-2 h-2" style={{ color: themeStyles.iconSunColor }} />
                    ) : (
                      <Moon className="w-2 h-2" style={{ color: themeStyles.iconMoonColor }} />
                    )}
                  </div>
                  <span
                    className="font-semibold tracking-tight text-xs sm:text-sm"
                    style={{ color: themeStyles.cityTextColor }}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`font-mono font-bold tracking-tight text-xs sm:text-sm ${fontClass}`}
                    style={{
                      color: themeStyles.digitColor,
                      textShadow: themeStyles.digitShadow,
                    }}
                  >
                    {item.formattedTime}
                  </span>
                  {item.ampm && (
                    <span className="text-[9px] font-bold uppercase" style={{ color: themeStyles.offsetTextColor }}>
                      {item.ampm}
                    </span>
                  )}
                  {showOffset && item.offsetLabel && (
                    <span className="text-[10px] font-mono opacity-85" style={{ color: themeStyles.offsetTextColor }}>
                      {item.offsetLabel}
                    </span>
                  )}
                  {item.dayLabel && (
                    <span
                      className="text-[8px] font-semibold px-1 py-0.2 rounded border"
                      style={{
                        backgroundColor: themeStyles.dayBadgeBg,
                        borderColor: themeStyles.dayBadgeBorder,
                        color: themeStyles.dayBadgeText,
                      }}
                    >
                      {item.dayLabel}
                    </span>
                  )}

                  {/* Quick Remove Button on Hover (Hidden in Zen Mode) */}
                  {onUpdateSettings && !themeStyles.hideActions && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTimeZone(item.id);
                      }}
                      title={`${item.name} entfernen`}
                      className="opacity-0 group-hover/row:opacity-100 p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {idx < zoneList.length - 1 && (
                  <span
                    className="select-none font-bold hidden sm:inline"
                    style={{ color: themeStyles.dividerColor }}
                  >
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}

            {/* Quick Add Button (Hidden in Zen Mode) */}
            {onUpdateSettings && !themeStyles.hideActions && (
              <button
                type="button"
                onClick={() => {
                  if (settings.vibrationEnabled) triggerHaptic(10);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium pl-1 cursor-pointer transition-colors opacity-80 hover:opacity-100"
                style={{ color: isAutoTheme ? accentColor : '#60a5fa' }}
                title="Zeitzone hinzufügen / verwalten"
              >
                <Plus className="w-3 h-3" />
                <span>Zone</span>
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        /* Chips Layout */
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
                className="group relative flex items-center gap-2.5 sm:gap-3 pl-3 pr-3.5 sm:pl-3.5 sm:pr-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-300 shadow-md select-none"
                style={{
                  background: themeStyles.containerBg,
                  borderColor: themeStyles.containerBorder,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  boxShadow: themeStyles.containerShadow,
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
                    className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-colors"
                    style={{ backgroundColor: themeStyles.sunMoonBg }}
                    title={item.isDayTime ? 'Tag (06:00 - 18:00)' : 'Nacht (18:00 - 06:00)'}
                  >
                    {item.isDayTime ? (
                      <Sun className="w-3 h-3" style={{ color: themeStyles.iconSunColor }} />
                    ) : (
                      <Moon className="w-3 h-3" style={{ color: themeStyles.iconMoonColor }} />
                    )}
                  </div>
                </div>

                {/* City Name & Offsets */}
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs sm:text-sm font-semibold tracking-tight truncate max-w-[120px] sm:max-w-[160px]"
                      style={{ color: themeStyles.cityTextColor }}
                    >
                      {item.name}
                    </span>
                    {item.dayLabel && (
                      <span
                        className="text-[9px] font-medium px-1.5 py-0.2 rounded border shrink-0"
                        style={{
                          backgroundColor: themeStyles.dayBadgeBg,
                          borderColor: themeStyles.dayBadgeBorder,
                          color: themeStyles.dayBadgeText,
                        }}
                      >
                        {item.dayLabel}
                      </span>
                    )}
                  </div>
                  {showOffset && (
                    <span className="text-[10px] font-mono" style={{ color: themeStyles.offsetTextColor }}>
                      {item.offsetLabel}
                    </span>
                  )}
                </div>

                {/* Digital Time */}
                <div
                  className="flex items-baseline gap-1 pl-1.5 sm:pl-2 border-l"
                  style={{ borderColor: themeStyles.dividerColor }}
                >
                  <span
                    className={`text-sm sm:text-base font-bold tabular-numbers inline-flex items-baseline ${fontClass}`}
                    style={{
                      color: themeStyles.digitColor,
                      textShadow: themeStyles.digitShadow,
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
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: themeStyles.offsetTextColor }}>
                      {item.ampm}
                    </span>
                  )}
                </div>

                {/* Quick Remove Button on Hover/Touch (Hidden in Zen Mode) */}
                {onUpdateSettings && !themeStyles.hideActions && (
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

          {/* Add / Manage Timezones Action Button directly on the clock display (Hidden in Zen Mode) */}
          {onUpdateSettings && !themeStyles.hideActions && (
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
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-2xl transition-all shadow-sm cursor-pointer select-none text-xs font-semibold"
                style={{
                  background: themeStyles.containerBg,
                  borderColor: themeStyles.containerBorder,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  color: isAutoTheme ? accentColor : '#cbd5e1',
                  backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                  WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
                }}
              >
                <Plus className="w-3.5 h-3.5" style={{ color: isAutoTheme ? accentColor : '#60a5fa' }} />
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
                  className="inline-flex items-center justify-center p-2 sm:p-2.5 rounded-2xl transition-all shadow-sm cursor-pointer select-none"
                  style={{
                    background: themeStyles.containerBg,
                    borderColor: themeStyles.containerBorder,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    color: isAutoTheme ? accentColor : '#94a3b8',
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
      )}

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

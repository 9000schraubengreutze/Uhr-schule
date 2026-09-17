import React, { useState, useEffect } from 'react';
import { Clock, Moon, Sun, Sparkles, Check, Info, ArrowRight } from 'lucide-react';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';
import {
  ZEN_SCHEDULE_PRESETS,
  getZenScheduleInfo,
  formatTimeDisplay,
  ZenSchedulePreset,
} from '../utils/zenSchedule';

interface ZenScheduleCardProps {
  enabled: boolean;
  startTime: string;
  endTime: string;
  is24Hour?: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onChangeTimes: (startTime: string, endTime: string) => void;
  onToggleZenNow?: () => void;
  isCurrentlyZen?: boolean;
  showFeedback?: (msg: string) => void;
  vibrationEnabled?: boolean;
  className?: string;
}

export const ZenScheduleCard: React.FC<ZenScheduleCardProps> = ({
  enabled = false,
  startTime = '22:00',
  endTime = '07:00',
  is24Hour = true,
  onToggleEnabled,
  onChangeTimes,
  onToggleZenNow,
  isCurrentlyZen = false,
  showFeedback,
  vibrationEnabled = false,
  className = '',
}) => {
  // Keep local tick so schedule banner stays updated in real-time
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scheduleInfo = getZenScheduleInfo(now, enabled, startTime, endTime, is24Hour);

  const handleToggle = (checked: boolean) => {
    if (vibrationEnabled) triggerHaptic(15);
    onToggleEnabled(checked);
    showFeedback?.(
      checked
        ? `Automatischer Zen-Zeitplan aktiviert (${formatTimeDisplay(startTime, is24Hour)} – ${formatTimeDisplay(endTime, is24Hour)})`
        : 'Automatischer Zen-Zeitplan pausiert'
    );
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    onChangeTimes(val, endTime);
    showFeedback?.(`Startzeit auf ${formatTimeDisplay(val, is24Hour)} geändert`);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    onChangeTimes(startTime, val);
    showFeedback?.(`Endzeit auf ${formatTimeDisplay(val, is24Hour)} geändert`);
  };

  const handleApplyPreset = (preset: ZenSchedulePreset) => {
    if (vibrationEnabled) triggerHaptic(12);
    onChangeTimes(preset.startTime, preset.endTime);
    // If not enabled yet, also turn it on
    if (!enabled) {
      onToggleEnabled(true);
    }
    showFeedback?.(`Preset "${preset.name}" angewendet`);
  };

  return (
    <div
      id="zen-schedule-card"
      className={`p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-4 transition-all duration-200 ${className}`}
    >
      {/* Header & Toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              enabled
                ? scheduleInfo.isActiveNow
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/5 text-slate-400 border border-white/5'
            }`}
          >
            {scheduleInfo.isActiveNow ? (
              <Moon className="w-5 h-5 animate-pulse" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Zen-Modus Zeitplan (Timer)
              {enabled && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                    scheduleInfo.isActiveNow
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  {scheduleInfo.statusBadgeText}
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Schaltet den Minimalismus-Modus nach individuellem Zeitplan automatisch ein und aus.
            </p>
          </div>
        </div>

        <MaterialSwitch
          id="zen-schedule-switch"
          checked={enabled}
          onChange={handleToggle}
          vibrationEnabled={vibrationEnabled}
        />
      </div>

      {/* Time Range Pickers */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity duration-200 ${
          enabled ? 'opacity-100' : 'opacity-60 pointer-events-none'
        }`}
      >
        {/* Start Time */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Aktivieren um (Start)
            </span>
            <span className="text-[10px] text-slate-500">Zen ein</span>
          </div>
          <input
            id="zen-schedule-start-input"
            type="time"
            value={startTime}
            onChange={handleStartTimeChange}
            disabled={!enabled}
            aria-label="Zen-Modus Startzeit"
            className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-base font-mono font-medium text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors cursor-pointer"
          />
        </div>

        {/* End Time */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Deaktivieren um (Ende)
            </span>
            <span className="text-[10px] text-slate-500">Zen aus</span>
          </div>
          <input
            id="zen-schedule-end-input"
            type="time"
            value={endTime}
            onChange={handleEndTimeChange}
            disabled={!enabled}
            aria-label="Zen-Modus Endzeit"
            className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-base font-mono font-medium text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-slate-400">
          Schnell-Vorlagen:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {ZEN_SCHEDULE_PRESETS.map((p) => {
            const isSelected = startTime === p.startTime && endTime === p.endTime;
            return (
              <button
                key={p.id}
                id={`zen-preset-${p.id}`}
                type="button"
                onClick={() => handleApplyPreset(p)}
                title={p.description}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between gap-1.5 border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-sm'
                    : 'bg-white/[0.04] text-slate-300 border-white/5 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span className="truncate flex items-center gap-1">
                  <span>{p.icon}</span>
                  <span>{p.startTime} – {p.endTime}</span>
                </span>
                {isSelected && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Status Summary Banner */}
      <div
        className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors duration-200 ${
          enabled
            ? scheduleInfo.isActiveNow
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-200'
            : 'bg-slate-900/40 border-white/5 text-slate-400'
        }`}
      >
        <Info
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            enabled
              ? scheduleInfo.isActiveNow
                ? 'text-emerald-400'
                : 'text-indigo-400'
              : 'text-slate-500'
          }`}
        />
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="font-semibold">
            {scheduleInfo.statusDescription}
          </span>
          <span className="text-[11px] opacity-80 flex items-center gap-2">
            {scheduleInfo.isOvernight && (
              <span>🌙 Intervall über Mitternacht</span>
            )}
            <span>
              • Manuelle Umschaltung jederzeit mit Taste <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[10px]">Z</kbd> möglich.
            </span>
          </span>
        </div>

        {/* Quick manual toggle trigger */}
        {onToggleZenNow && (
          <button
            type="button"
            onClick={() => {
              if (vibrationEnabled) triggerHaptic(12);
              onToggleZenNow();
            }}
            className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer active:scale-95"
          >
            {isCurrentlyZen ? 'Zen aus' : 'Zen ein'}
          </button>
        )}
      </div>
    </div>
  );
};

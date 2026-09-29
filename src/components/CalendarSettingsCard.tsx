import React from 'react';
import { Calendar, Bell, ChevronRight, CheckCircle2, Sliders, ExternalLink } from 'lucide-react';
import { ClockSettings } from '../types';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';

interface CalendarSettingsCardProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onOpenCalendarModal?: () => void;
  isConnected: boolean;
  userEmail?: string | null;
  approachingCount?: number;
  showFeedback?: (msg: string) => void;
}

const LEAD_TIME_OPTIONS = [
  { value: 5, label: '5 Min.' },
  { value: 10, label: '10 Min.' },
  { value: 15, label: '15 Min. (Standard)' },
  { value: 30, label: '30 Min.' },
  { value: 60, label: '1 Std.' },
];

export const CalendarSettingsCard: React.FC<CalendarSettingsCardProps> = ({
  settings,
  onUpdateSettings,
  onOpenCalendarModal,
  isConnected,
  userEmail,
  approachingCount = 0,
  showFeedback,
}) => {
  const cal = settings.calendar;

  const updateConfig = (updater: Partial<typeof cal>) => {
    onUpdateSettings((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        ...updater,
      },
    }));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">
                Google Kalender Integration
              </h4>
              {isConnected ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verbunden
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Nicht verknüpft
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConnected && userEmail
                ? `Verbunden mit ${userEmail} • Termine werden live überwacht`
                : 'Warnungen und Countdown auf der Uhr bei herannahenden Terminen'}
            </p>
          </div>
        </div>

        {onOpenCalendarModal && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(settings.vibrationEnabled);
              onOpenCalendarModal();
            }}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <span>{isConnected ? 'Termine & Kalender' : 'Kalender verknüpfen'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Switch */}
      <div className="pt-1">
        <MaterialSwitch
          label="Kalender-Alarme & Benachrichtigungen aktivieren"
          description="Blendet Alarme und Countdowns für anstehende Termine direkt auf der Uhr ein"
          checked={cal.enabled}
          onChange={(v) => {
            updateConfig({ enabled: v });
            showFeedback?.(v ? 'Kalender-Alarme aktiviert' : 'Kalender-Alarme deaktiviert');
            triggerHaptic(settings.vibrationEnabled);
          }}
        />
      </div>

      {cal.enabled && (
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          {/* Lead time selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Vorwarnzeit vor anstehendem Termin
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {LEAD_TIME_OPTIONS.map((opt) => {
                const isSelected = cal.alertLeadMinutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      updateConfig({ alertLeadMinutes: opt.value });
                      triggerHaptic(settings.vibrationEnabled);
                    }}
                    className={`py-1.5 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)]'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <MaterialSwitch
              label="Next-Event-Widget auf Uhr"
              description="Zeigt den nächsten Termin als dezente Pille unter der Uhrzeit"
              checked={cal.showOnClock}
              onChange={(v) => updateConfig({ showOnClock: v })}
            />

            <MaterialSwitch
              label="Signalton bei Alarm"
              description="Dezenter Zweiklang-Gong beim Eintritt in die Vorwarnzeit"
              checked={cal.soundAlert}
              onChange={(v) => updateConfig({ soundAlert: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

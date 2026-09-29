import React from 'react';
import { Moon, ShieldCheck, Play, Sparkles, Sliders, Smartphone, Clock } from 'lucide-react';
import { ClockSettings, ScreensaverStyle } from '../types';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';

interface ScreensaverSettingsCardProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onTestScreensaver?: () => void;
  showFeedback?: (msg: string) => void;
}

const TIMEOUT_OPTIONS = [
  { value: 1, label: '1 Min.' },
  { value: 2, label: '2 Min.' },
  { value: 5, label: '5 Min. (Standard)' },
  { value: 10, label: '10 Min.' },
  { value: 15, label: '15 Min.' },
  { value: 30, label: '30 Min.' },
];

const STYLE_OPTIONS: { id: ScreensaverStyle; label: string; desc: string }[] = [
  { id: 'minimal', label: 'Minimal', desc: 'Zentriert, ultra-schlank & dezent' },
  { id: 'vertical', label: 'Gestapelt', desc: 'Stunden über Minuten (AOD Look)' },
  { id: 'modern', label: 'Modern', desc: 'Tabellarisch mit Kapsel-Kontur' },
  { id: 'dots', label: 'Punkte', desc: 'Doppelpunkt-Matrix & Monospace' },
];

export const ScreensaverSettingsCard: React.FC<ScreensaverSettingsCardProps> = ({
  settings,
  onUpdateSettings,
  onTestScreensaver,
  showFeedback,
}) => {
  const cfg = settings.screensaver;

  const updateConfig = (updater: Partial<typeof cfg>) => {
    onUpdateSettings((prev) => ({
      ...prev,
      screensaver: {
        ...prev.screensaver,
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
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">
                OLED Bildschirmschoner & Sleep-Modus
              </h4>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                Anti-Burn-In
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Versetzt die Uhr nach Inaktivität in einen minimalistischen Ruhezustand auf 0-Nit Reinschwarz
            </p>
          </div>
        </div>

        {/* Quick Test Button */}
        {onTestScreensaver && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(settings.vibrationEnabled);
              onTestScreensaver();
            }}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-300 text-indigo-300" />
            <span>Jetzt testen</span>
          </button>
        )}
      </div>

      {/* Main Switch */}
      <div className="pt-1">
        <MaterialSwitch
          label="Automatischer Bildschirmschoner bei Inaktivität"
          description={`Schaltet nach ${cfg.timeoutMinutes} Minuten ohne Berührung oder Mausbewegung automatisch in den OLED-Schlafzustand`}
          checked={cfg.enabled}
          onChange={(v) => {
            updateConfig({ enabled: v });
            showFeedback?.(v ? 'OLED Bildschirmschoner aktiviert' : 'OLED Bildschirmschoner deaktiviert');
            triggerHaptic(settings.vibrationEnabled);
          }}
        />
      </div>

      {cfg.enabled && (
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          {/* Timeout Options */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Inaktivitäts-Dauer bis zum Sleep-Zustand
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {TIMEOUT_OPTIONS.map((opt) => {
                const isSelected = cfg.timeoutMinutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      updateConfig({ timeoutMinutes: opt.value });
                      triggerHaptic(settings.vibrationEnabled);
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
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

          {/* Anti-Burn-In Pixel Orbiting */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <MaterialSwitch
              label="Anti-Burn-In Pixel-Wandern (Orbiting)"
              description="Verschiebt Position & Subpixel alle 35 Sekunden sanft und unmerklich um einige Pixel. Verhindert statisches Einbrennen auf OLED- & AMOLED-Panels dauerhaft."
              checked={cfg.antiBurnInShift}
              onChange={(v) => {
                updateConfig({ antiBurnInShift: v });
                triggerHaptic(settings.vibrationEnabled);
              }}
            />
          </div>

          {/* Brightness Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">
                Gedimmte Helligkeit (Luminanz im Ruhezustand)
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {cfg.brightness}%
                {cfg.brightness <= 20
                  ? ' (Nacht)'
                  : cfg.brightness === 25
                  ? ' (OLED Standard)'
                  : ' (Hell)'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={cfg.brightness}
              onChange={(e) => updateConfig({ brightness: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10% (Ultra-dunkel)</span>
              <span className="text-indigo-400/80">25% (Empfohlen)</span>
              <span>60% (Kräftiger)</span>
            </div>
          </div>

          {/* Sleep Display Style */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Schlaf-Layout & Typografie
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_OPTIONS.map((style) => {
                const isSelected = cfg.displayStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      updateConfig({ displayStyle: style.id });
                      triggerHaptic(settings.vibrationEnabled);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 text-white border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200 mb-1">{style.label}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{style.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Detail Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
            <div className="pt-2 sm:pt-0 sm:px-2">
              <MaterialSwitch
                label="Datum anzeigen"
                description="Dezente Datumszeile unter der Uhrzeit"
                checked={cfg.showDate}
                onChange={(v) => updateConfig({ showDate: v })}
              />
            </div>
            <div className="pt-2 sm:pt-0 sm:px-2">
              <MaterialSwitch
                label="Akkustand"
                description="Dezente Prozentanzeige auf Mobilgeräten"
                checked={cfg.showBattery}
                onChange={(v) => updateConfig({ showBattery: v })}
              />
            </div>
            <div className="pt-2 sm:pt-0 sm:px-2">
              <MaterialSwitch
                label="Sekunden"
                description="Sekundenziffern im Schlafmodus"
                checked={cfg.showSeconds}
                onChange={(v) => updateConfig({ showSeconds: v })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

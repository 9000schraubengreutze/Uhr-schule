import React from 'react';
import {
  Sparkles,
  Snowflake,
  Star,
  CloudRain,
  CircleDot,
  Ban,
  Gauge,
  Palette,
  Sliders,
  Check,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';
import { ClockSettings, ParticleEffect } from '../types';
import { PARTICLE_COLOR_PRESETS } from '../utils/presets';
import { triggerHaptic } from '../utils/audio';

interface ParticleSettingsCardProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  showFeedback: (msg: string) => void;
}

interface EffectItem {
  id: ParticleEffect;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EFFECTS: EffectItem[] = [
  { id: 'none', label: 'Keine', desc: 'Deaktiviert', icon: Ban },
  { id: 'snow', label: 'Schnee', desc: 'Fallende Kristalle', icon: Snowflake },
  { id: 'dust', label: 'Staub', desc: 'Schwebende Moten', icon: Sparkles },
  { id: 'stars', label: 'Sterne', desc: 'Funkelndes Glitzern', icon: Star },
  { id: 'rain', label: 'Regen', desc: 'Sanfte Regenfäden', icon: CloudRain },
  { id: 'bubbles', label: 'Lichtpunkte', desc: 'Aufsteigende Blasen', icon: CircleDot },
];

const SPEED_PRESETS = [
  { val: 0.35, label: '0.35x', name: 'Zen' },
  { val: 0.70, label: '0.70x', name: 'Sanft' },
  { val: 1.00, label: '1.00x', name: 'Normal' },
  { val: 1.60, label: '1.60x', name: 'Flott' },
  { val: 2.50, label: '2.50x', name: 'Sturm' },
];

export const ParticleSettingsCard: React.FC<ParticleSettingsCardProps> = ({
  settings,
  onUpdateSettings,
  showFeedback,
}) => {
  const currentEffect = settings.particleEffect || 'none';
  const intensity = settings.particleIntensity ?? 50;
  const color = settings.particleColor || '#ffffff';
  
  // Normalise legacy speed values (e.g. 2 -> 1.0)
  const rawSpeed = settings.particleSpeed;
  const speed = typeof rawSpeed === 'number' ? (rawSpeed === 2 ? 1.0 : rawSpeed) : 1.0;

  const handleSelectEffect = (eff: ParticleEffect, label: string) => {
    onUpdateSettings((prev) => ({
      ...prev,
      particleEffect: eff,
    }));
    if (settings.vibrationEnabled) triggerHaptic(15);
    showFeedback(eff === 'none' ? 'Partikeleffekte deaktiviert' : `Partikeleffekt "${label}" gewählt`);
  };

  const handleIntensityChange = (val: number) => {
    onUpdateSettings((prev) => ({
      ...prev,
      particleIntensity: val,
    }));
  };

  const handleSpeedChange = (val: number) => {
    const clamped = Math.max(0.25, Math.min(3.0, Number(val.toFixed(2))));
    onUpdateSettings((prev) => ({
      ...prev,
      particleSpeed: clamped,
    }));
    if (settings.vibrationEnabled) triggerHaptic(10);
  };

  const handleStepSpeed = (delta: number) => {
    const next = Math.max(0.25, Math.min(3.0, Number((speed + delta).toFixed(2))));
    handleSpeedChange(next);
    showFeedback(`Geschwindigkeit: ${next.toFixed(2)}x`);
  };

  const handleResetSpeed = () => {
    handleSpeedChange(1.0);
    showFeedback('Geschwindigkeit auf Standard (1.00x) zurückgesetzt');
  };

  const handleSelectSpeedPreset = (val: number, name: string) => {
    handleSpeedChange(val);
    showFeedback(`Tempo: ${name} (${val.toFixed(2)}x)`);
  };

  const handleColorChange = (newColor: string) => {
    onUpdateSettings((prev) => ({
      ...prev,
      particleColor: newColor,
    }));
    if (settings.vibrationEnabled) triggerHaptic(10);
  };

  const getIntensityLabel = (val: number) => {
    if (val <= 25) return 'Sehr dezent';
    if (val <= 50) return 'Mittel';
    if (val <= 75) return 'Lebendig';
    return 'Intensiv';
  };

  const getSpeedLabel = (val: number): { label: string; desc: string } => {
    if (val <= 0.4) return { label: 'Zeitlupe', desc: 'Extrem ruhiges, meditatives Schweben' };
    if (val <= 0.75) return { label: 'Sanft & Ruhig', desc: 'Gemächliche, unaufdringliche Bewegung' };
    if (val <= 1.25) return { label: 'Natürlich', desc: 'Ausgewogene Standardgeschwindigkeit' };
    if (val <= 1.85) return { label: 'Lebendig', desc: 'Frische, flotte Bewegung' };
    if (val <= 2.5) return { label: 'Dynamisch', desc: 'Schnelles, energiereiches Treiben' };
    return { label: 'Stürmisch', desc: 'Maximale Animationsgeschwindigkeit' };
  };

  const speedInfo = getSpeedLabel(speed);

  return (
    <div
      id="settings-card-particles"
      className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Animierte Partikeleffekte
            </h3>
            <p className="text-[11px] text-slate-400">
              Atmosphärische Hintergründe wie Schnee, Staub oder Sterne
            </p>
          </div>
        </div>

        {currentEffect !== 'none' && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1"
            style={{
              borderColor: `${color}60`,
              backgroundColor: `${color}15`,
              color: color === '#ffffff' ? '#e2e8f0' : color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            Aktiv
          </span>
        )}
      </div>

      {/* Effect Selector Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {EFFECTS.map((item) => {
          const isSelected = currentEffect === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectEffect(item.id, item.label)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 ring-2 ring-amber-500/30 shadow-md scale-[1.02]'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-1 shrink-0" />
              <span className="text-xs font-bold truncate max-w-full">{item.label}</span>
              <span className="text-[9px] opacity-70 truncate max-w-full hidden sm:block">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fine-tuning Controls (when an effect is active) */}
      {currentEffect !== 'none' && (
        <div className="space-y-4 pt-3 border-t border-slate-800/80">
          {/* Intensity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Intensität (Dichte & Sichtbarkeit)</span>
              </div>
              <span className="font-mono text-slate-400">
                {intensity}%{' '}
                <span className="text-[10px] text-amber-400/90 font-normal">
                  ({getIntensityLabel(intensity)})
                </span>
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              step="5"
              value={intensity}
              onChange={(e) => handleIntensityChange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500 px-0.5">
              <span>Dezent (15%)</span>
              <span>Ausgewogen (50%)</span>
              <span>Dicht (100%)</span>
            </div>
          </div>

          {/* Präzise Animationsgeschwindigkeits-Steuerung */}
          <div className="space-y-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {/* Header mit Live-Metrik und Reset-Button */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Animationsgeschwindigkeit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  {speed.toFixed(2)}x
                </span>
                {Math.abs(speed - 1.0) > 0.01 && (
                  <button
                    type="button"
                    onClick={handleResetSpeed}
                    title="Auf Standard (1.00x) zurücksetzen"
                    className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Beschreibung & Charakteristik des aktuellen Tempos */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
              <span className="text-amber-400/95 font-medium">{speedInfo.label}</span>
              <span className="text-slate-500 text-[10px] truncate max-w-[200px]">{speedInfo.desc}</span>
            </div>

            {/* Schieberegler mit präzisen +/- Stepper-Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepSpeed(-0.05)}
                disabled={speed <= 0.25}
                title="Langsamer (-0.05x)"
                className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 relative py-1">
                <input
                  type="range"
                  min="0.25"
                  max="3.00"
                  step="0.05"
                  value={speed}
                  onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  aria-label="Animationsgeschwindigkeit der Partikel"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepSpeed(0.05)}
                disabled={speed >= 3.0}
                title="Schneller (+0.05x)"
                className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Skalen-Hilfsbeschriftung */}
            <div className="flex justify-between text-[10px] text-slate-500 px-1 font-mono">
              <span>0.25x (Zen)</span>
              <span className={Math.abs(speed - 1.0) < 0.04 ? 'text-amber-400 font-bold' : ''}>1.00x (Standard)</span>
              <span>2.00x</span>
              <span>3.00x (Max)</span>
            </div>

            {/* Quick-Tempo Presets */}
            <div className="pt-1">
              <div className="text-[10px] text-slate-400 mb-1.5 font-medium">Tempo-Schnellwahl:</div>
              <div className="grid grid-cols-5 gap-1.5">
                {SPEED_PRESETS.map((preset) => {
                  const isActive = Math.abs(speed - preset.val) < 0.04;
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleSelectSpeedPreset(preset.val, preset.name)}
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/25 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 font-bold shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-medium'
                      }`}
                    >
                      <div className="text-[11px] font-mono">{preset.label}</div>
                      <div className="text-[9px] opacity-75 truncate">{preset.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color Customization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <span>Partikelfarbe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {color}
                </span>
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PARTICLE_COLOR_PRESETS.map((preset, idx) => {
                const isSelected = color.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={`${preset.name}-${preset.value}-${idx}`}
                    type="button"
                    title={preset.name}
                    onClick={() => handleColorChange(preset.value)}
                    className={`group relative w-7 h-7 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'border-white scale-110 ring-2 ring-white/30 shadow-md'
                        : 'border-slate-700/80 hover:scale-105 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: preset.value }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          preset.value === '#ffffff' || preset.value === '#facc15'
                            ? 'text-slate-950'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}

              {/* Sync with Clock Digit Color */}
              <button
                type="button"
                onClick={() => handleColorChange(settings.clockColor)}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 ml-auto"
                title="Partikelfarbe an die aktuelle Ziffernfarbe der Uhr anpassen"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: settings.clockColor }}
                />
                <span>Uhr-Farbe</span>
              </button>
            </div>

            {/* Free Hex Color Picker */}
            <div className="flex items-center gap-2 pt-1">
              <label
                htmlFor="particle-color-input"
                className="text-[11px] text-slate-400 shrink-0"
              >
                Individueller Farbton:
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  id="particle-color-input"
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#ffffff"
                  className="w-24 px-2 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

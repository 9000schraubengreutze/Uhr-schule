import React from 'react';
import { Sun, RotateCcw, Plus, Minus, Check, Sparkles, Palette } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';
import { colorWithAlpha, calculateRadiatingTextShadow } from '../utils/colorUtils';

interface GlowEffectControlProps {
  enabled: boolean;
  intensity: number; // 0 - 100%
  spread: number; // 10 - 120px
  glowColor?: string;
  clockColor: string;
  onToggleEnabled: (enabled: boolean) => void;
  onChangeIntensity: (intensity: number) => void;
  onChangeSpread: (spread: number) => void;
  onChangeGlowColor: (color: string | undefined) => void;
  showFeedback?: (msg: string) => void;
  vibrationEnabled?: boolean;
  className?: string;
}

const INTENSITY_PRESETS = [
  { val: 25, label: 'Subtil', pct: '25%' },
  { val: 55, label: 'Ausgewogen', pct: '55%' },
  { val: 80, label: 'Intensiv', pct: '80%' },
  { val: 100, label: 'Max Neon', pct: '100%' },
];

const SPREAD_PRESETS = [
  { val: 20, label: 'Fokussiert', px: '20px' },
  { val: 45, label: 'Weich', px: '45px' },
  { val: 75, label: 'Weit', px: '75px' },
  { val: 110, label: 'Atmosphäre', px: '110px' },
];

const COLOR_SWATCHES = [
  { hex: '#38bdf8', name: 'Sky Cyan' },
  { hex: '#3b82f6', name: 'Neon Blau' },
  { hex: '#34d399', name: 'Smaragd' },
  { hex: '#fbbf24', name: 'Goldgelb' },
  { hex: '#f43f5e', name: 'Pink Rose' },
  { hex: '#c084fc', name: 'Cyber Violett' },
  { hex: '#f8fafc', name: 'Reinweiß' },
];

export const GlowEffectControl: React.FC<GlowEffectControlProps> = ({
  enabled,
  intensity = 55,
  spread = 45,
  glowColor,
  clockColor = '#38bdf8',
  onToggleEnabled,
  onChangeIntensity,
  onChangeSpread,
  onChangeGlowColor,
  showFeedback,
  vibrationEnabled = false,
  className = '',
}) => {
  const currentIntensity = Math.max(0, Math.min(100, Math.round(intensity)));
  const currentSpread = Math.max(10, Math.min(120, Math.round(spread)));

  const activeColor = glowColor || clockColor || '#38bdf8';
  const isCustomColor = Boolean(glowColor);

  const handleToggle = () => {
    const next = !enabled;
    onToggleEnabled(next);
    if (vibrationEnabled) triggerHaptic(12);
    showFeedback?.(next ? 'Ziffern-Glow aktiviert' : 'Ziffern-Glow deaktiviert');
  };

  const handleIntensityChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    onChangeIntensity(clamped);
    if (vibrationEnabled) triggerHaptic(8);
  };

  const handleStepIntensity = (delta: number) => {
    const next = Math.max(0, Math.min(100, currentIntensity + delta));
    handleIntensityChange(next);
    showFeedback?.(`Glow-Intensität: ${next}%`);
  };

  const handleSpreadChange = (val: number) => {
    const clamped = Math.max(10, Math.min(120, Math.round(val)));
    onChangeSpread(clamped);
    if (vibrationEnabled) triggerHaptic(8);
  };

  const handleStepSpread = (delta: number) => {
    const next = Math.max(10, Math.min(120, currentSpread + delta));
    handleSpreadChange(next);
    showFeedback?.(`Glow-Radius: ${next}px`);
  };

  const handleReset = () => {
    onToggleEnabled(true);
    onChangeIntensity(55);
    onChangeSpread(45);
    onChangeGlowColor(undefined);
    if (vibrationEnabled) triggerHaptic(12);
    showFeedback?.('Glow-Einstellungen auf Standard (55%, 45px, Auto-Farbe) zurückgesetzt');
  };

  // Preview styling calculations
  const previewNormIntensity = enabled ? currentIntensity / 100 : 0;
  const previewShadow = enabled
    ? calculateRadiatingTextShadow(activeColor, currentIntensity, Math.min(60, currentSpread))
    : 'none';

  return (
    <div
      id="glow-effect-control-card"
      className={`rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-4 shadow-md ${className}`}
    >
      {/* Header with Title and Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                Ziffern-Glow & Hinterleuchtung
              </span>
              {enabled && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Aktiv
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Subtiles, hinter den Ziffern strahlendes Leuchten mit anpassbarer Intensität & Weite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
              enabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          {(currentIntensity !== 55 || currentSpread !== 45 || isCustomColor || !enabled) && (
            <button
              type="button"
              onClick={handleReset}
              title="Auf Standard zurücksetzen"
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Live Interactive Preview Box */}
      <div className="relative rounded-xl bg-slate-950/80 border border-slate-800/80 p-3.5 flex flex-col items-center justify-center overflow-hidden min-h-[85px]">
        {/* Radiating Backlight Glow layer in the preview */}
        {enabled && previewNormIntensity > 0 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none flex items-center justify-center -z-0 overflow-visible"
            style={{
              opacity: previewNormIntensity,
            }}
          >
            <div
              className="w-3/4 h-12 rounded-full will-change-transform"
              style={{
                background: `radial-gradient(ellipse 65% 50% at 50% 50%, ${colorWithAlpha(
                  activeColor,
                  0.5 * previewNormIntensity
                )} 0%, ${colorWithAlpha(
                  activeColor,
                  0.2 * previewNormIntensity
                )} 50%, transparent 80%)`,
                filter: `blur(${Math.max(6, Math.round(currentSpread * 0.35))}px)`,
              }}
            />
          </div>
        )}

        <div className="relative z-10 flex items-center gap-1">
          <span
            className="font-mono text-2xl font-bold tracking-wider select-none transition-all duration-200"
            style={{
              color: clockColor,
              textShadow: previewShadow,
            }}
          >
            12:48
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono ml-1">
            PREVIEW
          </span>
        </div>

        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
          <span>Intensität: <strong className="text-amber-300">{enabled ? `${currentIntensity}%` : 'Aus'}</strong></span>
          <span>•</span>
          <span>Spread: <strong className="text-amber-300">{enabled ? `${currentSpread}px` : 'Aus'}</strong></span>
        </div>
      </div>

      {/* Controls visible when enabled */}
      {enabled && (
        <div className="space-y-4 pt-1">
          {/* Intensity Slider & Stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Leucht-Intensität (Farbdichte)
              </span>
              <span className="font-mono text-amber-400 font-bold text-xs bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                {currentIntensity}%
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleStepIntensity(-5)}
                disabled={currentIntensity <= 0}
                title="Intensität verringern (-5%)"
                className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 relative py-1">
                <input
                  id="glow-intensity-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentIntensity}
                  onChange={(e) => handleIntensityChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  aria-label="Glow Intensität"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepIntensity(5)}
                disabled={currentIntensity >= 100}
                title="Intensität erhöhen (+5%)"
                className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Intensity Quick Presets */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {INTENSITY_PRESETS.map((p) => {
                const isSelected = Math.abs(currentIntensity - p.val) <= 4;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      handleIntensityChange(p.val);
                      showFeedback?.(`Intensität: ${p.label} (${p.pct})`);
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>{p.pct}</div>
                    <div className="text-[8px] opacity-75">{p.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spread / Radius Slider & Stepper */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Ausbreitung & Radius (Spread)
              </span>
              <span className="font-mono text-amber-400 font-bold text-xs bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                {currentSpread}px
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleStepSpread(-5)}
                disabled={currentSpread <= 10}
                title="Radius verringern (-5px)"
                className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 relative py-1">
                <input
                  id="glow-spread-slider"
                  type="range"
                  min="10"
                  max="120"
                  step="2"
                  value={currentSpread}
                  onChange={(e) => handleSpreadChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  aria-label="Glow Ausbreitung und Radius"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepSpread(5)}
                disabled={currentSpread >= 120}
                title="Radius erhöhen (+5px)"
                className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spread Quick Presets */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {SPREAD_PRESETS.map((p) => {
                const isSelected = Math.abs(currentSpread - p.val) <= 5;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      handleSpreadChange(p.val);
                      showFeedback?.(`Glow-Radius: ${p.label} (${p.px})`);
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>{p.px}</div>
                    <div className="text-[8px] opacity-75">{p.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Glow Color Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                Leuchtfarbe (Aura-Farbton)
              </span>
              <span className="text-[11px] text-slate-400">
                {isCustomColor ? 'Benutzerdefiniert' : 'Automatisch (Ziffernfarbe)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Auto match button */}
              <button
                type="button"
                onClick={() => {
                  onChangeGlowColor(undefined);
                  if (vibrationEnabled) triggerHaptic(8);
                  showFeedback?.('Glow-Farbe: Automatisch an Ziffernfarbe gekoppelt');
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                  !isCustomColor
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold ring-1 ring-amber-500/30'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {!isCustomColor && <Check className="w-3 h-3 text-amber-400" />}
                <span>Auto (Ziffernfarbe)</span>
              </button>

              {/* Swatches */}
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = isCustomColor && glowColor?.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => {
                      onChangeGlowColor(swatch.hex);
                      if (vibrationEnabled) triggerHaptic(8);
                      showFeedback?.(`Glow-Farbe: ${swatch.name}`);
                    }}
                    title={swatch.name}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: swatch.hex,
                      boxShadow: `0 0 10px ${swatch.hex}80`,
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </button>
                );
              })}

              {/* Custom Color Input */}
              <label
                title="Eigene Hex-Farbe wählen"
                className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center cursor-pointer hover:border-slate-500 relative overflow-hidden"
              >
                <input
                  type="color"
                  value={glowColor || clockColor || '#38bdf8'}
                  onChange={(e) => {
                    onChangeGlowColor(e.target.value);
                    showFeedback?.(`Glow-Farbe: ${e.target.value}`);
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: glowColor || clockColor || '#38bdf8' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

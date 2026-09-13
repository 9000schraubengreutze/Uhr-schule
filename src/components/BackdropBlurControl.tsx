import React from 'react';
import { Layers, RotateCcw, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';

interface BackdropBlurControlProps {
  value: number;
  onChange: (value: number) => void;
  showFeedback?: (msg: string) => void;
  vibrationEnabled?: boolean;
  className?: string;
  compact?: boolean;
}

const BLUR_PRESETS = [
  { val: 0, label: '0px', name: 'Aus / Klar', desc: 'Kein Weichzeichner' },
  { val: 8, label: '8px', name: 'Dezent', desc: 'Leichter Frost' },
  { val: 16, label: '16px', name: 'Standard', desc: 'Optimaler Glaseffekt' },
  { val: 24, label: '24px', name: 'Stark', desc: 'Dichte Unschärfe' },
  { val: 40, label: '40px', name: 'Ultra', desc: 'Maximale Tiefe' },
];

export const BackdropBlurControl: React.FC<BackdropBlurControlProps> = ({
  value,
  onChange,
  showFeedback,
  vibrationEnabled = false,
  className = '',
  compact = false,
}) => {
  const currentBlur = typeof value === 'number' ? Math.max(0, Math.min(40, value)) : 16;

  const handleBlurChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(40, Math.round(newVal)));
    onChange(clamped);
    if (vibrationEnabled) triggerHaptic(10);
  };

  const handleStep = (delta: number) => {
    const next = Math.max(0, Math.min(40, currentBlur + delta));
    handleBlurChange(next);
    showFeedback?.(`Glas-Unschärfe: ${next}px`);
  };

  const handleReset = () => {
    handleBlurChange(16);
    showFeedback?.('Glas-Unschärfe auf Standard (16px) zurückgesetzt');
  };

  const handlePresetSelect = (val: number, name: string) => {
    handleBlurChange(val);
    showFeedback?.(`Glas-Unschärfe: ${name} (${val}px)`);
  };

  const getBlurLevelInfo = (val: number): { label: string; desc: string } => {
    if (val === 0) return { label: 'Klar (Aus)', desc: 'Reine Transparenz ohne Unschärfe' };
    if (val <= 6) return { label: 'Sehr dezent', desc: 'Minimale Hintergrund-Dämpfung' };
    if (val <= 12) return { label: 'Sanft', desc: 'Subtiler, unaufdringlicher Frosteffekt' };
    if (val <= 20) return { label: 'Ausgewogen (Standard)', desc: 'Perfekter Glassmorphism & beste Lesbarkeit' };
    if (val <= 30) return { label: 'Stark', desc: 'Dichter, samtiger Glaseffekt' };
    return { label: 'Ultra / Maximal', desc: 'Höchste Hintergrund-Weichzeichnung' };
  };

  const levelInfo = getBlurLevelInfo(currentBlur);

  return (
    <div
      id="backdrop-blur-control-card"
      className={`rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-3.5 shadow-md ${className}`}
    >
      {/* Header mit Titel, Wert und Reset-Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                Hintergrund-Blur (Glassmorphism)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Stärke des Weichzeichnungs-Filters für Glaskarten & UI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-lg shadow-inner">
            {currentBlur}px
          </span>
          {currentBlur !== 16 && (
            <button
              type="button"
              onClick={handleReset}
              title="Auf Standard (16px) zurücksetzen"
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Interaktive Live-Vorschau (nur wenn nicht ultra-kompakt) */}
      {!compact && (
        <div className="relative overflow-hidden rounded-xl h-16 border border-slate-800/90 flex items-center justify-center p-3 select-none">
          {/* Lebhafter Hintergrund mit Farbverläufen & geometrischer Struktur */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #0f172a 50%, #0369a1 75%, #0284c7 100%)',
            }}
          />
          {/* Akzent-Punkte im Hintergrund zur Veranschaulichung der Weichzeichnung */}
          <div className="absolute top-1 left-4 w-10 h-10 rounded-full bg-amber-400/40 blur-[2px]" />
          <div className="absolute bottom-1 right-6 w-12 h-12 rounded-full bg-cyan-400/50 blur-[1px]" />
          <div className="absolute top-3 right-1/3 w-8 h-8 rounded-full bg-fuchsia-500/40" />

          {/* Floating Glassmorphism Badge mit echtem Live-Blur */}
          <div
            className="relative z-10 px-4 py-1.5 rounded-xl border border-white/25 bg-white/10 shadow-lg flex items-center gap-2 text-white transition-all duration-150"
            style={{
              backdropFilter: `blur(${currentBlur}px)`,
              WebkitBackdropFilter: `blur(${currentBlur}px)`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            <span className="text-xs font-semibold drop-shadow-sm">
              Live-Vorschau: {currentBlur}px Blur
            </span>
            <span className="text-[10px] text-white/80 font-mono font-medium pl-1 border-l border-white/20">
              {levelInfo.label}
            </span>
          </div>
        </div>
      )}

      {/* Zustand / Beschreibung des aktuellen Blurs */}
      <div className="flex items-center justify-between text-[11px] px-0.5">
        <span className="text-blue-400 font-semibold">{levelInfo.label}</span>
        <span className="text-slate-400 text-[11px] truncate max-w-[240px] text-right">
          {levelInfo.desc}
        </span>
      </div>

      {/* Schieberegler mit präzisen +/- Steppern */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={currentBlur <= 0}
          title="Unschärfe verringern (-1px)"
          className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 relative py-1">
          <input
            id="backdrop-blur-intensity-slider"
            type="range"
            min="0"
            max="40"
            step="1"
            value={currentBlur}
            onChange={(e) => handleBlurChange(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            aria-label="Intensität des Hintergrund-Blur-Effekts Glassmorphism"
          />
        </div>

        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={currentBlur >= 40}
          title="Unschärfe verstärken (+1px)"
          className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Skalen-Hilfsmarkierungen */}
      <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
        <span>0px (Aus)</span>
        <span className={currentBlur === 8 ? 'text-blue-400 font-bold' : ''}>8px</span>
        <span className={currentBlur === 16 ? 'text-blue-400 font-bold' : ''}>16px (Standard)</span>
        <span className={currentBlur === 24 ? 'text-blue-400 font-bold' : ''}>24px</span>
        <span>40px (Max)</span>
      </div>

      {/* Schnellwahl-Presets */}
      <div className="pt-1">
        <div className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center justify-between">
          <span>Schnellwahl-Stufen:</span>
          {currentBlur === 16 && (
            <span className="text-blue-400/90 text-[10px] font-medium flex items-center gap-1">
              <Check className="w-3 h-3 text-blue-400" />
              Optimal für OLED & LCD
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {BLUR_PRESETS.map((preset) => {
            const isSelected = currentBlur === preset.val;
            return (
              <button
                key={preset.val}
                type="button"
                onClick={() => handlePresetSelect(preset.val, preset.name)}
                className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/30 font-bold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="text-[11px] font-mono">{preset.label}</div>
                <div className="text-[9px] opacity-75 truncate">{preset.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hinweistext */}
      <p className="text-[10px] text-slate-400/90 pt-1 leading-relaxed">
        Wirkt sich auf die Rahmenkarte der Zeitanzeige, Schnellzugriff-Buttons, Weltuhr-Kacheln,
        Wetter-Widgets und geöffnete Fenster aus.
      </p>
    </div>
  );
};

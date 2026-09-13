import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Plus, Minus, Check, Play } from 'lucide-react';
import { DigitTransition } from '../types';
import { SpringDigit } from './SpringDigit';
import { triggerHaptic } from '../utils/audio';

interface DigitTransitionControlProps {
  transitionType: DigitTransition;
  durationMs: number;
  onChangeTransition: (type: DigitTransition) => void;
  onChangeDuration: (duration: number) => void;
  showFeedback?: (msg: string) => void;
  vibrationEnabled?: boolean;
  className?: string;
}

const TRANSITION_OPTIONS: {
  id: DigitTransition;
  label: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: 'fade',
    label: 'Subtiles Fading',
    badge: 'Standard',
    desc: 'Geschmeidige Auflösung mit sanftem Micro-Drift für maximale Fluidität',
  },
  {
    id: 'crossfade',
    label: 'Reiner Crossfade',
    badge: 'Stationär',
    desc: 'Reines Überblenden an Ort und Stelle ohne jede Positionsverschiebung',
  },
  {
    id: 'slide-fade',
    label: 'Gleiten & Fade',
    badge: 'Dynamisch',
    desc: 'Kinetischer Aufwärts-Gleitimpuls kombiniert mit vollem Ausfaden',
  },
  {
    id: 'none',
    label: 'Direkt (Aus)',
    badge: 'Klassisch',
    desc: 'Sofortiges Umschalten der Ziffern ohne Übergangseffekt',
  },
];

export const DigitTransitionControl: React.FC<DigitTransitionControlProps> = ({
  transitionType = 'fade',
  durationMs = 360,
  onChangeTransition,
  onChangeDuration,
  showFeedback,
  vibrationEnabled = false,
  className = '',
}) => {
  const [demoDigit, setDemoDigit] = useState<number>(0);

  // Cycle demo digit every 1.2s to showcase the selected transition live in the control
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoDigit((prev) => (prev + 1) % 10);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const handleSelectType = (type: DigitTransition, label: string) => {
    onChangeTransition(type);
    if (vibrationEnabled) triggerHaptic(10);
    showFeedback?.(`Ziffern-Übergang: ${label}`);
  };

  const handleDurationChange = (val: number) => {
    const clamped = Math.max(150, Math.min(600, Math.round(val)));
    onChangeDuration(clamped);
    if (vibrationEnabled) triggerHaptic(8);
  };

  const handleStepDuration = (delta: number) => {
    const next = Math.max(150, Math.min(600, durationMs + delta));
    handleDurationChange(next);
    showFeedback?.(`Fading-Dauer: ${next}ms`);
  };

  const handleReset = () => {
    onChangeTransition('fade');
    onChangeDuration(360);
    if (vibrationEnabled) triggerHaptic(12);
    showFeedback?.('Ziffern-Fading auf Standard (Subtil, 360ms) zurückgesetzt');
  };

  const currentOption =
    TRANSITION_OPTIONS.find((o) => o.id === transitionType) || TRANSITION_OPTIONS[0];

  return (
    <div
      id="digit-transition-control-card"
      className={`rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-3.5 shadow-md ${className}`}
    >
      {/* Header with Title and Reset Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                Fließendes Ziffern-Fading (Sekundentakt)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Sanfte Ein- & Ausblend-Animation beim Ziffernwechsel der Uhr
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-lg shadow-inner">
            {transitionType === 'none' ? 'AUS' : `${durationMs}ms`}
          </span>
          {(transitionType !== 'fade' || durationMs !== 360) && (
            <button
              type="button"
              onClick={handleReset}
              title="Auf Standard (Subtiles Fading, 360ms) zurücksetzen"
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Live Interactive Preview Tile */}
      <div className="relative overflow-hidden rounded-xl h-16 bg-slate-950/80 border border-slate-800 flex items-center justify-between px-5 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/70 text-sky-400 text-2xl font-mono font-bold shadow-inner">
            <SpringDigit
              digit={String(demoDigit)}
              transitionType={transitionType}
              durationMs={durationMs}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Play className="w-3 h-3 text-sky-400 fill-sky-400/30" />
              Live-Vorschau: {currentOption.label}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[240px]">
              {currentOption.desc}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-900 text-sky-300 border border-slate-800">
          Takt: 1.2s
        </span>
      </div>

      {/* Style Option Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {TRANSITION_OPTIONS.map((option) => {
          const isSelected = transitionType === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelectType(option.id, option.label)}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-sky-500/20 border-sky-500 text-sky-100 ring-2 ring-sky-500/30 font-bold shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-semibold">{option.label}</span>
                {isSelected && <Check className="w-3 h-3 text-sky-400 shrink-0" />}
              </div>
              <span className="text-[9px] text-slate-400/90 font-normal leading-tight">
                {option.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Duration Slider (only active if transition is enabled) */}
      {transitionType !== 'none' && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Fading-Geschwindigkeit</span>
            <span className="font-mono text-sky-400 font-semibold">{durationMs} ms</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleStepDuration(-20)}
              disabled={durationMs <= 150}
              title="Fading verkürzen (-20ms)"
              className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1 relative py-1">
              <input
                id="digit-fade-duration-slider"
                type="range"
                min="150"
                max="600"
                step="10"
                value={durationMs}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                aria-label="Fading-Dauer in Millisekunden"
              />
            </div>

            <button
              type="button"
              onClick={() => handleStepDuration(20)}
              disabled={durationMs >= 600}
              title="Fading verlängern (+20ms)"
              className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick preset durations */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-0.5">
            <span>150ms (Schnell)</span>
            <span className={durationMs === 360 ? 'text-sky-400 font-bold' : ''}>
              360ms (Optimal)
            </span>
            <span>600ms (Sehr weich)</span>
          </div>
        </div>
      )}

      {/* Descriptive notice */}
      <p className="text-[10px] text-slate-400/90 pt-0.5 leading-relaxed">
        Gilt für Stunden, Minuten, Sekunden sowie alle Weltuhr-Anzeigen und sorgt für fließende Übergänge statt harter Zahlensprünge.
      </p>
    </div>
  );
};

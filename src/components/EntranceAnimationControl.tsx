import React, { useState } from 'react';
import { ArrowUpRight, Sparkles, Play, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';

interface EntranceAnimationControlProps {
  enabled: boolean;
  animationType: 'slide-up' | 'fade-in';
  onToggleEnabled: (enabled: boolean) => void;
  onChangeAnimationType: (type: 'slide-up' | 'fade-in') => void;
  showFeedback?: (msg: string) => void;
  vibrationEnabled?: boolean;
  className?: string;
}

export const EntranceAnimationControl: React.FC<EntranceAnimationControlProps> = ({
  enabled = true,
  animationType = 'slide-up',
  onToggleEnabled,
  onChangeAnimationType,
  showFeedback,
  vibrationEnabled = false,
  className = '',
}) => {
  const [previewKey, setPreviewKey] = useState(0);

  const handleTestPreview = () => {
    if (vibrationEnabled) triggerHaptic(20);
    setPreviewKey((k) => k + 1);
    // Also trigger on main clock display if active in background
    window.dispatchEvent(new CustomEvent('trigger-clock-entrance'));
    showFeedback?.(
      animationType === 'slide-up'
        ? 'Eingangsanimation (Slide-Up & Fade) ausgelöst'
        : 'Eingangsanimation (Fade-In) ausgelöst'
    );
  };

  const handleToggle = () => {
    if (vibrationEnabled) triggerHaptic(15);
    const next = !enabled;
    onToggleEnabled(next);
    showFeedback?.(
      next
        ? 'Eingangsanimation für Zen-Modus & Einstellungen aktiviert'
        : 'Eingangsanimation deaktiviert'
    );
  };

  const handleSelectType = (type: 'slide-up' | 'fade-in') => {
    if (vibrationEnabled) triggerHaptic(12);
    onChangeAnimationType(type);
    setPreviewKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent('trigger-clock-entrance'));
    showFeedback?.(
      type === 'slide-up'
        ? 'Animation: Slide-Up & Fade ausgewählt'
        : 'Animation: Pure Fade-In ausgewählt'
    );
  };

  return (
    <div
      id="entrance-animation-settings-card"
      className={`p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg backdrop-blur-md space-y-4 ${className}`}
    >
      {/* Header & Toggle Switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100">
              Eingangsanimation (Zen & Einstellungen)
            </h4>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              CSS
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Sanftes Hereingleiten & Einblenden der Digitaluhr beim Umschalten des Zen-Modus
            oder beim Schließen der Einstellungen.
          </p>
        </div>

        {/* Master Switch Button */}
        <button
          type="button"
          onClick={handleToggle}
          role="switch"
          aria-checked={enabled}
          aria-label="Eingangsanimation umschalten"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            enabled ? 'bg-blue-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3.5 pt-1 border-t border-slate-800/80">
          {/* Live Interactive Preview Box */}
          <div className="relative overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                key={previewKey}
                className={`flex items-baseline gap-1 font-mono text-lg font-bold text-white tracking-wider px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 shadow-inner ${
                  animationType === 'slide-up'
                    ? 'animate-clock-slide-up'
                    : 'animate-clock-fade-in'
                }`}
              >
                <span className="text-blue-400">12</span>
                <span className="opacity-60">:</span>
                <span className="text-blue-300">45</span>
                <span className="opacity-60">:</span>
                <span className="text-slate-400 text-xs font-normal">30</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Live-Vorschau
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestPreview}
              title="Vorschau der Eingangsanimation jetzt abspielen"
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Play className="w-3 h-3 text-blue-400 fill-blue-400" />
              <span>Abspielen</span>
            </button>
          </div>

          {/* Animation Type Choices */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectType('slide-up')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                animationType === 'slide-up'
                  ? 'bg-blue-600/15 border-blue-500/60 shadow-sm shadow-blue-500/10 text-white'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Slide-Up & Fade
                </span>
                {animationType === 'slide-up' && (
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 leading-tight">
                Sanfter Aufwärts-Gleitimpuls (32px) kombiniert mit Weichzeichner-Fade.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('fade-in')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                animationType === 'fade-in'
                  ? 'bg-blue-600/15 border-blue-500/60 shadow-sm shadow-blue-500/10 text-white'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Pure Fade-In
                </span>
                {animationType === 'fade-in' && (
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 leading-tight">
                Fließendes, stationäres Einblenden mit feiner Konturenschärfung.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

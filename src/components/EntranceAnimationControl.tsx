import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Check,
  MoveUp,
  MoveDown,
  RotateCcw,
  ZoomIn,
  Eye,
  Layers,
  Smartphone,
  Sliders,
  SunMedium,
  Zap,
} from 'lucide-react';
import { triggerHaptic } from '../utils/audio';
import { EntranceAnimationType } from '../types';

export interface EntranceAnimationControlProps {
  enabled: boolean;
  animationType: EntranceAnimationType;
  wakeScreenEnabled?: boolean;
  menuExitEnabled?: boolean;
  zenToggleEnabled?: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onChangeAnimationType: (type: EntranceAnimationType) => void;
  onToggleWakeScreen?: (enabled: boolean) => void;
  onToggleMenuExit?: (enabled: boolean) => void;
  onToggleZenToggle?: (enabled: boolean) => void;
  showFeedback?: (msg: string) => void;
  vibrationEnabled?: boolean;
  className?: string;
}

interface AnimationOption {
  id: EntranceAnimationType;
  name: string;
  tag: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  previewClass: string;
}

const ANIMATION_OPTIONS: AnimationOption[] = [
  {
    id: 'slide-up',
    name: 'Slide Up',
    tag: 'Empfohlen',
    desc: 'Sanfter Aufwärts-Gleitimpuls (36px) mit fließendem Weichzeichner-Fade.',
    icon: MoveUp,
    accentColor: 'text-blue-400',
    previewClass: 'animate-clock-slide-up',
  },
  {
    id: 'slide-down',
    name: 'Slide Down',
    tag: 'Sanft',
    desc: 'Sanftes Absenken von oben mit weicher Abbremsung in die Mitte.',
    icon: MoveDown,
    accentColor: 'text-emerald-400',
    previewClass: 'animate-clock-slide-down',
  },
  {
    id: 'fade-in',
    name: 'Pure Fade',
    tag: 'Minimalistisch',
    desc: 'Stationäres, gleichmäßiges Einblenden mit feiner Konturenschärfung.',
    icon: Eye,
    accentColor: 'text-sky-400',
    previewClass: 'animate-clock-fade-in',
  },
  {
    id: 'rotate',
    name: 'Rotate & Swing',
    tag: 'Dynamisch',
    desc: 'Schwungvolle Drehbewegung (-7° bis 0°) mit organischer Skalierung.',
    icon: RotateCcw,
    accentColor: 'text-amber-400',
    previewClass: 'animate-clock-rotate',
  },
  {
    id: 'zoom-in',
    name: 'Focus Zoom',
    tag: 'Markant',
    desc: 'Fokus-Zoom aus der Tiefe mit federnder Dämpfung auf 100%.',
    icon: ZoomIn,
    accentColor: 'text-violet-400',
    previewClass: 'animate-clock-zoom',
  },
  {
    id: 'flip',
    name: '3D Flip',
    tag: 'Perspektive',
    desc: 'Räumliche 3D-Kippung nach vorne (Perspective Flip 45° nach 0°).',
    icon: Layers,
    accentColor: 'text-pink-400',
    previewClass: 'animate-clock-flip',
  },
];

export const EntranceAnimationControl: React.FC<EntranceAnimationControlProps> = ({
  enabled = true,
  animationType = 'slide-up',
  wakeScreenEnabled = true,
  menuExitEnabled = true,
  zenToggleEnabled = true,
  onToggleEnabled,
  onChangeAnimationType,
  onToggleWakeScreen,
  onToggleMenuExit,
  onToggleZenToggle,
  showFeedback,
  vibrationEnabled = false,
  className = '',
}) => {
  const [previewKey, setPreviewKey] = useState(0);

  const getAnimationLabel = (type: EntranceAnimationType) => {
    switch (type) {
      case 'slide-down':
        return 'Slide Down (Abwärts)';
      case 'fade-in':
        return 'Pure Fade (Einblenden)';
      case 'rotate':
        return 'Rotate & Swing (Drehung)';
      case 'zoom-in':
        return 'Focus Zoom (Heranzoomen)';
      case 'flip':
        return '3D Flip (Kippung)';
      case 'slide-up':
      default:
        return 'Slide Up (Aufwärts)';
    }
  };

  const handleTestPreview = () => {
    if (vibrationEnabled) triggerHaptic(20);
    setPreviewKey((k) => k + 1);
    // Broadcast trigger event to also preview on the main clock canvas
    window.dispatchEvent(new CustomEvent('trigger-clock-entrance'));
    showFeedback?.(`Eingangsanimation (${getAnimationLabel(animationType)}) abgespielt`);
  };

  const handleToggle = () => {
    if (vibrationEnabled) triggerHaptic(15);
    const next = !enabled;
    onToggleEnabled(next);
    showFeedback?.(
      next
        ? 'Uhr-Eingangsanimationen aktiviert'
        : 'Uhr-Eingangsanimationen deaktiviert'
    );
  };

  const handleSelectType = (type: EntranceAnimationType) => {
    if (vibrationEnabled) triggerHaptic(12);
    onChangeAnimationType(type);
    setPreviewKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent('trigger-clock-entrance'));
    showFeedback?.(`Animation "${getAnimationLabel(type)}" gewählt`);
  };

  const currentOption =
    ANIMATION_OPTIONS.find((opt) => opt.id === animationType) || ANIMATION_OPTIONS[0];

  return (
    <section
      id="entrance-animation-settings-card"
      aria-label="Uhr-Eingangsanimationen"
      className={`p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-4.5 ${className}`}
    >
      {/* Header & Main Toggle Switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Uhr-Eingangsanimationen
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Neu
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Wähle den Übergangseffekt (Slide, Fade, Rotate, Zoom, 3D Flip) beim Aufwecken des
            Bildschirms oder beim Schließen von Menüs.
          </p>
        </div>

        {/* Master Switch Button */}
        <button
          type="button"
          id="toggle-entrance-animation-master-switch"
          onClick={handleToggle}
          role="switch"
          aria-checked={enabled}
          aria-label="Eingangsanimation umschalten"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            enabled ? 'bg-blue-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 pt-1 border-t border-slate-800/80">
          {/* Live Interactive Preview Box */}
          <div
            id="entrance-preview-stage"
            className="relative overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div
                key={previewKey}
                className={`flex items-baseline gap-1 font-mono text-xl font-black text-white tracking-widest px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg ${currentOption.previewClass}`}
              >
                <span className="text-blue-400">12</span>
                <span className="opacity-50 text-slate-300">:</span>
                <span className="text-sky-300">45</span>
                <span className="opacity-50 text-slate-300">:</span>
                <span className="text-slate-400 text-xs font-semibold">30</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  {currentOption.name}
                </span>
                <span className="text-[11px] text-slate-400">Aktiver Effekt</span>
              </div>
            </div>

            <button
              type="button"
              id="test-entrance-animation-btn"
              onClick={handleTestPreview}
              title="Animation jetzt live ausprobieren"
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-blue-500/10"
            >
              <Play className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
              <span>Animation testen</span>
            </button>
          </div>

          {/* Animation Style Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Animationsstil wählen</span>
              <span className="text-[11px] text-slate-500">6 Effekte verfügbar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ANIMATION_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = animationType === opt.id;

                return (
                  <button
                    key={opt.id}
                    id={`select-entrance-anim-${opt.id}`}
                    type="button"
                    onClick={() => handleSelectType(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative group ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-500/25 text-blue-400'
                              : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold">{opt.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                          }`}
                        >
                          {opt.tag}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 stroke-[2.5]" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trigger Conditions / Event Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Auslöser (Trigger)</span>
              <span className="text-[11px] text-slate-500">Wann wird animiert?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Trigger 1: Screen Wake */}
              <button
                type="button"
                id="toggle-entrance-trigger-wake"
                onClick={() => {
                  if (vibrationEnabled) triggerHaptic(10);
                  const next = !wakeScreenEnabled;
                  onToggleWakeScreen?.(next);
                  showFeedback?.(
                    next
                      ? 'Animation bei Bildschirm-Aufwachen aktiviert'
                      : 'Animation bei Bildschirm-Aufwachen deaktiviert'
                  );
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  wakeScreenEnabled
                    ? 'bg-blue-950/30 border-blue-500/40 text-slate-200'
                    : 'bg-slate-950/30 border-slate-800/60 text-slate-400 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SunMedium
                    className={`w-4 h-4 ${wakeScreenEnabled ? 'text-amber-400' : 'text-slate-500'}`}
                  />
                  <div>
                    <div className="text-xs font-semibold leading-tight">Bildschirm-Wake</div>
                    <div className="text-[10px] text-slate-500">Aufwecken & Tab-Aktiv</div>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    wakeScreenEnabled
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {wakeScreenEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Trigger 2: Menu Exit */}
              <button
                type="button"
                id="toggle-entrance-trigger-menu-exit"
                onClick={() => {
                  if (vibrationEnabled) triggerHaptic(10);
                  const next = !menuExitEnabled;
                  onToggleMenuExit?.(next);
                  showFeedback?.(
                    next
                      ? 'Animation beim Schließen von Menüs aktiviert'
                      : 'Animation beim Schließen von Menüs deaktiviert'
                  );
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  menuExitEnabled
                    ? 'bg-blue-950/30 border-blue-500/40 text-slate-200'
                    : 'bg-slate-950/30 border-slate-800/60 text-slate-400 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders
                    className={`w-4 h-4 ${menuExitEnabled ? 'text-sky-400' : 'text-slate-500'}`}
                  />
                  <div>
                    <div className="text-xs font-semibold leading-tight">Menü-Exit</div>
                    <div className="text-[10px] text-slate-500">Menüs schließen</div>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    menuExitEnabled
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {menuExitEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Trigger 3: Zen Mode Toggle */}
              <button
                type="button"
                id="toggle-entrance-trigger-zen-mode"
                onClick={() => {
                  if (vibrationEnabled) triggerHaptic(10);
                  const next = !zenToggleEnabled;
                  onToggleZenToggle?.(next);
                  showFeedback?.(
                    next
                      ? 'Animation bei Zen-Modus Wechsel aktiviert'
                      : 'Animation bei Zen-Modus Wechsel deaktiviert'
                  );
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  zenToggleEnabled
                    ? 'bg-blue-950/30 border-blue-500/40 text-slate-200'
                    : 'bg-slate-950/30 border-slate-800/60 text-slate-400 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone
                    className={`w-4 h-4 ${zenToggleEnabled ? 'text-indigo-400' : 'text-slate-500'}`}
                  />
                  <div>
                    <div className="text-xs font-semibold leading-tight">Zen-Modus</div>
                    <div className="text-[10px] text-slate-500">Fokus umschalten</div>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    zenToggleEnabled
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {zenToggleEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

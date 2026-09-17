import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Palette,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Shuffle,
  Layers,
  SunMedium,
} from 'lucide-react';
import { ClockSettings } from '../types';

export type ColorScope = 'all' | 'hours' | 'minutes' | 'seconds';

interface ClockColorPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onUpdateSettings: (updater: (prev: ClockSettings) => ClockSettings) => void;
  initialScope?: ColorScope;
}

// 18 Curated, vibrant & high-contrast clock digit colors
const QUICK_COLOR_SWATCHES = [
  { name: 'Klassisch Weiß', value: '#ffffff' },
  { name: 'Eisblau (Cyan)', value: '#38bdf8' },
  { name: 'Neon Türkis', value: '#06b6d4' },
  { name: 'Smaragdgrün', value: '#34d399' },
  { name: 'Neon Limette', value: '#a3e635' },
  { name: 'Sonnengelb', value: '#facc15' },
  { name: 'Bernsteingold', value: '#fbbf24' },
  { name: 'Vibrant Orange', value: '#f97316' },
  { name: 'Korallrot', value: '#fb7185' },
  { name: 'Rubinrot', value: '#f43f5e' },
  { name: 'Magenta Pink', value: '#f472b6' },
  { name: 'Elektrisches Violett', value: '#c084fc' },
  { name: 'Königsblau', value: '#818cf8' },
  { name: 'Indigoblau', value: '#6366f1' },
  { name: 'Sanfte Minze', value: '#2dd4bf' },
  { name: 'Silbergrau', value: '#94a3b8' },
  { name: 'Schiefergrau', value: '#475569' },
  { name: 'Tiefschwarz', value: '#09090b' },
];

export const ClockColorPickerPopover: React.FC<ClockColorPickerPopoverProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  initialScope = 'all',
}) => {
  const [activeScope, setActiveScope] = useState<ColorScope>(initialScope);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Synchronize scope when initialScope changes
  useEffect(() => {
    if (initialScope) {
      setActiveScope(initialScope);
    }
  }, [initialScope]);

  // Determine currently active color based on activeScope
  const getCurrentColor = (): string => {
    switch (activeScope) {
      case 'hours':
        return settings.hoursColor || settings.clockColor;
      case 'minutes':
        return settings.minutesColor || settings.clockColor;
      case 'seconds':
        return settings.secondsColor || settings.clockColor;
      case 'all':
      default:
        return settings.clockColor;
    }
  };

  const currentColor = getCurrentColor();

  // Apply new color to target scope
  const handleApplyColor = (color: string) => {
    onUpdateSettings((prev) => {
      if (activeScope === 'all') {
        return {
          ...prev,
          clockColor: color,
          // Clear individual overrides so all digits cleanly take the new color
          hoursColor: undefined,
          minutesColor: undefined,
          secondsColor: undefined,
          colonColor: undefined,
        };
      } else if (activeScope === 'hours') {
        return { ...prev, hoursColor: color };
      } else if (activeScope === 'minutes') {
        return { ...prev, minutesColor: color };
      } else if (activeScope === 'seconds') {
        return { ...prev, secondsColor: color };
      }
      return prev;
    });
  };

  // Broadcast current active color to all numbers
  const handleApplyToAll = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      clockColor: currentColor,
      hoursColor: undefined,
      minutesColor: undefined,
      secondsColor: undefined,
      colonColor: undefined,
    }));
    setActiveScope('all');
  };

  // Pick a random vibrant color
  const handleRandomColor = () => {
    const randomItem = QUICK_COLOR_SWATCHES[Math.floor(Math.random() * QUICK_COLOR_SWATCHES.length)];
    handleApplyColor(randomItem.value);
  };

  // Reset colors back to standard default
  const handleResetColors = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      clockColor: '#38bdf8',
      hoursColor: undefined,
      minutesColor: undefined,
      secondsColor: undefined,
      colonColor: undefined,
    }));
    setActiveScope('all');
  };

  // Toggle ambient glow
  const handleToggleGlow = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      enableGlow: !prev.enableGlow,
    }));
  };

  // Keyboard shortcut: close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hoursCol = settings.hoursColor || settings.clockColor;
  const minsCol = settings.minutesColor || settings.clockColor;
  const secsCol = settings.secondsColor || settings.clockColor;

  return (
    <AnimatePresence>
      <div
        id="clock-color-picker-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={popoverRef}
          id="clock-color-picker-modal"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-md bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100 select-none"
          style={{
            backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
            WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm transition-colors duration-300"
                style={{
                  backgroundColor: `${currentColor}20`,
                  borderColor: `${currentColor}50`,
                  color: currentColor,
                }}
              >
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Ziffernfarbe anpassen</h3>
                <p className="text-[11px] text-slate-400">Klicke auf eine Farbe oder wähle einen Bereich</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Schließen"
              aria-label="Farbauswahl schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Preview Bar of the digits */}
          <div className="my-3.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-inner">
            <span className="text-[11px] font-medium text-slate-400">Live-Vorschau:</span>
            <div className="text-xl font-bold tracking-tight font-mono tabular-numbers flex items-baseline gap-1 select-none">
              <span style={{ color: hoursCol }} className="transition-colors duration-200">
                12
              </span>
              <span className="text-slate-500">:</span>
              <span style={{ color: minsCol }} className="transition-colors duration-200">
                34
              </span>
              {settings.showSeconds && (
                <>
                  <span className="text-slate-500">:</span>
                  <span style={{ color: secsCol }} className="text-base transition-colors duration-200">
                    56
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Scope Selector: Alle Ziffern | Stunden | Minuten | Sekunden */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-0.5">
              <span>Zu färbender Bereich:</span>
              <span className="text-blue-400 font-medium capitalize">
                {activeScope === 'all'
                  ? 'Alle Ziffern'
                  : activeScope === 'hours'
                  ? 'Nur Stunden (HH)'
                  : activeScope === 'minutes'
                  ? 'Nur Minuten (MM)'
                  : 'Nur Sekunden (SS)'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
              {(
                [
                  { id: 'all' as ColorScope, label: 'Alle' },
                  { id: 'hours' as ColorScope, label: 'Stunden' },
                  { id: 'minutes' as ColorScope, label: 'Minuten' },
                  { id: 'seconds' as ColorScope, label: 'Sekunden' },
                ] as const
              ).map((tab) => {
                const isActive = activeScope === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveScope(tab.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer truncate ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Swatches Grid */}
          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">
              Farbpalette
            </div>
            <div className="grid grid-cols-6 gap-2">
              {QUICK_COLOR_SWATCHES.map((swatch) => {
                const isSelected = currentColor.toLowerCase() === swatch.value.toLowerCase();
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => handleApplyColor(swatch.value)}
                    title={swatch.name}
                    className={`group relative aspect-square rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 ${
                      isSelected
                        ? 'scale-105 border-white ring-2 ring-blue-500 shadow-md ring-offset-2 ring-offset-slate-950'
                        : 'border-white/20 hover:border-white/60'
                    }`}
                    style={{ backgroundColor: swatch.value }}
                    aria-label={swatch.name}
                  >
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 stroke-[3] ${
                          swatch.value === '#ffffff' ||
                          swatch.value === '#facc15' ||
                          swatch.value === '#a3e635' ||
                          swatch.value === '#38bdf8'
                            ? 'text-slate-950'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Input & Hex Code */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 mb-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-300">Eigene Wunschfarbe:</span>

              <div className="flex items-center gap-2">
                {/* Native Color Picker Swatch */}
                <label
                  className="relative flex items-center justify-center w-8 h-8 rounded-xl border border-white/30 shadow cursor-pointer overflow-hidden transition-transform hover:scale-105 active:scale-95 shrink-0"
                  title="Freie Farbauswahl"
                >
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: currentColor }}
                  />
                  <input
                    type="color"
                    value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#38bdf8'}
                    onChange={(e) => handleApplyColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Farbwähler öffnen"
                  />
                </label>

                {/* Hex Text Field */}
                <input
                  type="text"
                  value={currentColor.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('#') && val.length <= 9) {
                      handleApplyColor(val);
                    } else if (!val.startsWith('#') && val.length <= 8) {
                      handleApplyColor(`#${val}`);
                    }
                  }}
                  placeholder="#38BDF8"
                  className="w-24 px-2.5 py-1.5 text-xs font-mono font-semibold bg-slate-800/90 border border-slate-700/80 rounded-xl text-white uppercase text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Smart Tool Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={handleRandomColor}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Zufällige Farbe</span>
            </button>

            {activeScope !== 'all' && (
              <button
                type="button"
                onClick={handleApplyToAll}
                className="px-3 py-2 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/60 text-xs font-medium text-blue-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                title="Aktuelle Farbe für Stunden, Minuten und Sekunden übernehmen"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Auf alle Ziffern</span>
              </button>
            )}
          </div>

          {/* Ziffern-Glow & Hinterleuchtung (Schnellsteuerung) */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Ziffern-Glow (Hinterleuchtung):
              </span>
              <button
                type="button"
                onClick={handleToggleGlow}
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors border ${
                  settings.enableGlow
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {settings.enableGlow ? 'Aktiv' : 'Aus'}
              </button>
            </div>

            {settings.enableGlow && (
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                {/* Intensität */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Intensität</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {settings.glowIntensity ?? 55}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.glowIntensity ?? 55}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        glowIntensity: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                    aria-label="Glow Intensität"
                  />
                </div>

                {/* Ausbreitung / Spread */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Ausbreitung (Spread)</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {settings.glowSpread ?? 45}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="2"
                    value={settings.glowSpread ?? 45}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        glowSpread: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                    aria-label="Glow Ausbreitung"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ziffernwechsel-Animation (Flip vs Fade) */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Ziffernwechsel-Animation:
              </span>
              <span className="text-sky-400 font-medium">
                {settings.digitTransition === 'flip'
                  ? '3D-Flip'
                  : settings.digitTransition === 'slide'
                  ? 'Slide'
                  : settings.digitTransition === 'fade'
                  ? 'Sanfter Fade'
                  : settings.digitTransition === 'slide-fade'
                  ? 'Gleiten'
                  : settings.digitTransition === 'crossfade'
                  ? 'Crossfade'
                  : 'Aus'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'flip' as const, label: 'Flip', desc: '3D-Taktil' },
                { id: 'slide' as const, label: 'Slide', desc: 'Rolle' },
                { id: 'fade' as const, label: 'Fade', desc: 'Fließend' },
                { id: 'none' as const, label: 'Aus', desc: 'Sofort' },
              ].map((anim) => {
                const isSelected = settings.digitTransition === anim.id;
                return (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        digitTransition: anim.id,
                        _digitTransitionCustomized: true,
                      }))
                    }
                    className={`py-1.5 px-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{anim.label}</span>
                    <span className="text-[9px] opacity-75">{anim.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleResetColors}
              className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-500/10"
              title="Farben auf Standard zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zurücksetzen</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Fertig
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

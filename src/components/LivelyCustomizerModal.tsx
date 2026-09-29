import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  Sliders,
  Sparkles,
  MousePointer,
  Layers,
  Palette,
  RotateCcw,
  Zap,
  Gauge,
  Camera,
  Check,
  Volume2,
  BatteryCharging,
  Maximize2,
  Eye,
} from 'lucide-react';
import {
  ClockSettings,
  LivelySettings,
  LivelyTargetFps,
  LivelyInteractionType,
} from '../types';
import { DEFAULT_LIVELY_CONFIG } from '../utils/presets';
import { ANIMATED_BACKGROUNDS } from '../data/animatedBackgrounds';
import { captureLiveBackgroundSnapshot } from '../utils/liveWallpaperHelper';
import { triggerHaptic } from '../utils/audio';

interface LivelyCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  showFeedback?: (msg: string) => void;
}

export const LivelyCustomizerModal: React.FC<LivelyCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  showFeedback,
}) => {
  const [activeTab, setActiveTab] = useState<'interaction' | 'performance' | 'filters' | 'audio'>('interaction');
  const [isCapturing, setIsCapturing] = useState(false);

  const lively = settings.lively || DEFAULT_LIVELY_CONFIG;
  const currentDef =
    ANIMATED_BACKGROUNDS.find((b) => b.id === (settings.animatedBgId || 'aurora')) ||
    ANIMATED_BACKGROUNDS[0];
  const currentEffectDef = currentDef;

  const updateLively = (updater: (prev: LivelySettings) => LivelySettings) => {
    onUpdateSettings((prev) => ({
      ...prev,
      lively: updater(prev.lively || DEFAULT_LIVELY_CONFIG),
    }));
  };

  const handleTogglePause = () => {
    triggerHaptic('selection');
    const nextPaused = !lively.isPaused;
    updateLively((p) => ({ ...p, isPaused: nextPaused }));
    showFeedback?.(nextPaused ? 'Live-Hintergrund pausiert' : 'Live-Hintergrund fortgesetzt');
  };

  const handleResetDefaults = () => {
    triggerHaptic('selection');
    updateLively(() => DEFAULT_LIVELY_CONFIG);
    showFeedback?.('Lively-Einstellungen auf Standard zurückgesetzt');
  };

  const handleCaptureSnapshot = async () => {
    triggerHaptic('selection');
    setIsCapturing(true);
    try {
      const res = await captureLiveBackgroundSnapshot({
        effectId: settings.animatedBgId || 'aurora',
      });
      onUpdateSettings((prev) => ({
        ...prev,
        bgType: 'image',
        hasCustomImage: true,
        activeWallpaperId: res.id,
        activeWallpaperUrl: res.objectUrl,
        clockColor: res.clockColor,
        accentColor: res.accentColor,
      }));
      showFeedback?.(`📸 Frame als Standbild-Wallpaper in Galerie gesichert!`);
    } catch {
      showFeedback?.('Konnte Schnappschuss nicht erfassen.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lively-customizer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none"
          onClick={onClose}
        >
          <motion.div
            key="lively-customizer-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-2xl flex flex-col rounded-3xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/25">
                  <Sliders className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Lively Wallpaper — Anpassen
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Lively Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Aktives Motiv: <span className="text-cyan-300 font-semibold">{currentDef.nameDe}</span> ({currentDef.badge})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    lively.isPaused
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  }`}
                  title={lively.isPaused ? 'Animation fortsetzen' : 'Animation anhalten'}
                >
                  {lively.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                  <span>{lively.isPaused ? 'Pausiert' : 'Läuft'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900/30 overflow-x-auto scrollbar-none">
              {[
                { id: 'interaction', label: 'Maus & 3D', icon: MousePointer },
                { id: 'performance', label: 'Performance & FPS', icon: Gauge },
                { id: 'filters', label: 'Shader & Farben', icon: Palette },
                { id: 'audio', label: 'Audio-Reaktiv', icon: Volume2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab(tab.id as any);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Body Content */}
            <div className="p-6 overflow-y-auto max-h-[62vh] space-y-5">
              {/* TAB 1: MAUS & 3D PARALLAX */}
              {activeTab === 'interaction' && (
                <div className="space-y-4">
                  {/* Mouse Interaction Switch */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Maus-Interaktivität (Lively Input Engine)
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Hintergrund reagiert in Echtzeit auf Cursor- und Touch-Bewegungen
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          updateLively((p) => ({ ...p, mouseInteraction: !p.mouseInteraction }));
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          lively.mouseInteraction ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            lively.mouseInteraction ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {lively.mouseInteraction && (
                      <div className="pt-2 border-t border-slate-800 space-y-3">
                        <span className="text-xs font-semibold text-slate-300 block">
                          Interaktions-Verhalten:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'attract', label: '🧲 Anziehen', desc: 'Partikel gravitieren zum Cursor' },
                            { id: 'repel', label: '💨 Abstoßen', desc: 'Wellen & Partikel weichen aus' },
                            { id: 'ripple', label: '🌊 Wellen', desc: 'Erzeugt Wellen-Impulse' },
                            { id: 'glow', label: '✨ Glühen', desc: 'Leucht-Aura am Cursor' },
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                updateLively((p) => ({ ...p, interactionType: mode.id as LivelyInteractionType }));
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                lively.interactionType === mode.id
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                              }`}
                            >
                              <div className="text-xs font-bold">{mode.label}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                            </button>
                          ))}
                        </div>

                        {/* Sliders for Radius & Strength */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span>Wirkungsradius</span>
                              <span className="font-mono text-cyan-300">{lively.interactionRadius}px</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="300"
                              step="10"
                              value={lively.interactionRadius}
                              onChange={(e) => updateLively((p) => ({ ...p, interactionRadius: Number(e.target.value) }))}
                              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span>Reaktions-Stärke</span>
                              <span className="font-mono text-cyan-300">{lively.interactionStrength.toFixed(1)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="2.5"
                              step="0.1"
                              value={lively.interactionStrength}
                              onChange={(e) => updateLively((p) => ({ ...p, interactionStrength: Number(e.target.value) }))}
                              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3D Parallax Tilt */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          3D Parallax-Perspektive (Lively 3D Tilt)
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Neigt den Hintergrund dreidimensional entsprechend der Mausposition für realistische Raumtiefe
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          updateLively((p) => ({ ...p, enableParallax: !p.enableParallax }));
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          lively.enableParallax ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            lively.enableParallax ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {lively.enableParallax && (
                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>3D Neigungswinkel</span>
                          <span className="font-mono text-cyan-300">±{lively.parallaxStrength}px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="35"
                          step="1"
                          value={lively.parallaxStrength}
                          onChange={(e) => updateLively((p) => ({ ...p, parallaxStrength: Number(e.target.value) }))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PERFORMANCE & FPS */}
              {activeTab === 'performance' && (
                <div className="space-y-4">
                  {/* Target FPS Selector */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Ziel-Bildrate (Lively Framerate Limiter)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Steuere GPU-/CPU-Auslastung und Batterieverbrauch präzise nach deinen Bedürfnissen
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { fps: 15, label: '15 FPS', tag: 'Akku-Sparen', desc: 'Minimaler CPU-Verbrauch' },
                        { fps: 30, label: '30 FPS', tag: 'Eco', desc: 'Sehr sparsam für Laptops' },
                        { fps: 60, label: '60 FPS', tag: 'Standard', desc: 'Seidenweiche 60 Hz' },
                        { fps: 120, label: '120 FPS', tag: 'Ultra', desc: 'Gaming & High-Refresh Displays' },
                      ].map((item) => (
                        <button
                          key={item.fps}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            updateLively((p) => ({ ...p, targetFps: item.fps as LivelyTargetFps }));
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            lively.targetFps === item.fps
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-sm font-extrabold">{item.label}</div>
                          <div className={`text-[10px] mt-0.5 ${lively.targetFps === item.fps ? 'text-slate-900 font-bold' : 'text-cyan-400'}`}>
                            {item.tag}
                          </div>
                          <div className={`text-[9px] mt-1 line-clamp-1 ${lively.targetFps === item.fps ? 'text-slate-950/80' : 'text-slate-500'}`}>
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pause on Battery Rule */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Automatischer Akku-Sparmodus</span>
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Pausiert Live-Hintergründe automatisch, wenn kein Ladekabel angeschlossen ist
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        updateLively((p) => ({ ...p, pauseOnBattery: !p.pauseOnBattery }));
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        lively.pauseOnBattery ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          lively.pauseOnBattery ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SHADER & FILTER */}
              {activeTab === 'filters' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Lively Shader-Parameter & Farbfilter
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Passe Farben, Helligkeit, Sättigung und Leuchtkraft des aktuellen Live-Hintergrunds an
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Hue Shift (Color Wheel 0 to 360) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Farbton-Verschiebung (Hue Shift)</span>
                          <span className="font-mono text-cyan-300">{lively.hueShift}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="5"
                          value={lively.hueShift}
                          onChange={(e) => updateLively((p) => ({ ...p, hueShift: Number(e.target.value) }))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Farbsättigung</span>
                          <span className="font-mono text-cyan-300">{lively.saturation}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="5"
                          value={lively.saturation}
                          onChange={(e) => updateLively((p) => ({ ...p, saturation: Number(e.target.value) }))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Brightness */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Helligkeit</span>
                          <span className="font-mono text-cyan-300">{lively.brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          step="5"
                          value={lively.brightness}
                          onChange={(e) => updateLively((p) => ({ ...p, brightness: Number(e.target.value) }))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Contrast */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Kontrast</span>
                          <span className="font-mono text-cyan-300">{lively.contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          step="5"
                          value={lively.contrast}
                          onChange={(e) => updateLively((p) => ({ ...p, contrast: Number(e.target.value) }))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Bloom Glow */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Bloom & Leuchtkraft</span>
                          <span className="font-mono text-cyan-300">{lively.bloomIntensity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={lively.bloomIntensity}
                          onChange={(e) => updateLively((p) => ({ ...p, bloomIntensity: Number(e.target.value) }))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIO-REAKTIV */}
              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Musik- & Sound-Reaktivität</span>
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Pulsieren und Verstärkung von Partikeln im Rhythmus von Klängen oder Ambient-Sound
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          updateLively((p) => ({ ...p, audioReactive: !p.audioReactive }));
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          lively.audioReactive ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            lively.audioReactive ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {lively.audioReactive && (
                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Empfindlichkeit</span>
                          <span className="font-mono text-cyan-300">{lively.audioSensitivity.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.0"
                          step="0.1"
                          value={lively.audioSensitivity}
                          onChange={(e) => updateLively((p) => ({ ...p, audioSensitivity: Number(e.target.value) }))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <footer className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Alle Lively-Parameter zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Zurücksetzen</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isCapturing}
                  onClick={handleCaptureSnapshot}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                  title="Aktuellen Frame als Bild-Wallpaper speichern"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isCapturing ? 'Erfasse...' : 'Frame als Bild'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
                >
                  Schließen
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

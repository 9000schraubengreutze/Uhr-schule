import React, { useState } from 'react';
import {
  ANIMATED_BACKGROUNDS,
  ANIMATED_BG_CATEGORIES,
  AnimatedBgCategory,
  AnimatedBgDef,
} from '../data/animatedBackgrounds';
import { AnimatedBgId, ClockSettings } from '../types';
import { AnimatedBackgroundCanvas } from './AnimatedBackgroundCanvas';
import {
  Sparkles,
  Check,
  Gauge,
  Sliders,
  Palette,
  Zap,
  Camera,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { triggerHaptic } from '../utils/audio';

interface AnimatedBackgroundBrowserProps {
  currentEffectId?: AnimatedBgId;
  currentSpeed?: number;
  currentIntensity?: number;
  ecoMode?: boolean;
  onSelectEffect: (def: AnimatedBgDef, harmonizeColors?: boolean) => void;
  onCaptureAsWallpaper?: (def: AnimatedBgDef) => Promise<void> | void;
  onOverlayOnWallpaper?: (def: AnimatedBgDef) => void;
  onUpdateSpeed?: (speed: number) => void;
  onUpdateIntensity?: (intensity: number) => void;
  isFullModal?: boolean;
}

export const AnimatedBackgroundBrowser: React.FC<AnimatedBackgroundBrowserProps> = ({
  currentEffectId = 'aurora',
  currentSpeed = 1.0,
  currentIntensity = 80,
  ecoMode = false,
  onSelectEffect,
  onCaptureAsWallpaper,
  onOverlayOnWallpaper,
  onUpdateSpeed,
  onUpdateIntensity,
  isFullModal = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AnimatedBgCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [capturingEffectId, setCapturingEffectId] = useState<string | null>(null);
  const [capturedFeedbackId, setCapturedFeedbackId] = useState<string | null>(null);

  const filteredItems = ANIMATED_BACKGROUNDS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    if (!matchesCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nameDe.toLowerCase().includes(q) ||
      item.descriptionDe.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const speedPresets = [
    { label: '0.5x Sanft', value: 0.5 },
    { label: '0.8x Ruhig', value: 0.8 },
    { label: '1.0x Normal', value: 1.0 },
    { label: '1.4x Dynamisch', value: 1.4 },
    { label: '1.8x Schnell', value: 1.8 },
  ];

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Animierte Live-Hintergründe ({ANIMATED_BACKGROUNDS.length} Motive)
            </h4>
            <p className="text-[11px] text-slate-400">
              Echtzeit-Canvas-Animationen mit flüssigen 60 FPS & anpassbarer Geschwindigkeit
            </p>
          </div>
        </div>

        <span className="self-start sm:self-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          60 FPS GPU-Canvas
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ANIMATED_BG_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === 'all'
              ? ANIMATED_BACKGROUNDS.length
              : ANIMATED_BACKGROUNDS.filter((b) => b.category === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-300'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.nameDe}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-700/60 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Animated Backgrounds */}
      <div
        className={`grid gap-3 ${
          isFullModal
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 max-h-[380px] overflow-y-auto pr-1'
        }`}
      >
        {filteredItems.map((item) => {
          const isActive = currentEffectId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectEffect(item, false)}
              className={`group relative rounded-2xl overflow-hidden border text-left transition-all duration-200 cursor-pointer flex flex-col ${
                isActive
                  ? 'border-cyan-400 bg-slate-900/90 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800/80 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-900/60'
              }`}
            >
              {/* Live Preview Canvas Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <AnimatedBackgroundCanvas
                  effectId={item.id}
                  speed={currentSpeed}
                  intensity={currentIntensity}
                  ecoMode={ecoMode}
                  isMiniPreview={true}
                />

                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent pointer-events-none" />

                {/* Badge Top Left */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-900/90 text-cyan-300 border border-cyan-500/30 shadow">
                    {item.badge}
                  </span>
                </div>

                {/* Active Indicator Top Right */}
                {isActive && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Aktiv</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Card Meta & Actions */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.nameDe}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.descriptionDe}
                  </p>
                </div>

                {/* Action Buttons: Harmonize Colors, Capture Snapshot as Wallpaper Image, Overlay */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: item.recommendedClockColor }}
                        title="Empfohlene Ziffernfarbe"
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: item.recommendedAccentColor }}
                        title="Empfohlene Akzentfarbe"
                      />
                      <span className="text-[10px] text-slate-400 hidden sm:inline">Farbtöne</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEffect(item, true);
                      }}
                      className="text-[10px] font-semibold text-cyan-300 hover:text-cyan-200 px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Als Live-Hintergrund aktivieren und Ziffernfarben passend abstimmen"
                    >
                      <Palette className="w-3 h-3" />
                      <span>Farben abstimmen</span>
                    </button>
                  </div>

                  {/* Smart Actions: Capture as Static Wallpaper & Overlay on Image */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {onCaptureAsWallpaper && (
                      <button
                        type="button"
                        disabled={capturingEffectId === item.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setCapturingEffectId(item.id);
                          triggerHaptic('selection');
                          try {
                            await onCaptureAsWallpaper(item);
                            setCapturedFeedbackId(item.id);
                            setTimeout(() => setCapturedFeedbackId(null), 2500);
                          } finally {
                            setCapturingEffectId(null);
                          }
                        }}
                        className={`text-[10px] font-semibold py-1 px-2 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          capturedFeedbackId === item.id
                            ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/70'
                        }`}
                        title="Momentanen Frame als hochauflösendes Hintergrundbild erfassen und in Bibliothek speichern"
                      >
                        {capturedFeedbackId === item.id ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Gespeichert!</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3 h-3 text-cyan-400" />
                            <span>{capturingEffectId === item.id ? 'Erfasse...' : 'Als Bild erfassen'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {onOverlayOnWallpaper && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          onOverlayOnWallpaper(item);
                        }}
                        className="text-[10px] font-semibold py-1 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 hover:text-indigo-200 border border-indigo-800/60 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Diesen Live-Effekt über dein aktuelles Wallpaper legen"
                      >
                        <Layers className="w-3 h-3 text-indigo-400" />
                        <span>Auf Bild legen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Speed & Intensity Fine-Tuning Controls */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Animations-Steuerung
            </span>
          </div>
          <span className="text-[11px] text-cyan-300 font-mono font-medium">
            {currentSpeed}x Speed • {currentIntensity}% Kraft
          </span>
        </div>

        {/* Speed Selector */}
        {onUpdateSpeed && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>Geschwindigkeit</span>
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {speedPresets.map((sp) => (
                <button
                  key={sp.value}
                  type="button"
                  onClick={() => onUpdateSpeed(sp.value)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-medium transition-all text-center cursor-pointer ${
                    Math.abs(currentSpeed - sp.value) < 0.05
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Intensity Slider */}
        {onUpdateIntensity && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Helligkeit & Intensität</span>
              <span className="font-mono text-cyan-300">{currentIntensity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={currentIntensity}
              onChange={(e) => onUpdateIntensity(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

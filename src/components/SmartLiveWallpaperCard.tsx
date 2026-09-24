import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Layers,
  Wand2,
  Sliders,
  Download,
  Check,
  CheckCircle2,
  Palette,
  Eye,
  Zap,
} from 'lucide-react';
import {
  ClockSettings,
  AnimatedBgId,
  LiveWallpaperBlendMode,
} from '../types';
import {
  ANIMATED_BACKGROUNDS,
  AnimatedBgDef,
} from '../data/animatedBackgrounds';
import { CURATED_WALLPAPERS, WallpaperItem } from '../data/wallpapers';
import {
  recommendLiveEffectForWallpaper,
  captureLiveBackgroundSnapshot,
  downloadWallpaperBlob,
  LIVE_WALLPAPER_BLEND_MODES,
} from '../utils/liveWallpaperHelper';
import { triggerHaptic } from '../utils/audio';
import { MaterialSwitch } from './ui/MaterialSwitch';

interface SmartLiveWallpaperCardProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  activeWallpaperItem?: WallpaperItem | null;
  currentWallpaperUrl?: string | null;
  showFeedback?: (msg: string) => void;
  onReloadSavedWallpapers?: () => void;
  compact?: boolean;
}

export const SmartLiveWallpaperCard: React.FC<SmartLiveWallpaperCardProps> = ({
  settings,
  onUpdateSettings,
  activeWallpaperItem,
  currentWallpaperUrl,
  showFeedback,
  onReloadSavedWallpapers,
  compact = false,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapturedBlob, setLastCapturedBlob] = useState<Blob | null>(null);
  const [lastCapturedName, setLastCapturedName] = useState<string>('');
  const [recommendationReason, setRecommendationReason] = useState<string | null>(null);

  const activeOverlayId = settings.liveWallpaperOverlayId || settings.animatedBgId || 'aurora';
  const isOverlayEnabled = Boolean(settings.liveWallpaperOverlayEnabled);
  const blendMode = settings.liveWallpaperBlendMode || 'screen';
  const opacity = settings.liveWallpaperOpacity ?? 70;

  // Active effect definition
  const currentDef =
    ANIMATED_BACKGROUNDS.find((b) => b.id === activeOverlayId) || ANIMATED_BACKGROUNDS[0];

  // Resolve wallpaper metadata for smart recommendation
  const resolveTargetWallpaper = (): WallpaperItem | { title: string; category?: string; tags?: string[] } => {
    if (activeWallpaperItem) return activeWallpaperItem;
    if (settings.activeWallpaperId) {
      const found = CURATED_WALLPAPERS.find((w) => w.id === settings.activeWallpaperId);
      if (found) return found;
    }
    return {
      title: 'Aktuelles Hintergrundbild',
      category: 'abstract',
      tags: ['wallpaper', 'background'],
    };
  };

  // 1. Intelligent Auto-Harmonization / Recommendation
  const handleAutoHarmonize = () => {
    triggerHaptic('success');
    const targetWp = resolveTargetWallpaper();
    const rec = recommendLiveEffectForWallpaper(targetWp);

    onUpdateSettings((prev) => {
      const next: ClockSettings = {
        ...prev,
        bgType: 'image',
        liveWallpaperOverlayEnabled: true,
        liveWallpaperOverlayId: rec.effectId,
        liveWallpaperBlendMode: rec.blendMode,
        liveWallpaperOpacity: rec.opacity,
        liveWallpaperSpeed: rec.speed,
        liveWallpaperIntensity: rec.intensity,
      };

      if (prev.wallpaperEngineAutoColors !== false) {
        next.clockColor = rec.clockColor;
        next.accentColor = rec.accentColor;
      }

      return next;
    });

    setRecommendationReason(rec.reasonDe);
    showFeedback?.(
      `Intelligenter Live-Effekt "${rec.effectDef.nameDe}" aktiviert (${rec.reasonDe})!`
    );
  };

  // 2. Capture Snapshot from Live Canvas as Static Wallpaper
  const handleCaptureSnapshot = async (targetId?: AnimatedBgId) => {
    const effectToCapture = targetId || activeOverlayId;
    triggerHaptic('selection');
    setIsCapturing(true);

    try {
      const result = await captureLiveBackgroundSnapshot({
        effectId: effectToCapture,
      });

      setLastCapturedBlob(result.blob);
      const eff = ANIMATED_BACKGROUNDS.find((b) => b.id === effectToCapture);
      const name = `${eff?.nameDe || 'Live'} (Schnappschuss)`;
      setLastCapturedName(name);

      // Automatically apply as active wallpaper
      onUpdateSettings((prev) => ({
        ...prev,
        bgType: 'image',
        hasCustomImage: true,
        activeWallpaperId: result.id,
        activeWallpaperUrl: result.objectUrl,
        clockColor: result.clockColor,
        accentColor: result.accentColor,
      }));

      onReloadSavedWallpapers?.();
      triggerHaptic('success');
      showFeedback?.(
        `📸 Live-Hintergrund "${eff?.nameDe}" als Wallpaper-Bild gespeichert und aktiviert!`
      );
    } catch (err: any) {
      console.error('Failed to capture snapshot', err);
      showFeedback?.('Konnte Live-Schnappschuss nicht erfassen.');
    } finally {
      setIsCapturing(false);
    }
  };

  // 3. Download the captured snapshot
  const handleDownloadSnapshot = () => {
    if (!lastCapturedBlob) return;
    triggerHaptic('selection');
    downloadWallpaperBlob(
      lastCapturedBlob,
      `webclock-${lastCapturedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
    );
    showFeedback?.('Wallpaper-Bild heruntergeladen!');
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/70 to-indigo-950/40 border border-cyan-500/30 p-4 sm:p-5 space-y-4 shadow-lg shadow-cyan-950/20">
      {/* Header with Smart Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Intelligente Live-Wallpaper Engine
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Live-Synthese
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Nutze animierte Live-Hintergründe als dynamische Bildebene oder speichere sie als hochauflösendes Standbild
            </p>
          </div>
        </div>

        {/* Master Live-Overlay Switch */}
        <div className="flex items-center gap-2.5 self-end sm:self-center bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
          <span className="text-xs font-semibold text-slate-300">
            {isOverlayEnabled ? 'Live-Ebene aktiv' : 'Live-Ebene aus'}
          </span>
          <MaterialSwitch
            checked={isOverlayEnabled}
            onChange={(checked) => {
              triggerHaptic('selection');
              onUpdateSettings((prev) => ({
                ...prev,
                liveWallpaperOverlayEnabled: checked,
                bgType: checked && prev.bgType !== 'image' ? 'image' : prev.bgType,
              }));
              showFeedback?.(
                checked
                  ? 'Live-Hintergrund auf Bild-Wallpaper aktiviert!'
                  : 'Live-Hintergrundebene deaktiviert.'
              );
            }}
          />
        </div>
      </div>

      {/* Action 1: Intelligent Auto-Recommendation Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Intelligente Effekt-Empfehlung</span>
          </span>
          <p className="text-[11px] text-slate-300">
            {recommendationReason ||
              'Analysiert Farben & Stimmung deines Hintergrundbildes und wählt automatisch den perfekten Live-Effekt.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoHarmonize}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:scale-95 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automatisch anpassen</span>
        </button>
      </div>

      {/* Live Controls Section (Visible when Overlay is active or for standalone tweaking) */}
      <div className="space-y-3 pt-1">
        {/* Effect Selector Carousel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gewählter Live-Effekt ({ANIMATED_BACKGROUNDS.length} Motive)</span>
            </span>
            <span className="text-cyan-300 font-mono font-medium">
              {currentDef.nameDe} ({currentDef.badge})
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {ANIMATED_BACKGROUNDS.map((item) => {
              const isSelected = activeOverlayId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onUpdateSettings((prev) => ({
                      ...prev,
                      liveWallpaperOverlayId: item.id,
                      liveWallpaperOverlayEnabled: true,
                      clockColor:
                        prev.wallpaperEngineAutoColors !== false
                          ? item.recommendedClockColor
                          : prev.clockColor,
                      accentColor:
                        prev.wallpaperEngineAutoColors !== false
                          ? item.recommendedAccentColor
                          : prev.accentColor,
                    }));
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{item.nameDe}</span>
                    {isSelected && <Check className="w-3 h-3 text-cyan-400 stroke-[3]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blend Mode Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mischmodus (GPU-Blend)</span>
            </span>
            <span className="text-indigo-300 font-mono text-[11px]">
              {LIVE_WALLPAPER_BLEND_MODES.find((m) => m.id === blendMode)?.labelDe}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {LIVE_WALLPAPER_BLEND_MODES.map((mode) => {
              const isSelected = blendMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onUpdateSettings((prev) => ({
                      ...prev,
                      liveWallpaperBlendMode: mode.id,
                      liveWallpaperOverlayEnabled: true,
                    }));
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 text-indigo-100 ring-1 ring-indigo-400/40 shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
                  }`}
                  title={`${mode.descriptionDe} (Empfohlen für: ${mode.bestForDe})`}
                >
                  <div className="text-[11px] font-bold">{mode.labelDe}</div>
                  <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                    {mode.bestForDe}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Deckkraft der Live-Ebene</span>
            <span className="font-mono text-cyan-300">{opacity}%</span>
          </div>
          <input
            type="range"
            min="15"
            max="100"
            step="5"
            value={opacity}
            onChange={(e) =>
              onUpdateSettings((prev) => ({
                ...prev,
                liveWallpaperOpacity: Number(e.target.value),
              }))
            }
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Action 2: Capture Snapshot as Static Wallpaper Image */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Standbild-Capture (Live als Bild einfrieren)</span>
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Nimmt diesen Live-Hintergrund als gestochen scharfes 4K/HD Bild auf & passt Uhrenfarben automatisch an
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isCapturing}
            onClick={() => handleCaptureSnapshot()}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-cyan-400 disabled:opacity-50"
            title="Diesen Live-Effekt als hochauflösendes Hintergrundbild in deiner Galerie speichern"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Erfasse...' : 'Als Bild erfassen'}</span>
          </button>

          {lastCapturedBlob && (
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Aufgenommenes Bild als PNG herunterladen"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  Search,
  Heart,
  Check,
  Wand2,
  Upload,
  Layers,
  Filter,
  Eye,
  Sliders,
  Maximize2,
  Trash2,
  Palette,
  CloudRain,
  Snowflake,
  Stars,
  Wind,
  CircleDot,
  CheckCircle2,
} from 'lucide-react';
import {
  CURATED_WALLPAPERS,
  WALLPAPER_CATEGORIES,
  WallpaperCategory,
  WallpaperItem,
} from '../data/wallpapers';
import { ClockSettings, ParticleEffect } from '../types';
import { triggerHaptic } from '../utils/audio';

const FAVORITES_KEY = 'webclock_wallpaper_favorites_v1';

export interface WallpaperEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onOpenGeminiStudio?: () => void;
  onOpenGeminiBg?: () => void;
  onUploadImage?: (file: File) => void;
  showFeedback?: (msg: string) => void;
  backdropBlur?: number;
}

export const WallpaperEngineModal: React.FC<WallpaperEngineModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenGeminiStudio,
  onOpenGeminiBg,
  onUploadImage,
  showFeedback,
  backdropBlur = 16,
}) => {
  const handleOpenGemini = onOpenGeminiStudio || onOpenGeminiBg;
  const [selectedCategory, setSelectedCategory] = useState<WallpaperCategory | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [previewWallpaper, setPreviewWallpaper] = useState<WallpaperItem | null>(null);

  // Auto-effects flags (synced with settings)
  const autoParticles = settings.wallpaperEngineAutoParticles !== false;
  const autoColors = Boolean(settings.wallpaperEngineAutoColors);

  // Sync favorites to localStorage
  const toggleFavorite = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('selection');
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut: close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewWallpaper) {
          setPreviewWallpaper(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewWallpaper, onClose]);

  // Filter wallpapers based on category, search, and favorites
  const filteredWallpapers = useMemo(() => {
    return CURATED_WALLPAPERS.filter((wp) => {
      // Favorites filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(wp.id)) return false;
      } else if (selectedCategory !== 'all' && wp.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = wp.title.toLowerCase().includes(q);
        const matchesDesc = wp.description.toLowerCase().includes(q);
        const matchesTags = wp.tags.some((t) => t.toLowerCase().includes(q));
        const matchesAuthor = wp.author.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, searchQuery, favorites]);

  // Apply a selected wallpaper to the clock
  const handleApplyWallpaper = (wp: WallpaperItem) => {
    triggerHaptic('success');

    onUpdateSettings((prev) => {
      const next: ClockSettings = {
        ...prev,
        bgType: 'image',
        hasCustomImage: true,
        activeWallpaperId: wp.id,
        activeWallpaperUrl: wp.url,
      };

      // Auto-activate matching atmospheric particle effect
      if (autoParticles && wp.recommendedParticle) {
        next.particleEffect = wp.recommendedParticle;
      }

      // Auto-adapt complementary clock typography colors
      if (autoColors) {
        next.clockColor = wp.recommendedClockColor;
        next.accentColor = wp.recommendedAccentColor;
      }

      return next;
    });

    const particleName =
      wp.recommendedParticle === 'rain'
        ? 'Regen'
        : wp.recommendedParticle === 'snow'
        ? 'Schnee'
        : wp.recommendedParticle === 'stars'
        ? 'Sternenstaub'
        : wp.recommendedParticle === 'dust'
        ? 'Partikel'
        : wp.recommendedParticle === 'bubbles'
        ? 'Blüten'
        : null;

    showFeedback?.(
      `Wallpaper "${wp.title}" aktiviert${
        autoParticles && particleName ? ` mit ${particleName}-Effekt` : ''
      }!`
    );
  };

  // Toggle particle matching option
  const toggleAutoParticles = () => {
    triggerHaptic('selection');
    onUpdateSettings((prev) => ({
      ...prev,
      wallpaperEngineAutoParticles: !autoParticles,
    }));
  };

  // Toggle color harmonization option
  const toggleAutoColors = () => {
    triggerHaptic('selection');
    onUpdateSettings((prev) => ({
      ...prev,
      wallpaperEngineAutoColors: !autoColors,
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      id="wallpaper-engine-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Wallpaper Engine Galerie"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950/95 border border-slate-800/80 shadow-2xl shadow-black/80 overflow-hidden text-slate-100 will-change-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-md shadow-blue-500/20 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Wallpaper Engine Galerie
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  4K Ultra HD
                </span>
                <span className="text-xs text-slate-400">({CURATED_WALLPAPERS.length} Motive)</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Kategorisierte interaktive Hintergründe mit automatischen Partikeleffekten & Farbanpassung
              </p>
            </div>
          </div>

          {/* Action Links & Close */}
          <div className="flex items-center gap-2">
            {handleOpenGemini && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleOpenGemini();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer"
                title="Eigenes Hintergrundbild mit Gemini generieren"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>KI Bild-Studio</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
              aria-label="Schließen"
              title="Galerie schließen (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Search & Categories Bar */}
        <div className="px-5 sm:px-7 py-3 border-b border-slate-800/60 bg-slate-900/30 flex flex-col gap-3">
          {/* Search and Live Engine Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nach Titel, Tags (z.B. Regen, Space, Neon, Minimal) suchen..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title="Suche leeren"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Smart Wallpaper Engine Toggles */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              {/* Auto Particles Switch */}
              <button
                type="button"
                onClick={toggleAutoParticles}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  autoParticles
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-medium'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
                title="Aktiviert automatisch z.B. Regen-, Schnee- oder Sternenpartikel passend zum Wallpaper"
              >
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Live-Partikel</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    autoParticles ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
              </button>

              {/* Auto Color Harmonization Switch */}
              <button
                type="button"
                onClick={toggleAutoColors}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  autoColors
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 font-medium'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
                title="Passt Ziffern- und Akzentfarbe der Uhr automatisch an das Wallpaper an"
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Farb-Harmonie</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    autoColors ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {WALLPAPER_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? CURATED_WALLPAPERS.length
                  : CURATED_WALLPAPERS.filter((w) => w.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory(cat.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Favorites Tab */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSelectedCategory('favorites');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'favorites'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  selectedCategory === 'favorites'
                    ? 'fill-white text-white'
                    : 'text-rose-400 fill-rose-400/20'
                }`}
              />
              <span>Favoriten</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === 'favorites'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {favorites.length}
              </span>
            </button>
          </div>
        </div>

        {/* Wallpaper Grid Canvas */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 min-h-[360px] max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {filteredWallpapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-300">Keine Wallpapers gefunden</h3>
              <p className="text-xs text-slate-400 max-w-md">
                {selectedCategory === 'favorites'
                  ? 'Du hast noch keine Wallpaper zu deinen Favoriten hinzugefügt. Klicke auf das Herz-Symbol auf einer Karte!'
                  : `Keine Motive entsprechen deiner Suche "${searchQuery}". Versuche einen anderen Suchbegriff oder eine andere Kategorie.`}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredWallpapers.map((wp) => {
                const isActive =
                  settings.bgType === 'image' &&
                  (settings.activeWallpaperId === wp.id || settings.activeWallpaperUrl === wp.url);
                const isFav = favorites.includes(wp.id);

                return (
                  <div
                    key={wp.id}
                    onClick={() => handleApplyWallpaper(wp)}
                    className={`group relative flex flex-col rounded-2xl overflow-hidden border aspect-[16/10] bg-slate-950/80 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 ${
                      isActive
                        ? 'border-blue-500 ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/20'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                    style={{ background: wp.fallbackGradient }}
                  >
                    {/* High-Res Image with smooth zoom */}
                    <img
                      src={wp.thumbnailUrl}
                      alt={wp.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      onError={(e) => {
                        // Keep fallback gradient if network fails
                        (e.target as HTMLElement).style.opacity = '0';
                      }}
                    />

                    {/* Gradient Overlay for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 text-blue-300 border border-slate-700/80 backdrop-blur-md shadow-sm">
                          {wp.resolution}
                        </span>
                        {wp.recommendedParticle !== 'none' && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-950/80 text-emerald-300 border border-slate-700/80 backdrop-blur-md flex items-center gap-1"
                            title={`Empfohlener Partikeleffekt: ${wp.recommendedParticle}`}
                          >
                            {wp.recommendedParticle === 'rain' && <CloudRain className="w-2.5 h-2.5" />}
                            {wp.recommendedParticle === 'snow' && <Snowflake className="w-2.5 h-2.5" />}
                            {wp.recommendedParticle === 'stars' && <Stars className="w-2.5 h-2.5" />}
                            {wp.recommendedParticle === 'dust' && <Wind className="w-2.5 h-2.5" />}
                            {wp.recommendedParticle === 'bubbles' && <CircleDot className="w-2.5 h-2.5" />}
                            <span className="capitalize">{wp.recommendedParticle}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(wp.id, e)}
                          className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                            isFav
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                              : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
                          }`}
                          title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                        </button>

                        {/* Active Badge */}
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Aktiv</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata & Hover CTA */}
                    <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-bold text-white tracking-tight drop-shadow truncate">
                          {wp.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 truncate shrink-0">
                          {wp.author}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300/90 line-clamp-1 leading-tight">
                        {wp.description}
                      </p>

                      {/* Tag Chips */}
                      <div className="flex items-center gap-1 overflow-hidden pt-0.5">
                        {wp.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-white/10 text-slate-300 backdrop-blur-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Hover action banner */}
                      <div className="pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                        <span className="flex-1 py-1 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold text-center shadow-md transition-all">
                          {isActive ? 'Aktives Wallpaper' : 'Hintergrund anwenden'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewWallpaper(wp);
                          }}
                          className="p-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer"
                          title="Vollbild-Vorschau ansehen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info & stats */}
        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-3 border-t border-slate-800/80 bg-slate-900/40 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Tipp: Drücke Taste</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">
              H
            </kbd>
            <span>um die Galerie jederzeit aufzurufen</span>
          </div>

          <div className="flex items-center gap-3">
            {handleOpenGemini && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleOpenGemini();
                }}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>KI-Generator öffnen</span>
              </button>
            )}
            <span className="text-slate-600">•</span>
            <span>{CURATED_WALLPAPERS.length} Wallpapers verfügbar</span>
          </div>
        </footer>
      </div>

      {/* Fullscreen Lightbox Preview */}
      {previewWallpaper && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewWallpaper(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewWallpaper(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800 cursor-pointer z-10"
            title="Vorschau schließen (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[80vh] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewWallpaper.url}
              alt={previewWallpaper.title}
              className="w-full h-full object-cover max-h-[75vh]"
            />
            <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{previewWallpaper.title}</h3>
                <p className="text-xs text-slate-300">{previewWallpaper.description}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleApplyWallpaper(previewWallpaper);
                  setPreviewWallpaper(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer shrink-0"
              >
                Dieses Wallpaper anwenden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

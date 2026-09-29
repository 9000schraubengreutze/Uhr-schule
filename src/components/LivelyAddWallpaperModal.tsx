import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Video,
  Globe,
  Film,
  Sparkles,
  Check,
  Play,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ClockSettings, LivelyCustomWallpaper } from '../types';
import { triggerHaptic } from '../utils/audio';
import { storeLocalImage } from '../utils/storage';

interface LivelyAddWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  showFeedback?: (msg: string) => void;
}

export interface CuratedLivelyVideo {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  recommendedClockColor: string;
  recommendedAccentColor: string;
}

export const CURATED_LIVELY_VIDEOS: CuratedLivelyVideo[] = [
  {
    id: 'lively-vid-rain',
    title: 'Gemütlicher Regen am See',
    category: 'Natur & Regen',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-seen-up-close-18312-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=640&q=75',
    recommendedClockColor: '#38bdf8',
    recommendedAccentColor: '#0284c7',
  },
  {
    id: 'lively-vid-waves',
    title: 'Beruhigende Ozeanbrandung',
    category: 'Ozean & Wellen',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=640&q=75',
    recommendedClockColor: '#67e8f9',
    recommendedAccentColor: '#06b6d4',
  },
  {
    id: 'lively-vid-cyber',
    title: 'Neon Cyber Highway Loop',
    category: 'Sci-Fi & Cyberpunk',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-speeding-car-on-a-neon-road-at-night-42867-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=640&q=75',
    recommendedClockColor: '#f43f5e',
    recommendedAccentColor: '#a855f7',
  },
  {
    id: 'lively-vid-forest',
    title: 'Sonnenstrahlen im Kiefernwald',
    category: 'Natur & Wald',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sun-rays-passing-through-pine-trees-42523-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=640&q=75',
    recommendedClockColor: '#86efac',
    recommendedAccentColor: '#22c55e',
  },
  {
    id: 'lively-vid-stars',
    title: 'Kosmischer Sternenhimmel Zeitraffer',
    category: 'Space & Kosmos',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-starry-sky-timelapse-at-night-41584-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=640&q=75',
    recommendedClockColor: '#c7d2fe',
    recommendedAccentColor: '#6366f1',
  },
];

export const LivelyAddWallpaperModal: React.FC<LivelyAddWallpaperModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  showFeedback,
}) => {
  const [activeTab, setActiveTab] = useState<'curated' | 'file' | 'video-url' | 'web'>('curated');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [webUrlInput, setWebUrlInput] = useState('');
  const [webTitleInput, setWebTitleInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Select Curated Video
  const handleSelectCuratedVideo = (item: CuratedLivelyVideo) => {
    triggerHaptic('success');
    onUpdateSettings((prev) => ({
      ...prev,
      bgType: 'video',
      activeWallpaperType: 'video',
      activeVideoUrl: item.videoUrl,
      activeWallpaperId: item.id,
      clockColor: item.recommendedClockColor,
      accentColor: item.recommendedAccentColor,
    }));
    showFeedback?.(`Lively Video-Wallpaper "${item.title}" aktiviert!`);
    onClose();
  };

  // 2. Upload Video File
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      showFeedback?.('Bitte wähle eine gültige Video-Datei (MP4, WebM).');
      return;
    }

    setIsProcessing(true);
    triggerHaptic('selection');

    try {
      const objectUrl = URL.createObjectURL(file);
      const newCustom: LivelyCustomWallpaper = {
        id: `custom-vid-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: 'video',
        url: objectUrl,
        createdAt: Date.now(),
      };

      onUpdateSettings((prev) => ({
        ...prev,
        bgType: 'video',
        activeWallpaperType: 'video',
        activeVideoUrl: objectUrl,
        customLiveWallpapers: [newCustom, ...(prev.customLiveWallpapers || [])],
      }));

      triggerHaptic('success');
      showFeedback?.(`Eigenes Video-Wallpaper "${newCustom.title}" aktiviert!`);
      onClose();
    } catch {
      showFeedback?.('Fehler beim Laden des Videos.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Add Video by URL
  const handleApplyVideoUrl = () => {
    if (!videoUrlInput.trim()) return;
    triggerHaptic('selection');
    const title = videoTitleInput.trim() || 'Online Video Wallpaper';
    const newCustom: LivelyCustomWallpaper = {
      id: `custom-vid-url-${Date.now()}`,
      title,
      type: 'video',
      url: videoUrlInput.trim(),
      createdAt: Date.now(),
    };

    onUpdateSettings((prev) => ({
      ...prev,
      bgType: 'video',
      activeWallpaperType: 'video',
      activeVideoUrl: videoUrlInput.trim(),
      customLiveWallpapers: [newCustom, ...(prev.customLiveWallpapers || [])],
    }));

    showFeedback?.(`Video-Wallpaper "${title}" aktiviert!`);
    onClose();
  };

  // 4. Add Web Interactive URL
  const handleApplyWebUrl = () => {
    if (!webUrlInput.trim()) return;
    triggerHaptic('selection');
    const title = webTitleInput.trim() || 'Interaktives Web-Wallpaper';
    const newCustom: LivelyCustomWallpaper = {
      id: `custom-web-url-${Date.now()}`,
      title,
      type: 'web',
      url: webUrlInput.trim(),
      createdAt: Date.now(),
    };

    onUpdateSettings((prev) => ({
      ...prev,
      bgType: 'web',
      activeWebUrl: webUrlInput.trim(),
      customLiveWallpapers: [newCustom, ...(prev.customLiveWallpapers || [])],
    }));

    showFeedback?.(`Interaktives Web-Wallpaper "${title}" aktiviert!`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lively-add-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none"
          onClick={onClose}
        >
          <motion.div
            key="lively-add-dialog"
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
                  <Film className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Lively Wallpaper — Hinzufügen
                  </h2>
                  <p className="text-xs text-slate-400">
                    Importiere eigene Videos, Web-Streams oder interaktive WebGL-Seiten
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900/30 overflow-x-auto scrollbar-none">
              {[
                { id: 'curated', label: 'Video-Vorlagen', icon: Sparkles },
                { id: 'file', label: 'Video-Datei', icon: Upload },
                { id: 'video-url', label: 'Video-Stream URL', icon: Video },
                { id: 'web', label: 'Interaktive Webseite', icon: Globe },
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

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {/* TAB 1: CURATED VIDEO WALLPAPERS */}
              {activeTab === 'curated' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Wähle eines der kuratierten 4K/HD Video-Loops mit flüssigem 60 FPS Playback:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CURATED_LIVELY_VIDEOS.map((item) => {
                      const isActive =
                        settings.bgType === 'video' && settings.activeVideoUrl === item.videoUrl;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectCuratedVideo(item)}
                          className={`group relative rounded-2xl overflow-hidden border aspect-video cursor-pointer transition-all ${
                            isActive
                              ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg scale-[1.02]'
                              : 'border-slate-800 hover:border-slate-600 bg-slate-950/60'
                          }`}
                        >
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

                          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-cyan-300 border border-cyan-500/30 shadow-sm flex items-center gap-1">
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Video Loop</span>
                            </span>
                          </div>

                          {isActive && (
                            <div className="absolute top-2 right-2 z-10">
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Aktiv</span>
                              </span>
                            </div>
                          )}

                          <div className="absolute bottom-2 left-3 right-3 z-10 pointer-events-none">
                            <p className="text-xs font-bold text-white line-clamp-1 drop-shadow-sm">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-cyan-300/80 line-clamp-1">
                              {item.category}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD VIDEO FILE */}
              {activeTab === 'file' && (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-3xl cursor-pointer bg-slate-900/40 transition-colors text-center group">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-white">
                      Lokales Video auswählen
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      MP4 oder WebM bis 100 MB
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                  <p className="text-xs text-slate-400 text-center">
                    Das Video wird lokal in deinem Browser gespeichert und als Live-Wallpaper abgespielt.
                  </p>
                </div>
              )}

              {/* TAB 3: VIDEO URL / STREAM */}
              {activeTab === 'video-url' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Video-Stream / MP4 URL:
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/wallpaper.mp4"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Titel (optional):
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Cyberpunk City Loop"
                      value={videoTitleInput}
                      onChange={(e) => setVideoTitleInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!videoUrlInput.trim()}
                    onClick={handleApplyVideoUrl}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-cyan-500/20"
                  >
                    <span>Video-Wallpaper aktivieren</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* TAB 4: INTERACTIVE WEB / HTML5 URL */}
              {activeTab === 'web' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Webseiten-URL (HTML5 / WebGL):
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/interactive-wallpaper"
                      value={webUrlInput}
                      onChange={(e) => setWebUrlInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Titel (optional):
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Interaktives Sonnensystem"
                      value={webTitleInput}
                      onChange={(e) => setWebTitleInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!webUrlInput.trim()}
                    onClick={handleApplyWebUrl}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-cyan-500/20"
                  >
                    <span>Web-Wallpaper aktivieren</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Schließen
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

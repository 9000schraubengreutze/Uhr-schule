import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  Gamepad2,
  Lock,
  GraduationCap,
  Coffee,
  Sparkles,
  MessageSquareQuote,
  Wand2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Clock,
  Moon,
  Volume2,
} from 'lucide-react';
import { SchoolStatusResult } from '../utils/timetable';

interface QuickControlsProps {
  onOpenSettings: () => void;
  onOpenGames?: () => void;
  onOpenTimetable?: () => void;
  onOpenWallpapers?: () => void;
  onOpenGeminiBg?: () => void;
  onOpenChat?: () => void;
  statusResult?: SchoolStatusResult;
  backdropBlur?: number;
  anyModalOpen?: boolean;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  disabled?: boolean;
  zenScheduleEnabled?: boolean;
  zenScheduleActive?: boolean;
  zenScheduleRange?: string;
  onOpenAudioTab?: () => void;
  isAmbientPlaying?: boolean;
  activeAmbientTitle?: string;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  onOpenGames,
  onOpenTimetable,
  onOpenWallpapers,
  onOpenGeminiBg,
  onOpenChat,
  statusResult,
  backdropBlur = 16,
  anyModalOpen = false,
  isZenMode: externalZenMode,
  onToggleZenMode,
  disabled = false,
  zenScheduleEnabled = false,
  zenScheduleActive = false,
  zenScheduleRange,
  onOpenAudioTab,
  isAmbientPlaying = false,
  activeAmbientTitle,
}) => {
  // Hidden by default: only display when user hovers over the top trigger area
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Immediately hide and cancel hover if disabled becomes true
  useEffect(() => {
    if (disabled) {
      setIsHovered(false);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    }
  }, [disabled]);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleZen = () => {
    onToggleZenMode?.();
  };

  const isVisible = !disabled && (isHovered || anyModalOpen) && !externalZenMode;

  const isGameAllowed = statusResult?.isGameAllowed ?? true;
  const isBreak = statusResult?.status === 'break';

  return (
    <>
      {/* Bottom Hover Trigger Zone - hovering anywhere near the bottom area reveals the dock, unless disabled */}
      {!disabled && (
        <div
          id="bottom-hover-trigger-zone"
          className="fixed bottom-0 left-0 right-0 h-16 sm:h-20 z-30 pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* Floating Zen Reveal Button (visible only when in forced Zen mode) */}
      {externalZenMode && (
        <button
          id="exit-zen-btn"
          type="button"
          onClick={handleToggleZen}
          title={
            zenScheduleEnabled && zenScheduleActive
              ? `Zen-Modus aktiv (Plan: ${zenScheduleRange || 'automatisch'}). Klicken zum Beenden (Taste: Z)`
              : 'Minimalismus-Modus beenden & Menüband wieder per Hover aktivieren (Taste: Z)'
          }
          aria-label="Minimalismus-Modus beenden"
          className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-slate-950/60 hover:bg-slate-900/95 backdrop-blur-xl border border-white/10 hover:border-white/25 text-slate-400 hover:text-white transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_rgba(0,0,0,0.5),0_0_18px_rgba(255,255,255,0.12)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 cursor-pointer flex items-center gap-1.5 group"
        >
          <Eye className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          {zenScheduleEnabled && zenScheduleActive && (
            <span className="hidden group-hover:inline text-[11px] font-medium text-indigo-300 pr-1 transition-all">
              Plan aktiv
            </span>
          )}
        </button>
      )}

      {/* Subtle indicator hint when hidden at the bottom */}
      {!isVisible && !externalZenMode && (
        <div
          id="bottom-hover-hint"
          aria-hidden="true"
          className="fixed bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-500 opacity-25"
        >
          <div className="w-12 h-1 rounded-full bg-white/40 backdrop-blur-md" />
        </div>
      )}

      {/* Unified Material Frosted Island Dock at Bottom */}
      <footer
        id="quick-controls-footer"
        className={`fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-5 flex items-center justify-center pointer-events-none transition-all duration-300 ease-out ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <nav
          id="quick-controls-island"
          aria-label="Schnellzugriff Menüleiste"
          style={{
            backdropFilter: `blur(${backdropBlur}px)`,
            WebkitBackdropFilter: `blur(${backdropBlur}px)`,
          }}
          className="pointer-events-auto flex items-center gap-1 p-1 sm:p-1.5 max-w-[calc(100vw-1.5rem)] overflow-x-auto scrollbar-none rounded-full bg-slate-950/60 hover:bg-slate-950/80 border border-white/10 hover:border-white/20 shadow-2xl shadow-black/60 hover:shadow-[0_20px_45px_rgba(0,0,0,0.7),0_0_24px_rgba(255,255,255,0.06)] transition-all duration-300"
        >
          {/* Optional Stundenplan */}
          {onOpenTimetable && (
            <button
              id="open-timetable-btn"
              type="button"
              onClick={onOpenTimetable}
              title="Stundenplan HO 2 (Frau Schmitz) öffnen"
              aria-label="Stundenplan öffnen"
              className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white border border-transparent hover:border-amber-400/30 hover:bg-white/[0.16] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_0_14px_rgba(251,191,36,0.18)] hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200 group-hover:scale-115 group-hover:-rotate-12" />
              <span className="hidden sm:inline">Stundenplan</span>
            </button>
          )}

          {/* Games Button with subtle status badge */}
          {onOpenGames && (
            <button
              id="open-games-btn"
              type="button"
              onClick={onOpenGames}
              title={
                isGameAllowed
                  ? isBreak
                    ? `Pause aktiv (${statusResult?.currentBreak?.remainingMinutes} Min.) – Games frei!`
                    : 'Pausen-Spiele öffnen (Taste: G)'
                  : `Unterrichtszeit: Games gesperrt. Nächste Pause: ${statusResult?.nextBreak?.start || '10:30'} Uhr`
              }
              aria-label="Pausen-Spiele öffnen"
              className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white border border-transparent hover:border-emerald-400/30 hover:bg-white/[0.16] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_0_14px_rgba(52,211,153,0.18)] hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
            >
              {!isGameAllowed ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-400 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
                  <span>Games</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                </>
              ) : isBreak ? (
                <>
                  <Coffee className="w-3.5 h-3.5 text-emerald-400 animate-pulse transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-emerald-300">Games</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </>
              ) : (
                <>
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
                  <span>Games</span>
                </>
              )}
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Wallpaper Engine Button */}
          {onOpenWallpapers && (
            <button
              id="open-wallpapers-btn"
              type="button"
              onClick={onOpenWallpapers}
              title="Wallpaper Engine: Kategorisierte 4K-Hintergründe & Partikel (Taste: H)"
              aria-label="Wallpaper Engine Galerie öffnen"
              className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.18] hover:shadow-[0_4px_16px_rgba(56,189,248,0.35),0_0_12px_rgba(255,255,255,0.12)] hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 group-hover:text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <span>Wallpapers</span>
            </button>
          )}

          {/* Gemini Bild-Studio Button */}
          {onOpenGeminiBg && (
            <button
              id="open-gemini-bg-btn"
              type="button"
              onClick={onOpenGeminiBg}
              title="Gemini Bild-Studio: Bilder generieren & bearbeiten (Taste: B)"
              aria-label="Gemini Bild-Studio öffnen"
              className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white border border-transparent hover:border-blue-400/30 hover:bg-white/[0.16] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_0_14px_rgba(96,165,250,0.18)] hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-400 transition-all duration-200 group-hover:scale-115 group-hover:rotate-12 group-hover:text-blue-300" />
              <span className="hidden md:inline">Bild-Studio</span>
            </button>
          )}

          {/* Gemini KI-Chat Button */}
          {onOpenChat && (
            <button
              id="open-gemini-chat-btn"
              type="button"
              onClick={onOpenChat}
              title="Gemini KI-Chat öffnen (Taste: C)"
              aria-label="Gemini KI-Chat öffnen"
              className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white border border-transparent hover:border-indigo-400/30 hover:bg-white/[0.16] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_0_14px_rgba(129,140,248,0.18)] hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400 transition-all duration-200 group-hover:scale-115 group-hover:-translate-y-0.5 group-hover:text-indigo-300" />
              <span className="hidden sm:inline">KI-Chat</span>
            </button>
          )}

          {/* Audio Soundscapes Button */}
          {onOpenAudioTab && (
            <button
              id="open-audio-tab-btn"
              type="button"
              onClick={onOpenAudioTab}
              title={
                isAmbientPlaying
                  ? `Atmosphärisches Audio aktiv: ${activeAmbientTitle || 'Klang aktiv'}. Klicken zum Einstellen.`
                  : 'Beruhigende Hintergrundgeräusche & Audio-Einstellungen'
              }
              aria-label="Audio-Einstellungen & Hintergrundgeräusche"
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ease-out cursor-pointer ${
                isAmbientPlaying
                  ? 'text-cyan-200 bg-cyan-500/20 border-cyan-400/40 shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                  : 'text-slate-300 hover:text-white border-transparent hover:border-cyan-400/30 hover:bg-white/[0.16] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_0_14px_rgba(34,211,238,0.18)] hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-95'
              }`}
            >
              <Volume2
                className={`w-3.5 h-3.5 transition-all duration-200 ${
                  isAmbientPlaying
                    ? 'text-cyan-300 animate-pulse'
                    : 'text-cyan-400 group-hover:scale-115'
                }`}
              />
              <span className="hidden sm:inline">
                {isAmbientPlaying ? 'Audio aktiv' : 'Audio'}
              </span>
              {isAmbientPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Einstellungen Button - refined subtle glass accent with hover lift & spin */}
          <button
            id="open-settings-btn"
            type="button"
            onClick={onOpenSettings}
            title="Einstellungen öffnen (Taste: S)"
            aria-label="Einstellungen öffnen"
            className="group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-transparent hover:border-white/30 hover:shadow-[0_6px_22px_rgba(0,0,0,0.45),0_0_18px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 hover:scale-[1.04] active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-200 group-hover:rotate-90 group-hover:scale-115 transition-all duration-500 ease-out" />
            <span>Einstellungen</span>
          </button>

          {/* Zen / Clean Mode Toggle */}
          <button
            id="toggle-zen-mode-btn"
            type="button"
            onClick={handleToggleZen}
            title={
              zenScheduleEnabled
                ? `Zen-Modus: Zeitplan aktiviert (${zenScheduleRange || 'automatisch'}). Klicken zum Umschalten (Taste: Z)`
                : 'Aufgeräumter Zen-Modus: Alle Leisten ausblenden (Taste: Z)'
            }
            aria-label="Zen-Modus aktivieren"
            className="group relative p-1.5 rounded-full text-slate-400 hover:text-white border border-transparent hover:border-white/20 hover:bg-white/[0.16] hover:shadow-[0_6px_16px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:scale-110 active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
            {zenScheduleEnabled && (
              <span
                className={`absolute 0.5 top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                  zenScheduleActive ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
                }`}
                title={zenScheduleActive ? 'Zen-Zeitplan aktiv' : 'Zen-Zeitplan scharf'}
              />
            )}
          </button>
        </nav>
      </footer>
    </>
  );
};





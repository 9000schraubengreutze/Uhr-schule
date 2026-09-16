import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  Gamepad2,
  Timer,
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
} from 'lucide-react';
import { SchoolStatusResult } from '../utils/timetable';

interface QuickControlsProps {
  onOpenSettings: () => void;
  onOpenGames?: () => void;
  onOpenStopwatch?: () => void;
  onOpenTimetable?: () => void;
  onOpenGeminiBg?: () => void;
  onOpenChat?: () => void;
  statusResult?: SchoolStatusResult;
  backdropBlur?: number;
  anyModalOpen?: boolean;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  disabled?: boolean;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  onOpenGames,
  onOpenStopwatch,
  onOpenTimetable,
  onOpenGeminiBg,
  onOpenChat,
  statusResult,
  backdropBlur = 16,
  anyModalOpen = false,
  isZenMode: externalZenMode,
  onToggleZenMode,
  disabled = false,
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
          title="Minimalismus-Modus beenden & Menüband wieder per Hover aktivieren (Taste: Z)"
          aria-label="Minimalismus-Modus beenden"
          className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-slate-950/40 hover:bg-slate-900/80 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white transition-all duration-300 shadow-lg active:scale-95 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
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
          className="pointer-events-auto flex items-center gap-1 p-1 sm:p-1.5 max-w-[calc(100vw-1.5rem)] overflow-x-auto scrollbar-none rounded-full bg-slate-950/55 hover:bg-slate-950/75 border border-white/10 shadow-2xl shadow-black/50 transition-all duration-300"
        >
          {/* Optional Stundenplan */}
          {onOpenTimetable && (
            <button
              id="open-timetable-btn"
              type="button"
              onClick={onOpenTimetable}
              title="Stundenplan HO 2 (Frau Schmitz) öffnen"
              aria-label="Stundenplan öffnen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Stundenplan</span>
            </button>
          )}

          {/* Stoppuhr Button */}
          {onOpenStopwatch && (
            <button
              id="open-stopwatch-btn"
              type="button"
              onClick={onOpenStopwatch}
              title="Stoppuhr öffnen (Taste: W)"
              aria-label="Stoppuhr öffnen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5 text-sky-400" />
              <span>Stoppuhr</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              {!isGameAllowed ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Games</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                </>
              ) : isBreak ? (
                <>
                  <Coffee className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Games</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </>
              ) : (
                <>
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Games</span>
                </>
              )}
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Gemini Bild-Studio Button */}
          {onOpenGeminiBg && (
            <button
              id="open-gemini-bg-btn"
              type="button"
              onClick={onOpenGeminiBg}
              title="Gemini Bild-Studio: Bilder generieren & bearbeiten (Taste: B)"
              aria-label="Gemini Bild-Studio öffnen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-400" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">KI-Chat</span>
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Einstellungen Button - refined subtle glass accent */}
          <button
            id="open-settings-btn"
            type="button"
            onClick={onOpenSettings}
            title="Einstellungen öffnen (Taste: S)"
            aria-label="Einstellungen öffnen"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 hover:bg-white/25 active:scale-95 transition-all duration-150 cursor-pointer group"
          >
            <Settings className="w-3.5 h-3.5 text-slate-200 group-hover:rotate-45 transition-transform duration-300" />
            <span>Einstellungen</span>
          </button>

          {/* Zen / Clean Mode Toggle */}
          <button
            id="toggle-zen-mode-btn"
            type="button"
            onClick={handleToggleZen}
            title="Aufgeräumter Zen-Modus: Alle Leisten ausblenden (Taste: Z)"
            aria-label="Zen-Modus aktivieren"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </nav>
      </footer>
    </>
  );
};





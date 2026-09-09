import React from 'react';
import { Settings, Maximize2, Minimize2, Sun, Moon, Radio, RefreshCw, AlertCircle, Gamepad2 } from 'lucide-react';
import { ColorScheme } from '../types';
import { AtomicTimeState, formatTimeOffset, formatTimeOffsetDetailed } from '../utils/atomicTime';

interface QuickControlsProps {
  onOpenSettings: () => void;
  onOpenGames?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  colorScheme?: ColorScheme;
  onToggleThemeMode?: () => void;
  atomicState?: AtomicTimeState;
  onTriggerSync?: () => void;
  showSyncBadge?: boolean;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  onOpenGames,
  isFullscreen,
  onToggleFullscreen,
  colorScheme,
  onToggleThemeMode,
  atomicState,
  onTriggerSync,
  showSyncBadge = true,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
      {/* Brand & Atomic Clock Status Pills */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Brand Title Pill */}
        <div className="flex items-center gap-2.5 bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 px-3.5 py-1.5 rounded-2xl shadow-sm text-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold tracking-tight">WebClock</span>
        </div>

        {/* Online Atomic Clock Badge */}
        {showSyncBadge && atomicState && (
          <button
            id="atomic-clock-sync-pill"
            type="button"
            onClick={onTriggerSync}
            title={
              atomicState.status === 'synced'
                ? `Online-Atomuhr aktiv (${atomicState.syncSource}). Deine Geräte-Uhr ${formatTimeOffsetDetailed(atomicState.offsetMs)} – automatisch von der Atomuhr korrigiert. Klicken zum Neu-Synchronisieren.`
                : atomicState.status === 'syncing'
                ? 'Gleiche mit Online-Atomuhr ab...'
                : 'Verbindung zur Atomuhr fehlgeschlagen. Klicken zum erneuten Versuch.'
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 backdrop-blur-xl border border-slate-800/80 text-slate-200 text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {atomicState.status === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-[11px] font-mono text-blue-300 hidden sm:inline">
                  Atomuhr Sync...
                </span>
              </>
            ) : atomicState.status === 'synced' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-medium text-emerald-300">
                  Atomuhr
                </span>
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60 hidden md:inline">
                  {formatTimeOffset(atomicState.offsetMs)}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-amber-300 hidden sm:inline">
                  Atomuhr Offline
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Action Buttons in Material 3 container */}
      <div className="pointer-events-auto flex items-center gap-2">
        {onToggleThemeMode && (
          <button
            id="quick-theme-toggle-btn"
            type="button"
            onClick={onToggleThemeMode}
            title="Hell/Dunkel umschalten"
            aria-label="Hell/Dunkel umschalten"
            className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-800/80 text-slate-200 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {colorScheme === 'light' ? (
              <Moon className="w-4 h-4 text-amber-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        )}

        {/* Games Button */}
        {onOpenGames && (
          <button
            id="open-games-btn"
            type="button"
            onClick={onOpenGames}
            title="Pausen-Spiele öffnen (G)"
            aria-label="Pausen-Spiele öffnen"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-800/80 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline text-xs font-semibold">Games</span>
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          id="quick-fullscreen-btn"
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Vollbild beenden (F)' : 'Vollbildmodus (F)'}
          aria-label={isFullscreen ? 'Vollbild beenden' : 'Vollbildmodus'}
          className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-800/80 text-slate-200 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        <button
          id="open-settings-btn"
          type="button"
          onClick={onOpenSettings}
          title="Einstellungen öffnen (S)"
          aria-label="Einstellungen öffnen"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Menü</span>
        </button>
      </div>
    </header>
  );
};

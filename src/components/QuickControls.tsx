import React from 'react';
import { Settings, Maximize2, Minimize2, Sun, Moon } from 'lucide-react';
import { ColorScheme } from '../types';

interface QuickControlsProps {
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  colorScheme?: ColorScheme;
  onToggleThemeMode?: () => void;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
  colorScheme,
  onToggleThemeMode,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
      {/* Brand Title Pill */}
      <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 px-3.5 py-1.5 rounded-2xl shadow-sm text-slate-100">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs sm:text-sm font-bold tracking-tight">WebClock</span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
          Digital
        </span>
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

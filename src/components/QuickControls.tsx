import React from 'react';
import { Settings, Maximize2, Minimize2 } from 'lucide-react';

interface QuickControlsProps {
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  clockColor: string;
  isAtomicActive?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  offsetMs?: number;
  useAtomicSync?: boolean;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-5 sm:p-8 flex items-center justify-between pointer-events-none">
      {/* Spacer to keep action buttons aligned to the right */}
      <div />

      {/* Action Buttons */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Fullscreen Button */}
        <button
          id="quick-fullscreen-btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Vollbild beenden' : 'Vollbildmodus'}
          aria-label={isFullscreen ? 'Vollbild beenden' : 'Vollbildmodus'}
          className="bg-white/10 backdrop-blur-xl border p-3 rounded-full hover:bg-white/20 transition-all shadow-lg text-white/80 hover:text-white active:scale-95 cursor-pointer"
          style={{ borderColor: 'var(--surface-border, rgba(255,255,255,0.2))' }}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>

        {/* Settings Gear Button */}
        <button
          id="open-settings-btn"
          onClick={onOpenSettings}
          title="Einstellungen öffnen"
          aria-label="Einstellungen öffnen"
          className="bg-white/10 backdrop-blur-xl border p-3 rounded-full hover:bg-white/20 transition-all shadow-lg text-white/80 hover:text-white active:scale-95 hover:rotate-45 cursor-pointer"
          style={{ borderColor: 'var(--surface-border, rgba(255,255,255,0.2))' }}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

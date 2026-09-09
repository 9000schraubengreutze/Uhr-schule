import React from 'react';
import { Settings, Gamepad2, Lock, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QuickControlsProps {
  onOpenSettings: () => void;
  onOpenGames?: () => void;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  onOpenSettings,
  onOpenGames,
}) => {
  const { canPlayGames, isOwner } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-end pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
        {/* Games Button */}
        {onOpenGames && (
          <button
            id="open-games-btn"
            type="button"
            onClick={onOpenGames}
            title={
              isOwner
                ? 'Pausen-Spiele (Inhaber-Zugriff aktiv)'
                : canPlayGames
                ? 'Pausen-Spiele öffnen'
                : 'Pausen-Spiele (Admin/Inhaber-Login erforderlich)'
            }
            aria-label="Pausen-Spiele öffnen"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-800/80 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Games</span>
            {isOwner ? (
              <Crown className="w-3 h-3 text-amber-400" />
            ) : (
              !canPlayGames && <Lock className="w-3 h-3 text-slate-400" />
            )}
          </button>
        )}

        {/* Einstellungen Button */}
        <button
          id="open-settings-btn"
          type="button"
          onClick={onOpenSettings}
          title="Einstellungen öffnen (S)"
          aria-label="Einstellungen öffnen"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Einstellungen</span>
        </button>
      </div>
    </header>
  );
};



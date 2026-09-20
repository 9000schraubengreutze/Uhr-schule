import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  CloudRain,
  Trees,
  Radio,
  Waves,
  Flame,
  Sparkles,
  Info,
  Sliders,
  Check,
} from 'lucide-react';
import { AmbientSoundType, ClockSettings } from '../types';
import { triggerHaptic } from '../utils/audio';

interface AudioSettingsTabProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  showFeedback: (msg: string) => void;
  onTogglePlayAmbient: (type: AmbientSoundType) => void;
}

interface AmbientSoundCardOption {
  id: AmbientSoundType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  accentBorder: string;
  badge: string;
}

const AMBIENT_SOUNDS: AmbientSoundCardOption[] = [
  {
    id: 'rain',
    title: 'Sanfter Sommerregen',
    subtitle: 'Wassertropfen & Regenschauer',
    description: 'Beruhigendes Prasseln von Regentropfen auf Blättern und Fensterscheiben mit feiner Dynamik.',
    icon: CloudRain,
    color: 'from-blue-500/20 to-cyan-500/10 text-cyan-400',
    accentBorder: 'border-cyan-500/40',
    badge: 'Fokus & Ruhe',
  },
  {
    id: 'forest',
    title: 'Wald & Vogelgezwitscher',
    subtitle: 'Leise Brise & Naturklänge',
    description: 'Sanfter Waldwind in den Baumkronen, untermalt von dezenten, melodischen Vogelrufen im Hintergrund.',
    icon: Trees,
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400',
    accentBorder: 'border-emerald-500/40',
    badge: 'Harmonisch',
  },
  {
    id: 'white_noise',
    title: 'Weißes Rauschen',
    subtitle: 'Gleichmäßiges Klangspektrum',
    description: 'Gefiltertes, angenehm weiches weißes Rauschen zur Maskierung störender Umgebungsgeräusche.',
    icon: Radio,
    color: 'from-purple-500/20 to-indigo-500/10 text-purple-400',
    accentBorder: 'border-purple-500/40',
    badge: 'Konzentration',
  },
  {
    id: 'pink_noise',
    title: 'Rosa Rauschen (Pink Noise)',
    subtitle: 'Tiefe Entspannung & Schlaf',
    description: 'Weicheres, tieffrequentes 1/f-Rauschen – ideal für Meditation, Tiefenentspannung und ruhiges Lernen.',
    icon: Sparkles,
    color: 'from-pink-500/20 to-rose-500/10 text-pink-400',
    accentBorder: 'border-pink-500/40',
    badge: 'Deep Rest',
  },
  {
    id: 'waves',
    title: 'Meeresrauschen & Wellen',
    subtitle: 'Ozeanbrandung im Rhythmus',
    description: 'Rhythmisch anrollende und sanft abflauende Ozeanwellen mit naturbelassenem Atem-Takt.',
    icon: Waves,
    color: 'from-sky-500/20 to-blue-500/10 text-sky-400',
    accentBorder: 'border-sky-500/40',
    badge: 'Entspannung',
  },
  {
    id: 'fireplace',
    title: 'Gemütliches Kaminfeuer',
    subtitle: 'Sanftes Knistern & Glut',
    description: 'Wohltuend warmes, knisterndes Holzfeuer mit gelegentlichem Aufglimmen von Holzfunken.',
    icon: Flame,
    color: 'from-amber-500/20 to-orange-500/10 text-amber-400',
    accentBorder: 'border-amber-500/40',
    badge: 'Gemütlich',
  },
];

export const AudioSettingsTab: React.FC<AudioSettingsTabProps> = ({
  settings,
  onUpdateSettings,
  showFeedback,
  onTogglePlayAmbient,
}) => {
  const ambient = settings.ambientSound || {
    activeSound: 'none',
    volume: 0.35,
    isPlaying: false,
    autoPlayOnStart: false,
  };

  const isPlaying = ambient.isPlaying && ambient.activeSound !== 'none';
  const currentSound = ambient.activeSound;

  const handleSelectSound = (soundId: AmbientSoundType) => {
    if (settings.vibrationEnabled) triggerHaptic(12);
    onTogglePlayAmbient(soundId);
    const item = AMBIENT_SOUNDS.find((s) => s.id === soundId);
    if (item) {
      if (currentSound === soundId && isPlaying) {
        showFeedback(`${item.title} pausiert`);
      } else {
        showFeedback(`${item.title} gestartet`);
      }
    }
  };

  const handleVolumeChange = (vol: number) => {
    const clamped = Math.max(0.05, Math.min(1.0, vol));
    onUpdateSettings((prev) => ({
      ...prev,
      ambientSound: {
        ...(prev.ambientSound || ambient),
        volume: clamped,
      },
    }));
  };

  const handleStopAll = () => {
    if (settings.vibrationEnabled) triggerHaptic(15);
    onTogglePlayAmbient('none');
    showFeedback('Hintergrundgeräusche gestoppt');
  };

  const handleToggleAutoPlay = (enabled: boolean) => {
    if (settings.vibrationEnabled) triggerHaptic(8);
    onUpdateSettings((prev) => ({
      ...prev,
      ambientSound: {
        ...(prev.ambientSound || ambient),
        autoPlayOnStart: enabled,
      },
    }));
    showFeedback(
      enabled
        ? 'Automatisches Fortsetzen beim Start aktiviert'
        : 'Automatisches Fortsetzen deaktiviert'
    );
  };

  const activeOption = AMBIENT_SOUNDS.find((s) => s.id === currentSound);

  return (
    <div id="audio-settings-tab-container" className="space-y-5">
      {/* Master Audio Controller Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border transition-all ${
                isPlaying
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-md shadow-blue-500/10'
                  : 'bg-slate-800/70 text-slate-400 border-slate-700/60'
              }`}
            >
              {isPlaying ? (
                <Volume2 className="w-5 h-5 animate-pulse text-blue-400" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  Beruhigende Hintergrundgeräusche
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE AKTIV
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 block mt-0.5">
                {isPlaying && activeOption
                  ? `Aktuell aktiv: ${activeOption.title}`
                  : 'Schaffe eine entspannende Arbeits- & Lernatmosphäre'}
              </span>
            </div>
          </div>

          {isPlaying && (
            <button
              id="ambient-stop-button"
              type="button"
              onClick={handleStopAll}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stoppen</span>
            </button>
          )}
        </div>

        {/* Volume Slider */}
        <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Lautstärke der Klanglandschaft</span>
            </span>
            <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {Math.round((ambient.volume ?? 0.35) * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              id="ambient-volume-slider"
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={ambient.volume ?? 0.35}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Auto-Play Toggle */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div>
            <span className="font-medium text-slate-200 block">
              Beim Start automatisch abspielen
            </span>
            <span className="text-[11px] text-slate-400">
              Merkt sich den ausgewählten Klang und spielt ihn bei späteren Besuchen ab
            </span>
          </div>
          <button
            id="ambient-autoplay-toggle"
            type="button"
            role="switch"
            aria-checked={ambient.autoPlayOnStart}
            onClick={() => handleToggleAutoPlay(!ambient.autoPlayOnStart)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              ambient.autoPlayOnStart ? 'bg-blue-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                ambient.autoPlayOnStart ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Soundscape Selection Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Verfügbare Klanglandschaften
          </span>
          <span className="text-[11px] text-slate-400">
            Klicke auf eine Karte zum Anhören
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AMBIENT_SOUNDS.map((sound) => {
            const Icon = sound.icon;
            const isThisPlaying = isPlaying && currentSound === sound.id;

            return (
              <div
                key={sound.id}
                id={`ambient-sound-${sound.id}`}
                onClick={() => handleSelectSound(sound.id)}
                className={`relative rounded-2xl border p-4 text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  isThisPlaying
                    ? `bg-slate-900/90 ${sound.accentBorder} ring-2 ring-blue-500/30 shadow-lg`
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-xl bg-gradient-to-br ${sound.color} border border-slate-700/50 flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                        {sound.badge}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                          isThisPlaying
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="font-bold text-xs text-slate-100 group-hover:text-white transition-colors">
                    {sound.title}
                  </div>
                  <div className="text-[11px] text-sky-400/90 font-medium mb-1.5">
                    {sound.subtitle}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {sound.description}
                  </p>
                </div>

                {isThisPlaying && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Wird abgespielt
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Klicken zum Pausieren
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clock Tick Sound Setting */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Taktiler Sekunden-Tick
        </span>
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-medium text-slate-200 block">
              Sekundentakt-Ticken der Digitaluhr
            </span>
            <span className="text-[11px] text-slate-400">
              Dezentes mechanisches Ticken synchron zum Sekundenwechsel (Standard: Stumm)
            </span>
          </div>
          <button
            id="clock-tick-sound-toggle"
            type="button"
            role="switch"
            aria-checked={settings.soundEnabled}
            onClick={() => {
              try {
                localStorage.setItem('webclock_sound_explicit_choice_v1', 'true');
              } catch {}
              onUpdateSettings((prev) => ({
                ...prev,
                soundEnabled: !prev.soundEnabled,
              }));
              showFeedback(
                !settings.soundEnabled
                  ? 'Sekundentakt-Ton aktiviert'
                  : 'Sekundentakt-Ton deaktiviert'
              );
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.soundEnabled ? 'bg-blue-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                settings.soundEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Atmospheric Advice Info Box */}
      <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-800/40 flex items-start gap-2.5 text-xs text-sky-300/90 leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Atmosphärische Synthese</strong>
          Alle Klänge werden in Echtzeit über die Web Audio API direkt im Browser erzeugt. Das spart Datenvolumen, läuft offline und harmoniert mit dem Zen- und Vollbildmodus der WebClock.
        </div>
      </div>
    </div>
  );
};

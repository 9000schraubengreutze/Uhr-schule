import React, { useState, useMemo } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  LayoutList,
  LayoutGrid,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { AdditionalTimeZone, ClockSettings } from '../types';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { PRESET_WORLD_TIMEZONES, WorldTimeZoneOption } from '../utils/presets';
import { triggerHaptic } from '../utils/audio';

interface WorldClockSettingsCardProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  showFeedback?: (msg: string) => void;
}

// Popular quick pick presets
const POPULAR_QUICK_CITIES: WorldTimeZoneOption[] = [
  { name: 'New York', timeZone: 'America/New_York', region: 'Nordamerika', flag: '🇺🇸' },
  { name: 'Tokio', timeZone: 'Asia/Tokyo', region: 'Asien', flag: '🇯🇵' },
  { name: 'London', timeZone: 'Europe/London', region: 'Europa', flag: '🇬🇧' },
  { name: 'Los Angeles', timeZone: 'America/Los_Angeles', region: 'Nordamerika', flag: '🇺🇸' },
  { name: 'Sydney', timeZone: 'Australia/Sydney', region: 'Australien', flag: '🇦🇺' },
  { name: 'Dubai', timeZone: 'Asia/Dubai', region: 'Mittlerer Osten', flag: '🇦🇪' },
  { name: 'Singapur', timeZone: 'Asia/Singapore', region: 'Asien', flag: '🇸🇬' },
  { name: 'Paris', timeZone: 'Europe/Paris', region: 'Europa', flag: '🇫🇷' },
  { name: 'Zürich', timeZone: 'Europe/Zurich', region: 'Europa', flag: '🇨🇭' },
  { name: 'Honolulu', timeZone: 'Pacific/Honolulu', region: 'Pazifik', flag: '🌺' },
];

export const WorldClockSettingsCard: React.FC<WorldClockSettingsCardProps> = ({
  settings,
  onUpdateSettings,
  showFeedback,
}) => {
  const isEnabled = settings.showAdditionalTimeZones;
  const zones = settings.additionalTimeZones || [];
  const layout = settings.worldClockLayout || 'rows';

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Filter available cities for search
  const filteredPresetCities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return PRESET_WORLD_TIMEZONES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.timeZone.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [searchQuery]);

  // Cities not yet added for quick-pick
  const unaddedQuickCities = useMemo(() => {
    return POPULAR_QUICK_CITIES.filter(
      (p) => !zones.some((z) => z.timeZone === p.timeZone)
    );
  }, [zones]);

  const handleAddTimeZone = (option: WorldTimeZoneOption) => {
    if (zones.some((z) => z.timeZone === option.timeZone)) {
      showFeedback?.(`${option.name} ist bereits in der Liste`);
      return;
    }

    const newZone: AdditionalTimeZone = {
      id: `tz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: option.name,
      timeZone: option.timeZone,
      flag: option.flag || '🌐',
    };

    onUpdateSettings((prev) => ({
      ...prev,
      showAdditionalTimeZones: true,
      additionalTimeZones: [...(prev.additionalTimeZones || []), newZone],
    }));

    setSearchQuery('');
    setShowSearchDropdown(false);
    showFeedback?.(`${option.name} zur Weltzeit hinzugefügt`);
    triggerHaptic(settings.vibrationEnabled);
  };

  const handleRemoveTimeZone = (id: string, name: string) => {
    onUpdateSettings((prev) => ({
      ...prev,
      additionalTimeZones: (prev.additionalTimeZones || []).filter((z) => z.id !== id),
    }));
    showFeedback?.(`${name} entfernt`);
    triggerHaptic(settings.vibrationEnabled);
  };

  const handleMoveZone = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= zones.length) return;

    const newZones = [...zones];
    const [moved] = newZones.splice(index, 1);
    newZones.splice(targetIndex, 0, moved);

    onUpdateSettings((prev) => ({
      ...prev,
      additionalTimeZones: newZones,
    }));
    triggerHaptic(settings.vibrationEnabled);
  };

  // Helper to format live time in a given timezone
  const getLiveZoneInfo = (timeZone: string) => {
    try {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('de-DE', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: settings.worldClockShowSeconds ? '2-digit' : undefined,
        hourCycle: settings.is24Hour ? 'h23' : 'h12',
      }).format(now);

      // Compute hour diff from local time
      const localTz = settings.timeZone && settings.timeZone !== 'auto' ? settings.timeZone : 'Europe/Berlin';
      const getTzHour = (tz: string) => {
        const hPart = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          hourCycle: 'h23',
        }).format(now);
        return parseInt(hPart, 10);
      };

      const hour = getTzHour(timeZone);
      const isDay = hour >= 6 && hour < 18;

      // Approximate relative hour offset
      const d1 = new Date(now.toLocaleString('en-US', { timeZone: localTz }));
      const d2 = new Date(now.toLocaleString('en-US', { timeZone }));
      const diffHours = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60));
      const offsetStr = diffHours === 0 ? 'Gleiche Zeit' : diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`;

      return { timeStr: parts, isDay, offsetStr };
    } catch {
      return { timeStr: '--:--', isDay: true, offsetStr: '' };
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">
                Weltzeit & Zeitzonen
              </h4>
              {isEnabled ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-blue-400" />
                  {zones.length === 1 ? '1 Zeitzone aktiv' : `${zones.length} Zeitzonen aktiv`}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Deaktiviert
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Weitere Weltstädte als kleine, minimalistische Zeilen unter der Hauptuhr einblenden
            </p>
          </div>
        </div>
      </div>

      {/* Main Switch */}
      <div className="pt-2 border-t border-slate-800/80">
        <MaterialSwitch
          label="Weltzeit unter der Hauptuhr anzeigen"
          description="Platziert die ausgewählten Weltzeitzonen mit Live-Uhrzeit dezent unter der großen Digitaluhr"
          checked={isEnabled}
          onChange={(v) => {
            onUpdateSettings((prev) => ({ ...prev, showAdditionalTimeZones: v }));
            showFeedback?.(v ? 'Weltzeit unter der Uhr aktiviert' : 'Weltzeit ausgeblendet');
            triggerHaptic(settings.vibrationEnabled);
          }}
        />
      </div>

      {isEnabled && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Display Style: Rows vs Chips */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Darstellungsstil unter der Uhr</span>
                  <span className="text-[11px] text-slate-400">
                    {layout === 'rows'
                      ? 'Kleine, minimalistische Zeilen (sehr dezent & kompakt)'
                      : 'Kompakte Kacheln'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings((prev) => ({ ...prev, worldClockLayout: 'rows' }));
                  showFeedback?.('Minimalistische Zeilen aktiviert');
                  triggerHaptic(settings.vibrationEnabled);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  layout === 'rows'
                    ? 'bg-blue-600/25 border-blue-500/80 text-white ring-2 ring-blue-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${layout === 'rows' ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                  <LayoutList className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight">Minimalistische Zeilen</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Dezente Zeilen mit subtilen Trennlinien (Empfohlen)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateSettings((prev) => ({ ...prev, worldClockLayout: 'chips' }));
                  showFeedback?.('Kompakte Kacheln aktiviert');
                  triggerHaptic(settings.vibrationEnabled);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  layout === 'chips'
                    ? 'bg-blue-600/25 border-blue-500/80 text-white ring-2 ring-blue-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${layout === 'chips' ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight">Kompakte Kacheln</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Nebeneinanderstehende abgerundete Chips</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick-Pick Popular Metropolises */}
          {unaddedQuickCities.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Beliebte Metropolen schnell hinzufügen</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unaddedQuickCities.map((city) => (
                  <button
                    key={city.timeZone}
                    type="button"
                    onClick={() => handleAddTimeZone(city)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  >
                    <span>{city.flag}</span>
                    <span className="font-medium">{city.name}</span>
                    <Plus className="w-3 h-3 text-blue-400 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Any City */}
          <div className="relative">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                placeholder="Weltstadt oder Zeitzone suchen (z. B. Tokio, Sydney, Honolulu)..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && filteredPresetCities.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 divide-y divide-slate-800 shadow-2xl text-xs">
                {filteredPresetCities.map((city) => {
                  const isAdded = zones.some((z) => z.timeZone === city.timeZone);
                  return (
                    <button
                      key={city.timeZone}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddTimeZone(city)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        isAdded
                          ? 'opacity-40 cursor-not-allowed bg-slate-950/40'
                          : 'hover:bg-slate-800 cursor-pointer text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{city.flag || '🌐'}</span>
                        <div>
                          <div className="font-medium text-slate-200">{city.name}</div>
                          <div className="text-[10px] text-slate-400">{city.region} • {city.timeZone}</div>
                        </div>
                      </div>
                      {isAdded ? (
                        <span className="text-[10px] text-slate-500">Bereits hinzugefügt</span>
                      ) : (
                        <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          Hinzufügen
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Time Zones List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Aktive Weltzeitzonen ({zones.length})</span>
              {zones.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings((prev) => ({ ...prev, additionalTimeZones: [] }));
                    showFeedback?.('Alle Zeitzonen geleert');
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer normal-case"
                >
                  Alle entfernen
                </button>
              )}
            </div>

            {zones.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                Keine Zeitzonen hinterlegt. Klicke oben auf eine Metropole oder suche eine Stadt, um sie unter der Hauptuhr anzuzeigen.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950/50 border border-slate-800/90 overflow-hidden">
                {zones.map((zone, idx) => {
                  const info = getLiveZoneInfo(zone.timeZone);
                  return (
                    <div
                      key={zone.id}
                      className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5 hover:bg-slate-900/60 transition-colors"
                    >
                      {/* Flag, Day/Night, City Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base sm:text-lg shrink-0 leading-none">
                          {zone.flag || '🌐'}
                        </span>
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-800/90 shrink-0"
                          title={info.isDay ? 'Tag' : 'Nacht'}
                        >
                          {info.isDay ? (
                            <Sun className="w-2.5 h-2.5 text-amber-400" />
                          ) : (
                            <Moon className="w-2.5 h-2.5 text-indigo-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                            {zone.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {zone.timeZone.split('/')[1]?.replace(/_/g, ' ') || zone.timeZone}
                          </div>
                        </div>
                      </div>

                      {/* Live Digital Preview & Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right">
                          <div
                            className="text-xs sm:text-sm font-mono font-bold"
                            style={{ color: 'var(--clock-color, ' + settings.clockColor + ')' }}
                          >
                            {info.timeStr}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {info.offsetStr}
                          </div>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveZone(idx, 'up')}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Nach oben verschieben"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === zones.length - 1}
                            onClick={() => handleMoveZone(idx, 'down')}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Nach unten verschieben"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeZone(zone.id, zone.name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 border border-rose-500/20 transition-all cursor-pointer"
                          title={`${zone.name} entfernen`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub-Switches */}
          <div className="space-y-1 divide-y divide-slate-800/60 pt-1">
            <MaterialSwitch
              label="Automatische Farbanpassung an Design & Zen-Modus"
              description="Passt Rahmen, Hintergrundglanz, Ziffernfarben und Transparenz der Weltzeitzeilen nahtlos an das aktive Design, die Uhrfarbe und den Zen-Modus an"
              checked={settings.worldClockAutoTheme ?? true}
              onChange={(v) => {
                onUpdateSettings((prev) => ({ ...prev, worldClockAutoTheme: v }));
                showFeedback?.(v ? 'Automatische Farbanpassung aktiviert' : 'Standardfarben verwendet');
                triggerHaptic(settings.vibrationEnabled);
              }}
            />

            <MaterialSwitch
              label="Zeitunterschied anzeigen (+/- Stunden zur Ortszeit)"
              description="Zeigt hinter der Zeitzone z. B. +7h oder -6h relativ zu deiner Hauptuhr an"
              checked={settings.worldClockShowOffset ?? true}
              onChange={(v) => {
                onUpdateSettings((prev) => ({ ...prev, worldClockShowOffset: v }));
                triggerHaptic(settings.vibrationEnabled);
              }}
            />

            <MaterialSwitch
              label="Sekunden in Weltzeit einblenden"
              description="Zeigt Sekunden auch in den zusätzlichen Zeitzonen an"
              checked={Boolean(settings.worldClockShowSeconds)}
              onChange={(v) => {
                onUpdateSettings((prev) => ({ ...prev, worldClockShowSeconds: v }));
                triggerHaptic(settings.vibrationEnabled);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

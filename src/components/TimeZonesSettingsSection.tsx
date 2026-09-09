import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  Check,
  Search,
  RotateCcw,
} from 'lucide-react';
import { AdditionalTimeZone, ClockSettings } from '../types';
import { PRESET_WORLD_TIMEZONES } from '../utils/presets';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';

interface TimeZonesSettingsSectionProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  showFeedback: (msg: string) => void;
}

export const TimeZonesSettingsSection: React.FC<TimeZonesSettingsSectionProps> = ({
  settings,
  onUpdateSettings,
  showFeedback,
}) => {
  // Live ticker for previewing current times in the settings drawer
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Form states for adding custom time zone
  const [selectedPresetTz, setSelectedPresetTz] = useState(PRESET_WORLD_TIMEZONES[0].timeZone);
  const [customNameInput, setCustomNameInput] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const currentZones = settings.additionalTimeZones || [];

  // Helper to format time in given timezone
  const getFormattedTimeInZone = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: !settings.is24Hour,
      }).format(now);
    } catch {
      return '--:--';
    }
  };

  // Helper to get time difference in hours to the main clock
  const getHourOffsetToMain = (targetTz: string) => {
    try {
      const mainTz =
        !settings.timeZone || settings.timeZone === 'auto' || settings.timeZone === 'Europe/Berlin'
          ? 'Europe/Berlin'
          : settings.timeZone;

      const getUtc = (zone: string) => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hourCycle: 'h23',
        }).formatToParts(now);
        const map: Record<string, number> = {};
        parts.forEach((p) => {
          if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
        });
        return Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute);
      };

      const diffHours = (getUtc(targetTz) - getUtc(mainTz)) / (1000 * 60 * 60);
      if (diffHours === 0) return 'Gleiche Zeit';
      const formatted = Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1);
      return diffHours > 0 ? `+${formatted} Std.` : `${formatted} Std.`;
    } catch {
      return '';
    }
  };

  // Add a preset city
  const handleAddPreset = (tzOption: (typeof PRESET_WORLD_TIMEZONES)[0]) => {
    if (currentZones.some((z) => z.timeZone === tzOption.timeZone)) {
      showFeedback(`${tzOption.name} ist bereits in der Liste`);
      return;
    }

    const newZone: AdditionalTimeZone = {
      id: `tz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: tzOption.name,
      timeZone: tzOption.timeZone,
    };

    onUpdateSettings((prev) => ({
      ...prev,
      showAdditionalTimeZones: true, // Automatically enable if user adds a timezone
      additionalTimeZones: [...(prev.additionalTimeZones || []), newZone],
    }));

    if (settings.vibrationEnabled) triggerHaptic(15);
    showFeedback(`${tzOption.name} hinzugefügt`);
  };

  // Add custom city/zone
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customNameInput.trim();
    if (!name) {
      showFeedback('Bitte gib einen Namen für die Stadt ein');
      return;
    }

    const newZone: AdditionalTimeZone = {
      id: `tz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      timeZone: selectedPresetTz,
    };

    onUpdateSettings((prev) => ({
      ...prev,
      showAdditionalTimeZones: true,
      additionalTimeZones: [...(prev.additionalTimeZones || []), newZone],
    }));

    setCustomNameInput('');
    setShowCustomForm(false);
    if (settings.vibrationEnabled) triggerHaptic(15);
    showFeedback(`Zeitzone "${name}" hinzugefügt`);
  };

  // Remove timezone
  const handleRemoveZone = (id: string, name: string) => {
    onUpdateSettings((prev) => ({
      ...prev,
      additionalTimeZones: (prev.additionalTimeZones || []).filter((z) => z.id !== id),
    }));
    if (settings.vibrationEnabled) triggerHaptic(10);
    showFeedback(`"${name}" entfernt`);
  };

  // Move zone up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    onUpdateSettings((prev) => {
      const list = [...(prev.additionalTimeZones || [])];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return { ...prev, additionalTimeZones: list };
    });
  };

  // Move zone down
  const handleMoveDown = (index: number) => {
    if (index >= currentZones.length - 1) return;
    onUpdateSettings((prev) => {
      const list = [...(prev.additionalTimeZones || [])];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return { ...prev, additionalTimeZones: list };
    });
  };

  // Apply a quick preset pack
  const applyPresetPack = (packName: string, zones: Array<{ name: string; timeZone: string }>) => {
    const newZones: AdditionalTimeZone[] = zones.map((z, idx) => ({
      id: `tz-pack-${Date.now()}-${idx}`,
      name: z.name,
      timeZone: z.timeZone,
    }));

    onUpdateSettings((prev) => ({
      ...prev,
      showAdditionalTimeZones: true,
      additionalTimeZones: newZones,
    }));

    if (settings.vibrationEnabled) triggerHaptic(20);
    showFeedback(`Vorlage "${packName}" aktiviert`);
  };

  // Filtered preset cities for search
  const filteredPresets = PRESET_WORLD_TIMEZONES.filter((p) => {
    if (!citySearchQuery.trim()) return true;
    const query = citySearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.region.toLowerCase().includes(query) ||
      p.timeZone.toLowerCase().includes(query)
    );
  });

  return (
    <div
      id="settings-section-additional-timezones"
      className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-sm"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Zusätzliche Zeitzonen (Weltuhr)
            </h3>
            <p className="text-[11px] text-slate-400">
              Weltzeit-Uhren direkt unter der Hauptuhr einblenden
            </p>
          </div>
        </div>

        {currentZones.length > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {currentZones.length} {currentZones.length === 1 ? 'Stadt' : 'Städte'}
          </span>
        )}
      </div>

      {/* Main Switch to Toggle Visibility */}
      <div className="bg-slate-950/60 rounded-xl border border-slate-800/80">
        <MaterialSwitch
          id="toggle-additional-timezones"
          label="Unter der Hauptuhr anzeigen"
          description="Aktiviert die Anzeige ausgewählter Weltzeitzonen mit Live-Zeit und Zeitdifferenz unter der großen Digitaluhr"
          checked={settings.showAdditionalTimeZones}
          onChange={(v) => {
            onUpdateSettings((p) => ({ ...p, showAdditionalTimeZones: v }));
            showFeedback(v ? 'Zusätzliche Zeitzonen eingeblendet' : 'Zusätzliche Zeitzonen ausgeblendet');
          }}
        />
      </div>

      {/* Preset Packs for 1-Click Setup */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Schnell-Vorlagen:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() =>
              applyPresetPack('Standard (London, New York, Tokio)', [
                { name: 'London', timeZone: 'Europe/London' },
                { name: 'New York', timeZone: 'America/New_York' },
                { name: 'Tokio', timeZone: 'Asia/Tokyo' },
              ])
            }
            className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            Klassisch (3 Städte)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPresetPack('Finanzzentren', [
                { name: 'London', timeZone: 'Europe/London' },
                { name: 'New York', timeZone: 'America/New_York' },
                { name: 'Singapur', timeZone: 'Asia/Singapore' },
                { name: 'Tokio', timeZone: 'Asia/Tokyo' },
              ])
            }
            className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            Finanzzentren
          </button>
          <button
            type="button"
            onClick={() =>
              applyPresetPack('Nordamerika', [
                { name: 'New York', timeZone: 'America/New_York' },
                { name: 'Chicago', timeZone: 'America/Chicago' },
                { name: 'Los Angeles', timeZone: 'America/Los_Angeles' },
              ])
            }
            className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            Nordamerika (USA)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPresetPack('Asien & Pazifik', [
                { name: 'Dubai', timeZone: 'Asia/Dubai' },
                { name: 'Tokio', timeZone: 'Asia/Tokyo' },
                { name: 'Sydney', timeZone: 'Australia/Sydney' },
              ])
            }
            className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            Asien & Pazifik
          </button>
          {currentZones.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onUpdateSettings((p) => ({ ...p, additionalTimeZones: [] }));
                showFeedback('Alle zusätzlichen Zeitzonen entfernt');
              }}
              className="px-2.5 py-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-[11px] text-red-300 hover:text-red-100 transition-all cursor-pointer"
            >
              Alle leeren
            </button>
          )}
        </div>
      </div>

      {/* List of Configured Timezones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Aktive Zeitzonen unter der Hauptuhr:</span>
          <span className="text-[11px] text-slate-400 font-normal">
            {currentZones.length} konfiguriert
          </span>
        </div>

        {currentZones.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-1.5">
            <Clock className="w-5 h-5 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-300 font-medium">
              Noch keine zusätzlichen Zeitzonen hinzugefügt
            </p>
            <p className="text-[11px] text-slate-500">
              Wähle unten eine Weltstadt aus oder klicke auf eine Schnell-Vorlage oben.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {currentZones.map((zone, idx) => {
              const liveTime = getFormattedTimeInZone(zone.timeZone);
              const offsetStr = getHourOffsetToMain(zone.timeZone);
              const matchedPreset = PRESET_WORLD_TIMEZONES.find(
                (p) => p.timeZone === zone.timeZone
              );

              return (
                <div
                  key={`${zone.id || zone.timeZone}-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base" role="img" aria-label="Flag">
                      {matchedPreset?.flag || '🌐'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {zone.customLabel || zone.name}
                        </span>
                        {offsetStr && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                            {offsetStr}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block font-mono">
                        {zone.timeZone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Live Clock preview */}
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-sky-400 tabular-numbers">
                        {liveTime}
                      </span>
                    </div>

                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        aria-label="Nach oben verschieben"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === currentZones.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        aria-label="Nach unten verschieben"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveZone(zone.id, zone.name)}
                      aria-label={`${zone.name} entfernen`}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
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

      {/* World City Catalog (Quick-Add) */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Weltstadt aus Katalog hinzufügen:
          </span>
          <button
            type="button"
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            {showCustomForm ? 'Katalog anzeigen' : '+ Eigene Stadt eintragen'}
          </button>
        </div>

        {!showCustomForm ? (
          <div className="space-y-2">
            {/* Search Input for Cities */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="Stadt oder Land suchen (z. B. Tokio, Sydney, New York)..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {citySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCitySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scrollable list of cities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredPresets.map((city, idx) => {
                const isAlreadyAdded = currentZones.some((z) => z.timeZone === city.timeZone);
                const liveCityTime = getFormattedTimeInZone(city.timeZone);

                return (
                  <button
                    key={`${city.timeZone}-${city.name}-${idx}`}
                    type="button"
                    onClick={() => handleAddPreset(city)}
                    disabled={isAlreadyAdded}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isAlreadyAdded
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-50 cursor-default'
                        : 'bg-slate-950/80 border-slate-800 hover:border-blue-500/60 hover:bg-slate-800/80 active:scale-98'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{city.flag || '🌐'}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 truncate block">
                          {city.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {city.region}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <span className="text-[11px] font-mono text-slate-300 tabular-numbers">
                        {liveCityTime}
                      </span>
                      {isAlreadyAdded ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Custom Time Zone Form */
          <form
            onSubmit={handleAddCustom}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
          >
            <div className="space-y-1">
              <label htmlFor="custom-city-name" className="text-[11px] font-semibold text-slate-300 block">
                Bezeichnung / Name der Stadt:
              </label>
              <input
                id="custom-city-name"
                type="text"
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                placeholder="z. B. San Francisco, Zürich, Büro Tokio"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="custom-timezone-select" className="text-[11px] font-semibold text-slate-300 block">
                Zugehörige IANA-Zeitzone:
              </label>
              <select
                id="custom-timezone-select"
                value={selectedPresetTz}
                onChange={(e) => setSelectedPresetTz(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {PRESET_WORLD_TIMEZONES.map((p, idx) => (
                  <option key={`${p.timeZone}-${p.name}-${idx}`} value={p.timeZone}>
                    {p.name} ({p.timeZone}) [{p.region}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hinzufügen</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

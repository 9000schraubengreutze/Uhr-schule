import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Globe,
  Search,
  Plus,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Compass,
} from 'lucide-react';
import { AdditionalTimeZone } from '../types';
import { PRESET_WORLD_TIMEZONES } from '../utils/presets';
import { triggerHaptic } from '../utils/audio';

interface AddTimeZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTimeZones: AdditionalTimeZone[];
  onAddTimeZone: (zone: { name: string; timeZone: string; flag?: string; customLabel?: string }) => void;
  onRemoveTimeZone: (id: string) => void;
  onReorderTimeZones: (zones: AdditionalTimeZone[]) => void;
  mainTimeZone?: string;
  is24Hour?: boolean;
  backdropBlur?: number;
  vibrationEnabled?: boolean;
}

type RegionFilter =
  | 'all'
  | 'popular'
  | 'Europa'
  | 'Nordamerika'
  | 'Südamerika'
  | 'Asien'
  | 'Naher Osten'
  | 'Australien & Ozeanien'
  | 'Afrika'
  | 'custom';

const POPULAR_CITY_NAMES = [
  'London',
  'New York',
  'Tokio',
  'Paris',
  'Los Angeles / San Francisco',
  'Singapur',
  'Sydney',
  'Dubai',
  'Berlin',
  'Zürich',
  'Hongkong',
  'Toronto',
];

export const AddTimeZoneModal: React.FC<AddTimeZoneModalProps> = ({
  isOpen,
  onClose,
  activeTimeZones,
  onAddTimeZone,
  onRemoveTimeZone,
  onReorderTimeZones,
  mainTimeZone = 'Europe/Berlin',
  is24Hour = true,
  backdropBlur = 16,
  vibrationEnabled = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all');
  const [customCityName, setCustomCityName] = useState('');
  const [customTimeZone, setCustomTimeZone] = useState(PRESET_WORLD_TIMEZONES[0].timeZone);
  const [customLabel, setCustomLabel] = useState('');
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Keep live time ticking while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Main timezone resolution
  const effectiveMainTz =
    !mainTimeZone || mainTimeZone === 'auto' || mainTimeZone === 'Europe/Berlin'
      ? 'Europe/Berlin'
      : mainTimeZone;

  // Format time in a given timezone
  const formatTimeInZone = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour,
      }).format(currentTime);
    } catch {
      return '--:--';
    }
  };

  // Calculate relative offset and day differences to main clock
  const getOffsetToMain = (tz: string) => {
    try {
      const getUtc = (zone: string) => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hourCycle: 'h23',
        }).formatToParts(currentTime);
        const map: Record<string, number> = {};
        parts.forEach((p) => {
          if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
        });
        return {
          timestamp: Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute),
          hour: map.hour,
          day: map.day,
        };
      };

      const mainData = getUtc(effectiveMainTz);
      const targetData = getUtc(tz);

      const diffHours = (targetData.timestamp - mainData.timestamp) / (1000 * 60 * 60);
      let offsetStr = '';
      if (diffHours === 0) {
        offsetStr = 'Gleich';
      } else if (diffHours > 0) {
        const fmt = Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1);
        offsetStr = `+${fmt}h`;
      } else {
        const fmt = Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1);
        offsetStr = `${fmt}h`;
      }

      const isDayTime = targetData.hour >= 6 && targetData.hour < 18;

      return { offsetStr, isDayTime };
    } catch {
      return { offsetStr: '', isDayTime: true };
    }
  };

  // Filtered preset list based on region and search query
  const filteredPresets = useMemo(() => {
    return PRESET_WORLD_TIMEZONES.filter((city) => {
      // Region filter
      if (selectedRegion === 'popular') {
        if (!POPULAR_CITY_NAMES.includes(city.name)) return false;
      } else if (selectedRegion !== 'all' && selectedRegion !== 'custom') {
        if (city.region !== selectedRegion) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = city.name.toLowerCase().includes(q);
        const matchesRegion = city.region.toLowerCase().includes(q);
        const matchesTz = city.timeZone.toLowerCase().includes(q);
        return matchesName || matchesRegion || matchesTz;
      }

      return true;
    });
  }, [selectedRegion, searchQuery]);

  if (!isOpen) return null;

  // Toggle or add city
  const handleToggleCity = (city: (typeof PRESET_WORLD_TIMEZONES)[0]) => {
    const existing = activeTimeZones.find((z) => z.timeZone === city.timeZone);
    if (existing) {
      onRemoveTimeZone(existing.id);
      if (vibrationEnabled) triggerHaptic(10);
    } else {
      onAddTimeZone({
        name: city.name,
        timeZone: city.timeZone,
        flag: city.flag,
      });
      if (vibrationEnabled) triggerHaptic(15);
    }
  };

  // Add custom city
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCityName.trim()) return;

    onAddTimeZone({
      name: customCityName.trim(),
      timeZone: customTimeZone,
      customLabel: customLabel.trim() || undefined,
      flag: '🌐',
    });

    setCustomCityName('');
    setCustomLabel('');
    if (vibrationEnabled) triggerHaptic(15);
  };

  // Move timezone position
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeTimeZones.length) return;

    const list = [...activeTimeZones];
    const temp = list[targetIdx];
    list[targetIdx] = list[index];
    list[index] = temp;
    onReorderTimeZones(list);
    if (vibrationEnabled) triggerHaptic(10);
  };

  // Apply quick preset pack
  const handleApplyPresetPack = (pack: { name: string; zones: Array<{ name: string; timeZone: string; flag?: string }> }) => {
    const newItems: AdditionalTimeZone[] = pack.zones.map((z, idx) => ({
      id: `tz-pack-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      name: z.name,
      timeZone: z.timeZone,
      flag: z.flag,
    }));
    onReorderTimeZones(newItems);
    if (vibrationEnabled) triggerHaptic(20);
  };

  return (
    <div
      id="add-timezone-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-timezone-modal-card"
        style={{
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
        className="relative w-full max-w-2xl bg-slate-900/95 border border-white/15 text-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Weltzeitzonen hinzufügen</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeTimeZones.length} aktiv
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Wähle Weltstädte aus, die neben der Hauptuhr live angezeigt werden sollen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Schließen"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Active Time Zones Strip (if any) */}
          {activeTimeZones.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Aktuell ausgewählte Zeitzonen ({activeTimeZones.length}):</span>
                </span>
                <button
                  type="button"
                  onClick={() => onReorderTimeZones([])}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Alle entfernen
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {activeTimeZones.map((zone, idx) => {
                  const liveTime = formatTimeInZone(zone.timeZone);
                  const { offsetStr, isDayTime } = getOffsetToMain(zone.timeZone);

                  return (
                    <div
                      key={zone.id || `${zone.timeZone}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{zone.flag || '🌐'}</span>
                        <div className="min-w-0">
                          <span className="font-bold text-white truncate block">
                            {zone.customLabel || zone.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {offsetStr ? `${offsetStr} • ` : ''}{zone.timeZone.split('/')[1]?.replace('_', ' ') || zone.timeZone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          {isDayTime ? (
                            <Sun className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Moon className="w-3 h-3 text-indigo-300" />
                          )}
                          <span className="font-mono font-bold text-sky-400 tabular-numbers">
                            {liveTime}
                          </span>
                        </div>

                        {/* Move Controls */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'up')}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Nach vorne verschieben"
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === activeTimeZones.length - 1}
                            onClick={() => handleMove(idx, 'down')}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Nach hinten verschieben"
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => onRemoveTimeZone(zone.id)}
                          title="Entfernen"
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Preset Packs */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Schnell-Kombinationen:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleApplyPresetPack({
                    name: 'Global Trio',
                    zones: [
                      { name: 'London', timeZone: 'Europe/London', flag: '🇬🇧' },
                      { name: 'New York', timeZone: 'America/New_York', flag: '🇺🇸' },
                      { name: 'Tokio', timeZone: 'Asia/Tokyo', flag: '🇯🇵' },
                    ],
                  })
                }
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                🌍 Klassisch (London, NY, Tokio)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPresetPack({
                    name: 'Finanzmärkte',
                    zones: [
                      { name: 'London', timeZone: 'Europe/London', flag: '🇬🇧' },
                      { name: 'Frankfurt / Berlin', timeZone: 'Europe/Berlin', flag: '🇩🇪' },
                      { name: 'New York', timeZone: 'America/New_York', flag: '🇺🇸' },
                      { name: 'Singapur', timeZone: 'Asia/Singapore', flag: '🇸🇬' },
                      { name: 'Tokio', timeZone: 'Asia/Tokyo', flag: '🇯🇵' },
                    ],
                  })
                }
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                📈 Finanzmärkte
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPresetPack({
                    name: 'USA Küste zu Küste',
                    zones: [
                      { name: 'New York', timeZone: 'America/New_York', flag: '🇺🇸' },
                      { name: 'Chicago', timeZone: 'America/Chicago', flag: '🇺🇸' },
                      { name: 'Los Angeles', timeZone: 'America/Los_Angeles', flag: '🇺🇸' },
                      { name: 'Honolulu', timeZone: 'Pacific/Honolulu', flag: '🌺' },
                    ],
                  })
                }
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                🗽 USA Zeit-Zonen
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPresetPack({
                    name: 'Asien-Pazifik',
                    zones: [
                      { name: 'Dubai', timeZone: 'Asia/Dubai', flag: '🇦🇪' },
                      { name: 'Singapur', timeZone: 'Asia/Singapore', flag: '🇸🇬' },
                      { name: 'Tokio', timeZone: 'Asia/Tokyo', flag: '🇯🇵' },
                      { name: 'Sydney', timeZone: 'Australia/Sydney', flag: '🇦🇺' },
                    ],
                  })
                }
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                🌏 Asien & Pazifik
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Weltstadt, Land oder Zeitzone suchen (z. B. Sydney, San Francisco, Tokyo, Dubai)..."
              className="w-full pl-10 pr-9 py-2.5 bg-black/40 border border-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedRegion('all')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Alle ({PRESET_WORLD_TIMEZONES.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('popular')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'popular'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              ⭐ Beliebt
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('Europa')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'Europa'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Europa
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('Nordamerika')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'Nordamerika'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Nordamerika
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('Asien')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'Asien'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Asien
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('Australien & Ozeanien')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'Australien & Ozeanien'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Australien / Pazifik
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('Naher Osten')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'Naher Osten'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Naher Osten
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('Südamerika')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'Südamerika'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Südamerika
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('Afrika')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'Afrika'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              Afrika
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('custom')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'custom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              + Eigene Stadt
            </button>
          </div>

          {/* City Catalog Grid or Custom Form */}
          {selectedRegion !== 'custom' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredPresets.map((city, idx) => {
                const isSelected = activeTimeZones.some((z) => z.timeZone === city.timeZone);
                const liveTime = formatTimeInZone(city.timeZone);
                const { offsetStr, isDayTime } = getOffsetToMain(city.timeZone);

                return (
                  <div
                    key={`${city.timeZone}-${city.name}-${idx}`}
                    onClick={() => handleToggleCity(city)}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer select-none active:scale-98 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0" role="img" aria-label="Flag">
                        {city.flag || '🌐'}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white truncate block">
                          {city.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {offsetStr ? `${offsetStr} • ` : ''}{city.region}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pl-2">
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          {isDayTime ? (
                            <Sun className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Moon className="w-3 h-3 text-indigo-300" />
                          )}
                          <span className="font-mono text-xs sm:text-sm font-bold text-white tabular-numbers">
                            {liveTime}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">
                          {city.timeZone.split('/')[1]?.replace('_', ' ') || city.timeZone}
                        </span>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPresets.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-400 space-y-2">
                  <Compass className="w-6 h-6 mx-auto text-slate-500" />
                  <p className="text-xs">Keine Stadt für &quot;{searchQuery}&quot; gefunden.</p>
                  <button
                    type="button"
                    onClick={() => setSelectedRegion('custom')}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Möchtest du diese Stadt als eigene Zeitzone anlegen?
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Custom City Creator Form */
            <form
              onSubmit={handleAddCustom}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200 block">
                  Name der Stadt oder Bezeichnung:
                </label>
                <input
                  type="text"
                  required
                  value={customCityName}
                  onChange={(e) => setCustomCityName(e.target.value)}
                  placeholder="z. B. San Francisco, Kapstadt, Büro Singapur..."
                  className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200 block">
                  Zugeordnete Weltzeitzone (IANA):
                </label>
                <select
                  value={customTimeZone}
                  onChange={(e) => setCustomTimeZone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                >
                  {PRESET_WORLD_TIMEZONES.map((p, idx) => (
                    <option key={`opt-${p.timeZone}-${idx}`} value={p.timeZone}>
                      {p.name} ({p.timeZone}) — {p.region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200 block">
                  Optionaler Zusatztext / Label:
                </label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="z. B. Kunden-Support, Familie, Projektteam..."
                  className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Preview of custom zone */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Live-Vorschau der Uhrzeit:</span>
                <span className="font-mono font-bold text-sky-400 text-sm tabular-numbers">
                  {formatTimeInZone(customTimeZone)}
                </span>
              </div>

              <button
                type="submit"
                disabled={!customCityName.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Als sekundäre Zeitzone hinzufügen</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>
            {activeTimeZones.length} {activeTimeZones.length === 1 ? 'Zeitzone' : 'Zeitzonen'} auf der Hauptuhr
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};

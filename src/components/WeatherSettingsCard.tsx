import React, { useState, useEffect } from 'react';
import {
  Sun,
  MapPin,
  ChevronRight,
  Navigation,
  Search,
  ExternalLink,
  Check,
  Thermometer,
  Droplets,
  CloudSun,
} from 'lucide-react';
import { ClockSettings, WeatherSettings, WeatherUnit, WeatherManualLocation } from '../types';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';
import { WeatherData, searchCities } from '../services/weatherService';

interface WeatherSettingsCardProps {
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onOpenWeatherModal?: () => void;
  weatherData?: WeatherData | null;
  showFeedback?: (msg: string) => void;
}

export const WeatherSettingsCard: React.FC<WeatherSettingsCardProps> = ({
  settings,
  onUpdateSettings,
  onOpenWeatherModal,
  weatherData,
  showFeedback,
}) => {
  const weather = settings.weather;
  const isEnabled = weather?.enabled ?? true;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherManualLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateConfig = (updater: Partial<WeatherSettings>) => {
    onUpdateSettings((prev) => ({
      ...prev,
      weather: {
        ...prev.weather,
        ...updater,
      },
    }));
  };

  const handleSelectCity = (city: WeatherManualLocation) => {
    updateConfig({
      autoLocation: false,
      manualLocation: city,
    });
    setShowSearchBox(false);
    setSearchQuery('');
    setSearchResults([]);
    showFeedback?.(`Standort geändert auf: ${city.name}`);
    triggerHaptic(settings.vibrationEnabled);
  };

  const handleUseGps = () => {
    updateConfig({
      autoLocation: true,
      manualLocation: undefined,
    });
    setShowSearchBox(false);
    setSearchQuery('');
    setSearchResults([]);
    showFeedback?.('Automatische Standortermittlung aktiviert');
    triggerHaptic(settings.vibrationEnabled);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">
                Wetter-Widget & Standort
              </h4>
              {isEnabled ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  {weatherData ? `${weatherData.location.name} (${weatherData.current.temperature}°)` : 'Aktiv'}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Deaktiviert
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Echtzeit-Temperatur, Wetterlage und 7-Tage-Vorhersage basierend auf Ihrem Standort
            </p>
          </div>
        </div>

        {onOpenWeatherModal && (
          <button
            type="button"
            onClick={onOpenWeatherModal}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-semibold text-sky-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
          >
            <span>Wetter-Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Enable Switch */}
      <div className="pt-2 border-t border-slate-800/80">
        <MaterialSwitch
          label="Wetter-Widget auf der Hauptuhr anzeigen"
          description="Platziert das interaktive Wetter-Widget mit Temperatur, Zustand und Ort unter dem Datum"
          checked={isEnabled}
          onChange={(v) => {
            updateConfig({ enabled: v });
            showFeedback?.(v ? 'Wetter-Widget aktiviert' : 'Wetter-Widget ausgeblendet');
            triggerHaptic(settings.vibrationEnabled);
          }}
        />
      </div>

      {isEnabled && (
        <div className="space-y-3.5 pt-1">
          {/* Temperature Unit Selector */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Thermometer className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Temperatureinheit</span>
                <span className="text-[11px] text-slate-400">Celsius (°C) oder Fahrenheit (°F)</span>
              </div>
            </div>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  updateConfig({ unit: 'celsius' });
                  triggerHaptic(settings.vibrationEnabled);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  (weather?.unit ?? 'celsius') === 'celsius'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => {
                  updateConfig({ unit: 'fahrenheit' });
                  triggerHaptic(settings.vibrationEnabled);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  (weather?.unit ?? 'celsius') === 'fahrenheit'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Location Mode Card */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Standortermittlung</span>
                  <span className="text-[11px] text-slate-400">
                    {weather?.autoLocation
                      ? 'Automatisch via GPS / IP-Netzwerk'
                      : `Feste Stadt: ${weather?.manualLocation?.name || 'Berlin'}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleUseGps}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                    weather?.autoLocation
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="GPS / Automatische Erkennung"
                >
                  <Navigation className="w-3 h-3" />
                  <span>GPS Auto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSearchBox((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    !weather?.autoLocation
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Eigene Stadt wählen"
                >
                  <span>Stadt wählen</span>
                </button>
              </div>
            </div>

            {/* City search input */}
            {showSearchBox && (
              <div className="pt-2 space-y-2 border-t border-slate-700/60 animate-in fade-in duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Stadt suchen (z. B. München, Köln, Bern, London)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-lg bg-slate-900 border border-slate-700 divide-y divide-slate-800 text-xs">
                    {searchResults.map((city, idx) => (
                      <button
                        key={`${city.name}-${city.latitude}-${idx}`}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="text-white font-medium">
                          {city.name}
                          {city.country && <span className="text-slate-400 ml-1">, {city.country}</span>}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {city.latitude.toFixed(1)}°, {city.longitude.toFixed(1)}°
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sub-switches for Clock Display */}
          <div className="space-y-1 divide-y divide-slate-800/60">
            <MaterialSwitch
              label="Wetterlage als Text ausschreiben"
              description='Zeigt Begriffe wie "Klarer Himmel", "Teils bewölkt" oder "Leichter Regen" im Widget'
              checked={weather?.showConditionText ?? true}
              onChange={(v) => {
                updateConfig({ showConditionText: v });
                triggerHaptic(settings.vibrationEnabled);
              }}
            />

            <MaterialSwitch
              label="Min/Max & Regenwahrscheinlichkeit auf der Uhr"
              description="Blendet die heutigen Höchst-/Tiefstwerte und Regen-% direkt auf der Uhr ein"
              checked={weather?.showDetailsOnClock ?? true}
              onChange={(v) => {
                updateConfig({ showDetailsOnClock: v });
                triggerHaptic(settings.vibrationEnabled);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

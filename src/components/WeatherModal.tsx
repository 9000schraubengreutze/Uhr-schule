import React, { useState } from 'react';
import {
  X,
  MapPin,
  RefreshCw,
  Wind,
  Droplets,
  Thermometer,
  CloudRain,
  Search,
  Check,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
} from 'lucide-react';
import {
  WeatherData,
  LocationCoords,
  getWeatherConditionInfo,
  searchCities,
} from '../utils/weather';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectLocation: (loc: LocationCoords) => void;
  onDetectLocation: () => void;
  unit: 'celsius' | 'fahrenheit';
  onToggleUnit: (unit: 'celsius' | 'fahrenheit') => void;
  backdropBlur?: number;
}

export function renderWeatherIcon(iconName: string, className: string = 'w-5 h-5') {
  switch (iconName) {
    case 'sun':
      return <Sun className={`${className} text-amber-400`} />;
    case 'moon':
      return <Moon className={`${className} text-indigo-300`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-amber-300`} />;
    case 'cloud-moon':
      return <CloudMoon className={`${className} text-indigo-200`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-300`} />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-400`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-300`} />;
    case 'rain':
      return <CloudRain className={`${className} text-blue-400`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-cyan-200`} />;
    case 'thunder':
      return <CloudLightning className={`${className} text-amber-400 animate-pulse`} />;
    default:
      return <Sun className={`${className} text-amber-400`} />;
  }
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  isLoading,
  onRefresh,
  onSelectLocation,
  onDetectLocation,
  unit,
  onToggleUnit,
  backdropBlur = 16,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationCoords[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  if (!isOpen) return null;

  const condInfo = weather ? getWeatherConditionInfo(weather.weatherCode, weather.isDay) : null;
  const tempUnitSymbol = unit === 'fahrenheit' ? '°F' : '°C';
  const windUnitSymbol = unit === 'fahrenheit' ? 'mph' : 'km/h';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchCities(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickCity = (city: LocationCoords) => {
    onSelectLocation(city);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div
      id="weather-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="weather-modal-card"
        style={{
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
        className="relative w-full max-w-lg bg-slate-900/90 border border-white/15 text-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                {weather?.cityName || 'Lokales Wetter'}
                {weather?.countryName && (
                  <span className="text-xs font-normal text-slate-400">({weather.countryName})</span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {weather?.updatedAt
                  ? `Zuletzt aktualisiert: ${new Date(weather.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} Uhr`
                  : 'Aktuelle Wetterbedingungen'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Refresh button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Wetter aktualisieren"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              title="Schließen"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Main Weather Hero Card */}
          {weather && condInfo ? (
            <div className="relative rounded-2xl p-5 bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 shadow-inner">
                  {renderWeatherIcon(condInfo.iconName, 'w-10 h-10')}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white tabular-numbers">
                      {weather.temperature}
                      <span className="text-2xl font-light text-sky-400 ml-0.5">{tempUnitSymbol}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Gefühlt {weather.apparentTemperature}{tempUnitSymbol}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-200 mt-1">
                    {condInfo.labelDe}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    H: {weather.maxTemp}{tempUnitSymbol} &nbsp;•&nbsp; T: {weather.minTemp}{tempUnitSymbol}
                  </div>
                </div>
              </div>

              {/* Unit Switcher */}
              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => onToggleUnit('celsius')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    unit === 'celsius'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => onToggleUnit('fahrenheit')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    unit === 'fahrenheit'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 rounded-2xl bg-white/5 border border-white/10">
              {isLoading ? 'Lade Wetterdaten...' : 'Keine Wetterdaten verfügbar.'}
            </div>
          )}

          {/* Key Metrics Grid */}
          {weather && (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                <Wind className="w-4 h-4 text-sky-400 mb-1" />
                <span className="text-[11px] text-slate-400">Wind</span>
                <span className="text-sm font-bold text-white mt-0.5 tabular-numbers">
                  {weather.windSpeed} <span className="text-[10px] font-normal text-slate-400">{windUnitSymbol}</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                <Droplets className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-[11px] text-slate-400">Feuchtigkeit</span>
                <span className="text-sm font-bold text-white mt-0.5 tabular-numbers">
                  {weather.humidity}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                <CloudRain className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[11px] text-slate-400">Niederschlag</span>
                <span className="text-sm font-bold text-white mt-0.5 tabular-numbers">
                  {weather.precipitation} <span className="text-[10px] font-normal text-slate-400">mm</span>
                </span>
              </div>
            </div>
          )}

          {/* Hourly Forecast (next 12 hours) */}
          {weather && weather.hourly && weather.hourly.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                12-Stunden-Vorhersage
              </h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {weather.hourly.map((h, i) => {
                  const hInfo = getWeatherConditionInfo(h.weatherCode, h.isDay);
                  return (
                    <div
                      key={`hour-${i}-${h.timeStr}`}
                      className="flex-shrink-0 flex flex-col items-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 min-w-[62px] text-center transition-all"
                    >
                      <span className="text-[11px] text-slate-400 font-mono">{h.timeStr}</span>
                      <div className="my-1.5">
                        {renderWeatherIcon(hInfo.iconName, 'w-4 h-4')}
                      </div>
                      <span className="text-xs font-bold text-white tabular-numbers">
                        {h.temp}°
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Actions / Search Drawer */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Standort-Optionen</span>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                {showSearch ? 'Schließen' : 'Stadt manuell suchen'}
              </button>
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              type="button"
              onClick={onDetectLocation}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer active:scale-98"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Eigenen Standort per GPS neu ermitteln</span>
            </button>

            {/* Manual City Search Form */}
            {showSearch && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="z. B. München, Hamburg, Wien, Zürich..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/40 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {isSearching ? '...' : 'Suchen'}
                  </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((city, idx) => (
                      <button
                        key={`city-res-${idx}`}
                        type="button"
                        onClick={() => handlePickCity(city)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
                      >
                        <span className="font-medium">{city.cityName}</span>
                        <span className="text-[11px] text-slate-400">{city.countryName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

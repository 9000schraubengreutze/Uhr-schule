import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  MapPin,
  Search,
  Navigation,
  Droplets,
  Wind,
  Sun,
  Sunrise,
  Sunset,
  Gauge,
  Thermometer,
  CloudRain,
  Compass,
  Check,
  Calendar,
} from 'lucide-react';
import { WeatherData, searchCities } from '../services/weatherService';
import { WeatherSettings, WeatherUnit, WeatherManualLocation } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  weatherSettings: WeatherSettings;
  onUpdateWeatherSettings: (updater: (prev: WeatherSettings) => WeatherSettings) => void;
  backdropBlur?: number;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weatherData,
  isLoading,
  isRefreshing,
  error,
  onRefresh,
  weatherSettings,
  onUpdateWeatherSettings,
  backdropBlur = 16,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherManualLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // Close on Escape key
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

  if (!isOpen) return null;

  const unit = weatherSettings.unit;
  const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

  const handleSelectCity = (city: WeatherManualLocation) => {
    onUpdateWeatherSettings((prev) => ({
      ...prev,
      autoLocation: false,
      manualLocation: city,
    }));
    setShowLocationSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUseGps = () => {
    onUpdateWeatherSettings((prev) => ({
      ...prev,
      autoLocation: true,
      manualLocation: undefined,
    }));
    setShowLocationSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleToggleUnit = (newUnit: WeatherUnit) => {
    if (newUnit === unit) return;
    onUpdateWeatherSettings((prev) => ({
      ...prev,
      unit: newUnit,
    }));
  };

  // Helper for UV index level
  const getUvLevel = (uv: number): { label: string; color: string } => {
    if (uv <= 2) return { label: 'Niedrig', color: 'text-emerald-400' };
    if (uv <= 5) return { label: 'Mäßig', color: 'text-yellow-400' };
    if (uv <= 7) return { label: 'Hoch', color: 'text-amber-400' };
    if (uv <= 10) return { label: 'Sehr hoch', color: 'text-rose-400' };
    return { label: 'Extrem', color: 'text-purple-400' };
  };

  const current = weatherData?.current;
  const location = weatherData?.location;
  const hourly = weatherData?.hourly || [];
  const daily = weatherData?.daily || [];
  const today = daily[0];

  return (
    <div
      id="weather-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="weather-modal-panel"
        style={{
          backdropFilter: `blur(${Math.max(16, backdropBlur)}px)`,
          WebkitBackdropFilter: `blur(${Math.max(16, backdropBlur)}px)`,
        }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-950/85 border border-white/15 shadow-2xl shadow-black/80 text-slate-100 overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Wetter & Vorhersage
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3 h-3 text-sky-400" />
                <span className="font-medium text-slate-300">
                  {location ? `${location.name}${location.country ? `, ${location.country}` : ''}` : 'Standort wird ermittelt...'}
                </span>
                {weatherSettings.autoLocation ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 font-medium">
                    Auto-GPS
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                    Manuell
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* °C / °F Selector */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleToggleUnit('celsius')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  unit === 'celsius'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => handleToggleUnit('fahrenheit')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  unit === 'fahrenheit'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                °F
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Wetterdaten jetzt neu laden"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Schließen (Esc)"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-900/60 border border-slate-700/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location selector toggle button / search box */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-900/60 border-b border-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              {weatherSettings.autoLocation
                ? 'Standort wird automatisch anhand Ihres Browsers/Netzwerks ermittelt.'
                : `Manueller Standort gewählt: ${weatherSettings.manualLocation?.name || 'Berlin'}`}
            </span>
            <button
              type="button"
              onClick={() => setShowLocationSearch((prev) => !prev)}
              className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 cursor-pointer shrink-0"
            >
              {showLocationSearch ? 'Suche ausblenden' : 'Stadt ändern...'}
            </button>
          </div>

          {/* Expandable Location Search Box */}
          {showLocationSearch && (
            <div className="pt-2 pb-1 space-y-2 animate-in fade-in duration-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Stadt eingeben (z. B. Hamburg, Wien, Zürich, New York)..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleUseGps}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    weatherSettings.autoLocation
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="GPS / Automatischen Standort verwenden"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Mein GPS</span>
                </button>
              </div>

              {/* Search Results Dropdown List */}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 divide-y divide-slate-800 text-xs">
                  {searchResults.map((city, idx) => (
                    <button
                      key={`${city.name}-${city.latitude}-${idx}`}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-white">{city.name}</span>
                        {city.admin1 && <span className="text-slate-400 ml-1.5 text-[11px]">({city.admin1})</span>}
                        {city.country && <span className="text-slate-400 ml-1.5">, {city.country}</span>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Body: Scrollable weather content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={onRefresh}
                className="px-2.5 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-medium cursor-pointer"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Hero Weather Card */}
          {current && (
            <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 shadow-xl">
              {/* Subtle ambient glow behind icon */}
              <div className="absolute top-2 right-4 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
                    <WeatherIcon weatherCode={current.weatherCode} isDay={current.isDay} className="w-12 h-12 sm:w-16 sm:h-16" />
                  </div>
                  <div>
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-numbers flex items-baseline">
                      {current.temperature}
                      <span className="text-2xl sm:text-3xl font-light text-slate-300 ml-1">{unitSymbol}</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-slate-200 mt-0.5">
                      {current.conditionText}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Gefühlt wie <strong className="text-slate-200 font-semibold">{current.apparentTemperature}{unitSymbol}</strong></span>
                      {today && (
                        <>
                          <span>•</span>
                          <span className="text-rose-300">Max: {today.tempMax}°</span>
                          <span>•</span>
                          <span className="text-sky-300">Min: {today.tempMin}°</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & timestamp right block */}
                <div className="text-left sm:text-right self-stretch sm:self-center border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                  <div className="text-xs text-slate-400">Aktualisiert</div>
                  <div className="text-xs font-mono font-medium text-slate-300 mt-0.5">
                    {new Date(weatherData.lastUpdated).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                  </div>
                  <div className="text-[11px] text-sky-400 font-medium mt-1">
                    Open-Meteo Satellit & DWD
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Grid (Humidity, Wind, UV, Precipitation, Pressure, Sunrise/Sunset) */}
          {current && today && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Wetter-Details & Messwerte
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                {/* Luftfeuchtigkeit */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>Luftfeuchte</span>
                    <Droplets className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-lg font-bold text-white tabular-numbers">
                    {current.humidity}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {current.humidity > 65 ? 'Feucht' : current.humidity < 35 ? 'Trocken' : 'Optimal'}
                  </div>
                </div>

                {/* Wind */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>Wind</span>
                    <Wind className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-lg font-bold text-white tabular-numbers">
                    {current.windSpeed} <span className="text-xs font-normal text-slate-300">km/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-teal-300" />
                    <span>Richtung: {current.windDirectionText} ({current.windDirection}°)</span>
                  </div>
                </div>

                {/* UV-Index */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>UV-Index</span>
                    <Sun className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-white tabular-numbers">
                    {today.uvIndexMax}
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${getUvLevel(today.uvIndexMax).color}`}>
                    {getUvLevel(today.uvIndexMax).label}
                  </div>
                </div>

                {/* Niederschlag / Regenwahrscheinlichkeit */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>Regenrisiko</span>
                    <CloudRain className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-white tabular-numbers">
                    {today.precipitationProbability}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {current.precipitation > 0 ? `${current.precipitation} mm aktuell` : 'Kein Niederschlag'}
                  </div>
                </div>

                {/* Luftdruck */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>Luftdruck</span>
                    <Gauge className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-lg font-bold text-white tabular-numbers">
                    {current.pressure} <span className="text-xs font-normal text-slate-300">hPa</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {current.pressure >= 1013 ? 'Hochdruck' : 'Tiefdruck'}
                  </div>
                </div>

                {/* Sonnenaufgang */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>Sonnenaufgang</span>
                    <Sunrise className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {today.sunrise}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Morgendämmerung</div>
                </div>

                {/* Sonnenuntergang */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>Sonnenuntergang</span>
                    <Sunset className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {today.sunset}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Abenddämmerung</div>
                </div>

                {/* Temperaturspanne heute */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>Tages-Spanne</span>
                    <Thermometer className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="text-rose-300">{today.tempMax}{unitSymbol}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-sky-300">{today.tempMin}{unitSymbol}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Delta: {today.tempMax - today.tempMin}°
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hourly Forecast (24 Hours horizontal scroll) */}
          {hourly.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Stündliche Vorhersage (Nächste 24 Stunden)</span>
                <span className="text-[11px] font-normal text-slate-500">Nach rechts wischen ➔</span>
              </h3>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {hourly.map((hour, idx) => (
                  <div
                    key={`${hour.time}-${idx}`}
                    className={`shrink-0 w-20 p-3 rounded-2xl flex flex-col items-center justify-between gap-1.5 border text-center transition-all ${
                      idx === 0
                        ? 'bg-sky-500/15 border-sky-400/35 shadow-md shadow-sky-500/10'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <span className="text-xs font-mono font-medium text-slate-300">
                      {idx === 0 ? 'Jetzt' : hour.timeFormatted}
                    </span>
                    <div className="my-1">
                      <WeatherIcon weatherCode={hour.weatherCode} isDay={hour.isDay} className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-white tabular-numbers">
                      {hour.temperature}°
                    </span>
                    {hour.precipitationProbability > 0 ? (
                      <span className="text-[10px] font-medium text-sky-400 flex items-center gap-0.5">
                        <Droplets className="w-2.5 h-2.5" />
                        {hour.precipitationProbability}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">-</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Forecast */}
          {daily.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>7-Tage Wettervorhersage</span>
              </h3>
              <div className="rounded-2xl bg-slate-900/60 border border-white/5 divide-y divide-white/5 overflow-hidden">
                {daily.map((day, idx) => (
                  <div
                    key={`${day.date}-${idx}`}
                    className="p-3 sm:px-4 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Day name & Date */}
                    <div className="w-24 sm:w-28 shrink-0">
                      <div className="font-semibold text-white">{day.dayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>

                    {/* Condition Icon & Text */}
                    <div className="flex items-center gap-2 flex-1 px-2">
                      <WeatherIcon weatherCode={day.weatherCode} isDay={true} className="w-5 h-5 shrink-0" />
                      <span className="hidden sm:inline text-slate-300 truncate max-w-[150px]">
                        {day.conditionText}
                      </span>
                      {day.precipitationProbability > 0 && (
                        <span className="text-[10px] text-sky-400 flex items-center gap-0.5 font-medium ml-1">
                          <Droplets className="w-3 h-3" />
                          {day.precipitationProbability}%
                        </span>
                      )}
                    </div>

                    {/* Min & Max with Visual Bar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-8 text-right font-mono text-sky-300 font-medium">
                        {day.tempMin}°
                      </span>
                      {/* Mini temperature bar */}
                      <div className="w-16 sm:w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-rose-400"
                          style={{
                            width: '100%',
                          }}
                        />
                      </div>
                      <span className="w-8 text-left font-mono text-rose-300 font-bold">
                        {day.tempMax}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 sm:px-6 py-3 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Powered by</span>
            <span className="font-semibold text-sky-300">Open-Meteo</span>
            <span>• Keine API-Schlüssel nötig</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};

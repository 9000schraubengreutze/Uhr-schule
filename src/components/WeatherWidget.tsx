import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import {
  WeatherData,
  LocationCoords,
  getCurrentUserLocation,
  fetchCurrentWeather,
  getCachedWeather,
  getCachedLocation,
  getWeatherConditionInfo,
  saveCachedLocation,
} from '../utils/weather';
import { WeatherModal, renderWeatherIcon } from './WeatherModal';

interface WeatherWidgetProps {
  unit?: 'celsius' | 'fahrenheit';
  onUnitChange?: (unit: 'celsius' | 'fahrenheit') => void;
  backdropBlur?: number;
  textColor?: string;
  accentColor?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  unit = 'celsius',
  onUnitChange,
  backdropBlur = 16,
  textColor,
  accentColor = '#38bdf8',
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(() => getCachedWeather());
  const [location, setLocation] = useState<LocationCoords | null>(() => getCachedLocation());
  const [isLoading, setIsLoading] = useState<boolean>(!weather);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch weather data for the given coordinates
  const loadWeather = useCallback(
    async (coords: LocationCoords, currentUnit: 'celsius' | 'fahrenheit') => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCurrentWeather(coords, currentUnit);
        setWeather(data);
      } catch (err: any) {
        console.warn('Weather fetch error:', err);
        setError(err?.message || 'Wetterdaten konnten nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Detect user GPS location and load weather
  const detectAndLoad = useCallback(
    async (currentUnit?: 'celsius' | 'fahrenheit') => {
      const activeUnit: 'celsius' | 'fahrenheit' =
        currentUnit === 'fahrenheit' || unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
      setIsLoading(true);
      setError(null);
      try {
        const userLoc = await getCurrentUserLocation();
        setLocation(userLoc);
        saveCachedLocation(userLoc);
        await loadWeather(userLoc, activeUnit);
      } catch (err: any) {
        console.warn('Location detection error:', err);
        setError('Standort konnte nicht ermittelt werden');
        setIsLoading(false);
      }
    },
    [loadWeather, unit]
  );

  // Initial load on mount
  useEffect(() => {
    if (location) {
      loadWeather(location, unit);
    } else {
      detectAndLoad(unit);
    }

    // Refresh weather every 15 minutes
    const interval = setInterval(() => {
      if (location) {
        loadWeather(location, unit);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Re-fetch when unit changes
  useEffect(() => {
    if (location && weather && weather.unit !== unit) {
      loadWeather(location, unit);
    }
  }, [unit, location, loadWeather]);

  const handleSelectLocation = (newLoc: LocationCoords) => {
    setLocation(newLoc);
    saveCachedLocation(newLoc);
    loadWeather(newLoc, unit);
  };

  const handleRefresh = () => {
    if (location) {
      loadWeather(location, unit);
    } else {
      detectAndLoad(unit);
    }
  };

  const handleUnitToggle = (newUnit: 'celsius' | 'fahrenheit') => {
    if (onUnitChange) {
      onUnitChange(newUnit);
    }
    if (location) {
      loadWeather(location, newUnit);
    }
  };

  const condInfo = weather ? getWeatherConditionInfo(weather.weatherCode, weather.isDay) : null;
  const tempUnitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

  const widgetStyle = {
    backdropFilter: `blur(${backdropBlur}px)`,
    WebkitBackdropFilter: `blur(${backdropBlur}px)`,
    color: textColor || 'inherit',
  };

  return (
    <>
      <motion.div
        id="weather-display-main"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mt-3 sm:mt-4 flex items-center justify-center select-none"
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Klicken für detaillierte 12-Stunden-Wettervorhersage & Ortssuche"
          aria-label="Wetterdetails öffnen"
          style={widgetStyle}
          className="group inline-flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 active:scale-98 border border-white/10 hover:border-white/20 shadow-lg text-slate-200 hover:text-white transition-all cursor-pointer font-sans"
        >
          {isLoading && !weather ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-0.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Ermittle lokales Wetter...</span>
            </div>
          ) : error && !weather ? (
            <div className="flex items-center gap-2 text-xs text-rose-300 py-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Wetter nicht verfügbar (Klick zum Wiederholen)</span>
            </div>
          ) : weather && condInfo ? (
            <>
              {/* Weather Condition Icon */}
              <div className="flex-shrink-0 transition-transform group-hover:scale-110 duration-200">
                {renderWeatherIcon(condInfo.iconName, 'w-4 h-4 sm:w-5 sm:h-5')}
              </div>

              {/* Current Temperature & Condition */}
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white tabular-numbers">
                  {weather.temperature}
                  <span className="text-xs font-medium text-sky-400 ml-0.5">{tempUnitSymbol}</span>
                </span>

                <span className="text-xs font-normal text-slate-300 hidden min-[420px]:inline">
                  • {condInfo.labelDe}
                </span>
              </div>

              {/* Location Name */}
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-300/90 pl-1 border-l border-white/15">
                <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                <span className="truncate max-w-[110px] sm:max-w-[150px]">
                  {weather.cityName}
                </span>
              </div>

              {/* Day Min / Max indicator */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <span>H:{weather.maxTemp}°</span>
                <span>T:{weather.minTemp}°</span>
              </div>
            </>
          ) : null}
        </button>
      </motion.div>

      {/* Detailed Weather Modal */}
      <WeatherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weather={weather}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onSelectLocation={handleSelectLocation}
        onDetectLocation={() => detectAndLoad(unit)}
        unit={unit}
        onToggleUnit={handleUnitToggle}
        backdropBlur={backdropBlur}
      />
    </>
  );
};

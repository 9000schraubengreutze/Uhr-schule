import { useState, useEffect, useCallback, useRef } from 'react';
import { ClockSettings, WeatherSettings, WeatherManualLocation } from '../types';
import {
  WeatherData,
  WeatherLocationInfo,
  detectUserLocation,
  fetchWeatherData,
} from '../services/weatherService';

interface UseWeatherProps {
  settings: ClockSettings;
  onShowFeedback?: (msg: string) => void;
}

export function useWeather({ settings, onShowFeedback }: UseWeatherProps) {
  const weatherConfig = settings.weather;
  const isEnabled = weatherConfig?.enabled ?? true;
  const unit = weatherConfig?.unit ?? 'celsius';
  const autoLocation = weatherConfig?.autoLocation ?? true;
  const manualLocation = weatherConfig?.manualLocation;

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<WeatherLocationInfo | null>(null);

  const prevConfigRef = useRef<string>('');

  // Resolve current target location
  const resolveLocation = useCallback(async (): Promise<WeatherLocationInfo> => {
    if (!autoLocation && manualLocation) {
      return {
        name: manualLocation.name,
        country: manualLocation.country,
        admin1: manualLocation.admin1,
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
        isAutoDetected: false,
        source: 'manual',
      };
    }

    return await detectUserLocation();
  }, [autoLocation, manualLocation]);

  const refreshWeather = useCallback(
    async (force = false) => {
      if (!isEnabled) return;

      setIsLoading((prev) => (weatherData ? prev : true));
      setIsRefreshing(true);
      setError(null);

      try {
        const loc = await resolveLocation();
        setActiveLocation(loc);

        const data = await fetchWeatherData(loc, unit, force);
        setWeatherData(data);
        setError(null);
      } catch (err: any) {
        console.warn('Weather fetch failed:', err);
        setError(err?.message || 'Wetterdaten konnten nicht geladen werden');
        if (force) {
          onShowFeedback?.('Wetter-Aktualisierung fehlgeschlagen');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isEnabled, resolveLocation, unit, weatherData, onShowFeedback]
  );

  // Trigger load when settings change (location, unit, enabled)
  useEffect(() => {
    const configKey = `${isEnabled}-${autoLocation}-${manualLocation?.latitude}-${manualLocation?.longitude}-${unit}`;
    if (prevConfigRef.current !== configKey) {
      prevConfigRef.current = configKey;
      refreshWeather(false);
    }
  }, [isEnabled, autoLocation, manualLocation, unit, refreshWeather]);

  // Periodic background refresh every 20 minutes
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      refreshWeather(false);
    }, 20 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshWeather(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, refreshWeather]);

  return {
    weatherData,
    isLoading,
    isRefreshing,
    error,
    activeLocation,
    refreshWeather: () => refreshWeather(true),
  };
}

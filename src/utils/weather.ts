// ─────────────────────────────────────────────────────────────
// WEATHER UTILS & OPEN-METEO API INTEGRATION
// Free, fast, high-accuracy weather forecasting without API keys
// ─────────────────────────────────────────────────────────────

export interface LocationCoords {
  latitude: number;
  longitude: number;
  cityName: string;
  countryName?: string;
  isCustom?: boolean;
}

export interface HourlyForecastPoint {
  timeStr: string; // e.g. "14:00"
  temp: number;
  weatherCode: number;
  isDay: boolean;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  minTemp: number;
  maxTemp: number;
  cityName: string;
  countryName?: string;
  updatedAt: string; // ISO
  hourly: HourlyForecastPoint[];
  unit: 'celsius' | 'fahrenheit';
}

export interface WeatherConditionInfo {
  labelDe: string;
  labelEn: string;
  iconName: 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder';
}

const DEFAULT_FALLBACK_LOCATION: LocationCoords = {
  latitude: 52.52,
  longitude: 13.405,
  cityName: 'Berlin',
  countryName: 'Deutschland',
};

const WEATHER_CACHE_KEY = 'webclock_weather_cache_v1';
const LOCATION_CACHE_KEY = 'webclock_location_cache_v1';

/**
 * Maps WMO weather interpretation code to German/English description and icon type
 */
export function getWeatherConditionInfo(code: number, isDay: boolean = true): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        labelDe: isDay ? 'Sonnig' : 'Klar',
        labelEn: isDay ? 'Sunny' : 'Clear',
        iconName: isDay ? 'sun' : 'moon',
      };
    case 1:
      return {
        labelDe: isDay ? 'Überwiegend sonnig' : 'Überwiegend klar',
        labelEn: isDay ? 'Mostly Sunny' : 'Mostly Clear',
        iconName: isDay ? 'cloud-sun' : 'cloud-moon',
      };
    case 2:
      return {
        labelDe: 'Teilweise bewölkt',
        labelEn: 'Partly Cloudy',
        iconName: isDay ? 'cloud-sun' : 'cloud-moon',
      };
    case 3:
      return {
        labelDe: 'Bedeckt',
        labelEn: 'Overcast',
        iconName: 'cloud',
      };
    case 45:
    case 48:
      return {
        labelDe: 'Nebel',
        labelEn: 'Foggy',
        iconName: 'fog',
      };
    case 51:
    case 53:
    case 55:
      return {
        labelDe: 'Nieselregen',
        labelEn: 'Drizzle',
        iconName: 'drizzle',
      };
    case 56:
    case 57:
      return {
        labelDe: 'Gefrierender Niesel',
        labelEn: 'Freezing Drizzle',
        iconName: 'drizzle',
      };
    case 61:
      return {
        labelDe: 'Leichter Regen',
        labelEn: 'Light Rain',
        iconName: 'rain',
      };
    case 63:
      return {
        labelDe: 'Mäßiger Regen',
        labelEn: 'Moderate Rain',
        iconName: 'rain',
      };
    case 65:
      return {
        labelDe: 'Starker Regen',
        labelEn: 'Heavy Rain',
        iconName: 'rain',
      };
    case 66:
    case 67:
      return {
        labelDe: 'Gefrierender Regen',
        labelEn: 'Freezing Rain',
        iconName: 'rain',
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        labelDe: 'Schneefall',
        labelEn: 'Snowfall',
        iconName: 'snow',
      };
    case 80:
    case 81:
    case 82:
      return {
        labelDe: 'Regenschauer',
        labelEn: 'Rain Showers',
        iconName: 'rain',
      };
    case 85:
    case 86:
      return {
        labelDe: 'Schneeschauer',
        labelEn: 'Snow Showers',
        iconName: 'snow',
      };
    case 95:
      return {
        labelDe: 'Gewitter',
        labelEn: 'Thunderstorm',
        iconName: 'thunder',
      };
    case 96:
    case 99:
      return {
        labelDe: 'Gewitter mit Hagel',
        labelEn: 'Thunderstorm with Hail',
        iconName: 'thunder',
      };
    default:
      return {
        labelDe: 'Bewölkt',
        labelEn: 'Cloudy',
        iconName: 'cloud',
      };
  }
}

/**
 * Load cached location from localStorage
 */
export function getCachedLocation(): LocationCoords | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save location to cache
 */
export function saveCachedLocation(loc: LocationCoords): void {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(loc));
  } catch (err) {
    console.warn('Failed to cache location', err);
  }
}

/**
 * Load cached weather data
 */
export function getCachedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save weather to cache
 */
export function saveCachedWeather(data: WeatherData): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to cache weather data', err);
  }
}

/**
 * Reverse geocode latitude and longitude to human-readable city name
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ cityName: string; countryName?: string }> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=de`
    );
    if (res.ok) {
      const data = await res.json();
      const cityName = data.city || data.locality || data.principalSubdivision || 'Lokaler Standort';
      const countryName = data.countryName || '';
      return { cityName, countryName };
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode failed, trying OpenStreetMap', err);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=de`
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Lokaler Standort';
      const countryName = addr.country || '';
      return { cityName, countryName };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed', err);
  }

  return { cityName: 'Mein Standort' };
}

/**
 * Acquire user position via browser Geolocation API with graceful fallback
 */
export function getCurrentUserLocation(): Promise<LocationCoords> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      const cached = getCachedLocation();
      resolve(cached || DEFAULT_FALLBACK_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));

        const geo = await reverseGeocode(lat, lon);
        const loc: LocationCoords = {
          latitude: lat,
          longitude: lon,
          cityName: geo.cityName,
          countryName: geo.countryName,
        };

        saveCachedLocation(loc);
        resolve(loc);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable, using fallback', err);
        const cached = getCachedLocation();
        resolve(cached || DEFAULT_FALLBACK_LOCATION);
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 600000 }
    );
  });
}

/**
 * Search city coordinates using Open-Meteo Geocoding API
 */
export async function searchCities(query: string): Promise<LocationCoords[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query.trim()
      )}&count=5&language=de&format=json`
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: any) => ({
      latitude: Number(r.latitude.toFixed(4)),
      longitude: Number(r.longitude.toFixed(4)),
      cityName: r.name + (r.admin1 ? `, ${r.admin1}` : ''),
      countryName: r.country || '',
      isCustom: true,
    }));
  } catch (err) {
    console.warn('City search failed', err);
    return [];
  }
}

/**
 * Fetch current weather + 12-hour forecast from Open-Meteo
 */
export async function fetchCurrentWeather(
  coords: LocationCoords,
  unit: 'celsius' | 'fahrenheit' = 'celsius'
): Promise<WeatherData> {
  const tempUnitParam = unit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
  const windUnitParam = unit === 'fahrenheit' ? '&wind_speed_unit=mph' : '';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,is_day&forecast_days=2&timezone=auto${tempUnitParam}${windUnitParam}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Wetterabfrage fehlgeschlagen (HTTP ${res.status})`);
  }

  const data = await res.json();
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  // Process next 12 hours forecast
  const now = new Date();
  const currentHourIsoPrefix = now.toISOString().slice(0, 13); // e.g. "2026-09-13T10"
  let startIndex = 0;

  if (hourly?.time && Array.isArray(hourly.time)) {
    const idx = hourly.time.findIndex((t: string) => t.startsWith(currentHourIsoPrefix));
    if (idx !== -1) startIndex = idx;
  }

  const hourlyPoints: HourlyForecastPoint[] = [];
  if (hourly?.time && Array.isArray(hourly.time)) {
    for (let i = startIndex; i < Math.min(startIndex + 12, hourly.time.length); i++) {
      const timeRaw = hourly.time[i];
      const hourPart = timeRaw.split('T')[1]?.slice(0, 5) || '';
      hourlyPoints.push({
        timeStr: hourPart,
        temp: Math.round(hourly.temperature_2m?.[i] ?? 0),
        weatherCode: hourly.weather_code?.[i] ?? 0,
        isDay: Boolean(hourly.is_day?.[i] ?? 1),
      });
    }
  }

  const result: WeatherData = {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    precipitation: current.precipitation ?? 0,
    weatherCode: current.weather_code ?? 0,
    isDay: Boolean(current.is_day),
    minTemp: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature_2m),
    maxTemp: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature_2m),
    cityName: coords.cityName,
    countryName: coords.countryName,
    updatedAt: new Date().toISOString(),
    hourly: hourlyPoints,
    unit,
  };

  saveCachedWeather(result);
  return result;
}

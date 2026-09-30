import { WeatherUnit, WeatherManualLocation } from '../types';

export interface WeatherCurrent {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  conditionText: string;
  isDay: boolean;
  windSpeed: number;
  windDirection: number;
  windDirectionText: string;
  pressure: number;
  uvIndex: number;
}

export interface WeatherHourly {
  time: string; // ISO string
  timeFormatted: string; // '14:00'
  temperature: number;
  weatherCode: number;
  conditionText: string;
  precipitationProbability: number;
  isDay: boolean;
}

export interface WeatherDaily {
  date: string; // '2026-09-30'
  dayName: string; // 'Heute', 'Morgen', 'Donnerstag', etc.
  weatherCode: number;
  conditionText: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface WeatherLocationInfo {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  isAutoDetected: boolean;
  source: 'gps' | 'ip' | 'manual' | 'fallback';
}

export interface WeatherData {
  location: WeatherLocationInfo;
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  unit: WeatherUnit;
  lastUpdated: number;
}

export interface WeatherConditionInfo {
  code: number;
  label: string;
  iconName: 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  badgeColor: string; // Tailwind color class or hex
}

// WMO Weather Interpretation Codes
export function getWeatherConditionInfo(code: number, isDay = true): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        code,
        label: isDay ? 'Klarer Himmel' : 'Klare Nacht',
        iconName: isDay ? 'sun' : 'moon',
        badgeColor: isDay ? 'text-amber-400' : 'text-indigo-300',
      };
    case 1:
      return {
        code,
        label: isDay ? 'Überwiegend sonnig' : 'Überwiegend klar',
        iconName: isDay ? 'cloud-sun' : 'cloud-moon',
        badgeColor: isDay ? 'text-amber-300' : 'text-indigo-300',
      };
    case 2:
      return {
        code,
        label: 'Teilweise bewölkt',
        iconName: isDay ? 'cloud-sun' : 'cloud-moon',
        badgeColor: 'text-sky-300',
      };
    case 3:
      return {
        code,
        label: 'Bedeckt',
        iconName: 'cloud',
        badgeColor: 'text-slate-300',
      };
    case 45:
      return {
        code,
        label: 'Nebel',
        iconName: 'fog',
        badgeColor: 'text-slate-400',
      };
    case 48:
      return {
        code,
        label: 'Reifnebel',
        iconName: 'fog',
        badgeColor: 'text-teal-300',
      };
    case 51:
      return {
        code,
        label: 'Leichter Nieselregen',
        iconName: 'drizzle',
        badgeColor: 'text-sky-400',
      };
    case 53:
      return {
        code,
        label: 'Mäßiger Nieselregen',
        iconName: 'drizzle',
        badgeColor: 'text-sky-400',
      };
    case 55:
      return {
        code,
        label: 'Dichter Nieselregen',
        iconName: 'drizzle',
        badgeColor: 'text-blue-400',
      };
    case 56:
    case 57:
      return {
        code,
        label: 'Gefrierender Niesel',
        iconName: 'drizzle',
        badgeColor: 'text-cyan-300',
      };
    case 61:
      return {
        code,
        label: 'Leichter Regen',
        iconName: 'rain',
        badgeColor: 'text-blue-400',
      };
    case 63:
      return {
        code,
        label: 'Mäßiger Regen',
        iconName: 'rain',
        badgeColor: 'text-blue-500',
      };
    case 65:
      return {
        code,
        label: 'Starker Regen',
        iconName: 'rain',
        badgeColor: 'text-blue-600',
      };
    case 66:
    case 67:
      return {
        code,
        label: 'Gefrierender Regen',
        iconName: 'snow',
        badgeColor: 'text-cyan-400',
      };
    case 71:
      return {
        code,
        label: 'Leichter Schneefall',
        iconName: 'snow',
        badgeColor: 'text-sky-200',
      };
    case 73:
      return {
        code,
        label: 'Mäßiger Schneefall',
        iconName: 'snow',
        badgeColor: 'text-sky-100',
      };
    case 75:
      return {
        code,
        label: 'Starker Schneefall',
        iconName: 'snow',
        badgeColor: 'text-white',
      };
    case 77:
      return {
        code,
        label: 'Schneegriesel',
        iconName: 'snow',
        badgeColor: 'text-sky-200',
      };
    case 80:
      return {
        code,
        label: 'Leichte Regenschauer',
        iconName: 'rain',
        badgeColor: 'text-sky-400',
      };
    case 81:
      return {
        code,
        label: 'Mäßige Regenschauer',
        iconName: 'rain',
        badgeColor: 'text-blue-400',
      };
    case 82:
      return {
        code,
        label: 'Heftige Regenschauer',
        iconName: 'rain',
        badgeColor: 'text-blue-500',
      };
    case 85:
    case 86:
      return {
        code,
        label: 'Schneeschauer',
        iconName: 'snow',
        badgeColor: 'text-sky-200',
      };
    case 95:
      return {
        code,
        label: 'Gewitter',
        iconName: 'thunderstorm',
        badgeColor: 'text-amber-400',
      };
    case 96:
    case 99:
      return {
        code,
        label: 'Gewitter mit Hagel',
        iconName: 'thunderstorm',
        badgeColor: 'text-purple-400',
      };
    default:
      return {
        code,
        label: 'Heiter bis wolkig',
        iconName: isDay ? 'cloud-sun' : 'cloud-moon',
        badgeColor: 'text-slate-300',
      };
  }
}

export function getWindDirectionText(deg: number): string {
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return directions[index];
}

const WEATHER_CACHE_KEY = 'webclock_weather_cache_v2';
const LOCATION_CACHE_KEY = 'webclock_detected_location_v2';

// Detects location automatically: attempts GPS first, falls back to IP geolocation, then Berlin default
export async function detectUserLocation(): Promise<WeatherLocationInfo> {
  // Check cached location if less than 6 hours old
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 6 * 60 * 60 * 1000 && parsed.location) {
        return parsed.location;
      }
    }
  } catch {}

  // 1. Try GPS browser Geolocation
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 7000,
          maximumAge: 10 * 60 * 1000,
          enableHighAccuracy: false,
        });
      });

      const lat = Number(pos.coords.latitude.toFixed(4));
      const lon = Number(pos.coords.longitude.toFixed(4));

      // Reverse geocode to get city name
      let cityName = 'Mein Standort';
      let countryName = 'Deutschland';

      try {
        const revRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=de`
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          cityName = revData.city || revData.locality || revData.principalSubdivision || 'Mein Standort';
          countryName = revData.countryName || 'Deutschland';
        }
      } catch {
        // Reverse geocoding failed, coordinates still valid
      }

      const result: WeatherLocationInfo = {
        name: cityName,
        country: countryName,
        latitude: lat,
        longitude: lon,
        isAutoDetected: true,
        source: 'gps',
      };

      try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ location: result, timestamp: Date.now() }));
      } catch {}

      return result;
    } catch {
      // GPS not allowed or timed out - continue to IP geolocation
    }
  }

  // 2. Try IP Geolocation (free & fast)
  try {
    const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data.latitude && data.longitude) {
        const result: WeatherLocationInfo = {
          name: data.city || 'Mein Standort',
          country: data.country_name || 'Deutschland',
          admin1: data.region,
          latitude: Number(Number(data.latitude).toFixed(4)),
          longitude: Number(Number(data.longitude).toFixed(4)),
          isAutoDetected: true,
          source: 'ip',
        };

        try {
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ location: result, timestamp: Date.now() }));
        } catch {}

        return result;
      }
    }
  } catch {
    // IP fallback
  }

  // 3. Ultimate Fallback: Berlin, Germany
  const fallback: WeatherLocationInfo = {
    name: 'Berlin',
    country: 'Deutschland',
    latitude: 52.52,
    longitude: 13.405,
    isAutoDetected: false,
    source: 'fallback',
  };

  return fallback;
}

// Fetch complete weather forecast from Open-Meteo
export async function fetchWeatherData(
  location: WeatherLocationInfo,
  unit: WeatherUnit = 'celsius',
  forceRefresh = false
): Promise<WeatherData> {
  const cacheKey = `${WEATHER_CACHE_KEY}_${location.latitude}_${location.longitude}_${unit}`;

  // Check 15-minute cache
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as WeatherData;
        const age = Date.now() - parsed.lastUpdated;
        if (age < 15 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {}
  }

  const tempUnitParam = unit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max&timezone=auto${tempUnitParam}&wind_speed_unit=kmh&precipitation_unit=mm`;

  const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!res.ok) {
    throw new Error(`Open-Meteo Serverfehler (${res.status})`);
  }

  const data = await res.json();
  const current = data.current || {};
  const currentCode = Number(current.weather_code ?? 0);
  const isDay = Boolean(current.is_day ?? 1);
  const condition = getWeatherConditionInfo(currentCode, isDay);

  // Hourly (next 24 hours starting from current hour)
  const hourlyTimes: string[] = data.hourly?.time || [];
  const hourlyTemps: number[] = data.hourly?.temperature_2m || [];
  const hourlyCodes: number[] = data.hourly?.weather_code || [];
  const hourlyPrecip: number[] = data.hourly?.precipitation_probability || [];
  const hourlyIsDay: number[] = data.hourly?.is_day || [];

  const nowIso = new Date().toISOString().slice(0, 13); // 'YYYY-MM-DDTHH'
  let startIdx = hourlyTimes.findIndex((t) => t.startsWith(nowIso));
  if (startIdx === -1) startIdx = 0;

  const hourly: WeatherHourly[] = [];
  for (let i = startIdx; i < Math.min(startIdx + 24, hourlyTimes.length); i++) {
    const timeStr = hourlyTimes[i];
    const dateObj = new Date(timeStr);
    const hour = String(dateObj.getHours()).padStart(2, '0');
    const hCode = Number(hourlyCodes[i] ?? 0);
    const hIsDay = Boolean(hourlyIsDay[i] ?? 1);

    hourly.push({
      time: timeStr,
      timeFormatted: `${hour}:00`,
      temperature: Math.round(hourlyTemps[i] ?? 0),
      weatherCode: hCode,
      conditionText: getWeatherConditionInfo(hCode, hIsDay).label,
      precipitationProbability: Math.round(hourlyPrecip[i] ?? 0),
      isDay: hIsDay,
    });
  }

  // Daily (7 days)
  const dailyDates: string[] = data.daily?.time || [];
  const dailyCodes: number[] = data.daily?.weather_code || [];
  const dailyMax: number[] = data.daily?.temperature_2m_max || [];
  const dailyMin: number[] = data.daily?.temperature_2m_min || [];
  const dailyPrecip: number[] = data.daily?.precipitation_probability_max || [];
  const dailySunrise: string[] = data.daily?.sunrise || [];
  const dailySunset: string[] = data.daily?.sunset || [];
  const dailyUv: number[] = data.daily?.uv_index_max || [];

  const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  const daily: WeatherDaily[] = dailyDates.slice(0, 7).map((dStr, idx) => {
    const dObj = new Date(dStr + 'T12:00:00');
    let dayName = weekdayNames[dObj.getDay()];
    if (idx === 0) dayName = 'Heute';
    else if (idx === 1) dayName = 'Morgen';

    const dCode = Number(dailyCodes[idx] ?? 0);
    const cond = getWeatherConditionInfo(dCode, true);

    const sunriseStr = dailySunrise[idx] ? new Date(dailySunrise[idx]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const sunsetStr = dailySunset[idx] ? new Date(dailySunset[idx]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    return {
      date: dStr,
      dayName,
      weatherCode: dCode,
      conditionText: cond.label,
      tempMax: Math.round(dailyMax[idx] ?? 0),
      tempMin: Math.round(dailyMin[idx] ?? 0),
      precipitationProbability: Math.round(dailyPrecip[idx] ?? 0),
      sunrise: sunriseStr,
      sunset: sunsetStr,
      uvIndexMax: Math.round(dailyUv[idx] ?? 0),
    };
  });

  const windDir = Number(current.wind_direction_10m ?? 0);

  const weatherData: WeatherData = {
    location,
    current: {
      temperature: Math.round(current.temperature_2m ?? 0),
      apparentTemperature: Math.round(current.apparent_temperature ?? 0),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      precipitation: Number(current.precipitation ?? 0),
      weatherCode: currentCode,
      conditionText: condition.label,
      isDay,
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      windDirection: windDir,
      windDirectionText: getWindDirectionText(windDir),
      pressure: Math.round(current.surface_pressure ?? 1013),
      uvIndex: daily[0]?.uvIndexMax ?? 0,
    },
    hourly,
    daily,
    unit,
    lastUpdated: Date.now(),
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(weatherData));
  } catch {}

  return weatherData;
}

// Search cities worldwide using Open-Meteo Geocoding API
export async function searchCities(query: string): Promise<WeatherManualLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=8&language=de&format=json`;

  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r: any) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: Number(Number(r.latitude).toFixed(4)),
    longitude: Number(Number(r.longitude).toFixed(4)),
  }));
}

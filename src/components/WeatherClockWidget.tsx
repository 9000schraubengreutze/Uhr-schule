import React from 'react';
import { MapPin, Droplets, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { WeatherData } from '../services/weatherService';
import { WeatherSettings } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface WeatherClockWidgetProps {
  weatherData: WeatherData | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onClick: () => void;
  onRefresh?: (e: React.MouseEvent) => void;
  backdropBlur?: number;
  settings?: WeatherSettings;
}

export const WeatherClockWidget: React.FC<WeatherClockWidgetProps> = ({
  weatherData,
  isLoading = false,
  isRefreshing = false,
  onClick,
  onRefresh,
  backdropBlur = 16,
  settings,
}) => {
  const showDetails = settings?.showDetailsOnClock ?? true;
  const showCondition = settings?.showConditionText ?? true;
  const showRain = settings?.showRainProbability ?? true;
  const unitSymbol = weatherData?.unit === 'fahrenheit' ? '°F' : '°C';

  if (!weatherData && isLoading) {
    return (
      <div
        className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-400 bg-slate-900/50 border border-slate-800/80 shadow-md backdrop-blur-md animate-pulse"
        style={{
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-slate-700 animate-spin" />
        <span>Wetterdaten werden ermittelt...</span>
      </div>
    );
  }

  if (!weatherData) return null;

  const { current, location, daily } = weatherData;
  const today = daily[0];

  return (
    <div className="mt-3 sm:mt-4 flex items-center justify-center">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        title={`Aktuelles Wetter für ${location.name}: ${current.conditionText}, ${current.temperature}${unitSymbol}. Klicken für 7-Tage-Vorhersage & Details.`}
        className="group relative inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-slate-200 bg-slate-950/60 hover:bg-slate-900/85 border border-white/10 hover:border-sky-400/40 shadow-lg shadow-black/40 hover:shadow-[0_8px_25px_rgba(56,189,248,0.25)] hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 ease-out cursor-pointer select-none"
        style={{
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
      >
        {/* Weather condition icon with slight hover animation */}
        <div className="transition-transform duration-200 group-hover:scale-115">
          <WeatherIcon weatherCode={current.weatherCode} isDay={current.isDay} className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Temperature */}
        <span className="font-bold text-white tracking-tight tabular-numbers text-sm sm:text-base">
          {current.temperature}
          <span className="text-xs font-normal text-slate-300 ml-0.5">{unitSymbol}</span>
        </span>

        {/* Condition text (optional / responsive) */}
        {showCondition && (
          <span className="hidden sm:inline text-slate-300 font-medium border-l border-white/15 pl-2">
            {current.conditionText}
          </span>
        )}

        {/* Location pill */}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-sky-300/90 font-medium">
          <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="max-w-[120px] sm:max-w-[160px] truncate">{location.name}</span>
        </div>

        {/* Optional Min/Max & Rain details on clock pill */}
        {showDetails && today && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 border-l border-white/15 pl-2 font-mono">
            <span className="text-rose-300 flex items-center">
              <ArrowUp className="w-2.5 h-2.5 inline" />
              {today.tempMax}°
            </span>
            <span className="text-sky-300 flex items-center">
              <ArrowDown className="w-2.5 h-2.5 inline" />
              {today.tempMin}°
            </span>
            {showRain && today.precipitationProbability > 0 && (
              <span className="text-sky-300/90 flex items-center gap-0.5 ml-0.5 font-sans text-[10px]">
                <Droplets className="w-2.5 h-2.5 text-sky-400" />
                {today.precipitationProbability}%
              </span>
            )}
          </div>
        )}

        {/* Subtle quick refresh button inside or near */}
        {onRefresh && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh(e);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
            title="Wetter aktualisieren"
            aria-label="Wetter aktualisieren"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

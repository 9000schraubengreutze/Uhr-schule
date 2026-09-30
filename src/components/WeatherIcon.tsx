import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
} from 'lucide-react';
import { getWeatherConditionInfo } from '../services/weatherService';

interface WeatherIconProps {
  weatherCode: number;
  isDay?: boolean;
  className?: string;
  size?: number | string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  weatherCode,
  isDay = true,
  className = 'w-5 h-5',
}) => {
  const info = getWeatherConditionInfo(weatherCode, isDay);

  switch (info.iconName) {
    case 'sun':
      return <Sun className={`${className} text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]`} />;
    case 'moon':
      return <Moon className={`${className} text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.4)]`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.4)]`} />;
    case 'cloud-moon':
      return <CloudMoon className={`${className} text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.4)]`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-300`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-400`} />;
    case 'rain':
      return <CloudRain className={`${className} text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.4)]`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-sky-200 drop-shadow-[0_0_6px_rgba(186,230,253,0.5)]`} />;
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]`} />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-400`} />;
    default:
      return <Sun className={`${className} text-amber-400`} />;
  }
};

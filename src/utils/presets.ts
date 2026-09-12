import { ClockSettings, GradientPreset, CuratedTheme } from '../types';

export const DEFAULT_SETTINGS: ClockSettings = {
  // DARSTELLUNG
  bgType: 'gradient',
  bgColor: '#0f172a',
  gradientPresetId: 'bold-midnight-radial',
  customGradient: {
    color1: '#1e293b',
    color2: '#0f172a',
    angle: 135,
  },
  bgOverlayOpacity: 0,
  bgBlur: 0,
  colorScheme: 'dark',
  themeMode: 'dark',
  themeId: 'midnight-blue',

  // Animierte Partikeleffekte
  particleEffect: 'none',
  particleIntensity: 50,
  particleColor: '#ffffff',
  particleSpeed: 2,

  // Typography & Scaling
  clockColor: '#38bdf8',
  accentColor: '#38bdf8',
  clockFont: 'outfit',
  clockWeight: '600',
  clockScale: 100,
  enableBreathingAnimation: true,
  enableGlow: true,
  hasCustomImage: false,

  // UHR (Digitale Uhr-Funktionen)
  is24Hour: true,
  showSeconds: true,
  showDate: true,
  dateFormat: 'DD.MM.YYYY',
  showDayOfWeek: true,
  showBlinkingSeparator: false,
  colonAnimation: 'pulse', // Default to smooth subtle pulse
  colonPulseIntensity: 0.6, // 60% intensity (subtle and elegant)
  showCardContainer: false,
  backdropBlurIntensity: 16, // Default 16px (matches backdrop-blur-xl/2xl)
  timeZone: 'Europe/Berlin',

  // Zusätzliche Zeitzonen (Weltuhr)
  showAdditionalTimeZones: false,
  additionalTimeZones: [
    { id: 'tz-london', name: 'London', timeZone: 'Europe/London' },
    { id: 'tz-ny', name: 'New York', timeZone: 'America/New_York' },
    { id: 'tz-tokyo', name: 'Tokio', timeZone: 'Asia/Tokyo' },
  ],

  // EINSTELLUNGEN
  appLanguage: 'de',
  soundEnabled: false,
  vibrationEnabled: true,
  useAtomicSync: true,
  showSyncBadge: true,

  // SCHUL-STUNDENPLAN & PAUSEN-SPERRE
  schoolBreakGameLockEnabled: true,
  schoolBreakLockMode: 'school_breaks_only',
  schoolSimulationMode: 'live',
  showSchoolBadge: true,
  teacherOverrideActive: false,
};

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'bold-midnight-radial',
    name: 'Bold Midnight (Radial)',
    css: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0a0f1d 100%)',
    textColorHint: '#ffffff',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    css: 'linear-gradient(135deg, #030712 0%, #0c2340 50%, #031525 100%)',
    textColorHint: '#38bdf8',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    css: 'linear-gradient(135deg, #090d16 0%, #171d33 50%, #050811 100%)',
    textColorHint: '#ffffff',
  },
  {
    id: 'aurora-borealis',
    name: 'Nordlicht (Aurora)',
    css: 'linear-gradient(135deg, #041722 0%, #003554 35%, #05668d 70%, #02c39a 100%)',
    textColorHint: '#34d399',
  },
  {
    id: 'sunset-glow',
    name: 'Abendrot (Sunset)',
    css: 'linear-gradient(135deg, #2a0845 0%, #6441a5 50%, #fe8c00 100%)',
    textColorHint: '#fef08a',
  },
  {
    id: 'minimal-light',
    name: 'Heller Schiefer',
    css: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    textColorHint: '#0f172a',
  },
  {
    id: 'cyber-dark',
    name: 'Cyberpunk Violett',
    css: 'linear-gradient(135deg, #110022 0%, #2b0938 50%, #080010 100%)',
    textColorHint: '#e879f9',
  },
];

export const CURATED_THEMES: CuratedTheme[] = [
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Kühles Eisblau mit tiefem Mitternachtshimmel-Hintergrund',
    clockColor: '#38bdf8',
    clockAccent: 'rgba(56, 189, 248, 0.4)',
    clockFont: 'outfit',
    clockWeight: '600',
    bgType: 'gradient',
    bgColor: '#030712',
    gradientPresetId: 'midnight-blue',
    gradientCss: 'linear-gradient(135deg, #030712 0%, #0c2340 50%, #031525 100%)',
    accentColor: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.35)',
    surfaceBorder: 'rgba(56, 189, 248, 0.25)',
    themeMode: 'dark',
    previewBg: 'linear-gradient(135deg, #030712 0%, #0c2340 100%)',
    previewTextColor: '#38bdf8',
  },
  {
    id: 'minimalist-dark',
    name: 'Minimalist Slate',
    description: 'Klassisches klares Off-White auf mattem Schiefergrau',
    clockColor: '#f8fafc',
    clockAccent: 'rgba(248, 250, 252, 0.2)',
    clockFont: 'inter',
    clockWeight: '600',
    bgType: 'color',
    bgColor: '#0f172a',
    accentColor: '#3b82f6',
    accentGlow: 'rgba(59, 130, 246, 0.35)',
    surfaceBorder: 'rgba(255, 255, 255, 0.12)',
    themeMode: 'dark',
    previewBg: '#0f172a',
    previewTextColor: '#f8fafc',
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    description: 'Leuchtendes Magenta & Violett auf dunklem Obsidian',
    clockColor: '#f472b6',
    clockAccent: 'rgba(244, 114, 182, 0.5)',
    clockFont: 'mono',
    clockWeight: '600',
    bgType: 'gradient',
    bgColor: '#110022',
    gradientPresetId: 'cyber-dark',
    gradientCss: 'linear-gradient(135deg, #110022 0%, #2b0938 50%, #080010 100%)',
    accentColor: '#ec4899',
    accentGlow: 'rgba(236, 72, 153, 0.45)',
    surfaceBorder: 'rgba(236, 72, 153, 0.3)',
    themeMode: 'dark',
    previewBg: 'linear-gradient(135deg, #110022 0%, #2b0938 100%)',
    previewTextColor: '#f472b6',
  },
  {
    id: 'aurora-emerald',
    name: 'Aurora Emerald',
    description: 'Frisches Smaragd- und Türkisleuchten inspiriert von Nordlichtern',
    clockColor: '#34d399',
    clockAccent: 'rgba(52, 211, 153, 0.45)',
    clockFont: 'outfit',
    clockWeight: '600',
    bgType: 'gradient',
    bgColor: '#041722',
    gradientPresetId: 'aurora-borealis',
    gradientCss: 'linear-gradient(135deg, #041722 0%, #003554 35%, #05668d 70%, #02c39a 100%)',
    accentColor: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.35)',
    surfaceBorder: 'rgba(52, 211, 153, 0.25)',
    themeMode: 'dark',
    previewBg: 'linear-gradient(135deg, #041722 0%, #02c39a 100%)',
    previewTextColor: '#34d399',
  },
  {
    id: 'sunset-gold',
    name: 'Sunset Amber',
    description: 'Warm glühende Bernsteinfarben für angenehmes Abendlicht',
    clockColor: '#fbbf24',
    clockAccent: 'rgba(251, 191, 36, 0.45)',
    clockFont: 'outfit',
    clockWeight: '800',
    bgType: 'gradient',
    bgColor: '#2a0845',
    gradientPresetId: 'sunset-glow',
    gradientCss: 'linear-gradient(135deg, #2a0845 0%, #6441a5 50%, #fe8c00 100%)',
    accentColor: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    surfaceBorder: 'rgba(251, 191, 36, 0.3)',
    themeMode: 'dark',
    previewBg: 'linear-gradient(135deg, #2a0845 0%, #fe8c00 100%)',
    previewTextColor: '#fbbf24',
  },
  {
    id: 'pure-oled-black',
    name: 'OLED Pure Black',
    description: 'Kristallklares Weiß auf absolutem Tiefschwarz für OLED-Displays',
    clockColor: '#ffffff',
    clockAccent: 'rgba(255, 255, 255, 0.15)',
    clockFont: 'mono',
    clockWeight: '400',
    bgType: 'color',
    bgColor: '#000000',
    accentColor: '#ffffff',
    accentGlow: 'rgba(255, 255, 255, 0.2)',
    surfaceBorder: 'rgba(255, 255, 255, 0.18)',
    themeMode: 'dark',
    previewBg: '#000000',
    previewTextColor: '#ffffff',
  },
  {
    id: 'paper-light',
    name: 'Klares Licht (Light)',
    description: 'Hell und augenfreundlich mit maximalem Kontrast für den Tag',
    clockColor: '#0f172a',
    clockAccent: 'rgba(15, 23, 42, 0.12)',
    clockFont: 'inter',
    clockWeight: '600',
    bgType: 'color',
    bgColor: '#f8fafc',
    accentColor: '#2563eb',
    accentGlow: 'rgba(37, 99, 235, 0.2)',
    surfaceBorder: 'rgba(15, 23, 42, 0.12)',
    themeMode: 'light',
    previewBg: '#f8fafc',
    previewTextColor: '#0f172a',
  },
];

export const COLOR_PALETTES = [
  { name: 'Eisblau', value: '#38bdf8' },
  { name: 'Smaragdgrün', value: '#34d399' },
  { name: 'Bernsteingelb', value: '#fbbf24' },
  { name: 'Korallrot', value: '#f87171' },
  { name: 'Violett', value: '#a855f7' },
  { name: 'Magenta Pink', value: '#f472b6' },
  { name: 'Reinweiß', value: '#ffffff' },
  { name: 'Helles Silber', value: '#e2e8f0' },
  { name: 'Tiefschwarz', value: '#09090b' },
  { name: 'Schiefergrau', value: '#334155' },
  { name: 'Cyan Türkis', value: '#06b6d4' },
  { name: 'Warmes Gold', value: '#eab308' },
];

export interface WorldTimeZoneOption {
  name: string;
  timeZone: string;
  region: string;
  flag?: string;
}

export const PRESET_WORLD_TIMEZONES: WorldTimeZoneOption[] = [
  { name: 'London', timeZone: 'Europe/London', region: 'Europa', flag: '🇬🇧' },
  { name: 'Paris', timeZone: 'Europe/Paris', region: 'Europa', flag: '🇫🇷' },
  { name: 'Zürich', timeZone: 'Europe/Zurich', region: 'Europa', flag: '🇨🇭' },
  { name: 'Wien', timeZone: 'Europe/Vienna', region: 'Europa', flag: '🇦🇹' },
  { name: 'Berlin', timeZone: 'Europe/Berlin', region: 'Europa', flag: '🇩🇪' },
  { name: 'Rom', timeZone: 'Europe/Rome', region: 'Europa', flag: '🇮🇹' },
  { name: 'Madrid', timeZone: 'Europe/Madrid', region: 'Europa', flag: '🇪🇸' },
  { name: 'Athen', timeZone: 'Europe/Athens', region: 'Europa', flag: '🇬🇷' },
  { name: 'Reykjavík', timeZone: 'Atlantic/Reykjavik', region: 'Atlantik', flag: '🇮🇸' },
  { name: 'UTC (Weltzeit)', timeZone: 'UTC', region: 'Global', flag: '🌐' },

  { name: 'New York', timeZone: 'America/New_York', region: 'Nordamerika', flag: '🇺🇸' },
  { name: 'Chicago', timeZone: 'America/Chicago', region: 'Nordamerika', flag: '🇺🇸' },
  { name: 'Denver', timeZone: 'America/Denver', region: 'Nordamerika', flag: '🇺🇸' },
  { name: 'Los Angeles / San Francisco', timeZone: 'America/Los_Angeles', region: 'Nordamerika', flag: '🇺🇸' },
  { name: 'Toronto', timeZone: 'America/Toronto', region: 'Nordamerika', flag: '🇨🇦' },
  { name: 'Vancouver', timeZone: 'America/Vancouver', region: 'Nordamerika', flag: '🇨🇦' },
  { name: 'Honolulu (Hawaii)', timeZone: 'Pacific/Honolulu', region: 'Pazifik', flag: '🌺' },

  { name: 'São Paulo', timeZone: 'America/Sao_Paulo', region: 'Südamerika', flag: '🇧🇷' },
  { name: 'Buenos Aires', timeZone: 'America/Argentina/Buenos_Aires', region: 'Südamerika', flag: '🇦🇷' },
  { name: 'Mexiko-Stadt', timeZone: 'America/Mexico_City', region: 'Mittelamerika', flag: '🇲🇽' },

  { name: 'Tokio', timeZone: 'Asia/Tokyo', region: 'Asien', flag: '🇯🇵' },
  { name: 'Hongkong', timeZone: 'Asia/Hong_Kong', region: 'Asien', flag: '🇭🇰' },
  { name: 'Singapur', timeZone: 'Asia/Singapore', region: 'Asien', flag: '🇸🇬' },
  { name: 'Peking / Shanghai', timeZone: 'Asia/Shanghai', region: 'Asien', flag: '🇨🇳' },
  { name: 'Seoul', timeZone: 'Asia/Seoul', region: 'Asien', flag: '🇰🇷' },
  { name: 'Neu-Delhi (Mumbai)', timeZone: 'Asia/Kolkata', region: 'Asien', flag: '🇮🇳' },
  { name: 'Bangkok', timeZone: 'Asia/Bangkok', region: 'Asien', flag: '🇹🇭' },
  { name: 'Dubai', timeZone: 'Asia/Dubai', region: 'Naher Osten', flag: '🇦🇪' },
  { name: 'Katar (Doha)', timeZone: 'Asia/Qatar', region: 'Naher Osten', flag: '🇶🇦' },
  { name: 'Tel Aviv', timeZone: 'Asia/Jerusalem', region: 'Naher Osten', flag: '🇮🇱' },

  { name: 'Sydney', timeZone: 'Australia/Sydney', region: 'Australien & Ozeanien', flag: '🇦🇺' },
  { name: 'Melbourne', timeZone: 'Australia/Melbourne', region: 'Australien & Ozeanien', flag: '🇦🇺' },
  { name: 'Auckland', timeZone: 'Pacific/Auckland', region: 'Australien & Ozeanien', flag: '🇳🇿' },

  { name: 'Kairo', timeZone: 'Africa/Cairo', region: 'Afrika', flag: '🇪🇬' },
  { name: 'Kapstadt / Johannesburg', timeZone: 'Africa/Johannesburg', region: 'Afrika', flag: '🇿🇦' },
  { name: 'Nairobi', timeZone: 'Africa/Nairobi', region: 'Afrika', flag: '🇰🇪' },
];

export interface ParticleEffectOption {
  id: 'none' | 'snow' | 'dust' | 'stars' | 'rain' | 'bubbles';
  label: string;
  description: string;
  iconName: string;
}

export const PARTICLE_EFFECT_OPTIONS: ParticleEffectOption[] = [
  { id: 'none', label: 'Keine', description: 'Keine Animation im Hintergrund', iconName: 'Ban' },
  { id: 'snow', label: 'Schnee', description: 'Sanft herabfallende Schneeflocken', iconName: 'Snowflake' },
  { id: 'dust', label: 'Staub', description: 'Schwebende Ambient-Partikel im Licht', iconName: 'Sparkles' },
  { id: 'stars', label: 'Sterne', description: 'Funkelnder, subtiler Sternenhimmel', iconName: 'Star' },
  { id: 'rain', label: 'Regen', description: 'Elegante, sanfte Regenfäden', iconName: 'CloudRain' },
  { id: 'bubbles', label: 'Lichtpunkte', description: 'Sanft aufsteigende Leuchtpunkte', iconName: 'CircleDot' },
];

export const PARTICLE_COLOR_PRESETS = [
  { name: 'Klassisch Weiß', value: '#ffffff' },
  { name: 'Eisblau', value: '#38bdf8' },
  { name: 'Warmes Gold', value: '#facc15' },
  { name: 'Magisches Violett', value: '#c084fc' },
  { name: 'Smaragdgrün', value: '#34d399' },
  { name: 'Zartes Rosa', value: '#f472b6' },
  { name: 'Koralle', value: '#fb7185' },
  { name: 'Sanfter Amber', value: '#fbbf24' },
];


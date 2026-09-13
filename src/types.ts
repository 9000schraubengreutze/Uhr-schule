export type ClockFont = 'outfit' | 'inter' | 'mono' | 'school';
export type ClockWeight = '300' | '400' | '600' | '800';
export type BgType = 'color' | 'gradient' | 'image';
export type ThemeMode = 'dark' | 'light';
export type ColorScheme = 'light' | 'dark' | 'system';
export type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type ColonAnimation = 'blink' | 'pulse' | 'glow' | 'bounce' | 'static';
export type DigitTransition = 'fade' | 'crossfade' | 'slide-fade' | 'none';

export type ParticleEffect = 'none' | 'snow' | 'dust' | 'stars' | 'rain' | 'bubbles';

export type SettingsTab =
  | 'darstellung'
  | 'uhr'
  | 'einstellungen'
  | 'hilfe'
  | 'rechtliches';

export interface CustomGradient {
  color1: string;
  color2: string;
  angle: number;
}

export interface GradientPreset {
  id: string;
  name: string;
  css: string;
  textColorHint?: string;
}

export interface AdditionalTimeZone {
  id: string;
  name: string;
  timeZone: string;
  customLabel?: string;
  flag?: string;
}

export interface CuratedTheme {
  id: string;
  name: string;
  description: string;
  clockColor: string;
  clockAccent?: string;
  clockFont: ClockFont;
  clockWeight: ClockWeight;
  bgType: BgType;
  bgColor?: string;
  gradientPresetId?: string;
  gradientCss?: string;
  customGradient?: CustomGradient;
  accentColor: string;
  accentGlow?: string;
  surfaceBorder?: string;
  themeMode?: ThemeMode;
  previewBg: string;
  previewTextColor: string;
}

export interface ClockSettings {
  // === DARSTELLUNG (Designoptionen) ===
  bgType: BgType;
  bgColor: string;
  gradientPresetId: string;
  customGradient: CustomGradient;
  bgOverlayOpacity: number; // 0 to 90 %
  bgBlur: number; // 0 to 25 px
  colorScheme: ColorScheme; // 'light' | 'dark' | 'system'
  themeMode: ThemeMode; // 'dark' | 'light'
  themeId?: string;

  // Animierte Partikeleffekte im Hintergrund
  particleEffect: ParticleEffect; // 'none' | 'snow' | 'dust' | 'stars' | 'rain' | 'bubbles'
  particleIntensity: number; // 10 to 100 percent
  particleColor: string; // Particle color (hex, e.g. '#ffffff')
  particleSpeed: number; // 0.25 to 3.0 (speed multiplier, default 1.0)

  // Digital Clock Typography & Appearance
  clockColor: string; // Digit text color
  accentColor: string; // Glow / badge / button accent color
  clockFont: ClockFont;
  clockWeight: ClockWeight;
  clockScale: number; // 70 to 140 percent
  enableBreathingAnimation: boolean;
  enableGlow: boolean; // Ambient neon / soft backlight glow
  digitTransition: DigitTransition; // 'fade' | 'crossfade' | 'slide-fade' | 'none'
  digitFadeDuration: number; // 150 to 800 ms (default 360ms)
  hasCustomImage: boolean;

  // === UHR (Digitale Uhr-Funktionen) ===
  is24Hour: boolean; // 24-hour vs 12-hour AM/PM format
  showSeconds: boolean; // Toggle seconds display
  showDate: boolean; // Toggle date string
  dateFormat: DateFormat; // 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  showDayOfWeek: boolean; // Toggle weekday name (e.g. Dienstag)
  showBlinkingSeparator: boolean; // Toggle blinking colons
  colonAnimation: ColonAnimation; // 'pulse' | 'blink' | 'glow' | 'bounce' | 'static'
  colonPulseIntensity: number; // 0.1 to 1.0 (subtlety to prominence of colon animation)
  showCardContainer: boolean; // Material 3 surface container around digits
  backdropBlurIntensity: number; // 0 to 40 px: granular backdrop-filter blur for clock UI elements
  timeZone: string; // Target time zone (default 'Europe/Berlin' for Germany/Central Europe)

  // Zusätzliche Zeitzonen (Weltuhr direkt unter der Hauptuhr)
  showAdditionalTimeZones: boolean;
  additionalTimeZones: AdditionalTimeZone[];

  // Wetter-Anzeige auf dem Hauptbildschirm
  showWeather: boolean;
  weatherUnit: 'celsius' | 'fahrenheit';

  // === EINSTELLUNGEN (Allgemeine Optionen) ===
  appLanguage: 'de' | 'en';
  soundEnabled: boolean; // Subtle second tick audio
  vibrationEnabled: boolean; // Haptic feedback on mobile
  useAtomicSync: boolean; // Use online atomic clock (NTP) instead of device clock
  showSyncBadge: boolean; // Display sync indicator on the main screen

  // === SCHUL-STUNDENPLAN & PAUSEN-SPERRE (HO 2) ===
  schoolBreakGameLockEnabled: boolean; // Games only in breaks
  schoolBreakLockMode: 'school_breaks_only' | 'strict_breaks_only' | 'always_allowed';
  schoolSimulationMode: 'live' | 'lesson' | 'break_1' | 'break_2';
  showSchoolBadge: boolean; // Display school timetable / break status in quick controls & clock
  teacherOverrideActive: boolean; // Temporary teacher unlock
}

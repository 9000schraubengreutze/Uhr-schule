export type ClockFont = 'outfit' | 'inter' | 'mono' | 'school' | 'serif' | 'sans';
export type ClockWeight = '300' | '400' | '600' | '800';
export type BgType = 'color' | 'gradient' | 'image';
export type ThemeMode = 'dark' | 'light';
export type ColorScheme = 'light' | 'dark' | 'system';
export type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type ColonAnimation = 'blink' | 'pulse' | 'glow' | 'bounce' | 'static';
export type DigitTransition = 'flip' | 'slide' | 'slide-fade' | 'fade' | 'crossfade' | 'none';

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

export interface SavedWallpaperItem {
  id: string;
  name?: string;
  prompt?: string;
  createdAt: number;
  style?: string;
  mode?: 'create' | 'edit' | 'upload';
  isAi?: boolean;
  url?: string;
  isActive?: boolean;
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
  hoursColor?: string; // Optional custom color for hours digits
  minutesColor?: string; // Optional custom color for minutes digits
  secondsColor?: string; // Optional custom color for seconds digits
  colonColor?: string; // Optional custom color for colon separators
  accentColor: string; // Glow / badge / button accent color
  clockFont: ClockFont;
  clockWeight: ClockWeight;
  typographySet?: string; // Predefined typography set ID (e.g. 'mono', 'serif', 'sans')
  clockScale: number; // 70 to 140 percent
  autoScaleFontSize: boolean; // Dynamically scale font size based on window/viewport to fill the view optimally
  enableBreathingAnimation: boolean;
  enableEntranceAnimation: boolean; // Smooth CSS entrance animation when toggling Zen mode or returning from settings
  entranceAnimationType: 'slide-up' | 'fade-in'; // 'slide-up' (Slide-up & Fade) | 'fade-in' (Fade-in only)
  enableGlow: boolean; // Ambient neon / soft backlight glow radiating from behind digits
  glowIntensity: number; // 0 to 100 percent (color intensity)
  glowSpread: number; // 10 to 120 px (glow spread radius radiating behind digits)
  glowColor?: string; // Optional custom glow color (or undefined for automatic digit color)
  digitTransition: DigitTransition; // 'flip' | 'slide' | 'slide-fade' | 'fade' | 'crossfade' | 'none'
  digitFadeDuration: number; // 150 to 800 ms (default 340ms)
  _digitTransitionCustomized?: boolean;
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

  // === ZEN-MODUS AUTOMATISCHER ZEITPLAN ===
  zenScheduleEnabled: boolean; // Automatischer Timer für Zen-Modus
  zenScheduleStartTime: string; // z. B. '22:00' (10:00 PM)
  zenScheduleEndTime: string; // z. B. '07:00' (07:00 AM)

  // === TÄGLICHES ZITAT (DAILY INSPIRATIONAL QUOTE) ===
  showDailyQuote: boolean; // Zitat-Widget unter der Uhr ein-/ausblenden
  quoteFont: ClockFont; // Schriftart des Zitats ('serif' | 'outfit' | 'inter' | 'mono' | 'school' | 'sans')
  quoteColor: string; // Schriftfarbe des Zitat-Texts
  quoteAuthorColor?: string; // Optionale Schriftfarbe des Autors

  // === EINSTELLUNGEN (Allgemeine Optionen) ===
  appLanguage: 'de' | 'en';
  soundEnabled: boolean; // Subtle second tick audio
  vibrationEnabled: boolean; // Haptic feedback on mobile
  useAtomicSync: boolean; // Use online atomic clock (NTP) instead of device clock
  showSyncBadge: boolean; // Display sync indicator on the main screen
  showBatteryIndicator?: boolean; // Subtle battery level indicator for mobile devices (hidden in fullscreen)

  // === SCHUL-STUNDENPLAN & PAUSEN-SPERRE (HO 2) ===
  schoolBreakGameLockEnabled: boolean; // Games only in breaks
  schoolBreakLockMode: 'school_breaks_only' | 'strict_breaks_only' | 'always_allowed';
  schoolSimulationMode: 'live' | 'lesson' | 'break_1' | 'break_2';
  showSchoolBadge: boolean; // Display school timetable / break status in quick controls & clock
  teacherOverrideActive: boolean; // Temporary teacher unlock
}

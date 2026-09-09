export type ClockFont = 'outfit' | 'inter' | 'mono' | 'school';
export type ClockWeight = '300' | '400' | '600' | '800';
export type BgType = 'color' | 'gradient' | 'image';
export type ThemeMode = 'dark' | 'light';
export type ColorScheme = 'light' | 'dark' | 'system';

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

  // Digital Clock Typography & Appearance
  clockColor: string; // Digit text color
  accentColor: string; // Glow / badge / button accent color
  clockFont: ClockFont;
  clockWeight: ClockWeight;
  clockScale: number; // 70 to 140 percent
  enableBreathingAnimation: boolean;
  enableGlow: boolean; // Ambient neon / soft backlight glow
  hasCustomImage: boolean;

  // === UHR (Digitale Uhr-Funktionen) ===
  is24Hour: boolean; // 24-hour vs 12-hour AM/PM format
  showSeconds: boolean; // Toggle seconds display
  showDate: boolean; // Toggle date string
  showDayOfWeek: boolean; // Toggle weekday name (e.g. Dienstag)
  showBlinkingSeparator: boolean; // Toggle blinking colons
  showCardContainer: boolean; // Material 3 surface container around digits
  timeZone: string; // Target time zone (default 'Europe/Berlin' for Germany/Central Europe)

  // === EINSTELLUNGEN (Allgemeine Optionen) ===
  appLanguage: 'de' | 'en';
  soundEnabled: boolean; // Subtle second tick audio
  vibrationEnabled: boolean; // Haptic feedback on mobile
  useAtomicSync: boolean; // Use online atomic clock (NTP) instead of device clock
  showSyncBadge: boolean; // Display sync indicator on the main screen
}

export type ClockFont = 'inter' | 'mono' | 'outfit' | 'school';
export type ClockWeight = '300' | '400' | '600' | '800';
export type BgType = 'color' | 'gradient' | 'image';
export type ThemeMode = 'dark' | 'light';
export type ColorScheme = 'light' | 'dark' | 'system';
export type TimeLanguage = 'de-standard' | 'de-regional' | 'en';
export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type SecondHandMode = 'ticking' | 'smooth';

export type SettingsTab =
  | 'darstellung'
  | 'uhr'
  | 'quiz'
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
  // School clock specific colors
  hourHandColor?: string;
  minuteHandColor?: string;
  secondHandColor?: string;
  ringColor?: string;
}

export interface ClockSettings {
  // === DARSTELLUNG (Alle Designoptionen) ===
  bgType: BgType;
  bgColor: string;
  gradientPresetId: string;
  customGradient: CustomGradient;
  bgOverlayOpacity: number; // 0 to 90 %
  bgBlur: number; // 0 to 25 px
  colorScheme: ColorScheme; // 'light' | 'dark' | 'system'
  themeMode: ThemeMode; // computed/active light | dark
  themeId?: string;

  // Hand & Dial Colors
  hourHandColor: string;
  minuteHandColor: string;
  secondHandColor: string;
  ringColor: string;
  accentColor: string;
  dialTransparency: number; // 0 (transparent) to 100 (opaque)

  // Typography & Scaling
  clockFont: ClockFont;
  clockWeight: ClockWeight;
  clockScale: number; // 70 to 140 percent
  enableAnimations: boolean;
  hasCustomImage: boolean;

  // === UHR (Schuluhr-Funktionen) ===
  showMinuteRing: boolean; // 5, 10, 15 ... 60
  showHourNumbers: boolean; // 1-12
  show24HourNumbers: boolean; // 13-24
  showHelpLines: boolean; // Minutenstriche & 5-Minuten-Markierungen
  showQuarterHalfSectors: boolean; // Farbige Viertel-/Halbkreis Sektoren
  showDigitalClock: boolean; // zuschaltbare Digitaluhr
  showSecondHand: boolean;
  secondHandMode: SecondHandMode; // 'ticking' | 'smooth'
  isLiveMode: boolean; // 'Jetzt'-Modus vs. manuell/lernen
  manualHour: number; // 0-23 when isLiveMode is false
  manualMinute: number; // 0-59
  manualSecond: number; // 0-59

  // Digital clock options
  is24Hour: boolean;
  showSeconds: boolean;
  showDate: boolean;
  showBlinkingSeparator: boolean;
  clockColor: string; // digital text color

  // === QUIZ & LERNEN ===
  isQuizActive: boolean;
  quizDifficulty: QuizDifficulty; // easy (volle/halbe), medium (viertel), hard (5m), expert (1m)
  timeLanguage: TimeLanguage; // de-standard, de-regional, en
  showQuizSolutionHint: boolean;
  quizTimerDuration: number; // 0 = unlimited, 15, 30, 45, 60 seconds

  // === EINSTELLUNGEN (Nur allgemeine Optionen) ===
  appLanguage: 'de' | 'en';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  useAtomicSync: boolean;
  showSyncBadge: boolean;
  enableBreathingAnimation: boolean;
}

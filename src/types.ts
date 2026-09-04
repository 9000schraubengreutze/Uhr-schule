export type ClockFont = 'inter' | 'mono' | 'outfit';
export type ClockWeight = '300' | '400' | '600' | '800';
export type BgType = 'color' | 'gradient' | 'image';
export type ThemeMode = 'dark' | 'light';

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
  showDate: boolean;
  showSeconds: boolean;
  is24Hour: boolean;
  clockColor: string;
  clockFont: ClockFont;
  clockWeight: ClockWeight;
  showBlinkingSeparator: boolean;
  bgType: BgType;
  bgColor: string;
  gradientPresetId: string;
  customGradient: CustomGradient;
  bgOverlayOpacity: number; // 0 to 90 percent
  bgBlur: number; // 0 to 25 px
  themeMode: ThemeMode;
  hasCustomImage: boolean;
  useAtomicSync: boolean;
  showSyncBadge: boolean;
  enableBreathingAnimation: boolean;
  themeId?: string;
  accentColor?: string;
}

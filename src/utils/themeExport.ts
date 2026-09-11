import { ClockSettings } from '../types';
import { DEFAULT_SETTINGS } from './presets';

export interface ExportedThemeConfig {
  version: 1;
  app: 'Online-Atomuhr WebClock';
  exportedAt: string;
  name?: string;
  description?: string;
  settings: ClockSettings;
}

/**
 * Validates and sanitizes imported settings object against known types
 */
export function sanitizeClockSettings(input: any): ClockSettings {
  if (!input || typeof input !== 'object') {
    throw new Error('Ungültiges Datenformat: Kein JSON-Objekt.');
  }

  // Support both full wrapper format and direct settings payload
  const raw = input.settings && typeof input.settings === 'object' ? input.settings : input;

  const validBgTypes = ['gradient', 'solid', 'image'];
  const validFontFamilies = ['outfit', 'inter', 'mono', 'digital', 'scholastic', 'serif'];
  const validFontWeights = ['light', 'normal', 'semibold', 'bold', 'extrabold'];
  const validColorSchemes = ['light', 'dark', 'system'];
  const validThemeModes = ['light', 'dark'];
  const validDateFormats = ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
  const validColonAnimations = ['pulse', 'blink', 'glow', 'bounce', 'static'];
  const validParticles = ['none', 'snow', 'dust', 'stars', 'rain', 'bubbles'];

  const sanitized: ClockSettings = {
    ...DEFAULT_SETTINGS,
    bgType: validBgTypes.includes(raw.bgType) ? raw.bgType : DEFAULT_SETTINGS.bgType,
    bgColor: typeof raw.bgColor === 'string' && raw.bgColor.trim() ? raw.bgColor : DEFAULT_SETTINGS.bgColor,
    gradientPresetId:
      typeof raw.gradientPresetId === 'string' ? raw.gradientPresetId : DEFAULT_SETTINGS.gradientPresetId,
    customGradient: {
      color1: typeof raw.customGradient?.color1 === 'string' ? raw.customGradient.color1 : '#1e1b4b',
      color2: typeof raw.customGradient?.color2 === 'string' ? raw.customGradient.color2 : '#0f172a',
      angle: typeof raw.customGradient?.angle === 'number' ? raw.customGradient.angle : 135,
    },
    bgOverlayOpacity:
      typeof raw.bgOverlayOpacity === 'number'
        ? Math.max(0, Math.min(90, raw.bgOverlayOpacity))
        : DEFAULT_SETTINGS.bgOverlayOpacity,
    bgBlur: typeof raw.bgBlur === 'number' ? Math.max(0, Math.min(25, raw.bgBlur)) : DEFAULT_SETTINGS.bgBlur,
    colorScheme: validColorSchemes.includes(raw.colorScheme) ? raw.colorScheme : DEFAULT_SETTINGS.colorScheme,
    themeMode: validThemeModes.includes(raw.themeMode) ? raw.themeMode : DEFAULT_SETTINGS.themeMode,
    themeId: typeof raw.themeId === 'string' ? raw.themeId : DEFAULT_SETTINGS.themeId,

    particleEffect: validParticles.includes(raw.particleEffect) ? raw.particleEffect : DEFAULT_SETTINGS.particleEffect,
    particleIntensity:
      typeof raw.particleIntensity === 'number'
        ? Math.max(10, Math.min(100, raw.particleIntensity))
        : DEFAULT_SETTINGS.particleIntensity,
    particleColor:
      typeof raw.particleColor === 'string' && raw.particleColor.trim()
        ? raw.particleColor
        : DEFAULT_SETTINGS.particleColor,
    particleSpeed:
      typeof raw.particleSpeed === 'number'
        ? Math.max(1, Math.min(5, raw.particleSpeed))
        : DEFAULT_SETTINGS.particleSpeed,

    clockColor:
      typeof raw.clockColor === 'string' && raw.clockColor.trim() ? raw.clockColor : DEFAULT_SETTINGS.clockColor,
    accentColor:
      typeof raw.accentColor === 'string' && raw.accentColor.trim() ? raw.accentColor : DEFAULT_SETTINGS.accentColor,
    clockFont: validFontFamilies.includes(raw.clockFont) ? raw.clockFont : DEFAULT_SETTINGS.clockFont,
    clockWeight: validFontWeights.includes(raw.clockWeight) ? raw.clockWeight : DEFAULT_SETTINGS.clockWeight,
    clockScale:
      typeof raw.clockScale === 'number'
        ? Math.max(70, Math.min(140, raw.clockScale))
        : DEFAULT_SETTINGS.clockScale,
    enableBreathingAnimation:
      typeof raw.enableBreathingAnimation === 'boolean'
        ? raw.enableBreathingAnimation
        : DEFAULT_SETTINGS.enableBreathingAnimation,
    enableGlow: typeof raw.enableGlow === 'boolean' ? raw.enableGlow : DEFAULT_SETTINGS.enableGlow,
    hasCustomImage: Boolean(raw.hasCustomImage),

    is24Hour: typeof raw.is24Hour === 'boolean' ? raw.is24Hour : DEFAULT_SETTINGS.is24Hour,
    showSeconds: typeof raw.showSeconds === 'boolean' ? raw.showSeconds : DEFAULT_SETTINGS.showSeconds,
    showDate: typeof raw.showDate === 'boolean' ? raw.showDate : DEFAULT_SETTINGS.showDate,
    dateFormat: validDateFormats.includes(raw.dateFormat) ? raw.dateFormat : DEFAULT_SETTINGS.dateFormat,
    showDayOfWeek: typeof raw.showDayOfWeek === 'boolean' ? raw.showDayOfWeek : DEFAULT_SETTINGS.showDayOfWeek,
    showBlinkingSeparator:
      typeof raw.showBlinkingSeparator === 'boolean'
        ? raw.showBlinkingSeparator
        : DEFAULT_SETTINGS.showBlinkingSeparator,
    colonAnimation: validColonAnimations.includes(raw.colonAnimation)
      ? raw.colonAnimation
      : DEFAULT_SETTINGS.colonAnimation,
    colonPulseIntensity:
      typeof raw.colonPulseIntensity === 'number'
        ? Math.max(0.1, Math.min(1.0, raw.colonPulseIntensity))
        : DEFAULT_SETTINGS.colonPulseIntensity,
    showCardContainer:
      typeof raw.showCardContainer === 'boolean' ? raw.showCardContainer : DEFAULT_SETTINGS.showCardContainer,
    backdropBlurIntensity:
      typeof raw.backdropBlurIntensity === 'number'
        ? Math.max(0, Math.min(40, raw.backdropBlurIntensity))
        : DEFAULT_SETTINGS.backdropBlurIntensity,
    timeZone: typeof raw.timeZone === 'string' && raw.timeZone.trim() ? raw.timeZone : DEFAULT_SETTINGS.timeZone,

    showAdditionalTimeZones:
      typeof raw.showAdditionalTimeZones === 'boolean'
        ? raw.showAdditionalTimeZones
        : DEFAULT_SETTINGS.showAdditionalTimeZones,
    additionalTimeZones: Array.isArray(raw.additionalTimeZones)
      ? raw.additionalTimeZones.map((z: any, idx: number) => ({
          id: typeof z?.id === 'string' && z.id.trim() ? z.id : `tz-${idx}-${z?.timeZone || 'custom'}`,
          name: typeof z?.name === 'string' && z.name.trim() ? z.name : 'Zeitzone',
          timeZone: typeof z?.timeZone === 'string' && z.timeZone.trim() ? z.timeZone : 'UTC',
          customLabel: typeof z?.customLabel === 'string' ? z.customLabel : undefined,
        }))
      : DEFAULT_SETTINGS.additionalTimeZones,

    appLanguage: raw.appLanguage === 'en' ? 'en' : 'de',
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    vibrationEnabled:
      typeof raw.vibrationEnabled === 'boolean' ? raw.vibrationEnabled : DEFAULT_SETTINGS.vibrationEnabled,
    useAtomicSync: typeof raw.useAtomicSync === 'boolean' ? raw.useAtomicSync : DEFAULT_SETTINGS.useAtomicSync,
    showSyncBadge: typeof raw.showSyncBadge === 'boolean' ? raw.showSyncBadge : DEFAULT_SETTINGS.showSyncBadge,
  };

  return sanitized;
}

/**
 * Triggers a browser download of the current clock settings as a JSON file
 */
export function exportClockSettingsToJson(settings: ClockSettings, filenamePrefix = 'webclock-theme'): void {
  const exportPayload: ExportedThemeConfig = {
    version: 1,
    app: 'Online-Atomuhr WebClock',
    exportedAt: new Date().toISOString(),
    name: settings.themeId ? `Design (${settings.themeId})` : 'Benutzerdefiniertes Design',
    description: `Exportiertes WebClock Design (Schrift: ${settings.clockFont}, Farbe: ${settings.clockColor})`,
    settings,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `${filenamePrefix}-${dateStr}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an uploaded file as clock settings
 */
export async function importClockSettingsFromFile(file: File): Promise<ClockSettings> {
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Die ausgewählte Datei ist keine gültige JSON-Datei.');
  }

  return sanitizeClockSettings(parsed);
}

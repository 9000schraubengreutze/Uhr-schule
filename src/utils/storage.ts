import { ClockSettings } from '../types';
import { DEFAULT_SETTINGS } from './presets';

const SETTINGS_KEY = 'webclock_settings_v1';
const USER_DEFAULT_KEY = 'webclock_user_default_v1';
const DB_NAME = 'webclock_db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const IMAGE_KEY = 'user_background';

export function loadSettings(): ClockSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      dateFormat:
        parsed.dateFormat === 'MM/DD/YYYY' || parsed.dateFormat === 'YYYY-MM-DD' || parsed.dateFormat === 'DD.MM.YYYY'
          ? parsed.dateFormat
          : DEFAULT_SETTINGS.dateFormat,
      colonAnimation:
        parsed.colonAnimation === 'pulse' ||
        parsed.colonAnimation === 'blink' ||
        parsed.colonAnimation === 'glow' ||
        parsed.colonAnimation === 'bounce' ||
        parsed.colonAnimation === 'static'
          ? parsed.colonAnimation
          : parsed.showBlinkingSeparator
          ? 'blink'
          : DEFAULT_SETTINGS.colonAnimation,
      colonPulseIntensity:
        typeof parsed.colonPulseIntensity === 'number'
          ? Math.max(0.1, Math.min(1.0, parsed.colonPulseIntensity))
          : DEFAULT_SETTINGS.colonPulseIntensity,
      showCardContainer:
        typeof parsed.showCardContainer === 'boolean'
          ? parsed.showCardContainer
          : DEFAULT_SETTINGS.showCardContainer,
      backdropBlurIntensity:
        typeof parsed.backdropBlurIntensity === 'number'
          ? Math.max(0, Math.min(40, parsed.backdropBlurIntensity))
          : DEFAULT_SETTINGS.backdropBlurIntensity,
      timeZone: parsed.timeZone || DEFAULT_SETTINGS.timeZone,
      showAdditionalTimeZones:
        typeof parsed.showAdditionalTimeZones === 'boolean'
          ? parsed.showAdditionalTimeZones
          : DEFAULT_SETTINGS.showAdditionalTimeZones,
      additionalTimeZones: Array.isArray(parsed.additionalTimeZones)
        ? parsed.additionalTimeZones.map((z: any, idx: number) => ({
            id: typeof z?.id === 'string' && z.id.trim() ? z.id : `tz-${idx}-${z?.timeZone || 'zone'}`,
            name: typeof z?.name === 'string' ? z.name : 'Zeitzone',
            timeZone: typeof z?.timeZone === 'string' ? z.timeZone : 'UTC',
            customLabel: typeof z?.customLabel === 'string' ? z.customLabel : undefined,
          }))
        : DEFAULT_SETTINGS.additionalTimeZones,
      particleEffect: parsed.particleEffect || DEFAULT_SETTINGS.particleEffect,
      particleIntensity:
        typeof parsed.particleIntensity === 'number'
          ? parsed.particleIntensity
          : DEFAULT_SETTINGS.particleIntensity,
      particleColor: parsed.particleColor || DEFAULT_SETTINGS.particleColor,
      particleSpeed:
        typeof parsed.particleSpeed === 'number'
          ? parsed.particleSpeed
          : DEFAULT_SETTINGS.particleSpeed,
      customGradient: {
        ...DEFAULT_SETTINGS.customGradient,
        ...(parsed.customGradient || {}),
      },
    };
  } catch (err) {
    console.warn('Failed to parse saved settings, using defaults', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ClockSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings to localStorage', err);
  }
}

export function saveCustomDefaultView(settings: ClockSettings): void {
  try {
    localStorage.setItem(USER_DEFAULT_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save custom default view', err);
  }
}

export function loadCustomDefaultView(): ClockSettings | null {
  try {
    const raw = localStorage.getItem(USER_DEFAULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function resetAllSettings(): ClockSettings {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(USER_DEFAULT_KEY);
  } catch {
    // Ignored
  }
  return DEFAULT_SETTINGS;
}

// Open IndexedDB database for local image persistence without server
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeLocalImage(fileOrBlob: Blob): Promise<string> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fileOrBlob, IMAGE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return URL.createObjectURL(fileOrBlob);
  } catch (err) {
    console.warn('Could not save to IndexedDB, fallback to memory ObjectURL', err);
    return URL.createObjectURL(fileOrBlob);
  }
}

export async function loadStoredImage(): Promise<string | null> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(IMAGE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (err) {
    console.warn('Failed to load image from IndexedDB', err);
    return null;
  }
}

export async function removeStoredImage(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(IMAGE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to remove image from IndexedDB', err);
  }
}

import { ClockSettings, SavedWallpaperItem } from '../types';
import { DEFAULT_SETTINGS } from './presets';

const SETTINGS_KEY = 'webclock_settings_v1';
const USER_DEFAULT_KEY = 'webclock_user_default_v1';
const DB_NAME = 'webclock_db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const IMAGE_KEY = 'user_background';
const WALLPAPERS_META_KEY = 'webclock_saved_wallpapers_meta_v1';
const ACTIVE_WALLPAPER_ID_KEY = 'webclock_active_wallpaper_id';

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
      showBatteryIndicator:
        typeof parsed.showBatteryIndicator === 'boolean'
          ? parsed.showBatteryIndicator
          : DEFAULT_SETTINGS.showBatteryIndicator,
      additionalTimeZones: Array.isArray(parsed.additionalTimeZones)
        ? parsed.additionalTimeZones.map((z: any, idx: number) => ({
            id: typeof z?.id === 'string' && z.id.trim() ? z.id : `tz-${idx}-${z?.timeZone || 'zone'}`,
            name: typeof z?.name === 'string' ? z.name : 'Zeitzone',
            timeZone: typeof z?.timeZone === 'string' ? z.timeZone : 'UTC',
            customLabel: typeof z?.customLabel === 'string' ? z.customLabel : undefined,
            flag: typeof z?.flag === 'string' ? z.flag : undefined,
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
          ? parsed.particleSpeed === 2
            ? 1.0
            : parsed.particleSpeed === 1
            ? 0.5
            : parsed.particleSpeed === 3
            ? 1.5
            : Math.max(0.2, Math.min(3.0, Number(parsed.particleSpeed.toFixed(2))))
          : DEFAULT_SETTINGS.particleSpeed,
      autoScaleFontSize:
        typeof parsed.autoScaleFontSize === 'boolean'
          ? parsed.autoScaleFontSize
          : DEFAULT_SETTINGS.autoScaleFontSize,
      ecoMode:
        typeof parsed.ecoMode === 'boolean'
          ? parsed.ecoMode
          : DEFAULT_SETTINGS.ecoMode,
      zenScheduleEnabled:
        typeof parsed.zenScheduleEnabled === 'boolean'
          ? parsed.zenScheduleEnabled
          : DEFAULT_SETTINGS.zenScheduleEnabled,
      zenScheduleStartTime:
        typeof parsed.zenScheduleStartTime === 'string' && /^\d{1,2}:\d{2}$/.test(parsed.zenScheduleStartTime)
          ? parsed.zenScheduleStartTime
          : DEFAULT_SETTINGS.zenScheduleStartTime,
      zenScheduleEndTime:
        typeof parsed.zenScheduleEndTime === 'string' && /^\d{1,2}:\d{2}$/.test(parsed.zenScheduleEndTime)
          ? parsed.zenScheduleEndTime
          : DEFAULT_SETTINGS.zenScheduleEndTime,
      showDailyQuote:
        typeof parsed.showDailyQuote === 'boolean'
          ? parsed.showDailyQuote
          : DEFAULT_SETTINGS.showDailyQuote,
      quoteFont:
        parsed.quoteFont === 'serif' ||
        parsed.quoteFont === 'outfit' ||
        parsed.quoteFont === 'inter' ||
        parsed.quoteFont === 'mono' ||
        parsed.quoteFont === 'school' ||
        parsed.quoteFont === 'sans'
          ? parsed.quoteFont
          : DEFAULT_SETTINGS.quoteFont,
      quoteColor:
        typeof parsed.quoteColor === 'string' && parsed.quoteColor.trim()
          ? parsed.quoteColor.trim()
          : DEFAULT_SETTINGS.quoteColor,
      quoteAuthorColor:
        typeof parsed.quoteAuthorColor === 'string' && parsed.quoteAuthorColor.trim()
          ? parsed.quoteAuthorColor.trim()
          : DEFAULT_SETTINGS.quoteAuthorColor,
      enableEntranceAnimation:
        typeof parsed.enableEntranceAnimation === 'boolean'
          ? parsed.enableEntranceAnimation
          : DEFAULT_SETTINGS.enableEntranceAnimation,
      entranceAnimationType:
        parsed.entranceAnimationType === 'slide-up' ||
        parsed.entranceAnimationType === 'slide-down' ||
        parsed.entranceAnimationType === 'fade-in' ||
        parsed.entranceAnimationType === 'rotate' ||
        parsed.entranceAnimationType === 'zoom-in' ||
        parsed.entranceAnimationType === 'flip'
          ? parsed.entranceAnimationType
          : DEFAULT_SETTINGS.entranceAnimationType,
      entranceWakeScreenEnabled:
        typeof parsed.entranceWakeScreenEnabled === 'boolean'
          ? parsed.entranceWakeScreenEnabled
          : DEFAULT_SETTINGS.entranceWakeScreenEnabled,
      entranceMenuExitEnabled:
        typeof parsed.entranceMenuExitEnabled === 'boolean'
          ? parsed.entranceMenuExitEnabled
          : DEFAULT_SETTINGS.entranceMenuExitEnabled,
      entranceZenToggleEnabled:
        typeof parsed.entranceZenToggleEnabled === 'boolean'
          ? parsed.entranceZenToggleEnabled
          : DEFAULT_SETTINGS.entranceZenToggleEnabled,
      enableGlow:
        typeof parsed.enableGlow === 'boolean'
          ? parsed.enableGlow
          : DEFAULT_SETTINGS.enableGlow,
      glowIntensity:
        typeof parsed.glowIntensity === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.glowIntensity)))
          : DEFAULT_SETTINGS.glowIntensity,
      glowSpread:
        typeof parsed.glowSpread === 'number'
          ? Math.max(10, Math.min(120, Math.round(parsed.glowSpread)))
          : DEFAULT_SETTINGS.glowSpread,
      glowColor:
        typeof parsed.glowColor === 'string' && parsed.glowColor.trim()
          ? parsed.glowColor.trim()
          : undefined,
      digitTransition:
        parsed.digitTransition === 'flip' ||
        parsed.digitTransition === 'slide' ||
        parsed.digitTransition === 'crossfade' ||
        parsed.digitTransition === 'slide-fade' ||
        parsed.digitTransition === 'none'
          ? parsed.digitTransition
          : parsed.digitTransition === 'fade' && parsed._digitTransitionCustomized
          ? 'fade'
          : DEFAULT_SETTINGS.digitTransition,
      digitFadeDuration:
        typeof parsed.digitFadeDuration === 'number'
          ? Math.max(150, Math.min(800, parsed.digitFadeDuration))
          : DEFAULT_SETTINGS.digitFadeDuration,
      hasCustomImage:
        typeof parsed.hasCustomImage === 'boolean'
          ? parsed.hasCustomImage
          : DEFAULT_SETTINGS.hasCustomImage,
      activeWallpaperId:
        typeof parsed.activeWallpaperId === 'string'
          ? parsed.activeWallpaperId
          : undefined,
      activeWallpaperUrl:
        typeof parsed.activeWallpaperUrl === 'string'
          ? parsed.activeWallpaperUrl
          : undefined,
      wallpaperEngineAutoParticles:
        typeof parsed.wallpaperEngineAutoParticles === 'boolean'
          ? parsed.wallpaperEngineAutoParticles
          : DEFAULT_SETTINGS.wallpaperEngineAutoParticles,
      wallpaperEngineAutoColors:
        typeof parsed.wallpaperEngineAutoColors === 'boolean'
          ? parsed.wallpaperEngineAutoColors
          : DEFAULT_SETTINGS.wallpaperEngineAutoColors,
      // Standardmäßig stumm: soundEnabled ist standardmäßig false, es sei denn, der Nutzer hat Töne explizit aktiviert
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? (typeof window !== 'undefined' && localStorage.getItem('webclock_sound_explicit_choice_v1') === 'true'
              ? parsed.soundEnabled
              : false)
          : false,
      clockFont:
        parsed.clockFont === 'inter' ||
        parsed.clockFont === 'mono' ||
        parsed.clockFont === 'outfit' ||
        parsed.clockFont === 'school' ||
        parsed.clockFont === 'serif' ||
        parsed.clockFont === 'sans'
          ? parsed.clockFont
          : DEFAULT_SETTINGS.clockFont,
      typographySet:
        typeof parsed.typographySet === 'string' ? parsed.typographySet : DEFAULT_SETTINGS.typographySet,
      customGradient: {
        ...DEFAULT_SETTINGS.customGradient,
        ...(parsed.customGradient || {}),
      },
      pomodoro: parsed.pomodoro && typeof parsed.pomodoro === 'object'
        ? {
            ...DEFAULT_SETTINGS.pomodoro,
            ...parsed.pomodoro,
            workDuration:
              typeof parsed.pomodoro.workDuration === 'number'
                ? Math.max(1, Math.min(120, Math.round(parsed.pomodoro.workDuration)))
                : DEFAULT_SETTINGS.pomodoro.workDuration,
            shortBreakDuration:
              typeof parsed.pomodoro.shortBreakDuration === 'number'
                ? Math.max(1, Math.min(60, Math.round(parsed.pomodoro.shortBreakDuration)))
                : DEFAULT_SETTINGS.pomodoro.shortBreakDuration,
            longBreakDuration:
              typeof parsed.pomodoro.longBreakDuration === 'number'
                ? Math.max(1, Math.min(90, Math.round(parsed.pomodoro.longBreakDuration)))
                : DEFAULT_SETTINGS.pomodoro.longBreakDuration,
            longBreakInterval:
              typeof parsed.pomodoro.longBreakInterval === 'number'
                ? Math.max(1, Math.min(12, Math.round(parsed.pomodoro.longBreakInterval)))
                : DEFAULT_SETTINGS.pomodoro.longBreakInterval,
            soundVolume:
              typeof parsed.pomodoro.soundVolume === 'number'
                ? Math.max(0, Math.min(1, parsed.pomodoro.soundVolume))
                : DEFAULT_SETTINGS.pomodoro.soundVolume,
          }
        : DEFAULT_SETTINGS.pomodoro,
      ambientSound: parsed.ambientSound && typeof parsed.ambientSound === 'object'
        ? {
            activeSound:
              parsed.ambientSound.activeSound === 'none' ||
              parsed.ambientSound.activeSound === 'rain' ||
              parsed.ambientSound.activeSound === 'forest' ||
              parsed.ambientSound.activeSound === 'white_noise' ||
              parsed.ambientSound.activeSound === 'pink_noise' ||
              parsed.ambientSound.activeSound === 'waves' ||
              parsed.ambientSound.activeSound === 'fireplace'
                ? parsed.ambientSound.activeSound
                : DEFAULT_SETTINGS.ambientSound.activeSound,
            volume:
              typeof parsed.ambientSound.volume === 'number'
                ? Math.max(0.05, Math.min(1.0, parsed.ambientSound.volume))
                : DEFAULT_SETTINGS.ambientSound.volume,
            isPlaying:
              typeof parsed.ambientSound.isPlaying === 'boolean'
                ? parsed.ambientSound.isPlaying
                : false,
            autoPlayOnStart:
              typeof parsed.ambientSound.autoPlayOnStart === 'boolean'
                ? parsed.ambientSound.autoPlayOnStart
                : false,
          }
        : DEFAULT_SETTINGS.ambientSound,
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
    localStorage.removeItem('webclock_sound_explicit_choice_v1');
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

export interface SaveWallpaperOptions {
  id?: string;
  name?: string;
  prompt?: string;
  style?: string;
  mode?: 'create' | 'edit' | 'upload';
  isAi?: boolean;
}

// Helper to get wallpaper metadata list
async function getSavedWallpapersMeta(): Promise<SavedWallpaperItem[]> {
  try {
    const raw = localStorage.getItem(WALLPAPERS_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  try {
    const db = await openDb();
    const list = await new Promise<SavedWallpaperItem[] | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(WALLPAPERS_META_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
    if (Array.isArray(list)) return list;
  } catch {}

  return [];
}

// Helper to save wallpaper metadata list
async function saveWallpapersMeta(list: SavedWallpaperItem[]): Promise<void> {
  try {
    localStorage.setItem(WALLPAPERS_META_KEY, JSON.stringify(list));
  } catch {}

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(list, WALLPAPERS_META_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

// Save a wallpaper into IndexedDB and set it as active
export async function saveWallpaper(
  fileOrBlob: Blob,
  meta?: SaveWallpaperOptions
): Promise<{ id: string; objectUrl: string }> {
  const id = meta?.id || `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const objectUrl = URL.createObjectURL(fileOrBlob);

  try {
    const db = await openDb();

    // Store blob for this specific wallpaper, and as current background
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(fileOrBlob, `wallpaper_blob_${id}`);
      store.put(fileOrBlob, IMAGE_KEY);
      store.put(id, ACTIVE_WALLPAPER_ID_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    const newItem: SavedWallpaperItem = {
      id,
      name: meta?.name || (meta?.prompt ? meta.prompt.slice(0, 42) : 'Gespeichertes Wallpaper'),
      prompt: meta?.prompt || '',
      createdAt: Date.now(),
      style: meta?.style || 'cinematic',
      mode: meta?.mode || (meta?.isAi !== false ? 'create' : 'upload'),
      isAi: meta?.isAi !== false,
      isActive: true,
    };

    const current = await getSavedWallpapersMeta();
    const updated = [newItem, ...current.filter((i) => i.id !== id)].slice(0, 30);
    await saveWallpapersMeta(updated);

    try {
      localStorage.setItem(ACTIVE_WALLPAPER_ID_KEY, id);
    } catch {}

    return { id, objectUrl };
  } catch (err) {
    console.warn('Could not save wallpaper to IndexedDB, fallback to memory ObjectURL', err);
    return { id, objectUrl };
  }
}

// Backwards-compatible local image upload/storage
export async function storeLocalImage(
  fileOrBlob: Blob,
  meta?: SaveWallpaperOptions
): Promise<string> {
  const { objectUrl } = await saveWallpaper(fileOrBlob, {
    mode: 'upload',
    isAi: false,
    name: (fileOrBlob as File).name || 'Eigenes Foto',
    ...meta,
  });
  return objectUrl;
}

// Retrieve all saved wallpapers with ObjectURLs and active status
export async function getSavedWallpapers(): Promise<SavedWallpaperItem[]> {
  try {
    const db = await openDb();
    let metaList = await getSavedWallpapersMeta();

    let activeId: string | null = null;
    try {
      activeId = await new Promise<string | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(ACTIVE_WALLPAPER_ID_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {}

    if (!activeId) {
      activeId = localStorage.getItem(ACTIVE_WALLPAPER_ID_KEY);
    }

    // Auto-migrate old localStorage history if DB has no wallpapers yet
    if (metaList.length === 0) {
      try {
        const oldHistory = localStorage.getItem('webclock_gemini_bg_history_v2');
        if (oldHistory) {
          const parsed = JSON.parse(oldHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const old of parsed.slice(0, 8)) {
              if (old.imageUrl) {
                try {
                  const res = await fetch(old.imageUrl);
                  const blob = await res.blob();
                  const saved = await saveWallpaper(blob, {
                    id: old.id || `migrated-${Date.now()}`,
                    prompt: old.prompt,
                    style: old.style,
                    mode: old.mode || 'create',
                    isAi: true,
                  });
                  metaList.push({
                    id: saved.id,
                    prompt: old.prompt,
                    createdAt: old.createdAt || Date.now(),
                    style: old.style || 'cinematic',
                    mode: old.mode || 'create',
                    isAi: true,
                    url: saved.objectUrl,
                  });
                } catch {}
              }
            }
          }
        }
      } catch (migErr) {
        console.warn('Migration error', migErr);
      }
    }

    // Load blobs and create ObjectURLs
    const results: SavedWallpaperItem[] = [];
    for (const item of metaList) {
      let itemUrl = item.url;
      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(`wallpaper_blob_${item.id}`);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
        if (blob) {
          itemUrl = URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn(`Could not resolve blob for ${item.id}`, e);
      }

      if (itemUrl) {
        results.push({
          ...item,
          url: itemUrl,
          isActive: Boolean(activeId && activeId === item.id),
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('Failed to load saved wallpapers', err);
    return [];
  }
}

// Set a specific wallpaper from the library as active
export async function setActiveWallpaper(id: string): Promise<string | null> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`wallpaper_blob_${id}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (!blob) {
      console.warn(`No blob found for wallpaper ${id}`);
      return null;
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, IMAGE_KEY);
      store.put(id, ACTIVE_WALLPAPER_ID_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    try {
      localStorage.setItem(ACTIVE_WALLPAPER_ID_KEY, id);
    } catch {}

    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Failed to set active wallpaper', err);
    return null;
  }
}

// Delete a wallpaper from the library
export async function deleteSavedWallpaper(id: string): Promise<void> {
  try {
    const db = await openDb();
    const activeId = localStorage.getItem(ACTIVE_WALLPAPER_ID_KEY);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(`wallpaper_blob_${id}`);
      if (activeId === id) {
        store.delete(IMAGE_KEY);
        store.delete(ACTIVE_WALLPAPER_ID_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    if (activeId === id) {
      try {
        localStorage.removeItem(ACTIVE_WALLPAPER_ID_KEY);
      } catch {}
    }

    const current = await getSavedWallpapersMeta();
    const updated = current.filter((item) => item.id !== id);
    await saveWallpapersMeta(updated);
  } catch (err) {
    console.warn('Failed to delete saved wallpaper', err);
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
      store.delete(IMAGE_KEY);
      store.delete(ACTIVE_WALLPAPER_ID_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    try {
      localStorage.removeItem(ACTIVE_WALLPAPER_ID_KEY);
    } catch {}
  } catch (err) {
    console.warn('Failed to remove image from IndexedDB', err);
  }
}

import { AnimatedBgId, LiveWallpaperBlendMode, ClockSettings } from '../types';
import { ANIMATED_BACKGROUNDS, AnimatedBgDef } from '../data/animatedBackgrounds';
import { WallpaperItem } from '../data/wallpapers';
import { saveWallpaper } from './storage';

export interface LiveRecommendation {
  effectId: AnimatedBgId;
  effectDef: AnimatedBgDef;
  blendMode: LiveWallpaperBlendMode;
  opacity: number; // 10 to 100
  speed: number;
  intensity: number;
  clockColor: string;
  accentColor: string;
  reasonDe: string;
}

export interface LiveBlendModeOption {
  id: LiveWallpaperBlendMode;
  labelDe: string;
  descriptionDe: string;
  bestForDe: string;
}

export const LIVE_WALLPAPER_BLEND_MODES: LiveBlendModeOption[] = [
  {
    id: 'screen',
    labelDe: 'Lichtschein (Screen)',
    descriptionDe: 'Schwarze Töne werden transparent, helle Partikel leuchten intensiv.',
    bestForDe: 'Sterne, Nordlichter, Matrix, Funken',
  },
  {
    id: 'overlay',
    labelDe: 'Dynamischer Kontrast (Overlay)',
    descriptionDe: 'Verstärkt Kontraste und Sättigung des Hintergrundbildes dynamisch.',
    bestForDe: 'Wellen, Cyber-Gitter, Landschaftsfotos',
  },
  {
    id: 'soft-light',
    labelDe: 'Sanfte Tiefe (Soft Light)',
    descriptionDe: 'Subtile, malerische Beleuchtung für maximale Lesbarkeit der Uhr.',
    bestForDe: 'Wald, Nebel, Kirschblüten, Minimalismus',
  },
  {
    id: 'lighten',
    labelDe: 'Glanzakzente (Lighten)',
    descriptionDe: 'Behält dunkle Bilddetails bei und lässt helle Lichtreflexe durchscheinen.',
    bestForDe: 'Glühwürmchen, Warp-Sterne, Partikelschleier',
  },
  {
    id: 'color-dodge',
    labelDe: 'Neon-Glow (Color Dodge)',
    descriptionDe: 'Extrem leuchtende Glüh- und Neoneffekte für futuristische Looks.',
    bestForDe: 'Cyberpunk, Synthwave, Sci-Fi',
  },
  {
    id: 'normal',
    labelDe: 'Direkte Transparenz (Normal)',
    descriptionDe: 'Gleichmäßige Überlagerung mit regulärer Deckkraft.',
    bestForDe: 'Vollflächige Animationen & sanfte Farbfilter',
  },
];

/**
 * Intelligently analyzes a wallpaper image (category, tags, title)
 * and determines the visually optimal live background scene, blend mode,
 * opacity, and harmonious clock typography colors.
 */
export function recommendLiveEffectForWallpaper(
  wallpaper?: WallpaperItem | { title?: string; category?: string; tags?: string[] } | null
): LiveRecommendation {
  const cat = (wallpaper?.category || '').toLowerCase();
  const title = (wallpaper?.title || '').toLowerCase();
  const tags = ((wallpaper as any)?.tags || []).map((t: string) => t.toLowerCase());

  let targetEffectId: AnimatedBgId = 'aurora';
  let blendMode: LiveWallpaperBlendMode = 'screen';
  let opacity = 70;
  let speed = 1.0;
  let intensity = 80;
  let reasonDe = 'Nordlicht-Schleier mit sanftem Farbglühen';

  // 1. Space / Galaxy / Stars / Cosmos
  if (
    cat === 'space' ||
    tags.some((t: string) => ['space', 'galaxy', 'weltall', 'sterne', 'nebula', 'cosmos'].includes(t)) ||
    title.includes('space') ||
    title.includes('galaxy') ||
    title.includes('nebel') ||
    title.includes('sterne')
  ) {
    targetEffectId = 'cosmic-vortex';
    blendMode = 'screen';
    opacity = 78;
    speed = 0.9;
    intensity = 85;
    reasonDe = 'Kosmischer Partikelwirbel für galaktische Tiefenwirkung & Sternenlicht';
  }
  // 2. Cyberpunk / Neon / Tech / Sci-Fi
  else if (
    cat === 'cyberpunk' ||
    tags.some((t: string) => ['cyberpunk', 'neon', 'matrix', 'future', 'sci-fi', 'code'].includes(t)) ||
    title.includes('cyber') ||
    title.includes('neon') ||
    title.includes('matrix') ||
    title.includes('tech')
  ) {
    targetEffectId = 'cyber-hex';
    blendMode = 'screen';
    opacity = 82;
    speed = 1.1;
    intensity = 85;
    reasonDe = 'Cyber-Hexagon Gitter & pulsierende Datenströme für Hightech-Ästhetik';
  }
  // 3. Nature / Forest / Trees / Mountain
  else if (
    cat === 'nature' ||
    tags.some((t: string) => ['wald', 'forest', 'baum', 'nature', 'natur', 'berg', 'mountain'].includes(t)) ||
    title.includes('wald') ||
    title.includes('forest') ||
    title.includes('nature') ||
    title.includes('nebel')
  ) {
    targetEffectId = 'mystic-forest';
    blendMode = 'soft-light';
    opacity = 68;
    speed = 0.8;
    intensity = 75;
    reasonDe = 'Sanfter Waldnebel & wandernde Sonnenlichtstrahlen für Ruhe und Tiefe';
  }
  // 4. Ocean / Water / Sea / Underwater
  else if (
    cat === 'ocean' ||
    tags.some((t: string) => ['ocean', 'meer', 'wasser', 'water', 'wave', 'abyss', 'beach'].includes(t)) ||
    title.includes('ozean') ||
    title.includes('meer') ||
    title.includes('wasser') ||
    title.includes('ocean')
  ) {
    targetEffectId = 'ocean-abyss';
    blendMode = 'overlay';
    opacity = 72;
    speed = 0.85;
    intensity = 80;
    reasonDe = 'Tiefsee-Kaustik und aufsteigende Lichtbläschen im Meereslicht';
  }
  // 5. Sunset / Fire / Warm / Dusk
  else if (
    cat === 'sunset' ||
    tags.some((t: string) => ['sunset', 'sonnenuntergang', 'fire', 'feuer', 'warm', 'abend'].includes(t)) ||
    title.includes('sunset') ||
    title.includes('sonnenuntergang') ||
    title.includes('abend')
  ) {
    targetEffectId = 'sunset-waves';
    blendMode = 'screen';
    opacity = 75;
    speed = 0.95;
    intensity = 82;
    reasonDe = 'Dynamische Wellenreflexionen und warme Abendglut';
  }
  // 6. Anime / Fantasy / Blossom
  else if (
    cat === 'anime' ||
    tags.some((t: string) => ['anime', 'sakura', 'blüte', 'fantasy', 'japan'].includes(t)) ||
    title.includes('sakura') ||
    title.includes('blüte')
  ) {
    targetEffectId = 'sakura';
    blendMode = 'soft-light';
    opacity = 70;
    speed = 0.85;
    intensity = 80;
    reasonDe = 'Sanft schwebende Kirschblüten im Frühlingswind';
  }
  // 7. Minimal / Abstract / Architecture
  else if (
    cat === 'minimal' ||
    cat === 'abstract' ||
    tags.some((t: string) => ['minimal', 'abstract', 'modern', 'gradient', 'mesh'].includes(t))
  ) {
    targetEffectId = 'fluid-mesh';
    blendMode = 'screen';
    opacity = 62;
    speed = 0.75;
    intensity = 70;
    reasonDe = 'Elegante, flüssige Farbmorph-Shader für moderne Zurückhaltung';
  }

  const effectDef =
    ANIMATED_BACKGROUNDS.find((b) => b.id === targetEffectId) || ANIMATED_BACKGROUNDS[0];

  return {
    effectId: targetEffectId,
    effectDef,
    blendMode,
    opacity,
    speed,
    intensity,
    clockColor: effectDef.recommendedClockColor || '#f8fafc',
    accentColor: effectDef.recommendedAccentColor || '#38bdf8',
    reasonDe,
  };
}

/**
 * Extracts dominant vibrant and readable colors from an HTMLCanvasElement
 */
export function extractDominantColorsFromCanvas(canvas: HTMLCanvasElement): {
  clockColor: string;
  accentColor: string;
  isDark: boolean;
} {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { clockColor: '#f8fafc', accentColor: '#38bdf8', isDark: true };
    }

    const sampleW = 40;
    const sampleH = 24;
    const offscreen = document.createElement('canvas');
    offscreen.width = sampleW;
    offscreen.height = sampleH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) {
      return { clockColor: '#f8fafc', accentColor: '#38bdf8', isDark: true };
    }

    offCtx.drawImage(canvas, 0, 0, sampleW, sampleH);
    const imgData = offCtx.getImageData(0, 0, sampleW, sampleH).data;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let maxSaturation = -1;
    let bestR = 56;
    let bestG = 189;
    let bestB = 248; // default cyan

    const count = imgData.length / 4;
    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];

      totalR += r;
      totalG += g;
      totalB += b;

      // Calculate saturation (max - min) / max
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const diff = maxC - minC;
      if (maxC > 40 && diff > maxSaturation) {
        maxSaturation = diff;
        bestR = r;
        bestG = g;
        bestB = b;
      }
    }

    const avgR = totalR / count;
    const avgG = totalG / count;
    const avgB = totalB / count;
    // Relative luminance
    const luminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;
    const isDark = luminance < 0.5;

    // Convert best vibrant color to hex
    const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
    const accentColor = `#${toHex(bestR)}${toHex(bestG)}${toHex(bestB)}`;

    // High contrast clock digit color
    const clockColor = isDark ? '#f8fafc' : '#0f172a';

    return { clockColor, accentColor, isDark };
  } catch (err) {
    console.warn('Failed to extract colors from canvas', err);
    return { clockColor: '#f8fafc', accentColor: '#38bdf8', isDark: true };
  }
}

/**
 * Captures the current frame of a live background canvas in high resolution,
 * saves it into the user's wallpaper library, extracts matching clock colors,
 * and returns the wallpaper ID, object URL, and recommended colors.
 */
export async function captureLiveBackgroundSnapshot(options: {
  effectId: AnimatedBgId;
  sourceCanvas?: HTMLCanvasElement | null;
  name?: string;
  width?: number;
  height?: number;
}): Promise<{
  id: string;
  objectUrl: string;
  clockColor: string;
  accentColor: string;
  blob: Blob;
}> {
  const { effectId, sourceCanvas, name } = options;
  const effectDef = ANIMATED_BACKGROUNDS.find((b) => b.id === effectId) || ANIMATED_BACKGROUNDS[0];

  let targetCanvas: HTMLCanvasElement | null = sourceCanvas || null;

  // If no source canvas provided, query active background or preview canvases in DOM
  if (!targetCanvas && typeof document !== 'undefined') {
    targetCanvas =
      document.querySelector<HTMLCanvasElement>(
        `#animated-bg-layer-a canvas, #animated-bg-layer-b canvas, canvas[data-effect-id="${effectId}"]`
      ) || document.querySelector<HTMLCanvasElement>('canvas');
  }

  if (!targetCanvas) {
    throw new Error('Kein aktiver Live-Canvas im Bildschirm gefunden.');
  }

  // Extract colors
  const { clockColor, accentColor } = extractDominantColorsFromCanvas(targetCanvas);

  // Convert canvas to Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    targetCanvas!.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Konnte Canvas nicht in Bilddaten umwandeln.'));
      },
      'image/png',
      0.95
    );
  });

  const wallpaperName = name || `${effectDef.nameDe} (Live-Schnappschuss)`;
  const saved = await saveWallpaper(blob, {
    name: wallpaperName,
    prompt: `Standbild aus Live-Hintergrund: ${effectDef.nameDe} (${effectDef.badge})`,
    style: 'live-capture',
    isAi: false,
    mode: 'create',
  });

  return {
    id: saved.id,
    objectUrl: saved.objectUrl,
    clockColor,
    accentColor,
    blob,
  };
}

/**
 * Triggers a direct download of a wallpaper image blob
 */
export function downloadWallpaperBlob(blob: Blob, filename = 'webclock-live-wallpaper.png') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

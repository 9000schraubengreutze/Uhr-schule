/**
 * Utility functions for color conversion, alpha blending, and ambient glow calculations
 */

export function colorWithAlpha(colorStr: string, alpha: number): string {
  if (!colorStr) return `rgba(56, 189, 248, ${alpha})`;
  const clampedAlpha = Math.max(0, Math.min(1, Number(alpha.toFixed(3))));

  const trimmed = colorStr.trim();

  // Hex color (#rgb or #rrggbb or #rrggbbaa)
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length === 8) {
      hex = hex.substring(0, 6);
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
      }
    }
  }

  // rgb(...) format
  if (trimmed.startsWith('rgb(')) {
    const match = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${clampedAlpha})`;
    }
  }

  // rgba(...) format
  if (trimmed.startsWith('rgba(')) {
    const match = trimmed.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/i);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${clampedAlpha})`;
    }
  }

  // CSS named colors or hsl fallbacks
  return trimmed;
}

/**
 * Calculates a 4-layer optical radiating text-shadow stack for digits
 */
export function calculateRadiatingTextShadow(
  color: string,
  intensityPercent: number = 55,
  spreadPx: number = 45
): string {
  const normIntensity = Math.max(0, Math.min(1, intensityPercent / 100));
  if (normIntensity <= 0) return 'none';

  const clampedSpread = Math.max(8, Math.min(120, spreadPx));

  const r1 = Math.max(2, Math.round(clampedSpread * 0.22));
  const r2 = Math.max(6, Math.round(clampedSpread * 0.6));
  const r3 = Math.max(12, Math.round(clampedSpread * 1.25));
  const r4 = Math.max(20, Math.round(clampedSpread * 2.1));

  const a1 = Math.min(0.95, Number((0.9 * normIntensity).toFixed(3)));
  const a2 = Math.min(0.75, Number((0.65 * normIntensity).toFixed(3)));
  const a3 = Math.min(0.45, Number((0.35 * normIntensity).toFixed(3)));
  const a4 = Math.min(0.25, Number((0.15 * normIntensity).toFixed(3)));

  return [
    `0 0 ${r1}px ${colorWithAlpha(color, a1)}`,
    `0 0 ${r2}px ${colorWithAlpha(color, a2)}`,
    `0 0 ${r3}px ${colorWithAlpha(color, a3)}`,
    `0 0 ${r4}px ${colorWithAlpha(color, a4)}`,
  ].join(', ');
}

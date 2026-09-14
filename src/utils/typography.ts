import { ClockFont, ClockWeight } from '../types';

export interface TypographySet {
  id: string;
  name: string;
  category: 'Monospace' | 'Serif' | 'Sans-Serif' | 'Display';
  font: ClockFont;
  defaultWeight: ClockWeight;
  tagline: string;
  description: string;
  sample: string;
  badge: string;
  fontClass: string;
  trackingClass: string;
}

export const TYPOGRAPHY_SETS: TypographySet[] = [
  {
    id: 'mono',
    name: 'Mono-space (Digital & Terminal)',
    category: 'Monospace',
    font: 'mono',
    defaultWeight: '600',
    tagline: 'Feste Zeichenbreite & Digitaluhren-Look (JetBrains Mono)',
    description: 'Präzise, gleichmäßig ausgerichtete Ziffern wie bei Atomuhren und Cockpit-Displays.',
    sample: '12:34:56',
    badge: 'Digital',
    fontClass: 'font-mono-digital',
    trackingClass: 'tracking-tight',
  },
  {
    id: 'serif',
    name: 'Serif (Klassisch & Elegant)',
    category: 'Serif',
    font: 'serif',
    defaultWeight: '600',
    tagline: 'Traditionelle Luxus-Serifenschrift (Playfair Display / Georgia)',
    description: 'Edle Ziffern mit zeitloser Noblesse, harmonischen Kontrasten und klassischen Serifen.',
    sample: '12:34:56',
    badge: 'Klassisch',
    fontClass: 'font-serif-clock',
    trackingClass: 'tracking-normal',
  },
  {
    id: 'sans-serif',
    name: 'Sans-Serif (Modern & Minimalistisch)',
    category: 'Sans-Serif',
    font: 'inter',
    defaultWeight: '600',
    tagline: 'Sachlich, neutral und zeitlos (Inter)',
    description: 'Optimale Lesbarkeit und pure Funktionalität für eine moderne, aufgeräumte Optik.',
    sample: '12:34:56',
    badge: 'Modern',
    fontClass: 'font-inter',
    trackingClass: 'tracking-tighter',
  },
  {
    id: 'geometric',
    name: 'Geometric Sans (Futuristisch & Rund)',
    category: 'Sans-Serif',
    font: 'outfit',
    defaultWeight: '600',
    tagline: 'Geometrische Kreisformen & Großzügigkeit (Outfit)',
    description: 'Harmonisch proportionierte Ziffern mit offener Ästhetik und weichen Bögen.',
    sample: '12:34:56',
    badge: 'Geometrisch',
    fontClass: 'font-outfit',
    trackingClass: 'tracking-tight',
  },
  {
    id: 'editorial-serif',
    name: 'Editorial Serif (Fein & Chronometer)',
    category: 'Serif',
    font: 'serif',
    defaultWeight: '400',
    tagline: 'Zarte Ziffern im Stil von Schweizer Luxusuhren',
    description: 'Filigrane Strichstärken und sanfter Schwung für ein anspruchsvolles Premium-Gefühl.',
    sample: '12:34:56',
    badge: 'Chronometer',
    fontClass: 'font-serif-clock',
    trackingClass: 'tracking-normal',
  },
  {
    id: 'schoolbook',
    name: 'Rounded Display (Weich & Spielerisch)',
    category: 'Display',
    font: 'school',
    defaultWeight: '600',
    tagline: 'Organisch gerundete Konturen (Comfortaa)',
    description: 'Freundliche und entspannte Ziffernkurven ohne harte Kanten.',
    sample: '12:34:56',
    badge: 'Rund',
    fontClass: 'font-school',
    trackingClass: 'tracking-tight',
  },
  {
    id: 'retro-terminal',
    name: 'Retro Terminal Mono (Fett & Cyber)',
    category: 'Monospace',
    font: 'mono',
    defaultWeight: '800',
    tagline: 'Fette Monospace-Ziffern im Vintage-Mainframe-Look',
    description: 'Kräftig leuchtende Präsenz mit maximalem Kontrast für Cyberpunk- & Terminal-Themes.',
    sample: '12:34:56',
    badge: 'Retro',
    fontClass: 'font-mono-digital',
    trackingClass: 'tracking-tight',
  },
];

/**
 * Finds matching typography set by ID or falls back to matching by font and weight.
 */
export function getTypographySetById(id?: string): TypographySet | undefined {
  if (!id) return undefined;
  return TYPOGRAPHY_SETS.find((t) => t.id === id);
}

/**
 * Infers the best-matching typography set from current font and weight
 */
export function inferTypographySet(font: ClockFont, weight: ClockWeight): TypographySet {
  // Direct exact match
  const exact = TYPOGRAPHY_SETS.find((t) => t.font === font && t.defaultWeight === weight);
  if (exact) return exact;

  // Match by font
  const byFont = TYPOGRAPHY_SETS.find((t) => t.font === font);
  if (byFont) return byFont;

  return TYPOGRAPHY_SETS[3]; // default geometric outfit
}

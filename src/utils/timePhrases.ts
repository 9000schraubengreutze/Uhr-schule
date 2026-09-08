import { TimeLanguage } from '../types';

const GERMAN_NUMBERS = [
  'zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf',
  'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf',
];

const ENGLISH_NUMBERS = [
  'twelve', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
];

export function getSpokenTimePhrase(hour24: number, minute: number, language: TimeLanguage = 'de-standard'): string {
  const hour12 = hour24 % 12 || 12;
  const nextHour12 = (hour12 % 12) + 1;

  if (language === 'en') {
    if (minute === 0) return `${ENGLISH_NUMBERS[hour12]} o'clock`;
    if (minute === 15) return `Quarter past ${ENGLISH_NUMBERS[hour12]}`;
    if (minute === 30) return `Half past ${ENGLISH_NUMBERS[hour12]}`;
    if (minute === 45) return `Quarter to ${ENGLISH_NUMBERS[nextHour12]}`;
    if (minute < 30) return `${minute} past ${ENGLISH_NUMBERS[hour12]}`;
    return `${60 - minute} to ${ENGLISH_NUMBERS[nextHour12]}`;
  }

  if (language === 'de-regional') {
    // Ostdeutsch / Süddeutsch Variante: Viertel vier = 15:15, Dreiviertel vier = 15:45
    if (minute === 0) return `${GERMAN_NUMBERS[hour12]} Uhr`;
    if (minute === 15) return `Viertel ${GERMAN_NUMBERS[nextHour12]}`;
    if (minute === 30) return `Halb ${GERMAN_NUMBERS[nextHour12]}`;
    if (minute === 45) return `Dreiviertel ${GERMAN_NUMBERS[nextHour12]}`;
    if (minute < 15) return `${minute} nach ${GERMAN_NUMBERS[hour12]}`;
    if (minute < 30) return `${30 - minute} vor halb ${GERMAN_NUMBERS[nextHour12]}`;
    if (minute < 45) return `${minute - 30} nach halb ${GERMAN_NUMBERS[nextHour12]}`;
    return `${60 - minute} vor ${GERMAN_NUMBERS[nextHour12]}`;
  }

  // de-standard:
  if (minute === 0) return `${GERMAN_NUMBERS[hour12]} Uhr`;
  if (minute === 5) return `Fünf nach ${GERMAN_NUMBERS[hour12]}`;
  if (minute === 10) return `Zehn nach ${GERMAN_NUMBERS[hour12]}`;
  if (minute === 15) return `Viertel nach ${GERMAN_NUMBERS[hour12]}`;
  if (minute === 20) return `Zwanzig nach ${GERMAN_NUMBERS[hour12]}`;
  if (minute === 25) return `Fünf vor halb ${GERMAN_NUMBERS[nextHour12]}`;
  if (minute === 30) return `Halb ${GERMAN_NUMBERS[nextHour12]}`;
  if (minute === 35) return `Fünf nach halb ${GERMAN_NUMBERS[nextHour12]}`;
  if (minute === 40) return `Zwanzig vor ${GERMAN_NUMBERS[nextHour12]}`;
  if (minute === 45) return `Viertel vor ${GERMAN_NUMBERS[nextHour12]}`;
  if (minute === 50) return `Zehn vor ${GERMAN_NUMBERS[nextHour12]}`;
  if (minute === 55) return `Fünf vor ${GERMAN_NUMBERS[nextHour12]}`;

  // General minute handling
  if (minute < 30) {
    return `${minute} nach ${GERMAN_NUMBERS[hour12]}`;
  }
  return `${60 - minute} vor ${GERMAN_NUMBERS[nextHour12]}`;
}

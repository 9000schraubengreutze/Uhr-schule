/**
 * Zen Mode Automated Schedule Utility
 * Calculates schedule windows (including overnight intervals across midnight)
 * and formats schedule metadata for UI presentation.
 */

export interface ZenSchedulePreset {
  id: string;
  name: string;
  icon: string;
  startTime: string;
  endTime: string;
  description: string;
}

export const ZEN_SCHEDULE_PRESETS: ZenSchedulePreset[] = [
  {
    id: 'night',
    name: 'Nachtruhe (22:00 – 07:00)',
    icon: '🌙',
    startTime: '22:00',
    endTime: '07:00',
    description: 'Empfohlen: Keine Ablenkungen in den Abend- und Nachtstunden',
  },
  {
    id: 'late-night',
    name: 'Späte Nacht (23:00 – 06:00)',
    icon: '🌃',
    startTime: '23:00',
    endTime: '06:00',
    description: 'Kompakte Nacht-Ruhephase für Nachteulen',
  },
  {
    id: 'focus-work',
    name: 'Fokus-Arbeit (09:00 – 17:00)',
    icon: '💼',
    startTime: '09:00',
    endTime: '17:00',
    description: 'Konzentrierter Vollbild-Modus während üblicher Arbeitszeiten',
  },
  {
    id: 'lunch-break',
    name: 'Mittagspause (13:00 – 14:00)',
    icon: '☕',
    startTime: '13:00',
    endTime: '14:00',
    description: 'Aufgeräumte Ruhezeit zur Mittagsstunde',
  },
  {
    id: 'evening',
    name: 'Entspannter Abend (20:00 – 23:00)',
    icon: '🛋️',
    startTime: '20:00',
    endTime: '23:00',
    description: 'Sanfter Übergang in den Feierabend',
  },
];

export function parseTime(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hours: 22, minutes: 0 };
  }
  const [hStr, mStr] = timeStr.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  return {
    hours: isNaN(hours) ? 0 : Math.max(0, Math.min(23, hours)),
    minutes: isNaN(minutes) ? 0 : Math.max(0, Math.min(59, minutes)),
  };
}

/**
 * Checks whether a given Date timestamp falls inside the configured Zen schedule window.
 * Supports intervals spanning across midnight (e.g. 22:00 to 07:00).
 */
export function isTimeInZenSchedule(
  date: Date,
  startTimeStr: string,
  endTimeStr: string
): boolean {
  const curMinutes = date.getHours() * 60 + date.getMinutes();
  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);

  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Empty interval: if start equals end, schedule is never active
  if (startMinutes === endMinutes) {
    return false;
  }

  // Same-day window (e.g., 09:00 to 17:00)
  if (startMinutes < endMinutes) {
    return curMinutes >= startMinutes && curMinutes < endMinutes;
  }

  // Overnight window spanning across midnight (e.g., 22:00 to 07:00)
  return curMinutes >= startMinutes || curMinutes < endMinutes;
}

/**
 * Formats a 24-hour time string "HH:mm" for display (with optional 12-hour AM/PM format)
 */
export function formatTimeDisplay(timeStr: string, is24Hour: boolean = true): string {
  const { hours, minutes } = parseTime(timeStr);
  const padM = minutes.toString().padStart(2, '0');

  if (is24Hour) {
    return `${hours.toString().padStart(2, '0')}:${padM}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${padM} ${period}`;
}

export interface ZenScheduleInfo {
  enabled: boolean;
  isActiveNow: boolean;
  isOvernight: boolean;
  formattedStart: string;
  formattedEnd: string;
  statusBadgeText: string;
  statusDescription: string;
}

export function getZenScheduleInfo(
  date: Date,
  enabled: boolean,
  startTimeStr: string,
  endTimeStr: string,
  is24Hour: boolean = true
): ZenScheduleInfo {
  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  const isOvernight = startMinutes > endMinutes;

  const formattedStart = formatTimeDisplay(startTimeStr, is24Hour);
  const formattedEnd = formatTimeDisplay(endTimeStr, is24Hour);

  if (!enabled) {
    return {
      enabled: false,
      isActiveNow: false,
      isOvernight,
      formattedStart,
      formattedEnd,
      statusBadgeText: 'Zeitplan pausiert',
      statusDescription: `Automatischer Timer ist deaktiviert. Festgelegt: ${formattedStart} – ${formattedEnd}.`,
    };
  }

  const isActiveNow = isTimeInZenSchedule(date, startTimeStr, endTimeStr);

  if (isActiveNow) {
    return {
      enabled: true,
      isActiveNow: true,
      isOvernight,
      formattedStart,
      formattedEnd,
      statusBadgeText: `Aktiv bis ${formattedEnd}`,
      statusDescription: `Zen-Modus ist planmäßig aktiv. Er wird um ${formattedEnd} Uhr automatisch beendet.`,
    };
  }

  return {
    enabled: true,
    isActiveNow: false,
    isOvernight,
    formattedStart,
    formattedEnd,
    statusBadgeText: `Aktiviert sich um ${formattedStart}`,
    statusDescription: `Zen-Modus ist planmäßig inaktiv. Er wird um ${formattedStart} Uhr automatisch aktiviert.`,
  };
}

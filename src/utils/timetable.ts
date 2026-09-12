export interface LessonItem {
  subject: string;
  teacher: string;
  fullName: string;
  room?: string;
  color?: string;
}

export interface PeriodConfig {
  period: number;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  label: string;
  startMinutes: number;
  endMinutes: number;
}

export interface BreakConfig {
  id: 'break_1' | 'break_2';
  name: string;
  start: string;
  end: string;
  durationMinutes: number;
  startMinutes: number;
  endMinutes: number;
}

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sun, 1 = Mon ... 6 = Sat
export type SchoolSimulationMode = 'live' | 'lesson' | 'break_1' | 'break_2';
export type SchoolBreakLockMode = 'school_breaks_only' | 'strict_breaks_only' | 'always_allowed';

export interface SchoolStatusResult {
  status: 'break' | 'lesson' | 'before_school' | 'after_school' | 'free_period' | 'weekend';
  isGameAllowed: boolean;
  lockReason?: string;
  currentDayName: string;
  dayIndex: number;
  currentPeriod: number | null;
  currentLesson: LessonItem | null;
  currentBreak: {
    name: string;
    start: string;
    end: string;
    remainingMinutes: number;
  } | null;
  nextBreak: {
    name: string;
    start: string;
    end: string;
    minutesUntil: number;
  } | null;
  nextLesson: {
    period: number;
    start: string;
    lesson: LessonItem;
  } | null;
  schoolDayEnd: string;
  timeString: string;
  isSimulated: boolean;
}

// Convert "HH:MM" to total minutes since midnight
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Metadata for the HO 2 Stundenplan 2026/27
export const TIMETABLE_METADATA = {
  className: 'HO 2',
  schoolYear: 'Schuljahr 2026/27',
  classTeacher: 'Frau Schmitz (CSchm)',
  title: 'Stundenplan für HO 2 (Schuljahr 2026/27)',
};

// Official lesson periods from timetable
export const PERIODS: PeriodConfig[] = [
  { period: 1, start: '08:15', end: '09:00', label: '1. Stunde', startMinutes: 8 * 60 + 15, endMinutes: 9 * 60 },
  { period: 2, start: '09:00', end: '09:45', label: '2. Stunde', startMinutes: 9 * 60, endMinutes: 9 * 60 + 45 },
  { period: 3, start: '09:45', end: '10:30', label: '3. Stunde', startMinutes: 9 * 60 + 45, endMinutes: 10 * 60 + 30 },
  { period: 4, start: '11:00', end: '11:45', label: '4. Stunde', startMinutes: 11 * 60, endMinutes: 11 * 60 + 45 },
  { period: 5, start: '11:45', end: '12:30', label: '5. Stunde', startMinutes: 11 * 60 + 45, endMinutes: 12 * 60 + 30 },
  { period: 6, start: '12:30', end: '13:15', label: '6. Stunde', startMinutes: 12 * 60 + 30, endMinutes: 13 * 60 + 15 },
  { period: 7, start: '14:10', end: '14:55', label: '7. Stunde', startMinutes: 14 * 60 + 10, endMinutes: 14 * 60 + 55 },
  { period: 8, start: '14:55', end: '15:40', label: '8. Stunde', startMinutes: 14 * 60 + 55, endMinutes: 15 * 60 + 40 },
];

// Official breaks from timetable
export const BREAKS: BreakConfig[] = [
  {
    id: 'break_1',
    name: '1. Große Pause',
    start: '10:30',
    end: '11:00',
    durationMinutes: 30,
    startMinutes: 10 * 60 + 30,
    endMinutes: 11 * 60,
  },
  {
    id: 'break_2',
    name: '2. Pause / Mittagspause',
    start: '13:15',
    end: '14:10',
    durationMinutes: 55,
    startMinutes: 13 * 60 + 15,
    endMinutes: 14 * 60 + 10,
  },
];

export const DAY_NAMES = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

// Complete weekly matrix matching the image PDFReader_20260901_1749_01.png
export const TIMETABLE_SCHEDULE: Record<number, Record<number, LessonItem | null>> = {
  // Montag (1)
  1: {
    1: { subject: 'BWL', teacher: 'Tiedke', fullName: 'Betriebswirtschaftslehre' },
    2: { subject: 'BWL', teacher: 'Tiedke', fullName: 'Betriebswirtschaftslehre' },
    3: { subject: 'Mathe', teacher: 'Kil', fullName: 'Mathematik' },
    4: { subject: 'Büwi', teacher: 'Fink', fullName: 'Büro- & Wirtschaftsprozesse' },
    5: { subject: 'Büwi', teacher: 'Fink', fullName: 'Büro- & Wirtschaftsprozesse' },
    6: { subject: 'Religion', teacher: 'CSchm', fullName: 'Religionslehre (Frau Schmitz)' },
    7: null,
    8: null,
  },
  // Dienstag (2)
  2: {
    1: { subject: 'ECDL FB/MM', teacher: 'Bülles / Tiedke', fullName: 'ECDL / Fachbezogene Medien' },
    2: { subject: 'M Fö / D Fö', teacher: 'Kil / Peter', fullName: 'Mathe Förder / Deutsch Förder' },
    3: { subject: 'Büwi', teacher: 'Fink', fullName: 'Büro- & Wirtschaftsprozesse' },
    4: { subject: 'PBP', teacher: 'Pfeiffer', fullName: 'Personalbezogene Prozesse' },
    5: { subject: 'ReWe', teacher: 'Nad / Mayntz', fullName: 'Rechnungswesen' },
    6: { subject: 'ReWe', teacher: 'Nad / Mayntz', fullName: 'Rechnungswesen' },
    7: { subject: 'Englisch', teacher: 'CSchm', fullName: 'Englisch (Frau Schmitz)' },
    8: { subject: 'Politik', teacher: 'Nad', fullName: 'Politik' },
  },
  // Mittwoch (3)
  3: {
    1: { subject: 'PBP', teacher: 'Pfeiffer', fullName: 'Personalbezogene Prozesse' },
    2: { subject: 'Englisch', teacher: 'CSchm', fullName: 'Englisch (Frau Schmitz)' },
    3: { subject: 'WG', teacher: 'Pfeiffer', fullName: 'Wirtschafts- & Gesellschaftslehre' },
    4: { subject: 'Mathe', teacher: 'Kil', fullName: 'Mathematik' },
    5: { subject: 'Büwi', teacher: 'Fink', fullName: 'Büro- & Wirtschaftsprozesse' },
    6: { subject: 'Büwi', teacher: 'Fink', fullName: 'Büro- & Wirtschaftsprozesse' },
    7: null,
    8: null,
  },
  // Donnerstag (4)
  4: {
    1: { subject: 'Englisch', teacher: 'CSchm', fullName: 'Englisch (Frau Schmitz)' },
    2: { subject: 'Deutsch', teacher: 'Peters', fullName: 'Deutsch' },
    3: { subject: 'ECDL FB/MM', teacher: 'Bülles / Tiedke', fullName: 'ECDL / Fachbezogene Medien' },
    4: { subject: 'Politik', teacher: 'Nad', fullName: 'Politik' },
    5: { subject: 'Religion', teacher: 'CSchm', fullName: 'Religionslehre (Frau Schmitz)' },
    6: { subject: 'Mathe', teacher: 'Kil', fullName: 'Mathematik' },
    7: { subject: 'GWP', teacher: 'Bau', fullName: 'Gesellschaft, Wirtschaft, Politik' },
    8: { subject: 'WG', teacher: 'Pfeiffer', fullName: 'Wirtschafts- & Gesellschaftslehre' },
  },
  // Freitag (5)
  5: {
    1: null, // Beginn erst 09:00
    2: { subject: 'Englisch', teacher: 'CSchm', fullName: 'Englisch (Frau Schmitz)' },
    3: { subject: 'BWL', teacher: 'Tiedke', fullName: 'Betriebswirtschaftslehre' },
    4: { subject: 'Deutsch', teacher: 'Peters', fullName: 'Deutsch' },
    5: { subject: 'Deutsch', teacher: 'Peters', fullName: 'Deutsch' },
    6: { subject: 'GWP', teacher: 'Bau', fullName: 'Gesellschaft, Wirtschaft, Politik' },
    7: null,
    8: null,
  },
};

// Determine the end of the school day for a given day
export function getSchoolDayEnd(dayIndex: number): string {
  if (dayIndex === 2 || dayIndex === 4) {
    return '15:40'; // Dienstag & Donnerstag
  }
  if (dayIndex === 1 || dayIndex === 3 || dayIndex === 5) {
    return '13:15'; // Montag, Mittwoch, Freitag
  }
  return 'Kein Unterricht';
}

// Check if day has afternoon classes (period 7 & 8)
export function dayHasAfternoonClasses(dayIndex: number): boolean {
  return dayIndex === 2 || dayIndex === 4;
}

/**
 * Main evaluation function calculating current school status, lesson,
 * remaining break time, next break countdown, and game access permission.
 */
export function getSchoolStatus(
  date: Date,
  options?: {
    simulationMode?: SchoolSimulationMode;
    lockMode?: SchoolBreakLockMode;
    lockEnabled?: boolean;
    teacherOverride?: boolean;
  }
): SchoolStatusResult {
  const simulationMode = options?.simulationMode || 'live';
  const lockMode = options?.lockMode || 'school_breaks_only';
  const lockEnabled = options?.lockEnabled ?? true;
  const teacherOverride = options?.teacherOverride ?? false;

  let effectiveDayIndex = date.getDay();
  let effectiveMinutes = date.getHours() * 60 + date.getMinutes();
  let isSimulated = false;

  // Handle simulation modes for easy testing/demoing
  if (simulationMode === 'lesson') {
    // Simulate Tuesday at 09:25 (2. period: M Fö / D Fö)
    effectiveDayIndex = 2;
    effectiveMinutes = 9 * 60 + 25;
    isSimulated = true;
  } else if (simulationMode === 'break_1') {
    // Simulate Monday 10:45 (1. Große Pause, 15 min left)
    effectiveDayIndex = 1;
    effectiveMinutes = 10 * 60 + 45;
    isSimulated = true;
  } else if (simulationMode === 'break_2') {
    // Simulate Tuesday 13:35 (Mittagspause, 35 min left)
    effectiveDayIndex = 2;
    effectiveMinutes = 13 * 60 + 35;
    isSimulated = true;
  }

  const hours = Math.floor(effectiveMinutes / 60);
  const minutes = effectiveMinutes % 60;
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const currentDayName = DAY_NAMES[effectiveDayIndex];
  const schoolDayEnd = getSchoolDayEnd(effectiveDayIndex);

  // Weekend check
  if (effectiveDayIndex === 0 || effectiveDayIndex === 6) {
    const isAllowed = lockMode === 'strict_breaks_only' ? false : true;
    return {
      status: 'weekend',
      isGameAllowed: teacherOverride || !lockEnabled || isAllowed,
      lockReason: !isAllowed ? 'Spiele sind nur in den offiziellen Pausen erlaubt.' : undefined,
      currentDayName,
      dayIndex: effectiveDayIndex,
      currentPeriod: null,
      currentLesson: null,
      currentBreak: null,
      nextBreak: null,
      nextLesson: null,
      schoolDayEnd: 'Wochenende',
      timeString,
      isSimulated,
    };
  }

  const daySchedule = TIMETABLE_SCHEDULE[effectiveDayIndex] || {};

  // Check if currently in Break 1 (10:30 - 11:00)
  const b1 = BREAKS[0];
  if (effectiveMinutes >= b1.startMinutes && effectiveMinutes < b1.endMinutes) {
    const remaining = b1.endMinutes - effectiveMinutes;
    const nextLessonItem = daySchedule[4];
    return {
      status: 'break',
      isGameAllowed: true, // Games are always allowed in breaks!
      currentDayName,
      dayIndex: effectiveDayIndex,
      currentPeriod: null,
      currentLesson: null,
      currentBreak: {
        name: b1.name,
        start: b1.start,
        end: b1.end,
        remainingMinutes: remaining,
      },
      nextBreak: null,
      nextLesson: nextLessonItem ? { period: 4, start: '11:00', lesson: nextLessonItem } : null,
      schoolDayEnd,
      timeString,
      isSimulated,
    };
  }

  // Check if currently in Break 2 (13:15 - 14:10, on days with afternoon classes: Di & Do)
  const b2 = BREAKS[1];
  const hasAfternoon = dayHasAfternoonClasses(effectiveDayIndex);
  if (hasAfternoon && effectiveMinutes >= b2.startMinutes && effectiveMinutes < b2.endMinutes) {
    const remaining = b2.endMinutes - effectiveMinutes;
    const nextLessonItem = daySchedule[7];
    return {
      status: 'break',
      isGameAllowed: true, // Games are always allowed in breaks!
      currentDayName,
      dayIndex: effectiveDayIndex,
      currentPeriod: null,
      currentLesson: null,
      currentBreak: {
        name: b2.name,
        start: b2.start,
        end: b2.end,
        remainingMinutes: remaining,
      },
      nextBreak: null,
      nextLesson: nextLessonItem ? { period: 7, start: '14:10', lesson: nextLessonItem } : null,
      schoolDayEnd,
      timeString,
      isSimulated,
    };
  }

  // Check if before school
  const firstPeriod = PERIODS[0];
  if (effectiveMinutes < firstPeriod.startMinutes) {
    const isAllowed = lockMode === 'strict_breaks_only' ? false : true;
    const nextLessonItem = daySchedule[1] || daySchedule[2];
    const nextPeriodNum = daySchedule[1] ? 1 : 2;
    const nextPeriodStart = daySchedule[1] ? '08:15' : '09:00';

    return {
      status: 'before_school',
      isGameAllowed: teacherOverride || !lockEnabled || isAllowed,
      lockReason: !isAllowed ? 'Spiele sind nur in den offiziellen Pausen erlaubt.' : undefined,
      currentDayName,
      dayIndex: effectiveDayIndex,
      currentPeriod: null,
      currentLesson: null,
      currentBreak: null,
      nextBreak: {
        name: b1.name,
        start: b1.start,
        end: b1.end,
        minutesUntil: b1.startMinutes - effectiveMinutes,
      },
      nextLesson: nextLessonItem
        ? { period: nextPeriodNum, start: nextPeriodStart, lesson: nextLessonItem }
        : null,
      schoolDayEnd,
      timeString,
      isSimulated,
    };
  }

  // Check if after school
  const endMinutes = parseTimeToMinutes(schoolDayEnd);
  if (effectiveMinutes >= endMinutes) {
    const isAllowed = lockMode === 'strict_breaks_only' ? false : true;
    return {
      status: 'after_school',
      isGameAllowed: teacherOverride || !lockEnabled || isAllowed,
      lockReason: !isAllowed ? 'Spiele sind nur in den offiziellen Pausen erlaubt.' : undefined,
      currentDayName,
      dayIndex: effectiveDayIndex,
      currentPeriod: null,
      currentLesson: null,
      currentBreak: null,
      nextBreak: null,
      nextLesson: null,
      schoolDayEnd,
      timeString,
      isSimulated,
    };
  }

  // We are within the school day! Find which period we are in:
  let foundPeriod: PeriodConfig | null = null;
  for (const p of PERIODS) {
    if (effectiveMinutes >= p.startMinutes && effectiveMinutes < p.endMinutes) {
      foundPeriod = p;
      break;
    }
  }

  // Calculate next break info
  let nextBreakInfo: SchoolStatusResult['nextBreak'] = null;
  if (effectiveMinutes < b1.startMinutes) {
    nextBreakInfo = {
      name: b1.name,
      start: b1.start,
      end: b1.end,
      minutesUntil: b1.startMinutes - effectiveMinutes,
    };
  } else if (hasAfternoon && effectiveMinutes < b2.startMinutes) {
    nextBreakInfo = {
      name: b2.name,
      start: b2.start,
      end: b2.end,
      minutesUntil: b2.startMinutes - effectiveMinutes,
    };
  }

  if (foundPeriod) {
    const lesson = daySchedule[foundPeriod.period];
    if (lesson) {
      // It's a regular lesson! Games are locked during lesson!
      const isAllowed = teacherOverride || !lockEnabled || lockMode === 'always_allowed';
      return {
        status: 'lesson',
        isGameAllowed: isAllowed,
        lockReason: isAllowed
          ? undefined
          : `Aktuell ist Unterrichtszeit (${foundPeriod.label}: ${lesson.subject} bei ${lesson.teacher}). Games sind nur in den Pausen erlaubt!`,
        currentDayName,
        dayIndex: effectiveDayIndex,
        currentPeriod: foundPeriod.period,
        currentLesson: lesson,
        currentBreak: null,
        nextBreak: nextBreakInfo,
        nextLesson: null,
        schoolDayEnd,
        timeString,
        isSimulated,
      };
    } else {
      // Empty / free period (e.g. Friday 1st period 08:15 - 09:00)
      const isAllowed = lockMode === 'strict_breaks_only' ? false : true;
      return {
        status: 'free_period',
        isGameAllowed: teacherOverride || !lockEnabled || isAllowed,
        lockReason: !isAllowed ? 'Spiele sind nur in den offiziellen Pausen erlaubt.' : undefined,
        currentDayName,
        dayIndex: effectiveDayIndex,
        currentPeriod: foundPeriod.period,
        currentLesson: null,
        currentBreak: null,
        nextBreak: nextBreakInfo,
        nextLesson: null,
        schoolDayEnd,
        timeString,
        isSimulated,
      };
    }
  }

  // Fallback (e.g. slight transition gaps)
  return {
    status: 'lesson',
    isGameAllowed: teacherOverride || !lockEnabled,
    lockReason: 'Unterrichtszeit. Games sind nur in den Pausen erlaubt.',
    currentDayName,
    dayIndex: effectiveDayIndex,
    currentPeriod: null,
    currentLesson: null,
    currentBreak: null,
    nextBreak: nextBreakInfo,
    nextLesson: null,
    schoolDayEnd,
    timeString,
    isSimulated,
  };
}

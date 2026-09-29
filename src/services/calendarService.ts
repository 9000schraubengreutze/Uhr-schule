export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string; // Google Meet URL if available
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  colorId?: string;
}

export type EventUrgency = 'now' | 'critical' | 'approaching' | 'upcoming' | 'past';

/**
 * Parses Google Calendar start/end into proper Date objects and allDay flag
 */
export function parseEventDates(rawItem: any): { startDate: Date; endDate: Date; isAllDay: boolean } {
  let isAllDay = false;
  let startDate: Date;
  let endDate: Date;

  if (rawItem.start?.dateTime) {
    startDate = new Date(rawItem.start.dateTime);
  } else if (rawItem.start?.date) {
    isAllDay = true;
    startDate = new Date(rawItem.start.date + 'T00:00:00');
  } else {
    startDate = new Date();
  }

  if (rawItem.end?.dateTime) {
    endDate = new Date(rawItem.end.dateTime);
  } else if (rawItem.end?.date) {
    endDate = new Date(rawItem.end.date + 'T23:59:59');
  } else {
    endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  }

  return { startDate, endDate, isAllDay };
}

/**
 * Fetches upcoming events from the user's primary Google Calendar
 */
export async function fetchUpcomingEvents(
  accessToken: string,
  options?: {
    maxResults?: number;
    timeMin?: Date;
    timeMax?: Date;
  }
): Promise<CalendarEvent[]> {
  const maxResults = options?.maxResults ?? 25;
  // Lookback 20 minutes to capture currently active / ongoing events
  const timeMin = options?.timeMin ?? new Date(Date.now() - 20 * 60 * 1000);
  // Default lookahead: 3 days
  const timeMax = options?.timeMax ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin.toISOString());
  url.searchParams.set('timeMax', timeMax.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', maxResults.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    const errText = await response.text();
    console.error('Google Calendar API error response:', response.status, errText);
    throw new Error(`Google Calendar Fehler (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawItems = Array.isArray(data.items) ? data.items : [];

  return rawItems.map((item: any): CalendarEvent => {
    const { startDate, endDate, isAllDay } = parseEventDates(item);
    return {
      id: item.id || `cal-${Math.random()}`,
      summary: item.summary || 'Termin ohne Titel',
      description: item.description,
      location: item.location,
      htmlLink: item.htmlLink,
      hangoutLink: item.hangoutLink,
      start: item.start || {},
      end: item.end || {},
      startDate,
      endDate,
      isAllDay,
      colorId: item.colorId,
    };
  });
}

/**
 * Calculates event urgency and time delta
 */
export function getEventUrgency(
  event: CalendarEvent,
  now: Date,
  alertLeadMinutes = 15
): {
  urgency: EventUrgency;
  minutesRemaining: number;
  isApproaching: boolean;
  isCurrentlyActive: boolean;
} {
  const startMs = event.startDate.getTime();
  const endMs = event.endDate.getTime();
  const nowMs = now.getTime();

  // If ongoing right now
  if (nowMs >= startMs && nowMs <= endMs) {
    const minutesLeft = Math.max(0, Math.round((endMs - nowMs) / 60000));
    return {
      urgency: 'now',
      minutesRemaining: minutesLeft,
      isApproaching: true,
      isCurrentlyActive: true,
    };
  }

  // If in the future
  if (nowMs < startMs) {
    const minutesRemaining = Math.max(0, Math.round((startMs - nowMs) / 60000));

    if (minutesRemaining <= 5) {
      return {
        urgency: 'critical',
        minutesRemaining,
        isApproaching: true,
        isCurrentlyActive: false,
      };
    }

    if (minutesRemaining <= alertLeadMinutes) {
      return {
        urgency: 'approaching',
        minutesRemaining,
        isApproaching: true,
        isCurrentlyActive: false,
      };
    }

    return {
      urgency: 'upcoming',
      minutesRemaining,
      isApproaching: false,
      isCurrentlyActive: false,
    };
  }

  // Already ended
  return {
    urgency: 'past',
    minutesRemaining: 0,
    isApproaching: false,
    isCurrentlyActive: false,
  };
}

/**
 * Human-readable relative time string in German
 */
export function formatRelativeEventTime(event: CalendarEvent, now: Date): string {
  if (event.isAllDay) {
    return 'Ganztägig';
  }

  const { urgency, minutesRemaining } = getEventUrgency(event, now);

  if (urgency === 'now') {
    return 'Jetzt aktiv';
  }

  if (minutesRemaining < 1) {
    return 'Gleich (unter 1 Min.)';
  }

  if (minutesRemaining === 1) {
    return 'in 1 Minute';
  }

  if (minutesRemaining < 60) {
    return `in ${minutesRemaining} Min.`;
  }

  const hours = Math.floor(minutesRemaining / 60);
  const remainingMins = minutesRemaining % 60;
  if (remainingMins === 0) {
    return `in ${hours} Std.`;
  }
  return `in ${hours} Std. ${remainingMins} Min.`;
}

/**
 * Formats event time range (e.g. "14:00 - 15:30" or "Ganztägig")
 */
export function formatEventTimeRange(event: CalendarEvent, locale = 'de-DE'): string {
  if (event.isAllDay) {
    return 'Ganztägig';
  }

  const startTime = event.startDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = event.endDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${startTime} – ${endTime} Uhr`;
}

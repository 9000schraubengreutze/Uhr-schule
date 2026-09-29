import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
} from '../services/calendarAuth';
import {
  CalendarEvent,
  fetchUpcomingEvents,
  getEventUrgency,
} from '../services/calendarService';
import { ClockSettings } from '../types';

interface UseGoogleCalendarProps {
  settings: ClockSettings;
  currentTime: Date;
  onShowFeedback?: (msg: string) => void;
}

export function useGoogleCalendar({
  settings,
  currentTime,
  onShowFeedback,
}: UseGoogleCalendarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Set of dismissed event alert IDs for the current session
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const alertedEventIdsRef = useRef<Set<string>>(new Set());

  const alertLeadMinutes = settings.calendar?.alertLeadMinutes ?? 15;
  const isCalendarEnabled = settings.calendar?.enabled ?? true;

  // Fetch events using valid token
  const loadEvents = useCallback(
    async (token: string, silent = false) => {
      if (!isCalendarEnabled) return;

      if (!silent) setIsLoading(true);
      else setIsSyncing(true);
      setError(null);

      try {
        const fetched = await fetchUpcomingEvents(token);
        setEvents(fetched);
        setLastSyncTime(new Date());
      } catch (err: any) {
        if (err.message === 'AUTH_EXPIRED') {
          console.warn('Google Calendar token expired, requiring re-auth');
          setNeedsAuth(true);
          setAccessToken(null);
          setError('Sitzung abgelaufen. Bitte erneut mit Google Kalender verbinden.');
        } else {
          console.error('Failed to fetch calendar events:', err);
          setError(err.message || 'Kalenderdaten konnten nicht geladen werden.');
        }
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [isCalendarEnabled]
  );

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
        setNeedsAuth(false);
        loadEvents(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadEvents]);

  // Periodic background refresh every 3 minutes when token is present
  useEffect(() => {
    if (!accessToken || needsAuth || !isCalendarEnabled) return;

    const interval = setInterval(() => {
      loadEvents(accessToken, true);
    }, 180000); // 3 minutes

    return () => clearInterval(interval);
  }, [accessToken, needsAuth, isCalendarEnabled, loadEvents]);

  // Sign in handler
  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setNeedsAuth(false);
        await loadEvents(res.accessToken);
        onShowFeedback?.('Google Kalender erfolgreich verbunden!');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Anmeldung fehlgeschlagen');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadEvents, onShowFeedback]);

  // Sign out handler
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      setEvents([]);
      setNeedsAuth(true);
      setDismissedAlertIds(new Set());
      alertedEventIdsRef.current.clear();
      onShowFeedback?.('Google Kalender getrennt');
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onShowFeedback]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    if (accessToken) {
      loadEvents(accessToken);
    }
  }, [accessToken, loadEvents]);

  // Dismiss a specific event alert
  const dismissAlert = useCallback((eventId: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, eventId]));
  }, []);

  // Compute approaching and next upcoming events based on currentTime
  const { approachingEvents, nextEvent, activeAlertEvent } = useMemo(() => {
    if (!events.length || !isCalendarEnabled) {
      return { approachingEvents: [], nextEvent: null, activeAlertEvent: null };
    }

    const approaching: CalendarEvent[] = [];
    let next: CalendarEvent | null = null;
    let highestUrgencyEvent: CalendarEvent | null = null;

    for (const evt of events) {
      const { urgency, isApproaching, isCurrentlyActive } = getEventUrgency(
        evt,
        currentTime,
        alertLeadMinutes
      );

      // Find next future event
      if (!evt.isAllDay && evt.startDate > currentTime) {
        if (!next || evt.startDate < next.startDate) {
          next = evt;
        }
      }

      // Check if approaching or currently active
      if (isApproaching || isCurrentlyActive) {
        approaching.push(evt);

        // Highest urgency for the floating banner
        if (!highestUrgencyEvent) {
          highestUrgencyEvent = evt;
        } else if (urgency === 'now' || urgency === 'critical') {
          highestUrgencyEvent = evt;
        }
      }
    }

    // Filter out dismissed alert for the main banner
    const alertCandidate =
      highestUrgencyEvent && !dismissedAlertIds.has(highestUrgencyEvent.id)
        ? highestUrgencyEvent
        : null;

    return {
      approachingEvents: approaching,
      nextEvent: next,
      activeAlertEvent: alertCandidate,
    };
  }, [events, isCalendarEnabled, currentTime, alertLeadMinutes, dismissedAlertIds]);

  // Audio alert chime when a new event enters approaching state
  useEffect(() => {
    if (!settings.calendar?.soundAlert || !activeAlertEvent) return;

    if (!alertedEventIdsRef.current.has(activeAlertEvent.id)) {
      alertedEventIdsRef.current.add(activeAlertEvent.id);
      // Play gentle digital chime via Web Audio
      playCalendarAlertChime();
    }
  }, [activeAlertEvent, settings.calendar?.soundAlert]);

  return {
    user,
    accessToken,
    events,
    isLoading,
    isSyncing,
    error,
    needsAuth,
    lastSyncTime,
    approachingEvents,
    nextEvent,
    activeAlertEvent,
    login: handleLogin,
    logout: handleLogout,
    refresh: handleRefresh,
    dismissAlert,
  };
}

/**
 * Gentle, dual-tone Web Audio chime for calendar task alerts
 */
function playCalendarAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Tone 1: 587.33 Hz (D5) -> 880 Hz (A5)
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.15);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.75);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch (err) {
    // Non-critical audio warning
  }
}

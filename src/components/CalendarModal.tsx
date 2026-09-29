import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  RefreshCw,
  LogOut,
  Bell,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  CalendarEvent,
  formatRelativeEventTime,
  formatEventTimeRange,
  getEventUrgency,
} from '../services/calendarService';
import { ClockSettings } from '../types';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { triggerHaptic } from '../utils/audio';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  needsAuth: boolean;
  events: CalendarEvent[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  currentTime: Date;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  backdropBlur?: number;
}

const LEAD_TIME_OPTIONS = [
  { value: 5, label: '5 Min.' },
  { value: 10, label: '10 Min.' },
  { value: 15, label: '15 Min. (Standard)' },
  { value: 30, label: '30 Min.' },
  { value: 60, label: '1 Std.' },
];

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  user,
  needsAuth,
  events,
  isLoading,
  isSyncing,
  error,
  lastSyncTime,
  currentTime,
  onLogin,
  onLogout,
  onRefresh,
  settings,
  onUpdateSettings,
  backdropBlur = 16,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming'>('all');
  const [showSettingsSection, setShowSettingsSection] = useState(false);

  const calSettings = settings.calendar;

  const updateCalSettings = (partial: Partial<typeof calSettings>) => {
    onUpdateSettings((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        ...partial,
      },
    }));
  };

  // Group and filter events
  const filteredEvents = useMemo(() => {
    if (!events.length) return [];

    const startOfToday = new Date(currentTime);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(currentTime);
    endOfToday.setHours(23, 59, 59, 999);

    if (filterTab === 'today') {
      return events.filter((e) => {
        return (
          (e.startDate >= startOfToday && e.startDate <= endOfToday) ||
          (e.endDate >= startOfToday && e.endDate <= endOfToday) ||
          (e.startDate < startOfToday && e.endDate > endOfToday)
        );
      });
    }

    if (filterTab === 'upcoming') {
      return events.filter((e) => e.startDate > endOfToday);
    }

    return events;
  }, [events, filterTab, currentTime]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 cursor-pointer"
          style={{
            backdropFilter: `blur(${backdropBlur}px)`,
            WebkitBackdropFilter: `blur(${backdropBlur}px)`,
          }}
        />

        {/* Modal Surface */}
        <motion.div
          role="dialog"
          aria-labelledby="calendar-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 id="calendar-modal-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Google Kalender</span>
                  {!needsAuth && user && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Verbunden
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Anstehende Termine und Aufgaben mit Live-Alarmen direkt auf der Uhr
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!needsAuth && user && (
                <button
                  type="button"
                  onClick={() => setShowSettingsSection((prev) => !prev)}
                  title="Kalender-Einstellungen anpassen"
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    showSettingsSection
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="flex-1">{error}</span>
                {needsAuth && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
                  >
                    Neu verbinden
                  </button>
                )}
              </div>
            )}

            {/* UNCONNECTED STATE: Official Google Sign-In */}
            {(needsAuth || !user) && (
              <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-950/50 border border-slate-800/80 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                  <Calendar className="w-8 h-8" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Verbinde dein Google-Konto
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Verbinde deinen Google Kalender, um anstehende Termine und Aufgaben direkt auf der Digitaluhr im Blick zu behalten. Bei herannahenden Terminen warnt dich die Uhr automatisch.
                  </p>
                </div>

                {/* Official Sign In With Google Button Style */}
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(settings.vibrationEnabled);
                      onLogin();
                    }}
                    disabled={isLoading}
                    className="relative group inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_6px_25px_rgba(66,133,244,0.35)] hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isLoading ? 'Verbindung wird hergestellt...' : 'Mit Google anmelden'}</span>
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sicherer schreibgeschützter Zugriff (calendar.events.readonly). Keine Datenweitergabe.</span>
                </div>
              </div>
            )}

            {/* CONNECTED STATE */}
            {!needsAuth && user && (
              <>
                {/* User Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Google User'}
                        className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {user.displayName || 'Google Benutzer'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRefresh}
                      disabled={isSyncing || isLoading}
                      title="Kalender jetzt synchronisieren"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                      <span>{isSyncing ? 'Synchronisiere...' : 'Aktualisieren'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onLogout}
                      title="Google-Konto trennen"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Settings Panel */}
                <AnimatePresence>
                  {showSettingsSection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-4"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Kalender & Benachrichtigungs-Einstellungen</span>
                      </h4>

                      <MaterialSwitch
                        label="Termin-Banner auf der Uhr anzeigen"
                        description="Blendet das Countdown-Banner direkt über/unter den Ziffern ein, wenn ein Termin ansteht"
                        checked={calSettings.showOnClock}
                        onChange={(v) => updateCalSettings({ showOnClock: v })}
                      />

                      <div className="pt-2 border-t border-slate-800/60">
                        <label className="text-xs font-semibold text-slate-300 block mb-2">
                          Vorwarnzeit vor Terminbeginn
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {LEAD_TIME_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                updateCalSettings({ alertLeadMinutes: opt.value });
                                triggerHaptic(settings.vibrationEnabled);
                              }}
                              className={`py-1.5 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                                calSettings.alertLeadMinutes === opt.value
                                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                  : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <MaterialSwitch
                        label="Akustischer Signalton bei Annäherung"
                        description="Spielt einen sanften digitalen Gong, wenn ein Termin die Vorwarnzeit erreicht"
                        checked={calSettings.soundAlert}
                        onChange={(v) => updateCalSettings({ soundAlert: v })}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filter Tabs */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex rounded-xl bg-slate-950/60 p-1 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filterTab === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Alle ({events.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('today')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filterTab === 'today'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Heute
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('upcoming')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filterTab === 'upcoming'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Später
                    </button>
                  </div>

                  {lastSyncTime && (
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      Stand: {lastSyncTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                    </span>
                  )}
                </div>

                {/* Events List */}
                <div className="space-y-2.5">
                  {isLoading && events.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                      <span>Termine werden geladen...</span>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-950/30 border border-slate-800">
                      <Calendar className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-slate-300">Keine Termine gefunden</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        In deinem Google Kalender sind für diesen Filter keine anstehenden Ereignisse eingetragen.
                      </p>
                    </div>
                  ) : (
                    filteredEvents.map((evt) => {
                      const { urgency, isApproaching, isCurrentlyActive } = getEventUrgency(
                        evt,
                        currentTime,
                        calSettings.alertLeadMinutes
                      );
                      const relativeTime = formatRelativeEventTime(evt, currentTime);
                      const timeRange = formatEventTimeRange(evt);

                      return (
                        <div
                          key={evt.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isCurrentlyActive
                              ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                              : isApproaching
                              ? 'bg-amber-950/40 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                              : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {isCurrentlyActive ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                                    Jetzt aktiv
                                  </span>
                                ) : isApproaching ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                                    Bald ({relativeTime})
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                    {relativeTime}
                                  </span>
                                )}

                                <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{timeRange}</span>
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white truncate">
                                {evt.summary}
                              </h4>

                              {evt.description && (
                                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                  {evt.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                                {evt.location && (
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-xs">{evt.location}</span>
                                  </span>
                                )}

                                {evt.hangoutLink && (
                                  <a
                                    href={evt.hangoutLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 font-semibold"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Google Meet öffnen</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {evt.htmlLink && (
                              <a
                                href={evt.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Im Google Kalender öffnen"
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

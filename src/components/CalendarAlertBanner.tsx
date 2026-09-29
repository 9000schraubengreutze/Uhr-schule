import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Clock,
  MapPin,
  Video,
  X,
  ChevronRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  CalendarEvent,
  getEventUrgency,
  formatRelativeEventTime,
  formatEventTimeRange,
} from '../services/calendarService';

interface CalendarAlertBannerProps {
  event: CalendarEvent | null;
  currentTime: Date;
  alertLeadMinutes?: number;
  onOpenDetails: () => void;
  onDismiss: (eventId: string) => void;
  backdropBlur?: number;
}

export const CalendarAlertBanner: React.FC<CalendarAlertBannerProps> = ({
  event,
  currentTime,
  alertLeadMinutes = 15,
  onOpenDetails,
  onDismiss,
  backdropBlur = 16,
}) => {
  if (!event) return null;

  const { urgency, minutesRemaining } = getEventUrgency(event, currentTime, alertLeadMinutes);
  const relativeTime = formatRelativeEventTime(event, currentTime);
  const timeRange = formatEventTimeRange(event);

  const isNow = urgency === 'now';
  const isCritical = urgency === 'critical';

  return (
    <AnimatePresence>
      <motion.div
        key={`cal-alert-${event.id}`}
        initial={{ opacity: 0, y: -16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="w-full max-w-xl mx-auto px-3 sm:px-4 pointer-events-auto"
      >
        <div
          onClick={onOpenDetails}
          className={`relative group overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-2xl cursor-pointer ${
            isNow
              ? 'bg-emerald-950/80 border-emerald-400/50 hover:border-emerald-300 shadow-[0_8px_30px_rgba(16,185,129,0.35)]'
              : isCritical
              ? 'bg-amber-950/85 border-amber-400/60 hover:border-amber-300 shadow-[0_8px_30px_rgba(245,158,11,0.4)] animate-pulse'
              : 'bg-slate-900/85 border-indigo-400/40 hover:border-indigo-300 shadow-[0_8px_30px_rgba(99,102,241,0.3)]'
          }`}
          style={{
            backdropFilter: `blur(${backdropBlur}px)`,
            WebkitBackdropFilter: `blur(${backdropBlur}px)`,
          }}
        >
          {/* Subtle Ambient Pulse Light */}
          <div
            className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity ${
              isNow
                ? 'bg-emerald-500/25'
                : isCritical
                ? 'bg-amber-500/30'
                : 'bg-indigo-500/20'
            }`}
          />

          <div className="relative p-3 sm:p-4 flex items-center justify-between gap-3">
            {/* Left Icon with animated status ping */}
            <div className="relative shrink-0">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                  isNow
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : isCritical
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                }`}
              >
                {isNow ? (
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                ) : isCritical ? (
                  <Bell className="w-5 h-5 animate-bounce" />
                ) : (
                  <Calendar className="w-5 h-5" />
                )}
              </div>
              {/* Pulsing Alert Indicator */}
              <span
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                  isNow
                    ? 'bg-emerald-400 animate-ping'
                    : isCritical
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-indigo-400'
                }`}
              />
            </div>

            {/* Middle Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                    isNow
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : isCritical
                      ? 'bg-amber-500/30 text-amber-100 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-indigo-500/25 text-indigo-200 border-indigo-400/40'
                  }`}
                >
                  {isNow ? 'Jetzt aktiv' : `Termin ${relativeTime}`}
                </span>

                <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {timeRange}
                </span>
              </div>

              {/* Event Title */}
              <h4 className="text-sm sm:text-base font-bold text-white truncate mt-0.5 group-hover:text-slate-100">
                {event.summary}
              </h4>

              {/* Location or Meet Link Hint */}
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5 truncate">
                {event.hangoutLink ? (
                  <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
                    <Video className="w-3 h-3 text-cyan-400" />
                    <span>Google Meet vorhanden</span>
                  </span>
                ) : event.location ? (
                  <span className="inline-flex items-center gap-1 truncate text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Optional direct Meet link */}
              {event.hangoutLink && (
                <a
                  href={event.hangoutLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Google Meet beitreten"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Beitreten</span>
                </a>
              )}

              {/* Dismiss Alert button */}
              <button
                type="button"
                onClick={() => onDismiss(event.id)}
                title="Alarm ausblenden"
                aria-label="Alarm ausblenden"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Open full modal arrow */}
              <button
                type="button"
                onClick={onOpenDetails}
                title="Details & Kalender öffnen"
                className="p-1.5 rounded-xl text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

import React from 'react';
import { Calendar, Clock, ChevronRight, Video, Sparkles } from 'lucide-react';
import {
  CalendarEvent,
  formatRelativeEventTime,
  formatEventTimeRange,
} from '../services/calendarService';

interface CalendarClockWidgetProps {
  event: CalendarEvent | null;
  currentTime: Date;
  onClick: () => void;
  isConnected: boolean;
  onConnect: () => void;
  backdropBlur?: number;
}

export const CalendarClockWidget: React.FC<CalendarClockWidgetProps> = ({
  event,
  currentTime,
  onClick,
  isConnected,
  onConnect,
  backdropBlur = 16,
}) => {
  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={onConnect}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/60 hover:border-indigo-400/40 shadow-sm hover:shadow-[0_4px_16px_rgba(99,102,241,0.25)] transition-all duration-200 cursor-pointer"
        style={{
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
        <span>Google Kalender verknüpfen</span>
        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  if (!event) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 shadow-sm transition-all duration-200 cursor-pointer"
        style={{
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
      >
        <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
        <span>Keine anstehenden Termine heute</span>
        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  const relativeTime = formatRelativeEventTime(event, currentTime);
  const timeRange = formatEventTimeRange(event);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-200 hover:text-white bg-slate-900/70 hover:bg-slate-900/90 border border-slate-700/70 hover:border-indigo-400/50 shadow-md hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] transition-all duration-200 cursor-pointer max-w-md truncate"
      style={{
        backdropFilter: `blur(${backdropBlur}px)`,
        WebkitBackdropFilter: `blur(${backdropBlur}px)`,
      }}
    >
      <div className="flex items-center gap-1.5 text-indigo-400 font-semibold shrink-0">
        <Calendar className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span>Nächster Termin:</span>
      </div>

      <span className="font-semibold text-slate-100 truncate group-hover:text-white">
        {event.summary}
      </span>

      <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 shrink-0">
        {relativeTime}
      </span>

      {event.hangoutLink && (
        <span title="Google Meet verfügbar">
          <Video className="w-3 h-3 text-emerald-400 shrink-0" />
        </span>
      )}

      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-white transition-all shrink-0" />
    </button>
  );
};

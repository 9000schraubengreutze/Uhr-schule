import React from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Clock,
  Coffee,
  GraduationCap,
  Calendar,
  Sparkles,
  BookOpen,
  AlertCircle,
  Play,
  Unlock,
} from 'lucide-react';
import { SchoolStatusResult, SchoolSimulationMode } from '../utils/timetable';

interface SchoolBreakLockViewProps {
  statusResult: SchoolStatusResult;
  onOpenTimetable: () => void;
  onSimulateBreak: () => void;
  onToggleTeacherOverride: () => void;
  teacherOverride: boolean;
  onCloseModal: () => void;
}

export const SchoolBreakLockView: React.FC<SchoolBreakLockViewProps> = ({
  statusResult,
  onOpenTimetable,
  onSimulateBreak,
  onToggleTeacherOverride,
  teacherOverride,
  onCloseModal,
}) => {
  const { currentLesson, currentPeriod, nextBreak, timeString } = statusResult;

  return (
    <div className="flex-1 w-full h-full overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="max-w-xl w-full bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center"
      >
        {/* Animated Lock Badge */}
        <div className="relative mb-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>

        {/* Heading */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold mb-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Unterrichtszeit • HO 2 (Frau Schmitz)</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Games sind nur in den Pausen erlaubt!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md">
          Während des Unterrichts gilt volle Konzentration. Sobald die Schulglocke zur Pause läutet, schalten sich alle Games automatisch frei.
        </p>

        {/* Current Lesson & Next Break Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-left">
          {/* Active Lesson Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Laufende Stunde</span>
              </span>
              <span className="font-mono text-slate-300">{timeString} Uhr</span>
            </div>

            <div className="my-2">
              <div className="text-lg font-bold text-white">
                {currentLesson?.subject || 'Unterricht'}
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">
                {currentLesson?.fullName || 'Fachunterricht'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Lehrkraft: <strong className="text-slate-200">{currentLesson?.teacher || 'Fachlehrer'}</strong>
                {currentPeriod && <span> • {currentPeriod}. Stunde</span>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-rose-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Spielen vorübergehend gesperrt</span>
            </div>
          </div>

          {/* Next Break Countdown */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-800/40 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nächste Pause</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {nextBreak?.start || '10:30'} Uhr
              </span>
            </div>

            <div className="my-2">
              <div className="text-sm font-bold text-white">
                {nextBreak?.name || '1. Große Pause'}
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {typeof nextBreak?.minutesUntil === 'number'
                  ? `in ${nextBreak.minutesUntil} Min.`
                  : 'Bald'}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {nextBreak?.start} – {nextBreak?.end} Uhr
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-900/40 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Automatische Freischaltung zur Pause</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 mt-6">
          {/* View Timetable */}
          <button
            type="button"
            onClick={onOpenTimetable}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Stundenplan HO 2 ansehen</span>
          </button>

          {/* Test Mode: Simulate Break */}
          <button
            type="button"
            onClick={onSimulateBreak}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Pause simulieren (Test)</span>
          </button>
        </div>

        {/* Teacher override / Bypass */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 w-full flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={onToggleTeacherOverride}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer text-[11px]"
          >
            <Unlock className="w-3.5 h-3.5 text-amber-400" />
            <span>{teacherOverride ? 'Lehrer-Freigabe aktiv' : 'Lehrer-Freigabe (Jetzt entsperren)'}</span>
          </button>

          <button
            type="button"
            onClick={onCloseModal}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
          >
            Zurück zur Uhr
          </button>
        </div>
      </motion.div>
    </div>
  );
};

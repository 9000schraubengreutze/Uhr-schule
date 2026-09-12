import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  Coffee,
  Gamepad2,
  Lock,
  Unlock,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  TIMETABLE_METADATA,
  PERIODS,
  BREAKS,
  TIMETABLE_SCHEDULE,
  DAY_NAMES,
  SchoolStatusResult,
  SchoolSimulationMode,
} from '../utils/timetable';

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusResult: SchoolStatusResult;
  simulationMode: SchoolSimulationMode;
  onSetSimulationMode: (mode: SchoolSimulationMode) => void;
  teacherOverride: boolean;
  onToggleTeacherOverride: () => void;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  statusResult,
  simulationMode,
  onSetSimulationMode,
  teacherOverride,
  onToggleTeacherOverride,
}) => {
  if (!isOpen) return null;

  const currentDay = statusResult.dayIndex;
  const currentPeriod = statusResult.currentPeriod;
  const isBreakActive = statusResult.status === 'break';

  return (
    <AnimatePresence>
      <motion.div
        key="timetable-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl overflow-hidden"
      >
        <motion.div
          key="timetable-modal-content"
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900/95 border-2 border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ring-1 ring-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    {TIMETABLE_METADATA.title}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                    {TIMETABLE_METADATA.classTeacher}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Spiele sind nur während der Pausenzeiten freigeschaltet.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Schließen (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Simulation / Quick Switch Toolbar */}
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Modus testen:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onSetSimulationMode('live')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    simulationMode === 'live'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Live ({statusResult.timeString} Uhr)
                </button>
                <button
                  type="button"
                  onClick={() => onSetSimulationMode('lesson')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    simulationMode === 'lesson'
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🔒 Unterricht simulieren (09:25)
                </button>
                <button
                  type="button"
                  onClick={() => onSetSimulationMode('break_1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    simulationMode === 'break_1'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🟢 1. Pause (10:45)
                </button>
                <button
                  type="button"
                  onClick={() => onSetSimulationMode('break_2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    simulationMode === 'break_2'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🟢 Mittagspause (13:35)
                </button>
              </div>
            </div>

            {/* Teacher Override Button */}
            <button
              type="button"
              onClick={onToggleTeacherOverride}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                teacherOverride
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {teacherOverride ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lehrer-Freigabe aktiv</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lehrer-Freigabe (Sperre umgehen)</span>
                </>
              )}
            </button>
          </div>

          {/* Current Status Banner */}
          <div
            className={`px-5 py-2.5 flex items-center justify-between text-xs border-b ${
              statusResult.isGameAllowed
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusResult.isGameAllowed ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Games erlaubt:</span>
                  <span>
                    {statusResult.status === 'break'
                      ? `${statusResult.currentBreak?.name} aktiv (noch ${statusResult.currentBreak?.remainingMinutes} Min.)`
                      : teacherOverride
                      ? 'Freigegeben durch Lehrer-Override'
                      : statusResult.status === 'weekend'
                      ? 'Wochenende (Freizeit)'
                      : statusResult.status === 'after_school'
                      ? 'Schulschluss (Freizeit)'
                      : 'Vor Unterrichtsbeginn (Freizeit)'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span className="font-bold">Games gesperrt:</span>
                  <span>
                    Unterricht {statusResult.currentPeriod}. Std. ({statusResult.currentLesson?.subject} bei{' '}
                    {statusResult.currentLesson?.teacher}). Nächste Pause um {statusResult.nextBreak?.start} Uhr (in{' '}
                    {statusResult.nextBreak?.minutesUntil} Min.)
                  </span>
                </>
              )}
            </div>
            {statusResult.isSimulated && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                Simulations-Modus
              </span>
            )}
          </div>

          {/* Timetable Matrix */}
          <div className="flex-1 overflow-auto p-4 sm:p-5">
            <div className="min-w-[700px] border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg bg-slate-950/60">
              {/* Header Row: Days */}
              <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] bg-slate-800/90 text-xs font-bold text-slate-200 border-b border-slate-700">
                <div className="p-2.5 text-center text-slate-400 border-r border-slate-700">
                  Std. / Zeit
                </div>
                {[1, 2, 3, 4, 5].map((d) => (
                  <div
                    key={d}
                    className={`p-2.5 text-center border-r border-slate-700 last:border-r-0 ${
                      currentDay === d ? 'bg-blue-900/40 text-blue-300 font-extrabold' : ''
                    }`}
                  >
                    <span>{DAY_NAMES[d]}</span>
                    {currentDay === d && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 uppercase">
                        Heute
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Rows: Periods 1 to 3 */}
              {[1, 2, 3].map((periodNum) => {
                const p = PERIODS.find((item) => item.period === periodNum)!;
                return (
                  <div
                    key={periodNum}
                    className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-800/80 text-xs hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="p-2 text-center bg-slate-900/90 border-r border-slate-800 flex flex-col justify-center">
                      <span className="font-bold text-slate-200">{p.period}. Std.</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.start} - {p.end}</span>
                    </div>

                    {[1, 2, 3, 4, 5].map((d) => {
                      const lesson = TIMETABLE_SCHEDULE[d]?.[periodNum];
                      const isNow = currentDay === d && currentPeriod === periodNum && !isBreakActive;

                      return (
                        <div
                          key={d}
                          className={`p-2 border-r border-slate-800 last:border-r-0 flex flex-col justify-center transition-all ${
                            isNow
                              ? 'bg-rose-950/60 ring-2 ring-rose-500 ring-inset rounded-sm'
                              : lesson
                              ? 'bg-slate-900/30'
                              : 'bg-slate-950/30 text-slate-600'
                          }`}
                        >
                          {lesson ? (
                            <div>
                              <div className="font-bold text-slate-200 flex items-center justify-between">
                                <span>{lesson.subject}</span>
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1 rounded">
                                  {lesson.teacher}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {lesson.fullName}
                              </div>
                              {isNow && (
                                <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-rose-400">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Aktuell (Unterricht)</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic text-[11px] text-center">Frei</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* 1. GROSSE PAUSE ROW */}
              <div
                className={`grid grid-cols-[100px_1fr] border-b border-slate-700 py-2.5 px-3 transition-colors ${
                  isBreakActive && statusResult.currentBreak?.name.includes('1.')
                    ? 'bg-emerald-900/50 ring-2 ring-emerald-400 ring-inset'
                    : 'bg-emerald-950/20'
                }`}
              >
                <div className="text-center font-mono font-bold text-emerald-400 text-xs flex flex-col justify-center">
                  <span>10:30 - 11:00</span>
                  <span className="text-[10px] text-emerald-300 font-normal">30 Min.</span>
                </div>
                <div className="flex items-center justify-between pl-4 pr-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>1. Große Pause</span>
                    <span className="text-xs font-normal text-emerald-200/80 hidden sm:inline">
                      • Erholung & Frühstück
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>GAMES FREI</span>
                  </div>
                </div>
              </div>

              {/* Rows: Periods 4 to 6 */}
              {[4, 5, 6].map((periodNum) => {
                const p = PERIODS.find((item) => item.period === periodNum)!;
                return (
                  <div
                    key={periodNum}
                    className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-800/80 text-xs hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="p-2 text-center bg-slate-900/90 border-r border-slate-800 flex flex-col justify-center">
                      <span className="font-bold text-slate-200">{p.period}. Std.</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.start} - {p.end}</span>
                    </div>

                    {[1, 2, 3, 4, 5].map((d) => {
                      const lesson = TIMETABLE_SCHEDULE[d]?.[periodNum];
                      const isNow = currentDay === d && currentPeriod === periodNum && !isBreakActive;

                      return (
                        <div
                          key={d}
                          className={`p-2 border-r border-slate-800 last:border-r-0 flex flex-col justify-center transition-all ${
                            isNow
                              ? 'bg-rose-950/60 ring-2 ring-rose-500 ring-inset rounded-sm'
                              : lesson
                              ? 'bg-slate-900/30'
                              : 'bg-slate-950/30 text-slate-600'
                          }`}
                        >
                          {lesson ? (
                            <div>
                              <div className="font-bold text-slate-200 flex items-center justify-between">
                                <span>{lesson.subject}</span>
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1 rounded">
                                  {lesson.teacher}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {lesson.fullName}
                              </div>
                              {isNow && (
                                <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-rose-400">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Aktuell (Unterricht)</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic text-[11px] text-center">Frei</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* 2. PAUSE / MITTAGSPAUSE ROW */}
              <div
                className={`grid grid-cols-[100px_1fr] border-b border-slate-700 py-2.5 px-3 transition-colors ${
                  isBreakActive && statusResult.currentBreak?.name.includes('Mittag')
                    ? 'bg-emerald-900/50 ring-2 ring-emerald-400 ring-inset'
                    : 'bg-emerald-950/20'
                }`}
              >
                <div className="text-center font-mono font-bold text-emerald-400 text-xs flex flex-col justify-center">
                  <span>13:15 - 14:10</span>
                  <span className="text-[10px] text-emerald-300 font-normal">55 Min.</span>
                </div>
                <div className="flex items-center justify-between pl-4 pr-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>2. Pause / Mittagspause (Di & Do)</span>
                    <span className="text-xs font-normal text-emerald-200/80 hidden sm:inline">
                      • Mo, Mi & Fr Schulschluss um 13:15 Uhr
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>GAMES FREI</span>
                  </div>
                </div>
              </div>

              {/* Rows: Periods 7 and 8 (Afternoon on Di & Do) */}
              {[7, 8].map((periodNum) => {
                const p = PERIODS.find((item) => item.period === periodNum)!;
                return (
                  <div
                    key={periodNum}
                    className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-800/80 last:border-b-0 text-xs hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="p-2 text-center bg-slate-900/90 border-r border-slate-800 flex flex-col justify-center">
                      <span className="font-bold text-slate-200">{p.period}. Std.</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.start} - {p.end}</span>
                    </div>

                    {[1, 2, 3, 4, 5].map((d) => {
                      const lesson = TIMETABLE_SCHEDULE[d]?.[periodNum];
                      const isNow = currentDay === d && currentPeriod === periodNum && !isBreakActive;

                      return (
                        <div
                          key={d}
                          className={`p-2 border-r border-slate-800 last:border-r-0 flex flex-col justify-center transition-all ${
                            isNow
                              ? 'bg-rose-950/60 ring-2 ring-rose-500 ring-inset rounded-sm'
                              : lesson
                              ? 'bg-slate-900/30'
                              : 'bg-slate-950/30 text-slate-600'
                          }`}
                        >
                          {lesson ? (
                            <div>
                              <div className="font-bold text-slate-200 flex items-center justify-between">
                                <span>{lesson.subject}</span>
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1 rounded">
                                  {lesson.teacher}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {lesson.fullName}
                              </div>
                              {isNow && (
                                <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-rose-400">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Aktuell (Unterricht)</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic text-[11px] text-center">
                              {d === 1 || d === 3 || d === 5 ? 'Schulschluss 13:15' : 'Frei'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span>
                Pausenzeiten: <strong>10:30 – 11:00 Uhr</strong> & <strong>13:15 – 14:10 Uhr</strong> (Dienstag & Donnerstag).
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer"
            >
              Verstanden
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

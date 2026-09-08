import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockSettings, QuizDifficulty } from '../types';
import { getSpokenTimePhrase } from '../utils/timePhrases';
import { playSuccessSound, playIncorrectSound, triggerHaptic } from '../utils/audio';
import {
  X,
  Trophy,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface QuizOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onSetClockTime: (h: number, m: number) => void;
}

interface Question {
  hour: number;
  minute: number;
  spokenAnswer: string;
  digitalAnswer: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  isOpen,
  onClose,
  settings,
  onSetClockTime,
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(settings.showQuizSolutionHint);
  const [timeLeft, setTimeLeft] = useState<number>(settings.quizTimerDuration || 30);
  const uid = useId();

  // Generate random target question based on selected difficulty
  const generateQuestion = useCallback((): Question => {
    const diff = settings.quizDifficulty;
    const hour = Math.floor(Math.random() * 12) + 1; // 1 to 12
    let minute = 0;

    if (diff === 'easy') {
      minute = Math.random() > 0.5 ? 30 : 0;
    } else if (diff === 'medium') {
      const choices = [0, 15, 30, 45];
      minute = choices[Math.floor(Math.random() * choices.length)];
    } else if (diff === 'hard') {
      minute = Math.floor(Math.random() * 12) * 5; // 0, 5, 10 ... 55
    } else {
      // expert
      minute = Math.floor(Math.random() * 60);
    }

    const correctSpoken = getSpokenTimePhrase(hour, minute, settings.timeLanguage);
    const correctDigital = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} Uhr`;

    // Generate 3 clever distractors
    const distractorMinutes = new Set<number>();
    while (distractorMinutes.size < 3) {
      let dm = 0;
      if (diff === 'easy') {
        dm = minute === 0 ? 30 : 0;
      } else if (diff === 'medium') {
        const c = [0, 15, 30, 45].filter((m) => m !== minute);
        dm = c[Math.floor(Math.random() * c.length)];
      } else if (diff === 'hard') {
        dm = Math.floor(Math.random() * 12) * 5;
      } else {
        dm = (minute + (Math.floor(Math.random() * 9) - 4) * 5 + 60) % 60;
      }

      if (dm !== minute || distractorMinutes.size >= 2) {
        distractorMinutes.add(dm);
      }
    }

    const distractorList = Array.from(distractorMinutes);
    const options = [
      { id: `${uid}-correct`, text: `${correctSpoken} (${correctDigital})`, isCorrect: true },
      ...distractorList.map((dm, idx) => {
        const dSpoken = getSpokenTimePhrase(hour, dm, settings.timeLanguage);
        const dDigital = `${hour.toString().padStart(2, '0')}:${dm.toString().padStart(2, '0')} Uhr`;
        return {
          id: `${uid}-dist-${idx}`,
          text: `${dSpoken} (${dDigital})`,
          isCorrect: false,
        };
      }),
    ];

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    return {
      hour,
      minute,
      spokenAnswer: correctSpoken,
      digitalAnswer: correctDigital,
      options,
    };
  }, [settings.quizDifficulty, settings.timeLanguage, uid]);

  // Start new round
  const nextRound = useCallback(() => {
    const q = generateQuestion();
    setCurrentQuestion(q);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setShowHint(settings.showQuizSolutionHint);
    setTimeLeft(settings.quizTimerDuration || 30);
    // Position clock to question time
    onSetClockTime(q.hour, q.minute);
  }, [generateQuestion, onSetClockTime, settings.quizTimerDuration, settings.showQuizSolutionHint]);

  // Init when quiz opens
  useEffect(() => {
    if (isOpen) {
      nextRound();
    }
  }, [isOpen, nextRound]);

  // Timer Countdown
  useEffect(() => {
    if (!isOpen || isAnswered || !settings.quizTimerDuration || settings.quizTimerDuration === 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Time up!
          setIsAnswered(true);
          if (settings.soundEnabled) playIncorrectSound();
          if (settings.vibrationEnabled) triggerHaptic([50, 50, 50]);
          setStreak(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isAnswered, settings.quizTimerDuration, settings.soundEnabled, settings.vibrationEnabled]);

  const handleSelectOption = (option: Question['options'][0]) => {
    if (isAnswered) return;
    setSelectedOptionId(option.id);
    setIsAnswered(true);

    if (option.isCorrect) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      if (settings.soundEnabled) playSuccessSound();
      if (settings.vibrationEnabled) triggerHaptic([30, 60, 30]);
    } else {
      setStreak(0);
      if (settings.soundEnabled) playIncorrectSound();
      if (settings.vibrationEnabled) triggerHaptic(80);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        id="quiz-overlay-card"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl z-50 text-slate-100 select-none"
      >
        {/* Header with Title and Close button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Schuluhr Quiz</h3>
              <p className="text-[11px] text-slate-400">Wie spät ist es auf der Uhr?</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Quiz schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score, Streak and Timer Bar */}
        <div className="flex items-center justify-between mt-3 px-1 py-1.5 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-xs">
          <div className="flex items-center gap-1.5 px-3">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-300">{score} Pkt</span>
          </div>

          <div className="flex items-center gap-1 px-3 border-x border-slate-700/50">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-bold text-orange-300">{streak} Serie</span>
          </div>

          {settings.quizTimerDuration && settings.quizTimerDuration > 0 ? (
            <div className="flex items-center gap-1.5 px-3">
              <span
                className={`font-mono font-bold ${
                  timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-300'
                }`}
              >
                {timeLeft}s
              </span>
            </div>
          ) : (
            <div className="px-3 text-slate-400 text-[11px]">Kein Limit</div>
          )}
        </div>

        {/* Answer Options Grid */}
        <div className="mt-4 space-y-2">
          {currentQuestion?.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200';

            if (isAnswered) {
              if (opt.isCorrect) {
                btnStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50';
              } else if (isSelected) {
                btnStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-500/50';
              } else {
                btnStyle = 'opacity-40 bg-slate-800/40 border-slate-800 text-slate-400';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt)}
                className={`w-full p-3 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all active:scale-98 flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span>{opt.text}</span>
                {isAnswered && opt.isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {isAnswered && isSelected && !opt.isCorrect && (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Optional Solution Hint / Explanation */}
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowHint((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showHint ? 'Lösung verbergen' : 'Lösung anzeigen'}
          </button>

          {isAnswered && (
            <button
              type="button"
              onClick={nextRound}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Nächste Frage
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Revealed Solution Hint Box */}
        {showHint && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 flex items-start gap-2"
          >
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Lösung:</span> {currentQuestion.spokenAnswer} (
              {currentQuestion.digitalAnswer}). Der blaue Stundenzeiger zeigt auf{' '}
              {currentQuestion.hour}, der rote Minutenzeiger auf {currentQuestion.minute} Minuten.
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Gamepad2,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Grid,
  Zap,
  Bomb,
  Layers,
  Award,
  Crown,
  User as UserIcon,
  Lock,
  Coffee,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { GameId, GameCategory, GameMeta, GAME_CAT_LABELS } from './types';
import { getAllGamesStats, getDailyChallenge } from './storage';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { SchoolStatusResult } from '../utils/timetable';
import { SchoolBreakLockView } from '../components/SchoolBreakLockView';
import { TetrisGame } from './TetrisGame';
import { Game2048 } from './Game2048';
import { SnakeGame } from './SnakeGame';
import { MinesweeperGame } from './MinesweeperGame';
import { MemoryGame } from './MemoryGame';
import { FlappyBirdGame } from './FlappyBirdGame';
import { BreakoutGame } from './BreakoutGame';
import { Connect4Game } from './Connect4Game';
import { SimonGame } from './SimonGame';
import { PongGame } from './PongGame';
import { TicTacToeGame } from './TicTacToeGame';
import { TowerDefenseGame } from './TowerDefenseGame';

export const GAMES_CATALOG: GameMeta[] = [
  {
    id: 'tetris',
    title: 'Tetris',
    shortDesc: 'Der legendäre Klassiker: Staple Tetrominos, räume Linien ab und jage neue Rekorde.',
    category: 'klassiker',
    accentColor: 'from-cyan-500 to-blue-600',
    duration: '3-10 Min',
    controlsHint: 'Pfeiltasten / W,A,S,D / Touch-Buttons',
  },
  {
    id: 'breakout',
    title: 'Breakout',
    shortDesc: 'Zerschlage Steinreihen mit Ball und Schläger. Sammle Punkte und halte deine Leben.',
    category: 'klassiker',
    accentColor: 'from-blue-500 to-indigo-600',
    duration: '2-5 Min',
    controlsHint: 'Pfeiltasten / A,D / Maus / Touch',
  },
  {
    id: '2048',
    title: '2048',
    shortDesc: 'Verschiebe und kombiniere Kacheln gleicher Zahl, bis du die magische 2048 erreichst.',
    category: 'denksport',
    accentColor: 'from-amber-500 to-orange-600',
    duration: '2-5 Min',
    controlsHint: 'Wischen / Pfeiltasten / Touch',
  },
  {
    id: 'connect4',
    title: '4 Gewinnt',
    shortDesc: 'Verbinde 4 Steine deiner Farbe waagerecht, senkrecht oder diagonal gegen KI oder zu zweit.',
    category: 'denksport',
    accentColor: 'from-rose-500 to-amber-500',
    duration: '2-5 Min',
    controlsHint: 'Klick / Spalte antippen',
  },
  {
    id: 'snake',
    title: 'Snake',
    shortDesc: 'Klassisches Schlangen-Spiel: Schnapp dir Äpfel, wachse und vermeide Kollisionen.',
    category: 'kurze_pausen',
    accentColor: 'from-emerald-500 to-teal-600',
    duration: '1-3 Min',
    controlsHint: 'Pfeiltasten / D-Pad',
  },
  {
    id: 'simon',
    title: 'Farben-Gedächtnis',
    shortDesc: 'Merke dir die wachsende Klang- und Farbsequenz und wiederhole sie fehlerfrei.',
    category: 'kurze_pausen',
    accentColor: 'from-emerald-500 to-amber-500',
    duration: '1-3 Min',
    controlsHint: '1-4 / Q,W,A,S / Touch',
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    shortDesc: 'Logikspiel: Finde alle Minen durch Zahlenhinweise und markiere sie mit Flaggen.',
    category: 'klassiker',
    accentColor: 'from-rose-500 to-red-600',
    duration: '2-6 Min',
    controlsHint: 'Klick / Touch / Flaggen-Umschalter',
  },
  {
    id: 'memory',
    title: 'Memory Match',
    shortDesc: 'Finde Paare unter Zeitdruck! Wähle zwischen Normal, Schwer (5×4), Experte (6×4) und Chaos-Modus mit Kartenmischung.',
    category: 'denksport',
    accentColor: 'from-purple-500 to-indigo-600',
    duration: '1-3 Min',
    controlsHint: 'Karten antippen / WASD / Enter',
  },
  {
    id: 'flappy',
    title: 'Flappy Bird',
    shortDesc: 'Halte den Vogel durch rhythmisches Antippen in der Luft und weiche den Röhren aus.',
    category: 'kurze_pausen',
    accentColor: 'from-yellow-500 to-amber-600',
    duration: '1-2 Min',
    controlsHint: 'Leertaste / Touch-Tap',
  },
  {
    id: 'pong',
    title: 'Retro Pong',
    shortDesc: 'Legendärer Tischtennis-Klassiker: Spiele im rasanten Ballwechsel gegen KI oder lokal zu zweit.',
    category: 'klassiker',
    accentColor: 'from-sky-500 to-rose-600',
    duration: '1-3 Min',
    controlsHint: 'W,S / Pfeile / Leertaste / R',
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    shortDesc: 'Setze 3 oder 4 Symbole in eine Reihe. Tritt gegen die unbesiegbare Minimax-KI oder lokal im 2-Spieler-Modus an!',
    category: 'denksport',
    accentColor: 'from-cyan-500 to-amber-500',
    duration: '1-2 Min',
    controlsHint: '1-9 / WASD / Enter / Klick',
  },
  {
    id: 'towerdefense',
    title: 'Tower Defense (Valorian)',
    shortDesc: 'Mittelalterliches Tower Defense mit detailreichen Texturen, Scharfschützen-Wehrtürmen, Repetier-Ballisten, Belagerungskatapulten & interaktivem Festungs-Shop!',
    category: 'denksport',
    accentColor: 'from-amber-600 to-stone-700',
    duration: '5-15 Min',
    controlsHint: 'Klick (Bauen) / B (Shop) / U (Schmiede) / Q (Mauszeiger leer) / SPACE (Pause)',
  },
];

interface GamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
  statusResult?: SchoolStatusResult;
  onOpenTimetable?: () => void;
  onSimulateBreak?: () => void;
  onToggleTeacherOverride?: () => void;
  teacherOverride?: boolean;
}

export const GamesModal: React.FC<GamesModalProps> = ({
  isOpen,
  onClose,
  soundEnabled = true,
  statusResult,
  onOpenTimetable,
  onSimulateBreak,
  onToggleTeacherOverride,
  teacherOverride = false,
}) => {
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const isGameAllowed = statusResult?.isGameAllowed ?? true;

  // Authentication
  const { user, isOwner } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load all stats and daily challenge
  const allStats = useMemo(() => {
    void statsRefreshKey;
    return getAllGamesStats();
  }, [statsRefreshKey, isOpen]);

  const dailyChallenge = useMemo(() => {
    void statsRefreshKey;
    return getDailyChallenge();
  }, [statsRefreshKey, isOpen]);

  // Overall statistics summary
  const totalSummary = useMemo(() => {
    let totalPlayed = 0;
    let totalTimeSec = 0;
    (Object.values(allStats) as import('./types').GameStats[]).forEach((s) => {
      totalPlayed += s.gamesPlayed;
      totalTimeSec += s.playTimeSeconds;
    });
    const minutes = Math.floor(totalTimeSec / 60);
    return { totalPlayed, minutes };
  }, [allStats]);

  // Filtered games list
  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter((game) => {
      const matchesCategory =
        selectedCategory === 'all' || game.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleStartGame = (id: GameId) => {
    setActiveGameId(id);
  };

  const handleRestartGame = (_id: GameId) => {
    // Game will reset in its component
  };

  const handleBackToOverview = () => {
    setActiveGameId(null);
    setStatsRefreshKey((k) => k + 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="games-modal-backdrop"
        id="games-modal-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-5 bg-slate-950/85 backdrop-blur-xl overflow-hidden"
      >
        {/* Modal Window Container */}
        <motion.div
          key="games-modal-dialog"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative w-full ${
            activeGameId === 'towerdefense' ? 'max-w-6xl' : 'max-w-4xl'
          } h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-2.5rem)] max-h-[780px] bg-slate-900/95 border-2 border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ring-1 ring-white/10`}
        >
          {/* Header Bar */}
          <div
            className={`flex items-center justify-between gap-2.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0 transition-all ${
              activeGameId ? 'px-3 sm:px-4 py-2 sm:py-2.5' : 'px-4 sm:px-5 py-3.5'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    {activeGameId ? (
                      <span className="flex items-center gap-1.5">
                        <span>{GAMES_CATALOG.find((g) => g.id === activeGameId)?.title || 'Spiel'}</span>
                        <span className="text-slate-500 font-normal hidden sm:inline">|</span>
                        <span className="text-xs text-slate-400 font-normal hidden sm:inline">Schuluhr Arcade</span>
                      </span>
                    ) : (
                      'Pausen-Spiele'
                    )}
                  </h2>
                  {!activeGameId && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">
                      Schuluhr Arcade
                    </span>
                  )}
                </div>
                {!activeGameId && (
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Klassiker und Denksportspiele für deine Pause – optimiert für Laptop & Desktop.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* School Status Indicator */}
              {statusResult && (
                <div className="hidden sm:flex items-center">
                  {statusResult.status === 'break' ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                      <Coffee className="w-3 h-3 text-emerald-400" />
                      <span>Pause: noch {statusResult.currentBreak?.remainingMinutes}m</span>
                    </div>
                  ) : !isGameAllowed ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>Unterricht (Gesperrt)</span>
                    </div>
                  ) : teacherOverride ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                      <span>Lehrer-Freigabe</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Stundenplan Button */}
              {onOpenTimetable && (
                <button
                  type="button"
                  onClick={onOpenTimetable}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs transition-colors cursor-pointer"
                  title="Stundenplan HO 2 (Frau Schmitz) ansehen"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden md:inline font-semibold">Stundenplan</span>
                </button>
              )}

              {/* Optional User Pill */}
              {user && (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors cursor-pointer"
                  title="Angemeldet"
                >
                  {isOwner ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-200 max-w-[110px] truncate text-[11px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundOn((s) => !s)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={soundOn ? 'Spielton deaktivieren' : 'Spielton aktivieren'}
                aria-label="Sound umschalten"
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Close Button */}
              <button
                id="close-games-modal-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Schließen (Esc)"
                aria-label="Spielemenü schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conditional Body: Lock View if Outside Breaks */}
          {!isGameAllowed && statusResult ? (
            <SchoolBreakLockView
              statusResult={statusResult}
              onOpenTimetable={onOpenTimetable || (() => {})}
              onSimulateBreak={onSimulateBreak || (() => {})}
              onToggleTeacherOverride={onToggleTeacherOverride || (() => {})}
              teacherOverride={teacherOverride}
              onCloseModal={onClose}
            />
          ) : activeGameId ? (
            /* Active Game View */
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-950/40 p-1.5 sm:p-2.5 md:p-3 min-h-0">
              {activeGameId === 'tetris' && (
                <TetrisGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('tetris')}
                />
              )}
              {activeGameId === '2048' && (
                <Game2048
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('2048')}
                />
              )}
              {activeGameId === 'snake' && (
                <SnakeGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('snake')}
                />
              )}
              {activeGameId === 'minesweeper' && (
                <MinesweeperGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('minesweeper')}
                />
              )}
              {activeGameId === 'memory' && (
                <MemoryGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('memory')}
                />
              )}
              {activeGameId === 'flappy' && (
                <FlappyBirdGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('flappy')}
                />
              )}
              {activeGameId === 'breakout' && (
                <BreakoutGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('breakout')}
                />
              )}
              {activeGameId === 'connect4' && (
                <Connect4Game
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('connect4')}
                />
              )}
              {activeGameId === 'simon' && (
                <SimonGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('simon')}
                />
              )}
              {activeGameId === 'pong' && (
                <PongGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('pong')}
                />
              )}
              {activeGameId === 'tictactoe' && (
                <TicTacToeGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('tictactoe')}
                />
              )}
              {activeGameId === 'towerdefense' && (
                <TowerDefenseGame
                  onBack={handleBackToOverview}
                  soundEnabled={soundOn}
                  onRestart={() => handleRestartGame('towerdefense')}
                />
              )}
            </div>
          ) : (
            /* Games Overview with Cards */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* School Break Status Header Bar */}
              {statusResult && (
                <div
                  className={`rounded-2xl p-3 sm:p-3.5 border flex flex-wrap items-center justify-between gap-3 text-xs shadow-md ${
                    statusResult.status === 'break'
                      ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-100'
                      : teacherOverride
                      ? 'bg-amber-950/50 border-amber-700/60 text-amber-100'
                      : 'bg-slate-850/80 border-slate-750 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        statusResult.status === 'break'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {statusResult.status === 'break' ? (
                        <Coffee className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>
                          {statusResult.status === 'break'
                            ? `${statusResult.currentBreak?.name} aktiv!`
                            : teacherOverride
                            ? 'Lehrer-Freigabe aktiv'
                            : statusResult.status === 'weekend'
                            ? 'Wochenende (Freizeit)'
                            : statusResult.status === 'after_school'
                            ? 'Schulschluss (Freizeit)'
                            : 'Schulstatus: Freizeit'}
                        </span>
                        {statusResult.status === 'break' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-bold uppercase tracking-wider animate-pulse">
                            Noch {statusResult.currentBreak?.remainingMinutes} Min.
                          </span>
                        )}
                        {statusResult.isSimulated && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/25 text-blue-300 font-semibold border border-blue-500/30">
                            Simulation
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {statusResult.status === 'break'
                          ? `Pausenzeit ${statusResult.currentBreak?.start} – ${statusResult.currentBreak?.end} Uhr • Nächste Stunde: ${
                              statusResult.nextLesson
                                ? `${statusResult.nextLesson.period}. Std. ${statusResult.nextLesson.lesson.subject}`
                                : 'Unterricht'
                            }`
                          : 'Klasse HO 2 (Frau Schmitz) • Pausen-Sperre schützt deine Konzentration im Unterricht.'}
                      </p>
                    </div>
                  </div>

                  {onOpenTimetable && (
                    <button
                      type="button"
                      onClick={onOpenTimetable}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>Stundenplan ansehen</span>
                    </button>
                  )}
                </div>
              )}

              {/* Daily Challenge & Summary Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Daily Challenge Card */}
                <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-700/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Tägliche Challenge
                        </div>
                        <h3 className="text-sm font-semibold text-white">
                          {dailyChallenge.title}
                        </h3>
                      </div>
                    </div>
                    {dailyChallenge.isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Erledigt</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-300/90 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">
                        Heute aktiv
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mb-3">
                    {dailyChallenge.targetDescription}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-blue-700/30">
                    <span className="text-[11px] text-blue-200/80">
                      Belohnung: <strong className="text-white">{dailyChallenge.rewardText}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartGame(dailyChallenge.gameId)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Challenge starten</span>
                    </button>
                  </div>
                </div>

                {/* Overall Stats Pill */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Deine Statistik
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Gespielte Runden:</span>
                      <span className="font-mono font-bold text-cyan-400 text-sm">
                        {totalSummary.totalPlayed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Gesamtspielzeit:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {totalSummary.minutes} Min
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Verfügbare Spiele:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{GAMES_CATALOG.length} Spiele</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Spiel suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {(['all', 'kurze_pausen', 'klassiker', 'denksport'] as GameCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        {GAME_CAT_LABELS[cat]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Grid of Game Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {filteredGames.map((game) => {
                  const stat = allStats[game.id];
                  return (
                    <motion.div
                      key={game.id}
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.15 }}
                      className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 flex flex-col justify-between shadow-md transition-all"
                    >
                      <div>
                        {/* Top Card Bar */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div
                            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${game.accentColor} flex items-center justify-center text-white shadow-md`}
                          >
                            {game.id === 'tetris' && <Grid className="w-6 h-6" />}
                            {game.id === '2048' && <Layers className="w-6 h-6" />}
                            {game.id === 'snake' && <Zap className="w-6 h-6" />}
                            {game.id === 'minesweeper' && <Bomb className="w-6 h-6" />}
                            {game.id === 'memory' && <Sparkles className="w-6 h-6" />}
                            {game.id === 'flappy' && <Award className="w-6 h-6" />}
                            {game.id === 'breakout' && <Zap className="w-6 h-6" />}
                            {game.id === 'connect4' && <Grid className="w-6 h-6" />}
                            {game.id === 'simon' && <Sparkles className="w-6 h-6" />}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                              {GAME_CAT_LABELS[game.category]}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{game.duration}</span>
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                          {game.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {game.shortDesc}
                        </p>

                        <div className="mt-2.5 text-[10px] text-slate-400 bg-slate-950/50 border border-slate-800/80 px-2.5 py-1 rounded-lg flex items-center justify-between">
                          <span className="truncate text-slate-400">Steuerung:</span>
                          <span className="text-slate-300 font-medium truncate ml-1">
                            {game.controlsHint}
                          </span>
                        </div>
                      </div>

                      {/* Footer Info & Action */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                            Rekord
                          </div>
                          <div className="text-xs font-bold font-mono text-amber-400">
                            {stat.highScore > 0 ? stat.highScore : 'Noch keiner'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartGame(game.id)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Spielen</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredGames.length === 0 && (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  <Gamepad2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-slate-300">Keine Spiele gefunden</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Probiere einen anderen Suchbegriff oder setze die Kategorie zurück.
                  </p>
                </div>
              )}
            </div>
          )}
          </motion.div>
        </motion.div>

        {/* Optional Auth Modal for account login/management */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </AnimatePresence>
  );
};

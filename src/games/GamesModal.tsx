import React, { useState, useMemo, useEffect } from 'react';
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
  Activity,
  Edit2,
  Check,
  User as UserIcon,
  Crown,
  ShieldCheck,
  History,
  Monitor,
  Smartphone,
  Tablet,
  Radio,
} from 'lucide-react';
import { GameId, GameCategory, GameMeta, GAME_CAT_LABELS, GameStartRecord } from './types';
import { getAllGamesStats, getDailyChallenge } from './storage';
import { useAuth, APP_OWNER_EMAIL } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import {
  recordGameStart,
  subscribeRecentGameEvents,
  getPlayerNickname,
  setPlayerNickname,
} from '../services/gameTracker';
import { TetrisGame } from './TetrisGame';
import { Game2048 } from './Game2048';
import { SnakeGame } from './SnakeGame';
import { MinesweeperGame } from './MinesweeperGame';
import { MemoryGame } from './MemoryGame';
import { FlappyBirdGame } from './FlappyBirdGame';

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
    id: '2048',
    title: '2048',
    shortDesc: 'Verschiebe und kombiniere Kacheln gleicher Zahl, bis du die magische 2048 erreichst.',
    category: 'denksport',
    accentColor: 'from-amber-500 to-orange-600',
    duration: '2-5 Min',
    controlsHint: 'Wischen / Pfeiltasten / Touch',
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
    shortDesc: 'Finde zusammengehörige Paare in möglichst wenigen Zügen und Sekunden.',
    category: 'denksport',
    accentColor: 'from-purple-500 to-indigo-600',
    duration: '1-3 Min',
    controlsHint: 'Karten antippen',
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
];

interface GamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
}

export const GamesModal: React.FC<GamesModalProps> = ({
  isOpen,
  onClose,
  soundEnabled = true,
}) => {
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Authentication & Player identity
  const { user, profile, isOwner, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [nickname, setNickname] = useState(() => getPlayerNickname());
  const [tempNickname, setTempNickname] = useState(nickname);
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  // Live tracking state
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [eventsList, setEventsList] = useState<GameStartRecord[]>([]);
  const [lastTrackedNotice, setLastTrackedNotice] = useState<string | null>(null);

  // Subscribe to real-time game start events (Firestore & Local)
  useEffect(() => {
    const unsubscribe = subscribeRecentGameEvents((events) => {
      setEventsList(events);
    });
    return () => unsubscribe();
  }, []);

  // Format relative time helper
  const formatRelativeTime = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 10) return 'Gerade eben';
      if (diffSec < 60) return `vor ${diffSec}s`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `vor ${diffMin}m`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `vor ${diffHours}h`;
      return new Date(isoString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Kürzlich';
    }
  };

  // Load all stats and daily challenge
  const allStats = useMemo(() => {
    // Dependency on refreshKey to refresh after closing game
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

  const handleStartGame = async (id: GameId) => {
    const meta = GAMES_CATALOG.find((g) => g.id === id);
    const title = meta?.title || id;
    const effectivePlayer = user ? (user.displayName || user.email?.split('@')[0] || 'Spieler') : (nickname || 'Gast');
    setLastTrackedNotice(`Spielstart von ${effectivePlayer} protokolliert`);
    try {
      await recordGameStart(id, title, user, nickname);
    } catch (e) {
      console.error('Failed to log game start:', e);
    }
    setActiveGameId(id);
  };

  const handleRestartGame = async (id: GameId) => {
    const meta = GAMES_CATALOG.find((g) => g.id === id);
    const title = meta?.title || id;
    const effectivePlayer = user ? (user.displayName || user.email?.split('@')[0] || 'Spieler') : (nickname || 'Gast');
    setLastTrackedNotice(`Neustart von ${effectivePlayer} protokolliert`);
    try {
      await recordGameStart(id, title, user, nickname);
    } catch (e) {
      console.error('Failed to log game restart:', e);
    }
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
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl"
      >
        {/* Modal Window Container */}
        <motion.div
          key="games-modal-dialog"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl h-[92vh] max-h-[820px] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Pausen-Spiele
                  </h2>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">
                    Schuluhr Arcade
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Minispiele für die Pause – Spielstarts werden in Echtzeit getrackt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Player Identity Pill */}
              {user ? (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors cursor-pointer"
                  title="Angemeldet als Spieler – Klicken zum Verwalten"
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
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-850/90 border border-slate-750 text-xs">
                  <span className="text-[10px] text-slate-400">Spieler:</span>
                  {isEditingNickname ? (
                    <input
                      type="text"
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      onBlur={() => {
                        setPlayerNickname(tempNickname);
                        setNickname(tempNickname);
                        setIsEditingNickname(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setPlayerNickname(tempNickname);
                          setNickname(tempNickname);
                          setIsEditingNickname(false);
                        }
                      }}
                      autoFocus
                      placeholder="Name..."
                      className="w-16 sm:w-20 px-1 py-0.5 text-xs bg-slate-900 border border-blue-500 rounded text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempNickname(nickname);
                        setIsEditingNickname(true);
                      }}
                      className="font-semibold text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
                      title="Spieler-Namen anpassen"
                    >
                      <span className="max-w-[80px] truncate">{nickname || 'Gast'}</span>
                      <Edit2 className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[10px] text-slate-400 hover:text-blue-300 underline ml-0.5 cursor-pointer"
                    title="Optional anmelden für Inhaber-/Google-Account"
                  >
                    Login
                  </button>
                </div>
              )}

              {/* Activity Tracker Toggle Button */}
              <button
                type="button"
                onClick={() => setShowActivityLog((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  showActivityLog
                    ? 'bg-blue-600/30 border-blue-500/60 text-blue-200 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-300 hover:text-white'
                }`}
                title="Live-Tracking: Wer hat welches Spiel gestartet?"
              >
                <Activity className={`w-3.5 h-3.5 ${showActivityLog ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline text-[11px]">Tracker</span>
                {eventsList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/25 border border-blue-500/30 text-blue-300 font-mono text-[10px]">
                    {eventsList.length}
                  </span>
                )}
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundOn((s) => !s)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
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

          {activeGameId ? (
            /* Active Game View with Session Status Bar */
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-950/40">
              {/* Session Tracking Bar */}
              <div className="w-full bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-slate-400 text-[11px] shrink-0">Aktiv von:</span>
                  <span className="font-semibold text-white text-xs truncate">
                    {user ? (user.displayName || user.email?.split('@')[0]) : (nickname || 'Gast')}
                  </span>
                  {user && isOwner && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1 shrink-0">
                      <Crown className="w-2.5 h-2.5" /> Inhaber
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium shrink-0">
                  <Activity className="w-3 h-3" />
                  <span>Start getrackt</span>
                </div>
              </div>

              <div className="flex-1 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4">
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
              </div>
            </div>
          ) : showActivityLog ? (
            /* Dedicated Live Activity Tracking Protocol View */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Live Spielstart-Protokoll
                    </h3>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Firestore
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Jedes Mal, wenn ein Spiel gestartet wird, wird der Klick mit Benutzer, Zeitstempel und Gerät synchronisiert.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowActivityLog(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>← Zu den Spielen</span>
                </button>
              </div>

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Erfasste Starts</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{eventsList.length}</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Aktueller Spieler</div>
                  <div className="text-sm font-bold text-white truncate mt-1">
                    {user ? (user.displayName || user.email?.split('@')[0]) : (nickname || 'Gast')}
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Cloud-Sync</div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Firestore aktiv
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Lokales Backup</div>
                  <div className="text-xs font-semibold text-blue-300 mt-1.5">
                    localStorage gesichert
                  </div>
                </div>
              </div>

              {/* Event List */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Protokoll-Einträge ({eventsList.length})</span>
                  <span className="text-[11px] text-slate-500">Automatische Aktualisierung</span>
                </div>

                {eventsList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
                    <History className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                    <div className="text-sm font-semibold text-slate-300">Noch keine Starts protokolliert</div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Klicke auf ein beliebiges Spiel im Menü, um den ersten Spielstart live aufzuzeichnen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventsList.map((event) => {
                      const isUserOwner =
                        event.userEmail === APP_OWNER_EMAIL ||
                        event.userName.toLowerCase().includes('motti');
                      return (
                        <div
                          key={event.id}
                          className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 transition-colors shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                              <Gamepad2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white truncate">
                                  {event.userName}
                                </span>
                                {isUserOwner ? (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5" />
                                    Inhaber
                                  </span>
                                ) : !event.isGuest ? (
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-semibold">
                                    Angemeldet
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded">
                                    Gast
                                  </span>
                                )}
                                {event.userEmail && (
                                  <span className="text-[10px] text-slate-400 hidden sm:inline truncate">
                                    ({event.userEmail})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>hat gedrückt:</span>
                                <span className="font-semibold text-cyan-300 px-2 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50 text-[11px]">
                                  {event.gameTitle}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1 text-right">
                            <span className="text-xs font-medium text-slate-200" title={event.timestamp}>
                              {formatRelativeTime(event.timestamp)}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              {event.deviceInfo === 'Desktop' && <Monitor className="w-3 h-3" />}
                              {event.deviceInfo === 'Mobile' && <Smartphone className="w-3 h-3" />}
                              {event.deviceInfo === 'Tablet' && <Tablet className="w-3 h-3" />}
                              <span>{event.deviceInfo}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Games Overview with Cards */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Live Tracking Quick Banner */}
              {eventsList.length > 0 && (
                <div
                  onClick={() => setShowActivityLog(true)}
                  className="bg-blue-950/40 border border-blue-700/40 hover:border-blue-600/60 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 transition-colors cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-300 truncate">
                      <span className="text-slate-400">Zuletzt gestartet: </span>
                      <span className="font-bold text-white">{eventsList[0].userName}</span>
                      <span className="text-slate-400"> hat </span>
                      <span className="font-semibold text-cyan-300">{eventsList[0].gameTitle}</span>
                      <span className="text-slate-400">
                        {' '}
                        gedrückt ({formatRelativeTime(eventsList[0].timestamp)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-300 hover:text-white shrink-0">
                    <span>Protokoll öffnen ({eventsList.length})</span>
                    <span>→</span>
                  </div>
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
                      <span className="font-mono text-emerald-400 font-semibold">6 Spiele</span>
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

                        {/* Recent Player Tag if tracked */}
                        {(() => {
                          const lastEventForGame = eventsList.find((e) => e.gameId === game.id);
                          if (!lastEventForGame) return null;
                          return (
                            <div className="mt-2.5 text-[10px] text-slate-400 bg-slate-950/60 border border-slate-800/80 px-2 py-1 rounded-lg flex items-center justify-between">
                              <span className="truncate">
                                Zuletzt:{' '}
                                <strong className="text-slate-200 font-medium">
                                  {lastEventForGame.userName}
                                </strong>
                              </span>
                              <span className="text-slate-500 text-[9px] shrink-0 ml-1">
                                {formatRelativeTime(lastEventForGame.timestamp)}
                              </span>
                            </div>
                          );
                        })()}
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

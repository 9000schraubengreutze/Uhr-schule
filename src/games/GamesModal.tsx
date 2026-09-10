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
} from 'lucide-react';
import { GameId, GameCategory, GameMeta, GAME_CAT_LABELS } from './types';
import { getAllGamesStats, getDailyChallenge } from './storage';
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

  const handleStartGame = (id: GameId) => {
    setActiveGameId(id);
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
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
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Schnelle Minispiele für die Pause – direkt im Browser spielen.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
            /* Active Game View */
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4 bg-slate-950/40">
              {activeGameId === 'tetris' && (
                <TetrisGame onBack={handleBackToOverview} soundEnabled={soundOn} />
              )}
              {activeGameId === '2048' && (
                <Game2048 onBack={handleBackToOverview} soundEnabled={soundOn} />
              )}
              {activeGameId === 'snake' && (
                <SnakeGame onBack={handleBackToOverview} soundEnabled={soundOn} />
              )}
              {activeGameId === 'minesweeper' && (
                <MinesweeperGame onBack={handleBackToOverview} soundEnabled={soundOn} />
              )}
              {activeGameId === 'memory' && (
                <MemoryGame onBack={handleBackToOverview} soundEnabled={soundOn} />
              )}
              {activeGameId === 'flappy' && (
                <FlappyBirdGame onBack={handleBackToOverview} soundEnabled={soundOn} />
              )}
            </div>
          ) : (
            /* Games Overview with Cards */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
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
      </AnimatePresence>
  );
};

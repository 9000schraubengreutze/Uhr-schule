import { GameId, GameStats, DailyChallenge } from './types';

const STATS_KEY = 'webclock_games_stats_v1';
const DAILY_KEY = 'webclock_games_daily_v1';

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  highScore: 0,
  playTimeSeconds: 0,
  lastPlayed: null,
};

export function getGameStats(gameId: GameId): GameStats {
  try {
    const raw = localStorage.getItem(`${STATS_KEY}_${gameId}`);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveGameResult(
  gameId: GameId,
  score: number,
  timeSpentSec: number
): { isNewHighscore: boolean; stats: GameStats } {
  const current = getGameStats(gameId);
  const isNewHighscore = score > current.highScore;
  const newHighScore = Math.max(current.highScore, score);

  const updated: GameStats = {
    gamesPlayed: current.gamesPlayed + 1,
    highScore: newHighScore,
    playTimeSeconds: current.playTimeSeconds + Math.max(1, Math.round(timeSpentSec)),
    lastPlayed: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${STATS_KEY}_${gameId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save game stats to localStorage', err);
  }

  // Check daily challenge completion
  const daily = getDailyChallenge();
  if (!daily.isCompleted && daily.gameId === gameId && score >= daily.targetScore) {
    completeDailyChallenge();
  }

  return { isNewHighscore, stats: updated };
}

export function getAllGamesStats(): Record<GameId, GameStats> {
  const ids: GameId[] = [
    'tetris',
    '2048',
    'snake',
    'minesweeper',
    'memory',
    'flappy',
    'breakout',
    'connect4',
    'simon',
    'pong',
    'tictactoe',
  ];
  const res: Partial<Record<GameId, GameStats>> = {};
  ids.forEach((id) => {
    res[id] = getGameStats(id);
  });
  return res as Record<GameId, GameStats>;
}

const DAILY_SCHEDULE: Omit<DailyChallenge, 'date' | 'isCompleted'>[] = [
  {
    gameId: 'snake',
    title: 'Schlangen-Bändiger',
    targetDescription: 'Erreiche 100 Punkte in Snake',
    targetScore: 100,
    rewardText: 'Meister der Reflexe 🐍',
  },
  {
    gameId: 'breakout',
    title: 'Mauerbrecher',
    targetDescription: 'Erziele mindestens 150 Punkte in Breakout',
    targetScore: 150,
    rewardText: 'Präzisions-Schläger 🏓',
  },
  {
    gameId: '2048',
    title: 'Zahlen-Kombinierer',
    targetDescription: 'Erreiche mindestens 512 Punkte in 2048',
    targetScore: 512,
    rewardText: 'Mathe-Genie 🧠',
  },
  {
    gameId: 'simon',
    title: 'Farb-Virtuose',
    targetDescription: 'Erreiche Level 5 in Simon Says',
    targetScore: 5,
    rewardText: 'Gedächtnis-Meister 🎵',
  },
  {
    gameId: 'tetris',
    title: 'Linien-Räumer',
    targetDescription: 'Erziele 300 Punkte im klassischen Tetris',
    targetScore: 300,
    rewardText: 'Bauklotz-Architekt 🧱',
  },
  {
    gameId: 'connect4',
    title: 'Vier in einer Reihe',
    targetDescription: 'Gewinne ein Spiel 4 Gewinnt',
    targetScore: 1,
    rewardText: 'Taktik-Stratege 🔴',
  },
  {
    gameId: 'flappy',
    title: 'Himmelsflieger',
    targetDescription: 'Fliege durch mindestens 5 Röhren',
    targetScore: 5,
    rewardText: 'Höhenflug-Champion 🕊️',
  },
  {
    gameId: 'memory',
    title: 'Gedächtnis-Ass',
    targetDescription: 'Löse das Memory-Spiel komplett',
    targetScore: 100,
    rewardText: 'Elefantengedächtnis 🐘',
  },
  {
    gameId: 'minesweeper',
    title: 'Minen-Spürhund',
    targetDescription: 'Entschärfe das Minenfeld ohne Explosion',
    targetScore: 100,
    rewardText: 'Minen-Experte 💣',
  },
];

export function getDailyChallenge(): DailyChallenge {
  const todayStr = new Date().toISOString().slice(0, 10);
  // Pick day index based on timestamp
  const dayIndex = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) % DAILY_SCHEDULE.length;
  const template = DAILY_SCHEDULE[dayIndex];

  let isCompleted = false;
  try {
    const stored = localStorage.getItem(DAILY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === todayStr && parsed.isCompleted) {
        isCompleted = true;
      }
    }
  } catch {
    // Ignore error
  }

  return {
    date: todayStr,
    gameId: template.gameId,
    title: template.title,
    targetDescription: template.targetDescription,
    targetScore: template.targetScore,
    rewardText: template.rewardText,
    isCompleted,
  };
}

export function completeDailyChallenge(): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(
      DAILY_KEY,
      JSON.stringify({
        date: todayStr,
        isCompleted: true,
      })
    );
  } catch {
    // Ignore error
  }
}

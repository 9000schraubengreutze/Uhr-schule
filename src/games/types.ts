export type GameId = 'tetris' | '2048' | 'snake' | 'minesweeper' | 'memory' | 'flappy';

export type GameCategory = 'all' | 'kurze_pausen' | 'klassiker' | 'denksport';

export interface GameMeta {
  id: GameId;
  title: string;
  shortDesc: string;
  category: GameCategory;
  accentColor: string;
  badgeText?: string;
  duration: string;
  controlsHint: string;
}

export interface GameStats {
  gamesPlayed: number;
  highScore: number;
  playTimeSeconds: number;
  lastPlayed: string | null;
}

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  gameId: GameId;
  title: string;
  targetDescription: string;
  targetScore: number;
  rewardText: string;
  isCompleted: boolean;
}

export const GAME_CAT_LABELS: Record<GameCategory, string> = {
  all: 'Alle Spiele',
  kurze_pausen: 'Kurze Pausen',
  klassiker: 'Klassiker',
  denksport: 'Denksport',
};

export interface GameStartRecord {
  id?: string;
  gameId: string;
  gameTitle: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  isGuest: boolean;
  startedAt: string;
  device?: string;
}


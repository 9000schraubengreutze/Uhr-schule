import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  ShieldAlert,
  Flame,
  Zap,
  Target,
  ShoppingBag,
  Sparkles,
  Award,
  Crown,
  Info,
  X,
  ChevronRight,
  Shield,
  Droplets,
  FastForward,
  Swords,
  Heart,
  Coins,
} from 'lucide-react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';
import { EnemyPortrait } from './EnemyPortrait';
import { TowerPortrait } from './TowerPortrait';
import { drawMedievalTower, drawFantasyEnemy } from './medievalRenderers';

// ─────────────────────────────────────────────────────────────
// PROPORTIONS & CONSTANTS (Strict spec adherence)
// ─────────────────────────────────────────────────────────────
export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 600;
export const PATH_WIDTH = 54;
export const MAX_LIVES = 20; // Defeat if 20 enemies breach per spec
export const MAX_WAVES = 50; // Epic 50 waves progression

export interface TowerDefenseGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

// Fantasy battlefield path: Winding dirt road emerging from the left,
// leading down and curving toward the fortified castle gate on the right!
export const PATH_WAYPOINTS: { x: number; y: number }[] = [
  { x: 0, y: 160 },
  { x: 190, y: 160 },
  { x: 260, y: 340 },
  { x: 220, y: 470 },
  { x: 420, y: 490 },
  { x: 540, y: 350 },
  { x: 520, y: 200 },
  { x: 740, y: 200 },
  { x: 800, y: 320 },
  { x: 915, y: 320 }, // Direct entrance to fortified Castle Gateway
];

export type TowerType =
  | 'arrow' // Arrow Tower / Schütze
  | 'cannon' // Cannon Tower / Artillerie
  | 'magic' // Magic Arcane Tower
  | 'tesla' // Tesla / Lightning Tower
  | 'mortar' // Heavy Mortar Battery
  | 'ice' // Ice Frost Tower
  | 'ballista' // Heavy Ballista
  | 'bombard'; // Bombard Tower

export interface TowerConfig {
  id: TowerType;
  name: string;
  subTitle: string;
  role: string;
  cost: number;
  baseRange: number;
  baseDamage: number;
  baseFireRate: number; // shots per second
  color: string;
  accentColor: string;
  bulletColor: string;
  bulletRadius: number;
  size: number;
  bulletSpeed: number;
  description: string;
  iconSymbol: string;
  manaCost?: number;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    id: 'arrow',
    name: 'Arrow Tower',
    subTitle: 'Bogenschütze',
    role: 'Präzisions-Schütze',
    cost: 300,
    baseRange: 155,
    baseDamage: 1.5,
    baseFireRate: 1.0,
    color: '#15803d',
    accentColor: '#86efac',
    bulletColor: '#bbf7d0',
    bulletRadius: 3,
    size: 28,
    bulletSpeed: 10,
    description: 'Befestigter Wehrturm mit Meisterschützen und hoher Reichweite.',
    iconSymbol: '🏹',
  },
  cannon: {
    id: 'cannon',
    name: 'Cannon Tower',
    subTitle: 'Feld-Kanone',
    role: 'Flächenschaden',
    cost: 560,
    baseRange: 120,
    baseDamage: 2.2,
    baseFireRate: 1.2,
    color: '#b45309',
    accentColor: '#fde047',
    bulletColor: '#fef08a',
    bulletRadius: 4,
    size: 30,
    bulletSpeed: 9,
    description: 'Eiserne Kanone mit Schießpulver-Salven und mächtigem Rückstoß.',
    iconSymbol: '💣',
  },
  magic: {
    id: 'magic',
    name: 'Magic Tower',
    subTitle: 'Arkan-Monolith',
    role: 'Arkaner Strahl',
    cost: 900,
    baseRange: 140,
    baseDamage: 2.8,
    baseFireRate: 1.5,
    color: '#0284c7',
    accentColor: '#38bdf8',
    bulletColor: '#7dd3fc',
    bulletRadius: 4.5,
    size: 32,
    bulletSpeed: 12,
    description: 'Kanalisiert arkanes Mana in durchbohrende Energie-Blitze.',
    iconSymbol: '🔮',
  },
  tesla: {
    id: 'tesla',
    name: 'Tesla Tower',
    subTitle: 'Blitzspule',
    role: 'Kettenblitz',
    cost: 1200,
    baseRange: 130,
    baseDamage: 2.0,
    baseFireRate: 2.2,
    color: '#38bdf8',
    accentColor: '#e0f2fe',
    bulletColor: '#bae6fd',
    bulletRadius: 3.5,
    size: 30,
    bulletSpeed: 14,
    description: 'Hochvolt-Blitzableiter für verheerende Elektro-Kettenschocks.',
    iconSymbol: '⚡',
  },
  mortar: {
    id: 'mortar',
    name: 'Mortar Tower',
    subTitle: 'Belagerungs-Mörser',
    role: 'Explosiv-Bombe',
    cost: 1500,
    baseRange: 175,
    baseDamage: 4.0,
    baseFireRate: 0.5,
    color: '#991b1b',
    accentColor: '#fca5a5',
    bulletColor: '#f87171',
    bulletRadius: 6,
    size: 34,
    bulletSpeed: 6.5,
    description: 'Schwere Bombarde mit riesigem Explosionsradius gegen feindliche Horden.',
    iconSymbol: '💥',
  },
  ice: {
    id: 'ice',
    name: 'Ice Tower',
    subTitle: 'Frost-Kristall',
    role: 'Verlangsamung',
    cost: 1000,
    baseRange: 130,
    baseDamage: 1.4,
    baseFireRate: 1.8,
    color: '#06b6d4',
    accentColor: '#a5f3fc',
    bulletColor: '#cffafe',
    bulletRadius: 4,
    size: 29,
    bulletSpeed: 11,
    description: 'Erzeugt arktische Eiskristalle, die anstürmende Monster verlangsamen.',
    iconSymbol: '❄️',
  },
  ballista: {
    id: 'ballista',
    name: 'Ballista Tower',
    subTitle: 'Repetier-Armbrust',
    role: 'Schnellfeuer',
    cost: 1200,
    baseRange: 115,
    baseDamage: 1.1,
    baseFireRate: 2.6,
    color: '#78350f',
    accentColor: '#fbbf24',
    bulletColor: '#fef08a',
    bulletRadius: 3,
    size: 28,
    bulletSpeed: 13,
    description: 'Mechanische Holz-Balliste für ununterbrochene Bolzensalven.',
    iconSymbol: '🏹',
  },
  bombard: {
    id: 'bombard',
    name: 'Bombard Tower',
    subTitle: 'Königliche Bastion',
    role: 'Super-Artillerie',
    cost: 1500,
    baseRange: 180,
    baseDamage: 5.5,
    baseFireRate: 0.45,
    color: '#7f1d1d',
    accentColor: '#ef4444',
    bulletColor: '#fca5a5',
    bulletRadius: 7,
    size: 36,
    bulletSpeed: 6,
    description: 'Königliche Festungs-Bombarde für verheerende Brandschäden.',
    iconSymbol: '🏰',
  },
};

export interface UpgradeLevels {
  damage: number; // max 3
  fireRate: number; // max 3
  range: number; // max 2
}

export interface PlacedTower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  lastShotTime: number; // in seconds
  targetEnemyId: string | null;
  angle: number;
  totalInvestedGold: number;
  kills: number;
  muzzleFlashTime: number;
  recoilOffset: number;
}

export type EnemyKind =
  | 'orc_warrior'
  | 'orc_archer'
  | 'orc_brute'
  | 'spiderling'
  | 'wolf_rider'
  | 'siege_cannon';

export interface EnemyInfoDef {
  kind: EnemyKind;
  name: string;
  baseHp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  accent: string;
  badge: string;
  icon: string;
}

export const ENEMY_REGISTRY: Record<EnemyKind, EnemyInfoDef> = {
  orc_warrior: {
    kind: 'orc_warrior',
    name: 'Orc Warrior',
    baseHp: 5.0,
    speed: 68,
    damage: 1,
    radius: 13,
    color: '#15803d', // Green Orc Skin
    accent: '#4ade80',
    badge: 'Warrior',
    icon: '👺',
  },
  orc_archer: {
    kind: 'orc_archer',
    name: 'Orc Archer',
    baseHp: 3.8,
    speed: 78,
    damage: 1,
    radius: 12,
    color: '#166534',
    accent: '#86efac',
    badge: 'Ranged',
    icon: '🏹',
  },
  orc_brute: {
    kind: 'orc_brute',
    name: 'Orc Brute',
    baseHp: 13.0,
    speed: 48,
    damage: 2,
    radius: 17,
    color: '#854d0e',
    accent: '#fde047',
    badge: 'Heavy Brute',
    icon: '👹',
  },
  spiderling: {
    kind: 'spiderling',
    name: 'Spiderling',
    baseHp: 2.8,
    speed: 110,
    damage: 1,
    radius: 10,
    color: '#1e1b4b',
    accent: '#818cf8',
    badge: 'Fast Swarm',
    icon: '🕷️',
  },
  wolf_rider: {
    kind: 'wolf_rider',
    name: 'Wolf Rider',
    baseHp: 7.5,
    speed: 95,
    damage: 1,
    radius: 15,
    color: '#475569',
    accent: '#cbd5e1',
    badge: 'Cavalry',
    icon: '🐺',
  },
  siege_cannon: {
    kind: 'siege_cannon',
    name: 'Siege Cannon',
    baseHp: 22.0,
    speed: 36,
    damage: 3,
    radius: 20,
    color: '#450a0a',
    accent: '#f87171',
    badge: 'Siege Engine',
    icon: '🪵',
  },
};

export interface Enemy {
  id: string;
  kind: EnemyKind;
  segmentIndex: number; // current segment in PATH_WAYPOINTS
  progress: number; // 0 to 1 along the segment
  x: number;
  y: number;
  maxHp: number;
  hp: number;
  speed: number;
  color: string;
  accentColor: string;
  radius: number;
  waveNum: number;
  headingAngle: number;
  isSlowed?: number; // duration of slow effect in sec
}

export interface Bullet {
  id: string;
  towerType: TowerType;
  x: number;
  y: number;
  targetEnemyId: string;
  targetLastX: number;
  targetLastY: number;
  damage: number;
  speed: number;
  color: string;
  radius: number;
  splashRadius?: number;
  trail: { x: number; y: number }[];
  isIce?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  isSmoke?: boolean;
}

// Distance helper from point (px, py) to line segment (x1, y1) -> (x2, y2)
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Check if a coordinate is too close to the path (path width + safety buffer)
function isTooCloseToPath(x: number, y: number, buffer = 28): boolean {
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const p1 = PATH_WAYPOINTS[i];
    const p2 = PATH_WAYPOINTS[i + 1];
    const d = distToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
    if (d < PATH_WIDTH / 2 + buffer) {
      return true;
    }
  }
  return false;
}

export const TowerDefenseGame: React.FC<TowerDefenseGameProps> = ({
  onBack,
  soundEnabled = true,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game Stats matching the prompt reference:
  // Level: 14, Wave: 38/50, Lives: 18/20, Gold: 3,450, Mana: 120
  const [playerLevel, setPlayerLevel] = useState<number>(14);
  const [currentWave, setCurrentWave] = useState<number>(38);
  const [lives, setLives] = useState<number>(18);
  const [gold, setGold] = useState<number>(3450);
  const [mana, setMana] = useState<number>(120);
  const [gameSpeed, setGameSpeed] = useState<number>(1.0); // 1x or 2x speed

  const [selectedBuildType, setSelectedBuildType] = useState<TowerType | null>('arrow');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'victory'>('playing');
  const [intermissionCountdown, setIntermissionCountdown] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameStats('towerdefense').highScore);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modals
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [showEnemiesModal, setShowEnemiesModal] = useState<boolean>(false);
  const [selectedEnemyDetail, setSelectedEnemyDetail] = useState<EnemyKind>('orc_warrior');
  const [selectedTowerForInfo, setSelectedTowerForInfo] = useState<PlacedTower | null>(null);
  const [shopTab, setShopTab] = useState<'towers' | 'upgrades' | 'items' | 'gems'>('towers');
  const [purchasedGems, setPurchasedGems] = useState<Record<string, boolean>>({});

  // Wave Composition State
  const [waveName, setWaveName] = useState<string>('Orc Swarm');
  const [enemiesRemaining, setEnemiesRemaining] = useState<number>(145);
  const [activeEnemyCounts, setActiveEnemyCounts] = useState<Record<EnemyKind, number>>({
    orc_warrior: 45,
    orc_archer: 32,
    orc_brute: 18,
    spiderling: 12,
    wolf_rider: 8,
    siege_cannon: 4,
  });

  // Global Upgrades state for all 8 tower types
  const [upgrades, setUpgrades] = useState<Record<TowerType, UpgradeLevels>>({
    arrow: { damage: 1, fireRate: 1, range: 0 },
    cannon: { damage: 1, fireRate: 0, range: 0 },
    magic: { damage: 1, fireRate: 1, range: 0 },
    tesla: { damage: 0, fireRate: 1, range: 0 },
    mortar: { damage: 1, fireRate: 0, range: 0 },
    ice: { damage: 0, fireRate: 1, range: 1 },
    ballista: { damage: 1, fireRate: 1, range: 0 },
    bombard: { damage: 1, fireRate: 0, range: 0 },
  });

  // Mutable references for smooth 60 FPS animation loop
  const towersRef = useRef<PlacedTower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const goldRef = useRef<number>(3450);
  const livesRef = useRef<number>(18);
  const manaRef = useRef<number>(120);
  const currentWaveRef = useRef<number>(38);
  const isPausedRef = useRef<boolean>(false);
  const gameSpeedRef = useRef<number>(1.0);
  const gameStateRef = useRef<'playing' | 'gameover' | 'victory'>('playing');
  const selectedBuildTypeRef = useRef<TowerType | null>('arrow');
  const upgradesRef = useRef(upgrades);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredTowerRef = useRef<PlacedTower | null>(null);
  const finalGoldRef = useRef<number>(3450);

  // Sync state to refs
  useEffect(() => {
    goldRef.current = gold;
    finalGoldRef.current = gold;
  }, [gold]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    manaRef.current = mana;
  }, [mana]);

  useEffect(() => {
    currentWaveRef.current = currentWave;
  }, [currentWave]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    gameSpeedRef.current = gameSpeed;
  }, [gameSpeed]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    selectedBuildTypeRef.current = selectedBuildType;
  }, [selectedBuildType]);

  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

  // Initial Pre-placed towers on battlefield (as depicted in the vibrant reference artwork)
  useEffect(() => {
    if (towersRef.current.length === 0) {
      towersRef.current = [
        {
          id: 'init_arrow_1',
          type: 'arrow',
          x: 140,
          y: 320,
          lastShotTime: 0,
          targetEnemyId: null,
          angle: 0.4,
          totalInvestedGold: 300,
          kills: 14,
          muzzleFlashTime: 0,
          recoilOffset: 0,
        },
        {
          id: 'init_cannon_1',
          type: 'cannon',
          x: 350,
          y: 280,
          lastShotTime: 0,
          targetEnemyId: null,
          angle: 0.8,
          totalInvestedGold: 560,
          kills: 22,
          muzzleFlashTime: 0,
          recoilOffset: 0,
        },
        {
          id: 'init_magic_1',
          type: 'magic',
          x: 640,
          y: 280,
          lastShotTime: 0,
          targetEnemyId: null,
          angle: -0.6,
          totalInvestedGold: 900,
          kills: 35,
          muzzleFlashTime: 0,
          recoilOffset: 0,
        },
        {
          id: 'init_ballista_1',
          type: 'ballista',
          x: 820,
          y: 450,
          lastShotTime: 0,
          targetEnemyId: null,
          angle: -2.3,
          totalInvestedGold: 1200,
          kills: 18,
          muzzleFlashTime: 0,
          recoilOffset: 0,
        },
      ];
    }
  }, []);

  // Compute Tower Stats applying upgrades
  const getTowerStats = useCallback((type: TowerType) => {
    const base = TOWER_CONFIGS[type];
    const ups = upgradesRef.current[type] || { damage: 0, fireRate: 0, range: 0 };

    const totalDamage = base.baseDamage + ups.damage * 1.0;
    const totalFireRate = base.baseFireRate * (1 + ups.fireRate * 0.2);
    const totalRange = base.baseRange * (1 + ups.range * 0.1);

    return {
      damage: totalDamage,
      fireRate: totalFireRate,
      range: totalRange,
    };
  }, []);

  // Toast / feedback message timer
  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Wave Spawning Controller State
  const waveSpawningStateRef = useRef({
    totalToSpawn: 145,
    spawnedCount: 0,
    spawnInterval: 0.65,
    lastSpawnTime: 0,
    waveActive: true,
    enemiesPassedCount: 0,
  });

  const intermissionTimerRef = useRef<number>(0);
  const isIntermissionRef = useRef<boolean>(false);

  // Mana Passive Regeneration (1 mana every 2 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current === 'playing' && !isPausedRef.current) {
        setMana((m) => Math.min(200, m + 1));
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    towersRef.current = [];
    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    setPlayerLevel(14);
    setCurrentWave(38);
    setLives(18);
    setGold(3450);
    setMana(120);
    setGameSpeed(1.0);
    setIsPaused(false);
    setGameState('playing');
    setSelectedBuildType('arrow');
    setSelectedTowerForInfo(null);
    setShowShopModal(false);
    setShowEnemiesModal(false);
    setEnemiesRemaining(145);
    setWaveName('Wave 38: Orc Swarm');

    isIntermissionRef.current = false;
    waveSpawningStateRef.current = {
      totalToSpawn: 145,
      spawnedCount: 0,
      spawnInterval: 0.65,
      lastSpawnTime: 0,
      waveActive: true,
      enemiesPassedCount: 0,
    };

    onRestart?.();
  }, [onRestart]);

  // Global Keyboard shortcuts:
  // - 'Q': Deselect tower / empty cursor
  // - 'SPACE': Toggle Pause/Play
  // - 'B' / 'S': Toggle Shop Modal
  // - 'E': Toggle Enemies Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
        playSound('click', isMuted);
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        setSelectedBuildType(null);
        setSelectedTowerForInfo(null);
        showFeedback('Visier freigegeben (Mauszeiger geleert)');
        playSound('click', isMuted);
        return;
      }

      if (e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S') {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          setShowShopModal((v) => !v);
          playSound('click', isMuted);
        }
      }

      if (e.key === 'e' || e.key === 'E') {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          setShowEnemiesModal((v) => !v);
          playSound('click', isMuted);
        }
      }

      // 1 to 8 keys to select towers directly
      const keysMap: Record<string, TowerType> = {
        '1': 'arrow',
        '2': 'cannon',
        '3': 'magic',
        '4': 'tesla',
        '5': 'mortar',
        '6': 'ice',
        '7': 'ballista',
        '8': 'bombard',
      };
      if (keysMap[e.key]) {
        setSelectedBuildType(keysMap[e.key]);
        setSelectedTowerForInfo(null);
        playSound('click', isMuted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMuted]);

  // Buy Shop Upgrades
  const handleBuyUpgrade = (type: TowerType, upgradeKey: keyof UpgradeLevels) => {
    const currentLevel = upgrades[type][upgradeKey];
    const limits = { damage: 3, fireRate: 3, range: 2 };
    const costs = { damage: 250, fireRate: 200, range: 150 };

    if (currentLevel >= limits[upgradeKey]) {
      showFeedback(`Upgrade-Maximum für ${upgradeKey} erreicht!`);
      playSound('bomb', isMuted);
      return;
    }

    const cost = costs[upgradeKey];
    if (gold < cost) {
      showFeedback(`Nicht genug Gold! Benötigt: ${cost} G.`);
      playSound('bomb', isMuted);
      return;
    }

    setGold((g) => g - cost);
    setUpgrades((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [upgradeKey]: prev[type][upgradeKey] + 1,
      },
    }));

    playSound('win', isMuted);
    showFeedback(`${TOWER_CONFIGS[type].name} aufgerüstet!`);
  };

  // Cast Mana Spell
  const handleCastSpell = (spellType: 'blizzard' | 'lightning') => {
    if (spellType === 'blizzard') {
      if (mana < 40) {
        showFeedback('Zu wenig Mana! Benötigt: 40 Mana.');
        return;
      }
      setMana((m) => m - 40);
      enemiesRef.current.forEach((e) => {
        e.isSlowed = 5.0; // 5 seconds slow
        e.hp -= 2.0;
        for (let p = 0; p < 4; p++) {
          particlesRef.current.push({
            x: e.x + (Math.random() - 0.5) * 20,
            y: e.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.8,
            maxLife: 0.8,
            color: '#38bdf8',
            size: 3.5,
          });
        }
      });
      playSound('clear', isMuted);
      showFeedback('ARKTISCHER BLIZZARD ENTFACHT! Alle Monster verlangsamt & beschädigt!');
    } else if (spellType === 'lightning') {
      if (mana < 60) {
        showFeedback('Zu wenig Mana! Benötigt: 60 Mana.');
        return;
      }
      setMana((m) => m - 60);
      enemiesRef.current.forEach((e) => {
        e.hp -= 5.0;
        for (let p = 0; p < 6; p++) {
          particlesRef.current.push({
            x: e.x + (Math.random() - 0.5) * 25,
            y: e.y + (Math.random() - 0.5) * 25,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 0.5,
            maxLife: 0.5,
            color: '#facc15',
            size: 4,
          });
        }
      });
      playSound('bomb', isMuted);
      showFeedback('GÖTTLICHER KETTENBLITZ! Gewaltiger Einschlag auf alle feindlichen Horden!');
    }
  };

  // Sell tower handler (50% refund)
  const handleSellTower = (tower: PlacedTower) => {
    const refund = Math.floor(tower.totalInvestedGold * 0.5);
    towersRef.current = towersRef.current.filter((t) => t.id !== tower.id);
    setGold((g) => g + refund);
    setSelectedTowerForInfo(null);
    playSound('score', isMuted);
    showFeedback(`${TOWER_CONFIGS[tower.type].name} demontiert (+${refund} G Verwertungsbonus)`);
  };

  // Canvas Mouse Coordinates helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    mousePosRef.current = { x, y };

    let found: PlacedTower | null = null;
    for (const t of towersRef.current) {
      if (Math.hypot(t.x - x, t.y - y) <= 26) {
        found = t;
        break;
      }
    }
    hoveredTowerRef.current = found;
  };

  const handleMouseLeave = () => {
    mousePosRef.current = null;
    hoveredTowerRef.current = null;
  };

  // Left click: Place tower OR select tower to inspect/sell
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameStateRef.current !== 'playing') return;

    const { x, y } = getCanvasCoords(e);

    // If clicking on an existing tower
    for (const t of towersRef.current) {
      if (Math.hypot(t.x - x, t.y - y) <= 26) {
        setSelectedTowerForInfo(t);
        playSound('click', isMuted);
        return;
      }
    }

    setSelectedTowerForInfo(null);

    const buildType = selectedBuildTypeRef.current;
    if (!buildType) return;

    const cfg = TOWER_CONFIGS[buildType];

    // Castle Gate / Mountain Bounds
    if (x < 35 || x > CANVAS_WIDTH - 50 || y < 40 || y > CANVAS_HEIGHT - 35) {
      showFeedback('Außerhalb des bebaubaren Schlachtfeldes!');
      playSound('bomb', isMuted);
      return;
    }

    // Check path clearance
    if (isTooCloseToPath(x, y, 26)) {
      showFeedback('Sperrzone! Wehrtürme dürfen den Vormarschweg nicht blockieren.');
      playSound('bomb', isMuted);
      return;
    }

    // Check overlapping with another tower
    for (const t of towersRef.current) {
      if (Math.hypot(t.x - x, t.y - y) < 38) {
        showFeedback('Kollision! Zu nah an einer bestehenden Wehrstellung.');
        playSound('bomb', isMuted);
        return;
      }
    }

    // Check Gold
    if (goldRef.current < cfg.cost) {
      showFeedback(`Gold unzureichend! Benötigt: ${cfg.cost} G.`);
      playSound('bomb', isMuted);
      return;
    }

    // Place Tower
    setGold((g) => g - cfg.cost);
    const newTower: PlacedTower = {
      id: 'tower_' + Math.random().toString(36).substring(2, 9),
      type: buildType,
      x,
      y,
      lastShotTime: 0,
      targetEnemyId: null,
      angle: 0,
      totalInvestedGold: cfg.cost,
      kills: 0,
      muzzleFlashTime: 0,
      recoilOffset: 0,
    };

    towersRef.current.push(newTower);
    playSound('click', isMuted);
    showFeedback(`${cfg.name} erfolgreich errichtet!`);

    // Construction dust particles
    for (let p = 0; p < 10; p++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0.5,
        maxLife: 0.5,
        color: '#d1d5db',
        size: 3,
        isSmoke: true,
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setSelectedBuildType(null);
    setSelectedTowerForInfo(null);
    showFeedback('Visier freigegeben');
  };

  // ─────────────────────────────────────────────────────────────
  // 60 FPS GAME ENGINE LOOP (VIBRANT FANTASY RENDERING)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      const rawDt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const dt = rawDt * gameSpeedRef.current;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      // ──────────────────────────────────────────────
      // 1. SIMULATION STEP
      // ──────────────────────────────────────────────
      if (gameStateRef.current === 'playing' && !isPausedRef.current) {
        // Spawn Enemies
        if (waveSpawningStateRef.current.waveActive) {
          const spState = waveSpawningStateRef.current;
          spState.lastSpawnTime += dt;

          if (
            spState.spawnedCount < spState.totalToSpawn &&
            spState.lastSpawnTime >= spState.spawnInterval
          ) {
            spState.lastSpawnTime = 0;
            const w = currentWaveRef.current;

            // Roll enemy type according to Wave composition
            let kind: EnemyKind = 'orc_warrior';
            const roll = Math.random();
            if (roll < 0.35) kind = 'orc_warrior';
            else if (roll < 0.60) kind = 'orc_archer';
            else if (roll < 0.76) kind = 'spiderling';
            else if (roll < 0.88) kind = 'orc_brute';
            else if (roll < 0.96) kind = 'wolf_rider';
            else kind = 'siege_cannon';

            const def = ENEMY_REGISTRY[kind];
            const hp = def.baseHp + w * 0.8;
            const startPt = PATH_WAYPOINTS[0];

            const newEnemy: Enemy = {
              id: 'enemy_' + Math.random().toString(36).substring(2, 9),
              kind,
              segmentIndex: 0,
              progress: 0,
              x: startPt.x,
              y: startPt.y,
              maxHp: hp,
              hp,
              speed: def.speed,
              color: def.color,
              accentColor: def.accent,
              radius: def.radius,
              waveNum: w,
              headingAngle: 0,
            };

            enemiesRef.current.push(newEnemy);
            spState.spawnedCount++;
            setEnemiesRemaining((r) => Math.max(0, r - 1));
          }

          // Check if wave finished
          if (
            spState.spawnedCount >= spState.totalToSpawn &&
            enemiesRef.current.length === 0
          ) {
            spState.waveActive = false;
            const waveBonus = 250 + currentWaveRef.current * 25;
            setGold((g) => g + waveBonus);
            showFeedback(`Welle ${currentWaveRef.current} siegreich abgewehrt! (+${waveBonus} G)`);

            if (currentWaveRef.current >= MAX_WAVES) {
              setGameState('victory');
              playSound('win', isMuted);
              saveGameResult('towerdefense', goldRef.current + 5000, 500);
            } else {
              setCurrentWave((w) => w + 1);
              setEnemiesRemaining(145);
              spState.spawnedCount = 0;
              spState.waveActive = true;
            }
          }
        }

        // Move Enemies along the Path Waypoints
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          const p1 = PATH_WAYPOINTS[enemy.segmentIndex];
          const p2 = PATH_WAYPOINTS[enemy.segmentIndex + 1];

          if (!p2) {
            // Breached Castle Gate!
            enemiesRef.current.splice(i, 1);
            setLives((l) => {
              const next = l - 1;
              if (next <= 0) {
                setGameState('gameover');
                playSound('gameover', isMuted);
              } else {
                playSound('bomb', isMuted);
              }
              return Math.max(0, next);
            });
            continue;
          }

          const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const effectiveSpeed = enemy.isSlowed && enemy.isSlowed > 0 ? enemy.speed * 0.5 : enemy.speed;
          if (enemy.isSlowed) enemy.isSlowed -= dt;

          const moveStep = (effectiveSpeed * dt) / segDist;
          enemy.progress += moveStep;
          enemy.headingAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          if (enemy.progress >= 1) {
            enemy.segmentIndex++;
            enemy.progress = 0;
            if (enemy.segmentIndex >= PATH_WAYPOINTS.length - 1) {
              // Breached castle gate
              enemiesRef.current.splice(i, 1);
              setLives((l) => {
                const next = l - 1;
                if (next <= 0) {
                  setGameState('gameover');
                  playSound('gameover', isMuted);
                } else {
                  playSound('bomb', isMuted);
                }
                return Math.max(0, next);
              });
              continue;
            }
          }

          const curP1 = PATH_WAYPOINTS[enemy.segmentIndex];
          const curP2 = PATH_WAYPOINTS[enemy.segmentIndex + 1];
          enemy.x = curP1.x + (curP2.x - curP1.x) * enemy.progress;
          enemy.y = curP1.y + (curP2.y - curP1.y) * enemy.progress;
        }

        // Tower Targeting & Ballistics
        for (const tower of towersRef.current) {
          const cfg = TOWER_CONFIGS[tower.type];
          const stats = getTowerStats(tower.type);
          tower.lastShotTime += dt;

          if (tower.muzzleFlashTime > 0) tower.muzzleFlashTime -= dt;
          if (tower.recoilOffset > 0) tower.recoilOffset = Math.max(0, tower.recoilOffset - dt * 25);

          let target: Enemy | null = null;
          let bestProgress = -1;

          for (const e of enemiesRef.current) {
            const d = Math.hypot(e.x - tower.x, e.y - tower.y);
            if (d <= stats.range) {
              const progScore = e.segmentIndex * 1000 + e.progress * 1000;
              if (progScore > bestProgress) {
                bestProgress = progScore;
                target = e;
              }
            }
          }

          if (target) {
            tower.targetEnemyId = target.id;
            tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);

            const cooldown = 1 / stats.fireRate;
            if (tower.lastShotTime >= cooldown) {
              tower.lastShotTime = 0;
              tower.muzzleFlashTime = 0.08;
              tower.recoilOffset = tower.type === 'cannon' || tower.type === 'mortar' || tower.type === 'bombard' ? 6 : 3;

              bulletsRef.current.push({
                id: 'bullet_' + Math.random().toString(36).substring(2, 9),
                towerType: tower.type,
                x: tower.x + Math.cos(tower.angle) * 16,
                y: tower.y + Math.sin(tower.angle) * 16,
                targetEnemyId: target.id,
                targetLastX: target.x,
                targetLastY: target.y,
                damage: stats.damage,
                speed: cfg.bulletSpeed * 60,
                color: cfg.bulletColor,
                radius: cfg.bulletRadius,
                splashRadius:
                  tower.type === 'cannon'
                    ? 45
                    : tower.type === 'mortar' || tower.type === 'bombard'
                    ? 75
                    : undefined,
                isIce: tower.type === 'ice',
                trail: [],
              });

              // Muzzle flash particle
              particlesRef.current.push({
                x: tower.x + Math.cos(tower.angle) * 20,
                y: tower.y + Math.sin(tower.angle) * 20,
                vx: Math.cos(tower.angle) * 1.5 + (Math.random() - 0.5) * 1.5,
                vy: Math.sin(tower.angle) * 1.5 + (Math.random() - 0.5) * 1.5,
                life: 0.2,
                maxLife: 0.2,
                color: cfg.bulletColor,
                size: 4,
                isSmoke: true,
              });

              playSound('click', isMuted);
            }
          } else {
            tower.targetEnemyId = null;
          }
        }

        // Bullets & Splash Logic
        for (let bIdx = bulletsRef.current.length - 1; bIdx >= 0; bIdx--) {
          const bullet = bulletsRef.current[bIdx];
          const target = enemiesRef.current.find((e) => e.id === bullet.targetEnemyId);

          let destX = bullet.targetLastX;
          let destY = bullet.targetLastY;
          if (target) {
            destX = target.x;
            destY = target.y;
            bullet.targetLastX = destX;
            bullet.targetLastY = destY;
          }

          const angle = Math.atan2(destY - bullet.y, destX - bullet.x);
          const dist = Math.hypot(destX - bullet.x, destY - bullet.y);
          const stepDist = bullet.speed * dt;

          bullet.trail.push({ x: bullet.x, y: bullet.y });
          if (bullet.trail.length > 5) bullet.trail.shift();

          if (dist <= stepDist || dist < 12) {
            bulletsRef.current.splice(bIdx, 1);

            if (bullet.splashRadius) {
              playSound('bomb', isMuted);
              for (const e of enemiesRef.current) {
                const splashD = Math.hypot(e.x - destX, e.y - destY);
                if (splashD <= bullet.splashRadius) {
                  const factor = 1 - splashD / bullet.splashRadius;
                  e.hp -= bullet.damage * (0.4 + factor * 0.6);
                  if (e.hp <= 0) {
                    setGold((g) => g + 15);
                  }
                }
              }

              for (let p = 0; p < 14; p++) {
                const pAngle = Math.random() * Math.PI * 2;
                const pSpeed = Math.random() * 4 + 1;
                particlesRef.current.push({
                  x: destX,
                  y: destY,
                  vx: Math.cos(pAngle) * pSpeed,
                  vy: Math.sin(pAngle) * pSpeed,
                  life: 0.5,
                  maxLife: 0.5,
                  color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
                  size: 3.5,
                  isSmoke: Math.random() > 0.5,
                });
              }
            } else {
              if (target) {
                target.hp -= bullet.damage;
                if (bullet.isIce) {
                  target.isSlowed = 3.0; // Slow for 3s
                }
                if (target.hp <= 0) {
                  setGold((g) => g + 12);
                }
                playSound('score', isMuted);
              }
            }

            enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);
          } else {
            bullet.x += Math.cos(angle) * stepDist;
            bullet.y += Math.sin(angle) * stepDist;
          }
        }

        // Particles
        for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
          const part = particlesRef.current[pIdx];
          part.x += part.vx;
          part.y += part.vy;
          part.life -= dt;
          if (part.life <= 0) particlesRef.current.splice(pIdx, 1);
        }
      }

      // ──────────────────────────────────────────────
      // 2. VIBRANT FANTASY ARTWORK CANVAS RENDERING
      // ──────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // A. Lush Green Grass & Forest Landscape Background
      const grassGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      grassGrad.addColorStop(0, '#3f6212'); // Rich Forest Olive
      grassGrad.addColorStop(0.5, '#4d7c0f'); // Lush Meadow Grass
      grassGrad.addColorStop(1, '#365314'); // Deep Pine Shade
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant mountain ridge and pine tree textures (upper area)
      ctx.fillStyle = 'rgba(22, 101, 52, 0.4)';
      for (let tx = 10; tx < CANVAS_WIDTH; tx += 45) {
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx + 22, 55);
        ctx.lineTo(tx - 22, 55);
        ctx.closePath();
        ctx.fill();
      }

      // Rocky Cliff Outcrops & Gray Boulders
      const drawBoulder = (bx: number, by: number, br: number) => {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(bx, by, br, br * 0.7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Highlight
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(bx - br * 0.2, by - br * 0.2, br * 0.4, br * 0.25, 0.2, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBoulder(70, 70, 22);
      drawBoulder(160, 480, 28);
      drawBoulder(450, 80, 25);
      drawBoulder(680, 470, 30);
      drawBoulder(380, 360, 20);

      // B. Winding Dirt Road (Brown Earth with Pebble Borders)
      ctx.strokeStyle = '#573a21'; // Deep earth bed
      ctx.lineWidth = PATH_WIDTH + 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      PATH_WAYPOINTS.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Main compacted dirt track
      ctx.strokeStyle = '#a2723f';
      ctx.lineWidth = PATH_WIDTH;
      ctx.stroke();

      // Golden Dust & Wheel Ruts along the road
      ctx.strokeStyle = '#c6955d';
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // C. Fortified Castle Gate on the Right Hand Side (matching artwork)
      const castleX = 890;
      const castleY = 160;

      // Castle Wall Foundation
      ctx.fillStyle = '#475569';
      ctx.fillRect(castleX, 60, 110, 480);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(castleX, 60, 110, 480);

      // Stone Brick Lines
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
      ctx.lineWidth = 1;
      for (let cy = 70; cy <= 530; cy += 24) {
        ctx.beginPath();
        ctx.moveTo(castleX, cy);
        ctx.lineTo(castleX + 110, cy);
        ctx.stroke();
      }

      // Castle Gateway Arch (Destination entrance)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(castleX + 15, 320, 36, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(castleX, 356);
      ctx.lineTo(castleX, 284);
      ctx.closePath();
      ctx.fill();

      // Iron Portcullis Grille
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      for (let gy = 286; gy <= 354; gy += 10) {
        ctx.beginPath();
        ctx.moveTo(castleX, gy);
        ctx.lineTo(castleX + 32, gy);
        ctx.stroke();
      }

      // Castle Battlements & Towers
      const drawCastleTower = (tx: number, ty: number) => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 26, ty - 50, 52, 100);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(tx - 26, ty - 50, 52, 100);

        // Roof Cone
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(tx, ty - 90);
        ctx.lineTo(tx + 30, ty - 50);
        ctx.lineTo(tx - 30, ty - 50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Royal Banner Flag
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(tx - 2, ty - 105, 4, 18);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(tx + 2, ty - 105);
        ctx.lineTo(tx + 22, ty - 96);
        ctx.lineTo(tx + 2, ty - 88);
        ctx.closePath();
        ctx.fill();
      };

      drawCastleTower(castleX + 45, 140);
      drawCastleTower(castleX + 45, 500);

      // D. Range Reticle / Ghost Preview
      const activeInspectorTower = selectedTowerForInfo || hoveredTowerRef.current;
      if (activeInspectorTower) {
        const stats = getTowerStats(activeInspectorTower.type);
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(activeInspectorTower.x, activeInspectorTower.y, stats.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (mousePosRef.current && selectedBuildTypeRef.current) {
        const stats = getTowerStats(selectedBuildTypeRef.current);
        const { x, y } = mousePosRef.current;
        const valid =
          !isTooCloseToPath(x, y, 26) &&
          x >= 35 &&
          x <= CANVAS_WIDTH - 60 &&
          y >= 40 &&
          y <= CANVAS_HEIGHT - 35;

        ctx.save();
        ctx.strokeStyle = valid ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        ctx.fillStyle = valid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, stats.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // E. Render Fantasy Towers with Realistic Medieval Textures (Archers, Magic Monoliths, Cannons, Ballistae)
      for (const tower of towersRef.current) {
        const cfg = TOWER_CONFIGS[tower.type];
        const isHovered = hoveredTowerRef.current?.id === tower.id || selectedTowerForInfo?.id === tower.id;
        drawMedievalTower(ctx, tower, cfg, isHovered, now / 1000);
      }

      // F. Render Projectiles (Arrows, Fireballs, Lightning, Magic Beams)
      for (const b of bulletsRef.current) {
        if (b.towerType === 'magic' || b.towerType === 'tesla') {
          // Electric Arc
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.targetLastX, b.targetLastY);
          ctx.stroke();
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // G. Render Fantasy Horde with Detailed Illustrated Textures: Orc Warriors, Archers, Brutes, Spiders, Wolf Riders & Cannons
      for (const e of enemiesRef.current) {
        drawFantasyEnemy(
          ctx,
          {
            id: e.id,
            kind: e.kind,
            x: e.x,
            y: e.y,
            headingAngle: e.headingAngle,
            hp: e.hp,
            maxHp: e.maxHp,
            radius: e.radius,
            color: e.color,
            speed: e.speed,
            isSlowed: e.isSlowed,
          },
          now / 1000
        );
      }

      // H. Render Particles
      for (const part of particlesRef.current) {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [getTowerStats, isMuted]);

  return (
    <div className="flex flex-col items-center justify-start w-full h-full p-2 select-none overflow-y-auto font-sans bg-stone-950 text-stone-100">
      {/* ─────────────────────────────────────────────────────────────
          FANTASY RESOURCE PANEL (matching prompt reference header)
          "Level: 14", "Wave: 38/50", "Lives: 18/20", "Gold: 3,450", "Mana: 120"
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[1000px] bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border-2 border-amber-600/70 rounded-2xl px-4 py-2 mb-2 shadow-2xl shrink-0 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Level and Swords Emblem */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-stone-950/80 hover:bg-stone-800 text-stone-300 transition-colors cursor-pointer flex items-center gap-1 border border-stone-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Menü</span>
          </button>
          <div className="flex items-center gap-2 bg-stone-950/90 border border-amber-500/40 px-3 py-1 rounded-xl shadow">
            <span className="text-amber-400 font-bold text-sm">⚔️</span>
            <span className="text-xs font-black text-amber-200 tracking-wider font-serif uppercase">
              Level: <strong className="text-white font-mono">{playerLevel}</strong>
            </span>
          </div>
        </div>

        {/* Center: Resource Metrics (Wave, Lives, Gold, Mana) */}
        <div className="flex items-center gap-2 sm:gap-4 bg-stone-950/95 border border-stone-700/80 px-4 py-1.5 rounded-xl shadow-inner text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-sans">Wave:</span>
            <span className="font-bold text-white">{currentWave}/{MAX_WAVES}</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-rose-400">🛡️ Lives:</span>
            <span className="font-bold text-rose-300">{lives}/{MAX_LIVES}</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">💰 Gold:</span>
            <span className="font-bold text-amber-300">{gold.toLocaleString()}</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-sky-400 font-bold">💧 Mana:</span>
            <span className="font-bold text-sky-300">{mana}</span>
          </div>
        </div>

        {/* Right: Quick Spells, Shop, Audio & Speed Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Spells (Mana Consumption) */}
          <button
            type="button"
            onClick={() => handleCastSpell('blizzard')}
            className="px-2.5 py-1 rounded-xl bg-sky-950/90 hover:bg-sky-900 border border-sky-500/40 text-[11px] font-bold text-sky-200 flex items-center gap-1 cursor-pointer transition-all shadow"
            title="Arktischer Blizzard (40 Mana) - Verlangsamt alle Feinde"
          >
            <span>❄️ Blizzard (40)</span>
          </button>
          <button
            type="button"
            onClick={() => handleCastSpell('lightning')}
            className="px-2.5 py-1 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/40 text-[11px] font-bold text-amber-200 flex items-center gap-1 cursor-pointer transition-all shadow"
            title="Kettenblitz (60 Mana) - Schwere Blitzeinschläge"
          >
            <span>⚡ Blitz (60)</span>
          </button>

          {/* Speed Toggle (1x / 2x) */}
          <button
            type="button"
            onClick={() => setGameSpeed((s) => (s === 1.0 ? 2.0 : 1.0))}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              gameSpeed === 2.0
                ? 'bg-amber-600 border-amber-400 text-white'
                : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
            }`}
            title="Spielgeschwindigkeit umschalten"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>

          {/* Shop Modal Button */}
          <button
            type="button"
            onClick={() => setShowShopModal(true)}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow border border-amber-400/40 cursor-pointer transition-all"
            title="Shop öffnen (Taste B)"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop</span>
          </button>

          {/* Enemies Modal Button */}
          <button
            type="button"
            onClick={() => setShowEnemiesModal(true)}
            className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-bold cursor-pointer transition-colors"
            title="Enemies Info (Taste E)"
          >
            <span>👺 Feinde</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors cursor-pointer border border-stone-700"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors cursor-pointer border border-stone-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN VIBRANT FANTASY BATTLEFIELD CANVAS: 1000x600px
         ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[1000px] aspect-[1000/600] rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-700 bg-stone-900 flex items-center justify-center ring-1 ring-stone-800">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          onContextMenu={handleContextMenu}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`w-full h-full block ${
            selectedBuildType ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* ─────────────────────────────────────────────────────────────
            BOTTOM-LEFT "TOWERS" CONSTRUCTION MENU (as seen in prompt artwork)
           ───────────────────────────────────────────────────────────── */}
        <div className="absolute bottom-3 left-3 bg-stone-950/90 border-2 border-amber-600/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md max-w-[340px] z-10">
          <div className="text-[11px] font-black text-amber-400 uppercase tracking-widest text-center mb-1.5 font-serif border-b border-stone-800 pb-0.5">
            Towers
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                'arrow',
                'cannon',
                'magic',
                'tesla',
                'mortar',
                'ice',
                'ballista',
                'bombard',
              ] as TowerType[]
            ).map((tType, idx) => {
              const cfg = TOWER_CONFIGS[tType];
              const isSelected = selectedBuildType === tType;
              const canAfford = gold >= cfg.cost;
              return (
                <button
                  key={tType}
                  type="button"
                  onClick={() => {
                    setSelectedBuildType(isSelected ? null : tType);
                    setSelectedTowerForInfo(null);
                    playSound('click', isMuted);
                  }}
                  className={`p-1.5 rounded-xl border flex flex-col items-center justify-between text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600/40 border-amber-400 text-white ring-2 ring-amber-500/50 shadow-lg scale-105'
                      : canAfford
                      ? 'bg-stone-900/90 border-stone-700 text-stone-200 hover:bg-stone-800 hover:border-amber-500/50'
                      : 'bg-stone-950/60 border-stone-800 text-stone-500 opacity-60'
                  }`}
                  title={`${cfg.name} (${cfg.cost} G)`}
                >
                  <div className="rounded-lg overflow-hidden border border-stone-800 mb-0.5">
                    <TowerPortrait type={tType} size={30} />
                  </div>
                  <span className="text-[9px] truncate max-w-full font-semibold">{cfg.name.split(' ')[0]}</span>
                  <span className="text-amber-400 font-mono text-[9px] font-black">
                    {cfg.cost} G
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BOTTOM-RIGHT "CURRENT WAVE INFO" PANEL (as seen in prompt artwork)
            "Wave 38: Orc Swarm" and "145 enemies remaining"
           ───────────────────────────────────────────────────────────── */}
        <div className="absolute bottom-3 right-3 bg-stone-950/90 border-2 border-amber-600/80 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md text-center z-10">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-serif mb-0.5">
            Current Wave Info
          </div>
          <div className="text-xs font-black text-white">
            Wave {currentWave}: {waveName}
          </div>
          <div className="text-[11px] text-rose-400 font-mono font-bold mt-0.5">
            {enemiesRemaining} enemies remaining
          </div>
        </div>

        {/* Tactical Pause Overlay */}
        {isPaused && gameState === 'playing' && (
          <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 pointer-events-none">
            <div className="bg-stone-900/95 border-2 border-amber-500/60 px-8 py-5 rounded-2xl shadow-2xl text-center pointer-events-auto">
              <h3 className="text-xl font-black text-amber-300 uppercase tracking-widest mb-1 font-serif">
                Schlacht Pausiert
              </h3>
              <p className="text-xs text-stone-400 mb-4 max-w-xs">
                Türme platzieren, Spells planen und Upgrades kaufen während der Pause.
              </p>
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg transition-transform active:scale-95"
              >
                Gefecht Fortsetzen (SPACE)
              </button>
            </div>
          </div>
        )}

        {/* Defeat / Game Over */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
            <div className="bg-stone-900 border-2 border-rose-500/80 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-rose-500 tracking-wider mb-2 font-serif">
                BURGTORE GEFALLEN 💀
              </h2>
              <p className="text-xs text-stone-400 mb-5">
                Die Orkhorde hat das Festungstor durchbrochen.
              </p>
              <button
                type="button"
                onClick={resetGame}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-sm font-black rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                NEUSTART
              </button>
            </div>
          </div>
        )}

        {/* Victory Banner */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
            <div className="bg-stone-900 border-2 border-emerald-500/80 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-wider mb-2 font-serif">
                KÖNIGREICH GERETTET! 🎉
              </h2>
              <p className="text-xs text-stone-400 mb-5">
                Alle 50 Wellen der Orkhorde wurden vernichtend geschlagen!
              </p>
              <button
                type="button"
                onClick={resetGame}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                NEUSTART
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Tower Inspector Tactical GUI */}
      {selectedTowerForInfo && (
        <div className="w-full max-w-[1000px] bg-stone-900/95 border border-sky-500/60 rounded-xl px-4 py-2 mt-2 flex flex-wrap items-center justify-between text-xs shadow-xl animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">{TOWER_CONFIGS[selectedTowerForInfo.type].iconSymbol}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm">
                  {TOWER_CONFIGS[selectedTowerForInfo.type].name}
                </span>
                <span className="text-[11px] text-sky-400 font-mono">
                  [{TOWER_CONFIGS[selectedTowerForInfo.type].subTitle}]
                </span>
              </div>
              <span className="text-stone-400 text-[11px]">
                Schaden: <strong className="text-white">{getTowerStats(selectedTowerForInfo.type).damage}</strong> •{' '}
                Feuerrate: <strong className="text-white">{getTowerStats(selectedTowerForInfo.type).fireRate.toFixed(1)}/s</strong> •{' '}
                Reichweite: <strong className="text-white">{Math.round(getTowerStats(selectedTowerForInfo.type).range)}m</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSellTower(selectedTowerForInfo)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow cursor-pointer transition-colors"
            >
              Demontieren (+{Math.floor(selectedTowerForInfo.totalInvestedGold * 0.5)} G)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTowerForInfo(null)}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SHOP MODAL (Matching prompt reference Shop GUI)
          Towers / Upgrades / Items / Gems with Gold balance & Buy buttons
         ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          SHOP MODAL (Bild 3: Fantasy Tower Defense Shop Screen)
          Top resource bar, 'Shop' plaque, Tabs (Towers, Upgrades, Items, Gems),
          Grid with 8 tower portraits, €costs, Buy button, Gold display, Close button
         ───────────────────────────────────────────────────────────── */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-3xl bg-gradient-to-b from-stone-900 via-stone-925 to-stone-950 border-4 border-amber-600/90 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(217,119,6,0.3)] overflow-hidden flex flex-col max-h-[92vh] relative">
            
            {/* Top Resource Bar (Identical to reference: Level: 14 | Wave: 38/50 | Lives: 18/20 | Gold: 3,450 | Mana: 120) */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b-2 border-amber-700/60 flex flex-wrap items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-3 text-xs font-bold text-amber-200">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/90 border border-amber-500/40 shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Level: 14</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/90 border border-amber-500/40 shadow-sm">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wave: {currentWave}/50</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/90 border border-rose-500/40 text-rose-300 shadow-sm">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Lives: {lives}/20</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/90 border border-amber-500/50 text-amber-300 shadow-sm">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono">Gold: {gold.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/90 border border-sky-500/50 text-sky-300 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono">Mana: {mana}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShopModal(false)}
                  className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                  title="Schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title Plaque: Ornate crimson/ruby cartouche with gold filigree */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="px-10 py-1.5 bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-amber-400/90 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(255,255,255,0.2)] flex items-center justify-center">
                <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-wider font-serif uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  Shop
                </h2>
              </div>
            </div>

            {/* Shop Tabs: Towers, Upgrades, Items, Gems */}
            <div className="flex border-b-2 border-amber-900/60 bg-stone-950/90 px-4 sm:px-6 pt-2 gap-2 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => setShopTab('towers')}
                className={`pb-2.5 px-4 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                  shopTab === 'towers'
                    ? 'bg-gradient-to-t from-stone-900 to-amber-950/60 border-amber-500 text-amber-300 shadow-[0_-2px_10px_rgba(245,158,11,0.2)]'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
                }`}
              >
                <Award className={`w-4 h-4 ${shopTab === 'towers' ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>Towers</span>
              </button>

              <button
                type="button"
                onClick={() => setShopTab('upgrades')}
                className={`pb-2.5 px-4 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                  shopTab === 'upgrades'
                    ? 'bg-gradient-to-t from-stone-900 to-amber-950/60 border-amber-500 text-amber-300 shadow-[0_-2px_10px_rgba(245,158,11,0.2)]'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
                }`}
              >
                <Sliders className={`w-4 h-4 ${shopTab === 'upgrades' ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>Upgrades</span>
              </button>

              <button
                type="button"
                onClick={() => setShopTab('items')}
                className={`pb-2.5 px-4 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                  shopTab === 'items'
                    ? 'bg-gradient-to-t from-stone-900 to-amber-950/60 border-amber-500 text-amber-300 shadow-[0_-2px_10px_rgba(245,158,11,0.2)]'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${shopTab === 'items' ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>Items</span>
              </button>

              <button
                type="button"
                onClick={() => setShopTab('gems')}
                className={`pb-2.5 px-4 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                  shopTab === 'gems'
                    ? 'bg-gradient-to-t from-stone-900 to-amber-950/60 border-amber-500 text-amber-300 shadow-[0_-2px_10px_rgba(245,158,11,0.2)]'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
                }`}
              >
                <span className="text-sm">💎</span>
                <span>Gems</span>
              </button>
            </div>

            {/* Shop Content Area */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-stone-950/40">
              {/* ── TAB 1: TOWERS (Bild 3: Grid of 8 Towers with Portrait, €Cost, and Buy button) ── */}
              {shopTab === 'towers' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
                  {(
                    [
                      'arrow',
                      'cannon',
                      'magic',
                      'tesla',
                      'mortar',
                      'ice',
                      'ballista',
                      'bombard',
                    ] as TowerType[]
                  ).map((tType) => {
                    const cfg = TOWER_CONFIGS[tType];
                    const canAfford = gold >= cfg.cost;
                    return (
                      <div
                        key={tType}
                        className="bg-gradient-to-b from-stone-900/95 via-stone-900 to-stone-950 border-2 border-amber-900/50 hover:border-amber-500/70 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] group"
                      >
                        {/* Tower Name */}
                        <h4 className="font-serif font-bold text-stone-100 text-xs sm:text-sm tracking-wide mb-1.5 drop-shadow">
                          {cfg.name}
                        </h4>

                        {/* Portrait Frame */}
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-amber-700/60 group-hover:border-amber-400/80 bg-stone-950 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-center relative mb-1.5 transition-colors">
                          <TowerPortrait type={tType} size={74} />
                        </div>

                        {/* Price Badge in € currency as shown in Bild 3 */}
                        <div className="flex items-center gap-1 my-1 px-2.5 py-0.5 rounded-full bg-stone-950/80 border border-amber-500/40 shadow-inner">
                          <span className="text-amber-400 text-xs">🪙</span>
                          <span className="text-amber-300 font-mono font-bold text-xs">€{cfg.cost}</span>
                        </div>

                        {/* Buy Button (Moss-green textured gradient with gold border) */}
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            setSelectedBuildType(tType);
                            setShowShopModal(false);
                            showFeedback(`${cfg.name} für €${cfg.cost} ausgewählt! Klicke auf das Feld zum Bauen.`);
                            playSound('click', isMuted);
                          }}
                          className={`mt-1.5 w-full py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 active:scale-95 border border-emerald-400/60 text-white shadow-[0_2px_10px_rgba(5,150,105,0.4)]'
                              : 'bg-stone-800/80 border border-stone-700/50 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          Buy
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── TAB 2: UPGRADES ── */}
              {shopTab === 'upgrades' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      'arrow',
                      'cannon',
                      'magic',
                      'tesla',
                      'mortar',
                      'ice',
                      'ballista',
                      'bombard',
                    ] as TowerType[]
                  ).map((tType) => {
                    const cfg = TOWER_CONFIGS[tType];
                    const curUp = upgrades[tType] || { damage: 1, fireRate: 1, range: 1 };
                    return (
                      <div
                        key={tType}
                        className="bg-stone-900/90 border border-amber-900/60 hover:border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-700/60 bg-stone-950 flex items-center justify-center shrink-0">
                            <TowerPortrait type={tType} size={46} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs sm:text-sm font-serif">{cfg.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-amber-300/80">
                              <span>⚔️ Dmg Lv. {curUp.damage}/3</span>
                              <span>•</span>
                              <span>⚡ Rate Lv. {curUp.fireRate}/3</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={curUp.damage >= 3 || gold < 250}
                            onClick={() => handleBuyUpgrade(tType, 'damage')}
                            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-[11px] cursor-pointer shadow active:scale-95"
                          >
                            +Dmg (250 G)
                          </button>
                          <button
                            type="button"
                            disabled={curUp.fireRate >= 3 || gold < 250}
                            onClick={() => handleBuyUpgrade(tType, 'fireRate')}
                            className="px-2.5 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-[11px] cursor-pointer shadow active:scale-95"
                          >
                            +Rate (250 G)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── TAB 3: ITEMS ── */}
              {shopTab === 'items' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'mana_potion',
                      name: 'Mana Elixier',
                      icon: '🧪',
                      cost: 150,
                      desc: 'Stellt sofort +50 Mana wieder her.',
                      action: () => {
                        if (gold >= 150) {
                          setGold((g) => g - 150);
                          setMana((m) => Math.min(200, m + 50));
                          playSound('win', isMuted);
                          showFeedback('+50 Mana regeneriert!');
                        }
                      },
                    },
                    {
                      id: 'health_elixir',
                      name: 'Lebens-Trank',
                      icon: '❤️',
                      cost: 400,
                      desc: 'Stellt +5 Lebenspunkte für die Festung her.',
                      action: () => {
                        if (gold >= 400) {
                          setGold((g) => g - 400);
                          setLives((l) => Math.min(20, l + 5));
                          playSound('win', isMuted);
                          showFeedback('+5 Festungs-Leben erhalten!');
                        }
                      },
                    },
                    {
                      id: 'bomb_scroll',
                      name: 'Belagerungs-Sprengsatz',
                      icon: '💣',
                      cost: 350,
                      desc: 'Verursacht sofort 350 Flächenschaden an Monstern.',
                      action: () => {
                        if (gold >= 350) {
                          setGold((g) => g - 350);
                          enemiesRef.current.forEach((e) => {
                            e.hp = Math.max(0, e.hp - 350);
                          });
                          playSound('bomb', isMuted);
                          showFeedback('Sprengsatz detoniert! Alle Feinde getroffen.');
                        }
                      },
                    },
                    {
                      id: 'frost_hourglass',
                      name: 'Arktische Sanduhr',
                      icon: '❄️',
                      cost: 500,
                      desc: 'Friert alle anstürmenden Monster für 6 Sekunden ein.',
                      action: () => {
                        if (gold >= 500) {
                          setGold((g) => g - 500);
                          enemiesRef.current.forEach((e) => {
                            e.slowDuration = 6;
                          });
                          playSound('win', isMuted);
                          showFeedback('Froststurm aktiv! Feinde für 6s eingefroren.');
                        }
                      },
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-stone-950 border border-stone-800">
                          {item.icon}
                        </span>
                        <div>
                          <h4 className="font-bold text-white text-sm font-serif">{item.name}</h4>
                          <p className="text-[11px] text-stone-400 mt-0.5">{item.desc}</p>
                          <span className="text-xs text-amber-400 font-mono font-bold">€{item.cost}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={gold < item.cost}
                        onClick={item.action}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-xs cursor-pointer shadow active:scale-95 shrink-0"
                      >
                        Buy
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB 4: GEMS (Sockelbare Macht-Edelsteine) ── */}
              {shopTab === 'gems' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'ruby',
                      name: 'Rubin der Macht',
                      icon: '♦️',
                      color: 'text-red-400',
                      cost: 600,
                      buff: '+15% Gesamter Turmschaden',
                      effect: () => {
                        setPurchasedGems((g) => ({ ...g, ruby: true }));
                        setGold((goldVal) => goldVal - 600);
                        showFeedback('Rubin gesockelt: +15% Turmschaden!');
                        playSound('win', isMuted);
                      },
                    },
                    {
                      id: 'sapphire',
                      name: 'Saphir des Frostes',
                      icon: '🔷',
                      color: 'text-sky-400',
                      cost: 500,
                      buff: '+25% Eis-Verlangsamungseffekt',
                      effect: () => {
                        setPurchasedGems((g) => ({ ...g, sapphire: true }));
                        setGold((goldVal) => goldVal - 500);
                        showFeedback('Saphir gesockelt: +25% Frostverlangsamung!');
                        playSound('win', isMuted);
                      },
                    },
                    {
                      id: 'topaz',
                      name: 'Topas des Reichtums',
                      icon: '🔶',
                      color: 'text-amber-400',
                      cost: 700,
                      buff: '+20% Extra-Gold bei Monster-Kills',
                      effect: () => {
                        setPurchasedGems((g) => ({ ...g, topaz: true }));
                        setGold((goldVal) => goldVal - 700);
                        showFeedback('Topas gesockelt: +20% Gold pro Kill!');
                        playSound('win', isMuted);
                      },
                    },
                    {
                      id: 'emerald',
                      name: 'Smaragd der Eile',
                      icon: '❇️',
                      color: 'text-emerald-400',
                      cost: 550,
                      buff: '+15% Höhere Angriffsgeschwindigkeit',
                      effect: () => {
                        setPurchasedGems((g) => ({ ...g, emerald: true }));
                        setGold((goldVal) => goldVal - 550);
                        showFeedback('Smaragd gesockelt: +15% Turm-Angriffstempo!');
                        playSound('win', isMuted);
                      },
                    },
                  ].map((gem) => {
                    const isBought = Boolean(purchasedGems[gem.id]);
                    return (
                      <div
                        key={gem.id}
                        className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl p-2 rounded-xl bg-stone-950 border border-stone-800 ${gem.color}`}>
                            {gem.icon}
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm font-serif">{gem.name}</h4>
                            <p className="text-[11px] text-amber-200/80 mt-0.5">{gem.buff}</p>
                            <span className="text-xs text-amber-400 font-mono font-bold">€{gem.cost}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isBought || gold < gem.cost}
                          onClick={gem.effect}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer shadow shrink-0 active:scale-95 ${
                            isBought
                              ? 'bg-stone-800 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-800 disabled:text-stone-500 text-white'
                          }`}
                        >
                          {isBought ? 'Aktiv ✓' : 'Buy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shop Footer with Gold status and prominent Close button (as shown in Bild 3) */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-t-2 border-amber-900/70 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 border border-amber-300 flex items-center justify-center shadow-md">
                  <span className="text-sm">🪙</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-amber-500/90 tracking-wider">
                    Current Gold
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-300 font-mono tracking-wide">
                    Gold: {gold.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowShopModal(false)}
                className="px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-b from-sky-800 via-sky-900 to-slate-900 hover:from-sky-700 hover:to-slate-800 active:scale-95 border-2 border-sky-500/80 text-white shadow-[0_4px_14px_rgba(14,116,144,0.4)] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ENEMIES MODAL (Matching prompt reference Enemies GUI)
          Orc Warrior, Orc Archer, Orc Brute, Spiderling, Wolf Rider, Siege Cannon
         ───────────────────────────────────────────────────────────── */}
      {showEnemiesModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-xl bg-stone-900 border-2 border-rose-600/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Top Resource Bar in Enemies Modal per prompt */}
            <div className="px-4 py-2 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-amber-200 font-bold font-serif uppercase tracking-wider text-[11px]">
                  Level: <strong className="text-white font-mono">{playerLevel}</strong>
                </span>
                <div className="h-3 w-px bg-stone-700" />
                <span className="text-stone-300">
                  Wave: <strong className="text-white">{currentWave}/{MAX_WAVES}</strong>
                </span>
                <div className="h-3 w-px bg-stone-700" />
                <span className="text-rose-400">
                  Lives: <strong className="text-rose-300">{lives}/{MAX_LIVES}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">
                  Gold: <strong className="text-amber-300">{gold.toLocaleString()}</strong>
                </span>
                <div className="h-3 w-px bg-stone-700" />
                <span className="text-sky-400 font-bold">
                  Mana: <strong className="text-sky-300">{mana}</strong>
                </span>
              </div>
            </div>

            {/* Header: Title 'Enemies' */}
            <div className="px-5 py-3 bg-gradient-to-r from-stone-950 via-rose-950/50 to-stone-950 border-b border-rose-600/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 font-black text-lg">💀</span>
                <h2 className="text-xl font-black text-rose-400 tracking-wider font-serif uppercase">
                  Enemies
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEnemiesModal(false)}
                className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Detailed Profile of Selected Enemy (default Orc Warrior) */}
              {(() => {
                const detailDef = ENEMY_REGISTRY[selectedEnemyDetail];
                const statsMap: Record<EnemyKind, { hp: string; dmg: string; spd: string }> = {
                  orc_warrior: { hp: '120', dmg: '22', spd: 'Medium' },
                  orc_archer: { hp: '95', dmg: '18', spd: 'Medium' },
                  orc_brute: { hp: '380', dmg: '45', spd: 'Slow' },
                  spiderling: { hp: '55', dmg: '14', spd: 'Fast' },
                  wolf_rider: { hp: '160', dmg: '28', spd: 'Fast' },
                  siege_cannon: { hp: '520', dmg: '65', spd: 'Very Slow' },
                };
                const st = statsMap[selectedEnemyDetail];

                return (
                  <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-2 border-stone-800 hover:border-rose-600/50 rounded-2xl p-4 flex items-center gap-5 shadow-lg transition-all">
                    {/* Enemy Portrait Graphic */}
                    <div className="rounded-2xl overflow-hidden border-2 border-rose-500/60 shadow-md shrink-0 bg-stone-950">
                      <EnemyPortrait kind={selectedEnemyDetail} size={84} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white font-serif tracking-wide truncate">
                          {detailDef.name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-600/50 text-rose-300 font-bold">
                          {detailDef.badge}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-xs">
                        <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-1.5 text-center">
                          <span className="text-stone-400 block text-[10px] uppercase font-sans">Health</span>
                          <span className="text-emerald-400 font-bold">{st.hp}</span>
                        </div>
                        <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-1.5 text-center">
                          <span className="text-stone-400 block text-[10px] uppercase font-sans">Damage</span>
                          <span className="text-rose-400 font-bold">{st.dmg}</span>
                        </div>
                        <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-1.5 text-center">
                          <span className="text-stone-400 block text-[10px] uppercase font-sans">Speed</span>
                          <span className="text-sky-400 font-bold">{st.spd}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Grid of Enemy Portraits (Wave Composition) */}
              <div>
                <div className="text-[11px] font-black text-stone-400 uppercase tracking-wider font-serif mb-2 flex items-center justify-between">
                  <span>Wave {currentWave} Squad Composition</span>
                  <span className="text-stone-500 lowercase font-sans font-normal text-[10px]">klicken für Details</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(
                    [
                      { kind: 'orc_warrior', label: 'Orc Warrior', count: 45 },
                      { kind: 'orc_archer', label: 'Orc Archer', count: 32 },
                      { kind: 'orc_brute', label: 'Orc Brute', count: 18 },
                      { kind: 'spiderling', label: 'Spiderling', count: 12 },
                      { kind: 'wolf_rider', label: 'Wolf Rider', count: 8 },
                      { kind: 'siege_cannon', label: 'Siege Cannon', count: 4 },
                    ] as { kind: EnemyKind; label: string; count: number }[]
                  ).map((item) => {
                    const isSelected = selectedEnemyDetail === item.kind;
                    return (
                      <button
                        key={item.kind}
                        type="button"
                        onClick={() => {
                          setSelectedEnemyDetail(item.kind);
                          playSound('click', isMuted);
                        }}
                        className={`rounded-2xl p-2 flex flex-col items-center text-center justify-between transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-rose-950/50 border-rose-500 shadow-md ring-2 ring-rose-500/40 scale-105'
                            : 'bg-stone-950/90 border-stone-800 hover:border-stone-600 hover:bg-stone-900'
                        }`}
                      >
                        <div className="rounded-xl overflow-hidden mb-1.5 border border-stone-800">
                          <EnemyPortrait kind={item.kind} size={48} />
                        </div>
                        <h4 className="text-[10px] font-bold text-white leading-tight line-clamp-1 w-full">
                          {item.label}
                        </h4>
                        <div className="text-[10px] text-rose-400 font-mono font-black mt-1">
                          x{item.count}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Button: 'Next Wave' flanked by skull icons */}
            <div className="px-5 py-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowEnemiesModal(false);
                  playSound('click', isMuted);
                  showFeedback(`Nächste Welle formiert sich!`);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-600 text-white font-black text-sm rounded-xl cursor-pointer shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 border border-rose-400/40 font-serif tracking-wider uppercase"
              >
                <span>💀</span>
                <span>Next Wave</span>
                <span>💀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Summary Footer */}
      <div className="w-full max-w-[1000px] mt-2 px-2 flex flex-wrap items-center justify-between text-[11px] text-stone-400">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-stone-300">Türme (1-8):</strong> Direktauswahl
          </span>
          <span>•</span>
          <span>
            <strong className="text-stone-300">Q:</strong> Mauszeiger leeren
          </span>
          <span>•</span>
          <span>
            <strong className="text-stone-300">B / S:</strong> Shop öffnen
          </span>
          <span>•</span>
          <span>
            <strong className="text-stone-300">E:</strong> Feind-Katalog
          </span>
          <span>•</span>
          <span>
            <strong className="text-stone-300">SPACE:</strong> Pause / Fortsetzen
          </span>
        </div>
        <div className="text-stone-500 font-mono">
          CANVAS 1000x600 • 60 FPS • HIGH-SCORE: {highScore}
        </div>
      </div>
    </div>
  );
};

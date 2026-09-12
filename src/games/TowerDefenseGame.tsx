import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Trophy,
  Shield,
  Crosshair,
  Zap,
  Bomb,
  Info,
  DollarSign,
  Heart,
  ChevronUp,
  Target,
  Radio,
  Sliders,
  Flame,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { playSound } from './audio';
import { saveGameResult, getGameStats } from './storage';

interface TowerDefenseGameProps {
  onBack: () => void;
  soundEnabled?: boolean;
  onRestart?: () => void;
}

// Canvas Dimensions strictly per specification: 1000x600px
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const PATH_WIDTH = 42;
const MAX_LIVES = 20;
const MAX_WAVES = 15;
const INTERMISSION_DURATION_SEC = 3;

// Path coordinates defining a tactical S-curve traversal across the 1000x600 field
export const PATH_WAYPOINTS: { x: number; y: number }[] = [
  { x: 0, y: 150 },
  { x: 260, y: 150 },
  { x: 260, y: 440 },
  { x: 520, y: 440 },
  { x: 520, y: 160 },
  { x: 780, y: 160 },
  { x: 780, y: 380 },
  { x: 1000, y: 380 },
];

export type TowerType = 'schuetze' | 'pistolero' | 'artillerie';

export interface TowerConfig {
  id: TowerType;
  name: string;
  role: string;
  militaryCode: string;
  cost: number;
  baseRange: number;
  baseDamage: number;
  baseFireRate: number; // shots per second
  color: string;
  accentColor: string;
  colorBorder: string;
  bulletColor: string;
  bulletRadius: number;
  size: number;
  bulletSpeed: number;
  description: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  schuetze: {
    id: 'schuetze',
    name: 'Scharfschütze',
    role: 'Präzisions-Sniper',
    militaryCode: 'MK-14 SR',
    cost: 100,
    baseRange: 155,
    baseDamage: 1.5,
    baseFireRate: 1.0, // 1 shot/sec
    color: '#059669', // Olive / Forest Green
    accentColor: '#34d399',
    colorBorder: '#064e3b',
    bulletColor: '#6ee7b7',
    bulletRadius: 3.5,
    size: 28,
    bulletSpeed: 10,
    description: 'Extrem hohe Präzision und Reichweite mit ballistischer Optik und Laser-Zielerfassung.',
  },
  pistolero: {
    id: 'pistolero',
    name: 'Heavy Gunner',
    role: 'Gatling / MG-Nest',
    militaryCode: 'GAU-19 HMG',
    cost: 150,
    baseRange: 95,
    baseDamage: 0.6,
    baseFireRate: 3.2, // 3.2 shots/sec
    color: '#d97706', // Tactical Amber/Bronze
    accentColor: '#fbbf24',
    colorBorder: '#78350f',
    bulletColor: '#fde047',
    bulletRadius: 2.5,
    size: 27,
    bulletSpeed: 11,
    description: 'Doppelrohr-Minigun mit enormer Kadenz zur Ausschaltung schneller Infanterieeinheiten.',
  },
  artillerie: {
    id: 'artillerie',
    name: 'Feldartillerie',
    role: 'Haubitze / Mörser',
    militaryCode: 'PzH-2000 HW',
    cost: 250,
    baseRange: 165,
    baseDamage: 3.5,
    baseFireRate: 0.5, // 0.5 shots/sec
    color: '#dc2626', // Heavy Red/Steel
    accentColor: '#f87171',
    colorBorder: '#7f1d1d',
    bulletColor: '#fb7185',
    bulletRadius: 6,
    size: 34,
    bulletSpeed: 6.5,
    description: 'Panzerhaubitze mit Explosivgranaten und verheerendem Flächenschaden (AoE Splash).',
  },
};

export interface UpgradeLevels {
  damage: number; // max 3: +1 damage each (200 Gold)
  fireRate: number; // max 3: +20% fire rate each (150 Gold)
  range: number; // max 2: +10% range each (100 Gold)
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

export type EnemyKind = 'scout' | 'soldier' | 'armored' | 'tank';

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

// Military camouflage & tactical tone palette for enemy divisions
export function getEnemyDivisionDetails(wave: number) {
  if (wave >= 13) {
    return { name: 'Gepanzerte Titanen-Division', code: 'WAVE-ALPHA HEAVY', badgeColor: '#f43f5e' };
  }
  if (wave >= 9) {
    return { name: 'Schwere Mech-Stoßtrupps', code: 'COMBAT ASSAULT', badgeColor: '#fb923c' };
  }
  if (wave >= 5) {
    return { name: 'Mobilisierte Schützen-Brigade', code: 'MOTORIZED INF', badgeColor: '#38bdf8' };
  }
  return { name: 'Leichte Aufklärer-Vorhut', code: 'RECON SCOUTS', badgeColor: '#a3e635' };
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

  // Game UI and stats state
  const [gold, setGold] = useState<number>(200); // 200 Gold start per spec
  const [lives, setLives] = useState<number>(MAX_LIVES); // 20 lives per spec
  const [currentWave, setCurrentWave] = useState<number>(1);
  const [selectedBuildType, setSelectedBuildType] = useState<TowerType | null>('schuetze');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'victory'>('playing');
  const [intermissionCountdown, setIntermissionCountdown] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getGameStats('towerdefense').highScore);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showUpgradesModal, setShowUpgradesModal] = useState<boolean>(false);
  const [selectedTowerForInfo, setSelectedTowerForInfo] = useState<PlacedTower | null>(null);

  // Upgrade state per tower type
  const [upgrades, setUpgrades] = useState<Record<TowerType, UpgradeLevels>>({
    schuetze: { damage: 0, fireRate: 0, range: 0 },
    pistolero: { damage: 0, fireRate: 0, range: 0 },
    artillerie: { damage: 0, fireRate: 0, range: 0 },
  });

  // Mutable refs for 60 FPS animation loop
  const goldRef = useRef(gold);
  goldRef.current = gold;

  const livesRef = useRef(lives);
  livesRef.current = lives;

  const currentWaveRef = useRef(currentWave);
  currentWaveRef.current = currentWave;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const selectedBuildTypeRef = useRef(selectedBuildType);
  selectedBuildTypeRef.current = selectedBuildType;

  const upgradesRef = useRef(upgrades);
  upgradesRef.current = upgrades;

  const towersRef = useRef<PlacedTower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Wave manager refs
  const waveEnemiesToSpawnRef = useRef<number>(0);
  const waveEnemiesSpawnedRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const isIntermissionRef = useRef<boolean>(false);
  const intermissionTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredTowerRef = useRef<PlacedTower | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const finalGoldRef = useRef<number>(200);

  // Helper to show transient feedback messages
  const showFeedback = useCallback((msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  // Compute effective stats for a tower type considering active upgrades
  const getTowerStats = useCallback((type: TowerType) => {
    const base = TOWER_CONFIGS[type];
    const up = upgradesRef.current[type];
    const damage = base.baseDamage + up.damage * 1.0;
    const fireRate = base.baseFireRate * (1 + up.fireRate * 0.2); // +20% each
    const range = base.baseRange * (1 + up.range * 0.1); // +10% each
    return { damage, fireRate, range, cost: base.cost, name: base.name, role: base.role, militaryCode: base.militaryCode };
  }, []);

  // Prepare a wave
  const startWave = useCallback((waveNum: number) => {
    let count = 10;
    if (waveNum >= 1 && waveNum <= 5) {
      count = 10;
    } else if (waveNum >= 6 && waveNum <= 10) {
      count = 15;
    } else {
      count = 20;
    }
    waveEnemiesToSpawnRef.current = count;
    waveEnemiesSpawnedRef.current = 0;
    lastSpawnTimeRef.current = gameTimeRef.current;
    isIntermissionRef.current = false;
    setIntermissionCountdown(0);
  }, []);

  // Initialize or Reset the game
  const resetGame = useCallback(() => {
    towersRef.current = [];
    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    gameTimeRef.current = 0;
    startTimeRef.current = Date.now();

    setGold(200);
    setLives(MAX_LIVES);
    setCurrentWave(1);
    setGameState('playing');
    setIsPaused(false);
    setSelectedTowerForInfo(null);
    setShowUpgradesModal(false);
    setUpgrades({
      schuetze: { damage: 0, fireRate: 0, range: 0 },
      pistolero: { damage: 0, fireRate: 0, range: 0 },
      artillerie: { damage: 0, fireRate: 0, range: 0 },
    });

    startWave(1);
    playSound('drop', isMuted);
    showFeedback('Taktische Abwehrstellung eingerichtet. Welle 1 rückt an!');
  }, [isMuted, showFeedback, startWave]);

  // Initial wave start on mount
  useEffect(() => {
    startWave(1);
  }, [startWave]);

  // Keyboard shortcuts: SPACE for Pause/Play, Q for deselecting tower / clearing cursor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setSelectedBuildType(null);
        setSelectedTowerForInfo(null);
        showFeedback('Visier freigegeben (Mauszeiger leer)');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback]);

  // Spawn a single military enemy
  const spawnEnemy = (wave: number) => {
    // Determine enemy vehicle/infantry archetype based on wave progression
    const count = waveEnemiesSpawnedRef.current;
    let kind: EnemyKind = 'soldier';
    let hpMultiplier = 1;
    let speed = 1.35;
    let radius = 12;
    let color = '#3b82f6';
    let accentColor = '#60a5fa';

    if (wave >= 8 && count % 5 === 0) {
      kind = 'tank';
      hpMultiplier = 3.2;
      speed = 0.9;
      radius = 16;
      color = '#b91c1c'; // Heavy Crimson Tank
      accentColor = '#f87171';
    } else if (wave >= 4 && count % 3 === 0) {
      kind = 'armored';
      hpMultiplier = 1.8;
      speed = 1.15;
      radius = 14;
      color = '#7c3aed'; // Armored Transport
      accentColor = '#c084fc';
    } else if (count % 4 === 1) {
      kind = 'scout';
      hpMultiplier = 0.75;
      speed = 1.8;
      radius = 10;
      color = '#0284c7'; // Fast Recon Buggy
      accentColor = '#38bdf8';
    }

    // Base HP scaling per specification: starting at wave 5: +1 HP per enemy for each wave above 4
    const baseWaveHp = wave < 5 ? 1 : 1 + (wave - 4);
    const finalHp = Math.max(1, Math.round(baseWaveHp * hpMultiplier));

    const enemy: Enemy = {
      id: 'enemy_' + Math.random().toString(36).substring(2, 9),
      kind,
      segmentIndex: 0,
      progress: 0,
      x: PATH_WAYPOINTS[0].x,
      y: PATH_WAYPOINTS[0].y,
      maxHp: finalHp,
      hp: finalHp,
      speed: speed + Math.min(0.5, wave * 0.03),
      color,
      accentColor,
      radius,
      waveNum: wave,
      headingAngle: 0,
    };
    enemiesRef.current.push(enemy);
  };

  // Upgrades purchase handler
  const handleBuyUpgrade = (
    type: TowerType,
    upgradeKey: 'damage' | 'fireRate' | 'range'
  ) => {
    const currentLevel = upgrades[type][upgradeKey];
    const limits = { damage: 3, fireRate: 3, range: 2 };
    const costs = { damage: 200, fireRate: 150, range: 100 };

    if (currentLevel >= limits[upgradeKey]) {
      showFeedback(`Upgrade-Maximum für ${upgradeKey} erreicht!`);
      playSound('bomb', isMuted);
      return;
    }

    const cost = costs[upgradeKey];
    if (gold < cost) {
      showFeedback(`Nicht genug Gefechts-Gold! Benötigt: ${cost} G.`);
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
    showFeedback(`${TOWER_CONFIGS[type].name}: Kaliber / Mechanik aufgerüstet!`);
  };

  // Sell tower handler (50% refund per specification)
  const handleSellTower = (tower: PlacedTower) => {
    const refund = Math.floor(tower.totalInvestedGold * 0.5);
    towersRef.current = towersRef.current.filter((t) => t.id !== tower.id);
    setGold((g) => g + refund);
    setSelectedTowerForInfo(null);
    playSound('score', isMuted);
    showFeedback(`${TOWER_CONFIGS[tower.type].name} demontiert (+${refund} G Verwertungsbonus)`);

    // Deconstruction particles
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      particlesRef.current.push({
        x: tower.x,
        y: tower.y,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2),
        life: 0.9,
        maxLife: 0.9,
        color: '#fbbf24',
        size: 3.5,
        isSmoke: Math.random() > 0.5,
      });
    }
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

  // Handle Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    mousePosRef.current = { x, y };

    // Check if hovering over an existing tower
    let found: PlacedTower | null = null;
    for (const t of towersRef.current) {
      if (Math.hypot(t.x - x, t.y - y) <= 22) {
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

    // If clicking on an existing tower -> open details/sell action
    for (const t of towersRef.current) {
      if (Math.hypot(t.x - x, t.y - y) <= 24) {
        setSelectedTowerForInfo(t);
        playSound('click', isMuted);
        return;
      }
    }

    // Deselect existing tower
    setSelectedTowerForInfo(null);

    // If no build type selected, exit
    const buildType = selectedBuildTypeRef.current;
    if (!buildType) {
      return;
    }

    const cfg = TOWER_CONFIGS[buildType];

    // Boundary check
    if (x < 35 || x > CANVAS_WIDTH - 35 || y < 35 || y > CANVAS_HEIGHT - 35) {
      showFeedback('Außerhalb der befestigten Gefechtszone!');
      playSound('bomb', isMuted);
      return;
    }

    // Check path clearance
    if (isTooCloseToPath(x, y, 26)) {
      showFeedback('Sperrzone! Geschütztürme blockieren nicht den Marschweg.');
      playSound('bomb', isMuted);
      return;
    }

    // Check overlapping with another tower
    for (const t of towersRef.current) {
      if (Math.hypot(t.x - x, t.y - y) < 38) {
        showFeedback('Kollision! Zu nah an einer bestehenden Waffenplattform.');
        playSound('bomb', isMuted);
        return;
      }
    }

    // Check Gold
    if (goldRef.current < cfg.cost) {
      showFeedback(`Mittel unzureichend! Benötigt: ${cfg.cost} G.`);
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
    playSound('drop', isMuted);
    showFeedback(`${cfg.name} aufgestellt! (-${cfg.cost} G)`);

    // Tactical placement shockwave & dust particles
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * (2 + Math.random() * 1.5),
        vy: Math.sin(angle) * (2 + Math.random() * 1.5),
        life: 0.7,
        maxLife: 0.7,
        color: '#94a3b8',
        size: 3.5,
        isSmoke: true,
      });
    }
  };

  // Right-click: Show Tower Info (Stats)
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    for (const t of towersRef.current) {
      if (Math.hypot(t.x - x, t.y - y) <= 24) {
        setSelectedTowerForInfo(t);
        playSound('click', isMuted);
        return;
      }
    }
  };

  // Middle-click: Sell Tower directly (50% refund)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      for (const t of towersRef.current) {
        if (Math.hypot(t.x - x, t.y - y) <= 24) {
          handleSellTower(t);
          return;
        }
      }
    }
  };

  // Game loop (60 FPS Canvas rendering and mechanics)
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1); // in seconds
      lastTimestamp = timestamp;

      // Update logic if not paused and playing
      if (!isPausedRef.current && gameStateRef.current === 'playing') {
        gameTimeRef.current += dt;

        // 1. Spawning Enemies
        if (waveEnemiesSpawnedRef.current < waveEnemiesToSpawnRef.current) {
          // Spawn every 1.15 seconds
          if (gameTimeRef.current - lastSpawnTimeRef.current >= 1.15) {
            spawnEnemy(currentWaveRef.current);
            waveEnemiesSpawnedRef.current++;
            lastSpawnTimeRef.current = gameTimeRef.current;
          }
        } else if (enemiesRef.current.length === 0 && !isIntermissionRef.current) {
          // Wave completed!
          if (currentWaveRef.current >= MAX_WAVES) {
            setGameState('victory');
            finalGoldRef.current = goldRef.current;
            playSound('win', isMuted);
            saveGameResult(
              'towerdefense',
              goldRef.current + currentWaveRef.current * 100,
              (Date.now() - startTimeRef.current) / 1000
            );
          } else {
            // Trigger 3s Intermission countdown
            isIntermissionRef.current = true;
            intermissionTimerRef.current = INTERMISSION_DURATION_SEC;
            // Wave completion bonus gold: wave * 5 per specification
            const bonusGold = currentWaveRef.current * 5;
            setGold((g) => g + bonusGold);
            playSound('score', isMuted);
            showFeedback(`Sektor gesäubert! Welle ${currentWaveRef.current} abgewehrt (+${bonusGold} G Bonus).`);
          }
        }

        // Intermission countdown handler
        if (isIntermissionRef.current) {
          intermissionTimerRef.current -= dt;
          setIntermissionCountdown(Math.ceil(intermissionTimerRef.current));
          if (intermissionTimerRef.current <= 0) {
            isIntermissionRef.current = false;
            setCurrentWave((w) => {
              const nextWave = w + 1;
              startWave(nextWave);
              return nextWave;
            });
          }
        }

        // 2. Move Enemies along path
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          const p1 = PATH_WAYPOINTS[enemy.segmentIndex];
          const p2 = PATH_WAYPOINTS[enemy.segmentIndex + 1];

          if (!p2) {
            // Enemy reached base! Deduct 1 life
            enemiesRef.current.splice(i, 1);
            setLives((l) => {
              const newLives = Math.max(0, l - 1);
              if (newLives === 0) {
                setGameState('gameover');
                finalGoldRef.current = goldRef.current;
                playSound('gameover', isMuted);
                saveGameResult(
                  'towerdefense',
                  goldRef.current + (currentWaveRef.current - 1) * 100,
                  (Date.now() - startTimeRef.current) / 1000
                );
              } else {
                playSound('bomb', isMuted);
              }
              return newLives;
            });
            continue;
          }

          const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const advance = (enemy.speed * 60 * dt) / segDist;
          enemy.progress += advance;
          enemy.headingAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          if (enemy.progress >= 1) {
            enemy.progress = 0;
            enemy.segmentIndex++;
            if (enemy.segmentIndex >= PATH_WAYPOINTS.length - 1) {
              enemiesRef.current.splice(i, 1);
              setLives((l) => {
                const newLives = Math.max(0, l - 1);
                if (newLives === 0) {
                  setGameState('gameover');
                  finalGoldRef.current = goldRef.current;
                  playSound('gameover', isMuted);
                  saveGameResult(
                    'towerdefense',
                    goldRef.current + (currentWaveRef.current - 1) * 100,
                    (Date.now() - startTimeRef.current) / 1000
                  );
                } else {
                  playSound('bomb', isMuted);
                }
                return newLives;
              });
              continue;
            }
          }

          // Interpolate position
          const curP1 = PATH_WAYPOINTS[enemy.segmentIndex];
          const curP2 = PATH_WAYPOINTS[enemy.segmentIndex + 1];
          enemy.x = curP1.x + (curP2.x - curP1.x) * enemy.progress;
          enemy.y = curP1.y + (curP2.y - curP1.y) * enemy.progress;
        }

        // 3. Realistic Tower Aiming, Recoil & Fire Solution
        for (const tower of towersRef.current) {
          const stats = getTowerStats(tower.type);
          const cfg = TOWER_CONFIGS[tower.type];
          const fireInterval = 1 / stats.fireRate;

          // Decay recoil offset
          if (tower.recoilOffset > 0) {
            tower.recoilOffset = Math.max(0, tower.recoilOffset - dt * 25);
          }

          // Find furthest enemy along path within range
          let bestEnemy: Enemy | null = null;
          let maxProgress = -1;

          for (const enemy of enemiesRef.current) {
            const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
            if (dist <= stats.range) {
              const totalProg = enemy.segmentIndex + enemy.progress;
              if (totalProg > maxProgress) {
                maxProgress = totalProg;
                bestEnemy = enemy;
              }
            }
          }

          if (bestEnemy) {
            tower.targetEnemyId = bestEnemy.id;
            // Calculate lead tracking angle
            const targetAngle = Math.atan2(bestEnemy.y - tower.y, bestEnemy.x - tower.x);
            // Smooth realistic turret rotation towards target
            const angleDiff = Math.atan2(Math.sin(targetAngle - tower.angle), Math.cos(targetAngle - tower.angle));
            tower.angle += angleDiff * Math.min(1, dt * 14);

            // Ready to fire?
            if (gameTimeRef.current - tower.lastShotTime >= fireInterval) {
              tower.lastShotTime = gameTimeRef.current;
              tower.muzzleFlashTime = 0.12; // active muzzle flash timer
              tower.recoilOffset = tower.type === 'artillerie' ? 6 : tower.type === 'schuetze' ? 4 : 2;

              // Spawn ballistic projectile with trace
              const barrelLen = tower.type === 'artillerie' ? 24 : tower.type === 'schuetze' ? 22 : 18;
              const spawnX = tower.x + Math.cos(tower.angle) * barrelLen;
              const spawnY = tower.y + Math.sin(tower.angle) * barrelLen;

              bulletsRef.current.push({
                id: 'bullet_' + Math.random().toString(36).substring(2, 9),
                towerType: tower.type,
                x: spawnX,
                y: spawnY,
                targetEnemyId: bestEnemy.id,
                targetLastX: bestEnemy.x,
                targetLastY: bestEnemy.y,
                damage: stats.damage,
                speed: cfg.bulletSpeed,
                color: cfg.bulletColor,
                radius: cfg.bulletRadius,
                splashRadius: tower.type === 'artillerie' ? 44 : undefined,
                trail: [{ x: spawnX, y: spawnY }],
              });

              // Muzzle blast smoke particles
              for (let m = 0; m < (tower.type === 'artillerie' ? 6 : 3); m++) {
                const spreadAngle = tower.angle + (Math.random() - 0.5) * 0.5;
                particlesRef.current.push({
                  x: spawnX,
                  y: spawnY,
                  vx: Math.cos(spreadAngle) * (1.5 + Math.random() * 2),
                  vy: Math.sin(spreadAngle) * (1.5 + Math.random() * 2),
                  life: 0.35,
                  maxLife: 0.35,
                  color: tower.type === 'artillerie' ? '#f97316' : '#e2e8f0',
                  size: tower.type === 'artillerie' ? 4 : 2.5,
                  isSmoke: true,
                });
              }

              playSound('click', isMuted);
            }
          } else {
            tower.targetEnemyId = null;
          }

          if (tower.muzzleFlashTime > 0) {
            tower.muzzleFlashTime -= dt;
          }
        }

        // 4. Update Bullets & Tracer Trails
        for (let bIdx = bulletsRef.current.length - 1; bIdx >= 0; bIdx--) {
          const bullet = bulletsRef.current[bIdx];
          const targetEnemy = enemiesRef.current.find((e) => e.id === bullet.targetEnemyId);

          let destX = bullet.targetLastX;
          let destY = bullet.targetLastY;

          if (targetEnemy) {
            destX = targetEnemy.x;
            destY = targetEnemy.y;
            bullet.targetLastX = destX;
            bullet.targetLastY = destY;
          }

          const angle = Math.atan2(destY - bullet.y, destX - bullet.x);
          const stepDist = bullet.speed * 60 * dt;
          const distToDest = Math.hypot(destX - bullet.x, destY - bullet.y);

          // Add tracer history
          bullet.trail.push({ x: bullet.x, y: bullet.y });
          if (bullet.trail.length > 5) {
            bullet.trail.shift();
          }

          if (distToDest <= stepDist + bullet.radius + 6) {
            // Hit impact!
            bulletsRef.current.splice(bIdx, 1);

            const hitEnemies: Enemy[] = [];
            if (bullet.splashRadius) {
              // Artillery Area of Effect Blast
              for (const e of enemiesRef.current) {
                if (Math.hypot(e.x - destX, e.y - destY) <= bullet.splashRadius) {
                  hitEnemies.push(e);
                }
              }
              // Heavy explosion effect
              for (let p = 0; p < 16; p++) {
                const pAngle = Math.random() * Math.PI * 2;
                particlesRef.current.push({
                  x: destX,
                  y: destY,
                  vx: Math.cos(pAngle) * (2 + Math.random() * 4),
                  vy: Math.sin(pAngle) * (2 + Math.random() * 4),
                  life: 0.65,
                  maxLife: 0.65,
                  color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
                  size: 4 + Math.random() * 3,
                  isSmoke: Math.random() > 0.6,
                });
              }
            } else if (targetEnemy) {
              hitEnemies.push(targetEnemy);
            }

            for (const enemy of hitEnemies) {
              enemy.hp -= bullet.damage;
              if (enemy.hp <= 0) {
                // Enemy Destroyed! Reward: 20 Gold per specification
                const killReward = 20;
                setGold((g) => g + killReward);

                // Combat destruction debris & sparks
                for (let p = 0; p < 12; p++) {
                  const pAngle = (Math.PI * 2 * p) / 12;
                  particlesRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(pAngle) * (1.8 + Math.random() * 2.5),
                    vy: Math.sin(pAngle) * (1.8 + Math.random() * 2.5),
                    life: 0.8,
                    maxLife: 0.8,
                    color: p % 2 === 0 ? '#f59e0b' : '#334155',
                    size: 3.5,
                    isSmoke: p % 3 === 0,
                  });
                }
                playSound('score', isMuted);
              }
            }

            // Remove destroyed targets
            enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

            // Shrapnel impact sparks
            for (let p = 0; p < 5; p++) {
              particlesRef.current.push({
                x: destX,
                y: destY,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 0.35,
                maxLife: 0.35,
                color: '#fde047',
                size: 2,
              });
            }
          } else {
            bullet.x += Math.cos(angle) * stepDist;
            bullet.y += Math.sin(angle) * stepDist;
          }
        }

        // 5. Update Smoke & Explosion Particles
        for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
          const part = particlesRef.current[pIdx];
          part.x += part.vx;
          part.y += part.vy;
          if (part.isSmoke) {
            part.vx *= 0.95;
            part.vy *= 0.95;
            part.size += dt * 3;
          }
          part.life -= dt;
          if (part.life <= 0) {
            particlesRef.current.splice(pIdx, 1);
          }
        }
      }

      // ──────────────────────────────────────────────
      // REALISTIC TACTICAL CANVAS RENDERING
      // ──────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Terrain Base: Matte Military Slate with Subtle Camo Grid
      const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#1e293b'); // Dark Tactical Slate
      bgGrad.addColorStop(1, '#0f172a'); // Navy Obsidian
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Tactical Sector Radar Lines & Coordinates
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
      }
      ctx.stroke();

      // Tactical Boundary Watermark
      ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SEKTOR-DEFENSE // GRID-404-GEO', 18, 22);
      ctx.fillText('DEFCON 1 // RADAR ACTIVE', CANVAS_WIDTH - 210, 22);

      // 2. Realistic Asphalt Combat Path with Concrete Borders & Hazard Stripes
      // Concrete embankment underlay
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = PATH_WIDTH + 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      PATH_WAYPOINTS.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Main heavy asphalt road
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = PATH_WIDTH;
      ctx.stroke();

      // Inner road tracks (tank treads wear)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Start Depot (Military Ingress Zone)
      const startPt = PATH_WAYPOINTS[0];
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(startPt.x + 14, startPt.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('INVASION', startPt.x + 14, startPt.y - 1);

      // HQ Core / Base Destination
      const lastPt = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(lastPt.x - 14, lastPt.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText('HQ BASE', lastPt.x - 14, lastPt.y - 1);

      // 3. Selection / Hover Range Radar Overlay
      const activeInspectorTower = selectedTowerForInfo || hoveredTowerRef.current;
      if (activeInspectorTower) {
        const stats = getTowerStats(activeInspectorTower.type);
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(activeInspectorTower.x, activeInspectorTower.y, stats.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Tactical crosshair ring
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(activeInspectorTower.x, activeInspectorTower.y, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (mousePosRef.current && selectedBuildTypeRef.current) {
        // Ghost turret placement preview with grid alignment
        const stats = getTowerStats(selectedBuildTypeRef.current);
        const { x, y } = mousePosRef.current;
        const valid =
          !isTooCloseToPath(x, y, 26) &&
          x >= 35 &&
          x <= CANVAS_WIDTH - 35 &&
          y >= 35 &&
          y <= CANVAS_HEIGHT - 35;

        ctx.save();
        ctx.strokeStyle = valid ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)';
        ctx.fillStyle = valid ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, stats.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Placement footprint reticle
        const cfg = TOWER_CONFIGS[selectedBuildTypeRef.current];
        ctx.fillStyle = valid ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, cfg.size / 2 + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Render Realistic Military Towers (Hexagonal bunker plinths, dual barrels, camouflage)
      for (const tower of towersRef.current) {
        const cfg = TOWER_CONFIGS[tower.type];
        const rad = cfg.size / 2;

        ctx.save();
        ctx.translate(tower.x, tower.y);

        // Selection highlight ring
        if (selectedTowerForInfo?.id === tower.id) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, rad + 9, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.fill();
        }

        // A. Hardened Base: Heavy Octagonal Concrete Plinth with Armor Screws
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        for (let a = 0; a < 8; a++) {
          const ang = (Math.PI / 4) * a;
          const px = Math.cos(ang) * (rad + 6);
          const py = Math.sin(ang) * (rad + 6);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Corner rivets
        ctx.fillStyle = '#94a3b8';
        for (let a = 0; a < 8; a++) {
          const ang = (Math.PI / 4) * a;
          ctx.fillRect(Math.cos(ang) * (rad + 4) - 1, Math.sin(ang) * (rad + 4) - 1, 2, 2);
        }

        // B. Armor Hub Body (Camo colored)
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cfg.colorBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // C. Turret Mount (Rotating with recoil)
        ctx.rotate(tower.angle);

        // Recoil offset pushes barrel back on fire
        const recoil = tower.recoilOffset || 0;

        if (tower.type === 'schuetze') {
          // --- SCHARFSCHÜTZE: Long High-Precision Sniper Barrel with Muzzle Brake & Scope ---
          // Sniper Barrel
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(2 - recoil, -3, 24, 6);
          // Muzzle Brake
          ctx.fillStyle = '#334155';
          ctx.fillRect(22 - recoil, -4.5, 6, 9);
          // Optics Laser Dot / Scope
          ctx.fillStyle = '#059669';
          ctx.fillRect(-6, -6, 12, 12);
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();

          // Green targeting laser beam towards target
          if (tower.targetEnemyId) {
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(26 - recoil, 0);
            ctx.lineTo(80, 0);
            ctx.stroke();
          }
        } else if (tower.type === 'pistolero') {
          // --- HEAVY GUNNER: Dual/Quad High-Cadence Gatling Barrels & Ammo Drum ---
          // Dual heavy rotating barrels
          ctx.fillStyle = '#020617';
          ctx.fillRect(4 - recoil, -6, 18, 4);
          ctx.fillRect(4 - recoil, 2, 18, 4);
          // Barrel ties
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(10 - recoil, -7, 3, 14);
          ctx.fillRect(18 - recoil, -7, 3, 14);
          // Ammo drum on side
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(-4, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(-4, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- ARTILLERIE: Heavy Armored Howitzer Cannon with Hydraulic Breech ---
          // Heavy Cannon Barrel
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0 - recoil, -5, 26, 10);
          // Heavy reinforced muzzle crown
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(20 - recoil, -6.5, 8, 13);
          // Armored Turret Mantlet
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-10, -9, 14, 18);
          // Commander hatch
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-2, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Muzzle Flash Effect (drawn during active recoil)
        if (tower.muzzleFlashTime > 0) {
          const barrelTip = tower.type === 'artillerie' ? 28 : tower.type === 'schuetze' ? 26 : 22;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(barrelTip - recoil + 4, 0, tower.type === 'artillerie' ? 8 : 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(barrelTip - recoil + 3, 0, tower.type === 'artillerie' ? 5 : 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 5. Render Projectiles & High-Velocity Ballistic Tracers
      for (const b of bulletsRef.current) {
        // Tracer tail
        if (b.trail && b.trail.length > 1) {
          ctx.strokeStyle = b.color;
          ctx.lineWidth = b.radius * 0.8;
          ctx.beginPath();
          b.trail.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
        }

        // Shell head
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Hot glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Render Realistic Military Enemies (Jeeps, Armored APCs, Heavy Battle Tanks)
      for (const e of enemiesRef.current) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.headingAngle);

        if (e.kind === 'tank') {
          // Heavy Armored Battle Tank
          // Tank Treads
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-e.radius - 2, -e.radius - 2, (e.radius + 2) * 2, 5);
          ctx.fillRect(-e.radius - 2, e.radius - 3, (e.radius + 2) * 2, 5);
          // Tread tread grips
          ctx.fillStyle = '#475569';
          for (let tx = -e.radius - 1; tx < e.radius; tx += 4) {
            ctx.fillRect(tx, -e.radius - 2, 2, 5);
            ctx.fillRect(tx, e.radius - 3, 2, 5);
          }
          // Armored Hull
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-e.radius, -e.radius + 2, e.radius * 2, e.radius * 2 - 4);
          // Turret & Cannon
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
          // Tank Gun
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(2, -2.5, e.radius + 6, 5);
        } else if (e.kind === 'armored') {
          // Armored Personnel Carrier (APC)
          ctx.fillStyle = '#4c1d95';
          ctx.beginPath();
          ctx.roundRect?.(-e.radius - 2, -e.radius, (e.radius + 2) * 2, e.radius * 2, 4);
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Shielded armor plates & windshield
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(e.radius * 0.1, -e.radius + 3, 5, e.radius * 2 - 6);
        } else if (e.kind === 'scout') {
          // Light High-Speed Recon Buggy
          ctx.fillStyle = '#0369a1';
          ctx.beginPath();
          ctx.moveTo(e.radius + 4, 0);
          ctx.lineTo(-e.radius, -e.radius + 2);
          ctx.lineTo(-e.radius * 0.5, 0);
          ctx.lineTo(-e.radius, e.radius - 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Standard Combat Infantry Unit / Light Patrol
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Combat helmet & visor
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(e.radius * 0.35, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // High-Contrast Tactical Health Bar (Always upright)
        const barW = Math.max(26, e.radius * 2.4);
        const barH = 5;
        const barX = e.x - barW / 2;
        const barY = e.y - e.radius - 12;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        const hpRatio = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
      }

      // 7. Render Particles (Smoke trails & Fire flashes)
      for (const part of particlesRef.current) {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 8. Intermission Tactical Briefing Overlay on Canvas
      if (isIntermissionRef.current && gameStateRef.current === 'playing') {
        const divInfo = getEnemyDivisionDetails(currentWaveRef.current + 1);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.roundRect?.(CANVAS_WIDTH / 2 - 200, 20, 400, 56, 12);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `ALARM: NÄCHSTE WELLE IN ${Math.ceil(intermissionTimerRef.current)} SEKUNDEN`,
          CANVAS_WIDTH / 2,
          38
        );

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText(`${divInfo.code} — ${divInfo.name}`, CANVAS_WIDTH / 2, 58);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [getTowerStats, isMuted]);

  return (
    <div className="flex flex-col items-center justify-start w-full h-full p-2 select-none overflow-y-auto font-sans bg-slate-950 text-slate-100">
      {/* ─────────────────────────────────────────────────────────────
          MILITARY TACTICAL HUD (Oberer Bildschirmrand)
          Authentischer Realismus-Stil mit Scharfschütze, Heavy Gunner, Artillerie
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[1000px] bg-slate-900/95 border-2 border-slate-700/90 rounded-2xl p-3 mb-2 shadow-2xl shrink-0 backdrop-blur-md">
        {/* Row 1: Header Operations Status, Wave Details & Audio */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rückzug</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-white tracking-widest uppercase">
                  Tower Defense <span className="text-emerald-400 font-mono text-[11px] font-normal">TACTICAL OPS</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Tactical Stats Matrix: Leben, Gold, Welle */}
          <div className="flex items-center gap-3 sm:gap-5 bg-slate-950/90 border border-slate-800 px-4 py-1.5 rounded-xl shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-bold text-sm">❤️</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Basis-Leben</span>
                <span className="text-xs sm:text-sm font-black font-mono text-white">
                  {lives} <span className="text-slate-500 font-normal">/ {MAX_LIVES}</span>
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">💰</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Gefechts-Gold</span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-300">
                  {gold} <span className="text-amber-500/70 text-[11px] font-normal">G</span>
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-bold text-sm">🌊</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Angriffswelle</span>
                <span className="text-xs sm:text-sm font-black font-mono text-sky-300">
                  {currentWave} <span className="text-slate-500 font-normal">/ {MAX_WAVES}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Audio, Reset, & Division Tag */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
              title={isMuted ? 'Funk/Audio aktivieren' : 'Funk stummschalten'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={resetGame}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
              title="Gefecht neu starten"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Military Unit Arsenal (Scharfschütze, Heavy Gunner, Artillerie) + Tactics Control */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5">
          {/* Tactical Weapon Selection Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(['schuetze', 'pistolero', 'artillerie'] as TowerType[]).map((tType) => {
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
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/30 border-emerald-400 text-white ring-2 ring-emerald-500/40 shadow-lg'
                      : canAfford
                      ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/40"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="font-bold">{cfg.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">[{cfg.militaryCode}]</span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono font-bold">
                      {cfg.cost} G <span className="text-slate-400 font-normal">({cfg.role})</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controls: [Mauszeiger leer (Q)] [Upgrades anzeigen] [Pause/Play] */}
          <div className="flex items-center gap-2">
            {selectedBuildType && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBuildType(null);
                  setSelectedTowerForInfo(null);
                  showFeedback('Visier freigegeben (Mauszeiger leer)');
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow"
                title="Auswahl aufheben (Taste Q)"
              >
                <span>Visier leeren</span>
                <kbd className="text-[10px] bg-slate-900 px-1 py-0.5 rounded text-amber-400 font-mono">Q</kbd>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowUpgradesModal((v) => !v);
                playSound('click', isMuted);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showUpgradesModal
                  ? 'bg-amber-600/30 border-amber-400 text-amber-200 ring-2 ring-amber-500/40'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Waffen-Upgrades</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPaused((p) => !p);
                playSound('click', isMuted);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPaused
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>{isPaused ? 'Fortsetzen' : 'Pause'}</span>
              <kbd className="text-[10px] text-slate-400 font-mono ml-1 hidden sm:inline">(SPACE)</kbd>
            </button>
          </div>
        </div>

        {/* Transient Feedback Banner */}
        {feedbackMessage && (
          <div className="mt-2 text-center text-xs font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 py-1.5 px-3 rounded-xl animate-fade-in shadow-inner">
            {feedbackMessage}
          </div>
        )}
      </div>

      {/* Upgrades Arsenal Terminal / Dropdown Drawer */}
      {showUpgradesModal && (
        <div className="w-full max-w-[1000px] bg-slate-950/95 border-2 border-amber-500/50 rounded-2xl p-4 mb-2 shadow-2xl animate-fade-in text-slate-200 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Militärische Feld-Modifikationen
                </h2>
                <p className="text-[11px] text-slate-400">
                  Globales Upgrade aller Einheiten des jeweiligen Waffensystems auf dem Schlachtfeld.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUpgradesModal(false)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              Schließen ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['schuetze', 'pistolero', 'artillerie'] as TowerType[]).map((tType) => {
              const cfg = TOWER_CONFIGS[tType];
              const currentUp = upgrades[tType];
              const stats = getTowerStats(tType);

              return (
                <div
                  key={tType}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-black/40"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{cfg.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{cfg.militaryCode}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        {stats.damage} Dmg • {stats.fireRate.toFixed(1)}/s • {Math.round(stats.range)}m
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2.5 line-clamp-2">
                      {cfg.description}
                    </p>

                    <div className="space-y-2">
                      {/* Schaden +1 (200 Gold, max 3) */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-400" />
                            <span>Panzerbrechend (+1 Schaden)</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Stufe: {currentUp.damage}/3
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={currentUp.damage >= 3 || gold < 200}
                          onClick={() => handleBuyUpgrade(tType, 'damage')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                            currentUp.damage >= 3
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : gold >= 200
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {currentUp.damage >= 3 ? 'MAX' : '200 G'}
                        </button>
                      </div>

                      {/* Feuerrate +20% (150 Gold, max 3) */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Schnellfeuer-Verschluss (+20%)</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Stufe: {currentUp.fireRate}/3
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={currentUp.fireRate >= 3 || gold < 150}
                          onClick={() => handleBuyUpgrade(tType, 'fireRate')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                            currentUp.fireRate >= 3
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : gold >= 150
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {currentUp.fireRate >= 3 ? 'MAX' : '150 G'}
                        </button>
                      </div>

                      {/* Reichweite +10% (100 Gold, max 2) */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <Target className="w-3 h-3 text-sky-400" />
                            <span>Optischer Laser-Finder (+10%)</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Stufe: {currentUp.range}/2
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={currentUp.range >= 2 || gold < 100}
                          onClick={() => handleBuyUpgrade(tType, 'range')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                            currentUp.range >= 2
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : gold >= 100
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {currentUp.range >= 2 ? 'MAX' : '100 G'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Tower Inspector Tactical GUI */}
      {selectedTowerForInfo && (
        <div className="w-full max-w-[1000px] bg-slate-900/95 border border-sky-500/60 rounded-xl px-4 py-2.5 mb-2 flex flex-wrap items-center justify-between text-xs shadow-xl animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-sm border border-black/40"
              style={{ backgroundColor: TOWER_CONFIGS[selectedTowerForInfo.type].color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm">
                  {TOWER_CONFIGS[selectedTowerForInfo.type].name}
                </span>
                <span className="text-[11px] text-sky-400 font-mono">
                  [{TOWER_CONFIGS[selectedTowerForInfo.type].militaryCode}]
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">
                Schaden: <strong className="text-white">{getTowerStats(selectedTowerForInfo.type).damage}</strong> •{' '}
                Feuerrate: <strong className="text-white">{getTowerStats(selectedTowerForInfo.type).fireRate.toFixed(1)}/s</strong> •{' '}
                Reichweite: <strong className="text-white">{Math.round(getTowerStats(selectedTowerForInfo.type).range)}m</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => handleSellTower(selectedTowerForInfo)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow cursor-pointer transition-colors"
            >
              Demontieren (+{Math.floor(selectedTowerForInfo.totalInvestedGold * 0.5)} G Rückerstattung)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTowerForInfo(null)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN REALISTIC BATTLEFIELD CANVAS: 1000x600px
         ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[1000px] aspect-[1000/600] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-900 flex items-center justify-center ring-1 ring-slate-800">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`w-full h-full block ${
            selectedBuildType ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* Tactical Pause Overlay */}
        {isPaused && gameState === 'playing' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 pointer-events-none">
            <div className="bg-slate-900/95 border-2 border-amber-500/60 px-8 py-5 rounded-2xl shadow-2xl text-center pointer-events-auto">
              <h3 className="text-xl font-black text-amber-300 uppercase tracking-widest mb-1">
                Taktischer Stillstand
              </h3>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">
                Positionierung und Waffen-Upgrades können während der Pause ausgeführt werden.
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

        {/* Tactical Defeat / Game Over */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
            <div className="bg-slate-900 border-2 border-rose-500/80 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-rose-500 tracking-wider mb-2">
                BASIS GEFALLEN 💀
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Die Verteidigungslinie wurde durchbrochen.
              </p>
              <div className="space-y-2.5 mb-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Erreichte Angriffswelle:</span>
                  <span className="font-bold text-white text-sm font-mono">{currentWave} / {MAX_WAVES}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Finales Gefechts-Gold:</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    {finalGoldRef.current} G
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={resetGame}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-sm font-black rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                NEUSTART
              </button>
            </div>
          </div>
        )}

        {/* Tactical Victory Banner */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
            <div className="bg-slate-900 border-2 border-emerald-500/80 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-wider mb-2">
                SEKTOR GESICHERT! 🎉
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Alle 15 feindlichen Divisionen wurden erfolgreich vernichtet!
              </p>
              <div className="space-y-2.5 mb-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Abgewehrte Wellen:</span>
                  <span className="font-bold text-emerald-400 text-sm font-mono">{MAX_WAVES}/{MAX_WAVES}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Finales Gefechts-Gold:</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    {finalGoldRef.current} G
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={resetGame}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-black rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                NEUSTART
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kontrollschema & Taktischer Quick-Guide */}
      <div className="w-full max-w-[1000px] mt-2 px-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-slate-300">Linksklick:</strong> Turm bauen / Turm inspizieren
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-300">Rechtsklick:</strong> Turm-Stats einblenden
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-300">Mausrad-Klick:</strong> Demontieren (50% Gold)
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-300">Q:</strong> Visier leeren / Auswahl aufheben
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-300">SPACE:</strong> Pause / Fortsetzen
          </span>
        </div>
        <div className="text-slate-500 font-mono">
          CANVAS 1000x600 • 60 FPS • HIGH-SCORE: {highScore}
        </div>
      </div>
    </div>
  );
};

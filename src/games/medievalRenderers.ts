// ─────────────────────────────────────────────────────────────
// MEDIEVAL REALISTIC RENDERERS FOR TOWER DEFENSE
// High-fidelity canvas textures for Medieval Towers & Fantasy Horde
// ─────────────────────────────────────────────────────────────

import { TowerType, TowerConfig } from './TowerDefenseGame';

export interface RenderableTower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  angle: number;
  lastShotTime: number;
  muzzleFlashTime: number;
  recoilOffset?: number;
}

export interface RenderableEnemy {
  id: string;
  kind: 'orc_warrior' | 'orc_archer' | 'orc_brute' | 'spiderling' | 'wolf_rider' | 'siege_cannon';
  x: number;
  y: number;
  headingAngle: number;
  hp: number;
  maxHp: number;
  radius: number;
  color: string;
  speed: number;
  isSlowed?: number;
}

// Helper for drawing realistic stone blocks with bevel and mortar
function drawStoneRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  blocksCount: number,
  color1: string,
  color2: string
) {
  const angleStep = (Math.PI * 2) / blocksCount;
  for (let i = 0; i < blocksCount; i++) {
    const startA = i * angleStep;
    const endA = (i + 1) * angleStep - 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startA, endA);
    ctx.strokeStyle = i % 2 === 0 ? color1 : color2;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

// ─────────────────────────────────────────────────────────────
// 1. MEDIEVAL TOWER CANVAS RENDERING
// ─────────────────────────────────────────────────────────────
export function drawMedievalTower(
  ctx: CanvasRenderingContext2D,
  tower: RenderableTower,
  cfg: TowerConfig,
  isHovered: boolean,
  timeSec: number
) {
  const rad = cfg.size / 2;
  const recoil = tower.recoilOffset || 0;

  ctx.save();
  ctx.translate(tower.x, tower.y);

  // 1. Realistic Cast Shadow beneath tower
  ctx.save();
  ctx.scale(1.15, 0.65);
  ctx.beginPath();
  ctx.arc(0, rad * 0.9, rad + 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10, 15, 10, 0.45)';
  ctx.fill();
  ctx.restore();

  // 2. Realistic Medieval Octagonal / Circular Stone Plinth
  const baseGrad = ctx.createRadialGradient(0, -rad * 0.3, rad * 0.2, 0, 0, rad + 6);
  baseGrad.addColorStop(0, '#64748b'); // Granite light
  baseGrad.addColorStop(0.5, '#475569'); // Mid stone slate
  baseGrad.addColorStop(1, '#1e293b'); // Dark weathered foundation
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.arc(0, 0, rad + 6, 0, Math.PI * 2);
  ctx.fill();

  // Stone Mortar & Chiseled Masonry Joint Lines
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Ashlar stone block ring
  drawStoneRing(ctx, 0, 0, rad + 3, 8, '#94a3b8', '#475569');

  // Decorative Iron Band & Rivet Studs around the plinth
  ctx.beginPath();
  ctx.arc(0, 0, rad + 1, 0, Math.PI * 2);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Iron Rivet Studs (8 cardinal and diagonal rivets)
  ctx.fillStyle = '#e2e8f0';
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const rx = Math.cos(ang) * (rad + 3);
    const ry = Math.sin(ang) * (rad + 3);
    ctx.beginPath();
    ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moss & Weathering stains on northern stone
  ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
  ctx.beginPath();
  ctx.arc(-rad * 0.4, -rad * 0.4, 4, 0, Math.PI * 2);
  ctx.fill();

  // 3. Wooden Battlement Platform Floor
  const woodGrad = ctx.createLinearGradient(-rad, -rad, rad, rad);
  woodGrad.addColorStop(0, '#78350f');
  woodGrad.addColorStop(0.5, '#92400e');
  woodGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = woodGrad;
  ctx.beginPath();
  ctx.arc(0, 0, rad - 2, 0, Math.PI * 2);
  ctx.fill();

  // Wood plank lines
  ctx.strokeStyle = 'rgba(69, 26, 3, 0.6)';
  ctx.lineWidth = 1;
  for (let py = -rad + 4; py < rad - 4; py += 5) {
    ctx.beginPath();
    ctx.moveTo(-Math.sqrt(Math.max(0, rad * rad - py * py)) + 3, py);
    ctx.lineTo(Math.sqrt(Math.max(0, rad * rad - py * py)) - 3, py);
    ctx.stroke();
  }

  // 4. Parapet Crenellations (Fortified Wall Teeth)
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    const cx = Math.cos(ang) * (rad - 1);
    const cy = Math.sin(ang) * (rad - 1);
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 5. Rotate into aiming direction for the tower weapon & crew
  ctx.rotate(tower.angle);

  // ─── TOWER SUPERSTRUCTURE BY TYPE ───
  if (tower.type === 'arrow') {
    // 🏹 BOGENSCHÜTZEN-WEHRTURM (Archer Guardhouse)
    // Wooden Timber Frame Posts
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-rad * 0.6, -rad * 0.6, 3.5, 3.5);
    ctx.fillRect(-rad * 0.6, rad * 0.4, 3.5, 3.5);

    // Conical Thatched / Slate Shingle Roof overhang behind archer
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(4, 0);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3f2203';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Archer Figure standing on parapet
    // Quiver of arrows slung on back
    ctx.fillStyle = '#713f12';
    ctx.fillRect(-4, -8, 8, 3.5);
    // White / Red arrow fletchings
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-6, -9, 2, 2);
    ctx.fillRect(-3, -9, 2, 2);

    // Archer Body / Green Tunic
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(-recoil * 0.5, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Steel Chainmail Shoulders & Armored Vambraces
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0 - recoil, -4, 5, 8);

    // Steel Kettle Hat / Helmet with golden crest
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(-recoil * 0.5, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // English Yew Longbow (Carved Wooden Arc)
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(8 - recoil, 0, 12, -Math.PI / 2.3, Math.PI / 2.3);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(8 - recoil + Math.cos(-Math.PI / 2.3) * 12, Math.sin(-Math.PI / 2.3) * 12);
    ctx.lineTo(2 - recoil, 0); // Drawn string point
    ctx.lineTo(8 - recoil + Math.cos(Math.PI / 2.3) * 12, Math.sin(Math.PI / 2.3) * 12);
    ctx.stroke();

    // Notched Arrow with steel bodkin point
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2 - recoil, 0);
    ctx.lineTo(19 - recoil, 0);
    ctx.stroke();

    // Steel Arrowhead
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(22 - recoil, 0);
    ctx.lineTo(18 - recoil, -2);
    ctx.lineTo(18 - recoil, 2);
    ctx.closePath();
    ctx.fill();
  } else if (tower.type === 'cannon') {
    // 💣 FELD-ARTILLERIE (Heavy Oak Carriage & Iron Siege Cannon)
    // Heavy Spoked Artillery Wheels on sides
    const drawWheel = (wy: number) => {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-8, wy - 2.5, 16, 5);
      // Iron rim
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-8, wy - 2.5, 16, 5);
      // Hub
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, wy, 2, 0, Math.PI * 2);
      ctx.fill();
    };
    drawWheel(-10);
    drawWheel(10);

    // Heavy Oak Gun Carriage
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, -7, 14, 14);
    ctx.strokeStyle = '#291002';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-6, -7, 14, 14);

    // Black Iron Reinforcement Straps & Rivets
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-3, -7, 2.5, 14);
    ctx.fillRect(4, -7, 2.5, 14);

    // Cast Bronze/Iron Cannon Barrel
    const barrelGrad = ctx.createLinearGradient(0, -5, 0, 5);
    barrelGrad.addColorStop(0, '#64748b');
    barrelGrad.addColorStop(0.3, '#334155');
    barrelGrad.addColorStop(0.7, '#0f172a');
    barrelGrad.addColorStop(1, '#020617');
    ctx.fillStyle = barrelGrad;

    // Tapered Barrel
    ctx.beginPath();
    ctx.moveTo(-8 - recoil, -4.5);
    ctx.lineTo(18 - recoil, -3.5);
    ctx.lineTo(18 - recoil, 3.5);
    ctx.lineTo(-8 - recoil, 4.5);
    ctx.closePath();
    ctx.fill();

    // Cascabel (Round button knob at rear)
    ctx.beginPath();
    ctx.arc(-9 - recoil, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Muzzle Reinforcement Ring & Bore
    ctx.fillStyle = '#b45309';
    ctx.fillRect(16 - recoil, -5, 4, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(19 - recoil, -3, 2, 6);

    // Trunnion brackets on carriage
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0 - recoil, -4.5, 2, 0, Math.PI * 2);
    ctx.arc(0 - recoil, 4.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Stack of 3 cannonballs on platform
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-8, -8, 2.2, 0, Math.PI * 2);
    ctx.arc(-4, -9, 2.2, 0, Math.PI * 2);
    ctx.arc(-6, -6, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  } else if (tower.type === 'magic') {
    // 🔮 ARKAN-MONOLITH (Dark Runic Spire with Levitating Core)
    // Dark Runic Spire Base
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(6, -7);
    ctx.lineTo(12, 0);
    ctx.lineTo(6, 7);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Glowing Arcane Runes etched on the stone
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(-2, -5);
    ctx.lineTo(-4, -1);
    ctx.moveTo(-6, 5);
    ctx.lineTo(-2, 5);
    ctx.stroke();

    // Levitation Arcane Shards (Orbiting power crystals)
    const orbPulse = Math.sin(timeSec * 4) * 1.5;
    for (let i = 0; i < 3; i++) {
      const orbAngle = timeSec * 2 + (i * Math.PI * 2) / 3;
      const ox = Math.cos(orbAngle) * 13;
      const oy = Math.sin(orbAngle) * 7;
      ctx.fillStyle = '#0284c7';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(ox, oy - 3);
      ctx.lineTo(ox + 2.5, oy);
      ctx.lineTo(ox, oy + 3);
      ctx.lineTo(ox - 2.5, oy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Central Luminous Arcane Orb
    const orbGlow = ctx.createRadialGradient(2, 0, 1, 2, 0, 9 + orbPulse);
    orbGlow.addColorStop(0, '#ffffff');
    orbGlow.addColorStop(0.3, '#7dd3fc');
    orbGlow.addColorStop(0.7, '#0284c7');
    orbGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = orbGlow;
    ctx.beginPath();
    ctx.arc(2, 0, 8 + orbPulse, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Energy Focus Ring
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(2, 0, 5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tower.type === 'tesla') {
    // ⚡ BLITZSPULE (Tesla Coil Lightning Sentry)
    // Heavy Brass / Steampunk Iron Base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -8, 16, 16);

    // Stacked Glass / Porcelain Insulator Discs
    for (let dy = -6; dy <= 6; dy += 4) {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-6, dy, 12, 2);
    }

    // Copper Wrapped Inductance Coils
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-2, -7, 4, 14);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    for (let cy = -6; cy <= 6; cy += 2.5) {
      ctx.beginPath();
      ctx.moveTo(-3, cy);
      ctx.lineTo(3, cy);
      ctx.stroke();
    }

    // Pointed Electrode Needle & Plasma Spark
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(18 - recoil, 0);
    ctx.stroke();

    // Crackling Electric Arcs
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(13, 0);
    ctx.lineTo(11, 4);
    ctx.lineTo(17 - recoil, 0);
    ctx.stroke();

    // High Voltage Corona Glow
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(17 - recoil, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.type === 'mortar') {
    // 💥 BELAGERUNGS-MÖRSER (Heavy Siege Mortar Battery)
    // Heavy Granite Foundation Block
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -8, 20, 16);

    // Iron Anchorage Chains
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(6, -5);
    ctx.moveTo(-8, 8);
    ctx.lineTo(6, 5);
    ctx.stroke();

    // Massive Squat Mortar Barrel with Huge Bore
    const mortarGrad = ctx.createLinearGradient(0, -8, 0, 8);
    mortarGrad.addColorStop(0, '#475569');
    mortarGrad.addColorStop(0.5, '#1e293b');
    mortarGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = mortarGrad;

    // Conical Heavy Mortar Hull
    ctx.beginPath();
    ctx.moveTo(-9 - recoil, -7);
    ctx.lineTo(14 - recoil, -8.5);
    ctx.lineTo(14 - recoil, 8.5);
    ctx.lineTo(-9 - recoil, 7);
    ctx.closePath();
    ctx.fill();

    // Heavy Forged Muzzle Rim
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(12 - recoil, -10, 4, 20);
    // Dark interior bore
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(15 - recoil, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Powder Keg with Red Skull Icon on platform
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-8, -12, 6, 8);
    ctx.strokeStyle = '#450a0a';
    ctx.strokeRect(-8, -12, 6, 8);
  } else if (tower.type === 'ice') {
    // ❄️ FROST-KRISTALL (Glacial Ice Spire)
    // Translucent Blue Ice Obelisk with sharp facets
    ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(16 - recoil, 0);
    ctx.lineTo(-10, 8);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Geometric Ice Facets with specular reflections
    ctx.fillStyle = '#cffafe';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(15 - recoil, 0);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Hanging Icicles
    ctx.fillStyle = '#e0f2fe';
    for (let ix = -8; ix <= 4; ix += 4) {
      ctx.beginPath();
      ctx.moveTo(ix, -8);
      ctx.lineTo(ix + 1.5, -4);
      ctx.lineTo(ix + 3, -8);
      ctx.closePath();
      ctx.fill();
    }
  } else if (tower.type === 'ballista') {
    // 🏹 REPETIER-KRIEGSBALLISTE (Torsion Crossbow Engine)
    // Heavy Ash-wood Catapult Carriage
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.strokeStyle = '#291002';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -6, 16, 12);

    // Torsion Cable Bundles (Twisted sinew cylinders)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(-2, -9, 3.5, 0, Math.PI * 2);
    ctx.arc(-2, 9, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Dual Composite Wood Bow Arms
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.lineTo(10 - recoil * 0.5, -14);
    ctx.moveTo(-2, 9);
    ctx.lineTo(10 - recoil * 0.5, 14);
    ctx.stroke();

    // Heavy Torsion Bowstring
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10 - recoil * 0.5, -14);
    ctx.lineTo(-2 - recoil, 0);
    ctx.lineTo(10 - recoil * 0.5, 14);
    ctx.stroke();

    // Brass Firing Groove & Steel Bolt
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-4, -2, 22, 4);

    // Steel-tipped War Arrow / Siege Bolt
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2 - recoil, 0);
    ctx.lineTo(18 - recoil, 0);
    ctx.stroke();

    // Barbed Bolt Point
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(21 - recoil, 0);
    ctx.lineTo(17 - recoil, -3);
    ctx.lineTo(17 - recoil, 3);
    ctx.closePath();
    ctx.fill();
  } else {
    // 💣 BOMBARD TOWER (Imperial Great Bombard)
    // Reinforced Stone Wall Breastwork
    ctx.fillStyle = '#475569';
    ctx.fillRect(-9, -10, 18, 20);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-9, -10, 18, 20);

    // Forged Wrought-Iron Hoop Bands on Barrel
    const bGrad = ctx.createLinearGradient(0, -6, 0, 6);
    bGrad.addColorStop(0, '#64748b');
    bGrad.addColorStop(0.5, '#1e293b');
    bGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bGrad;

    ctx.fillRect(-8 - recoil, -6, 26, 12);

    // Golden / Bronze reinforcement rings
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-4 - recoil, -7, 3, 14);
    ctx.fillRect(4 - recoil, -7, 3, 14);
    ctx.fillRect(12 - recoil, -7, 3, 14);

    // Muzzle Crown
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(18 - recoil, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Muzzle Flash Effect (Explosion & Smoke Sparkles on firing)
  if (tower.muzzleFlashTime > 0) {
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(24 - recoil, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(24 - recoil, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  // Highlight Ring if Hovered or Selected
  if (isHovered) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, rad + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. FANTASY ENEMY HORDE CANVAS RENDERING
// Realistic textures: Muscular orc anatomy, tusks, shields, wolf fur & spider chitin
// ─────────────────────────────────────────────────────────────
export function drawFantasyEnemy(
  ctx: CanvasRenderingContext2D,
  e: RenderableEnemy,
  timeSec: number
) {
  ctx.save();
  ctx.translate(e.x, e.y);

  // Cast Shadow on dirt path
  ctx.save();
  ctx.scale(1.1, 0.6);
  ctx.beginPath();
  ctx.arc(0, e.radius * 0.8, e.radius + 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 15, 0.4)';
  ctx.fill();
  ctx.restore();

  // Face moving direction
  ctx.rotate(e.headingAngle);

  const rad = e.radius;
  const walkBob = Math.sin(timeSec * 8 * (e.speed / 40)) * 1.5;

  if (e.kind === 'spiderling') {
    // 🕷️ DREAD SPIDERLING (Multi-jointed Hairy Chitinous Beast)
    // 8 Crawling Spidery Legs with active gait
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    for (let i = -3; i <= 3; i += 2) {
      const legPhase = Math.sin(timeSec * 12 + i) * 5;
      // Upper leg
      ctx.beginPath();
      ctx.moveTo(0, i * 2.5);
      const kneeX = i * 3 + legPhase;
      const kneeY = Math.sign(i) * (rad + 7);
      ctx.lineTo(kneeX, kneeY);
      // Lower leg with sharp claw tip
      ctx.lineTo(kneeX + (i > 0 ? 4 : -4), kneeY + Math.sign(i) * 6);
      ctx.stroke();
    }

    // Cephalothorax (Head/Chest)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(rad * 0.3, 0, rad * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Bulbous Abdomen (Rear with skull / danger stripes)
    const abdGrad = ctx.createRadialGradient(-rad * 0.4, 0, 2, -rad * 0.4, 0, rad);
    abdGrad.addColorStop(0, '#450a0a');
    abdGrad.addColorStop(0.6, '#18181b');
    abdGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = abdGrad;
    ctx.beginPath();
    ctx.ellipse(-rad * 0.4, 0, rad * 0.9, rad * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red Hourglass / Yellow Warning Markings on Abdomen
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-rad * 0.8, -3);
    ctx.lineTo(-rad * 0.3, 0);
    ctx.lineTo(-rad * 0.8, 3);
    ctx.closePath();
    ctx.fill();

    // Cluster of 6 Glowing Crimson Predatory Eyes
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(rad * 0.65, -2, 1.2, 0, Math.PI * 2);
    ctx.arc(rad * 0.65, 2, 1.2, 0, Math.PI * 2);
    ctx.arc(rad * 0.75, -1, 1, 0, Math.PI * 2);
    ctx.arc(rad * 0.75, 1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Venomous Chelicerae / Fangs with dripping green poison
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rad * 0.8, -2);
    ctx.lineTo(rad * 1.1, -1);
    ctx.moveTo(rad * 0.8, 2);
    ctx.lineTo(rad * 1.1, 1);
    ctx.stroke();

    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(rad * 1.1, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'wolf_rider') {
    // 🐺 WOLF RIDER (Dire Wolf Mount + Savage Goblin Cavalier)
    // Dire Wolf Body (Thick Shaggy Gray-Brown Fur)
    const wolfGrad = ctx.createLinearGradient(-rad, 0, rad, 0);
    wolfGrad.addColorStop(0, '#334155');
    wolfGrad.addColorStop(0.6, '#475569');
    wolfGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = wolfGrad;

    // Running Wolf Torso
    ctx.beginPath();
    ctx.ellipse(0, 0, rad + 3, rad * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wolf Bushy Tail
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-rad - 4, -walkBob, 6, 2.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Wolf Snarling Head with Pointed Ears
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(rad * 0.8, 0, rad * 0.5, rad * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pointed Wolf Ears
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(rad * 0.6, -rad * 0.35);
    ctx.lineTo(rad * 0.7, -rad * 0.7);
    ctx.lineTo(rad * 0.9, -rad * 0.3);
    ctx.closePath();
    ctx.fill();

    // Glowing Amber Wolf Eyes & White Fangs
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(rad * 0.9, -2, 1.5, 1.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rad * 1.2, 1, 2, 1.5);

    // Goblin Rider (Small green hunchback holding hunting javelin)
    ctx.fillStyle = '#15803d'; // Goblin Green
    ctx.beginPath();
    ctx.arc(-2, -walkBob * 0.5, rad * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Studded Leather Cap
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-2, -walkBob * 0.5, rad * 0.45, -Math.PI, 0);
    ctx.fill();

    // Long Barbed Spear with Red Pennant
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(rad * 1.6, 0);
    ctx.stroke();

    // Steel Spearhead & Red Banner
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(rad * 1.8, 0);
    ctx.lineTo(rad * 1.5, -2);
    ctx.lineTo(rad * 1.5, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(rad * 1.3, 0);
    ctx.lineTo(rad * 0.9, 4);
    ctx.lineTo(rad * 1.1, 0);
    ctx.closePath();
    ctx.fill();
  } else if (e.kind === 'siege_cannon') {
    // 💣 ORKISH SIEGE CANNON (Crudely Forged Mobile War Machine)
    // Spiked Wooden Monster Wheels
    const drawSpikedWheel = (wy: number) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-rad + 2, wy - 3, rad * 1.6, 6);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-rad + 2, wy - 3, rad * 1.6, 6);
      // Spikes on wheel
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-rad + 4, wy - 5, 2.5, 2);
      ctx.fillRect(rad * 0.2, wy - 5, 2.5, 2);
    };
    drawSpikedWheel(-rad + 3);
    drawSpikedWheel(rad - 3);

    // Armored Hull / Heavy Iron Armor Plates
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-rad * 0.8, -rad * 0.6, rad * 1.6, rad * 1.2);
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.strokeRect(-rad * 0.8, -rad * 0.6, rad * 1.6, rad * 1.2);

    // Front Ramming Horns / Battering Prow
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.moveTo(rad * 0.8, -rad * 0.5);
    ctx.lineTo(rad * 1.4, 0);
    ctx.lineTo(rad * 0.8, rad * 0.5);
    ctx.closePath();
    ctx.fill();

    // Heavy Black Iron Cannon Barrel
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-rad * 0.2, -4, rad * 1.2, 8);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(rad * 0.9, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'orc_brute') {
    // 👹 HULKING ORK-BERSERKER (Massive Muscular Behemoth)
    // Giant Ochre-Green Muscular Body
    const bruteGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, rad);
    bruteGrad.addColorStop(0, '#a16207'); // Warm dark olive
    bruteGrad.addColorStop(0.7, '#713f12'); // Heavy skin
    bruteGrad.addColorStop(1, '#451a03'); // Shaded shadow
    ctx.fillStyle = bruteGrad;
    ctx.beginPath();
    ctx.arc(0, walkBob, rad, 0, Math.PI * 2);
    ctx.fill();

    // Spiked Iron Gorget / Collar
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(rad * 0.2, walkBob, rad * 0.6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Red War Tattoo Across Back
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-rad * 0.6, -rad * 0.4 + walkBob);
    ctx.lineTo(0, walkBob);
    ctx.lineTo(-rad * 0.6, rad * 0.4 + walkBob);
    ctx.stroke();

    // Heavy Spiked Two-Handed Iron Club
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(rad * 0.2, -3 + walkBob, rad * 0.9, 6);
    // Spikes
    ctx.fillStyle = '#cbd5e1';
    for (let sp = 0; sp < 3; sp++) {
      ctx.beginPath();
      ctx.moveTo(rad * (0.5 + sp * 0.2), -5 + walkBob);
      ctx.lineTo(rad * (0.6 + sp * 0.2), -8 + walkBob);
      ctx.lineTo(rad * (0.7 + sp * 0.2), -5 + walkBob);
      ctx.closePath();
      ctx.fill();
    }

    // Huge Lower Ivory Tusks
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(rad * 0.6, -4 + walkBob);
    ctx.lineTo(rad * 0.9, -6 + walkBob);
    ctx.lineTo(rad * 0.7, -2 + walkBob);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rad * 0.6, 4 + walkBob);
    ctx.lineTo(rad * 0.9, 6 + walkBob);
    ctx.lineTo(rad * 0.7, 2 + walkBob);
    ctx.closePath();
    ctx.fill();
  } else if (e.kind === 'orc_archer') {
    // 🏹 ORK-SCHÜTZE (Lean Dark Moss Green Scout with Sinew Bow)
    // Lean Orc Body
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(0, walkBob, rad * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Leather Scalemail Vest & Hood
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(0, walkBob, rad * 0.7, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.fill();

    // Quiver of Black Feather Arrows on back
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-rad * 0.7, -rad * 0.5 + walkBob, 4, 10);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-rad * 0.8, -rad * 0.6 + walkBob, 2, 3);
    ctx.fillRect(-rad * 0.8, -rad * 0.2 + walkBob, 2, 3);

    // Glowing Yellow Eyes in dark hood
    ctx.fillStyle = '#facc15';
    ctx.fillRect(rad * 0.3, -2 + walkBob, 2, 1.5);
    ctx.fillRect(rad * 0.3, 1 + walkBob, 2, 1.5);

    // Curved Recurve Orc Bow in hand
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rad * 0.7, walkBob, rad * 0.8, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();

    // Notched Arrow
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rad * 0.3, walkBob);
    ctx.lineTo(rad * 1.3, walkBob);
    ctx.stroke();
  } else {
    // ⚔️ ORC WARRIOR (Standard Frontline Armored Savage)
    // Muscular Forest-Green Orc Skin with muscle definition
    const orcGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, rad);
    orcGrad.addColorStop(0, '#22c55e');
    orcGrad.addColorStop(0.5, '#15803d');
    orcGrad.addColorStop(1, '#052e16');
    ctx.fillStyle = orcGrad;
    ctx.beginPath();
    ctx.arc(0, walkBob, rad, 0, Math.PI * 2);
    ctx.fill();

    // Horned Iron Helmet
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(rad * 0.1, walkBob, rad * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Curved Iron Horns
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(0, -rad * 0.6 + walkBob);
    ctx.lineTo(-rad * 0.3, -rad * 1.1 + walkBob);
    ctx.lineTo(rad * 0.3, -rad * 0.7 + walkBob);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, rad * 0.6 + walkBob);
    ctx.lineTo(-rad * 0.3, rad * 1.1 + walkBob);
    ctx.lineTo(rad * 0.3, rad * 0.7 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Jagged Orcish Scimitar / Cleaver in right hand
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(rad * 0.4, 4 + walkBob);
    ctx.lineTo(rad * 1.4, 7 + walkBob);
    ctx.lineTo(rad * 1.2, 2 + walkBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Round Wooden Shield with Red War Paint in left hand
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(rad * 0.3, -rad * 0.5 + walkBob, rad * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Red War Paint Handprint on shield
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(rad * 0.3, -rad * 0.5 + walkBob, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Protruding Lower Tusks
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rad * 0.5, -2 + walkBob, 2, 1.5);
    ctx.fillRect(rad * 0.5, 1 + walkBob, 2, 1.5);
  }

  // Ice Slowed Aura effect if frozen
  if (e.isSlowed && e.isSlowed > 0) {
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, rad + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  // ── Realistic Health Bar Above Enemy ──
  const barW = Math.max(26, rad * 2.4);
  const barH = 4.5;
  const barX = e.x - barW / 2;
  const barY = e.y - rad - 9;

  // Background frame
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

  // Health fill gradient
  const hpRatio = Math.max(0, e.hp / e.maxHp);
  const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  if (hpRatio > 0.5) {
    hpGrad.addColorStop(0, '#4ade80');
    hpGrad.addColorStop(1, '#16a34a');
  } else if (hpRatio > 0.25) {
    hpGrad.addColorStop(0, '#fde047');
    hpGrad.addColorStop(1, '#ca8a04');
  } else {
    hpGrad.addColorStop(0, '#f87171');
    hpGrad.addColorStop(1, '#dc2626');
  }
  ctx.fillStyle = hpGrad;
  ctx.fillRect(barX, barY, barW * hpRatio, barH);
}

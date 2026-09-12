import React from 'react';

export interface TowerPortraitProps {
  type: 'arrow' | 'cannon' | 'magic' | 'tesla' | 'mortar' | 'ice' | 'ballista' | 'bombard';
  size?: number;
  className?: string;
}

export const TowerPortrait: React.FC<TowerPortraitProps> = ({
  type,
  size = 64,
  className = '',
}) => {
  switch (type) {
    case 'arrow':
      // Bild 3 Arrow Tower: Armored castle archer/guard with helmet, round shield & weapon in stone parapet
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-arrow-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#2e4235" />
              <stop offset="60%" stopColor="#14231b" />
              <stop offset="100%" stopColor="#08100c" />
            </radialGradient>
            <linearGradient id="tw-arrow-stone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3f4841" />
              <stop offset="50%" stopColor="#5a675e" />
              <stop offset="100%" stopColor="#333b35" />
            </linearGradient>
            <linearGradient id="tw-arrow-steel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="tw-arrow-shield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="50%" stopColor="#4d7c0f" />
              <stop offset="100%" stopColor="#1e3a09" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-arrow-sky)" />
          {/* Distant mountains/skyline */}
          <polygon points="0,50 30,35 65,48 100,38 100,70 0,70" fill="#0d1f15" opacity="0.6" />
          
          {/* Stone Tower Battlement Base */}
          <path d="M12,65 L88,65 L82,100 L18,100 Z" fill="url(#tw-arrow-stone)" stroke="#1a241e" strokeWidth="2" />
          <line x1="35" y1="65" x2="33" y2="100" stroke="#222c24" strokeWidth="1.5" />
          <line x1="65" y1="65" x2="67" y2="100" stroke="#222c24" strokeWidth="1.5" />
          <line x1="15" y1="82" x2="85" y2="82" stroke="#222c24" strokeWidth="1.5" />
          {/* Crenellations */}
          <rect x="12" y="55" width="16" height="12" fill="#4b574f" stroke="#1a241e" strokeWidth="1.5" />
          <rect x="42" y="55" width="16" height="12" fill="#4b574f" stroke="#1a241e" strokeWidth="1.5" />
          <rect x="72" y="55" width="16" height="12" fill="#4b574f" stroke="#1a241e" strokeWidth="1.5" />

          {/* Armored Guardian Soldier */}
          {/* Cloak/Tunic */}
          <path d="M38,36 L62,36 L68,66 L32,66 Z" fill="#166534" />
          {/* Steel Breastplate */}
          <path d="M42,34 L58,34 L62,54 L38,54 Z" fill="url(#tw-arrow-steel)" stroke="#1e293b" strokeWidth="1" />
          {/* Helmet with eye slit */}
          <ellipse cx="50" cy="22" rx="10" ry="12" fill="url(#tw-arrow-steel)" stroke="#1e293b" strokeWidth="1.5" />
          <path d="M44,14 L50,8 L56,14 Z" fill="#b91c1c" /> {/* Red Plume */}
          <rect x="44" y="21" width="12" height="2.5" fill="#0f172a" />
          <rect x="49" y="21" width="2" height="8" fill="#0f172a" />

          {/* Round Wooden/Green Shield with Gold Rim */}
          <circle cx="34" cy="48" r="14" fill="url(#tw-arrow-shield)" stroke="#facc15" strokeWidth="2" />
          <circle cx="34" cy="48" r="4" fill="#facc15" />

          {/* Bow / Longbow in Right Hand */}
          <path d="M66,16 Q78,40 64,64" fill="none" stroke="#78350f" strokeWidth="3" />
          <line x1="66" y1="16" x2="64" y2="64" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="42" y1="42" x2="72" y2="36" stroke="#fef08a" strokeWidth="1.5" />
        </svg>
      );

    case 'cannon':
      // Bild 3 Cannon Tower: Heavy iron siege cannon on wooden carriage with spoked wheels
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-cannon-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#2c2826" />
              <stop offset="60%" stopColor="#191514" />
              <stop offset="100%" stopColor="#080706" />
            </radialGradient>
            <linearGradient id="tw-cannon-iron" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78716c" />
              <stop offset="40%" stopColor="#44403c" />
              <stop offset="80%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#0c0a09" />
            </linearGradient>
            <linearGradient id="tw-cannon-wood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-cannon-sky)" />
          {/* Ground stone cobblestone base */}
          <rect x="0" y="76" width="100" height="24" fill="#1c1917" />
          <line x1="0" y1="76" x2="100" y2="76" stroke="#44403c" strokeWidth="2" />
          
          {/* Wooden Field Carriage Base */}
          <path d="M22,62 L82,62 L74,76 L28,76 Z" fill="url(#tw-cannon-wood)" stroke="#1c1917" strokeWidth="2" />
          {/* Reinforced Bronze Bands */}
          <rect x="36" y="63" width="5" height="12" fill="#d97706" />
          <rect x="64" y="63" width="5" height="12" fill="#d97706" />

          {/* Heavy Iron Cannon Barrel (Angled Left-Upwards) */}
          <g transform="rotate(-15 50 50)">
            <path d="M12,38 L78,44 L75,64 L10,58 Z" fill="url(#tw-cannon-iron)" stroke="#1c1917" strokeWidth="2" />
            {/* Cannon Rings & Muzzle Flange */}
            <ellipse cx="11" cy="48" rx="4" ry="10" fill="#292524" stroke="#a8a29e" strokeWidth="1" />
            <rect x="32" y="40" width="6" height="21" fill="#44403c" stroke="#1c1917" strokeWidth="1" />
            <rect x="52" y="42" width="6" height="21" fill="#44403c" stroke="#1c1917" strokeWidth="1" />
            <ellipse cx="76" cy="54" rx="5" ry="9" fill="#0c0a09" stroke="#78716c" strokeWidth="1.5" />
            <circle cx="80" cy="54" r="3" fill="#d97706" />
          </g>

          {/* Wooden Spoked Wheel (Front) */}
          <circle cx="34" cy="74" r="16" fill="none" stroke="url(#tw-cannon-wood)" strokeWidth="6" />
          <circle cx="34" cy="74" r="17" fill="none" stroke="#1c1917" strokeWidth="2" />
          <circle cx="34" cy="74" r="5" fill="#d97706" stroke="#1c1917" strokeWidth="1.5" />
          <line x1="18" y1="74" x2="50" y2="74" stroke="#451a03" strokeWidth="2" />
          <line x1="34" y1="58" x2="34" y2="90" stroke="#451a03" strokeWidth="2" />
          <line x1="23" y1="63" x2="45" y2="85" stroke="#451a03" strokeWidth="2" />
          <line x1="23" y1="85" x2="45" y2="63" stroke="#451a03" strokeWidth="2" />

          {/* Rear Wheel (Offset) */}
          <circle cx="72" cy="74" r="14" fill="none" stroke="#291e10" strokeWidth="4" />
          <circle cx="72" cy="74" r="4" fill="#78350f" />
        </svg>
      );

    case 'magic':
      // Bild 3 Magic Tower: Arcane stone spire with radiant glowing blue energy orb and magic aura
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-magic-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="50%" stopColor="#031b2e" />
              <stop offset="100%" stopColor="#020912" />
            </radialGradient>
            <radialGradient id="tw-magic-orb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#7dd3fc" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </radialGradient>
            <linearGradient id="tw-magic-spire" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-magic-sky)" />
          
          {/* Ambient Arcane Glow */}
          <circle cx="50" cy="26" r="26" fill="#38bdf8" opacity="0.25" />
          <circle cx="50" cy="26" r="18" fill="#38bdf8" opacity="0.4" />

          {/* Stone Tower Base & Tiers */}
          <path d="M24,96 L76,96 L70,52 L30,52 Z" fill="url(#tw-magic-spire)" stroke="#0284c7" strokeWidth="1.5" />
          {/* Base archway/runic door */}
          <path d="M42,96 L42,75 Q50,68 58,75 L58,96 Z" fill="#021324" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="50" cy="74" r="2" fill="#7dd3fc" />

          {/* Tower Middle Crown / Balcony */}
          <rect x="26" y="50" width="48" height="6" fill="#475569" stroke="#0284c7" strokeWidth="1" />
          <line x1="30" y1="56" x2="30" y2="70" stroke="#0284c7" strokeWidth="1" opacity="0.7" />
          <line x1="70" y1="56" x2="70" y2="70" stroke="#0284c7" strokeWidth="1" opacity="0.7" />

          {/* Top Stone Pillars Holding the Crystal Orb */}
          <path d="M34,50 L38,28 L42,32 L40,50 Z" fill="#334155" stroke="#0ea5e9" strokeWidth="1" />
          <path d="M66,50 L62,28 L58,32 L60,50 Z" fill="#334155" stroke="#0ea5e9" strokeWidth="1" />
          <path d="M48,50 L50,30 L52,50 Z" fill="#1e293b" />

          {/* The Glowing Arcane Mana Sphere */}
          <circle cx="50" cy="25" r="11" fill="url(#tw-magic-orb)" />
          {/* Orbiting Magic Ring */}
          <ellipse cx="50" cy="25" rx="19" ry="6" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Electric energy rays radiating out */}
          <line x1="50" y1="12" x2="50" y2="2" stroke="#e0f2fe" strokeWidth="2" />
          <line x1="36" y1="18" x2="25" y2="8" stroke="#7dd3fc" strokeWidth="1.5" />
          <line x1="64" y1="18" x2="75" y2="8" stroke="#7dd3fc" strokeWidth="1.5" />
        </svg>
      );

    case 'tesla':
      // Bild 3 Tesla Tower: Steampunk lightning tower with coils & electrical lightning arcs
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-tesla-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="tw-tesla-copper" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9a3412" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            <linearGradient id="tw-tesla-metal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-tesla-sky)" />

          {/* Ambient Electric Flash */}
          <circle cx="50" cy="22" r="28" fill="#38bdf8" opacity="0.3" />

          {/* Metal Truss Base */}
          <path d="M22,96 L78,96 L68,68 L32,68 Z" fill="url(#tw-tesla-metal)" stroke="#0284c7" strokeWidth="1.5" />
          <line x1="26" y1="96" x2="68" y2="68" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="74" y1="96" x2="32" y2="68" stroke="#0f172a" strokeWidth="1.5" />

          {/* Central Insulator Mast */}
          <rect x="44" y="34" width="12" height="35" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />

          {/* High-Voltage Copper Inductor Ring Layers */}
          <rect x="36" y="42" width="28" height="5" rx="2" fill="url(#tw-tesla-copper)" stroke="#fdba74" strokeWidth="0.8" />
          <rect x="38" y="50" width="24" height="5" rx="2" fill="url(#tw-tesla-copper)" stroke="#fdba74" strokeWidth="0.8" />
          <rect x="40" y="58" width="20" height="5" rx="2" fill="url(#tw-tesla-copper)" stroke="#fdba74" strokeWidth="0.8" />

          {/* Top Electrostatic Discharge Dome */}
          <circle cx="50" cy="22" r="13" fill="#64748b" stroke="#e0f2fe" strokeWidth="2" />
          <circle cx="50" cy="22" r="9" fill="#93c5fd" />
          <circle cx="50" cy="22" r="5" fill="#ffffff" />

          {/* Crackling High-Voltage Lightning Arcs */}
          <path d="M50,9 L46,2 L52,1" stroke="#ffffff" strokeWidth="2" fill="none" />
          <path d="M40,20 L24,14 L30,22 L14,16" stroke="#38bdf8" strokeWidth="1.8" fill="none" />
          <path d="M60,20 L76,14 L70,22 L86,16" stroke="#38bdf8" strokeWidth="1.8" fill="none" />
          <path d="M44,28 L32,36 L38,38 L26,48" stroke="#bae6fd" strokeWidth="1.5" fill="none" />
          <path d="M56,28 L68,36 L62,38 L74,48" stroke="#bae6fd" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'mortar':
      // Bild 3 Mortar Tower: Heavy angled cast-iron mortar barrel on wooden/stone bed
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-mortar-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#3b1515" />
              <stop offset="60%" stopColor="#1c0b0b" />
              <stop offset="100%" stopColor="#080404" />
            </radialGradient>
            <linearGradient id="tw-mortar-iron" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#57534e" />
              <stop offset="50%" stopColor="#292524" />
              <stop offset="100%" stopColor="#0c0a09" />
            </linearGradient>
            <linearGradient id="tw-mortar-wood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-mortar-sky)" />
          
          {/* Heavy Stone Foundation */}
          <rect x="12" y="75" width="76" height="22" fill="#292524" stroke="#1c1917" strokeWidth="2" />
          <line x1="38" y1="75" x2="38" y2="97" stroke="#1c1917" strokeWidth="1.5" />
          <line x1="62" y1="75" x2="62" y2="97" stroke="#1c1917" strokeWidth="1.5" />

          {/* Heavy Timber A-Frame Elevation Struts */}
          <path d="M22,75 L45,46 L53,46 L76,75 Z" fill="url(#tw-mortar-wood)" stroke="#1c1917" strokeWidth="2" />
          <circle cx="50" cy="54" r="6" fill="#d97706" stroke="#1c1917" strokeWidth="1.5" />

          {/* Steeper Angled Heavy Mortar Barrel */}
          <g transform="rotate(-32 50 55)">
            <path d="M34,22 L66,22 L60,68 L40,68 Z" fill="url(#tw-mortar-iron)" stroke="#1c1917" strokeWidth="2" />
            {/* Thick Muzzle Reinforcement Rim */}
            <ellipse cx="50" cy="22" rx="17" ry="7" fill="#1c1917" stroke="#a8a29e" strokeWidth="1.5" />
            <ellipse cx="50" cy="22" rx="12" ry="4" fill="#000000" />
            <rect x="36" y="38" width="28" height="6" fill="#44403c" stroke="#1c1917" strokeWidth="1" />
          </g>

          {/* Ready Explosive Shell on ground */}
          <circle cx="78" cy="72" r="7" fill="#1c1917" stroke="#dc2626" strokeWidth="1.5" />
          <circle cx="78" cy="72" r="3" fill="#f87171" />
          <path d="M78,65 Q82,60 84,62" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      );

    case 'ice':
      // Bild 3 Ice Tower: Glowing translucent crystalline spire on frosty stone dais
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-ice-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#083344" />
              <stop offset="60%" stopColor="#041f2b" />
              <stop offset="100%" stopColor="#020d12" />
            </radialGradient>
            <linearGradient id="tw-ice-crystal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ecfeff" />
              <stop offset="30%" stopColor="#a5f3fc" />
              <stop offset="70%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
            <linearGradient id="tw-ice-pedestal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#155e75" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-ice-sky)" />

          {/* Ambient Frost Aura */}
          <circle cx="50" cy="40" r="32" fill="#22d3ee" opacity="0.25" />

          {/* Frost Pedestal Base */}
          <path d="M18,96 L82,96 L74,78 L26,78 Z" fill="url(#tw-ice-pedestal)" stroke="#a5f3fc" strokeWidth="1.5" />
          <rect x="28" y="74" width="44" height="6" fill="#0e7490" stroke="#67e8f9" strokeWidth="1" />

          {/* Central Main Crystal Spire */}
          <polygon points="50,8 36,46 50,74 64,46" fill="url(#tw-ice-crystal)" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="50" y1="8" x2="50" y2="74" stroke="#ffffff" strokeWidth="1" opacity="0.8" />

          {/* Left Flanking Shard */}
          <polygon points="34,26 20,62 36,74 44,52" fill="#0891b2" stroke="#a5f3fc" strokeWidth="1.5" />
          <polygon points="34,26 26,56 36,74" fill="#06b6d4" opacity="0.7" />

          {/* Right Flanking Shard */}
          <polygon points="66,26 80,62 64,74 56,52" fill="#0891b2" stroke="#a5f3fc" strokeWidth="1.5" />
          <polygon points="66,26 74,56 64,74" fill="#22d3ee" opacity="0.7" />

          {/* Sparkles / Frost Glints */}
          <polygon points="50,14 52,18 56,20 52,22 50,26 48,22 44,20 48,18" fill="#ffffff" />
          <polygon points="28,38 29,41 32,42 29,43 28,46 27,43 24,42 27,41" fill="#cffafe" />
          <polygon points="72,38 73,41 76,42 73,43 72,46 71,43 68,42 71,41" fill="#cffafe" />
        </svg>
      );

    case 'ballista':
      // Bild 3 Ballista Tower: Wooden siege crossbow mounted on timber tripod with heavy bolt
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-ballista-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#302014" />
              <stop offset="60%" stopColor="#1a110a" />
              <stop offset="100%" stopColor="#0a0604" />
            </radialGradient>
            <linearGradient id="tw-ballista-wood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="tw-ballista-bronze" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-ballista-sky)" />

          {/* Stone Plinth */}
          <rect x="15" y="85" width="70" height="13" fill="#1c1917" stroke="#44403c" strokeWidth="1.5" />

          {/* Heavy Timber Tripod Support Legs */}
          <line x1="26" y1="86" x2="50" y2="52" stroke="url(#tw-ballista-wood)" strokeWidth="6" strokeLinecap="round" />
          <line x1="74" y1="86" x2="50" y2="52" stroke="url(#tw-ballista-wood)" strokeWidth="6" strokeLinecap="round" />
          <line x1="50" y1="86" x2="50" y2="52" stroke="#451a03" strokeWidth="4" />

          {/* Swivel Pivot & Crank Mechanism */}
          <circle cx="50" cy="50" r="7" fill="url(#tw-ballista-bronze)" stroke="#1c1917" strokeWidth="1.5" />
          {/* Main Launch Rail / Trough */}
          <rect x="44" y="24" width="12" height="34" fill="#451a03" stroke="#1c1917" strokeWidth="1.5" />

          {/* Powerful Laminated Wooden Bow Arms (Horizontal Arc) */}
          <path d="M12,42 Q50,30 88,42" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
          <path d="M12,42 Q50,30 88,42" fill="none" stroke="#d97706" strokeWidth="1.5" />
          {/* Bronze Bowtips */}
          <circle cx="12" cy="42" r="3" fill="#f59e0b" />
          <circle cx="88" cy="42" r="3" fill="#f59e0b" />

          {/* Taut Double Bowstring */}
          <line x1="12" y1="42" x2="50" y2="52" stroke="#fef08a" strokeWidth="1.8" />
          <line x1="88" y1="42" x2="50" y2="52" stroke="#fef08a" strokeWidth="1.8" />

          {/* Heavy Harpoon / Steel Siege Bolt Loaded */}
          <line x1="50" y1="14" x2="50" y2="52" stroke="#e2e8f0" strokeWidth="3" />
          <polygon points="50,8 45,18 55,18" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" />
          {/* Bolt Fletching */}
          <polygon points="47,46 44,52 50,50" fill="#dc2626" />
          <polygon points="53,46 56,52 50,50" fill="#dc2626" />
        </svg>
      );

    case 'bombard':
      // Bild 3 Bombard Tower: Massive fortified bronze/stone siege bombard cannon
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-bombard-sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#3d1212" />
              <stop offset="60%" stopColor="#1e0707" />
              <stop offset="100%" stopColor="#080202" />
            </radialGradient>
            <linearGradient id="tw-bombard-bronze" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="35%" stopColor="#d97706" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="tw-bombard-stone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-bombard-sky)" />

          {/* Heavy Bastion Parapet Base with Battlements */}
          <path d="M12,96 L88,96 L82,68 L18,68 Z" fill="url(#tw-bombard-stone)" stroke="#0f172a" strokeWidth="2" />
          <line x1="34" y1="68" x2="32" y2="96" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="66" y1="68" x2="68" y2="96" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="30" cy="82" r="4" fill="#0f172a" />
          <circle cx="70" cy="82" r="4" fill="#0f172a" />

          {/* Heavy Reinforced Iron Mount Bed */}
          <rect x="24" y="60" width="52" height="12" fill="#1c1917" stroke="#78350f" strokeWidth="1.5" />

          {/* Massive Wide-Mouthed Bronze Bombard Barrel */}
          <path d="M26,30 L74,30 L68,64 L32,64 Z" fill="url(#tw-bombard-bronze)" stroke="#1c1917" strokeWidth="2.5" />
          {/* Iron Strengthening Rings */}
          <rect x="29" y="42" width="42" height="5" fill="#1c1917" stroke="#92400e" strokeWidth="1" />
          <rect x="31" y="52" width="38" height="5" fill="#1c1917" stroke="#92400e" strokeWidth="1" />
          
          {/* Wide Muzzle Rim */}
          <ellipse cx="50" cy="30" rx="26" ry="10" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
          {/* Dark Gunpowder Cavity */}
          <ellipse cx="50" cy="30" rx="20" ry="7" fill="#0c0a09" />
          <circle cx="50" cy="30" r="4" fill="#ea580c" opacity="0.8" />

          {/* Ready Massive Stone Cannonball Stack on the Left */}
          <circle cx="16" cy="62" r="6" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="23" cy="62" r="6" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="19" cy="53" r="5.5" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );
  }
};


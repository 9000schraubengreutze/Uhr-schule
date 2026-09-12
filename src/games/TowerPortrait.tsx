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
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-arrow-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-arrow-bg)" />
          {/* Stone Tower Base */}
          <rect x="25" y="45" width="50" height="50" fill="#475569" stroke="#1e293b" strokeWidth="2" />
          <rect x="20" y="38" width="60" height="10" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          {/* Battlements */}
          <rect x="22" y="28" width="12" height="10" fill="#334155" />
          <rect x="44" y="28" width="12" height="10" fill="#334155" />
          <rect x="66" y="28" width="12" height="10" fill="#334155" />
          {/* Archer Guardian with Bow */}
          <circle cx="50" cy="22" r="7" fill="#65a30d" />
          <path d="M42,29 L58,29 L55,42 L45,42 Z" fill="#15803d" />
          <path d="M62,12 Q75,28 62,44" fill="none" stroke="#b45309" strokeWidth="2.5" />
          <line x1="62" y1="12" x2="48" y2="28" stroke="#fef08a" strokeWidth="1" />
          <line x1="62" y1="44" x2="48" y2="28" stroke="#fef08a" strokeWidth="1" />
          <line x1="45" y1="28" x2="72" y2="28" stroke="#f8fafc" strokeWidth="1.5" />
          <polygon points="72,26 77,28 72,30" fill="#38bdf8" />
        </svg>
      );

    case 'cannon':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-cannon-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#292524" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-cannon-bg)" />
          {/* Heavy Field Cannon Carriage */}
          <circle cx="34" cy="74" r="14" fill="#78350f" stroke="#1c1917" strokeWidth="2.5" />
          <circle cx="70" cy="74" r="14" fill="#78350f" stroke="#1c1917" strokeWidth="2.5" />
          <circle cx="34" cy="74" r="4" fill="#d6d3d1" />
          <circle cx="70" cy="74" r="4" fill="#d6d3d1" />
          <path d="M25,62 L78,62 L70,72 L32,72 Z" fill="#451a03" stroke="#1c1917" strokeWidth="2" />
          {/* Iron Cannon Barrel aiming upward left */}
          <path d="M18,34 L76,50 L72,66 L12,48 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" />
          <rect x="8" y="32" width="10" height="18" fill="#7f1d1d" stroke="#1c1917" strokeWidth="1" />
          <rect x="36" y="38" width="5" height="22" fill="#d97706" />
          <rect x="54" y="44" width="5" height="22" fill="#d97706" />
        </svg>
      );

    case 'magic':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-magic-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-magic-bg)" />
          {/* Blue Magic Tower Spire */}
          <polygon points="50,15 25,85 75,85" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
          <rect x="35" y="55" width="30" height="35" fill="#082f49" stroke="#0284c7" strokeWidth="1.5" />
          {/* Glowing Arcane Mana Sphere at top */}
          <circle cx="50" cy="22" r="12" fill="#38bdf8" opacity="0.3" />
          <circle cx="50" cy="22" r="8" fill="#7dd3fc" />
          <circle cx="50" cy="22" r="4" fill="#ffffff" />
          {/* Energy rings */}
          <ellipse cx="50" cy="22" rx="15" ry="5" fill="none" stroke="#bae6fd" strokeWidth="1.5" />
        </svg>
      );

    case 'tesla':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-tesla-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-tesla-bg)" />
          {/* Tesla Coil Column */}
          <rect x="42" y="35" width="16" height="50" fill="#334155" stroke="#64748b" strokeWidth="2" />
          {/* Horizontal Coils */}
          <rect x="36" y="44" width="28" height="4" fill="#0284c7" />
          <rect x="36" y="54" width="28" height="4" fill="#0284c7" />
          <rect x="36" y="64" width="28" height="4" fill="#0284c7" />
          {/* Top Sphere with Lightning Bolts */}
          <circle cx="50" cy="25" r="10" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
          <path d="M50,15 L46,2 L52,2 L48,15" stroke="#fef08a" strokeWidth="2" fill="none" />
          <path d="M40,25 L24,18 L32,28" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
          <path d="M60,25 L76,18 L68,28" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'mortar':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-mortar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3f1414" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-mortar-bg)" />
          {/* Heavy Base Bed */}
          <rect x="20" y="68" width="60" height="18" fill="#292524" stroke="#1c1917" strokeWidth="2" />
          {/* Heavy Mortar Tube tilted upward */}
          <path d="M38,30 L62,30 L56,70 L44,70 Z" fill="#1c1917" stroke="#78716c" strokeWidth="2" />
          <ellipse cx="50" cy="30" rx="14" ry="6" fill="#450a0a" stroke="#b91c1c" strokeWidth="2" />
          <circle cx="50" cy="30" r="4" fill="#ef4444" />
        </svg>
      );

    case 'ice':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-ice-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#164e63" />
              <stop offset="100%" stopColor="#082f49" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-ice-bg)" />
          {/* Ice Crystal Shards */}
          <polygon points="50,12 36,55 50,75 64,55" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="2" />
          <polygon points="34,35 22,68 38,78 44,58" fill="#0891b2" stroke="#67e8f9" strokeWidth="1.5" />
          <polygon points="66,35 78,68 62,78 56,58" fill="#0891b2" stroke="#67e8f9" strokeWidth="1.5" />
          {/* Frost Pedestal */}
          <rect x="28" y="75" width="44" height="14" fill="#0e7490" stroke="#155e75" strokeWidth="2" />
        </svg>
      );

    case 'ballista':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-ballista-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b2512" />
              <stop offset="100%" stopColor="#1c1917" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-ballista-bg)" />
          {/* Wooden Tripod & Frame */}
          <line x1="30" y1="85" x2="50" y2="50" stroke="#78350f" strokeWidth="4" />
          <line x1="70" y1="85" x2="50" y2="50" stroke="#78350f" strokeWidth="4" />
          <rect x="44" y="38" width="12" height="25" fill="#451a03" />
          {/* Horizontal Bow Arms */}
          <path d="M15,46 Q50,38 85,46" fill="none" stroke="#b45309" strokeWidth="4" />
          <line x1="15" y1="46" x2="50" y2="55" stroke="#fde047" strokeWidth="1.5" />
          <line x1="85" y1="46" x2="50" y2="55" stroke="#fde047" strokeWidth="1.5" />
          {/* Loaded Bolt */}
          <line x1="50" y1="30" x2="50" y2="58" stroke="#f8fafc" strokeWidth="2.5" />
          <polygon points="50,26 47,32 53,32" fill="#94a3b8" />
        </svg>
      );

    case 'bombard':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 overflow-hidden ${className}`}>
          <defs>
            <radialGradient id="tw-bombard-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#1c1917" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#tw-bombard-bg)" />
          {/* Massive Fortified Bombard */}
          <rect x="20" y="65" width="60" height="22" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="35" cy="76" r="8" fill="#1e293b" />
          <circle cx="65" cy="76" r="8" fill="#1e293b" />
          {/* Huge Bronze Mortar Crown */}
          <path d="M22,36 L78,36 L70,65 L30,65 Z" fill="#7f1d1d" stroke="#b91c1c" strokeWidth="2.5" />
          <ellipse cx="50" cy="36" rx="28" ry="10" fill="#1c1917" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="50" cy="36" r="6" fill="#ea580c" />
        </svg>
      );
  }
};

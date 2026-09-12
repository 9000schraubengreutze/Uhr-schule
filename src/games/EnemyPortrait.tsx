import React from 'react';

export interface EnemyPortraitProps {
  kind: 'orc_warrior' | 'orc_archer' | 'orc_brute' | 'spiderling' | 'wolf_rider' | 'siege_cannon';
  className?: string;
  size?: number;
  showBadge?: boolean;
}

export const EnemyPortrait: React.FC<EnemyPortraitProps> = ({
  kind,
  className = '',
  size = 64,
}) => {
  switch (kind) {
    case 'orc_warrior':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 overflow-hidden ${className}`}
        >
          <defs>
            <radialGradient id="ow-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c1917" />
            </radialGradient>
            <linearGradient id="ow-skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#65a30d" />
              <stop offset="100%" stopColor="#3f6212" />
            </linearGradient>
            <linearGradient id="ow-armor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#78716c" />
              <stop offset="100%" stopColor="#292524" />
            </linearGradient>
          </defs>
          {/* Background */}
          <rect width="100" height="100" fill="url(#ow-bg)" />
          {/* Torso & Armor */}
          <path d="M15,100 L30,65 L70,65 L85,100 Z" fill="#292524" />
          <path d="M25,68 L38,62 L62,62 L75,68 L70,95 L30,95 Z" fill="url(#ow-armor)" stroke="#1c1917" strokeWidth="2" />
          {/* Spiked Pauldron (Right Shoulder) */}
          <path d="M68,60 L92,54 L88,78 L65,72 Z" fill="#44403c" stroke="#1c1917" strokeWidth="2" />
          <polygon points="80,50 86,34 88,52" fill="#d6d3d1" stroke="#292524" strokeWidth="1.5" />
          <polygon points="90,56 98,42 94,60" fill="#d6d3d1" stroke="#292524" strokeWidth="1.5" />
          {/* Spiked Club / Bone Weapon held in hand */}
          <path d="M12,40 L30,58 L24,64 L6,46 Z" fill="#78350f" />
          <circle cx="10" cy="42" r="10" fill="#57534e" />
          <polygon points="4,36 0,26 8,34" fill="#f5f5f4" />
          <polygon points="12,32 16,20 18,34" fill="#f5f5f4" />
          <polygon points="16,44 26,42 16,48" fill="#f5f5f4" />
          {/* Neck */}
          <rect x="40" y="50" width="20" height="18" fill="#4d7c0f" />
          {/* Orc Head & Jaw */}
          <path
            d="M32,28 C30,12 70,12 68,28 C74,38 72,56 64,58 C56,62 44,62 36,58 C28,56 26,38 32,28 Z"
            fill="url(#ow-skin)"
            stroke="#14532d"
            strokeWidth="2"
          />
          {/* Pointed Orc Ears */}
          <polygon points="30,34 16,26 28,42" fill="#65a30d" stroke="#14532d" strokeWidth="1.5" />
          <polygon points="70,34 84,26 72,42" fill="#65a30d" stroke="#14532d" strokeWidth="1.5" />
          {/* Brow & Fiery Eyes */}
          <path d="M36,30 L48,34 L52,34 L64,30" stroke="#14532d" strokeWidth="3" fill="none" />
          <circle cx="42" cy="34" r="3.5" fill="#dc2626" />
          <circle cx="42" cy="34" r="1.5" fill="#fef08a" />
          <circle cx="58" cy="34" r="3.5" fill="#dc2626" />
          <circle cx="58" cy="34" r="1.5" fill="#fef08a" />
          {/* Broad Nose */}
          <polygon points="47,38 53,38 50,44" fill="#3f6212" />
          {/* Snarl Mouth & Protruding White Tusks */}
          <path d="M38,48 Q50,56 62,48 Q50,52 38,48 Z" fill="#1c1917" />
          <polygon points="42,52 45,42 47,52" fill="#f5f5f4" stroke="#44403c" strokeWidth="0.5" />
          <polygon points="53,52 55,42 58,52" fill="#f5f5f4" stroke="#44403c" strokeWidth="0.5" />
          {/* Battle Scars */}
          <line x1="38" y1="24" x2="46" y2="28" stroke="#991b1b" strokeWidth="1.5" />
        </svg>
      );

    case 'orc_archer':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 overflow-hidden ${className}`}
        >
          <defs>
            <radialGradient id="oa-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#oa-bg)" />
          {/* Leather Cap & Body */}
          <path d="M20,100 L32,68 L68,68 L80,100 Z" fill="#451a03" />
          <circle cx="50" cy="45" r="22" fill="#65a30d" stroke="#166534" strokeWidth="2" />
          <path d="M30,38 Q50,15 70,38 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          {/* Longbow drawn */}
          <path d="M68,20 Q88,50 68,80" fill="none" stroke="#d97706" strokeWidth="3" />
          <line x1="68" y1="20" x2="45" y2="50" stroke="#fef08a" strokeWidth="1" />
          <line x1="68" y1="80" x2="45" y2="50" stroke="#fef08a" strokeWidth="1" />
          <line x1="40" y1="50" x2="75" y2="50" stroke="#f8fafc" strokeWidth="2" />
          <polygon points="75,48 83,50 75,52" fill="#94a3b8" />
          {/* Glowing Green Archer Eye */}
          <circle cx="44" cy="42" r="3" fill="#facc15" />
          <circle cx="56" cy="42" r="3" fill="#facc15" />
          {/* Tusks */}
          <polygon points="46,55 48,47 50,55" fill="#f5f5f4" />
          <polygon points="52,55 54,47 56,55" fill="#f5f5f4" />
        </svg>
      );

    case 'orc_brute':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 overflow-hidden ${className}`}
        >
          <defs>
            <radialGradient id="ob-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#1c1917" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#ob-bg)" />
          {/* Massive Shoulders & Spikes */}
          <path d="M5,100 L20,50 L80,50 L95,100 Z" fill="#57534e" />
          <polygon points="12,48 18,22 26,48" fill="#d6d3d1" stroke="#292524" strokeWidth="1.5" />
          <polygon points="74,48 82,22 88,48" fill="#d6d3d1" stroke="#292524" strokeWidth="1.5" />
          {/* Huge Head */}
          <ellipse cx="50" cy="52" rx="26" ry="24" fill="#a16207" stroke="#451a03" strokeWidth="2.5" />
          <rect x="36" y="38" width="28" height="6" fill="#292524" />
          {/* Brutish Glowing Red Eyes */}
          <circle cx="42" cy="45" r="4" fill="#ef4444" />
          <circle cx="58" cy="45" r="4" fill="#ef4444" />
          {/* Massive Underbite & Huge Tusks */}
          <path d="M34,60 Q50,72 66,60 Z" fill="#292524" />
          <polygon points="38,68 42,50 46,68" fill="#f5f5f4" stroke="#44403c" strokeWidth="1" />
          <polygon points="54,68 58,50 62,68" fill="#f5f5f4" stroke="#44403c" strokeWidth="1" />
        </svg>
      );

    case 'spiderling':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 overflow-hidden ${className}`}
        >
          <defs>
            <radialGradient id="sp-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#sp-bg)" />
          {/* Multiple Spidery Jointed Legs */}
          <g stroke="#818cf8" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M35,45 L15,30 L5,50" />
            <path d="M35,50 L10,50 L2,65" />
            <path d="M35,55 L12,70 L5,85" />
            <path d="M65,45 L85,30 L95,50" />
            <path d="M65,50 L90,50 L98,65" />
            <path d="M65,55 L88,70 L95,85" />
          </g>
          {/* Abdomen & Cephalothorax */}
          <ellipse cx="50" cy="42" rx="14" ry="12" fill="#18181b" stroke="#6366f1" strokeWidth="2" />
          <ellipse cx="50" cy="62" rx="18" ry="16" fill="#09090b" stroke="#4f46e5" strokeWidth="2" />
          {/* Cluster of Glowing Red Spider Eyes */}
          <circle cx="45" cy="38" r="2.5" fill="#ef4444" />
          <circle cx="55" cy="38" r="2.5" fill="#ef4444" />
          <circle cx="48" cy="42" r="1.8" fill="#f87171" />
          <circle cx="52" cy="42" r="1.8" fill="#f87171" />
          {/* Fangs */}
          <polygon points="46,47 48,54 49,47" fill="#f5f5f4" />
          <polygon points="51,47 52,54 54,47" fill="#f5f5f4" />
        </svg>
      );

    case 'wolf_rider':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 overflow-hidden ${className}`}
        >
          <defs>
            <radialGradient id="wr-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#wr-bg)" />
          {/* Wolf Body & Fur */}
          <ellipse cx="50" cy="68" rx="28" ry="18" fill="#475569" stroke="#1e293b" strokeWidth="2" />
          {/* Wolf Head */}
          <path d="M22,70 L40,55 L40,78 Z" fill="#64748b" />
          <polygon points="34,55 30,42 38,52" fill="#334155" />
          <circle cx="32" cy="62" r="2.5" fill="#eab308" />
          {/* Wolf Fangs */}
          <polygon points="24,72 22,78 26,73" fill="#f8fafc" />
          {/* Orc Rider mounted on back */}
          <circle cx="58" cy="40" r="12" fill="#65a30d" stroke="#14532d" strokeWidth="1.5" />
          <polygon points="52,38 50,30 55,36" fill="#65a30d" />
          <polygon points="64,38 66,30 61,36" fill="#65a30d" />
          <circle cx="55" cy="40" r="1.8" fill="#dc2626" />
          <circle cx="61" cy="40" r="1.8" fill="#dc2626" />
          {/* Spear in Rider's hand */}
          <line x1="45" y1="20" x2="75" y2="70" stroke="#78350f" strokeWidth="2.5" />
          <polygon points="45,20 40,12 48,18" fill="#94a3b8" />
        </svg>
      );

    case 'siege_cannon':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 overflow-hidden ${className}`}
        >
          <defs>
            <radialGradient id="sc-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#sc-bg)" />
          {/* Wood Carriage Wheels with Metal Spikes */}
          <circle cx="35" cy="72" r="16" fill="#78350f" stroke="#1c1917" strokeWidth="3" />
          <circle cx="35" cy="72" r="5" fill="#44403c" />
          <circle cx="72" cy="72" r="16" fill="#78350f" stroke="#1c1917" strokeWidth="3" />
          <circle cx="72" cy="72" r="5" fill="#44403c" />
          {/* Spiked Timber Chassis */}
          <rect x="22" y="58" width="60" height="14" fill="#451a03" stroke="#1c1917" strokeWidth="2" />
          {/* Cast Iron Cannon Barrel pointing forward left */}
          <path d="M12,40 L65,34 L68,52 L15,48 Z" fill="#292524" stroke="#0c0a09" strokeWidth="2" />
          <rect x="8" y="38" width="6" height="12" fill="#7f1d1d" stroke="#1c1917" strokeWidth="1" />
          <rect x="30" y="36" width="4" height="15" fill="#b45309" />
          <rect x="48" y="35" width="4" height="16" fill="#b45309" />
          {/* Fuse / Smoke */}
          <circle cx="68" cy="38" r="3" fill="#ea580c" />
        </svg>
      );
  }
};

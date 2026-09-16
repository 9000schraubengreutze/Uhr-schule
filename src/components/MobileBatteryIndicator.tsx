import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Battery, BatteryCharging, BatteryWarning, Info } from 'lucide-react';

interface MobileBatteryIndicatorProps {
  isFullscreen: boolean;
  enabled?: boolean;
  backdropBlur?: number;
  isZenMode?: boolean;
}

interface BatteryState {
  level: number; // 0.0 to 1.0
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
  isNative: boolean;
}

export const MobileBatteryIndicator: React.FC<MobileBatteryIndicatorProps> = ({
  isFullscreen,
  enabled = true,
  backdropBlur = 16,
  isZenMode = false,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [batteryState, setBatteryState] = useState<BatteryState>({
    level: 0.85,
    charging: false,
    isNative: false,
  });
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile viewport or touch device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth <= 768;
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      
      setIsMobile(isMobileWidth || hasTouch);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const mql = window.matchMedia('(max-width: 768px)');
    const handleMqlChange = () => checkMobile();
    if (mql.addEventListener) {
      mql.addEventListener('change', handleMqlChange);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleMqlChange);
      }
    };
  }, []);

  // Connect to the Web Battery Status API (Chromium / Android Chrome / supported mobile browsers)
  useEffect(() => {
    let batteryInstance: any = null;
    let isCancelled = false;

    const updateBattery = (battery: any) => {
      if (isCancelled) return;
      setBatteryState({
        level: typeof battery.level === 'number' ? battery.level : 0.85,
        charging: Boolean(battery.charging),
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        isNative: true,
      });
    };

    const nav = navigator as any;
    if (typeof nav !== 'undefined' && 'getBattery' in nav && typeof nav.getBattery === 'function') {
      nav.getBattery()
        .then((battery: any) => {
          if (isCancelled) return;
          batteryInstance = battery;
          updateBattery(battery);

          battery.addEventListener('levelchange', () => updateBattery(battery));
          battery.addEventListener('chargingchange', () => updateBattery(battery));
        })
        .catch((err: any) => {
          console.debug('Battery API not permitted or unavailable:', err);
          // Fallback to simulated state
          setBatteryState((prev) => ({ ...prev, isNative: false }));
        });
    } else {
      // Browser does not expose Battery API (e.g. iOS Safari)
      setBatteryState((prev) => ({ ...prev, isNative: false }));
    }

    return () => {
      isCancelled = true;
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange', () => updateBattery(batteryInstance));
          batteryInstance.removeEventListener('chargingchange', () => updateBattery(batteryInstance));
        } catch {}
      }
    };
  }, []);

  const percentage = Math.round(batteryState.level * 100);

  // Color scheme based on charge level and charging status
  const isCharging = batteryState.charging;
  const isLow = percentage <= 20;
  const isCritical = percentage <= 10;

  // Determine fill color
  const getFillColor = () => {
    if (isCharging) return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
    if (isCritical) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
    if (isLow) return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
    return 'bg-emerald-400/90';
  };

  const getTextColor = () => {
    if (isCharging) return 'text-emerald-300';
    if (isCritical) return 'text-rose-400';
    if (isLow) return 'text-amber-300';
    return 'text-slate-300';
  };

  const handleToggleTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip((prev) => !prev);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 4500);
  };

  // Condition: For mobile devices that appears when the user is not in fullscreen mode
  const shouldShow = enabled && isMobile && !isFullscreen && !isZenMode;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          id="mobile-battery-indicator"
          initial={{ opacity: 0, scale: 0.9, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-auto select-none"
        >
          {/* Subtle frosted glass pill */}
          <button
            type="button"
            onClick={handleToggleTooltip}
            title={`Akkustand: ${percentage}%${isCharging ? ' (Wird geladen)' : ''} – Klicken für Details`}
            aria-label={`Akkustand: ${percentage}%${isCharging ? ', Ladevorgang aktiv' : ''}`}
            style={{
              backdropFilter: `blur(${backdropBlur}px)`,
              WebkitBackdropFilter: `blur(${backdropBlur}px)`,
            }}
            className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-lg transition-all duration-200 cursor-pointer active:scale-95 ${
              isCritical
                ? 'bg-rose-950/45 border-rose-500/40 text-rose-200 shadow-rose-950/30'
                : isCharging
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200 shadow-emerald-950/30'
                : 'bg-slate-950/45 hover:bg-slate-900/60 border-white/10 text-slate-300 shadow-black/40'
            }`}
          >
            {/* Battery icon container */}
            <div className="relative flex items-center">
              {/* Outer shell */}
              <div
                className={`w-[19px] h-[10px] rounded-[3px] border p-[1.5px] flex items-center transition-colors ${
                  isCritical
                    ? 'border-rose-400'
                    : isCharging
                    ? 'border-emerald-400'
                    : isLow
                    ? 'border-amber-400'
                    : 'border-slate-400/80 group-hover:border-slate-300'
                }`}
              >
                {/* Level fill bar */}
                <div
                  className={`h-full rounded-[1px] transition-all duration-500 ${getFillColor()}`}
                  style={{ width: `${Math.max(8, Math.min(100, percentage))}%` }}
                />
              </div>
              {/* Battery positive nub */}
              <div
                className={`w-[2px] h-[4px] rounded-r-[1px] -ml-[0.5px] transition-colors ${
                  isCritical
                    ? 'bg-rose-400'
                    : isCharging
                    ? 'bg-emerald-400'
                    : isLow
                    ? 'bg-amber-400'
                    : 'bg-slate-400/80 group-hover:bg-slate-300'
                }`}
              />

              {/* Charging lightning badge */}
              {isCharging && (
                <div className="absolute inset-0 flex items-center justify-center -left-[1px]">
                  <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300 filter drop-shadow-[0_0_3px_rgba(251,191,36,0.8)] animate-pulse" />
                </div>
              )}
            </div>

            {/* Percentage text */}
            <span className={`text-[11px] font-medium tracking-tight tabular-numbers ${getTextColor()}`}>
              {percentage}%
            </span>
          </button>

          {/* Micro-popup details card on tap */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backdropFilter: `blur(${Math.max(16, backdropBlur)}px)`,
                  WebkitBackdropFilter: `blur(${Math.max(16, backdropBlur)}px)`,
                }}
                className="absolute top-full left-0 mt-2 w-52 p-3 rounded-2xl bg-slate-950/85 border border-white/15 text-slate-200 shadow-2xl z-50 text-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    {isCharging ? (
                      <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    ) : isLow ? (
                      <BatteryWarning className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Battery className="w-4 h-4 text-slate-300" />
                    )}
                    Akku-Status
                  </span>
                  <span className={`font-mono font-bold ${getTextColor()}`}>
                    {percentage}%
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Modus:</span>
                    <span className="font-medium text-slate-200">
                      {isCharging ? 'Wird geladen ⚡' : 'Akkubetrieb'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-slate-300">
                      {batteryState.isNative ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live-Hardware
                        </span>
                      ) : (
                        <span className="text-slate-400" title="Safari/WebKit blockiert Akku-Hardwarezugriff zum Datenschutz">
                          Mobil-Aktiv
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-[10px] text-slate-500 border-t border-white/5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Wird im Vollbildmodus automatisch ausgeblendet.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

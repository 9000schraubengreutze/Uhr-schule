import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityScreensaverProps {
  enabled: boolean;
  timeoutMinutes: number;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  ignoreWhenModalOpen?: boolean;
  isModalOpen?: boolean;
}

export function useInactivityScreensaver({
  enabled,
  timeoutMinutes,
  isActive,
  onActivate,
  onDeactivate,
  ignoreWhenModalOpen = false,
  isModalOpen = false,
}: UseInactivityScreensaverProps) {
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();

    if (!enabled) return;
    if (ignoreWhenModalOpen && isModalOpen) return;

    const timeoutMs = Math.max(0.5, timeoutMinutes) * 60 * 1000;

    timeoutIdRef.current = setTimeout(() => {
      onActivate();
    }, timeoutMs);
  }, [enabled, timeoutMinutes, ignoreWhenModalOpen, isModalOpen, onActivate, clearTimer]);

  // Handle user activity to reset or wake
  const handleUserActivity = useCallback(
    (e: Event) => {
      // If mouse move event, filter out micro-jitters
      if (e.type === 'mousemove') {
        const mouseEv = e as MouseEvent;
        if (lastMousePosRef.current) {
          const dx = Math.abs(mouseEv.clientX - lastMousePosRef.current.x);
          const dy = Math.abs(mouseEv.clientY - lastMousePosRef.current.y);
          // If moved less than 5 pixels, ignore (optical mouse noise on mousepad)
          if (dx < 5 && dy < 5) {
            return;
          }
        }
        lastMousePosRef.current = { x: mouseEv.clientX, y: mouseEv.clientY };
      }

      if (isActive) {
        // We are currently asleep -> wake up!
        onDeactivate();
      }

      // Reset inactivity timer
      resetTimer();
    },
    [isActive, onDeactivate, resetTimer]
  );

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    resetTimer();

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'pointerdown',
      'wheel',
      'scroll',
    ];

    const listener = (e: Event) => handleUserActivity(e);

    events.forEach((ev) => {
      window.addEventListener(ev, listener, { passive: true });
    });

    return () => {
      clearTimer();
      events.forEach((ev) => {
        window.removeEventListener(ev, listener);
      });
    };
  }, [enabled, timeoutMinutes, isModalOpen, handleUserActivity, resetTimer, clearTimer]);

  return {
    resetTimer,
    clearTimer,
  };
}

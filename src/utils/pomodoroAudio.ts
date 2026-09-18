// Web Audio synthesis and notification integration for Pomodoro work timer
// Integrates with Zen mode to silence sound & notifications when active

import { PomodoroSoundType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
  Plays a synthesized audio chime for Pomodoro phase transitions.
  Strictly silences the audio if Zen mode is active and silenceInZenMode is enabled.
 */
export function playPomodoroAlert(
  soundType: PomodoroSoundType = 'chime',
  volume = 0.7,
  isZenMode = false,
  silenceInZenMode = true
): { played: boolean; silencedByZen: boolean } {
  // Check Zen Mode Silencing
  if (isZenMode && silenceInZenMode) {
    return { played: false, silencedByZen: true };
  }

  if (soundType === 'none' || volume <= 0) {
    return { played: false, silencedByZen: false };
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return { played: false, silencedByZen: false };

    const masterGain = ctx.createGain();
    const clampedVolume = Math.max(0.01, Math.min(1.0, volume));
    masterGain.gain.setValueAtTime(clampedVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (soundType) {
      case 'chime': {
        // Melodic 3-tone arpeggio (C5 - E5 - G5 - C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          const startTime = now + idx * 0.12;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          noteGain.gain.setValueAtTime(0.001, startTime);
          noteGain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.03);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 1.3);
        });
        break;
      }

      case 'bell': {
        // Singing bowl / Zen mindfulness bell with harmonic shimmer
        const harmonics = [440, 880, 1320, 1760];
        const weights = [0.4, 0.22, 0.1, 0.05];

        harmonics.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc.type = 'sine';
          // Add slight detune for shimmering acoustic warmth
          osc.frequency.setValueAtTime(freq + (idx === 1 ? 1.5 : 0), now);

          noteGain.gain.setValueAtTime(0.001, now);
          noteGain.gain.exponentialRampToValueAtTime(weights[idx], now + 0.04);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 3.0);
        });
        break;
      }

      case 'gong': {
        // Deep resonant meditation gong with low-pass filter
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 2.5);

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(146.83, now); // D3
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220, now); // A3

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.5, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 3.4);
        osc2.stop(now + 3.4);
        break;
      }

      case 'digital': {
        // Crisp futuristic triple beep
        [0, 0.15, 0.3].forEach((offset) => {
          const osc = ctx.createOscillator();
          const beepGain = ctx.createGain();
          const startTime = now + offset;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, startTime);

          beepGain.gain.setValueAtTime(0.001, startTime);
          beepGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.015);
          beepGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);

          osc.connect(beepGain);
          beepGain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 0.1);
        });
        break;
      }
    }

    return { played: true, silencedByZen: false };
  } catch {
    return { played: false, silencedByZen: false };
  }
}

/**
 * Request notification permissions safely
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Dispatch desktop browser notification if permitted and NOT silenced by Zen mode
 */
export function sendPomodoroNotification(
  title: string,
  body: string,
  isZenMode = false,
  silenceInZenMode = true
): boolean {
  // Strict silence during Zen mode
  if (isZenMode && silenceInZenMode) {
    return false;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'pomodoro-timer',
      });
      return true;
    }
  } catch {
    // Ignore notification error
  }
  return false;
}

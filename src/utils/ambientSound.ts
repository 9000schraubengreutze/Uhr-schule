// Ambient Audio Engine using Web Audio API for WebClock
// Generates soothing, atmospheric background soundscapes in real-time
// without requiring heavy external MP3 downloads.

import { AmbientSoundType } from '../types';

let ambientCtx: AudioContext | null = null;
let activeSoundType: AmbientSoundType = 'none';
let masterGain: GainNode | null = null;
let stopCurrentSound: (() => void) | null = null;

function getAmbientContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ambientCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        ambientCtx = new AudioCtxClass();
      }
    }
    if (ambientCtx && ambientCtx.state === 'suspended') {
      ambientCtx.resume();
    }
    return ambientCtx;
  } catch {
    return null;
  }
}

/**
 * Generate a 5-second mono buffer of white noise
 */
function createNoiseBuffer(ctx: AudioContext, duration = 5): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Generate a 5-second mono buffer of pink noise (1/f)
 */
function createPinkNoiseBuffer(ctx: AudioContext, duration = 5): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

/**
 * Start playing a specific ambient soundscape
 */
export function playAmbientSound(type: AmbientSoundType, volume = 0.35): void {
  // Stop existing sound first
  stopAmbientSound();

  if (type === 'none') {
    activeSoundType = 'none';
    return;
  }

  const ctx = getAmbientContext();
  if (!ctx) return;

  activeSoundType = type;

  // Master Gain for volume & smooth fade-in
  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, Math.min(1.0, volume)), ctx.currentTime + 0.8);
  masterGain.connect(ctx.destination);

  const cleanupTasks: (() => void)[] = [];

  if (type === 'white_noise') {
    // Pure, soft filtered white noise
    const noiseBuffer = createNoiseBuffer(ctx, 4);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    // Gentle lowpass filter to remove harsh highs
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);

    noiseSrc.connect(filter);
    filter.connect(masterGain);
    noiseSrc.start();

    cleanupTasks.push(() => {
      try {
        noiseSrc.stop();
        noiseSrc.disconnect();
      } catch {}
    });
  } else if (type === 'pink_noise') {
    // Warm, deep pink noise (natural relaxation frequency)
    const pinkBuffer = createPinkNoiseBuffer(ctx, 5);
    const pinkSrc = ctx.createBufferSource();
    pinkSrc.buffer = pinkBuffer;
    pinkSrc.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    pinkSrc.connect(filter);
    filter.connect(masterGain);
    pinkSrc.start();

    cleanupTasks.push(() => {
      try {
        pinkSrc.stop();
        pinkSrc.disconnect();
      } catch {}
    });
  } else if (type === 'rain') {
    // Soothing steady rain sound with randomized droplet texture
    const noiseBuffer = createPinkNoiseBuffer(ctx, 5);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    // Filter for distant rain patter
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1100, ctx.currentTime);
    rainFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    // Subtle LFO modulating rain density
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(rainFilter.frequency);
    lfo.start();

    noiseSrc.connect(rainFilter);
    rainFilter.connect(masterGain);
    noiseSrc.start();

    // Occasional gentle water drops
    const dropletInterval = setInterval(() => {
      if (!ambientCtx || activeSoundType !== 'rain') return;
      try {
        const dropOsc = ambientCtx.createOscillator();
        const dropGain = ambientCtx.createGain();
        const freq = 1800 + Math.random() * 800;
        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(freq, ambientCtx.currentTime);
        dropOsc.frequency.exponentialRampToValueAtTime(freq * 0.6, ambientCtx.currentTime + 0.05);

        dropGain.gain.setValueAtTime(0.02 + Math.random() * 0.03, ambientCtx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ambientCtx.currentTime + 0.06);

        dropOsc.connect(dropGain);
        if (masterGain) dropGain.connect(masterGain);

        dropOsc.start(ambientCtx.currentTime);
        dropOsc.stop(ambientCtx.currentTime + 0.07);
      } catch {}
    }, 450);

    cleanupTasks.push(() => {
      clearInterval(dropletInterval);
      try {
        lfo.stop();
        lfo.disconnect();
        noiseSrc.stop();
        noiseSrc.disconnect();
      } catch {}
    });
  } else if (type === 'forest') {
    // Gentle forest canopy wind with delicate, periodic birdsong chimes
    const windBuffer = createPinkNoiseBuffer(ctx, 6);
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = windBuffer;
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(450, ctx.currentTime);

    const windLfo = ctx.createOscillator();
    const windLfoGain = ctx.createGain();
    windLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Slow breeze
    windLfoGain.gain.setValueAtTime(180, ctx.currentTime);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.65, ctx.currentTime);

    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    windSrc.start();

    // Occasional gentle distant bird calls in pentatonic scale
    const birdScale = [2093.0, 2349.32, 2637.02, 3135.96, 3520.0];
    const birdInterval = setInterval(() => {
      if (!ambientCtx || activeSoundType !== 'forest') return;
      if (Math.random() > 0.45) return; // natural pauses

      try {
        const now = ambientCtx.currentTime;
        const noteCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < noteCount; i++) {
          const osc = ambientCtx.createOscillator();
          const gain = ambientCtx.createGain();
          const noteFreq = birdScale[Math.floor(Math.random() * birdScale.length)];
          const startTime = now + i * 0.08 + Math.random() * 0.02;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(noteFreq, startTime);
          osc.frequency.exponentialRampToValueAtTime(noteFreq * (1 + (Math.random() * 0.1 - 0.05)), startTime + 0.07);

          gain.gain.setValueAtTime(0.018 + Math.random() * 0.015, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);

          osc.connect(gain);
          if (masterGain) gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 0.1);
        }
      } catch {}
    }, 2800);

    cleanupTasks.push(() => {
      clearInterval(birdInterval);
      try {
        windLfo.stop();
        windLfo.disconnect();
        windSrc.stop();
        windSrc.disconnect();
      } catch {}
    });
  } else if (type === 'waves') {
    // Calming ocean waves washing ashore with slow rhythmic ebb and flow
    const waveBuffer = createPinkNoiseBuffer(ctx, 7);
    const waveSrc = ctx.createBufferSource();
    waveSrc.buffer = waveBuffer;
    waveSrc.loop = true;

    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(320, ctx.currentTime);

    // 0.09 Hz wave swell (~11s wave cycle)
    const waveLfo = ctx.createOscillator();
    const waveLfoGain = ctx.createGain();
    waveLfo.frequency.setValueAtTime(0.09, ctx.currentTime);
    waveLfoGain.gain.setValueAtTime(380, ctx.currentTime);
    waveLfo.connect(waveLfoGain);
    waveLfoGain.connect(waveFilter.frequency);
    waveLfo.start();

    // Volume modulation for rhythmic swell
    const waveVolumeLfo = ctx.createOscillator();
    const waveVolumeGain = ctx.createGain();
    const waveAmpGain = ctx.createGain();
    waveVolumeLfo.frequency.setValueAtTime(0.09, ctx.currentTime);
    waveVolumeGain.gain.setValueAtTime(0.35, ctx.currentTime);
    waveVolumeLfo.connect(waveVolumeGain);
    waveVolumeGain.connect(waveAmpGain.gain);
    waveAmpGain.gain.setValueAtTime(0.55, ctx.currentTime);
    waveVolumeLfo.start();

    waveSrc.connect(waveFilter);
    waveFilter.connect(waveAmpGain);
    waveAmpGain.connect(masterGain);
    waveSrc.start();

    cleanupTasks.push(() => {
      try {
        waveLfo.stop();
        waveLfo.disconnect();
        waveVolumeLfo.stop();
        waveVolumeLfo.disconnect();
        waveSrc.stop();
        waveSrc.disconnect();
      } catch {}
    });
  } else if (type === 'fireplace') {
    // Cozy warm crackling fireplace with deep warmth and soft embers
    const noiseBuffer = createPinkNoiseBuffer(ctx, 4);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.setValueAtTime(280, ctx.currentTime);

    const fireGain = ctx.createGain();
    fireGain.gain.setValueAtTime(0.5, ctx.currentTime);

    noiseSrc.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(masterGain);
    noiseSrc.start();

    // Random pops and crackles of glowing wood embers
    const crackleInterval = setInterval(() => {
      if (!ambientCtx || activeSoundType !== 'fireplace') return;
      if (Math.random() > 0.6) return;

      try {
        const now = ambientCtx.currentTime;
        const popOsc = ambientCtx.createOscillator();
        const popGain = ambientCtx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(80 + Math.random() * 200, now);

        popGain.gain.setValueAtTime(0.04 + Math.random() * 0.05, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        popOsc.connect(popGain);
        if (masterGain) popGain.connect(masterGain);

        popOsc.start(now);
        popOsc.stop(now + 0.03);
      } catch {}
    }, 180);

    cleanupTasks.push(() => {
      clearInterval(crackleInterval);
      try {
        noiseSrc.stop();
        noiseSrc.disconnect();
      } catch {}
    });
  }

  stopCurrentSound = () => {
    cleanupTasks.forEach((fn) => fn());
    if (masterGain && ctx) {
      try {
        masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        setTimeout(() => {
          try {
            masterGain?.disconnect();
          } catch {}
        }, 450);
      } catch {
        masterGain.disconnect();
      }
    }
  };
}

/**
 * Update the volume of the playing ambient soundscape smoothly
 */
export function setAmbientVolume(volume: number): void {
  if (masterGain && ambientCtx) {
    try {
      const clamped = Math.max(0.0001, Math.min(1.0, volume));
      masterGain.gain.setValueAtTime(masterGain.gain.value, ambientCtx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(clamped, ambientCtx.currentTime + 0.1);
    } catch {}
  }
}

/**
 * Stop currently playing ambient soundscape
 */
export function stopAmbientSound(): void {
  if (stopCurrentSound) {
    stopCurrentSound();
    stopCurrentSound = null;
  }
  activeSoundType = 'none';
}

/**
 * Get current ambient sound type
 */
export function getActiveAmbientSound(): AmbientSoundType {
  return activeSoundType;
}

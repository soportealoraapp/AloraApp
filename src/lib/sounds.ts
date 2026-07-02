'use client';

/**
 * Programmatic sound effects using Web Audio API.
 * No external audio files needed — generates sounds procedurally.
 * Respects prefers-reduced-motion.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Subtle "pop" sound for like actions.
 */
export function playLikeSound() {
  if (isReducedMotion()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

/**
 * Brighter, more impactful sound for flechado/superlike.
 */
export function playFlechadoSound() {
  if (isReducedMotion()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Two layered tones for richness
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(500, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(700, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);
    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.25);
  } catch {}
}

/**
 * Celebratory chord for match events.
 */
export function playMatchSound() {
  if (isReducedMotion()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Major chord arpeggio: C5 - E5 - G5 - C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      const startTime = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  } catch {}
}

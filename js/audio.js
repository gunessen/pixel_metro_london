// Tiny chiptune sound effects with WebAudio oscillators (no audio files).
import { state } from './state.js';

let ac = null;

/** Shared AudioContext (also used for Piper speech). Resumes it if suspended. */
export function audioContext() {
  return ctx();
}

function ctx() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq, start, dur, { type = 'square', vol = 0.05, slide = 0 } = {}) {
  const a = ctx();
  if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function play(fn) {
  if (!state.settings.sound) return;
  try {
    fn();
  } catch (e) { /* audio is optional */ }
}

export const sfx = {
  /** Call from a user gesture once, so later sounds are allowed. */
  unlock: () => play(() => ctx()),
  click: () => play(() => tone(660, 0, 0.04, { vol: 0.025 })),
  correct: () =>
    play(() => {
      tone(784, 0, 0.09);
      tone(1047, 0.09, 0.09);
      tone(1319, 0.18, 0.16);
    }),
  wrong: () =>
    play(() => {
      tone(330, 0, 0.14, { type: 'triangle', vol: 0.08 });
      tone(262, 0.14, 0.22, { type: 'triangle', vol: 0.08 });
    }),
  coin: () =>
    play(() => {
      tone(988, 0, 0.06, { vol: 0.03 });
      tone(1319, 0.06, 0.12, { vol: 0.03 });
    }),
  toot: () =>
    play(() => {
      tone(440, 0, 0.18, { type: 'sawtooth', vol: 0.025 });
      tone(554, 0, 0.18, { type: 'sawtooth', vol: 0.02 });
    }),
  chime: () =>
    play(() => {
      tone(659, 0, 0.35, { type: 'triangle', vol: 0.08 });
      tone(523, 0.35, 0.5, { type: 'triangle', vol: 0.08 });
    }),
};

// Text-to-speech.
// 1st choice: Piper (neural voice, runs in the browser, see js/piper.js).
// Fallback:   the device's speechSynthesis voices (while Piper loads, or if it fails).
import { state } from './state.js';
import { audioContext } from './audio.js';
import { piper, loadPiper, synthesize, prefetch, DEFAULT_PIPER_VOICE } from './piper.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
let voice = null;

export const tts = {
  ready: null, // Promise, resolved once device voices are known
  /** Any English speech possible right now? */
  get available() {
    return (usePiper() && piper.status === 'ready') || !!voice;
  },
};

/** Selected Piper voice id, or null when the parent chose the device voice. */
export function piperVoiceSetting() {
  const v = state.settings.piperVoice;
  if (v === 'device') return null;
  return v || DEFAULT_PIPER_VOICE;
}

function usePiper() {
  return !!piperVoiceSetting();
}

// ---------------- device voices (fallback) ----------------

function englishOf(list) {
  return list.filter((v) => /^en([-_]|$)/i.test(v.lang));
}

function chooseVoice() {
  const en = englishOf(voices);
  const wanted = state.settings.voiceURI && en.find((v) => v.voiceURI === state.settings.voiceURI);
  voice =
    wanted ||
    en.find((v) => /en[-_]GB/i.test(v.lang) && v.localService) ||
    en.find((v) => /en[-_]GB/i.test(v.lang)) ||
    en.find((v) => v.localService) ||
    en[0] ||
    null;
}

function refresh() {
  if (!synth) return;
  voices = synth.getVoices() || [];
  chooseVoice();
}

export function initTTS() {
  if (tts.ready) return tts.ready;
  const pv = piperVoiceSetting();
  if (pv) loadPiper(pv);
  tts.ready = new Promise((resolve) => {
    if (!synth) return resolve(tts.available);
    refresh();
    if (voice) return resolve(true);
    // Android Chrome loads voices asynchronously.
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      refresh();
      resolve(tts.available);
    };
    synth.addEventListener?.('voiceschanged', () => {
      refresh();
      if (voice) finish();
    });
    let tries = 0;
    const poll = setInterval(() => {
      refresh();
      if (voice || ++tries > 20) {
        clearInterval(poll);
        finish();
      }
    }, 150);
  });
  return tts.ready;
}

export function englishVoices() {
  return englishOf(voices);
}

export function currentVoice() {
  return voice;
}

export function hasDeviceVoice() {
  return !!voice;
}

export function setVoice(uri) {
  state.settings.voiceURI = uri || null;
  chooseVoice();
}

/** Switch to a Piper voice id, or 'device'. */
export function setPiperVoice(id) {
  state.settings.piperVoice = id;
  if (id && id !== 'device') loadPiper(id);
}

// ---------------- speaking ----------------

let token = 0;
let source = null;

/** Speech rate setting (0.9 normal, 0.7 slow) → Piper length scale (1.0, 1.29). */
function scaleFor(rate) {
  return Math.round((0.9 / rate) * 100) / 100;
}

function stopPlayback() {
  try {
    source?.stop();
  } catch (e) { /* already stopped */ }
  source = null;
  try {
    synth?.cancel();
  } catch (e) { /* ignore */ }
}

function playPcm({ pcm, sampleRate }) {
  const ctx = audioContext();
  if (!ctx) return;
  const buf = ctx.createBuffer(1, pcm.length, sampleRate);
  buf.copyToChannel(pcm, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
  source = src;
}

function speakDevice(text, rate) {
  if (!synth || !voice) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    synth.speak(u);
  } catch (e) { /* ignore */ }
}

/** Speak English text. Stops anything still being spoken. */
export function speak(text, { rate } = {}) {
  if (!text) return;
  const my = ++token;
  stopPlayback();
  const r = rate || state.settings.rate || 0.9;
  if (usePiper() && piper.status === 'ready') {
    synthesize(text, { scale: scaleFor(r), urgent: true }).then(
      (audio) => my === token && playPcm(audio),
      () => my === token && speakDevice(text, r),
    );
    return;
  }
  speakDevice(text, r);
}

export function stopSpeaking() {
  token++;
  stopPlayback();
}

/** Prepare audio for texts that will probably be spoken soon (Piper only). */
export function prefetchSpeech(texts) {
  if (!usePiper()) return;
  prefetch(texts, { scale: scaleFor(state.settings.rate || 0.9) });
}

// Main-thread client for the Piper worker: loading state, a synthesis queue
// (spoken text first, prefetch in the background) and an in-memory audio cache.

export const PIPER_VOICES = [
  { id: 'en_GB-jenny_dioco-medium', label: 'Jenny (britisch, weiblich)' },
  { id: 'en_GB-cori-medium', label: 'Cori (britisch, weiblich)' },
  { id: 'en_GB-alan-medium', label: 'Alan (britisch, männlich)' },
  { id: 'en_GB-northern_english_male-medium', label: 'Northern English (männlich)' },
  { id: 'en_GB-southern_english_female-low', label: 'Southern English (weiblich)' },
  { id: 'en_GB-alba-medium', label: 'Alba (schottisch, weiblich)' },
];
export const DEFAULT_PIPER_VOICE = PIPER_VOICES[0].id;

const CACHE_MAX = 300;

export const piper = {
  status: 'off', // 'off' | 'loading' | 'ready' | 'error'
  voice: null,
  progress: 0, // 0..1 while downloading
  error: null,
  listeners: new Set(),
};

let worker = null;
let nextId = 1;
const waiting = new Map(); // job id → { resolve, reject }
const queue = []; // { key, text, scale, promise, resolve, reject }
let busy = false;
const cache = new Map(); // key → { pcm, sampleRate }  (Map keeps insertion order → simple LRU)
const inflight = new Map(); // key → promise

function emit() {
  for (const fn of piper.listeners) {
    try {
      fn(piper);
    } catch (e) { /* ignore */ }
  }
}

export function onPiperChange(fn) {
  piper.listeners.add(fn);
  return () => piper.listeners.delete(fn);
}

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./piper-worker.js', import.meta.url));
  worker.onmessage = (ev) => {
    const m = ev.data;
    if (m.type === 'progress' && m.voice === piper.voice) {
      piper.progress = m.total ? m.loaded / m.total : 0;
      emit();
    } else if (m.type === 'ready' && m.voice === piper.voice) {
      piper.status = 'ready';
      piper.progress = 1;
      piper.error = null;
      emit();
      pump();
    } else if (m.type === 'audio' || (m.type === 'error' && m.id)) {
      const w = waiting.get(m.id);
      waiting.delete(m.id);
      if (!w) return;
      if (m.type === 'audio') w.resolve({ pcm: m.pcm, sampleRate: m.sampleRate });
      else w.reject(new Error(m.message));
    } else if (m.type === 'error' && m.voice === piper.voice) {
      piper.status = 'error';
      piper.error = m.message;
      emit();
      failQueue(new Error(m.message));
    }
  };
  worker.onerror = (e) => {
    piper.status = 'error';
    piper.error = e.message || 'worker error';
    emit();
    failQueue(new Error(piper.error));
  };
  return worker;
}

function failQueue(err) {
  while (queue.length) queue.shift().reject(err);
}

/** Start loading a voice (downloads ~60 MB the first time, then cached). */
export function loadPiper(voiceId) {
  if (piper.voice === voiceId && (piper.status === 'loading' || piper.status === 'ready')) return;
  piper.voice = voiceId;
  piper.status = 'loading';
  piper.progress = 0;
  piper.error = null;
  cache.clear();
  inflight.clear();
  emit();
  try {
    navigator.storage?.persist?.(); // ask the browser not to evict the voice
    ensureWorker().postMessage({ type: 'load', voice: voiceId });
  } catch (e) {
    piper.status = 'error';
    piper.error = String(e.message || e);
    emit();
  }
}

function keyOf(text, scale) {
  return `${piper.voice}|${scale.toFixed(2)}|${text}`;
}

function pump() {
  if (busy || piper.status !== 'ready' || !queue.length) return;
  busy = true;
  const job = queue.shift();
  const id = nextId++;
  new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    worker.postMessage({ type: 'synth', id, text: job.text, scale: job.scale });
  })
    .then((audio) => {
      cache.set(job.key, audio);
      while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
      job.resolve(audio);
    }, job.reject)
    .finally(() => {
      inflight.delete(job.key);
      busy = false;
      pump();
    });
}

/**
 * Get audio for `text`. Urgent requests jump the queue (the child is waiting for them).
 * @returns Promise<{pcm: Float32Array, sampleRate: number}>
 */
export function synthesize(text, { scale = 1, urgent = false } = {}) {
  const key = keyOf(text, scale);
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key); // refresh LRU position
    cache.set(key, hit);
    return Promise.resolve(hit);
  }
  if (inflight.has(key)) {
    if (urgent) {
      const i = queue.findIndex((j) => j.key === key);
      if (i > 0) queue.unshift(...queue.splice(i, 1));
    }
    return inflight.get(key);
  }
  let job;
  const promise = new Promise((resolve, reject) => {
    job = { key, text, scale, resolve, reject };
  });
  job.promise = promise;
  inflight.set(key, promise);
  if (urgent) queue.unshift(job);
  else queue.push(job);
  pump();
  return promise;
}

/** Synthesize in the background so later playback is instant. */
export function prefetch(texts, { scale = 1 } = {}) {
  if (piper.status !== 'ready' && piper.status !== 'loading') return;
  for (const t of texts) if (t) synthesize(t, { scale }).catch(() => {});
}

export function isCached(text, scale = 1) {
  return cache.has(keyOf(text, scale));
}

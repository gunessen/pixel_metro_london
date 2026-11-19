// Persistent game state in a single localStorage key.
import { LINES, STATIONS_PER_LINE } from './data/lines.js';

export const STORAGE_KEY = 'pixelMetro.v1';
export const VERSION = 1;

export function defaults() {
  return {
    version: VERSION,
    coins: 0,
    xp: 0,
    settings: { sound: true, piperVoice: null, voiceURI: null, rate: 0.9, examDate: null, emojiPx: 20 },
    items: {},
    lines: Object.fromEntries(
      LINES.map((l) => [l.topic, { station: 0, stars: new Array(STATIONS_PER_LINE).fill(0), testBest: null }]),
    ),
    owned: { vehicles: ['train'], paints: ['default'], paint: 'default' },
    stats: { shifts: 0, exercises: 0, msPlayed: 0, history: [] },
  };
}

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

// Fill in anything missing in `loaded` from `def` (recursively for plain objects).
function mergeDefaults(def, loaded) {
  if (!isObj(loaded)) return def;
  const out = { ...loaded };
  for (const [k, v] of Object.entries(def)) {
    if (!(k in out) || out[k] === undefined || out[k] === null && v !== null) out[k] = v;
    else if (isObj(v) && isObj(out[k])) out[k] = mergeDefaults(v, out[k]);
    else if (Array.isArray(v) && !Array.isArray(out[k])) out[k] = v;
  }
  return out;
}

export function migrate(raw) {
  const s = mergeDefaults(defaults(), raw);
  s.version = VERSION;
  for (const l of Object.values(s.lines)) {
    if (!Array.isArray(l.stars)) l.stars = [];
    while (l.stars.length < STATIONS_PER_LINE) l.stars.push(0);
    l.station = Math.max(0, Math.min(STATIONS_PER_LINE, l.station | 0));
  }
  if (typeof s.coins !== 'number' || !isFinite(s.coins)) s.coins = 0;
  return s;
}

let storageOk = true;

function load() {
  try {
    const txt = localStorage.getItem(STORAGE_KEY);
    if (!txt) return defaults();
    return migrate(JSON.parse(txt));
  } catch (e) {
    if (typeof localStorage === 'undefined') storageOk = false;
    return defaults();
  }
}

export const state = load();

export function save() {
  if (!storageOk) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // storage full or blocked: keep playing in memory
  }
}

export function resetAll() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* ignore */ }
  location.reload();
}

export function itemState(id) {
  let s = state.items[id];
  if (!s) {
    s = { box: 0, seen: 0, correct: 0, wrong: 0, lastSeen: 0, lastWrong: 0, lastResult: null };
    state.items[id] = s;
  }
  return s;
}

/** Read-only peek that does not create an entry. */
export function peekItem(id) {
  return state.items[id] || null;
}

export function lineState(topic) {
  return state.lines[topic];
}

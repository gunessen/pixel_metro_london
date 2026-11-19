// Shift engine: builds the exercise queue, re-queues mistakes, counts coins/combo/stars.
// No DOM in here, so it can be unit-tested.
import { selectItems, applyAnswer, shuffle, weight } from './srs.js';
import { STATIONS_PER_LINE, TEST_STATION } from './data/lines.js';

export const SHIFT_LEN = 10;
export const TEST_LEN = 15;
export const EXAM_LEN = 20;
export const BASE_COINS = 10;
export const COMBO_STEP = 5;
export const COMBO_MAX = 25;

export const RECOGNITION = { 'pick-word': 3, 'pick-picture': 3, 'listen-pick': 2 };
export const WRITING = { type: 3, 'fill-gap': 2, copy: 1 };

/** Exercise mix per station (index 0–4). Test day uses RECOGNITION/WRITING 30/70. */
export const STATION_MIX = [
  { 'pick-word': 3, 'pick-picture': 3, 'listen-pick': 2, 'match-pairs': 1 },
  { 'pick-word': 2, 'pick-picture': 2, 'listen-pick': 1, tiles: 3 },
  { tiles: 3, 'fill-gap': 3, 'sentence-order': 2 },
  { type: 4, copy: 2, 'fill-gap': 3 },
  { type: 5, copy: 1, 'fill-gap': 3 },
];

/**
 * Per-line plans. `stations[i]` is the exercise mix of station i; an exercise type is only
 * used for items it can show (clock-* only for clock patterns, word types only for words).
 * `genShare`: part of the shift made of generated items (clock patterns), which may come
 * several times with different times.
 */
const DEFAULT_PLAN = { stations: STATION_MIX, writing: WRITING, recognition: RECOGNITION, genShare: 0 };

export const PLANS = {
  time: {
    stations: [
      { 'clock-read': 1, 'pick-word': 2, 'pick-picture': 2, 'listen-pick': 1 },
      { 'clock-read': 1, tiles: 3, 'match-pairs': 1, 'pick-word': 1 },
      { 'clock-write': 3, 'clock-read': 1, tiles: 2, 'fill-gap': 2 },
      { 'clock-write': 3, 'clock-set': 2, type: 3, copy: 1 },
      { 'clock-write': 3, 'clock-set': 2, type: 2, 'fill-gap': 2 },
    ],
    writing: { 'clock-write': 1, type: 2, 'fill-gap': 1 },
    recognition: { 'clock-read': 2, 'clock-set': 1, 'pick-word': 1 },
    genShare: 0.7,
    // Station 1 (index 0) starts with full and half hours only.
    patterns: [['oclock', 'half-past']],
  },
  prepositions: {
    stations: [
      { 'prep-pick': 3, 'prep-place': 1 },
      { 'prep-pick': 2, 'prep-place': 3 },
      { 'prep-write': 3, 'prep-place': 2, 'sentence-order': 2 },
      { 'prep-write': 4, 'prep-place': 1, 'sentence-order': 1 },
      { 'prep-write': 5, 'prep-place': 1 },
    ],
    writing: { 'prep-write': 1 },
    recognition: { 'prep-pick': 2, 'prep-place': 1 },
    genShare: 0,
  },
};

export function planFor(topic) {
  return { ...DEFAULT_PLAN, ...(PLANS[topic] || {}) };
}

/** Every exercise type that any line uses (for "is this line playable at all"). */
function allTypes() {
  const all = {};
  for (const plan of [DEFAULT_PLAN, ...Object.values(PLANS)]) {
    Object.assign(all, plan.writing, plan.recognition, ...plan.stations);
  }
  return all;
}

export function shiftMode(kind, station, topic = null) {
  if (kind !== 'station') {
    return { hints: false, german: false, gapMode: 'type', extraLetters: 2, retry: false, patterns: null };
  }
  return {
    hints: true,
    german: true,
    gapMode: station <= 2 ? 'tiles' : 'type',
    extraLetters: station >= 2 ? 2 : 0,
    retry: true,
    patterns: planFor(topic).patterns?.[station] ?? null,
  };
}

export function starsFor(kind, mistakes, percent) {
  if (kind === 'station') return mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
  return percent >= 90 ? 3 : percent >= 70 ? 2 : 1;
}

export function comboBonus(combo) {
  return Math.min(COMBO_MAX, COMBO_STEP * Math.max(0, combo - 1));
}

function weightedKey(entries, rng) {
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r < 0) return k;
  }
  return entries[entries.length - 1][0];
}

/** Pick an exercise type from `mix` that can show `item`; prefers types not in `avoid`. */
export function chooseType(item, mix, exercises, info, rng = Math.random, avoid = []) {
  const ok = Object.entries(mix).filter(([t]) => exercises[t] && exercises[t].canUse(item, info));
  if (!ok.length) return null;
  const fresh = ok.filter(([t]) => !avoid.includes(t));
  return weightedKey(fresh.length ? fresh : ok, rng);
}

function usableWith(item, mix, exercises, info) {
  return Object.keys(mix).some((t) => exercises[t] && exercises[t].canUse(item, info));
}

/** Items of a topic that can be practised at all (for "coming soon" lines and the fit meter). */
export function playableItems(words, topic, exercises, info) {
  const all = allTypes();
  return words.filter((w) => (!topic || w.topic === topic) && usableWith(w, all, exercises, info));
}

/** A queue entry. `params` is what the exercise generated (a time, a room scene …), kept for retries. */
function mkSlot(item, type, exercises, info, rng) {
  const params = type && exercises[type]?.makeParams ? exercises[type].makeParams(item, { rng, mode: info.mode, words: info.words }) : null;
  return { item, type, retry: false, params };
}

/** Same question? (same item and same generated time/scene) */
export function slotKey(slot) {
  return slot.item.id + (slot.params ? '|' + JSON.stringify(slot.params) : '');
}

function weightedIndex(weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/**
 * Choose `n` generated items (clock patterns), repeats allowed, weighted by SRS.
 * At least 30 % are half past (the German "halb" trap) when it is in the pool.
 */
function pickGenerated(pool, n, getState, rng) {
  if (!n || !pool.length) return [];
  const out = [];
  const half = pool.find((w) => w.pattern === 'half-past');
  if (half) for (let i = 0; i < Math.ceil(n * 0.3); i++) out.push(half);
  const weights = pool.map((w) => weight(getState(w.id)));
  // Every pattern of the pool once (if there is room), then by weight.
  for (const w of shuffle(pool, rng)) if (out.length < n && !out.includes(w)) out.push(w);
  while (out.length < n) out.push(pool[weightedIndex(weights, rng)]);
  return out;
}

/** Slots for generated items, avoiding the very same question twice. */
function genSlots(items, mixFor, exercises, info, rng) {
  const seen = new Set();
  return items.map((item, i) => {
    const mix = mixFor(i);
    let slot = null;
    for (let tries = 0; tries < 8; tries++) {
      slot = mkSlot(item, chooseType(item, mix, exercises, info, rng), exercises, info, rng);
      if (!seen.has(slotKey(slot))) break;
    }
    seen.add(slotKey(slot));
    return slot;
  });
}

/** Merge two queues, spreading `b` evenly between the entries of `a`. */
function interleave(a, b, rng) {
  const keyed = [
    ...a.map((s, i) => [(i + 0.5) / a.length, s]),
    ...b.map((s, i) => [(i + rng()) / b.length, s]),
  ];
  return keyed.sort((x, y) => x[0] - y[0]).map((x) => x[1]);
}

/** Reorder so the same item never appears twice in a row (keeps intro-before-main order). */
export function spread(slots) {
  // Greedy: always take the earliest remaining slot of an item that differs from the last one.
  const rest = [...slots];
  const out = [];
  while (rest.length) {
    const last = out.length ? out[out.length - 1].item.id : null;
    const seenIds = new Set();
    let pickI = -1;
    for (let i = 0; i < rest.length; i++) {
      const id = rest[i].item.id;
      if (seenIds.has(id)) continue; // only the first remaining slot of each item
      seenIds.add(id);
      if (id !== last) {
        pickI = i;
        break;
      }
    }
    out.push(rest.splice(pickI < 0 ? 0 : pickI, 1)[0]);
  }
  // Leftover neighbours (only one item was left at the end): move the earlier copy forward.
  for (let k = 1; k < out.length; k++) {
    const id = out[k].item.id;
    if (out[k - 1].item.id !== id) continue;
    const [mv] = out.splice(k - 1, 1);
    let lowest = 0;
    for (let i = 0; i < k - 1; i++) if (out[i].item.id === id) lowest = i + 1;
    let placed = false;
    for (let p = k - 2; p >= lowest; p--) {
      const before = p > 0 ? out[p - 1].item.id : null;
      if (before !== id && out[p].item.id !== id) {
        out.splice(p, 0, mv);
        placed = true;
        break;
      }
    }
    if (!placed) out.splice(k - 1, 0, mv);
  }
  return out;
}

function buildItemSlots({ pool, n, mix, recognition, station, exercises, info, getState, rng }) {
  if (n <= 0 || !pool.length) return [];
  const items = selectItems(pool, getState, n, { maxNew: 4, rng });
  const rounds = [[], [], [], []];
  const typesOf = new Map(items.map((it) => [it.id, []]));
  let count = 0;
  const place = (item, type, minRound) => {
    let r = minRound;
    while (r < rounds.length - 1 && rounds[r].some((x) => x.item.id === item.id)) r++;
    rounds[r].push(mkSlot(item, type, exercises, info, rng));
    typesOf.get(item.id).push(type);
    count++;
  };

  for (const item of items) {
    const isNew = !(getState(item.id)?.seen > 0);
    const main = chooseType(item, mix, exercises, info, rng);
    if (isNew && station >= 2) {
      // New word at a writing station: show it once in a recognition exercise first.
      const intro = chooseType(item, recognition, exercises, info, rng);
      if (intro) place(item, intro, 0);
      place(item, main, intro ? 1 : 0);
    } else place(item, main, 0);
  }

  // Few items (first shifts)? Repeat the weakest ones with a different exercise type.
  const byBox = [...items].sort((a, b) => (getState(a.id)?.box ?? 0) - (getState(b.id)?.box ?? 0));
  let guard = 0;
  while (count < n && items.length && guard++ < 50) {
    for (const item of byBox) {
      if (count >= n) break;
      const t = chooseType(item, mix, exercises, info, rng, typesOf.get(item.id));
      if (t) place(item, t, 1);
    }
  }
  return rounds.flatMap((r) => shuffle(r, rng)).slice(0, n);
}

function buildStationQueue(args) {
  const { topic, station, words, exercises, info, getState, rng } = args;
  const plan = planFor(topic);
  const mix = plan.stations[station];
  const pool = words.filter((w) => w.topic === topic && usableWith(w, mix, exercises, info));
  const genPool = pool.filter((w) => w.gen);
  const itemPool = pool.filter((w) => !w.gen);
  const nGen = !genPool.length ? 0 : itemPool.length ? Math.round(SHIFT_LEN * plan.genShare) : SHIFT_LEN;
  const itemSlots = buildItemSlots({ ...args, pool: itemPool, n: SHIFT_LEN - nGen, mix, recognition: plan.recognition });
  const gen = genSlots(pickGenerated(genPool, SHIFT_LEN - itemSlots.length, getState, rng), () => mix, exercises, info, rng);
  return spread(interleave(itemSlots, gen, rng)).slice(0, SHIFT_LEN);
}

function buildTestQueue({ kind, topic, words, exercises, info, getState, rng }) {
  const n = kind === 'test' ? TEST_LEN : EXAM_LEN;
  const usable = (w) => {
    const p = planFor(w.topic);
    return usableWith(w, p.writing, exercises, info) || usableWith(w, p.recognition, exercises, info);
  };
  const pool = words.filter((w) => (kind === 'exam' || w.topic === topic) && usable(w));
  const genPool = kind === 'test' ? pool.filter((w) => w.gen) : [];
  const itemPool = pool.filter((w) => !genPool.includes(w));
  const nGen = genPool.length ? Math.round(n * planFor(topic).genShare) : 0;
  const items = selectItems(itemPool, getState, n - nGen, { maxNew: Infinity, rng });
  // Small pools whose questions are generated (prepositions: a new room each time) may repeat.
  const repeatable = items
    .filter((w) => w.kind === 'prep')
    .sort((a, b) => (getState(a.id)?.box ?? 0) - (getState(b.id)?.box ?? 0));
  for (let i = 0; kind === 'test' && repeatable.length && items.length < n - nGen; i++) {
    items.push(repeatable[i % repeatable.length]);
  }
  const all = shuffle([...items, ...pickGenerated(genPool, n - items.length, getState, rng)], rng);
  const nWriting = Math.round(all.length * 0.7);
  const typeFor = (item, i) => {
    const p = planFor(item.topic);
    const [first, second] = i < nWriting ? [p.writing, p.recognition] : [p.recognition, p.writing];
    return chooseType(item, first, exercises, info, rng) || chooseType(item, second, exercises, info, rng);
  };
  const seen = new Set();
  const queue = all.map((item, i) => {
    let slot = mkSlot(item, typeFor(item, i), exercises, info, rng);
    for (let tries = 0; tries < 8 && seen.has(slotKey(slot)); tries++) slot = mkSlot(item, slot.type, exercises, info, rng);
    seen.add(slotKey(slot));
    return slot;
  });
  return spread(queue);
}

/**
 * @param o.kind 'station' | 'test' | 'exam'
 * @param o.topic line topic (not needed for 'exam')
 * @param o.station station index 0–5
 * @param o.words all vocabulary
 * @param o.exercises map id → exercise module (needs canUse)
 * @param o.getState (id) => mutable item state (created if missing)
 */
export function createShift(o) {
  const { kind, topic = null, words, exercises, getState, ttsAvailable = false, rng = Math.random } = o;
  const now = o.now || Date.now;
  const station = kind === 'test' ? TEST_STATION : o.station ?? 0;
  const mode = shiftMode(kind, station, topic);
  const info = { words, ttsAvailable, mode };
  const args = { kind, topic, station, words, exercises, info, getState, rng };
  const queue = kind === 'station' ? buildStationQueue(args) : buildTestQueue(args);

  const wrong = new Map();
  const touched = new Set();

  const shift = {
    kind,
    topic,
    station,
    mode,
    info,
    queue,
    index: 0,
    combo: 0,
    bestCombo: 0,
    coins: 0,
    mistakes: 0,
    firstTotal: 0,
    firstCorrect: 0,
    startedAt: now(),

    get current() {
      return this.queue[this.index] || null;
    },
    get done() {
      return this.index >= this.queue.length;
    },
    get progress() {
      return this.queue.length ? this.index / this.queue.length : 1;
    },

    /** Record the result of the current exercise. Returns { gained, bonus, combo }. */
    answer(res) {
      const slot = this.current;
      if (!slot) return { gained: 0, bonus: 0, combo: 0 };
      const item = slot.item;
      touched.add(item.id);
      applyAnswer(getState(item.id), res, { now: now(), moveBox: !slot.retry });
      if (!slot.retry) {
        this.firstTotal++;
        if (res.correct) this.firstCorrect++;
      }
      let gained = 0;
      let bonus = 0;
      if (res.correct) {
        this.combo = res.hintUsed ? 0 : this.combo + 1;
        bonus = comboBonus(this.combo);
        gained = BASE_COINS + bonus;
        this.coins += gained;
      } else {
        this.combo = 0;
        this.mistakes++;
        wrong.set(item.id, { item, params: slot.params });
        if (mode.retry) this.queue.push({ item, type: slot.type, retry: true, params: slot.params });
      }
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      return { gained, bonus, combo: this.combo };
    },

    advance() {
      this.index++;
    },

    /** Call once at the end. Marks last results for SRS and returns the summary. */
    finish() {
      for (const id of touched) getState(id).lastResult = wrong.has(id) ? 'wrong' : 'right';
      const percent = this.firstTotal ? Math.round((100 * this.firstCorrect) / this.firstTotal) : 0;
      return {
        kind,
        topic,
        station,
        stars: starsFor(kind, this.mistakes, percent),
        coins: this.coins,
        mistakes: this.mistakes,
        percent,
        exercises: this.index,
        bestCombo: this.bestCombo,
        wrongItems: [...wrong.values()].map((w) => w.item),
        wrongDetails: [...wrong.values()],
        ms: now() - this.startedAt,
      };
    },
  };
  return shift;
}

/** Apply a finished shift to the saved game state (stars, station progress, stats). */
export function commitShift(st, summary) {
  st.stats.shifts++;
  st.stats.exercises += summary.exercises;
  st.stats.msPlayed += summary.ms;
  st.stats.history.push({
    t: Date.now(),
    kind: summary.kind,
    topic: summary.topic,
    station: summary.station,
    stars: summary.stars,
    mistakes: summary.mistakes,
    percent: summary.percent,
    wrong: summary.wrongItems.map((w) => w.id),
  });
  if (st.stats.history.length > 50) st.stats.history.splice(0, st.stats.history.length - 50);

  if (summary.kind === 'exam' || !summary.topic) return;
  const L = st.lines[summary.topic];
  L.stars[summary.station] = Math.max(L.stars[summary.station] || 0, summary.stars);
  if (summary.station === L.station) L.station = Math.min(STATIONS_PER_LINE, L.station + 1);
  if (summary.kind === 'test') L.testBest = Math.max(L.testBest ?? 0, summary.percent);
}

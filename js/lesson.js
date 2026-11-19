// Shift engine: builds the exercise queue, re-queues mistakes, counts coins/combo/stars.
// No DOM in here, so it can be unit-tested.
import { selectItems, applyAnswer, shuffle } from './srs.js';
import { STATIONS_PER_LINE, TEST_STATION } from './data/lines.js';

export const SHIFT_LEN = 10;
export const TEST_LEN = 15;
export const EXAM_LEN = 20;
export const BASE_COINS = 10;
export const COMBO_STEP = 5;
export const COMBO_MAX = 25;

export const RECOGNITION = { 'pick-word': 3, 'pick-picture': 3, 'listen-pick': 2 };
export const WRITING = { type: 3, 'fill-gap': 2 };

/** Exercise mix per station (index 0–4). Test day uses RECOGNITION/WRITING 30/70. */
export const STATION_MIX = [
  { 'pick-word': 3, 'pick-picture': 3, 'listen-pick': 2 },
  { 'pick-word': 2, 'pick-picture': 2, 'listen-pick': 1, tiles: 3 },
  { tiles: 3, 'fill-gap': 3, 'pick-word': 1 },
  { type: 4, 'fill-gap': 3, tiles: 1 },
  { type: 5, 'fill-gap': 3 },
];

export function shiftMode(kind, station) {
  if (kind !== 'station') {
    return { hints: false, german: false, gapMode: 'type', extraLetters: 2, retry: false };
  }
  return {
    hints: true,
    german: true,
    gapMode: station <= 2 ? 'tiles' : 'type',
    extraLetters: station >= 2 ? 2 : 0,
    retry: true,
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
  const all = { ...RECOGNITION, ...WRITING, ...Object.assign({}, ...STATION_MIX) };
  return words.filter((w) => (!topic || w.topic === topic) && usableWith(w, all, exercises, info));
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

function buildStationQueue({ topic, station, words, exercises, info, getState, rng }) {
  const mix = STATION_MIX[station];
  const pool = words.filter((w) => w.topic === topic && usableWith(w, mix, exercises, info));
  const items = selectItems(pool, getState, SHIFT_LEN, { maxNew: 4, rng });
  const rounds = [[], [], [], []];
  const typesOf = new Map(items.map((it) => [it.id, []]));
  let count = 0;
  const place = (item, type, minRound) => {
    let r = minRound;
    while (r < rounds.length - 1 && rounds[r].some((x) => x.item.id === item.id)) r++;
    rounds[r].push({ item, type, retry: false });
    typesOf.get(item.id).push(type);
    count++;
  };

  for (const item of items) {
    const isNew = !(getState(item.id)?.seen > 0);
    const main = chooseType(item, mix, exercises, info, rng);
    if (isNew && station >= 2) {
      // New word at a writing station: show it once in a recognition exercise first.
      const intro = chooseType(item, RECOGNITION, exercises, info, rng);
      if (intro) place(item, intro, 0);
      place(item, main, intro ? 1 : 0);
    } else place(item, main, 0);
  }

  // Few items (first shifts)? Repeat the weakest ones with a different exercise type.
  const byBox = [...items].sort((a, b) => (getState(a.id)?.box ?? 0) - (getState(b.id)?.box ?? 0));
  let guard = 0;
  while (count < SHIFT_LEN && items.length && guard++ < 50) {
    for (const item of byBox) {
      if (count >= SHIFT_LEN) break;
      const t = chooseType(item, mix, exercises, info, rng, typesOf.get(item.id));
      if (t) place(item, t, 1);
    }
  }
  const flat = rounds.flatMap((r) => shuffle(r, rng));
  return spread(flat).slice(0, SHIFT_LEN);
}

function buildTestQueue({ kind, topic, words, exercises, info, getState, rng }) {
  const n = kind === 'test' ? TEST_LEN : EXAM_LEN;
  const pool = words.filter(
    (w) =>
      (kind === 'exam' || w.topic === topic) &&
      (usableWith(w, WRITING, exercises, info) || usableWith(w, RECOGNITION, exercises, info)),
  );
  const items = shuffle(selectItems(pool, getState, n, { maxNew: Infinity, rng }), rng);
  const nWriting = Math.round(items.length * 0.7);
  return items.map((item, i) => {
    const [first, second] = i < nWriting ? [WRITING, RECOGNITION] : [RECOGNITION, WRITING];
    const type =
      chooseType(item, first, exercises, info, rng) || chooseType(item, second, exercises, info, rng);
    return { item, type, retry: false };
  });
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
  const mode = shiftMode(kind, station);
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
        wrong.set(item.id, item);
        if (mode.retry) this.queue.push({ item, type: slot.type, retry: true });
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
        wrongItems: [...wrong.values()],
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

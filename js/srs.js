// Leitner spaced repetition with 5 boxes.

export const MAX_BOX = 5;
export const FIT_BOX = 3;

export function newItemState() {
  return { box: 0, seen: 0, correct: 0, wrong: 0, lastSeen: 0, lastWrong: 0, lastResult: null };
}

/** Update an item's state after one answer. `moveBox:false` only updates counters (retries). */
export function applyAnswer(s, { correct, caseOnly }, { now = Date.now(), moveBox = true } = {}) {
  s.seen += 1;
  s.lastSeen = now;
  if (correct) {
    s.correct += 1;
    if (moveBox) s.box = Math.min(MAX_BOX, s.box + 1);
  } else {
    s.wrong += 1;
    s.lastWrong = now;
    if (moveBox) s.box = Math.max(0, s.box - (caseOnly ? 1 : 2));
  }
  return s;
}

/** Selection weight: low boxes come up much more often; last-shift mistakes twice as often. */
export function weight(s) {
  const box = s ? s.box : 0;
  const w = (MAX_BOX + 1 - box) ** 2;
  return s && s.lastResult === 'wrong' ? w * 2 : w;
}

function weightedPick(list, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return list.length - 1;
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Choose up to `n` distinct items from `pool`.
 * At most `maxNew` never-seen items, but always at least `minDistinct` items
 * if the pool has them (so the very first shift is not 3 words over and over).
 * @param getState (id) => item state or null
 */
export function selectItems(pool, getState, n, { maxNew = 4, minDistinct = 6, rng = Math.random } = {}) {
  const seen = [];
  const unseen = [];
  for (const it of pool) {
    const s = getState(it.id);
    (s && s.seen > 0 ? seen : unseen).push(it);
  }
  const newAllowed = Math.max(maxNew, Math.min(n, minDistinct) - seen.length);
  const candidates = [...seen, ...shuffle(unseen, rng).slice(0, Math.max(0, newAllowed))];
  const weights = candidates.map((it) => weight(getState(it.id)));
  const out = [];
  while (out.length < n && candidates.length) {
    const i = weightedPick(candidates, weights, rng);
    out.push(candidates[i]);
    candidates.splice(i, 1);
    weights.splice(i, 1);
  }
  return out;
}

/** Percentage (0–100) of the pool's items in box >= 3. */
export function fitness(pool, getState) {
  if (!pool.length) return 0;
  const ok = pool.filter((it) => {
    const s = getState(it.id);
    return s && s.box >= FIT_BOX;
  }).length;
  return Math.round((100 * ok) / pool.length);
}

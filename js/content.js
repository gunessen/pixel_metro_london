// Pure helpers about vocabulary items (no DOM): distractors, sentences, display text.
import { PLACEHOLDERS } from './gfx/sprites.js';
import { shuffle } from './srs.js';

/** Item can be shown as a picture and used in word exercises. */
export function isWordItem(item) {
  return !!item.img && item.kind !== 'gap' && item.kind !== 'prep';
}

/** What the picture actually looks like — two items with the same key must never be options together. */
export function visualKey(img) {
  if (!img) return null;
  if (img.startsWith('sprite:')) {
    const ph = PLACEHOLDERS[img.slice(7)];
    if (ph && ph.emoji) return 'emoji:' + ph.emoji;
  }
  return img;
}

function forms(item) {
  return [item.en, ...(item.alt || [])].map((s) => s.toLowerCase());
}

/** True if a and b must not appear as options in the same question. */
export function conflicts(a, b) {
  if (a.id === b.id) return true;
  if (visualKey(a.img) === visualKey(b.img)) return true;
  const fa = forms(a);
  const fb = forms(b);
  return fa.some((f) => fb.includes(f));
}

/** Up to n wrong options from the same topic, none clashing with the answer or each other. */
export function distractors(item, words, n = 3, rng = Math.random) {
  const pool = shuffle(
    words.filter((w) => w.topic === item.topic && isWordItem(w)),
    rng,
  );
  const out = [];
  for (const w of pool) {
    if (out.length >= n) break;
    if (conflicts(item, w)) continue;
    if (out.some((o) => conflicts(o, w))) continue;
    out.push(w);
  }
  return out;
}

/** 'We cook in the [kitchen].' → { before:'We cook in the ', gap:'kitchen', after:'.' } */
export function parseSentence(sentence) {
  if (!sentence) return null;
  const m = /^(.*?)\[(.+?)\](.*)$/.exec(sentence);
  if (!m) return null;
  return { before: m[1], gap: m[2], after: m[3], full: m[1] + m[2] + m[3] };
}

/** Accepted alternatives for the gap of a sentence. */
export function gapAlternatives(item) {
  const p = parseSentence(item.sentence);
  if (!p || p.gap !== item.en) return [];
  // "the London Eye" makes no sense after "The ___"
  return (item.alt || []).filter((a) => !/^the /i.test(a));
}

/** How to show an item in lists (result screen, parent area). */
export function displayText(item) {
  if (item.kind === 'gap') return parseSentence(item.sentence)?.full ?? item.en;
  return item.en;
}

/** Text spoken for an item. */
export function speechText(item) {
  return displayText(item);
}

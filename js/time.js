// Clock times in words. Pure (no DOM), unit-tested in tests.js.
// Only o'clock, quarter past, half past and quarter to; hours 1–12 written as words.

export const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const NUMBER_WORDS_DE = ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];

export const PATTERNS = ['oclock', 'quarter-past', 'half-past', 'quarter-to'];
export const PATTERN_MINUTES = { oclock: 0, 'quarter-past': 15, 'half-past': 30, 'quarter-to': 45 };

/** Hour 1–12 after wrapping (0 → 12, 13 → 1). */
export function wrapHour(h) {
  return ((((h - 1) % 12) + 12) % 12) + 1;
}

export function numberWord(h) {
  return NUMBER_WORDS[wrapHour(h) - 1];
}

export function patternOf(m) {
  return PATTERNS.find((p) => PATTERN_MINUTES[p] === m) || null;
}

/** 3:00 → "three o'clock", 3:15 → "quarter past three", 3:30 → "half past three", 3:45 → "quarter to four". */
export function timeToWords(h, m) {
  switch (m) {
    case 0: return `${numberWord(h)} o'clock`;
    case 15: return `quarter past ${numberWord(h)}`;
    case 30: return `half past ${numberWord(h)}`;
    case 45: return `quarter to ${numberWord(h + 1)}`;
    default: throw new Error(`unsupported minutes: ${m}`);
  }
}

/** All accepted written forms: optional "It's " / "It is ", optional "a " before "quarter". */
export function timeAnswers(h, m) {
  const main = timeToWords(h, m);
  const forms = [main];
  if (m === 15 || m === 45) forms.push('a ' + main);
  const all = [];
  for (const prefix of ['', "It's ", 'It is ']) for (const f of forms) all.push(prefix + f);
  return { main, alts: all.filter((x) => x !== main) };
}

/** 3:45 → "3:45", 7:00 → "7:00" */
export function digital(h, m) {
  return `${wrapHour(h)}:${String(m).padStart(2, '0')}`;
}

/** Position of the hour hand in "hours" (0–12): between the numbers for :15/:30/:45. */
export function hourHandPos(h, m) {
  return (wrapHour(h) % 12) + m / 60;
}

export function makeTime(pattern, rng = Math.random) {
  return { h: 1 + Math.floor(rng() * 12), m: PATTERN_MINUTES[pattern] ?? 0 };
}

/** German trap: "half past seven" = 7:30 = "halb acht". */
export function halfPastHint(h) {
  return { en: `half past ${numberWord(h)}`, digital: digital(h, 30), de: `halb ${NUMBER_WORDS_DE[wrapHour(h + 1) - 1]}` };
}

/**
 * Wrong options for "what time is it?" as {h, m}. The typical mistake comes first
 * (half past h+1 for half past h, quarter to h for quarter to h+1).
 */
export function clockDistractors(h, m, { patterns = PATTERNS, n = 3, rng = Math.random } = {}) {
  const allowedM = new Set(patterns.map((p) => PATTERN_MINUTES[p]));
  const seen = new Set([timeToWords(h, m)]);
  const traps = [];
  const rest = [];
  const add = (list, hh, mm) => {
    if (!allowedM.has(mm)) return;
    const t = { h: wrapHour(hh), m: mm };
    const w = timeToWords(t.h, t.m);
    if (seen.has(w)) return;
    seen.add(w);
    list.push(t);
  };
  if (m === 30) add(traps, h + 1, 30);
  if (m === 45) add(traps, h - 1, 45);
  if (m === 15) add(traps, h - 1, 15);
  if (m === 0) add(traps, h - 1, 0);
  for (const mm of [0, 15, 30, 45]) add(rest, h, mm);
  add(rest, h + 1, 0);
  add(rest, h - 1, 30);
  add(rest, h + 1, 15);
  add(rest, h + 2, 0);
  add(rest, h - 1, 0);
  const shuffled = rest
    .map((t) => [rng(), t])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);
  return [...traps, ...shuffled].slice(0, n);
}

/** Words that can be used as wrong word tiles for a time phrase. */
export function timeWordDistractors(h, m, rng = Math.random, n = 2) {
  const used = new Set(timeToWords(h, m).split(' '));
  const pool = ['quarter', 'half', 'past', 'to', "o'clock", numberWord(h + 1), numberWord(h - 1), numberWord(h)]
    .filter((w) => !used.has(w));
  const uniq = [...new Set(pool)];
  // The German trap word (next hour for half past) always comes first.
  const out = [];
  if (m === 30 && !used.has(numberWord(h + 1))) out.push(numberWord(h + 1));
  const rest = uniq.filter((w) => !out.includes(w)).map((w) => [rng(), w]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return [...out, ...rest].slice(0, n);
}

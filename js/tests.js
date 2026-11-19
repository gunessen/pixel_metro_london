// Unit tests. Run in the browser via tests.html (or in Node: node js/run-tests.mjs).
import { normalise, checkAnswer, diffExpected } from './check.js';
import { applyAnswer, newItemState, selectItems, fitness, weight } from './srs.js';
import { createShift, comboBonus, starsFor, playableItems, STATION_MIX } from './lesson.js';
import { WORDS } from './data/words.js';
import { parseSentence, distractors, conflicts, gapAlternatives } from './content.js';
import { EXERCISES } from './exercises/index.js';

export function runTests() {
  const results = [];
  let group = '';
  const test = (name, fn) => {
    try {
      fn();
      results.push({ group, name, ok: true });
    } catch (e) {
      results.push({ group, name, ok: false, msg: e.message });
    }
  };
  const eq = (a, b, msg = '') => {
    const sa = JSON.stringify(a);
    const sb = JSON.stringify(b);
    if (sa !== sb) throw new Error(`${msg} expected ${sb}, got ${sa}`);
  };
  const ok = (v, msg = 'expected true') => {
    if (!v) throw new Error(msg);
  };

  // ---------------- check.js ----------------
  group = 'check.js';
  test('normalise trims and collapses spaces', () => eq(normalise('  London   Eye  '), 'London Eye'));
  test('normalise unifies apostrophes', () => eq(normalise('St Paul’s'), "St Paul's"));
  test('normalise ignores one trailing dot', () => eq(normalise('kitchen.'), 'kitchen'));
  test('normalise keeps case', () => eq(normalise('London'), 'London'));
  test('exact answer is correct', () => ok(checkAnswer('London Eye', 'London Eye').correct));
  test('extra spaces are fine', () => ok(checkAnswer(' London  Eye ', 'London Eye').correct));
  test('lowercase "london eye" is wrong with caseOnly', () => {
    const r = checkAnswer('london eye', 'London Eye');
    ok(!r.correct, 'should be wrong');
    ok(r.caseOnly, 'should be caseOnly');
  });
  test('"Kitchen" for "kitchen" is caseOnly', () => {
    const r = checkAnswer('Kitchen', 'kitchen');
    ok(!r.correct && r.caseOnly);
  });
  test('misspelling is wrong, not caseOnly', () => {
    const r = checkAnswer('kichen', 'kitchen');
    ok(!r.correct && !r.caseOnly);
    eq(r.expected, 'kitchen');
  });
  test('alternatives accepted', () => {
    ok(checkAnswer('tube', 'underground', ['tube']).correct);
    ok(checkAnswer('bicycle', 'bike', ['bicycle']).correct);
    ok(checkAnswer("St. Paul's Cathedral", "St Paul's Cathedral", ["St. Paul's Cathedral"]).correct);
  });
  test('typographic apostrophe accepted', () => ok(checkAnswer('can’t', "can't").correct));
  test('caseOnly on alternative shows that alternative', () => {
    const r = checkAnswer('Tube', 'underground', ['tube']);
    ok(r.caseOnly);
    eq(r.expected, 'tube');
  });
  test('empty answer is wrong', () => ok(!checkAnswer('', 'cat').correct));
  test('diff marks wrong letters', () => {
    const d = diffExpected('kichen', 'kitchen');
    eq(d.map((p) => (p.ok ? p.ch : p.ch.toUpperCase())).join(''), 'kiTchen');
  });
  test('diff marks case mistakes', () => {
    const d = diffExpected('london eye', 'London Eye');
    eq(d.filter((p) => !p.ok).map((p) => p.ch).join(''), 'LE');
  });
  test('diff of empty answer marks everything', () => ok(diffExpected('', 'bus').every((p) => !p.ok)));

  // ---------------- srs.js ----------------
  group = 'srs.js';
  test('correct moves up one box', () => {
    const s = applyAnswer(newItemState(), { correct: true });
    eq(s.box, 1);
    eq(s.correct, 1);
  });
  test('box is capped at 5', () => {
    const s = { ...newItemState(), box: 5 };
    applyAnswer(s, { correct: true });
    eq(s.box, 5);
  });
  test('wrong drops two boxes', () => {
    const s = { ...newItemState(), box: 4 };
    applyAnswer(s, { correct: false });
    eq(s.box, 2);
    eq(s.wrong, 1);
  });
  test('wrong never goes below 0', () => {
    const s = { ...newItemState(), box: 1 };
    applyAnswer(s, { correct: false });
    eq(s.box, 0);
  });
  test('caseOnly drops only one box', () => {
    const s = { ...newItemState(), box: 3 };
    applyAnswer(s, { correct: false, caseOnly: true });
    eq(s.box, 2);
  });
  test('retry (moveBox:false) changes counters only', () => {
    const s = { ...newItemState(), box: 2 };
    applyAnswer(s, { correct: true }, { moveBox: false });
    eq(s.box, 2);
    eq(s.seen, 1);
  });
  test('weights: low box > high box, last wrong doubles', () => {
    ok(weight({ box: 0 }) > weight({ box: 4 }));
    eq(weight({ box: 2, lastResult: 'wrong' }), 2 * weight({ box: 2 }));
  });
  test('selectItems: distinct, at most n', () => {
    const pool = WORDS.filter((w) => w.topic === 'transport');
    const st = {};
    pool.slice(0, 12).forEach((w) => (st[w.id] = { ...newItemState(), seen: 1, box: 2 }));
    const sel = selectItems(pool, (id) => st[id], 10);
    eq(sel.length, 10);
    eq(new Set(sel.map((s) => s.id)).size, 10);
  });
  test('selectItems: max 4 new items when enough are known', () => {
    const pool = WORDS.filter((w) => w.topic === 'transport');
    const st = {};
    pool.slice(0, 12).forEach((w) => (st[w.id] = { ...newItemState(), seen: 1, box: 5 }));
    for (let k = 0; k < 20; k++) {
      const sel = selectItems(pool, (id) => st[id], 10);
      ok(sel.filter((s) => !st[s.id]).length <= 4, 'too many new items');
    }
  });
  test('selectItems: first shift gets 6 distinct new items', () => {
    const pool = WORDS.filter((w) => w.topic === 'house');
    eq(selectItems(pool, () => null, 10).length, 6);
  });
  test('fitness counts box >= 3', () => {
    const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const st = { a: { box: 3 }, b: { box: 5 }, c: { box: 2 } };
    eq(fitness(pool, (id) => st[id]), 50);
  });

  // ---------------- data ----------------
  group = 'words.js';
  test('ids are unique', () => eq(new Set(WORDS.map((w) => w.id)).size, WORDS.length));
  test('every sentence has exactly one [gap]', () => {
    for (const w of WORDS.filter((x) => x.sentence)) {
      ok(parseSentence(w.sentence), `no gap in "${w.sentence}"`);
      eq((w.sentence.match(/\[/g) || []).length, 1, w.id);
    }
  });
  test('gap of a normal word equals the word', () => {
    for (const w of WORDS.filter((x) => x.sentence && x.kind !== 'gap')) {
      eq(parseSentence(w.sentence).gap, w.en, w.id);
    }
  });
  test('choice gaps contain the answer', () => {
    for (const w of WORDS.filter((x) => x.choices)) ok(w.choices.includes(parseSentence(w.sentence).gap), w.id);
  });
  test('gap alternatives drop "the ..." forms', () => {
    const eye = WORDS.find((w) => w.id === 'london:london-eye');
    eq(gapAlternatives(eye), []);
  });
  test('about 140+ items', () => ok(WORDS.length >= 140, String(WORDS.length)));

  // ---------------- distractors ----------------
  group = 'distractors';
  test('never two options with the same picture or a shared answer', () => {
    for (let k = 0; k < 5; k++) {
      for (const w of WORDS.filter((x) => x.img && !x.kind)) {
        const d = distractors(w, WORDS, 3);
        const all = [w, ...d];
        for (let i = 0; i < all.length; i++) {
          for (let j = i + 1; j < all.length; j++) ok(!conflicts(all[i], all[j]), `${all[i].id} / ${all[j].id}`);
        }
        ok(d.every((x) => x.topic === w.topic), 'same topic');
      }
    }
  });
  test('bus and double-decker never together (same emoji)', () => {
    const bus = WORDS.find((w) => w.id === 'transport:bus');
    const dd = WORDS.find((w) => w.id === 'transport:double-decker-bus');
    ok(conflicts(bus, dd));
  });
  test('underground/tube are never both options', () => {
    const u = WORDS.find((w) => w.id === 'transport:underground');
    ok(conflicts(u, { id: 'x', en: 'tube', img: 'emoji:🧪' }));
  });

  // ---------------- lesson engine ----------------
  group = 'lesson.js';
  const mkState = () => {
    const st = {};
    return (id) => (st[id] ||= newItemState());
  };
  test('combo bonus +5 per streak answer, capped at 25', () => {
    eq([1, 2, 3, 6, 10].map(comboBonus), [0, 5, 10, 25, 25]);
  });
  test('stars', () => {
    eq([0, 1, 2, 3, 4].map((m) => starsFor('station', m)), [3, 3, 2, 2, 1]);
    eq([95, 75, 50].map((p) => starsFor('test', 0, p)), [3, 2, 1]);
  });
  test('prepositions not playable yet, other lines are', () => {
    const info = { words: WORDS, ttsAvailable: true, mode: {} };
    eq(playableItems(WORDS, 'prepositions', EXERCISES, info).length, 0);
    for (const t of ['hobbies', 'house', 'time', 'transport', 'london', 'jobs']) {
      ok(playableItems(WORDS, t, EXERCISES, info).length >= 10, t);
    }
  });
  for (const topic of ['hobbies', 'house', 'time', 'transport', 'london', 'jobs']) {
    test(`${topic}: every station builds 10 usable exercises`, () => {
      for (let station = 0; station < 5; station++) {
        for (const tts of [true, false]) {
          const sh = createShift({ kind: 'station', topic, station, words: WORDS, exercises: EXERCISES, getState: mkState(), ttsAvailable: tts });
          eq(sh.queue.length, 10, `station ${station}`);
          for (const s of sh.queue) {
            ok(s.type && STATION_MIX[station][s.type] !== undefined || station >= 2, `type ${s.type}`);
            ok(EXERCISES[s.type].canUse(s.item, sh.info), `${s.type} cannot show ${s.item.id}`);
            if (!tts) ok(s.type !== 'listen-pick', 'listen-pick without TTS');
          }
          for (let i = 1; i < sh.queue.length; i++) ok(sh.queue[i].item.id !== sh.queue[i - 1].item.id, 'same item twice in a row');
        }
      }
    });
  }
  test('wrong answer is re-queued; shift ends after it is answered right', () => {
    const sh = createShift({ kind: 'station', topic: 'transport', station: 0, words: WORDS, exercises: EXERCISES, getState: mkState() });
    const first = sh.current.item;
    sh.answer({ correct: false });
    sh.advance();
    eq(sh.queue.length, 11);
    eq(sh.queue[10].item.id, first.id);
    while (!sh.done) {
      sh.answer({ correct: true });
      sh.advance();
    }
    const sum = sh.finish();
    eq(sum.mistakes, 1);
    eq(sum.stars, 3);
    eq(sum.wrongItems.map((w) => w.id), [first.id]);
  });
  test('coins: 10 + combo bonus; hint resets combo', () => {
    const sh = createShift({ kind: 'station', topic: 'jobs', station: 0, words: WORDS, exercises: EXERCISES, getState: mkState() });
    eq(sh.answer({ correct: true }).gained, 10);
    sh.advance();
    eq(sh.answer({ correct: true }).gained, 15);
    sh.advance();
    const r = sh.answer({ correct: true, hintUsed: true });
    eq(r.gained, 10);
    eq(r.combo, 0);
  });
  test('test day: 15 items, ~70% writing, no hints, no re-queue', () => {
    const sh = createShift({ kind: 'test', topic: 'house', words: WORDS, exercises: EXERCISES, getState: mkState(), ttsAvailable: true });
    eq(sh.queue.length, 15);
    const writing = sh.queue.filter((s) => ['type', 'fill-gap'].includes(s.type)).length;
    ok(writing >= 9, `writing ${writing}`);
    eq(sh.mode.hints, false);
    eq(sh.mode.german, false);
    sh.answer({ correct: false });
    eq(sh.queue.length, 15);
  });
  test('exam: 20 items from several topics', () => {
    const sh = createShift({ kind: 'exam', words: WORDS, exercises: EXERCISES, getState: mkState() });
    eq(sh.queue.length, 20);
    ok(new Set(sh.queue.map((s) => s.item.topic)).size >= 3);
  });

  return results;
}

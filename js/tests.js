// Unit tests. Run in the browser via tests.html (or in Node: node js/run-tests.mjs).
import { normalise, checkAnswer, diffExpected } from './check.js';
import { applyAnswer, newItemState, selectItems, fitness, weight } from './srs.js';
import { createShift, comboBonus, starsFor, playableItems, planFor, slotKey } from './lesson.js';
import { timeToWords, timeAnswers, hourHandPos, clockDistractors, halfPastHint, digital, timeWordDistractors, PATTERNS, makeTime } from './time.js';
import { makeScene, placePhrase, whereSentence, putSentence, prepOptions, withPrep, ANCHORS, PREPS, anchorsFor, prepMatches } from './prep.js';
import { spotFor } from './gfx/room.js';
import { placeZones } from './exercises/prep-place.js';
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
  const TOPICS = ['hobbies', 'house', 'prepositions', 'time', 'transport', 'london', 'jobs'];
  test('every line is playable', () => {
    const info = { words: WORDS, ttsAvailable: true, mode: {} };
    eq(playableItems(WORDS, 'prepositions', EXERCISES, info).length, 7);
    for (const t of TOPICS) ok(playableItems(WORDS, t, EXERCISES, info).length >= 7, t);
  });
  for (const topic of TOPICS) {
    test(`${topic}: every station builds 10 usable exercises`, () => {
      for (let station = 0; station < 5; station++) {
        for (const tts of [true, false]) {
          for (let rep = 0; rep < 3; rep++) {
            const sh = createShift({ kind: 'station', topic, station, words: WORDS, exercises: EXERCISES, getState: mkState(), ttsAvailable: tts });
            eq(sh.queue.length, 10, `station ${station}`);
            const plan = planFor(topic);
            for (const s of sh.queue) {
              ok(s.type && (plan.stations[station][s.type] !== undefined || (station >= 2 && plan.recognition[s.type] !== undefined)), `type ${s.type} at station ${station}`);
              ok(EXERCISES[s.type].canUse(s.item, sh.info), `${s.type} cannot show ${s.item.id}`);
              if (EXERCISES[s.type].makeParams && (s.item.kind === 'clock' || s.item.kind === 'prep')) ok(s.params, `${s.type} without params`);
              if (!tts) ok(s.type !== 'listen-pick', 'listen-pick without TTS');
            }
            for (let i = 1; i < sh.queue.length; i++) ok(slotKey(sh.queue[i]) !== slotKey(sh.queue[i - 1]), 'same question twice in a row');
          }
        }
      }
    });
  }
  test('clock line: mostly clocks, at least 30% of them half past', () => {
    for (let station = 0; station < 5; station++) {
      const sh = createShift({ kind: 'station', topic: 'time', station, words: WORDS, exercises: EXERCISES, getState: mkState() });
      const clocks = sh.queue.filter((s) => s.item.kind === 'clock');
      ok(clocks.length >= 6, `station ${station}: ${clocks.length} clocks`);
      ok(clocks.filter((s) => s.item.pattern === 'half-past').length >= Math.ceil(clocks.length * 0.3), 'half past share');
      if (station === 0) ok(clocks.every((s) => ['oclock', 'half-past'].includes(s.item.pattern)), "station 1: only o'clock / half past");
      for (const s of clocks) ok(Number.isInteger(s.params.h) && s.params.m === makeTime(s.item.pattern).m, 'time matches pattern');
    }
  });
  test('clock line: writing stations use clock-write, station 5 uses clock-set', () => {
    const types = (st) => {
      const all = new Set();
      for (let k = 0; k < 6; k++) createShift({ kind: 'station', topic: 'time', station: st, words: WORDS, exercises: EXERCISES, getState: mkState() }).queue.forEach((s) => all.add(s.type));
      return all;
    };
    ok(types(2).has('clock-write'));
    ok(types(4).has('clock-set'));
    ok(!types(0).has('clock-write'));
  });
  test('retry keeps the same time / scene', () => {
    const sh = createShift({ kind: 'station', topic: 'prepositions', station: 1, words: WORDS, exercises: EXERCISES, getState: mkState() });
    const first = sh.current;
    sh.answer({ correct: false });
    eq(sh.queue[sh.queue.length - 1].params, first.params);
    const sum = sh.finish();
    eq(sum.wrongDetails[0].params, first.params);
  });
  test('default lines use copy, sentence-order and match-pairs', () => {
    const seen = new Set();
    for (let k = 0; k < 8; k++) {
      for (let st = 0; st < 5; st++) {
        createShift({ kind: 'station', topic: 'house', station: st, words: WORDS, exercises: EXERCISES, getState: mkState() }).queue.forEach((s) => seen.add(s.type));
      }
    }
    for (const t of ['copy', 'sentence-order', 'match-pairs']) ok(seen.has(t), t);
  });
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
    const writing = sh.queue.filter((s) => ['type', 'fill-gap', 'copy'].includes(s.type)).length;
    ok(writing >= 9, `writing ${writing}`);
    eq(sh.mode.hints, false);
    eq(sh.mode.german, false);
    sh.answer({ correct: false });
    eq(sh.queue.length, 15);
  });
  test('test day works for the clock and the where line', () => {
    for (const topic of ['time', 'prepositions']) {
      const sh = createShift({ kind: 'test', topic, words: WORDS, exercises: EXERCISES, getState: mkState(), ttsAvailable: true });
      eq(sh.queue.length, 15, topic);
      const writing = sh.queue.filter((s) => ['type', 'fill-gap', 'copy', 'clock-write', 'prep-write'].includes(s.type)).length;
      ok(writing >= 9, `${topic} writing ${writing}`);
      for (const s of sh.queue) ok(EXERCISES[s.type].canUse(s.item, sh.info), `${s.type} / ${s.item.id}`);
      if (topic === 'time') ok(sh.queue.filter((s) => s.item.kind === 'clock').length >= 9, 'mostly clocks');
    }
  });
  test('exam: 20 items from several topics', () => {
    const sh = createShift({ kind: 'exam', words: WORDS, exercises: EXERCISES, getState: mkState() });
    eq(sh.queue.length, 20);
    ok(new Set(sh.queue.map((s) => s.item.topic)).size >= 3);
  });

  // ---------------- time.js ----------------
  group = 'time.js';
  test("o'clock / past / half / to in words", () => {
    eq(timeToWords(3, 0), "three o'clock");
    eq(timeToWords(3, 15), 'quarter past three');
    eq(timeToWords(7, 30), 'half past seven');
    eq(timeToWords(3, 45), 'quarter to four');
    eq(timeToWords(12, 45), 'quarter to one');
    eq(timeToWords(11, 45), 'quarter to twelve');
    eq(timeToWords(12, 30), 'half past twelve');
  });
  test("accepted forms: It's / It is / a quarter", () => {
    const { main, alts } = timeAnswers(8, 45);
    eq(main, 'quarter to nine');
    for (const a of ["It's quarter to nine", 'It is quarter to nine', 'a quarter to nine', "It's a quarter to nine"]) {
      ok(checkAnswer(a, main, alts).correct, a);
    }
    ok(checkAnswer('It’s quarter to nine.', main, alts).correct, 'curly apostrophe + dot');
    ok(!checkAnswer('quarter to eight', main, alts).correct, 'wrong hour');
    ok(checkAnswer("it's quarter to nine", main, alts).caseOnly, 'lowercase it is a case mistake');
    ok(!timeAnswers(3, 30).alts.includes('a half past three'), 'no "a half past"');
  });
  test('digital', () => {
    eq(digital(3, 45), '3:45');
    eq(digital(7, 0), '7:00');
  });
  test('hour hand sits between the numbers', () => {
    eq(hourHandPos(3, 0), 3);
    eq(hourHandPos(3, 15), 3.25);
    eq(hourHandPos(7, 30), 7.5);
    eq(hourHandPos(8, 45), 8.75);
    eq(hourHandPos(12, 30), 0.5);
  });
  test('half past hint: half past seven = halb acht', () => {
    eq(halfPastHint(7), { en: 'half past seven', digital: '7:30', de: 'halb acht' });
    eq(halfPastHint(12).de, 'halb eins');
  });
  test('clock distractors: 3 different wrong times, trap first', () => {
    for (let h = 1; h <= 12; h++) {
      for (const m of [0, 15, 30, 45]) {
        const d = clockDistractors(h, m);
        eq(d.length, 3);
        const words = d.map((t) => timeToWords(t.h, t.m));
        eq(new Set(words).size, 3);
        ok(!words.includes(timeToWords(h, m)), 'contains the answer');
      }
      const t0 = clockDistractors(h, 30)[0];
      eq(timeToWords(t0.h, t0.m), timeToWords(h + 1, 30));
      const limited = clockDistractors(h, 30, { patterns: ['oclock', 'half-past'] });
      eq(limited.length, 3);
      ok(limited.every((t) => t.m === 0 || t.m === 30), 'only allowed patterns');
    }
  });
  test('word tile distractors are not in the answer', () => {
    for (const m of [0, 15, 30, 45]) {
      const used = timeToWords(5, m).split(' ');
      const d = timeWordDistractors(5, m);
      eq(d.length, 2);
      ok(d.every((w) => !used.includes(w)));
    }
    eq(timeWordDistractors(7, 30)[0], 'eight');
  });
  test('clock pattern items exist', () => {
    for (const p of PATTERNS) ok(WORDS.find((w) => w.id === 'time:' + p), p);
  });

  // ---------------- prep.js / room ----------------
  group = 'prepositions';
  test('sentences', () => {
    const sc = { prep: 'under', object: 'cat', anchor: 'table', other: 'box', left: 'table', right: 'box' };
    eq(whereSentence(sc), 'The cat is under the table.');
    eq(putSentence(sc), 'Put the cat under the table.');
    eq(placePhrase(withPrep(sc, 'between')), 'between the table and the box');
    eq(placePhrase(withPrep(sc, 'in front of')), 'in front of the table');
  });
  test('every preposition has furniture and every scene fits the room', () => {
    for (const prep of PREPS) {
      ok(anchorsFor(prep).length >= 2, prep);
      for (let k = 0; k < 30; k++) {
        const sc = makeScene(prep);
        ok(sc.left !== sc.right && [sc.left, sc.right].includes(sc.anchor), 'two pieces');
        const s = spotFor(sc, prep);
        ok(s && s.x - s.size / 2 >= 0 && s.x + s.size / 2 <= 200 && s.y - s.size >= 0 && s.y <= 112, `${prep} ${sc.anchor} off canvas`);
      }
    }
    for (const [id, a] of Object.entries(ANCHORS)) for (const p of a.preps) ok(spotFor({ prep: p, anchor: id, left: id, right: 'box', object: 'cat' }, p), `${id} ${p}`);
  });
  test('options: different, right one included, no "next to" for between', () => {
    for (const prep of PREPS) {
      for (let k = 0; k < 20; k++) {
        const o = prepOptions(makeScene(prep));
        ok(o.length >= 3 && o.includes(prep) && new Set(o).size === o.length, prep);
        if (prep === 'between') ok(!o.includes('next to'));
      }
    }
  });
  test('drop zones: target included, at least 3 zones', () => {
    for (const prep of PREPS) {
      for (let k = 0; k < 20; k++) {
        const z = placeZones(makeScene(prep));
        ok(z.some((x) => x.prep === prep), prep);
        ok(z.length >= 3, `${prep}: ${z.length} zones`);
      }
    }
  });
  test('something between the table and the box is also next to the table', () => {
    ok(prepMatches('next to', 'between'));
    ok(!prepMatches('between', 'next to'));
    ok(!prepMatches('on', 'under'));
  });

  return results;
}

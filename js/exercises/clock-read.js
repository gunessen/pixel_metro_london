// Analog (sometimes digital) clock + 4 times in words: "Wie spät ist es?"
import { el } from '../ui.js';
import { timeToWords, makeTime, clockDistractors, digital } from '../time.js';
import { createClock, digitalClock } from '../gfx/clock.js';
import { shuffle } from '../srs.js';
import { instruction, optionGroup, clockNote } from './common.js';

/** Clock exercises show clock-pattern items; station 1 only uses some patterns. */
export function canUseClock(item, info) {
  return item.kind === 'clock' && (!info?.mode?.patterns || info.mode.patterns.includes(item.pattern));
}

export default {
  id: 'clock-read',
  skill: 'reading',
  canUse: canUseClock,
  makeParams(item, { rng }) {
    return { ...makeTime(item.pattern, rng), digital: rng() < 0.25 };
  },
  render(host, item, ctx) {
    const { h, m } = ctx.params;
    const right = timeToWords(h, m);
    const times = [{ h, m }, ...clockDistractors(h, m, { patterns: ctx.mode.patterns || undefined, rng: ctx.rng })];
    const opts = shuffle(times.map((t) => timeToWords(t.h, t.m)), ctx.rng);
    const group = optionGroup(opts, (o) => el('span.word', {}, o), ctx, { cls: 'option-word', sayOnSelect: (o) => o });
    group.node.classList.add('options-time');
    const face = ctx.params.digital ? digitalClock(h, m) : createClock({ h, m }).node;
    host.append(
      instruction('clock-read'),
      el('div.ex-row', {}, [el('div.ex-clock', {}, face), group.node]),
    );
    return {
      check() {
        group.lock();
        const s = group.selected();
        const correct = s === right;
        return { correct, caseOnly: false, expected: right, given: s ?? '', extra: digital(h, m), note: clockNote({ h, m }, correct) };
      },
      reveal() {
        group.reveal(right);
      },
    };
  },
};

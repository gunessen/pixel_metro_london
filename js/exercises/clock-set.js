// Read "It's quarter to nine." and set the hands (drag, or ◀ ▶ buttons).
import { el, button, speakBtn } from '../ui.js';
import { timeToWords, makeTime, digital } from '../time.js';
import { createClock, HAND_COLORS } from '../gfx/clock.js';
import { instruction, clockNote } from './common.js';
import { canUseClock } from './clock-read.js';
import { T } from '../i18n.js';

export default {
  id: 'clock-set',
  skill: 'reading',
  canUse: canUseClock,
  makeParams(item, { rng }) {
    const t = makeTime(item.pattern, rng);
    if (t.h === 12 && t.m === 0) t.h = 1 + Math.floor(rng() * 11); // the clock starts at 12:00
    return t;
  },
  render(host, item, ctx) {
    const { h, m } = ctx.params;
    const words = timeToWords(h, m);
    const sentence = `It's ${words}.`;
    const clock = createClock({ h: 12, m: 0, interactive: true, onChange: () => ctx.setReady(true) });
    let enabled = true;
    const step = (dh, dm) => {
      if (!enabled) return;
      const c = clock.get();
      clock.set(c.h + dh, c.m + dm);
      ctx.setReady(true);
    };
    const handRow = (label, color, dh, dm) =>
      el('div.hand-row', {}, [
        button('btn.btn-step', '◀', () => step(-dh, -dm), { 'aria-label': label + ' zurück' }),
        el('div.hand-label', {}, [el('span.hand-chip', { style: { background: color } }), label]),
        button('btn.btn-step', '▶', () => step(dh, dm), { 'aria-label': label + ' vor' }),
      ]);
    host.append(
      instruction('clock-set'),
      el('div.ex-prompt', {}, [el('span.word.word-big', {}, sentence), speakBtn(sentence)]),
      el('div.ex-row.ex-row-top', {}, [
        el('div.ex-clock', {}, [clock.node]),
        el('div.hand-controls', {}, [
          handRow(T.hourHand, HAND_COLORS.hour, 1, 0),
          handRow(T.minuteHand, HAND_COLORS.minute, 0, 15),
        ]),
      ]),
    );
    return {
      check() {
        enabled = false;
        clock.setEnabled(false);
        const c = clock.get();
        const correct = c.h === h && c.m === m;
        return {
          correct,
          caseOnly: false,
          expected: words,
          given: timeToWords(c.h, c.m),
          say: sentence,
          extra: digital(h, m),
          note: clockNote({ h, m }, correct),
        };
      },
      reveal(res) {
        clock.showAnswer({ h, m }, res.correct);
      },
    };
  },
};

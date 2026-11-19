// Analog clock: write the time in words. Word tiles at early stations, keyboard later.
import { el, speakBtn } from '../ui.js';
import { timeAnswers, makeTime, timeWordDistractors, digital } from '../time.js';
import { createClock } from '../gfx/clock.js';
import { checkAnswer } from '../check.js';
import { createField, createKeyboard } from '../keyboard.js';
import { instruction, clockNote, wordTiles } from './common.js';
import { hintButton } from './type.js';
import { canUseClock } from './clock-read.js';

export default {
  id: 'clock-write',
  skill: 'writing',
  canUse: canUseClock,
  makeParams(item, { rng }) {
    return makeTime(item.pattern, rng);
  },
  render(host, item, ctx) {
    const { h, m } = ctx.params;
    const { main, alts } = timeAnswers(h, m);
    const tiles = ctx.mode.gapMode === 'tiles';
    let getValue;
    let lock;
    let answerNode;
    let below = null;
    let destroy = () => {};
    let hintUsed = false;
    let field = null;

    if (tiles) {
      const board = wordTiles(main.split(' '), timeWordDistractors(h, m, ctx.rng, 2), {
        rng: ctx.rng,
        onChange: () => ctx.setReady(board.full()),
      });
      getValue = () => board.value();
      lock = () => board.lock();
      answerNode = board.answerNode;
      below = board.poolNode;
    } else {
      field = createField({ maxLength: 30, onChange: (v) => ctx.setReady(v.trim().length > 0) });
      const kb = createKeyboard(field, { onEnter: () => ctx.submit() });
      getValue = () => field.value;
      lock = () => kb.setEnabled(false);
      answerNode = el('div.ex-answer', {}, [field.node, ctx.mode.hints ? hintButton(main[0], () => (hintUsed = true)) : null]);
      below = kb.node;
      destroy = () => kb.destroy();
    }

    const clock = createClock({ h, m, cls: tiles ? '' : 'clock-small' });
    host.append(
      instruction('clock-write'),
      el('div.ex-row.ex-row-top', {}, [
        el('div.ex-clock', {}, [clock.node]),
        el('div.ex-answer.ex-answer-wide', {}, [
          el('div.ex-prompt.ex-prompt-left', {}, [el('span.word.word-mid', {}, 'What time is it?'), speakBtn('What time is it?')]),
          answerNode,
        ]),
      ]),
      below,
    );
    return {
      usesKeyboard: !tiles,
      check() {
        lock();
        const res = checkAnswer(getValue(), main, alts);
        // Wrote "It's …"? Then show the right answer in that form.
        if (!res.correct && !res.caseOnly && /^it('s| is) /i.test(res.given)) res.expected = "It's " + main;
        return { ...res, hintUsed, say: main, extra: digital(h, m), note: clockNote({ h, m }, res.correct) };
      },
      reveal(res) {
        if (field) field.setState(res.correct ? 'ok' : 'bad');
        else answerNode.classList.add(res.correct ? 'ok' : 'bad');
      },
      destroy,
    };
  },
};

// Fill the gap in a sentence: choice buttons (a/an, by/on), letter tiles, or typing.
import { el } from '../ui.js';
import { parseSentence, gapAlternatives } from '../content.js';
import { checkAnswer } from '../check.js';
import { createField, createKeyboard } from '../keyboard.js';
import { shuffle } from '../srs.js';
import { tileBoard, letterCount, MAX_TILE_LETTERS } from './tiles.js';
import { instruction, pictureBox, optionGroup } from './common.js';
import { hintButton } from './type.js';

export function gapMode(item, mode) {
  if (item.choices && mode.gapMode !== 'type') return 'choice';
  if (mode.gapMode === 'tiles' && letterCount(parseSentence(item.sentence).gap) <= MAX_TILE_LETTERS) return 'tiles';
  return 'type';
}

export default {
  id: 'fill-gap',
  skill: 'writing',
  canUse(item) {
    return !!item.img && !!parseSentence(item.sentence);
  },
  render(host, item, ctx) {
    const p = parseSentence(item.sentence);
    const mode = gapMode(item, ctx.mode);
    const gapNode = el('span.gap');
    const setGap = (v) => {
      gapNode.textContent = v || ' ';
      gapNode.classList.toggle('filled', !!v);
    };
    setGap('');
    const sentence = el('div.sentence', {}, [p.before, gapNode, p.after]);

    let getValue;
    let below = null;
    let lock = () => {};
    let destroy = () => {};
    let hintUsed = false;
    let extraTool = null;
    let usesKeyboard = false;

    if (mode === 'choice') {
      const group = optionGroup(shuffle(item.choices, ctx.rng), (c) => el('span.word', {}, c), {
        ...ctx,
        setReady: (v) => {
          setGap(group.selected());
          ctx.setReady(v);
        },
      }, { cls: 'option-word' });
      getValue = () => group.selected() ?? '';
      below = group.node;
      lock = () => group.lock();
    } else if (mode === 'tiles') {
      const board = tileBoard(p.gap, {
        extra: ctx.mode.extraLetters,
        rng: ctx.rng,
        onChange: () => {
          setGap(board.full() ? board.value() : '');
          ctx.setReady(board.full());
        },
      });
      getValue = () => board.value();
      below = board.node;
      lock = () => board.lock();
    } else {
      usesKeyboard = true;
      const field = createField({
        maxLength: p.gap.length + 12,
        onChange: (v) => {
          setGap(v);
          ctx.setReady(v.trim().length > 0);
        },
      });
      const kb = createKeyboard(field, { onEnter: () => ctx.submit() });
      gapNode.classList.add('typing');
      getValue = () => field.value;
      below = kb.node;
      lock = () => kb.setEnabled(false);
      destroy = () => kb.destroy();
      if (ctx.mode.hints) extraTool = hintButton(p.gap[0], () => (hintUsed = true));
    }

    host.append(
      instruction('fill-gap'),
      el('div.ex-row.ex-row-top', {}, [
        pictureBox(item, ctx, { sayText: p.full }),
        el('div.ex-answer', {}, [sentence, extraTool]),
      ]),
      below,
    );

    return {
      usesKeyboard,
      check() {
        lock();
        const res = checkAnswer(getValue(), p.gap, gapAlternatives(item));
        return { ...res, hintUsed, say: p.full, sentence: p };
      },
      reveal(res) {
        gapNode.classList.add(res.correct ? 'ok' : 'bad');
      },
      destroy,
    };
  },
};

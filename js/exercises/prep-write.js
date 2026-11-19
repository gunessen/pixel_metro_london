// Room scene + "The cat is ____ the table." — build (tiles) or type the preposition.
import { el, speakBtn } from '../ui.js';
import { placeRest, whereSentence, objectWord } from '../prep.js';
import { createRoom } from '../gfx/room.js';
import { checkAnswer } from '../check.js';
import { createField, createKeyboard } from '../keyboard.js';
import { tileBoard } from './tiles.js';
import { instruction } from './common.js';
import { hintButton } from './type.js';
import { canUsePrep, makePrepScene } from './prep-pick.js';

export default {
  id: 'prep-write',
  skill: 'writing',
  canUse: canUsePrep,
  makeParams: makePrepScene,
  render(host, item, ctx) {
    const scene = ctx.params;
    const p = { before: `The ${objectWord(scene)} is `, gap: scene.prep, after: ` ${placeRest(scene)}.` };
    p.full = p.before + p.gap + p.after;
    const gapNode = el('span.gap');
    const setGap = (v) => {
      gapNode.textContent = v || ' ';
      gapNode.classList.toggle('filled', !!v);
    };
    setGap('');
    let getValue;
    let lock;
    let below;
    let destroy = () => {};
    let hintUsed = false;
    let hint = null;
    const typed = ctx.mode.gapMode !== 'tiles';
    if (!typed) {
      const board = tileBoard(p.gap, {
        extra: ctx.mode.extraLetters,
        rng: ctx.rng,
        onChange: () => {
          setGap(board.full() ? board.value() : '');
          ctx.setReady(board.full());
        },
      });
      getValue = () => board.value();
      lock = () => board.lock();
      below = board.node;
    } else {
      const field = createField({
        maxLength: 20,
        onChange: (v) => {
          setGap(v);
          ctx.setReady(v.trim().length > 0);
        },
      });
      const kb = createKeyboard(field, { onEnter: () => ctx.submit() });
      gapNode.classList.add('typing');
      getValue = () => field.value;
      lock = () => kb.setEnabled(false);
      below = kb.node;
      destroy = () => kb.destroy();
      if (ctx.mode.hints) hint = hintButton(p.gap[0], () => (hintUsed = true));
    }
    host.append(
      instruction('prep-write'),
      el('div.ex-row.ex-row-top', {}, [
        el('div.ex-room' + (typed ? '.ex-room-small' : ''), {}, [createRoom(scene).node]),
        el('div.ex-answer', {}, [
          el('div.sentence', {}, [p.before, gapNode, p.after]),
          el('div.ex-tools', {}, [speakBtn(`Where is the ${objectWord(scene)}?`), hint]),
        ]),
      ]),
      below,
    );
    return {
      usesKeyboard: typed,
      check() {
        lock();
        return { ...checkAnswer(getValue(), p.gap, []), hintUsed, say: whereSentence(scene), sentence: p };
      },
      reveal(res) {
        gapNode.classList.add(res.correct ? 'ok' : 'bad');
      },
      destroy,
    };
  },
};

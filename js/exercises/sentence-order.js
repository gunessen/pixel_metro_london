// Put the words of a sentence in the right order (word tiles).
import { el, speakBtn } from '../ui.js';
import { parseSentence } from '../content.js';
import { checkAnswer } from '../check.js';
import { whereSentence } from '../prep.js';
import { createRoom } from '../gfx/room.js';
import { instruction, pictureBox, wordTiles } from './common.js';
import { makePrepScene } from './prep-pick.js';

export const MIN_WORDS = 3;
export const MAX_WORDS = 9;

function wordCount(s) {
  return s.split(' ').length;
}

export default {
  id: 'sentence-order',
  skill: 'reading',
  canUse(item) {
    if (item.kind === 'prep') return true;
    const p = parseSentence(item.sentence);
    return !!item.img && !!p && wordCount(p.full) >= MIN_WORDS && wordCount(p.full) <= MAX_WORDS;
  },
  makeParams(item, o) {
    return item.kind === 'prep' ? makePrepScene(item, o) : null;
  },
  render(host, item, ctx) {
    const prep = item.kind === 'prep';
    const sentence = prep ? whereSentence(ctx.params) : parseSentence(item.sentence).full;
    const board = wordTiles(sentence.split(' '), [], { rng: ctx.rng, onChange: () => ctx.setReady(board.full()) });
    const visual = prep ? el('div.ex-room.ex-room-small', {}, [createRoom(ctx.params).node]) : pictureBox(item, ctx);
    host.append(
      instruction('sentence-order'),
      el('div.ex-row.ex-row-top', {}, [visual, el('div.ex-answer.ex-answer-wide', {}, [board.answerNode])]),
      board.poolNode,
    );
    return {
      check() {
        board.lock();
        return { ...checkAnswer(board.value(), sentence, []), say: sentence };
      },
      reveal(res) {
        board.answerNode.classList.add(res.correct ? 'ok' : 'bad');
        if (!res.correct) board.answerNode.after(speakBtn(sentence));
      },
    };
  },
};

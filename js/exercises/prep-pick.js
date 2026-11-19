// Room scene + "Where is the cat?" + 4 phrases ("under the table", …).
import { el, speakBtn } from '../ui.js';
import { makeScene, withPrep, placePhrase, whereSentence, whereQuestion, prepOptions, OBJECT_BY_ID } from '../prep.js';
import { createRoom } from '../gfx/room.js';
import { shuffle } from '../srs.js';
import { instruction, optionGroup } from './common.js';
import { T } from '../i18n.js';

export function canUsePrep(item) {
  return item.kind === 'prep';
}

export function makePrepScene(item, { rng }) {
  return makeScene(item.en, rng);
}

export default {
  id: 'prep-pick',
  skill: 'reading',
  canUse: canUsePrep,
  makeParams: makePrepScene,
  render(host, item, ctx) {
    const scene = ctx.params;
    const right = placePhrase(scene);
    const opts = shuffle(prepOptions(scene, ctx.rng).map((p) => placePhrase(withPrep(scene, p))), ctx.rng);
    const group = optionGroup(opts, (o) => el('span.word', {}, o), ctx, { cls: 'option-word', sayOnSelect: (o) => o });
    group.node.classList.add('options-prep');
    const q = whereQuestion(scene);
    host.append(
      instruction('prep-pick', T['prep-pick'](OBJECT_BY_ID[scene.object].de)),
      el('div.ex-row.ex-row-top', {}, [
        el('div.ex-room', {}, [
          createRoom(scene).node,
          el('div.ex-prompt', {}, [el('span.word.word-mid', {}, q), speakBtn(q)]),
        ]),
        group.node,
      ]),
    );
    return {
      check() {
        group.lock();
        const s = group.selected();
        return { correct: s === right, caseOnly: false, expected: right, given: s ?? '', say: whereSentence(scene) };
      },
      reveal() {
        group.reveal(right);
      },
    };
  },
};

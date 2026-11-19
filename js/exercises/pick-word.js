// Picture + 4 English words: tap the right word.
import { el } from '../ui.js';
import { isWordItem, distractors } from '../content.js';
import { shuffle } from '../srs.js';
import { instruction, pictureBox, optionGroup } from './common.js';

export default {
  id: 'pick-word',
  skill: 'reading',
  canUse(item, info) {
    return isWordItem(item) && distractors(item, info.words, 3).length === 3;
  },
  render(host, item, ctx) {
    const opts = shuffle([item, ...distractors(item, ctx.words, 3, ctx.rng)], ctx.rng);
    const group = optionGroup(opts, (o) => el('span.word', {}, o.en), ctx, {
      cls: 'option-word',
      sayOnSelect: (o) => o.en,
    });
    host.append(
      instruction('pick-word'),
      el('div.ex-row', {}, [pictureBox(item, ctx), group.node]),
    );
    return {
      check() {
        group.lock();
        const s = group.selected();
        return { correct: s === item, caseOnly: false, expected: item.en, given: s?.en ?? '' };
      },
      reveal() {
        group.reveal(item);
      },
    };
  },
};

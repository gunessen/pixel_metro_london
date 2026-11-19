// English word + 4 pictures: tap the right picture.
import { el, speakBtn, germanBtn } from '../ui.js';
import { isWordItem, distractors } from '../content.js';
import { picture } from '../gfx/picture.js';
import { shuffle } from '../srs.js';
import { instruction, optionGroup } from './common.js';

export default {
  id: 'pick-picture',
  skill: 'reading',
  canUse(item, info) {
    return isWordItem(item) && distractors(item, info.words, 3).length === 3;
  },
  render(host, item, ctx) {
    const opts = shuffle([item, ...distractors(item, ctx.words, 3, ctx.rng)], ctx.rng);
    const group = optionGroup(opts, (o) => picture(o), ctx, { cls: 'option-pic' });
    host.append(
      instruction('pick-picture'),
      el('div.ex-prompt', {}, [
        el('span.word.word-big', {}, item.en),
        speakBtn(item.en),
        ctx.mode.german ? germanBtn(item) : null,
      ]),
      group.node,
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

// Hear the word (TTS) + 4 pictures. Only offered when an English voice exists.
import { el } from '../ui.js';
import { isWordItem, distractors } from '../content.js';
import { picture } from '../gfx/picture.js';
import { shuffle } from '../srs.js';
import { speak } from '../tts.js';
import { instruction, optionGroup } from './common.js';
import { T } from '../i18n.js';

export default {
  id: 'listen-pick',
  skill: 'listening',
  canUse(item, info) {
    return !!info.ttsAvailable && isWordItem(item) && distractors(item, info.words, 3).length === 3;
  },
  render(host, item, ctx) {
    const opts = shuffle([item, ...distractors(item, ctx.words, 3, ctx.rng)], ctx.rng);
    const group = optionGroup(opts, (o) => picture(o), ctx, { cls: 'option-pic' });
    const play = () => speak(item.en);
    const big = el('button.btn.btn-listen', { type: 'button', onclick: play, 'aria-label': T.listen }, '🔊');
    const slow = el('button.btn.btn-listen.btn-listen-slow', {
      type: 'button',
      onclick: () => speak(item.en, { rate: 0.6 }),
      'aria-label': T.slow,
    }, '🐢');
    host.append(instruction('listen-pick'), el('div.ex-prompt', {}, [big, slow]), group.node);
    const t = setTimeout(play, 350);
    return {
      check() {
        group.lock();
        const s = group.selected();
        return { correct: s === item, caseOnly: false, expected: item.en, given: s?.en ?? '' };
      },
      reveal() {
        group.reveal(item);
      },
      destroy() {
        clearTimeout(t);
      },
    };
  },
};

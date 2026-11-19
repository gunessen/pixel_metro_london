// Match 4–5 pictures with their words. Counts as one exercise; perfect = no mix-ups.
import { el } from '../ui.js';
import { isWordItem, distractors } from '../content.js';
import { picture } from '../gfx/picture.js';
import { shuffle } from '../srs.js';
import { speak } from '../tts.js';
import { sfx } from '../audio.js';
import { instruction } from './common.js';
import { T } from '../i18n.js';

export default {
  id: 'match-pairs',
  skill: 'reading',
  canUse(item, info) {
    return isWordItem(item) && distractors(item, info.words, 3).length === 3;
  },
  render(host, item, ctx) {
    const items = shuffle([item, ...distractors(item, ctx.words, 4, ctx.rng)], ctx.rng);
    const words = shuffle(items, ctx.rng);
    const mixedUp = new Set();
    let matched = 0;
    let selPic = null;
    let selWord = null;
    let done = false;

    const picBtns = new Map();
    const wordBtns = new Map();
    const select = (kind, it) => {
      if (done) return;
      const btns = kind === 'pic' ? picBtns : wordBtns;
      if (btns.get(it).classList.contains('matched')) return;
      sfx.click();
      if (kind === 'pic') selPic = selPic === it ? null : it;
      else {
        selWord = selWord === it ? null : it;
        if (selWord) speak(it.en);
      }
      picBtns.forEach((b, k) => b.classList.toggle('selected', k === selPic));
      wordBtns.forEach((b, k) => b.classList.toggle('selected', k === selWord));
      if (selPic && selWord) tryMatch();
    };
    const tryMatch = () => {
      const p = picBtns.get(selPic);
      const w = wordBtns.get(selWord);
      if (selPic === selWord) {
        matched++;
        const colour = `var(--pair-${matched})`;
        for (const b of [p, w]) {
          b.classList.remove('selected');
          b.classList.add('matched');
          b.style.setProperty('--pair', colour);
        }
        sfx.coin();
        if (matched === items.length) {
          done = true;
          ctx.setReady(true);
          setTimeout(() => ctx.submit(), 500);
        }
      } else {
        mixedUp.add(selPic);
        mixedUp.add(selWord);
        sfx.wrong();
        for (const b of [p, w]) {
          b.classList.remove('selected');
          b.classList.add('shake');
          setTimeout(() => b.classList.remove('shake'), 450);
        }
      }
      selPic = null;
      selWord = null;
    };

    for (const it of items) {
      picBtns.set(it, el('button.option.pair-pic', { type: 'button', 'data-id': it.id, onclick: () => select('pic', it) }, picture(it)));
    }
    for (const it of words) {
      wordBtns.set(it, el('button.option.option-word.pair-word', { type: 'button', 'data-id': it.id, onclick: () => select('word', it) }, el('span.word', {}, it.en)));
    }
    host.append(
      instruction('match-pairs'),
      el('div.pairs', {}, [
        el('div.pairs-row', {}, [...picBtns.values()]),
        el('div.pairs-row', {}, [...wordBtns.values()]),
      ]),
    );
    return {
      noCheck: true,
      check() {
        const list = items.filter((it) => mixedUp.has(it));
        return {
          correct: list.length === 0,
          caseOnly: false,
          expected: item.en,
          given: '',
          say: list.map((it) => it.en).join(', ') || item.en,
          answerLabel: T.pairsMixed,
          answerNode: el('div.fb-pairs', {}, list.map((it) => el('span.fb-pair', {}, [picture(it), el('span.word', {}, it.en)]))),
        };
      },
    };
  },
};

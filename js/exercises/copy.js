// Abschreiben: the word is shown for 3 seconds, then hidden; type it from memory.
import { el, button } from '../ui.js';
import { isWordItem } from '../content.js';
import { checkAnswer } from '../check.js';
import { createField, createKeyboard } from '../keyboard.js';
import { instruction, pictureBox } from './common.js';
import { speak } from '../tts.js';
import { T } from '../i18n.js';

export const SHOW_MS = 3000;

export default {
  id: 'copy',
  skill: 'writing',
  usesKeyboard: true,
  canUse(item) {
    return isWordItem(item);
  },
  render(host, item, ctx) {
    let hintUsed = false;
    const timers = [];
    const field = createField({ maxLength: item.en.length + 12, onChange: (v) => ctx.setReady(v.trim().length > 0) });
    const kb = createKeyboard(field, { onEnter: () => ctx.submit() });
    const word = el('span.word.copy-word', {}, item.en);
    const bar = el('div.copy-bar-fill');
    const card = el('div.copy-card', {}, [el('div.copy-label', {}, T.memorize), word, el('div.copy-bar', {}, bar)]);

    const show = (ms) => {
      card.classList.remove('hidden-word');
      kb.setEnabled(false);
      bar.style.transition = 'none';
      bar.style.width = '100%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.transition = `width ${ms}ms linear`;
        bar.style.width = '0%';
      }));
      timers.push(setTimeout(() => {
        card.classList.add('hidden-word');
        kb.setEnabled(true);
      }, ms));
    };

    const peek = ctx.mode.hints
      ? button('btn.btn-small.btn-hint', '👀 ' + T.peek, () => {
        hintUsed = true;
        show(1500);
      })
      : null;

    host.append(
      instruction('copy'),
      el('div.ex-row.ex-row-top', {}, [
        pictureBox(item, ctx),
        el('div.ex-answer', {}, [card, field.node, peek]),
      ]),
      kb.node,
    );
    show(SHOW_MS);
    timers.push(setTimeout(() => speak(item.en), 300));
    return {
      usesKeyboard: true,
      check() {
        kb.setEnabled(false);
        card.classList.remove('hidden-word');
        return { ...checkAnswer(field.value, item.en, item.alt), hintUsed };
      },
      reveal(res) {
        field.setState(res.correct ? 'ok' : 'bad');
      },
      destroy() {
        timers.forEach(clearTimeout);
        kb.destroy();
      },
    };
  },
};

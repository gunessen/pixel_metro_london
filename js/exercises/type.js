// Type the word on the in-game keyboard.
import { el, button } from '../ui.js';
import { isWordItem } from '../content.js';
import { checkAnswer } from '../check.js';
import { createField, createKeyboard } from '../keyboard.js';
import { instruction, pictureBox } from './common.js';
import { T } from '../i18n.js';

/** Hint button showing the first letter. Calls onUse once. */
export function hintButton(firstLetter, onUse) {
  const text = el('span.hint-text', { hidden: true }, T.hintText(firstLetter));
  const b = button('btn.btn-small.btn-hint', '💡 ' + T.hint, () => {
    text.hidden = false;
    b.hidden = true;
    onUse();
  });
  return el('span.hint-wrap', {}, [b, text]);
}

export default {
  id: 'type',
  skill: 'writing',
  usesKeyboard: true,
  canUse(item) {
    return isWordItem(item);
  },
  render(host, item, ctx) {
    let hintUsed = false;
    const field = createField({ maxLength: item.en.length + 12, onChange: (v) => ctx.setReady(v.trim().length > 0) });
    const kb = createKeyboard(field, { onEnter: () => ctx.submit() });
    host.append(
      instruction('type'),
      el('div.ex-row.ex-row-top', {}, [
        pictureBox(item, ctx, { sayText: item.en }),
        el('div.ex-answer', {}, [
          field.node,
          ctx.mode.hints ? hintButton(item.en[0], () => (hintUsed = true)) : null,
        ]),
      ]),
      kb.node,
    );
    return {
      usesKeyboard: true,
      check() {
        kb.setEnabled(false);
        return { ...checkAnswer(field.value, item.en, item.alt), hintUsed };
      },
      reveal(res) {
        field.setState(res.correct ? 'ok' : 'bad');
      },
      destroy() {
        kb.destroy();
      },
    };
  },
};

// On-screen pixel QWERTZ keyboard, so the Android keyboard (with autocorrect) never opens.
// Answer fields are plain divs. Physical keyboards also work (desktop testing).
import { el } from './ui.js';
import { sfx } from './audio.js';
import { T } from './i18n.js';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', "'"],
  ['SHIFT', 'y', 'x', 'c', 'v', 'b', 'n', 'm', '-', 'BACK'],
  ['SPACE', 'ENTER'],
];

const ALLOWED = /^[a-zA-Z' -]$/;

/** A text field rendered as a div with a blinking caret. */
export function createField({ maxLength = 40, onChange } = {}) {
  let value = '';
  const text = el('span.field-text');
  const caret = el('span.caret');
  const node = el('div.answer-field', { role: 'textbox' }, [text, caret]);
  const render = () => {
    text.textContent = value;
    node.classList.toggle('empty', !value);
  };
  render();
  return {
    node,
    get value() {
      return value;
    },
    set value(v) {
      value = v;
      render();
      onChange?.(value);
    },
    insert(ch) {
      if (value.length >= maxLength) return;
      // no double spaces, no leading space
      if (ch === ' ' && (value === '' || value.endsWith(' '))) return;
      this.value = value + ch;
    },
    backspace() {
      if (value) this.value = value.slice(0, -1);
    },
    setState(cls) {
      node.classList.remove('ok', 'bad');
      if (cls) node.classList.add(cls);
    },
  };
}

/**
 * @param field from createField()
 * @param onEnter called by the ✔ key / Enter
 * @returns { node, destroy(), setEnabled(bool) }
 */
export function createKeyboard(field, { onEnter } = {}) {
  let shift = 'off'; // 'off' | 'once' | 'lock'
  let lastShiftTap = 0;
  let enabled = true;
  const letterKeys = [];
  let shiftKey;

  const updateShift = () => {
    for (const k of letterKeys) k.textContent = shift === 'off' ? k.dataset.ch : k.dataset.ch.toUpperCase();
    shiftKey.classList.toggle('active', shift !== 'off');
    shiftKey.classList.toggle('lock', shift === 'lock');
  };

  const press = (key) => {
    if (!enabled) return;
    sfx.click();
    if (key === 'SHIFT') {
      const nowT = Date.now();
      if (shift === 'off') shift = 'once';
      else if (shift === 'once') shift = nowT - lastShiftTap < 450 ? 'lock' : 'off';
      else shift = 'off';
      lastShiftTap = nowT;
      updateShift();
      return;
    }
    if (key === 'BACK') return field.backspace();
    if (key === 'ENTER') return onEnter?.();
    if (key === 'SPACE') return field.insert(' ');
    let ch = key;
    if (/[a-z]/.test(ch) && shift !== 'off') ch = ch.toUpperCase();
    field.insert(ch);
    if (shift === 'once') {
      shift = 'off';
      updateShift();
    }
  };

  const rows = ROWS.map((row) =>
    el('div.kb-row', {}, row.map((k) => {
      let label = k;
      let cls = 'kb-key';
      if (k === 'SHIFT') { label = '⇧'; cls += ' kb-shift kb-wide'; }
      else if (k === 'BACK') { label = '⌫'; cls += ' kb-back kb-wide'; }
      else if (k === 'SPACE') { label = 'Leertaste'; cls += ' kb-space'; }
      else if (k === 'ENTER') { label = '✔ ' + T.check; cls += ' kb-enter'; }
      const b = el('button.' + cls.split(' ').join('.'), {
        type: 'button',
        'data-ch': k,
        onpointerdown: (ev) => {
          ev.preventDefault(); // keep focus/selection away, fast response
          b.classList.add('down');
          press(k);
        },
        onpointerup: () => b.classList.remove('down'),
        onpointerleave: () => b.classList.remove('down'),
        onpointercancel: () => b.classList.remove('down'),
      }, label);
      if (/^[a-z]$/.test(k)) letterKeys.push(b);
      if (k === 'SHIFT') shiftKey = b;
      return b;
    })),
  );
  const node = el('div.keyboard', {}, rows);

  const onKeyDown = (ev) => {
    if (!enabled || ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (document.querySelector('.modal-overlay')) return;
    if (ev.key === 'Backspace') { ev.preventDefault(); press('BACK'); }
    else if (ev.key === 'Enter') { ev.preventDefault(); press('ENTER'); }
    else if (ev.key.length === 1 && ALLOWED.test(ev.key)) {
      ev.preventDefault();
      sfx.click();
      field.insert(ev.key);
    } else if ("’‘´`".includes(ev.key) && ev.key.length === 1) {
      ev.preventDefault();
      field.insert("'");
    }
  };
  window.addEventListener('keydown', onKeyDown);
  updateShift();

  return {
    node,
    setEnabled(v) {
      enabled = v;
      node.classList.toggle('disabled', !v);
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}

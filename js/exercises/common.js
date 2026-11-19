// Shared building blocks for exercises.
import { el, speakBtn, germanBtn } from '../ui.js';
import { picture } from '../gfx/picture.js';
import { speak } from '../tts.js';
import { T } from '../i18n.js';

export function instruction(type) {
  return el('div.ex-instr', {}, T[type]);
}

/** Big picture with optional 🔊 (speaks `sayText`) and 🇩🇪 buttons underneath. */
export function pictureBox(item, ctx, { sayText = null } = {}) {
  return el('div.ex-picture', {}, [
    picture(item),
    el('div.ex-picture-tools', {}, [
      sayText ? speakBtn(sayText) : null,
      ctx.mode.german ? germanBtn(item) : null,
    ]),
  ]);
}

/**
 * A set of selectable option buttons. `content(opt)` returns the button's children.
 * @returns { node, buttons, selected(), lock(), reveal(correctOpt) }
 */
export function optionGroup(opts, content, ctx, { cls = '', sayOnSelect = null } = {}) {
  let sel = null;
  let locked = false;
  const buttons = opts.map((o) => {
    const b = el('button.option' + (cls ? '.' + cls : ''), {
      type: 'button',
      onclick: () => {
        if (locked) return;
        sel = o;
        buttons.forEach((x) => x.classList.toggle('selected', x === b));
        if (sayOnSelect) speak(sayOnSelect(o));
        ctx.setReady(true);
      },
    }, content(o));
    return b;
  });
  const node = el('div.options' + (cls ? '.' + cls + 's' : ''), {}, buttons);
  node._opts = opts; // used by the ?debug test hooks
  return {
    node,
    buttons,
    selected: () => sel,
    lock() {
      locked = true;
    },
    reveal(correct) {
      opts.forEach((o, i) => {
        if (o === correct) buttons[i].classList.add('ok');
        else if (o === sel) buttons[i].classList.add('bad');
        else buttons[i].classList.add('dim');
      });
    },
  };
}

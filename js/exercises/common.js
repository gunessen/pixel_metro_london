// Shared building blocks for exercises.
import { el, speakBtn, germanBtn } from '../ui.js';
import { picture } from '../gfx/picture.js';
import { speak } from '../tts.js';
import { shuffle } from '../srs.js';
import { sfx } from '../audio.js';
import { T } from '../i18n.js';
import { halfPastHint } from '../time.js';

export function instruction(type, text = null) {
  return el('div.ex-instr', {}, text ?? T[type]);
}

/** Extra feedback for wrong clock answers: the German "halb" trap. */
export function clockNote({ h, m }, correct) {
  if (correct || m !== 30) return null;
  const x = halfPastHint(h);
  const [halb, hour] = x.de.split(' ');
  return el('div.fb-note', {}, [
    T.halfPastWarn + ' ',
    el('span.word', {}, x.en),
    ` = ${x.digital} = ${T.halfPastDe} ${halb} `,
    el('b', {}, hour),
    '!',
  ]);
}

/**
 * Tappable word tiles that build a phrase or sentence in order.
 * @returns { node, answerNode, poolNode, value(), full(), lock() }
 */
export function wordTiles(tokens, extra = [], { rng = Math.random, onChange } = {}) {
  let locked = false;
  const placed = []; // tile objects in answer order
  const answerNode = el('div.wt-answer');
  const all = [...tokens, ...extra];
  let order = shuffle(all, rng);
  for (let k = 0; k < 10 && order.length > 1 && order.slice(0, tokens.length).join(' ') === tokens.join(' '); k++) {
    order = shuffle(all, rng);
  }
  const renderAnswer = () => {
    answerNode.replaceChildren(...placed.map((t) => t.answerBtn));
    answerNode.classList.toggle('empty', !placed.length);
  };
  const tiles = order.map((word) => {
    const t = { word };
    t.answerBtn = el('button.wt-tile.word', {
      type: 'button',
      onclick: () => {
        if (locked) return;
        sfx.click();
        placed.splice(placed.indexOf(t), 1);
        t.poolBtn.classList.remove('used');
        renderAnswer();
        onChange?.();
      },
    }, word);
    t.poolBtn = el('button.wt-tile.word', {
      type: 'button',
      onclick: () => {
        if (locked || t.poolBtn.classList.contains('used')) return;
        sfx.click();
        placed.push(t);
        t.poolBtn.classList.add('used');
        renderAnswer();
        onChange?.();
      },
    }, word);
    return t;
  });
  const poolNode = el('div.wt-pool', {}, tiles.map((t) => t.poolBtn));
  renderAnswer();
  return {
    node: el('div.wt-board', {}, [answerNode, poolNode]),
    answerNode,
    poolNode,
    value: () => placed.map((t) => t.word).join(' '),
    full: () => placed.length >= tokens.length,
    lock() {
      locked = true;
      answerNode.classList.add('locked');
      poolNode.classList.add('locked');
    },
  };
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

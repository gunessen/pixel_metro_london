// Small DOM helpers shared by screens and exercises.
import { speak, tts } from './tts.js';
import { sfx } from './audio.js';
import { T } from './i18n.js';

/** el('div.foo.bar', {onclick, text, html, ...attrs}, children) */
export function el(spec, props = {}, children = []) {
  const [tag, ...classes] = spec.split('.');
  const e = document.createElement(tag || 'div');
  if (classes.length) e.className = classes.join(' ');
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) e.style.setProperty(sk, sv);
        else e.style[sk] = sv;
      }
    }
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return e;
}

export function button(spec, label, onclick, props = {}) {
  return el('button.' + spec.replace(/^button\.?/, ''), {
    type: 'button',
    ...props,
    onclick: (ev) => {
      sfx.click();
      onclick?.(ev);
    },
  }, label);
}

/** 🔊 button that speaks English text. Hidden when no English voice exists. */
export function speakBtn(text, extraClass = '') {
  const b = el('button.btn-icon.speak' + (extraClass ? '.' + extraClass : ''), {
    type: 'button',
    title: T.listen,
    'aria-label': T.listen,
    onclick: (ev) => {
      ev.stopPropagation();
      speak(typeof text === 'function' ? text() : text);
    },
  }, '🔊');
  if (!tts.available) b.hidden = true;
  return b;
}

/** 🇩🇪 button that reveals the German translation in a bubble. */
export function germanBtn(item) {
  const bubble = el('span.de-bubble', { hidden: true }, item.de);
  const b = el('button.btn-icon.de-btn', {
    type: 'button',
    title: T.german,
    'aria-label': T.german,
    onclick: (ev) => {
      ev.stopPropagation();
      sfx.click();
      bubble.hidden = !bubble.hidden;
    },
  }, 'DE');
  return el('span.de-wrap', {}, [b, bubble]);
}

export function toast(msg, ms = 2200) {
  const t = el('div.toast', {}, msg);
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, ms);
}

/** Modal yes/no dialog. Resolves true/false. */
export function confirmDialog(title, sub = '', { yes = T.yes, no = T.no } = {}) {
  return new Promise((resolve) => {
    const close = (v) => {
      overlay.remove();
      resolve(v);
    };
    const overlay = el('div.modal-overlay', {}, [
      el('div.modal.panel', {}, [
        el('h2', {}, title),
        sub ? el('p', {}, sub) : null,
        el('div.modal-buttons', {}, [
          button('btn.btn-secondary', no, () => close(false)),
          button('btn.btn-danger', yes, () => close(true)),
        ]),
      ]),
    ]);
    document.body.append(overlay);
  });
}

/** Render the expected answer with letters that differ from the given answer highlighted. */
export function diffNode(parts) {
  return el('span.diff', {}, parts.map((p) => el(p.ok ? 'span' : 'span.diff-bad', {}, p.ch === ' ' ? ' ' : p.ch)));
}

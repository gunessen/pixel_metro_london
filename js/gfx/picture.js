// Turns an item's `img` into a DOM element (pixel picture, placeholder card or big text).
import { emojiDataURL } from './emoji.js';
import { spriteDataURL, PLACEHOLDERS } from './sprites.js';

function pixelImg(url) {
  const im = document.createElement('img');
  im.className = 'pic-img';
  im.src = url;
  im.alt = '';
  im.draggable = false;
  return im;
}

function card(emoji, label) {
  const d = document.createElement('div');
  d.className = 'pic-card';
  const url = emoji && emojiDataURL(emoji);
  if (url) {
    const im = pixelImg(url);
    im.classList.add('pic-card-img');
    d.append(im);
  }
  if (label) {
    const l = document.createElement('div');
    l.className = 'pic-card-label';
    l.textContent = label;
    d.append(l);
  }
  if (!url && !label) d.textContent = '?';
  return d;
}

/**
 * @param item vocabulary item (uses item.img and item.de)
 * @returns HTMLElement with class "pic"
 */
export function picture(item) {
  const wrap = document.createElement('div');
  wrap.className = 'pic';
  const img = item.img || '';
  const [kind, ...rest] = img.split(':');
  const val = rest.join(':');
  if (kind === 'emoji') {
    const url = emojiDataURL(val);
    wrap.append(url ? pixelImg(url) : card(null, item.de));
  } else if (kind === 'sprite') {
    const url = spriteDataURL(val);
    if (url) wrap.append(pixelImg(url));
    else {
      const ph = PLACEHOLDERS[val] || {};
      wrap.append(card(ph.emoji, ph.label || item.de));
    }
  } else if (kind === 'text') {
    const t = document.createElement('div');
    t.className = 'pic-text';
    t.textContent = val;
    wrap.append(t);
  } else {
    wrap.append(card(null, item.de));
  }
  return wrap;
}

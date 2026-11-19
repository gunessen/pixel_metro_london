// Pixel clock: the face and hands are drawn on a small canvas (shown upscaled, pixelated);
// the numbers 1–12 are HTML on top, so they stay readable.
// The hour hand sits between the numbers for :15 / :30 / :45.
import { el } from '../ui.js';
import { hourHandPos, wrapHour, digital } from '../time.js';
import { sfx } from '../audio.js';

const S = 112; // canvas size in "pixels"
const C = S / 2;
const R = 52; // outer radius

export const HAND_COLORS = { hour: '#b13e53', minute: '#3b5dc9' };
const COL = {
  rim: '#1a1c2c',
  brass: '#ffcd75',
  brassD: '#c28a4e',
  face: '#f4f4f4',
  shade: '#dfe4ea',
  tick: '#333c57',
  tickQ: '#1a1c2c',
  ok: '#38b764',
  bad: '#ef7d57',
};

function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
}

function thickLine(ctx, x0, y0, x1, y1, w, color) {
  ctx.fillStyle = color;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
  }
}

function hand(ctx, turns, len, w, color) {
  const a = turns * 2 * Math.PI;
  const x = C + Math.sin(a) * len;
  const y = C - Math.cos(a) * len;
  // short tail behind the centre, thick body, thinner tip
  thickLine(ctx, C - Math.sin(a) * 4, C + Math.cos(a) * 4, C + Math.sin(a) * (len - 5), C - Math.cos(a) * (len - 5), w, color);
  thickLine(ctx, C + Math.sin(a) * (len - 6), C - Math.cos(a) * (len - 6), x, y, Math.max(1, w - 2), color);
}

function drawHands(ctx, h, m, colors) {
  hand(ctx, hourHandPos(h, m) / 12, 26, 5, colors.hour);
  hand(ctx, m / 60, 41, 3, colors.minute);
}

function drawFace(ctx) {
  ctx.clearRect(0, 0, S, S);
  disc(ctx, C, C + 2, R + 1, '#0006'); // shadow
  disc(ctx, C, C, R + 1, COL.rim);
  disc(ctx, C, C, R - 1, COL.brass);
  disc(ctx, C, C + 1, R - 4, COL.brassD);
  disc(ctx, C, C, R - 5, COL.rim);
  disc(ctx, C, C, R - 7, COL.face);
  // minute dots and hour ticks
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI;
    const quarter = i % 15 === 0;
    const hour = i % 5 === 0;
    const r = hour ? 40 : 42;
    const size = quarter ? 4 : hour ? 3 : 1;
    ctx.fillStyle = hour ? COL.tickQ : COL.tick;
    ctx.fillRect(Math.round(C + Math.sin(a) * r - size / 2), Math.round(C - Math.cos(a) * r - size / 2), size, size);
  }
}

function drawCap(ctx) {
  ctx.fillStyle = COL.rim;
  ctx.fillRect(C - 3, C - 3, 6, 6);
  ctx.fillStyle = COL.brass;
  ctx.fillRect(C - 2, C - 2, 4, 4);
}

/**
 * @param o.h, o.m          time shown
 * @param o.interactive     drag the hands (snaps to whole hours and quarters)
 * @param o.onChange        (h, m) after a hand moved
 * @param o.cls             extra class, e.g. 'clock-mini'
 */
export function createClock({ h = 12, m = 0, interactive = false, onChange, cls = '' } = {}) {
  const canvas = el('canvas.clock-canvas', { width: S, height: S });
  const ctx = canvas.getContext('2d');
  const nums = [];
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * 2 * Math.PI;
    nums.push(el('span.clock-num', {
      style: { left: `${50 + Math.sin(a) * 28.5}%`, top: `${50 - Math.cos(a) * 28.5}%` },
    }, String(n)));
  }
  const node = el('div.clock' + (cls ? '.' + cls : '') + (interactive ? '.clock-interactive' : ''), {}, [canvas, ...nums]);

  let cur = { h: wrapHour(h), m };
  let ghost = null;
  let colors = HAND_COLORS;
  let enabled = true;

  const draw = () => {
    drawFace(ctx);
    if (ghost) drawHands(ctx, ghost.h, ghost.m, { hour: COL.ok, minute: COL.ok });
    drawHands(ctx, cur.h, cur.m, colors);
    drawCap(ctx);
  };
  draw();

  const api = {
    node,
    get: () => ({ ...cur }),
    set(nh, nm) {
      cur = { h: wrapHour(nh), m: ((nm % 60) + 60) % 60 };
      draw();
    },
    /** Draw the right time in green behind the player's hands. */
    showAnswer(t, correct) {
      ghost = correct ? null : t;
      colors = correct ? { hour: COL.ok, minute: COL.ok } : { hour: COL.bad, minute: COL.bad };
      draw();
    },
    setEnabled(v) {
      enabled = v;
      node.classList.toggle('disabled', !v);
    },
  };

  if (interactive) {
    let dragging = null;
    const angleAt = (ev) => {
      const r = canvas.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * S - C;
      const y = ((ev.clientY - r.top) / r.height) * S - C;
      let a = Math.atan2(x, -y);
      if (a < 0) a += 2 * Math.PI;
      return { a, dist: Math.hypot(x, y) };
    };
    const adiff = (a, b) => {
      const d = Math.abs(a - b) % (2 * Math.PI);
      return d > Math.PI ? 2 * Math.PI - d : d;
    };
    const apply = (a) => {
      let { h: nh, m: nm } = cur;
      if (dragging === 'minute') nm = (Math.round(a / (Math.PI / 2)) % 4) * 15;
      else nh = wrapHour(Math.round((a / (2 * Math.PI)) * 12 - nm / 60));
      if (nh !== cur.h || nm !== cur.m) {
        cur = { h: nh, m: nm };
        draw();
        sfx.click();
        onChange?.(cur.h, cur.m);
      }
    };
    node.addEventListener('pointerdown', (ev) => {
      if (!enabled) return;
      ev.preventDefault();
      const { a, dist } = angleAt(ev);
      const dM = adiff(a, (cur.m / 60) * 2 * Math.PI);
      const dH = adiff(a, (hourHandPos(cur.h, cur.m) / 12) * 2 * Math.PI);
      if (Math.abs(dM - dH) < 0.35) dragging = dist > R * 0.62 ? 'minute' : 'hour';
      else dragging = dM < dH ? 'minute' : 'hour';
      node.setPointerCapture?.(ev.pointerId);
      node.dataset.drag = dragging;
      apply(a);
    });
    node.addEventListener('pointermove', (ev) => {
      if (dragging && enabled) apply(angleAt(ev).a);
    });
    const end = () => {
      dragging = null;
      delete node.dataset.drag;
    };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
  }
  return api;
}

/** A digital clock display: "3:45". */
export function digitalClock(h, m) {
  return el('div.digital-clock', {}, digital(h, m));
}

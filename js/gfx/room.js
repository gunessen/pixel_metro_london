// Pixel room for the preposition exercises. Furniture is drawn from rectangles on a
// small canvas (shown upscaled, pixelated); the object is a pixelated emoji.
// Two pieces of furniture stand on the floor; the object is placed relative to one of them.
import { el } from '../ui.js';
import { emojiCanvas } from './emoji.js';
import { OBJECT_BY_ID } from '../prep.js';

export const W = 200;
export const H = 112;
const FLOOR_TOP = 66;
const FY = 92; // where the furniture stands
const LEFT_X = 62;
const RIGHT_X = 138;

const WOOD = { l: '#c28a4e', d: '#7a4a24', k: '#3b2210' };

// r(x0, y0, x1, y1, colour): rectangle relative to the furniture's bottom centre (y up is negative).
const FURNITURE = {
  table: {
    w: 48,
    draw(r) {
      r(-22, -21, -18, 0, WOOD.d);
      r(18, -21, 22, 0, WOOD.d);
      r(-21, -21, -20, 0, WOOD.l);
      r(19, -21, 20, 0, WOOD.l);
      r(-24, -26, 24, -21, WOOD.l);
      r(-24, -22, 24, -21, WOOD.d);
      r(-24, -26, 24, -25, '#e0a868');
    },
    spots: { on: { x: 0, by: -26 }, under: { x: 0, by: 0, size: 16 } },
  },
  chair: {
    w: 28,
    draw(r) {
      r(-14, -46, -10, 0, WOOD.d);
      r(-13, -45, -11, -21, WOOD.l);
      r(-14, -36, -10, -34, WOOD.k);
      r(10, -16, 14, 0, WOOD.d);
      r(-14, -20, 14, -16, WOOD.l);
      r(-14, -17, 14, -16, WOOD.d);
    },
    spots: { on: { x: 3, by: -20, size: 16 }, under: { x: 1, by: 0, size: 14 } },
  },
  bed: {
    w: 56,
    draw(r) {
      r(-26, -16, -23, 0, WOOD.k);
      r(23, -16, 26, 0, WOOD.k);
      r(-28, -40, -24, -16, WOOD.d);
      r(-28, -40, -24, -38, WOOD.l);
      r(24, -30, 28, -16, WOOD.d);
      r(24, -30, 28, -28, WOOD.l);
      r(-26, -20, 26, -16, WOOD.d);
      r(-24, -26, 24, -20, '#f4f4f4');
      r(-10, -27, 24, -20, '#3b5dc9');
      r(-10, -27, 24, -26, '#41a6f6');
      r(-23, -30, -12, -26, '#f4f4f4');
      r(-23, -26, -12, -25, '#c2c3c7');
    },
    spots: { on: { x: 6, by: -27 }, under: { x: 0, by: 0, size: 15 } },
  },
  sofa: {
    w: 52,
    draw(r) {
      const c = '#b13e53', dk = '#7a2a3a', hi = '#d8576c';
      r(-24, -3, -21, 0, WOOD.k);
      r(21, -3, 24, 0, WOOD.k);
      r(-22, -33, 22, -19, c);
      r(-22, -33, 22, -31, hi);
      r(0, -31, 1, -19, dk);
      r(-26, -14, 26, -3, c);
      r(-26, -5, 26, -3, dk);
      r(-22, -19, 22, -14, hi);
      r(0, -19, 1, -14, dk);
      r(-26, -25, -21, -3, dk);
      r(21, -25, 26, -3, dk);
      r(-26, -25, -21, -23, c);
      r(21, -25, 26, -23, c);
    },
    spots: {
      on: { x: 0, by: -19 },
      behind: { x: -8, by: -24, size: 16, layer: 'back', zone: { x: 0, by: -36 } },
      'in front of': { x: 0, by: 9, size: 20 },
    },
  },
  armchair: {
    w: 36,
    draw(r) {
      const c = '#38b764', dk = '#1f6b46', hi = '#7ee2a0';
      r(-16, -3, -13, 0, WOOD.k);
      r(13, -3, 16, 0, WOOD.k);
      r(-13, -35, 13, -19, c);
      r(-13, -35, 13, -33, hi);
      r(-18, -14, 18, -3, c);
      r(-18, -5, 18, -3, dk);
      r(-13, -19, 13, -14, hi);
      r(-18, -26, -13, -3, dk);
      r(13, -26, 18, -3, dk);
      r(-18, -26, -13, -24, c);
      r(13, -26, 18, -24, c);
    },
    spots: {
      on: { x: 0, by: -19, size: 16 },
      behind: { x: 0, by: -26, size: 16, layer: 'back', zone: { x: 0, by: -38 } },
      'in front of': { x: 0, by: 9, size: 20 },
    },
  },
  box: {
    w: 36,
    back(r) {
      r(-14, -31, 14, -24, '#5a3a1c');
      r(-14, -33, 14, -30, '#a0673a');
    },
    draw(r) {
      r(-16, -24, 16, 0, '#c28a4e');
      r(-16, -24, 16, -23, '#e0a868');
      r(-16, -2, 16, 0, '#a0673a');
      r(-16, -24, -15, 0, '#a0673a');
      r(15, -24, 16, 0, '#a0673a');
      r(-2, -23, 2, -12, '#e8d5a0');
      // open flaps
      r(-22, -28, -16, -24, '#a0673a');
      r(-19, -30, -16, -28, '#a0673a');
      r(16, -28, 22, -24, '#a0673a');
      r(16, -30, 19, -28, '#a0673a');
    },
    spots: {
      in: { x: 0, by: -16, layer: 'mid' },
      on: { x: 0, by: -24, zone: { x: 0, by: -38 } },
      'in front of': { x: 0, by: 9, size: 20 },
    },
  },
  wardrobe: {
    w: 52,
    draw(r) {
      r(-19, -2, -16, 0, WOOD.k);
      r(16, -2, 19, 0, WOOD.k);
      r(-20, -62, 20, -2, WOOD.d);
      r(-21, -64, 21, -61, WOOD.k);
      r(-16, -57, 16, -6, '#2a1a0c');
      r(-15, -53, 15, -52, '#94b0c2');
      // clothes on the rail
      r(-14, -52, -9, -38, '#41a6f6');
      r(-8, -52, -4, -40, '#ffcd75');
      r(9, -52, 14, -36, '#b13e53');
      // open doors
      r(-26, -59, -20, -4, WOOD.l);
      r(-25, -58, -21, -5, '#e0a868');
      r(-23, -33, -22, -29, WOOD.k);
      r(20, -59, 26, -4, WOOD.l);
      r(21, -58, 25, -5, '#e0a868');
      r(22, -33, 23, -29, WOOD.k);
    },
    spots: {
      in: { x: 0, by: -10, zone: { x: 0, by: -14 } },
      on: { x: 0, by: -64 },
      'in front of': { x: 0, by: 9, size: 20, zone: { x: 0, by: 14 } },
    },
  },
};

const OBJ = 18;

function anchorX(scene, id) {
  return scene.left === id ? LEFT_X : RIGHT_X;
}

/**
 * Where the object goes for preposition `prep` in this scene.
 * @returns {{x, y, size, layer, zone:{x, y, size}}} x = centre, y = bottom (canvas pixels)
 */
export function spotFor(scene, prep) {
  let s;
  if (prep === 'between') {
    const l = LEFT_X + FURNITURE[scene.left].w / 2;
    const rr = RIGHT_X - FURNITURE[scene.right].w / 2;
    s = { x: (l + rr) / 2, y: FY, size: OBJ };
  } else if (prep === 'next to') {
    const f = FURNITURE[scene.anchor];
    const ax = anchorX(scene, scene.anchor);
    const dir = ax === LEFT_X ? -1 : 1;
    s = { x: ax + dir * (f.w / 2 + 2 + OBJ / 2), y: FY, size: OBJ };
  } else {
    const ax = anchorX(scene, scene.anchor);
    const sp = FURNITURE[scene.anchor].spots[prep];
    if (!sp) return null;
    s = { x: ax + sp.x, y: FY + sp.by, size: sp.size || OBJ, layer: sp.layer };
    if (sp.zone) s.zone = { x: ax + sp.zone.x, y: FY + sp.zone.by, size: sp.size || OBJ };
  }
  s.layer ||= 'front';
  s.zone ||= { x: s.x, y: s.y, size: s.size };
  return s;
}

function drawBackground(ctx) {
  ctx.fillStyle = '#94b0c2';
  ctx.fillRect(0, 0, W, FLOOR_TOP);
  ctx.fillStyle = '#87a2b6';
  for (let x = 4; x < W; x += 10) ctx.fillRect(x, 0, 3, FLOOR_TOP - 4);
  ctx.fillStyle = '#566c86';
  ctx.fillRect(0, FLOOR_TOP - 4, W, 4);
  ctx.fillStyle = '#a0673a';
  ctx.fillRect(0, FLOOR_TOP, W, H - FLOOR_TOP);
  ctx.fillStyle = '#8a5530';
  for (let y = FLOOR_TOP + 6, row = 0; y < H; y += 7, row++) {
    ctx.fillRect(0, y, W, 1);
    for (let x = (row % 2) * 17; x < W; x += 34) ctx.fillRect(x, y - 6, 1, 6);
  }
}

function drawFurniture(ctx, id, cx, part) {
  const f = FURNITURE[id];
  const fn = part === 'back' ? f.back : f.draw;
  if (!fn) return;
  fn((x0, y0, x1, y1, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(cx + x0, FY + y0, x1 - x0, y1 - y0);
  });
}

function drawObject(ctx, scene, spot) {
  const obj = OBJECT_BY_ID[scene.object];
  const left = Math.round(spot.x - spot.size / 2);
  const top = Math.round(spot.y - spot.size);
  if (spot.y >= FY) {
    ctx.fillStyle = '#0003';
    ctx.fillRect(left + 2, Math.round(spot.y) - 1, spot.size - 4, 2);
  }
  const c = emojiCanvas(obj.emoji, spot.size);
  if (c) ctx.drawImage(c, left, top);
  else {
    ctx.fillStyle = '#ef7d57';
    ctx.fillRect(left + 2, top + 2, spot.size - 4, spot.size - 4);
  }
}

/** Draw the whole scene; `placed` = preposition where the object is, or null (not placed). */
export function drawRoom(canvas, scene, placed = scene.prep) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx);
  const spot = placed ? spotFor(scene, placed) : null;
  if (spot?.layer === 'back') drawObject(ctx, scene, spot);
  drawFurniture(ctx, scene.left, LEFT_X, 'back');
  drawFurniture(ctx, scene.right, RIGHT_X, 'back');
  if (spot?.layer === 'mid') drawObject(ctx, scene, spot);
  drawFurniture(ctx, scene.left, LEFT_X, 'front');
  drawFurniture(ctx, scene.right, RIGHT_X, 'front');
  if (spot?.layer === 'front') drawObject(ctx, scene, spot);
}

/** Room as a DOM node: { node, canvas, redraw(placed) }. */
export function createRoom(scene, { placed = scene.prep, cls = '' } = {}) {
  const canvas = el('canvas.room-canvas', { width: W, height: H });
  const node = el('div.room' + (cls ? '.' + cls : ''), {}, [canvas]);
  drawRoom(canvas, scene, placed);
  return { node, canvas, redraw: (p) => drawRoom(canvas, scene, p) };
}

/** Rectangle of a drop zone in % of the room (for absolutely positioned buttons). */
export function zoneRect(spot) {
  const z = spot.zone;
  const pad = 2;
  return {
    left: ((z.x - z.size / 2 - pad) / W) * 100,
    top: ((z.y - z.size - pad) / H) * 100,
    width: ((z.size + 2 * pad) / W) * 100,
    height: ((z.size + 2 * pad) / H) * 100,
  };
}

// Build the word from scrambled letter tiles. Spaces, apostrophes and hyphens are fixed.
import { el } from '../ui.js';
import { isWordItem } from '../content.js';
import { checkAnswer } from '../check.js';
import { shuffle } from '../srs.js';
import { sfx } from '../audio.js';
import { instruction, pictureBox } from './common.js';

const LETTER = /[A-Za-z]/;
const EXTRA_POOL = 'aeiounrstlmdbcgkpwhy';
export const MAX_TILE_LETTERS = 22;

export function letterCount(s) {
  return [...s].filter((c) => LETTER.test(c)).length;
}

/**
 * Tile board for `target`. Returns { node, answerNode, poolNode, value(), full(), lock() }.
 * `answerNode` and `poolNode` can be placed separately.
 */
export function tileBoard(target, { extra = 0, rng = Math.random, onChange } = {}) {
  let locked = false;
  const slots = []; // { node, tile }
  const answerNode = el('div.tile-answer');
  for (const word of target.split(' ')) {
    const w = el('div.tile-word');
    for (const ch of word) {
      if (LETTER.test(ch)) {
        const slot = { node: null, tile: null };
        slot.node = el('button.tile-slot', {
          type: 'button',
          onclick: () => {
            if (locked || !slot.tile) return;
            sfx.click();
            slot.tile.node.classList.remove('used');
            slot.tile = null;
            slot.node.textContent = '';
            slot.node.classList.remove('filled');
            onChange?.();
          },
        });
        slots.push(slot);
        w.append(slot.node);
      } else {
        w.append(el('div.tile-fixed', {}, ch));
      }
    }
    answerNode.append(w);
  }

  const letters = [...target].filter((c) => LETTER.test(c));
  const extras = [];
  for (let i = 0; i < extra; i++) extras.push(EXTRA_POOL[Math.floor(rng() * EXTRA_POOL.length)]);
  let order = shuffle([...letters, ...extras], rng);
  for (let tries = 0; tries < 10 && order.join('') === [...letters, ...extras].join('') && order.length > 1; tries++) {
    order = shuffle(order, rng);
  }

  const tiles = order.map((ch) => {
    const tile = { ch, node: null };
    tile.node = el('button.tile', {
      type: 'button',
      onclick: () => {
        if (locked || tile.node.classList.contains('used')) return;
        const slot = slots.find((s) => !s.tile);
        if (!slot) return;
        sfx.click();
        slot.tile = tile;
        slot.node.textContent = ch;
        slot.node.classList.add('filled');
        tile.node.classList.add('used');
        onChange?.();
      },
    }, ch);
    return tile;
  });
  const poolNode = el('div.tile-pool', {}, tiles.map((t) => t.node));

  return {
    node: el('div.tile-board', {}, [answerNode, poolNode]),
    answerNode,
    poolNode,
    value() {
      let i = 0;
      return [...target].map((ch) => (LETTER.test(ch) ? slots[i++].tile?.ch ?? '' : ch)).join('');
    },
    full: () => slots.every((s) => s.tile),
    lock() {
      locked = true;
      answerNode.classList.add('locked');
      poolNode.classList.add('locked');
    },
  };
}

export default {
  id: 'tiles',
  skill: 'writing',
  canUse(item) {
    return isWordItem(item) && letterCount(item.en) <= MAX_TILE_LETTERS;
  },
  render(host, item, ctx) {
    const board = tileBoard(item.en, {
      extra: ctx.mode.extraLetters,
      rng: ctx.rng,
      onChange: () => ctx.setReady(board.full()),
    });
    host.append(
      instruction('tiles'),
      el('div.ex-row.ex-row-top', {}, [pictureBox(item, ctx, { sayText: item.en }), board.node]),
    );
    return {
      check() {
        board.lock();
        return checkAnswer(board.value(), item.en, []);
      },
      reveal(res) {
        board.answerNode.classList.add(res.correct ? 'ok' : 'bad');
      },
    };
  },
};

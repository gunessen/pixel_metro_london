// "Put the ball next to the bed." — drag the object into the room (or tap a spot).
import { el, speakBtn } from '../ui.js';
import { prepsFor, placePhrase, withPrep, whereSentence, putSentence, prepMatches, OBJECT_BY_ID } from '../prep.js';
import { createRoom, spotFor, zoneRect } from '../gfx/room.js';
import { emojiDataURL } from '../gfx/emoji.js';
import { sfx } from '../audio.js';
import { shuffle } from '../srs.js';
import { instruction } from './common.js';
import { canUsePrep, makePrepScene } from './prep-pick.js';
import { T } from '../i18n.js';

function overlap(a, b) {
  const w = Math.min(a.x + a.size / 2, b.x + b.size / 2) - Math.max(a.x - a.size / 2, b.x - b.size / 2);
  const h = Math.min(a.y, b.y) - Math.max(a.y - a.size, b.y - b.size);
  return w > 0 && h > 0 ? (w * h) / (Math.min(a.size, b.size) ** 2) : 0;
}

/** Drop zones: every preposition this furniture allows, without zones that overlap a lot. */
export function placeZones(scene, rng = Math.random) {
  const zones = [{ prep: scene.prep, spot: spotFor(scene, scene.prep) }];
  for (const prep of shuffle(prepsFor(scene.anchor), rng)) {
    if (prep === scene.prep) continue;
    const spot = spotFor(scene, prep);
    if (!spot) continue;
    if (zones.some((z) => overlap(z.spot.zone, spot.zone) > 0.3)) continue;
    zones.push({ prep, spot });
  }
  return zones;
}

export default {
  id: 'prep-place',
  skill: 'reading',
  canUse: canUsePrep,
  makeParams: makePrepScene,
  render(host, item, ctx) {
    const scene = ctx.params;
    const obj = OBJECT_BY_ID[scene.object];
    const sentence = putSentence(scene);
    const room = createRoom(scene, { placed: null, cls: 'room-place' });
    const objUrl = emojiDataURL(obj.emoji, 18);
    const objImg = () => (objUrl ? el('img.prep-obj', { src: objUrl, alt: '', draggable: 'false' }) : el('span.prep-obj', {}, obj.emoji));
    let placed = null;
    let locked = false;

    const zones = placeZones(scene, ctx.rng).map((z) => {
      const r = zoneRect(z.spot);
      z.node = el('button.room-zone', {
        type: 'button',
        style: { left: r.left + '%', top: r.top + '%', width: r.width + '%', height: r.height + '%' },
        'aria-label': z.prep,
        onpointerdown: (ev) => {
          if (placed === z.prep) startDrag(ev);
        },
        onclick: () => {
          if (!dragMoved) place(z.prep);
        },
      });
      return z;
    });
    room.node.append(...zones.map((z) => z.node));

    const trayObj = objImg();
    const tray = el('div.prep-tray', {}, [trayObj, el('div.prep-tray-label', {}, T.dragMe)]);

    const place = (prep) => {
      if (locked) return;
      placed = prep;
      room.redraw(prep);
      zones.forEach((z) => z.node.classList.toggle('has-obj', z.prep === prep));
      tray.classList.toggle('empty', !!prep);
      sfx.click();
      ctx.setReady(!!prep);
    };

    // ---- dragging ----
    let ghost = null;
    let dragMoved = false;
    const zoneAt = (x, y) => {
      let best = null;
      let bestD = Infinity;
      for (const z of zones) {
        const r = z.node.getBoundingClientRect();
        const pad = r.width * 0.35;
        if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) continue;
        const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2);
        if (d < bestD) {
          bestD = d;
          best = z;
        }
      }
      return best;
    };
    const moveGhost = (ev) => {
      const size = room.node.getBoundingClientRect().width * (18 / 200);
      ghost.style.width = ghost.style.height = size + 'px';
      ghost.style.left = ev.clientX - size / 2 + 'px';
      ghost.style.top = ev.clientY - size * 0.8 + 'px';
      const z = zoneAt(ev.clientX, ev.clientY);
      zones.forEach((x) => x.node.classList.toggle('hover', x === z));
    };
    const onMove = (ev) => {
      if (!ghost) return;
      dragMoved = true;
      moveGhost(ev);
    };
    const onUp = (ev) => {
      if (!ghost) return;
      ghost.remove();
      ghost = null;
      zones.forEach((x) => x.node.classList.remove('hover'));
      room.node.classList.remove('dragging');
      const z = zoneAt(ev.clientX, ev.clientY);
      if (z) place(z.prep);
      else if (dragMoved && placed) place(placed);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      setTimeout(() => (dragMoved = false), 0);
    };
    function startDrag(ev) {
      if (locked) return;
      ev.preventDefault();
      dragMoved = false;
      ghost = objUrl ? el('img.prep-ghost', { src: objUrl, alt: '' }) : el('div.prep-ghost', {}, obj.emoji);
      document.body.append(ghost);
      room.node.classList.add('dragging');
      moveGhost(ev);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    tray.addEventListener('pointerdown', startDrag);

    host.append(
      instruction('prep-place'),
      el('div.ex-prompt', {}, [el('span.word.word-big', {}, sentence), speakBtn(sentence)]),
      el('div.ex-row.ex-row-top.prep-place-row', {}, [tray, el('div.ex-room.ex-room-big', {}, [room.node, el('div.room-hint', {}, T.orTap)])]),
    );

    return {
      check() {
        locked = true;
        room.node.classList.add('locked');
        const correct = prepMatches(scene.prep, placed);
        return {
          correct,
          caseOnly: false,
          expected: placePhrase(scene),
          given: placed ? placePhrase(withPrep(scene, placed)) : '',
          say: correct && placed !== scene.prep ? whereSentence(withPrep(scene, placed)) : whereSentence(scene),
        };
      },
      reveal(res) {
        const z = zones.find((x) => x.prep === placed);
        z?.node.classList.add(res.correct ? 'ok' : 'bad');
        if (!res.correct) {
          setTimeout(() => {
            room.redraw(scene.prep);
            zones.find((x) => x.prep === scene.prep)?.node.classList.add('ok');
          }, 700);
        }
      },
      destroy() {
        ghost?.remove();
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      },
    };
  },
};

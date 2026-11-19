// Simple map (hub): one row per metro line with its stations.
import { el, button, toast } from '../ui.js';
import { go } from '../router.js';
import { T } from '../i18n.js';
import { state, peekItem } from '../state.js';
import { LINES, TEST_STATION } from '../data/lines.js';
import { WORDS } from '../data/words.js';
import { EXERCISES } from '../exercises/index.js';
import { playableItems } from '../lesson.js';
import { fitness } from '../srs.js';
import { tts } from '../tts.js';
import { piper, onPiperChange } from '../piper.js';
import { emojiDataURL } from '../gfx/emoji.js';

let unsub = null;

function stars(n) {
  return el('span.stars', {}, [0, 1, 2].map((i) => el(i < n ? 'span.star.on' : 'span.star', {}, '★')));
}

function stationNode(line, L, idx, playable) {
  const done = idx < L.station;
  const next = idx === L.station;
  const isTest = idx === TEST_STATION;
  const open = playable && idx <= L.station;
  const cls = ['station', done ? 'done' : next ? 'next' : 'locked', isTest ? 'test' : ''].filter(Boolean).join('.');
  const train = next && playable ? emojiDataURL('🚇', 16) : null;
  return el('button.' + cls, {
    type: 'button',
    onclick: () => {
      if (!playable) return toast(T.comingSoon);
      if (!open) return toast(T.stationLocked);
      go('lesson', { kind: isTest ? 'test' : 'station', topic: line.topic, station: idx });
    },
  }, [
    el('span.station-dot', {}, isTest ? '🏁' : train ? el('img.station-train', { src: train, alt: '' }) : ''),
    el('span.station-name', {}, line.stations[idx]),
    done ? stars(L.stars[idx]) : el('span.stars-empty'),
  ]);
}

export default {
  show(root) {
    const info = { words: WORDS, ttsAvailable: tts.available, mode: {} };
    const coin = emojiDataURL('🪙', 16);

    const rows = LINES.map((line) => {
      const L = state.lines[line.topic];
      const pool = playableItems(WORDS, line.topic, EXERCISES, info);
      const playable = pool.length >= 4;
      const fit = fitness(pool, peekItem);
      const badge = L.testBest !== null && L.testBest !== undefined ? el('span.line-medal', { title: `${L.testBest}%` }, '🏅') : null;
      return el('div.line-row' + (playable ? '' : '.soon'), { style: { '--c': line.color, '--ink': line.ink } }, [
        el('div.line-label', {}, [
          el('div.line-name', {}, [line.name, badge]),
          el('div.line-de', {}, line.de),
          playable
            ? el('div.fit', { title: T.fit }, [
              el('div.fit-bar', {}, el('div.fit-fill', { style: { width: fit + '%' } })),
              el('span.fit-num', {}, `${T.fit} ${fit}%`),
            ])
            : el('div.soon-tag', {}, T.comingSoon),
        ]),
        el('div.line-track', {}, line.stations.map((_, i) => stationNode(line, L, i, playable))),
      ]);
    });

    // Small indicator while the Piper voice is downloading.
    const pill = el('div.voice-pill');
    const renderPill = () => {
      pill.hidden = piper.status !== 'loading';
      pill.textContent = '🔊 ' + T.voiceLoadingShort(Math.round(piper.progress * 100));
    };
    renderPill();
    unsub = onPiperChange(renderPill);

    root.append(
      el('div.map-screen', {}, [
        el('header.topbar', {}, [
          el('div.topbar-title', {}, T.appName),
          el('div.spacer'),
          pill,
          el('div.coins', { title: T.coins }, [coin ? el('img.coin-img', { src: coin, alt: '' }) : '🪙', el('span', {}, String(state.coins))]),
          button('btn.btn-exam', '📝 ' + T.exam, () => go('lesson', { kind: 'exam' }), { title: T.examSub }),
          button('btn-icon', '⚙️', () => go('settings', { back: 'map' }), { 'aria-label': T.settings }),
        ]),
        el('div.lines', {}, rows),
      ]),
    );
  },

  hide() {
    unsub?.();
    unsub = null;
  },
};

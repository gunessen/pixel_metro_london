import { el, button } from '../ui.js';
import { go } from '../router.js';
import { T } from '../i18n.js';
import { sfx } from '../audio.js';
import { emojiDataURL } from '../gfx/emoji.js';
import { initTTS, speak } from '../tts.js';

function goFullscreen() {
  // Only on touch devices: more room for the game on the tablet.
  if (!matchMedia('(pointer: coarse)').matches) return;
  const d = document.documentElement;
  if (document.fullscreenElement || !d.requestFullscreen) return;
  d.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  screen.orientation?.lock?.('landscape').catch(() => {});
}

export default {
  show(root) {
    const train = emojiDataURL('🚇', 24);
    root.append(
      el('div.title-screen', {}, [
        button('btn-icon.btn-settings', '⚙️', () => go('settings', { back: 'title' }), { 'aria-label': T.settings }),
        el('div.title-sky'),
        el('h1.logo', {}, [el('span', {}, 'PIXEL METRO'), el('span.logo-sub', {}, 'LONDON')]),
        el('div.title-track', {}, [train ? el('img.title-train', { src: train, alt: '' }) : el('div.title-train', {}, '🚇')]),
        button('btn.btn-primary.btn-huge', T.start, async () => {
          sfx.unlock();
          sfx.toot();
          goFullscreen();
          const ok = await initTTS();
          if (ok) speak('Welcome to London!');
          go('map');
        }),
      ]),
    );
  },
};

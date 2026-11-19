// Boot: apply settings, start loading TTS voices, show the title screen.
import { registerScreens, go } from './router.js';
import { state } from './state.js';
import { initTTS } from './tts.js';
import { setEmojiPx } from './gfx/emoji.js';
import title from './screens/title.js';
import map from './screens/map.js';
import lesson from './screens/lesson.js';
import result from './screens/result.js';
import settings from './screens/settings.js';

setEmojiPx(state.settings.emojiPx || 20);
initTTS();

// No long-press context menu / text selection on the tablet.
window.addEventListener('contextmenu', (e) => e.preventDefault());

registerScreens({ title, map, lesson, result, settings }, document.getElementById('app'));

// Fonts first, so emoji/text measurements and the first paint look right.
const fontsReady = document.fonts?.ready ?? Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
  const params = new URLSearchParams(location.search);
  // Dev shortcut: ?go=map  or  ?go=lesson&topic=house&station=3
  const target = params.get('go');
  if (target === 'lesson') {
    initTTS().then(() =>
      go('lesson', {
        kind: params.get('kind') || 'station',
        topic: params.get('topic'),
        station: Number(params.get('station') || 0),
        only: params.get('ex'),
      }));
  } else if (target === 'map' || target === 'settings') {
    initTTS().then(() => go(target));
  } else go('title');
});

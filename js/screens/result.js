// End-of-shift screen: stars, coins, words to practise, next station.
import { el, button, speakBtn } from '../ui.js';
import { go } from '../router.js';
import { T } from '../i18n.js';
import { state } from '../state.js';
import { LINE_BY_TOPIC, TEST_STATION } from '../data/lines.js';
import { displayText, speechText } from '../content.js';
import { picture } from '../gfx/picture.js';
import { speak } from '../tts.js';
import { sfx } from '../audio.js';

export default {
  show(root, { summary }) {
    const s = summary;
    const line = s.topic ? LINE_BY_TOPIC[s.topic] : null;
    const title = s.kind === 'exam' ? T.examDone : s.kind === 'test' ? T.testDone : T.shiftDone;

    let nextName = null;
    if (s.kind === 'station' && line) {
      const L = state.lines[s.topic];
      if (L.station <= TEST_STATION) nextName = line.stations[L.station];
    }

    const bigStars = el('div.result-stars', {}, [0, 1, 2].map((i) =>
      el('span.star.big' + (i < s.stars ? '.on' : ''), { style: { animationDelay: `${0.25 + i * 0.3}s` } }, '★')));

    const stats = el('div.result-stats', {}, [
      el('div.stat', {}, [el('div.stat-num', {}, `+${s.coins} 🪙`), el('div.stat-label', {}, T.coinsEarned)]),
      s.kind === 'station'
        ? el('div.stat', {}, [el('div.stat-num', {}, String(s.mistakes)), el('div.stat-label', {}, T.mistakes)])
        : el('div.stat', {}, [el('div.stat-num', {}, `${s.percent}%`), el('div.stat-label', {}, T.score)]),
    ]);

    const wrongList = s.wrongItems.length
      ? el('div.result-wrong', {}, [
        el('div.result-wrong-title', {}, T.practiseWords),
        el('div.wrong-list', {}, s.wrongItems.map((it) =>
          el('div.wrong-item', {}, [picture(it), el('span.word', {}, displayText(it)), el('span.wrong-de', {}, it.de), speakBtn(speechText(it))]))),
      ])
      : el('div.result-perfect', {}, T.noMistakes);

    root.append(
      el('div.result-screen', { style: { '--c': line?.color ?? '#41a6f6' } }, [
        el('div.panel.result-panel', {}, [
          el('h1', {}, title),
          line ? el('div.result-line', {}, `${line.name} · ${line.stations[s.station]}`) : null,
          bigStars,
          s.kind === 'test' ? el('div.result-badge', {}, '🏅 ' + T.badge) : null,
          stats,
          nextName ? el('div.next-station', {}, [el('span.sign-dot'), el('span', {}, `${T.nextStation}: ${nextName}`)]) : null,
          wrongList,
          button('btn.btn-primary.btn-huge', T.next, () => go('map')),
        ]),
      ]),
    );

    sfx.chime();
    setTimeout(() => {
      if (nextName) speak(`Next station: ${nextName}!`);
      else speak(s.stars === 3 ? 'Well done!' : 'Good job!');
    }, 700);
  },
};

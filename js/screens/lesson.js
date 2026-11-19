// Lesson ("shift") screen: runs the exercise queue from js/lesson.js.
import { el, button, speakBtn, confirmDialog, diffNode, toast } from '../ui.js';
import { go } from '../router.js';
import { T, pick } from '../i18n.js';
import { state, save, itemState } from '../state.js';
import { WORDS } from '../data/words.js';
import { LINE_BY_TOPIC } from '../data/lines.js';
import { EXERCISES } from '../exercises/index.js';
import { createShift, commitShift } from '../lesson.js';
import { diffExpected } from '../check.js';
import { tts, speak, stopSpeaking, prefetchSpeech } from '../tts.js';
import { parseSentence } from '../content.js';
import { sfx } from '../audio.js';
import { emojiDataURL } from '../gfx/emoji.js';

const WRITING_TYPES = new Set(['tiles', 'type', 'fill-gap']);

let cleanup = [];

export default {
  show(root, { kind = 'station', topic = null, station = 0 } = {}) {
    const shift = createShift({
      kind,
      topic,
      station,
      words: WORDS,
      exercises: EXERCISES,
      getState: itemState,
      ttsAvailable: tts.available,
    });
    if (!shift.queue.length) {
      toast(T.comingSoon);
      go('map');
      return;
    }
    const line = topic ? LINE_BY_TOPIC[topic] : null;

    // ---------- layout ----------
    const trainUrl = emojiDataURL('🚇', 16);
    const coinUrl = emojiDataURL('🪙', 16);
    const trackFill = el('div.track-fill');
    const trackTrain = trainUrl ? el('img.track-train', { src: trainUrl, alt: '' }) : el('div.track-train', {}, '🚇');
    const comboNode = el('div.combo');
    const coinsNode = el('span');
    const host = el('main.ex-host');
    const checkBtn = button('btn.btn-primary.btn-check', T.check, () => doCheck());
    const foot = el('footer.lesson-foot', {}, [checkBtn]);
    const feedback = el('div.feedback', { hidden: true });

    const screen = el('div.lesson-screen', { style: { '--c': line?.color ?? '#41a6f6' } }, [
      el('header.lesson-top', {}, [
        button('btn-icon.btn-exit', '✕', async () => {
          if (await confirmDialog(T.exitConfirm, T.exitConfirmSub)) go('map');
        }, { 'aria-label': 'Beenden' }),
        el('div.track', {}, [el('div.track-rail'), trackFill, trackTrain]),
        comboNode,
        el('div.coins.coins-small', {}, [coinUrl ? el('img.coin-img', { src: coinUrl, alt: '' }) : '🪙', coinsNode]),
      ]),
      host,
      foot,
      feedback,
    ]);
    root.append(screen);

    // ---------- state ----------
    let handle = null;
    let ready = false;
    let checked = false;

    const updateTop = () => {
      const p = Math.round(shift.progress * 100);
      trackFill.style.width = p + '%';
      trackTrain.style.left = `calc(${p}% - ${p / 100} * var(--train-w))`;
      comboNode.textContent = shift.combo >= 2 ? `🔥 ${shift.combo}` : '';
      comboNode.classList.toggle('hot', shift.combo >= 2);
      coinsNode.textContent = String(state.coins);
    };

    const setReady = (v) => {
      ready = !!v;
      checkBtn.disabled = !ready;
    };

    const render = () => {
      handle?.destroy?.();
      host.replaceChildren();
      feedback.hidden = true;
      feedback.replaceChildren();
      checked = false;
      setReady(false);
      const slot = shift.current;
      const ex = EXERCISES[slot.type];
      const ctx = {
        words: WORDS,
        mode: shift.mode,
        rng: Math.random,
        setReady,
        submit: () => doCheck(),
      };
      if (slot.retry) host.append(el('div.retry-tag', {}, '🔁 Nochmal!'));
      handle = ex.render(host, slot.item, ctx);
      foot.hidden = !!(handle.usesKeyboard || ex.usesKeyboard);
      host.classList.toggle('with-keyboard', foot.hidden);
      updateTop();
    };

    const doCheck = () => {
      if (!ready || checked) return;
      checked = true;
      const slot = shift.current;
      const res = handle.check();
      handle.reveal?.(res);
      const r = shift.answer(res);
      state.coins += r.gained;
      save();
      showFeedback(slot, res, r);
      updateTop();
    };

    const showFeedback = (slot, res, r) => {
      const say = res.say || res.expected;
      const parts = [];
      if (res.correct) {
        sfx.correct();
        if (r.combo >= 3) setTimeout(() => sfx.toot(), 350);
        parts.push(
          el('div.fb-title', {}, pick(T.correct)),
          el('div.fb-coins', {}, `+${r.gained} 🪙` + (r.bonus ? `  (${T.combo} +${r.bonus})` : '')),
        );
        speak(say);
      } else {
        sfx.wrong();
        parts.push(el('div.fb-title', {}, res.caseOnly ? T.wrongCase : T.wrong));
        const showDiff = WRITING_TYPES.has(slot.type) && res.given;
        const answer = res.sentence
          ? el('span.word', {}, [
            res.sentence.before,
            el('span.fb-gap', {}, showDiff ? diffNode(diffExpected(res.given, res.expected)) : res.expected),
            res.sentence.after,
          ])
          : el('span.word', {}, showDiff ? diffNode(diffExpected(res.given, res.expected)) : res.expected);
        parts.push(el('div.fb-answer', {}, [el('span.fb-label', {}, T.rightIs), answer, speakBtn(say)]));
        if (showDiff) {
          parts.push(el('div.fb-given', {}, [el('span.fb-label', {}, T.youWrote), el('span.word.strike', {}, res.given)]));
        }
        setTimeout(() => speak(say), 250);
      }
      const nextBtn = button('btn.btn-next', T.next, () => next());
      feedback.className = 'feedback ' + (res.correct ? 'fb-ok' : 'fb-bad');
      feedback.replaceChildren(el('div.fb-body', {}, parts), nextBtn);
      feedback.hidden = false;
      foot.hidden = true;
    };

    const next = () => {
      if (!checked) return;
      stopSpeaking();
      shift.advance();
      if (shift.done) {
        handle?.destroy?.();
        handle = null;
        const summary = shift.finish();
        commitShift(state, summary);
        save();
        go('result', { summary });
      } else render();
    };

    const onKey = (ev) => {
      if (ev.defaultPrevented || ev.key !== 'Enter' || document.querySelector('.modal-overlay')) return;
      if (!feedback.hidden) {
        ev.preventDefault();
        next();
      } else if (handle && !foot.hidden && ready) {
        ev.preventDefault();
        doCheck();
      }
    };
    window.addEventListener('keydown', onKey);
    if (new URLSearchParams(location.search).has('debug')) {
      // Hooks for automated smoke tests.
      window.__pm = {
        shift,
        ready: () => ready,
        check: () => doCheck(),
        correctIndex: () => {
          const opts = host.querySelector('.options')?._opts || [];
          const it = shift.current.item;
          const gap = /\[(.+?)\]/.exec(it.sentence || '')?.[1];
          return opts.findIndex((o) => o === it || (shift.current.type === 'fill-gap' && o === gap));
        },
      };
    }
    cleanup.push(() => window.removeEventListener('keydown', onKey));
    cleanup.push(() => handle?.destroy?.());

    // ---------- intro card ----------
    const title = kind === 'exam' ? T.exam : `${line.name} · ${line.stations[station]}`;
    const sub = kind === 'exam' ? T.examSub : kind === 'test' ? 'Test day: ohne Tipps!' : `${shift.queue.length} Aufgaben`;
    const intro = el('div.intro', {}, [
      el('div.intro-card.panel', {}, [
        el('div.intro-title', {}, title),
        el('div.intro-sub', {}, sub),
        el('div.intro-mind', {}, '“Mind the gap!”'),
        button('btn.btn-primary.btn-huge', 'Los geht’s!', () => {
          intro.remove();
          render();
        }),
      ]),
    ]);
    host.append(intro);
    foot.hidden = true;
    updateTop();
    speak('Mind the gap!');

    // Let Piper prepare the words of this shift in the background, in queue order.
    const texts = [];
    for (const { item } of shift.queue) {
      texts.push(item.kind === 'gap' ? null : item.en, parseSentence(item.sentence)?.full);
    }
    if (line && kind === 'station') texts.push(`Next station: ${line.stations[station + 1]}!`);
    texts.push('Well done!', 'Good job!');
    prefetchSpeech([...new Set(texts.filter(Boolean))]);
  },

  hide() {
    stopSpeaking();
    cleanup.forEach((f) => f());
    cleanup = [];
  },
};

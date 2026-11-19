// Settings: sound, English voice, speech speed, picture resolution.
// (The parent area with stats and reset comes in Milestone 3.)
import { el, button } from '../ui.js';
import { go } from '../router.js';
import { T } from '../i18n.js';
import { state, save } from '../state.js';
import { initTTS, englishVoices, currentVoice, setVoice, speak, setPiperVoice, piperVoiceSetting } from '../tts.js';
import { piper, onPiperChange, PIPER_VOICES } from '../piper.js';

let cleanup = null;
import { setEmojiPx } from '../gfx/emoji.js';
import { picture } from '../gfx/picture.js';

function segmented(options, value, onPick) {
  const wrap = el('div.segmented');
  const render = (v) => {
    wrap.replaceChildren(...options.map(([val, label]) =>
      button('btn.seg' + (val === v ? '.active' : ''), label, () => {
        onPick(val);
        render(val);
      })));
  };
  render(value);
  return wrap;
}

export default {
  async show(root, { back = 'map' } = {}) {
    await initTTS();
    const s = state.settings;

    // Voice: Piper neural voices (downloaded once) or the device's own voice.
    const piperSel = el('select.voice-select', {
      onchange: (ev) => {
        setPiperVoice(ev.target.value);
        save();
        renderDevice();
        renderStatus();
      },
    }, [
      ...PIPER_VOICES.map((v) => el('option', { value: v.id, selected: piperVoiceSetting() === v.id }, v.label)),
      el('option', { value: 'device', selected: !piperVoiceSetting() }, T.deviceVoice),
    ]);
    const status = el('div.voice-status');
    const renderStatus = () => {
      status.className = 'voice-status';
      if (!piperVoiceSetting()) return status.replaceChildren();
      if (piper.status === 'loading') {
        const pct = Math.round(piper.progress * 100);
        status.replaceChildren(
          el('div.voice-progress', {}, el('div.voice-progress-fill', { style: { width: pct + '%' } })),
          el('span', {}, T.voiceLoading(pct)),
        );
      } else if (piper.status === 'ready') {
        status.replaceChildren(el('span.ok-text', {}, T.voiceReady));
      } else if (piper.status === 'error') {
        status.classList.add('set-warning');
        status.textContent = T.voiceError(piper.error);
      }
    };
    renderStatus();

    const deviceRow = el('div.set-row');
    const renderDevice = () => {
      deviceRow.hidden = !!piperVoiceSetting() && piper.status !== 'error';
      const voices = englishVoices();
      const cur = currentVoice();
      deviceRow.replaceChildren(
        el('div.set-label', {}, T.deviceVoiceShort),
        voices.length
          ? el('select.voice-select', {
            onchange: (ev) => {
              setVoice(ev.target.value);
              save();
              speak('Hello! I am your London guide.');
            },
          }, voices.map((v) => el('option', { value: v.voiceURI, selected: cur && v.voiceURI === cur.voiceURI }, `${v.name} (${v.lang})`)))
          : el('div.set-warning', {}, T.noVoice),
      );
    };
    renderDevice();
    const unsub = onPiperChange(() => {
      renderStatus();
      renderDevice();
    });
    cleanup = () => unsub();

    const voiceRow = el('div.set-control.set-voice', {}, [
      el('div.set-control', {}, [
        piperSel,
        button('btn.btn-small', '🔊 ' + T.voiceTest, () => speak('Next station: Tower Bridge!')),
      ]),
      status,
    ]);

    const sample = el('div.px-sample');
    const drawSample = () => sample.replaceChildren(...['emoji:🚌', 'emoji:🎸', 'emoji:🧑‍🚒'].map((img) => picture({ img, de: '' })));
    drawSample();

    root.append(
      el('div.settings-screen', {}, [
        el('header.topbar', {}, [
          button('btn.btn-secondary', '← ' + T.back, () => go(back)),
          el('div.topbar-title', {}, T.settings),
          el('div.spacer'),
        ]),
        el('div.panel.settings-panel', {}, [
          el('div.set-row', {}, [
            el('div.set-label', {}, T.sound),
            segmented([[true, T.on], [false, T.off]], s.sound, (v) => {
              s.sound = v;
              save();
            }),
          ]),
          el('div.set-row', {}, [el('div.set-label', {}, T.voice), voiceRow]),
          deviceRow,
          el('div.set-row', {}, [
            el('div.set-label', {}, T.speed),
            segmented([[0.7, '🐢 ' + T.slow], [0.9, T.normal]], s.rate, (v) => {
              s.rate = v;
              save();
              speak('quarter past three');
            }),
          ]),
          el('div.set-row', {}, [
            el('div.set-label', {}, T.pixelSize),
            el('div.set-control', {}, [
              segmented([[16, '16'], [20, '20'], [24, '24'], [32, '32']], s.emojiPx, (v) => {
                s.emojiPx = v;
                setEmojiPx(v);
                save();
                drawSample();
              }),
              sample,
            ]),
          ]),
        ]),
      ]),
    );
  },

  hide() {
    cleanup?.();
    cleanup = null;
  },
};

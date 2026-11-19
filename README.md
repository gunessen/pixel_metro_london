# Pixel Metro London

A pixel-art English vocabulary game for a Grade 4 pupil (German instructions, English content).
Each school topic is a metro line; each station is a short lesson ("shift") of 10 exercises.
See [PLAN.md](PLAN.md) for the full design.

## Play / test locally

ES modules need a web server (opening `index.html` as a file does not work):

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

- `tests.html`: unit tests (answer checker, spaced repetition, lesson engine, vocabulary data).
- Dev shortcuts: `index.html?go=map`, `index.html?go=lesson&topic=house&station=3`,
  `index.html?go=lesson&kind=test&topic=jobs`, `index.html?go=lesson&kind=exam`.
  Add `&debug` to expose test hooks on `window.__pm`.

## Edit the vocabulary

All words are in [js/data/words.js](js/data/words.js). One line per word:

```js
{ en: 'kitchen', de: 'Küche', img: 'sprite:kitchen', sentence: 'We cook in the [kitchen].' },
```

- `en` must be spelled exactly as it should be written, including capital letters.
- `alt: ['tube']` lists other accepted spellings.
- The `[bracketed]` part of `sentence` becomes the gap in "Ergänze den Satz".
- `img`: `'emoji:🚌'`, `'sprite:name'` (see [js/gfx/sprites.js](js/gfx/sprites.js)) or `'text:7'`.

Open `tests.html` after editing. It checks for duplicate ids and broken sentences.

## Speech (Piper)

English is spoken by [Piper](https://github.com/rhasspy/piper) running in the browser, in a Web Worker
(`js/piper-worker.js`): espeak-ng WASM phonemizer + the voice model in onnxruntime-web (WASM, one thread).
The engine is in [vendor/](vendor/README.md). The voice (~60 MB) is downloaded from Hugging Face
(`rhasspy/piper-voices` v1.0.0) the first time the game starts and is then cached on the device, so
start the game once on Wi-Fi. Until the voice is ready, the device's own voice is used. The voice can be
changed in ⚙️ Einstellungen.

## Deploy (GitHub Pages)

Push to `main` and enable Pages for the repository root (Settings → Pages). All paths are relative,
so the game works under `https://<user>.github.io/<repo>/`. On the tablet, open the URL in Chrome.

## Status

Milestone 1 (playable core) is done. Coming next: clock and preposition exercises (Milestone 2),
then real pixel sprites, the map, the shop, the parent area and offline/PWA support (Milestone 3).

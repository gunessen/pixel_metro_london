# Vendored third-party files (pinned, unmodified)

| Folder | Source | License |
|---|---|---|
| `onnxruntime-web-1.22.0/` | npm `onnxruntime-web@1.22.0` — `dist/ort.wasm.min.js`, `dist/ort-wasm-simd-threaded.{mjs,wasm}` | MIT (Microsoft) |
| `piper-wasm-1.0.0/` | npm `@diffusionstudio/piper-wasm@1.0.0` — `build/piper_phonemize.{js,wasm,data}` (piper-phonemize + espeak-ng compiled to WASM) | package MIT; contains espeak-ng (GPL-3.0, see `ESPEAK-NG-LICENSE.md`) |

Voices are not vendored: they are downloaded at runtime from
`https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/…` and cached in the browser
(Cache Storage `piper-voices-v1`). Each voice has its own MODEL_CARD/license on Hugging Face.

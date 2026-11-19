/* Piper TTS worker (classic worker, so the Emscripten phonemizer can be loaded with importScripts).
 *
 *   text ──espeak-ng (WASM, @diffusionstudio/piper-wasm)──▶ phoneme ids
 *        ──Piper VITS model (onnxruntime-web 1.22, WASM, 1 thread)──▶ PCM float32
 *
 * Single thread because GitHub Pages cannot send the COOP/COEP headers needed for
 * SharedArrayBuffer. Running in a worker keeps the UI smooth while the model computes.
 *
 * Messages in:  { type:'load', voice }            → 'progress'*, then 'ready' | 'error'
 *               { type:'synth', id, text, scale } → 'audio' | 'error'
 */
/* global ort, createPiperPhonemize */

const ROOT = new URL('../', self.location.href).href;
const ORT_DIR = ROOT + 'vendor/onnxruntime-web-1.22.0/';
const PIPER_DIR = ROOT + 'vendor/piper-wasm-1.0.0/';
const VOICE_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/';
const CACHE_NAME = 'piper-voices-v1';

importScripts(ORT_DIR + 'ort.wasm.min.js', PIPER_DIR + 'piper_phonemize.js');

ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = ORT_DIR;

let phonemizer = null;
let session = null;
let config = null;
let voiceId = null;

/** 'en_GB-jenny_dioco-medium' → 'en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium' */
function voicePath(id) {
  const [lang, name, quality] = id.split('-');
  return `${lang.split('_')[0]}/${lang}/${name}/${quality}/${id}`;
}

async function fetchCached(url, onProgress) {
  const cache = typeof caches !== 'undefined' ? await caches.open(CACHE_NAME).catch(() => null) : null;
  const hit = cache && (await cache.match(url));
  if (hit) return hit.arrayBuffer();

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url.split('/').pop()}`);
  const total = Number(resp.headers.get('content-length')) || 0;
  let buf;
  if (resp.body && onProgress) {
    const reader = resp.body.getReader();
    const chunks = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress(loaded, total);
    }
    const all = new Uint8Array(loaded);
    let off = 0;
    for (const c of chunks) {
      all.set(c, off);
      off += c.length;
    }
    buf = all.buffer;
  } else buf = await resp.arrayBuffer();

  if (cache) {
    try {
      await cache.put(url, new Response(buf.slice(0), { headers: { 'content-type': 'application/octet-stream' } }));
    } catch (e) {
      // storage full: still works, just downloads again next time
    }
  }
  return buf;
}

async function getPhonemizer() {
  if (phonemizer) return phonemizer;
  let capture = null;
  const mod = await createPiperPhonemize({
    print: (line) => capture && capture.out.push(line),
    printErr: (line) => capture && capture.err.push(line),
    locateFile: (file) => PIPER_DIR + file,
  });
  phonemizer = (text, espeakVoice) => {
    capture = { out: [], err: [] };
    try {
      mod.callMain(['-l', espeakVoice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']);
    } finally {
      // keep capture until parsed below
    }
    const { out, err } = capture;
    capture = null;
    const line = out.find((l) => l.trim().startsWith('{'));
    if (!line) throw new Error('phonemizer: ' + (err.join(' ') || 'no output'));
    return JSON.parse(line).phoneme_ids;
  };
  return phonemizer;
}

async function load(id) {
  if (id === voiceId && session) {
    postMessage({ type: 'ready', voice: id, sampleRate: config.audio.sample_rate });
    return;
  }
  const url = VOICE_BASE + voicePath(id);
  const progress = (loaded, total) => postMessage({ type: 'progress', voice: id, loaded, total });
  const [cfgBuf, modelBuf] = await Promise.all([fetchCached(url + '.onnx.json'), fetchCached(url + '.onnx', progress), getPhonemizer()]);
  const cfg = JSON.parse(new TextDecoder().decode(cfgBuf));
  const sess = await ort.InferenceSession.create(modelBuf, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  if (session) await session.release().catch(() => {});
  session = sess;
  config = cfg;
  voiceId = id;
  // Keep only this voice in the cache (each voice is ~60 MB on the tablet).
  try {
    const cache = await caches.open(CACHE_NAME);
    for (const req of await cache.keys()) if (!req.url.startsWith(url)) await cache.delete(req);
  } catch (e) { /* ignore */ }
  postMessage({ type: 'ready', voice: id, sampleRate: cfg.audio.sample_rate });
}

async function synth(text, scale = 1) {
  if (!session) throw new Error('no voice loaded');
  const ph = await getPhonemizer();
  const ids = ph(text, config.espeak.voice);
  const inf = config.inference || {};
  const feeds = {
    input: new ort.Tensor('int64', BigInt64Array.from(ids, (v) => BigInt(v)), [1, ids.length]),
    input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ort.Tensor(
      'float32',
      Float32Array.from([inf.noise_scale ?? 0.667, (inf.length_scale ?? 1) * scale, inf.noise_w ?? 0.8]),
      [3],
    ),
  };
  if ((config.num_speakers || 1) > 1) feeds.sid = new ort.Tensor('int64', BigInt64Array.from([0n]), [1]);
  const out = await session.run(feeds);
  const pcm = new Float32Array(out[session.outputNames[0]].data); // own copy, transferable
  // Piper output is quiet (peak ≈ 0.25): normalise to a peak of 0.9.
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gain = peak > 0 ? Math.min(4, 0.9 / peak) : 1;
  for (let i = 0; i < pcm.length; i++) pcm[i] *= gain;
  return pcm;
}

// Process one message at a time (an ORT session must not run twice concurrently).
let chain = Promise.resolve();
self.onmessage = (ev) => {
  const msg = ev.data;
  chain = chain.then(async () => {
    try {
      if (msg.type === 'load') await load(msg.voice);
      else if (msg.type === 'synth') {
        const t0 = performance.now();
        const pcm = await synth(msg.text, msg.scale);
        postMessage(
          { type: 'audio', id: msg.id, pcm, sampleRate: config.audio.sample_rate, ms: performance.now() - t0 },
          [pcm.buffer],
        );
      }
    } catch (e) {
      postMessage({ type: 'error', id: msg.id, voice: msg.voice, message: String(e && e.message ? e.message : e) });
    }
  });
};

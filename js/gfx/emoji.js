// Pixelated emoji: draw the emoji on a tiny canvas, show it upscaled with
// nearest-neighbour scaling. Results are cached per (emoji, size).

const FONT = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji","Twemoji Mozilla",sans-serif';
const cache = new Map();

let defaultPx = 20;
export function setEmojiPx(px) {
  defaultPx = px;
}
export function getEmojiPx() {
  return defaultPx;
}

/** Returns a data URL, or null if the device cannot draw this emoji. */
export function emojiDataURL(ch, px = defaultPx) {
  const key = px + '|' + ch;
  if (cache.has(key)) return cache.get(key);
  // Draw big first (sharper glyph), then downsample to px×px.
  const big = document.createElement('canvas');
  const B = 64;
  big.width = big.height = B;
  const bctx = big.getContext('2d');
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.font = `${Math.round(B * 0.82)}px ${FONT}`;
  bctx.fillText(ch, B / 2, B / 2 + B * 0.05);

  const c = document.createElement('canvas');
  c.width = c.height = px;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(big, 0, 0, px, px);

  // Hard alpha edges for a crisp pixel look; detect blank (unsupported) emoji.
  const img = ctx.getImageData(0, 0, px, px);
  const d = img.data;
  let visible = 0;
  let colourful = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] >= 90) {
      d[i + 3] = 255;
      visible++;
      if (Math.abs(d[i] - d[i + 1]) > 24 || Math.abs(d[i + 1] - d[i + 2]) > 24) colourful++;
    } else d[i + 3] = 0;
  }
  ctx.putImageData(img, 0, 0);
  // Nothing drawn, or only a monochrome "tofu" box → treat as unsupported.
  const url = visible > 4 && colourful > 0 ? c.toDataURL() : null;
  cache.set(key, url);
  return url;
}

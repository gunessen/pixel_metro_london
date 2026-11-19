// Hand-drawn pixel sprites: string rows + palette. '.' = transparent.
// Sprites not drawn yet fall back to PLACEHOLDERS (an emoji and/or a German label card).

const WOOD = { l: '#c28a4e', d: '#7a4a24', k: '#3b2210' };

export const SPRITES = {
  table: {
    palette: WOOD,
    px: [
      '................',
      '................',
      '................',
      '................',
      '................',
      'llllllllllllllll',
      'dddddddddddddddd',
      '.dd..........dd.',
      '.dd..........dd.',
      '.dd..........dd.',
      '.dd..........dd.',
      '.dd..........dd.',
      '.dd..........dd.',
      '.dd..........dd.',
      '.kk..........kk.',
      '................',
    ],
  },
  stairs: {
    palette: WOOD,
    px: [
      '................',
      '............dddd',
      '............llll',
      '............llll',
      '........dddddddd',
      '........llllllll',
      '........llllllll',
      '....dddddddddddd',
      '....llllllllllll',
      '....llllllllllll',
      'dddddddddddddddd',
      'llllllllllllllll',
      'llllllllllllllll',
      'kkkkkkkkkkkkkkkk',
      '................',
      '................',
    ],
  },
  shelf: {
    palette: { ...WOOD, r: '#b13e53', b: '#3b5dc9', g: '#38b764', y: '#ffcd75' },
    px: [
      'dddddddddddddddd',
      'd..............d',
      'd.rr.bb.gg.yy..d',
      'd.rr.bb.gg.yy..d',
      'd.rr.bb.gg.yy..d',
      'dddddddddddddddd',
      'd..............d',
      'd.bb.yy.rr.....d',
      'd.bb.yy.rr..gg.d',
      'd.bb.yy.rr..gg.d',
      'dddddddddddddddd',
      'd..............d',
      'd..gg.rr.bb.yy.d',
      'd..gg.rr.bb.yy.d',
      'd..gg.rr.bb.yy.d',
      'dddddddddddddddd',
    ],
  },
  lamp: {
    palette: { y: '#ffcd75', o: '#ef7d57', k: '#333c57', w: '#fff6c8' },
    px: [
      '................',
      '.....yyyyyy.....',
      '....yyyyyyyy....',
      '...yyywyyyyyy...',
      '..yyywyyyyyyyy..',
      '..oooooooooooo..',
      '.......kk.......',
      '.......kk.......',
      '.......kk.......',
      '.......kk.......',
      '.......kk.......',
      '.......kk.......',
      '.......kk.......',
      '.....kkkkkk.....',
      '....kkkkkkkk....',
      '................',
    ],
  },
  carpet: {
    palette: { R: '#b13e53', y: '#ffcd75', b: '#3b5dc9', f: '#f4f4f4' },
    px: [
      '................',
      '................',
      '................',
      '.f.f.f.f.f.f.f..',
      'RRRRRRRRRRRRRRRR',
      'RyyyyyyyyyyyyyyR',
      'RyRRRRRRRRRRRRyR',
      'RyRbbbbbbbbbbRyR',
      'RyRbRRRRRRRRbRyR',
      'RyRbbbbbbbbbbRyR',
      'RyRRRRRRRRRRRRyR',
      'RyyyyyyyyyyyyyyR',
      'RRRRRRRRRRRRRRRR',
      '.f.f.f.f.f.f.f..',
      '................',
      '................',
    ],
  },
};

// Placeholders for sprites that are not drawn yet (Milestone 3).
// `emoji` is shown pixelated; `label` (German, never the English answer!) is shown below.
// Without a label, the item's German translation is used.
export const PLACEHOLDERS = {
  hideAndSeek: { emoji: '🙈' },
  jump: { emoji: '🦘' },
  kitchen: { emoji: '🍳' },
  livingRoom: {},
  bedroom: {},
  bathroom: {},
  hall: {},
  garden: { emoji: '🌻' },
  garage: {},
  attic: {},
  armchair: {},
  wardrobe: {},
  cupboard: {},
  desk: {},
  sink: {},
  fridge: {},
  cooker: {},
  doubleDecker: { emoji: '🚌', label: 'Doppeldecker' },
  zebraCrossing: { emoji: '🦓' },
  londonEye: { emoji: '🎡', label: 'Riesenrad' },
  bigBen: { emoji: '🕰️', label: 'Uhrturm' },
  buckinghamPalace: { label: 'Palast des Königs' },
  towerBridge: { emoji: '🌉', label: 'Brücke' },
  towerOfLondon: { emoji: '🏰', label: 'alte Burg' },
  thames: { emoji: '🌊', label: 'Fluss' },
  parliament: { emoji: '🏛️', label: 'Parlament' },
  stPauls: { emoji: '⛪', label: 'Kathedrale' },
  trafalgarSquare: { emoji: '🦁', label: 'Platz mit Löwen' },
  hydePark: { emoji: '🌳', label: 'großer Park' },
  piccadilly: { label: 'Platz mit Leuchtreklame' },
  shard: { label: 'spitzes Glas-Hochhaus' },
  westminsterAbbey: { label: 'Krönungskirche' },
  naturalHistoryMuseum: { emoji: '🦕', label: 'Museum' },
  blackCab: { emoji: '🚖', label: 'Londoner Taxi' },
  nurse: { emoji: '💉' },
  baker: { emoji: '🍞' },
  busDriver: { emoji: '🚌' },
  vet: { emoji: '🐶' },
  shopAssistant: { emoji: '🛒' },
  footballer: { emoji: '🥅' },
  postman: { emoji: '✉️' },
};

const cache = new Map();

/** Data URL of a drawn sprite at 1 px per pixel, or null if the sprite is not drawn yet. */
export function spriteDataURL(name) {
  if (cache.has(name)) return cache.get(name);
  const sp = SPRITES[name];
  if (!sp) return null;
  const h = sp.px.length;
  const w = Math.max(...sp.px.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  sp.px.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = sp.palette[ch];
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  const url = c.toDataURL();
  cache.set(name, url);
  return url;
}

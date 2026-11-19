import pickWord from './pick-word.js';
import pickPicture from './pick-picture.js';
import listenPick from './listen-pick.js';
import tiles from './tiles.js';
import type from './type.js';
import fillGap from './fill-gap.js';

export const EXERCISES = Object.fromEntries(
  [pickWord, pickPicture, listenPick, tiles, type, fillGap].map((e) => [e.id, e]),
);

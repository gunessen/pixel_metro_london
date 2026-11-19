import pickWord from './pick-word.js';
import pickPicture from './pick-picture.js';
import listenPick from './listen-pick.js';
import tiles from './tiles.js';
import type from './type.js';
import fillGap from './fill-gap.js';
import copy from './copy.js';
import sentenceOrder from './sentence-order.js';
import matchPairs from './match-pairs.js';
import clockRead from './clock-read.js';
import clockWrite from './clock-write.js';
import clockSet from './clock-set.js';
import prepPick from './prep-pick.js';
import prepPlace from './prep-place.js';
import prepWrite from './prep-write.js';

export const EXERCISES = Object.fromEntries(
  [
    pickWord, pickPicture, listenPick, tiles, type, fillGap, copy, sentenceOrder, matchPairs,
    clockRead, clockWrite, clockSet, prepPick, prepPlace, prepWrite,
  ].map((e) => [e.id, e]),
);

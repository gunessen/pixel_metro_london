// Preposition scenes: which furniture supports which preposition, and the sentences.
// Pure (no DOM). The drawing is in js/gfx/room.js.

export const OBJECTS = [
  { id: 'cat', en: 'cat', de: 'die Katze', emoji: '🐈' },
  { id: 'dog', en: 'dog', de: 'der Hund', emoji: '🐕' },
  { id: 'ball', en: 'ball', de: 'der Ball', emoji: '⚽' },
  { id: 'teddy', en: 'teddy', de: 'der Teddy', emoji: '🧸' },
  { id: 'book', en: 'book', de: 'das Buch', emoji: '📕' },
];
export const OBJECT_BY_ID = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));

// Only prepositions that can be drawn unambiguously for each piece of furniture.
export const ANCHORS = {
  table: { en: 'table', preps: ['on', 'under', 'next to'] },
  chair: { en: 'chair', preps: ['on', 'under', 'next to'] },
  bed: { en: 'bed', preps: ['on', 'under', 'next to'] },
  sofa: { en: 'sofa', preps: ['on', 'next to', 'behind', 'in front of'] },
  armchair: { en: 'armchair', preps: ['on', 'next to', 'behind', 'in front of'] },
  box: { en: 'box', preps: ['in', 'on', 'next to', 'in front of'] },
  wardrobe: { en: 'wardrobe', preps: ['in', 'on', 'next to', 'in front of'] },
};
export const ANCHOR_IDS = Object.keys(ANCHORS);

export const PREPS = ['in', 'on', 'under', 'next to', 'behind', 'in front of', 'between'];

function pickOne(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

export function anchorsFor(prep) {
  if (prep === 'between') return ANCHOR_IDS;
  return ANCHOR_IDS.filter((a) => ANCHORS[a].preps.includes(prep));
}

/** Is putting the object at `placed` a right answer for `target`? ("between" is also "next to".) */
export function prepMatches(target, placed) {
  return placed === target || (target === 'next to' && placed === 'between');
}

/** Prepositions that make sense as options for this anchor (including "between"). */
export function prepsFor(anchor) {
  return [...ANCHORS[anchor].preps, 'between'];
}

/**
 * A random scene for a preposition: two pieces of furniture (left, right), the
 * target one (`anchor`), the other one, and the object.
 * @returns {{prep, object, anchor, other, left, right}}
 */
export function makeScene(prep, rng = Math.random) {
  const anchor = pickOne(anchorsFor(prep), rng);
  const other = pickOne(ANCHOR_IDS.filter((a) => a !== anchor), rng);
  const anchorLeft = rng() < 0.5;
  return {
    prep,
    object: pickOne(OBJECTS, rng).id,
    anchor,
    other,
    left: anchorLeft ? anchor : other,
    right: anchorLeft ? other : anchor,
  };
}

/** The same scene with a different preposition (for answer options). */
export function withPrep(scene, prep) {
  return { ...scene, prep };
}

/** Words after the preposition: "the table" or "the bed and the box". */
export function placeRest(scene) {
  if (scene.prep === 'between') return `the ${ANCHORS[scene.left].en} and the ${ANCHORS[scene.right].en}`;
  return `the ${ANCHORS[scene.anchor].en}`;
}

/** "under the table" / "between the bed and the box" */
export function placePhrase(scene) {
  return `${scene.prep} ${placeRest(scene)}`;
}

export function objectWord(scene) {
  return OBJECT_BY_ID[scene.object].en;
}

/** "The cat is under the table." */
export function whereSentence(scene) {
  return `The ${objectWord(scene)} is ${placePhrase(scene)}.`;
}

/** "Put the cat under the table." */
export function putSentence(scene) {
  return `Put the ${objectWord(scene)} ${placePhrase(scene)}.`;
}

/** "Where is the cat?" */
export function whereQuestion(scene) {
  return `Where is the ${objectWord(scene)}?`;
}

/** Option phrases: the right one plus up to n-1 other prepositions for the same furniture. */
export function prepOptions(scene, rng = Math.random, n = 4) {
  const others = prepsFor(scene.anchor)
    // something between the table and the box is also next to the table
    .filter((p) => p !== scene.prep && !(scene.prep === 'between' && p === 'next to'))
    .map((p) => [rng(), p])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1])
    .slice(0, n - 1);
  return [scene.prep, ...others];
}

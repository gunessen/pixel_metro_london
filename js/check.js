// Strict answer checking: case matters.

/** trim, collapse spaces, unify apostrophes, drop one trailing "." — never changes case. */
export function normalise(s) {
  return String(s ?? '')
    .replace(/[’‘´`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '')
    .trim();
}

/**
 * @returns {{correct:boolean, caseOnly:boolean, expected:string, given:string}}
 * `expected` is the form to show the child: the matched alternative when the
 * mistake was only in capital letters, otherwise the main answer.
 */
export function checkAnswer(given, expected, alternatives = []) {
  const g = normalise(given);
  const targets = [expected, ...(alternatives || [])];
  for (const t of targets) {
    if (normalise(t) === g) return { correct: true, caseOnly: false, expected: t, given: g };
  }
  const lower = g.toLowerCase();
  for (const t of targets) {
    if (normalise(t).toLowerCase() === lower) {
      return { correct: false, caseOnly: true, expected: t, given: g };
    }
  }
  return { correct: false, caseOnly: false, expected, given: g };
}

/**
 * Per-character diff for highlighting. Returns the characters of `expected`,
 * each marked ok:true if it lines up with the given answer (LCS alignment).
 */
export function diffExpected(given, expected) {
  const a = [...String(given ?? '')];
  const b = [...String(expected ?? '')];
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = b.map((ch) => ({ ch, ok: false }));
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out[j].ok = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}

/**
 * Vocabri — Answer Matching Pure Logic
 * Extracted from app.js for testability
 */

// Constants
export const WRITE_FUZZY_THRESHOLD = 0.85;
export const TYPO_EXACT_UP_TO = 4;
export const TYPO_ONE_EDIT_UP_TO = 7;
export const GRAMMAR_SUFFIXES = ['s', 'es', 'd', 'ed', 'ing', 'ly', 'er', 'est', 'as', 'os'];

/**
 * Normalize answer for comparison (remove accents, punctuation, extra spaces)
 * @param {string} s - Input string
 * @returns {string} Normalized string
 */
export function normalizeAnswer(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/gi, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normalize for comparison based on language
 * @param {string} s - Input string
 * @param {string} lang - Language code ('en' or 'es')
 * @returns {string} Normalized string
 */
export function normalizeForCompare(s, lang) {
  return lang === 'en' ? normalizeSpeech(s) : normalizeAnswer(s);
}

/**
 * Normalize speech (expands contractions for English)
 * @param {string} s - Input string
 * @returns {string} Normalized string
 */
export function normalizeSpeech(s) {
  let t = (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9']/gi, ' ').replace(/\s+/g, ' ').trim();
  // Expand common English contractions - order matters: longer/specific patterns first
  const contractions = [
    // Negative contractions (must come before 're, 've, 'll, 'd, 's, 'm)
    [/\bcan'?t\b/g, 'cannot'],
    [/\bwon'?t\b/g, 'will not'],
    [/\bdon'?t\b/g, 'do not'],
    [/\bdoesn'?t\b/g, 'does not'],
    [/\bdidn'?t\b/g, 'did not'],
    [/\bhasn'?t\b/g, 'has not'],
    [/\bhaven'?t\b/g, 'have not'],
    [/\bisn'?t\b/g, 'is not'],
    [/\baren'?t\b/g, 'are not'],
    [/\bwasn'?t\b/g, 'was not'],
    [/\bweren'?t\b/g, 'were not'],
    [/\bshouldn'?t\b/g, 'should not'],
    [/\bcouldn'?t\b/g, 'could not'],
    [/\bwouldn'?t\b/g, 'would not'],
    [/\bmustn'?t\b/g, 'must not'],
    // 's = is/has (context dependent, but we'll use 'is')
    [/\blet'?s\b/g, 'let us'],
    [/\bthat'?s\b/g, 'that is'],
    [/\bwhat'?s\b/g, 'what is'],
    [/\bwho'?s\b/g, 'who is'],
    [/\bwhere'?s\b/g, 'where is'],
    [/\bhow'?s\b/g, 'how is'],
    [/\bthere'?s\b/g, 'there is'],
    [/\bhere'?s\b/g, 'here is'],
    [/\bit'?s\b/g, 'it is'],
    [/\bhe'?s\b/g, 'he is'],
    [/\bshe'?s\b/g, 'she is'],
    [/\bwho'?s\b/g, 'who is'],
    // 're = are
    [/\byou'?re\b/g, 'you are'],
    [/\bwe'?re\b/g, 'we are'],
    [/\bthey'?re\b/g, 'they are'],
    // 've = have
    [/\bi'?ve\b/g, 'i have'],
    [/\bwe'?ve\b/g, 'we have'],
    [/\bthey'?ve\b/g, 'they have'],
    [/\byou'?ve\b/g, 'you have'],
    // 'll = will
    [/\bi'?ll\b/g, 'i will'],
    [/\bwe'?ll\b/g, 'we will'],
    [/\bthey'?ll\b/g, 'they will'],
    [/\byou'?ll\b/g, 'you will'],
    [/\bhe'?ll\b/g, 'he will'],
    [/\bshe'?ll\b/g, 'she will'],
    [/\bit'?ll\b/g, 'it will'],
    // 'd = would/had (use would)
    [/\bi'?d\b/g, 'i would'],
    [/\bwe'?d\b/g, 'we would'],
    [/\bthey'?d\b/g, 'they would'],
    [/\bhe'?d\b/g, 'he would'],
    [/\bshe'?d\b/g, 'she would'],
    [/\bit'?d\b/g, 'it would'],
    [/\byou'?d\b/g, 'you would'],
    // 'm = am
    [/\bi'?m\b/g, 'i am'],
  ];
  for (const [regex, replacement] of contractions) {
    t = t.replace(regex, replacement);
  }
  return t.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
export function calcularDistanciaLevenshtein(a, b) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a.length < b.length) { const t = a; a = b; b = t; }
  let prev = new Array(b.length + 1), cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = (ca === b.charCodeAt(j - 1)) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    const t = prev; prev = cur; cur = t;
  }
  return prev[b.length];
}

/**
 * Calculate similarity ratio (0-1) based on Levenshtein distance
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity ratio
 */
export function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - calcularDistanciaLevenshtein(a, b) / maxLen;
}

/**
 * Extract digits from string
 * @param {string} s - Input string
 * @returns {string} Comma-separated digits
 */
export function digitsOf(s) {
  return (s.match(/\d+/g) || []).join(',');
}

/**
 * Edit distance between two words with transposition support
 * @param {string} a - First word
 * @param {string} b - Second word
 * @returns {number} Edit distance
 */
export function distanciaEdicionPalabra(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = (a[i - 1] === b[j - 1]) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

/**
 * Check if two words are grammatical variants (plural, tense, gender)
 * @param {string} a - First word
 * @param {string} b - Second word
 * @returns {boolean} Whether they are grammatical variants
 */
export function isGrammaticalVariant(a, b) {
  if (a.length > b.length) { const t = a; a = b; b = t; }
  if (b.startsWith(a)) {
    const suffix = b.slice(a.length);
    if (suffix.length === 1 && a.charAt(a.length - 1) === suffix) return false;
    if (GRAMMAR_SUFFIXES.indexOf(suffix) >= 0) return true;
  }
  if (a.length === b.length && a.length > 2) {
    const ends = a.slice(-1) + b.slice(-1);
    if (a.slice(0, -1) === b.slice(0, -1) && (ends === 'ao' || ends === 'oa')) return true;
    const ends2 = a.slice(-2) + '|' + b.slice(-2);
    if (a.slice(0, -2) === b.slice(0, -2) && (ends2 === 'os|as' || ends2 === 'as|os')) return true;
  }
  return false;
}

/**
 * Check if a typed word is a typo of the expected word
 * @param {string} typedWord - User's typed word
 * @param {string} expectedWord - Expected word
 * @param {string} lang - Language code
 * @param {Set<string>} knownWordsSet - Set of known words in the language
 * @returns {boolean} Whether it's a typo
 */
export function isTypoOf(typedWord, expectedWord, lang, knownWordsSet) {
  if (typedWord === expectedWord) return true;
  const longest = Math.max(typedWord.length, expectedWord.length);
  if (longest <= TYPO_EXACT_UP_TO) return false;
  if (isGrammaticalVariant(typedWord, expectedWord)) return false;
  if (knownWordsSet && knownWordsSet.has(typedWord)) return false;
  const limit = (longest <= TYPO_ONE_EDIT_UP_TO) ? 1 : 2;
  return distanciaEdicionPalabra(typedWord, expectedWord) <= limit;
}

/**
 * Check if typed words match expected words allowing typos
 * @param {string} typed - User's typed answer (normalized)
 * @param {string} expected - Expected answer (normalized)
 * @param {string} lang - Language code
 * @param {Set<string>} knownWordsSet - Set of known words
 * @returns {boolean} Whether words match allowing typos
 */
export function wordsMatchLikeTypos(typed, expected, lang, knownWordsSet) {
  const a = typed.split(' '), b = expected.split(' ');
  if (a.length !== b.length) return typed.replace(/ /g, '') === expected.replace(/ /g, '');
  for (let i = 0; i < a.length; i++) {
    if (!isTypoOf(a[i], b[i], lang, knownWordsSet)) return false;
  }
  return true;
}

/**
 * Describe word differences for hint
 * @param {string} typed - User's typed answer
 * @param {string} expected - Expected answer
 * @returns {string} Hint text
 */
export function describeWordDiffs(typed, expected) {
  const a = typed.split(' '), b = expected.split(' ');
  if (a.length !== b.length) return 'falta o sobra una palabra';
  const diffs = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diffs.push(a[i] + ' → ' + b[i]);
  return (diffs.length && diffs.length <= 3) ? 'revisa: ' + diffs.join(', ') : '';
}

/**
 * Generate written variants of a target answer
 * @param {string} target - Target answer
 * @param {string} lang - Language code
 * @returns {Array<{display: string, norm: string}>} Array of variants
 */
export function writtenVariants(target, lang) {
  const out = [], seen = new Set();
  const add = (display, source) => {
    const norm = normalizeForCompare(source, lang);
    if (norm && !seen.has(norm)) { seen.add(norm); out.push({ display: display, norm: norm }); }
  };
  String(target).split('/').forEach(part => {
    const original = part.trim();
    if (!original) return;
    const clean = original.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
    if (clean) add(clean, clean);
    add(original, original);
  });
  add(String(target).trim(), target);
  return out;
}

/**
 * Evaluate a written answer
 * @param {string} input - User input
 * @param {string} target - Target answer
 * @param {string} lang - Language code
 * @param {Set<string>} knownWordsSet - Set of known words
 * @returns {{ok: boolean, exact: boolean, similarity: number, match: string|null, hint: string}} Result
 */
export function evaluateWrittenAnswer(input, target, lang, knownWordsSet) {
  const result = { ok: false, exact: false, similarity: 0, match: null, hint: '' };
  const typed = normalizeForCompare(input, lang);
  if (!typed) return result;
  let best = null, bestSim = -1, accepted = null, acceptedSim = -1;
  for (const v of writtenVariants(target, lang)) {
    if (v.norm === typed) return { ok: true, exact: true, similarity: 1, match: v.display, hint: '' };
    const sim = similarity(typed, v.norm);
    if (sim > bestSim) { bestSim = sim; best = v; }
    if (sim + 1e-9 >= WRITE_FUZZY_THRESHOLD && sim > acceptedSim &&
        digitsOf(typed) === digitsOf(v.norm) && wordsMatchLikeTypos(typed, v.norm, lang, knownWordsSet)) {
      accepted = v; acceptedSim = sim;
    }
  }
  if (accepted) {
    result.ok = true; result.similarity = acceptedSim; result.match = accepted.display;
  } else if (best) {
    result.similarity = bestSim; result.match = best.display;
    if (bestSim + 1e-9 >= WRITE_FUZZY_THRESHOLD) result.hint = describeWordDiffs(typed, best.norm);
  }
  return result;
}

/**
 * Check if a written answer is correct
 * @param {string} input - User input
 * @param {string} target - Target answer
 * @param {string} lang - Language code
 * @param {Set<string>} knownWordsSet - Set of known words
 * @returns {boolean} Whether answer is correct
 */
export function writeAnswerOk(input, target, lang, knownWordsSet) {
  return evaluateWrittenAnswer(input, target, lang, knownWordsSet).ok;
}

/**
 * Generate note for near-miss answer
 * @param {Object} r - Result from evaluateWrittenAnswer
 * @returns {string} Note text
 */
export function nearMissNote(r) {
  return (r.ok && !r.exact && r.match) ? '(Nota la escritura exacta: "' + r.match + '")' : '';
}
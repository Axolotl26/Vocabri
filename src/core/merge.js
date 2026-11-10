/**
 * Vocabri — Cloud Merge Pure Logic
 * Extracted from app.js for testability
 */

import { calcularDistanciaLevenshtein } from './answerMatch.js';

/**
 * Parse cloud data (handles legacy string format)
 * @param {string|Object} raw - Raw cloud data
 * @param {Object} fallback - Fallback if parsing fails
 * @returns {Object|null} Parsed data or null
 */
export function cloudParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

/**
 * Sanitize cloud object (remove undefined, functions, etc.)
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeCloudObject(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    if (v !== undefined && typeof v !== 'function') out[k] = v;
  });
  return out;
}

/**
 * Convert cloud value to number
 * @param {string|number} v - Value
 * @returns {number} Number value
 */
export function cloudNum(v) {
  const n = parseInt(String(v || '0'), 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Convert day key to number for comparison
 * @param {string} dayKey - Day key (YYYY-MM-DD)
 * @returns {number} Numeric day key
 */
export function dayKeyNum(dayKey) {
  if (!dayKey) return -1;
  return parseInt(String(dayKey).replace(/-/g, ''), 10);
}

/**
 * Merge two card records (SRS state)
 * @param {string} a - Local card record (JSON string)
 * @param {string} b - Cloud card record (JSON string)
 * @returns {string} Merged card record
 */
export function mergeCardRecord(a, b) {
  const A = cloudParse(a, null), B = cloudParse(b, null);
  if (!A || typeof A !== 'object') return b;
  if (!B || typeof B !== 'object') return a;
  // Keep the one with more recent timestamp
  return (Number(A.t) || 0) >= (Number(B.t) || 0) ? a : b;
}

/**
 * Merge stage maps (unlocked stages per category)
 * @param {string} a - Local stage map (JSON string)
 * @param {string} b - Cloud stage map (JSON string)
 * @returns {string} Merged stage map
 */
export function mergeStageMaps(a, b) {
  const A = cloudParse(a, {}), B = cloudParse(b, {});
  if (!A || typeof A !== 'object') return b;
  if (!B || typeof B !== 'object') return a;
  const out = {};
  Object.keys(A).concat(Object.keys(B)).forEach(cat => {
    out[cat] = Math.max(Number(A[cat] || 0), Number(B[cat] || 0));
  });
  return JSON.stringify(out);
}

/**
 * Merge exam results (keep the one with more stars)
 * @param {string} a - Local exam result (JSON string)
 * @param {string} b - Cloud exam result (JSON string)
 * @returns {string} Merged exam result
 */
export function mergeExamResult(a, b) {
  const A = cloudParse(a, null), B = cloudParse(b, null);
  if (!A || typeof A !== 'object') return b;
  if (!B || typeof B !== 'object') return a;
  return (Number(A.stars) || 0) >= (Number(B.stars) || 0) ? a : b;
}

/**
 * Merge custom words (union of both)
 * @param {string} a - Local custom words (JSON string)
 * @param {string} b - Cloud custom words (JSON string)
 * @returns {string} Merged custom words
 */
export function mergeCustomWords(a, b) {
  const A = cloudParse(a, []), B = cloudParse(b, []);
  if (!Array.isArray(A)) return b;
  if (!Array.isArray(B)) return a;
  const seen = new Set();
  const out = [];
  [...A, ...B].forEach(w => {
    const key = (w.en || '') + '|' + (w.es || '');
    if (!seen.has(key)) { seen.add(key); out.push(w); }
  });
  return JSON.stringify(out);
}

/**
 * Merge custom categories (union of both)
 * @param {string} a - Local custom categories (JSON string)
 * @param {string} b - Cloud custom categories (JSON string)
 * @returns {string} Merged custom categories
 */
export function mergeCustomCats(a, b) {
  const A = cloudParse(a, []), B = cloudParse(b, []);
  if (!Array.isArray(A)) return b;
  if (!Array.isArray(B)) return a;
  const seen = new Set();
  const out = [];
  [...A, ...B].forEach(c => {
    const key = String(c).toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(c); }
  });
  return JSON.stringify(out);
}

/**
 * Merge cooldown state (keep most recent)
 * @param {string} a - Local cooldown (JSON string)
 * @param {string} b - Cloud cooldown (JSON string)
 * @returns {string} Merged cooldown
 */
export function mergeCooldownState(a, b) {
  const A = cloudParse(a, null), B = cloudParse(b, null);
  if (!A || typeof A !== 'object') return b;
  if (!B || typeof B !== 'object') return a;
  return (Number(A.ultimoTimestamp) || 0) >= (Number(B.ultimoTimestamp) || 0) ? a : b;
}

/**
 * Main merge function for progress data
 * @param {Object} local - Local data object
 * @param {Object} cloud - Cloud data object
 * @returns {Object} Merged data
 */
export function mergeProgressData(local, cloud) {
  const out = {};
  const allKeys = new Set([...Object.keys(local), ...Object.keys(cloud)]);

  allKeys.forEach(k => {
    if (k in out) return;
    const a = local[k], b = cloud[k];
    if (a === undefined) { out[k] = b; return; }
    if (b === undefined || a === b) { out[k] = a; return; }

    if (k === 'ci_xp_total' || k.indexOf('ci_time_') === 0) {
      out[k] = String(Math.max(cloudNum(a), cloudNum(b)));
    } else if (k.indexOf('ci_master_') === 0) {
      out[k] = mergeCardRecord(a, b);
    } else if (k === 'vocabri_unlocked_stage') {
      out[k] = mergeStageMaps(a, b);
    } else if (k.indexOf('vocabri_exam_') === 0) {
      out[k] = mergeExamResult(a, b);
    } else if (k === 'ci_custom_words') {
      out[k] = mergeCustomWords(a, b);
    } else if (k === 'ci_custom_cats') {
      out[k] = mergeCustomCats(a, b);
    } else if (k === 'vocabriProgress') {
      out[k] = mergeCooldownState(a, b);
    } else if (k === 'vocabri_flip_coach_done') {
      out[k] = (a === '1' || b === '1') ? '1' : a;
    } else {
      out[k] = a; // preferences and anything else: this device wins
    }
  });

  // Handle daily goal counters together
  const la = local.vocabri_last_study_date, lb = cloud.vocabri_last_study_date;
  if (la !== undefined && lb !== undefined && la !== lb) {
    const src = dayKeyNum(la) >= dayKeyNum(lb) ? local : cloud;
    ['vocabri_last_study_date', 'vocabri_xp_today', 'vocabri_goal_celebrated_date'].forEach(k => {
      if (src[k] !== undefined) out[k] = src[k]; else delete out[k];
    });
  } else if (la !== undefined && la === lb) {
    out.vocabri_xp_today = String(Math.max(cloudNum(local.vocabri_xp_today), cloudNum(cloud.vocabri_xp_today)));
    const ca = local.vocabri_goal_celebrated_date, cb = cloud.vocabri_goal_celebrated_date;
    if (ca !== undefined || cb !== undefined) {
      out.vocabri_goal_celebrated_date = (dayKeyNum(ca) >= dayKeyNum(cb)) ? ca : cb;
    }
  }

  return out;
}

/**
 * Check if two cloud data objects are equal
 * @param {Object} a - First object
 * @param {Object} b - Second object
 * @returns {boolean} Whether they are equal
 */
export function cloudDataEqual(a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => a[k] === b[k]);
}
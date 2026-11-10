/**
 * Vocabri — SRS (Spaced Repetition System) Pure Logic
 * Extracted from app.js for testability
 */

// Constants
export const DAY_MS = 24 * 3600 * 1000;
export const REVIEW_AGAIN_MS = 10 * 60 * 1000;
export const LEECH_LAPSES = 4;

/**
 * Get current interval (in days) for a card
 * @param {Object} card - Card state {lvl, iv}
 * @returns {number} Interval in days
 */
export function srsInterval(card) {
  if (card.iv) return card.iv;
  return { 1: 0, 2: 2, 3: 10 }[card.lvl] || 0;
}

/**
 * Days overdue for a card
 * @param {Object} card - Card state {next}
 * @param {number} now - Current timestamp
 * @returns {number} Days late (can be fractional)
 */
export function srsLateDays(card, now) {
  return (card && card.next && now > card.next) ? (now - card.next) / DAY_MS : 0;
}

/**
 * Calculate next interval based on grade
 * Grade: 1=Again, 2=Hard, 3=Good, 4=Easy
 * @param {number} prev - Previous interval in days
 * @param {number} grade - Grade (1-4)
 * @param {Object} card - Current card state (optional, for relearning bonus)
 * @returns {number} Next interval in days
 */
export function srsNextInterval(prev, grade, card) {
  if (grade === 1) return 0;
  if (card && card.rl && prev > 0) {
    // Relearning after a lapse
    if (grade === 2) return Math.max(1, Math.round(prev * 0.8));
    if (grade === 3) return Math.max(1, prev);
    return Math.max(2, Math.round(prev * 1.3));
  }
  // If in relearning but prev is 0 (new card), treat as normal
  const eff = (grade >= 3 && card) ? prev + Math.min(prev, srsLateDays(card, Date.now()) * 0.5) : prev;
  if (grade === 2) return Math.min(365, Math.max(1, Math.round(eff * 1.2)));
  if (grade === 3) return Math.min(365, Math.max(2, Math.round(eff * 2.2)));
  return Math.min(365, Math.max(5, Math.round(eff * 3.5)));
}

/**
 * Format interval as human-readable text
 * @param {number} days - Interval in days
 * @returns {string} Human-readable interval
 */
export function srsGapText(days) {
  if (days <= 0) return '10 min';
  if (days === 1) return '1 día';
  if (days < 30) return days + ' días';
  const m = Math.round(days / 30);
  return m + (m === 1 ? ' mes' : ' meses');
}

/**
 * Calculate due timestamp at start of day
 * @param {number} days - Interval in days
 * @param {number} now - Current timestamp
 * @returns {number} Due timestamp at midnight
 */
export function srsDueAt(days, now) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

/**
 * Get start of day timestamp
 * @param {number} ts - Timestamp
 * @returns {number} Start of day timestamp
 */
export function srsStartOfDay(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Check if a grade would apply (move the calendar)
 * @param {Object} card - Current card state
 * @param {number} grade - Grade (1-4)
 * @param {number} now - Current timestamp
 * @returns {boolean} Whether the grade would apply
 */
export function srsWouldApply(card, grade, now) {
  now = now || Date.now();
  return !card.next || card.next <= now || card.rl || grade === 1;
}

/**
 * Check if a card is a leech (failed many times)
 * @param {Object} card - Card state {lapses}
 * @returns {boolean} Whether the card is a leech
 */
export function isLeech(card) {
  return card.lapses >= LEECH_LAPSES;
}
/**
 * Vocabri — XP and Level Pure Logic
 * Extracted from app.js for testability
 */

/**
 * XP needed to clear level n (go from n to n+1)
 * Progressive curve: n=1:100, n=2:~246, n=3:~417, n=4:~606
 * @param {number} n - Level number
 * @returns {number} XP needed for this level
 */
export function xpForLevel(n) {
  return Math.round(100 * Math.pow(n, 1.3));
}

/**
 * Calculate level from total XP
 * @param {number} xp - Total XP
 * @returns {number} Current level
 */
export function levelFromXp(xp) {
  let lvl = 1, remaining = xp;
  while (remaining >= xpForLevel(lvl)) { remaining -= xpForLevel(lvl); lvl++; }
  return lvl;
}

/**
 * Calculate XP into current level
 * @param {number} xp - Total XP
 * @returns {number} XP into current level
 */
export function xpIntoLevel(xp) {
  let lvl = 1, remaining = xp;
  while (remaining >= xpForLevel(lvl)) { remaining -= xpForLevel(lvl); lvl++; }
  return remaining;
}

/**
 * Calculate total XP needed to reach a level
 * @param {number} level - Target level
 * @returns {number} Cumulative XP needed
 */
export function cumulativeXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Get XP progress in current level (0-1)
 * @param {number} xp - Total XP
 * @returns {number} Progress ratio (0-1)
 */
export function levelProgressRatio(xp) {
  const level = levelFromXp(xp);
  const xpInLevel = xpIntoLevel(xp);
  const xpNeeded = xpForLevel(level);
  return xpNeeded > 0 ? xpInLevel / xpNeeded : 0;
}

/**
 * Format number for display (1.2k, 1.5M, etc.)
 * @param {number} n - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
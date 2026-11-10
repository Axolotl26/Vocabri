/**
 * Vocabri — Layout/Map Pure Logic
 * Extracted from app.js for testability
 */

import { getMasterCategories, getStartNode, getValidCategoryIds } from '../../categoriesRegistry.js';

export const STAGE_SIZE = 8;
export const SESSION_MAX = 8;

/**
 * Session layout for a category (which sessions belong to which etapa)
 * This would normally come from the JSON data structure
 * @param {string} cat - Category ID
 * @returns {Object} Layout object with sessEtapaPos, etapaNames
 */
export function sessionLayout(cat) {
  // This is a simplified version - in reality this comes from the phrase data
  // For testing, we'll use a mock structure
  return {
    sessEtapaPos: {},
    etapaNames: {}
  };
}

/**
 * Get node layout for a category
 * @param {string} cat - Category ID
 * @returns {Object} Node layout with nodes array
 */
export function nodeLayout(cat) {
  const categories = getMasterCategories();
  const catData = categories.find(c => c.id === cat);
  if (!catData) return { nodes: [] };

  // Simplified - real implementation reads from phrase data
  // Each category has ~13-14 normal nodes + exam nodes = ~19-20 total
  const totalPhrases = 100; // approximate
  const sessionsCount = Math.ceil(totalPhrases / SESSION_MAX);
  const nodes = [];

  for (let i = 0; i < sessionsCount; i++) {
    nodes.push({ type: 'normal', sessIdx: i, etapaIdx: Math.floor(i / 2) });
    // Add exam node every 2 sessions
    if ((i + 1) % 2 === 0) {
      nodes.push({ type: 'exam', sources: [i - 1, i] });
    }
  }

  return { nodes };
}

/**
 * Get items for a session index
 * @param {string} cat - Category ID
 * @param {number} sessIdx - Session index
 * @returns {Array} Array of phrase items
 */
export function sessionItemsBySessIdx(cat, sessIdx) {
  // This would read from the loaded phrase data
  // For testing, return mock structure
  return [];
}

/**
 * Get node at index
 * @param {string} cat - Category ID
 * @param {number} idx - Node index
 * @returns {Object|null} Node or null
 */
export function nodeAt(cat, idx) {
  const layout = nodeLayout(cat);
  return layout.nodes[idx] || null;
}

/**
 * Check if node is an exam node
 * @param {string} cat - Category ID
 * @param {number} idx - Node index
 * @returns {boolean} Whether node is exam
 */
export function isExamNode(cat, idx) {
  const n = nodeAt(cat, idx);
  return !!n && n.type === 'exam';
}

/**
 * Get total stages for a category
 * @param {string} cat - Category ID
 * @returns {number} Number of stages
 */
export function stageCountFor(cat) {
  return nodeLayout(cat).nodes.length;
}

/**
 * Get stage items (phrases for a normal stage)
 * @param {string} cat - Category ID
 * @param {number} stageIdx - Stage index
 * @returns {Array} Phrase items
 */
export function stageItems(cat, stageIdx) {
  const n = nodeAt(cat, stageIdx);
  if (!n || n.type !== 'normal') return [];
  return sessionItemsBySessIdx(cat, n.sessIdx);
}

/**
 * Get exam items (pool from multiple sessions)
 * @param {string} cat - Category ID
 * @param {number} stageIdx - Stage index
 * @returns {Array} Exam items pool
 */
export function examItemsFor(cat, stageIdx) {
  const n = nodeAt(cat, stageIdx);
  if (!n || n.type !== 'exam') return [];
  let pool = [];
  n.sources.forEach(si => pool = pool.concat(sessionItemsBySessIdx(cat, si)));
  return pool;
}

/**
 * Get stage name
 * @param {string} cat - Category ID
 * @param {number} stageIdx - Stage index
 * @returns {string} Stage name
 */
export function stageName(cat, stageIdx) {
  const n = nodeAt(cat, stageIdx);
  if (!n) return 'Sección ' + (stageIdx + 1);
  if (n.type === 'exam') return 'Examen';
  // Simplified
  return 'Sección ' + (Math.floor(stageIdx / 2) + 1);
}

/**
 * Get exam stars for a stage
 * @param {string} cat - Category ID
 * @param {number} stageIdx - Stage index
 * @returns {number} Stars (0-3)
 */
export function examStarsOf(cat, stageIdx) {
  // Would read from localStorage in real implementation
  return 0;
}

/**
 * Register section completion
 * @param {string} cat - Category ID
 * @param {number} stageIdx - Stage index
 * @param {number} stars - Stars earned
 */
export function registerSectionCompletion(cat, stageIdx, stars) {
  // Would write to localStorage in real implementation
}

/**
 * Get unlocked stage for category
 * @param {string} cat - Category ID
 * @returns {number} Unlocked stage index
 */
export function getUnlockedStage(cat) {
  // Would read from localStorage in real implementation
  return 0;
}

/**
 * Set unlocked stage for category
 * @param {string} cat - Category ID
 * @param {number} stage - Stage index
 */
export function setUnlockedStage(cat, stage) {
  // Would write to localStorage in real implementation
}

/**
 * Get current stage for category
 * @param {string} cat - Category ID
 * @returns {number} Current stage index
 */
export function getCurrentStage(cat) {
  // Would read from state in real implementation
  return 0;
}

/**
 * Set current stage for category
 * @param {string} cat - Category ID
 * @param {number} stage - Stage index
 */
export function setCurrentStage(cat, stage) {
  // Would write to state in real implementation
}

export const MAX_CONSECUTIVE_NORMAL = 3;
export const COOLDOWN_EXAM_BY_STARS = { 1: 4 * 3600e3, 2: 2 * 3600e3, 3: 0 };
export const COOLDOWN_NORMAL_MS = 30 * 60e3;
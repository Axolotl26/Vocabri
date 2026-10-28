/**
 * Vocabri — Catálogo de 5 categorías maestras y mapeo de nivel a nodo inicial
 * Módulo puro (sin DOM, sin side-effects) para tree-shaking y testabilidad.
 *
 * Las 5 categorías corresponden a:
 * - general: contenido base (DATA.Casual existente)
 * - travel: "Viajes y supervivencia" (desde JSON travel_and_survival - 100 frases)
 * - academic: "Académico" (desde JSON academic - 100 frases)
 * - business: "Negocios y Profesional" (desde JSON business_and_professional - 100 frases)
 * - pop: "Cultura pop y Gaming" (desde JSON pop_culture_and_gaming - 100 frases)
 */

// ============================================================
// CATÁLOGO DE 5 CATEGORÍAS MAESTRAS
// Cada categoría es un "mundo" completo con sus propios nodos
// ============================================================
const MASTER_CATEGORIES = [
  {
    id: 'general',
    label: '🌍 General',
    emoji: '🌍',
    shortLabel: 'General',
    description: 'Vocabulario esencial de todo tipo',
    source: 'Casual' // usa DATA.Casual existente
  },
  {
    id: 'travel',
    label: '✈️ Viajes y supervivencia',
    emoji: '✈️',
    shortLabel: 'Viajes',
    description: 'Turismo, transporte, emergencias',
    source: 'travel_and_survival' // desde JSON
  },
  {
    id: 'academic',
    label: '🎓 Académico',
    emoji: '🎓',
    shortLabel: 'Académico',
    description: 'Estudio, investigación, campus',
    source: 'academic' // desde JSON
  },
  {
    id: 'business',
    label: '💼 Negocios y Profesional',
    emoji: '💼',
    shortLabel: 'Negocios',
    description: 'Reuniones, emails, negociación',
    source: 'business_and_professional' // desde JSON
  },
  {
    id: 'pop',
    label: '🎮 Cultura pop y Gaming',
    emoji: '🎮',
    shortLabel: 'Pop & Gaming',
    description: 'Series, memes, videojuegos',
    source: 'pop_culture_and_gaming' // desde JSON
  }
];

// ============================================================
// MAPEO NIVEL → NODO INICIAL DEL MAPA
// Cada categoría tiene ~13-14 nodos (100 frases / 8 por sesión ≈ 13 sesiones)
// Con exámenes cada 2 nodos = ~19-20 nodos totales por categoría
// ============================================================
const START_NODE_BY_LEVEL = {
  beginner:   0,  // Nodo 1: desde cero
  intermediate: 3, // Nodo 4: salta fundamentos
  advanced:   6,  // Nodo 7: contenido avanzado directo
};

// ============================================================
// API PÚBLICA
// ============================================================

/**
 * Obtiene las 5 categorías maestras.
 * @returns {Array<{id, label, emoji, shortLabel, description, source}>}
 */
function getMasterCategories() {
  return [...MASTER_CATEGORIES];
}

/**
 * Obtiene una categoría maestra por ID.
 * @param {string} catId
 * @returns {Object|null}
 */
function getMasterCategory(catId) {
  return MASTER_CATEGORIES.find(c => c.id === catId) || null;
}

/**
 * Obtiene el índice del nodo inicial según el nivel del usuario.
 * @param {'beginner'|'intermediate'|'advanced'} level
 * @returns {number} índice base-0 del nodo en el array `stages`
 */
function getStartNode(level) {
  const normalized = (level || 'beginner').toLowerCase();
  return START_NODE_BY_LEVEL[normalized] ?? START_NODE_BY_LEVEL.beginner;
}

/**
 * Lista de IDs de categorías maestras válidas.
 * @returns {string[]}
 */
function getValidCategoryIds() {
  return MASTER_CATEGORIES.map(c => c.id);
}

/**
 * Lista de niveles válidos.
 * @returns {string[]}
 */
function getValidLevels() {
  return Object.keys(START_NODE_BY_LEVEL);
}

/**
 * Valida si una categoría maestra es válida.
 * @param {string} catId
 * @returns {boolean}
 */
function isValidCategory(catId) {
  return MASTER_CATEGORIES.some(c => c.id === catId);
}

/**
 * Valida si un nivel es válido.
 * @param {string} level
 * @returns {boolean}
 */
function isValidLevel(level) {
  return level in START_NODE_BY_LEVEL;
}

/**
 * Obtiene el emoji de una categoría.
 * @param {string} catId
 * @returns {string}
 */
function getCategoryEmoji(catId) {
  const cat = getMasterCategory(catId);
  return cat ? cat.emoji : '📚';
}

/**
 * Obtiene el label corto de una categoría.
 * @param {string} catId
 * @returns {string}
 */
function getCategoryShortLabel(catId) {
  const cat = getMasterCategory(catId);
  return cat ? cat.shortLabel : catId;
}

/**
 * Obtiene el label completo de una categoría.
 * @param {string} catId
 * @returns {string}
 */
function getCategoryLabel(catId) {
  const cat = getMasterCategory(catId);
  return cat ? cat.label : catId;
}

// ============================================================
// COMPATIBILIDAD HACIA ATRÁS (para código que use la API antigua)
// ============================================================

/**
 * @deprecated Usa getMasterCategories() en su lugar.
 * Mantiene compatibilidad con código que espera getCategories(focus).
 */
function getCategories(focus) {
  // Mapear focus antiguo a categoría maestra
  const focusToMaster = {
    'general': 'general',
    'travel': 'travel',
    'business': 'business',
    'pop': 'pop'
  };
  const masterId = focusToMaster[focus] || 'general';
  const master = getMasterCategory(masterId);
  return master ? [{ id: master.id, label: master.label, emoji: master.emoji }] : [];
}

/**
 * @deprecated Usa getValidCategoryIds() en su lugar.
 */
function getValidFoci() {
  return getValidCategoryIds();
}

// Exponer globalmente para scripts no-módulo (app.js)
if (typeof window !== 'undefined') {
  window.VocabriCategories = {
    // Nueva API (5 categorías maestras)
    getMasterCategories,
    getMasterCategory,
    getStartNode,
    getValidCategoryIds,
    getValidLevels,
    isValidCategory,
    isValidLevel,
    getCategoryEmoji,
    getCategoryShortLabel,
    getCategoryLabel,
    // API antigua (compatibilidad)
    getCategories,
    getValidFoci,
  };
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMasterCategories,
    getMasterCategory,
    getStartNode,
    getValidCategoryIds,
    getValidLevels,
    isValidCategory,
    isValidLevel,
    getCategoryEmoji,
    getCategoryShortLabel,
    getCategoryLabel,
    getCategories,
    getValidFoci,
    MASTER_CATEGORIES,
    START_NODE_BY_LEVEL
  };
}
/**
 * Vocabri — Registro ÚNICO de categorías maestras (ES Module).
 *
 * Para añadir una categoría nueva basta con agregar una entrada a MASTER_CATEGORIES:
 *   id, name (sin emoji), emoji, shortLabel, description, color, jsonKey (clave en el JSON de frases,
 *   null si usa datos internos) y zones (tamaños múltiplos de 8 + nombres de las zonas del mapa).
 * De aquí salen: ids válidos, etiquetas, colores del progreso, zonas del mapa, mapeo del JSON,
 * botones del onboarding y del selector de categoría.
 *
 * Módulo puro (sin DOM): también se expone como window.VocabriCategories por compatibilidad.
 */

export const MASTER_CATEGORIES = [
  {
    id: 'general', name: 'General', emoji: '🌍', shortLabel: 'General',
    description: 'Vocabulario esencial', color: '#F59E0B',
    source: 'Casual', jsonKey: null, zones: null          // usa DATA.Casual (módulos propios en dataRegistry)
  },
  {
    id: 'travel', name: 'Viajes y supervivencia', emoji: '✈️', shortLabel: 'Viajes',
    description: 'Turismo, transporte, emergencias', color: '#38BDF8',
    source: 'travel_and_survival', jsonKey: 'travel_and_survival',
    zones: { sizes: [24, 24, 24, 28], names: ['Aeropuerto y Transporte', 'Hotel y Alojamiento', 'Restaurantes y Comida', 'Emergencias y Direcciones'] }
  },
  {
    id: 'academic', name: 'Académico', emoji: '🎓', shortLabel: 'Académico',
    description: 'Estudio, investigación, campus', color: '#A78BFA',
    source: 'academic', jsonKey: 'academic',
    zones: { sizes: [24, 24, 24, 28], names: ['En Clase y Tareas', 'Investigación y Ciencia', 'Biblioteca y Tecnología', 'Vida Universitaria'] }
  },
  {
    id: 'business', name: 'Negocios y Profesional', emoji: '💼', shortLabel: 'Negocios',
    description: 'Reuniones, emails, entrevistas', color: '#22C55E',
    source: 'business_and_professional', jsonKey: 'business_and_professional',
    zones: { sizes: [24, 24, 24, 28, 32], names: ['Correos Profesionales', 'Reuniones', 'Finanzas y Ventas', 'Gestión y Estrategia', 'Entrevistas de Trabajo'] }
  },
  {
    id: 'pop', name: 'Cultura pop y Gaming', emoji: '🎮', shortLabel: 'Pop & Gaming',
    description: 'Series, memes, videojuegos', color: '#F472B6',
    source: 'pop_culture_and_gaming', jsonKey: 'pop_culture_and_gaming',
    zones: { sizes: [24, 24, 24, 28], names: ['Gaming: Acción y Equipo', 'Gaming Online y Ranked', 'Series, Anime y Cine', 'Streaming y Redes'] }
  }
].map(c => Object.freeze({ ...c, label: c.emoji + ' ' + c.name }));

// Color / emoji de la "categoría" de tarjetas propias del usuario (no es una categoría maestra)
export const CUSTOM_CATEGORY = Object.freeze({ id: 'custom', emoji: '🃏', color: '#FB923C', label: 'Mis tarjetas' });

// Nivel → nodo inicial del mapa (0 = desde cero)
export const START_NODE_BY_LEVEL = { beginner: 0, intermediate: 3, advanced: 6 };

export function getMasterCategories() { return [...MASTER_CATEGORIES]; }
export function getMasterCategory(catId) { return MASTER_CATEGORIES.find(c => c.id === catId) || null; }
export function getValidCategoryIds() { return MASTER_CATEGORIES.map(c => c.id); }
export function isValidCategory(catId) { return MASTER_CATEGORIES.some(c => c.id === catId); }
export function getStartNode(level) {
  const n = (level || 'beginner').toLowerCase();
  return START_NODE_BY_LEVEL[n] ?? START_NODE_BY_LEVEL.beginner;
}
export function getValidLevels() { return Object.keys(START_NODE_BY_LEVEL); }
export function isValidLevel(level) { return level in START_NODE_BY_LEVEL; }

export function getCategoryEmoji(catId) { const c = getMasterCategory(catId); return c ? c.emoji : (catId === CUSTOM_CATEGORY.id ? CUSTOM_CATEGORY.emoji : '📚'); }
export function getCategoryShortLabel(catId) { const c = getMasterCategory(catId); return c ? c.shortLabel : catId; }
export function getCategoryLabel(catId) { const c = getMasterCategory(catId); return c ? c.label : catId; }
export function getCategoryColor(catId) { const c = getMasterCategory(catId); return c ? c.color : (catId === CUSTOM_CATEGORY.id ? CUSTOM_CATEGORY.color : '#94A3B8'); }

/** Categorías cuyo contenido viene del JSON de frases. */
export function getJsonCategories() { return MASTER_CATEGORIES.filter(c => c.jsonKey); }
/** { clave_en_el_JSON: id_de_categoría } */
export function getJsonCategoryMap() {
  const map = {};
  getJsonCategories().forEach(c => { map[c.jsonKey] = c.id; });
  return map;
}
/** { id: {sizes, names} } de las categorías con zonas nombradas. */
export function getZonesMap() {
  const out = {};
  MASTER_CATEGORIES.forEach(c => { if (c.zones) out[c.id] = { sizes: [...c.zones.sizes], names: [...c.zones.names] }; });
  return out;
}

// API antigua (compatibilidad)
export function getCategories(focus) {
  const m = getMasterCategory(isValidCategory(focus) ? focus : 'general');
  return m ? [{ id: m.id, label: m.label, emoji: m.emoji }] : [];
}
export function getValidFoci() { return getValidCategoryIds(); }

const API = {
  getMasterCategories, getMasterCategory, getStartNode, getValidCategoryIds, getValidLevels,
  isValidCategory, isValidLevel, getCategoryEmoji, getCategoryShortLabel, getCategoryLabel,
  getCategoryColor, getJsonCategories, getJsonCategoryMap, getZonesMap, getCategories, getValidFoci
};
if (typeof window !== 'undefined') window.VocabriCategories = API;
export default API;

// Vocabri — módulo "mapData" (generado a partir de app.js)
import { MAX_CONSECUTIVE_NORMAL, SESSION_MAX, STAGE_SIZE, buildNodeLayout, buildSessionLayout } from './core/layout.js';
export { MAX_CONSECUTIVE_NORMAL, SESSION_MAX, STAGE_SIZE };
import { CAT_MODULE_NAMES, CAT_MODULE_SIZES, ZONES_CARRY_EXAM, getExamResult, hasNamedModules, mapItemsFor, readStored } from './core/dataRegistry.js';


// Each category's cards are grouped as Categoría > Etapa > Sesión.
// For categories with named modules (Casual), each named module is one
// Etapa; an Etapa longer than ~20 cards is split into 2+ Sesiones of
// roughly even size (max 20 each). Categories without named modules get
// a single implicit Etapa (the category itself) made of Sesiones of
// STAGE_SIZE cards, so the vocabulary stays consistent everywhere.





 // a normal Sección is exactly 8 cards (last one in an Etapa may be shorter)
export const _sessionLayoutCache = {};


export function sessionLayout(cat){
  if(_sessionLayoutCache[cat]) return _sessionLayoutCache[cat];
  const layout = hasNamedModules(cat)
    ? buildSessionLayout({names: CAT_MODULE_NAMES[cat], sizes: CAT_MODULE_SIZES[cat]})
    : buildSessionLayout({names: [cat], total: mapItemsFor(cat).length});
  _sessionLayoutCache[cat] = layout;
  return layout;
}


export function sessionItemsBySessIdx(cat, sessIdx){
  const items = mapItemsFor(cat);
  const L = sessionLayout(cat);
  let start = 0;
  for(let i=0;i<sessIdx;i++) start += L.sessSizes[i];
  return items.slice(start, start + (L.sessSizes[sessIdx]||0));
}


// Node layer: wraps sessionLayout and inserts an Examen node after every
// MAX_CONSECUTIVE_NORMAL (2) normal Secciones within each Etapa. This is
// what the map actually renders and what getUnlockedStage/getCurrentStage
// index into — "stageIdx" everywhere below means a node index here.



// Exam: 12 questions = 5 multiple-choice + 3 writing + 2 dictation + 2 pronunciation. 5 lives (hearts).
export const EXAM_QUESTIONS = 12, EXAM_MC_COUNT = 5, EXAM_WRITE_COUNT = 3, EXAM_DICTATION_COUNT = 2, EXAM_SPEAK_COUNT = 2;


export const EXAM_LIVES = 5;


export const SPEAK_MATCH_THRESHOLD = 0.85;

 // 0..1 similarity needed between what was heard and the target phrase
export { WRITE_FUZZY_THRESHOLD } from './core/answerMatch.js';   // 0..1 de parecido para dar por buena una respuesta escrita


export const _nodeLayoutCache = {};


export function nodeLayout(cat){
  if(_nodeLayoutCache[cat]) return _nodeLayoutCache[cat];
  const layout = buildNodeLayout(sessionLayout(cat), ZONES_CARRY_EXAM.has(cat));
  _nodeLayoutCache[cat] = layout;
  return layout;
}


export function nodeAt(cat, idx){ return nodeLayout(cat).nodes[idx]; }


export function isExamNode(cat, idx){ const n = nodeAt(cat, idx); return !!n && n.type === 'exam'; }


export function stageCountFor(cat){ return nodeLayout(cat).nodes.length; }


export function stageItems(cat, stageIdx){
  const n = nodeAt(cat, stageIdx);
  if(!n || n.type !== 'normal') return [];
  return sessionItemsBySessIdx(cat, n.sessIdx);
}


export function examItemsFor(cat, stageIdx){
  const n = nodeAt(cat, stageIdx);
  if(!n || n.type !== 'exam') return [];
  let pool = [];
  n.sources.forEach(si=> pool = pool.concat(sessionItemsBySessIdx(cat, si)));
  return pool;
}


export function stageName(cat, stageIdx){
  const n = nodeAt(cat, stageIdx);
  if(!n) return 'Sección ' + (stageIdx+1);
  if(n.type === 'exam') return 'Examen';
  const L = sessionLayout(cat);
  const pos = L.sessEtapaPos[n.sessIdx];
  return pos && pos[1] > 1 ? ('Sección ' + pos[0] + ' de ' + pos[1]) : 'Sección única';
}


export function etapaNameForSession(cat, stageIdx){
  const n = nodeAt(cat, stageIdx);
  const L = nodeLayout(cat);
  const etapaName = (n && L.etapaNames[n.etapaIdx]) || cat;
  // Si es el nombre de la categoría (sin módulos nombrados), usar label bonito
  if (etapaName === cat && window.VocabriCategories) {
    return window.VocabriCategories.getCategoryLabel(cat);
  }
  return etapaName;
}


export function isStageComplete(cat, stageIdx){
  const n = nodeAt(cat, stageIdx);
  if(!n) return false;
  if(n.type === 'exam') return !!getExamResult(cat, stageIdx);
  const items = stageItems(cat, stageIdx);
  // Etapa completa si TODAS las tarjetas han sido calificadas al menos una vez (lvl >= 1)
  // El mastery (lvl >= 2) es para el SRS de repaso
  return items.length > 0 && items.every(it=> (readStored(it[3]).lvl || 0) >= 1);
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [

];

// Vocabri — puntos débiles (puro, sin DOM ni localStorage).
// Una frase es "débil" si la has fallado varias veces Y todavía no se te asienta: sigue en reaprendizaje o su intervalo es corto.
// Así la lista se vacía sola cuando la dominas (el intervalo crece), aunque el contador de fallos histórico no baje nunca.
import { srsInterval } from './srs.js';

export const WEAK_MIN_LAPSES = 2;      // fallos mínimos para considerarla débil
export const WEAK_STABLE_DAYS = 21;    // con este intervalo (o más) y sin reaprendizaje, ya "salió" de la lista
export const WEAK_SESSION_SIZE = 12;   // tamaño de una sesión de entrenamiento

export function isWeak(rec){
  if(!rec || (rec.lapses || 0) < WEAK_MIN_LAPSES) return false;
  return !!rec.rl || srsInterval(rec) < WEAK_STABLE_DAYS;
}

// Más alto = más urgente: fallos, reaprendizaje activo y un intervalo corto pesan más.
export function weakScore(rec){
  const iv = Math.min(WEAK_STABLE_DAYS, srsInterval(rec));
  return rec.lapses * 10 + (rec.rl ? 15 : 0) + (WEAK_STABLE_DAYS - iv) * 0.5;
}

// entries: [{it, rec}] → todas las débiles, de la más urgente a la menos (empates por clave, para que el orden sea estable)
export function rankWeak(entries){
  return entries
    .filter(e => isWeak(e.rec))
    .sort((a, b) => (weakScore(b.rec) - weakScore(a.rec)) || String(a.it[3]).localeCompare(String(b.it[3])));
}

export function pickWeak(entries, size){
  return rankWeak(entries).slice(0, size == null ? WEAK_SESSION_SIZE : size).map(e => e.it);
}

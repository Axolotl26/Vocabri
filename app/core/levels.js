// Vocabri — fórmula de niveles (pura). state.js la reexporta.
export function xpForLevel(n){ return Math.round(100 * Math.pow(n, 1.3)); }
export function levelFromXp(xp){
  let lvl = 1, remaining = xp;
  while(remaining >= xpForLevel(lvl)){ remaining -= xpForLevel(lvl); lvl++; }
  return lvl;
}

// Vocabri — categorías que se desbloquean por nivel (p. ej. Exámenes, nivel 8). Los desbloqueos son permanentes.
import { getMasterCategories, getMasterCategory } from '../../categoriesRegistry.js';
import { levelFromXp } from './levels.js';

export const UNLOCK_KEY = 'vocabri_unlocked_cats';

function readList(){ try{ const v = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } }
function writeList(l){ try{ localStorage.setItem(UNLOCK_KEY, JSON.stringify(l)); }catch(e){} }

export function playerLevel(){
  try{ return levelFromXp(parseInt(localStorage.getItem('ci_xp_total') || '0', 10) || 0); }catch(e){ return 1; }
}
export function unlockLevelOf(catId){ const c = getMasterCategory(catId); return c && c.unlockLevel ? c.unlockLevel : 0; }

export function isCategoryUnlocked(catId, level, list){
  const need = unlockLevelOf(catId);
  if(!need) return true;
  if((list || readList()).includes(catId)) return true;
  return (level == null ? playerLevel() : level) >= need;
}
/** Guarda los desbloqueos alcanzados y devuelve los ids recién desbloqueados. */
export function checkUnlocks(){
  const list = readList(), lvl = playerLevel(), fresh = [];
  getMasterCategories().forEach(c => {
    if(c.unlockLevel && !list.includes(c.id) && lvl >= c.unlockLevel){ list.push(c.id); fresh.push(c.id); }
  });
  if(fresh.length) writeList(list);
  return fresh;
}

// Vocabri — "Puntos débiles": entrenamiento con tus frases más falladas.
// No guarda nada nuevo: se calcula con los datos de repaso que ya existen y se practica con el mismo Repaso de siempre.
// El acceso (botón) vive en la fila «Modos de práctica» de Repaso (modes.js).
import { itemsFor, readStored } from './core/dataRegistry.js';
import { WEAK_SESSION_SIZE, pickWeak, rankWeak } from './core/weakSpots.js';
import { switchView } from './ui.js';

export function weakEntries(){
  return itemsFor('Todas').map(it => ({ it, rec: readStored(it[3]) }));
}
export function weakCount(){ return rankWeak(weakEntries()).length; }

export function startWeakTraining(){
  const items = pickWeak(weakEntries(), WEAK_SESSION_SIZE);
  if(!items.length) return false;
  window.currentReviewStage = {
    items, label: 'Puntos débiles',
    sub: 'Tus frases más falladas que aún no se te asientan. Practicarlas no cambia el calendario salvo que ya toque repasarlas.'
  };
  switchView('review');
  return true;
}

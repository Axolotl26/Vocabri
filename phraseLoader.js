/**
 * Vocabri — Cargador de frases desde JSON (ES Module)
 * Rellena DATA (app/core/dataRegistry.js) con las categorías del JSON y avisa con el evento
 * 'vocabri:phrasesLoaded' / window.VocabriPhraseData.loaded cuando termina (también si falla).
 */
import { DATA, initializeDataRegistry } from './app/core/dataRegistry.js';
import { getJsonCategories } from './categoriesRegistry.js';

const CATEGORY_IDS = getJsonCategories().map(c => c.id);

function markLoaded(ok){
  window.VocabriPhraseData = {
    loaded: true,
    ok,
    categories: ['general'].concat(ok ? CATEGORY_IDS : []),
    getCategoryData: (catId) => DATA[catId] || []
  };
  window.dispatchEvent(new CustomEvent('vocabri:phrasesLoaded'));
}

export async function loadPhrasesFromJSON() {
  try {
    const response = await fetch('./base_de_datos_de_frases_vocabri.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    initializeDataRegistry(await response.json());
    markLoaded(true);
    return true;
  } catch (error) {
    console.error('[phraseLoader] Error cargando JSON:', error);
    if (DATA.Casual) DATA.general = DATA.Casual;   // la categoría general funciona sin el JSON
    markLoaded(false);
    return false;
  }
}

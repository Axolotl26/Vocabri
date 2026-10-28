/**
 * Vocabri — Cargador de frases desde JSON
 * Carga base_de_datos_de_frases_vocabri.json y convierte al formato interno DATA
 */

// Formato interno: DATA[category] = [[en, es], [en, es], ...]

async function loadPhrasesFromJSON() {
  try {
    const response = await fetch('./base_de_datos_de_frases_vocabri.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const jsonData = await response.json();

    // Mapeo de claves JSON a IDs de categoría internos
    const categoryMap = {
      'travel_and_survival': 'travel',
      'academic': 'academic',
      'business_and_professional': 'business',
      'pop_culture_and_gaming': 'pop'
    };

    // Convertir cada categoría del JSON al formato interno
    // El JSON tiene las categorías anidadas bajo la clave "categories"
    const categoriesData = jsonData.categories || jsonData;
    for (const [jsonKey, catId] of Object.entries(categoryMap)) {
      if (categoriesData[jsonKey] && Array.isArray(categoriesData[jsonKey])) {
        DATA[catId] = categoriesData[jsonKey].map(item => [item.en, item.es]);
        console.log(`[phraseLoader] Cargada categoría ${catId}: ${DATA[catId].length} frases`);
      }
    }

    // La categoría "general" usa el contenido existente de DATA.Casual
    if (DATA.Casual && DATA.Casual.length > 0) {
      DATA.general = [...DATA.Casual];
      console.log(`[phraseLoader] Categoría general: ${DATA.general.length} frases (desde Casual)`);
    }

    // Exponer categorías válidas para el registro
    window.VocabriPhraseData = {
      loaded: true,
      categories: Object.keys(categoryMap).map(k => categoryMap[k]).concat(['general']),
      getCategoryData: (catId) => DATA[catId] || []
    };

    // Disparar evento para que app.js sepa que los datos están listos
    window.dispatchEvent(new CustomEvent('vocabri:phrasesLoaded'));

    return true;
  } catch (error) {
    console.error('[phraseLoader] Error cargando JSON:', error);
    // Fallback: usar solo DATA.Casual existente
    DATA.general = DATA.Casual || [];
    window.VocabriPhraseData = {
      loaded: true,
      categories: ['general'],
      getCategoryData: (catId) => DATA[catId] || []
    };
    window.dispatchEvent(new CustomEvent('vocabri:phrasesLoaded'));
    return false;
  }
}

// Auto-cargar al importar
if (typeof window !== 'undefined') {
  // Cargar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPhrasesFromJSON);
  } else {
    loadPhrasesFromJSON();
  }
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadPhrasesFromJSON };
}


//Resumen para mañana:

//┌─────────────────────┬──────────────┬─────────────────────────────────────────────────────────────────────────────┐
//│        Fase         │    Estado    │                                  Qué falta                                  │
//├─────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────────┤
//│ A Datos/Registro    │ ✅ Done      │ —                                                                           │
//├─────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────────┤
//│ B Onboarding 5 cats │ ✅ Done      │ —                                                                           │
//├─────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────────┤
//│ C Mapa/Navegación   │ 🟡 Parcial   │ Verificar distribución nodos (100 frases → ~19-20 nodos) + Test E2E         │
//├─────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────────┤
//│ D Limpieza          │ ⏳ Pendiente │ Borrar CAT_MODULE_SIZES, CAT_MODULE_NAMES, hasNamedModules, realCats legacy │
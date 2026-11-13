/**
 * Vocabri — punto de entrada (ES Module).
 *
 * El app.js original era un script clásico: sus sentencias de nivel superior (cablear botones,
 * restaurar tema, arrancar la nube…) se ejecutaban en orden de arriba a abajo. Al dividirlo en módulos
 * cada archivo exporta esas sentencias en `__inits` junto con su número de línea original; aquí se
 * reúnen y se ejecutan en ese mismo orden, así el comportamiento es idéntico al del monolito.
 */
import { loadPhrasesFromJSON } from '../phraseLoader.js';
import { renderCategoryOptions } from './categoryOptions.js';
import * as dataRegistry from './core/dataRegistry.js';
import * as mapData from './mapData.js';
import * as mapRenderer from './mapRenderer.js';
import * as map from './map.js';
import * as state from './state.js';
import * as ui from './ui.js';
import * as lesson from './lesson.js';
import * as progress from './progress.js';
import * as review from './review.js';
import * as myCards from './myCards.js';
import * as profile from './profile.js';
import * as speech from './speech.js';
import * as exam from './exam.js';
import * as settings from './settings.js';
import * as translator from './translator.js';
import * as sync from './sync.js';
import * as dictation from './dictation.js';
import * as weakSpots from './weakSpots.js';
import * as exportCards from './exportCards.js';
import * as routes from './routes.js';
import * as scenes from './scenes.js';
import * as alphabet from './alphabet.js';
import * as modes from './modes.js';
import * as updater from './updater.js';
import * as settingsUi from './settingsUi.js';
import * as shortcuts from './shortcuts.js';

// Estilos de las funciones de la 1.1.6 (Puntos débiles, Rutas, Escenas, Exportar): archivo aparte, así no hay que pegar nada en styles.css.
(function(){
  if(document.querySelector('link[data-vocabri-css="1.1.6"]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = 'styles-1.1.6.css?v=1.1.6-r7'; l.setAttribute('data-vocabri-css', '1.1.6');
  document.head.appendChild(l);
})();

const MODULES = { dataRegistry, mapData, mapRenderer, map, state, ui, lesson, progress, review, myCards, profile, speech, exam, settings, translator, sync, dictation, shortcuts, weakSpots, exportCards, routes, scenes, alphabet, modes, updater, settingsUi };

function runInits(){
  const all = [];
  for (const [name, m] of Object.entries(MODULES)) {
    for (const [line, fn] of (m.__inits || [])) all.push({ line, fn, name });
  }
  all.sort((a, b) => a.line - b.line);
  for (const it of all) {
    try { it.fn(); }
    catch (err) { console.error(`[Vocabri] fallo en ${it.name} (app.js original, línea ${it.line}):`, err); }
  }
}

// 0) Botones de categoría generados desde el registro único (antes de cablear eventos).
renderCategoryOptions();
// 1) Interfaz y eventos listos de inmediato (el botón "Comenzar" no depende de la red).
runInits();
// 2) Las frases del JSON se cargan en paralelo; al terminar emiten 'vocabri:phrasesLoaded'.
loadPhrasesFromJSON();

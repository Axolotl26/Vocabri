/**
 * Vocabri — Atajos de Teclado (v1.5+)
 * Navegación completa sin ratón
 */

import { getState, showView, addXP } from './state.js';
import { showToast, vbPrompt } from './ui.js';
import { buildPathMap, showLesson } from './map.js';
import { flipCard, showAnswer, rateCard } from './lesson.js';
import { startReviewSession } from './review.js';
import { startSpeedRun, startSurvival, startDictationMode } from './gameModes.js';

// ============================================================
// MAPA DE ATAJOS
// ============================================================
const SHORTCUTS = {
  // Navegación global
  'KeyM': { action: () => showView('cardsView'), desc: 'Ir al Mapa', global: true },
  'KeyR': { action: () => showView('reviewView'), desc: 'Repasar', global: true },
  'KeyP': { action: () => showView('progressView'), desc: 'Progreso', global: true },
  'KeyT': { action: () => showView('translatorView'), desc: 'Traductor', global: true },
  'KeyC': { action: () => showView('myCardsView'), desc: 'Mis Tarjetas', global: true },
  'KeyU': { action: () => showView('profileView'), desc: 'Perfil', global: true },

  // Mapa / Lección
  'Space': { action: handleSpace, desc: 'Voltear tarjeta / Mostrar respuesta', context: 'lesson' },
  'Digit1': { action: () => rateCard('hard'), desc: 'Calificar: Repasar', context: 'lesson' },
  'Digit2': { action: () => rateCard('good'), desc: 'Calificar: Bien', context: 'lesson' },
  'Digit3': { action: () => rateCard('easy'), desc: 'Calificar: Fácil', context: 'lesson' },
  'ArrowLeft': { action: () => navigateMap(-1), desc: 'Nodo anterior (mapa)', context: 'map' },
  'ArrowRight': { action: () => navigateMap(1), desc: 'Siguiente nodo (mapa)', context: 'map' },
  'ArrowUp': { action: () => navigateMap(-1), desc: 'Nodo anterior (mapa)', context: 'map' },
  'ArrowDown': { action: () => navigateMap(1), desc: 'Siguiente nodo (mapa)', context: 'map' },
  'Enter': { action: () => activateMapNode(), desc: 'Entrar en nodo (mapa)', context: 'map' },

  // Repaso (SRS)
  'KeyA': { action: () => rateReviewCard('again'), desc: 'Repaso: Otra vez', context: 'review' },
  'KeyS': { action: () => rateReviewCard('hard'), desc: 'Repaso: Difícil', context: 'review' },
  'KeyD': { action: () => rateReviewCard('good'), desc: 'Repaso: Bien', context: 'review' },
  'KeyF': { action: () => rateReviewCard('easy'), desc: 'Repaso: Fácil', context: 'review' },
  'KeyZ': { action: () => undoReview(), desc: 'Deshacer última nota', context: 'review' },

  // Examen
  'Digit1': { action: () => selectExamOption(0), desc: 'Opción 1', context: 'exam' },
  'Digit2': { action: () => selectExamOption(1), desc: 'Opción 2', context: 'exam' },
  'Digit3': { action: () => selectExamOption(2), desc: 'Opción 3', context: 'exam' },
  'Digit4': { action: () => selectExamOption(3), desc: 'Opción 4', context: 'exam' },

  // Modos de juego (v1.5+)
  'KeyX': { action: () => startSpeedRun(), desc: 'Iniciar Speed Run', context: 'map', global: true },
  'KeyV': { action: () => startSurvival(), desc: 'Iniciar Supervivencia', context: 'map', global: true },
  'KeyB': { action: () => startDictationMode(), desc: 'Modo Dictado', context: 'map', global: true },

  // Utilidades
  'Slash': { action: showShortcutsHelp, desc: 'Mostrar ayuda de atajos (?)', global: true },
  'Escape': { action: closeModals, desc: 'Cerrar modales / Volver', global: true },
};

// ============================================================
// ESTADO DE CONTEXTO
// ============================================================
let currentContext = 'global';

function setContext(ctx) {
  currentContext = ctx;
}

// ============================================================
// HANDLERS
// ============================================================
function handleSpace() {
  const view = getCurrentView();
  if (view === 'lessonView') {
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    const rateBlock = document.getElementById('rateBlock');
    if (showAnswerBtn && !showAnswerBtn.hidden) {
      showAnswer();
    } else if (rateBlock && !rateBlock.hidden) {
      // Si ya se mostró respuesta, Space no hace nada (evitar doble acción)
    } else {
      flipCard();
    }
  }
}

function navigateMap(dir) {
  const view = getCurrentView();
  if (view !== 'cardsView') return;

  const nodes = document.querySelectorAll('.pathNode:not(.locked):not(.done)');
  if (!nodes.length) return;

  const active = document.querySelector('.pathNode.active') || nodes[0];
  const idx = Array.from(nodes).indexOf(active);
  const nextIdx = Math.max(0, Math.min(nodes.length - 1, idx + dir));
  nodes[nextIdx].focus();
  nodes[nextIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function activateMapNode() {
  const active = document.querySelector('.pathNode.active:not(.locked)');
  if (active) active.click();
}

function selectExamOption(index) {
  const options = document.querySelectorAll('#examMcOptions .mcOption');
  if (options[index]) options[index].click();
}

function rateReviewCard(rating) {
  // Se importa dinámicamente para evitar dependencia circular
  import('./review.js').then(m => m.rateReviewCard(rating));
}

function undoReview() {
  import('./review.js').then(m => {
    if (m.undoLastRating) m.undoLastRating();
  });
}

function closeModals() {
  document.querySelectorAll('.gModalOverlay[style*="flex"]').forEach(m => m.style.display = 'none');
}

function showShortcutsHelp() {
  if (document.getElementById('shortcutsHelpOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'shortcutsHelpOverlay';
  overlay.className = 'gModalOverlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="gModal gModalWide" style="max-width:600px; max-height:80vh; overflow:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0;">⌨️ Atajos de Teclado</h3>
        <button class="modalCloseBtn" type="button">✕</button>
      </div>
      <div class="shortcutsList" style="display:grid; gap:8px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
        ${Object.entries(SHORTCUTS).map(([key, info]) => `
          <div class="shortcutItem" style="display:flex; align-items:center; gap:12px; padding:8px 12px; background:var(--bg); border-radius:8px; border:1px solid var(--line);">
            <kbd style="background:var(--primary-soft); color:var(--primary); padding:2px 8px; border-radius:4px; font-family:monospace; font-size:.85rem; min-width:40px; text-align:center;">${formatKey(key)}</kbd>
            <span style="flex:1;">${info.desc}</span>
            ${info.context && info.context !== 'global' ? `<span class="contextBadge" style="font-size:.7rem; color:var(--muted); background:var(--line); padding:2px 6px; border-radius:999px;">${info.context}</span>` : ''}
          </div>
        `).join('')}
      </div>
      <p class="hint" style="margin-top:16px; text-align:center;">Presiona <kbd>Esc</kbd> o <kbd>/</kbd> para cerrar</p>
    </div>
  `;

  overlay.querySelector('.modalCloseBtn').onclick = () => document.body.removeChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
  document.body.appendChild(overlay);
}

function formatKey(key) {
  const map = {
    'Space': 'Espacio',
    'Slash': '/',
    'Escape': 'Esc',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'Digit1': '1',
    'Digit2': '2',
    'Digit3': '3',
    'Digit4': '4',
  };
  return map[key] || key.replace('Key', '');
}

function getCurrentView() {
  for (const view of ['cardsView', 'lessonView', 'examView', 'reviewView', 'progressView', 'myCardsView', 'translatorView', 'profileView']) {
    const el = document.getElementById(view);
    if (el && el.style.display !== 'none') return view;
  }
  return 'global';
}

// ============================================================
// LISTENER GLOBAL
// ============================================================
function handleKeydown(e) {
  // Ignorar si está escribiendo en input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    // Permitir Escape y / incluso en inputs
    if (e.key !== 'Escape' && e.key !== '/') return;
  }

  const shortcut = SHORTCUTS[e.code] || SHORTCUTS[e.key];
  if (!shortcut) return;

  // Verificar contexto
  if (!shortcut.global && shortcut.context !== currentContext && shortcut.context !== getCurrentView()) {
    return;
  }

  e.preventDefault();
  shortcut.action();
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
function initKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeydown);

  // Actualizar contexto al cambiar vista
  window.addEventListener('vocabri:viewChange', (e) => {
    const viewMap = {
      'cardsView': 'map',
      'lessonView': 'lesson',
      'examView': 'exam',
      'reviewView': 'review',
    };
    setContext(viewMap[e.detail.view] || 'global');
  });

  console.log('[Keyboard] ✅ Atajos activados');
}

export {
  initKeyboardShortcuts,
  setContext,
  SHORTCUTS,
};

window.VocabriKeyboard = { initKeyboardShortcuts, setContext };
/**
 * Vocabri — Accesibilidad (v1.5+)
 * Modo daltónico, reduced-motion, ARIA, focus visible
 */

import { getState, updateState, persistState } from './state.js';
import { showToast } from './ui.js';

// ============================================================
// MODOS DALTÓNICOS (CSS variables)
// ============================================================
const COLORBLIND_MODES = {
  none: {
    label: 'Normal',
    description: 'Colores estándar',
  },
  protanopia: {
    label: 'Protanopía',
    description: 'Dificultad con rojos',
    // Ajustes: rojos → naranjas/amarillos, verdes → azulados
  },
  deuteranopia: {
    label: 'Deuteranopía',
    description: 'Dificultad con verdes',
    // Ajustes: verdes → amarillos, rojos → naranjas
  },
  tritanopia: {
    label: 'Tritanopía',
    description: 'Dificultad con azules',
    // Ajustes: azules → verdes, amarillos → rosas
  },
};

function applyColorblindMode(mode) {
  const root = document.documentElement;
  // Limpiar clases anteriores
  Object.keys(COLORBLIND_MODES).forEach(m => root.classList.remove(`cb-${m}`));
  if (mode && mode !== 'none') {
    root.classList.add(`cb-${mode}`);
  }
  updateState({ colorblindMode: mode });
  persistState();

  // Actualizar UI del selector si está abierto
  updateColorblindSelectorUI(mode);
}

function updateColorblindSelectorUI(mode) {
  document.querySelectorAll('.colorblindOption').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
    btn.setAttribute('aria-pressed', btn.dataset.mode === mode);
  });
}

// ============================================================
// REDUCED MOTION
// ============================================================
function applyReducedMotion(enabled) {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
  updateState({ reducedMotion: enabled });
  persistState();

  // Actualizar toggle en ajustes
  const toggle = document.getElementById('reducedMotionToggle');
  if (toggle) {
    toggle.textContent = enabled ? '🐌 Animaciones: Reducidas' : '✨ Animaciones: Completas';
    toggle.setAttribute('aria-pressed', enabled);
  }
}

function toggleReducedMotion() {
  const state = getState();
  applyReducedMotion(!state.reducedMotion);
  showToast(state.reducedMotion ? 'Animaciones completas activadas' : 'Modo movimiento reducido activado', '🐌', 2000);
}

// ============================================================
// DETECCIÓN AUTOMÁTICA (prefers-reduced-motion)
// ============================================================
function initReducedMotionDetection() {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleChange = (e) => {
    // Solo aplicar automáticamente si el usuario no ha elegido manualmente
    const hasUserChoice = localStorage.getItem('vocabri_reducedMotion_userChoice');
    if (!hasUserChoice) {
      applyReducedMotion(e.matches);
    }
  };
  mediaQuery.addEventListener?.('change', handleChange);
  // Aplicar inicial si no hay elección de usuario
  const hasUserChoice = localStorage.getItem('vocabri_reducedMotion_userChoice');
  if (!hasUserChoice) {
    applyReducedMotion(mediaQuery.matches);
  }
}

// ============================================================
// FOCUS VISIBLE (mejora para navegación teclado)
// ============================================================
function initFocusVisible() {
  // Polyfill :focus-visible para navegadores antiguos
  if (!('focusVisible' in document.documentElement.style)) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('using-keyboard');
      }
    });
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    });
  }
}

// ============================================================
// ARIA LIVE REGIONS (para anuncios de screen readers)
// ============================================================
function announce(message, priority = 'polite') {
  let region = document.getElementById('a11y-announcer');
  if (!region) {
    region = document.createElement('div');
    region.id = 'a11y-announcer';
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;';
    document.body.appendChild(region);
  }
  region.setAttribute('aria-live', priority);
  region.textContent = '';
  // Forzar relectura
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

// ============================================================
// SKIP LINKS (acceso rápido a contenido principal)
// ============================================================
function initSkipLinks() {
  // Se añade al HTML dinámicamente si no existe
  if (document.getElementById('skipLinks')) return;

  const skipLinks = document.createElement('div');
  skipLinks.id = 'skipLinks';
  skipLinks.style.cssText = 'position:absolute; top:-100%; left:0; z-index:9999;';
  skipLinks.innerHTML = `
    <a href="#mainContent" style="position:absolute; top:auto; left:-999px; padding:12px 24px; background:var(--primary); color:white; text-decoration:none; border-radius:0 0 8px 0; z-index:9999; font-weight:600;"
       onfocus="this.style.top='0'; this.style.left='0';">Saltar al contenido principal</a>
    <a href="#bottomNav" style="position:absolute; top:auto; left:-999px; padding:12px 24px; background:var(--primary); color:white; text-decoration:none; border-radius:0 0 8px 0; z-index:9999; font-weight:600;"
       onfocus="this.style.top='0'; this.style.left='0';">Saltar a navegación</a>
  `;
  document.body.prepend(skipLinks);

  // Añadir id al contenido principal
  const mainContent = document.querySelector('.wrap') || document.querySelector('main') || document.body;
  if (!mainContent.id) mainContent.id = 'mainContent';
}

// ============================================================
// LANDMARKS Y ROLES ARIA
// ============================================================
function enhanceARIA() {
  // Header
  const header = document.querySelector('header');
  if (header && !header.hasAttribute('role')) header.setAttribute('role', 'banner');

  // Navegación principal
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav && !bottomNav.hasAttribute('role')) bottomNav.setAttribute('role', 'navigation');
  if (bottomNav && !bottomNav.hasAttribute('aria-label')) bottomNav.setAttribute('aria-label', 'Navegación principal');

  // Mapa isométrico
  const mapWrap = document.getElementById('pathWrap');
  if (mapWrap) {
    mapWrap.setAttribute('role', 'application');
    mapWrap.setAttribute('aria-label', 'Mapa de aprendizaje isométrico');
  }

  // Tarjetas de lección
  const card = document.getElementById('card');
  if (card) {
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Tarjeta de estudio');
  }

  // Botones de acción
  document.querySelectorAll('button:not([aria-label])').forEach(btn => {
    const text = btn.textContent.trim();
    if (text && text.length < 50) {
      btn.setAttribute('aria-label', text);
    }
  });
}

// ============================================================
// ESCALADO DE TEXTO (respeta preferencia de usuario)
// ============================================================
function initTextScaling() {
  // CSS usa rem, así que el escalado del navegador funciona automáticamente
  // Solo aseguramos que no hay px hardcoded en tamaños de fuente
  const style = document.createElement('style');
  style.textContent = `
    /* Asegurar que todo usa rem/em para escalado */
    html { font-size: 100%; } /* 16px base, usuario puede cambiar en navegador */
    @media (prefers-reduced-motion: reduce) {
      .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
function initAccessibility() {
  const state = getState();

  // Aplicar modo daltónico guardado
  applyColorblindMode(state.colorblindMode || 'none');

  // Aplicar reduced motion guardado
  applyReducedMotion(state.reducedMotion || false);

  // Inicializar detección automática
  initReducedMotionDetection();

  // Focus visible
  initFocusVisible();

  // Skip links
  initSkipLinks();

  // ARIA
  enhanceARIA();

  // Text scaling
  initTextScaling();

  // Exponer funciones globales
  window.VocabriA11y = {
    announce,
    applyColorblindMode,
    applyReducedMotion,
    toggleReducedMotion,
    COLORBLIND_MODES,
  };

  console.log('[Accessibility] ✅ Inicializado');
}

export {
  initAccessibility,
  applyColorblindMode,
  applyReducedMotion,
  toggleReducedMotion,
  announce,
  COLORBLIND_MODES,
  enhanceARIA,
};

window.VocabriAccessibility = { initAccessibility, applyColorblindMode, applyReducedMotion, announce };
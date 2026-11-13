// Atajos de teclado: ajuste (activar/desactivar), reglas comunes para todas las pantallas y la guía de atajos.
// El botón de Ajustes y la ventana de la guía se crean aquí, así que no hace falta tocar index.html.

export const SHORTCUTS_KEY = 'vocabri_shortcuts';   // '0' = desactivados; cualquier otro valor = activados

export function shortcutsEnabled(){
  try{ return localStorage.getItem(SHORTCUTS_KEY) !== '0'; }catch(e){ return true; }
}

export function setShortcutsEnabled(v){
  try{ localStorage.setItem(SHORTCUTS_KEY, v ? '1' : '0'); }catch(e){}
  updateShortcutsUi();
}

// Guía: se muestra tal cual en la ventana, así que añadir un atajo nuevo aquí lo documenta solo.
export const SHORTCUT_GROUPS = [
  { title: '📖 Aprender (lecciones del mapa)', rows: [
    [['Espacio', 'Enter'], 'Voltear la tarjeta'],
    [['1'], 'Calificar: Difícil (con la tarjeta volteada)'],
    [['2'], 'Calificar: Bien'],
    [['3'], 'Calificar: Fácil'],
    [['←'], 'Volver a la tarjeta anterior'],
    [['S'], 'Escuchar la frase en inglés']
  ]},
  { title: '🔁 Repasar', rows: [
    [['Espacio', 'Enter'], 'Mostrar la respuesta (o volver a ocultarla)'],
    [['1'], 'Calificar: Otra vez'],
    [['2'], 'Calificar: Difícil'],
    [['3'], 'Calificar: Bien'],
    [['4'], 'Calificar: Fácil'],
    [['U'], 'Deshacer la última calificación']
  ]},
  { title: '📝 Examen', rows: [
    [['1', '2', '3', '4'], 'Elegir la opción de respuesta'],
    [['Enter', 'Espacio'], 'Pasar a la siguiente pregunta']
  ]},
  { title: '✍️ Escribir (examen y Escucha y escribe)', rows: [
    [['Enter'], 'Comprobar la respuesta y, después, continuar']
  ]},
  { title: '🎭 Escenas', rows: [
    [['1', '2', '3'], 'Elegir una de las frases (modo «Elegir»)'],
    [['Enter'], 'Comprobar lo que escribiste (modo «Escribirla»)']
  ]},
  { title: '🧭 En cualquier pantalla', rows: [
    [['Esc'], 'Cerrar el menú o la ventana abierta'],
    [['Tab'], 'Moverte entre botones; Enter o Espacio los activa']
  ]}
];

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

// ¿Hay una ventana o menú abierto que debería recibir el teclado en lugar de la pantalla de fondo?
export function overlayOpen(){
  const ov = [...document.querySelectorAll('.gModalOverlay')].some(o => getComputedStyle(o).display !== 'none');
  if(ov) return true;
  return [...document.querySelectorAll('.settingsPanel')].some(p => !p.hidden);
}

// Condición común: false = ignorar esta tecla (atajos desactivados, con modificadores, escribiendo, repetida o con una ventana abierta).
export function shortcutAllowed(e){
  if(!shortcutsEnabled()) return false;
  if(e.defaultPrevented || e.repeat) return false;
  if(e.ctrlKey || e.metaKey || e.altKey) return false;
  const t = e.target;
  if(t && (TYPING.has(t.tagName) || t.isContentEditable)) return false;
  return !overlayOpen();
}

// Espacio/Enter: si el foco está en un botón DENTRO de la pantalla, dejamos que ese botón haga su clic nativo;
// si el foco quedó en otro lado (p. ej. en la barra inferior tras cambiar de pestaña), el atajo sí actúa.
export function activationKeyFree(e, viewEl){
  if(e.key !== ' ' && e.key !== 'Enter') return false;
  const t = e.target;
  const interactive = t && t.closest && t.closest('button, a[href], summary, [role="button"], [role="switch"]');
  return !(interactive && viewEl && viewEl.contains(interactive));
}

export function isViewShown(id){
  const v = document.getElementById(id);
  return !!v && v.style.display !== 'none' && getComputedStyle(v).display !== 'none';
}

// ---------- Interfaz ----------
let guideOpener = null;

export function updateShortcutsUi(){
  const on = shortcutsEnabled();
  const b = document.getElementById('shortcutsBtn');
  if(b) b.textContent = '⌨️ Atajos de teclado: ' + (on ? 'Activados' : 'Desactivados');
  const sw = document.getElementById('shortcutsSwitch');
  if(sw){
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    const st = sw.querySelector('.scSwitchState');
    if(st) st.textContent = on ? 'Activados' : 'Desactivados';
  }
  const body = document.getElementById('shortcutsGuideBody');
  if(body) body.classList.toggle('scOff', !on);
}

function keyCaps(keys){
  return keys.map(k => '<kbd class="scKey">' + k + '</kbd>').join('<span class="scOr">o</span>');
}

function guideHtml(){
  return SHORTCUT_GROUPS.map(g =>
    '<section class="scGroup"><h4>' + g.title + '</h4><ul>' +
    g.rows.map(r => '<li><span class="scKeys">' + keyCaps(r[0]) + '</span><span class="scWhat">' + r[1] + '</span></li>').join('') +
    '</ul></section>').join('');
}

export function openShortcutsGuide(opener){
  const ov = document.getElementById('shortcutsOverlay');
  if(!ov) return;
  guideOpener = opener || document.getElementById('shortcutsBtn');
  const panel = document.getElementById('settingsPanel');
  if(panel && !panel.hidden){
    panel.hidden = true;
    const sb = document.getElementById('settingsBtn'); if(sb) sb.setAttribute('aria-expanded', 'false');
  }
  updateShortcutsUi();
  ov.style.display = 'flex';
  const c = document.getElementById('shortcutsClose');
  if(c) c.focus({ preventScroll: true });
}

export function closeShortcutsGuide(){
  const ov = document.getElementById('shortcutsOverlay');
  if(!ov || ov.style.display === 'none') return;
  ov.style.display = 'none';
  if(guideOpener && guideOpener.focus){ try{ guideOpener.focus({ preventScroll: true }); }catch(e){} }
}

function wire(){
  if(document.getElementById('shortcutsOverlay')) return;

  // Ventana de la guía
  const ov = document.createElement('div');
  ov.className = 'gModalOverlay scOverlay';
  ov.id = 'shortcutsOverlay';
  ov.style.display = 'none';
  ov.innerHTML =
    '<div class="gModal gModalWide scModal" role="dialog" aria-modal="true" aria-labelledby="shortcutsTitle">' +
      '<div class="modalHeader scHead">' +
        '<h3 id="shortcutsTitle"><span class="scHeadIcon" aria-hidden="true">⌨️</span>Atajos de teclado</h3>' +
        '<button class="modalCloseBtn hover-scale focus-glow" id="shortcutsClose" type="button" aria-label="Cerrar">✕</button>' +
      '</div>' +
      '<button class="scSwitch" id="shortcutsSwitch" type="button" role="switch" aria-checked="true">' +
        '<span class="scSwitchText"><strong>Usar atajos de teclado</strong><small>Solo funcionan con teclado físico. Escribir en un cuadro de texto nunca los activa.</small></span>' +
        '<span class="scSwitchState">Activados</span><span class="scTrack" aria-hidden="true"><span class="scKnob"></span></span>' +
      '</button>' +
      '<div class="scBody" id="shortcutsGuideBody">' + guideHtml() + '</div>' +
      '<button class="nav hover-scale focus-glow scDone" id="shortcutsDone" type="button">Listo</button>' +
    '</div>';
  document.body.appendChild(ov);

  ov.addEventListener('click', e => { if(e.target === ov) closeShortcutsGuide(); });
  document.getElementById('shortcutsClose').onclick = closeShortcutsGuide;
  document.getElementById('shortcutsDone').onclick = closeShortcutsGuide;
  document.getElementById('shortcutsSwitch').onclick = () => setShortcutsEnabled(!shortcutsEnabled());
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeShortcutsGuide(); });

  // Botón en Ajustes → Preferencias (justo debajo de «Efectos del mapa»)
  const anchor = document.getElementById('fxToggleBtn') || document.getElementById('sfxToggleBtn');
  if(anchor && !document.getElementById('shortcutsBtn')){
    const b = document.createElement('button');
    b.className = 'nav setBtn hover-scale focus-glow';
    b.id = 'shortcutsBtn'; b.type = 'button'; b.style.marginTop = '8px';
    b.setAttribute('aria-haspopup', 'dialog');
    anchor.insertAdjacentElement('afterend', b);
    b.onclick = () => openShortcutsGuide(b);
  }
  updateShortcutsUi();
}

export const __inits = [[9100, wire]];

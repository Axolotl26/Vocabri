// Vocabri — «Modos de práctica» en Repaso: todos los modos aparte del mapa en una sola fila.
// Escucha y escribe · Escenas · Rutas por objetivo · Puntos débiles. Los botones se crean aquí, sin tocar index.html.
import { startDictation } from './dictation.js';
import { loadRoute, openRoutes } from './routes.js';
import { openScenes } from './scenes.js';
import { ABC_ICON, openAlphabet } from './alphabet.js';
import { startWeakTraining, weakCount } from './weakSpots.js';
import { _ni, _niW } from './ui.js';

// Iconos cartoon (mismo sistema que la barra inferior: relleno, contorno grueso, borde con volumen y brillo)
const IC = {
  dict: _ni('#2DD4BF', '#0B6B60',
    '<path class="niLn" d="M5.5 16v-3.2a8.5 8.5 0 0 1 17 0V16"/><rect x="3" y="14.5" width="6.4" height="9.5" rx="2.6"/><rect x="18.6" y="14.5" width="6.4" height="9.5" rx="2.6"/>',
    '<path d="M5.4 17.2v3.6" ' + _niW + ' stroke-opacity=".6" stroke-width="1.8"/><path d="M7 7.6a8 8 0 0 1 4-2" ' + _niW + ' stroke-opacity=".6" stroke-width="1.8"/>'),
  scenes: _ni('#F472B6', '#9D2461',
    '<path d="M4.6 5.2h18.8v9c0 5.6-4.2 9.6-9.4 9.6s-9.4-4-9.4-9.6z"/>',
    '<ellipse cx="9.8" cy="12" rx="2.2" ry="2.6" fill="#fff"/><ellipse cx="18.2" cy="12" rx="2.2" ry="2.6" fill="#fff"/>' +
    '<circle cx="10.2" cy="12.6" r="1" fill="#9D2461"/><circle cx="17.8" cy="12.6" r="1" fill="#9D2461"/>' +
    '<path d="M9.6 18.2c1.2 1.9 7.6 1.9 8.8 0" fill="none" stroke="#9D2461" stroke-width="2" stroke-linecap="round"/>'),
  routes: _ni('#38BDF8', '#0B6190',
    '<path d="M14 2.6c-5 0-8.6 3.7-8.6 8.4 0 6.2 8.6 14.4 8.6 14.4s8.6-8.2 8.6-14.4c0-4.7-3.6-8.4-8.6-8.4z"/>',
    '<circle cx="14" cy="11" r="3.4" fill="#fff" stroke="#0B6190" stroke-width="1.6"/><path d="M8.4 7a6.6 6.6 0 0 1 3.4-2.4" ' + _niW + ' stroke-opacity=".6" stroke-width="1.8"/>'),
  abc: ABC_ICON,
  weak: _ni('#F59E0B', '#8A4B05',
    '<rect x="1.8" y="9" width="24.4" height="10" rx="5" transform="rotate(-38 14 14)"/>',
    '<g transform="rotate(-38 14 14)"><rect x="9.6" y="9" width="8.8" height="10" fill="#FDE68A" stroke="#8A4B05" stroke-width="1.6"/>' +
    '<circle cx="12" cy="12.2" r=".9" fill="#8A4B05"/><circle cx="16" cy="12.2" r=".9" fill="#8A4B05"/><circle cx="12" cy="15.8" r=".9" fill="#8A4B05"/><circle cx="16" cy="15.8" r=".9" fill="#8A4B05"/>' +
    '<path d="M4.2 11.4h2.6" ' + _niW + ' stroke-opacity=".6" stroke-width="1.6"/></g>')
};

const MODES = [
  { id: 'dict',   icon: IC.dict,   label: 'Escucha y escribe', desc: 'Oye una frase y escríbela', tone: 'teal' },
  { id: 'abc',    icon: IC.abc,    label: 'Abecedario',        desc: 'Las 26 letras con su sonido', tone: 'violet' },
  { id: 'scenes', icon: IC.scenes, label: 'Escenas',           desc: 'Conversaciones por turnos', tone: 'pink' },
  { id: 'routes', icon: IC.routes, label: 'Rutas',             desc: 'Un camino corto por objetivo', tone: 'sky' },
  { id: 'weak',   icon: IC.weak,   label: 'Puntos débiles',    desc: 'Las frases que más te cuestan', tone: 'amber' }
];
const idOf = m => 'rvMode' + m.id.charAt(0).toUpperCase() + m.id.slice(1);

export function updateModes(){
  const r = document.getElementById('rvModeRoutes');
  if(r){
    const has = !!loadRoute();
    r.querySelector('.rvModeLbl').textContent = has ? 'Mi ruta' : 'Rutas';
    r.querySelector('.msDesc').textContent = has ? 'Sigue con tu ruta' : 'Un camino corto por objetivo';
  }
  const w = document.getElementById('rvModeWeak'), n = weakCount();
  if(w){
    w.querySelector('.rvModeLbl').textContent = 'Puntos débiles' + (n ? ' (' + n + ')' : '');
    w.classList.toggle('isEmpty', !n);
    w.setAttribute('aria-label', n ? 'Puntos débiles: ' + n + (n === 1 ? ' frase' : ' frases') : 'Puntos débiles: aún no tienes');
  }
  const badge = document.getElementById('rvModesBadge');
  if(badge){ badge.textContent = n > 99 ? '99+' : n; badge.style.display = n ? '' : 'none'; }
}

function sheet(){ return document.getElementById('modesSheet'); }
function openSheet(from){
  const o = sheet(); if(!o) return;
  o.style.display = 'flex';
  const f = o.querySelector('.msRow'); if(f) f.focus({ preventScroll: true });
  o._from = from || null;
}
function closeSheet(skipFocus){
  const o = sheet(); if(!o || o.style.display === 'none') return;
  o.style.display = 'none';
  if(!skipFocus && o._from && o._from.focus){ try{ o._from.focus({ preventScroll: true }); }catch(e){} }
}

// Modo enfoque: al revelar la respuesta de una tarjeta se ocultan los modos (y se baja hasta los botones de calificar)
// y siguen ocultos el resto de la sesión. En la pantalla vacía y en el resumen vuelven a aparecer.
let focusMode = false;
function sessionActive(){
  const c = document.getElementById('reviewCard');
  return !!c && getComputedStyle(c).display !== 'none' && c.getClientRects().length > 0;
}
function setFocus(v){
  focusMode = v;
  const box = document.querySelector('.rvModesWrap'); if(box) box.classList.toggle('isFocus', v);
}
function syncFocus(){ if(!sessionActive()) setFocus(false); else setFocus(focusMode); }
function onReveal(){
  setFocus(true);
  const rb = document.getElementById('reviewRateBlock'); if(!rb) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => requestAnimationFrame(() => { try{ rb.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }catch(e){} }));
}

function note(text){
  const n = document.getElementById('rvModesNote'); if(!n) return;
  n.textContent = text || ''; n.style.display = text ? '' : 'none';
}

function wire(){
  if(document.getElementById('rvModesBtn')) return;
  const head = document.querySelector('#reviewView .reviewHeader');
  if(!head) return;
  const box = document.createElement('div');
  box.className = 'rvModesWrap';
  box.innerHTML = '<button type="button" class="rvModesBtn hover-scale focus-glow" id="rvModesBtn" aria-haspopup="dialog">' +
      '<span class="rvStrip" aria-hidden="true">' + MODES.map(m => '<span class="rvStripIc">' + m.icon + '</span>').join('') + '</span>' +
      '<span class="rvModesTx"><strong>Modos de práctica</strong><small>' + MODES.length + ' formas de practicar, además del mapa</small></span>' +
      '<span class="rvModesBadge" id="rvModesBadge" style="display:none;" title="Puntos débiles pendientes"></span>' +
      '<span class="rvModesGo" aria-hidden="true">›</span></button>' +
    '<p class="rvModesNote" id="rvModesNote" style="display:none;" aria-live="polite"></p>';
  head.insertAdjacentElement('afterend', box);
  // `.rvSub` (subtítulo) se inserta después de la cabecera: lo dejamos arriba de los modos
  const sub = document.getElementById('reviewSub');
  if(sub) head.insertAdjacentElement('afterend', sub);

  const o = document.createElement('div');
  o.className = 'gModalOverlay msOverlay'; o.id = 'modesSheet'; o.style.display = 'none';
  o.innerHTML = '<div class="gModal msModal" role="dialog" aria-modal="true" aria-labelledby="msTitle">' +
    '<div class="modalHeader"><h3 id="msTitle">Modos de práctica</h3><button class="modalCloseBtn hover-scale focus-glow" id="msClose" type="button" aria-label="Cerrar">✕</button></div>' +
    '<p class="msIntro">Elige cómo quieres practicar hoy.</p>' +
    '<div class="msList" id="rvModes">' +
    MODES.map(m => '<button type="button" class="msRow rvMode ' + m.tone + ' hover-scale focus-glow" id="' + idOf(m) + '" data-mode="' + m.id + '">' +
      '<span class="rvModeIc" aria-hidden="true">' + m.icon + '</span>' +
      '<span class="msTx"><strong class="rvModeLbl">' + m.label + '</strong><small class="msDesc">' + m.desc + '</small></span>' +
      '<span class="rvModesGo" aria-hidden="true">›</span></button>').join('') +
    '</div></div>';
  document.body.appendChild(o);

  box.querySelector('#rvModesBtn').addEventListener('click', e => { note(''); openSheet(e.currentTarget); });
  o.addEventListener('click', e => {
    if(e.target === o || e.target.closest('#msClose')){ closeSheet(); return; }
    const b = e.target.closest('.msRow'); if(!b) return;
    closeSheet(true);
    const m = b.dataset.mode;
    if(m === 'dict') startDictation();
    else if(m === 'abc') openAlphabet();
    else if(m === 'scenes') openScenes(box.querySelector('#rvModesBtn'));
    else if(m === 'routes') openRoutes();
    else if(m === 'weak'){
      if(!startWeakTraining()) note('Aún no tienes puntos débiles. Aparecen cuando fallas una frase varias veces y todavía no se te asienta.');
    }
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && sheet() && sheet().style.display !== 'none') closeSheet(); });
  document.addEventListener('vocabri-review-render', () => { updateModes(); setTimeout(syncFocus, 0); });
  document.addEventListener('vocabri-review-reveal', onReveal);
  document.addEventListener('vocabri-route-changed', updateModes);
  updateModes();
}

export const __inits = [[9090, wire]];

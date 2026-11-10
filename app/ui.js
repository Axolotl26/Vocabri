// Vocabri — módulo "ui" (generado a partir de app.js)
import { getValidCategoryIds } from '../categoriesRegistry.js';
import { celebrate, pickLine, setMascotBubble } from './mascot.js';
import { S } from './core/shared.js';
import { allCats, itemsFor, readStored, setUnlockedStage, todayKeyStr } from './core/dataRegistry.js';
import { dismissTopModal, enqueueModal, renderCardsSubView } from './map.js';
import { populateCardModalCats, renderMyCardsHome } from './myCards.js';
import { renderProfile } from './profile.js';
import { renderProgress, renderTable } from './progress.js';
import { renderReviewView, updateReviewBadge } from './review.js';
import { APP_VERSION, applyTheme, scheduleReminderStatePublish, updateCatSelector } from './settings.js';
import { playSfx } from './speech.js';
import { addXpToday, getDailyGoalTarget, getXpToday, getXpTotal, goalAlreadyCelebratedToday, levelFromXp, markGoalCelebrated, setDailyGoalTarget, setXpTotal, xpForLevel, xpIntoLevel } from './state.js';



export function updateGameBar(){
  const xp = getXpTotal();
  const lvl = levelFromXp(xp);
  const xpInLevel = xpIntoLevel(xp);
  const xpNeeded = xpForLevel(lvl);
  document.getElementById('gLevelNum').textContent = 'Nivel ' + lvl;
  document.getElementById('gXpText').textContent = xpInLevel + '/' + xpNeeded + ' XP';
  document.getElementById('gLevelFill').style.width = Math.round((xpInLevel/xpNeeded)*100) + '%';
  const todayXp = getXpToday();
  const target = getDailyGoalTarget();
  const pctNum = Math.min(100, Math.round((todayXp/target)*100));
  document.getElementById('gGoalNum').textContent = Math.min(todayXp, 999);
  document.getElementById('gGoalMax').textContent = target;
  document.getElementById('gGoalPct').textContent = pctNum + '%';
  const r = 16, circumference = 2*Math.PI*r;
  const pct = Math.min(1, todayXp/target);
  const ring = document.getElementById('gGoalRingFg');
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference*(1-pct);
  document.getElementById('gGoal').classList.toggle('goalDone', todayXp >= target);
  refreshGoalButtons();
  const lrFg = document.getElementById('lrFg');
  if(lrFg){
    const rr = 16, circ = 2*Math.PI*rr;
    lrFg.style.strokeDasharray = circ;
    lrFg.style.strokeDashoffset = circ*(1-(xpInLevel/xpNeeded));
    document.getElementById('lrText').textContent = String(lvl);
  }
}


export function showXpFloat(amount){
  const cardEl = document.getElementById('card');
  const rect = cardEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'xpFloat';
  el.textContent = '+' + amount + ' XP';
  el.style.left = (rect.left + rect.width/2) + 'px';
  el.style.top = (rect.top + 24) + 'px';
  document.body.appendChild(el);
  requestAnimationFrame(()=> el.classList.add('xpFloat-go'));
  setTimeout(()=> el.remove(), 1050);
}


export function showGameModal(emoji, title, msg){
  // 'mascot:happy' shows the axolotl sticker instead of an emoji
  if(typeof emoji === 'string' && emoji.indexOf('mascot:') === 0) setMascotIn(document.getElementById('gModalEmoji'), emoji.slice(7));
  else document.getElementById('gModalEmoji').textContent = emoji;
  document.getElementById('gModalTitle').textContent = title;
  document.getElementById('gModalMsg').textContent = msg;
  document.getElementById('gModalOverlay').style.display = 'flex';
}


export function showDailyGoalToast(){
  celebrate({ count: 24 });
  const t = document.getElementById('goalToast');
  t.style.display = 'block';
  requestAnimationFrame(()=> t.classList.add('show'));
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=>{ t.style.display = 'none'; }, 400);
  }, 3500);
}



/**
 * Show a toast notification with optional icon
 * @param {string} message - The message to display
 * @param {string} [icon] - Optional emoji or mascot:state icon
 * @param {number} [duration=3000] - Duration in ms
 */
export function showToast(message, icon, duration = 3000){
  const toast = document.createElement('div');
  toast.className = 'toast toast-enter';
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 12px 20px;
    box-shadow: var(--elev2);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1000;
    font-family: var(--font-ui);
    font-size: 0.9rem;
    color: var(--ink);
    max-width: 90vw;
  `;

  if (icon) {
    const iconEl = document.createElement('span');
    if (icon.startsWith('mascot:')) {
      setMascotIn(iconEl, icon.slice(7));
      iconEl.style.width = '24px';
      iconEl.style.height = '24px';
      iconEl.style.flexShrink = '0';
      // Arreglar el img interno para que no se estire
      const img = iconEl.querySelector('img');
      if (img) {
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '0';
      }
    } else {
      iconEl.textContent = icon;
      iconEl.style.fontSize = '1.2rem';
    }
    toast.appendChild(iconEl);
  }

  const msgEl = document.createElement('span');
  msgEl.textContent = message;
  toast.appendChild(msgEl);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}



/**
 * Apply button press animations to all buttons in the app
 */
export function applyButtonAnimations() {
  document.querySelectorAll('button:not(.no-anim)').forEach(btn => {
    btn.addEventListener('mousedown', () => btn.classList.add('btn-press'));
    btn.addEventListener('mouseup', () => btn.classList.remove('btn-press'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('btn-press'));
    btn.addEventListener('touchstart', () => btn.classList.add('btn-tap'), {passive: true});
    btn.addEventListener('touchend', () => btn.classList.remove('btn-tap'));
    btn.addEventListener('touchcancel', () => btn.classList.remove('btn-tap'));
  });
}



/**
 * Apply staggered entrance animation to a container's children
 * @param {HTMLElement} container - Container element
 * @param {string} [selector='*'] - Selector for children to animate
 */
export function applyStaggerAnimation(container, selector = '*') {
  if (!container) return;
  container.classList.add('stagger-enter');
  // Re-apply to trigger animation on content changes
  requestAnimationFrame(() => {
    container.classList.remove('stagger-enter');
    requestAnimationFrame(() => container.classList.add('stagger-enter'));
  });
}



// Call this with the XP just earned (e.g. from your "mark card as mastered" handler).
// Handles today's XP bookkeeping, the daily reset, and the once-per-day completion toast.
export function updateDailyGoalProgress(xpGained){
  const target = getDailyGoalTarget();
  const wasComplete = getXpToday() >= target;
  addXpToday(xpGained);
  updateGameBar();
  const nowComplete = getXpToday() >= target;
  if(nowComplete && !wasComplete && !goalAlreadyCelebratedToday()){
    markGoalCelebrated();
    showDailyGoalToast();
  }
  scheduleReminderStatePublish();
}


export function refreshGoalButtons(){
  const cur = getDailyGoalTarget();
  document.querySelectorAll('.goalOpt').forEach(b=> b.classList.toggle('sel', parseInt(b.dataset.goal,10)===cur));
}


export function awardXp(amount){
  if(!amount) return;
  const beforeLevel = levelFromXp(getXpTotal());
  setXpTotal(getXpTotal() + amount);
  showXpFloat(amount);
  updateDailyGoalProgress(amount);
  const afterLevel = levelFromXp(getXpTotal());
  if(afterLevel > beforeLevel){
    setTimeout(()=> enqueueModal(()=>{
      playSfx('levelup');
      celebrate();
      showGameModal('mascot:happy', '¡Subiste de nivel!', 'Ahora eres nivel ' + afterLevel + '. ¡Sigue así!');
    }), 450);
  }
}


export function studyMinutesToday(){
  try{ const raw = localStorage.getItem('ci_time_'+todayKeyStr()); return raw ? Math.round(parseInt(raw,10)/60) : 0; }catch(e){ return 0; }
}



export function collectLocalProgress(){
  const out = {};
  itemsFor("Todas").forEach(it=>{
    let raw;
    try{ raw = localStorage.getItem("ci_master_"+it[3]); }catch(e){ raw = null; }
    if(raw) out[it[3]] = readStored(it[3]);
  });
  return out;
}



// Mapeo categoría → sticker representativo (carpeta: ajolotes_emociones / ajolotes_de_colores)
export const CAT_STICKERS = {
  'Casual': { file: 'feliz_nadando_saludando.png', folder: 'ajolotes_emociones' },
  'Universidad': { file: 'lector_con_gafas_y_estrellas.png', folder: 'ajolotes_emociones' },
  'Programación': { file: 'detective_lupa_sonriente.png', folder: 'ajolotes_emociones' },
  'Inmobiliaria': { file: 'brazos_abiertos_para_abrazo.png', folder: 'ajolotes_emociones' },
  'Espacio': { file: 'ajolote_azul_marino_con_estrella.png', folder: 'ajolotes_de_colores' }
};


export function iconFor(cat){
  const info = CAT_STICKERS[cat] || { file: 'ajolote_arcoiris_holografico.png', folder: 'ajolotes_de_colores' };
  return '<img class="catSticker" src="./assets/stickers/' + info.folder + '/' + info.file + '" alt="' + cat + '" width="28" height="28">';
}


export function selectCategory(cat){
  // Legacy function for DATA categories (used by custom categories, etc.)
  S.currentCat = cat;
  S.idx = 0; S.order = [];
  selectFocusCategory(cat);
  S.cardsSubView = 'map';
  renderCardsSubView();
}



export function buildBottomNav(){
  const el = document.getElementById('bottomNav');
  if(!el) return;
  el.innerHTML = '';
  MAIN_NAV_ITEMS.forEach(it=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'navItem' + (it.id===S.view ? ' active' : '');

    // Render sticker image instead of emoji
    const iconHtml = it.icon.startsWith('./')
      ? '<img class="navIcon navSticker" src="' + it.icon + '" alt="" width="28" height="28">'
      : '<span class="navIcon">' + it.icon + '</span>';   // SVG propio

    b.innerHTML = iconHtml + '<span>' + it.label + '</span>';
    if (it.id === 'review') {
      const badge = document.createElement('span');
      badge.className = 'navBadge';
      badge.id = 'reviewNavBadge';
      b.appendChild(badge);
    }
    b.onclick = ()=> switchView(it.id);
    el.appendChild(b);
  });
  // Update review badge after building
  updateReviewBadge();
}


// ============================================================
// NUEVO SISTEMA: 5 CATEGORÍAS MAESTRAS
// ============================================================

// Obtiene las categorías maestras válidas desde localStorage o usa todas
export function getMasterCategories() {
  try {
    const stored = localStorage.getItem('ci_master_categories');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  // Fallback: todas las 5 categorías
  return getValidCategoryIds();
}



// Guarda las categorías maestras en localStorage
export function setMasterCategories(cats) {
  localStorage.setItem('ci_master_categories', JSON.stringify(cats));
}



// Selecciona una categoría maestra directamente (sin mapeo intermedio)
export function selectFocusCategory(masterCatId) {
  // Validar que sea una categoría maestra válida
  if (!window.VocabriCategories || !window.VocabriCategories.isValidCategory(masterCatId)) {
    console.warn('[selectFocusCategory] Categoría no válida:', masterCatId);
    masterCatId = 'general';
  }

  S.currentCat = masterCatId;
  S.idx = 0; S.order = [];

  // Mostrar el label de la categoría maestra en el botón del panel de ajustes
  let label = masterCatId;
  if (window.VocabriCategories) {
    label = window.VocabriCategories.getCategoryShortLabel(masterCatId);
  }
  const selectorLabel = document.getElementById('catSelectorLabel');
  if (selectorLabel) selectorLabel.textContent = label;

  // Actualizar selección visual en el panel de ajustes
  updateCatSelector();

  // Cerrar el selector de categorías
  const catSelector = document.getElementById('catSelector');
  if (catSelector) catSelector.hidden = true;

  // Persistir la categoría elegida
  localStorage.setItem('ci_current_master_category', masterCatId);

  // Establecer el nodo inicial si es la primera vez (ci_start_node se aplica una sola vez)
  const startNode = parseInt(localStorage.getItem('ci_start_node') || '0', 10);
  if (startNode > 0) {
    setUnlockedStage(S.currentCat, startNode);
    localStorage.removeItem('ci_start_node'); // Solo aplicar una vez
  }

  S.cardsSubView = 'map';
  renderCardsSubView();
}


// ===== Scroll: botón "subir" y reinicio al abrir/cambiar contenido =====
export function addScrollTopBtn(scroller, host){
  if(!scroller || scroller.querySelector(':scope > .scrollTopBtn')) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'scrollTopBtn'; b.setAttribute('aria-label', 'Volver arriba'); b.title = 'Volver arriba'; b.textContent = '↑';
  (host || scroller).appendChild(b);
  const upd = () => b.classList.toggle('show', scroller.scrollTop > 220);
  scroller.addEventListener('scroll', upd, {passive:true});
  b.onclick = () => { try{ scroller.scrollTo({top:0, behavior:'smooth'}); }catch(e){ scroller.scrollTop = 0; } };
  upd();
}


/* Escritorio: la rueda del ratón desplaza el panel activo aunque el puntero esté fuera de la columna central */
// Desplazamiento suave (inercia): acumula el destino y se acerca a él en cada fotograma
export const _smoothScroll = new WeakMap();


export function smoothWheelScroll(el, dy){
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const max = Math.max(0, el.scrollHeight - el.clientHeight);
  let st = _smoothScroll.get(el);
  if(!st){ st = {target: el.scrollTop, raf: 0}; _smoothScroll.set(el, st); }
  if(!st.raf) st.target = el.scrollTop;                 // sin animación en curso: parte de la posición real
  st.target = Math.max(0, Math.min(max, st.target + Math.max(-240, Math.min(240, dy))));
  if(reduce){ el.scrollTop = st.target; return; }
  if(st.raf) return;
  const step = ()=>{
    const diff = st.target - el.scrollTop;
    if(Math.abs(diff) < 1){ el.scrollTop = st.target; st.raf = 0; return; }
    let d = diff * 0.16; if(Math.abs(d) < 1) d = diff > 0 ? 1 : -1;   // scrollTop se redondea a px enteros
    el.scrollTop += d;
    st.raf = requestAnimationFrame(step);
  };
  st.raf = requestAnimationFrame(step);
}



export function scrollTopNow(id){ try{ const el = typeof id === 'string' ? document.getElementById(id) : id; if(el) el.scrollTo(0,0); }catch(e){} }


// ---- Avisos flotantes reutilizables (modo ligero, estrella en GitHub) ----



export function vbPrompt(o){
  if(S._vbPromptEl) return false;                                  // solo uno a la vez
  const el = document.createElement('div');
  el.className = 'vbPrompt'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<div class="vbpIcon" aria-hidden="true"></div><div class="vbpBody"><div class="vbpTitle"></div><div class="vbpText"></div><div class="vbpBtns"></div></div>';
  el.querySelector('.vbpIcon').textContent = o.icon || '';
  el.querySelector('.vbpTitle').textContent = o.title || '';
  el.querySelector('.vbpText').textContent = o.text || '';
  let timer = 0;
  const close = () => {
    clearTimeout(timer);
    el.classList.remove('on');
    setTimeout(() => { el.remove(); if(S._vbPromptEl === el) S._vbPromptEl = null; }, 260);
  };
  (o.buttons || []).forEach(bd => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vbpBtn' + (bd.primary ? ' primary' : '') + (bd.quiet ? ' quiet' : '');
    b.textContent = bd.label;
    b.onclick = () => { close(); if(bd.onClick) bd.onClick(); };
    el.querySelector('.vbpBtns').appendChild(b);
  });
  document.body.appendChild(el);
  S._vbPromptEl = el;
  requestAnimationFrame(() => el.classList.add('on'));
  if(o.autoMs) timer = setTimeout(close, o.autoMs);
  return true;
}



// ---- Estrella en GitHub ----
export const REPO_URL = 'https://github.com/Axolotl26/Vocabri';


export const STAR_KEY = 'vocabri_star';

                                 // { s: 'done' | 'later' | 'never', t: ms, n: veces que se mostró }
export function starState(){ try{ return JSON.parse(localStorage.getItem(STAR_KEY) || 'null') || {}; }catch(e){ return {}; } }


export function starSave(o){ try{ localStorage.setItem(STAR_KEY, JSON.stringify(o)); }catch(e){} }


export function openRepo(){
  window.open(REPO_URL, '_blank', 'noopener,noreferrer');
  starSave({ s: 'done', t: Date.now(), n: starState().n || 0 }); // ya fue al repositorio: no se vuelve a pedir
}


// Aviso amable: una sola vez por sesión, tras haber avanzado (3 secciones o más), máx. 2 veces y con 14 días de margen.
export function maybeAskStar(){
  const st = starState();
  if(st.s === 'done' || st.s === 'never' || (st.n || 0) >= 2) return;
  if(st.s === 'later' && Date.now() - (st.t || 0) < 14 * 864e5) return;
  let passed = 0;
  try{ passed = Object.values(S.unlockedStage).reduce((a, b) => a + (+b || 0), 0); }catch(e){}
  if(passed < 3) return;
  try{ if(sessionStorage.getItem('vb_star_asked')) return; }catch(e){}
  const shown = vbPrompt({
    icon: '⭐', title: '¿Te está gustando Vocabri?',
    text: 'Es un proyecto de código abierto hecho por un estudiante. Si te sirve, una estrella en GitHub ayuda muchísimo a que más gente lo encuentre.',
    buttons: [
      { label: '⭐ Dar una estrella', primary: true, onClick: openRepo },
      { label: 'Ahora no', onClick: () => starSave({ s: 'later', t: Date.now(), n: (st.n || 0) + 1 }) },
      { label: 'No mostrar más', quiet: true, onClick: () => starSave({ s: 'never', t: Date.now(), n: (st.n || 0) + 1 }) }
    ]
  });
  if(shown){ try{ sessionStorage.setItem('vb_star_asked', '1'); }catch(e){} }
}



// Iconos de la barra inferior (estilo cartoon, como las fichas del mapa): relleno de color, contorno grueso,
// "borde" inferior más oscuro con volumen y brillo. Colores por pestaña (--c relleno, --e contorno/borde).
export const _ni = (c, e, shapes, extra) =>
  '<svg viewBox="0 0 28 28" width="30" height="30" aria-hidden="true" focusable="false" style="--c:' + c + ';--e:' + e + '">' +
  '<g class="niEd" transform="translate(0 2)">' + shapes + '</g><g class="niMn">' + shapes + '</g>' + (extra || '') + '</svg>';


export const _niW = 'fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"';


export const NAV_ICONS = {
  // brújula: aprender / explorar
  learn: _ni('#38BDF8', '#0B6190', '<circle cx="14" cy="13.5" r="10.5"/>',
    '<polygon points="18.8,8.7 15.6,15.1 9.2,18.3 12.4,11.9" fill="#fff" stroke="#0B6190" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle cx="14" cy="13.5" r="1.5" fill="#0B6190"/><path d="M6.8 9.2A8.6 8.6 0 0 1 11.6 5" ' + _niW + ' stroke-opacity=".6" stroke-width="2"/>'),
  // flechas circulares: repasar
  review: _ni('#4ADE80', '#15733B',
    '<path class="niLn" d="M5.2 13.6A8.8 8.8 0 0 1 20.6 7.6"/><path class="niLn" d="M22.8 14.4A8.8 8.8 0 0 1 7.4 20.4"/>' +
    '<polygon class="niFl" points="17,3.8 24.2,5.6 20.8,12.2"/><polygon class="niFl" points="11,24.2 3.8,22.4 7.2,15.8"/>',
    '<path d="M7.8 10.2A7 7 0 0 1 12.6 6.8" ' + _niW + ' stroke-opacity=".6" stroke-width="1.8"/>'),
  // cartas apiladas: mis tarjetas
  mycards: _ni('#F472B6', '#9B2166',
    '<rect x="3" y="7.5" width="14" height="17" rx="3.4" transform="rotate(-11 10 16)"/><rect x="9" y="3.5" width="15.5" height="20" rx="3.4"/>',
    '<path d="M12.6 10h8.2M12.6 14.2h8.2M12.6 18.4h4.6" ' + _niW + ' stroke-width="2.2"/>'),
  // globo de diálogo con A: traductor
  translator: _ni('#FBBF24', '#9A5A07',
    '<path d="M6 4h16a3.5 3.5 0 0 1 3.5 3.5v8.5A3.5 3.5 0 0 1 22 19.5h-7.2L8.6 25v-5.5H6A3.5 3.5 0 0 1 2.5 16V7.5A3.5 3.5 0 0 1 6 4z"/>',
    '<path d="M9.4 15.4 14 6.8l4.6 8.6M10.9 12.6h6.2" ' + _niW + ' stroke-width="2.4"/>'),
  // barras ascendentes: progreso
  progress: _ni('#A78BFA', '#53359F',
    '<rect x="3" y="14.5" width="6" height="9.5" rx="2.2"/><rect x="11" y="9" width="6" height="15" rx="2.2"/><rect x="19" y="3.5" width="6" height="20.5" rx="2.2"/>',
    '<path d="M5.2 17.8v3.4M13.2 12.2v6.4M21.2 6.8v9" ' + _niW + ' stroke-opacity=".55" stroke-width="1.7"/>'),
  // persona: perfil
  profile: _ni('#FB7185', '#9B2140',
    '<circle cx="14" cy="8.8" r="5.6"/><path d="M3.6 24.2c0-5.8 4.6-9 10.4-9s10.4 3.2 10.4 9z"/>',
    '<path d="M11 6.4a3.6 3.6 0 0 1 2.4-1.6M7 20.6a6.2 6.2 0 0 1 2.4-2.4" ' + _niW + ' stroke-opacity=".6" stroke-width="1.8"/>')
};


export const MAIN_NAV_ITEMS = [
  {id:'learn', icon: NAV_ICONS.learn, label:'Aprender'},
  {id:'review', icon: NAV_ICONS.review, label:'Repasar'},
  {id:'mycards', icon: NAV_ICONS.mycards, label:'Mis Tarjetas'},
  {id:'translator', icon: NAV_ICONS.translator, label:'Traductor'},
  {id:'progress', icon: NAV_ICONS.progress, label:'Progreso'},
  {id:'profile', icon: NAV_ICONS.profile, label:'Perfil'}
];



export function switchView(v){
  const panels = {learn:'cardsView', review:'reviewView', mycards:'myCardsView', translator:'translatorView', progress:'progressView', profile:'profileView'};
  const currentPanel = panels[S.view];
  const nextPanel = panels[v];

  // Core DOM switch — instant, sin animaciones, sin colas
  const doSwitch = () => {
    // 1) Visibilidad de paneles principales
    Object.keys(panels).forEach(k => {
      const el = document.getElementById(panels[k]);
      if (el) el.style.display = (k === v) ? '' : 'none';
    });
    // 2) Vistas auxiliares siempre ocultas al cambiar pestaña principal
    document.getElementById('lessonView').style.display = 'none';
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('examView').style.display = 'none';
    const dictV = document.getElementById('dictView'); if(dictV) dictV.style.display = 'none';
    try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){}
    // headerCatWrap removed - category selector moved to settings panel

    // 3) Estado interno + render
    S.view = v;
    buildBottomNav();
    if(v==='learn'){ S.cardsSubView='map'; renderCardsSubView(); }
    else if(v==='review'){ renderReviewView(); }
    else if(v==='mycards') renderMyCardsHome();
    else if(v==='progress') renderProgress();
    else if(v==='profile') renderProfile();

    // 4) Auto-scroll SÍNCRONO al panel NUEVO (cada panel es su propio scroll container)
    if (v !== 'learn') {
      const activePanel = document.getElementById(nextPanel);
      if (activePanel) activePanel.scrollTo(0, 0);
    } else {
      scrollToActiveMapNode();
    }
  };

  doSwitch();
}



// Función para hacer scroll al nodo activo del mapa
export function scrollToActiveMapNode(){
  const wrap = document.getElementById('pathWrap');
  if(!wrap) return;
  const target = wrap.querySelector('.pathNode.active') ||
                 wrap.querySelector('.pathNode.seccion-cooldown') ||
                 wrap.querySelector('.pathNode:not(.locked)');
  if(target){
    target.scrollIntoView({block:'center', behavior:'smooth'});
  }
}



// Custom category labels (for Mis Tarjetas only; they never become map categories)
export function addCategory(name){
  name = name.trim();
  if(!name) return false;
  if(allCats().some(c=> c.toLowerCase() === name.toLowerCase())) return false;
  S.customCats.push(name);
  try{ localStorage.setItem('ci_custom_cats', JSON.stringify(S.customCats)); }catch(e){}
  populateCardModalCats(name);
  return true;
}



export function showOnboardingView() {
  const ov = document.getElementById('onboardingView');
  ov.style.display = 'flex';
  ov.scrollTo(0, 0); // auto-scroll top
  // Marcar opciones por defecto visualmente Y en los hidden inputs
  document.querySelector('.xpOption[data-xp="200"]').classList.add('selected');
  document.querySelector('.levelOption[data-level="beginner"]').classList.add('selected');
  document.querySelector('.focusOption[data-focus="general"]').classList.add('selected');
  document.querySelector('.themeOption[data-theme="axolotl"]').classList.add('selected');
  document.getElementById('selectedXp').value = '200';
  document.getElementById('selectedLevel').value = 'beginner';
  document.getElementById('selectedFocus').value = 'general';
  document.getElementById('selectedTheme').value = 'axolotl';
}



// Onboarding option handlers
export function setActiveOption(containerSelector, optionSelector, hiddenInputId, selectedClass = 'selected', onSelect) {
  document.querySelectorAll(containerSelector + ' ' + optionSelector).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(containerSelector + ' ' + optionSelector).forEach(b => b.classList.remove(selectedClass));
      btn.classList.add(selectedClass);
      const val = btn.dataset.xp || btn.dataset.level || btn.dataset.focus || btn.dataset.theme;
      document.getElementById(hiddenInputId).value = val;
      if (onSelect) onSelect(val);
    });
  });
}



// =====================================================================
// Mascota: Ajolote Kawaii
// =====================================================================
export const MASCOT = {
  happy: './assets/stickers/ajolotes_emociones/feliz_brazos_arriba.png',
  thinking: './assets/stickers/ajolotes_emociones/pensando_idea_o_duda.png',
  sad: './assets/stickers/ajolotes_emociones/triste_llorando.png',
  scared: './assets/stickers/ajolotes_emociones/asustado_manos_en_mejillas.png',
  hero: './assets/stickers/ajolotes_emociones/feliz_brazos_arriba.png'
};


export function mascotImg(kind, cls){
  const img = document.createElement('img');
  img.src = MASCOT[kind] || MASCOT.happy;
  img.alt = '';
  img.decoding = 'async';
  img.className = 'mascot' + (cls ? ' ' + cls : '');
  return img;
}


// Replaces the emoji of a modal with a sticker.
export function setMascotIn(el, kind){
  if(!el) return;
  el.textContent = '';
  const img = mascotImg(kind, 'mascot-modal mascot-pop');
  el.appendChild(img);
}


// Exam: one sticker per answer — correct / almost (accepted with a typo) / wrong / wrong with a single life left.
export function examMascotKind(ok, okNote){
  if(ok) return okNote ? 'thinking' : 'happy';
  return (S.examState && S.examState.lives === 1) ? 'scared' : 'sad';
}


export function showExamMascot(kind){
  const img = document.getElementById('examMascot');
  if(!img) return;
  img.src = MASCOT[kind] || MASCOT.happy;
  img.hidden = false;
  img.classList.remove('mascot-pop'); void img.offsetWidth; img.classList.add('mascot-pop');
}


export function hideExamMascot(){
  const img = document.getElementById('examMascot');
  if(img){ img.hidden = true; img.classList.remove('mascot-pop'); }
}


// Flashcards: a quick sticker after rating (never blocks taps).



export function showMascotToast(kind, text){
  const box = document.getElementById('mascotToast'), img = document.getElementById('mascotToastImg');
  if(!box || !img) return;
  img.src = MASCOT[kind] || MASCOT.happy;
  setMascotBubble(text || '');
  box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
  clearTimeout(S._mascotToastTimer);
  S._mascotToastTimer = setTimeout(()=> box.classList.remove('show'), text ? 1500 : 1150);
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [2188, function(){
document.getElementById('gModalClose').onclick = ()=>{
  document.getElementById('gModalOverlay').style.display = 'none';
  dismissTopModal();
};
  }],
  [2313, function(){
document.querySelectorAll('.goalOpt').forEach(b=>{
  b.onclick = ()=>{ setDailyGoalTarget(parseInt(b.dataset.goal,10)); };
});
  }],
  [3404, function(){
(function(){
  const IDS=['tableView','lessonView','examView','stageMapView','reviewView','myCardsView','translatorView','progressView','profileView','dictView'];
  document.addEventListener('wheel', function(e){
    try{
      if(e.defaultPrevented || e.ctrlKey || e.shiftKey || !e.deltaY) return;
      const t=e.target;
      if(t.closest && t.closest('.gModalOverlay, #settingsPanel, #starPanel, #newsPanel, textarea, select')) return;
      for(const id of IDS){
        const el=document.getElementById(id);
        if(!el || !el.offsetParent) continue;
        if(el.contains(t)) return;                    // ya está dentro: scroll nativo
        const k = e.deltaMode===1 ? 16 : (e.deltaMode===2 ? el.clientHeight : 1);
        smoothWheelScroll(el, e.deltaY*k);
        e.preventDefault();
        return;
      }
    }catch(_){}
  }, {passive:false});
})();
  }],
  [3425, function(){
document.getElementById('openTableBtn').onclick = ()=>{
  document.getElementById('progressView').style.display = 'none';
  document.getElementById('tableView').style.display = '';
  renderTable();
  scrollTopNow('tableView');
  addScrollTopBtn(document.getElementById('tableView'));
};
  }],
  [3432, function(){
document.getElementById('backFromTableBtn').onclick = ()=>{
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('progressView').style.display = '';
};
  }],
  [3746, function(){
S._vbPromptEl = null;
  }],
  [3785, function(){

// Botón ⭐ del encabezado (junto a Novedades): despliega un panel con la info y el enlace al repositorio.
{
  const sBtnStar = document.getElementById('starBtn'), sPanelStar = document.getElementById('starPanel');
  const closeStar = () => { sPanelStar.hidden = true; sBtnStar.setAttribute('aria-expanded', 'false'); };
  sBtnStar.onclick = () => {
    const opening = sPanelStar.hidden;
    sPanelStar.hidden = !opening;
    sBtnStar.setAttribute('aria-expanded', String(opening));
    if(opening){
      sPanelStar.scrollTo(0, 0);
      document.getElementById('starVersion').textContent = APP_VERSION;
      const sp = document.getElementById('settingsPanel'), np = document.getElementById('newsPanel');
      if(sp) sp.hidden = true; if(np) np.hidden = true;           // un solo desplegable abierto a la vez
    }
  };
  document.getElementById('starOpenBtn').onclick = () => { openRepo(); closeStar(); };
  document.getElementById('starCloseBtn').onclick = closeStar;
  ['starRepoLink', 'starIssuesLink'].forEach(id => document.getElementById(id).addEventListener('click', () => starSave({ s: 'done', t: Date.now(), n: starState().n || 0 })));
  // fase de captura: así también se cierra al tocar Novedades o Ajustes (sus botones detienen la propagación)
  document.addEventListener('click', e => {
    if(sPanelStar.hidden) return;
    if(sPanelStar.contains(e.target) || sBtnStar.contains(e.target)) return;
    closeStar();
  }, true);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !sPanelStar.hidden){ closeStar(); sBtnStar.focus(); } });
}
  }],
  [4724, function(){


// Icono cartoon (el mismo de la barra inferior) en el título de cada pestaña
[['progressView','progress','.viewHeader h2'],['translatorView','translator','.viewHeader h2'],['myCardsView','mycards','.myCardsHeader h2']].forEach(([v,k,sel])=>{
  const h = document.querySelector('#'+v+' '+sel);
  if(h && !h.querySelector('.tabIcon')){ const i = document.createElement('span'); i.className = 'tabIcon'; i.setAttribute('aria-hidden','true'); i.innerHTML = NAV_ICONS[k]; h.insertBefore(i, h.firstChild); }
});
  }],
  [4730, function(){


// ===== Pantalla completa (escritorio y móviles que lo permiten) =====
{
  const fsBtn = document.getElementById('fsBtn');
  const root = document.documentElement;
  const reqFs = root.requestFullscreen || root.webkitRequestFullscreen;
  const canFs = !!reqFs && (document.fullscreenEnabled || document.webkitFullscreenEnabled);
  let standalone = false;
  try{ standalone = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; }catch(e){}
  if(fsBtn && canFs && !standalone){
    fsBtn.hidden = false;
    const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
    const sync = () => {
      const on = isFs();
      fsBtn.classList.toggle('isFs', on);
      fsBtn.setAttribute('aria-pressed', String(on));
      const t = on ? 'Salir de pantalla completa' : 'Pantalla completa';
      fsBtn.setAttribute('aria-label', t); fsBtn.title = t;
    };
    fsBtn.onclick = () => {
      try{
        if(isFs()){ (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
        else { const p = reqFs.call(root); if(p && p.catch) p.catch(()=>{}); }
      }catch(e){}
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    sync();
  }
}
  }],
  [4828, function(){
populateCardModalCats();
  }],
  [5086, function(){
document.getElementById('welcomeStartBtn').onclick = ()=>{
  document.getElementById('welcome-screen').style.display = 'none';
  // Si ya hay idioma guardado, saltar a onboarding/aprendizaje
  const savedLang = localStorage.getItem('vocabri_language');
  if (savedLang) {
    switchView('learn');
  } else {
    document.getElementById('languageView').style.display = 'flex';
  }
};
  }],
  [5098, function(){


// Language card handlers
document.querySelectorAll('.langCard').forEach(card => {
  card.addEventListener('click', () => {
    const lang = card.dataset.lang;
    if (lang === 'ja') {
      // Japonés - mostrar toast "Próximamente"
      showToast('🇯🇵 ¡Japonés estará disponible muy pronto!', '', 3000);
      return;
    }
    // Inglés - mostrar onboarding
    localStorage.setItem('vocabri_language', 'en');
    document.getElementById('languageView').style.display = 'none';
    showOnboardingView();
  });
});
  }],
  [5142, function(){


// XP options
setActiveOption('.xpOptions', '.xpOption', 'selectedXp');
  }],
  [5144, function(){

// Level options
setActiveOption('.levelOptions', '.levelOption', 'selectedLevel');
  }],
  [5146, function(){

// Focus options (ahora son categorías maestras)
setActiveOption('.focusOptions', '.focusOption', 'selectedFocus');
  }],
  [5148, function(){

// Theme options
setActiveOption('.themeOptions', '.themeOption', 'selectedTheme', 'selected', (theme) => {
  S.themeKey = theme;
  applyTheme();
});
  }],
  [5154, function(){


// Onboarding start button
document.getElementById('onboardingStartBtn').addEventListener('click', () => {
  const xp = parseInt(document.getElementById('selectedXp').value, 10);
  const level = document.getElementById('selectedLevel').value;
  const masterCat = document.getElementById('selectedFocus').value; // ahora es categoría maestra directa
  const theme = document.getElementById('selectedTheme').value; // tema visual seleccionado

  localStorage.setItem('ci_daily_goal_xp', xp);
  localStorage.setItem('ci_user_level', level);
  localStorage.setItem('ci_user_focus', masterCat); // guardar categoría maestra elegida
  localStorage.setItem('ci_theme', theme); // guardar tema visual elegido
  localStorage.setItem('onboardingDone', 'true');

  // Aplicar el tema inmediatamente
  S.themeKey = theme;
  applyTheme();

  // Guardar las 5 categorías maestras para el dropdown y el mapa
  const masterCategories = getValidCategoryIds();
  setMasterCategories(masterCategories);

  // Establecer la categoría maestra elegida como actual
  S.currentCat = masterCat;
  localStorage.setItem('ci_current_master_category', masterCat);

  // Actualizar el label del selector de categorías inmediatamente
  let label = masterCat;
  if (window.VocabriCategories) {
    label = window.VocabriCategories.getCategoryShortLabel(masterCat);
  }
  const labelEl = document.getElementById('catSelectorLabel');
  if (labelEl) labelEl.textContent = label;

  // Establecer el nodo inicial según el nivel
  const startNode = (window.VocabriCategories && window.VocabriCategories.getStartNode)
    ? window.VocabriCategories.getStartNode(level)
    : 0;
  localStorage.setItem('ci_start_node', String(startNode));

  // Aplicar inmediatamente el nodo inicial para la sesión actual
  setUnlockedStage(S.currentCat, startNode);

  // Actualizar el selector de categoría en el panel de ajustes
  updateCatSelector();

  document.getElementById('onboardingView').style.display = 'none';
  switchView('learn');
});
  }],
  [6295, function(){
(function preloadMascot(){
  Object.keys(MASCOT).forEach(k=>{ const i = new Image(); i.src = MASCOT[k]; });   // so the stickers appear instantly (and are cached offline)
})();
  }],
  [6330, function(){
S._mascotToastTimer = null;
  }]
];

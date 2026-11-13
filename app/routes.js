// Vocabri — Rutas por objetivo (interfaz). La lógica está en core/routes.js.
// Guarda solo la ruta elegida (vocabri_route); el avance se calcula con tus datos de estudio.
import { CAT_MODULE_NAMES, CAT_MODULE_SIZES, itemsFor, mapItemsFor, readStored } from './core/dataRegistry.js';
import { isStudied } from './core/exportCards.js';
import { ROUTE_DAY_OPTIONS, ROUTE_GOALS, buildRoutePlan, daysLeft, getRouteGoal, normalizeRoute, routeProgress, zoneSlice } from './core/routes.js';
import { S } from './core/shared.js';
import { REVIEW_XP, srsGrade, srsLog } from './state.js';
import { shortcutAllowed, activationKeyFree } from './shortcuts.js';
import { speak } from './speech.js';
import { NAV_ICONS, _ni, awardXp, scrollTopNow, switchView } from './ui.js';
import { updateReviewBadge } from './review.js';

const KEY = 'vocabri_route';
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function loadRoute(){
  try{ return normalizeRoute(JSON.parse(localStorage.getItem(KEY) || 'null')); }catch(e){ return null; }
}
export function saveRoute(r){ try{ if(r) localStorage.setItem(KEY, JSON.stringify(r)); else localStorage.removeItem(KEY); }catch(e){} }
export const studiedKey = key => isStudied(readStored(key));

// Claves de cada fuente de la meta, en orden (una lista por fuente)
export function goalGroups(goalId){
  const g = getRouteGoal(goalId);
  if(!g) return [];
  return g.sources.map(s => zoneSlice(mapItemsFor(s.cat), CAT_MODULE_NAMES[s.cat], CAT_MODULE_SIZES[s.cat], s.zones).map(it => it[3]));
}


// Iconos cartoon de cada objetivo (mismo sistema que la barra inferior)
const GOAL_STYLE = {
  travel: { c: '#38BDF8', e: '#0B6190', ic: _ni('#38BDF8', '#0B6190', '<path d="M14 2.8c1.7 0 2.5 1.3 2.5 3V11l7.6 4.5v2.7l-7.6-2.2v4.5l2.3 1.8V25L14 23.5 9.2 25v-2.7l2.3-1.8V16L3.900 18.200v-2.700L11.500 11V5.800c0-1.700.8-3 2.500-3z"/>', '<path d="M12.600 6.400c.2-.8 1-1.300 1.400-1.300" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>') },
  work:   { c: '#F59E0B', e: '#8A4B05', ic: _ni('#F59E0B', '#8A4B05', '<rect x="3.500" y="9" width="21" height="14.500" rx="3.800"/><path class="niLn" d="M10.200 9V7.400a2 2 0 0 1 2-2h3.600a2 2 0 0 1 2 2V9"/>', '<path d="M3.800 15.200h20.400" fill="none" stroke="#8A4B05" stroke-width="2"/><rect x="11.800" y="13.300" width="4.400" height="4" rx="1.200" fill="#FDE68A" stroke="#8A4B05" stroke-width="1.600"/>') },
  study:  { c: '#A78BFA', e: '#4C2C9E', ic: _ni('#A78BFA', '#4C2C9E', '<path d="M14 5.500 2.800 11 14 16.600 25.200 11z"/><path d="M7.500 14.600v4.800c0 1.700 2.900 3.100 6.500 3.100s6.500-1.400 6.500-3.100v-4.800L14 18z"/>', '<path d="M24 11.800v6.200" fill="none" stroke="#FDE68A" stroke-width="2.200" stroke-linecap="round"/>') },
  talk:   { c: '#F472B6', e: '#9D2461', ic: _ni('#F472B6', '#9D2461', '<path d="M5.200 5.800h17.600a2.700 2.700 0 0 1 2.700 2.700v9.200a2.700 2.700 0 0 1-2.700 2.700H13.600L8.400 24.800v-4.400H5.200a2.700 2.700 0 0 1-2.700-2.700V8.500a2.700 2.700 0 0 1 2.700-2.700z"/>', '<circle cx="9.200" cy="13.100" r="1.500" fill="#fff"/><circle cx="14" cy="13.100" r="1.500" fill="#fff"/><circle cx="18.800" cy="13.100" r="1.500" fill="#fff"/>') },
  fun:    { c: '#4ADE80', e: '#14783B', ic: _ni('#4ADE80', '#14783B', '<path d="M8 8.500h12c3.300 0 5.300 3.500 5.800 8 .3 2.700-.6 5-2.900 5-1.600 0-2.600-1.200-3.700-2.500h-8.400c-1.100 1.300-2.100 2.500-3.700 2.500-2.300 0-3.200-2.300-2.900-5 .5-4.500 2.500-8 5.800-8z"/>', '<path d="M8.800 13.200v4.200M6.700 15.300h4.200" fill="none" stroke="#fff" stroke-width="2.200" stroke-linecap="round"/><circle cx="18.200" cy="14.200" r="1.300" fill="#fff"/><circle cx="21" cy="16.600" r="1.300" fill="#fff"/>') }
};
const goalIc = id => '<span class="rpGoalIc" aria-hidden="true">' + ((GOAL_STYLE[id] || GOAL_STYLE.travel).ic) + '</span>';
const goalTone = id => { const g = GOAL_STYLE[id] || GOAL_STYLE.travel; return '--gt:' + g.c + ';--gtE:' + g.e + ';'; };

let sel = { goal: 'travel', days: 14 }, confirmReset = false;
let R = null;   // sesión de práctica de un día

function view(){ return document.getElementById('routeView'); }

function previewPlan(){ return buildRoutePlan(goalGroups(sel.goal), sel.days, studiedKey); }

function chooseHtml(){
  const plan = previewPlan();
  const n = plan.reduce((a, d) => a + d.length, 0);
  const per = plan.length ? Math.round(n / plan.length) : 0;
  return '<p class="rpIntro">Elige para qué quieres el inglés y en cuántos días. Armo un camino corto con frases de la app y dejo fuera las que ya estudiaste.</p>' +
    '<div class="rpLabel">¿Para qué?</div><div class="rpGoals" role="group" aria-label="Objetivo">' +
    ROUTE_GOALS.map(g => '<button type="button" class="rpGoal hover-scale focus-glow" style="' + goalTone(g.id) + '" data-goal="' + g.id + '" aria-pressed="' + (g.id === sel.goal) + '">' +
      goalIc(g.id) + '<span class="rpGoalTx"><strong>' + esc(g.name) + '</strong><small>' + esc(g.desc) + '</small></span><span class="rtTick" aria-hidden="true">✓</span></button>').join('') +
    '</div><div class="rpLabel">¿En cuántos días?</div><div class="rpDays" role="group" aria-label="Días">' +
    ROUTE_DAY_OPTIONS.map(d => '<button type="button" class="rpDay hover-scale focus-glow" data-days="' + d + '" aria-pressed="' + (d === sel.days) + '"><b>' + d + '</b><small>días</small></button>').join('') + '</div>' +
    (n ? '<div class="rpPreview" id="rpPreview" style="' + goalTone(sel.goal) + '"><div><b>' + n + '</b><span>frases</span></div><div><b>' + plan.length + '</b><span>días</span></div><div><b>~' + per + '</b><span>al día</span></div></div>'
       : '<p class="rtEmptyMsg" id="rpPreview">¡Ya estudiaste todo lo de esta ruta! Prueba con otro objetivo.</p>') +
    '<button class="nav hover-scale focus-glow rpCreate" id="rpCreate" type="button"' + (n ? '' : ' disabled') + '>🚀 Crear mi ruta</button>';
}

function activeHtml(r){
  const g = getRouteGoal(r.goal), P = routeProgress(r.plan, studiedKey), left = daysLeft(r, Date.now());
  const done = P.next < 0;
  return '<div class="rpHero" style="' + goalTone(r.goal) + '">' + goalIc(r.goal) + '<div class="rtHeroTx"><strong>' + esc(g.name) + '</strong>' +
      '<small>' + (left > 0 ? 'Te quedan ' + left + (left === 1 ? ' día' : ' días') + ' (de ' + r.days + ')' : 'Tu plazo de ' + r.days + ' días terminó: sigue a tu ritmo') + '</small></div>' +
      '<span class="rtPct">' + P.pct + '%</span></div>' +
    '<div class="rpBar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + P.pct + '" aria-label="Avance de la ruta"><i style="width:' + P.pct + '%"></i></div>' +
    '<p class="rpStat">' + P.doneCards + ' de ' + P.totalCards + ' frases · ' + P.doneDays + ' de ' + r.plan.length + ' días completos</p>' +
    (done ? '<p class="rpDone">🎉 ¡Ruta completa! Ya viste todas sus frases. Repásalas cuando te toquen.</p>' : '') +
    '<div class="rpLabel">Tus días</div><ul class="rpList" style="' + goalTone(r.goal) + '">' + P.days.map((d, i) =>
      '<li class="rpRow' + (d.complete ? ' isDone' : '') + (i === P.next ? ' isNext' : '') + '"><span class="rpDayNo" aria-hidden="true">' + (d.complete ? '✓' : (i + 1)) + '</span>' +
      '<span class="rpDayInfo"><strong>Día ' + (i + 1) + '</strong><small>' + d.done + '/' + d.total + ' frases' + (d.complete ? ' · completo' : (i === P.next ? ' · te toca' : '')) + '</small></span>' +
      '<button type="button" class="rpGo hover-scale focus-glow" data-day="' + i + '" aria-label="' + (d.complete ? 'Repasar' : 'Practicar') + ' el día ' + (i + 1) + '">' + (d.complete ? 'Repasar' : 'Practicar') + '</button></li>').join('') + '</ul>' +
    '<button class="rpReset hover-scale focus-glow" id="rpReset" type="button">' + (confirmReset ? '¿Seguro? Se borra esta ruta (tus frases no) · toca para confirmar' : 'Cambiar de ruta') + '</button>';
}

const q = id => document.getElementById(id);

function showPart(part){   // 'menu' | 'play' | 'done'
  q('rtMenu').style.display = part === 'menu' ? '' : 'none';
  q('rtPlay').style.display = part === 'play' ? '' : 'none';
  q('rpDone').style.display = part === 'done' ? '' : 'none';
}

function renderMenu(){
  const v = view(); if(!v) return;
  const r = loadRoute();
  R = null;
  q('rtTitleText').textContent = r ? 'Mi ruta' : 'Rutas por objetivo';
  q('rtSub').textContent = r ? 'Practica un día a la vez; tu avance se guarda solo.' : 'Elige tu objetivo y arma un camino corto de frases.';
  q('rpBody').innerHTML = r ? activeHtml(r) : chooseHtml();
  showPart('menu');
  q('rtCount').style.display = 'none';
  document.dispatchEvent(new Event('vocabri-route-changed'));
}

// ---------- Práctica de un día (vista propia, no pasa por Repaso) ----------
export function practiceDay(i){
  const r = loadRoute(); if(!r || !r.plan[i]) return;
  const byKey = new Map(itemsFor('Todas').map(it => [it[3], it]));
  const items = r.plan[i].map(k => byKey.get(k)).filter(Boolean);
  if(!items.length) return;
  q('rtCount').style.display = '';
  R = { day: i, queue: items.slice(), total: items.length, done: 0, xp: 0, stats: { 1: 0, 2: 0, 3: 0, 4: 0 }, failed: new Set(), cur: null, shown: false };
  q('rtTitleText').textContent = 'Ruta · Día ' + (i + 1);
  q('rtSub').textContent = 'Frases nuevas de «' + getRouteGoal(r.goal).name + '». Voltea la tarjeta y califica qué tan bien la sabías.';
  showPart('play');
  nextCard();
  scrollTopNow('routeView');
}

function nextCard(){
  if(!R.queue.length){ finishDay(); return; }
  R.cur = R.queue[0]; R.shown = false;
  q('rtCount').textContent = Math.min(R.done + 1, R.total) + ' / ' + R.total;
  paintTrail();
  const card = q('rtCard');
  card.classList.add('noAnim'); card.classList.remove('flipped'); void card.offsetWidth; card.classList.remove('noAnim');
  q('rtFront').textContent = R.cur[0];
  q('rtBack').textContent = R.cur[1];
  const ex = q('rtExample');
  if(R.cur[4]){ ex.innerHTML = '<p class="rtExEn">“' + esc(R.cur[4]) + '”</p>' + (R.cur[5] ? '<p class="rtExEs">' + esc(R.cur[5]) + '</p>' : ''); }
  else ex.innerHTML = '';
  ex.style.display = 'none';
  q('rtShow').style.display = '';
  q('rtRate').style.display = 'none';
}

function paintTrail(){
  const r = loadRoute(), g = r ? getRouteGoal(r.goal) : null;
  q('rtBanner').innerHTML = (r ? goalIc(r.goal) : '') + '<div class="rtBannerTx"><strong>' + esc(g ? g.name : 'Mi ruta') + '</strong><small>Día ' + (R.day + 1) + ' · frase ' + Math.min(R.done + 1, R.total) + ' de ' + R.total + '</small></div>';
  q('rtBanner').style.cssText = r ? goalTone(r.goal) : '';
  let h = '';
  for(let i = 0; i < R.total; i++) h += '<i class="' + (i < R.done ? 'isDone' : (i === R.done ? 'isNow' : '')) + '"></i>';
  q('rtTrail').innerHTML = h;
}

function reveal(){
  if(!R || !R.cur) return;
  if(R.shown){ R.shown = false; q('rtCard').classList.remove('flipped'); q('rtExample').style.display = 'none'; q('rtShow').style.display = ''; q('rtRate').style.display = 'none'; return; }
  R.shown = true;
  q('rtCard').classList.add('flipped');
  if(q('rtExample').innerHTML) q('rtExample').style.display = '';
  q('rtShow').style.display = 'none';
  q('rtRate').style.display = '';
  requestAnimationFrame(() => { try{ q('rtRate').scrollIntoView({ block: 'nearest' }); }catch(e){} });
}

function rate(grade){
  if(!R || !R.cur || !R.shown) return;
  const item = R.queue.shift(), key = item[3];
  const res = srsGrade(key, grade);
  R.stats[grade]++;
  if(res.applied){
    srsLog(grade >= 2);
    const xp = R.failed.has(key) ? 0 : REVIEW_XP[grade];
    if(xp){ awardXp(xp); R.xp += xp; }
  }
  if(grade === 1){ R.failed.add(key); R.queue.splice(Math.min(R.queue.length, 3), 0, item); }
  else R.done++;
  R.cur = null;
  updateReviewBadge();
  nextCard();
}

function finishDay(){
  const r = loadRoute(), P = r ? routeProgress(r.plan, studiedKey) : null;
  q('rtTitleText').textContent = 'Ruta · Día ' + (R.day + 1);
  const firstTry = R.total - Math.min(R.total, R.failed.size);
  q('rpDone').innerHTML = '<img class="mascot" src="./assets/stickers/ajolotes_emociones/mente_explotando_confeti.png" alt="" width="88" height="88">' +
    '<p class="rtBig">¡Día ' + (R.day + 1) + ' completado!</p>' +
    '<div class="rtStats"><div><b>' + R.total + '</b><span>frases</span></div><div><b>' + Math.round(firstTry / R.total * 100) + '%</b><span>a la primera</span></div><div><b>+' + R.xp + '</b><span>XP</span></div></div>' +
    (P ? '<p class="rpStat">' + P.doneCards + ' de ' + P.totalCards + ' frases de tu ruta · ' + P.doneDays + ' de ' + r.plan.length + ' días completos</p>' : '') +
    '<button class="nav hover-scale focus-glow" id="rtBackToRoute" type="button">🧭 Volver a mi ruta</button>' +
    '<button class="rpReset hover-scale focus-glow" id="rtBackToReview" type="button">Ir a Repaso</button>';
  q('rtBackToRoute').onclick = renderMenu;
  q('rtBackToReview').onclick = closeRoutes;
  showPart('done');
  R = null;
  document.dispatchEvent(new Event('vocabri-route-changed'));
}

// ---------- Abrir / cerrar ----------
export function openRoutes(){
  const v = view(); if(!v) return;
  const rv = q('reviewView'); if(rv) rv.style.display = 'none';
  confirmReset = false;
  renderMenu();
  v.style.display = '';
  scrollTopNow('routeView');
}
export function hideRoutes(){
  R = null;
  const v = view(); if(v) v.style.display = 'none';
}
export function closeRoutes(){
  const v = view(); if(!v || v.style.display === 'none') return;
  hideRoutes();
  switchView('review');
}
// Flecha atrás: durante una práctica vuelve al menú de la ruta; en el menú, a Repaso
function back(){
  if(R){ renderMenu(); return; }
  closeRoutes();
}

function wire(){
  if(view()) return;
  const v = document.createElement('div');
  v.id = 'routeView'; v.style.display = 'none';
  v.innerHTML =
    '<div class="dictHead"><button class="miniBtn hover-scale focus-glow" id="rtBackBtn" type="button" aria-label="Volver">←</button>' +
    '<h2 class="dictTitle"><span class="tabIcon rtHeadIc" aria-hidden="true">' + NAV_ICONS.learn + '</span><span class="rvTitleText" id="rtTitleText">Rutas por objetivo</span></h2>' +
    '<span class="reviewCountPill" id="rtCount" style="display:none;"></span></div>' +
    '<p class="hint dictSub" id="rtSub"></p>' +
    '<div id="rtMenu" class="rpBody"><div id="rpBody"></div></div>' +
    '<div id="rtPlay" style="display:none;">' +
      '<div class="rtBanner" id="rtBanner"></div>' +
      '<div class="rtTrail" id="rtTrail" aria-hidden="true"></div>' +
      '<div class="card" id="rtCard" role="button" tabindex="0" aria-label="Tarjeta: toca para voltearla"><div class="card-inner">' +
        '<div class="face front"><span class="tag">EN</span><button class="speakBtn hover-scale focus-glow" id="rtSpeak" type="button" aria-label="Escuchar en inglés">🔊</button><p id="rtFront"></p></div>' +
        '<div class="face back"><span class="tag">ES</span><p id="rtBack"></p></div></div><div class="flipHint">↻</div></div>' +
      '<div class="rvExample" id="rtExample" style="display:none;"></div>' +
      '<div class="actionZone">' +
      '<button class="showAnswerBtn hover-scale focus-glow" id="rtShow" type="button">Mostrar respuesta</button>' +
      '<div class="rateBlock" id="rtRate" style="display:none;"><p class="ratePrompt">¿Qué tan bien la sabías?</p><div class="rateRow rateRow4">' +
        [['rateAgain','🔁','Otra vez'],['rateHard','😓','Difícil'],['rateGood','🙂','Bien'],['rateEasy','🚀','Fácil']].map((b, i) =>
          '<button class="rateBtn ' + b[0] + ' hover-scale focus-glow" data-rate="' + (i + 1) + '" type="button"><span class="rateIcon" aria-hidden="true">' + b[1] + '</span><span class="rateLabel">' + b[2] + '</span></button>').join('') +
      '</div><p class="rvKeys">Atajos: Espacio voltear · 1 · 2 · 3 · 4</p></div></div>' +
    '</div>' +
    '<div id="rpDone" class="rtDoneBox" style="display:none;"></div>';
  const anchor = q('tableView');
  anchor.parentNode.insertBefore(v, anchor);

  q('rtBackBtn').onclick = back;
  q('rtShow').onclick = reveal;
  q('rtCard').addEventListener('click', e => { if(e.target.closest('#rtSpeak')) return; reveal(); });
  q('rtSpeak').onclick = () => { if(R && R.cur) speak(R.cur[0], 'en-US', 0.92); };
  v.querySelectorAll('[data-rate]').forEach(b => { b.onclick = () => rate(+b.dataset.rate); });

  v.addEventListener('click', e => {
    const t = e.target.closest('#rtMenu button'); if(!t) return;
    if(t.dataset.goal){ sel.goal = t.dataset.goal; renderMenu(); const b = v.querySelector('[data-goal="' + sel.goal + '"]'); if(b) b.focus({ preventScroll: true }); }
    else if(t.dataset.days){ sel.days = +t.dataset.days; renderMenu(); const b = v.querySelector('[data-days="' + sel.days + '"]'); if(b) b.focus({ preventScroll: true }); }
    else if(t.id === 'rpCreate'){
      const plan = previewPlan(); if(!plan.length) return;
      saveRoute({ v: 1, goal: sel.goal, days: sel.days, start: Date.now(), plan });
      confirmReset = false; renderMenu();
    }
    else if(t.dataset.day != null) practiceDay(+t.dataset.day);
    else if(t.id === 'rpReset'){
      if(!confirmReset){ confirmReset = true; renderMenu(); const b = q('rpReset'); if(b) b.focus({ preventScroll: true }); return; }
      saveRoute(null); confirmReset = false; renderMenu();
    }
  });
  document.addEventListener('keydown', e => {
    if(v.style.display === 'none') return;
    if(e.key === 'Escape'){ back(); return; }
    if(!R || !R.cur || !shortcutAllowed(e)) return;
    if((e.key === ' ' || e.key === 'Enter') && activationKeyFree(e, v)){ e.preventDefault(); reveal(); }
    else if(R.shown && '1234'.includes(e.key) && e.key.length === 1){ e.preventDefault(); rate(+e.key); }
  });
}

export const __inits = [[9070, wire]];

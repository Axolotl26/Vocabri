// Vocabri — módulo "review" (generado a partir de app.js)
import { S } from './core/shared.js';
import { isMastered, itemsFor, readStored } from './core/dataRegistry.js';
import { LEECH_LAPSES, REVIEW_SESSION_CAP, REVIEW_XP, fmtWhen, getDailyGoalTarget, getDueCards, getDueTodayCount, getNextDueTime, getXpToday, srsForecast, srsGapText, srsGrade, srsInterval, srsInvalidate, srsLog, srsNextInterval, srsRetention7, srsWouldApply } from './state.js';
import { shortcutAllowed, activationKeyFree } from './shortcuts.js';
import { NAV_ICONS, awardXp, scrollTopNow, switchView } from './ui.js';



// ==================== VISTA REPASAR HOY ====================


   // {total, done, stats, xp, stage, failed:Map, noXp:Set, remaining}


      // última nota, para poder deshacerla

export function reviewEl(id){ return document.getElementById(id); }


export function rvEsc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }



export function reviewShow(part){   // 'card' | 'empty' | 'summary'
  reviewEl('reviewCard').style.display = part === 'card' ? '' : 'none';
  reviewEl('reviewActionZone').style.display = part === 'card' ? '' : 'none';
  reviewEl('reviewProgress').style.display = part === 'card' ? '' : 'none';
  reviewEl('reviewEmpty').style.display = part === 'empty' ? '' : 'none';
  reviewEl('reviewSummary').style.display = part === 'summary' ? '' : 'none';
  reviewEl('reviewView').classList.toggle('rvInSession', part === 'card');   // la flecha «atrás» solo se ve con tarjetas en pantalla
  if(part !== 'card'){
    reviewEl('reviewExample').style.display = 'none';
    reviewEl('reviewLeech').style.display = 'none';
    reviewEl('reviewUndoBtn').style.display = 'none';
  }
}



// Mini gráfico "próximos 7 días" + retención, para la pantalla vacía y el resumen
export function renderReviewForecast(hostId){
  const host = reviewEl(hostId); if(!host) return;
  const f = srsForecast();
  const max = Math.max(1, ...f);
  const names = ['Hoy','Mañ','','','','',''];
  const today = new Date();
  const bars = f.map((n,i)=>{
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const lab = i === 0 ? 'Hoy' : d.toLocaleDateString('es', {weekday:'short'}).replace('.','').slice(0,3);
    return '<div class="rvFcCol"><span class="rvFcNum">' + (n || '') + '</span><i style="height:' + Math.max(n ? 8 : 3, Math.round(n / max * 54)) + 'px"' + (n ? '' : ' class="zero"') + '></i><span class="rvFcDay">' + rvEsc(lab) + '</span></div>';
  }).join('');
  const total = f.reduce((a,b)=>a+b, 0);
  const ret = srsRetention7();
  const hasCards = total > 0 || ret !== null || reviewOverviewStats().inReview > 0;   // con tarjetas en repaso el gráfico siempre se muestra
  const nxt = !total ? getNextDueTime() : 0;
  host.innerHTML = hasCards
    ? '<p class="rvFcTitle">Próximos 7 días</p><div class="rvFcBars">' + bars + '</div>' +
      (!total ? '<p class="rvFcRet">Nada que repasar esta semana' + (nxt ? ' · tu próximo repaso llega ' + rvEsc(fmtWhen(nxt)) : '') + '.</p>' : '') +
      (ret !== null ? '<p class="rvFcRet">Retención de la semana: <b>' + ret + '%</b></p>' : '')
    : '';
}




// Resumen numérico de tu colección (se calcula con los datos de repaso que ya existen; no guarda nada nuevo).
export function reviewOverviewStats(){
  let inReview = 0, mastered = 0;
  itemsFor('Todas').forEach(it => {
    const st = readStored(it[3]);
    if(st.reps > 0 || st.next) inReview++;
    if(isMastered(it[3])) mastered++;
  });
  return { inReview, mastered, retention: srsRetention7(), due: getDueTodayCount() };
}

function rvStatBox(num, label, cls){
  return '<div class="rvOv ' + cls + '"><b>' + rvEsc(num) + '</b><span>' + rvEsc(label) + '</span></div>';
}

// Panel de estado para la pantalla "sin tarjetas": cuántas llevas, dominadas, retención y mini-meta del día.
export function renderReviewOverview(){
  let host = reviewEl('reviewEmptyStats');
  if(!host){
    host = document.createElement('div');
    host.id = 'reviewEmptyStats';
    const fc = reviewEl('reviewEmptyForecast');
    fc.parentNode.insertBefore(host, fc);
  }
  const o = reviewOverviewStats();
  if(!o.inReview){
    host.innerHTML = '<div class="rvTip"><b>💡 ¿Cómo funciona?</b><span>Cada frase que aprendes en el mapa vuelve aquí justo antes de que se te olvide. Pocos minutos al día bastan.</span></div>';
    return;
  }
  const goal = getDailyGoalTarget(), xp = getXpToday();
  host.innerHTML = '<div class="rvOvRow">' +
    rvStatBox(o.inReview, 'en repaso', 'ovA') + rvStatBox(o.mastered, 'dominadas', 'ovB') +
    rvStatBox(o.retention === null ? '—' : o.retention + '%', 'retención 7 días', 'ovC') + '</div>' + rvGoalBar(xp, goal);
}

function rvGoalBar(xp, goal){
  const pct = goal ? Math.min(100, Math.round(xp / goal * 100)) : 0;
  return '<div class="rvGoal"><div class="rvGoalTop"><span>🎯 Meta diaria</span><b>' + xp + ' / ' + goal + ' XP</b></div>' +
    '<div class="rvGoalBar"><i style="width:' + pct + '%"></i></div></div>';
}

function renderSummaryExtras(acc){
  const sum = reviewEl('reviewSummary');
  let ring = reviewEl('reviewSumRing');
  if(!ring){
    ring = document.createElement('div');
    ring.id = 'reviewSumRing';
    ring.className = 'rvRingWrap';
    sum.insertBefore(ring, sum.querySelector('.rvStats'));
  }
  const label = acc === 100 ? '¡Perfecto!' : acc >= 80 ? '¡Muy bien!' : acc >= 50 ? 'Buen avance' : 'Sigue practicando';
  ring.innerHTML = '<div class="rvRing" style="--p:' + acc + '" role="img" aria-label="Acierto a la primera: ' + acc + '%"><b>' + acc + '%</b><span>a la primera</span></div>' +
    '<p class="rvRingMsg">' + label + '</p>';
  let goal = reviewEl('reviewSumGoal');
  if(!goal){
    goal = document.createElement('div');
    goal.id = 'reviewSumGoal';
    const nxt = reviewEl('reviewSumNext');
    nxt.parentNode.insertBefore(goal, nxt);
  }
  goal.innerHTML = rvGoalBar(getXpToday(), getDailyGoalTarget());
}

export function renderReviewView(){
  // Salir de la sesión (flecha atrás): se muestra el panel de inicio con todos los modos
  const lobby = !!S.reviewLobby; S.reviewLobby = false;
  if(lobby) window.currentReviewStage = null;
  const stage = window.currentReviewStage;
  let cards;
  if(stage && stage.items && stage.items.length){
    cards = stage.items.slice();
    window.currentReviewStage = null;
  } else {
    cards = getDueCards();
  }
  S.reviewUndo = null;
  reviewEl('reviewBackBtn').onclick = () => { S.reviewLobby = true; renderReviewView(); scrollTopNow('reviewView'); };
  const resume = ensureResumeBtn();
  resume.style.display = 'none';
  reviewEl('reviewEmptyLearnBtn').onclick = () => switchView('learn');
  setReviewTitle(stage ? (stage.label || 'Repasar sección') : 'Repasar', stage ? (stage.sub || 'Repaso de las tarjetas de esta sección del mapa.') : '');
  updateReviewBadge();
  document.dispatchEvent(new Event('vocabri-review-render'));

  if(lobby && cards.length){
    reviewShow('empty');
    reviewEl('reviewCount').textContent = cards.length + (cards.length === 1 ? ' pendiente' : ' pendientes');
    reviewEl('reviewEmpty').querySelector('.rvBig').textContent = 'Tu repaso te espera';
    reviewEl('reviewEmptyHint').textContent = 'Tienes ' + cards.length + (cards.length === 1 ? ' tarjeta' : ' tarjetas') + ' por repasar. Elige un modo de práctica o continúa cuando quieras.';
    resume.textContent = '▶ Repasar ahora (' + cards.length + ')';
    resume.style.display = '';
    resume.onclick = () => renderReviewView();
    renderReviewOverview();
    renderReviewForecast('reviewEmptyForecast');
    return;
  }
  reviewEl('reviewEmpty').querySelector('.rvBig').textContent = '¡No hay tarjetas para repasar!';
  if(!cards.length){
    reviewShow('empty');
    reviewEl('reviewCount').textContent = 'Al día';
    const nxt = getNextDueTime();
    reviewEl('reviewEmptyHint').textContent = nxt
      ? 'Tu próximo repaso llega ' + fmtWhen(nxt) + '. Mientras, sigue aprendiendo en el mapa.'
      : 'Aún no tienes tarjetas en repaso. Aprende algunas en el mapa y aparecerán aquí.';
    renderReviewOverview();
    renderReviewForecast('reviewEmptyForecast');
    return;
  }
  const batch = stage ? cards : cards.slice(0, REVIEW_SESSION_CAP);
  S.reviewQueue = batch.slice();
  S.reviewSession = {total: batch.length, done:0, stats:{1:0,2:0,3:0,4:0}, xp:0, stage:!!stage, remaining: cards.length - batch.length, failed:new Map(), noXp:new Set()};
  showReviewCard();
}



function ensureResumeBtn(){
  let b = document.getElementById('reviewResumeBtn');
  if(!b){
    b = document.createElement('button');
    b.id = 'reviewResumeBtn'; b.type = 'button'; b.className = 'showAnswerBtn hover-scale focus-glow';
    b.style.cssText = 'margin-top:14px;display:none;';
    const learn = reviewEl('reviewEmptyLearnBtn');
    learn.parentNode.insertBefore(b, learn);
  }
  return b;
}

export function updateReviewProgress(){
  const s = S.reviewSession;
  reviewEl('reviewCount').textContent = Math.min(s.done + 1, s.total) + ' / ' + s.total;
  reviewEl('reviewProgBarFill').style.width = Math.round(s.done / s.total * 100) + '%';
}



export function showReviewCard(){
  if(!S.reviewQueue.length){ finishReviewSession(); return; }
  reviewShow('card');
  scrollTopNow('reviewView');
  S.reviewCurrent = S.reviewQueue[0];
  const cardEl = reviewEl('reviewCard');
  cardEl.classList.remove('flipped');
  reviewEl('reviewRateBlock').style.display = 'none';
  reviewEl('reviewShowAnswerBtn').style.display = '';
  reviewEl('reviewExample').style.display = 'none';
  reviewEl('reviewUndoBtn').style.display = S.reviewUndo ? '' : 'none';
  updateReviewProgress();

  const item = S.reviewCurrent;
  reviewEl('reviewFrontText').textContent = item[0];
  reviewEl('reviewBackText').textContent = item[1];
  window.currentReviewKey = item[3];

  // Intervalos que se aplicarían con cada botón (y "sin cambio" si es un repaso anticipado que no mueve el calendario)
  const cur = readStored(item[3]);
  const prev = srsInterval(cur);
  [1,2,3,4].forEach(g => {
    const c = reviewEl('reviewRate'+g+'Cap');
    if(c) c.textContent = srsWouldApply(cur, g) ? srsGapText(srsNextInterval(prev, g, cur)) : 'sin cambio';
  });
  const leech = reviewEl('reviewLeech');
  if(cur.lapses >= LEECH_LAPSES){ leech.textContent = '🩹 Te cuesta: fallada ' + cur.lapses + ' veces'; leech.style.display = ''; }
  else leech.style.display = 'none';

  reviewEl('reviewShowAnswerBtn').onclick = revealReviewAnswer;
  [1,2,3,4].forEach(g => { reviewEl('reviewRate'+g).onclick = () => rateReviewCard(g); });
}



// Tocar la tarjeta la voltea, igual que en las lecciones del mapa (volver a tocarla oculta la respuesta)
export function toggleReviewCard(){
  if(!S.reviewCurrent) return;
  const card = reviewEl('reviewCard');
  if(!card.classList.contains('flipped')){ revealReviewAnswer(); return; }
  card.classList.remove('flipped');
  reviewEl('reviewRateBlock').style.display = 'none';
  reviewEl('reviewShowAnswerBtn').style.display = '';
  reviewEl('reviewExample').style.display = 'none';
}

export function revealReviewAnswer(){
  if(!S.reviewCurrent || reviewEl('reviewRateBlock').style.display !== 'none') return;
  reviewEl('reviewCard').classList.add('flipped');
  reviewEl('reviewShowAnswerBtn').style.display = 'none';
  reviewEl('reviewRateBlock').style.display = '';
  const it = S.reviewCurrent, ex = reviewEl('reviewExample');
  if(it[4]){
    ex.innerHTML = '<p class="rvExEn">“' + rvEsc(it[4]) + '”</p>' + (it[5] ? '<p class="rvExEs">' + rvEsc(it[5]) + '</p>' : '');
    ex.style.display = '';
  }
  document.dispatchEvent(new Event('vocabri-review-reveal'));
}



// Título con el mismo icono SVG que la barra inferior (igual que Progreso, Traductor y Mis Tarjetas)
function setReviewTitle(text, subText){
  const h = reviewEl('reviewTitle');
  if(!h) return;
  if(!h.querySelector('.tabIcon')){
    h.innerHTML = '<span class="tabIcon" aria-hidden="true">' + NAV_ICONS.review + '</span><span class="rvTitleText"></span>';
  }
  h.querySelector('.rvTitleText').textContent = text;
  // Línea de funciones bajo el título, como en Mis Tarjetas
  const head = h.closest('.reviewHeader');
  let sub = document.getElementById('reviewSub');
  if(!sub && head){
    sub = document.createElement('p');
    sub.className = 'hint rvSub';
    sub.id = 'reviewSub';
    head.insertAdjacentElement('afterend', sub);
  }
  if(sub) sub.textContent = subText || 'Repaso espaciado, dictado y tu retención de la semana.';
}

export function rateReviewCard(grade){
  if(!S.reviewCurrent || !S.reviewSession) return;
  const item = S.reviewQueue.shift();
  const key = item[3];
  const s = S.reviewSession;
  let raw = null; try{ raw = localStorage.getItem('ci_master_' + key); }catch(e){}
  const res = srsGrade(key, grade);
  s.stats[grade]++;
  let xp = 0;
  if(res.applied){
    xp = s.noXp.has(key) ? 0 : REVIEW_XP[grade];
    srsLog(grade >= 2);
    if(xp){ awardXp(xp); s.xp += xp; }
  }
  let at = -1;
  if(grade === 1){
    s.failed.set(key, {item, n:((s.failed.get(key) || {n:0}).n) + 1});
    at = Math.min(S.reviewQueue.length, 3);     // vuelve a aparecer tras unas cartas más (o enseguida si es la última)
    S.reviewQueue.splice(at, 0, item);
  } else {
    s.done++;
  }
  S.reviewUndo = {key, raw, item, grade, xp, at, applied:res.applied};
  S.reviewCurrent = null;
  updateReviewBadge();
  showReviewCard();
}



// Deshacer la última nota: restaura la tarjeta, la cola y los contadores (el XP ya dado no se vuelve a dar)
export function undoReviewRating(){
  const u = S.reviewUndo, s = S.reviewSession;
  if(!u || !s) return;
  S.reviewUndo = null;
  try{ if(u.raw === null) localStorage.removeItem('ci_master_' + u.key); else localStorage.setItem('ci_master_' + u.key, u.raw); }catch(e){}
  srsInvalidate();
  s.stats[u.grade]--;
  if(u.applied) srsLog(u.grade >= 2, -1);
  if(u.xp) s.noXp.add(u.key);
  if(u.grade === 1){
    const idx = S.reviewQueue.indexOf(u.item);
    if(idx >= 0) S.reviewQueue.splice(idx, 1);
    const f = s.failed.get(u.key);
    if(f){ f.n--; if(f.n <= 0) s.failed.delete(u.key); }
  } else {
    s.done--;
  }
  S.reviewQueue.unshift(u.item);
  S.reviewCurrent = null;
  updateReviewBadge();
  showReviewCard();
}



export function finishReviewSession(){
  const s = S.reviewSession;
  S.reviewUndo = null;
  reviewShow('summary');
  reviewEl('reviewCount').textContent = '¡Listo!';
  reviewEl('reviewProgBarFill').style.width = '100%';
  const firstTry = s.total - Math.min(s.total, s.failed.size);   // tarjetas distintas falladas, no pulsaciones
  const acc = s.total ? Math.round(firstTry / s.total * 100) : 0;
  reviewEl('reviewSumDone').textContent = s.total;
  reviewEl('reviewSumAcc').textContent = acc + '%';
  reviewEl('reviewSumXp').textContent = '+' + s.xp;
  renderSummaryExtras(acc);
  reviewEl('reviewSumBreak').innerHTML =
    '<span class="rvChip rvAgain">🔁 ' + s.stats[1] + ' otra vez</span>' +
    '<span class="rvChip rvHard">😓 ' + s.stats[2] + ' difícil</span>' +
    '<span class="rvChip rvGood">🙂 ' + s.stats[3] + ' bien</span>' +
    '<span class="rvChip rvEasy">🚀 ' + s.stats[4] + ' fácil</span>';

  // Tarjetas falladas: lista y botón para repasarlas ya
  const failed = Array.from(s.failed.values());
  const fBox = reviewEl('reviewSumFailed'), redo = reviewEl('reviewRedoBtn');
  if(failed.length){
    fBox.innerHTML = '<p class="rvFailTitle">Para reforzar</p>' + failed.slice(0, 8).map(f =>
      '<div class="rvFailRow"><b>' + rvEsc(f.item[0]) + '</b><span>' + rvEsc(f.item[1]) + '</span></div>').join('') +
      (failed.length > 8 ? '<p class="rvFailMore">y ' + (failed.length - 8) + ' más…</p>' : '');
    fBox.style.display = '';
    redo.style.display = '';
    redo.onclick = () => { window.currentReviewStage = {items: failed.map(f => f.item), label:'Reforzar falladas'}; renderReviewView(); };
  } else { fBox.style.display = 'none'; redo.style.display = 'none'; }

  const due = s.stage ? 0 : getDueCards().length;
  const nxt = getNextDueTime();
  reviewEl('reviewSumNext').textContent = due > 0
    ? 'Aún tienes ' + due + (due === 1 ? ' tarjeta' : ' tarjetas') + ' pendiente' + (due === 1 ? '' : 's') + '.'
    : (nxt ? 'Tu próximo repaso llega ' + fmtWhen(nxt) + '.' : 'Todo al día.');
  const more = reviewEl('reviewMoreBtn');
  more.style.display = due > 0 ? '' : 'none';
  more.onclick = () => renderReviewView();
  reviewEl('reviewSumMapBtn').onclick = () => switchView('learn');
  renderReviewForecast('reviewSumForecast');
  updateReviewBadge();
  document.dispatchEvent(new Event('vocabri-review-render'));
}



export function updateReviewBadge(){
  const count = getDueTodayCount();
  const badge = document.getElementById('reviewNavBadge');
  if(badge){
    if(count > 0){ badge.textContent = count > 99 ? '99+' : count; badge.style.display = ''; }
    else badge.style.display = 'none';
  }
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [2618, function(){
S.reviewQueue = [];
  }],
  [2619, function(){
S.reviewSession = null;
  }],
  [2620, function(){
S.reviewCurrent = null;
  }],
  [2621, function(){
S.reviewUndo = null;
  }],
  [2843, function(){
setInterval(updateReviewBadge, 60000);
  }],
  [2844, function(){
document.addEventListener('DOMContentLoaded', ()=>{ const u = document.getElementById('reviewUndoBtn'); if(u) u.onclick = undoReviewRating; });
  }],
  [2845, function(){
(function(){ const u = document.getElementById('reviewUndoBtn'); if(u) u.onclick = undoReviewRating; })();
  }],
  [2848, function(){


// Atajos: Espacio/Enter muestra la respuesta (o la oculta), 1-4 califica, U deshace. Se desactivan en Ajustes → Atajos de teclado.
document.addEventListener('keydown', e => {
  const v = document.getElementById('reviewView');
  if(!v || v.style.display === 'none') return;
  if(!shortcutAllowed(e)) return;
  if((e.key === 'u' || e.key === 'U') && S.reviewUndo){ e.preventDefault(); undoReviewRating(); return; }
  if(!S.reviewCurrent) return;
  const rating = document.getElementById('reviewRateBlock').style.display !== 'none';
  if((e.key === ' ' || e.key === 'Enter') && activationKeyFree(e, v)){ e.preventDefault(); toggleReviewCard(); }
  else if(rating && '1234'.includes(e.key) && e.key.length === 1){ e.preventDefault(); rateReviewCard(+e.key); }
});
  }],
  [2849, function(){
const rc = document.getElementById('reviewCard');
if(rc) rc.addEventListener('click', toggleReviewCard);
  }]
];

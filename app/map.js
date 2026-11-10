// Vocabri — módulo "map" (generado a partir de app.js)
import { S } from './core/shared.js';
import { COOLDOWN_EXAM_BY_STARS, COOLDOWN_EXAM_MS, cooldownRemainingMs, examStarsFor, getCurrentStage, getUnlockedStage, registerSectionCompletion, setCurrentStage, setExamResult, setUnlockedStage } from './core/dataRegistry.js';
import { startExam } from './exam.js';
import { celebrate, markJustUnlocked, playPendingUnlock } from './mascot.js';
import { renderCards, showCooldownModal } from './lesson.js';
import { isExamNode, isStageComplete, nodeAt, nodeLayout, stageCountFor, stageItems } from './mapData.js';
import { buildPathMap } from './mapRenderer.js';
import { renderMyCardsHome } from './myCards.js';
import { playSfx } from './speech.js';
import { awardXp, maybeAskStar, setMascotIn, switchView } from './ui.js';

 // 'lesson' | 'freeplay'


 // 'learn' | 'mycards' — where the lesson UI was opened from
export function showMap(){
  S.lessonHost = 'learn';
  S.studyMode = 'lesson';
  S.cardsSubView = 'map';
  document.getElementById('cardsView').style.display = '';
  document.getElementById('myCardsView').style.display = 'none';
  renderCardsSubView();
  playPendingUnlock();
}


export function showLesson(cat, stageIdx){
  if(stageIdx === getUnlockedStage(cat) && cooldownRemainingMs() > 0){
    showCooldownModal();
    return;
  }
  if(isExamNode(cat, stageIdx)){
    startExam(cat, stageIdx);
    return;
  }
  S.lessonHost = 'learn';
  S.studyMode = 'lesson';
  S.currentCat = cat;
  setCurrentStage(cat, stageIdx);
  S.idx = 0; S.order = [];
  S.cardsSubView = 'lesson';
  document.getElementById('cardsView').style.display = '';
  document.getElementById('myCardsView').style.display = 'none';
  document.getElementById('examView').style.display = 'none';
  renderCardsSubView();
}



// Iniciar repaso de una sección específica del mapa
export function startStageReview(cat, stageIdx){
  // Obtener las tarjetas de esa sección
  const items = stageItems(cat, stageIdx);
  if(!items.length) return;

  // Guardar la sección actual para el repaso
  window.currentReviewStage = {cat, stageIdx, items};

  // Cambiar a vista de repaso
  switchView('review');

  // El renderReviewView usará window.currentReviewStage si existe
}


export function openMyCardsPractice(){
  S.lessonHost = 'mycards';
  S.studyMode = 'freeplay';
  S.idx = 0; S.order = [];
  S.cardsSubView = 'lesson';
  document.getElementById('myCardsView').style.display = 'none';
  document.getElementById('cardsView').style.display = '';
  renderCardsSubView();
}


export function backFromLesson(){
  if(S.lessonHost === 'mycards'){
    document.getElementById('cardsView').style.display = 'none';
    document.getElementById('myCardsView').style.display = '';
    renderMyCardsHome();
  } else {
    showMap();
  }
}


export function renderCardsSubView(){
  const mapEl = document.getElementById('stageMapView');
  const lessonEl = document.getElementById('lessonView');
  if(!mapEl || !lessonEl) return;
  if(S.cardsSubView === 'map'){
    mapEl.style.display = '';
    lessonEl.style.display = 'none';
    buildPathMap();
  } else {
    mapEl.style.display = 'none';
    lessonEl.style.display = '';
    renderCards();
  }
}


// Simple one-at-a-time queue so the level-up modal and the stage-complete
// screen never try to show on top of each other when both trigger together.



export function enqueueModal(renderFn){
  S.modalQueue.push(renderFn);
  if(S.modalQueue.length === 1) renderFn();
}


export function dismissTopModal(){
  S.modalQueue.shift();
  if(S.modalQueue.length) S.modalQueue[0]();
}


export function isEtapaComplete(cat, etapaIdx){
  const nodes = nodeLayout(cat).nodes;
  for(let i=0;i<nodes.length;i++){
    if(nodes[i].etapaIdx === etapaIdx && !isStageComplete(cat, i)) return false;
  }
  return true;
}


export function showStageCompleteScreen(stageIdx, hasNext, bonus, etapaJustFinished, wasExam){
  setMascotIn(document.getElementById('stageCompleteEmoji'), 'happy');
  const cat = S.currentCat;
  const L = nodeLayout(cat);
  if(wasExam){
    document.getElementById('stageCompleteTitle').textContent = '🏅 ¡Examen Completado!';
    document.getElementById('stageCompleteMsg').textContent =
      '+' + bonus + ' XP de bono. Tu cerebro necesita tiempo para consolidar lo repasado — hay un enfriamiento de 8 horas antes de la siguiente sección.';
  } else if(etapaJustFinished){
    document.getElementById('stageCompleteTitle').textContent = '🏆 ¡Etapa Completada!';
    document.getElementById('stageCompleteMsg').textContent = hasNext
      ? '+' + bonus + ' XP de bono. "' + L.etapaNames[nodeAt(cat,stageIdx).etapaIdx] + '" terminada — la siguiente etapa ya está desbloqueada.'
      : '+' + bonus + ' XP de bono. ¡Completaste todas las etapas de ' + cat + '!';
  } else {
    document.getElementById('stageCompleteTitle').textContent = '¡Sección Completada! 🎉';
    document.getElementById('stageCompleteMsg').textContent =
      '+' + bonus + ' XP de bono. La siguiente sección ya está desbloqueada en el mapa.';
  }
  S.pendingNextStage = hasNext ? stageIdx+1 : null;
  if(hasNext) markJustUnlocked(cat, stageIdx+1);
  celebrate({ count: etapaJustFinished ? 50 : 30 });
  showModalFromTop('stageCompleteOverlay');
}


export function examWrongListHtml(wrong, max){
  if(!wrong || !wrong.length) return '';
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  return '<p class="exWrongTitle">Para reforzar</p>' + wrong.slice(0, max || 6).map(w =>
    '<div class="exWrongRow"><b>' + esc(w.it[0]) + '</b><span>' + esc(w.it[1]) + '</span></div>').join('') +
    (wrong.length > (max || 6) ? '<p class="exWrongMore">y ' + (wrong.length - (max || 6)) + ' más…</p>' : '');
}


export function showExamResults(info){
  S._examResultInfo = info;
  const pct = info.total ? Math.round(info.score / info.total * 100) : 0;
  setMascotIn(document.getElementById('examResultEmoji'), info.stars >= 2 ? 'happy' : 'thinking');
  document.getElementById('examResultTitle').textContent =
    info.stars === 3 ? '¡Examen perfecto!' : info.stars === 2 ? '¡Muy bien!' : '¡Examen superado!';
  document.getElementById('examResultStars').innerHTML = [1,2,3].map(i => '<span class="exStar' + (i <= info.stars ? ' on' : '') + '" style="--i:' + i + '">★</span>').join('');
  document.getElementById('examResultScore').textContent = info.score + '/' + info.total;
  document.getElementById('examResultPct').textContent = pct + '%';
  document.getElementById('examResultXp').textContent = '+' + info.xp;
  const lines = [];
  if(info.first){
    lines.push(info.hasNext ? '🔓 La siguiente sección ya está desbloqueada.' : '🏆 ¡Completaste todas las secciones!');
    if(info.cooldownMs) lines.push('⏳ Descanso de ' + Math.round(info.cooldownMs / 3600000) + ' h para fijar lo aprendido' + (info.stars < 3 ? ' (con ★★★ sería de 4 h)' : '') + '.');
  } else {
    lines.push(info.bestStars > info.prevStars ? '⭐ ¡Mejoraste tu mejor nota!' : 'Repetición: tu mejor nota se mantiene en ' + '★'.repeat(info.bestStars) + '.');
    if(!info.xp) lines.push('Sin XP extra: solo se paga cuando mejoras.');
  }
  document.getElementById('examResultNote').innerHTML = lines.map(l => '<span>' + l + '</span>').join('');
  document.getElementById('examResultWrong').innerHTML = examWrongListHtml(info.wrong, 5);
  const rb = document.getElementById('examResultReviewBtn');
  rb.style.display = info.wrong.length ? '' : 'none';
  if(info.first && info.hasNext) markJustUnlocked(S.currentCat, getUnlockedStage(S.currentCat));
  if(info.stars >= 2) celebrate({ count: info.stars === 3 ? 56 : 36 });
  showModalFromTop('examResultOverlay');
  playSfx(info.stars >= 2 ? 'levelup' : 'correct');
}


// Abre una ventana emergente siempre desde arriba (si se había desplazado antes, el ajolote quedaba tapado)
export function showModalFromTop(id){
  const ov = document.getElementById(id);
  if(!ov) return;
  ov.style.display = 'flex';
  const reset = ()=>{ ov.scrollTop = 0; ov.querySelectorAll('.gModal').forEach(m=>{ m.scrollTop = 0; }); };
  reset(); requestAnimationFrame(reset);
}


export function closeExamResults(thenReview){
  document.getElementById('examResultOverlay').style.display = 'none';
  const info = S._examResultInfo; S._examResultInfo = null;
  if(thenReview && info && info.wrong.length){
    window.currentReviewStage = {items: info.wrong.map(w => w.it), label:'Reforzar falladas'};
    S.pendingNextStage = null;
    dismissTopModal();
    switchView('review');
    return;
  }
  S.pendingNextStage = null;
  showMap();
  dismissTopModal();
  setTimeout(maybeAskStar, 700);
}


export function checkStageCompletion(){
  const cat = S.currentCat;
  const stageIdx = getCurrentStage(cat);
  if(getUnlockedStage(cat) > stageIdx) return false;
  if(!isStageComplete(cat, stageIdx)) return false;
  const etapaIdx = nodeAt(cat, stageIdx).etapaIdx;
  const etapaJustFinished = isEtapaComplete(cat, etapaIdx);
  const bonus = etapaJustFinished ? 40 : 20;
  awardXp(bonus);
  const total = stageCountFor(cat);
  const hasNext = stageIdx+1 < total;
  if(hasNext) setUnlockedStage(cat, stageIdx+1);
  registerSectionCompletion(cat, stageIdx, false);
  enqueueModal(()=> showStageCompleteScreen(stageIdx, hasNext, bonus, etapaJustFinished, false));
  buildPathMap();
  return true;
}


// XP del examen según la mejor nota. En una repetición solo se paga la mejora (nunca se farmea).
export const EXAM_XP_BY_STARS = {1:30, 2:40, 3:55};


// Called by the exam view when its last question is answered.
export function finishExam(score, total, wrong){
  const cat = S.currentCat;
  const stageIdx = getCurrentStage(cat);
  const r = setExamResult(cat, stageIdx, score, total);
  const attemptStars = examStarsFor(score, total);
  const xp = r.first ? EXAM_XP_BY_STARS[r.stars]
                     : Math.max(0, EXAM_XP_BY_STARS[r.stars] - (EXAM_XP_BY_STARS[r.prevStars] || 0));
  if(xp) awardXp(xp);
  const stageTotal = stageCountFor(cat);
  const hasNext = stageIdx+1 < stageTotal;
  // Nunca retrocede el avance: solo desbloquea si el siguiente nodo aún está cerrado.
  const unlockedNow = hasNext && getUnlockedStage(cat) <= stageIdx;
  if(unlockedNow) setUnlockedStage(cat, stageIdx+1);
  // El descanso solo se activa la primera vez que se supera el examen.
  if(r.first) registerSectionCompletion(cat, stageIdx, true, attemptStars);
  buildPathMap();
  const info = {score, total, xp, first:r.first, stars:attemptStars, bestStars:r.stars, prevStars:r.prevStars, hasNext, unlockedNow,
                cooldownMs: r.first ? (COOLDOWN_EXAM_BY_STARS[attemptStars] || COOLDOWN_EXAM_MS) : 0, wrong: wrong || []};
  enqueueModal(()=> showExamResults(info));
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [1612, function(){
S.cardsSubView = 'map';
  }],
  [1613, function(){
S.studyMode = 'lesson';
  }],
  [1614, function(){
S.lessonHost = 'learn';
  }],
  [1692, function(){
S.modalQueue = [];
  }],
  [1729, function(){
S.pendingNextStage = null;
  }],
  [1737, function(){
S._examResultInfo = null;
  }]
];

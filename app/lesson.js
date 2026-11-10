// Vocabri — módulo "lesson" (generado a partir de app.js)
import { S } from './core/shared.js';
import { cooldownRemainingMs, fmtHhMmSs, getCurrentStage, isMastered, rateCard, readStored } from './core/dataRegistry.js';
import { backFromLesson, checkStageCompletion, dismissTopModal, showMap } from './map.js';
import { etapaNameForSession, isStageComplete, stageCountFor, stageItems, stageName } from './mapData.js';
import { renderTable } from './progress.js';
import { haptic } from './speech.js';
import { pickLine } from './mascot.js';
import { activationKeyFree, isViewShown, shortcutAllowed } from './shortcuts.js';
import { awardXp, maybeAskStar, scrollTopNow, showMascotToast, showToast } from './ui.js';



export function freeplayItems(){
  return S.customWords.map(w=> [w.en, w.es, w.cat, 'custom|'+w.id, w.ex||null, w.exEs||null]);
}


export function currentLessonItems(){
  if(S.studyMode === 'freeplay') return freeplayItems();
  return stageItems(S.currentCat, getCurrentStage(S.currentCat));
}


export function renderCards(){
  scrollTopNow('lessonView');
  const cat = S.currentCat;
  const items = currentLessonItems();
  const backBtn = document.getElementById('backToMapBtn');
  if(S.studyMode === 'freeplay'){
    backBtn.textContent = '← Mis Tarjetas';
    document.getElementById('stageProgressText').textContent =
      '🎴 Mis Tarjetas: ' + items.length + ' guardadas';
  } else {
    backBtn.textContent = '← Mapa';
    const stageIdx = getCurrentStage(cat);
    const stageTotal = stageCountFor(cat);
    const stageDone = items.filter(it=> readStored(it[3]).lvl >= 2).length;
    document.getElementById('stageProgressText').textContent =
      etapaNameForSession(cat, stageIdx) + ' — ' + stageName(cat, stageIdx) + ': ' + stageDone + '/' + items.length + ' completadas';
  }
  const card = document.getElementById('card');
  if(items.length === 0){
    document.getElementById('frontText').textContent = '—';
    document.getElementById('backText').textContent = '—';
    document.getElementById('progress').textContent = 'Sin tarjetas en esta sección';
    document.getElementById('progBarFill').style.width = '0%';
    setRateUi(false);
    document.getElementById('masteredCount').textContent = '0';
    document.getElementById('totalCount').textContent = '0';
    document.getElementById('showAnswerBtn').style.display = 'none';
    document.getElementById('prevBtn').style.visibility = 'hidden';
    document.getElementById('exWrap').style.display = 'none';
    card.classList.remove('flipped');
    S.curKey = null;
    return;
  }
  if(S.order.length !== items.length) S.order = items.map((_,i)=>i);
  S.idx = ((S.idx % items.length) + items.length) % items.length;
  card.classList.remove('flipped');
  setRateUi(false);
  // "Mezclar" only makes sense when practising your own cards; lessons follow their fixed order.
  document.getElementById('shuffleBtn').style.display = (S.studyMode === 'freeplay') ? '' : 'none';
  document.getElementById('prevBtn').style.visibility = (S.idx > 0) ? 'visible' : 'hidden';
  const pos = S.order[S.idx];
  const it = items[pos];
  S.curKey = it[3];
  document.getElementById('frontText').textContent = it[0];
  document.getElementById('backText').textContent = it[1];
  document.getElementById('progress').textContent = 'Tarjeta ' + (S.idx+1) + ' de ' + items.length + ' — ' + (S.studyMode==='freeplay' ? it[2] : cat);
  document.getElementById('progBarFill').style.width = (((S.idx+1)/items.length)*100) + '%';
  const exWrap = document.getElementById('exWrap');
  const exText = document.getElementById('exampleText');
  const exToggle = document.getElementById('exToggle');
  if(it[4]){
    exWrap.style.display = '';
    exText.textContent = it[4];
    exText.style.display = 'none';
    exToggle.textContent = 'Ver ejemplo ▾';
  } else {
    exWrap.style.display = 'none';
  }
  const exEsEl = document.getElementById('exampleTextEs');
  exEsEl.textContent = it[5] ? '💬 ' + it[5] : '';
  // "Dominadas en esta sección": progress of the section (or of your own cards in Mis Tarjetas)
  let mastered = 0;
  items.forEach(x=>{ if(isMastered(x[3])) mastered++; });
  document.getElementById('masteredCount').textContent = mastered;
  document.getElementById('totalCount').textContent = items.length;
}



// Step 1: only "Mostrar respuesta". Step 2 (card flipped): "¿Qué tan bien la sabías?" + 3 buttons.
export const FLIP_COACH_KEY = 'vocabri_flip_coach_done';


export function flipCoachSeen(){ try{ return localStorage.getItem(FLIP_COACH_KEY) === '1'; }catch(e){ return true; } }


export function setRateUi(flipped){
  const block = document.getElementById('rateBlock');
  const showBtn = document.getElementById('showAnswerBtn');
  const coach = document.getElementById('flipCoach');
  // keep keyboard focus useful when the rating buttons disappear
  const hadFocus = block.contains(document.activeElement);
  block.style.display = flipped ? '' : 'none';
  showBtn.style.display = flipped ? 'none' : '';
  coach.style.display = (!flipped && !flipCoachSeen()) ? '' : 'none';
  if(!flipped && hadFocus) showBtn.focus({preventScroll:true});
}


export function setFlipped(v){
  const c = document.getElementById('card');
  c.classList.toggle('flipped', v);
  if(v){ try{ localStorage.setItem(FLIP_COACH_KEY, '1'); }catch(e){} }
  setRateUi(v);
}



export function afterRate(){
  const items = currentLessonItems();
  if(!items.length) return;

  // Verificar si estamos en la última tarjeta
  const atEnd = S.idx >= items.length - 1;

  if(atEnd){
    // Al final de la lección: verificar si la etapa está completa
    const cat = S.currentCat;
    const stageIdx = getCurrentStage(cat);

    if(isStageComplete(cat, stageIdx)){
      // Etapa completa - checkStageCompletion ya se encarga del modal
      // (se llama desde rateAndAdvance cuando level >= 2)
      // Pero si llegamos aquí con level=1, forzar la verificación
      if(S.studyMode === 'lesson'){
        checkStageCompletion();
      }
      return;
    } else {
      // Etapa NO completa - parar en la última tarjeta
      // Mostrar indicador de que hay tarjetas pendientes
      S.idx = items.length - 1;
      renderCards();
      showToast('Algunas tarjetas necesitan más práctica. Repasa las marcadas como "Repasar".', 'mascot:thinking');
      return;
    }
  }

  // No estamos al final: avanzar normalmente
  S.idx = (S.idx + 1) % items.length;
  renderCards();
}


// Single entry point for rating a card: only this path (button press or a
// post-flip swipe) may grant XP or count toward stage/daily-goal progress.
export function refreshStageProgressText(){
  if(S.studyMode === 'freeplay'){
    const el = document.getElementById('stageProgressText');
    if(el) el.textContent = '🎴 Mis Tarjetas: ' + freeplayItems().length + ' guardadas';
    return;
  }
  const cat = S.currentCat;
  const stageIdx = getCurrentStage(cat);
  const items = stageItems(cat, stageIdx);
  const stageTotal = stageCountFor(cat);
  const stageDone = items.filter(it=> readStored(it[3]).lvl >= 2).length;
  const el = document.getElementById('stageProgressText');
  if(el) el.textContent = etapaNameForSession(cat, stageIdx) + ' — ' + stageName(cat, stageIdx) + ': ' + stageDone + '/' + items.length + ' completadas';
}


export function rateAndAdvance(level){
  if(!S.curKey) return;
  haptic();
  const rated = rateCard(S.curKey, level);
  showMascotToast(level >= 2 ? 'happy' : 'thinking', pickLine(level >= 3 ? 'easy' : level >= 2 ? 'good' : 'hard'));
  if(level >= 2 && rated && rated.applied) awardXp(10);   // XP solo si la nota cuenta (tarjeta nueva o vencida): no se puede farmear repitiendo
  refreshStageProgressText();
  const stageJustCompleted = (level >= 2 && S.studyMode === 'lesson') ? checkStageCompletion() : false;
  if(!stageJustCompleted) afterRate();
}


export function showCooldownModal(){
  const rem = cooldownRemainingMs();
  document.getElementById('cooldownModalMsg').textContent =
    '¡Excelente progreso! Has completado tus tarjetas de esta sección. Tu cerebro necesita tiempo para asimilar y fijar el vocabulario en la memoria a largo plazo. Regresa en ' + fmtHhMmSs(rem) + ' para continuar con la siguiente sección.';
  document.getElementById('cooldownModalOverlay').style.display = 'flex';
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [3851, function(){
document.getElementById('showAnswerBtn').onclick = ()=>{
  if(!S.curKey) return;
  haptic();
  setFlipped(true);
};
  }],
  [3856, function(){
document.getElementById('card').onclick = ()=>{
  if(S.suppressCardClick){ S.suppressCardClick = false; return; }
  setFlipped(!document.getElementById('card').classList.contains('flipped'));
};
  }],
  [3857, function(){
// Atajos de las lecciones: Espacio/Enter voltea, 1/2/3 califica (con la tarjeta volteada), ← anterior, S escucha
document.addEventListener('keydown', e => {
  if(!isViewShown('lessonView') || !shortcutAllowed(e)) return;
  const v = document.getElementById('lessonView');
  const card = document.getElementById('card');
  if(!card || !currentLessonItems().length) return;
  const flipped = card.classList.contains('flipped');
  if((e.key === ' ' || e.key === 'Enter') && activationKeyFree(e, v)){ e.preventDefault(); card.click(); return; }
  if(flipped && '123'.includes(e.key) && e.key.length === 1){
    e.preventDefault(); document.getElementById(['rateHard','rateGood','rateEasy'][+e.key - 1]).click(); return;
  }
  if(e.key === 'ArrowLeft'){ e.preventDefault(); document.getElementById('prevBtn').click(); return; }
  if(e.key === 's' || e.key === 'S'){ e.preventDefault(); const sp = document.getElementById('speakFront'); if(sp) sp.click(); }
});
  }],
  [3860, function(){
document.getElementById('exToggle').onclick = (e)=>{
  e.stopPropagation();
  const t = document.getElementById('exampleText');
  const open = t.style.display === 'block';
  t.style.display = open ? 'none' : 'block';
  e.target.textContent = open ? 'Ver ejemplo ▾' : 'Ocultar ejemplo ▴';
};
  }],
  [3928, function(){
document.getElementById('rateHard').onclick = ()=> rateAndAdvance(1);
  }],
  [3929, function(){
document.getElementById('rateGood').onclick = ()=> rateAndAdvance(2);
  }],
  [3930, function(){
document.getElementById('rateEasy').onclick = ()=> rateAndAdvance(3);
  }],
  [3931, function(){
document.getElementById('stageCompleteBtn').onclick = ()=>{
  document.getElementById('stageCompleteOverlay').style.display = 'none';
  S.pendingNextStage = null;
  showMap();
  dismissTopModal();
  setTimeout(maybeAskStar, 700);
};
  }],
  [3938, function(){
document.getElementById('backToMapBtn').onclick = ()=> backFromLesson();
  }],
  [3945, function(){
document.getElementById('cooldownModalClose').onclick = ()=>{
  document.getElementById('cooldownModalOverlay').style.display = 'none';
};
  }],
  [4639, function(){
(function setupSwipe(){
  const cardEl = document.getElementById('card');
  let sx=0, sy=0, dx=0, dy=0, dragging=false;
  cardEl.addEventListener('touchstart', e=>{
    if(e.touches.length!==1) return;
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; dx=0; dy=0; dragging=true;
    cardEl.style.transition='none';
  }, {passive:true});
  cardEl.addEventListener('touchmove', e=>{
    if(!dragging) return;
    dx = e.touches[0].clientX - sx; dy = e.touches[0].clientY - sy;
    if(Math.abs(dx) > Math.abs(dy)){
      cardEl.style.transform = 'translateX('+dx+'px) rotate('+(dx/20)+'deg)';
    }
  }, {passive:true});
  cardEl.addEventListener('touchend', ()=>{
    if(!dragging) return;
    dragging=false;
    const threshold = 70;
    const canRate = cardEl.classList.contains('flipped');
    if(canRate && Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)){
      S.suppressCardClick = true;
      const dir = dx > 0 ? 1 : -1;
      cardEl.style.transition = 'transform .2s ease';
      cardEl.style.transform = 'translateX('+(dir*480)+'px) rotate('+(dir*18)+'deg)';
      setTimeout(()=>{
        cardEl.style.transition = 'none';
        cardEl.style.transform = '';
        rateAndAdvance(dir>0 ? 3 : 1);
      }, 190);
    } else {
      cardEl.style.transition = 'transform .2s ease';
      cardEl.style.transform = '';
    }
  });
})();
  }],
  [4676, function(){
document.getElementById('prevBtn').onclick = ()=>{
  const items = currentLessonItems();
  if(!items.length) return;
  if(S.idx > 0){ S.idx -= 1; renderCards(); }
};
  }],
  [4681, function(){
document.getElementById('shuffleBtn').onclick = ()=>{
  const items = currentLessonItems();
  S.order = items.map((_,i)=>i);
  for(let k=S.order.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); [S.order[k],S.order[j]]=[S.order[j],S.order[k]]; }
  S.idx = 0; renderCards();
};
  }],
  [4687, function(){
document.getElementById('search').oninput = renderTable;
  }]
];

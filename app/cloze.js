// Vocabri — «Completa el hueco»: ronda de 10 frases con una palabra tapada y 4 opciones.
// Ventana propia (no toca el calendario de repaso). Da XP chico por acierto, con tope diario propio.
import { S } from './core/shared.js';
import { mapItemsFor, readStored, catLabel } from './core/dataRegistry.js';
import { CLOZE_ROUND, CLOZE_XP, pickRound } from './core/cloze.js';
import { awardXp } from './ui.js';
import { haptic, playSfx, speak } from './speech.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let C = null, overlay = null;

function pool(cat){
  const all = mapItemsFor(cat).filter(it => String(it[3]).indexOf('custom|') !== 0);
  const seen = all.filter(it => { const s = readStored(it[3]); return s.reps > 0 || s.lvl > 0 || s.m; });
  return { items: seen.length >= 12 ? seen : all, all };
}

function close(){
  if(!overlay) return;
  document.removeEventListener('keydown', overlay._esc);
  try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){}
  overlay.remove(); overlay = null; C = null;
}
function frame(){
  if(overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'gModalOverlay'; overlay.id = 'clozeOverlay'; overlay.style.display = 'flex'; overlay.style.zIndex = '10000';
  overlay.innerHTML = '<div class="gModal clzModal" role="dialog" aria-modal="true" aria-labelledby="clzTitle"><button type="button" class="modalCloseBtn clzClose" aria-label="Cerrar">✕</button><div id="clzBody"></div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('.clzClose').onclick = close;
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
  overlay._esc = e => { if(e.key === 'Escape') close(); };
  document.addEventListener('keydown', overlay._esc);
  return overlay;
}
const body = () => document.getElementById('clzBody');

export function startCloze(){
  const cat = S.currentCat, p = pool(cat);
  const qs = pickRound(p.items, CLOZE_ROUND, Math.random);
  frame();
  if(qs.length < 4){
    body().innerHTML = '<h3 id="clzTitle">Completa el hueco</h3><p class="clzLead">Aún no hay frases suficientes en esta categoría para este modo. Estudia unas cuantas en el mapa y vuelve.</p><button type="button" class="nav hover-scale focus-glow" id="clzBye" data-autofocus>Entendido</button>';
    body().querySelector('#clzBye').onclick = close; body().querySelector('#clzBye').focus(); return;
  }
  C = { qs, idx: 0, ok: 0, xp: 0, noXp: 0, fails: [], results: [], locked: false, cat };
  renderQ();
}

function renderQ(){
  const q = C.qs[C.idx], n = C.qs.length;
  const dots = C.qs.map((_, i) => '<i class="chDot' + (i < C.idx ? (C.results[i] ? ' ok' : ' bad') : i === C.idx ? ' cur' : '') + '"></i>').join('');
  body().innerHTML =
    '<h3 id="clzTitle" class="chQTitle">Pregunta ' + (C.idx + 1) + ' de ' + n + '</h3>' +
    '<div class="chDots" aria-hidden="true">' + dots + '</div>' +
    '<p class="clzEs">' + esc(q.es) + '</p>' +
    '<p class="clzSent" id="clzSent" aria-label="Frase con un hueco">' + esc(q.before) + '<span class="clzGap" id="clzGap">' + '&nbsp;'.repeat(6) + '</span>' + esc(q.after) + '</p>' +
    '<div class="chOpts" role="group" aria-label="Elige la palabra que falta">' +
    q.options.map((t, i) => '<button type="button" class="nav chOpt hover-scale focus-glow" data-i="' + i + '">' + esc(t) + '</button>').join('') + '</div>' +
    '<p class="chFeed" id="clzFeed" role="status" aria-live="polite"></p><div id="clzAfter"></div>';
  body().querySelectorAll('.chOpt').forEach(b => b.onclick = () => answer(Number(b.dataset.i)));
  C.locked = false;
  const f = body().querySelector('.chOpt'); if(f) f.focus({ preventScroll: true });
}

function answer(i){
  if(!C || C.locked) return; C.locked = true;
  const q = C.qs[C.idx], good = i === q.answerIndex;
  C.results.push(good);
  if(good){ C.ok++; const g = awardXp(CLOZE_XP, { source: 'cloze', key: q.key }) || 0; C.xp += g; if(!g) C.noXp++; playSfx('correct'); }
  else { C.fails.push(q); playSfx('wrong'); }
  haptic();
  body().querySelectorAll('.chOpt').forEach(b => {
    b.disabled = true; const k = Number(b.dataset.i);
    if(k === q.answerIndex) b.classList.add('isRight'); else if(k === i) b.classList.add('isWrong');
  });
  const gap = body().querySelector('#clzGap'); gap.textContent = q.answer; gap.className = 'clzGap ' + (good ? 'ok' : 'bad');
  body().querySelector('#clzFeed').textContent = good ? '¡Correcto!' : 'Era «' + q.answer + '».';
  const last = C.idx + 1 >= C.qs.length;
  body().querySelector('#clzAfter').innerHTML =
    '<div class="chRow"><button type="button" class="nav chGhost hover-scale focus-glow" id="clzSay">🔊 Escuchar</button>' +
    '<button type="button" class="nav hover-scale focus-glow" id="clzNext" data-autofocus>' + (last ? 'Ver resultado' : 'Siguiente →') + '</button></div>';
  body().querySelector('#clzSay').onclick = () => { try{ speak(q.en, 'en-US', 0.95); }catch(e){} };
  const nx = body().querySelector('#clzNext');
  nx.onclick = () => { C.idx++; if(C.idx >= C.qs.length) finish(); else renderQ(); };
  nx.focus({ preventScroll: true });
}

function finish(){
  const total = C.qs.length, pct = Math.round(C.ok / total * 100);
  const msg = pct === 100 ? '¡Perfecto! Dominas el vocabulario.' : pct >= 70 ? '¡Muy bien!' : 'Sigue practicando: cada ronda cuenta.';
  body().innerHTML =
    '<h3 id="clzTitle">Resultado</h3>' +
    '<div class="clzScore"><b>' + C.ok + '/' + total + '</b><span>' + pct + '%</span></div>' +
    '<p class="clzLead" role="status">' + msg + ' +' + C.xp + ' XP' + (C.noXp ? ' <small>(' + C.noXp + ' ya cobrada' + (C.noXp > 1 ? 's' : '') + ' hoy o tope diario)</small>' : '') + '</p>' +
    (C.fails.length ? '<div class="clzFails"><b>Para repasar</b><ul>' + C.fails.map(q => '<li>' + esc(q.en) + ' — <i>' + esc(q.es) + '</i></li>').join('') + '</ul></div>' : '') +
    '<button type="button" class="nav hover-scale focus-glow" id="clzAgain" data-autofocus>Otra ronda</button>' +
    '<button type="button" class="nav chGhost hover-scale focus-glow" id="clzDone">Volver a Repaso</button>';
  body().querySelector('#clzAgain').onclick = startCloze;
  body().querySelector('#clzDone').onclick = close;
  body().querySelector('#clzAgain').focus({ preventScroll: true });
}

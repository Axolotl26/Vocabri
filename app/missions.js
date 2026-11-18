// Vocabri — misiones especiales del mapa (interfaz). Estado en localStorage 'vocabri_missions' (se sincroniza como el resto).
import { S } from './core/shared.js';
import { itemsFor, readStored } from './core/dataRegistry.js';
import { MODES, normalizeMissions, shouldStart, startMission, completeMission, abandonMission, expireIfNeeded, daysLeft, buildRegisterRound, REG_ROUNDS, REG_PASS, buildTimeRound, buildSurvivalRound, SURV_LIVES, SURV_GOAL, TIME_SECONDS, TIME_GOAL, TIME_PENALTY, buildOrderRound, checkOrder, ORDER_PASS, ORDER_ROUNDS } from './core/missions.js';
import { awardXp, showToast } from './ui.js';
import { showMap } from './map.js';
import { speak, playSfx } from './speech.js';
import { escapeHtml } from './myCards.js';
import { refreshCollection } from './collection.js';

const LS = 'vocabri_missions';

// Iconos cartoon (mismo truco que el resto de la app: capa de borde oscuro + capa de color + brillo).
const ICON_SHAPES = {
  order:    { c: '#A78BFA', e: '#4C2A9E', d: '<rect x="5" y="10" width="15" height="14" rx="2.5"/><circle cx="12.5" cy="7.2" r="3"/><circle cx="23" cy="17" r="3"/>' },
  register: { c: '#38BDF8', e: '#0B5C86', d: '<circle cx="12" cy="12" r="8"/><path d="M17.5 18 24 24.5" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' },
  time:     { c: '#F59E0B', e: '#8A4B05', d: '<circle cx="14" cy="16" r="9.5"/><rect x="11.2" y="2.6" width="5.6" height="4" rx="1.6"/>' },
  survival: { c: '#F472B6', e: '#8E1F57', d: '<path d="M14 3.5 23.5 7v7.2c0 5.4-3.8 9.1-9.5 11.3C8.3 23.3 4.5 19.6 4.5 14.2V7z"/>' }
};
const ICON_DETAIL = {
  order:    '<path d="M9 12.5h2.5" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>',
  register: '<circle cx="12" cy="12" r="4.2" fill="#fff" fill-opacity=".45" stroke="none"/>',
  time:     '<path d="M14 16V10.5M14 16l3.6 2.2" fill="none" stroke="' + '#8A4B05' + '" stroke-width="2.4" stroke-linecap="round"/>',
  survival: '<path d="M14 9v9M9.8 13.2h8.4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>'
};
export function missionIconSvg(mode, size){
  const s = ICON_SHAPES[mode]; if(!s) return '';
  return '<svg viewBox="0 0 28 28" width="' + (size || 34) + '" height="' + (size || 34) + '" focusable="false" aria-hidden="true" class="mIcon">' +
    '<g transform="translate(0 2)" color="' + s.e + '" fill="' + s.e + '" stroke="' + s.e + '" stroke-width="5.2" stroke-linejoin="round" stroke-linecap="round">' + s.d + '</g>' +
    '<g color="' + s.c + '" fill="' + s.c + '" stroke="none">' + s.d + '</g>' + ICON_DETAIL[mode] + '</svg>';
}
const esc = s => escapeHtml(String(s == null ? '' : s));
export function loadMissions(){ try{ return normalizeMissions(JSON.parse(localStorage.getItem(LS) || 'null')); }catch(e){ return normalizeMissions(null); } }
function saveMissions(m){ try{ localStorage.setItem(LS, JSON.stringify(m)); }catch(e){} }
export const missionsDoneCount = () => loadMissions().count;

function currentCat(){ try{ return localStorage.getItem('ci_current_master_category') || 'general'; }catch(e){ return 'general'; } }
function seenCount(){
  let n = 0;
  itemsFor('Todas').forEach(it => { const r = readStored(it[3]); if(r.reps > 0 || r.m) n++; });
  return n;
}

const CLOSE_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>';

// Ventana al pulsar la X: dejarla para más tarde o perderla de verdad.
function askDismiss(from){
  if(document.getElementById('missionAsk')) return;
  const m = loadMissions(); if(!m.active) return;
  const o = document.createElement('div');
  o.className = 'gModalOverlay'; o.id = 'missionAsk';
  o.innerHTML = '<div class="gModal missionAskBox" role="dialog" aria-modal="true" aria-labelledby="maTitle">' +
    '<div class="modalHeader"><h3 id="maTitle">¿Quitar esta misión?</h3><button class="modalCloseBtn hover-scale focus-glow" id="maClose" type="button" aria-label="Cerrar">✕</button></div>' +
    '<p class="maTx">Las misiones son especiales: <b>' + esc(MODES[m.active.mode].name) + '</b> te da <b>+' + MODES[m.active.mode].xp + ' XP</b> una sola vez.</p>' +
    '<p class="maTx">Si la <b>pierdes</b>, no ganas la recompensa y la siguiente tardará 5 días en aparecer.</p>' +
    '<div class="maBtns"><button type="button" class="nav hover-scale focus-glow" id="maLater">Realizar más tarde</button>' +
    '<button type="button" class="nav maLose hover-scale focus-glow" id="maLose">Perder misión</button></div></div>';
  document.body.appendChild(o);
  const close = () => { o.remove(); document.removeEventListener('keydown', onKey); try{ from && from.focus({ preventScroll: true }); }catch(e){} };
  const onKey = e => { if(e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  o.addEventListener('click', e => { if(e.target === o || e.target.closest('#maClose')) close(); });
  o.querySelector('#maLater').onclick = () => { try{ sessionStorage.setItem('vocabri_mission_snooze', m.active.id); }catch(e){} close(); renderMissionBanner(); showToast('La misión te espera: vuelve a aparecer cuando abras la app de nuevo.', '⏳'); };
  o.querySelector('#maLose').onclick = () => { saveMissions(abandonMission(loadMissions(), Date.now())); close(); renderMissionBanner(); showToast('Misión perdida. La siguiente llegará en 5 días.', '💨'); };
  o.querySelector('#maLater').focus({ preventScroll: true });
}

// Aviso en el mapa: la misión activa espera aquí hasta que se completa.
function leftTxt(a){ const n = daysLeft(a, Date.now()); return n <= 1 ? '¡ÚLTIMO DÍA!' : 'QUEDAN ' + n + ' DÍAS'; }

export function renderMissionBanner(){
  const host = document.getElementById('stageMapView');
  if(!host) return;
  let box = document.getElementById('missionBanner');
  if(!box){
    box = document.createElement('div'); box.id = 'missionBanner';
    const wrap = document.getElementById('pathWrap');
    host.insertBefore(box, wrap || null);
  }
  let m = loadMissions();
  const aged = expireIfNeeded(m, Date.now());
  if(aged !== m){ m = aged; saveMissions(m); }
  if(shouldStart(m, Date.now(), seenCount())){ m = startMission(m, Date.now(), currentCat()); saveMissions(m); }
  let snoozed = false; try{ snoozed = !!m.active && sessionStorage.getItem('vocabri_mission_snooze') === m.active.id; }catch(e){}
  if(!m.active || snoozed){ box.hidden = true; box.innerHTML = ''; return; }
  const d = MODES[m.active.mode];
  box.hidden = false;
  box.innerHTML = '<div class="missionWrap"><button type="button" class="missionCard hover-scale focus-glow" id="missionGoBtn" aria-label="Misión especial: ' + esc(d.name) + '">' +
    '<span class="missionIc" aria-hidden="true">' + missionIconSvg(m.active.mode, 40) + '</span>' +
    '<span class="missionTx"><small>MISIÓN ESPECIAL · ' + leftTxt(m.active) + '</small><b>' + esc(d.name) + '</b><span>' + esc(d.blurb) + '</span></span>' +
    '<span class="missionXp">+' + d.xp + ' XP</span></button>' +
    '<button type="button" class="missionX hover-scale focus-glow" id="missionXBtn" aria-label="Quitar la misión" aria-haspopup="dialog">' + CLOSE_SVG + '</button></div>';
  document.getElementById('missionGoBtn').onclick = openMission;
  document.getElementById('missionXBtn').onclick = e => { e.stopPropagation(); askDismiss(e.currentTarget); };
}

// ── Vista de juego ──
let G = null;   // { mission, rounds, idx, ok, answer:[tile], bank:[tile], checked }

function hideAll(){
  ['cardsView', 'examView'].forEach(id => { const e = document.getElementById(id); if(e) e.style.display = 'none'; });
}
let TICK = null;
function stopTimer(){ if(TICK){ clearInterval(TICK); TICK = null; } }
export function closeMission(){
  stopTimer();
  const v = document.getElementById('missionView'); if(v) v.style.display = 'none';
  G = null;
  const c = document.getElementById('cardsView'); if(c) c.style.display = '';
  showMap();
}

export function openMission(){
  let m = loadMissions();
  const aged = expireIfNeeded(m, Date.now());
  if(aged !== m){ saveMissions(aged); m = aged; try{ renderMissionBanner(); }catch(e){} showToast('Esa misión ya venció. La siguiente llegará en unos días.', '⌛'); return; }
  if(!m.active || !MODES[m.active.mode]) return;
  const mode = m.active.mode, cat = m.active.cat;
  let items = itemsFor(cat);
  if(!items.length) items = itemsFor('Todas');
  const seenKeys = items.filter(it => { const r = readStored(it[3]); return r.reps > 0 || r.m; }).map(it => it[3]);
  let rounds = [];
  if(mode === 'order') rounds = buildOrderRound(items, seenKeys, ORDER_ROUNDS);
  else if(mode === 'register'){
    rounds = buildRegisterRound(items, seenKeys, REG_ROUNDS);
    if(rounds.length < 6) rounds = buildRegisterRound(itemsFor('Todas'), seenKeys, REG_ROUNDS);
  }
  else if(mode === 'time') rounds = buildTimeRound(items.length >= 12 ? items : itemsFor('Todas'), seenKeys);
  else if(mode === 'survival') rounds = buildSurvivalRound(items.length >= 12 ? items : itemsFor('Todas'), seenKeys);
  if(rounds.length < (mode === 'time' ? 12 : mode === 'survival' ? SURV_GOAL : 4)){ showToast('Aún no hay frases suficientes para esta misión.', '🧩'); return; }
  G = { mode, mission: m.active, rounds, idx: 0, ok: 0, answer: [], bank: mode === 'order' ? rounds[0].tiles.slice() : [], checked: false };
  hideAll();
  const ttl = document.getElementById('missionTitle'); if(ttl) ttl.innerHTML = missionIconSvg(m.active.mode, 30) + '<span>' + esc(MODES[m.active.mode].name) + '</span>';
  const back = document.getElementById('missionBackBtn'); if(back) back.onclick = closeMission;
  document.getElementById('missionView').style.display = '';
  if(mode === 'time'){ G.deadline = 0; return renderTimeIntro(); }
  if(mode === 'survival'){ G.lives = SURV_LIVES; return renderSurvIntro(); }
  renderRound();
}

function bar(){
  if(G.mode === 'survival'){ const t = document.getElementById('missionProgText'); if(t) t.textContent = 'Aciertos: ' + G.ok + ' de ' + SURV_GOAL; const f = document.getElementById('missionBar'); if(f) f.style.width = Math.round(G.ok / SURV_GOAL * 100) + '%'; return; }
  if(G.mode === 'time'){ const t = document.getElementById('missionProgText'); if(t) t.textContent = 'Aciertos: ' + G.ok + ' de ' + TIME_GOAL; return; }
  const f = document.getElementById('missionBar'); if(f) f.style.width = Math.round(G.idx / G.rounds.length * 100) + '%';
  const t = document.getElementById('missionProgText'); if(t) t.textContent = 'Frase ' + Math.min(G.idx + 1, G.rounds.length) + ' de ' + G.rounds.length + ' · ' + G.ok + ' bien';
}

function tileHtml(x, where){
  return '<button type="button" class="mTile hover-scale focus-glow" data-w="' + where + '" data-i="' + x.i + '">' + esc(x.t) + '</button>';
}

const REG_NAMES = { formal: 'Formal', normal: 'Normal', informal: 'Informal' };
const REG_HINT = { formal: 'con respeto o en un entorno serio', normal: 'el día a día, con cualquiera', informal: 'con amigos y en confianza' };

function renderRegRound(){
  const card = document.getElementById('missionCard');
  const r = G.rounds[G.idx];
  bar();
  card.innerHTML =
    '<p class="examInstruction">¿En qué registro está dicha esta frase?</p>' +
    '<p class="examPrompt">' + esc(r.en) + '</p><p class="hint" style="text-align:center; margin:0 0 12px;">' + esc(r.es) + '</p>' +
    '<div class="mRegBtns" role="group" aria-label="Elige el registro">' +
    ['formal', 'normal', 'informal'].map(k => '<button type="button" class="nav mReg mReg_' + k + ' hover-scale focus-glow" data-reg="' + k + '"><b>' + REG_NAMES[k] + '</b><small>' + REG_HINT[k] + '</small></button>').join('') + '</div>' +
    '<p class="examFeedback" id="mFeedback" role="status" aria-live="polite" style="display:none;"></p>' +
    '<div class="mRegRows" id="mRegRows"></div>' +
    '<button type="button" class="nav hover-scale focus-glow" id="mNext" style="width:100%; margin-top:10px; display:none;">Siguiente →</button>';
  card.querySelectorAll('.mReg').forEach(b => b.onclick = () => answerReg(b.dataset.reg));
}

function answerReg(pick){
  if(!G || G.checked) return;
  const r = G.rounds[G.idx], good = pick === r.answer;
  G.checked = true; if(good) G.ok++;
  try{ playSfx(good ? 'correct' : 'wrong'); }catch(e){}
  document.querySelectorAll('#missionCard .mReg').forEach(b => {
    b.disabled = true;
    if(b.dataset.reg === r.answer) b.classList.add('isRight');
    else if(b.dataset.reg === pick) b.classList.add('isWrong');
  });
  const fb = document.getElementById('mFeedback');
  fb.style.display = ''; fb.className = 'examFeedback ' + (good ? 'ok' : 'bad');
  fb.innerHTML = good ? '✅ ¡Bien visto! Es <b>' + REG_NAMES[r.answer] + '</b>.' : '❌ Era <b>' + REG_NAMES[r.answer] + '</b>.';
  document.getElementById('mRegRows').innerHTML = r.rows.map(x => '<div class="mRegRow' + (x.mine ? ' isMine' : '') + '"><span>' + esc(x.label) + '</span><b>' + esc(x.text) + '</b></div>').join('');
  try{ speak(r.en, 'en-US'); }catch(e){}
  bar();
  const nx = document.getElementById('mNext');
  nx.style.display = ''; nx.textContent = G.idx + 1 >= G.rounds.length ? 'Ver resultado' : 'Siguiente →';
  nx.onclick = next; nx.focus({ preventScroll: true });
}

function renderTimeIntro(){
  bar();
  const f = document.getElementById('missionBar'); if(f) f.style.width = '0%';
  document.getElementById('missionCard').innerHTML =
    '<p class="examInstruction">Traduce al inglés lo más rápido que puedas.</p>' +
    '<p class="examPrompt" style="margin-top:6px;">' + TIME_GOAL + ' aciertos en ' + TIME_SECONDS + ' segundos</p>' +
    '<p class="hint" style="text-align:center;">Cada fallo te quita ' + TIME_PENALTY + ' segundos. El reloj empieza cuando pulses «¡Ya!».</p>' +
    '<button type="button" class="nav hover-scale focus-glow" id="mGo" style="width:100%; margin-top:14px;">¡Ya!</button>';
  const go = document.getElementById('mGo'); go.onclick = startTime; go.focus({ preventScroll: true });
}

function startTime(){
  G.idx = 0; G.ok = 0; G.checked = false; G.wrong = 0;
  G.deadline = Date.now() + TIME_SECONDS * 1000;
  renderTimeQ();
  stopTimer();
  TICK = setInterval(tickTime, 100);
}

function tickTime(){
  if(!G || G.mode !== 'time'){ stopTimer(); return; }
  const left = Math.max(0, G.deadline - Date.now());
  const f = document.getElementById('missionBar');
  if(f) f.style.width = Math.round(left / (TIME_SECONDS * 1000) * 100) + '%';
  const t = document.getElementById('missionClock');
  if(t){ t.textContent = Math.ceil(left / 1000) + ' s'; t.classList.toggle('isLow', left <= 10000); }
  if(left <= 0){ stopTimer(); finish(); }
}

function renderTimeQ(){
  const q = G.rounds[G.idx % G.rounds.length];
  bar();
  document.getElementById('missionCard').innerHTML =
    '<div class="mClockRow"><span class="mClock" id="missionClock" role="timer" aria-live="off">' + Math.ceil(Math.max(0, G.deadline - Date.now()) / 1000) + ' s</span></div>' +
    '<p class="examPrompt">' + esc(q.es) + '</p>' +
    '<div class="mRegBtns" role="group" aria-label="Elige la traducción">' +
    q.options.map((o, i) => '<button type="button" class="nav mOpt hover-scale focus-glow" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div>';
  document.querySelectorAll('#missionCard .mOpt').forEach(b => b.onclick = () => answerTime(Number(b.dataset.i)));
}

function answerTime(i){
  if(!G || G.checked || G.mode !== 'time') return;
  const q = G.rounds[G.idx % G.rounds.length], good = i === q.answer;
  G.checked = true;
  if(good) G.ok++; else G.deadline -= TIME_PENALTY * 1000;
  try{ playSfx(good ? 'correct' : 'wrong'); }catch(e){}
  document.querySelectorAll('#missionCard .mOpt').forEach(b => {
    b.disabled = true;
    const k = Number(b.dataset.i);
    if(k === q.answer) b.classList.add('isRight'); else if(k === i) b.classList.add('isWrong');
  });
  bar();
  if(G.ok >= TIME_GOAL){ stopTimer(); setTimeout(() => { if(G) finish(); }, 350); return; }
  setTimeout(() => {
    if(!G || G.mode !== 'time' || !TICK) return;
    if(G.deadline - Date.now() <= 0) return;      // el reloj ya cerró la partida
    G.idx++; G.checked = false; renderTimeQ();
  }, good ? 260 : 650);
}

// ── Supervivencia ──
const HEART = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" fill="currentColor" stroke="#7a1a1a" stroke-width="2" stroke-linejoin="round"/></svg>';
function heartsHtml(){
  let h = '';
  for(let i = 0; i < SURV_LIVES; i++) h += '<span class="mHeart' + (i < G.lives ? '' : ' isLost') + '">' + HEART + '</span>';
  return '<div class="mHearts" role="img" aria-label="' + G.lives + ' de ' + SURV_LIVES + ' vidas">' + h + '</div>';
}

function renderSurvIntro(){
  bar();
  document.getElementById('missionCard').innerHTML =
    '<p class="examInstruction">Sobrevive a las preguntas.</p>' +
    '<p class="examPrompt" style="margin-top:6px;">' + SURV_GOAL + ' aciertos sin perder las ' + SURV_LIVES + ' vidas</p>' + heartsHtml() +
    '<p class="hint" style="text-align:center;">Se mezclan traducciones y preguntas de registro (formal / normal / informal). Cada fallo te quita una vida.</p>' +
    '<button type="button" class="nav hover-scale focus-glow" id="mGo" style="width:100%; margin-top:14px;">Empezar</button>';
  const go = document.getElementById('mGo'); go.onclick = () => { G.idx = 0; G.ok = 0; G.lives = SURV_LIVES; G.checked = false; renderSurvQ(); }; go.focus({ preventScroll: true });
}

function renderSurvQ(){
  const q = G.rounds[G.idx];
  bar();
  let body;
  if(q.type === 'reg'){
    body = '<p class="examInstruction">¿En qué registro está dicha esta frase?</p><p class="examPrompt">' + esc(q.en) + '</p><p class="hint" style="text-align:center; margin:0;">' + esc(q.es) + '</p>' +
      '<div class="mRegBtns" role="group" aria-label="Elige el registro">' +
      ['formal', 'normal', 'informal'].map(k => '<button type="button" class="nav mReg mReg_' + k + ' hover-scale focus-glow" data-reg="' + k + '"><b>' + REG_NAMES[k] + '</b><small>' + REG_HINT[k] + '</small></button>').join('') + '</div>';
  } else {
    body = '<p class="examInstruction">Elige la traducción al inglés:</p><p class="examPrompt">' + esc(q.es) + '</p>' +
      '<div class="mRegBtns" role="group" aria-label="Elige la traducción">' + q.options.map((o, i) => '<button type="button" class="nav mOpt hover-scale focus-glow" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div>';
  }
  document.getElementById('missionCard').innerHTML = heartsHtml() + body;
  document.querySelectorAll('#missionCard .mReg').forEach(b => b.onclick = () => answerSurv(b.dataset.reg));
  document.querySelectorAll('#missionCard .mOpt').forEach(b => b.onclick = () => answerSurv(Number(b.dataset.i)));
}

function answerSurv(pick){
  if(!G || G.checked || G.mode !== 'survival') return;
  const q = G.rounds[G.idx], good = q.type === 'reg' ? pick === q.answer : pick === q.answer;
  G.checked = true;
  if(good) G.ok++; else G.lives--;
  try{ playSfx(good ? 'correct' : 'wrong'); }catch(e){}
  document.querySelectorAll('#missionCard .mReg, #missionCard .mOpt').forEach(b => {
    b.disabled = true;
    const v = q.type === 'reg' ? b.dataset.reg : Number(b.dataset.i);
    if(v === q.answer) b.classList.add('isRight'); else if(v === pick) b.classList.add('isWrong');
  });
  const hs = document.querySelector('#missionCard .mHearts'); if(hs) hs.outerHTML = heartsHtml();
  bar();
  const over = G.ok >= SURV_GOAL || G.lives <= 0 || G.idx + 1 >= G.rounds.length;
  setTimeout(() => {
    if(!G || G.mode !== 'survival') return;
    if(over) return finish();
    G.idx++; G.checked = false; renderSurvQ();
  }, good ? 450 : 1100);
}

function renderRound(){
  if(G.mode === 'register') return renderRegRound();
  const card = document.getElementById('missionCard');
  const r = G.rounds[G.idx];
  bar();
  card.innerHTML =
    '<p class="examInstruction">Coloca las palabras en inglés en el orden correcto:</p>' +
    '<p class="examPrompt">' + esc(r.es) + '</p>' +
    '<div class="mAnswer" id="mAnswer" aria-label="Tu frase" aria-live="polite">' + (G.answer.length ? G.answer.map(x => tileHtml(x, 'a')).join('') : '<span class="mHint">Toca las palabras de abajo</span>') + '</div>' +
    '<div class="mBank" id="mBank" aria-label="Palabras disponibles">' + G.bank.map(x => tileHtml(x, 'b')).join('') + '</div>' +
    '<button type="button" class="nav hover-scale focus-glow" id="mCheck" style="width:100%; margin-top:14px;"' + (G.bank.length ? ' disabled' : '') + '>Comprobar</button>' +
    '<p class="examFeedback" id="mFeedback" role="status" aria-live="polite" style="display:none;"></p>' +
    '<button type="button" class="nav hover-scale focus-glow" id="mNext" style="width:100%; margin-top:10px; display:none;">Siguiente →</button>';
  card.querySelectorAll('.mTile').forEach(b => b.onclick = () => moveTile(b.dataset.w, Number(b.dataset.i)));
  card.querySelector('#mCheck').onclick = check;
}

function moveTile(where, i){
  if(!G || G.checked) return;
  const from = where === 'b' ? G.bank : G.answer, to = where === 'b' ? G.answer : G.bank;
  const at = from.findIndex(x => x.i === i); if(at < 0) return;
  to.push(from.splice(at, 1)[0]);
  if(where === 'a') G.bank = G.rounds[G.idx].tiles.filter(x => G.bank.some(y => y.i === x.i));   // conserva el orden mezclado original
  renderRound();
  const b = document.querySelector('#mBank .mTile') || document.querySelector('#mAnswer .mTile'); if(b) b.focus({ preventScroll: true });
}

function check(){
  if(!G || G.checked || G.bank.length) return;
  const r = G.rounds[G.idx];
  const good = checkOrder(r.tokens, G.answer.map(x => x.t));
  G.checked = true; if(good) G.ok++;
  try{ playSfx(good ? 'correct' : 'wrong'); }catch(e){}
  const fb = document.getElementById('mFeedback');
  fb.style.display = ''; fb.className = 'examFeedback ' + (good ? 'ok' : 'bad');
  fb.innerHTML = good ? '✅ ¡Correcto!' : '❌ Era: <b>' + esc(r.en) + '</b>';
  document.querySelectorAll('#missionCard .mTile').forEach(b => b.disabled = true);
  document.getElementById('mCheck').style.display = 'none';
  try{ speak(r.en, 'en-US'); }catch(e){}
  bar();
  const nx = document.getElementById('mNext');
  nx.style.display = ''; nx.textContent = G.idx + 1 >= G.rounds.length ? 'Ver resultado' : 'Siguiente →';
  nx.onclick = next; nx.focus({ preventScroll: true });
}

function next(){
  if(!G) return;
  if(G.idx + 1 >= G.rounds.length) return finish();
  G.idx++; G.answer = []; G.bank = G.mode === 'order' ? G.rounds[G.idx].tiles.slice() : []; G.checked = false;
  renderRound();
}

function finish(){
  stopTimer();
  const isTime = G.mode === 'time', isSurv = G.mode === 'survival';
  const total = isTime ? TIME_GOAL : isSurv ? SURV_GOAL : G.rounds.length, need = isTime ? TIME_GOAL : isSurv ? SURV_GOAL : Math.min(G.mode === 'register' ? REG_PASS : ORDER_PASS, total), pass = G.ok >= need;
  const d = MODES[G.mission.mode];
  let gained = 0;
  if(pass){
    const m = loadMissions();
    if(m.active && m.active.id === G.mission.id){
      saveMissions(completeMission(m, Date.now(), G.ok));
      gained = awardXp(d.xp, { source: 'mission', key: G.mission.id });
      try{ refreshCollection(); }catch(e){}
    }
  }
  if(!isTime && !isSurv) G.idx = total;
  bar();
  if(isTime){ const f = document.getElementById('missionBar'); if(f) f.style.width = '100%'; }
  const card = document.getElementById('missionCard');
  card.innerHTML = '<span class="tag">' + (pass ? '🏆 MISIÓN CUMPLIDA' : (isTime ? '⏱️ SE ACABÓ EL TIEMPO' : isSurv ? '💔 SIN VIDAS' : '💪 CASI')) + '</span>' +
    '<p class="examPrompt" style="margin-top:14px;">' + (isTime || isSurv ? G.ok + ' aciertos' : G.ok + ' de ' + total + ' bien') + '</p>' +
    '<p class="hint" style="text-align:center;">' + (pass ? ('¡Lo lograste! ' + (gained ? '+' + gained + ' XP. ' : '') + 'La próxima misión llegará al mapa en 5 días.') : (isTime ? 'Necesitas ' + need + ' aciertos antes de que acabe el tiempo.' : isSurv ? 'Necesitas ' + need + ' aciertos sin quedarte sin vidas.' : 'Necesitas ' + need + ' para cumplirla.')+ ' La misión te espera en el mapa: inténtalo otra vez cuando quieras.') + '</p>' +
    (pass ? '' : '<button type="button" class="nav hover-scale focus-glow" id="mRetry" style="width:100%;">Reintentar</button>') +
    '<button type="button" class="nav hover-scale focus-glow" id="mMap" style="width:100%; margin-top:10px;">Volver al mapa</button>';
  const rt = card.querySelector('#mRetry'); if(rt) rt.onclick = openMission;
  card.querySelector('#mMap').onclick = closeMission;
  if(pass){ try{ playSfx('levelup'); }catch(e){} }
}

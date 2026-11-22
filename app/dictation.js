// Vocabri — modo de práctica "Escucha y escribe" (dictado con velocidad variable).
// Vista independiente: se abre desde Repaso (cabecera, pantalla vacía y resumen). No toca el calendario de repaso (SRS) ni guarda historial;
// solo recuerda la velocidad elegida (ci_dict_rate) y da un poco de XP por acierto.
import { S } from './core/shared.js';
import { isMastered, mapItemsFor, readStored } from './core/dataRegistry.js';
import { SpeechRec, SPEECH_REC_SUPPORTED, TTS_SUPPORTED, closeCallSuffix, evaluateWrittenAnswer, isSpeakable, nearMissNote } from './exam.js';
import { escapeHtml } from './myCards.js';
import { diffWords } from './core/wordDiff.js';
import { buildDiffEl } from './wordDiffUi.js';
import { haptic, playSfx, speak } from './speech.js';
import { _ni, _niW, addScrollTopBtn, awardXp, scrollTopNow, switchView } from './ui.js';
import { catLabel } from './core/dataRegistry.js';
import { isJa } from './lang.js';
import { romajiMatches, stripRuby } from './core/course.js';

// Bocina cartoon (mismo estilo que los iconos de la barra inferior), en el teal del modo
const DICT_ICON = _ni('#2DD4BF', '#0B6B60',
  '<path d="M4.2 10.4h4.4L15 4.8v18.4l-6.4-5.6H4.2A1.7 1.7 0 0 1 2.5 15.9v-3.8a1.7 1.7 0 0 1 1.7-1.7z"/>' +
  '<path class="niLn" d="M18.9 10a5.4 5.4 0 0 1 0 8"/><path class="niLn" d="M22.2 6.6a10 10 0 0 1 0 14.8"/>',
  '<path d="M5 12.6h3.2" ' + _niW + ' stroke-opacity=".6" stroke-width="1.8"/>');

export const DICT_ROUND_SIZE = 10;
export const DICT_MIN_POOL = 6;
export const DICT_XP = 5;
export const DICT_SPEEDS = [
  { rate: 0.5,  label: '🐌', name: 'Muy lento' },
  { rate: 0.7,  label: '🐢', name: 'Lento' },
  { rate: 0.95, label: '🚶', name: 'Normal' },
  { rate: 1.2,  label: '🐇', name: 'Rápido' }
];

const RATE_KEY = 'ci_dict_rate';
let D = null;   // estado de la ronda actual

export function getDictRate(){
  try{
    const v = parseFloat(localStorage.getItem(RATE_KEY));
    if(DICT_SPEEDS.some(s => s.rate === v)) return v;
  }catch(e){}
  return 0.95;
}
export function setDictRate(v){ try{ localStorage.setItem(RATE_KEY, String(v)); }catch(e){} }

// Frases "dictables" de la categoría actual: primero las que ya has visto; si hay pocas, las primeras de la categoría.
export const dictRead = it => String(it[9] || '').trim();
export const dictShown = it => isJa() ? stripRuby(String(it[0])) : String(it[0]);
export function dictationPool(cat){
  const items = mapItemsFor(cat).filter(it => isJa() ? !!dictRead(it) : isSpeakable(it));
  const seen = items.filter(it => { const s = readStored(it[3]); return s.reps > 0 || s.lvl > 0 || s.m; });
  return seen.length >= DICT_MIN_POOL ? seen : items.slice(0, Math.max(DICT_MIN_POOL, 24));
}
export function pickRound(pool, n = DICT_ROUND_SIZE, rnd = Math.random){
  const a = pool.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(n, a.length));
}
export function dictationTarget(it){ if(isJa()) return stripRuby(String(it[0])); return (String(it[0]).split('/')[0] || it[0]).trim(); }

function ensureView(){
  let v = document.getElementById('dictView');
  if(v) return v;
  v = document.createElement('div');
  v.id = 'dictView';
  v.style.display = 'none';
  v.innerHTML =
    '<div class="dictHead"><button class="miniBtn hover-scale focus-glow" id="dictBackBtn" type="button" aria-label="Volver a Repaso">←</button>' +
    '<h2 class="dictTitle"><span class="tabIcon" aria-hidden="true">' + DICT_ICON + '</span><span class="rvTitleText">Escucha y escribe</span></h2></div>' +
    '<p class="hint dictSub" id="dictSub"></p>' +
    '<div id="dictPlay">' +
      '<div class="dictPips" id="dictPips" role="progressbar" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0" aria-label="Progreso de la ronda"></div>' +
      '<p class="dictCount" id="dictCount"></p>' +
      '<div class="dictCard">' +
        '<button class="dictPlayBtn focus-glow" id="dictPlayBtn" type="button" aria-label="Escuchar la frase"><span class="dictWave" aria-hidden="true"></span><span class="dictPlayIc" aria-hidden="true">🔊</span></button>' +
        '<p class="dictPlayLbl">Toca para escuchar de nuevo</p>' +
        '<div class="dictSpeed" id="dictSpeed" role="radiogroup" aria-label="Velocidad de la voz"></div>' +
        '<input type="text" id="dictInput" class="dictInput focus-glow" placeholder="Escribe lo que oyes, en inglés..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" lang="en" aria-label="Escribe la frase que escuchaste">' +
        '<button class="nav dictCheck hover-scale focus-glow" id="dictCheckBtn" type="button">Verificar</button>' +
        '<button class="linkBtn hover-scale focus-glow" id="dictSkipBtn" type="button">No lo sé, ver respuesta</button>' +
        '<div class="dictFeedback" id="dictFeedback" role="status" aria-live="polite"></div>' +
      '</div>' +
      '<button class="nav dictNext hover-scale focus-glow" id="dictNextBtn" type="button" style="display:none;">Siguiente →</button>' +
    '</div>' +
    '<div id="dictDone" style="display:none;"></div>';
  const anchor = document.getElementById('tableView');
  anchor.parentNode.insertBefore(v, anchor);
  return v;
}

function renderSpeed(){
  const box = document.getElementById('dictSpeed');
  const cur = getDictRate();
  box.innerHTML = DICT_SPEEDS.map(s =>
    '<button type="button" role="radio" title="' + s.name + '" class="dictSpd focus-glow' + (s.rate === cur ? ' sel' : '') + '" aria-checked="' + (s.rate === cur) + '" data-rate="' + s.rate + '">' +
    '<span aria-hidden="true">' + s.label + '</span><small>' + s.name + '</small></button>').join('');
  box.querySelectorAll('.dictSpd').forEach(b => b.onclick = () => {
    setDictRate(parseFloat(b.dataset.rate)); renderSpeed(); playCurrent();
  });
}

function renderPips(){
  const box = document.getElementById('dictPips');
  if(!box || !D) return;
  box.setAttribute('aria-valuemax', String(D.items.length));
  box.setAttribute('aria-valuenow', String(D.idx));
  box.innerHTML = D.items.map((_, i) => {
    const st = D.results[i];
    return '<span class="dictPip' + (st === true ? ' ok' : st === false ? ' bad' : '') + (i === D.idx ? ' cur' : '') + '"></span>';
  }).join('');
}

function pulsePlay(text, rate){
  const b = document.getElementById('dictPlayBtn');
  if(!b) return;
  b.classList.add('playing');
  clearTimeout(pulsePlay.t);
  pulsePlay.t = setTimeout(() => b.classList.remove('playing'), Math.min(9000, 900 + String(text).length * 75 / (rate || 1)));
}

function playCurrent(){
  if(!D) return;
  haptic();
  const txt = dictationTarget(D.items[D.idx]);
  if(isJa()) speak(txt, 'ja-JP', getDictRate(), { rom: dictRead(D.items[D.idx]) }); else speak(txt, 'en-US', getDictRate());
  pulsePlay(txt, getDictRate());
}

function showQuestion(){
  const total = D.items.length;
  document.getElementById('dictCount').textContent = 'Frase ' + (D.idx + 1) + ' de ' + total + ' · ' + D.ok + (D.ok === 1 ? ' acierto' : ' aciertos');
  renderPips();
  const input = document.getElementById('dictInput');
  input.value = ''; input.disabled = false;
  input.placeholder = isJa() ? 'Escribe lo que oyes en romaji (o en japonés)...' : 'Escribe lo que oyes, en inglés...'; input.lang = isJa() ? 'ja' : 'en';
  document.getElementById('dictFeedback').innerHTML = '';
  document.getElementById('dictFeedback').className = 'dictFeedback';
  document.getElementById('dictCheckBtn').style.display = '';
  document.getElementById('dictSkipBtn').style.display = '';
  document.getElementById('dictNextBtn').style.display = 'none';
  D.answered = false;
  setTimeout(() => { playCurrent(); try{ input.focus({preventScroll:true}); }catch(e){} }, 150);
}

function diffHtml(typed){
  if(isJa()) return '';
  const segs = diffWords(typed, D.items[D.idx][0]);
  if(!segs.length) return '';
  const tag = (cls, txt, title) => '<span class="dw ' + cls + '"' + (title ? ' title="' + escapeHtml(title) + '"' : '') + '>' + escapeHtml(txt) + '</span>';
  const line = segs.map(x => x.s === 'ok' ? tag('ok', x.t)
    : x.s === 'wrong' ? tag('wrong', x.t, 'Era: ' + x.w)
    : x.s === 'extra' ? tag('extra', x.t, 'Sobra')
    : tag('missing', '___', 'Falta: ' + x.w)).join(' ');
  const fix = segs.filter(x => x.s === 'wrong' || x.s === 'missing').map(x => (x.s === 'wrong' ? x.t + ' → ' : 'falta: ') + x.w.replace(/[?!.,;:]+$/, '')).slice(0, 4);
  return '<span class="dictYou"><em>Tú escribiste</em>' + line + '</span>' + (fix.length ? '<small class="dictFix">' + escapeHtml(fix.join(' · ')) + '</small>' : '');
}

// «Ahora dila tú»: práctica opcional de pronunciación; no suma XP, no cuenta acierto ni toca el repaso.
function addSayStep(body){
  if(!SPEECH_REC_SUPPORTED || !body || isJa()) return;
  const box = document.createElement('div'); box.className = 'dictSay';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dictSayBtn hover-scale focus-glow';
  btn.textContent = '🎤 Ahora dila tú';
  const out = document.createElement('div'); out.className = 'dictSayOut'; out.setAttribute('aria-live', 'polite');
  const target = D.items[D.idx][0];
  btn.onclick = () => {
    let rec;
    try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); rec = new SpeechRec(); }catch(e){ return; }
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 3;
    btn.disabled = true; btn.textContent = '🎤 Escuchando…'; out.textContent = '';
    const done = (heard) => {
      btn.disabled = false; btn.textContent = '🎤 Intentar otra vez'; out.textContent = '';
      if(!heard){ out.textContent = 'No te escuchamos. Revisa el micrófono e inténtalo otra vez.'; return; }
      const segs = diffWords(heard, String(target).split('/')[0]);
      out.appendChild(buildDiffEl(segs, 'Te escuchamos'));
      if(segs.every(x => x.s === 'ok')){ const g = document.createElement('small'); g.textContent = '¡Se entendió perfecto!'; out.appendChild(g); }
    };
    let got = '';
    rec.onresult = ev => { try{ got = ev.results[0][0].transcript; }catch(e){} };
    rec.onerror = () => { done(''); got = null; };
    rec.onend = () => { if(got !== null) done(got); };
    try{ rec.start(); }catch(e){ done(''); }
  };
  box.append(btn, out); body.appendChild(box);
}

function resolve(ok, r, skipped, typed){
  if(D.answered) return;
  D.answered = true;
  try{ if(TTS_SUPPORTED) window.speechSynthesis.cancel(); }catch(e){}
  D.results[D.idx] = !!ok;
  renderPips();
  document.getElementById('dictPlayBtn').classList.remove('playing');
  const it = D.items[D.idx];
  const fb = document.getElementById('dictFeedback');
  if(ok){ D.ok++; const g = awardXp(DICT_XP, { source: 'dictation', key: it[3] }); D.xp = (D.xp || 0) + g; D.noXp = (D.noXp || 0) + (g ? 0 : 1); playSfx('correct'); }
  else { D.fails.push(it); playSfx('wrong'); }
  fb.className = 'dictFeedback ' + (ok ? 'good' : 'bad');
  const title = ok ? '¡Correcto!' : (skipped ? 'Esta era la frase' : (r && r.similarity >= 0.6 ? 'Casi lo tienes' : 'No era esa'));
  fb.innerHTML = '<span class="dictFbIc" aria-hidden="true">' + (ok ? '✅' : skipped ? '👀' : '❌') + '</span>' +
    '<div class="dictFbBody"><b class="dictFbTitle">' + title + '</b>' +
    (!ok && !skipped && typed ? diffHtml(typed) : '') +
    '<span class="dictEn">' + escapeHtml(dictShown(it)) + '</span>' + (isJa() ? '<span class="dictEn" style="font-size:.85em;opacity:.8">' + escapeHtml(dictRead(it)) + '</span>' : '') + '<span class="dictEs">' + escapeHtml(it[1]) + '</span>' +
    (!ok && !(typed && !skipped) && r && closeCallSuffix(r) ? '<small>' + escapeHtml(closeCallSuffix(r).replace(/^ \(|\)$/g, '')) + '</small>' : '') +
    (ok && r && nearMissNote(r) ? '<small>' + escapeHtml(nearMissNote(r)) + '</small>' : '') + '</div>';
  addSayStep(fb.querySelector('.dictFbBody'));
  document.getElementById('dictInput').disabled = true;
  document.getElementById('dictCheckBtn').style.display = 'none';
  document.getElementById('dictSkipBtn').style.display = 'none';
  const next = document.getElementById('dictNextBtn');
  next.textContent = (D.idx + 1 >= D.items.length) ? 'Ver resultado' : 'Siguiente →';
  next.style.display = '';
  next.focus();
}

function finish(){
  document.getElementById('dictPlay').style.display = 'none';
  const done = document.getElementById('dictDone');
  const total = D.items.length, pct = total ? Math.round(D.ok / total * 100) : 0;
  const msg = pct === 100 ? '¡Oído de águila! 🦅' : pct >= 70 ? '¡Muy bien! Tu oído mejora.' : 'Sigue practicando: cada ronda cuenta.';
  done.innerHTML =
    '<div class="dictSummary"><div class="dictRing" style="--p:' + pct + '"><b>' + D.ok + '/' + total + '</b><span>' + pct + '%</span></div><p class="dictMsg">' + msg + '</p>' +
    '<p class="dictXp">+' + (D.xp || 0) + ' XP' + (D.noXp ? ' <small>(' + D.noXp + (D.noXp === 1 ? ' frase ya cobrada hoy o tope diario' : ' frases ya cobradas hoy o tope diario') + ')</small>' : '') + '</p>' +
    (D.fails.length ? '<div class="dictFails"><b>Para repasar:</b><ul>' + D.fails.map(it => '<li>' + escapeHtml(dictShown(it)) + (isJa() ? ' (' + escapeHtml(dictRead(it)) + ')' : '') + ' — <i>' + escapeHtml(it[1]) + '</i></li>').join('') + '</ul></div>' : '') +
    '<button class="nav dictCheck hover-scale focus-glow" id="dictAgainBtn" type="button">🔁 Otra ronda</button>' +
    '<button class="nav examFailBack hover-scale focus-glow" id="dictExitBtn" type="button" style="width:100%;margin-top:8px;">Volver a Repaso</button></div>';
  done.style.display = '';
  document.getElementById('dictAgainBtn').onclick = () => startDictation();
  document.getElementById('dictExitBtn').onclick = closeDictation;
}

export function startDictation(){
  const view = ensureView();
  const cat = S.currentCat;
  document.getElementById('reviewView').style.display = 'none';
  view.style.display = '';
  document.getElementById('dictDone').style.display = 'none';
  document.getElementById('dictPlay').style.display = '';
  document.getElementById('dictSub').textContent = catLabel(cat) + (isJa() ? ' · escucha y escribe en romaji' : ' · escucha, escribe y ajusta la velocidad');
  if(!TTS_SUPPORTED){
    document.getElementById('dictPlay').style.display = 'none';
    const done = document.getElementById('dictDone');
    done.style.display = '';
    done.innerHTML = '<p class="hint">Tu navegador no tiene síntesis de voz, así que este modo no está disponible aquí.</p>';
    return;
  }
  const pool = dictationPool(cat);
  if(!pool.length){
    document.getElementById('dictPlay').style.display = 'none';
    const done = document.getElementById('dictDone');
    done.style.display = '';
    done.innerHTML = '<p class="hint">Aún no hay frases para practicar en esta categoría.</p>';
    return;
  }
  D = { items: pickRound(pool), idx: 0, ok: 0, xp: 0, noXp: 0, fails: [], results: [], answered: false };
  renderSpeed();
  showQuestion();
  scrollTopNow('dictView');
  addScrollTopBtn(view);
}

export function closeDictation(){
  hideDictation();
  switchView('review');
}

// Para switchView: oculta la vista sin volver a Progreso.
export function hideDictation(){
  try{ if(TTS_SUPPORTED) window.speechSynthesis.cancel(); }catch(e){}
  const v = document.getElementById('dictView');
  if(v) v.style.display = 'none';
  D = null;
}

function wire(){
  const view = ensureView();
  // El acceso a «Escucha y escribe» vive en la fila «Modos de práctica» de Repaso (modes.js).
  view.querySelector('#dictBackBtn').onclick = closeDictation;
  view.querySelector('#dictPlayBtn').onclick = playCurrent;
  view.querySelector('#dictSkipBtn').onclick = () => { if(D && !D.answered) resolve(false, null, true); };
  view.querySelector('#dictNextBtn').onclick = () => {
    if(!D) return;
    D.idx++;
    if(D.idx >= D.items.length) finish(); else showQuestion();
  };
  view.querySelector('#dictCheckBtn').onclick = () => {
    if(!D || D.answered) return;
    const input = document.getElementById('dictInput');
    if(!input.value.trim()){ input.focus(); return; }
    if(isJa()){
      const it = D.items[D.idx], t = input.value.trim().replace(/\s+/g, '');
      const ok = romajiMatches(input.value, dictRead(it)) || t === dictShown(it).replace(/\s+/g, '');
      resolve(ok, { ok, similarity: 0 }, false, input.value); return;
    }
    const r = evaluateWrittenAnswer(input.value, D.items[D.idx][0], 'en');
    resolve(r.ok, r, false, input.value);
  };
  view.querySelector('#dictInput').addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      e.preventDefault();
      if(D && D.answered) document.getElementById('dictNextBtn').click();
      else document.getElementById('dictCheckBtn').click();
    }
  });
}

export const __inits = [[9000, wire]];

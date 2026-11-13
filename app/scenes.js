// Vocabri — Escenas: diálogos guiados. La otra persona habla (con voz) y tú eliges o escribes tu parte.
// La lógica pura está en core/scenes.js y los guiones en core/scenesData.js. Guarda solo tus resultados (vocabri_scenes) y tus preferencias.
import { SCENES, SCENE_GROUPS, SCENE_LEVELS } from './core/scenesData.js';
import { SCENE_MAX_TRIES, buildOptions, normalizeStore, recordRun, scoreRun, validateScene, youTurns } from './core/scenes.js';
import { TTS_SUPPORTED, evaluateWrittenAnswer, nearMissNote } from './exam.js';
import { shortcutsEnabled } from './shortcuts.js';
import { speak } from './speech.js';
import { awardXp } from './ui.js';

const STORE_KEY = 'vocabri_scenes', PREF_KEY = 'vocabri_scene_prefs';
let listGroup = 'all';
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function loadStore(){ try{ return normalizeStore(JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); }catch(e){ return {}; } }
function saveStore(s){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }catch(e){} }
function loadPrefs(){
  let p = {};
  try{ p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; }catch(e){}
  return { mode: p.mode === 'type' ? 'type' : 'pick', voice: p.voice !== false, tr: p.tr !== false };
}
function savePrefs(){ try{ localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }catch(e){} }

let prefs = loadPrefs();
let R = null;            // sesión en curso
let timers = [];
let opener = null;

const ov = () => document.getElementById('scenesOverlay');
const body = () => document.getElementById('snBody');
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); };
function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
function say(text){ if(prefs.voice && TTS_SUPPORTED) speak(text, 'en-US', 0.92); }

const GOOD = SCENES.filter(s => !validateScene(s).length);

// ---------- Pantallas ----------
// Modo «teléfono»: durante el chat la escena se ve como una conversación de móvil.
function phoneMode(on){
  const m = document.querySelector('#scenesOverlay .snModal'); if(m) m.classList.toggle('inChat', !!on);
  const b = body(); if(b) b.classList.toggle('snPhoneMode', !!on);
}
function wallpaper(doodles){
  const em = Array.from(doodles || '').filter(c => c.trim());
  const pos = [[10, 40], [92, 28], [60, 92], [20, 132], [118, 120], [138, 70]];
  const txt = pos.map((p, i) => '<text x="' + p[0] + '" y="' + p[1] + '" font-size="30" opacity=".16" transform="rotate(' + ((i * 37) % 40 - 20) + ' ' + p[0] + ' ' + p[1] + ')">' + (em[i % em.length] || '') + '</text>').join('');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="170" height="170">' + txt + '</svg>';
  return "url('data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, '%27') + "')";
}
function clock(){ try{ return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }catch(e){ return ''; } }

function setTitle(t){ const h = document.getElementById('snTitle'); if(h) h.innerHTML = '<span class="snHeadIcon" aria-hidden="true">🎭</span>' + esc(t); }

function showList(){
  clearTimers(); R = null; phoneMode(false);
  setTitle('Escenas');
  const st = loadStore();
  const done = GOOD.filter(s => st[s.id] && st[s.id].best === 100).length;
  const shown = GOOD.filter(s => listGroup === 'all' || s.group === listGroup);
  body().innerHTML = '<p class="snIntro">Conversaciones cortas para practicar situaciones reales. La otra persona habla y tú respondes con tu parte. <b>' + done + ' de ' + GOOD.length + '</b> dominadas ⭐</p>' +
    '<div class="snChips snFilter" role="group" aria-label="Filtrar por tema">' + SCENE_GROUPS.map(g =>
      '<button type="button" class="snChip hover-scale focus-glow" data-group="' + g.id + '" aria-pressed="' + (listGroup === g.id) + '">' + g.label + '</button>').join('') + '</div>' +
    '<ul class="snList">' +
    shown.map(s => {
      const r = st[s.id], n = youTurns(s).length;
      return '<li><button type="button" class="snCard hover-scale focus-glow" data-scene="' + s.id + '"><span class="snCardIc" aria-hidden="true">' + s.emoji + '</span>' +
        '<span class="snCardTx"><strong>' + esc(s.title) + '</strong><small>' + esc(s.blurb) + '</small>' +
        '<em>' + (SCENE_LEVELS[s.level] || '') + ' · ' + n + ' respuestas' + (r ? ' · mejor: ' + r.best + '%' + (r.best === 100 ? ' ⭐' : '') : '') + '</em></span></button></li>';
    }).join('') + '</ul>';
  const f = body().querySelector('.snCard'); if(f) f.focus({ preventScroll: true });
}

function chip(id, pressed, text){ return '<button type="button" class="snChip hover-scale focus-glow" data-pref="' + id + '" aria-pressed="' + pressed + '">' + text + '</button>'; }

function showIntro(id){
  const s = GOOD.find(x => x.id === id); if(!s) return;
  phoneMode(false); clearTimers(); R = { scene: s, idx: 0, results: [], tries: 0, answered: false, token: Math.random() };
  setTitle(s.title);
  body().innerHTML = '<div class="snIntroWrap"><div class="snHero"><span class="snCardIc" aria-hidden="true">' + s.emoji + '</span><div><strong>' + esc(s.blurb) + '</strong><small>Hablas con: ' + esc(s.partner) + ' · ' + youTurns(s).length + ' respuestas</small></div></div>' +
    '<div class="snDoodles" aria-hidden="true" style="--snWall:' + wallpaper(s.doodles) + '"><span>' + esc(Array.from(s.doodles || '').slice(0, 5).join(' ')) + '</span></div>' +
    '<div class="snLabel">¿Cómo quieres responder?</div><div class="snChips" role="group" aria-label="Modo">' +
      chip('pick', prefs.mode === 'pick', '🧩 Elegir la frase') + chip('type', prefs.mode === 'type', '⌨️ Escribirla') + '</div>' +
    '<div class="snLabel">Ayudas</div><div class="snChips" role="group" aria-label="Ayudas">' +
      (TTS_SUPPORTED ? chip('voice', prefs.voice, '🔊 Voz') : '') + chip('tr', prefs.tr, '🇪🇸 Traducción') + '</div>' +
    '<button class="nav hover-scale focus-glow snStart" id="snStart" type="button">Empezar la escena</button>' +
    '<button class="snBack hover-scale focus-glow" id="snToList" type="button">← Todas las escenas</button></div>';
  const b = body().querySelector('#snStart'); if(b) b.focus({ preventScroll: true });
}

function bubbleHtml(turn, side){
  return '<div class="snBubble ' + side + '"><div class="snWho">' + (side === 'you' ? 'Tú' : esc(R.scene.partner)) + '</div>' +
    '<p class="snEn">' + esc(turn.en) + '</p>' + (prefs.tr ? '<p class="snEs">' + esc(turn.es) + '</p>' : '') + '</div>';
}

function startChat(){
  const s = R.scene;
  phoneMode(true);
  body().innerHTML = '<div class="snPhone" style="--snWall:' + wallpaper(s.doodles) + '">' +
    '<div class="snStatus" aria-hidden="true"><span>' + clock() + '</span><i class="snNotch"></i><span class="snSig">▂▄▆ 🔋</span></div>' +
    '<div class="snChatHead"><button type="button" class="snHBtn hover-scale focus-glow" id="snPhoneBack" aria-label="Volver a las escenas">←</button>' +
      '<span class="snAvatar" aria-hidden="true">' + (s.avatar || s.emoji) + '</span>' +
      '<div class="snHName"><strong>' + esc(s.partner) + '</strong><small><i></i>en línea · ' + esc(s.title) + '</small></div>' +
      '<button type="button" class="snHBtn hover-scale focus-glow" id="snPhoneX" aria-label="Cerrar">✕</button></div>' +
    '<div class="snProg" aria-hidden="true"><i id="snProgBar"></i></div>' +
    '<div class="snLog" id="snLog" role="log" aria-live="polite"></div><div class="snPanel" id="snPanel"></div></div>';
  R.idx = 0; R.results = []; advance();
}

function updateProg(){
  const bar = document.getElementById('snProgBar'); if(!bar) return;
  bar.style.width = Math.round(R.results.length / youTurns(R.scene).length * 100) + '%';
}

function addBubble(turn, side){
  const log = document.getElementById('snLog'); if(!log) return;
  log.insertAdjacentHTML('beforeend', bubbleHtml(turn, side));
  log.scrollTop = log.scrollHeight;
}

function advance(){
  const s = R.scene, tok = R.token;
  while(R.idx < s.turns.length && s.turns[R.idx].who === 'npc'){
    addBubble(s.turns[R.idx], 'npc');
    say(s.turns[R.idx].en);
    R.idx++;
  }
  updateProg();
  if(R.idx >= s.turns.length) return finish();
  R.tries = 0; R.answered = false;
  renderPanel();
}

function renderPanel(){
  const panel = document.getElementById('snPanel'); if(!panel) return;
  const t = R.scene.turns[R.idx];
  let h = '<div class="snGoal"><span>Tu turno</span> ' + esc(t.goal) + '</div>';
  if(prefs.mode === 'pick'){
    R.options = buildOptions(R.scene, R.idx);
    h += '<div class="snOpts" role="group" aria-label="Opciones">' + R.options.map((o, i) =>
      '<button type="button" class="snOpt hover-scale focus-glow" data-opt="' + i + '"><kbd>' + (i + 1) + '</kbd><span>' + esc(o.en) + '</span></button>').join('') + '</div>';
  }else{
    h += '<div class="snType"><input id="snInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escríbelo en inglés…" aria-label="Tu respuesta en inglés">' +
      '<button class="nav hover-scale focus-glow" id="snCheck" type="button">Comprobar</button></div>' +
      '<button class="snShow hover-scale focus-glow" id="snShow" type="button">Mostrar la respuesta</button>';
  }
  h += '<p class="snNote" id="snNote" aria-live="polite"></p>';
  panel.innerHTML = h;
  const f = panel.querySelector('#snInput, .snOpt'); if(f) f.focus({ preventScroll: true });
}

function note(t){ const n = document.getElementById('snNote'); if(n) n.textContent = t || ''; }

function lockPanel(){
  document.querySelectorAll('#snPanel button, #snPanel input').forEach(b => { b.disabled = true; });
}

// Cierra la línea actual (acierto o respuesta mostrada) y pasa a la siguiente tras una pausa breve.
function resolveTurn(assisted){
  if(!R || R.answered) return;
  R.answered = true;
  const t = R.scene.turns[R.idx], tok = R.token;
  R.results.push({ tries: Math.max(1, R.tries + (assisted ? 0 : 1)), assisted: !!assisted });
  lockPanel();
  addBubble(t, 'you');
  say(t.en);
  updateProg();
  if(assisted) note('Esta era la respuesta. ¡Sigue!');
  later(() => { if(!R || R.token !== tok) return; R.idx++; advance(); }, Math.min(3200, 900 + t.en.length * 45));
}

function failTurn(msg){
  R.tries++;
  if(R.tries >= SCENE_MAX_TRIES){
    const t = R.scene.turns[R.idx];
    document.querySelectorAll('#snPanel .snOpt').forEach((b, i) => { if(R.options && R.options[i].correct) b.classList.add('ok'); });
    note('Era: «' + t.en + '»');
    R.tries = SCENE_MAX_TRIES;
    return resolveTurn(true);
  }
  note(msg);
}

function choose(i){
  if(!R || R.answered || !R.options || !R.options[i]) return;
  const btn = document.querySelector('#snPanel .snOpt[data-opt="' + i + '"]');
  if(R.options[i].correct){ if(btn) btn.classList.add('ok'); return resolveTurn(false); }
  if(btn){ btn.classList.add('bad'); btn.disabled = true; }
  failTurn('Esa no encaja aquí. Fíjate en lo que te dicen y en tu objetivo.');
}

function check(){
  if(!R || R.answered) return;
  const input = document.getElementById('snInput');
  if(!input || !input.value.trim()){ if(input) input.focus(); return; }
  const t = R.scene.turns[R.idx];
  const r = evaluateWrittenAnswer(input.value, t.en, 'en');
  if(r.ok) return resolveTurn(false);
  failTurn(nearMissNote(r) || 'Casi. Revisa tu frase e inténtalo otra vez.');
  if(R && !R.answered){ input.select(); input.focus(); }
}

function finish(){
  phoneMode(false);
  const s = R.scene, sum = scoreRun(R.results);
  const rec = recordRun(loadStore(), s.id, sum, Date.now());
  saveStore(rec.store);
  if(rec.xp > 0) awardXp(rec.xp);
  const msg = sum.pct === 100 ? '¡Perfecta! Todo a la primera 🎉' : (sum.pct >= 60 ? '¡Muy bien! Repítela para llegar al 100%.' : 'Buen comienzo. Repetirla te ayudará a fijar las frases.');
  body().innerHTML = '<div class="snEnd"><div class="snEndIc" aria-hidden="true">' + s.emoji + '</div><h4>' + esc(s.title) + '</h4>' +
    '<p class="snScore"><b>' + sum.firstTry + '</b> de ' + sum.total + ' a la primera · ' + sum.pct + '%</p><p class="snMsg">' + msg + '</p>' +
    '<p class="snXp">' + (rec.xp > 0 ? '+' + rec.xp + ' XP' : 'XP de esta escena ya cobrado hoy (vuelve mañana)') + '</p>' +
    '<div class="snLabel">Tus frases en esta escena</div><ul class="snLines">' + youTurns(s).map(t => '<li><span>' + esc(t.en) + '</span><small>' + esc(t.es) + '</small></li>').join('') + '</ul>' +
    '<button class="nav hover-scale focus-glow" id="snAgain" type="button">Repetir la escena</button>' +
    '<button class="snBack hover-scale focus-glow" id="snToList" type="button">← Todas las escenas</button></div>';
  R.finishedId = s.id;
  const b = body().querySelector('#snAgain'); if(b) b.focus({ preventScroll: true });
}

// ---------- Abrir / cerrar ----------
export function openScenes(from){
  const o = ov(); if(!o) return;
  opener = from || null;
  showList();
  o.style.display = 'flex';
  const c = o.querySelector('#snClose'); if(c) c.blur();
}
export function closeScenes(){
  const o = ov(); if(!o || o.style.display === 'none') return;
  clearTimers(); R = null; phoneMode(false);
  try{ if('speechSynthesis' in window) window.speechSynthesis.cancel(); }catch(e){}
  o.style.display = 'none';
  if(opener && opener.focus){ try{ opener.focus({ preventScroll: true }); }catch(e){} }
}

function wire(){
  if(document.getElementById('scenesOverlay')) return;
  const o = document.createElement('div');
  o.className = 'gModalOverlay snOverlay'; o.id = 'scenesOverlay'; o.style.display = 'none';
  o.innerHTML = '<div class="gModal gModalWide snModal" role="dialog" aria-modal="true" aria-labelledby="snTitle">' +
    '<div class="modalHeader snHead"><h3 id="snTitle"></h3><button class="modalCloseBtn hover-scale focus-glow" id="snClose" type="button" aria-label="Cerrar">✕</button></div>' +
    '<div class="snBody" id="snBody"></div></div>';
  document.body.appendChild(o);

  o.addEventListener('click', e => {
    if(e.target === o) return closeScenes();
    const t = e.target.closest('button'); if(!t) return;
    if(t.id === 'snClose' || t.id === 'snPhoneX') closeScenes();
    else if(t.id === 'snPhoneBack') showList();
    else if(t.dataset.scene) showIntro(t.dataset.scene);
    else if(t.dataset.group){ listGroup = t.dataset.group; showList(); const g = body().querySelector('[data-group="' + listGroup + '"]'); if(g) g.focus({ preventScroll: true }); }
    else if(t.id === 'snToList') showList();
    else if(t.id === 'snStart') startChat();
    else if(t.id === 'snAgain') showIntro(R && R.finishedId);
    else if(t.dataset.pref){
      const k = t.dataset.pref;
      if(k === 'pick' || k === 'type') prefs.mode = k; else prefs[k] = !prefs[k];
      savePrefs();
      body().querySelectorAll('[data-pref]').forEach(b => { const kk = b.dataset.pref; b.setAttribute('aria-pressed', (kk === 'pick' || kk === 'type') ? String(prefs.mode === kk) : String(!!prefs[kk])); });
    }
    else if(t.dataset.opt != null) choose(+t.dataset.opt);
    else if(t.id === 'snCheck') check();
    else if(t.id === 'snShow'){ if(R && !R.answered){ note('Esta era la respuesta. ¡Sigue!'); R.tries = SCENE_MAX_TRIES; resolveTurn(true); } }
  });
  document.addEventListener('keydown', e => {
    if(o.style.display === 'none') return;
    if(e.key === 'Escape'){ closeScenes(); return; }
    if(e.target && e.target.id === 'snInput'){ if(e.key === 'Enter'){ e.preventDefault(); check(); } return; }
    if(!shortcutsEnabled() || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if(prefs.mode === 'pick' && R && !R.answered && /^[1-3]$/.test(e.key)){ e.preventDefault(); choose(+e.key - 1); }
  });
}

export const __inits = [[9080, wire]];

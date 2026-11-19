// Vocabri — retos con un amigo («duelo de puntaje»): botón del perfil, ventana de juego y recepción de enlaces.
import { emojiSvg } from './emojiIcons.js';
import { CHALLENGE_N, CHALLENGE_XP_PER_OK, MAX_NAME, summarize, compare, rngFrom, pickKeys, buildQuestions, cleanName,
  encodeChallenge, decodeChallenge, challengeUrl, normalizeStore, recordPlayed, hashStr } from './core/challenge.js';
import { itemsFor, baseItems, catLabel } from './core/dataRegistry.js';
import { awardXp, showToast } from './ui.js';
import { celebrate } from './mascot.js';
import { playSfx } from './speech.js';
import { OFFICIAL_URL } from './profile.js';

const LS = 'vocabri_challenges', LS_NAME = 'vocabri_challenge_name', LS_PENDING = 'vocabri_pending_challenge';
const icon = (name, cls) => '<span class="ei ' + (cls || '') + '">' + emojiSvg(name) + '</span>';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rd = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(e){ return d; } };
const wr = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };

function loadStore(){ let raw = null; try{ raw = JSON.parse(rd(LS, 'null')); }catch(e){} return normalizeStore(raw); }
function defaultName(){ return cleanName(rd(LS_NAME, '')); }

// Frases disponibles para retos: las de las categorías normales (sin tarjetas propias ni el pack de exámenes, que está bloqueado por nivel).
function pool(cat){
  const base = cat && cat !== 'Todas' ? baseItems(cat, false) : itemsFor('Todas', false);
  return base.filter(it => it[2] !== 'exam' && String(it[3]).indexOf('custom|') !== 0);
}
const allPool = () => pool('Todas');
const shortEnough = it => it[0].length <= 58 && it[0].length >= 6;

let G = null;       // partida en curso
let overlay = null;

function close(){
  if(!overlay) return;
  document.removeEventListener('keydown', overlay._esc);
  overlay.remove(); overlay = null; G = null;
  const b = document.getElementById('challengeBtn'); if(b){ b.setAttribute('aria-expanded', 'false'); b.focus({ preventScroll: true }); }
}
function frame(){
  if(overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'gModalOverlay'; overlay.id = 'challengeOverlay'; overlay.style.display = 'flex'; overlay.style.zIndex = '10000';
  overlay.innerHTML = '<div class="gModal chModal" role="dialog" aria-modal="true" aria-labelledby="chTitle">' +
    '<button type="button" class="modalCloseBtn chClose" aria-label="Cerrar">✕</button><div id="chBody"></div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('.chClose').onclick = close;
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
  overlay._esc = e => { if(e.key === 'Escape') close(); };
  document.addEventListener('keydown', overlay._esc);
  return overlay;
}
const body = () => document.getElementById('chBody');
function focusFirst(){ const b = body(); if(!b) return; const f = b.querySelector('[data-autofocus]') || b.querySelector('button,input'); if(f) f.focus({ preventScroll: true }); }

// ── Inicio ──
function renderHub(){
  frame();
  const st = loadStore(), cur = rd('ci_current_master_category', 'general');
  const curOk = cur && cur !== 'exam' && pool(cur).length >= 12;
  const hist = st.played.slice(-4).reverse().map(p => '<li class="chHist ' + p.res + '"><span>' + esc(p.name || 'Reto propio') + '</span><b>' +
    (p.res === 'solo' ? p.mine + ' pts' : p.mine + ' – ' + p.theirs) + '</b><i>' + (p.res === 'win' ? 'Ganado' : p.res === 'lose' ? 'Perdido' : p.res === 'tie' ? 'Empate' : 'Creado') + '</i></li>').join('');
  body().innerHTML =
    '<div class="chHero" aria-hidden="true">' + icon('duel', 'chBig') + '</div>' +
    '<h3 id="chTitle">Reto con un amigo</h3>' +
    '<p class="chLead">Juegas ' + CHALLENGE_N + ' frases, mandas el enlace y tu amigo juega las mismas. Gana quien saque más puntos (¡y más rápido!).</p>' +
    '<label class="chLbl" for="chName">Tu nombre en el reto</label>' +
    '<input id="chName" class="search focus-glow" maxlength="' + MAX_NAME + '" autocomplete="off" placeholder="Ej: Ana" value="' + esc(defaultName()) + '">' +
    '<label class="chLbl" for="chCat">Frases</label>' +
    '<select id="chCat" class="search focus-glow"><option value="Todas">Mezcla de todas las categorías</option>' + (curOk ? '<option value="' + esc(cur) + '">Solo ' + esc(catLabel(cur)) + '</option>' : '') + '</select>' +
    '<button type="button" class="nav hover-scale focus-glow" id="chCreate" data-autofocus>Crear reto y jugar</button>' +
    '<div class="chSep"><span>¿Te pasaron un reto?</span></div>' +
    '<label class="chLbl" for="chCode">Pega aquí el enlace o el código</label>' +
    '<input id="chCode" class="search focus-glow" autocomplete="off" spellcheck="false" placeholder="https://…#reto=…">' +
    '<p class="chErr" id="chErr" role="alert"></p>' +
    '<button type="button" class="nav hover-scale focus-glow chGhost" id="chJoin">Jugar este reto</button>' +
    (st.total ? '<div class="chStats" aria-label="Tus retos">Ganados <b>' + st.wins + '</b> de <b>' + st.total + '</b></div><ul class="chHistList">' + hist + '</ul>' : '');
  body().querySelector('#chCreate').onclick = () => {
    const nm = cleanName(body().querySelector('#chName').value) || 'Un amigo'; wr(LS_NAME, nm);
    startCreate(body().querySelector('#chCat').value, nm);
  };
  body().querySelector('#chJoin').onclick = () => {
    const ch = decodeChallenge(body().querySelector('#chCode').value);
    if(!ch){ body().querySelector('#chErr').textContent = 'Ese enlace o código no es válido. Pídele a tu amigo que lo envíe de nuevo.'; return; }
    renderIncoming(ch);
  };
  focusFirst();
}

// ── Crear (juegas tú primero) ──
function startCreate(cat, name){
  const items = allPool(), src = pool(cat).filter(shortEnough);
  if(src.length < 12){ showToast('Aún no hay frases suficientes para un reto.', '🤝'); return; }
  const keys = pickKeys(src.map(it => it[3]), CHALLENGE_N, rngFrom((Date.now() ^ (Math.random() * 4294967296)) >>> 0));
  begin({ mode: 'create', keys, name, items, other: null, id: 'own' + hashStr(keys.join(',')).toString(36) });
}

// ── Recibir ──
function renderIncoming(ch){
  frame();
  const items = allPool(), have = buildQuestions(ch.keys, items, ch.keys.join(',')).length;
  if(have < Math.min(4, ch.keys.length)){
    body().innerHTML = '<h3 id="chTitle">Reto de otra versión</h3><p class="chLead">Este reto usa frases que tu Vocabri no tiene. Actualiza la app (recarga con Ctrl+Shift+R) y vuelve a abrir el enlace.</p><button type="button" class="nav hover-scale focus-glow" id="chBack" data-autofocus>Volver</button>';
    body().querySelector('#chBack').onclick = renderHub; focusFirst(); return;
  }
  body().innerHTML =
    '<div class="chHero" aria-hidden="true">' + icon('🏁', 'chBig') + '</div>' +
    '<h3 id="chTitle">' + esc(ch.name || 'Un amigo') + ' te reta</h3>' +
    '<div class="chVs"><div class="chSide"><small>' + esc(ch.name || 'Tu amigo') + '</small><b>' + ch.score + '</b><span>' + ch.ok + ' de ' + ch.keys.length + ' bien</span></div></div>' +
    '<p class="chLead">Juegas las mismas ' + ch.keys.length + ' frases con las mismas opciones. Cada acierto vale 100 puntos y hay un bonus por responder rápido.</p>' +
    '<label class="chLbl" for="chName">Tu nombre</label>' +
    '<input id="chName" class="search focus-glow" maxlength="' + MAX_NAME + '" autocomplete="off" placeholder="Ej: Luis" value="' + esc(defaultName()) + '">' +
    '<button type="button" class="nav hover-scale focus-glow" id="chAccept" data-autofocus>¡Acepto el reto!</button>' +
    '<button type="button" class="nav hover-scale focus-glow chGhost" id="chLater">Ahora no</button>';
  body().querySelector('#chAccept').onclick = () => {
    const nm = cleanName(body().querySelector('#chName').value) || 'Yo'; wr(LS_NAME, nm);
    begin({ mode: 'play', keys: ch.keys, name: nm, items, other: ch, id: ch.id });
  };
  body().querySelector('#chLater').onclick = close;
  focusFirst();
}

// ── Partida ──
function begin(o){
  const qs = buildQuestions(o.keys, o.items, o.keys.join(','));
  if(qs.length < 4){ showToast('No se pudo preparar el reto.', '🤝'); return; }
  G = Object.assign({ qs, idx: 0, results: [], t0: 0, locked: false }, o);
  renderQ();
}
function renderQ(){
  const q = G.qs[G.idx], n = G.qs.length;
  const dots = G.qs.map((_, i) => '<i class="chDot' + (i < G.idx ? (G.results[i] && G.results[i].good ? ' ok' : ' bad') : i === G.idx ? ' cur' : '') + '"></i>').join('');
  body().innerHTML =
    '<h3 id="chTitle" class="chQTitle">Pregunta ' + (G.idx + 1) + ' de ' + n + '</h3>' +
    '<div class="chDots" aria-hidden="true">' + dots + '</div>' +
    '<p class="chPrompt">' + esc(q.es) + '</p>' +
    '<div class="chOpts" role="group" aria-label="Elige la traducción al inglés">' +
    q.options.map((t, i) => '<button type="button" class="nav chOpt hover-scale focus-glow" data-i="' + i + '">' + esc(t) + '</button>').join('') + '</div>' +
    '<p class="chFeed" id="chFeed" role="status" aria-live="polite"></p>';
  body().querySelectorAll('.chOpt').forEach(b => b.onclick = () => answer(Number(b.dataset.i)));
  G.locked = false; G.t0 = Date.now();
  const f = body().querySelector('.chOpt'); if(f) f.focus({ preventScroll: true });
}
function answer(i){
  if(!G || G.locked) return;
  G.locked = true;
  const q = G.qs[G.idx], good = i === q.answer, ms = Date.now() - G.t0;
  G.results.push({ good, ms });
  try{ playSfx(good ? 'correct' : 'wrong'); }catch(e){}
  body().querySelectorAll('.chOpt').forEach(b => {
    b.disabled = true; const k = Number(b.dataset.i);
    if(k === q.answer) b.classList.add('isRight'); else if(k === i) b.classList.add('isWrong');
  });
  const feed = body().querySelector('#chFeed'); if(feed) feed.textContent = good ? '¡Correcto!' : 'Era: ' + q.en;
  setTimeout(() => {
    if(!G) return;
    G.idx++;
    if(G.idx >= G.qs.length) finish(); else renderQ();
  }, good ? 600 : 1300);
}

function finish(){
  const sum = summarize(G.results);
  const mine = { score: sum.score, ms: sum.ms };
  const res = G.other ? compare(mine, { score: G.other.score, ms: G.other.ms }) : 'solo';
  let gained = 0;
  try{ gained = awardXp(sum.ok * CHALLENGE_XP_PER_OK, { source: 'challenge', key: 'challenge|' + G.id }) || 0; }catch(e){}
  wr(LS, JSON.stringify(recordPlayed(loadStore(), { id: G.id, name: G.other ? G.other.name : '', mine: sum.score, theirs: G.other ? G.other.score : 0, res, at: Date.now() })));
  const ch = { keys: G.keys, name: G.name, score: sum.score, ok: sum.ok, ms: sum.ms };
  const link = challengeUrl(OFFICIAL_URL, ch), code = encodeChallenge(ch);
  const secs = s => (s / 1000).toFixed(1) + ' s';
  let head = '', cls = 'solo';
  if(res === 'win'){ head = '¡Ganaste!'; cls = 'win'; try{ playSfx('levelup'); celebrate({ count: 60 }); }catch(e){} }
  else if(res === 'lose'){ head = 'Esta vez no'; cls = 'lose'; }
  else if(res === 'tie'){ head = '¡Empate!'; cls = 'tie'; }
  else { head = 'Tu reto está listo'; try{ playSfx('chest'); }catch(e){} }
  const vs = G.other
    ? '<div class="chVs"><div class="chSide me"><small>' + esc(G.name) + '</small><b>' + sum.score + '</b><span>' + sum.ok + ' bien · ' + secs(sum.ms) + '</span></div><div class="chX">VS</div><div class="chSide"><small>' + esc(G.other.name || 'Tu amigo') + '</small><b>' + G.other.score + '</b><span>' + G.other.ok + ' bien · ' + secs(G.other.ms) + '</span></div></div>'
    : '<div class="chVs"><div class="chSide me"><small>' + esc(G.name) + '</small><b>' + sum.score + '</b><span>' + sum.ok + ' de ' + G.qs.length + ' bien · ' + secs(sum.ms) + '</span></div></div>';
  body().innerHTML =
    '<div class="chHero chRes ' + cls + '" aria-hidden="true">' + icon(res === 'win' ? '🏆' : res === 'solo' ? '🎁' : 'duel', 'chBig') + '</div>' +
    '<h3 id="chTitle">' + head + '</h3>' + vs +
    '<p class="chLead" role="status">' + (gained ? '+' + gained + ' XP. ' : '') +
    (G.other ? (res === 'win' ? '¡Superaste a ' + esc(G.other.name || 'tu amigo') + '!' : res === 'lose' ? 'Pídele la revancha.' : 'Qué parejos.') : 'Manda el enlace y espera a ver si te superan.') + '</p>' +
    '<button type="button" class="nav hover-scale focus-glow" id="chSend" data-autofocus>' + (G.other ? 'Mandar mi resultado' : 'Enviar reto') + '</button>' +
    '<div class="chRow"><button type="button" class="nav hover-scale focus-glow chGhost" id="chCopyL">Copiar enlace</button>' +
    '<button type="button" class="nav hover-scale focus-glow chGhost" id="chCopyC">Copiar código</button></div>' +
    '<p class="chErr chOkMsg" id="chMsg" role="status" aria-live="polite"></p>' +
    '<button type="button" class="nav hover-scale focus-glow chGhost" id="chAgain">' + (G.other ? 'Retar yo ahora' : 'Crear otro reto') + '</button>';
  const msg = body().querySelector('#chMsg'), say = t => { msg.textContent = t; };
  const text = G.other ? '¡' + (res === 'win' ? 'Te gané' : res === 'lose' ? 'Me ganaste' : 'Empatamos') + ' en Vocabri! ' + sum.score + ' a ' + G.other.score + '. Mi reto para ti:'
    : '¡Te reto en Vocabri! Saqué ' + sum.ok + ' de ' + G.qs.length + ' (' + sum.score + ' puntos). ¿Me superas?';
  const copy = async (t, ok) => { try{ await navigator.clipboard.writeText(t); say(ok); }catch(e){ say('No se pudo copiar; mantén pulsado para copiar a mano: ' + t.slice(0, 40) + '…'); } };
  body().querySelector('#chCopyL').onclick = () => copy(link, 'Enlace copiado.');
  body().querySelector('#chCopyC').onclick = () => copy(code, 'Código copiado. Tu amigo lo pega en «Reto con un amigo».');
  body().querySelector('#chSend').onclick = async () => {
    if(navigator.share){ try{ await navigator.share({ title: 'Reto en Vocabri', text, url: link }); return; }catch(e){ if(e && e.name === 'AbortError') return; } }
    copy(text + ' ' + link, 'Mensaje con enlace copiado: pégalo en tu chat.');
  };
  body().querySelector('#chAgain').onclick = renderHub;
  focusFirst();
}

// ── Entradas ──
export function openChallenge(){
  const b = document.getElementById('challengeBtn'); if(b) b.setAttribute('aria-expanded', 'true');
  if(overlay) return;
  renderHub();
}
function receive(ch){
  if(overlay) close();
  renderIncoming(ch);
}
/** Lee un reto del enlace (#reto=…) o uno que quedó pendiente. Se llama al arrancar y al cambiar el hash. */
export function checkIncomingChallenge(){
  let code = '';
  try{ const m = String(location.hash || '').match(/reto=([A-Za-z0-9_\-]+)/); if(m){ code = m[1]; history.replaceState(null, '', location.pathname + location.search); } }catch(e){}
  if(!code) code = rd(LS_PENDING, '');
  if(!code) return;
  if(rd('onboardingDone', '') !== 'true'){ wr(LS_PENDING, code); return; }      // primero termina la configuración inicial
  try{ localStorage.removeItem(LS_PENDING); }catch(e){}
  const ch = decodeChallenge(code);
  if(!ch){ showToast('Ese enlace de reto no es válido.', '🤝'); return; }
  receive(ch);
}

export function updateChallengeButton(){
  const btn = document.getElementById('challengeBtn'); if(!btn) return;
  const ic = btn.querySelector('.sitIc'); if(ic && !ic.firstChild) ic.innerHTML = icon('duel', 'chIc');
  const st = loadStore(), small = document.getElementById('challengeSub');
  if(small) small.textContent = st.total ? 'Ganados ' + st.wins + ' de ' + st.total : '10 frases, mismo reto para los dos';
}
export function wireChallenge(){
  const btn = document.getElementById('challengeBtn');
  if(btn){ btn.onclick = openChallenge; updateChallengeButton(); }
  if(!wireChallenge._h){ wireChallenge._h = true; window.addEventListener('hashchange', checkIncomingChallenge); }
}

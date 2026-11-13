// Vocabri — actualizaciones: panel con la versión nueva y sus cambios, barra de progreso
// y «Buscar actualizaciones» en Configuración. Trabaja con sw.js (SKIP_WAITING) y version.json.
import { S } from './core/shared.js';
import { APP_VERSION } from './settings.js';
import { _ni } from './ui.js';
import { normalizeVersionInfo, updateStatus, UPDATE_STAGES, easeProgress } from './core/version.js';

const ICON = _ni('#4ADE80', '#14783B',
  '<circle cx="14" cy="14" r="11"/>',
  '<path d="M14 19.5V9.2M9.4 13.4 14 8.8l4.6 4.6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
const ICON_OK = _ni('#2DD4BF', '#0B6B60',
  '<circle cx="14" cy="14" r="11"/>',
  '<path d="M9 14.4l3.7 3.7L19.4 10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');

const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = id => document.getElementById(id);
const LS_LAST = 'vocabri_update_check';
let info = null, status = null, running = false, opener = null;

// ---------- Red ----------
export async function fetchVersionInfo(){
  try{
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctl ? setTimeout(() => ctl.abort(), 7000) : 0;
    const r = await fetch('./version.json?_=' + Date.now(), { cache: 'no-store', signal: ctl ? ctl.signal : undefined });
    if(t) clearTimeout(t);
    if(!r.ok) return null;
    return normalizeVersionInfo(await r.json());
  }catch(e){ return null; }
}
async function getReg(){ try{ return ('serviceWorker' in navigator) ? await navigator.serviceWorker.getRegistration() : null; }catch(e){ return null; } }

export async function checkForUpdates(){
  setSettingsState('checking');
  const reg = await getReg();
  if(reg){ try{ reg.update().catch(() => {}); }catch(e){} }
  const found = await fetchVersionInfo();
  let st = updateStatus(found, APP_VERSION);
  if(found) info = found;
  // Hay un worker esperando aunque version.json no lo diga: también cuenta como actualización
  if(st !== 'available' && reg && reg.waiting && navigator.serviceWorker.controller) st = 'available';
  status = st;
  try{ localStorage.setItem(LS_LAST, String(Date.now())); }catch(e){}
  setSettingsState(st);
  return st;
}

// ---------- Configuración ----------
function lastCheckText(){
  try{
    const t = +localStorage.getItem(LS_LAST); if(!t) return '';
    const d = new Date(t), now = new Date();
    const hm = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    return 'Última búsqueda: ' + (d.toDateString() === now.toDateString() ? 'hoy ' + hm : d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) + ' ' + hm);
  }catch(e){ return ''; }
}
function setSettingsState(st){
  const btn = q('updCheckBtn'), msg = q('updStatus'), sub = q('updInfoSub'), ic = q('updInfoIc');
  if(!btn) return;
  btn.disabled = st === 'checking';
  btn.classList.toggle('isAvail', st === 'available');
  if(st === 'checking'){ btn.textContent = '⏳ Buscando…'; msg.textContent = ''; }
  else if(st === 'available'){
    btn.textContent = '✨ Actualizar' + (info ? ' a ' + info.version : '');
    msg.textContent = 'Hay una versión nueva' + (info ? ': ' + info.version : '') + '. Toca el botón para ver qué trae.';
    sub.textContent = 'Versión instalada · hay una nueva'; ic.innerHTML = ICON;
  }else if(st === 'latest'){
    btn.textContent = '🔄 Buscar actualizaciones';
    msg.textContent = '✅ Tienes la versión más reciente. ' + lastCheckText();
    sub.textContent = 'Versión instalada · al día'; ic.innerHTML = ICON_OK;
  }else{
    btn.textContent = '🔄 Buscar actualizaciones';
    msg.textContent = '⚠️ No pude comprobarlo. Revisa tu conexión e inténtalo de nuevo.';
    sub.textContent = 'Versión instalada';
  }
}
function wireSettings(){
  const panel = q('settingsPanel'); if(!panel || q('updCheckBtn')) return;
  const sec = document.createElement('div');
  sec.className = 'setSec'; sec.style.setProperty('--i', 5);
  sec.innerHTML = '<div class="setTitle">Actualizaciones</div>' +
    '<div class="updInfo"><span class="updInfoIc" id="updInfoIc" aria-hidden="true">' + ICON_OK + '</span>' +
    '<div class="updInfoTx"><strong>Vocabri ' + esc(APP_VERSION) + '</strong><small id="updInfoSub">Versión instalada</small></div></div>' +
    '<button class="nav setBtn updCheckBtn hover-scale focus-glow" id="updCheckBtn" type="button">🔄 Buscar actualizaciones</button>' +
    '<p class="setStatus" id="updStatus" role="status" aria-live="polite">' + esc(lastCheckText()) + '</p>';
  const terms = q('termsBtn'), anchor = terms && terms.closest('.setSec');
  if(anchor) anchor.parentNode.insertBefore(sec, anchor); else panel.appendChild(sec);
  q('updCheckBtn').addEventListener('click', async e => {
    if(status === 'available'){ openModal(e.currentTarget); return; }
    const st = await checkForUpdates();
    if(st === 'available') openModal(q('updCheckBtn'));
  });
}

// ---------- Panel ----------
function build(){
  if(q('updModal')) return;
  const o = document.createElement('div');
  o.className = 'gModalOverlay updOverlay'; o.id = 'updModal'; o.style.display = 'none';
  o.innerHTML = '<div class="gModal updModal" role="dialog" aria-modal="true" aria-labelledby="updTitle">' +
    '<div class="updHero"><span class="updIc" aria-hidden="true">' + ICON + '</span>' +
    '<div class="updHeroTx"><h3 id="updTitle">Nueva versión disponible</h3><p class="updSub" id="updSub"></p></div>' +
    '<button class="modalCloseBtn hover-scale focus-glow" id="updClose" type="button" aria-label="Cerrar">✕</button></div>' +
    '<div class="updVer" aria-label="De la versión actual a la nueva"><span class="updChip">' + esc(APP_VERSION) + '</span><span class="updArrow" aria-hidden="true">→</span><span class="updChip isNew" id="updNew">—</span></div>' +
    '<div class="updRel" id="updRel"></div>' +
    '<div class="updNotesWrap" id="updNotesWrap"><div class="updNotesLbl">Qué trae esta versión</div><ul class="updNotes" id="updNotes"></ul></div>' +
    '<p class="updKeep">🔒 Tu progreso y tus tarjetas se conservan.</p>' +
    '<div class="updActions" id="updActions"><button class="nav updGo hover-scale focus-glow" id="updGo" type="button">✨ Actualizar ahora</button>' +
    '<button class="updLater hover-scale focus-glow" id="updLater" type="button">Más tarde</button></div>' +
    '<div class="updProg" id="updProg" hidden><div class="updBar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="updBar"><i id="updFill"></i></div>' +
    '<div class="updPct"><span id="updLbl"></span><b id="updNum">0%</b></div></div>' +
    '</div>';
  document.body.appendChild(o);
  o.addEventListener('click', e => { if(e.target === o && !running) closeModal(); });
  q('updClose').onclick = () => { if(!running) closeModal(); };
  q('updLater').onclick = () => closeModal();
  q('updGo').onclick = run;
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && o.style.display !== 'none' && !running) closeModal(); });
}
function fill(){
  q('updNew').textContent = info ? info.version : 'nueva';
  q('updSub').textContent = info ? 'Vocabri ' + info.version + (info.date ? ' · ' + info.date : '') : 'Hay una versión lista para instalar.';
  q('updRel').innerHTML = info && info.title ? '<span class="updRelTag">Novedad</span><strong>' + esc(info.title) + '</strong>' : '';
  q('updRel').style.display = info && info.title ? '' : 'none';
  const has = info && info.changes.length;
  q('updNotesWrap').style.display = has ? '' : 'none';
  q('updNotes').innerHTML = has ? info.changes.map(c => '<li>' + esc(c) + '</li>').join('') : '';
}
export async function openModal(from){
  build(); opener = from || null;
  if(!info){ info = await fetchVersionInfo(); }
  fill();
  q('updActions').hidden = false; q('updProg').hidden = true; running = false;
  q('updModal').style.display = 'flex';
  q('updGo').focus({ preventScroll: true });
}
function closeModal(){
  const o = q('updModal'); if(!o) return;
  o.style.display = 'none';
  if(opener && opener.focus){ try{ opener.focus({ preventScroll: true }); }catch(e){} }
}

// ---------- Barra de progreso y aplicación ----------
async function hardReload(){
  try{
    const regs = (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) ? await navigator.serviceWorker.getRegistrations() : [];
    await Promise.all(regs.map(r => r.unregister()));
    if(window.caches){ const keys = await caches.keys(); await Promise.all(keys.filter(k => k.startsWith('vocabri-') && k !== 'vocabri-state').map(k => caches.delete(k))); }
  }catch(e){}
  location.reload();
}
async function run(){
  if(running) return;
  running = true;
  q('updActions').hidden = true; q('updProg').hidden = false; q('updClose').style.visibility = 'hidden';
  let cur = 0, cap = UPDATE_STAGES[0].cap, finished = false;
  const paint = () => {
    q('updFill').style.width = cur + '%'; q('updNum').textContent = Math.round(cur) + '%';
    q('updBar').setAttribute('aria-valuenow', Math.round(cur));
  };
  const stage = id => { const s = UPDATE_STAGES.find(x => x.id === id); cap = s.cap; q('updLbl').textContent = s.label; };
  const tick = setInterval(() => { cur = easeProgress(cur, cap); paint(); }, 90);
  const reloadNow = () => {
    if(finished) return; finished = true;
    stage('done'); cur = 100; paint(); clearInterval(tick);
    setTimeout(() => location.reload(), 650);
  };
  stage('check'); paint();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reg = await getReg();
  if(!reg || !navigator.serviceWorker.controller){ stage('install'); await wait(900); clearInterval(tick); stage('ready'); cur = 90; paint(); await wait(500); finished = true; await hardReload(); return; }

  navigator.serviceWorker.addEventListener('controllerchange', reloadNow);
  let waiting = reg.waiting || S._waitingWorker;
  await wait(700);
  stage('install');
  if(!waiting){
    try{ await reg.update(); }catch(e){}
    waiting = reg.waiting || await new Promise(res => {
      const w = reg.installing;
      const done = () => res(reg.waiting || null);
      if(w){ w.addEventListener('statechange', () => { if(w.state === 'installed' || w.state === 'redundant') done(); }); }
      else reg.addEventListener('updatefound', () => { const n = reg.installing; if(n) n.addEventListener('statechange', () => { if(n.state === 'installed') done(); }); });
      setTimeout(done, 20000);
    });
  }else await wait(900);
  if(!waiting){ clearInterval(tick); finished = true; await hardReload(); return; }
  stage('ready'); await wait(600);
  waiting.postMessage({ type: 'SKIP_WAITING' });
  setTimeout(() => { if(!finished) reloadNow(); }, 4000);   // por si el navegador no avisa del cambio
}

// ---------- Aviso inferior ----------
function paintBanner(b, title, sub){
  if(!b) return;
  b.classList.add('updNew');
  b.innerHTML = '<span class="updNewIc" aria-hidden="true">' + ICON + '</span>' +
    '<span class="updNewTx"><strong>' + title + '</strong><small>' + sub + '</small></span>' +
    '<span class="updNewGo" aria-hidden="true">›</span>';
}
async function onReady(){
  const b = q('updateNowBtn');
  info = info || await fetchVersionInfo();
  status = 'available';
  if(b){ paintBanner(b, info ? 'Versión ' + info.version + ' lista' : 'Nueva versión disponible', 'Toca para ver las novedades y actualizar'); b.disabled = false; }
  setSettingsState('available');
}
function wire(){
  build(); wireSettings(); paintBanner(q('updateNowBtn'), 'Nueva versión disponible', 'Toca para ver las novedades y actualizar');
  document.addEventListener('vocabri-update-ready', onReady);
  document.addEventListener('vocabri-open-update', () => openModal(q('updateNowBtn')));
  // Revisión silenciosa al abrir: solo marca el estado en Configuración
  setTimeout(() => { fetchVersionInfo().then(f => { if(!f) return; info = f; status = updateStatus(f, APP_VERSION); if(status === 'available') setSettingsState('available'); }); }, 4000);
}

export const __inits = [[9110, wire]];

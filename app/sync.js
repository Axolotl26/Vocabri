// Vocabri — módulo "sync" (generado a partir de app.js)
import { S } from './core/shared.js';
import { cloudParse, cloudNum, dayKeyNum, mergeCardRecord, mergeStageMaps, mergeExamResult, mergeCustomWords, mergeCustomCats, mergeCooldownState, mergeProgressData, cloudDataEqual } from './core/cloudMerge.js';
export { cloudParse, cloudNum, dayKeyNum, mergeCardRecord, mergeStageMaps, mergeExamResult, mergeCustomWords, mergeCustomCats, mergeCooldownState, mergeProgressData, cloudDataEqual };
import { defaultVocabriProgress } from './core/dataRegistry.js';
import { buildPathMap } from './mapRenderer.js';
import { populateCardModalCats, renderMyCardsHome } from './myCards.js';
import { renderProfile, shareProgressCard } from './profile.js';
import { renderProgress } from './progress.js';
import { THEMES, applyTheme } from './settings.js';
import { updateSfxToggleUi } from './speech.js';
import { loadCustomWords } from './state.js';
import { applyButtonAnimations, mascotImg, updateGameBar } from './ui.js';



// --- Backup: export / import progress and custom cards (JSON) ---
// Everything lives in localStorage under these prefixes. The Google session ("vocabri_user") is never exported.
export const BACKUP_PREFIXES = ['ci_', 'vocabri'];


export const BACKUP_EXCLUDE = ['vocabri_user', 'vocabri_cloud_uid', 'vocabri_cloud_rev', 'vocabri_cloud_last_sync', 'vocabri_cloud_pending_reset', 'vocabri_cloud_signout_pending'];


export function isBackupKey(k){
  return BACKUP_PREFIXES.some(p=> k.indexOf(p) === 0) && BACKUP_EXCLUDE.indexOf(k) < 0;
}


export function collectBackupData(){
  const data = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(isBackupKey(k)) data[k] = localStorage.getItem(k);
  }
  return data;
}


export function setBackupStatus(msg){ document.getElementById('backupStatus').textContent = msg; }


export function exportBackup(){
  try{
    const payload = {app:'vocabri', version:1, exportedAt:new Date().toISOString(), data:collectBackupData()};
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabri-respaldo-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
    setBackupStatus('✅ Respaldo exportado (' + Object.keys(payload.data).length + ' datos).');
    return true;
  }catch(e){
    setBackupStatus('❌ No se pudo exportar el respaldo.');
    return false;
  }
}



export async function importBackupFile(file){
  const input = document.getElementById('importFile');
  try{
    const payload = JSON.parse(await file.text());
    if(!payload || payload.app !== 'vocabri' || !payload.data || typeof payload.data !== 'object') throw new Error('format');
    const keys = Object.keys(payload.data).filter(k=> isBackupKey(k) && typeof payload.data[k] === 'string');
    if(!keys.length) throw new Error('empty');
    if(!confirm('Esto reemplazará el progreso y las tarjetas de este dispositivo con las del respaldo (' + keys.length + ' datos). ¿Continuar?')){
      setBackupStatus('Importación cancelada.');
      return;
    }
    const current = [];
    for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(isBackupKey(k)) current.push(k); }
    current.forEach(k=> localStorage.removeItem(k));
    keys.forEach(k=> localStorage.setItem(k, payload.data[k]));
    setBackupStatus('✅ Respaldo restaurado. Reiniciando…');
    setTimeout(()=> location.reload(), 900);
  }catch(e){
    setBackupStatus('❌ El archivo no es un respaldo válido de Vocabri.');
  }finally{
    input.value = '';
  }
}



// =====================================================================
// Cloud sync (Firebase Auth + Firestore) — OPTIONAL
// The app is local-first: with no account, no connection or no Firebase configuration everything
// keeps working with localStorage only.
//   Firestore:  users/{uid}                  → profile of the signed-in user
//               users/{uid}/progress/data    → { schema, rev, data (JSON string), count, clientUpdatedAt, updatedAt }
// =====================================================================
export const CLOUD_UID_KEY = 'vocabri_cloud_uid';

                 // account this device was last synced with
export const CLOUD_REV_KEY = 'vocabri_cloud_rev';

                 // revision of the cloud document this device last saw / wrote
export const CLOUD_LAST_SYNC_KEY = 'vocabri_cloud_last_sync';


export const CLOUD_PENDING_RESET_KEY = 'vocabri_cloud_pending_reset';


export const CLOUD_SIGNOUT_PENDING_KEY = 'vocabri_cloud_signout_pending';


// Never synced (they describe THIS device or this session)
export const CLOUD_LOCAL_ONLY_KEYS = ['vocabri_user', CLOUD_UID_KEY, CLOUD_REV_KEY, CLOUD_LAST_SYNC_KEY, CLOUD_PENDING_RESET_KEY,
  CLOUD_SIGNOUT_PENDING_KEY, 'vocabri_reminders', 'ci_voice_en', 'ci_voice_es'];


export const CLOUD_NO_TRIGGER_PREFIXES = ['ci_time_'];

             // written every 10 s: they ride along, they don't trigger a sync
export const CLOUD_DEBOUNCE_MS = 15000;


export const CLOUD_TIMEOUT_MS = 12000;


export const CLOUD_RESUME_MIN_GAP_MS = 60000;


export const CLOUD_MAX_PAYLOAD_CHARS = 900000;

                     // a Firestore document holds ~1 MiB



          // window.VocabriFirebase once the SDK has loaded


         // { uid, name, email, picture }


     // local | connecting | syncing | synced | offline | unavailable | error




export function isCloudKey(k){
  return !!k && (k.indexOf('ci_') === 0 || k.indexOf('vocabri') === 0) && CLOUD_LOCAL_ONLY_KEYS.indexOf(k) < 0;
}


export function collectCloudData(){
  const out = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(isCloudKey(k)) out[k] = localStorage.getItem(k);
  }
  return out;
}


export function cloudWithTimeout(promise, ms){
  return new Promise((resolve, reject)=>{
    const t = setTimeout(()=> reject(Object.assign(new Error('timeout'), {code:'vocabri/timeout'})), ms);
    Promise.resolve(promise).then(v=>{ clearTimeout(t); resolve(v); }, e=>{ clearTimeout(t); reject(e); });
  });
}


// Only plain strings under our own key prefixes are accepted from the cloud
export function sanitizeCloudObject(obj){
  const out = {};
  if(obj && typeof obj === 'object' && !Array.isArray(obj)){
    Object.keys(obj).forEach(k=>{ if(isCloudKey(k) && typeof obj[k] === 'string') out[k] = obj[k]; });
  }
  return out;
}



export function applyCloudData(finalData, localBefore, replaceAll){
  let changed = false;
  S.cloudApplying = true;                    // our own writes must not trigger another sync
  try{
    Object.keys(finalData).forEach(k=>{
      if(localBefore[k] !== finalData[k]){ localStorage.setItem(k, finalData[k]); changed = true; }
    });
    if(replaceAll){
      Object.keys(localBefore).forEach(k=>{ if(finalData[k] === undefined){ localStorage.removeItem(k); changed = true; } });
    }
  } finally { S.cloudApplying = false; }
  return changed;
}


// Re-read the state the app keeps in memory (no page reload, the welcome screen doesn't come back)
export function reloadStateFromStorage(){
  try{ const u = JSON.parse(localStorage.getItem('vocabri_unlocked_stage') || '{}'); S.unlockedStage = (u && typeof u === 'object') ? u : {}; }catch(e){ S.unlockedStage = {}; }
  try{ S.vocabriProgress = Object.assign(defaultVocabriProgress(), JSON.parse(localStorage.getItem('vocabriProgress')) || {}); }catch(e){}
  loadCustomWords();
  try{ const c = JSON.parse(localStorage.getItem('ci_custom_cats') || '[]'); if(Array.isArray(c)) S.customCats = c; }catch(e){}
  populateCardModalCats();
  try{ S.sfxEnabled = localStorage.getItem('vocabri_sfx') !== '0'; updateSfxToggleUi(); }catch(e){}
  try{
    const t = localStorage.getItem('ci_theme') || 'vitality', m = localStorage.getItem('ci_mode') || 'auto';
    if(THEMES[t] && (t !== S.themeKey || m !== S.modeSel)){ S.themeKey = t; S.modeSel = m; applyTheme(); }
  }catch(e){}
  updateGameBar();
  if(S.examState) return;                    // a running exam keeps its own state; the rest refreshes on its next render
  if(S.view === 'learn' && S.cardsSubView === 'map') buildPathMap();
  else if(S.view === 'mycards') renderMyCardsHome();
  else if(S.view === 'progress') renderProgress();
  else if(S.view === 'profile') renderProfile();
}



// ---------- status / account UI ----------
export function relativeTime(ms){
  const m = Math.floor(Math.max(0, Date.now() - ms) / 60000);
  if(m < 1) return 'ahora';
  if(m < 60) return 'hace ' + m + ' min';
  const h = Math.floor(m / 60);
  if(h < 24) return 'hace ' + h + ' h';
  return 'hace ' + Math.floor(h / 24) + ' d';
}


export function cloudMirrorUser(){
  try{
    const u = JSON.parse(localStorage.getItem('vocabri_user') || 'null');
    return (u && typeof u === 'object' && (u.email || u.name)) ? u : null;
  }catch(e){ return null; }
}


export function cloudStatusInfo(){
  if(S.cloudMessage.until > Date.now()) return {text: S.cloudMessage.text, cls: S.cloudMessage.cls};
  if(!S.cloudUser && !cloudMirrorUser()) return {text:'', cls:''};
  const state = (!S.cloudUser && S.cloudState === 'local') ? 'unavailable' : S.cloudState;
  switch(state){
    case 'connecting': return {text:'🔄 Conectando…', cls:''};
    case 'syncing': return {text:'🔄 Sincronizando…', cls:''};
    case 'synced': { const t = Number(localStorage.getItem(CLOUD_LAST_SYNC_KEY)) || 0; return {text:'☁️ Sincronizado ' + (t ? relativeTime(t) : 'ahora'), cls:'ok'}; }
    case 'offline': return {text:'📴 Sin conexión · tus cambios se enviarán cuando vuelva internet', cls:'warn'};
    case 'unavailable': return {text:'📴 Sincronización en pausa (sin conexión)', cls:'warn'};
    case 'error': return {text:'⚠️ No se pudo sincronizar' + (S.cloudDetail ? ' · ' + S.cloudDetail : ''), cls:'bad'};
    default: return {text:'', cls:''};
  }
}


export function setCloudMessage(text, cls){
  S.cloudMessage = {text: text, cls: cls || '', until: Date.now() + 7000};
  renderAccountUi();
  setTimeout(renderAccountUi, 7100);
}


export function setCloudState(state, detail){
  S.cloudState = state; S.cloudDetail = detail || '';
  renderAccountUi();
}


export function updateSyncStatus(){
  const el = document.getElementById('syncStatus');
  const dot = document.getElementById('syncDot');
  const signedIn = !!(S.cloudUser || cloudMirrorUser());
  const info = cloudStatusInfo();
  if(el) el.textContent = signedIn
    ? ((info.text || '☁️ Cuenta vinculada') + ' · también se guarda en este dispositivo.')
    : '💾 Tu progreso se guarda en este dispositivo (localStorage).';
  if(dot) dot.style.background = (signedIn && info.cls === 'bad') ? '#EF4444' : (signedIn && info.cls === 'warn') ? '#F59E0B' : '#22C55E';
}


export function renderAccountUi(){
  const user = S.cloudUser || cloudMirrorUser();
  const signedIn = !!user;
  const set = (id, fn)=>{ const el = document.getElementById(id); if(el) fn(el); };
  set('profileName', el=> el.textContent = signedIn ? (user.name || 'Tu cuenta') : 'Tu cuenta');
  set('profileEmail', el=> el.textContent = signedIn ? (user.email || '') : 'sin vincular');
  set('profileBadge', el=>{
    el.textContent = signedIn ? '🟢 Cuenta vinculada (Google)' : '⚪ Cuenta no vinculada';
    el.classList.toggle('linked', signedIn);
    el.style.color = '';
  });
  set('profileAvatar', el=>{
    el.textContent = '';
    if(signedIn && user.picture && /^https:\/\//.test(user.picture)){
      const img = document.createElement('img');
      img.className = 'googlePhoto'; img.alt = ''; img.referrerPolicy = 'no-referrer'; img.src = user.picture;
      img.onerror = ()=>{ el.textContent = ''; el.appendChild(mascotImg('hero', 'mascot-avatar')); };
      el.appendChild(img);
    } else {
      el.appendChild(mascotImg('hero', 'mascot-avatar'));
    }
  });
  set('profileGoogleBtn', el=> el.hidden = signedIn);
  set('cloudSyncNowBtn', el=> el.hidden = !signedIn);
  set('cloudHint', el=> el.hidden = signedIn);
  const info = cloudStatusInfo();
  set('cloudStatus', el=>{ el.textContent = info.text; el.className = 'hint cloudStatus' + (info.cls ? ' ' + info.cls : ''); });
  updateSyncStatus();
}



// ---------- when something fails ----------
export function cloudFail(e){
  const code = (e && e.code) || '';
  if(!navigator.onLine || code === 'unavailable' || code === 'vocabri/timeout') return setCloudState('offline');
  if(code === 'permission-denied' || code === 'unauthenticated') return setCloudState('error', 'sin permiso (revisa las reglas de Firestore)');
  if(code === 'resource-exhausted') return setCloudState('error', 'cuota de Firebase agotada');
  if(code === 'vocabri/too-large') return setCloudState('error', 'demasiados datos');
  setCloudState('error', code || 'error desconocido');
}



// ---------- the sync itself ----------
export async function cloudSync(opts){
  opts = opts || {};
  if(!S.cloudApi || !S.cloudUser || S.cloudBusy) return false;
  if(!navigator.onLine){ setCloudState('offline'); return false; }
  S.cloudBusy = true; S.cloudDirty = false; clearTimeout(S.cloudTimer); S.cloudLastRun = Date.now();
  setCloudState('syncing');
  const syncBtn = document.getElementById('cloudSyncNowBtn');
  if(syncBtn) syncBtn.disabled = true;
  try{
    const uid = S.cloudUser.uid;
    const local = collectCloudData();
    let remote = null;
    try{ remote = await cloudWithTimeout(S.cloudApi.getProgress(uid), CLOUD_TIMEOUT_MS); }
    catch(e){ cloudFail(e); return false; }

    const pendingReset = localStorage.getItem(CLOUD_PENDING_RESET_KEY) === '1';
    const lastUid = localStorage.getItem(CLOUD_UID_KEY), lastRev = localStorage.getItem(CLOUD_REV_KEY);
    let finalData = local, replaceAll = false;
    const cloudData = remote ? sanitizeCloudObject(cloudParse(remote.data, {})) : null;
    if(remote && !pendingReset){
      if(lastUid && lastUid !== uid && Object.keys(local).length){
        // Another Google account on a device that already holds data
        const combine = window.confirm('Este dispositivo ya tiene datos de otra cuenta de Vocabri.\n\nAceptar: combinarlos con la cuenta que acabas de iniciar.\nCancelar: usar solo los datos de esta cuenta (se reemplazan los de este dispositivo).');
        if(combine) finalData = mergeProgressData(local, cloudData);
        else { finalData = cloudData; replaceAll = true; }
      } else if(lastUid === uid && remote.rev && remote.rev === lastRev){
        finalData = local;                 // nobody else wrote since our last sync: this device is up to date (deletions and resets propagate)
      } else {
        finalData = mergeProgressData(local, cloudData);
      }
    }
    const changed = applyCloudData(finalData, local, replaceAll);

    const json = JSON.stringify(finalData);
    if(json.length > CLOUD_MAX_PAYLOAD_CHARS){ cloudFail(Object.assign(new Error('too large'), {code:'vocabri/too-large'})); return false; }
    let rev = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    let queued = false;
    if(remote && remote.rev && !pendingReset && cloudDataEqual(finalData, cloudData)){
      rev = remote.rev;                                            // the account already has exactly this: no write needed
    } else {
      try{
        await cloudWithTimeout(S.cloudApi.setProgress(uid, {schema: 1, app: 'vocabri', rev: rev, data: json, count: Object.keys(finalData).length, clientUpdatedAt: Date.now()}), CLOUD_TIMEOUT_MS);
      }catch(e){
        if(e && e.code === 'vocabri/timeout') queued = true;       // Firestore keeps the write and sends it when the connection returns
        else { cloudFail(e); return false; }
      }
    }
    localStorage.setItem(CLOUD_UID_KEY, uid);
    localStorage.setItem(CLOUD_REV_KEY, rev);
    localStorage.removeItem(CLOUD_PENDING_RESET_KEY);
    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(Date.now()));
    if(changed) reloadStateFromStorage();
    setCloudState(queued ? 'offline' : 'synced');
    return true;
  } finally {
    S.cloudBusy = false;
    const b = document.getElementById('cloudSyncNowBtn'); if(b) b.disabled = false;
    if(S.cloudDirty) scheduleCloudPush();
  }
}


export function scheduleCloudPush(){
  clearTimeout(S.cloudTimer);
  S.cloudTimer = setTimeout(()=>{ cloudSync({reason: 'change'}); }, CLOUD_DEBOUNCE_MS);
}


export function cloudNoteChange(k){
  if(S.cloudApplying || !S.cloudUser || !S.cloudApi || !isCloudKey(k)) return;
  if(CLOUD_NO_TRIGGER_PREFIXES.some(p=> k.indexOf(p) === 0)) return;
  S.cloudDirty = true;
  scheduleCloudPush();
}


// Every write to localStorage (there are many call sites) marks the data as changed.
export function installCloudStorageHook(){
  if(Storage.prototype.__vocabriCloudHooked) return;
  const origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function(k){ const r = origSet.apply(this, arguments); if(this === window.localStorage) cloudNoteChange(k); return r; };
  Storage.prototype.removeItem = function(k){ const r = origRemove.apply(this, arguments); if(this === window.localStorage) cloudNoteChange(k); return r; };
  Storage.prototype.__vocabriCloudHooked = true;
}



// ---------- authentication ----------
export function cloudUserFrom(fb){ return {uid: fb.uid, name: fb.displayName || '', email: fb.email || '', picture: fb.photoURL || ''}; }


export async function onCloudAuthChanged(fbUser){
  if(!fbUser){
    S.cloudUser = null;
    try{ localStorage.removeItem('vocabri_user'); }catch(e){}
    setCloudState('local');
    return;
  }
  S.cloudUser = cloudUserFrom(fbUser);
  try{ localStorage.setItem('vocabri_user', JSON.stringify(S.cloudUser)); }catch(e){}
  setCloudState('connecting');
  // users/{uid}: created / refreshed in the background (queued by Firestore when offline)
  S.cloudApi.upsertUser(S.cloudUser.uid, {displayName: S.cloudUser.name, email: S.cloudUser.email, photoURL: S.cloudUser.picture}).catch(()=>{});
  await cloudSync({reason: 'login'});
}


export async function onFirebaseReady(){
  if(S.cloudApi || !window.VocabriFirebase) return;
  S.cloudApi = window.VocabriFirebase;
  if(localStorage.getItem(CLOUD_SIGNOUT_PENDING_KEY) === '1'){      // the user signed out while offline
    try{ await S.cloudApi.signOut(); }catch(e){}
    try{ localStorage.removeItem(CLOUD_SIGNOUT_PENDING_KEY); }catch(e){}
  }
  S.cloudApi.redirectResult().catch(()=>{});                          // finishes a redirect-based sign-in, if there was one
  S.cloudApi.onAuthStateChanged(onCloudAuthChanged);
}


export async function cloudSignInClick(){
  const btn = document.getElementById('profileGoogleBtn'), label = document.getElementById('profileGoogleBtnLabel');
  const busy = (b)=>{ btn.disabled = b; label.textContent = b ? 'Conectando…' : 'Iniciar sesión con Google'; };
  if(!S.cloudApi){
    if(!navigator.onLine){ setCloudMessage('📴 Necesitas conexión a internet para iniciar sesión.', 'warn'); return; }
    if(typeof window.vocabriLoadFirebase !== 'function'){ setCloudMessage('⚠️ El servicio de sincronización no está disponible.', 'warn'); return; }
    busy(true);
    try{ await window.vocabriLoadFirebase(); }
    catch(e){
      busy(false);
      setCloudMessage((e && e.code === 'vocabri/not-configured')
        ? '⚙️ La sincronización aún no está configurada en esta versión de la app.'
        : '⚠️ No se pudo cargar el servicio de sincronización. Revisa tu conexión o reinicia la app.', 'warn');
      return;
    }
    await onFirebaseReady();
  }
  busy(true);
  try{ await S.cloudApi.signIn(); }
  catch(e){
    const code = (e && e.code) || '';
    if(code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request'){
      setCloudMessage('⚠️ No se pudo iniciar sesión' + (code ? ' (' + code + ')' : '') + '.', 'bad');
    }
  } finally { busy(false); }
}


export async function cloudLogoutClick(){
  const b = document.getElementById('profileLogoutBtn');
  const flash = (t)=>{ const o = b.textContent; b.textContent = t; setTimeout(()=>{ b.textContent = o; }, 1800); };
  if(!S.cloudUser && !cloudMirrorUser()){ flash('No hay sesión activa que cerrar'); return; }
  if(S.cloudApi && S.cloudUser){
    try{ await cloudWithTimeout(cloudSync({reason: 'logout'}), 4000); }catch(e){}        // last push, best effort
    try{ await S.cloudApi.signOut(); }catch(e){}
  } else {
    try{ localStorage.setItem(CLOUD_SIGNOUT_PENDING_KEY, '1'); }catch(e){}           // signed out offline: finish it when Firebase loads
  }
  S.cloudUser = null;
  try{ localStorage.removeItem('vocabri_user'); }catch(e){}
  setCloudState('local');
  flash('Sesión cerrada');
}


export function onFirebaseUnavailable(detail){
  S.cloudApi = null;
  if(detail && detail.code === 'vocabri/not-configured'){
    // No Firebase config: a leftover session copy is meaningless
    try{ localStorage.removeItem('vocabri_user'); }catch(err){}
    setCloudState('local');
  } else {
    setCloudState('unavailable');
  }
}


export function initCloud(){
  installCloudStorageHook();
  document.getElementById('profileGoogleBtn').onclick = cloudSignInClick;
  document.getElementById('cloudSyncNowBtn').onclick = ()=> cloudSync({reason: 'manual'});
  document.getElementById('profileLogoutBtn').onclick = cloudLogoutClick;
  window.addEventListener('vocabri-firebase-ready', onFirebaseReady);
  window.addEventListener('vocabri-firebase-unavailable', (e)=> onFirebaseUnavailable(e && e.detail));
  if(window.VocabriFirebase) onFirebaseReady();
  else if(window.VocabriFirebaseUnavailable) onFirebaseUnavailable(window.VocabriFirebaseUnavailable);   // el aviso llegó antes de que esta pantalla escuchara
  window.addEventListener('online', ()=>{
    if(!S.cloudApi && typeof window.vocabriLoadFirebase === 'function') window.vocabriLoadFirebase().catch(()=>{});
    else if(S.cloudUser) cloudSync({reason: 'online'});
  });
  window.addEventListener('offline', ()=>{ if(S.cloudUser) setCloudState('offline'); });
  document.addEventListener('visibilitychange', ()=>{
    if(!S.cloudUser) return;
    if(document.hidden){ if(S.cloudDirty) cloudSync({reason: 'hidden'}); }
    else if(Date.now() - S.cloudLastRun > CLOUD_RESUME_MIN_GAP_MS) cloudSync({reason: 'resume'});
  });
  setInterval(()=>{ if(S.cloudState === 'synced') renderAccountUi(); }, 60000);     // refreshes "hace X min"
  renderAccountUi();
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [5897, function(){
document.getElementById('exportBtn').onclick = exportBackup;
  }],
  [5898, function(){
document.getElementById('importBtn').onclick = ()=> document.getElementById('importFile').click();
  }],
  [5899, function(){
document.getElementById('shareProgressBtn').onclick = shareProgressCard;
  }],
  [5900, function(){
document.getElementById('importFile').onchange = (e)=>{
  const f = e.target.files && e.target.files[0];
  if(f) importBackupFile(f);
};
  }],
  [6361, function(){
S.cloudApi = null;
  }],
  [6362, function(){
S.cloudUser = null;
  }],
  [6363, function(){
S.cloudState = 'local';
  }],
  [6364, function(){
S.cloudDetail = '';
  }],
  [6365, function(){
S.cloudBusy = false;
  }],
  [6365, function(){
S.cloudDirty = false;
  }],
  [6365, function(){
S.cloudApplying = false;
  }],
  [6365, function(){
S.cloudTimer = null;
  }],
  [6365, function(){
S.cloudLastRun = 0;
  }],
  [6366, function(){
S.cloudMessage = {text:'', cls:'', until:0};
  }],
  [6790, function(){
initCloud();
  }],
  [6793, function(){


// Apply button animations after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyButtonAnimations);
} else {
  applyButtonAnimations();
}
  }]
];

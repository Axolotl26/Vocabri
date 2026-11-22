// Vocabri — módulo "translator" (generado a partir de app.js)
import { S } from './core/shared.js';
import { renderMyCardsHome } from './myCards.js';
import { haptic } from './speech.js';
import { addWord } from './state.js';
import { isJa } from './lang.js';

// Direcciones según el idioma activo: inglés ↔ español o japonés ↔ español
const DIRS = () => isJa() ? { a: 'ja-es', b: 'es-ja', name: 'Japonés', code: 'ja' } : { a: 'en-es', b: 'es-en', name: 'Inglés', code: 'en' };
const fromTo = dir => { const d = DIRS(); return dir === d.a ? [d.code, 'es'] : ['es', d.code]; };



// --- Translator (free public APIs via fetch: MyMemory first, Lingva as fallback) ---
export const TR_MAX_CHARS = 500;

      // MyMemory's per-request limit
export const TR_TIMEOUT_MS = 10000;

           // 'en-es' | 'es-en'


       // last successful translation (what "Guardar" stores)




export function updateTrLabels(){
  const d = DIRS(), fwd = S.trDir === d.a;
  document.getElementById('trFromLabel').textContent = fwd ? d.name : 'Español';
  document.getElementById('trToLabel').textContent = fwd ? 'Español' : d.name;
  const inp = document.getElementById('trInput'); if(inp) inp.setAttribute('lang', fromTo(S.trDir)[0]);
  const sb = document.getElementById('trSub'); if(sb) sb.textContent = isJa() ? 'Traduce frases entre japonés y español.' : 'Traduce frases entre inglés y español y guárdalas en tus tarjetas.';
  const sv = document.getElementById('trSaveBtn'); if(sv) sv.style.display = isJa() ? 'none' : '';   // Mis Tarjetas es de inglés
  const hb = document.getElementById('trHint');
  if(hb && !document.getElementById('trMailBox')){
    const d = document.createElement('details'); d.id = 'trMailBox'; d.className = 'hint'; d.style.cssText = 'margin-top:8px;text-align:left';
    d.innerHTML = '<summary style="cursor:pointer;font-weight:800">¿Se agotó el límite? Sube el cupo (opcional)</summary><p style="margin:8px 0">MyMemory da 10 veces más traducciones diarias si le indicas un correo. Se guarda solo en este dispositivo y únicamente se envía a MyMemory.</p><input id="trMailInput" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@ejemplo.com" style="width:100%;box-sizing:border-box;padding:10px;border-radius:12px;border:2px solid rgba(127,127,127,.5);font:inherit">';
    hb.insertAdjacentElement('afterend', d);
    const inp = d.querySelector('#trMailInput'); inp.value = trEmail();
    inp.addEventListener('change', () => { try{ localStorage.setItem('ci_tr_email', inp.value.trim()); }catch(e){} });
  }
  const h = document.getElementById('trHint'); if(h) h.textContent = 'Traducción en línea (MyMemory, con respaldo en Lingva). Requiere conexión a internet · máx. 500 caracteres.' + (isJa() ? ' En japonés las traducciones no se guardan en Mis Tarjetas.' : '');
}


export function fetchWithTimeout(url, ms){
  const ctrl = new AbortController();
  const timer = setTimeout(()=> ctrl.abort(), ms);
  return fetch(url, {signal: ctrl.signal}).finally(()=> clearTimeout(timer));
}


export function decodeHtmlEntities(str){
  const t = document.createElement('textarea');
  t.innerHTML = str;
  return t.value;
}


export async function translateMyMemory(text, from, to){
  const mail = trEmail();
  const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + from + '|' + to + (mail ? '&de=' + encodeURIComponent(mail) : '');
  const res = await fetchWithTimeout(url, TR_TIMEOUT_MS);
  let data = null;
  try{ data = await res.json(); }catch(e){}
  // MyMemory avisa del cupo agotado con HTTP 429 y un texto «NEXT AVAILABLE IN xx HOURS…»
  if(!res.ok || !data || Number(data.responseStatus) !== 200){
    const warn = data && data.responseData && data.responseData.translatedText || '';
    const err = new Error(/MYMEMORY WARNING/i.test(warn) || res.status === 429 || (data && Number(data.responseStatus) === 429) ? 'mm_quota' : (res.ok ? 'mm_' + (data && data.responseStatus) : 'http_' + res.status));
    const m = /NEXT AVAILABLE IN\s+(\d+)\s+HOURS?\s+(\d+)\s+MINUTES?/i.exec(warn); if(m) err.wait = (+m[1]) * 60 + (+m[2]);
    throw err;
  }
  const out = data.responseData && data.responseData.translatedText;
  if(!out) throw new Error('mm_empty');
  if(/MYMEMORY WARNING/i.test(out)) throw new Error('mm_quota');
  return out;
}


// Lingva es código abierto y tiene varias instancias públicas: se prueban en orden hasta que una responda.
export const LINGVA_HOSTS = ['https://lingva.ml'];   // las demás instancias públicas no envían cabeceras CORS y el navegador las bloquea
export async function translateLingva(text, from, to, host){
  const url = (host || LINGVA_HOSTS[0]) + '/api/v1/' + from + '/' + to + '/' + encodeURIComponent(text);
  const res = await fetchWithTimeout(url, TR_TIMEOUT_MS);
  if(!res.ok) throw new Error('http_' + res.status);
  const data = await res.json();
  if(!data || !data.translation) throw new Error('lingva_empty');
  return data.translation;
}

const todayK = () => new Date().toISOString().slice(0, 10);
const mmBlockedToday = () => { try{ return localStorage.getItem('ci_mm_quota') === todayK(); }catch(e){ return false; } };
const markMmQuota = () => { try{ localStorage.setItem('ci_mm_quota', todayK()); }catch(e){} };

const timeout = (ms, tag) => new Promise((_, rej) => setTimeout(() => rej(new Error(tag)), ms));
let builtInOff = false;   // si el traductor integrado no existe o se cuelga, no se vuelve a intentar en esta sesión
async function translateBuiltIn(text, from, to){
  const T = typeof self !== 'undefined' && self.Translator;
  if(builtInOff || !T || typeof T.availability !== 'function') throw new Error('no_builtin');
  try{
    const av = await Promise.race([T.availability({ sourceLanguage: from, targetLanguage: to }), timeout(1500, 'builtin_timeout')]);
    if(av !== 'available') throw new Error('no_builtin');   // modelo sin descargar: se usan los servicios en línea
    const tr = await Promise.race([T.create({ sourceLanguage: from, targetLanguage: to }), timeout(4000, 'builtin_timeout')]);
    return await Promise.race([tr.translate(text), timeout(6000, 'builtin_timeout')]);
  }catch(e){ builtInOff = true; throw e; }
}
export const trEmail = () => { try{ const v = (localStorage.getItem('ci_tr_email') || '').trim(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : ''; }catch(e){ return ''; } };

export async function runTranslation(text, from, to){
  try{ return await translateBuiltIn(text, from, to); }
  catch(eb){ /* sin traductor integrado (o tarda): se usan los servicios en línea */ }
  let firstError;
  if(!mmBlockedToday()){
    try{
      return decodeHtmlEntities(await translateMyMemory(text, from, to));
    }catch(e1){
      firstError = e1;
      if(e1 && (e1.message === 'mm_quota' || e1.message === 'mm_429' || e1.message === 'http_429')) markMmQuota();   // no insistir hoy: ir directo a los respaldos
    }
  }else{
    firstError = new Error('mm_quota');
  }
  let lastErr;
  for(const host of LINGVA_HOSTS){
    try{
      return decodeHtmlEntities(await translateLingva(text, from, to, host));
    }catch(e2){ lastErr = e2; }
  }
  const err = new Error('all_failed');
  err.wait = firstError && firstError.wait;
  err.first = firstError;
  err.second = lastErr;
  throw err;
}


export function translatorErrorMessage(err){
  if(!navigator.onLine) return '📶 Sin conexión a internet. Conéctate para traducir.';
  const e1 = err && err.first, e2 = err && err.second;
  const timedOut = [e1, e2].some(e=> e && e.name === 'AbortError');
  if(timedOut) return '⏱️ El servicio tardó demasiado en responder. Inténtalo de nuevo.';
  const quota = e1 && (e1.message === 'mm_quota' || e1.message === 'mm_429' || e1.message === 'http_429');
  if(quota){ const w = err && err.wait; return '⚠️ Se alcanzó el límite gratuito de traducciones de hoy' + (w ? ' (vuelve en ~' + Math.ceil(w / 60) + ' h)' : '') + ' y el servicio de respaldo no respondió. Puedes subir el cupo poniendo tu correo aquí abajo, o probar con Chrome/Edge (traducen sin límite en tu dispositivo).'; }
  return '⚠️ No se pudo traducir en este momento. Revisa tu conexión e inténtalo de nuevo.';
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [5205, function(){
S.trDir = DIRS().a;
  }],
  [5206, function(){
S.trLastResult = null;
  }],
  [5207, function(){
S.trLastSource = null;
  }],
  [5208, function(){
S.trLastDir = null;
  }],
  [5209, function(){
S.trSaved = false;
  }],
  [5270, function(){
document.getElementById('trSwapBtn').onclick = ()=>{
  S.trDir = (S.trDir === DIRS().a) ? DIRS().b : DIRS().a;
  updateTrLabels();
};
  }],
  [5274, function(){
document.getElementById('trGoBtn').onclick = async ()=>{
  const btn = document.getElementById('trGoBtn');
  if(btn.disabled) return;
  const text = document.getElementById('trInput').value.trim();
  const statusEl = document.getElementById('trStatus');
  if(!text){ statusEl.textContent = 'Escribe algo para traducir.'; return; }
  if(text.length > TR_MAX_CHARS){ statusEl.textContent = 'El texto es demasiado largo (máx. ' + TR_MAX_CHARS + ' caracteres).'; return; }
  const dir = S.trDir;
  const [from, to] = fromTo(dir);
  btn.disabled = true;
  btn.textContent = 'Traduciendo…';
  btn.setAttribute('aria-busy', 'true');
  statusEl.textContent = '⏳ Traduciendo…';
  document.getElementById('trResultBox').style.display = 'none';
  try{
    const out = (await runTranslation(text, from, to)).trim();
    if(!out) throw new Error('empty');
    S.trLastResult = out; S.trLastSource = text; S.trLastDir = dir; S.trSaved = false;
    document.getElementById('trResultText').textContent = out;
    document.getElementById('trResultBox').style.display = '';
    statusEl.textContent = '';
  }catch(e){
    statusEl.textContent = translatorErrorMessage(e);
  }finally{
    btn.disabled = false;
    btn.textContent = 'Traducir';
    btn.removeAttribute('aria-busy');
  }
};
  }],
  [5304, function(){
document.getElementById('trSaveBtn').onclick = async ()=>{
  const statusEl = document.getElementById('trStatus');
  if(!S.trLastResult) return;
  if(isJa()) return;
  if(S.trSaved){ statusEl.textContent = 'Esta traducción ya está en Mis Tarjetas.'; return; }
  const en = S.trLastDir === 'en-es' ? S.trLastSource : S.trLastResult;
  const es = S.trLastDir === 'en-es' ? S.trLastResult : S.trLastSource;
  const ok = await addWord(en, es, 'general');
  if(ok){ S.trSaved = true; haptic(); }
  statusEl.textContent = ok ? '✅ Guardada en Mis Tarjetas.' : 'No se pudo guardar.';
  if(ok && S.view === 'mycards') renderMyCardsHome();
};
  }]
];

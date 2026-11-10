// Vocabri — módulo "translator" (generado a partir de app.js)
import { S } from './core/shared.js';
import { renderMyCardsHome } from './myCards.js';
import { haptic } from './speech.js';
import { addWord } from './state.js';



// --- Translator (free public APIs via fetch: MyMemory first, Lingva as fallback) ---
export const TR_MAX_CHARS = 500;

      // MyMemory's per-request limit
export const TR_TIMEOUT_MS = 10000;

           // 'en-es' | 'es-en'


       // last successful translation (what "Guardar" stores)




export function updateTrLabels(){
  document.getElementById('trFromLabel').textContent = S.trDir === 'en-es' ? 'Inglés' : 'Español';
  document.getElementById('trToLabel').textContent = S.trDir === 'en-es' ? 'Español' : 'Inglés';
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
  const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + from + '|' + to;
  const res = await fetchWithTimeout(url, TR_TIMEOUT_MS);
  if(!res.ok) throw new Error('http_' + res.status);
  const data = await res.json();
  // MyMemory reports quota problems inside the JSON, sometimes with HTTP 200.
  if(Number(data.responseStatus) !== 200) throw new Error('mm_' + data.responseStatus);
  const out = data.responseData && data.responseData.translatedText;
  if(!out) throw new Error('mm_empty');
  if(/MYMEMORY WARNING/i.test(out)) throw new Error('mm_quota');
  return out;
}


export async function translateLingva(text, from, to){
  const url = 'https://lingva.ml/api/v1/' + from + '/' + to + '/' + encodeURIComponent(text);
  const res = await fetchWithTimeout(url, TR_TIMEOUT_MS);
  if(!res.ok) throw new Error('http_' + res.status);
  const data = await res.json();
  if(!data || !data.translation) throw new Error('lingva_empty');
  return data.translation;
}


export async function runTranslation(text, from, to){
  let firstError;
  try{
    return decodeHtmlEntities(await translateMyMemory(text, from, to));
  }catch(e1){
    firstError = e1;
  }
  try{
    return decodeHtmlEntities(await translateLingva(text, from, to));
  }catch(e2){
    const err = new Error('all_failed');
    err.first = firstError;
    err.second = e2;
    throw err;
  }
}


export function translatorErrorMessage(err){
  if(!navigator.onLine) return '📶 Sin conexión a internet. Conéctate para traducir.';
  const e1 = err && err.first, e2 = err && err.second;
  const timedOut = [e1, e2].some(e=> e && e.name === 'AbortError');
  if(timedOut) return '⏱️ El servicio tardó demasiado en responder. Inténtalo de nuevo.';
  const quota = e1 && (e1.message === 'mm_quota' || e1.message === 'mm_429' || e1.message === 'http_429');
  if(quota) return '⚠️ Se alcanzó el límite gratuito del traductor por hoy. Prueba más tarde.';
  return '⚠️ No se pudo traducir en este momento. Revisa tu conexión e inténtalo de nuevo.';
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [5205, function(){
S.trDir = 'en-es';
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
  S.trDir = (S.trDir === 'en-es') ? 'es-en' : 'en-es';
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
  const from = dir === 'en-es' ? 'en' : 'es';
  const to = dir === 'en-es' ? 'es' : 'en';
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

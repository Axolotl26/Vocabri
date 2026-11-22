// Vocabri — módulo "speech" (generado a partir de app.js)
import { S } from './core/shared.js';
import { closeSettings } from './settings.js';
import { pickAlternate } from './core/voices.js';


export function scoreVoice(v){
  const n = (v.name || '').toLowerCase(), uri = (v.voiceURI || '').toLowerCase(), lang = (v.lang || '').toLowerCase().replace('_','-');
  let s = 0;
  if(/espeak|mbrola|festival|flite|speech-dispatcher|pico/.test(n + ' ' + uri)) s -= 10;      // sintetizadores robóticos (Linux)
  // eSpeak-NG expuesto por speech-dispatcher (Firefox/Zen en Linux): nombres como "english-us+male5", "spanish+whisper"
  else if(/^[a-z]+([-_][a-z0-9]+)*\+[a-z_0-9]+$/.test(n) || /\+(male|female|klatt|croak|whisper|f|m)\d*\b/.test(n)) s -= 10;
  if(/natural|neural|online/.test(n)) s += 10;                                                  // Edge / Windows: voces neuronales
  if(/premium|enhanced|siri/.test(n)) s += 8;                                                   // macOS / iOS
  if(/google/.test(n)) s += 6;                                                                  // Chrome (requiere conexión)
  if(/compact/.test(n)) s -= 2;
  if(/microsoft/.test(n)) s += 3;                                                               // voces locales de Windows
  if(/^(samantha|alex|daniel|karen|moira|tessa|ava|allison|susan|paulina|monica|juan|jorge)\b/.test(n)) s += 3; // voces buenas de macOS
  if(v.localService === false) s += 1;
  // Acento preferido: inglés de EE. UU.; español latinoamericano
  if(lang === 'en-us') s += 2; else if(lang === 'en-gb') s += 1;
  if(/^es-(mx|us|419|ve|co|ar|cl)/.test(lang)) s += 2; else if(lang === 'es-es') s += 1;
  return s;
}
export function voiceQuality(v){
  if(!v) return 'none';
  const s = scoreVoice(v);
  return s >= 6 ? 'good' : (s >= 1 ? 'ok' : 'basic');
}
export function bestVoiceFor(lang){
  const pool = S.voices.filter(v=> v.lang.toLowerCase().startsWith(lang));
  if(pool.length === 0) return null;
  return pool.slice().sort((a,b)=> scoreVoice(b)-scoreVoice(a))[0];
}
export function fillVoiceSelect(sel, lang, storeKey){
  if(!sel) return;
  const pool = S.voices.filter(v=> v.lang.toLowerCase().startsWith(lang)).sort((a,b)=> scoreVoice(b)-scoreVoice(a));
  sel.innerHTML = '';
  pool.forEach(v=>{
    const o = document.createElement('option');
    const q = voiceQuality(v);
    o.value = v.voiceURI; o.textContent = (q === 'good' ? '★ ' : '') + v.name + ' (' + v.lang + ')';
    sel.appendChild(o);
  });
  let saved = null;
  try{ saved = localStorage.getItem(storeKey); }catch(e){}
  const fallback = bestVoiceFor(lang);
  if(saved && pool.some(v=> v.voiceURI===saved)) sel.value = saved;
  else if(fallback) sel.value = fallback.voiceURI;
  updateVoiceHint(sel, lang);
}
// Aviso bajo cada selector según la calidad de la voz elegida
export function updateVoiceHint(sel, lang){
  const hint = document.getElementById(lang === 'en' ? 'voiceEnHint' : 'voiceEsHint');
  if(!hint || !sel) return;
  const v = S.voices.find(x=> x.voiceURI === sel.value);
  const q = voiceQuality(v);
  hint.className = 'voiceHint ' + q;
  if(q === 'basic'){
    hint.textContent = '⚠️ Esta voz es básica y puede sonar robótica. Prueba otra de la lista; en Edge (Windows) busca las «Natural», en Chrome las de Google (necesitan conexión) y en Linux instala voces adicionales del sistema.';
  } else if(q === 'good'){
    hint.textContent = '✔ Buena voz.';
  } else {
    hint.textContent = '';
  }
}
export function loadVoices(){
  S.voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  if(S.voices.length === 0){
    // Sin ninguna voz: se dice claro en el panel en vez de dejar listas vacías.
    ['voiceEn', 'voiceEs'].forEach(id => {
      const sel = document.getElementById(id), hint = document.getElementById(id + 'Hint');
      if(sel && !sel.options.length) sel.innerHTML = '<option value="">Sin voces instaladas</option>';
      if(hint){ hint.className = 'voiceHint basic'; hint.textContent = NO_VOICES_MSG; }
    });
    return;
  }
  fillVoiceSelect(document.getElementById('voiceEn'), 'en', 'ci_voice_en');
  fillVoiceSelect(document.getElementById('voiceEs'), 'es', 'ci_voice_es');
}


export const voiceEnEl = document.getElementById('voiceEn');



export const voiceEsEl = document.getElementById('voiceEs');



export const voiceTestBtnEl = document.getElementById('voiceTestBtn');



export const voiceEsTestBtnEl = document.getElementById('voiceEsTestBtn');



export const voiceConfigBtnEl = document.getElementById('voiceConfigBtn');


export const voiceModalCloseEl = document.getElementById('voiceModalClose');



export const voiceModalDoneEl = document.getElementById('voiceModalDoneBtn');




// Voz elegida por el usuario (o la mejor disponible) para un idioma.
export function chosenVoice(lang){
  const l = (lang || 'en').slice(0, 2);
  const el = (l === 'en' || l === 'es') ? document.getElementById(l === 'en' ? 'voiceEn' : 'voiceEs') : null;
  if(!S.voices || S.voices.length === 0) S.voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  return S.voices.find(v => el && v.voiceURI === el.value) || bestVoiceFor(l);
}
// Voz distinta a la principal (para «la otra persona» en las escenas). Si no hay otra, devuelve la principal.
export function alternateVoice(lang){
  const main = chosenVoice(lang);
  return pickAlternate(S.voices, main && main.voiceURI, (lang || 'en').slice(0, 2), scoreVoice) || main;
}
export const NO_VOICES_MSG = '⚠️ Este navegador no tiene ninguna voz de síntesis, por eso no suena nada. En Linux instala «speech-dispatcher» y «espeak-ng» (p. ej. sudo pacman -S speech-dispatcher espeak-ng, o sudo apt install speech-dispatcher espeak-ng) y reinicia el navegador, o usa Google Chrome / Edge (tienen voces en línea). En Windows, Android, iOS y macOS suelen venir de serie.';
/** ¿El navegador no ofrece ninguna voz (o no tiene síntesis)? */
export function noVoicesAtAll(){
  try{ return !('speechSynthesis' in window) || window.speechSynthesis.getVoices().length === 0; }catch(e){ return true; }
}
let _noVoiceWarned = false, _noneAt = 0;
function warnNoVoice(lang){
  if(lang === 'none'){
    const t = Date.now(); if(t - _noneAt < 8000) return; _noneAt = t;
    import('./ui.js').then(m => m.showToast('No hay ninguna voz instalada en este navegador: no se puede reproducir sonido. Mira Ajustes → Configurar voces para ver cómo arreglarlo.', '🔇', 7000)).catch(() => {});
    return;
  }
  if(_noVoiceWarned) return; _noVoiceWarned = true;
  const name = lang === 'ja' ? 'japonés' : 'inglés';
  const msg = lang === 'ja-approx' ? 'Tu dispositivo no tiene voz japonesa: se usa una aproximación con voz en español. Para el sonido real instala una voz japonesa en el sistema.' : 'No hay voz en ' + name + ' en este dispositivo. Instala una en los ajustes de voz del sistema o prueba otro navegador.';
  import('./ui.js').then(m => m.showToast(msg, '🔇', 6000)).catch(() => {});
}
/** ¿Hay alguna voz japonesa instalada? */
export function hasJaVoice(){
  try{
    const list = (S.voices && S.voices.length) ? S.voices : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
    return list.some(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith('ja'));
  }catch(e){ return false; }
}
/** Romaji → texto que una voz en español lee de forma parecida al japonés. */
export function romajiForEs(rom){
  return String(rom || '').split('/')[0].toLowerCase().replace(/[āâ]/g, 'a').replace(/[īî]/g, 'i').replace(/[ūû]/g, 'u').replace(/[ēê]/g, 'e').replace(/[ōô]/g, 'o')
    .replace(/[^a-z ]/g, '').replace(/j/g, 'y').replace(/\s+/g, ' ').trim();
}

// opts: { voice, onend }
export function speak(text, lang, rate, opts){
  if(!('speechSynthesis' in window) || !text) return;
  const o = opts || {};
  const synth = window.speechSynthesis;
  const run = (voice, retried) => {
    try{
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate || 0.95;
      if(voice) u.voice = voice;
      let started = false, done = false;
      const finish = () => { if(done) return; done = true; if(o.onend) o.onend(); };
      u.onstart = () => { started = true; };
      u.onend = finish;
      u.onerror = (ev) => {
        const err = ev && ev.error;
        if(err === 'canceled' || err === 'interrupted'){ finish(); return; }
        if(!retried){ try{ synth.cancel(); }catch(e){} setTimeout(() => run(null, true), 80); }   // reintento con la voz por defecto
        else finish();
      };
      synth.speak(u);
      // Algunos navegadores se quedan mudos tras cancel(): si no arrancó, un solo reintento
      setTimeout(() => {
        if(!started && !done){
          if(!synth.getVoices().length){ warnNoVoice('none'); finish(); }
          else if(!retried && !synth.speaking){ try{ synth.cancel(); }catch(e){} run(voice, true); }
        }
      }, 1200);
    }catch(e){ if(o.onend) o.onend(); }
  };
  try{
    synth.cancel();
    let v = o.voice || chosenVoice(lang);
    const l2 = lang.toLowerCase().slice(0, 2);
    if(l2 === 'ja' && !v && o.rom && S.voices && S.voices.length > 0){
      // Sin voz japonesa: se lee el romaji con la voz en español (las vocales y la mayoría de sílabas suenan parecido)
      text = romajiForEs(o.rom); lang = 'es-ES'; v = chosenVoice('es'); warnNoVoice('ja-approx');
    } else if(!v && (l2 === 'en' || l2 === 'ja') && S.voices && S.voices.length > 0) warnNoVoice(l2);
    setTimeout(() => run(v, false), 40);   // evita que cancel() + speak() inmediatos se pierdan
  }catch(e){}
}

export function speakAlt(text, lang, rate, opts){
  speak(text, lang, rate, Object.assign({ voice: alternateVoice(lang) }, opts || {}));
}



// --- Sound effects (Web Audio API, no audio files) and haptic feedback ---



export function getAudioCtx(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  if(!S._audioCtx) S._audioCtx = new AC();
  if(S._audioCtx.state === 'suspended') S._audioCtx.resume();
  return S._audioCtx;
}


export function tone(freq, start, dur, type, vol){
  const ctx = getAudioCtx();
  if(!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}


export function playSfx(kind){
  if(!S.sfxEnabled) return;
  try{
    if(kind === 'correct'){ tone(660, 0, .10, 'sine'); tone(880, .09, .18, 'sine'); }
    else if(kind === 'levelup'){
      [523.25, 659.25, 783.99, 1046.5].forEach((f,i)=> tone(f, i*.11, .22, 'triangle', .2));
      [1046.5, 1318.5, 1568].forEach(f=> tone(f, .46, .55, 'sine', .11));          // acorde final
    }
    else if(kind === 'levelupBig'){
      [392, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f,i)=> tone(f, i*.09, .24, 'triangle', .2));
      [523.25, 659.25, 783.99, 1046.5, 1568].forEach(f=> tone(f, .7, .9, 'sine', .1));  // acorde largo
      [2093, 2637, 3136].forEach((f,i)=> tone(f, .95 + i*.07, .2, 'sine', .06));      // destellos
    }
    else if(kind === 'chest'){
      tone(150, 0, .12, 'sawtooth', .08); tone(210, .1, .14, 'sawtooth', .08);       // crujido de la tapa
      [783.99, 1046.5, 1318.5, 1568, 2093].forEach((f,i)=> tone(f, .3 + i*.08, .26, 'triangle', .16));
    }
    else if(kind === 'wrong'){ tone(220, 0, .18, 'sawtooth', .14); tone(155, .14, .30, 'sawtooth', .14); }
  }catch(e){}
}


export function haptic(){
  if(!S.sfxEnabled) return;
  try{ if(navigator.vibrate) navigator.vibrate([40]); }catch(e){}
}


export function updateSfxToggleUi(){
  const b = document.getElementById('sfxToggleBtn');
  if(b) b.textContent = S.sfxEnabled ? '🔊 Efectos y vibración: Activados' : '🔇 Efectos y vibración: Desactivados';
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [3556, function(){
S.voices = [];
  }],
  [3590, function(){
if('speechSynthesis' in window){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
  }],
  [3595, function(){
if(voiceEnEl) voiceEnEl.onchange = (e)=>{ try{ localStorage.setItem('ci_voice_en', e.target.value); }catch(err){} updateVoiceHint(voiceEnEl, 'en'); };
  }],
  [3598, function(){
if(voiceEsEl) voiceEsEl.onchange = (e)=>{ try{ localStorage.setItem('ci_voice_es', e.target.value); }catch(err){} updateVoiceHint(voiceEsEl, 'es'); };
  }],
  [3601, function(){
if(voiceTestBtnEl) voiceTestBtnEl.onclick = ()=> speak("This is what the selected voice sounds like in English.", 'en-US');
  }],
  [3604, function(){
if(voiceEsTestBtnEl) voiceEsTestBtnEl.onclick = ()=> speak("Así es como suena la voz seleccionada en español.", 'es-ES');
  }],
  [3607, function(){
if(voiceConfigBtnEl){
  voiceConfigBtnEl.onclick = ()=>{
    closeSettings();
    const ov = document.getElementById('voiceModalOverlay');
    if(ov) ov.style.display = 'flex';
  };
}
  }],
  [3615, function(){
if(voiceModalCloseEl) voiceModalCloseEl.onclick = ()=> document.getElementById('voiceModalOverlay').style.display = 'none';
  }],
  [3618, function(){
if(voiceModalDoneEl) voiceModalDoneEl.onclick = ()=> document.getElementById('voiceModalOverlay').style.display = 'none';
  }],
  [3673, function(){
document.getElementById('speakFront').onclick = (e)=>{
  e.stopPropagation();
  { const f = document.getElementById('frontText'); speak(f.dataset.say || f.textContent, f.dataset.lang || 'en-US', undefined, { rom: f.dataset.rom }); }
};
  }],
  [3677, function(){
document.getElementById('speakBack').onclick = (e)=>{
  e.stopPropagation();
  speak(document.getElementById('backText').textContent, 'es-ES');
};
  }],
  [3682, function(){

// 🐢 Slow playback of the English phrase (rate 0.6)
document.getElementById('speakFrontSlow').onclick = (e)=>{
  e.stopPropagation();
  { const f = document.getElementById('frontText'); speak(f.dataset.say || f.textContent, f.dataset.lang || 'en-US', 0.6, { rom: f.dataset.rom }); }
};
  }],
  [3688, function(){


// Repaso: botones de audio (antes no hacían nada)
[['reviewSpeakFront','reviewFrontText','en-US'],['reviewSpeakFrontSlow','reviewFrontText','en-US',0.6],['reviewSpeakBack','reviewBackText','es-ES']].forEach(([b,t,l,r])=>{
  const el = document.getElementById(b);
  if(el) el.onclick = (e)=>{ e.stopPropagation(); const f = document.getElementById(t); speak(f.dataset.say || f.textContent, (f.dataset.lang && l === 'en-US') ? f.dataset.lang : l, r, { rom: f.dataset.rom }); };
});
  }],
  [3694, function(){
S.sfxEnabled = true;
  }],
  [3695, function(){
try{ S.sfxEnabled = localStorage.getItem('vocabri_sfx') !== '0'; }catch(e){}
  }],
  [3696, function(){
S._audioCtx = null;
  }],
  [3733, function(){

// Browsers only allow audio after a user gesture: unlock the context on the first touch.
document.addEventListener('pointerdown', ()=>{ if(S.sfxEnabled) getAudioCtx(); }, {once:true});
  }],
  [3738, function(){
document.getElementById('sfxToggleBtn').onclick = ()=>{
  S.sfxEnabled = !S.sfxEnabled;
  try{ localStorage.setItem('vocabri_sfx', S.sfxEnabled ? '1' : '0'); }catch(e){}
  updateSfxToggleUi();
  if(S.sfxEnabled){ playSfx('correct'); haptic(); }
};
  }],
  [3744, function(){
updateSfxToggleUi();
  }]
];

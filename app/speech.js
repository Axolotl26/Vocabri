// Vocabri — módulo "speech" (generado a partir de app.js)
import { S } from './core/shared.js';
import { closeSettings } from './settings.js';


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
  if(S.voices.length === 0) return;
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




export function speak(text, lang, rate){
  if(!('speechSynthesis' in window) || !text) return;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate || 0.95;
    const selId = lang.startsWith('en') ? 'voiceEn' : 'voiceEs';
    const chosenURI = document.getElementById(selId).value;
    const v = S.voices.find(v=> v.voiceURI === chosenURI) || bestVoiceFor(lang.slice(0,2));
    if(v) u.voice = v;
    window.speechSynthesis.speak(u);
  }catch(e){}
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
    else if(kind === 'levelup'){ [523.25, 659.25, 783.99, 1046.5].forEach((f,i)=> tone(f, i*.11, .22, 'triangle', .2)); }
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
  speak(document.getElementById('frontText').textContent, 'en-US');
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
  speak(document.getElementById('frontText').textContent, 'en-US', 0.6);
};
  }],
  [3688, function(){


// Repaso: botones de audio (antes no hacían nada)
[['reviewSpeakFront','reviewFrontText','en-US'],['reviewSpeakFrontSlow','reviewFrontText','en-US',0.6],['reviewSpeakBack','reviewBackText','es-ES']].forEach(([b,t,l,r])=>{
  const el = document.getElementById(b);
  if(el) el.onclick = (e)=>{ e.stopPropagation(); speak(document.getElementById(t).textContent, l, r); };
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

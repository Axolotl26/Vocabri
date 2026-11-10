// Vocabri — módulo "exam" (generado a partir de app.js)
import { shortcutAllowed, activationKeyFree } from './shortcuts.js';
import { S } from './core/shared.js';
import { setKnownWordsProvider, WRITE_FUZZY_THRESHOLD, normalizeAnswer, calcularDistanciaLevenshtein, normalizeForCompare, writtenVariants, digitsOf, TYPO_EXACT_UP_TO, TYPO_ONE_EDIT_UP_TO, GRAMMAR_SUFFIXES, distanciaEdicionPalabra, isGrammaticalVariant, isTypoOf, wordsMatchLikeTypos, describeWordDiffs, evaluateWrittenAnswer, closeCallSuffix, writeAnswerOk, nearMissNote, CONTRACTIONS, CONTRACTIONS_NO_APOSTROPHE, normalizeSpeech, similarity, isSpeakable, speakTargets } from './core/answerMatch.js';
export { WRITE_FUZZY_THRESHOLD, normalizeAnswer, calcularDistanciaLevenshtein, normalizeForCompare, writtenVariants, digitsOf, TYPO_EXACT_UP_TO, TYPO_ONE_EDIT_UP_TO, GRAMMAR_SUFFIXES, distanciaEdicionPalabra, isGrammaticalVariant, isTypoOf, wordsMatchLikeTypos, describeWordDiffs, evaluateWrittenAnswer, closeCallSuffix, writeAnswerOk, nearMissNote, CONTRACTIONS, CONTRACTIONS_NO_APOSTROPHE, normalizeSpeech, similarity, isSpeakable, speakTargets };

import { getCurrentStage, itemsFor, readStored, setCurrentStage } from './core/dataRegistry.js';
import { closeExamResults, examWrongListHtml, finishExam, showMap, showModalFromTop } from './map.js';
import { EXAM_DICTATION_COUNT, EXAM_LIVES, EXAM_MC_COUNT, EXAM_QUESTIONS, EXAM_SPEAK_COUNT, SPEAK_MATCH_THRESHOLD, examItemsFor } from './mapData.js';
import { haptic, playSfx, speak } from './speech.js';
import { srsGrade } from './state.js';
import { examMascotKind, hideExamMascot, scrollTopNow, setMascotIn, showExamMascot } from './ui.js';



// --- Exam view (multiple-choice + writing + pronunciation, with 5 lives) ---



export const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;


export const SPEECH_REC_SUPPORTED = !!SpeechRec;


export const TTS_SUPPORTED = ('speechSynthesis' in window) && (typeof SpeechSynthesisUtterance !== 'undefined');






// Every word that appears in the phrases (and the player's own cards): a typed word that IS one of
// them but isn't the expected word is another real word, not a typo.
export const _knownWordsCache = {en:null, es:null, size:-1};


export function knownWords(lang){
  const key = (lang === 'en') ? 'en' : 'es';
  if(_knownWordsCache.size !== S.customWords.length){ _knownWordsCache.en = null; _knownWordsCache.es = null; _knownWordsCache.size = S.customWords.length; }
  if(!_knownWordsCache[key]){
    const set = new Set();
    const col = (key === 'en') ? 0 : 1;
    itemsFor('Todas').forEach(it=>{
      normalizeForCompare(String(it[col] || ''), key).split(' ').forEach(w=>{ if(w) set.add(w); });
    });
    _knownWordsCache[key] = set;
  }
  return _knownWordsCache[key];
}

setKnownWordsProvider(knownWords);   // answerMatch.js (puro) consulta las palabras conocidas a través de este proveedor






export function pickDistractors(correctEs, count){
  const all = itemsFor('Todas').map(it=> it[1]);
  const seen = new Set([correctEs]);
  const out = [];
  let guard = 0;
  while(out.length < count && guard < 200){
    guard++;
    const pick = all[Math.floor(Math.random()*all.length)];
    if(!seen.has(pick)){ seen.add(pick); out.push(pick); }
  }
  return out;
}


// Distractores del examen: misma categoría, longitud y nº de palabras parecidos; sin sinónimos/variantes de la respuesta
// y sin traducciones de otras preguntas del mismo examen (no regalan pistas).
export function examDistractors(it, col, count, avoid){
  const lang = col === 1 ? 'es' : 'en';
  const correct = String(it[col]);
  const cn = normalizeForCompare(correct, lang);
  const variants = new Set(writtenVariants(correct, lang).map(v => v.norm));
  const len = correct.length, words = correct.split(/\s+/).length;
  const pre = [];
  const oth = 1 - col, othLang = oth === 1 ? 'es' : 'en', promptN = normalizeForCompare(String(it[oth] || ''), othLang);
  itemsFor('Todas').forEach(o=>{
    if(o[3] === it[3] || !o[col]) return;
    // Misma frase de partida (p. ej. dos formas de decir «Cuidado») = otra respuesta válida, no un distractor
    if(promptN && o[oth] && normalizeForCompare(String(o[oth]), othLang) === promptN) return;
    const t = String(o[col]);
    const sc = (o[2] === it[2] ? 2 : 0) + (1 - Math.min(1, Math.abs(t.length - len) / Math.max(len, t.length, 1))) * 2 +
               (t.split(/\s+/).length === words ? 0.7 : 0) + Math.random() * 0.8;
    pre.push({t, sc});
  });
  pre.sort((a,b)=> b.sc - a.sc);
  const out = [], seen = new Set([cn]);
  for(const c of pre.slice(0, 80)){
    if(out.length >= Math.max(count, 3) + 3) break;
    const n = normalizeForCompare(c.t, lang);
    if(!n || seen.has(n) || variants.has(n) || (avoid && avoid.has(n))) continue;
    if(n.indexOf(cn) >= 0 || cn.indexOf(n) >= 0) continue;   // "Gracias" / "Muchas gracias"
    seen.add(n); out.push(c.t);
  }
  const picked = shuffledCopy(out).slice(0, count);
  if(picked.length < count) pickDistractors(correct, count - picked.length).forEach(x => { if(picked.indexOf(x) < 0 && x !== correct) picked.push(x); });
  return picked;
}


export function shuffledCopy(arr){
  const a = arr.slice();
  for(let k=a.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); [a[k],a[j]]=[a[j],a[k]]; }
  return a;
}






export function stopExamRecognition(){
  if(S.examRecognition){
    try{
      S.examRecognition.onresult = S.examRecognition.onerror = S.examRecognition.onend = null;
      S.examRecognition.abort();
    }catch(e){}
    S.examRecognition = null;
  }
  const mic = document.getElementById('examMicBtn');
  if(mic){ mic.classList.remove('listening'); mic.disabled = false; }
}



export function renderExamLives(animate){
  const el = document.getElementById('examLives');
  if(!el || !S.examState) return;
  let html = '';
  for(let i=0;i<EXAM_LIVES;i++){
    html += '<span class="heart' + (i < S.examState.lives ? '' : ' lost') + '">❤️</span>';
  }
  el.innerHTML = html;
  el.setAttribute('aria-label', 'Vidas: ' + S.examState.lives + ' de ' + EXAM_LIVES);
  if(animate){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
}



export function startExam(cat, stageIdx, opts){
  opts = opts || {};
  const prio = new Set(opts.prioritize || []);
  const pool = examItemsFor(cat, stageIdx);
  if(!pool.length) return;
  stopExamRecognition();
  const shuffledPool = shuffledCopy(pool);
  // Pronunciation questions need speech recognition and phrases that can be read aloud.
  const speakItems = [];
  if(SPEECH_REC_SUPPORTED){
    for(const it of shuffledPool){
      if(speakItems.length >= EXAM_SPEAK_COUNT) break;
      if(isSpeakable(it)) speakItems.push(it);
    }
  }
  // Dictation ("Escucha y Escribe") needs speech synthesis and phrases that can be read aloud.
  const dictationItems = [];
  if(TTS_SUPPORTED){
    for(const it of shuffledPool){
      if(dictationItems.length >= EXAM_DICTATION_COUNT) break;
      if(isSpeakable(it) && speakItems.indexOf(it) < 0) dictationItems.push(it);
    }
  }
  const used = speakItems.concat(dictationItems);
  const rest = shuffledPool.filter(it=> used.indexOf(it) < 0);
  // Las tarjetas que más te cuestan (falladas en el repaso o en el intento anterior) entran primero.
  const weak = it => (prio.has(it[3]) ? 2 : 0) + ((readStored(it[3]).lapses || 0) > 0 ? 1 : 0);
  rest.sort((a,b)=> weak(b) - weak(a));
  const source = rest.length ? rest : shuffledPool;
  const needed = EXAM_QUESTIONS - used.length;
  // Slots that can't be filled (no microphone / no speech synthesis / tiny pool) become multiple-choice and writing.
  const missing = (EXAM_SPEAK_COUNT - speakItems.length) + (EXAM_DICTATION_COUNT - dictationItems.length);
  const mcCount = EXAM_MC_COUNT + Math.ceil(missing / 2);
  const questions = [];
  speakItems.forEach(it=> questions.push({it, mode:'speak'}));
  dictationItems.forEach(it=> questions.push({it, mode:'dictation'}));
  // Dirección: ~60 % de las de opción múltiple EN→ES; en las escritas, la mayoría ES→EN (producir en inglés es lo más difícil)
  const mcEn2Es = Math.ceil(mcCount * 0.6);
  for(let i=0;i<needed;i++){
    const it = source[i % source.length];
    if(i < mcCount) questions.push({it, mode:'mc', dir: i < mcEn2Es ? 'en2es' : 'es2en'});
    else questions.push({it, mode:'write', dir: (i - mcCount) === 0 ? 'en2es' : 'es2en'});
  }
  const shuffled = shuffledCopy(questions);
  // Si una tarjeta aparece dos veces, la pregunta de producción va antes que la de opción múltiple (que regala la respuesta).
  for(let i=0;i<shuffled.length;i++) for(let j=i+1;j<shuffled.length;j++){
    if(shuffled[i].it[3] === shuffled[j].it[3] && shuffled[i].mode === 'mc' && shuffled[j].mode !== 'mc'){
      const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
    }
  }
  const avoid = {es:new Set(), en:new Set()};
  shuffled.forEach(q=>{ avoid.es.add(normalizeForCompare(String(q.it[1]), 'es')); avoid.en.add(normalizeForCompare(String(q.it[0]), 'en')); });
  S.examState = {
    cat, stageIdx, questions: shuffled, avoid, wrong:[],
    idx:0, score:0, lives:EXAM_LIVES, answered:false, failed:false
  };
  S.currentCat = cat; setCurrentStage(cat, stageIdx);
  S.lessonHost = 'learn';
  disarmExamBack();
  document.getElementById('examFailOverlay').style.display = 'none';
  document.getElementById('cardsView').style.display = 'none';
  document.getElementById('myCardsView').style.display = 'none';
  document.getElementById('examView').style.display = '';
  renderExamLives(false);
  renderExamQuestion();
}


export function renderExamQuestion(){
  scrollTopNow('examView');
  stopExamRecognition();
  hideExamMascot();
  try{ if(TTS_SUPPORTED) window.speechSynthesis.cancel(); }catch(e){}
  const q = S.examState.questions[S.examState.idx];
  S.examState.answered = false;
  document.getElementById('examProgressText').textContent = 'Pregunta ' + (S.examState.idx+1) + ' de ' + S.examState.questions.length;
  document.getElementById('examProgBarFill').style.width = Math.round((S.examState.idx/S.examState.questions.length)*100) + '%';
  // Dictation never shows the English text: the player has to listen.
  const es2en = (q.dir === 'es2en');
  document.getElementById('examPrompt').textContent = (q.mode === 'dictation') ? '🎧 ¿Qué dice?' : ((q.mode === 'mc' || q.mode === 'write') && es2en ? q.it[1] : q.it[0]);
  document.getElementById('examInstruction').textContent =
    q.mode === 'mc' ? (es2en ? 'Elige la traducción en inglés' : 'Elige la traducción correcta') :
    q.mode === 'write' ? (es2en ? 'Escribe la traducción en inglés' : 'Escribe la traducción en español') :
    q.mode === 'dictation' ? 'Escucha y escribe lo que oigas, en inglés' :
    'Di esta frase en voz alta, en inglés';
  showExamInputHint('');
  document.getElementById('examFeedback').style.display = 'none';
  const next = document.getElementById('examNextBtn');
  next.style.display = 'none';
  next.textContent = 'Siguiente →';
  const mcBox = document.getElementById('examMcOptions');
  const writeBox = document.getElementById('examWriteBox');
  const speakBox = document.getElementById('examSpeakBox');
  const dictBox = document.getElementById('examDictationBox');
  mcBox.innerHTML = '';
  mcBox.style.display = 'none';
  writeBox.style.display = 'none';
  speakBox.style.display = 'none';
  dictBox.style.display = 'none';
  if(q.mode === 'mc'){
    mcBox.style.display = '';
    const col = es2en ? 0 : 1;
    const right = q.it[col];
    const options = shuffledCopy(examDistractors(q.it, col, 3, S.examState.avoid[es2en ? 'en' : 'es']).concat([right]));
    options.forEach(opt=>{
      const b = document.createElement('button');
      b.className = 'examMcBtn'; b.type = 'button'; b.textContent = opt;
      b.onclick = ()=> answerMc(b, opt, right);
      mcBox.appendChild(b);
    });
  } else if(q.mode === 'write'){
    writeBox.style.display = '';
    const wi = document.getElementById('examWriteInput');
    wi.value = '';
    wi.placeholder = es2en ? 'Escribe la traducción en inglés...' : 'Escribe la traducción...';
    wi.lang = es2en ? 'en' : 'es';
    wi.setAttribute('autocapitalize', es2en ? 'off' : 'sentences');
    wi.setAttribute('autocorrect', es2en ? 'off' : 'on');
    wi.spellcheck = !es2en;
  } else if(q.mode === 'dictation'){
    dictBox.style.display = '';
    document.getElementById('examDictInput').value = '';
  } else {
    speakBox.style.display = '';
    document.getElementById('examSpeakStatus').textContent = 'Toca el micrófono y di la frase';
  }
}


export function showExamInputHint(msg){
  const el = document.getElementById('examInputHint');
  if(!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? '' : 'none';
}


export function showExamFeedback(ok, failText, okNote){
  const el = document.getElementById('examFeedback');
  el.style.display = '';
  el.className = 'examFeedback ' + (ok ? 'ok' : 'bad');
  el.textContent = ok ? ('✅ ¡Correcto!' + (okNote ? ' ' + okNote : '')) : ('❌ ' + failText);
  showExamMascot(examMascotKind(ok, okNote));
  const next = document.getElementById('examNextBtn');
  next.textContent = S.examState.failed ? 'Continuar' : 'Siguiente →';
  next.style.display = '';
  try{ setTimeout(()=> next.scrollIntoView({behavior:'smooth', block:'nearest'}), 120); }catch(e){}
}


// Single place where an answer is scored: sound, score, lives and feedback.
export function resolveExamAnswer(ok, failText, okNote){
  if(!S.examState || S.examState.answered) return;
  S.examState.answered = true;
  const cq = S.examState.questions[S.examState.idx];
  // El examen alimenta el Repaso: un fallo adelanta la tarjeta; un acierto producido (escribir/dictar/hablar) cuenta como repaso.
  try{
    if(cq && cq.it && cq.it[3]){
      if(!ok) srsGrade(cq.it[3], 1);
      else if(cq.mode !== 'mc') srsGrade(cq.it[3], 3);
    }
  }catch(e){}
  if(ok){
    S.examState.score++;
    playSfx('correct');
  } else {
    if(cq && cq.it && !S.examState.wrong.some(w => w.it[3] === cq.it[3])) S.examState.wrong.push({it:cq.it, mode:cq.mode});
    playSfx('wrong');
    S.examState.lives = Math.max(0, S.examState.lives - 1);
    if(S.examState.lives <= 0) S.examState.failed = true;
    renderExamLives(true);
  }
  showExamFeedback(ok, failText, okNote);
}


export function answerMc(btn, chosen, correct){
  if(!S.examState || S.examState.answered) return;
  haptic();
  document.querySelectorAll('.examMcBtn').forEach(b=> b.disabled = true);
  const ok = chosen === correct;
  btn.classList.add(ok ? 'correct' : 'wrong');
  if(!ok){
    document.querySelectorAll('.examMcBtn').forEach(b=>{ if(b.textContent === correct) b.classList.add('correct'); });
  }
  resolveExamAnswer(ok, 'La traducción correcta era: ' + correct);
}



// --- Dictation question: "Escucha y Escribe" ---
// Plays the English phrase (first alternative if it has "a / b"); the player types it and the same
// flexible check used for typed translations decides.
export function dictationText(q){ return (String(q.it[0]).split('/')[0] || q.it[0]).trim(); }


export function playDictation(rate){
  if(!S.examState) return;
  const q = S.examState.questions[S.examState.idx];
  if(!q || q.mode !== 'dictation') return;
  haptic();
  speak(dictationText(q), 'en-US', rate);
}



// --- Pronunciation question (speech recognition, English) ---
export function finishExamSpeak(heardList){
  if(!S.examState || S.examState.answered) return;
  const q = S.examState.questions[S.examState.idx];
  const targets = speakTargets(q.it[0]);
  let ok = false;
  for(const heard of heardList){
    const h = normalizeSpeech(heard);
    if(h && targets.some(t=> similarity(h, t) >= SPEAK_MATCH_THRESHOLD)){ ok = true; break; }
  }
  stopExamRecognition();
  document.getElementById('examSpeakBox').style.display = 'none';
  const heardText = heardList.length ? ('«' + heardList[0] + '»') : 'no se detectó tu voz';
  resolveExamAnswer(ok, 'Esperábamos: «' + q.it[0] + '» — escuchamos: ' + heardText);
}


export function startExamListening(){
  if(!S.examState || S.examState.answered) return;
  const q = S.examState.questions[S.examState.idx];
  if(!q || q.mode !== 'speak') return;
  const status = document.getElementById('examSpeakStatus');
  const mic = document.getElementById('examMicBtn');
  if(!SPEECH_REC_SUPPORTED){ status.textContent = 'Tu navegador no soporta reconocimiento de voz.'; return; }
  stopExamRecognition();
  try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){}
  haptic();
  const state = S.examState, qIdx = state.idx;
  const rec = new SpeechRec();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 3;
  S.examRecognition = rec;
  let settled = false;
  const stillValid = ()=> S.examState === state && state.idx === qIdx && S.examRecognition === rec;
  const resetMic = ()=>{ mic.classList.remove('listening'); mic.disabled = false; };
  mic.classList.add('listening');
  mic.disabled = true;
  status.textContent = '🎤 Escuchando… di la frase en inglés';
  rec.onresult = (ev)=>{
    if(settled || !stillValid()) return;
    settled = true;
    const heard = [];
    const res = ev.results && ev.results[0];
    if(res){ for(let i=0;i<res.length;i++) heard.push(res[i].transcript); }
    finishExamSpeak(heard);
  };
  rec.onerror = (ev)=>{
    if(settled || !stillValid()) return;
    settled = true;
    const code = ev && ev.error;
    const retry = {
      'not-allowed': '🎤 Sin permiso para el micrófono. Actívalo en los ajustes del navegador y reintenta.',
      'service-not-allowed': '🎤 Sin permiso para el reconocimiento de voz. Revisa los ajustes y reintenta.',
      'audio-capture': '🎤 No se detectó ningún micrófono.',
      'network': '📶 El reconocimiento de voz necesita internet. Revisa tu conexión y reintenta.',
      'language-not-supported': 'Tu dispositivo no soporta reconocimiento de voz en inglés.',
      'aborted': 'El reconocimiento se interrumpió. Toca el micrófono para reintentar.'
    };
    if(retry[code]){
      // Not the player's fault: no life lost, they can retry or skip.
      resetMic();
      S.examRecognition = null;
      status.textContent = retry[code];
    } else {
      finishExamSpeak([]); // no-speech / no-match → counts as a miss
    }
  };
  rec.onend = ()=>{
    if(!stillValid()){ resetMic(); return; }
    if(settled) return;
    settled = true;
    finishExamSpeak([]); // ended without a result → no voice detected
  };
  try{
    rec.start();
  }catch(e){
    settled = true;
    resetMic();
    S.examRecognition = null;
    status.textContent = 'No se pudo iniciar el micrófono. Reintenta.';
  }
}



// --- Flow: next question / finish / out of lives ---
export function showExamFail(){
  stopExamRecognition();
  setMascotIn(document.getElementById('examFailEmoji'), 'sad');
  document.getElementById('examFailWrong').innerHTML = S.examState ? examWrongListHtml(S.examState.wrong, 5) : '';
  showModalFromTop('examFailOverlay');
}


// Salir a mitad de examen pide confirmación (segundo toque) para no perder el progreso por accidente.



export function disarmExamBack(){
  clearTimeout(S.examBackTimer); S.examBackTimer = null;
  const b = document.getElementById('examBackBtn'); if(b) b.textContent = '← Mapa';
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [3950, function(){
S.examState = null;
  }],
  [3953, function(){
S.examRecognition = null;
  }],
  [4405, function(){
document.getElementById('examCheckBtn').onclick = ()=>{
  if(!S.examState || S.examState.answered) return;
  const input = document.getElementById('examWriteInput');
  if(!input.value.trim()){ showExamInputHint('Escribe tu respuesta antes de verificar.'); input.focus(); return; }
  haptic();
  const q = S.examState.questions[S.examState.idx];
  const toEn = (q.dir === 'es2en');
  const target = toEn ? q.it[0] : q.it[1];
  let r = evaluateWrittenAnswer(input.value, target, toEn ? 'en' : 'es');
  if(!r.ok){
    // Varias frases pueden compartir la misma traducción: se acepta cualquiera de ellas
    const lang = toEn ? 'en' : 'es', fromCol = toEn ? 1 : 0, toCol = toEn ? 0 : 1;
    const pn = normalizeForCompare(String(q.it[fromCol]), toEn ? 'es' : 'en');
    const alt = itemsFor('Todas').filter(o=> o[3] !== q.it[3] && o[fromCol] && o[toCol] && normalizeForCompare(String(o[fromCol]), toEn ? 'es' : 'en') === pn);
    for(const o of alt){ const r2 = evaluateWrittenAnswer(input.value, String(o[toCol]), lang); if(r2.ok){ r = r2; break; } }
  }
  document.getElementById('examWriteBox').style.display = 'none';
  showExamInputHint('');
  resolveExamAnswer(r.ok, 'La traducción correcta era: ' + target + closeCallSuffix(r), nearMissNote(r));
};
  }],
  [4425, function(){
document.getElementById('examWriteInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){ e.preventDefault(); document.getElementById('examCheckBtn').click(); }
});
  }],
  [4440, function(){
document.getElementById('examDictPlayBtn').onclick = ()=> playDictation();
  }],
  [4441, function(){
document.getElementById('examDictSlowBtn').onclick = ()=> playDictation(0.6);
  }],
  [4442, function(){
document.getElementById('examDictCheckBtn').onclick = ()=>{
  if(!S.examState || S.examState.answered) return;
  const q = S.examState.questions[S.examState.idx];
  if(!q || q.mode !== 'dictation') return;
  const input = document.getElementById('examDictInput');
  if(!input.value.trim()){ showExamInputHint('Escribe lo que escuchaste antes de verificar.'); input.focus(); return; }
  haptic();
  try{ if(TTS_SUPPORTED) window.speechSynthesis.cancel(); }catch(e){}
  const r = evaluateWrittenAnswer(input.value, q.it[0], 'en');
  document.getElementById('examDictationBox').style.display = 'none';
  showExamInputHint('');
  resolveExamAnswer(r.ok, 'La frase correcta era: «' + q.it[0] + '»' + closeCallSuffix(r), nearMissNote(r));
};
  }],
  [4455, function(){
document.getElementById('examDictInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){ e.preventDefault(); document.getElementById('examDictCheckBtn').click(); }
});
  }],
  [4458, function(){
document.getElementById('examDictSkipBtn').onclick = ()=>{
  if(!S.examState || S.examState.answered) return;
  const q = S.examState.questions[S.examState.idx];
  if(!q || q.mode !== 'dictation') return;
  haptic();
  try{ if(TTS_SUPPORTED) window.speechSynthesis.cancel(); }catch(e){}
  document.getElementById('examDictationBox').style.display = 'none';
  showExamInputHint('');
  resolveExamAnswer(false, 'Pregunta omitida. La frase era: «' + q.it[0] + '»');
};
  }],
  [4551, function(){
document.getElementById('examMicBtn').onclick = startExamListening;
  }],
  [4553, function(){

// "No puedo hablar ahora": la pregunta de pronunciación se cambia por una escrita, sin perder vida.
document.getElementById('examSkipBtn').onclick = ()=>{
  if(!S.examState || S.examState.answered) return;
  const q = S.examState.questions[S.examState.idx];
  if(!q || q.mode !== 'speak') return;
  haptic();
  stopExamRecognition();
  q.mode = 'write'; q.dir = 'es2en';
  renderExamQuestion();
  showExamInputHint('Cambiamos la pregunta: sin penalización.');
};
  }],
  [4571, function(){
document.getElementById('examRetryBtn').onclick = ()=>{
  document.getElementById('examFailOverlay').style.display = 'none';
  const cat = S.examState ? S.examState.cat : S.currentCat;
  const stageIdx = S.examState ? S.examState.stageIdx : getCurrentStage(cat);
  const prioritize = S.examState ? S.examState.wrong.map(w => w.it[3]) : [];
  startExam(cat, stageIdx, {prioritize});
};
  }],
  [4578, function(){
document.getElementById('examFailBackBtn').onclick = ()=>{
  document.getElementById('examFailOverlay').style.display = 'none';
  stopExamRecognition();
  S.examState = null;
  document.getElementById('examView').style.display = 'none';
  showMap();
};
  }],
  [4585, function(){
document.getElementById('examNextBtn').onclick = ()=>{
  if(!S.examState) return;
  if(S.examState.failed){ showExamFail(); return; }
  S.examState.idx++;
  if(S.examState.idx >= S.examState.questions.length){
    const score = S.examState.score, total = S.examState.questions.length, wrong = S.examState.wrong.slice();
    stopExamRecognition();
    S.examState = null;
    document.getElementById('examView').style.display = 'none';
    document.getElementById('cardsView').style.display = '';
    S.cardsSubView = 'map';
    finishExam(score, total, wrong);
  } else {
    renderExamQuestion();
  }
};
  }],
  [4602, function(){
S.examBackTimer = null;
  }],
  [4607, function(){
document.getElementById('examBackBtn').onclick = ()=>{
  const started = S.examState && (S.examState.idx > 0 || S.examState.answered);
  if(started && !S.examBackTimer){
    document.getElementById('examBackBtn').textContent = 'Toca otra vez para salir (se pierde el examen)';
    S.examBackTimer = setTimeout(disarmExamBack, 3500);
    return;
  }
  disarmExamBack();
  stopExamRecognition();
  S.examState = null;
  document.getElementById('examView').style.display = 'none';
  showMap();
};
  }],
  [4621, function(){
document.getElementById('examResultBtn').onclick = ()=> closeExamResults(false);
  }],
  [4622, function(){
document.getElementById('examResultReviewBtn').onclick = ()=> closeExamResults(true);
  }],
  [4624, function(){

// Atajos del examen: 1–4 elige opción, Enter/Espacio pasa a la siguiente pregunta (se desactivan en Ajustes → Atajos de teclado)
document.addEventListener('keydown', e => {
  const v = document.getElementById('examView');
  if(!v || v.style.display === 'none' || !S.examState) return;
  if(!shortcutAllowed(e)) return;
  const next = document.getElementById('examNextBtn');
  if(next.style.display !== 'none' && activationKeyFree(e, v)){ e.preventDefault(); next.click(); return; }
  if(!S.examState.answered && '1234'.includes(e.key) && e.key.length === 1){
    const btns = document.querySelectorAll('#examMcOptions .examMcBtn');
    const b = btns[+e.key - 1];
    if(b && !b.disabled){ e.preventDefault(); b.click(); }
  }
});
  }]
];

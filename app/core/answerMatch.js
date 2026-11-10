// Vocabri — comparación de respuestas escritas y habladas (pura: sin DOM, sin localStorage, sin datos de la app).
// exam.js la usa y la re-exporta; los tests la importan directamente.

// 0..1 de parecido (Levenshtein) a partir del cual una respuesta escrita aún puede darse por buena
export const WRITE_FUZZY_THRESHOLD = 0.85;

// «Palabras conocidas» (las de las frases y las tarjetas propias): una palabra escrita que ES otra palabra real
// no es una errata. Depende de los datos de la app, así que exam.js registra aquí su proveedor; sin él, ninguna cuenta.
let _knownWords = () => new Set();
export function setKnownWordsProvider(fn){ _knownWords = (typeof fn === 'function') ? fn : () => new Set(); }

export function normalizeAnswer(s){
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ ]/gi,' ').replace(/\s+/g,' ').trim();
}


// Levenshtein edit distance (insertions, deletions, substitutions), plain JS, O(len(a)·len(b)) time, O(min) memory.
export function calcularDistanciaLevenshtein(a, b){
  a = String(a); b = String(b);
  if(a === b) return 0;
  if(!a.length) return b.length;
  if(!b.length) return a.length;
  if(a.length < b.length){ const t = a; a = b; b = t; }          // keep the rows as short as possible
  let prev = new Array(b.length + 1), cur = new Array(b.length + 1);
  for(let j=0;j<=b.length;j++) prev[j] = j;
  for(let i=1;i<=a.length;i++){
    cur[0] = i;
    const ca = a.charCodeAt(i-1);
    for(let j=1;j<=b.length;j++){
      const cost = (ca === b.charCodeAt(j-1)) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + cost);
    }
    const t = prev; prev = cur; cur = t;
  }
  return prev[b.length];
}


// Typed text → comparable text. Spanish: no accents/punctuation. English: also expands contractions (I'm = I am).
export function normalizeForCompare(s, lang){
  return lang === 'en' ? normalizeSpeech(s) : normalizeAnswer(s);
}


// Every answer the target allows: each "a / b" alternative, with and without its "(notes)", and the whole text.
export function writtenVariants(target, lang){
  const out = [], seen = new Set();
  const add = (display, source)=>{
    const norm = normalizeForCompare(source, lang);
    if(norm && !seen.has(norm)){ seen.add(norm); out.push({display: display, norm: norm}); }
  };
  String(target).split('/').forEach(part=>{
    const original = part.trim();
    if(!original) return;
    const clean = original.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
    if(clean) add(clean, clean);
    add(original, original);
  });
  add(String(target).trim(), target);
  return out;
}


export function digitsOf(s){ return (s.match(/\d+/g) || []).join(','); }


// ---- Strictness layer: a TYPO is a slip inside a word; a different word is a listening / grammar error ----
// The 85 % similarity bar alone lets "She is a doctor" pass for "He is a doctor" (93 %). On top of it,
// every word that differs must look like a typo of the expected word, never like another word.
export const TYPO_EXACT_UP_TO = 4;

      // words of up to 4 letters must be exact (he/she, ship/shop, bear/beer, gato/gata…)
export const TYPO_ONE_EDIT_UP_TO = 7;

   // 5–7 letters: one slip allowed; 8+ letters: two
export const GRAMMAR_SUFFIXES = ['s', 'es', 'd', 'ed', 'ing', 'ly', 'er', 'est', 'as', 'os'];


// Edit distance between two WORDS where swapping two neighbouring letters counts as one slip (freind → friend).
export function distanciaEdicionPalabra(a, b){
  const m = a.length, n = b.length;
  if(!m) return n;
  if(!n) return m;
  const d = [];
  for(let i=0;i<=m;i++) d[i] = [i];
  for(let j=1;j<=n;j++) d[0][j] = j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const cost = (a[i-1] === b[j-1]) ? 0 : 1;
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + cost);
      if(i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) d[i][j] = Math.min(d[i][j], d[i-2][j-2] + 1);
    }
  }
  return d[m][n];
}


// plural / tense / gender endings change the meaning: apple↔apples, walk↔walked, amigo↔amiga
export function isGrammaticalVariant(a, b){
  if(a.length > b.length){ const t = a; a = b; b = t; }           // a = the shorter one
  if(b.startsWith(a)){
    const suffix = b.slice(a.length);
    if(suffix.length === 1 && a.charAt(a.length - 1) === suffix) return false;   // doubled last letter (graciass) = typing slip
    if(GRAMMAR_SUFFIXES.indexOf(suffix) >= 0) return true;
  }
  if(a.length === b.length && a.length > 2){
    const ends = a.slice(-1) + b.slice(-1);
    if(a.slice(0, -1) === b.slice(0, -1) && (ends === 'ao' || ends === 'oa')) return true;
    const ends2 = a.slice(-2) + '|' + b.slice(-2);
    if(a.slice(0, -2) === b.slice(0, -2) && (ends2 === 'os|as' || ends2 === 'as|os')) return true;
  }
  return false;
}




export function isTypoOf(typedWord, expectedWord, lang){
  if(typedWord === expectedWord) return true;
  const longest = Math.max(typedWord.length, expectedWord.length);
  if(longest <= TYPO_EXACT_UP_TO) return false;                       // short words: any change is another word
  if(isGrammaticalVariant(typedWord, expectedWord)) return false;     // plural / tense / gender
  if(_knownWords(lang).has(typedWord)) return false;                   // it is a real, different word
  const limit = (longest <= TYPO_ONE_EDIT_UP_TO) ? 1 : 2;
  return distanciaEdicionPalabra(typedWord, expectedWord) <= limit;
}


// Same number of words, each one equal or a typo. A missing / extra word is an error; only a spacing slip
// ("goodmorning") is forgiven.
export function wordsMatchLikeTypos(typed, expected, lang){
  const a = typed.split(' '), b = expected.split(' ');
  if(a.length !== b.length) return typed.replace(/ /g, '') === expected.replace(/ /g, '');
  for(let i=0;i<a.length;i++){
    if(!isTypoOf(a[i], b[i], lang)) return false;
  }
  return true;
}


// For very close answers that were still refused: say which word to look at.
export function describeWordDiffs(typed, expected){
  const a = typed.split(' '), b = expected.split(' ');
  if(a.length !== b.length) return 'falta o sobra una palabra';
  const diffs = [];
  for(let i=0;i<a.length;i++) if(a[i] !== b[i]) diffs.push(a[i] + ' → ' + b[i]);
  return (diffs.length && diffs.length <= 3) ? 'revisa: ' + diffs.join(', ') : '';
}



// → { ok, exact, similarity (0..1), match (the allowed variant it was compared with, as written), hint }
// ok = exact, or ALL of: similarity ≥ 0.85 · same numbers · every differing word is a typo (see above).
export function evaluateWrittenAnswer(input, target, lang){
  const result = {ok:false, exact:false, similarity:0, match:null, hint:''};
  const typed = normalizeForCompare(input, lang);
  if(!typed) return result;
  let best = null, bestSim = -1, accepted = null, acceptedSim = -1;
  for(const v of writtenVariants(target, lang)){
    if(v.norm === typed) return {ok:true, exact:true, similarity:1, match:v.display, hint:''};
    const sim = similarity(typed, v.norm);
    if(sim > bestSim){ bestSim = sim; best = v; }
    if(sim + 1e-9 >= WRITE_FUZZY_THRESHOLD && sim > acceptedSim &&
       digitsOf(typed) === digitsOf(v.norm) && wordsMatchLikeTypos(typed, v.norm, lang)){
      accepted = v; acceptedSim = sim;
    }
  }
  if(accepted){
    result.ok = true; result.similarity = acceptedSim; result.match = accepted.display;
  } else if(best){
    result.similarity = bestSim; result.match = best.display;
    if(bestSim + 1e-9 >= WRITE_FUZZY_THRESHOLD) result.hint = describeWordDiffs(typed, best.norm);
  }
  return result;
}


// Failure text with the "which word?" hint when the answer was almost right.
export function closeCallSuffix(r){ return r.hint ? ' (' + r.hint + ')' : ''; }


// Written answers: normalise, exact match (incl. "a / b" and "(notes)"), otherwise ≥ 85 % similar AND only typos (no other word).
export function writeAnswerOk(input, target, lang){
  return evaluateWrittenAnswer(input, target, lang || 'es').ok;
}


// Gentle hint when a slightly different spelling was accepted.
export function nearMissNote(r){
  return (r.ok && !r.exact && r.match) ? '(Nota la escritura exacta: "' + r.match + '")' : '';
}


// --- Spoken-answer comparison: lowercase, no punctuation, contractions expanded on both sides ---
export const CONTRACTIONS = {
  "i'm":"i am", "you're":"you are", "he's":"he is", "she's":"she is", "it's":"it is", "we're":"we are",
  "they're":"they are", "that's":"that is", "what's":"what is", "there's":"there is", "here's":"here is",
  "how's":"how is", "where's":"where is", "who's":"who is", "let's":"let us",
  "i'll":"i will", "you'll":"you will", "we'll":"we will", "they'll":"they will",
  "i've":"i have", "you've":"you have", "we've":"we have", "they've":"they have", "i'd":"i would",
  "don't":"do not", "doesn't":"does not", "didn't":"did not", "can't":"cannot", "won't":"will not",
  "isn't":"is not", "aren't":"are not", "wasn't":"was not", "weren't":"were not",
  "haven't":"have not", "hasn't":"has not", "couldn't":"could not", "wouldn't":"would not", "shouldn't":"should not"
};


// Common contractions typed WITHOUT the apostrophe (phones with autocorrect off): only unambiguous forms.
export const CONTRACTIONS_NO_APOSTROPHE = {
  "dont":"do not", "doesnt":"does not", "didnt":"did not", "cant":"cannot", "isnt":"is not", "arent":"are not",
  "wasnt":"was not", "werent":"were not", "havent":"have not", "hasnt":"has not", "couldnt":"could not",
  "wouldnt":"would not", "shouldnt":"should not", "im":"i am", "ive":"i have", "youre":"you are",
  "theyre":"they are", "weve":"we have", "thats":"that is", "whats":"what is", "hows":"how is", "wheres":"where is"
};


export function normalizeSpeech(s){
  let t = (s||'').toLowerCase().replace(/[’‘`]/g, "'");
  t = t.replace(/\b[a-z]+'[a-z]+\b/g, w => CONTRACTIONS[w] || w);
  t = t.replace(/\b[a-z]+\b/g, w => CONTRACTIONS_NO_APOSTROPHE[w] || w);
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/-/g,' ').replace(/[^a-z0-9 ]+/g,'').replace(/\s+/g,' ').trim();
}


export function similarity(a, b){
  if(a === b) return 1;
  if(!a.length || !b.length) return 0;
  return 1 - calcularDistanciaLevenshtein(a, b) / Math.max(a.length, b.length);
}


// A phrase can be read aloud if it has no [placeholders] or "..." gaps.
export function isSpeakable(it){ return !/[\[\]]|\.\.\./.test(it[0]); }


export function speakTargets(phrase){
  return phrase.split('/').map(p=> normalizeSpeech(p)).filter(Boolean);
}

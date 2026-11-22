// Vocabri — «Completa el hueco»: se tapa una palabra clave de la frase en inglés y se elige entre 4 opciones. Puro.

export const CLOZE_ROUND = 10;
export const CLOZE_XP = 3;           // por acierto; tope diario propio en el libro de XP (fuente «cloze»)
export const MIN_WORD = 4;
export const MIN_WORDS_IN_SENTENCE = 3;   // con menos palabras, el hueco sería toda la frase

// Palabras que NO sirven como hueco (artículos, pronombres, preposiciones, auxiliares…).
const STOP = new Set(('the this that these those with from into onto over under about after before between through during without within ' +
  'have has had having been being were was are is am will would could should shall might must can cannot does did done doing ' +
  'your yours mine ours their theirs them they what when where which while who whom whose why how there here then than very just also ' +
  'some any each every much many more most such only even still ever never always again once please thank thanks hello okay yeah ' +
  'will wont dont didnt doesnt isnt arent wasnt werent cant couldnt wouldnt shouldnt havent hasnt hadnt like want need get got let lets ' +
  'one two three four five six seven eight nine ten').split(/\s+/));

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

export function target(it){ return (String(it[0]).split('/')[0] || String(it[0])).trim(); }

// Palabras candidatas a hueco de una frase: [{word, index, start, end}] (solo letras, sin apóstrofes, no vacías de significado).
export function candidates(sentence){
  const out = []; let m; WORD_RE.lastIndex = 0;
  while((m = WORD_RE.exec(sentence))){
    const w = m[0];
    if(w.indexOf("'") >= 0 || w.length < MIN_WORD || STOP.has(w.toLowerCase())) continue;
    out.push({ word: w, start: m.index, end: m.index + w.length });
  }
  return out;
}

// Todas las palabras de contenido de un conjunto de frases (para sacar distractores).
export function wordBank(items){
  const bank = new Map();
  items.forEach(it => candidates(target(it)).forEach(c => { const k = c.word.toLowerCase(); if(!bank.has(k)) bank.set(k, c.word.toLowerCase()); }));
  return Array.from(bank.values());
}

function cap(w, like){ return like && like[0] === like[0].toUpperCase() && like[0] !== like[0].toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w; }

// rng: () => [0,1). Devuelve null si la frase no sirve (sin palabras candidatas o sin distractores suficientes).
export function buildCloze(it, bank, rng){
  const s = target(it), cands = candidates(s);
  if(!cands.length || (s.match(WORD_RE) || []).length < MIN_WORDS_IN_SENTENCE) return null;
  // Preferir las palabras largas (más informativas): se elige al azar entre las de mayor longitud.
  const maxLen = Math.max.apply(null, cands.map(c => c.word.length));
  const best = cands.filter(c => c.word.length >= Math.max(MIN_WORD, maxLen - 2));
  const gap = best[Math.floor(rng() * best.length)];
  const low = gap.word.toLowerCase();
  const inSentence = new Set(candidates(s).map(c => c.word.toLowerCase()));
  const similar = bank.filter(w => w !== low && !inSentence.has(w) && Math.abs(w.length - low.length) <= 2 && w.slice(0, 3) !== low.slice(0, 3));
  const loose = bank.filter(w => w !== low && !inSentence.has(w));
  const pool = similar.length >= 3 ? similar : loose;
  if(pool.length < 3) return null;
  const a = pool.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  const wrong = a.slice(0, 3).map(w => cap(w, gap.word));
  const opts = [gap.word].concat(wrong);
  for(let i = opts.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); const t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
  return { key: it[3], es: it[1], en: s, before: s.slice(0, gap.start), after: s.slice(gap.end), answer: gap.word, options: opts, answerIndex: opts.indexOf(gap.word) };
}

export function pickRound(items, n, rng){
  const bank = wordBank(items), a = items.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  const out = [];
  for(let i = 0; i < a.length && out.length < n; i++){ const q = buildCloze(a[i], bank, rng); if(q) out.push(q); }
  return out;
}

// ── Japonés: la tarjeta (palabra) debe aparecer en su frase de ejemplo; se tapa y se elige entre 4 palabras. ──
const stripR = h => String(h || '').replace(/<rt>.*?<\/rt>/g, '').replace(/<[^>]+>/g, '');
export function buildClozeJa(it, fronts, rng){
  const w = stripR(it[0]).trim(), ex = String(it[4] || '').trim();
  if(!w || !ex) return null;
  const at = ex.indexOf(w); if(at < 0) return null;
  const rest = fronts.filter(f => f !== w && ex.indexOf(f) < 0 && Math.abs(f.length - w.length) <= 2);
  const loose = fronts.filter(f => f !== w && ex.indexOf(f) < 0);
  const pool = rest.length >= 3 ? rest : loose;
  if(pool.length < 3) return null;
  const a = pool.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  const opts = [w].concat(a.slice(0, 3));
  for(let i = opts.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); const t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
  return { key: it[3], es: String(it[5] || it[1]), en: ex, ja: true, read: String(it[9] || ''), before: ex.slice(0, at), after: ex.slice(at + w.length), answer: w, options: opts, answerIndex: opts.indexOf(w) };
}
export function pickRoundJa(items, n, rng){
  const fronts = Array.from(new Set(items.map(it => stripR(it[0]).trim()).filter(Boolean))), a = items.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  const out = [];
  for(let i = 0; i < a.length && out.length < n; i++){ const q = buildClozeJa(a[i], fronts, rng); if(q) out.push(q); }
  return out;
}

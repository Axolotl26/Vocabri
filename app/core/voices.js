// Vocabri — lógica pura de voces (sin DOM) para poder probarla.
// Sirve para dar una voz distinta a la otra persona en las escenas.

const FEMALE = /\b(zira|jenny|aria|ava|emma|michelle|sara|sonia|libby|natasha|clara|samantha|susan|karen|moira|tessa|allison|victoria|fiona|female|woman|hazel|heera|linda|catherine|amy|joanna|salli|kimberly|ivy|kendra|paulina|monica|helena|elena|lucia|dalia|elvira|camila|female)\b/i;
const MALE = /\b(david|guy|mark|ryan|eric|davis|brian|christopher|roger|steffan|thomas|alex|daniel|fred|tom|aaron|arthur|matthew|joey|justin|jorge|juan|diego|male|man|george|james|richard|ravi|jacob)\b/i;

export function voiceGender(v){
  const n = (v && (v.name || '')) || '';
  if(MALE.test(n)) return 'm';
  if(FEMALE.test(n)) return 'f';
  return '?';
}

// Elige una voz distinta a la principal: mismo idioma, de preferencia de otro género
// y de calidad parecida. `score` es la función de puntuación de speech.js.
export function pickAlternate(voices, mainURI, lang, score){
  const sc = typeof score === 'function' ? score : () => 0;
  const pool = (voices || []).filter(v => v && (v.lang || '').toLowerCase().startsWith(lang) && v.voiceURI !== mainURI);
  if(pool.length === 0) return null;
  const main = (voices || []).find(v => v && v.voiceURI === mainURI);
  const mg = main ? voiceGender(main) : '?';
  const best = Math.max.apply(null, pool.map(sc));
  const decent = pool.filter(v => sc(v) >= best - 6);          // no bajar a voces robóticas solo por variar
  const diff = decent.filter(v => { const g = voiceGender(v); return g !== '?' && mg !== '?' && g !== mg; });
  const list = (diff.length ? diff : decent).slice().sort((a, b) => sc(b) - sc(a));
  return list[0] || null;
}

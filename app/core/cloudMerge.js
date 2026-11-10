// Vocabri — fusión del progreso entre dos copias (este dispositivo / la nube). Pura: trabaja con textos y objetos,
// sin localStorage ni red. sync.js la usa y la re-exporta; los tests la importan directamente.

// Clave para detectar tarjetas propias duplicadas (mismo inglés + mismo español, sin importar mayúsculas)
export function cardDedupKey(en, es){ return (en + '\u0001' + es).toLowerCase(); }


export function cloudParse(s, fallback){
  try{ const v = JSON.parse(s); return (v === null || v === undefined) ? fallback : v; }catch(e){ return fallback; }
}


export function cloudNum(s){ const n = parseFloat(s); return isFinite(n) ? n : 0; }


export function dayKeyNum(s){
  const p = String(s || '').split('-').map(Number);
  return (p.length === 3 && p.every(isFinite)) ? p[0]*10000 + p[1]*100 + p[2] : 0;
}


// ---------- merging two copies of the progress (nothing is ever lost) ----------
export function mergeCardRecord(a, b){            // ci_master_*  {m, t, mt, lvl, next}: the most recently studied wins
  const A = cloudParse(a, null), B = cloudParse(b, null);
  if(!A || typeof A !== 'object') return b;
  if(!B || typeof B !== 'object') return a;
  const ta = Number(A.t) || 0, tb = Number(B.t) || 0;
  if(ta !== tb) return ta > tb ? a : b;
  return (Number(A.lvl) || 0) >= (Number(B.lvl) || 0) ? a : b;
}


export function mergeStageMaps(a, b){             // vocabri_unlocked_stage {category: index}: the furthest one
  const A = cloudParse(a, {}), B = cloudParse(b, {}), out = {};
  Object.keys(A).concat(Object.keys(B)).forEach(c=>{ out[c] = Math.max(Number(A[c]) || 0, Number(B[c]) || 0); });
  return JSON.stringify(out);
}


export function mergeExamResult(a, b){            // vocabri_exam_*  {done, score, total, t, attempts}: gana la MEJOR nota
  const A = cloudParse(a, null), B = cloudParse(b, null);
  if(!A || typeof A !== 'object') return b;
  if(!B || typeof B !== 'object') return a;
  const fa = Number(A.total) ? (Number(A.score) || 0) / Number(A.total) : 0;
  const fb = Number(B.total) ? (Number(B.score) || 0) / Number(B.total) : 0;
  const win = fa !== fb ? (fa > fb ? A : B) : ((Number(A.t) || 0) >= (Number(B.t) || 0) ? A : B);
  return JSON.stringify(Object.assign({}, win, {attempts: Math.max(Number(A.attempts) || 0, Number(B.attempts) || 0), t: Math.max(Number(A.t) || 0, Number(B.t) || 0)}));
}


export function mergeCustomWords(a, b){           // ci_custom_words: union (by id and by text), this device first
  const out = [], seenId = new Set(), seenText = new Set();
  [cloudParse(a, []), cloudParse(b, [])].forEach(list=>{
    if(!Array.isArray(list)) return;
    list.forEach(w=>{
      if(!w || typeof w !== 'object' || !w.en || !w.es) return;
      const id = String(w.id), key = cardDedupKey(String(w.en).trim(), String(w.es).trim());
      if(seenId.has(id) || seenText.has(key)) return;
      seenId.add(id); seenText.add(key); out.push(w);
    });
  });
  return JSON.stringify(out);
}


export function mergeCustomCats(a, b){            // ci_custom_cats: union, case-insensitive
  const out = [], seen = new Set();
  [cloudParse(a, []), cloudParse(b, [])].forEach(list=>{
    if(!Array.isArray(list)) return;
    list.forEach(c=>{
      const name = String(c || '').trim(), key = name.toLowerCase();
      if(name && !seen.has(key)){ seen.add(key); out.push(name); }
    });
  });
  return JSON.stringify(out);
}


export function mergeCooldownState(a, b){         // vocabriProgress: the most recent cool-down wins
  const A = cloudParse(a, null), B = cloudParse(b, null);
  if(!A || typeof A !== 'object') return b;
  if(!B || typeof B !== 'object') return a;
  return (Number(A.ultimoTimestamp) || 0) >= (Number(B.ultimoTimestamp) || 0) ? a : b;
}


export function mergeProgressData(local, cloud){
  const out = {};
  Object.keys(local).concat(Object.keys(cloud)).forEach(k=>{
    if(k in out) return;
    const a = local[k], b = cloud[k];
    if(a === undefined){ out[k] = b; return; }
    if(b === undefined || a === b){ out[k] = a; return; }
    if(k === 'ci_xp_total' || k.indexOf('ci_time_') === 0) out[k] = String(Math.max(cloudNum(a), cloudNum(b)));
    else if(k.indexOf('ci_master_') === 0) out[k] = mergeCardRecord(a, b);
    else if(k === 'vocabri_unlocked_stage') out[k] = mergeStageMaps(a, b);
    else if(k.indexOf('vocabri_exam_') === 0) out[k] = mergeExamResult(a, b);
    else if(k === 'ci_custom_words') out[k] = mergeCustomWords(a, b);
    else if(k === 'ci_custom_cats') out[k] = mergeCustomCats(a, b);
    else if(k === 'vocabriProgress') out[k] = mergeCooldownState(a, b);
    else if(k === 'vocabri_flip_coach_done') out[k] = (a === '1' || b === '1') ? '1' : a;
    else out[k] = a;                       // preferences and anything else: this device wins
  });
  // The daily-goal counters belong together: keep the ones of the most recent study day
  const la = local.vocabri_last_study_date, lb = cloud.vocabri_last_study_date;
  if(la !== undefined && lb !== undefined && la !== lb){
    const src = dayKeyNum(la) >= dayKeyNum(lb) ? local : cloud;
    ['vocabri_last_study_date', 'vocabri_xp_today', 'vocabri_goal_celebrated_date'].forEach(k=>{
      if(src[k] !== undefined) out[k] = src[k]; else delete out[k];
    });
  } else if(la !== undefined && la === lb){
    out.vocabri_xp_today = String(Math.max(cloudNum(local.vocabri_xp_today), cloudNum(cloud.vocabri_xp_today)));
    const ca = local.vocabri_goal_celebrated_date, cb = cloud.vocabri_goal_celebrated_date;
    if(ca !== undefined || cb !== undefined) out.vocabri_goal_celebrated_date = (dayKeyNum(ca) >= dayKeyNum(cb)) ? ca : cb;
  }
  return out;
}


export function cloudDataEqual(a, b){
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k=> a[k] === b[k]);
}

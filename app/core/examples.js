// Vocabri — ejemplos para las frases internas de «General» (los datos heredados no traen ejemplo).
// Se emparejan por el texto en inglés, así no dependen del orden de la lista.

export function applyExamples(list, examples){
  if(!Array.isArray(list) || !Array.isArray(examples)) return 0;
  const byEn = new Map();
  examples.forEach(e => { if(e && e.en && e.ex) byEn.set(String(e.en).trim().toLowerCase(), e); });
  let n = 0;
  list.forEach(it => {
    if(!Array.isArray(it) || it[2]) return;                    // si ya trae ejemplo, se respeta
    const e = byEn.get(String(it[0] || '').trim().toLowerCase());
    if(e){ it[2] = e.ex; it[3] = e.exEs || ''; n++; }
  });
  return n;
}

// Explicación «¿Por qué?» y comparador de registro para «General»: se guardan en it[5] (nota) e it[6] (registro).
export function applyNotes(list, notes){
  if(!Array.isArray(list) || !Array.isArray(notes)) return 0;
  const byEn = new Map();
  notes.forEach(e => { if(e && e.en && (e.note || e.reg)) byEn.set(String(e.en).trim().toLowerCase(), e); });
  let n = 0;
  list.forEach(it => {
    if(!Array.isArray(it) || it[5] || it[6]) return;
    const e = byEn.get(String(it[0] || '').trim().toLowerCase());
    if(e){ it[5] = e.note || ''; it[6] = e.reg || null; n++; }
  });
  return n;
}

// Vocabri — exportación de frases a CSV (Excel/Sheets) y a TSV para importar en Anki. Puro: sin DOM ni localStorage.
// Cada frase tiene un id estable (it[3]); Anki lo usa como GUID, así que re-importar actualiza las notas en vez de duplicarlas.

// ¿La frase ya está en tu estudio? (vista, repasada, programada o dominada)
export function isStudied(rec){ return !!rec && (rec.reps > 0 || rec.lvl > 0 || !!rec.m || !!rec.next); }

// entries: [{it, rec}] con it = [en, es, cat, id, ejemploEn, ejemploEs]  →  filas planas
export function buildRows(entries, opts){
  opts = opts || {};
  const label = opts.catLabel || (c => c);
  return entries
    .filter(e => opts.all || isStudied(e.rec))
    .map(e => ({
      id: String(e.it[3]), en: String(e.it[0] == null ? '' : e.it[0]), es: String(e.it[1] == null ? '' : e.it[1]),
      ex: e.it[4] || '', exEs: e.it[5] || '', cat: String(label(e.it[2]) || ''),
      iv: e.rec.iv || 0, lapses: e.rec.lapses || 0, next: e.rec.next || 0
    }));
}

// Campo con comillas si hace falta (separador, comilla, salto de línea). `guard` neutraliza fórmulas de Excel (=, +, @…).
export function quoteField(v, sep, guard){
  let s = String(v == null ? '' : v);
  if(guard && (/^[=+@\t\r]/.test(s) || /^-[\d(=+@]/.test(s))) s = "'" + s;
  return (s.indexOf(sep) >= 0 || /["\r\n]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toDelimited(rows, sep, guard, eol){
  return rows.map(r => r.map(v => quoteField(v, sep, guard)).join(sep)).join(eol || '\r\n');
}

function dateStr(ts){
  if(!ts) return '';
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// CSV para hojas de cálculo: UTF-8 con BOM (Excel lo necesita para las tildes) y columnas de progreso.
export function toCsv(rows){
  const head = ['Inglés', 'Español', 'Ejemplo (EN)', 'Ejemplo (ES)', 'Categoría', 'Intervalo (días)', 'Fallos', 'Próximo repaso', 'ID'];
  const body = rows.map(r => [r.en, r.es, r.ex, r.exEs, r.cat, r.iv, r.lapses, dateStr(r.next), r.id]);
  return '\uFEFF' + toDelimited([head].concat(body), ',', true) + '\r\n';
}

const escHtml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function tagFor(cat){
  return String(cat || '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/[\s_]+/g, '_') || 'Vocabri';
}

// TSV para Anki (2.1.54+): cabeceras que Anki entiende → col. 1 = GUID, col. 2 = anverso, col. 3 = reverso, col. 4 = etiquetas.
export function toAnkiTsv(rows, deck){
  const lines = ['#separator:tab', '#html:true', '#guid column:1', '#tags column:4', '#deck:' + (deck || 'Vocabri')];
  const body = rows.map(r => {
    let back = escHtml(r.es);
    if(r.ex) back += '<br><br><i>' + escHtml(r.ex) + '</i>' + (r.exEs ? '<br>' + escHtml(r.exEs) : '');
    return [r.id, escHtml(r.en), back, tagFor(r.cat)];
  });
  return lines.join('\n') + '\n' + toDelimited(body, '\t', false, '\n') + '\n';
}

// Vocabri — cursos de otros idiomas (módulo puro, sin DOM).
// Un curso trae zonas con tarjetas {id, ja, furi, romaji, es, ex, exEs, note}. Se convierte al formato interno de la app:
//   DATA[cat] = [frente, español, ejemplo, ejemplo(es), id, nota, registro, furigana, romaji]

export const LANG_TAGS = { en: 'en-US', ja: 'ja-JP', es: 'es-ES' };
export function langTag(lang){ return LANG_TAGS[lang] || LANG_TAGS.en; }

/** Valida un curso y devuelve una lista de problemas (vacía = correcto). */
export function validateCourse(raw){
  const errs = [];
  if(!raw || typeof raw !== 'object'){ return ['El curso no es un objeto']; }
  if(!Array.isArray(raw.zones) || !raw.zones.length) return ['El curso no tiene zonas'];
  const ids = new Set(), fronts = new Set();
  raw.zones.forEach((z, zi) => {
    if(!z || !z.name) errs.push('Zona ' + (zi + 1) + ' sin nombre');
    const items = (z && z.items) || [];
    if(!items.length || items.length % 8) errs.push('Zona «' + (z && z.name) + '» tiene ' + items.length + ' tarjetas (debe ser múltiplo de 8)');
    items.forEach(it => {
      if(!it || !it.id || !it.ja || !it.es || !it.romaji) errs.push('Tarjeta incompleta: ' + JSON.stringify(it && it.id));
      else {
        if(ids.has(it.id)) errs.push('id repetido: ' + it.id); ids.add(it.id);
        if(fronts.has(it.ja)) errs.push('tarjeta repetida: ' + it.ja); fronts.add(it.ja);
      }
    });
  });
  return errs;
}

/** { tuples, sizes, names } listo para DATA, CAT_MODULE_SIZES y CAT_MODULE_NAMES. */
export function convertCourse(raw){
  const tuples = [], sizes = [], names = [];
  raw.zones.forEach(z => {
    names.push(z.name); sizes.push(z.items.length);
    z.items.forEach(it => tuples.push([it.ja, it.es, it.ex || '', it.exEs || '', it.id, it.note || '', null, it.furi || '', it.romaji || '']));
  });
  return { tuples, sizes, names };
}

// ── Romaji: comparación tolerante (macrones, vocales largas, mayúsculas, espacios) ──
const MACRON = { 'ā': 'aa', 'ī': 'ii', 'ū': 'uu', 'ē': 'ee', 'ō': 'oo', 'â': 'aa', 'î': 'ii', 'û': 'uu', 'ê': 'ee', 'ô': 'oo' };
/** Forma canónica del romaji para comparar: «Kōhī», «koohii» y «KOHI» dan lo mismo en las vocales largas más comunes. */
export function romajiKey(s){
  let t = String(s == null ? '' : s).toLowerCase().normalize('NFC');
  t = t.replace(/[āīūēōâîûêô]/g, c => MACRON[c]);
  t = t.replace(/[^a-z]/g, '');                                  // sin espacios, guiones, barras ni signos
  t = t.replace(/ou/g, 'oo').replace(/uu/g, 'u').replace(/ii/g, 'i').replace(/aa/g, 'a').replace(/ee/g, 'e').replace(/oo/g, 'o');   // vocales largas ≈ cortas
  t = t.replace(/wo/g, 'o').replace(/ji/g, 'zi').replace(/shi/g, 'si').replace(/chi/g, 'ti').replace(/tsu/g, 'tu').replace(/fu/g, 'hu').replace(/sh/g, 's').replace(/ch/g, 'c').replace(/ts/g, 't');
  return t;
}
/** ¿Lo escrito coincide con alguna de las lecturas (separadas por « / »)? */
export function romajiMatches(typed, target){
  const k = romajiKey(typed); if(!k) return false;
  return String(target).split('/').some(p => romajiKey(p) === k) || romajiKey(target) === k;
}

/** El texto del frente sin etiquetas <ruby>; con furigana se muestra como HTML seguro. */
export function stripRuby(html){ return String(html || '').replace(/<rt>.*?<\/rt>/g, '').replace(/<[^>]+>/g, ''); }
const SAFE_RUBY = /^(?:[^<>]|<\/?ruby>|<\/?rt>)*$/;
/** Solo deja pasar HTML con <ruby> y <rt>; si trae otra etiqueta devuelve texto plano. */
export function safeRubyHtml(html, fallback){
  const h = String(html || '');
  if(h && SAFE_RUBY.test(h)) return h;
  return String(fallback == null ? stripRuby(h) : fallback).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

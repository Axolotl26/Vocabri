// Vocabri — cara frontal de las tarjetas según el idioma del curso.
// Inglés: texto simple. Japonés: texto con furigana opcional y romaji debajo; el audio usa el texto sin etiquetas.
import { getCategoryLang } from '../categoriesRegistry.js';
import { langTag, safeRubyHtml, stripRuby } from './core/course.js';

const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function pref(k, dflt){ try{ const v = localStorage.getItem(k); return v == null ? dflt : v === '1'; }catch(e){ return dflt; } }
export const showFurigana = () => pref('ci_ja_furigana', true);
export const showRomaji = () => pref('ci_ja_romaji', true);
export function setJaPref(kind, on){ try{ localStorage.setItem(kind === 'furigana' ? 'ci_ja_furigana' : 'ci_ja_romaji', on ? '1' : '0'); }catch(e){} }

/** Idioma de la frase del frente de una tarjeta [frente, es, cat, clave, ...]. */
export function frontLangOf(item){ return item && item[2] ? getCategoryLang(item[2]) : 'en'; }

function setTraceBtn(text){
  const b = document.getElementById('traceBtn'); if(!b) return;
  const ok = !!text && [...text].length <= 6 && /[\u3040-\u30ff\u4e00-\u9fff]/.test(text);
  b.style.display = ok ? '' : 'none'; b.dataset.glyph = ok ? text : '';
}

/** Pinta el frente de la tarjeta y guarda en data-say / data-lang lo que debe leer la voz. */
export function renderFront(el, item){
  if(!el) return;
  const lang = frontLangOf(item);
  el.dataset.lang = langTag(lang);
  const tag = el.parentElement && el.parentElement.querySelector('.tag'); if(tag) tag.textContent = lang === 'ja' ? 'JA' : 'EN';
  if(lang === 'ja'){
    const plain = stripRuby(item[0]);
    el.dataset.say = plain; el.dataset.rom = String(item[9] || '').split('/')[0].trim();
    const furi = item[8] ? safeRubyHtml(item[8], esc(plain)) : esc(plain);
    el.classList.add('jaFront');
    setTraceBtn(plain);
    el.innerHTML = '<span class="jaText' + (showFurigana() ? '' : ' noFuri') + '">' + (showFurigana() ? furi : esc(plain)) + '</span>' +
      (showRomaji() && item[9] ? '<span class="jaRomaji">' + esc(item[9]) + '</span>' : '');
  }else{
    el.classList.remove('jaFront');
    setTraceBtn('');
    el.dataset.say = item[0]; el.dataset.lang = 'en-US'; el.dataset.rom = '';
    el.textContent = item[0];
  }
}

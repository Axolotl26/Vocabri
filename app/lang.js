// Vocabri — idioma activo (inglés o japonés). Todo lo que depende del idioma (tarjetas, progreso, repaso, modos, traductor,
// meta diaria…) lee de aquí, así los dos idiomas no se mezclan. Módulo sin DOM (solo localStorage).
const KEY = 'vocabri_language';
export const LANGS = ['en', 'ja'];
export const LANG_NAMES = { en: 'Inglés', ja: 'Japonés' };

export function activeLang(){
  try{ return localStorage.getItem(KEY) === 'ja' ? 'ja' : 'en'; }catch(e){ return 'en'; }
}
export const isJa = () => activeLang() === 'ja';
export const langSuffix = () => (isJa() ? '_ja' : '');

/** Curso que se abre al entrar a cada idioma si no hay uno recordado. */
export const DEFAULT_CAT = { en: 'general', ja: 'jp_n5' };

/** Recuerda qué curso usabas en cada idioma. */
export function rememberCat(lang, cat){ try{ localStorage.setItem('ci_cat_' + lang, cat); }catch(e){} }
export function rememberedCat(lang){ try{ return localStorage.getItem('ci_cat_' + lang) || DEFAULT_CAT[lang]; }catch(e){ return DEFAULT_CAT[lang]; } }

/** Cambia el idioma: guarda el curso a abrir y recarga para que todo arranque limpio en ese idioma. */
export function switchLanguage(lang, catOf){
  if(!LANGS.includes(lang) || lang === activeLang()) return false;
  try{
    const prev = activeLang(), cur = localStorage.getItem('ci_current_master_category');
    if(cur && catOf && catOf(cur) === prev) rememberCat(prev, cur);
    localStorage.setItem(KEY, lang);
    localStorage.setItem('ci_current_master_category', rememberedCat(lang));
    localStorage.setItem('ci_user_focus', rememberedCat(lang));
  }catch(e){ return false; }
  try{ location.reload(); }catch(e){}
  return true;
}

// Marca el idioma en <html> para que el CSS oculte lo que todavía es solo de inglés.
try{ document.documentElement.dataset.lang = activeLang(); }catch(e){}

// Vocabri — carga de cursos de otros idiomas (japonés, ...). Cada curso se descarga una vez, se guarda en el caché sin conexión
// y se convierte al formato interno. El progreso queda separado: las claves de las tarjetas llevan el id del curso.
import { CAT_MODULE_NAMES, CAT_MODULE_SIZES, DATA, ZONES_CARRY_EXAM } from './core/dataRegistry.js';
import { _nodeLayoutCache, _sessionLayoutCache } from './mapData.js';
import { convertCourse, validateCourse } from './core/course.js';
import { getCategoryDataUrl, getCategoryLang, getCourseIds } from '../categoriesRegistry.js';
import { activeLang } from './lang.js';
import { srsInvalidate } from './state.js';

const pending = {};

export const isCourse = cat => getCategoryLang(cat) !== 'en';
export const courseLang = cat => getCategoryLang(cat);
export const courseReady = cat => !isCourse(cat) || !!(DATA[cat] && DATA[cat].length);

/** Descarga y registra un curso. Devuelve true si quedó listo. */
export function ensureCourse(cat){
  if(courseReady(cat)) return Promise.resolve(true);
  if(pending[cat]) return pending[cat];
  const url = getCategoryDataUrl(cat);
  if(!url) return Promise.resolve(false);
  pending[cat] = fetch(url).then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(raw => {
    const errs = validateCourse(raw);
    if(errs.length){ console.error('[courses] curso inválido', cat, errs.slice(0, 5)); return false; }
    const c = convertCourse(raw);
    DATA[cat] = c.tuples; CAT_MODULE_SIZES[cat] = c.sizes; CAT_MODULE_NAMES[cat] = c.names; ZONES_CARRY_EXAM.add(cat);
    delete _sessionLayoutCache[cat]; delete _nodeLayoutCache[cat];
    srsInvalidate();
    return true;
  }).catch(e => { console.error('[courses] no se pudo cargar', cat, e); return false; }).finally(() => { delete pending[cat]; });
  return pending[cat];
}

// Cursos que el usuario ya abrió: se cargan al iniciar la app para que sus tarjetas aparezcan en el repaso.
const ACTIVE_KEY = 'ci_courses_active';
export function activeCourses(){ try{ const a = JSON.parse(localStorage.getItem(ACTIVE_KEY) || '[]'); return Array.isArray(a) ? a.filter(isCourse) : []; }catch(e){ return []; } }
export function markCourseActive(cat){
  if(!isCourse(cat)) return;
  const a = activeCourses(); if(a.includes(cat)) return; a.push(cat);
  try{ localStorage.setItem(ACTIVE_KEY, JSON.stringify(a)); }catch(e){}
}
export function preloadActiveCourses(){
  // En japonés se cargan todos sus cursos (N5, Kanji N5, N4…) para que Progreso, Repasar y el selector los vean completos.
  const ids = activeLang() === 'en' ? activeCourses() : [...new Set(getCourseIds().filter(c => getCategoryLang(c) === activeLang()).concat(activeCourses().filter(c => getCategoryLang(c) === activeLang())))];
  return Promise.all(ids.map(ensureCourse)).then(r => {
    if(r.some(Boolean)) try{ window.dispatchEvent(new CustomEvent('vocabri:coursesLoaded')); }catch(e){}
    return r;
  });
}

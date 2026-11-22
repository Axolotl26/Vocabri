// Vocabri — genera los botones de categoría (onboarding y selector de ajustes) desde el registro único.
import { getLanguages, getMasterCategories } from '../categoriesRegistry.js';
import { isCategoryUnlocked } from './core/unlocks.js';
import { setJaPref, showFurigana, showRomaji } from './cardFace.js';
import { getCategoryLang } from '../categoriesRegistry.js';
import { LANG_NAMES, activeLang, switchLanguage } from './lang.js';

function esc(t){ return String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

export function renderCategoryOptions(doc = document){
  const cats = getMasterCategories();
  const focus = doc.querySelector('.focusOptions');
  if(focus){
    focus.innerHTML = cats.filter(c => !c.unlockLevel && c.lang === 'en').map(c =>
      '<button type="button" class="focusOption obOpt focus-glow" data-focus="' + esc(c.id) + '">' +
        '<span class="obOptIc" aria-hidden="true">' + c.emoji + '</span><span class="obOptMain">' + esc(c.name) + '</span>' +
        '<span class="obOptSub">' + esc(c.description) + '</span></button>'
    ).join('\n');
  }
  const sel = doc.getElementById('catSelector');
  if(sel){
    const lang = activeLang();
    // Solo los cursos del idioma activo (cambiar de idioma se hace arriba, en el selector de idioma)
    sel.innerHTML = cats.filter(c => c.lang === lang).map(c => {
      const lock = c.unlockLevel && !isCategoryUnlocked(c.id);
      return '<button class="catSelectorBtn hover-scale focus-glow' + (lock ? ' locked' : '') + '" data-cat="' + esc(c.id) + '" type="button"' + (lock ? ' aria-disabled="true"' : '') + '>' +
        (lock ? '🔒' : c.emoji) + ' ' + esc(c.name) + (lock ? ' · nivel ' + c.unlockLevel : '') + (c.beta ? ' <em class="catBeta">beta</em>' : '') + '</button>';
    }).join('\n');
  }
  const sw = doc.getElementById('langSwitch');
  if(sw){
    sw.innerHTML = getLanguages().map(l => '<button type="button" role="radio" class="langSwBtn hover-scale focus-glow' + (l.id === activeLang() ? ' sel' : '') + '" data-lang="' + l.id + '" aria-checked="' + (l.id === activeLang()) + '">' +
      '<span class="langSwIc" aria-hidden="true">' + l.emoji + '</span><span class="langSwTx"><b>' + esc(l.name) + '</b><small>' + (l.id === 'ja' ? 'JLPT N5 → N1 · beta' : 'Frases por temas') + '</small></span></button>').join('');
    if(!sw.dataset.wired){
      sw.dataset.wired = '1';
      sw.addEventListener('click', e => {
        const b = e.target.closest('.langSwBtn'); if(!b || b.dataset.lang === activeLang()) return;
        b.classList.add('busy');
        import('./ui.js').then(u => u.showToast('Cambiando a ' + LANG_NAMES[b.dataset.lang] + '…', '🌐', 1200)).catch(() => {});
        setTimeout(() => switchLanguage(b.dataset.lang, getCategoryLang), 350);
      });
    }
  }
  // Ajustes que solo existen en japonés
  const ex = doc.getElementById('langExtras');
  if(ex){
    const ja = activeLang() === 'ja';
    ex.hidden = !ja;
    if(ja && !ex.dataset.wired){
      ex.dataset.wired = '1';
      ex.innerHTML = '<div class="langOptsTitle">Ajustes del japonés</div>' +
        '<button type="button" class="langOpt hover-scale focus-glow" id="jaFuriBtn" aria-pressed="false"></button>' +
        '<button type="button" class="langOpt hover-scale focus-glow" id="jaRomajiBtn" aria-pressed="false"></button>';
      const sync = () => {
        const f = doc.getElementById('jaFuriBtn'), r = doc.getElementById('jaRomajiBtn');
        if(f){ f.textContent = 'Furigana (lectura sobre los kanji): ' + (showFurigana() ? 'Sí' : 'No'); f.setAttribute('aria-pressed', showFurigana()); }
        if(r){ r.textContent = 'Romaji bajo el texto: ' + (showRomaji() ? 'Sí' : 'No'); r.setAttribute('aria-pressed', showRomaji()); }
      };
      ex.addEventListener('click', e => {
        const t = e.target.closest('#jaFuriBtn, #jaRomajiBtn'); if(!t) return;
        if(t.id === 'jaFuriBtn') setJaPref('furigana', !showFurigana()); else setJaPref('romaji', !showRomaji());
        sync();
      });
      sync();
      doc.addEventListener('vocabri-settings-open', sync);
    }
  }
  const gt = doc.getElementById('goalTitle');
  if(gt) gt.textContent = activeLang() === 'ja' ? 'Meta diaria · Japonés' : 'Meta diaria';
}

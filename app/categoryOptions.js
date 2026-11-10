// Vocabri — genera los botones de categoría (onboarding y selector de ajustes) desde el registro único.
import { getMasterCategories } from '../categoriesRegistry.js';

function esc(t){ return String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

export function renderCategoryOptions(doc = document){
  const cats = getMasterCategories();
  const focus = doc.querySelector('.focusOptions');
  if(focus){
    focus.innerHTML = cats.map(c =>
      '<button type="button" class="focusOption obOpt focus-glow" data-focus="' + esc(c.id) + '">' +
        '<span class="obOptIc" aria-hidden="true">' + c.emoji + '</span><span class="obOptMain">' + esc(c.name) + '</span>' +
        '<span class="obOptSub">' + esc(c.description) + '</span></button>'
    ).join('\n');
  }
  const sel = doc.getElementById('catSelector');
  if(sel){
    sel.innerHTML = cats.map(c =>
      '<button class="catSelectorBtn hover-scale focus-glow" data-cat="' + esc(c.id) + '" type="button">' + c.emoji + ' ' + esc(c.name) + '</button>'
    ).join('\n');
  }
}

// Vocabri — genera los botones de categoría (onboarding y selector de ajustes) desde el registro único.
import { getMasterCategories } from '../categoriesRegistry.js';
import { isCategoryUnlocked } from './core/unlocks.js';

function esc(t){ return String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

export function renderCategoryOptions(doc = document){
  const cats = getMasterCategories();
  const focus = doc.querySelector('.focusOptions');
  if(focus){
    focus.innerHTML = cats.filter(c => !c.unlockLevel).map(c =>
      '<button type="button" class="focusOption obOpt focus-glow" data-focus="' + esc(c.id) + '">' +
        '<span class="obOptIc" aria-hidden="true">' + c.emoji + '</span><span class="obOptMain">' + esc(c.name) + '</span>' +
        '<span class="obOptSub">' + esc(c.description) + '</span></button>'
    ).join('\n');
  }
  const sel = doc.getElementById('catSelector');
  if(sel){
    sel.innerHTML = cats.map(c => {
      const lock = c.unlockLevel && !isCategoryUnlocked(c.id);
      return '<button class="catSelectorBtn hover-scale focus-glow' + (lock ? ' locked' : '') + '" data-cat="' + esc(c.id) + '" type="button"' + (lock ? ' aria-disabled="true"' : '') + '>' +
        (lock ? '🔒' : c.emoji) + ' ' + esc(c.name) + (lock ? ' · nivel ' + c.unlockLevel : '') + '</button>';
    }).join('\n');
  }
}

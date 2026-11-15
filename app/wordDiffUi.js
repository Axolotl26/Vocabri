// Vocabri — pinta el resultado de diffWords() como fichas (DOM, sin innerHTML). Las fichas con error se pueden tocar para oír la palabra.
import { speak } from './speech.js';

const strip = (w) => String(w || '').replace(/[?!.,;:]+$/, '');

export function buildDiffEl(segs, label){
  const box = document.createElement('span');
  box.className = 'wdBox';
  if(label){ const em = document.createElement('em'); em.textContent = label; box.appendChild(em); }
  segs.forEach(x => {
    const chip = document.createElement(x.s === 'ok' || x.s === 'extra' ? 'span' : 'button');
    chip.className = 'wd ' + x.s;
    if(x.s === 'missing'){ chip.textContent = '___'; chip.title = 'Falta: ' + strip(x.w); }
    else chip.textContent = x.t;
    if(x.s === 'wrong') chip.title = 'Era: ' + strip(x.w);
    if(chip.tagName === 'BUTTON'){
      chip.type = 'button';
      chip.setAttribute('aria-label', 'Escuchar «' + strip(x.w) + '»');
      chip.onclick = (e) => { e.stopPropagation(); try{ speak(strip(x.w), 'en-US', 0.85); }catch(err){} };
    }
    box.appendChild(chip);
  });
  const fix = segs.filter(x => x.s === 'wrong' || x.s === 'missing').slice(0, 4)
    .map(x => (x.s === 'wrong' ? x.t + ' → ' : 'falta: ') + strip(x.w));
  if(fix.length){ const s = document.createElement('small'); s.textContent = fix.join(' · ') + '  (toca una palabra para oírla)'; box.appendChild(s); }
  return box;
}

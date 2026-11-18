// Vocabri — ventana de «¡Subiste de nivel!»: medalla con rayos, confeti y fanfarria (más grande cada 5 niveles).
import { celebrate, animationsEnabled } from './mascot.js';
import { playSfx, haptic } from './speech.js';
import { dismissTopModal } from './map.js';

export const isMilestone = level => level > 1 && level % 5 === 0;
export function levelMessage(level){
  if(level % 10 === 0) return '¡Eres una leyenda del vocabulario!';
  if(level % 5 === 0) return '¡Hito de nivel ' + level + '! Tu constancia se nota.';
  if(level === 2) return '¡Primer nivel conseguido! Esto apenas empieza.';
  return 'Cada frase que repasas te trae hasta aquí. ¡Sigue así!';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function medalSvg(level){
  const big = String(level).length > 2 ? 40 : 52;
  return '<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">' +
    '<g class="lvlRibbon"><path d="M48 96 30 150l28-12 12 18 14-50Z" fill="#EF4444" stroke="#7F1D1D" stroke-width="6" stroke-linejoin="round"/><path d="M112 96 130 150l-28-12-12 18-14-50Z" fill="#F87171" stroke="#7F1D1D" stroke-width="6" stroke-linejoin="round"/></g>' +
    '<circle cx="80" cy="76" r="62" fill="#7C4A00"/><circle cx="80" cy="70" r="62" fill="#FACC15" stroke="#7C4A00" stroke-width="7"/>' +
    '<circle cx="80" cy="70" r="46" fill="#FDE047" stroke="#B45309" stroke-width="5"/>' +
    '<path d="M42 54a42 42 0 0 1 30-22" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="6" stroke-linecap="round"/>' +
    '<text x="80" y="' + (70 + big * .36) + '" text-anchor="middle" font-family="Nunito,system-ui,sans-serif" font-weight="900" font-size="' + big + '" fill="#fff" stroke="#B45309" stroke-width="8" paint-order="stroke" stroke-linejoin="round">' + esc(level) + '</text></svg>';
}

export function showLevelUp(level){
  const big = isMilestone(level);
  const o = document.createElement('div');
  o.className = 'gModalOverlay lvlOverlay'; o.id = 'levelUpOverlay'; o.style.display = 'flex'; o.style.zIndex = '10001';
  o.innerHTML = '<div class="gModal lvlModal' + (big ? ' lvlBig' : '') + '" role="dialog" aria-modal="true" aria-labelledby="lvlTitle" aria-describedby="lvlMsg">' +
    '<div class="lvlRays" aria-hidden="true"></div>' +
    '<div class="lvlMedal">' + medalSvg(level) + '</div>' +
    '<h3 id="lvlTitle">' + (big ? '¡Hito alcanzado!' : '¡Subiste de nivel!') + '</h3>' +
    '<p class="lvlNum">Nivel ' + esc(level) + '</p>' +
    '<p id="lvlMsg">' + esc(levelMessage(level)) + '</p>' +
    '<button type="button" class="nav hover-scale focus-glow" id="lvlOk">¡Seguir!</button></div>';
  document.body.appendChild(o);
  const close = () => { document.removeEventListener('keydown', esc2); o.remove(); dismissTopModal(); };
  const esc2 = e => { if(e.key === 'Escape' || e.key === 'Enter'){ e.preventDefault(); close(); } };
  document.addEventListener('keydown', esc2);
  o.querySelector('#lvlOk').onclick = close;
  o.addEventListener('click', e => { if(e.target === o) close(); });
  o.querySelector('#lvlOk').focus();
  playSfx(big ? 'levelupBig' : 'levelup'); haptic();
  celebrate({ count: big ? 80 : 44 });
  if(big && animationsEnabled()) setTimeout(() => celebrate({ count: 50 }), 700);
}

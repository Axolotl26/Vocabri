// Vocabri — evento de la semana: botón del perfil, ventana con progreso e insignias.
import { emojiSvg } from './emojiIcons.js';
import { GOAL, BONUS_XP, THEMES, normalizeEvents, recordStudy, eventStatus } from './core/events.js';
import { awardXp, showToast, switchView, selectFocusCategory } from './ui.js';
import { celebrate } from './mascot.js';
import { playSfx } from './speech.js';

const KEY = 'vocabri_events';
const icon = (name, cls) => '<span class="ei ' + (cls || '') + '">' + emojiSvg(name) + '</span>';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function load(){ let raw = null; try{ raw = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){} return normalizeEvents(raw, new Date()); }
function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
export const eventBadges = () => load().badges;

function onGraded(e){
  const d = e && e.detail || {}, key = d.key; if(!key) return;
  const r = recordStudy(load(), key, new Date(), { good: !!d.applied && d.grade >= 3 });
  if(!r.counted) return;
  save(r.state);
  updateEventButton();
  if(r.completedNow){
    const th = THEMES.find(t => t.id === r.state.theme);
    awardXp(BONUS_XP, { source: 'event', key: 'event|' + r.state.week });
    try{ playSfx('chest'); celebrate({ count: 56 }); }catch(e2){}
    showToast('¡Evento cumplido! Ganaste la ' + (th ? th.badge : 'insignia') + ' y +' + BONUS_XP + ' XP', th ? th.icon : '🏅', 5200);
    import('./collection.js').then(c => c.refreshCollection()).catch(() => {});
  }
  const ov = document.getElementById('eventOverlay'); if(ov) paintModal(ov);
}

export function updateEventButton(){
  const btn = document.getElementById('eventBtn'); if(!btn) return;
  const st = eventStatus(load(), new Date());
  const ic = btn.querySelector('.sitIc'); if(ic) ic.innerHTML = icon(st.theme.icon, 'evIc');
  const t = document.getElementById('eventTitle'); if(t) t.textContent = 'Semana de ' + st.theme.name;
  const small = document.getElementById('eventSub');
  if(small) small.textContent = st.done ? '¡Cumplido! Nuevo tema el lunes' : st.waitDays ? 'Estudia en ' + (st.minDays - st.days) + ' día' + (st.minDays - st.days > 1 ? 's' : '') + ' más para cerrarlo' : st.count + ' de ' + st.goal + ' frases · quedan ' + st.daysLeft + (st.daysLeft === 1 ? ' día' : ' días');
  const bar = document.getElementById('eventBarFill'); if(bar) bar.style.width = st.pct + '%';
  btn.classList.toggle('evDone', st.done);
}

function paintModal(o){
  const st = eventStatus(load(), new Date()), th = st.theme;
  const badges = THEMES.map(t => {
    const n = st.badges[t.id] || 0;
    return '<li class="evBadge' + (n ? ' got' : '') + '" aria-label="' + esc(t.badge) + (n ? ': conseguida' + (n > 1 ? ' ' + n + ' veces' : '') : ': aún no') + '">' +
      '<span class="evBadgeIc" aria-hidden="true">' + (n ? icon(t.icon) : icon('🔒')) + '</span><small>' + esc(t.name) + '</small>' + (n > 1 ? '<b>×' + n + '</b>' : '') + '</li>';
  }).join('');
  o.querySelector('#evBody').innerHTML =
    '<div class="evHero" aria-hidden="true">' + icon(th.icon, 'evBig') + '</div>' +
    '<h3 id="evTitle">Semana de ' + esc(th.name) + '</h3>' +
    '<p class="evLead" role="status">' + (st.done ? '¡Lo lograste! Ganaste la ' + esc(th.badge) + '. El lunes llega otro tema.'
      : 'Estudia ' + st.goal + ' frases distintas de ' + esc(th.name) + ' (en el mapa o en Repasar), repartidas en al menos ' + st.minDays + ' días distintos, antes del domingo y gana la ' + esc(th.badge) + ' y +' + BONUS_XP + ' XP.') + '</p>' +
    '<div class="evBar" role="progressbar" aria-valuemin="0" aria-valuemax="' + st.goal + '" aria-valuenow="' + st.count + '" aria-label="Progreso del evento"><span style="width:' + st.pct + '%"></span></div>' +
    '<p class="evCount">' + st.count + ' de ' + st.goal + ' frases · ' + st.days + ' de ' + st.minDays + ' días · quedan ' + st.daysLeft + (st.daysLeft === 1 ? ' día' : ' días') + '</p>' +
    (st.done ? '' : '<button type="button" class="nav hover-scale focus-glow" id="evGo" data-autofocus>Estudiar ' + esc(th.name) + '</button>') +
    '<h4 class="evH">Tus insignias</h4><ul class="evBadges">' + badges + '</ul>';
  const go = o.querySelector('#evGo');
  if(go) go.onclick = () => { closeModal(o); try{ selectFocusCategory(th.id); }catch(e){} try{ switchView('learn'); }catch(e){} };
}
function closeModal(o){ o.remove(); document.removeEventListener('keydown', o._esc); const b = document.getElementById('eventBtn'); if(b){ b.setAttribute('aria-expanded', 'false'); b.focus({ preventScroll: true }); } }

export function openEventModal(){
  if(document.getElementById('eventOverlay')) return;
  const o = document.createElement('div');
  o.className = 'gModalOverlay'; o.id = 'eventOverlay'; o.style.display = 'flex'; o.style.zIndex = '10000';
  o.innerHTML = '<div class="gModal evModal" role="dialog" aria-modal="true" aria-labelledby="evTitle"><button type="button" class="modalCloseBtn evClose" aria-label="Cerrar">✕</button><div id="evBody"></div></div>';
  document.body.appendChild(o);
  paintModal(o);
  o._esc = e => { if(e.key === 'Escape') closeModal(o); };
  document.addEventListener('keydown', o._esc);
  o.querySelector('.evClose').onclick = () => closeModal(o);
  o.addEventListener('click', e => { if(e.target === o) closeModal(o); });
  const f = o.querySelector('[data-autofocus]') || o.querySelector('.evClose'); f.focus({ preventScroll: true });
}

let _wired = false;
export function wireEvents(){
  const btn = document.getElementById('eventBtn');
  if(btn){ btn.onclick = () => { btn.setAttribute('aria-expanded', 'true'); openEventModal(); }; updateEventButton(); }
  if(!_wired){ _wired = true; window.addEventListener('vocabri:graded', onGraded); }
}

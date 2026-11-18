// Vocabri — cofre semanal: botón del perfil + ventana para abrirlo.
import { emojiSvg } from './emojiIcons.js';
import { normalizeWeekly, recordDay, chestState, claimChest, weekDays, BONUS_XP, GOAL_DAYS } from './core/weekly.js';
import { awardXp, showToast } from './ui.js';
import { celebrate } from './mascot.js';
import { playSfx } from './speech.js';
import { getDailyGoalTarget, getXpToday } from './state.js';

const KEY = 'vocabri_weekly';
function load(){ let raw = null; try{ raw = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){} return normalizeWeekly(raw, new Date()); }
function save(w){ try{ localStorage.setItem(KEY, JSON.stringify(w)); }catch(e){} }
const icon = (name, cls) => '<span class="ei ' + (cls || '') + '">' + emojiSvg(name) + '</span>';

/** Marca el día de hoy como «meta cumplida». Avisa cuando el cofre queda listo. */
export function recordGoalDay(){
  const before = chestState(load(), new Date()), w = recordDay(load(), new Date());
  save(w);
  const after = chestState(w, new Date());
  if(after.ready && !before.ready) showToast('¡Tu cofre semanal está listo para abrir!', '🎁', 4200);
  updateChestButton();
}
/** Si hoy ya se cumplió la meta (p. ej. antes de actualizar), se cuenta al abrir la app. */
export function syncToday(){ try{ if(getXpToday() >= getDailyGoalTarget()) recordGoalDay(); }catch(e){} }

export function updateChestButton(){
  const btn = document.getElementById('weeklyChestBtn'); if(!btn) return;
  const st = chestState(load(), new Date());
  const ic = btn.querySelector('.sitIc'); if(ic) ic.innerHTML = icon(st.claimed ? 'chestOpen' : 'chest', 'chestIc');
  const small = document.getElementById('chestCount');
  if(small) small.textContent = st.claimed ? 'Abierto esta semana · vuelve el lunes'
    : st.ready ? '¡Listo para abrir! +' + BONUS_XP + ' XP'
    : st.days + ' de ' + st.goal + ' días de meta cumplida';
  const bar = document.getElementById('chestBarFill'); if(bar) bar.style.width = Math.min(100, Math.round(st.days / st.goal * 100)) + '%';
  btn.classList.toggle('chestReady', st.ready);
}

function closeModal(o){ o.remove(); document.removeEventListener('keydown', o._esc); const b = document.getElementById('weeklyChestBtn'); if(b){ b.setAttribute('aria-expanded', 'false'); b.focus({ preventScroll: true }); } }

export function openChestModal(){
  if(document.getElementById('chestOverlay')) return;
  const now = new Date(), w = load(), st = chestState(w, now), days = weekDays(w, now);
  const o = document.createElement('div');
  o.className = 'gModalOverlay'; o.id = 'chestOverlay'; o.style.display = 'flex'; o.style.zIndex = '10000';
  const dayHtml = days.map(d => '<li class="chestDay' + (d.done ? ' done' : '') + (d.today ? ' today' : '') + '" aria-label="' + d.name + (d.done ? ': meta cumplida' : d.future ? ': pendiente' : ': sin meta') + '"><span aria-hidden="true">' + d.label + '</span></li>').join('');
  o.innerHTML = '<div class="gModal chestModal" role="dialog" aria-modal="true" aria-labelledby="chestTitle">' +
    '<button type="button" class="modalCloseBtn chestClose" aria-label="Cerrar">✕</button>' +
    '<div class="chestStage" id="chestStage" aria-hidden="true">' + icon(st.claimed ? 'chestOpen' : 'chest', 'chestBig') + '</div>' +
    '<h3 id="chestTitle">Cofre semanal</h3>' +
    '<p id="chestMsg" role="status" aria-live="polite"></p>' +
    '<ol class="chestDays" aria-label="Días de esta semana">' + dayHtml + '</ol>' +
    '<button type="button" class="nav hover-scale focus-glow" id="chestOpenBtn"></button></div>';
  document.body.appendChild(o);
  const msg = o.querySelector('#chestMsg'), btn = o.querySelector('#chestOpenBtn'), stage = o.querySelector('#chestStage');
  const paint = () => {
    const s = chestState(load(), new Date());
    msg.textContent = s.claimed ? 'Ya abriste el cofre de esta semana. El lunes se llena otro.'
      : s.ready ? '¡Cumpliste ' + s.days + ' días de meta! Ábrelo y llévate +' + BONUS_XP + ' XP.'
      : 'Cumple tu meta diaria ' + GOAL_DAYS + ' días de lunes a domingo (te faltan ' + s.left + ') y se abre solo una vez por semana.';
    btn.textContent = s.claimed ? 'Abierto' : s.ready ? 'Abrir cofre' : 'Aún falta';
    btn.disabled = !s.ready;
  };
  paint();
  btn.onclick = () => {
    const r = claimChest(load(), new Date()); if(!r.xp) return;
    save(r.state); btn.disabled = true;
    stage.innerHTML = icon('chestOpen', 'chestBig chestPop');
    playSfx('chest'); celebrate({ count: 48 });
    awardXp(r.xp, { source: 'weekly', key: 'weekly|' + r.state.week });
    paint(); updateChestButton();
  };
  o._esc = e => { if(e.key === 'Escape') closeModal(o); };
  document.addEventListener('keydown', o._esc);
  o.querySelector('.chestClose').onclick = () => closeModal(o);
  o.addEventListener('click', e => { if(e.target === o) closeModal(o); });
  (btn.disabled ? o.querySelector('.chestClose') : btn).focus();
}

export function wireWeeklyChest(){
  const btn = document.getElementById('weeklyChestBtn'); if(!btn) return;
  btn.onclick = () => { btn.setAttribute('aria-expanded', 'true'); openChestModal(); };
  updateChestButton();
}

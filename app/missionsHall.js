// Vocabri — Salón de misiones (solo consulta): misiones cumplidas, perdidas y la activa. No se juega desde aquí.
import { MODES, missionStats, daysLeft } from './core/missions.js';
import { collectStats, isOwned, refreshCollection } from './collection.js';
import { THEME_ITEMS, FRAME_ITEMS, TITLE_ITEMS } from './core/collection.js';
import { catLabel } from './core/dataRegistry.js';
import { missionIconSvg, loadMissions } from './missions.js';
import { escapeHtml } from './myCards.js';

const esc = s => escapeHtml(String(s == null ? '' : s));
const fmtDate = ts => { try{ return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' }); }catch(e){ return ''; } };
const MODE_ORDER = ['order', 'register', 'time', 'survival'];

export function hallSummary(m){
  const xp = m.done.reduce((s, d) => s + ((MODES[d.mode] || {}).xp || 0), 0);
  const perMode = {}; MODE_ORDER.forEach(k => perMode[k] = 0);
  m.done.forEach(d => { if(perMode[d.mode] != null) perMode[d.mode]++; });
  return { done: m.done.length, missed: m.missed.length, xp, perMode };
}

export function hallHistory(m, n = 20){
  return m.done.map(d => Object.assign({ ok: true }, d)).concat(m.missed.map(d => Object.assign({ ok: false }, d)))
    .sort((a, b) => b.at - a.at).slice(0, n);
}

// Recompensas que se ganan con misiones (están en la Colección; aquí se ven con su requisito).
const HALL_REWARD_IDS = ['title:missionary', 'title:hunter', 'title:unstoppable', 'frame:quest'];
function hallRewards(){
  return THEME_ITEMS.concat(FRAME_ITEMS, TITLE_ITEMS).filter(it => HALL_REWARD_IDS.indexOf(it.id) >= 0);
}
const KIND_LABEL = { title: 'Título', frame: 'Marco' };

function catName(id){ try{ return catLabel(id); }catch(e){ return id || ''; } }

function recordsHtml(ms, cs){
  const rec = [
    ['🔥', cs.bestStreak, 'Mejor racha (días)'], ['🎯', ms.bestRun, 'Misiones seguidas sin perder'], ['💎', ms.perfects, 'Misiones perfectas (8/8)'],
    ['⭐', cs.examThreeStars, 'Exámenes con 3 estrellas'], ['📚', cs.mastered, 'Frases dominadas'], ['🏅', 'Nivel ' + cs.level, 'Tu nivel']
  ];
  return '<ul class="mhRecs">' + rec.map(r => '<li class="mhRec"><span class="mhRecIc" aria-hidden="true">' + r[0] + '</span><b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + '</small></li>').join('') + '</ul>';
}

function rewardsHtml(){
  return '<ul class="mhRewards">' + hallRewards().map(it => {
    const got = isOwned(it.id);
    return '<li class="mhRew' + (got ? ' isGot' : '') + '"><span class="mhRewIc" aria-hidden="true">' + (got ? it.icon : '🔒') + '</span><span class="mhTx"><b>' + esc(it.name) + '</b><small>' +
      (got ? (KIND_LABEL[it.kind] || '') + ' conseguido' : esc(it.hint)) + '</small></span><span class="mhRes">' + (KIND_LABEL[it.kind] || '') + '</span></li>';
  }).join('') + '</ul>';
}

export function renderMissionsHall(){
  const box = document.getElementById('missionsHallBox');
  if(!box) return;
  try{ refreshCollection(); }catch(e){}
  const m = loadMissions(), s = hallSummary(m), hist = hallHistory(m), ms = missionStats(m), cs = collectStats();
  const active = m.active
    ? '<div class="mhActive"><span class="mhIc">' + missionIconSvg(m.active.mode, 40) + '</span><span class="mhTx"><b>' + esc(MODES[m.active.mode].name) + '</b><small>Activa · ' +
      (daysLeft(m.active, Date.now()) <= 1 ? '¡último día!' : 'quedan ' + daysLeft(m.active, Date.now()) + ' días') + ' · se juega desde el mapa</small></span></div>'
    : '<p class="mhEmpty">No hay ninguna misión activa. La siguiente aparecerá en el mapa.</p>';
  const modes = MODE_ORDER.map(k => '<li class="mhMode' + (s.perMode[k] ? ' isGot' : '') + '"><span class="mhIc">' + missionIconSvg(k, 34) + '</span><span class="mhTx"><b>' + esc(MODES[k].name) + '</b><small>' +
    (s.perMode[k] ? 'Cumplida ' + s.perMode[k] + (s.perMode[k] === 1 ? ' vez' : ' veces') : 'Aún no la has cumplido') + '</small></span></li>').join('');
  const list = hist.length ? '<ul class="mhHist">' + hist.map(h => '<li class="mhRow ' + (h.ok ? 'isOk' : 'isMiss') + '"><span class="mhIc">' + missionIconSvg(h.mode, 30) + '</span><span class="mhTx"><b>' + esc(MODES[h.mode].name) + '</b><small>' +
    esc(catName(h.cat)) + ' · ' + esc(fmtDate(h.at)) + '</small></span><span class="mhRes">' + (h.ok ? '✓ +' + MODES[h.mode].xp + ' XP' : '✗ Perdida') + '</span></li>').join('') + '</ul>'
    : '<p class="mhEmpty">Todavía no hay historial. Cuando cumplas o pierdas una misión aparecerá aquí.</p>';
  box.innerHTML =
    '<div class="mhStats"><div class="mhStat"><b>' + s.done + '</b><span>Cumplidas</span></div><div class="mhStat"><b>' + s.missed + '</b><span>Perdidas</span></div><div class="mhStat"><b>' + s.xp + '</b><span>XP ganados</span></div></div>' +
    '<div class="setTitle mhTitle">RÉCORDS</div>' + recordsHtml(ms, cs) +
    '<div class="setTitle mhTitle">MISIÓN ACTUAL</div>' + active +
    '<div class="setTitle mhTitle">MODOS</div><ul class="mhModes">' + modes + '</ul>' +
    '<div class="setTitle mhTitle">RECOMPENSAS DE MISIONES</div>' + rewardsHtml() +
    '<div class="setTitle mhTitle">HISTORIAL</div>' + list;
}

// Botón del perfil: resumen + abre el menú flotante.
export function updateHallButton(){
  const m = loadMissions(), cnt = document.getElementById('hallCount'), bar = document.getElementById('hallBarFill');
  const s = hallSummary(m), got = MODE_ORDER.filter(k => s.perMode[k] > 0).length;
  if(cnt) cnt.textContent = s.done + (s.done === 1 ? ' misión cumplida' : ' misiones cumplidas') + ' · ' + got + ' de ' + MODE_ORDER.length + ' modos';
  if(bar) bar.style.width = Math.round(got / MODE_ORDER.length * 100) + '%';
}

let _wired = false;
export function wireMissionsHall(){
  updateHallButton();
  if(_wired) return;
  const btn = document.getElementById('missionsHallBtn'), panel = document.getElementById('missionsHallPanel');
  if(!btn || !panel) return;
  _wired = true;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = panel.hidden;
    if(open){ try{ renderMissionsHall(); }catch(err){} panel.scrollTop = 0; }
    panel.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  });
  panel.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden){ panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus({ preventScroll: true }); } });
}

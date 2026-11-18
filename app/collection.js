// Vocabri — colección: estadísticas → desbloqueos persistentes, equipamiento y pantalla «Salón de colección».
import { catalog, evaluate } from './core/collection.js';
import { missionStats, normalizeMissions } from './core/missions.js';
import { unlockedMasterIds, catLabel, computeStreak, examStarsFor, isMastered, itemsFor, readStored } from './core/dataRegistry.js';
import { getXpTotal, levelFromXp } from './state.js';
import { getMasterCategory } from '../categoriesRegistry.js';

const LS_OWNED = 'vocabri_collection', LS_BEST = 'vocabri_best_streak', LS_FRAME = 'vocabri_frame', LS_TITLE = 'vocabri_title';

const jget = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } };
const jset = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

export function ownedIds(){ return new Set(jget(LS_OWNED, [])); }
export function isOwned(id){ return ownedIds().has(id); }

export function collectStats(){
  const bestPrev = parseInt(jget(LS_BEST, 0), 10) || 0;
  const best = Math.max(bestPrev, computeStreak());
  if(best !== bestPrev) jset(LS_BEST, best);
  let mastered = 0;
  const cats = [];
  unlockedMasterIds().forEach(id => {
    const items = itemsFor(id);
    if(!items.length) return;
    let studied = 0;
    items.forEach(it => { const s = readStored(it[3]); if(s.reps > 0 || s.m) studied++; if(isMastered(it[3])) mastered++; });
    const meta = getMasterCategory(id) || {};
    cats.push({ id, name: catLabel(id), emoji: meta.emoji || '🏷️', pct: studied / items.length });
  });
  let three = 0;
  try{
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(k && k.indexOf('vocabri_exam_') === 0){
        try{ const r = JSON.parse(localStorage.getItem(k)); if(r && examStarsFor(Number(r.score) || 0, Number(r.total) || 0) === 3) three++; }catch(e){}
      }
    }
  }catch(e){}
  let missions = 0, missionModes = 0, missionRun = 0;
  try{ const ms = missionStats(normalizeMissions(JSON.parse(localStorage.getItem('vocabri_missions') || 'null'))); missions = ms.done; missionModes = ms.modes; missionRun = ms.bestRun; }catch(e){}
  return { level: levelFromXp(getXpTotal()), bestStreak: best, examThreeStars: three, mastered, cats, missions, missionModes, missionRun };
}

// Calcula desbloqueos nuevos, los guarda (permanentes) y avisa con un aviso por cada uno (máx. 2 + resumen).
export function refreshCollection(){
  let stats;
  try{ stats = collectStats(); }catch(e){ return; }
  const r = evaluate(stats, [...ownedIds()]);
  if(!r.fresh.length) return;
  jset(LS_OWNED, [...r.owned]);
  import('./ui.js').then(u => {
    r.fresh.filter(x => x.id !== 'sticker:pink').slice(0, 2).forEach((x, i) => setTimeout(() => u.showToast('¡Desbloqueaste: ' + x.name + '!', x.icon, 4500), 900 + i * 1200));
    const rest = r.fresh.filter(x => x.id !== 'sticker:pink').length - 2;
    if(rest > 0) setTimeout(() => u.showToast('…y ' + rest + ' recompensa' + (rest > 1 ? 's' : '') + ' más en tu perfil.', '🎁', 4500), 3400);
  }).catch(() => {});
  try{ renderCollection(); applyFrame(); }catch(e){}
}

export const getFrame = () => { const f = jget(LS_FRAME, ''); return f && isOwned('frame:' + f) ? f : ''; };
export const getTitle = () => { const t = jget(LS_TITLE, ''); return t && isOwned('title:' + t) ? t : ''; };

export function applyFrame(){
  const f = getFrame();
  document.querySelectorAll('#profileView .gLevel').forEach(el => { if(f) el.setAttribute('data-frame', f); else el.removeAttribute('data-frame'); });
  const t = getTitle(), el = document.getElementById('pfTitle');
  if(el){
    const def = catalog({}).find(x => x.id === 'title:' + t);
    el.textContent = def ? def.icon + ' ' + def.name : '';
    el.style.display = def ? '' : 'none';
  }
}

function card(it, owned, opts){
  const b = document.createElement(opts.action && owned ? 'button' : 'div');
  if(b.tagName === 'BUTTON') b.type = 'button';
  b.className = 'colItem' + (owned ? '' : ' locked') + (opts.selected ? ' sel' : '');
  const ic = document.createElement('span'); ic.className = 'colIc';
  if(it.kind === 'sticker' && owned){
    const im = document.createElement('img'); im.src = './assets/stickers/' + it.file; im.alt = it.name; im.loading = 'lazy'; ic.appendChild(im);
  } else ic.textContent = owned ? it.icon : '🔒';
  const nm = document.createElement('span'); nm.className = 'colNm'; nm.textContent = it.name;
  const sub = document.createElement('small'); sub.textContent = owned ? (opts.selected ? 'En uso' : (opts.action ? 'Toca para usar' : 'Conseguido')) : it.hint;
  b.append(ic, nm, sub);
  b.setAttribute('aria-label', it.name + (owned ? '' : ' (bloqueado: ' + it.hint + ')'));
  if(opts.action && owned) b.onclick = opts.action;
  return b;
}

// Botón del perfil → menú flotante (mismo sistema que Ajustes y Novedades: fondo oscuro, X, uno a la vez)
let _wired = false;
export function wireCollectionUi(){
  if(_wired) return;
  const btn = document.getElementById('collectionOpenBtn'), panel = document.getElementById('collectionPanel');
  if(!btn || !panel) return;
  _wired = true;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = panel.hidden;
    if(open){ try{ renderCollection(); }catch(err){} panel.scrollTop = 0; }
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  panel.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden){ panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus({ preventScroll: true }); } });
}

const GROUPS = [
  ['theme', 'Temas'], ['frame', 'Marcos de perfil'], ['seal', 'Sellos de categoría'], ['title', 'Títulos'], ['sticker', 'Ajolotes']
];

export function renderCollection(){
  const box = document.getElementById('collectionBox');
  if(!box) return;
  let stats; try{ stats = collectStats(); }catch(e){ return; }
  const owned = ownedIds();
  const cat = catalog(stats);
  const total = cat.length, got = cat.filter(x => owned.has(x.id)).length;
  box.textContent = '';
  const cnt = document.getElementById('colCount'); if(cnt) cnt.textContent = got + ' de ' + total + ' recompensas';
  const cbar = document.getElementById('colBarFill'); if(cbar) cbar.style.width = (total ? Math.round(got / total * 100) : 0) + '%';
  const head = document.createElement('p'); head.className = 'colHead'; head.textContent = got + ' de ' + total + ' recompensas conseguidas';
  box.appendChild(head);
  GROUPS.forEach(([kind, label]) => {
    const items = cat.filter(x => x.kind === kind);
    if(!items.length) return;
    const sec = document.createElement('section'); sec.className = 'colSec';
    const h = document.createElement('h4'); h.textContent = label + ' · ' + items.filter(x => owned.has(x.id)).length + '/' + items.length; sec.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'colGrid';
    items.forEach(it => {
      const has = owned.has(it.id);
      let opts = {};
      if(kind === 'theme') opts = { selected: has && localStorage.getItem('ci_theme') === it.key, action: () => { import('./settings.js').then(m => { m.chooseTheme(it.key); renderCollection(); }); } };
      if(kind === 'frame') opts = { selected: getFrame() === it.key, action: () => { jset(LS_FRAME, getFrame() === it.key ? '' : it.key); applyFrame(); renderCollection(); } };
      if(kind === 'title') opts = { selected: getTitle() === it.id.slice(6), action: () => { const k = it.id.slice(6); jset(LS_TITLE, getTitle() === k ? '' : k); applyFrame(); renderCollection(); } };
      grid.appendChild(card(it, has, opts));
    });
    sec.appendChild(grid); box.appendChild(sec);
  });
}

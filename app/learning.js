// Vocabri — pestaña «Mi aprendizaje» de Progreso. Solo lee datos que ya existen (no guarda nada nuevo).
import { isJa } from './lang.js';
import { getCategoryEmoji, getCategoryShortLabel } from '../categoriesRegistry.js';
import { unlockedMasterIds, DATA, catLabel, itemsFor, mapItemsFor, readStored, isMastered } from './core/dataRegistry.js';
import { masteredPerDay, dueSummary, summary, topWeak, bestWorst } from './core/learning.js';
import { startWeakTraining } from './weakSpots.js';
import { nodeLayout, stageItems } from './mapData.js';
import { getCategoryColor } from '../categoriesRegistry.js';
import { escapeHtml } from './myCards.js';
import { speak } from './speech.js';

const esc = s => escapeHtml(String(s == null ? '' : s));
let _wired = false;

export function selectProgTab(which){
  const learn = which === 'learn';
  const a = document.getElementById('progTabSummary'), b = document.getElementById('progTabLearn');
  const p1 = document.getElementById('progSummaryPane'), p2 = document.getElementById('learningPane');
  if(!a || !b || !p1 || !p2) return;
  a.setAttribute('aria-selected', String(!learn)); b.setAttribute('aria-selected', String(learn));
  a.tabIndex = learn ? -1 : 0; b.tabIndex = learn ? 0 : -1;
  p1.hidden = learn; p2.hidden = !learn;
  if(learn) renderLearning();
}

export function wireLearningUi(){
  if(_wired) return;
  const a = document.getElementById('progTabSummary'), b = document.getElementById('progTabLearn');
  if(!a || !b) return;
  _wired = true;
  a.addEventListener('click', () => selectProgTab('summary'));
  b.addEventListener('click', () => selectProgTab('learn'));
  [a, b].forEach(t => t.addEventListener('keydown', e => {
    if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ const to = t === a ? b : a; to.focus(); to.click(); e.preventDefault(); }
  }));
  selectProgTab('summary');                      // Progreso siempre empieza en «Resumen»
}

function catRows(){
  const rows = [];
  unlockedMasterIds().forEach(c => {
    if(!DATA[c] || !DATA[c].length) return;
    const items = mapItemsFor(c);
    const done = items.filter(it => isMastered(it[3])).length;
    rows.push({ id: c, name: catLabel(c), short: getCategoryShortLabel(c), emoji: getCategoryEmoji(c), total: items.length, pct: items.length ? Math.round(done / items.length * 100) : 0 });
  });
  return rows;
}

// Mapa de situaciones: cada módulo con nombre del mapa (Saludos, En el Restaurante…) con lo visto y lo dominado.
let _mapCat = null;
export function situationTiles(cat){
  const L = nodeLayout(cat), acc = {};
  L.nodes.forEach((n, i) => {
    if(n.type !== 'normal') return;
    const a = acc[n.etapaIdx] || (acc[n.etapaIdx] = { total: 0, seen: 0, done: 0 });
    stageItems(cat, i).forEach(it => {
      const r = readStored(it[3]); a.total++;
      if((r.lvl || 0) >= 1 || r.m) a.seen++;
      if(r.m) a.done++;
    });
  });
  return L.etapaNames.map((name, idx) => Object.assign({ name: (name === cat ? catLabel(cat) : name), idx }, acc[idx] || { total: 0, seen: 0, done: 0 }))
    .filter(t => t.total > 0);
}

function mapHtml(cats){
  if(!cats.length) return '';
  if(!_mapCat || !cats.some(c => c.id === _mapCat)) _mapCat = cats[0].id;
  const chips = cats.map(c => '<button type="button" class="lnChip" data-mapcat="' + c.id + '" aria-pressed="' + (c.id === _mapCat) + '">' + c.emoji + ' ' + esc(c.short) + '</button>').join('');
  const tiles = situationTiles(_mapCat);
  const grid = tiles.map(t => {
    const seenP = Math.round(t.seen / t.total * 100), doneP = Math.round(t.done / t.total * 100);
    const state = t.seen === 0 ? 'Sin empezar' : (t.done === t.total ? 'Dominada' : (t.seen === t.total ? 'Vista entera' : 'En curso'));
    const cls = t.seen === 0 ? 'lnT0' : (t.done === t.total ? 'lnT3' : (t.seen === t.total ? 'lnT2' : 'lnT1'));
    return '<li class="lnTile ' + cls + '"><span class="lnTileName">' + esc(t.name) + '</span>' +
      '<span class="lnTileBar" aria-hidden="true"><span class="lnTileSeen" style="width:' + seenP + '%"></span><span class="lnTileDone" style="width:' + doneP + '%"></span></span>' +
      '<span class="lnTileSub">' + t.seen + '/' + t.total + ' vistas · ' + t.done + ' dominadas</span><span class="sr-only">' + esc(state) + '</span></li>';
  }).join('');
  return '<div class="lnChips" role="group" aria-label="Categoría del mapa">' + chips + '</div>' +
    '<ul class="lnTiles" style="--cc:' + getCategoryColor(_mapCat) + '">' + grid + '</ul>' +
    '<p class="lnLegend"><i class="lnT0"></i>Sin empezar <i class="lnT1"></i>En curso <i class="lnT2"></i>Vista entera <i class="lnT3"></i>Dominada</p>';
}

export function renderSituations(){
  const box = document.getElementById('situationsBox');
  if(!box) return;
  box.innerHTML = mapHtml(catRows());
  box.querySelectorAll('[data-mapcat]').forEach(b => b.addEventListener('click', () => { _mapCat = b.getAttribute('data-mapcat'); renderSituations(); }));
}

let _escWired = false;
function wireSituationsPanel(){
  if(_escWired) return; _escWired = true;
  const panel = document.getElementById('situationsPanel');
  if(!panel) return;
  panel.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !panel.hidden){ panel.hidden = true; const b = document.getElementById('situationsOpenBtn'); if(b){ b.setAttribute('aria-expanded', 'false'); b.focus({ preventScroll: true }); } }
  });
}

// Botón grande del mapa de situaciones (icono cartoon + cuántas situaciones llevas empezadas).
const MAP_ICON = '<svg viewBox="0 0 28 28" width="46" height="46" focusable="false" aria-hidden="true" class="sitIcon">' +
  '<g transform="translate(0 2)" fill="#0B5C86" stroke="#0B5C86" stroke-width="5" stroke-linejoin="round"><path d="M3 7.5 9.5 5v16L3 23.5zM9.5 5l9 2.6v16l-9-2.6zM18.5 7.6 25 5v16l-6.5 2.6z"/></g>' +
  '<path d="M3 7.5 9.5 5v16L3 23.5z" fill="#7DD3FC"/><path d="M9.5 5l9 2.6v16l-9-2.6z" fill="#38BDF8"/><path d="M18.5 7.6 25 5v16l-6.5 2.6z" fill="#7DD3FC"/>' +
  '<path d="M11.5 14.5c1.6-1.4 3.2.4 5 .1" fill="none" stroke="#0B5C86" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="1.2 3"/>' +
  '<g transform="translate(17 1.5)"><path d="M5 0C2.4 0 .6 1.9.6 4.3c0 3 4.4 7.4 4.4 7.4s4.4-4.4 4.4-7.4C9.4 1.9 7.6 0 5 0z" fill="#F472B6" stroke="#8E1F57" stroke-width="1.6" stroke-linejoin="round"/><circle cx="5" cy="4.2" r="1.6" fill="#fff"/></g></svg>';
function sitCounts(){
  let total = 0, started = 0;
  catRows().forEach(c => { try{ situationTiles(c.id).forEach(t => { total++; if(t.seen > 0) started++; }); }catch(e){} });
  return { total, started };
}
function sitButtonHtml(){
  const c = sitCounts(), pct = c.total ? Math.round(c.started / c.total * 100) : 0;
  return '<button type="button" class="sitBtn hover-scale focus-glow" id="situationsOpenBtn" aria-haspopup="dialog" aria-expanded="false">' +
    '<span class="sitIc">' + MAP_ICON + '</span>' +
    '<span class="sitTx"><b>Mapa de situaciones</b><small>' + c.started + ' de ' + c.total + ' situaciones empezadas</small>' +
    '<span class="sitBar" aria-hidden="true"><span style="width:' + pct + '%"></span></span></span>' +
    '<span class="sitGo" aria-hidden="true">›</span></button>';
}

export function renderLearning(){
  wireSituationsPanel();
  const box = document.getElementById('learningPane');
  if(!box) return;
  const now = Date.now();
  const entries = itemsFor('Todas').map(it => ({ it, rec: readStored(it[3]) }));
  const sum = summary(entries), due = dueSummary(entries, now), weak = topWeak(entries, 5);
  const days = masteredPerDay(entries, now, 14), max = Math.max(1, ...days.map(d => d.n));
  const week = days.slice(-7).reduce((s, d) => s + d.n, 0);
  const bw = bestWorst(catRows());

  const bars = days.map(d => {
    const h = Math.round(d.n / max * 100), dt = new Date(d.day);
    const lbl = dt.toLocaleDateString('es', { weekday: 'short', day: 'numeric' });
    return '<li class="lnBar" title="' + esc(lbl + ': ' + d.n) + '"><span class="lnBarN">' + (d.n || '') + '</span>' +
      '<span class="lnBarCol"><span class="lnBarFill" style="height:' + (d.n ? Math.max(8, h) : 3) + '%"></span></span>' +
      '<span class="lnBarD">' + dt.getDate() + '</span><span class="sr-only">' + esc(lbl + ': ' + d.n + ' dominadas') + '</span></li>';
  }).join('');

  const weakHtml = weak.length
    ? '<ul class="lnWeak">' + weak.map(w =>
        '<li class="lnWeakRow"><button type="button" class="rowSpeak" data-say="' + esc(w.en) + '" aria-label="Escuchar ' + esc(w.en) + '">🔊</button>' +
        '<span class="lnWeakTx"><b>' + esc(w.en) + '</b><small>' + esc(w.es) + '</small></span><span class="lnWeakN">' + w.lapses + ' fallos</span></li>').join('') +
      '</ul><button type="button" class="nav hover-scale focus-glow" id="lnWeakGo" style="width:100%;margin-top:14px;">Practicar mis puntos débiles</button>'
    : '<p class="progSummary" style="margin:0;">Aún no tienes puntos débiles. Aparecen cuando fallas una frase varias veces y todavía no se te asienta.</p>';

  const insight = bw.best
    ? 'Más fuerte: <b>' + bw.best.emoji + ' ' + esc(bw.best.name) + '</b> (' + bw.best.pct + '%)' +
      (bw.worst ? ' · Te falta: <b>' + bw.worst.emoji + ' ' + esc(bw.worst.name) + '</b> (' + bw.worst.pct + '%)' : '') : '';

  box.innerHTML =
    '<div class="statsRow lnStats">' +
      '<div class="statBox"><div class="statNum">' + sum.seen + '</div><div class="statLbl">Frases vistas</div></div>' +
      '<div class="statBox"><div class="statNum">' + due.due + '</div><div class="statLbl">Repasar hoy</div></div>' +
      '<div class="statBox"><div class="statNum">' + due.soon + '</div><div class="statLbl">Próx. 7 días</div></div>' +
    '</div>' +
    (insight ? '<p class="progSummary lnInsight">' + insight + '</p>' : '') +
    '<div class="setTitle">DOMINADAS POR DÍA</div>' +
    '<div class="lnPanel"><p class="lnCap">Últimos 14 días · <b>' + week + '</b> esta semana</p><ol class="lnBars">' + bars + '</ol></div>' +
    '<div class="setTitle">MAPA DE SITUACIONES</div>' +
    sitButtonHtml() +
    '<div class="setTitle">LO QUE MÁS TE CUESTA</div>' + weakHtml;
  box.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.getAttribute('data-say'), isJa() ? 'ja-JP' : 'en-US')));
  const sbtn = box.querySelector('#situationsOpenBtn'), spanel = document.getElementById('situationsPanel');
  if(sbtn && spanel){
    sbtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = spanel.hidden;
      if(open){ renderSituations(); spanel.scrollTop = 0; }
      spanel.hidden = !open; sbtn.setAttribute('aria-expanded', String(open));
    });
  }
  const go = box.querySelector('#lnWeakGo'); if(go) go.addEventListener('click', () => startWeakTraining());
}

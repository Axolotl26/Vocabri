// Vocabri — módulo "progress" (generado a partir de app.js)
import { getCategoryColor, getCategoryEmoji } from '../categoriesRegistry.js';
import { S } from './core/shared.js';
import { DATA, MASTER_IDS, allMasteredTimestamps, catLabel, computeStreak, isMastered, itemsFor, mapItemsFor, readStored } from './core/dataRegistry.js';
import { isStageComplete, nodeLayout } from './mapData.js';
import { escapeHtml } from './myCards.js';
import { speak } from './speech.js';
import { studyMinutesToday } from './ui.js';



export function renderTable(){
  const q = document.getElementById('search').value.trim().toLowerCase();
  const items = itemsFor(S.currentCat).filter(it=>
    !q || it[0].toLowerCase().includes(q) || it[1].toLowerCase().includes(q)
  );
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  items.forEach(it=>{
    const tr = document.createElement('tr');
    const tdCat = document.createElement('td'); tdCat.textContent = it[2];
    const tdEn = document.createElement('td');
    const enWrap = document.createElement('span'); enWrap.className = 'tRow';
    const btn = document.createElement('button'); btn.className = 'rowSpeak'; btn.textContent = '🔊';
    btn.onclick = ()=> speak(it[0], 'en-US');
    const enText = document.createElement('span'); enText.textContent = it[0];
    enWrap.appendChild(btn); enWrap.appendChild(enText); tdEn.appendChild(enWrap);
    const tdEs = document.createElement('td'); tdEs.textContent = it[1];
    tr.appendChild(tdCat); tr.appendChild(tdEn); tr.appendChild(tdEs);
    tbody.appendChild(tr);
  });
  document.getElementById('tableCount').textContent = items.length + ' palabras/frases';
}



export function dayLabel(d){
  return d.toLocaleDateString('es', {day:'2-digit', month:'2-digit'});
}


export function dayKey(d){
  return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
}



// Barras de dominio por categoría (solo las que tienen contenido cargado) + "Mis tarjetas" si hay
export function renderCategoryProgress(allItems){
  const box = document.getElementById('catProgress');
  if(!box) return;
  const rows = [];
  MASTER_IDS.forEach(c=>{
    if(!DATA[c] || !DATA[c].length) return;
    const items = mapItemsFor(c);
    const done = items.filter(it=> isMastered(it[3])).length;
    const seen = items.filter(it=> readStored(it[3]).reps > 0 || readStored(it[3]).lvl > 0).length;
    let secDone = 0, secTotal = 0;
    try{
      const nodes = nodeLayout(c).nodes;
      nodes.forEach((n, i)=>{ if(n.type === 'normal'){ secTotal++; if(isStageComplete(c, i)) secDone++; } });
    }catch(e){}
    rows.push({id:c, label:catLabel(c), done, seen, total:items.length, secDone, secTotal});
  });
  if(S.customWords.length){
    const done = S.customWords.filter(w=> isMastered('custom|' + w.id)).length;
    rows.push({id:'custom', label:'Mis tarjetas', done, seen:done, total:S.customWords.length, secDone:0, secTotal:0});
  }
  box.innerHTML = rows.map(r=>{
    const pct = r.total ? Math.round(r.done / r.total * 100) : 0;
    const seenPct = r.total ? Math.round(Math.max(r.seen, r.done) / r.total * 100) : 0;
    const sec = r.secTotal ? ' · ' + r.secDone + '/' + r.secTotal + ' secciones' : '';
    return '<div class="catProgRow' + (r.id === S.currentCat ? ' cur' : '') + '" style="--cc:' + getCategoryColor(r.id) + '">' +
      '<div class="catProgTop"><span class="catProgName">' + getCategoryEmoji(r.id) + ' ' + escapeHtml(r.label) + '</span><span class="catProgPct">' + pct + '%</span></div>' +
      '<div class="catProgBar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="' + escapeHtml(r.label) + '">' +
        '<div class="catProgSeen" style="width:' + seenPct + '%"></div><div class="catProgFill" style="width:' + pct + '%"></div></div>' +
      '<div class="catProgSub">' + r.done + '/' + r.total + ' dominadas' + sec + '</div></div>';
  }).join('');
}


export function renderProgress(){
  const allItems = itemsFor("Todas");
  const total = allItems.length;
  const ts = allMasteredTimestamps();
  const masteredTotal = allItems.filter(it=> isMastered(it[3])).length;
  document.getElementById('progSummary').innerHTML =
    '<b>' + masteredTotal + '</b> de ' + total + ' tarjetas dominadas en total.';
  document.getElementById('statStreak').textContent = computeStreak();
  document.getElementById('statPct').textContent = (total ? Math.round(masteredTotal/total*100) : 0) + '%';
  document.getElementById('statTime').textContent = studyMinutesToday() + ' min';

  renderCategoryProgress(allItems);

  const wrap = document.getElementById('chartWrap');
  const empty = document.getElementById('progEmpty');
  if(ts.length === 0){
    wrap.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  const first = new Date(ts[0]);
  const today = new Date();
  const days = [];
  let cursor = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while(cursor <= last){ days.push(new Date(cursor)); cursor.setDate(cursor.getDate()+1); }
  const maxDays = 21;
  const shown = days.length > maxDays ? days.slice(days.length - maxDays) : days;

  const perDay = {};
  ts.forEach(t=>{ const k = dayKey(new Date(t)); perDay[k] = (perDay[k]||0) + 1; });
  let cum = [];
  let runningTotal = 0;
  days.forEach(d=>{
    runningTotal += (perDay[dayKey(d)] || 0);
    cum.push(runningTotal);
  });
  const cumShown = cum.slice(cum.length - shown.length);

  const W = 640, H = 220, padL = 30, padB = 26, padT = 14, padR = 10;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxV = Math.max(1, cumShown[cumShown.length-1]);
  const n = shown.length;
  const stepX = n > 1 ? innerW / (n-1) : innerW;

  let points = cumShown.map((v,i)=> {
    const x = padL + i*stepX;
    const y = padT + innerH - (v/maxV)*innerH;
    return [x,y];
  });
  const linePath = points.map((p,i)=> (i===0?'M':'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const areaPath = linePath + ' L' + points[points.length-1][0].toFixed(1) + ',' + (padT+innerH) +
                    ' L' + points[0][0].toFixed(1) + ',' + (padT+innerH) + ' Z';

  const gold = 'var(--secondary)';
  const line = 'var(--line)';

  let labels = '';
  const labelEvery = Math.max(1, Math.ceil(n/6));
  shown.forEach((d,i)=>{
    if(i % labelEvery === 0 || i === n-1){
      const x = padL + i*stepX;
      labels += '<text x="'+x.toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+dayLabel(d)+'</text>';
    }
  });

  const svg =
    '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">' +
      '<line x1="'+padL+'" y1="'+(padT+innerH)+'" x2="'+(W-padR)+'" y2="'+(padT+innerH)+'" stroke="'+line+'" stroke-width="1"/>' +
      '<path d="'+areaPath+'" fill="'+gold+'" fill-opacity="0.12" stroke="none"/>' +
      '<path d="'+linePath+'" fill="none" stroke="'+gold+'" stroke-width="2.5"/>' +
      points.map(p=> '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3" fill="'+gold+'"/>').join('') +
      labels +
      '<text x="'+padL+'" y="'+(padT+8)+'" text-anchor="start">'+maxV+' acumuladas</text>' +
    '</svg>';
  wrap.innerHTML = svg;
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [

];

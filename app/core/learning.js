// Vocabri — "Mi aprendizaje" (puro, sin DOM ni localStorage). Todo sale de datos que ya existen:
// entries = [{it, rec}] con rec = {m, t, mt, lvl, next, iv, lapses, rl, reps}.
import { rankWeak } from './weakSpots.js';

const DAY = 86400000;
const startOfDay = ts => { const d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };

// Tarjetas dominadas por día durante los últimos `days` días (el último elemento es hoy).
export function masteredPerDay(entries, now, days = 14){
  const today = startOfDay(now);
  const out = [];
  for(let i = days - 1; i >= 0; i--){
    const d = new Date(today); d.setDate(d.getDate() - i);
    out.push({ day: d.getTime(), n: 0 });
  }
  const idx = new Map(out.map((o, i) => [o.day, i]));
  entries.forEach(e => {
    if(e.rec && e.rec.m && e.rec.mt){
      const k = startOfDay(e.rec.mt);
      if(idx.has(k)) out[idx.get(k)].n++;
    }
  });
  return out;
}

// Repasos pendientes: hoy (incluye atrasados y reaprendizaje) y en los próximos 7 días.
export function dueSummary(entries, now){
  const today = startOfDay(now), tomorrow = today + DAY, week = today + 8 * DAY;
  let due = 0, soon = 0;
  entries.forEach(e => {
    const r = e.rec; if(!r || !(r.reps > 0)) return;
    if(r.rl || !r.next || r.next < tomorrow) due++;
    else if(r.next < week) soon++;
  });
  return { due, soon };
}

export function summary(entries){
  let seen = 0, mastered = 0;
  entries.forEach(e => {
    const r = e.rec; if(!r) return;
    if(r.reps > 0 || r.lvl > 0 || r.m) seen++;
    if(r.m) mastered++;
  });
  return { total: entries.length, seen, mastered };
}

export function topWeak(entries, n = 5){
  return rankWeak(entries).slice(0, n).map(e => ({ key: e.it[3], en: e.it[0], es: e.it[1], lapses: e.rec.lapses }));
}

// Mejor y peor categoría por % dominado (solo con contenido). cats: [{id,name,emoji,pct,total}]
export function bestWorst(cats){
  const c = cats.filter(x => x.total > 0).slice().sort((a, b) => b.pct - a.pct);
  if(c.length < 2 || c[0].pct === c[c.length - 1].pct) return { best: c[0] || null, worst: null };
  return { best: c[0], worst: c[c.length - 1] };
}

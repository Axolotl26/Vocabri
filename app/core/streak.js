// Vocabri — racha con Protector. Puro: recibe los días activos y devuelve resultados.
// Un día «cubierto» por un protector cuenta como día de estudio.

export const MAX_FREEZES = 2;

// Mismo formato que dayKey() de progress.js (mes base 0, sin ceros), para que las claves coincidan.
export const keyOf = d => d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
const addDays = (d, n) => { const c = new Date(d.getFullYear(), d.getMonth(), d.getDate()); c.setDate(c.getDate() + n); return c; };

// Racha = días consecutivos hasta hoy (o ayer, si hoy aún no estudiaste) contando los cubiertos.
export function streakOf(active, covered, today){
  const on = k => active.has(k) || covered.has(k);
  let cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if(!on(keyOf(cur))){ cur = addDays(cur, -1); if(!on(keyOf(cur))) return 0; }
  let n = 0;
  while(on(keyOf(cur))){ n++; cur = addDays(cur, -1); }
  return n;
}

// ¿Hay que gastar un protector? Solo si ayer faltó, antes de ayer sí contaba y hoy aún no hay estudio.
// Devuelve la clave del día a cubrir o null. Nunca cubre más de un día seguido.
export function dayToCover(active, covered, today, freezes){
  if(freezes <= 0) return null;
  const on = k => active.has(k) || covered.has(k);
  const t = keyOf(today), y = keyOf(addDays(today, -1)), yy = keyOf(addDays(today, -2));
  if(on(t) || on(y)) return null;
  return on(yy) ? y : null;
}

// Protectores ganados: 1 al llegar al nivel 3 y 1 por cada 7 días de racha (un hito se cobra una sola vez).
export function earnedNow(level, streak, claimed){
  const out = [];
  if(level >= 3 && !claimed.has('lvl3')) out.push('lvl3');
  const m = Math.floor(streak / 7);
  for(let i = 1; i <= m; i++){ const id = 'streak' + (i * 7); if(!claimed.has(id)) out.push(id); }
  return out;
}

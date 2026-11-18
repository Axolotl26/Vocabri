// Vocabri — cofre semanal (puro). Se llena con los días de la semana (lunes a domingo) en que cumples tu meta diaria.
// Con GOAL_DAYS días el cofre se puede abrir una sola vez por semana y da BONUS_XP.
export const GOAL_DAYS = 4;
export const BONUS_XP = 150;
export const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const DAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const pad = n => String(n).padStart(2, '0');
export const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export function weekStartDate(now){
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));     // lunes
  return d;
}
export const weekStartISO = now => iso(weekStartDate(now));

export function emptyWeekly(start){ return { week: start || '', days: [], claimed: false }; }
/** Devuelve el estado de la semana actual: si lo guardado es de otra semana, empieza uno nuevo. */
export function normalizeWeekly(raw, now){
  const start = weekStartISO(now);
  if(!raw || typeof raw !== 'object' || raw.week !== start) return emptyWeekly(start);
  const days = Array.isArray(raw.days) ? raw.days.filter(x => typeof x === 'string') : [];
  return { week: start, days: Array.from(new Set(days)), claimed: !!raw.claimed };
}
export function recordDay(w, now){
  const s = normalizeWeekly(w, now), key = iso(now);
  return s.days.includes(key) ? s : { ...s, days: s.days.concat(key) };
}
/** Siete casillas de la semana: { label, name, done, today, future } */
export function weekDays(w, now){
  const s = normalizeWeekly(w, now), start = weekStartDate(now), today = iso(now);
  return DAY_LABELS.map((label, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = iso(d);
    return { label, name: DAY_NAMES[i], iso: k, done: s.days.includes(k), today: k === today, future: k > today };
  });
}
export function chestState(w, now){
  const s = normalizeWeekly(w, now), n = Math.min(s.days.length, 7);
  return { days: n, goal: GOAL_DAYS, left: Math.max(0, GOAL_DAYS - n), ready: n >= GOAL_DAYS && !s.claimed, claimed: s.claimed, week: s.week };
}
export function claimChest(w, now){
  const s = normalizeWeekly(w, now), st = chestState(s, now);
  return st.ready ? { state: { ...s, claimed: true }, xp: BONUS_XP } : { state: s, xp: 0 };
}

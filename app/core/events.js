// Vocabri — evento de la semana con insignia. Puro (sin DOM ni localStorage).
// Cada semana (lunes a domingo) toca una categoría distinta; si estudias GOAL frases distintas de ella ganas su insignia
// (permanente) y un bono de XP una sola vez. El tema sale solo de la fecha: no hace falta servidor.
import { weekStartISO } from './weekly.js';

export const GOAL = 15;
export const BONUS_XP = 100;
export const MIN_DAYS = 3;        // hay que estudiar al menos en 3 días distintos de la semana
export const THEMES = [
  { id: 'travel',   name: 'Viajes',        icon: '✈️', badge: 'Insignia Viajero' },
  { id: 'academic', name: 'Académico',     icon: '🎓', badge: 'Insignia Estudiante' },
  { id: 'business', name: 'Negocios',      icon: '💼', badge: 'Insignia Ejecutivo' },
  { id: 'pop',      name: 'Cultura pop',   icon: '🎮', badge: 'Insignia Jugador' },
  { id: 'health',   name: 'Salud',         icon: '🩺', badge: 'Insignia Sanador' },
  { id: 'general',  name: 'General',       icon: '🌍', badge: 'Insignia Explorador' }
];
export const themeById = id => THEMES.find(t => t.id === id) || null;

const WEEK_MS = 7 * 86400000;
function isoToUtc(iso){ const p = String(iso).split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }

// Tema de la semana que empieza el lunes `weekISO` (rota por orden: nunca se repite dos semanas seguidas).
export function themeForWeek(weekISO){
  const idx = Math.floor(isoToUtc(weekISO) / WEEK_MS);
  return THEMES[((idx % THEMES.length) + THEMES.length) % THEMES.length];
}

export function emptyEvents(){ return { week: '', theme: '', keys: [], days: [], done: false, badges: {}, history: [] }; }

// Lectura tolerante + cambio de semana (las insignias y el historial se conservan; el progreso empieza de cero).
export function normalizeEvents(raw, now){
  const st = emptyEvents();
  if(raw && typeof raw === 'object'){
    if(raw.badges && typeof raw.badges === 'object') Object.keys(raw.badges).forEach(k => { if(themeById(k)) st.badges[k] = Math.max(0, Math.min(999, parseInt(raw.badges[k], 10) || 0)); });
    if(Array.isArray(raw.history)) st.history = raw.history.filter(h => h && themeById(h.theme)).slice(-30).map(h => ({ week: String(h.week || ''), theme: h.theme, at: Number(h.at) || 0 }));
    st.week = typeof raw.week === 'string' ? raw.week : '';
    st.keys = Array.isArray(raw.keys) ? raw.keys.filter(k => typeof k === 'string').slice(0, GOAL) : [];
    st.days = Array.isArray(raw.days) ? raw.days.filter(x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)).slice(0, 7) : [];
    st.done = !!raw.done;
  }
  const wk = weekStartISO(now), th = themeForWeek(wk).id;
  if(st.week !== wk || st.theme !== th && st.week !== wk){
    st.week = wk; st.theme = th; st.keys = []; st.days = []; st.done = false;
  } else st.theme = th;
  return st;
}

function dayISO(now){ const d = now instanceof Date ? now : new Date(now); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

// key = «categoría|id». opts.good = el repaso se aplicó de verdad y no fue «Otra vez» (si no, no cuenta).
// Cuenta solo frases propias de la categoría del evento, una vez cada una, y exige estudiar en MIN_DAYS días distintos.
export function recordStudy(state, key, now, opts){
  const st = normalizeEvents(state, now);
  const none = { state: st, completedNow: false, counted: false };
  if(st.done || typeof key !== 'string' || key.indexOf('custom|') === 0) return none;
  if(!(opts && opts.good)) return none;
  if(key.split('|')[0] !== st.theme) return none;
  const today = dayISO(now);
  const days = st.days.indexOf(today) >= 0 ? st.days : st.days.concat([today]);
  const isNew = st.keys.indexOf(key) < 0 && st.keys.length < GOAL;
  const keys = isNew ? st.keys.concat([key]) : st.keys;
  if(!isNew && days === st.days) return none;                       // nada cambió
  const next = Object.assign({}, st, { keys, days });
  if(keys.length < GOAL || days.length < MIN_DAYS) return { state: next, completedNow: false, counted: true };
  const badges = Object.assign({}, st.badges, { [st.theme]: (st.badges[st.theme] || 0) + 1 });
  const history = st.history.concat([{ week: st.week, theme: st.theme, at: now instanceof Date ? now.getTime() : Number(now) || 0 }]).slice(-30);
  return { state: Object.assign(next, { done: true, badges, history }), completedNow: true, counted: true };
}

// Días que quedan de la semana (1 = hoy es el último día, domingo).
export function daysLeftInWeek(now){
  const d = now instanceof Date ? now : new Date(now);
  const mondayIdx = (d.getDay() + 6) % 7;
  return 7 - mondayIdx;
}
export function eventStatus(state, now){
  const st = normalizeEvents(state, now), th = themeById(st.theme);
  return { theme: th, week: st.week, count: st.done ? GOAL : st.keys.length, goal: GOAL, done: st.done, left: Math.max(0, GOAL - st.keys.length),
    pct: Math.round((st.done ? GOAL : st.keys.length) / GOAL * 100), daysLeft: daysLeftInWeek(now), badges: st.badges, days: st.done ? MIN_DAYS : Math.min(st.days.length, MIN_DAYS), minDays: MIN_DAYS,
    waitDays: !st.done && st.keys.length >= GOAL && st.days.length < MIN_DAYS };
}

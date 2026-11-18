import { registerRows } from './why.js';
// Vocabri — misiones especiales del mapa. Puro (sin DOM ni localStorage).
// Una sola misión activa a la vez; espera en el mapa hasta que se completa; recompensa fija de una sola vez.
// state = { active: {id, mode, cat, start} | null, done: [{id, mode, cat, at, score}], missed: [{id, mode, cat, at}], count: n }

export const MODES = {
  order:    { name: 'Ordena la frase',     icon: '🧩', xp: 150, blurb: 'Reconstruye 8 frases colocando las palabras en orden.' },
  register: { name: 'Detective de registro', icon: '🕵️', xp: 180, blurb: 'Descubre si cada frase es formal, neutral o informal.' },
  time:     { name: 'Contrarreloj',        icon: '⏱️', xp: 200, blurb: 'Acierta 10 traducciones en 60 segundos. Cada fallo te quita 3 s.' },
  survival: { name: 'Supervivencia',       icon: '🛡️', xp: 200, blurb: 'Acierta 12 sin perder tus 3 vidas. Mezcla traducciones y registro.' }
};
export const IMPLEMENTED = ['order', 'register', 'time', 'survival'];                 // se amplía al llegar cada modo
export const MIN_SEEN = 15;                           // frases vistas antes de la primera misión
export const DURATION_MS = 5 * 86400000;             // la misión desaparece a los 5 días
export const GAP_MS = 5 * 86400000;                   // la siguiente misión tarda 5 días tras cumplir la anterior
export const GAP_MISSED_MS = 5 * 86400000;            // …y 5 días tras perder una (contados desde que venció)
export const ORDER_ROUNDS = 8, ORDER_PASS = 6;
export const REG_ROUNDS = 8, REG_PASS = 6;
export const SURV_LIVES = 3, SURV_GOAL = 12;
export const TIME_SECONDS = 60, TIME_GOAL = 10, TIME_PENALTY = 3, TIME_QUESTIONS = 40;

export function emptyMissions(){ return { active: null, done: [], missed: [], count: 0 }; }

export function normalizeMissions(raw){
  const m = emptyMissions();
  if(!raw || typeof raw !== 'object') return m;
  if(raw.active && typeof raw.active === 'object' && MODES[raw.active.mode]) m.active = { id: String(raw.active.id), mode: raw.active.mode, cat: String(raw.active.cat || 'general'), start: Number(raw.active.start) || 0 };
  if(Array.isArray(raw.done)) m.done = raw.done.filter(d => d && MODES[d.mode]).map(d => ({ id: String(d.id), mode: d.mode, cat: String(d.cat || ''), at: Number(d.at) || 0, score: Number(d.score) || 0 })).slice(-200);
  if(Array.isArray(raw.missed)) m.missed = raw.missed.filter(d => d && MODES[d.mode]).map(d => ({ id: String(d.id), mode: d.mode, cat: String(d.cat || ''), at: Number(d.at) || 0 })).slice(-200);
  m.count = Math.max(m.done.length, Number(raw.count) || 0);
  return m;
}

export function nextMode(state){
  const pool = IMPLEMENTED.filter(k => MODES[k]);
  return pool[(state.count + state.missed.length) % pool.length];
}

export function lastDoneAt(state){ return state.done.length ? state.done[state.done.length - 1].at : 0; }
export function lastMissedAt(state){ return state.missed.length ? state.missed[state.missed.length - 1].at : 0; }

export function shouldStart(state, now, seen){
  if(state.active || seen < MIN_SEEN) return false;
  return (now - lastDoneAt(state) >= GAP_MS) && (now - lastMissedAt(state) >= GAP_MISSED_MS);
}

export const expiresAt = m => m.start + DURATION_MS;
// Días que quedan (redondeando hacia arriba; 1 = último día).
export function daysLeft(m, now){ return Math.max(0, Math.ceil((expiresAt(m) - now) / 86400000)); }
// Si la misión activa ya venció, pasa a «perdidas» (el momento en que se perdió es su vencimiento).
export function expireIfNeeded(state, now){
  const a = state.active;
  if(!a || now < expiresAt(a)) return state;
  return Object.assign({}, state, { active: null, missed: state.missed.concat([{ id: a.id, mode: a.mode, cat: a.cat, at: expiresAt(a) }]).slice(-200) });
}

export function startMission(state, now, cat){
  const mode = nextMode(state);
  return Object.assign({}, state, { active: { id: 'm' + (state.count + state.missed.length + 1), mode, cat: cat || 'general', start: now } });
}

export function completeMission(state, now, score){
  if(!state.active) return state;
  const a = state.active;
  return Object.assign({}, state, { active: null, count: state.count + 1, done: state.done.concat([{ id: a.id, mode: a.mode, cat: a.cat, at: now, score: score || 0 }]) });
}

export const isDone = (state, id) => state.done.some(d => d.id === id);

// ── Ordena la frase ──
export function tokenize(en){ return String(en || '').trim().split(/\s+/).filter(Boolean); }
const norm = t => t.toLowerCase().replace(/[.,!?;:¿¡"]/g, '');
export function checkOrder(correct, answer){
  return correct.length === answer.length && correct.every((t, i) => norm(t) === norm(answer[i]));
}
export function shuffle(arr, rand){
  const a = arr.slice(); const r = rand || Math.random;
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// items: [[en, es, cat, key, …]]. Prefiere frases ya vistas (seenKeys) y de 4–9 palabras.
export function buildOrderRound(items, seenKeys, n, rand){
  n = n || ORDER_ROUNDS;
  const ok = items.filter(it => { const t = tokenize(it[0]).length; return t >= 4 && t <= 9; });
  const seen = new Set(seenKeys || []);
  const pri = shuffle(ok.filter(it => seen.has(it[3])), rand), rest = shuffle(ok.filter(it => !seen.has(it[3])), rand);
  return pri.concat(rest).slice(0, n).map(it => {
    const tokens = tokenize(it[0]);
    let tiles = shuffle(tokens.map((t, i) => ({ t, i })), rand);
    if(tiles.length > 1 && tiles.every((x, i) => x.i === i)) tiles = tiles.slice(1).concat(tiles[0]);   // nunca llega ya ordenada
    return { key: it[3], en: it[0], es: it[1], tokens, tiles };
  });
}

// Quitar la misión a propósito: cuenta como perdida desde ahora (y vuelve a aplicar el descanso de 5 días).
export function abandonMission(state, now){
  const a = state.active; if(!a) return state;
  return Object.assign({}, state, { active: null, missed: state.missed.concat([{ id: a.id, mode: a.mode, cat: a.cat, at: now }]).slice(-200) });
}

// ── Detective de registro ──
// Respuesta correcta: el registro cuyo texto coincide con la frase (formal / normal / informal).
export function registerAnswer(reg, en){
  const m = registerRows(reg, en).find(r => r.mine);
  return m ? m.key : null;
}
export function buildRegisterRound(items, seenKeys, n, rand){
  n = n || REG_ROUNDS;
  const ok = items.filter(it => it[7] && typeof it[7] === 'object' && registerAnswer(it[7], it[0]));
  const seen = new Set(seenKeys || []);
  const pri = shuffle(ok.filter(it => seen.has(it[3])), rand), rest = shuffle(ok.filter(it => !seen.has(it[3])), rand);
  // variedad: reparte por registro para que no salgan 8 «normal» seguidas
  const pool = pri.concat(rest), by = { formal: [], normal: [], informal: [] };
  pool.forEach(it => by[registerAnswer(it[7], it[0])].push(it));
  const picked = [];
  while(picked.length < n && (by.formal.length || by.normal.length || by.informal.length)){
    ['formal', 'normal', 'informal'].forEach(k => { if(picked.length < n && by[k].length) picked.push(by[k].shift()); });
  }
  return shuffle(picked, rand).map(it => ({ key: it[3], en: it[0], es: it[1], rows: registerRows(it[7], it[0]), answer: registerAnswer(it[7], it[0]) }));
}

// ── Contrarreloj ──
// Cada pregunta: frase en español + 3 opciones en inglés (1 correcta, 2 de la misma categoría).
export function buildTimeRound(items, seenKeys, n, rand){
  n = n || TIME_QUESTIONS;
  const ok = items.filter(it => it[0] && it[1] && it[0].length <= 60);
  if(ok.length < 3) return [];
  const seen = new Set(seenKeys || []);
  const order = shuffle(ok.filter(it => seen.has(it[3])), rand).concat(shuffle(ok.filter(it => !seen.has(it[3])), rand));
  return order.slice(0, n).map(it => {
    const wrong = shuffle(ok.filter(o => o[3] !== it[3] && o[0].toLowerCase() !== it[0].toLowerCase()), rand).slice(0, 2).map(o => o[0]);
    const options = shuffle([it[0]].concat(wrong), rand);
    return { key: it[3], es: it[1], en: it[0], options, answer: options.indexOf(it[0]) };
  });
}

// ── Supervivencia ──
// Mezcla preguntas de traducción y de registro (alternadas). Devuelve [{type:'tr'|'reg', ...}].
export function buildSurvivalRound(items, seenKeys, n, rand){
  n = n || SURV_GOAL + SURV_LIVES + 6;
  const tr = buildTimeRound(items, seenKeys, n, rand).map(q => Object.assign({ type: 'tr' }, q));
  const reg = buildRegisterRound(items, seenKeys, Math.ceil(n / 2), rand).map(q => Object.assign({ type: 'reg' }, q));
  const out = [], usedKeys = new Set();
  let a = 0, b = 0;
  while(out.length < n && (a < tr.length || b < reg.length)){
    const wantReg = out.length % 2 === 1;
    let q = null;
    if(wantReg && b < reg.length) q = reg[b++];
    else if(a < tr.length) q = tr[a++];
    else if(b < reg.length) q = reg[b++];
    if(q && !usedKeys.has(q.key)){ usedKeys.add(q.key); out.push(q); }
  }
  return out;
}

// ── Récords del Salón de misiones ──
// bestRun: más misiones cumplidas seguidas sin perder ninguna (cuenta cumplidas y perdidas en orden cronológico).
export function missionStats(state){
  const ev = state.done.map(d => ({ ok: true, at: d.at })).concat(state.missed.map(d => ({ ok: false, at: d.at }))).sort((a, b) => a.at - b.at);
  let run = 0, bestRun = 0;
  ev.forEach(e => { if(e.ok){ run++; if(run > bestRun) bestRun = run; } else run = 0; });
  const modes = new Set(state.done.map(d => d.mode)).size;
  const perfects = state.done.filter(d => (d.mode === 'order' || d.mode === 'register') && d.score >= ORDER_ROUNDS).length;
  return { done: state.done.length, missed: state.missed.length, modes, bestRun, perfects };
}

// Vocabri — retos con un amigo («duelo de puntaje»). Puro: sin DOM, sin localStorage, sin red.
// Un reto son 10 frases fijas. Quien lo crea lo juega primero y manda un enlace con su resultado;
// el amigo juega las MISMAS frases con las MISMAS opciones y compara. Todo viaja dentro del enlace.

export const CHALLENGE_N = 10;
export const CHALLENGE_XP_PER_OK = 4;            // hasta 40 XP por reto (tope diario propio en el libro de XP)
export const MAX_NAME = 16;
const KEY_RE = /^[A-Za-z0-9_|\-\.]{1,48}$/;

// ── Puntaje ──
// 100 por acierto + hasta 50 de bonus por rapidez (los primeros 5 s de cada pregunta).
export function scoreAnswer(good, ms){
  if(!good) return 0;
  const sec = Math.max(0, (Number(ms) || 0) / 1000);
  return 100 + Math.max(0, Math.round(50 - sec * 10));
}
export function summarize(results){
  const ok = results.filter(r => r.good).length;
  const score = results.reduce((a, r) => a + scoreAnswer(r.good, r.ms), 0);
  const ms = results.reduce((a, r) => a + (Number(r.ms) || 0), 0);
  return { ok, score, ms: Math.round(ms) };
}
// Gana más puntaje; si empatan, el que tardó menos. Devuelve 'win' | 'lose' | 'tie' (desde el punto de vista de `mine`).
export function compare(mine, theirs){
  if(mine.score !== theirs.score) return mine.score > theirs.score ? 'win' : 'lose';
  if(mine.ms !== theirs.ms) return mine.ms < theirs.ms ? 'win' : 'lose';
  return 'tie';
}

// ── Aleatoriedad con semilla: las dos personas ven las mismas opciones en el mismo orden ──
export function hashStr(s){
  let h = 2166136261 >>> 0;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function rngFrom(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffled(arr, rng){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Elige `n` claves distintas del conjunto `keys` (con `rng`).
export function pickKeys(keys, n, rng){
  const uniq = Array.from(new Set(keys));
  return shuffled(uniq, rng).slice(0, n);
}

// items: [[en, es, cat, key, …]]. Devuelve las preguntas: { key, es, en, options:[en…], answer:índice }.
// Las opciones salen de la propia semilla del reto, así que son idénticas para los dos jugadores.
export function buildQuestions(keys, items, id){
  const byKey = new Map(items.map(it => [it[3], it]));
  const out = [];
  keys.forEach((k, qi) => {
    const it = byKey.get(k);
    if(!it) return;
    const rng = rngFrom(hashStr(id + '#' + qi + '#' + k));
    const pool = items.filter(o => o[3] !== k && o[0] !== it[0]);
    const same = pool.filter(o => o[2] === it[2]);
    const from = same.length >= 3 ? same : pool;
    const wrong = shuffled(from, rng).slice(0, 3).map(o => o[0]);
    if(wrong.length < 3) return;
    const options = shuffled([it[0]].concat(wrong), rng);
    out.push({ key: k, es: it[1], en: it[0], options, answer: options.indexOf(it[0]) });
  });
  return out;
}

// ── Enlace / código ──
export function cleanName(s){
  return String(s == null ? '' : s).replace(/[\u0000-\u001f<>"'`&]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}
function toB64Url(str){
  const bytes = new TextEncoder().encode(str); let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s){
  const b = String(s).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '==='.slice((b.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
// Lo que viaja: { v:1, k:[claves], n:nombre, s:puntaje, o:aciertos, t:ms, c:suma de control }
function check(o){ return hashStr([o.k.join(','), o.n, o.s, o.o, o.t].join('~')).toString(36); }

export function encodeChallenge(ch){
  const o = { v: 1, k: ch.keys.slice(), n: cleanName(ch.name), s: ch.score | 0, o: ch.ok | 0, t: ch.ms | 0 };
  o.c = check(o);
  return toB64Url(JSON.stringify(o));
}
// Devuelve { id, keys, name, score, ok, ms } o null si no es un reto válido.
export function decodeChallenge(code){
  try{
    let c = String(code || '').trim();
    const m = c.match(/[#&?]reto=([A-Za-z0-9_\-]+)/); if(m) c = m[1];
    if(!/^[A-Za-z0-9_\-]{20,2000}$/.test(c)) return null;
    const o = JSON.parse(fromB64Url(c));
    if(!o || o.v !== 1 || !Array.isArray(o.k)) return null;
    if(o.k.length < 4 || o.k.length > CHALLENGE_N || !o.k.every(k => typeof k === 'string' && KEY_RE.test(k))) return null;
    if(new Set(o.k).size !== o.k.length) return null;
    if(!Number.isFinite(o.s) || o.s < 0 || o.s > 3000 || !Number.isFinite(o.o) || o.o < 0 || o.o > o.k.length) return null;
    if(!Number.isFinite(o.t) || o.t < 0 || o.t > 3600000) return null;
    if(typeof o.n !== 'string' || o.c !== check(o)) return null;
    return { id: hashStr(c).toString(36), keys: o.k.slice(), name: cleanName(o.n), score: o.s | 0, ok: o.o | 0, ms: o.t | 0 };
  }catch(e){ return null; }
}
export function challengeUrl(base, ch){ return String(base).replace(/#.*$/, '') + '#reto=' + encodeChallenge(ch); }

// ── Historial (los últimos retos jugados) ──
// store: { played:[{id, name, mine, theirs, res, at}], wins, total }
export function emptyStore(){ return { played: [], wins: 0, total: 0 }; }
export function normalizeStore(raw){
  const s = emptyStore();
  if(!raw || typeof raw !== 'object') return s;
  if(Array.isArray(raw.played)) s.played = raw.played.filter(p => p && typeof p.id === 'string').slice(-30).map(p => ({
    id: p.id, name: cleanName(p.name), mine: Number(p.mine) || 0, theirs: Number(p.theirs) || 0,
    res: ['win', 'lose', 'tie', 'solo'].includes(p.res) ? p.res : 'solo', at: Number(p.at) || 0 }));
  s.wins = Math.max(0, Number(raw.wins) || 0); s.total = Math.max(s.played.length, Number(raw.total) || 0);
  return s;
}
export function recordPlayed(store, entry){
  const s = normalizeStore(store);
  return { played: s.played.concat([entry]).slice(-30), wins: s.wins + (entry.res === 'win' ? 1 : 0), total: s.total + 1 };
}

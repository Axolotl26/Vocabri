// Vocabri — lógica pura de las Escenas (sin DOM ni localStorage).
export const SCENE_XP_FIRST = 4;    // XP por acertar a la primera
export const SCENE_XP_SECOND = 2;   // XP por acertar al segundo intento
export const SCENE_MAX_TRIES = 2;   // tras estos fallos se muestra la respuesta y se sigue

export function youTurns(scene){ return scene.turns.filter(t => t.who === 'you'); }

// Estructura válida: empieza y alterna npc/tú, cada línea tuya tiene objetivo y texto.
export function validateScene(scene){
  const errs = [];
  if(!scene || !scene.id || !scene.title || !Array.isArray(scene.turns)) return ['escena incompleta'];
  const t = scene.turns;
  if(t.length < 4) errs.push('muy corta');
  if(t[0].who !== 'npc') errs.push('debe empezar la otra persona');
  if(t[t.length - 1].who !== 'you') errs.push('debe terminar tu línea');
  t.forEach((x, i) => {
    if(i > 0 && x.who === t[i - 1].who) errs.push('turnos seguidos del mismo lado en ' + i);
    if(!x.en || !x.es) errs.push('falta texto en ' + i);
    if(x.who === 'you' && !x.goal) errs.push('falta objetivo en ' + i);
  });
  if(youTurns(scene).length < 3) errs.push('necesita al menos 3 líneas tuyas');
  return errs;
}

// Mezcla Fisher-Yates con `rng` inyectable (tests deterministas).
export function shuffle(arr, rng){
  const a = arr.slice(), r = rng || Math.random;
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Opciones de la línea `idx` (índice dentro de scene.turns): la correcta + 2 de tus otras líneas de la escena, mezcladas.
export function buildOptions(scene, idx, rng){
  const cur = scene.turns[idx];
  const others = shuffle(youTurns(scene).filter(t => t !== cur && t.en !== cur.en), rng).slice(0, 2);
  return shuffle([{ en: cur.en, es: cur.es, correct: true }].concat(others.map(o => ({ en: o.en, es: o.es, correct: false }))), rng);
}

// tries: nº de intentos usados en esa línea; assisted: se mostró la respuesta.
export function turnXp(tries, assisted){
  if(assisted) return 0;
  return tries <= 1 ? SCENE_XP_FIRST : (tries === 2 ? SCENE_XP_SECOND : 0);
}

// results: [{tries, assisted}] → resumen de la sesión
export function scoreRun(results){
  const total = results.length;
  const firstTry = results.filter(r => !r.assisted && r.tries <= 1).length;
  const assisted = results.filter(r => r.assisted).length;
  const xp = results.reduce((a, r) => a + turnXp(r.tries, r.assisted), 0);
  return { total, firstTry, assisted, xp, pct: total ? Math.round(firstTry / total * 100) : 0 };
}

export function dayKey(ts){
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// store: { [id]: {plays, best, last, xpDay} }. Devuelve { store, xp } → el XP se da una vez al día por escena (sin granjear repitiendo).
export function recordRun(store, id, summary, now){
  const prev = (store && store[id]) || { plays: 0, best: 0, last: 0, xpDay: '' };
  const today = dayKey(now), giveXp = prev.xpDay !== today;
  const next = Object.assign({}, store, { [id]: { plays: prev.plays + 1, best: Math.max(prev.best, summary.pct), last: now, xpDay: giveXp ? today : prev.xpDay } });
  return { store: next, xp: giveXp ? summary.xp : 0 };
}

// Lectura tolerante de lo guardado
export function normalizeStore(raw){
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  Object.keys(raw).forEach(k => {
    const v = raw[k];
    if(v && typeof v === 'object') out[k] = { plays: +v.plays || 0, best: Math.min(100, +v.best || 0), last: +v.last || 0, xpDay: typeof v.xpDay === 'string' ? v.xpDay : '' };
  });
  return out;
}

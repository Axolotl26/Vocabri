// Vocabri — lógica pura de las Escenas (sin DOM ni localStorage).
export const SCENE_XP_FIRST = 4;    // XP por acertar a la primera
export const SCENE_XP_SECOND = 2;   // XP por acertar al segundo intento
export const SCENE_MAX_TRIES = 2;   // tras estos fallos se muestra la respuesta y se sigue

// Líneas tuyas «normales» (con respuesta correcta). Las decisiones (turnos con `choice`) no cuentan aquí.
export function youTurns(scene){ return scene.turns.filter(t => t.who === 'you' && !t.choice); }
// Decisiones: turnos tuyos donde eliges cómo hablar (varias opciones válidas con distinto tono). Cada opción trae la respuesta de la otra persona.
export function choiceTurns(scene){ return scene.turns.filter(t => t.who === 'you' && Array.isArray(t.choice)); }
export const FITS = ['great', 'ok', 'off'];

// Estructura válida: empieza y alterna npc/tú, cada línea tuya tiene objetivo y texto.
// Una decisión cuenta como «tú» y su respuesta (reply) hace de turno de la otra persona: tras ella puede venir otra línea tuya o de la otra persona.
export function validateScene(scene){
  const errs = [];
  if(!scene || !scene.id || !scene.title || !Array.isArray(scene.turns)) return ['escena incompleta'];
  const t = scene.turns;
  if(t.length < 4) errs.push('muy corta');
  if(t[0].who !== 'npc') errs.push('debe empezar la otra persona');
  if(t[t.length - 1].who !== 'you' || t[t.length - 1].choice) errs.push('debe terminar tu línea');
  t.forEach((x, i) => {
    const prev = t[i - 1];
    if(i > 0 && x.who === prev.who && !(prev.choice)) errs.push('turnos seguidos del mismo lado en ' + i);
    if(x.choice){
      if(x.who !== 'you') errs.push('una decisión debe ser tuya en ' + i);
      if(prev && prev.who !== 'npc') errs.push('una decisión debe seguir a la otra persona en ' + i);
      if(!x.goal) errs.push('falta objetivo en ' + i);
      if(!Array.isArray(x.choice) || x.choice.length < 2 || x.choice.length > 3) errs.push('la decisión ' + i + ' necesita 2 o 3 opciones');
      else {
        if(!x.choice.some(o => o.fit === 'great')) errs.push('la decisión ' + i + ' necesita una opción ideal');
        if(new Set(x.choice.map(o => o.en)).size !== x.choice.length) errs.push('opciones repetidas en ' + i);
        x.choice.forEach((o, k) => {
          if(!o.en || !o.es || !o.tip) errs.push('opción incompleta ' + i + '.' + k);
          if(FITS.indexOf(o.fit) < 0) errs.push('tono inválido ' + i + '.' + k);
          if(!Array.isArray(o.reply) || !o.reply.length || o.reply.some(r => !r.en || !r.es)) errs.push('falta respuesta en ' + i + '.' + k);
        });
      }
      return;
    }
    if(!x.en || !x.es) errs.push('falta texto en ' + i);
    if(x.who === 'you' && !x.goal) errs.push('falta objetivo en ' + i);
  });
  if(youTurns(scene).length < 3) errs.push('necesita al menos 3 líneas tuyas');
  return errs;
}

// Resumen de tus decisiones: picks = [{fit}]. great = elegiste el tono ideal.
export function toneSummary(picks){
  const total = picks.length, great = picks.filter(p => p.fit === 'great').length;
  return { total, great, off: picks.filter(p => p.fit === 'off').length };
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

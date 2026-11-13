// Vocabri — Rutas por objetivo (puro, sin DOM ni localStorage).
// Una ruta es un camino corto de frases: se arma con zonas que ya existen, quita lo que ya estudiaste y lo reparte por días.
// El avance NO se guarda aparte: se calcula con tus datos de estudio (una frase cuenta si ya la viste, repasaste o dominaste).

export const ROUTE_DAY_OPTIONS = [7, 14, 30];
export const ROUTE_PER_DAY_MAX = 10;   // tope de frases nuevas por día
const DAY_MS = 24 * 3600 * 1000;

// sources: cada fuente es una categoría completa, o solo algunas zonas (módulos) de ella, en el orden en que se estudian.
export const ROUTE_GOALS = [
  { id: 'travel', emoji: '✈️', name: 'Voy a viajar', desc: 'Saludos, aeropuerto, hotel, restaurantes y emergencias', sources: [
    { cat: 'general', zones: ['Saludos y Despedidas', 'Cortesía y Social', 'Para cuando no entiendes'] },
    { cat: 'travel' },
    { cat: 'general', zones: ['Viajes y Transporte', 'En el Restaurante', 'Direcciones', 'Salud y Emergencias'] }
  ]},
  { id: 'work', emoji: '💼', name: 'Busco trabajo', desc: 'Entrevistas, correos profesionales y reuniones', sources: [
    { cat: 'business', zones: ['Entrevistas de Trabajo'] },
    { cat: 'business', zones: ['Correos Profesionales', 'Reuniones'] },
    { cat: 'general', zones: ['En el Trabajo', 'Teléfono y Tecnología'] }
  ]},
  { id: 'study', emoji: '🎓', name: 'Voy a estudiar', desc: 'Clases, investigación, biblioteca y vida universitaria', sources: [
    { cat: 'academic' },
    { cat: 'general', zones: ['Educación y Aprendizaje'] }
  ]},
  { id: 'talk', emoji: '💬', name: 'Conversar cada día', desc: 'Presentarte, opinar, contar cómo te sientes y entender a otros', sources: [
    { cat: 'general', zones: ['Saludos y Despedidas', 'Cortesía y Social', 'Información Personal', 'Situaciones Diarias', 'Para cuando no entiendes', 'Expresando Opiniones y Gustos', 'Sentimientos y Estados de Ánimo', 'Preguntas Frecuentes y Misceláneas'] }
  ]},
  { id: 'fun', emoji: '🎮', name: 'Series y gaming', desc: 'Entender series, anime, streaming y partidas online', sources: [
    { cat: 'pop' }
  ]}
];

export function getRouteGoal(id){ return ROUTE_GOALS.find(g => g.id === id) || null; }

// Elementos de las zonas pedidas. `names`/`sizes` son los de la categoría (CAT_MODULE_NAMES/SIZES);
// sin `wanted` (o sin zonas con nombre) se devuelve todo. Los nombres que no existan se ignoran, sin fallar.
export function zoneSlice(items, names, sizes, wanted){
  if(!wanted || !wanted.length || !names || !sizes) return items.slice();
  const out = [];
  let from = 0;
  const ranges = {};
  names.forEach((n, i) => { ranges[n] = [from, from + (sizes[i] || 0)]; from += (sizes[i] || 0); });
  wanted.forEach(n => { const r = ranges[n]; if(r) out.push(...items.slice(r[0], r[1])); });
  return out;
}

// Si hay más claves que el tope, toma de cada grupo una parte proporcional (siempre las primeras) para cubrir todas las fuentes.
export function sampleEven(groups, cap){
  const total = groups.reduce((a, g) => a + g.length, 0);
  if(total <= cap) return [].concat(...groups);
  const take = groups.map(g => Math.floor(g.length * cap / total));
  let rest = cap - take.reduce((a, b) => a + b, 0);
  for(let i = 0; rest > 0 && i < groups.length * 2; i++){
    const k = i % groups.length;
    if(take[k] < groups[k].length){ take[k]++; rest--; }
  }
  return [].concat(...groups.map((g, i) => g.slice(0, take[i])));
}

// Reparte n claves en `days` días lo más parejo posible (los primeros días llevan la sobra); no deja días vacíos.
export function splitDays(keys, days){
  const d = Math.max(1, days | 0), base = Math.floor(keys.length / d), extra = keys.length % d;
  const out = [];
  let at = 0;
  for(let i = 0; i < d; i++){
    const n = base + (i < extra ? 1 : 0);
    if(n > 0) out.push(keys.slice(at, at + n));
    at += n;
  }
  return out;
}

// groups: arrays de claves (una por fuente, ya en orden). isStudied(key): lo que ya sabes se deja fuera.
export function buildRoutePlan(groups, days, isStudied, perDayMax){
  const seen = new Set();
  const fresh = groups.map(g => g.filter(k => {
    if(seen.has(k) || (isStudied && isStudied(k))) return false;
    seen.add(k); return true;
  }));
  const keys = sampleEven(fresh, Math.max(1, days | 0) * (perDayMax || ROUTE_PER_DAY_MAX));
  return splitDays(keys, days);
}

// Avance: por día y en total. `next` = primer día sin completar (o -1 si la ruta está completa).
export function routeProgress(plan, isStudied){
  const days = plan.map(keys => {
    const done = keys.filter(isStudied).length;
    return { total: keys.length, done, complete: keys.length > 0 && done === keys.length };
  });
  const totalCards = days.reduce((a, d) => a + d.total, 0), doneCards = days.reduce((a, d) => a + d.done, 0);
  return { days, totalCards, doneCards, doneDays: days.filter(d => d.complete).length, next: days.findIndex(d => !d.complete), pct: totalCards ? Math.round(doneCards / totalCards * 100) : 0 };
}

// Días que faltan para el objetivo (nunca negativo).
export function daysLeft(route, now){
  const end = route.start + route.days * DAY_MS;
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
}

// Registro guardado válido (por si el localStorage trae algo viejo o roto)
export function normalizeRoute(r){
  if(!r || typeof r !== 'object' || !getRouteGoal(r.goal) || !Array.isArray(r.plan) || !r.plan.length) return null;
  if(!r.plan.every(d => Array.isArray(d) && d.every(k => typeof k === 'string'))) return null;
  const days = ROUTE_DAY_OPTIONS.includes(r.days) ? r.days : r.plan.length;
  return { v: 1, goal: r.goal, days, start: +r.start || Date.now(), plan: r.plan };
}

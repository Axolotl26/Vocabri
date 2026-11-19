// Vocabri — libro de XP: reglas anti-farmeo. Puro (sin DOM): el estado entra y sale como objeto.
// Cada ganancia de XP declara su fuente (source) y, si procede, la clave del elemento (key).
//   · tope diario por fuente
//   · una sola vez al día por elemento en las fuentes marcadas `oncePerDay`
//   · las tarjetas propias («custom|…») pagan menos y con su propio tope

export const XP_RULES = {
  lesson:    { label: 'lecciones',        daily: 400 },
  review:    { label: 'repaso',           daily: 300 },
  dictation: { label: 'Escucha y escribe', daily: 60, oncePerDay: true },
  cloze:     { label: 'Completa el hueco', daily: 30, oncePerDay: true },
  scene:     { label: 'escenas',          daily: 120 },
  route:     { label: 'rutas',            daily: 200 },
  challenge: { label: 'retos',            daily: 60, oncePerDay: true },
  custom:    { label: 'tarjetas propias', daily: 30, factor: 0.3 },
  // Sin tope diario: ya son de una sola vez por naturaleza (examen mejorado, bono de sección, misión)
  exam:      { label: 'exámenes',         daily: Infinity },
  section:   { label: 'secciones',        daily: Infinity },
  mission:   { label: 'misiones',         daily: Infinity },
  weekly:    { label: 'cofre semanal',    daily: Infinity },
  event:     { label: 'evento semanal',   daily: Infinity },
  other:     { label: 'otros',            daily: Infinity }
};

export function emptyLedger(day){ return { day: day || '', by: {}, paid: {} }; }

export function normalizeLedger(raw, today){
  if(!raw || typeof raw !== 'object' || raw.day !== today) return emptyLedger(today);   // cambio de día = libro nuevo
  return { day: today, by: Object.assign({}, raw.by), paid: Object.assign({}, raw.paid) };
}

// ¿Esta clave es una tarjeta propia del usuario?
export function isCustomKey(key){ return typeof key === 'string' && key.indexOf('custom|') === 0; }

// Devuelve { ledger, granted, reason } con reason: 'ok' | 'cap' | 'repeat' | 'zero'
export function grant(ledger, source, amount, key, today){
  const led = normalizeLedger(ledger, today);
  let src = XP_RULES[source] ? source : 'other';
  if(isCustomKey(key) && (src === 'lesson' || src === 'review' || src === 'dictation' || src === 'route')) src = 'custom';
  const rule = XP_RULES[src];
  let amt = Math.max(0, Math.round(amount * (rule.factor || 1)));
  if(amt <= 0) return { ledger: led, granted: 0, reason: 'zero', source: src };
  const id = key ? src + '|' + key : '';
  if(rule.oncePerDay && id && led.paid[id]) return { ledger: led, granted: 0, reason: 'repeat', source: src };
  const used = led.by[src] || 0;
  const room = Math.max(0, rule.daily - used);
  if(room <= 0) return { ledger: led, granted: 0, reason: 'cap', source: src };
  const granted = Math.min(amt, room);
  led.by[src] = used + granted;
  if(rule.oncePerDay && id) led.paid[id] = 1;
  return { ledger: led, granted, reason: granted < amt ? 'cap' : 'ok', source: src };
}

export function capReached(ledger, source, today){
  const led = normalizeLedger(ledger, today), rule = XP_RULES[source];
  return !!rule && (led.by[source] || 0) >= rule.daily;
}

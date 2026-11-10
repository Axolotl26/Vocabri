// Vocabri — SRS puro (sin DOM ni localStorage): intervalos, calificaciones y calendario de repaso.
// state.js lo usa y lo re-exporta; los tests lo importan directamente.

export const DAY_MS = 24*3600*1000;


export const REVIEW_AGAIN_MS = 10*60*1000;


export const REVIEW_SESSION_CAP = 25;


export const REVIEW_XP = {1:0, 2:4, 3:8, 4:8};

   // Bien y Fácil pagan igual: no hay incentivo a marcar siempre "Fácil"
export const LEECH_LAPSES = 4;

                    // tarjeta "sanguijuela": fallada 4 veces o más

// Intervalo actual (en días) de una tarjeta; las guardadas con el sistema anterior se derivan de su nivel.
export function srsInterval(s){
  if(s.iv) return s.iv;
  return {1:0, 2:2, 3:10}[s.lvl] || 0;
}


// Días de retraso con que se repasa una tarjeta vencida
export function srsLateDays(s, now){ return (s && s.next && now > s.next) ? (now - s.next) / DAY_MS : 0; }


// Siguiente intervalo (días) según la nota: 1 Otra vez · 2 Difícil · 3 Bien · 4 Fácil.
// `s` (opcional) es el registro de la tarjeta: permite bonus por repasar tarde y el tramo de "reaprendizaje".
export function srsNextInterval(prev, grade, s, now){
  now = (now == null) ? Date.now() : now;
  if(grade === 1) return 0;
  if(s && s.rl && prev > 0){        // tras un fallo: la tarjeta vuelve a su intervalo reducido, sin multiplicar
    if(grade === 2) return Math.max(1, Math.round(prev * 0.8));
    if(grade === 3) return Math.max(1, prev);
    return Math.max(2, Math.round(prev * 1.3));
  }
  const eff = (grade >= 3 && s) ? prev + Math.min(prev, srsLateDays(s, now) * 0.5) : prev;   // bonus por acertar tarde
  if(grade === 2) return Math.min(365, Math.max(1, Math.round(eff * 1.2)));
  if(grade === 3) return Math.min(365, Math.max(2, Math.round(eff * 2.2)));
  return Math.min(365, Math.max(5, Math.round(eff * 3.5)));
}


export function srsGapText(days){
  if(days <= 0) return '10 min';
  if(days === 1) return '1 día';
  if(days < 30) return days + ' días';
  const m = Math.round(days/30);
  return m + (m === 1 ? ' mes' : ' meses');
}


// Vence "al empezar el día" (medianoche local) para que "Repasar hoy" signifique hoy, no "dentro de 24 h".
export function srsDueAt(days, now){ const d = new Date(now); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime(); }


export function srsStartOfDay(ts){ const d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }



// ¿Esta nota debe mover el calendario? Solo si la tarjeta es nueva, está vencida, está en reaprendizaje o es un fallo.
// Un repaso anticipado (p. ej. "Repasar sección") con acierto no cambia nada: evita inflar intervalos.
export function srsWouldApply(cur, grade, now){
  now = now || Date.now();
  return !cur.next || cur.next <= now || cur.rl || grade === 1;
}


// Decide qué pasa con una tarjeta al calificarla. Pura: recibe el registro actual y la hora, devuelve el registro nuevo.
//   { applied:false, record, leech }           → repaso anticipado: solo cuenta como actividad, el calendario no cambia
//   { applied:true,  record, leech, lapses }   → el calendario avanza según la nota
// `rand` (opcional) es la fuente del ±6 % de dispersión; en los tests se fija para obtener resultados exactos.
export function srsPlanGrade(cur, grade, now, opts, rand){
  opts = opts || {};
  rand = rand || Math.random;
  if(!srsWouldApply(cur, grade, now)){
    return {applied:false, leech:cur.lapses >= LEECH_LAPSES, record:Object.assign({}, cur, {t:now, reps:cur.reps + 1})};
  }
  const prev = srsInterval(cur);
  let iv, next, lapses = cur.lapses, rl;
  if(grade === 1){
    if(!cur.rl){ lapses++; iv = prev > 0 ? Math.max(1, Math.floor(prev * 0.4)) : 0; }   // un fallo reduce el intervalo, no lo borra
    else iv = prev;
    rl = true; next = now + REVIEW_AGAIN_MS;
  } else {
    iv = srsNextInterval(prev, grade, cur, now);
    if(opts.minIv) iv = Math.max(iv, opts.minIv);
    if(iv >= 7) iv = Math.min(365, Math.round(iv * (0.94 + rand() * 0.12)));   // ±6 %: evita que todo venza el mismo día
    rl = false; next = srsDueAt(iv, now);
  }
  const m = !rl && iv >= 10;
  const lvl = rl ? 1 : (iv >= 10 ? 3 : 2);
  return {applied:true, leech: lapses >= LEECH_LAPSES, lapses:lapses,
          record:{m:m, t:now, mt: m ? (cur.mt || now) : cur.mt, lvl:lvl, next:next, iv:iv, lapses:lapses, rl:rl, reps:cur.reps + 1}};
}

// Vocabri — ajolote reactivo y animaciones de celebración / desbloqueo.
// Módulo sin dependencias de la app: solo DOM + el estado compartido S (S.justUnlocked es temporal, no se guarda).
import { S } from './core/shared.js';

export function prefersReducedMotion(){
  try{ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; }
}
export function animationsEnabled(){
  try{ if(localStorage.getItem('ci_reduce_motion') === '1') return false; }catch(e){}
  return !prefersReducedMotion();
}

// ---- Frases del ajolote (variadas, para que no se sienta repetitivo) ----
export const LINES = {
  easy:   ['¡Esa ya es tuya!', '¡Dominada! 🚀', '¡Así se hace!', '¡Qué memoria!'],
  good:   ['¡Bien!', '¡Muy bien!', '¡Sigue así!', '¡Buen ritmo!'],
  hard:   ['Vuelve pronto 💪', 'Se repasa y listo', 'Tranquilo, la veremos otra vez', 'Poco a poco'],
  level:  ['¡Subiste de nivel!'],
  goal:   ['¡Meta del día cumplida!'],
  stage:  ['¡Sección completada!', '¡Nuevo camino abierto!'],
  exam:   ['¡Examen superado!', '¡Qué examen!'],
  perfect:['¡Perfecto! ★★★']
};
export function pickLine(kind, rnd = Math.random){
  const a = LINES[kind] || LINES.good;
  return a[Math.floor(rnd() * a.length)];
}

// Burbuja de texto junto al sticker del ajolote (se crea la primera vez que hace falta).
export function setMascotBubble(text){
  const box = document.getElementById('mascotToast');
  if(!box) return;
  let b = box.querySelector('.mascotBubble');
  if(!text){ if(b) b.remove(); return; }
  if(!b){ b = document.createElement('div'); b.className = 'mascotBubble'; box.insertBefore(b, box.firstChild); }
  b.textContent = text;
}

// Confeti ligero hecho con elementos CSS (sin canvas ni librerías). No hace nada con "reducir movimiento".
const COLORS = ['#F472B6', '#FBBF24', '#34D399', '#38BDF8', '#A78BFA', '#FB923C'];
export function celebrate(opts = {}){
  if(!animationsEnabled()) return false;
  const n = opts.count || 34;
  const layer = document.createElement('div');
  layer.className = 'confettiLayer';
  layer.setAttribute('aria-hidden', 'true');
  for(let i = 0; i < n; i++){
    const p = document.createElement('i');
    const ang = (Math.random() * 120 - 60) * Math.PI / 180;       // abanico hacia arriba
    const dist = 140 + Math.random() * 220;
    p.style.setProperty('--dx', Math.round(Math.sin(ang) * dist) + 'px');
    p.style.setProperty('--dy', Math.round(-Math.cos(ang) * dist * 0.9) + 'px');
    p.style.setProperty('--rot', Math.round(Math.random() * 720 - 360) + 'deg');
    p.style.setProperty('--d', Math.round(Math.random() * 120) + 'ms');
    p.style.background = (opts.colors || COLORS)[i % (opts.colors || COLORS).length];
    if(i % 3 === 0) p.className = 'dot';
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1900);
  return true;
}

// ---- Desbloqueo de secciones en el mapa ----
export function markJustUnlocked(cat, stage){ S.justUnlocked = { cat, stage }; }
// Reproduce la animación de "recién desbloqueada" sobre el nodo del mapa (se llama cuando el mapa ya está a la vista).
export function playPendingUnlock(root = document){
  const j = S.justUnlocked;
  if(!j) return false;
  S.justUnlocked = null;
  if(!animationsEnabled()) return false;
  setTimeout(() => {
    const node = root.querySelector('.pathNode[data-stage="' + j.stage + '"]');
    if(!node) return;
    node.classList.add('justUnlocked');
    try{ node.scrollIntoView({ block: 'center', behavior: 'smooth' }); }catch(e){}
    setTimeout(() => node.classList.remove('justUnlocked'), 2800);
  }, 450);
  return true;
}

// Vocabri — modo «Calcar»: dibujar el carácter con el dedo sobre una guía tenue (sin datos de trazos; no puntúa, solo practica la mano).
let ctx = null, drawing = false, guideOn = true, glyph = '', strokesOk = false, playToken = 0;
const $ = id => document.getElementById(id);

function paintGuide(){
  const c = $('traceCanvas'); if(!c) return;
  const g = $('traceGuide'); if(!g) return;
  g.textContent = glyph; g.style.visibility = guideOn ? 'visible' : 'hidden';
  g.style.fontSize = (glyph.length > 2 ? 34 : glyph.length > 1 ? 52 : 78) + 'cqw';
}
let LW = 0, LH = 0;
function sizeCanvas(){
  const c = $('traceCanvas'); if(!c) return;
  // tamaño de diseño (no se ve afectado por la animación de entrada del modal ni por transform)
  const w = c.clientWidth, h = c.clientHeight; if(!w || !h) return;
  if(w === LW && h === LH && ctx) return;
  LW = w; LH = h;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 9;
  ctx.strokeStyle = (getComputedStyle(document.documentElement).getPropertyValue('--text') || '').trim() || '#222';
}
// Convierte el puntero a coordenadas del lienzo aunque el modal esté escalado o el navegador tenga zoom
function pos(e){
  const c = $('traceCanvas'), r = c.getBoundingClientRect();
  return [(e.clientX - r.left) * (LW / (r.width || LW)), (e.clientY - r.top) * (LH / (r.height || LH))];
}

// ── Orden de trazos (KanjiVG, CC BY-SA 3.0). Los SVG viven en data/kanjivg/<unicode en hex, 5 cifras>.svg y se bajan con tools/fetch-kanjivg.mjs ──
const NS = 'http://www.w3.org/2000/svg';
const svgUrl = ch => './data/kanjivg/' + ch.codePointAt(0).toString(16).padStart(5, '0') + '.svg';
async function loadStrokes(ch){
  try{
    const r = await fetch(svgUrl(ch)); if(!r.ok) return null;
    const doc = new DOMParser().parseFromString(await r.text(), 'image/svg+xml');
    const ps = [...doc.querySelectorAll('path')].map(p => p.getAttribute('d')).filter(Boolean);
    return ps.length ? ps : null;
  }catch(e){ return null; }
}
function stopStrokes(){ playToken++; const s = $('traceStrokes'); if(s) s.innerHTML = ''; }
async function playStrokes(){
  const my = ++playToken, box = $('traceStrokes'); if(!box) return;
  const paths = await loadStrokes([...glyph][0]); if(!paths || my !== playToken) return;
  box.innerHTML = '';
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(let i = 0; i < paths.length; i++){
    if(my !== playToken) return;
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', paths[i]); p.setAttribute('class', 'traceStroke');
    box.appendChild(p);
    const len = p.getTotalLength();
    p.style.strokeDasharray = len; p.style.strokeDashoffset = reduce ? 0 : len;
    const m = /M\s*([\d.]+)[ ,]([\d.]+)/i.exec(paths[i]);
    if(m){ const t = document.createElementNS(NS, 'text'); t.setAttribute('x', +m[1] - 4); t.setAttribute('y', +m[2] - 2); t.setAttribute('class', 'traceNum'); t.textContent = i + 1; box.appendChild(t); }
    if(!reduce){ void p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset ' + Math.min(0.7, 0.25 + len / 220) + 's ease'; p.style.strokeDashoffset = 0; await new Promise(r => setTimeout(r, Math.min(700, 250 + len * 3) + 120)); }
  }
}
async function refreshStrokesBtn(){
  const b = $('traceStrokesBtn'); if(!b) return;
  strokesOk = false; b.style.display = 'none';
  const chars = [...glyph]; if(chars.length !== 1) return;
  const ok = await loadStrokes(chars[0]);
  if(ok && glyph){ strokesOk = true; b.style.display = ''; }
}

export function openTrace(text){
  glyph = String(text || '').trim(); if(!glyph) return;
  const ov = $('traceOverlay'); if(!ov) return;
  ov.style.display = 'flex'; stopStrokes(); refreshStrokesBtn();
  LW = 0; ctx = null;
  requestAnimationFrame(() => { sizeCanvas(); paintGuide(); });
  setTimeout(() => { if($('traceOverlay').style.display !== 'none'){ const keep = null; sizeCanvas(); } }, 450);
}
export function closeTrace(){ stopStrokes(); const ov = $('traceOverlay'); if(ov) ov.style.display = 'none'; drawing = false; }
export function clearTrace(){ if(ctx){ ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const c = $('traceCanvas'); ctx.clearRect(0, 0, c.width, c.height); ctx.restore(); } }

export function initTrace(){
  const c = $('traceCanvas'); if(!c || c.dataset.ready) return; c.dataset.ready = '1';
  window.addEventListener('resize', () => { if($('traceOverlay').style.display !== 'none') sizeCanvas(); });
  c.addEventListener('pointerdown', e => { if(!ctx) return; drawing = true; try{ c.setPointerCapture(e.pointerId); }catch(_){} const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y); ctx.stroke(); e.preventDefault(); });
  c.addEventListener('pointermove', e => { if(!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); e.preventDefault(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => c.addEventListener(t, () => { drawing = false; }));
  $('traceClear').onclick = clearTrace;
  $('traceClose').onclick = closeTrace;
  $('traceStrokesBtn').onclick = () => { if(strokesOk) playStrokes(); };
  $('traceGuideBtn').onclick = () => { guideOn = !guideOn; $('traceGuideBtn').textContent = guideOn ? 'Ocultar guía' : 'Mostrar guía'; paintGuide(); };
  $('traceOverlay').addEventListener('click', e => { if(e.target === $('traceOverlay')) closeTrace(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && $('traceOverlay').style.display !== 'none') closeTrace(); });
  const b = $('traceBtn'); if(b) b.onclick = () => openTrace(b.dataset.glyph);
}

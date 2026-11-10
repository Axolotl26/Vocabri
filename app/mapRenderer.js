// Vocabri — módulo "mapRenderer" (generado a partir de app.js)
import { S } from './core/shared.js';
import { cooldownRemainingMs, examStarsOf, fmtHhMmSs, getUnlockedStage, isMastered, mapItemsFor } from './core/dataRegistry.js';
import { showLesson, startStageReview } from './map.js';
import { isExamNode, isStageComplete, nodeLayout, stageCountFor, stageName } from './mapData.js';
import { showToast, vbPrompt } from './ui.js';



/* =====================================================================
   Mapa isométrico 2.5D  (v2 — estilo "torres oscuras")
   REEMPLAZA en app.js todo el bloque desde el comentario
   "Mapa isométrico 2.5D" hasta el final de la función buildPathMap().
   Conserva las clases que usa el resto de app.js: .pathNode
   (+ active/locked/done/examNode/seccion-cooldown), .nodeTimer,
   .nodeLabel y .nodeReviewBtn.
   Capas (atrás → adelante):
     defs → decoración trasera → pilares → camino → decoración frontal → nodos
   ===================================================================== */
export const ISO = {
  SCENE_W: 420,        // ancho lógico de la escena; se escala con CSS al ancho disponible
  TW: 210, TH: 105,    // rombo de la cara superior (proporción 2:1)
  STEP: 84,            // separación vertical entre nodos consecutivos
  ETAPA_GAP: 70,       // espacio extra al empezar una nueva etapa
  AMP: 84,             // desplazamiento lateral del zigzag
  OFFSETS: [-1, 0, 1, 0],
  PUCK_W: 64, PUCK_H: 54, PUCK_LIFT: 9,
  PAD_TOP: 170, PAD_BOTTOM: 200
};


export const ISO_AXOLOTLS = [
  'ajolotes_de_colores/ajolote_rosa_brazos_abiertos.png',
  'ajolotes_de_colores/ajolote_verde_bailando.png',
  'ajolotes_de_colores/ajolote_dorado_brillante.png',
  'ajolotes_de_colores/ajolote_morado_pensativo.png',
  'ajolotes_de_colores/ajolote_amarillo_flotando_sonriente.png',
  'ajolotes_emociones/feliz_nadando_saludando.png'
];



// Pseudo-aleatorio determinista: la misma posición siempre da la misma decoración.
export function isoRand(n){
  let x = Math.imul(n + 1, 2654435761) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  x = Math.imul(x, 2246822519) >>> 0;
  return (x % 1000) / 1000;
}


export const ISO_LOCK_SVG =
  '<svg class="isoLock" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">' +
  '<path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
  '<rect x="5" y="10" width="14" height="11" rx="2.6" fill="currentColor"/>' +
  '<circle cx="12" cy="15" r="1.7" fill="rgba(255,255,255,.55)"/></svg>';



// Gradientes compartidos (sombras de las caras, brillo de la cara superior).
export function isoDefsSvg(){
  return '<svg class="isoDefs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="isoShadeG" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".58"/></linearGradient>' +
    '<linearGradient id="isoSheenG" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
  '</defs></svg>';
}


// Pilar: dos caras laterales + sombra degradada + cara superior con brillo.
export const ISO_MEDAL_SVG = '<svg class="isoMedal" viewBox="0 0 40 46" width="36" height="41" aria-hidden="true">' +
  '<polygon points="9,2 21,2 25,22 14,24" fill="#3B82F6" stroke="#1E3A8A" stroke-width="2" stroke-linejoin="round"/>' +
  '<polygon points="31,2 19,2 15,22 26,24" fill="#EF4444" stroke="#7F1D1D" stroke-width="2" stroke-linejoin="round"/>' +
  '<circle cx="20" cy="30" r="13.5" fill="#FCD34D" stroke="#7A4A06" stroke-width="2.4"/>' +
  '<circle cx="20" cy="30" r="9.6" fill="#FBBF24" stroke="#B45309" stroke-width="1.6"/>' +
  '<polygon points="20.0,22.7 21.7,27.2 26.5,27.4 22.8,30.4 24.0,35.0 20.0,32.4 16.0,35.0 17.2,30.4 13.5,27.4 18.3,27.2" fill="#7A4A06" stroke="#7A4A06" stroke-width="1" stroke-linejoin="round"/>' +
  '<path d="M12.5 26 A9 9 0 0 1 20 21" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.8" stroke-linecap="round"/></svg>';


// Reloj de arena (nodo en enfriamiento): mismo estilo "cartoon" que la medalla y el candado.
export const ISO_HOURGLASS_SVG = '<svg class="isoHourglass" viewBox="0 0 40 46" width="34" height="40" aria-hidden="true" focusable="false">' +
  '<path d="M10 7 H30 C30 16.5 23.2 19.4 23.2 23 C23.2 26.6 30 29.5 30 39 H10 C10 29.5 16.8 26.6 16.8 23 C16.8 19.4 10 16.5 10 7 Z" fill="#DBEAFE" fill-opacity=".92" stroke="#1E3A8A" stroke-width="2.2" stroke-linejoin="round"/>' +
  '<path d="M13.2 9.4 H26.8 C26.2 14 22.6 16.4 20 19.2 C17.4 16.4 13.8 14 13.2 9.4 Z" fill="#FBBF24"/>' +
  '<rect x="19.2" y="19.5" width="1.6" height="10" rx=".8" fill="#F59E0B"/>' +
  '<path d="M13 37 C13.6 32.4 16.6 30.8 20 28.6 C23.4 30.8 26.4 32.4 27 37 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1" stroke-linejoin="round"/>' +
  '<rect x="6" y="3" width="28" height="5.6" rx="2.8" fill="#A78BFA" stroke="#4C1D95" stroke-width="2.2"/>' +
  '<rect x="6" y="37.4" width="28" height="5.6" rx="2.8" fill="#A78BFA" stroke="#4C1D95" stroke-width="2.2"/>' +
  '<path d="M12.6 11 C12.8 14.6 14.6 16.4 16.2 17.8" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/></svg>';


export function isoPillarSvg(h, w){
  const W = w || ISO.TW, T = W / 2, hw = W / 2, hh = T / 2;
  return '<svg class="isoPillar" viewBox="0 0 ' + W + ' ' + (T + h) + '" width="' + W + '" height="' + (T + h) +
    '" aria-hidden="true" focusable="false">' +
    '<polygon class="isoL" points="0,' + hh + ' ' + hw + ',' + T + ' ' + hw + ',' + (T + h) + ' 0,' + (hh + h) + '"/>' +
    '<polygon class="isoR" points="' + W + ',' + hh + ' ' + hw + ',' + T + ' ' + hw + ',' + (T + h) + ' ' + W + ',' + (hh + h) + '"/>' +
    '<polygon class="isoSh" points="0,' + hh + ' ' + hw + ',' + T + ' ' + W + ',' + hh + ' ' + W + ',' + (hh + h) + ' ' + hw + ',' + (T + h) + ' 0,' + (hh + h) + '"/>' +
    '<polygon class="isoT" points="' + hw + ',0 ' + W + ',' + hh + ' ' + hw + ',' + T + ' 0,' + hh + '"/>' +
    '<polygon class="isoSheen" points="' + hw + ',0 ' + W + ',' + hh + ' ' + hw + ',' + T + ' 0,' + hh + '"/>' +
  '</svg>';
}


// Nube con volumen: sombra inferior + cuerpo + brillo.
export const ISO_CLOUD_SHAPES =
  '<circle cx="30" cy="36" r="16"/><circle cx="52" cy="26" r="21"/><circle cx="76" cy="36" r="15"/>' +
  '<rect x="22" y="34" width="62" height="17" rx="8.5"/>';


export function isoCloudSvg(w){
  return '<svg class="isoCloud" viewBox="0 0 100 62" width="' + w + '" height="' + Math.round(w * 0.62) + '" aria-hidden="true">' +
    '<g class="cShade" transform="translate(0 6)">' + ISO_CLOUD_SHAPES + '</g>' +
    '<g class="cMain">' + ISO_CLOUD_SHAPES + '</g>' +
    '<ellipse class="cHi" cx="48" cy="17" rx="17" ry="6"/></svg>';
}


// Grupo de picos con cara clara y cara oscura.
export function isoMountainSvg(w){
  const peak = (ax, ay, bl, br) => {
    const m = ax + 7;
    return '<polygon class="mL" points="' + ax + ',' + ay + ' ' + bl + ',100 ' + m + ',100"/>' +
           '<polygon class="mR" points="' + ax + ',' + ay + ' ' + m + ',100 ' + br + ',100"/>';
  };
  return '<svg class="isoMountain" viewBox="0 0 160 100" width="' + w + '" height="' + Math.round(w * 100 / 160) +
    '" aria-hidden="true">' + peak(26, 46, 0, 52) + peak(60, 8, 8, 108) + peak(112, 38, 70, 160) + '</svg>';
}


// Camino recto entre los centros de los nodos.
export function isoPathD(pts, from, to){
  let d = '';
  for(let k = from; k <= to; k++){
    d += (k === from ? 'M' : ' L') + pts[k].cx + ' ' + (pts[k].cy - ISO.PUCK_LIFT);
  }
  return d;
}



// Puente de madera entre dos zonas: tablones y barandas a lo largo del tramo recto A→B.
export function isoBridgeSvg(A, B, locked, W, H){
  const ax = A.cx, ay = A.cy, bx = B.cx, by = B.cy;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux, ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const tA = 24, tB = 52, L = len - tA - tB, n = Math.max(4, Math.floor(L / 11));   // tB mayor: no pisa la etiqueta del nodo de llegada
  const half = 21;                       // medio ancho del puente
  let s = '<svg class="isoBridge' + (locked ? ' lk' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">';
  const px = k => ax + ux * (tA + L * k), py = k => ay + uy * (tA + L * k);
  // sombra
  s += '<path class="brSh" d="M' + (px(0) + 5) + ' ' + (py(0) + 12) + ' L' + (px(1) + 5) + ' ' + (py(1) + 12) + '"/>';
  // tablones (con contorno grueso y brillo, estilo cartoon)
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, tr = 'translate(' + px(t).toFixed(1) + ' ' + py(t).toFixed(1) + ') rotate(' + ang.toFixed(1) + ')';
    s += '<g transform="' + tr + '"><rect class="brPl' + (k % 2 ? ' b' : '') + '" x="-6.5" y="-' + half + '" width="13" height="' + half * 2 + '" rx="4"/>' +
         '<rect class="brHi" x="-4" y="-' + (half - 3) + '" width="3" height="' + (half * 2 - 6) + '" rx="1.5"/></g>';
  }
  // barandas de cuerda + postes con remate
  [-1, 1].forEach(side => {
    const o = (half + 1) * side;
    const d = 'M' + (px(0) + nx * o) + ' ' + (py(0) + ny * o - 14) + ' L' + (px(1) + nx * o) + ' ' + (py(1) + ny * o - 14);
    s += '<path class="brRailO" d="' + d + '"/><path class="brRail" d="' + d + '"/>';
    for(let k = 0; k <= 4; k++){
      const t = k / 4, x = (px(t) + nx * o).toFixed(1), y = (py(t) + ny * o).toFixed(1), y2 = (py(t) + ny * o - 14).toFixed(1);
      s += '<line class="brPostO" x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '"/><line class="brPost" x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '"/>' +
           '<circle class="brCap" cx="' + x + '" cy="' + y2 + '" r="4.6"/>';
    }
  });
  return s + '</svg>';
}


// Ajusta el tamaño de la escena al ancho disponible (sin reconstruir el mapa).
// Espacio libre mínimo (unidades de escena) a cada lado para colocar los carteles/islas FUERA de la escena sin que se corten
// con el borde de la pantalla (la isla mide 112 de ancho y se centra a free/2 del borde de la escena).
export const ISO_FREE_MIN = 114;


// Escala de la escena: según el ancho disponible, pero sin pasarse del alto visible (móvil horizontal: fichas gigantes).
export function isoScaleK(availW){
  const sc = document.getElementById('stageMapView');
  const hh = sc ? sc.clientHeight : 0;
  const kh = hh > 0 ? hh / 290 : 9;
  return Math.max(0.62, Math.min(1.5, availW / ISO.SCENE_W, kh));
}


export function isoApplyScale(){
  if(!S._isoStage || !S._isoScene) return;
  const avail = S._isoStage.clientWidth || 340;
  const k = isoScaleK(avail);
  S._isoScene.style.transform = 'scale(' + k + ')';
  S._isoStage.style.height = Math.round(S._isoSceneH * k) + 'px';
}



// ---- Modo ligero del mapa ----
// 'lite' = sin desenfoque de fondo ni animaciones decorativas · 'full' = efectos completos (elegido a mano) · '' = automático.
// Si el dispositivo va justo mientras se hace scroll en el mapa, se avisa UNA vez con la opción de activarlo.
export const FX_KEY = 'vocabri_fx', FX_ASKED_KEY = 'vocabri_fx_asked';


export function fxMode(){ try{ return localStorage.getItem(FX_KEY) || ''; }catch(e){ return ''; } }


export function fxUpdateToggleUi(){
  const b = document.getElementById('fxToggleBtn');
  if(b) b.textContent = fxMode() === 'lite' ? '⚡ Efectos del mapa: Modo ligero' : '✨ Efectos del mapa: Completos';
}


export function fxApply(){
  document.documentElement.classList.toggle('fxLite', fxMode() === 'lite');
  fxUpdateToggleUi();
}


export function fxSet(m){
  try{ if(m) localStorage.setItem(FX_KEY, m); else localStorage.removeItem(FX_KEY); }catch(e){}
  fxApply();
}


export const _fx = { samples: [], active: false, raf: 0, last: 0, timer: 0, prompted: false };


export function fxOnScroll(){
  if(fxMode() || _fx.prompted || document.hidden) return;                 // ya decidió (o ya se le preguntó en esta sesión)
  clearTimeout(_fx.timer);
  _fx.timer = setTimeout(() => { _fx.active = false; cancelAnimationFrame(_fx.raf); }, 180);
  if(_fx.active) return;
  _fx.active = true; _fx.last = 0;
  const tick = t => {
    if(!_fx.active) return;
    if(_fx.last){ const d = t - _fx.last; if(d < 200) _fx.samples.push(d); }   // se ignoran pausas largas (pestaña en segundo plano)
    _fx.last = t;
    if(_fx.samples.length >= 100){ fxJudge(); return; }
    _fx.raf = requestAnimationFrame(tick);
  };
  _fx.raf = requestAnimationFrame(tick);
}


export function fxJudge(){
  _fx.active = false;
  const s = _fx.samples.slice(10).sort((a, b) => a - b);                    // se descartan los primeros fotogramas (arranque del scroll)
  _fx.samples = [];
  if(s.length < 60) return;
  const med = s[s.length >> 1], slow = s.filter(d => d > 33.4).length / s.length;
  let weakHw = false;
  try{ weakHw = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
                (navigator.connection && navigator.connection.saveData); }catch(e){}
  if(med >= 28 || slow >= 0.4 || (weakHw && (med >= 22 || slow >= 0.25))) fxPrompt();
}


export function fxPrompt(){
  let asked = 0;
  try{ asked = parseInt(localStorage.getItem(FX_ASKED_KEY) || '0', 10) || 0; }catch(e){}
  if(asked >= 3) return;
  _fx.prompted = true;
  const shown = vbPrompt({
    icon: '⚡', title: '¿El mapa va lento?',
    text: 'Parece que tu dispositivo va un poco justo. El modo ligero quita el desenfoque y las animaciones del fondo del mapa (el degradado se queda). Puedes cambiarlo cuando quieras en Ajustes.',
    buttons: [
      { label: 'Activar modo ligero', primary: true, onClick: () => { fxSet('lite'); showToast('Modo ligero activado', '⚡', 2500); } },
      { label: 'Mantener efectos', onClick: () => fxSet('full') }
    ],
    autoMs: 25000
  });
  if(shown){ try{ localStorage.setItem(FX_ASKED_KEY, String(asked + 1)); }catch(e){} }
  else _fx.prompted = false;
}


// ---- Stickers: variedad por contexto + colocación sin choques ----
// Carpeta base. Los lotes deben estar en assets/stickers/lote_1, lote_2 y lote_3.
export const ISO_STK_BASE = './assets/stickers/';


export const ISO_STK_FALLBACK = 'ajolotes_de_colores/ajolote_rosa_brazos_abiertos.png';


// [archivo, ancho, alto, tipo, mira, temas]
//   tipo: s = un personaje · w = pareja/trío/escena ancha · u = boca abajo / colgando (cuelga bajo una isla)
//   mira: L / R = hacia dónde mira el dibujo ('' = de frente); se voltea para que mire al camino
export const ISO_STK = [
  // --- un personaje ---
  ['lote_1/04_axolotl_amarillo_chef.png', 173, 192, 's', '', 'cocina trabajo'],
  ['lote_1/05_axolotl_rosa_chef_pintor.png', 181, 186, 's', '', 'cocina hobby'],
  ['lote_1/26_axolotl_morado_chef.png', 162, 181, 's', '', 'cocina'],
  ['lote_1/06_axolotl_azul_tubo_ensayo.png', 168, 176, 's', '', 'ciencia'],
  ['lote_1/20_axolotl_azul_cientifico_bata_gafas.png', 175, 176, 's', '', 'ciencia trabajo'],
  ['lote_1/12_axolotl_morado_matraz_quimica.png', 183, 186, 's', '', 'ciencia sabio'],
  ['lote_1/11_axolotl_rosa_estrella_dorada.png', 182, 188, 's', '', 'motiva trabajo futuro fiesta'],
  ['lote_1/18_axolotl_rosa_nervioso_sudando.png', 180, 185, 's', '', 'salud emocion debate'],
  ['lote_1/19_axolotl_rosa_bailando_feliz.png', 177, 193, 's', '', 'emocion fiesta motiva'],
  ['lote_1/29_axolotl_rosa_saludando.png', 166, 175, 's', '', 'saludo social'],
  ['lote_1/30_axolotl_rosa_caminando_alegre.png', 166, 174, 's', '', 'viaje saludo'],
  ['lote_1/10_axolotl_rosa_manta_durmiendo.png', 213, 178, 's', '', 'casa salud'],
  ['lote_1/08_axolotl_rosa_flotando_cola.png', 142, 192, 's', '', 'viaje tiempo futuro'],
  ['lote_2/03_axolotl_lila_durmiendo_enrollado.png', 295, 291, 's', '', 'casa salud'],
  ['lote_2/06_axolotl_amarillo_jugando_roca.png', 288, 293, 's', 'L', 'hobby'],
  ['lote_2/11_axolotl_azul_sosteniendo_concha.png', 283, 257, 's', '', 'viaje tiempo hobby'],
  ['lote_2/14_axolotl_morado_meditando.png', 301, 301, 's', '', 'sabio duda pasado'],
  ['lote_2/16_axolotl_verde_menta_confundido_esfera.png', 312, 292, 's', '', 'duda ciencia'],
  ['lote_2/08_axolotl_turquesa_cargando_tabla_madera.png', 206, 395, 's', '', 'trabajo casa'],
  ['lote_2/04_axolotl_rosa_flotando_costado.png', 237, 286, 's', '', 'tiempo viaje'],
  ['lote_3/05_axolotl_amarillo_enojado.png', 172, 172, 's', '', 'debate emocion'],
  ['lote_3/08_axolotl_rosa_pequeno_manos_juntas.png', 105, 106, 's', '', 'social duda saludo'],
  ['lote_3/27_axolotl_rosa_pequeno_pensativo.png', 106, 88, 's', '', 'duda pasado'],
  ['lote_3/30_axolotl_morado_manos_cadera.png', 163, 157, 's', '', 'debate motiva'],
  ['lote_3/35_axolotl_rosa_musculos_fuerte.png', 161, 162, 's', '', 'motiva salud debate'],
  ['lote_3/22_axolotl_morado_mago_sombrero_cristal.png', 148, 179, 's', '', 'sabio futuro'],
  ['lote_3/21_axolotl_rosa_pintando_caballete.png', 140, 160, 's', '', 'hobby'],
  ['lote_3/34_axolotl_azul_bailando_feliz.png', 165, 173, 's', '', 'emocion fiesta'],
  // --- parejas / tríos / escenas anchas ---
  ['lote_1/01_axolotl_rosa_pareja_abrazo.png', 272, 210, 'w', '', 'social'],
  ['lote_1/09_axolotl_rosa_azul_amigos_sentados.png', 270, 160, 'w', '', 'social saludo'],
  ['lote_1/15_axolotl_rosa_morado_amigos_abrazo.png', 240, 173, 'w', '', 'social'],
  ['lote_1/25_axolotl_morado_azul_abrazo.png', 207, 155, 'w', '', 'social'],
  ['lote_3/17_axolotl_azul_morado_amigos_abrazo.png', 242, 172, 'w', '', 'social'],
  ['lote_1/14_axolotl_rosa_morado_estrella_compartida.png', 238, 166, 'w', '', 'fiesta motiva'],
  ['lote_3/16_axolotl_verde_morado_estrella_compartida.png', 237, 166, 'w', '', 'fiesta futuro'],
  ['lote_2/05_axolotl_verde_morado_chocando_manos.png', 214, 204, 'w', '', 'fiesta trabajo debate'],
  ['lote_1/24_axolotl_rosa_azul_pergamino.png', 227, 165, 'w', '', 'pasado trabajo sabio'],
  ['lote_1/28_axolotl_rosa_pareja_pintando_caballete.png', 227, 167, 'w', '', 'hobby'],
  ['lote_3/32_axolotl_verde_rosa_pintando_caballete.png', 227, 167, 'w', '', 'hobby'],
  ['lote_1/02_axolotl_trio_rosa_azul_morado_abrazo.png', 251, 237, 'w', '', 'social fiesta'],
  ['lote_1/03_axolotl_trio_circulo_rosa_morado_verde.png', 267, 263, 'w', '', 'social fiesta'],
  ['lote_1/17_axolotl_trio_arcoiris_holografico.png', 248, 214, 'w', '', 'fiesta social'],
  ['lote_1/31_axolotl_rosa_sobre_nube.png', 173, 152, 'w', '', 'tiempo viaje futuro'],
  ['lote_1/13_axolotl_arcoiris_nadando.png', 291, 126, 'w', 'L', 'viaje hobby tiempo'],
  ['lote_2/12_axolotl_arcoiris_piedras_serio.png', 417, 215, 'w', 'R', 'hobby pasado debate'],
  // --- boca abajo / colgando (cuelgan bajo una isla flotante) ---
  ['lote_2/01_axolotl_rosa_boca_abajo_sorprendido.png', 248, 346, 'u', '', 'emocion tiempo'],
  ['lote_2/02_axolotl_rosa_boca_abajo_moviendo_cola.png', 238, 347, 'u', '', 'emocion tiempo'],
  ['lote_2/17_axolotl_magenta_boca_abajo_palillos.png', 240, 330, 'u', '', 'cocina emocion'],
  ['lote_2/07_axolotl_rosa_estirado_colgando.png', 171, 288, 'u', '', 'trabajo motiva'],
  ['lote_1/07_axolotl_rosa_estirado_brazos_arriba.png', 102, 190, 'u', '', 'motiva futuro']
].concat(ISO_AXOLOTLS.map(f => [f, 1, 1, 's', '', '']));

   // los ajolotes de siempre (cuadrados) como comodín
// Nombre de zona (sin acentos) → temas
export const ISO_THEMES = [
  [/cocina|restaurante|comida/, 'cocina'], [/educacion|aprendizaje|telefono|tecnologia/, 'ciencia'],
  [/hobbies|tiempo libre|experiencias/, 'hobby'], [/saludos|despedidas|cierre/, 'saludo'],
  [/salud|emergencias/, 'salud'], [/sentimientos|animo|opiniones|gustos/, 'emocion'],
  [/discusion|malentendido|debatir/, 'debate'], [/entiendes|frecuentes|profundizar|certeza|duda/, 'duda'],
  [/motivacion|deseos|necesidades/, 'motiva'], [/proverbio|sabiduria|modismo|expresiones/, 'sabio'],
  [/relacion|social|cortesia|informacion personal|personas/, 'social'], [/evento|celebracion/, 'fiesta'],
  [/viaje|transporte|calle|entorno|direcciones/, 'viaje'], [/casa/, 'casa'],
  [/trabajo|tramite|documento|dinero|finanza|compras/, 'trabajo'], [/plan|futuro/, 'futuro'],
  [/pasado/, 'pasado'], [/tiempo y la hora|comparaciones|cantidades|phrasal/, 'tiempo']
];


export function isoZoneThemes(name){
  const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const t = [];
  ISO_THEMES.forEach(r => { if(r[0].test(n)) t.push(r[1]); });
  return t;
}


// Elige un sticker: primero los que combinan con la zona, luego el resto; evita repetir los últimos usados.
export function isoStickerChoices(kinds, themes, recent, seed){
  return ISO_STK.map((e, k) => ({ e: e, k: k }))
    .filter(o => kinds.indexOf(o.e[3]) >= 0 && recent.indexOf(o.k) < 0)
    .map(o => ({ o: o, sc: (themes.some(t => o.e[5].split(' ').indexOf(t) >= 0) ? 0 : 1) + isoRand(seed * 17 + o.k * 5) * 0.9 }))
    .sort((p, q) => p.sc - q.sc).map(x => x.o);
}


export function isoStickerImg(src, flip, w, h, style){
  return '<img class="isoAxo' + (flip ? ' flip' : '') + '" src="' + ISO_STK_BASE + src + '" alt="" width="' + w + '" height="' + h +
         '" loading="lazy" decoding="async" style="' + (style || '') + '" onerror="this.onerror=null;this.src=\'' + ISO_STK_BASE + ISO_STK_FALLBACK + '\'">';
}


// tamaño en pantalla (máx. lado = m) respetando la proporción real
export function isoStkSize(e, m){
  const k = m / Math.max(e[1], e[2]);
  return { w: Math.round(e[1] * k), h: Math.round(e[2] * k) };
}


export function isoHit(a, b, m){
  m = m || 0;
  return a.x + m < b.x + b.w && a.x + a.w - m > b.x && a.y + m < b.y + b.h && a.y + a.h - m > b.y;
}


// Zonas que ningún sticker debe pisar: fichas, etiquetas, temporizadores, botón Repasar, carteles y puentes.
export function isoObstacles(pts, signs){
  const o = [];
  pts.forEach((p, i) => {
    o.push({ x: p.cx - 34, y: p.pcy - 30, w: 68, h: 66 });                       // ficha
    o.push({ x: p.cx - 64, y: p.pcy + 34, w: 128, h: 40 });                      // etiqueta / temporizador
    if(p.node.type !== 'exam') o.push({ x: p.cx + 38, y: p.pcy - 46, w: 50, h: 50 });   // botón Repasar
    if(p.newEtapa && i > 0){                                                      // puente
      const q = pts[i - 1];
      o.push({ x: Math.min(p.cx, q.cx) - 28, y: Math.min(p.cy, q.cy) - 40, w: Math.abs(p.cx - q.cx) + 56, h: Math.abs(p.cy - q.cy) + 60 });
    }
  });
  signs.forEach(s => o.push({ x: s.x - 66, y: s.y - 110, w: 132, h: 180, sg: s }));   // cartel + isla completa (hasta su borde inferior)
  return o;
}


// Decoración TRASERA (detrás de los pilares): solo nubes lejanas y montañas (sin stickers).
export function isoDecorBackHtml(pts, total, obst){
  let html = '';
  const clear = b => !obst.some(o => o.sg && isoHit(b, o, 0));   // no dejar nubes/montañas a medio tapar por una isla
  for(let i = 0; i < total; i++){
    const p = pts[i], r = isoRand(i * 13 + 5), right = ((i / 3) | 0) % 2 === 0;
    if(i % 4 === 1){                                    // nubes
      const w = 70 + Math.round(r * 50);
      const x = right ? 318 + r * 70 : -70 + r * 60;
      if(clear({ x: x, y: p.cy - 100 + r * 40, w: w, h: w / 2 }))
        html += '<div class="isoDeco" style="left:' + Math.round(x) + 'px;top:' + Math.round(p.cy - 100 + r * 40) +
                'px;--d:' + Math.round(r * 14) + '">' + isoCloudSvg(w) + '</div>';
    }
    if(i % 8 === 3){                                    // montañas
      const x = right ? 300 + r * 40 : -90 - r * 20;
      if(clear({ x: x, y: p.cy + 24, w: 150, h: 95 }))
        html += '<div class="isoDeco" style="left:' + Math.round(x) + 'px;top:' + Math.round(p.cy + 24) + 'px">' +
                isoMountainSvg(150) + '</div>';
    }
  }
  return html;
}


// Decoración FRONTAL (delante de los pilares, detrás de los nodos): todos los stickers van aquí,
// así nunca quedan ocultos tras pilares o montañas. Cada uno se coloca solo si no choca con nada.
export function isoDecorFrontHtml(pts, total, free, obst, signs, zones){
  const placed = [], recent = [];
  const isFree = (r, own) => !obst.some(o => !(own && o.sg === own) && isoHit(r, o, 6)) && !placed.some(o => isoHit(r, o, 4));
  const used = k => { recent.push(k); if(recent.length > 12) recent.shift(); };
  let html = '', last = -9;
  for(let i = 0; i < total; i++){
    const p = pts[i], themes = zones[i];
    // 1) ajolote(s) sentados en la esquina del pilar, del lado contrario al nodo siguiente
    if(i - last >= 2 && (free >= ISO_FREE_MIN ? i % 2 === 0 : i % 3 !== 1)){   // en móvil se intenta más seguido (hay poco espacio)
      const up = i < total - 1 ? Math.sign(pts[i + 1].cx - p.cx) : 0;
      const sides = up > 0 ? [-1, 1] : up < 0 ? [1, -1] : (i % 4 === 0 ? [-1, 1] : [1, -1]);
      const kinds = isoRand(i * 3 + 9) < 0.3 ? ['s', 'w'] : ['s'];
      let done = false;
      for(const c of isoStickerChoices(kinds, themes, recent, i)){
        const e = c.e, wide = e[3] === 'w', sz = isoStkSize(e, wide ? 70 : (e[1] < 130 ? 54 : (e[2] > e[1] * 1.6 ? 86 : 70)));
        for(const s of sides){
          const r = { x: p.cx + s * (40 + sz.w / 2) - sz.w / 2, y: p.cy + 4 - sz.h, w: sz.w, h: sz.h };
          if(!isFree(r)) continue;
          const want = s < 0 ? 'R' : 'L';                      // que mire hacia el camino
          const flip = e[4] ? e[4] !== want : isoRand(i * 5 + 2) < 0.5;
          placed.push(r); used(c.k); last = i; done = true;
          html += '<div class="isoDeco isoSitter" style="left:' + Math.round(r.x) + 'px;top:' + Math.round(r.y) + 'px;width:' + sz.w + 'px;height:' + sz.h + 'px">' +
                  isoStickerImg(e[0], flip, sz.w, sz.h) + '</div>';
          break;
        }
        if(done) break;
      }
    }
    // 2) islote flotante con personaje(s): solo cuando hay espacio libre a los lados (pantallas anchas)
    if(free >= ISO_FREE_MIN && i % 4 === 2){
      const left = ((i / 4) | 0) % 2 === 0, cx = left ? -free * 0.5 : ISO.SCENE_W + free * 0.5;
      const hang = isoRand(i * 11 + 1) < 0.35;
      for(const c of isoStickerChoices(hang ? ['u'] : ['s', 'w'], themes, recent, i + 100)){
        const e = c.e, sz = isoStkSize(e, hang ? 84 : (e[3] === 'w' ? 100 : 66));
        const top = p.cy - 30;
        const r = hang ? { x: cx - 54, y: top - 4, w: 108, h: 84 + sz.h - 20 + 4 }
                       : { x: cx - 54, y: top + 26 - sz.h - 4, w: 108, h: sz.h + 60 };
        if(!isFree(r)) continue;
        placed.push(r); used(c.k);
        const flip = e[4] ? e[4] !== (left ? 'R' : 'L') : isoRand(i * 5 + 3) < 0.5;
        const img = hang ? isoStickerImg(e[0], flip, sz.w, sz.h, 'left:' + Math.round((left ? 75 : 25) - sz.w / 2) + 'px;top:58px;width:' + sz.w + 'px;height:' + sz.h + 'px;z-index:-1')   // cuelga de la esquina inferior
                         : isoStickerImg(e[0], flip, sz.w, sz.h, 'left:' + Math.round(50 - sz.w / 2) + 'px;top:' + (26 - sz.h) + 'px;width:' + sz.w + 'px;height:' + sz.h + 'px');
        html += '<div class="isoDeco isoIsland" style="left:' + Math.round(cx - 50) + 'px;top:' + Math.round(top) + 'px">' +
                isoPillarSvg(34, 100) + img + '</div>';
        break;
      }
    }
  }
  // 3) personajes colgando de una esquina inferior de la isla del cartel. Van DENTRO de la isla (coordenadas locales),
  //    así se mueven con ella al flotar; la parte superior queda escondida tras la cara frontal para que parezca que se agarran.
  signs.forEach((sg, k) => {
    if(isoRand(k * 7 + 4) > 0.7) return;
    const side = isoRand(k * 3 + 8) < 0.5 ? -1 : 1;                 // esquina izquierda o derecha
    const ex = 56 + side * 30, ey = 58 + (56 - Math.abs(ex - 56)) / 2 + 2;   // punto del borde inferior de la cara (local a la isla)
    for(const c of isoStickerChoices(['u'], isoZoneThemes(sg.name), recent, k + 300)){
      const e = c.e, sz = isoStkSize(e, 66);
      const lx = ex - sz.w / 2, ly = ey - 14;                        // 14 px quedan tapados por la isla
      const r = { x: sg.x - 56 + lx, y: sg.y - 28 + ly, w: sz.w, h: sz.h };
      if(!isFree(r, sg)) continue;
      placed.push(r); used(c.k);
      sg.hang = '<div class="isoHanger" style="left:' + Math.round(lx) + 'px;top:' + Math.round(ly) + 'px;width:' + sz.w + 'px;height:' + sz.h + 'px">' +
                isoStickerImg(e[0], isoRand(k * 3 + 1) < 0.5, sz.w, sz.h) + '</div>';
      break;
    }
  });
  // 4) nubes que rozan el borde del pilar (solo si no tapan un sticker)
  for(let i = 0; i < total; i++){
    if(i % 5 !== 2) continue;
    const p = pts[i], r = isoRand(i * 7 + 11), right = i % 2 === 1;
    const w = 70 + Math.round(r * 30);
    const x = right ? p.cx + ISO.TW / 2 - 24 : p.cx - ISO.TW / 2 - w + 24;
    const box = { x: x, y: p.cy + 34, w: w, h: w / 2 };
    if(placed.some(o => isoHit(box, o, 0)) || obst.some(o => o.sg && isoHit(box, o, 0))) continue;
    html += '<div class="isoDeco" style="left:' + Math.round(x) + 'px;top:' + Math.round(p.cy + 34) +
            'px;--d:' + Math.round(r * 14) + '">' + isoCloudSvg(w) + '</div>';
  }
  return html;
}



export function isoUpdateMapSub(cat, total, doneBits){
  const doneCount = (doneBits.match(/1/g) || []).length;
  const totalItems = mapItemsFor(cat).length;
  const masteredN = mapItemsFor(cat).filter(it => isMastered(it[3])).length;
  document.getElementById('mapSub').textContent =
    doneCount + '/' + total + ' secciones completadas · ' + masteredN + '/' + totalItems + ' tarjetas dominadas';
}


export function buildPathMap(){
  const wrap = document.getElementById('pathWrap');
  if(!wrap) return;

  // Esperar a que los datos de frases estén cargados
  if (!window.VocabriPhraseData || !window.VocabriPhraseData.loaded) {
    console.log('[buildPathMap] Esperando datos de frases...');
    const waitForData = () => {
      window.removeEventListener('vocabri:phrasesLoaded', waitForData);
      buildPathMap();
    };
    window.addEventListener('vocabri:phrasesLoaded', waitForData);
    setTimeout(() => {
      if (window.VocabriPhraseData && window.VocabriPhraseData.loaded) {
        window.removeEventListener('vocabri:phrasesLoaded', waitForData);
        buildPathMap();
      }
    }, 100);
    return;
  }

  const cat = S.currentCat;
  const NL = nodeLayout(cat);
  const total = stageCountFor(cat);
  const unlocked = getUnlockedStage(cat);
  const cooldownMs = cooldownRemainingMs();
  const catLabel = (window.VocabriCategories && window.VocabriCategories.getCategoryLabel)
    ? window.VocabriCategories.getCategoryLabel(cat)
    : cat;
  document.getElementById('mapCatName').textContent = catLabel;

  // Si el mapa ya está dibujado y nada de lo que lo define cambió (categoría, avance, enfriamiento, espacio lateral),
  // no se reconstruye: al volver a la pestaña Aprender solo se actualiza el texto y se recentra el nodo activo.
  const sigW = wrap.clientWidth || 340;
  const sigFree = (sigW / isoScaleK(sigW) - ISO.SCENE_W) / 2;
  let doneBits = '';
  for(let i = 0; i <= unlocked && i < total; i++) doneBits += isStageComplete(cat, i) ? (isExamNode(cat, i) ? String(examStarsOf(cat, i)) : '1') : '0';
  const sig = [cat, total, unlocked, cooldownMs > 0 ? 1 : 0, doneBits, sigFree >= ISO_FREE_MIN ? Math.round(sigFree / 30) : 'n'].join('|');
  if(wrap._isoSig === sig && wrap.classList.contains('isoMap') && S._isoStage && wrap.contains(S._isoStage)){
    isoApplyScale();
    isoUpdateMapSub(cat, total, doneBits);
    requestAnimationFrame(() => {
      const t = wrap.querySelector('.pathNode.active') || wrap.querySelector('.pathNode.seccion-cooldown') || wrap.querySelector('.pathNode:not(.locked)');
      if(t) t.scrollIntoView({block: 'center', behavior: 'auto'});
    });
    return;
  }

  // ---- 1) Geometría: posición de cada nodo sobre la malla isométrica ----
  const pts = [];
  let up = 0, prevEtapa = null;
  for(let i = 0; i < total; i++){
    const node = NL.nodes[i];
    const newEtapa = node.etapaIdx !== prevEtapa;
    if(i > 0) up += ISO.STEP + (newEtapa ? ISO.ETAPA_GAP : 0);
    prevEtapa = node.etapaIdx;
    pts.push({
      i: i, node: node, up: up, newEtapa: newEtapa,
      h: i === 0 ? 190 : 120 + Math.floor(isoRand(i * 7 + 3) * 3) * 40,   // pilares: 120 / 160 / 200 (el primero llega al suelo)
      cx: ISO.SCENE_W / 2 + ISO.OFFSETS[i % 4] * ISO.AMP
    });
  }
  const H = ISO.PAD_TOP + up + ISO.PAD_BOTTOM;
  pts.forEach(p => { p.cy = H - ISO.PAD_BOTTOM - p.up; p.pcy = p.cy - ISO.PUCK_LIFT; });   // cy = centro del rombo, pcy = centro del nodo

  // ---- 2) Capas ----
  const stage = document.createElement('div');
  stage.className = 'isoStage';
  const scene = document.createElement('div');
  scene.className = 'isoScene';
  scene.style.height = H + 'px';
  scene.style.width = ISO.SCENE_W + 'px';
  scene.style.marginLeft = (-ISO.SCENE_W / 2) + 'px';

  const defs = document.createElement('div');
  defs.className = 'isoLayer';
  defs.innerHTML = isoDefsSvg();

  const decor = document.createElement('div');
  decor.className = 'isoLayer isoDecor';
  // Carteles de zona: islas flotantes en los costados, donde hay espacio libre
  const availW = wrap.clientWidth || 340;
  const free = (availW / isoScaleK(availW) - ISO.SCENE_W) / 2;   // espacio libre a cada lado (unidades de escena)
  S._isoFreeBuilt = free;
  const signs = [];
  pts.forEach(p => {
    if(!p.newEtapa) return;
    const i = p.i, rawName = NL.etapaNames[p.node.etapaIdx];
    let left;
    if(i < total - 1 && Math.abs(pts[i + 1].cx - p.cx) > 1) left = pts[i + 1].cx > p.cx;   // lejos del siguiente nodo
    else left = p.cx >= ISO.SCENE_W / 2;
    // pantalla ancha: la isla va en el espacio vacío fuera de la escena; pantalla estrecha: en el borde, más arriba para no tocar el nodo
    const sx = free >= ISO_FREE_MIN ? (left ? -free * 0.5 : ISO.SCENE_W + free * 0.5) : (left ? 62 : ISO.SCENE_W - 62);
    signs.push({ i: i, left: left, x: sx, y: free >= ISO_FREE_MIN ? p.cy - 34 : p.cy - 100,
                 name: (rawName === cat || !rawName) ? catLabel : rawName, lk: i > unlocked });
  });
  const obst = isoObstacles(pts, signs);
  decor.innerHTML = isoDecorBackHtml(pts, total, obst);

  // Pilares: del más alto al más bajo, así los de abajo tapan a los de atrás.
  const pillars = document.createElement('div');
  pillars.className = 'isoLayer';
  let pillarsHtml = '';
  for(let i = total - 1; i >= 0; i--){
    const p = pts[i];
    const locked = i > unlocked;
    const done = !locked && isStageComplete(cat, i);
    const isExam = p.node.type === 'exam';
    const isCd = !locked && !done && i === unlocked && cooldownMs > 0;
    const st = locked ? 'locked' : done ? 'done' : isCd ? 'cd' : isExam ? 'exam' : 'active';
    pillarsHtml += '<div class="isoPillarBox st-' + st + '" style="left:' + (p.cx - ISO.TW / 2) + 'px;top:' +
                   (p.cy - ISO.TH / 2) + 'px">' + isoPillarSvg(p.h) + '</div>';
  }
  pillars.innerHTML = pillarsHtml;

  // Camino: tramo completo tenue + tramo recorrido con brillo.
  let pathHtml = '<svg class="isoPath" viewBox="0 0 ' + ISO.SCENE_W + ' ' + H + '" width="' + ISO.SCENE_W +
                 '" height="' + H + '" aria-hidden="true">';
  if(total > 1) pathHtml += '<path class="isoPathBase" d="' + isoPathD(pts, 0, total - 1) + '"/>';
  const reach = Math.min(unlocked, total - 1);
  if(reach >= 1){
    const d = isoPathD(pts, 0, reach);
    pathHtml += '<path class="isoGlow g1" d="' + d + '"/><path class="isoGlow g2" d="' + d + '"/><path class="isoGlow g3" d="' + d + '"/>';
  }
  pathHtml += '</svg>';
  const bridgeLayer = document.createElement('div');
  bridgeLayer.className = 'isoLayer';
  let bridgeHtml = '';
  for(let i = 1; i < total; i++){
    if(pts[i].newEtapa) bridgeHtml += isoBridgeSvg(pts[i - 1], pts[i], i > unlocked, ISO.SCENE_W, H);
  }
  bridgeLayer.innerHTML = bridgeHtml;

  const pathLayer = document.createElement('div');
  pathLayer.className = 'isoLayer';
  pathLayer.innerHTML = pathHtml;

  const front = document.createElement('div');
  front.className = 'isoLayer isoDecor';
  front.innerHTML = isoDecorFrontHtml(pts, total, free, obst, signs, pts.map(p => isoZoneThemes(NL.etapaNames[p.node.etapaIdx] === cat ? '' : NL.etapaNames[p.node.etapaIdx])));

  // Nodos (botones reales, encima de todo)
  const nodesLayer = document.createElement('div');
  nodesLayer.className = 'isoLayer isoNodes';
  let doneCount = 0;
  for(let i = 0; i < total; i++){
    const p = pts[i], node = p.node;
    const isExam = node.type === 'exam';
    const locked = i > unlocked;
    const done = !locked && isStageComplete(cat, i);
    if(done) doneCount++;
    const isCooldownNode = !locked && !done && i === unlocked && cooldownMs > 0;
    const active = !locked && !done && !isCooldownNode;

    if(p.newEtapa){
      const sg = signs.find(s => s.i === i);
      const isle = document.createElement('div');
      isle.className = 'isoSignIsle' + (sg.lk ? ' lk' : '');
      isle.style.left = Math.round(sg.x - 56) + 'px';
      isle.style.top = Math.round(sg.y - 28) + 'px';
      isle.style.setProperty('--d', String(i % 5));
      isle.innerHTML = isoPillarSvg(30, 112);
      const sign = document.createElement('div'); sign.className = 'isoSign';
      const board = document.createElement('div'); board.className = 'isoBoard'; board.textContent = sg.name;
      const post = document.createElement('div'); post.className = 'isoPost';
      sign.appendChild(board); sign.appendChild(post);
      isle.appendChild(sign);
      if(sg.hang) isle.insertAdjacentHTML('beforeend', sg.hang);
      nodesLayer.appendChild(isle);
    }

    // Detalles "blueprint": anillo tenue, puntos laterales y marca de esquina
    const ring = document.createElement('div');
    ring.className = 'isoRing' + (active ? ' on' : '');
    ring.style.left = Math.round(p.cx - 48) + 'px';
    ring.style.top = Math.round(p.pcy - 40) + 'px';
    nodesLayer.appendChild(ring);
    const marks = document.createElement('div');
    marks.className = 'isoMarks';
    marks.style.left = Math.round(p.cx - 76) + 'px';
    marks.style.top = Math.round(p.pcy) + 'px';
    marks.innerHTML = '<i class="mk mkL"></i><i class="mk mkR"></i><i class="mkTick"></i>';
    nodesLayer.appendChild(marks);

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pathNode' + (active ? ' active' : '') + (locked ? ' locked' : '') + (done ? ' done' : '') +
                  (isExam ? ' examNode' : '') + (isCooldownNode ? ' seccion-cooldown' : '');
    b.dataset.stage = String(i);
    b.style.left = Math.round(p.cx - ISO.PUCK_W / 2) + 'px';
    b.style.top = Math.round(p.pcy - ISO.PUCK_H / 2) + 'px';
    if(locked) b.innerHTML = ISO_LOCK_SVG;
    else if(isExam && !done && !isCooldownNode) b.innerHTML = ISO_MEDAL_SVG;
    else if(isCooldownNode) b.innerHTML = ISO_HOURGLASS_SVG;
    else b.textContent = done ? '✓' : String(i + 1);
    b.setAttribute('aria-label', stageName(cat, i) + (locked ? ' (bloqueada)' : ''));
    b.disabled = locked;
    b.onclick = () => showLesson(cat, i);
    nodesLayer.appendChild(b);

    const lab = document.createElement('span');
    lab.className = 'nodeLabel';
    lab.style.left = Math.round(p.cx - 62) + 'px';
    lab.style.top = Math.round(p.pcy + ISO.PUCK_H / 2 + 12) + 'px';
    lab.textContent = stageName(cat, i);
    nodesLayer.appendChild(lab);

    if(done && isExam){
      const st = examStarsOf(cat, i);
      const sp = document.createElement('span');
      sp.className = 'nodeStars';
      sp.setAttribute('aria-label', st + ' de 3 estrellas');
      sp.textContent = '★'.repeat(st) + '☆'.repeat(3 - st);
      sp.style.left = Math.round(p.cx - 62) + 'px';
      sp.style.top = Math.round(p.pcy + ISO.PUCK_H / 2 + 28) + 'px';
      nodesLayer.appendChild(sp);
    }

    if(isCooldownNode){
      const t = document.createElement('span');
      t.className = 'nodeTimer';
      t.id = 'cooldownTimer-' + i;
      t.dataset.node = String(i);
      t.style.left = Math.round(p.cx - 62) + 'px';
      t.style.top = Math.round(p.pcy + ISO.PUCK_H / 2 + 28) + 'px';
      t.textContent = fmtHhMmSs(cooldownMs);
      nodesLayer.appendChild(t);
    }

    if(done && !isExam){
      const reviewBtn = document.createElement('button');
      reviewBtn.type = 'button';
      reviewBtn.className = 'nodeReviewBtn';
      reviewBtn.innerHTML = '<img class="nodeReviewIcon" src="./assets/stickers/ajolotes_emociones/sonriente_relajado.png" alt="Repasar" width="24" height="24">';
      reviewBtn.title = 'Repasar esta sección';
      reviewBtn.style.left = Math.round(p.cx + 46) + 'px';
      reviewBtn.style.top = Math.round(p.pcy - 6) + 'px';   // a la altura del disco, fuera del camino hacia el nodo siguiente
      reviewBtn.onclick = (e) => { e.stopPropagation(); startStageReview(cat, i); };
      nodesLayer.appendChild(reviewBtn);
    }
  }

  // ---- 3) Montaje ----
  scene.appendChild(defs);
  scene.appendChild(decor);
  scene.appendChild(pillars);
  scene.appendChild(bridgeLayer);
  scene.appendChild(pathLayer);
  scene.appendChild(front);
  scene.appendChild(nodesLayer);
  stage.appendChild(scene);
  wrap.innerHTML = '';
  wrap.classList.add('isoMap');
  wrap._isoSig = sig;
  const fadeTop = document.createElement('div'); fadeTop.className = 'isoFade top';
  const fadeBot = document.createElement('div'); fadeBot.className = 'isoFade bot';
  wrap.appendChild(fadeTop);
  wrap.appendChild(stage);
  wrap.appendChild(fadeBot);
  S._isoStage = stage; S._isoScene = scene; S._isoSceneH = H;
  isoApplyScale();
  if(!S._isoResizeBound){
    S._isoResizeBound = true;
    const sm = document.getElementById('stageMapView');
    if(sm) sm.addEventListener('scroll', fxOnScroll, { passive: true });
    let raf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        isoApplyScale();
        // los carteles/islas dependen del espacio libre a los lados: si cambia mucho (p. ej. de escritorio a móvil), se reconstruye
        const w = document.getElementById('pathWrap'), m = document.getElementById('stageMapView');
        if(!w || !m || m.style.display === 'none' || !w.classList.contains('isoMap') || !w.clientWidth) return;
        const f = (w.clientWidth / isoScaleK(w.clientWidth) - ISO.SCENE_W) / 2;
        if((f >= ISO_FREE_MIN) !== (S._isoFreeBuilt >= ISO_FREE_MIN) || (f >= ISO_FREE_MIN && Math.abs(f - S._isoFreeBuilt) > 30)){
          const ratio = m.scrollTop / Math.max(1, m.scrollHeight);
          buildPathMap();
          requestAnimationFrame(() => requestAnimationFrame(() => { m.scrollTop = ratio * m.scrollHeight; }));
        }
      });
    });
  }

  const totalItems = mapItemsFor(cat).length;
  const masteredN = mapItemsFor(cat).filter(it => isMastered(it[3])).length;
  document.getElementById('mapSub').textContent =
    doneCount + '/' + total + ' secciones completadas · ' + masteredN + '/' + totalItems + ' tarjetas dominadas';
  requestAnimationFrame(() => {
    const target = wrap.querySelector('.pathNode.active') || wrap.querySelector('.pathNode.seccion-cooldown') || wrap.querySelector('.pathNode:not(.locked)');
    if(target) target.scrollIntoView({block: 'center', behavior: 'auto'});
  });
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [902, function(){
S._isoStage = null;
  }],
  [902, function(){
S._isoScene = null;
  }],
  [902, function(){
S._isoSceneH = 0;
  }],
  [902, function(){
S._isoResizeBound = false;
  }],
  [902, function(){
S._isoFreeBuilt = 0;
  }],
  [1093, function(){
fxApply();
  }],
  [1094, function(){
{ const fxBtn = document.getElementById('fxToggleBtn'); if(fxBtn) fxBtn.onclick = () => { fxSet(fxMode() === 'lite' ? 'full' : 'lite'); }; }
  }]
];

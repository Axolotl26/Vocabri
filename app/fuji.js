// Vocabri — Ruta del abecedario como ascenso al monte Fuji (2.5D).
// Todo está en coordenadas de una escena de 420 de ancho (se escala a la pantalla). Las funciones son puras (sin DOM) para poder probarlas.
export const W = 420, CX = 210, RS = 150, GAP = 112, PADX = 52, SP = 96, TOPPAD = 380, BOT = 84, MARGIN = 26;
/** Semiancho de la montaña a una distancia `d` (en unidades de escena) medida desde la base. */
export const hwD = d => 132 + 78 * Math.pow(Math.max(0, 1 - d / 2600), 1.2);

/** Reparte los nodos en tramos en zigzag (de abajo hacia arriba). counts = nodos por nivel (nivel 1 abajo). */
export function layoutFuji(counts){
  const nodes = [], signs = [], rows = [];
  let d = BOT, rowIdx = 0;
  counts.forEach((n, gi) => {
    signs.push({ gi, d: d + GAP / 2 }); d += GAP;
    let left = n, ni = 0;
    while(left > 0){
      const hw = hwD(d + RS / 2);
      const cap = Math.min(6, Math.max(2, Math.floor(2 * (hw - PADX) / SP) + 1));
      const take = Math.ceil(left / Math.ceil(left / cap));
      const span = 2 * (hw - PADX), sp = take > 1 ? Math.min(span / (take - 1), 100) : 0;
      const dir = rowIdx % 2 === 0 ? 1 : -1;
      for(let k = 0; k < take; k++){
        const u = (k - (take - 1) / 2) * sp, wave = take > 1 ? Math.sin(k / (take - 1) * Math.PI) * 12 : 0;
        nodes.push({ gi, ni: ni++, row: rowIdx, x: Math.round((CX + dir * u) * 10) / 10, dist: d + RS / 2 + wave });
      }
      rows.push({ dist: d + RS / 2, hw, take });
      left -= take; d += RS; rowIdx++;
    }
  });
  const H = d + TOPPAD, Y = dist => Math.round((H - dist) * 10) / 10;
  nodes.forEach(n => { n.y = Y(n.dist); }); signs.forEach(s => { s.y = Y(s.d); }); rows.forEach(r => { r.y = Y(r.dist); });
  return { H, nodes, signs, rows, apexY: rows[rows.length - 1].y - 200 };
}

const f1 = v => Math.round(v * 10) / 10;
const smooth = pts => {
  let d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
  for(let i = 1; i < pts.length - 1; i++){ const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += ' Q' + f1(pts[i][0]) + ' ' + f1(pts[i][1]) + ' ' + f1(m[0]) + ' ' + f1(m[1]); }
  const l = pts[pts.length - 1]; return d + ' L' + f1(l[0]) + ' ' + f1(l[1]);
};
/** Tramos del sendero entre nodos consecutivos (curvas suaves). */
export function trailSegments(nodes){
  const out = [];
  for(let i = 0; i < nodes.length - 1; i++){
    const p0 = nodes[i - 1] || nodes[i], p1 = nodes[i], p2 = nodes[i + 1], p3 = nodes[i + 2] || p2;
    const c1 = [p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6], c2 = [p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6];
    out.push('M' + p1.x + ' ' + p1.y + ' C' + f1(c1[0]) + ' ' + f1(c1[1]) + ' ' + f1(c2[0]) + ' ' + f1(c2[1]) + ' ' + p2.x + ' ' + p2.y);
  }
  return out;
}
const rnd = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

/** Montaña, sol, nieve, pinos, bandera y sendero como un SVG (sin nodos: esos son botones HTML encima). `done[i]` = tramo i recorrido. */
/** Colinas lejanas (desenfocadas) y suelo a todo el ancho visible: el fondo se extiende `ex` unidades a cada lado de la escena. */
function farScenery(H, ex){
  const x0 = -ex - 40, x1 = W + ex + 40, r = rnd(31);
  const hills = (base, amp, step, fill, op, blur) => {
    const pts = []; for(let x = x0; x <= x1 + step; x += step) pts.push([x, H - base - amp * (0.35 + 0.65 * r())]);
    let d = 'M' + f1(x0) + ' ' + (H + 30) + ' L' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
    for(let i = 1; i < pts.length - 1; i++){ const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += ' Q' + f1(pts[i][0]) + ' ' + f1(pts[i][1]) + ' ' + f1(m[0]) + ' ' + f1(m[1]); }
    return '<path d="' + d + ' L' + f1(x1) + ' ' + (H + 30) + ' Z" fill="' + fill + '" fill-opacity="' + op + '"' + (blur ? ' filter="url(#fjBlur' + blur + ')"' : '') + '/>';
  };
  return hills(760, 520, 130, '#c4b5fd', 0.5, 8) + hills(520, 330, 110, '#a5b4fc', 0.55, 5) + hills(300, 210, 90, '#6ee7b7', 0.55, 3) +
    '<rect x="' + f1(x0) + '" y="' + (H - 150) + '" width="' + f1(x1 - x0) + '" height="190" fill="url(#fjGround)"/>';
}
/** Pinos del suelo, fuera de la montaña (solo en pantallas anchas), siempre sobre colinas/suelo. */
function sidePines(H, ex, sil){
  if(ex < 24) return '';
  const r = rnd(97), out = [];
  for(let y = H - 320; y < H - 12; y += 14 + r() * 18){
    const lim = sil(y) + 20;
    [-1, 1].forEach(side => {
      const free = CX + ex + 20 - (CX + lim); if(free < 20) return;
      const n = Math.max(1, Math.round(free / 90));
      for(let k = 0; k < n; k++) if(r() < 0.6){ const x = CX + side * (lim + r() * free), sc = 0.5 + r() * 0.6;
        out.push('<g transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + f1(sc) + ')" opacity=".92"><rect x="-2" y="10" width="4" height="7" fill="#4a2c12"/><polygon points="0,-22 13,0 -13,0" fill="#1f6b3a"/><polygon points="0,-12 16,10 -16,10" fill="#15803d"/></g>'); }
    });
  }
  return out.join('');
}

export function fujiSvg(L, done, ex){
  ex = Math.max(0, Math.round(ex || 0));
  const { H, rows, apexY, nodes } = L, top = rows.slice().reverse();
  // Silueta del monte: sigue la franja de nodos (para no cortarlos) pero se ensancha en la base como un volcán de verdad.
  const topE = top[0].hw + MARGIN - 4, coneEnd = top[0].y - 12;
  const nodeEdge = y => {
    if(y <= apexY) return 34;
    if(y < coneEnd) return 34 + (topE - 34) * Math.pow((y - apexY) / (coneEnd - apexY), 0.62);
    for(let i = 0; i < top.length - 1; i++) if(y >= top[i].y && y <= top[i + 1].y){ const t = (y - top[i].y) / (top[i + 1].y - top[i].y); return top[i].hw + (top[i + 1].hw - top[i].hw) * t + MARGIN; }
    return hwD(0) + MARGIN + 10;
  };
  const BASE_HW = 720;   // semiancho en la base; en pantallas estrechas se recorta por los lados
  const sil = y => { const t = Math.max(0, Math.min(1, (y - apexY) / (H - apexY))), a = nodeEdge(y), b = BASE_HW * Math.pow(t, 1.25); return Math.pow(a * a * a + b * b * b, 1 / 3); };
  const edge = side => { const pts = []; for(let y = apexY; y < H + 10; y += 46) pts.push([CX + side * sil(y), y]); pts.push([CX + side * sil(H + 10), H + 10]); return pts; };
  const Lp = edge(-1), Rp = edge(1);
  const body = smooth(Lp) + ' L' + f1(Rp[Rp.length - 1][0]) + ' ' + f1(H + 10) + ' ' + smooth(Rp.slice().reverse()).replace(/^M[^Q L]+ [^Q L]+/, 'L' + f1(Rp[Rp.length - 1][0]) + ' ' + f1(Rp[Rp.length - 1][1])) + ' Z';
  const jx = [40, 10, 56, 4, 48, 0, 54, 12, 46, 6, 52, 8], sy = apexY + 156, jag = [];
  for(let i = 0; i <= 12; i++) jag.push([i * 35, sy + jx[i % 12]]);
  const snow = '0,' + (apexY - 12) + ' 420,' + (apexY - 12) + ' ' + jag.slice().reverse().map(p => p[0] + ',' + p[1]).join(' ');
  const snowR = CX + 6 + ',' + (apexY - 12) + ' 420,' + (apexY - 12) + ' ' + jag.filter(p => p[0] >= CX).reverse().map(p => p[0] + ',' + p[1]).join(' ') + ' ' + (CX + 6) + ',' + (sy + 30);
  // pinos solo sobre la montaña (en la franja de nodos y en las faldas que se ensanchan), nunca en el cielo
  const r = rnd(7), pines = [];
  const pine = (x, y, sc) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + f1(sc) + ')"><rect x="-2" y="10" width="4" height="7" fill="#4a2c12"/><polygon points="0,-22 13,0 -13,0" fill="#1f6b3a"/><polygon points="0,-12 16,10 -16,10" fill="#15803d"/><polygon points="0,-12 16,10 0,10" fill="#0f5a2c"/></g>';
  for(let y = H - 3500; y < H - 30; y += 20 + r() * 26){
    [-1, 1].forEach(side => {
      const ne = nodeEdge(y), se = sil(y);
      if(r() < 0.78) pines.push(pine(CX + side * (ne - 6 - r() * 34), y, 0.7 + r() * 0.65));
      if(se - ne > 40){ const n = Math.min(3, Math.round((se - ne) / 95)); for(let k = 0; k < n; k++) if(r() < 0.7) pines.push(pine(CX + side * (ne + 14 + r() * (se - ne - 30)), y + r() * 14, 0.7 + r() * 0.7)); }
    });
  }
  // grietas / facetas en la roca (efecto 2.5D)
  const ridges = [-150, -90, -40, 30, 80, 140].map((o, i) => '<path d="M' + (CX + o * 0.16) + ' ' + (apexY + 20) + ' Q' + (CX + o * 0.5) + ' ' + (apexY + 520) + ' ' + (CX + o * 3.4) + ' ' + (H - 60) + '" fill="none" stroke="' + (i % 2 ? 'rgba(255,255,255,.09)' : 'rgba(5,3,30,.16)') + '" stroke-width="' + (i % 2 ? 5 : 8) + '" stroke-linecap="round"/>').join('');
  const seg = trailSegments(nodes);
  const trail = '<g transform="translate(0 9)" fill="none" stroke="#1a1030" stroke-opacity=".45" stroke-width="27" stroke-linecap="round">' + seg.map(d => '<path d="' + d + '"/>').join('') + '</g>' +
    '<g fill="none" stroke-linecap="round"><g stroke="#8a5a2b" stroke-width="25">' + seg.map(d => '<path d="' + d + '"/>').join('') + '</g>' +
    '<g stroke="#f1d9a8" stroke-width="20">' + seg.map(d => '<path d="' + d + '"/>').join('') + '</g>' +
    '<g stroke="#fff7e0" stroke-width="2.5" stroke-dasharray="1 11" stroke-opacity=".9">' + seg.map(d => '<path d="' + d + '"/>').join('') + '</g>' +
    '<g stroke="#fbbf24" stroke-width="9" class="fjDone">' + seg.map((d, i) => done[i] ? '<path d="' + d + '"/>' : '').join('') + '</g></g>';
  return '<svg class="fjSvg" viewBox="' + (-ex) + ' 0 ' + (W + 2 * ex) + ' ' + H + '" width="' + (W + 2 * ex) + '" height="' + H + '" style="left:' + (-ex) + 'px" aria-hidden="true"><defs>' +
    '<filter id="fjBlur8" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="8"/></filter><filter id="fjBlur5" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="4.5"/></filter><filter id="fjBlur3" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>' +
    '<linearGradient id="fjGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ade80" stop-opacity="0"/><stop offset=".45" stop-color="#2d8a5a" stop-opacity=".9"/><stop offset="1" stop-color="#14532d"/></linearGradient>' +
    '<clipPath id="fjBody"><path d="' + body + '"/></clipPath>' +
    '<linearGradient id="fjRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d5fc7"/><stop offset=".4" stop-color="#5a55b8"/><stop offset=".72" stop-color="#3f6f8f"/><stop offset="1" stop-color="#2d6a4f"/></linearGradient>' +
    '<linearGradient id="fjTree" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14532d" stop-opacity="0"/><stop offset="1" stop-color="#14532d" stop-opacity=".92"/></linearGradient>' +
    '<radialGradient id="fjSunG"><stop offset=".45" stop-color="#fb7185" stop-opacity=".55"/><stop offset="1" stop-color="#fb7185" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="fjSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb7185"/><stop offset="1" stop-color="#e11d48"/></linearGradient></defs>' +
    farScenery(H, ex) +
    '<circle cx="' + CX + '" cy="' + (apexY + 10) + '" r="210" fill="url(#fjSunG)"/><circle cx="' + CX + '" cy="' + (apexY + 12) + '" r="104" fill="url(#fjSun)"/>' +
    '<path d="' + body + '" fill="url(#fjRock)"/>' +
    '<g clip-path="url(#fjBody)"><polygon points="' + (CX + 6) + ',' + apexY + ' 1000,' + apexY + ' 1000,' + (H + 20) + ' ' + (CX + 70) + ',' + (H + 20) + '" fill="#05031e" fill-opacity=".3"/>' +
    '<polygon points="-700,' + apexY + ' ' + (CX + 6) + ',' + apexY + ' ' + (CX + 70) + ',' + (H + 20) + ' -700,' + (H + 20) + '" fill="#fff" fill-opacity=".05"/>' + ridges +
    '<rect x="-800" y="' + (H - 2600) + '" width="2000" height="2620" fill="url(#fjTree)"/>' +
    '<polygon points="' + snow + '" fill="#f8fafc"/><polygon points="' + snowR + '" fill="#94a3b8" fill-opacity=".55"/></g>' +
    '<ellipse cx="' + CX + '" cy="' + (apexY + 3) + '" rx="34" ry="7.5" fill="#e2e8f0"/><ellipse cx="' + CX + '" cy="' + (apexY + 5) + '" rx="26" ry="4.6" fill="#64748b"/>' +
    sidePines(H, ex, sil) + pines.join('') + trail +
    '<g transform="translate(' + CX + ' ' + (apexY - 2) + ')"><line x1="0" y1="0" x2="0" y2="-54" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="1" y="-54" width="34" height="22" rx="2" fill="#fff" stroke="#cbd5e1"/><circle cx="18" cy="-43" r="6.5" fill="#e11d48"/></g></svg>';
}

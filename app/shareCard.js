// Vocabri — tarjeta para compartir el progreso (imagen 1080×1440, estilo cartoon de la app).
// Usa los colores del tema activo, el ajolote del tema y los mismos iconos SVG cartoon que el resto de la app.
import { emojiSvg } from './emojiIcons.js';
import { qrMatrix } from './core/qr.js';

export const CARD_W = 1080, CARD_H = 1700;
const FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';

// ---------- color ----------
const hex = c => { c = String(c || '#888').trim(); if(c[0] !== '#') return [136, 136, 136]; if(c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) || 0); };
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const alpha = (c, a) => { const [r, g, b] = hex(c); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };

// ---------- dibujo ----------
function rr(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : (ctx.moveTo(x + r, y), ctx.arcTo(x + w, y, x + w, y + h, r), ctx.arcTo(x + w, y + h, x, y + h, r), ctx.arcTo(x, y + h, x, y, r), ctx.arcTo(x, y, x + w, y, r), ctx.closePath()); }
// forma cartoon: sombra "3D" debajo, relleno y borde grueso
function chunk(ctx, x, y, w, h, r, fill, edge, lw, depth){
  rr(ctx, x, y + depth, w, h, r); ctx.fillStyle = edge; ctx.fill();
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = edge; ctx.lineJoin = 'round'; ctx.stroke();
}
function outlined(ctx, text, x, y, fill, edge, lw){
  ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = edge; ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
function spark(ctx, x, y, r, fill){
  ctx.beginPath(); ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function star(ctx, x, y, R, fill){
  ctx.beginPath();
  for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .45 : R; ctx[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}

// ---------- imágenes ----------
function loadImg(src){
  return new Promise(res => { if(!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
const SVG_CSS = '<style>.niEd *{fill:var(--e);stroke:var(--e);stroke-width:2.2;stroke-linejoin:round}.niMn>*{fill:var(--c);stroke:var(--e);stroke-width:2.2;stroke-linejoin:round}.niLn{fill:none;stroke-linecap:round}.niEd .niLn{stroke:var(--e);stroke-width:6.6}.niMn .niLn{stroke:var(--c);stroke-width:3.4}</style>';
export function iconSvgStandalone(emoji, px){
  const svg = emojiSvg(emoji); if(!svg) return '';
  return svg.replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" ').replace(/>/, '>' + SVG_CSS);
}
function iconImg(emoji, px){
  const s = iconSvgStandalone(emoji, px); if(!s) return Promise.resolve(null);
  return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s));
}

/** data: { theme:{primary,secondary,bg,dark}, level, xpInLevel, xpNeeded, xpTotal, streak, mastered, activeDays, totalLearned, xpToday, dailyGoal, category, userName, joinUrl, stickerSrc, fallbackSrc } */
export async function renderShareCard(d){
  try{ await Promise.all(['900 40px Nunito', '800 28px Nunito', '700 24px Nunito'].map(f => document.fonts && document.fonts.load(f))); }catch(e){}
  const P = d.theme.primary, S2 = d.theme.secondary || P;
  const EDGE = mix(P, '#000000', .62), PAPER = mix('#FFFFFF', P, .07);
  const tiles = [
    { e: '🔥', c: '#FB923C', v: d.streak, l: d.streak === 1 ? 'día de racha' : 'días de racha' },
    { e: '⭐', c: '#FACC15', v: d.mastered, l: 'frases dominadas' },
    { e: '📅', c: '#38BDF8', v: d.activeDays, l: 'días activo' },
    { e: '📚', c: '#A78BFA', v: d.totalLearned, l: 'frases aprendidas' },
    { e: '✨', c: '#F472B6', v: d.xpTotal, l: 'XP total' },
    { e: '🎯', c: '#4ADE80', v: Math.min(d.xpToday, 99999) + '/' + d.dailyGoal, l: 'XP de hoy' },
  ];
  const [axo, fb, ...icons] = await Promise.all([loadImg(d.stickerSrc), loadImg(d.fallbackSrc), ...tiles.map(t => iconImg(t.e, 160))]);
  const hero = axo || fb;

  const cv = document.createElement('canvas'); cv.width = CARD_W; cv.height = CARD_H;
  const ctx = cv.getContext('2d'); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

  // fondo: degradado del tema + puntos + confeti
  const g = ctx.createLinearGradient(0, 0, CARD_W * .6, CARD_H); g.addColorStop(0, mix(P, '#FFFFFF', .12)); g.addColorStop(.55, P); g.addColorStop(1, mix(S2, '#000000', .18));
  ctx.fillStyle = g; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  for(let y = 30; y < CARD_H; y += 60) for(let x = (y / 60) % 2 ? 60 : 30; x < CARD_W; x += 60){ ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
  const bub = (x, y, r, a) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.fill(); };
  bub(160, 210, 190, .10); bub(940, 150, 140, .12); bub(1010, 520, 90, .10); bub(70, 640, 70, .10);
  spark(ctx, 120, 90, 34, 'rgba(255,255,255,.85)'); spark(ctx, 930, 80, 26, 'rgba(255,255,255,.7)'); spark(ctx, 1000, 330, 22, 'rgba(255,255,255,.6)'); spark(ctx, 70, 400, 24, 'rgba(255,255,255,.65)');
  star(ctx, 190, 330, 26, '#FDE047'); star(ctx, 890, 400, 20, '#FDE047'); star(ctx, 980, 60, 16, '#FDE68A');

  // título
  ctx.font = '900 104px ' + FONT; outlined(ctx, 'Vocabri', CARD_W / 2, 150, '#FFFFFF', EDGE, 22);
  ctx.font = '800 34px ' + FONT;
  const sub = 'MI PROGRESO EN INGLÉS', sw = ctx.measureText(sub).width + 70;
  chunk(ctx, CARD_W / 2 - sw / 2, 180, sw, 58, 29, mix(P, '#FFFFFF', .85), EDGE, 6, 6);
  ctx.fillStyle = EDGE; ctx.fillText(sub, CARD_W / 2, 220);

  // panel principal
  const PX = 60, PY = 540, PW = CARD_W - 120, PH = 812;
  chunk(ctx, PX, PY, PW, PH, 64, PAPER, EDGE, 10, 18);
  ctx.save(); rr(ctx, PX + 8, PY + 8, PW - 16, PH - 16, 58); ctx.clip();
  ctx.fillStyle = alpha(P, .10); for(let y = PY + 20; y < PY + PH; y += 36) for(let x = PX + ((y / 36) % 2 ? 40 : 22); x < PX + PW; x += 36){ ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); }
  ctx.restore();

  // ajolote
  const AS = 350, AY = 255;
  ctx.beginPath(); ctx.ellipse(CARD_W / 2, AY + AS - 8, 150, 26, 0, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fill();
  if(hero){ const sc = Math.min(AS / hero.width, AS / hero.height), w = hero.width * sc, h = hero.height * sc; ctx.drawImage(hero, CARD_W / 2 - w / 2, AY + AS - h, w, h); }
  else { chunk(ctx, CARD_W / 2 - 140, AY + 60, 280, 280, 140, '#F9A8D4', EDGE, 10, 14); ctx.font = '900 150px ' + FONT; ctx.fillStyle = EDGE; ctx.fillText('V', CARD_W / 2, AY + 255); }

  // nombre y categoría
  let y = PY + 118;
  ctx.font = '900 62px ' + FONT; ctx.fillStyle = EDGE;
  const name = d.userName && d.userName !== 'Usuario' ? d.userName : '¡Sigo aprendiendo!';
  let nm = name; while(ctx.measureText(nm).width > PW - 140 && nm.length > 4) nm = nm.slice(0, -2); if(nm !== name) nm += '…';
  ctx.fillText(nm, CARD_W / 2, y);
  ctx.font = '800 30px ' + FONT;
  const ctext = d.category, cw = ctx.measureText(ctext).width + 72;
  chunk(ctx, CARD_W / 2 - cw / 2, y + 28, cw, 56, 28, mix(P, '#FFFFFF', .8), EDGE, 5, 5);
  ctx.fillStyle = EDGE; ctx.fillText(ctext, CARD_W / 2, y + 66);

  // nivel + barra de XP
  const LY = y + 100;
  const bx = PX + 56, by = LY + 20;
  chunk(ctx, bx + 150, by + 40, PW - 112 - 150, 50, 25, mix(P, '#FFFFFF', .78), EDGE, 6, 6);
  const frac = Math.max(0.04, Math.min(1, d.xpInLevel / (d.xpNeeded || 1)));
  const fx = bx + 150 + 3, fw = (PW - 112 - 150 - 6) * frac;
  rr(ctx, fx, by + 43, fw, 44, 22); const bg = ctx.createLinearGradient(fx, 0, fx + fw, 0); bg.addColorStop(0, S2); bg.addColorStop(1, P); ctx.fillStyle = bg; ctx.fill();
  rr(ctx, fx + 10, by + 50, Math.max(0, fw - 20), 9, 5); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
  ctx.textAlign = 'left'; ctx.font = '900 46px ' + FONT; ctx.fillStyle = EDGE; ctx.fillText('Nivel ' + d.level, bx + 150, by + 20);
  ctx.textAlign = 'right'; ctx.font = '800 28px ' + FONT; ctx.fillStyle = mix(EDGE, '#FFFFFF', .25); ctx.fillText(d.xpInLevel + ' / ' + d.xpNeeded + ' XP', bx + PW - 112, by + 20);
  ctx.textAlign = 'center';
  // medalla de nivel
  const mx = bx + 66, my = by + 62;
  ctx.beginPath(); ctx.arc(mx, my + 10, 74, 0, 7); ctx.fillStyle = EDGE; ctx.fill();
  ctx.beginPath(); ctx.arc(mx, my, 74, 0, 7); ctx.fillStyle = '#FACC15'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = EDGE; ctx.stroke();
  ctx.beginPath(); ctx.arc(mx, my, 56, 0, 7); ctx.fillStyle = '#FDE047'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#B45309'; ctx.stroke();
  ctx.font = '900 ' + (String(d.level).length > 2 ? 50 : 64) + 'px ' + FONT; outlined(ctx, String(d.level), mx, my + 22, '#FFFFFF', '#B45309', 10);

  // 6 estadísticas
  const TY = by + 164, TW = 276, TH = 176, GAP = 22, TX = PX + (PW - (TW * 3 + GAP * 2)) / 2;
  tiles.forEach((t, i) => {
    const x = TX + (i % 3) * (TW + GAP), yy = TY + Math.floor(i / 3) * (TH + 26);
    const fill = mix('#FFFFFF', t.c, .22), edge = mix(t.c, '#000000', .5);
    chunk(ctx, x, yy, TW, TH, 34, fill, edge, 6, 10);
    rr(ctx, x + 14, yy + 12, TW - 28, 10, 5); ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fill();
    if(icons[i]) ctx.drawImage(icons[i], x + TW / 2 - 36, yy + 20, 72, 72);
    ctx.font = '900 ' + (String(t.v).length > 6 ? 40 : 54) + 'px ' + FONT; ctx.fillStyle = edge; ctx.fillText(String(t.v), x + TW / 2, yy + 134);
    ctx.font = '800 25px ' + FONT; ctx.fillStyle = mix(edge, '#FFFFFF', .2); ctx.fillText(t.l, x + TW / 2, yy + 164);
  });

  // pie: invitación + código QR para que otras personas entren a jugar
  const left = PX + 6;
  ctx.textAlign = 'left';
  ctx.font = '900 76px ' + FONT; outlined(ctx, '¡Juega conmigo!', left, 1490, '#FFFFFF', EDGE, 16);
  ctx.font = '800 31px ' + FONT; ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Escanea el código y aprende', left, 1545);
  ctx.fillText('inglés con ajolotes.', left, 1586);
  ctx.font = '700 26px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillText(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), left, 1640);
  ctx.textAlign = 'center';
  if(d.joinUrl){
    let m = null; try{ m = qrMatrix(d.joinUrl); }catch(e){}
    if(m){
      const BOX = 270, bx2 = PX + PW - BOX, by2 = 1392, quiet = 2, cell = Math.floor((BOX - 28) / (m.length + quiet * 2));
      chunk(ctx, bx2, by2, BOX, BOX, 36, '#FFFFFF', EDGE, 8, 12);
      const qs = cell * (m.length + quiet * 2), ox = bx2 + (BOX - qs) / 2 + quiet * cell, oy = by2 + (BOX - qs) / 2 + quiet * cell;
      ctx.fillStyle = mix(EDGE, '#000000', .55);
      m.forEach((row, y) => row.forEach((on, x) => { if(on) ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell); }));
    }
  }
  return cv;
}

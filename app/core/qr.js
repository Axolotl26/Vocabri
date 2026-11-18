// Vocabri — generador de códigos QR (puro, sin dependencias). Modo byte (UTF-8), corrección de errores M, versiones 1–12.
// Basado en el algoritmo estándar ISO/IEC 18004; la salida es una matriz de booleanos (true = módulo oscuro).
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22];     // nivel M, por versión
const NUM_BLOCKS    = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8];
export const QR_MAX_VERSION = 12;

function rawModules(v){
  let r = (16 * v + 128) * v + 64;
  if(v >= 2){ const a = Math.floor(v / 7) + 2; r -= (25 * a - 10) * a - 55; if(v >= 7) r -= 36; }
  return r;
}
const dataCodewords = v => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * NUM_BLOCKS[v];

function utf8(text){ return Array.from(new TextEncoder().encode(String(text))); }

function gfMul(x, y){ let z = 0; for(let i = 7; i >= 0; i--){ z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
function rsDivisor(deg){
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for(let i = 0; i < deg; i++){ for(let j = 0; j < r.length; j++){ r[j] = gfMul(r[j], root); if(j + 1 < r.length) r[j] ^= r[j + 1]; } root = gfMul(root, 2); }
  return r;
}
function rsRemainder(data, div){
  const r = new Array(div.length).fill(0);
  for(const b of data){ const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); }
  return r;
}

function buildCodewords(bytes, ver){
  const cap = dataCodewords(ver), bits = [];
  const put = (val, len) => { for(let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  while(bits.length % 8) bits.push(0);
  for(let pad = 0xEC; bits.length < cap * 8; pad ^= 0xEC ^ 0x11) put(pad, 8);
  const data = []; for(let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  const nb = NUM_BLOCKS[ver], ecc = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
  const shortLen = Math.floor(raw / nb), numShort = nb - raw % nb, div = rsDivisor(ecc), blocks = [];
  for(let i = 0, k = 0; i < nb; i++){
    const dat = data.slice(k, k + shortLen - ecc + (i < numShort ? 0 : 1)); k += dat.length;
    const e = rsRemainder(dat, div); if(i < numShort) dat.push(0);
    blocks.push(dat.concat(e));
  }
  const out = [];
  for(let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if(i !== shortLen - ecc || j >= numShort) out.push(b[i]); });
  return out;
}

export function qrMatrix(text){
  const bytes = utf8(text);
  let ver = 1;
  while(ver <= QR_MAX_VERSION && 4 + (ver < 10 ? 8 : 16) + bytes.length * 8 > dataCodewords(ver) * 8) ver++;
  if(ver > QR_MAX_VERSION) throw new Error('Texto demasiado largo para el QR');
  const size = ver * 4 + 17;
  const mod = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { if(x >= 0 && x < size && y >= 0 && y < size){ mod[y][x] = dark; fn[y][x] = true; } };
  for(let i = 0; i < size; i++){ set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => { for(let dy = -4; dy <= 4; dy++) for(let dx = -4; dx <= 4; dx++){ const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); } });
  if(ver > 1){
    const n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, pos = [6];
    for(let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
    pos.forEach((cy, i) => pos.forEach((cx, j) => {
      if((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
      for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
  }
  const bit = (v, i) => ((v >>> i) & 1) !== 0;
  const drawFormat = mask => {      // nivel M = 0
    const data = (0 << 3) | mask; let rem = data;
    for(let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((data << 10) | rem) ^ 0x5412;
    for(let i = 0; i <= 5; i++) set(8, i, bit(b, i));
    set(8, 7, bit(b, 6)); set(8, 8, bit(b, 7)); set(7, 8, bit(b, 8));
    for(let i = 9; i < 15; i++) set(14 - i, 8, bit(b, i));
    for(let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(b, i));
    for(let i = 8; i < 15; i++) set(8, size - 15 + i, bit(b, i));
    set(8, size - 8, true);
  };
  drawFormat(0);
  if(ver >= 7){
    let rem = ver; for(let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    const b = (ver << 12) | rem;
    for(let i = 0; i < 18; i++){ const a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, bit(b, i)); set(c, a, bit(b, i)); }
  }
  // datos en zigzag
  const cw = buildCodewords(bytes, ver);
  for(let i = 0, right = size - 1; right >= 1; right -= 2){
    if(right === 6) right = 5;
    for(let vert = 0; vert < size; vert++) for(let j = 0; j < 2; j++){
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if(!fn[y][x] && i < cw.length * 8){ mod[y][x] = bit(cw[i >>> 3], 7 - (i & 7)); i++; }
    }
  }
  // máscara: se prueba cada una y se elige la de menor penalización
  const cond = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
    (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
  const penalty = m => {
    let p = 0;
    for(let pass = 0; pass < 2; pass++) for(let a = 0; a < size; a++){
      let run = 1;
      for(let b = 1; b < size; b++){
        const cur = pass ? m[b][a] : m[a][b], prev = pass ? m[b - 1][a] : m[a][b - 1];
        if(cur === prev){ run++; if(run === 5) p += 3; else if(run > 5) p++; } else run = 1;
      }
    }
    for(let y = 0; y < size - 1; y++) for(let x = 0; x < size - 1; x++){ const c = m[y][x]; if(c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
    const dark = m.reduce((s, r) => s + r.filter(Boolean).length, 0);
    return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  };
  let best = null, bestP = Infinity, bestMask = 0;
  for(let mk = 0; mk < 8; mk++){
    const m = mod.map((row, y) => row.map((v, x) => (!fn[y][x] && cond[mk](x, y)) ? !v : v));
    const pen = penalty(m); if(pen < bestP){ bestP = pen; best = m; bestMask = mk; }
  }
  // reescribe los bits de formato con la máscara elegida
  const out = best;
  const sets = (x, y, d) => { out[y][x] = d; };
  { const data = (0 << 3) | bestMask; let rem = data; for(let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((data << 10) | rem) ^ 0x5412;
    for(let i = 0; i <= 5; i++) sets(8, i, bit(b, i));
    sets(8, 7, bit(b, 6)); sets(8, 8, bit(b, 7)); sets(7, 8, bit(b, 8));
    for(let i = 9; i < 15; i++) sets(14 - i, 8, bit(b, i));
    for(let i = 0; i < 8; i++) sets(size - 1 - i, 8, bit(b, i));
    for(let i = 8; i < 15; i++) sets(8, size - 15 + i, bit(b, i));
    sets(8, size - 8, true); }
  return out;
}

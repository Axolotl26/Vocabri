// Descarga los trazos de KanjiVG (CC BY-SA 3.0) de los caracteres de los cursos de japonés a data/kanjivg/.
//
// Uso (Node 18 o superior), desde la RAÍZ del repositorio (donde está index.html):
//     node tools/fetch-kanjivg.mjs            → descarga lo que falte
//     node tools/fetch-kanjivg.mjs --force    → vuelve a descargar todo
//
// Lee los caracteres sueltos (kana y kanji) de data/ja/*.json, baja un SVG por carácter desde
// https://github.com/KanjiVG/kanjivg y los guarda como data/kanjivg/<unicode en hex de 5 cifras>.svg
// (por ejemplo, 日 → 065e5.svg). Puedes ejecutarlo varias veces: salta los que ya existen.
import fs from 'node:fs';
import path from 'node:path';

const force = process.argv.includes('--force');
const root = process.cwd();
const jaDir = path.join(root, 'data', 'ja');
if (!fs.existsSync(jaDir)) {
  console.error('✗ No encuentro data/ja/. Ejecuta el script desde la raíz del repositorio (la carpeta donde está index.html).');
  process.exit(1);
}
const outDir = path.join(root, 'data', 'kanjivg');
fs.mkdirSync(outDir, { recursive: true });

// 1) caracteres sueltos de todos los cursos de japonés
const chars = new Set();
for (const f of fs.readdirSync(jaDir).filter(f => f.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(jaDir, f), 'utf8'));
  for (const z of d.zones || []) for (const it of z.items || []) {
    const cs = [...String(it.ja || '')];
    if (cs.length === 1 && /[ぁ-ヿ一-鿿]/.test(cs[0])) chars.add(cs[0]);
  }
}
const list = [...chars];
console.log(`Caracteres a procesar: ${list.length}  (carpeta de destino: ${path.relative(root, outDir)})`);

// 2) descarga con reintentos
const base = process.env.KANJIVG_BASE || 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, skipped = 0, done = 0;
const failed = [];
async function one(ch) {
  const hex = ch.codePointAt(0).toString(16).padStart(5, '0');
  const dest = path.join(outDir, hex + '.svg');
  if (!force && fs.existsSync(dest) && fs.statSync(dest).size > 100) { skipped++; return; }
  let lastErr = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(base + hex + '.svg');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const txt = await r.text();
      if (!/<svg[\s>]/.test(txt)) throw new Error('respuesta que no es un SVG');
      fs.writeFileSync(dest, txt); ok++; return;
    } catch (e) { lastErr = e.message; await sleep(500 * attempt); }
  }
  failed.push(`${ch} (${hex}.svg: ${lastErr})`);
}
for (let i = 0; i < list.length; i += 6) {
  await Promise.all(list.slice(i, i + 6).map(one));
  done = Math.min(i + 6, list.length);
  process.stdout.write(`\r  ${done}/${list.length}`);
}
process.stdout.write('\n');

// 3) atribución obligatoria (CC BY-SA 3.0)
fs.writeFileSync(path.join(outDir, 'ATTRIBUTION.txt'),
  'Los datos de trazos proceden de KanjiVG (https://kanjivg.tagaini.net/), © Ulrich Apel y colaboradores,\n' +
  'licencia Creative Commons Atribución-CompartirIgual 3.0 (https://creativecommons.org/licenses/by-sa/3.0/).\n');

console.log(`✓ Descargados: ${ok} · ya estaban: ${skipped} · fallidos: ${failed.length}`);
if (failed.length) {
  console.log('Fallidos:\n  ' + failed.join('\n  '));
  console.log('Vuelve a ejecutar el script (reintenta solo los que faltan). Si siguen fallando, revisa tu conexión o abre la URL a mano en el navegador.');
  process.exit(2);
}
console.log('Listo. Sube la carpeta data/kanjivg/ junto con el resto del proyecto.');

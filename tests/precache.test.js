import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const precacheBlock = (sw) => (sw.match(/PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/) || [, ''])[1];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

test('todo módulo de app/ está en el precaché de sw.js (si no, no funciona sin conexión)', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const pre = new Set([...precacheBlock(sw).matchAll(/'\.\/([^'?]+\.js)'/g)].map(m => m[1]));
  const missing = walk(path.join(root, 'app')).filter(f => f.endsWith('.js'))
    .map(f => path.relative(root, f).split(path.sep).join('/')).filter(f => !pre.has(f));
  assert.deepEqual(missing, []);
});

test('el precaché no apunta a archivos inexistentes', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const gone = [...precacheBlock(sw).matchAll(/'\.\/([^'?]+\.(?:js|json))'/g)].map(m => m[1]).filter(f => !fs.existsSync(path.join(root, f)));
  assert.deepEqual(gone, []);
});

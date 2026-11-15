import test from 'node:test';
import assert from 'node:assert/strict';
import { diffWords, diffSummary } from '../app/core/wordDiff.js';

test('frase idéntica (ignora mayúsculas y puntuación)', () => {
  const r = diffWords('where is the bathroom', 'Where is the bathroom?');
  assert.ok(r.every(x => x.s === 'ok'));
});
test('palabra sustituida', () => {
  const r = diffWords('where is the batroom', 'Where is the bathroom?');
  assert.deepEqual(r.map(x => x.s), ['ok', 'ok', 'ok', 'wrong']);
  assert.equal(r[3].t, 'batroom'); assert.equal(r[3].w, 'bathroom?');
});
test('palabra que falta y palabra que sobra', () => {
  assert.deepEqual(diffWords('i need doctor', 'I need a doctor.').map(x => x.s), ['ok', 'ok', 'missing', 'ok']);
  assert.deepEqual(diffWords('i really need help', 'I need help.').map(x => x.s), ['ok', 'extra', 'ok', 'ok']);
});
test('vacíos y resumen', () => {
  assert.deepEqual(diffWords('', ''), []);
  assert.deepEqual(diffSummary(diffWords('a b', 'a c d')), { ok: 1, wrong: 1, missing: 1, extra: 0 });
});

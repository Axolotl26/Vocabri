import test from 'node:test';
import assert from 'node:assert/strict';
import { registerRows, hasWhy } from '../app/core/why.js';

test('registerRows marca solo la frase propia', () => {
  const r = registerRows({ formal: 'A', normal: 'A', informal: 'B' }, 'a');
  assert.equal(r.length, 3);
  assert.deepEqual(r.map(x => x.mine), [true, false, false]);
});
test('registerRows tolera datos vacíos', () => {
  assert.deepEqual(registerRows(null, 'x'), []);
  assert.deepEqual(registerRows({ formal: 'F' }, 'x').map(x => x.key), ['formal']);
});
test('hasWhy', () => {
  assert.equal(hasWhy('', null), false);
  assert.equal(hasWhy('nota', null), true);
  assert.equal(hasWhy('', { normal: 'x' }), true);
});

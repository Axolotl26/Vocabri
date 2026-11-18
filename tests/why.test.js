import { describe, it, expect } from 'vitest';
import { registerRows, hasWhy } from '../app/core/why.js';

describe('registerRows', () => {
  it('marca solo la frase propia', () => {
    const r = registerRows({ formal: 'A', normal: 'A', informal: 'B' }, 'a');
    expect(r.length).toBe(3);
    expect(r.map(x => x.mine)).toEqual([true, false, false]);
  });
  it('tolera datos vacíos', () => {
    expect(registerRows(null, 'x')).toEqual([]);
    expect(registerRows({ formal: 'F' }, 'x').map(x => x.key)).toEqual(['formal']);
  });
});

describe('hasWhy', () => {
  it('detecta si hay nota o comparador', () => {
    expect(hasWhy('', null)).toBe(false);
    expect(hasWhy('nota', null)).toBe(true);
    expect(hasWhy('', { normal: 'x' })).toBe(true);
  });
});

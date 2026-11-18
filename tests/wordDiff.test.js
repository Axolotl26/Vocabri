import { describe, it, expect } from 'vitest';
import { diffWords, diffSummary } from '../app/core/wordDiff.js';

describe('diffWords', () => {
  it('frase idéntica (ignora mayúsculas y puntuación)', () => {
    expect(diffWords('where is the bathroom', 'Where is the bathroom?').every(x => x.s === 'ok')).toBe(true);
  });
  it('palabra sustituida', () => {
    const r = diffWords('where is the batroom', 'Where is the bathroom?');
    expect(r.map(x => x.s)).toEqual(['ok', 'ok', 'ok', 'wrong']);
    expect(r[3].t).toBe('batroom');
    expect(r[3].w).toBe('bathroom?');
  });
  it('palabra que falta y palabra que sobra', () => {
    expect(diffWords('i need doctor', 'I need a doctor.').map(x => x.s)).toEqual(['ok', 'ok', 'missing', 'ok']);
    expect(diffWords('i really need help', 'I need help.').map(x => x.s)).toEqual(['ok', 'extra', 'ok', 'ok']);
  });
  it('vacíos y resumen', () => {
    expect(diffWords('', '')).toEqual([]);
    expect(diffSummary(diffWords('a b', 'a c d'))).toEqual({ ok: 1, wrong: 1, missing: 1, extra: 0 });
  });
});

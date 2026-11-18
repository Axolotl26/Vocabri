import { describe, it, expect } from 'vitest';
import { streakOf, dayToCover, earnedNow, keyOf } from '../app/core/streak.js';

const T = new Date(2026, 10, 15);                       // 15 nov 2026
const k = n => keyOf(new Date(2026, 10, 15 + n));
const S = (...ns) => new Set(ns.map(k));

describe('streakOf', () => {
  it('cuenta días consecutivos hasta hoy', () => { expect(streakOf(S(0, -1, -2), new Set(), T)).toBe(3); });
  it('si hoy aún no estudiaste, cuenta hasta ayer', () => { expect(streakOf(S(-1, -2), new Set(), T)).toBe(2); });
  it('un hueco rompe la racha', () => { expect(streakOf(S(0, -2, -3), new Set(), T)).toBe(1); });
  it('un día cubierto por protector no rompe la racha', () => { expect(streakOf(S(0, -2, -3), S(-1), T)).toBe(4); });
  it('sin actividad reciente es 0', () => { expect(streakOf(S(-5), new Set(), T)).toBe(0); });
});

describe('dayToCover', () => {
  it('cubre ayer si antes de ayer estudiaste y hay protector', () => { expect(dayToCover(S(-2, -3), new Set(), T, 1)).toBe(k(-1)); });
  it('no gasta si no hay protectores', () => { expect(dayToCover(S(-2), new Set(), T, 0)).toBe(null); });
  it('no gasta si ayer o hoy ya cuentan', () => {
    expect(dayToCover(S(-1), new Set(), T, 1)).toBe(null);
    expect(dayToCover(S(0, -2), new Set(), T, 1)).toBe(null);
  });
  it('no cubre una racha ya rota de dos días', () => { expect(dayToCover(S(-3), new Set(), T, 2)).toBe(null); });
});

describe('earnedNow', () => {
  it('nivel 3 da uno, una sola vez', () => {
    expect(earnedNow(3, 0, new Set())).toEqual(['lvl3']);
    expect(earnedNow(3, 0, new Set(['lvl3']))).toEqual([]);
  });
  it('cada 7 días de racha da otro', () => { expect(earnedNow(1, 14, new Set())).toEqual(['streak7', 'streak14']); });
});

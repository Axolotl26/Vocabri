import { describe, it, expect } from 'vitest';
import { WEAK_MIN_LAPSES, WEAK_STABLE_DAYS, isWeak, weakScore, rankWeak, pickWeak } from '../app/core/weakSpots.js';

const rec = (o) => Object.assign({ m:false, t:0, lvl:0, next:0, iv:0, lapses:0, rl:false, reps:0 }, o);
const entry = (id, o) => ({ it: ['en' + id, 'es' + id, 'cat', id, null, null], rec: rec(o) });

describe('isWeak', () => {
  it('con pocos fallos no es débil', () => expect(isWeak(rec({ lapses: WEAK_MIN_LAPSES - 1, iv: 1 }))).toBe(false));
  it('muchos fallos e intervalo corto: débil', () => expect(isWeak(rec({ lapses: 2, iv: 3 }))).toBe(true));
  it('en reaprendizaje es débil aunque el intervalo sea largo', () => expect(isWeak(rec({ lapses: 3, iv: 40, rl: true }))).toBe(true));
  it('sale de la lista al alcanzar el intervalo estable', () => {
    expect(isWeak(rec({ lapses: 5, iv: WEAK_STABLE_DAYS - 1 }))).toBe(true);
    expect(isWeak(rec({ lapses: 5, iv: WEAK_STABLE_DAYS }))).toBe(false);
  });
  it('tolera registros vacíos', () => { expect(isWeak(null)).toBe(false); expect(isWeak(undefined)).toBe(false); });
  it('deriva el intervalo del nivel en registros antiguos', () => expect(isWeak(rec({ lapses: 2, iv: 0, lvl: 3 }))).toBe(true));   // lvl 3 ≈ 10 días < 21
});

describe('weakScore / rankWeak / pickWeak', () => {
  it('más fallos pesan más', () => expect(weakScore(rec({ lapses: 5, iv: 3 }))).toBeGreaterThan(weakScore(rec({ lapses: 2, iv: 3 }))));
  it('el reaprendizaje sube la urgencia', () => expect(weakScore(rec({ lapses: 3, iv: 3, rl: true }))).toBeGreaterThan(weakScore(rec({ lapses: 3, iv: 3 }))));
  it('un intervalo más corto pesa más con los mismos fallos', () => expect(weakScore(rec({ lapses: 3, iv: 1 }))).toBeGreaterThan(weakScore(rec({ lapses: 3, iv: 15 }))));
  const entries = [entry('a', { lapses: 2, iv: 3 }), entry('b', { lapses: 6, iv: 2 }), entry('c', { lapses: 1 }), entry('d', { lapses: 4, iv: 30 }), entry('e', { lapses: 2, iv: 3 })];
  it('filtra y ordena de más a menos urgente, con empates estables', () => {
    expect(rankWeak(entries).map(e => e.it[3])).toEqual(['b', 'a', 'e']);
  });
  it('pickWeak limita el tamaño y devuelve las frases', () => {
    expect(pickWeak(entries, 2).map(it => it[3])).toEqual(['b', 'a']);
    expect(pickWeak(entries)[0][0]).toBe('enb');
  });
  it('sin débiles devuelve lista vacía', () => expect(pickWeak([entry('x', { lapses: 0 })])).toEqual([]));
});

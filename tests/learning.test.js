import { describe, it, expect } from 'vitest';
import { masteredPerDay, dueSummary, summary, topWeak, bestWorst } from '../app/core/learning.js';

const NOW = new Date(2026, 10, 15, 12).getTime();
const DAY = 86400000;
const rec = o => Object.assign({ m: false, t: null, mt: null, lvl: 0, next: null, iv: 0, lapses: 0, rl: false, reps: 0 }, o);
const E = (key, r) => ({ it: ['en' + key, 'es' + key, 'c', key], rec: rec(r) });

describe('learning', () => {
  it('masteredPerDay cuenta por día y ordena con hoy al final', () => {
    const out = masteredPerDay([E('a', { m: true, mt: NOW }), E('b', { m: true, mt: NOW - 2 * DAY }), E('c', { m: true, mt: NOW - 30 * DAY })], NOW, 7);
    expect(out.length).toBe(7);
    expect(out[6].n).toBe(1);
    expect(out[4].n).toBe(1);
    expect(out.reduce((s, o) => s + o.n, 0)).toBe(2);
  });
  it('dueSummary separa hoy y próximos 7 días e ignora lo no visto', () => {
    const r = dueSummary([
      E('a', { reps: 1, next: NOW - DAY }), E('b', { reps: 2, next: NOW + 3 * DAY }),
      E('c', { reps: 1, next: NOW + 20 * DAY }), E('d', {}), E('e', { reps: 1, rl: true, next: NOW + 5 * DAY })], NOW);
    expect(r).toEqual({ due: 2, soon: 1 });
  });
  it('summary cuenta vistas y dominadas', () => {
    expect(summary([E('a', { reps: 1 }), E('b', { m: true }), E('c', {})])).toEqual({ total: 3, seen: 2, mastered: 1 });
  });
  it('topWeak devuelve las más falladas', () => {
    const w = topWeak([E('a', { lapses: 5, iv: 1 }), E('b', { lapses: 1 }), E('c', { lapses: 3, iv: 1 })], 5);
    expect(w.map(x => x.key)).toEqual(['a', 'c']);
  });
  it('bestWorst', () => {
    expect(bestWorst([{ id: 'a', pct: 80, total: 5 }, { id: 'b', pct: 10, total: 5 }])).toEqual({ best: { id: 'a', pct: 80, total: 5 }, worst: { id: 'b', pct: 10, total: 5 } });
    expect(bestWorst([{ id: 'a', pct: 0, total: 5 }, { id: 'b', pct: 0, total: 5 }]).worst).toBe(null);
  });
});

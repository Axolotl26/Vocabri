import { describe, it, expect } from 'vitest';
import { ROUTE_GOALS, ROUTE_DAY_OPTIONS, getRouteGoal, zoneSlice, sampleEven, splitDays, buildRoutePlan, routeProgress, daysLeft, normalizeRoute } from '../app/core/routes.js';

const keys = (p, n) => Array.from({ length: n }, (_, i) => p + i);

describe('metas', () => {
  it('ids únicos y fuentes válidas', () => {
    expect(new Set(ROUTE_GOALS.map(g => g.id)).size).toBe(ROUTE_GOALS.length);
    ROUTE_GOALS.forEach(g => { expect(g.sources.length).toBeGreaterThan(0); g.sources.forEach(s => expect(typeof s.cat).toBe('string')); });
  });
  it('getRouteGoal', () => { expect(getRouteGoal('travel').emoji).toBe('✈️'); expect(getRouteGoal('nope')).toBe(null); });
  it('opciones de días', () => expect(ROUTE_DAY_OPTIONS).toEqual([7, 14, 30]));
});

describe('zoneSlice', () => {
  const items = keys('k', 10), names = ['A', 'B', 'C'], sizes = [3, 3, 4];
  it('devuelve las zonas pedidas, en el orden pedido', () => {
    expect(zoneSlice(items, names, sizes, ['B'])).toEqual(['k3', 'k4', 'k5']);
    expect(zoneSlice(items, names, sizes, ['C', 'A'])).toEqual(['k6', 'k7', 'k8', 'k9', 'k0', 'k1', 'k2']);
  });
  it('sin zonas pedidas devuelve todo; nombres inexistentes se ignoran', () => {
    expect(zoneSlice(items, names, sizes)).toEqual(items);
    expect(zoneSlice(items, names, sizes, ['Z'])).toEqual([]);
    expect(zoneSlice(items, null, null, ['A'])).toEqual(items);
  });
});

describe('sampleEven', () => {
  it('si cabe, no recorta', () => expect(sampleEven([keys('a', 3), keys('b', 2)], 10)).toEqual(['a0', 'a1', 'a2', 'b0', 'b1']));
  it('si no cabe, toma de cada grupo una parte proporcional y exactamente cap en total', () => {
    const out = sampleEven([keys('a', 30), keys('b', 10)], 20);
    expect(out.length).toBe(20);
    expect(out.filter(k => k[0] === 'a').length).toBe(15);
    expect(out.filter(k => k[0] === 'b').length).toBe(5);
    expect(out[0]).toBe('a0');
  });
  it('reparte el resto sin pasarse del tamaño de un grupo', () => {
    const out = sampleEven([keys('a', 2), keys('b', 50)], 7);
    expect(out.length).toBe(7);
  });
});

describe('splitDays', () => {
  it('reparte parejo, la sobra a los primeros días', () => expect(splitDays(keys('k', 10), 4).map(d => d.length)).toEqual([3, 3, 2, 2]));
  it('no deja días vacíos si hay menos frases que días', () => expect(splitDays(keys('k', 3), 7).map(d => d.length)).toEqual([1, 1, 1]));
  it('lista vacía → sin días', () => expect(splitDays([], 7)).toEqual([]));
  it('conserva el orden', () => expect([].concat(...splitDays(keys('k', 9), 4))).toEqual(keys('k', 9)));
});

describe('buildRoutePlan', () => {
  it('quita lo ya estudiado y los repetidos entre fuentes', () => {
    const plan = buildRoutePlan([['a', 'b', 'c'], ['c', 'd', 'e']], 7, k => k === 'a');
    expect([].concat(...plan)).toEqual(['b', 'c', 'd', 'e']);
  });
  it('respeta el tope por día', () => {
    const plan = buildRoutePlan([keys('x', 200)], 7, null, 10);
    expect([].concat(...plan).length).toBe(70);
    plan.forEach(d => expect(d.length).toBe(10));
  });
  it('si no queda nada nuevo, el plan es vacío', () => expect(buildRoutePlan([['a']], 7, () => true)).toEqual([]));
});

describe('routeProgress', () => {
  const plan = [['a', 'b'], ['c', 'd'], ['e']];
  it('calcula avance y siguiente día', () => {
    const p = routeProgress(plan, k => ['a', 'b', 'c'].includes(k));
    expect(p.doneDays).toBe(1); expect(p.next).toBe(1); expect(p.doneCards).toBe(3); expect(p.totalCards).toBe(5); expect(p.pct).toBe(60);
    expect(p.days[1]).toEqual({ total: 2, done: 1, complete: false });
  });
  it('ruta completa → next = -1', () => expect(routeProgress(plan, () => true).next).toBe(-1));
  it('plan vacío no divide entre cero', () => expect(routeProgress([], () => true).pct).toBe(0));
});

describe('daysLeft / normalizeRoute', () => {
  const DAY = 24 * 3600 * 1000;
  it('cuenta los días que faltan y nunca baja de 0', () => {
    expect(daysLeft({ start: 0, days: 14 }, 3 * DAY)).toBe(11);
    expect(daysLeft({ start: 0, days: 14 }, 99 * DAY)).toBe(0);
  });
  it('acepta una ruta válida', () => expect(normalizeRoute({ goal: 'travel', days: 14, start: 5, plan: [['a']] })).toEqual({ v: 1, goal: 'travel', days: 14, start: 5, plan: [['a']] }));
  it('rechaza datos rotos', () => {
    expect(normalizeRoute(null)).toBe(null);
    expect(normalizeRoute({ goal: 'x', plan: [['a']] })).toBe(null);
    expect(normalizeRoute({ goal: 'travel', plan: [] })).toBe(null);
    expect(normalizeRoute({ goal: 'travel', plan: [[1]] })).toBe(null);
  });
});

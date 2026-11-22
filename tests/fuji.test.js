import { describe, it, expect } from 'vitest';
import { layoutFuji, trailSegments, fujiSvg, W, hwD } from '../app/fuji.js';

describe('ruta del Fuji (layout)', () => {
  const L = layoutFuji([12, 7, 9, 12, 7, 9]);
  it('coloca todos los nodos, en orden de abajo hacia arriba', () => {
    expect(L.nodes.length).toBe(56);
    expect(L.signs.length).toBe(6);
    for(let i = 1; i < L.nodes.length; i++) expect(L.nodes[i].y <= L.nodes[i - 1].y + 14).toBe(true);
  });
  it('mantiene los nodos dentro de la escena y dentro de la montaña', () => {
    L.nodes.forEach(n => { expect(n.x >= 40 && n.x <= W - 40).toBe(true); });
    L.nodes.forEach(n => { const r = L.rows[n.row]; expect(Math.abs(n.x - 210) <= r.hw - 40 + 1).toBe(true); });
  });
  it('la montaña se estrecha hacia la cima', () => { expect(hwD(0) > hwD(1500)).toBe(true); });
  it('genera un tramo de sendero por cada par de nodos y un SVG válido', () => {
    expect(trailSegments(L.nodes).length).toBe(55);
    const s = fujiSvg(L, new Array(55).fill(false));
    expect(s.startsWith('<svg')).toBe(true);
    expect(s.includes('NaN')).toBe(false);
  });
});

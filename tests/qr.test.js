import { describe, it, expect } from 'vitest';
import { qrMatrix } from '../app/core/qr.js';

const finder = (m, x0, y0) => { for(let d = 0; d < 7; d++) for(let e = 0; e < 7; e++){ const ring = Math.max(Math.abs(d - 3), Math.abs(e - 3)); if(m[y0 + d][x0 + e] !== (ring !== 2)) return false; } return true; };
describe('código QR', () => {
  it('tamaño según versión: 21 (v1), 29 (v3) y 53 (v9)', () => {
    expect(qrMatrix('hola').length).toBe(21);
    expect(qrMatrix('https://axolotl26.github.io/Vocabri/').length).toBe(29);
    expect(qrMatrix('x'.repeat(160)).length).toBe(53);
  });
  it('lleva los tres patrones de búsqueda y el módulo oscuro fijo', () => {
    const m = qrMatrix('https://example.com/');
    const n = m.length;
    expect(finder(m, 0, 0)).toBe(true); expect(finder(m, n - 7, 0)).toBe(true); expect(finder(m, 0, n - 7)).toBe(true);
    expect(m[n - 8][8]).toBe(true);
  });
  it('es determinista y rechaza textos demasiado largos', () => {
    expect(JSON.stringify(qrMatrix('abc'))).toBe(JSON.stringify(qrMatrix('abc')));
    let threw = false; try{ qrMatrix('x'.repeat(500)); }catch(e){ threw = true; }
    expect(threw).toBe(true);
  });
});

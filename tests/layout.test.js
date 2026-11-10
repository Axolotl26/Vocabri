import { describe, it, expect } from 'vitest';
import { STAGE_SIZE, SESSION_MAX, MAX_CONSECUTIVE_NORMAL, buildSessionLayout, buildNodeLayout } from '../app/core/layout.js';

const tipos = (L, carry) => buildNodeLayout(buildSessionLayout(L), carry).nodes.map(n => n.type === 'exam' ? 'E' : 'N').join('');

describe('constantes del mapa', () => {
  it('secciones de 8 tarjetas y examen cada 2 secciones', () => {
    expect(STAGE_SIZE).toBe(8);
    expect(SESSION_MAX).toBe(8);
    expect(MAX_CONSECUTIVE_NORMAL).toBe(2);
  });
});

describe('buildSessionLayout — categoría sin módulos', () => {
  it('20 tarjetas → 8 + 8 + 4', () => {
    const L = buildSessionLayout({ names: ['travel'], total: 20 });
    expect(L.sessSizes).toEqual([8, 8, 4]);
    expect(L.sessEtapaIdx).toEqual([0, 0, 0]);
    expect(L.sessEtapaPos).toEqual([[1, 3], [2, 3], [3, 3]]);
    expect(L.etapaNames).toEqual(['travel']);
  });
  it('múltiplo exacto de 8: no deja una sección vacía', () => expect(buildSessionLayout({ names: ['x'], total: 16 }).sessSizes).toEqual([8, 8]));
  it('menos de 8 tarjetas: una sola sección corta', () => expect(buildSessionLayout({ names: ['x'], total: 3 }).sessSizes).toEqual([3]));
  it('sin tarjetas: una sección vacía (el mapa nunca queda sin nodos)', () => expect(buildSessionLayout({ names: ['x'], total: 0 }).sessSizes).toEqual([0]));
  it('la suma de las secciones es el total', () => {
    for (const total of [1, 7, 8, 9, 100, 231]) {
      expect(buildSessionLayout({ names: ['x'], total }).sessSizes.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });
});

describe('buildSessionLayout — módulos con nombre', () => {
  it('cada módulo es una etapa troceada en secciones de 8', () => {
    const L = buildSessionLayout({ names: ['A', 'B'], sizes: [10, 8] });
    expect(L.sessSizes).toEqual([8, 2, 8]);
    expect(L.sessEtapaIdx).toEqual([0, 0, 1]);
    expect(L.sessEtapaPos).toEqual([[1, 2], [2, 2], [1, 1]]);
    expect(L.etapaNames).toEqual(['A', 'B']);
  });
  it('un módulo vacío sigue ocupando una sección', () => expect(buildSessionLayout({ names: ['A'], sizes: [0] }).sessSizes).toEqual([0]));
});

describe('buildNodeLayout', () => {
  it('examen tras cada 2 secciones normales y al final de la etapa', () => {
    expect(tipos({ names: ['x'], total: 40 }, false)).toBe('NNENNENE');   // 5 secciones: NN E NN E N E
  });
  it('2 secciones → NNE; 1 sección → NE; 3 → NNENE', () => {
    expect(tipos({ names: ['x'], total: 16 }, false)).toBe('NNE');
    expect(tipos({ names: ['x'], total: 5 }, false)).toBe('NE');
    expect(tipos({ names: ['x'], total: 24 }, false)).toBe('NNENE');
  });
  it('cada examen lista las secciones que evalúa', () => {
    const { nodes } = buildNodeLayout(buildSessionLayout({ names: ['x'], total: 24 }), false);
    expect(nodes.filter(n => n.type === 'exam').map(n => n.sources)).toEqual([[0, 1], [2]]);
    expect(nodes.filter(n => n.type === 'normal').map(n => n.sessIdx)).toEqual([0, 1, 2]);
  });
  it('al cambiar de etapa se cierra el examen pendiente', () => {
    // etapa A: 1 sección (8) · etapa B: 1 sección (8)
    const L = buildSessionLayout({ names: ['A', 'B'], sizes: [8, 8] });
    const nodes = buildNodeLayout(L, false).nodes;
    expect(nodes.map(n => n.type[0] + n.etapaIdx).join(' ')).toBe('n0 e0 n1 e1');
  });
  it('con carryExam el examen pendiente pasa a la etapa siguiente', () => {
    const L = buildSessionLayout({ names: ['A', 'B'], sizes: [8, 8] });
    const nodes = buildNodeLayout(L, true).nodes;
    expect(nodes.map(n => n.type[0] + n.etapaIdx).join(' ')).toBe('n0 n1 e1');
    expect(nodes[2].sources).toEqual([0, 1]);
  });
  it('conserva los nombres de etapa', () => expect(buildNodeLayout(buildSessionLayout({ names: ['A', 'B'], sizes: [8, 8] }), false).etapaNames).toEqual(['A', 'B']));
  it('todas las secciones aparecen una vez y todas están cubiertas por un examen', () => {
    const { nodes } = buildNodeLayout(buildSessionLayout({ names: ['x'], total: 231 }), false);
    const normales = nodes.filter(n => n.type === 'normal').map(n => n.sessIdx);
    const cubiertas = nodes.filter(n => n.type === 'exam').flatMap(n => n.sources);
    expect(normales).toEqual(Array.from({ length: normales.length }, (_, i) => i));
    expect(cubiertas).toEqual(normales);
    expect(nodes[nodes.length - 1].type).toBe('exam');
  });
});

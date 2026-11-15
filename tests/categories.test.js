import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MASTER_CATEGORIES, getMasterCategory } from '../categoriesRegistry.js';

const DB = JSON.parse(readFileSync(new URL('../base_de_datos_de_frases_vocabri.json', import.meta.url), 'utf8')).categories;

describe('categorías y JSON de frases', () => {
  it('cada categoría con jsonKey tiene tantas frases como suman sus zonas', () => {
    MASTER_CATEGORIES.filter(c => c.jsonKey).forEach(c => {
      const total = c.zones.sizes.reduce((a, b) => a + b, 0);
      expect((DB[c.jsonKey] || []).length, c.id).toBe(total);
      expect(c.zones.names.length, c.id).toBe(c.zones.sizes.length);
    });
  });
  it('los ids de frase son únicos y cada frase tiene todos sus campos', () => {
    const seen = new Set();
    Object.values(DB).forEach(list => list.forEach(it => {
      expect(it.id && it.en && it.es && it.ex && it.exEs, it.id).toBeTruthy();
      expect(seen.has(it.id), it.id).toBe(false); seen.add(it.id);
    }));
  });
  it('no hay frases en inglés repetidas entre categorías', () => {
    const seen = new Map();
    Object.entries(DB).forEach(([k, list]) => list.forEach(it => {
      const key = it.en.toLowerCase();
      expect(seen.has(key) ? seen.get(key) + ' y ' + k + ': ' + it.en : null).toBe(null);
      seen.set(key, k);
    }));
  });
  it('existe la categoría Médico y Salud', () => {
    const c = getMasterCategory('health');
    expect(c && c.jsonKey).toBe('health_and_medical');
    expect(DB.health_and_medical.length).toBe(100);
  });
});

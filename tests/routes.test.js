import { describe, it, expect } from 'vitest';
import { ROUTE_GOALS, getRouteGoal } from '../app/core/routes.js';
import { getMasterCategory } from '../categoriesRegistry.js';
import { readFileSync } from 'node:fs';

// Las zonas de «general» no están en el registro: salen de CAT_MODULE_NAMES (clave heredada «Casual»).
const src = readFileSync(new URL('../app/core/dataRegistry.js', import.meta.url), 'utf8');
const GENERAL_ZONES = JSON.parse((src.match(/CAT_MODULE_NAMES = \{'Casual': (\[[^\]]*\])/) || [])[1] || '[]');

describe('objetivos de ruta', () => {
  it('los ids son únicos y cada objetivo tiene fuentes', () => {
    const ids = ROUTE_GOALS.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    ROUTE_GOALS.forEach(g => { expect(g.sources.length, g.id).toBeGreaterThan(0); expect(g.name && g.desc && g.emoji, g.id).toBeTruthy(); });
  });
  it('todas las categorías y zonas nombradas existen en el registro', () => {
    ROUTE_GOALS.forEach(g => g.sources.forEach(src => {
      const c = getMasterCategory(src.cat);
      expect(c, g.id + ':' + src.cat).toBeTruthy();
      const names = src.cat === 'general' ? GENERAL_ZONES : c.zones.names;
      if(src.cat === 'general') expect(names.length).toBeGreaterThan(5);
      (src.zones || []).forEach(z => expect(names.indexOf(z), g.id + ' → ' + z).toBeGreaterThanOrEqual(0));
    }));
  });
  it('existe la ruta «Voy al médico» y usa la categoría Médico y Salud', () => {
    const h = getRouteGoal('health');
    expect(h && h.name).toBe('Voy al médico');
    expect(h.sources.some(s => s.cat === 'health' && !s.zones)).toBe(true);
  });
});

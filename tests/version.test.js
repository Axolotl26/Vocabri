import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseVersion, compareVersions, isNewerVersion, normalizeVersionInfo, updateStatus, UPDATE_STAGES, easeProgress } from '../app/core/version.js';

describe('versiones', () => {
  it('parsea con o sin v y sin parche', () => { expect(parseVersion('v1.1.6')).toEqual([1, 1, 6]); expect(parseVersion('2.0')).toEqual([2, 0, 0]); expect(parseVersion('hola')).toBe(null); });
  it('compara numéricamente (1.1.10 > 1.1.9)', () => { expect(compareVersions('1.1.10', '1.1.9')).toBe(1); expect(compareVersions('1.1.5', '1.1.6')).toBe(-1); expect(compareVersions('1.2', '1.2.0')).toBe(0); });
  it('versión inválida devuelve null', () => { expect(compareVersions('x', '1.0.0')).toBe(null); expect(isNewerVersion('x', '1.0.0')).toBe(false); });
  it('isNewerVersion', () => { expect(isNewerVersion('1.2.0', '1.1.9')).toBe(true); expect(isNewerVersion('1.1.6', '1.1.6')).toBe(false); });
});
describe('normalizeVersionInfo / updateStatus', () => {
  it('limpia y limita', () => {
    const i = normalizeVersionInfo({ version: 'v1.2.0', date: ' 2026-11-12 ', title: 'Hola', changes: ['a', '', ' b ', ...Array(20).fill('x')] });
    expect(i.version).toBe('1.2.0'); expect(i.date).toBe('2026-11-12'); expect(i.changes.length).toBe(12); expect(i.changes[1]).toBe('b');
  });
  it('rechaza basura', () => { expect(normalizeVersionInfo(null)).toBe(null); expect(normalizeVersionInfo({ version: 'zz' })).toBe(null); });
  it('estado', () => {
    expect(updateStatus(null, '1.1.6')).toBe('error');
    expect(updateStatus({ version: '1.1.7' }, '1.1.6')).toBe('available');
    expect(updateStatus({ version: '1.1.6' }, '1.1.6')).toBe('latest');
  });
});
describe('barra de progreso', () => {
  it('las etapas suben y acaban en 100', () => { const c = UPDATE_STAGES.map(s => s.cap); expect([...c].sort((a, b) => a - b)).toEqual(c); expect(c[c.length - 1]).toBe(100); });
  it('easeProgress avanza sin pasarse del tope', () => {
    let p = 0; for(let i = 0; i < 400; i++) p = easeProgress(p, 78);
    expect(p).toBe(78); expect(easeProgress(10, 78)).toBeGreaterThan(10); expect(easeProgress(90, 78)).toBe(78);
  });
});
describe('coherencia de versión', () => {
  const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  it('version.json, settings.js y sw.js dicen la misma versión', () => {
    const v = JSON.parse(read('version.json')).version;
    expect(read('app/settings.js')).toContain("APP_VERSION = '" + v + "'");
    expect(read('sw.js')).toContain("CACHE_VERSION = '" + v + "'");
  });
});

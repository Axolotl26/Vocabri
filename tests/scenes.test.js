import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SCENES } from '../app/core/scenesData.js';
import { youTurns, validateScene, shuffle, buildOptions, turnXp, scoreRun, dayKey, recordRun, normalizeStore, SCENE_XP_FIRST } from '../app/core/scenes.js';

const DB = JSON.parse(readFileSync(fileURLToPath(new URL('../base_de_datos_de_frases_vocabri.json', import.meta.url)), 'utf8')).categories;
const BY_ID = {};
Object.keys(DB).forEach(c => DB[c].forEach(x => { BY_ID[x.id] = x; }));
const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

describe('datos de las escenas', () => {
  it('ids únicos y al menos 5 escenas', () => { expect(new Set(SCENES.map(s => s.id)).size).toBe(SCENES.length); expect(SCENES.length).toBeGreaterThanOrEqual(5); });
  SCENES.forEach(s => {
    it('«' + s.title + '» tiene estructura válida', () => expect(validateScene(s)).toEqual([]));
    it('«' + s.title + '»: cada ref coincide con el JSON', () => {
      youTurns(s).filter(t => t.ref).forEach(t => {
        expect(BY_ID[t.ref], 'id inexistente ' + t.ref).toBeTruthy();
        expect(t.en).toBe(BY_ID[t.ref].en);
        expect(t.es).toBe(BY_ID[t.ref].es);
      });
    });
    it('«' + s.title + '»: sin líneas tuyas repetidas (las opciones no se confunden)', () => {
      const en = youTurns(s).map(t => t.en); expect(new Set(en).size).toBe(en.length);
    });
  });
});

describe('validateScene', () => {
  const ok = { id: 'x', title: 'X', turns: [{ who: 'npc', en: 'a', es: 'a' }, { who: 'you', goal: 'g', en: 'b', es: 'b' }, { who: 'npc', en: 'c', es: 'c' }, { who: 'you', goal: 'g', en: 'd', es: 'd' }, { who: 'npc', en: 'e', es: 'e' }, { who: 'you', goal: 'g', en: 'f', es: 'f' }] };
  it('acepta una escena correcta', () => expect(validateScene(ok)).toEqual([]));
  it('detecta turnos seguidos, falta de objetivo y escena incompleta', () => {
    expect(validateScene(Object.assign({}, ok, { turns: ok.turns.slice(0, 5).concat([{ who: 'npc', en: 'z', es: 'z' }]) })).length).toBeGreaterThan(0);
    expect(validateScene({ id: 'x', title: 'X', turns: ok.turns.map((t, i) => i === 1 ? { who: 'you', en: 'b', es: 'b' } : t) })).toContain('falta objetivo en 1');
    expect(validateScene(null)).toEqual(['escena incompleta']);
  });
});

describe('shuffle / buildOptions', () => {
  it('shuffle conserva los elementos y no muta', () => { const a = [1, 2, 3, 4]; const b = shuffle(a, seq([0.1, 0.7, 0.4])); expect(a).toEqual([1, 2, 3, 4]); expect(b.slice().sort()).toEqual([1, 2, 3, 4]); });
  const sc = SCENES[0];
  const idx = sc.turns.findIndex(t => t.who === 'you');
  it('3 opciones, solo una correcta y distintas', () => {
    for(let k = 0; k < 20; k++){
      const o = buildOptions(sc, idx, Math.random);
      expect(o.length).toBe(3);
      expect(o.filter(x => x.correct).length).toBe(1);
      expect(o.find(x => x.correct).en).toBe(sc.turns[idx].en);
      expect(new Set(o.map(x => x.en)).size).toBe(3);
    }
  });
});

describe('puntuación', () => {
  it('turnXp', () => { expect(turnXp(1, false)).toBe(SCENE_XP_FIRST); expect(turnXp(2, false)).toBe(2); expect(turnXp(3, false)).toBe(0); expect(turnXp(1, true)).toBe(0); });
  it('scoreRun', () => {
    const s = scoreRun([{ tries: 1, assisted: false }, { tries: 2, assisted: false }, { tries: 3, assisted: true }, { tries: 1, assisted: false }]);
    expect(s).toEqual({ total: 4, firstTry: 2, assisted: 1, xp: 10, pct: 50 });
    expect(scoreRun([]).pct).toBe(0);
  });
});

describe('recordRun / normalizeStore', () => {
  const T = new Date(2026, 10, 11, 10).getTime();
  it('dayKey', () => expect(dayKey(T)).toBe('2026-11-11'));
  it('da XP una sola vez por día y escena', () => {
    const r1 = recordRun({}, 'hotel', { pct: 50, xp: 12 }, T);
    expect(r1.xp).toBe(12);
    const r2 = recordRun(r1.store, 'hotel', { pct: 80, xp: 20 }, T + 3600e3);
    expect(r2.xp).toBe(0); expect(r2.store.hotel.plays).toBe(2); expect(r2.store.hotel.best).toBe(80);
    const r3 = recordRun(r2.store, 'hotel', { pct: 60, xp: 16 }, T + 26 * 3600e3);
    expect(r3.xp).toBe(16); expect(r3.store.hotel.best).toBe(80);
    expect(recordRun(r1.store, 'airport', { pct: 10, xp: 4 }, T).xp).toBe(4);
  });
  it('no muta el store recibido', () => { const s = {}; recordRun(s, 'a', { pct: 1, xp: 1 }, T); expect(s).toEqual({}); });
  it('normalizeStore tolera basura', () => {
    expect(normalizeStore(null)).toEqual({}); expect(normalizeStore([1])).toEqual({}); expect(normalizeStore('x')).toEqual({});
    expect(normalizeStore({ a: { plays: '3', best: 400 }, b: 5 })).toEqual({ a: { plays: 3, best: 100, last: 0, xpDay: '' } });
  });
});

import { SCENE_GROUPS, SCENE_LEVELS } from '../app/core/scenesData.js';
describe('catálogo ampliado', () => {
  it('hay al menos 20 escenas', () => expect(SCENES.length).toBeGreaterThanOrEqual(20));
  it('cada escena tiene grupo y nivel válidos', () => {
    const ids = SCENE_GROUPS.map(g => g.id);
    SCENES.forEach(s => { expect(ids, s.id).toContain(s.group); expect(SCENE_LEVELS[s.level], s.id).toBeTruthy(); });
  });
  it('cada grupo (salvo «Todas») tiene al menos una escena', () => {
    SCENE_GROUPS.filter(g => g.id !== 'all').forEach(g => expect(SCENES.some(s => s.group === g.id), g.id).toBe(true));
  });
});

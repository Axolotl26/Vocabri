import { describe, it, expect, beforeEach } from 'vitest';
import { levelFromXp, xpForLevel } from '../app/core/levels.js';
import { isCategoryUnlocked, checkUnlocks, unlockLevelOf, playerLevel, UNLOCK_KEY } from '../app/core/unlocks.js';
import { getMasterCategory } from '../categoriesRegistry.js';

function fakeStorage(){ const m = {}; globalThis.localStorage = { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; return m; }
const xpFor = lvl => { let t = 0; for (let n = 1; n < lvl; n++) t += xpForLevel(n); return t; };

describe('categorías por nivel (Exámenes)', () => {
  let m;
  beforeEach(() => { m = fakeStorage(); });
  it('el pack de exámenes está en el registro y pide nivel 8', () => {
    const c = getMasterCategory('exam');
    expect(c.jsonKey).toBe('exam_prep');
    expect(unlockLevelOf('exam')).toBe(8);
    expect(c.zones.sizes.reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('las demás categorías nunca están bloqueadas', () => {
    ['general', 'travel', 'academic', 'business', 'pop', 'health'].forEach(id => expect(isCategoryUnlocked(id)).toBe(true));
  });
  it('bloqueada por debajo del nivel 8, abierta desde el 8', () => {
    m.ci_xp_total = String(xpFor(7));
    expect(playerLevel()).toBe(7);
    expect(isCategoryUnlocked('exam')).toBe(false);
    m.ci_xp_total = String(xpFor(8));
    expect(levelFromXp(xpFor(8))).toBe(8);
    expect(isCategoryUnlocked('exam')).toBe(true);
  });
  it('checkUnlocks guarda el desbloqueo una vez y es permanente', () => {
    m.ci_xp_total = String(xpFor(8));
    expect(checkUnlocks()).toEqual(['exam']);
    expect(checkUnlocks()).toEqual([]);
    m.ci_xp_total = '0';
    expect(JSON.parse(m[UNLOCK_KEY])).toEqual(['exam']);
    expect(isCategoryUnlocked('exam')).toBe(true);
  });
});

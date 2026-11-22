import { describe, it, expect, beforeEach } from 'vitest';
import { layoutFuji, fujiSvg } from '../app/fuji.js';

function fakeStorage(){ const m = {}; globalThis.localStorage = { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; return m; }

describe('idioma activo', () => {
  let m, lang;
  beforeEach(async () => { m = fakeStorage(); lang = await import('../app/lang.js?t=' + Math.random()); });
  it('por defecto es inglés y no hay sufijo', () => { expect(lang.activeLang()).toBe('en'); expect(lang.isJa()).toBe(false); expect(lang.langSuffix()).toBe(''); });
  it('japonés usa sufijo _ja', () => { m.vocabri_language = 'ja'; expect(lang.activeLang()).toBe('ja'); expect(lang.langSuffix()).toBe('_ja'); });
  it('valores raros caen a inglés', () => { m.vocabri_language = 'fr'; expect(lang.activeLang()).toBe('en'); });
  it('recuerda el curso de cada idioma', () => { expect(lang.rememberedCat('ja')).toBe('jp_n5'); lang.rememberCat('ja', 'jp_n4'); expect(lang.rememberedCat('ja')).toBe('jp_n4'); expect(lang.rememberedCat('en')).toBe('general'); });
});

describe('Fuji a todo el ancho', () => {
  const L = layoutFuji([8, 8, 10]);
  it('sin margen el SVG mide 420', () => { expect(fujiSvg(L, [], 0)).toContain('viewBox="0 0 420 '); });
  it('con margen se extiende a los dos lados y no genera NaN', () => {
    const s = fujiSvg(L, [], 300);
    expect(s).toContain('viewBox="-300 0 1020 ');
    expect(s).toContain('left:-300px');
    expect(s.includes('NaN')).toBe(false);
    expect(s).toContain('fjBlur8');
  });
});

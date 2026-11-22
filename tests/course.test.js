import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { convertCourse, langTag, romajiKey, romajiMatches, safeRubyHtml, stripRuby, validateCourse } from '../app/core/course.js';

const load = f => JSON.parse(readFileSync(new URL('../data/ja/' + f, import.meta.url), 'utf8'));

describe('cursos de otros idiomas', () => {
  ['jp_kana.json', 'jp_n5.json', 'jp_kanji_n5.json', 'jp_n4.json'].forEach(f => {
    it(f + ' es un curso válido', () => { expect(validateCourse(load(f))).toEqual([]); });
    it(f + ' se convierte con zonas múltiplo de 8', () => {
      const c = convertCourse(load(f));
      expect(c.sizes.every(n => n % 8 === 0)).toBe(true);
      expect(c.tuples.length).toBe(c.sizes.reduce((a, b) => a + b, 0));
      expect(c.tuples[0].length).toBe(9);
    });
  });
  it('detecta tarjetas repetidas y zonas que no son múltiplo de 8', () => {
    const base = { zones: [{ name: 'Z', items: Array.from({ length: 8 }, (_, i) => ({ id: 'a' + i, ja: 'あ' + i, es: 'x', romaji: 'a' })) }] };
    expect(validateCourse(base)).toEqual([]);
    const dup = JSON.parse(JSON.stringify(base)); dup.zones[0].items[1].ja = dup.zones[0].items[0].ja;
    expect(validateCourse(dup).join()).toMatch(/repetida/);
    const short = JSON.parse(JSON.stringify(base)); short.zones[0].items.pop();
    expect(validateCourse(short).join()).toMatch(/múltiplo de 8/);
  });
  it('los dos cursos no comparten tarjetas ni ids', () => {
    const a = convertCourse(load('jp_n5.json')).tuples, b = convertCourse(load('jp_n4.json')).tuples;
    const ids = new Set(a.map(t => t[4])); expect(b.some(t => ids.has(t[4]))).toBe(false);
  });
  it('el abecedario tiene 248 fichas, ids únicos y no repite tarjetas de N5/N4', () => {
    const k = convertCourse(load('jp_kana.json')).tuples;
    expect(k.length).toBe(248);
    const fronts = new Set(k.map(t => t[0]));
    const others = convertCourse(load('jp_n5.json')).tuples.concat(convertCourse(load('jp_n4.json')).tuples);
    expect(others.filter(t => t[0].length === 1 && fronts.has(t[0]))).toEqual([]);
  });
  it('kana: variantes de romaji (shi/si, ja/zya, vocales largas)', () => {
    expect(romajiMatches('si', 'shi / si')).toBe(true);
    expect(romajiMatches('zya', 'ja / jya / zya')).toBe(true);
    expect(romajiMatches('koohii', 'kōhī')).toBe(true);
  });
  it('langTag', () => { expect(langTag('ja')).toBe('ja-JP'); expect(langTag('en')).toBe('en-US'); expect(langTag('xx')).toBe('en-US'); });
  it('romaji: macrones, vocales largas, partículas y espacios', () => {
    expect(romajiKey('Kōhī')).toBe(romajiKey('koohii'));
    expect(romajiMatches('kippu wo kai ni ikimasu', 'Kippu wo kai ni ikimasu')).toBe(true);
    expect(romajiMatches('kippu o kai ni ikimasu', 'Kippu wo kai ni ikimasu')).toBe(true);
    expect(romajiMatches('sofu', 'Sofu / Ojiisan')).toBe(true);
    expect(romajiMatches('neko', 'inu')).toBe(false);
    expect(romajiMatches('', 'inu')).toBe(false);
  });
  it('safeRubyHtml solo permite ruby y rt', () => {
    expect(safeRubyHtml('<ruby>前<rt>まえ</rt></ruby>')).toBe('<ruby>前<rt>まえ</rt></ruby>');
    expect(safeRubyHtml('<img src=x onerror=alert(1)>', 'ok')).toBe('ok');
    expect(safeRubyHtml('<script>1</script>', '<b>')).toBe('&lt;b&gt;');
    expect(stripRuby('<ruby>前<rt>まえ</rt></ruby>に')).toBe('前に');
  });
});

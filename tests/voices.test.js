import { describe, it, expect } from 'vitest';
import { voiceGender, pickAlternate } from '../app/core/voices.js';

const V = (name, lang, uri) => ({ name, lang: lang || 'en-US', voiceURI: uri || name });
const score = v => (/natural/i.test(v.name) ? 10 : 0) + (/espeak/i.test(v.name) ? -10 : 0);

describe('voiceGender', () => {
  it('reconoce nombres comunes', () => {
    expect(voiceGender(V('Microsoft Jenny Online (Natural)'))).toBe('f');
    expect(voiceGender(V('Microsoft Guy Online (Natural)'))).toBe('m');
    expect(voiceGender(V('Google US English'))).toBe('?');
  });
  it('tolera valores vacíos', () => { expect(voiceGender(null)).toBe('?'); expect(voiceGender({})).toBe('?'); });
});

describe('pickAlternate', () => {
  it('prefiere otro género con calidad parecida', () => {
    const vs = [V('Jenny Natural'), V('Aria Natural'), V('Guy Natural')];
    expect(pickAlternate(vs, 'Jenny Natural', 'en', score).name).toBe('Guy Natural');
  });
  it('no elige la misma voz ni otro idioma', () => {
    const vs = [V('Jenny Natural'), V('Elvira', 'es-ES')];
    expect(pickAlternate(vs, 'Jenny Natural', 'en', score)).toBe(null);
  });
  it('no baja a voces robóticas solo por variar', () => {
    const vs = [V('Jenny Natural'), V('Guy Natural'), V('english+male5 espeak')];
    expect(pickAlternate(vs, 'Jenny Natural', 'en', score).name).toBe('Guy Natural');
  });
  it('si no hay otro género, usa la mejor distinta', () => {
    const vs = [V('Jenny Natural'), V('Aria Natural'), V('Sara')];
    expect(pickAlternate(vs, 'Jenny Natural', 'en', score).name).toBe('Aria Natural');
  });
  it('lista vacía devuelve null', () => { expect(pickAlternate([], 'x', 'en', score)).toBe(null); expect(pickAlternate(null, 'x', 'en')).toBe(null); });
});

import { describe, it, expect } from 'vitest';
import { ALPHABET, VOWELS, isVowel, spellWord, spellSay } from '../app/core/alphabet.js';

describe('ALPHABET', () => {
  it('tiene las 26 letras en orden', () => expect(ALPHABET.map(a => a.l).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  it('cada letra trae lo necesario y su palabra empieza por ella', () => {
    ALPHABET.forEach(a => {
      expect(a.say && a.es && a.word && a.wordEs).toBeTruthy();
      expect(a.word[0].toUpperCase()).toBe(a.l);
    });
  });
  it('no repite pronunciaciones para la voz', () => expect(new Set(ALPHABET.map(a => a.say)).size).toBe(26));
});
describe('vocales y deletreo', () => {
  it('5 vocales', () => { expect(VOWELS.length).toBe(5); expect(isVowel('e')).toBe(true); expect(isVowel('B')).toBe(false); });
  it('spellWord', () => { expect(spellWord('cat')).toBe('C-A-T'); expect(spellWord('X-ray')).toBe('X-R-A-Y'); });
  it('spellSay usa el nombre de cada letra', () => expect(spellSay('cab')).toBe('see, ay, bee'));
});

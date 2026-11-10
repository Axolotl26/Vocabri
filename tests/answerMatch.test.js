import { describe, it, expect } from 'vitest';
import {
  normalizeAnswer, normalizeSpeech, normalizeForCompare, similarity, calcularDistanciaLevenshtein, digitsOf,
  distanciaEdicionPalabra, isGrammaticalVariant, isTypoOf, wordsMatchLikeTypos, describeWordDiffs,
  writtenVariants, evaluateWrittenAnswer, writeAnswerOk, nearMissNote, closeCallSuffix, isSpeakable, speakTargets,
  setKnownWordsProvider, WRITE_FUZZY_THRESHOLD
} from '../app/core/answerMatch.js';

describe('normalización', () => {
  it('español: sin tildes, mayúsculas ni signos', () => {
    expect(normalizeAnswer('¿Qué tal? — ÁÉÍÓÚ')).toBe('que tal aeiou');
    expect(normalizeAnswer('  A   b  ')).toBe('a b');
    expect(normalizeAnswer(null)).toBe('');
  });
  it('la ñ se trata como n (NFD separa la tilde antes de filtrar): "año" y "ano" cuentan como iguales', () => {
    expect(normalizeAnswer('Ñandú')).toBe('nandu');
    expect(normalizeAnswer('año')).toBe(normalizeAnswer('ano'));
  });
  it('inglés: expande contracciones (I\'m = I am)', () => {
    expect(normalizeSpeech("It's hot!!")).toBe('it is hot');
    expect(normalizeSpeech('I’m hungry')).toBe('i am hungry');   // apóstrofo tipográfico
    expect(normalizeSpeech("don't")).toBe('do not');
    expect(normalizeSpeech('wasnt')).toBe('was not');            // sin apóstrofo (teclado del móvil)
    expect(normalizeSpeech('well-known')).toBe('well known');
  });
  it('normalizeForCompare elige según el idioma', () => {
    expect(normalizeForCompare("I'm", 'en')).toBe('i am');
    expect(normalizeForCompare("I'm", 'es')).toBe('i m');
  });
  it('digitsOf extrae los números', () => expect(digitsOf('a1b22c')).toBe('1,22'));
});

describe('distancias', () => {
  it('Levenshtein', () => {
    expect(calcularDistanciaLevenshtein('kitten', 'sitting')).toBe(3);
    expect(calcularDistanciaLevenshtein('', 'abc')).toBe(3);
    expect(calcularDistanciaLevenshtein('abc', 'abc')).toBe(0);
  });
  it('similarity va de 0 a 1', () => {
    expect(similarity('abc', 'abc')).toBe(1);
    expect(similarity('abc', '')).toBe(0);
    expect(similarity('abc', 'abd')).toBeCloseTo(0.667, 2);
  });
  it('una letra intercambiada cuenta como un solo desliz', () => {
    expect(distanciaEdicionPalabra('freind', 'friend')).toBe(1);
    expect(calcularDistanciaLevenshtein('freind', 'friend')).toBe(2);
  });
});

describe('variantes gramaticales', () => {
  it('plural, tiempo y género cambian el significado', () => {
    expect(isGrammaticalVariant('apple', 'apples')).toBe(true);
    expect(isGrammaticalVariant('walk', 'walked')).toBe(true);
    expect(isGrammaticalVariant('amigo', 'amiga')).toBe(true);
    expect(isGrammaticalVariant('amigos', 'amigas')).toBe(true);
  });
  it('una letra repetida es un desliz, no una variante', () => expect(isGrammaticalVariant('gracias', 'graciass')).toBe(false));
});

describe('isTypoOf', () => {
  it('palabras iguales', () => expect(isTypoOf('hello', 'hello', 'en')).toBe(true));
  it('palabras de hasta 4 letras deben ser exactas', () => {
    expect(isTypoOf('ship', 'shop', 'en')).toBe(false);
    expect(isTypoOf('gato', 'gata', 'es')).toBe(false);
  });
  it('5–7 letras admiten 1 error; 8 o más, 2', () => {
    expect(isTypoOf('frend', 'friend', 'en')).toBe(true);
    expect(isTypoOf('frnd', 'friend', 'en')).toBe(false);
    expect(isTypoOf('beautifull', 'beautiful', 'en')).toBe(true);
    expect(isTypoOf('beutifull', 'beautiful', 'en')).toBe(true);
  });
  it('una variante gramatical no es errata', () => expect(isTypoOf('friends', 'friend', 'en')).toBe(false));
  it('una palabra real distinta no es errata (proveedor de palabras conocidas)', () => {
    expect(isTypoOf('frend', 'friend', 'en')).toBe(true);            // sin proveedor: parece una errata
    setKnownWordsProvider(() => new Set(['frend']));
    expect(isTypoOf('frend', 'friend', 'en')).toBe(false);           // si fuera otra palabra real, ya no lo es
    setKnownWordsProvider(null);                                      // restaura el proveedor vacío
    expect(isTypoOf('frend', 'friend', 'en')).toBe(true);
  });
});

describe('wordsMatchLikeTypos / describeWordDiffs', () => {
  it('mismo nº de palabras, cada una igual o con errata', () => {
    expect(wordsMatchLikeTypos('i am happpy', 'i am happy', 'en')).toBe(true);
    expect(wordsMatchLikeTypos('she is a doctor', 'he is a doctor', 'en')).toBe(false);
  });
  it('solo se perdona un espacio mal puesto', () => {
    expect(wordsMatchLikeTypos('goodmorning', 'good morning', 'en')).toBe(true);
    expect(wordsMatchLikeTypos('good', 'good morning', 'en')).toBe(false);
  });
  it('describe qué palabra revisar', () => {
    expect(describeWordDiffs('good mornin', 'good morning')).toBe('revisa: mornin → morning');
    expect(describeWordDiffs('good', 'good morning')).toBe('falta o sobra una palabra');
  });
});

describe('writtenVariants', () => {
  it('cada alternativa "a / b", con y sin (notas), y el texto completo', () => {
    expect(writtenVariants('a (x) / b', 'en').map(v => v.norm)).toEqual(['a', 'a x', 'b', 'a x b']);
  });
});

describe('evaluateWrittenAnswer (umbral ' + WRITE_FUZZY_THRESHOLD + ')', () => {
  const ev = (i, t, l) => evaluateWrittenAnswer(i, t, l);
  it('exacta, ignorando mayúsculas, tildes y signos', () => {
    expect(ev('Good morning', 'good morning', 'en')).toEqual({ ok: true, exact: true, similarity: 1, match: 'good morning', hint: '' });
    expect(ev('Buenos días', 'buenos dias', 'es').ok).toBe(true);
    expect(ev('Dónde está el baño', 'Dónde está el baño?', 'es').exact).toBe(true);
  });
  it('contracciones equivalen en inglés', () => {
    expect(ev("I'm fine", 'I am fine', 'en').exact).toBe(true);
    expect(ev('wasnt', 'was not', 'en').exact).toBe(true);
  });
  it('acepta erratas pequeñas y avisa de la escritura exacta', () => {
    const r = ev('beautifull', 'beautiful', 'en');
    expect(r.ok).toBe(true);
    expect(r.exact).toBe(false);
    expect(nearMissNote(r)).toBe('(Nota la escritura exacta: "beautiful")');
    expect(ev('graciass', 'gracias', 'es').ok).toBe(true);
  });
  it('además de ser errata, debe alcanzar el 85 % de parecido', () => {
    const corta = ev('frend', 'friend', 'en');       // una errata, pero 5/6 = 83 %: no llega
    expect(corta.ok).toBe(false);
    expect(corta.similarity).toBeCloseTo(0.833, 2);
    const larga = ev('friendd', 'friend', 'en');     // una errata y 6/7 = 86 %: sí llega
    expect(larga.ok).toBe(true);
    expect(larga.similarity).toBeCloseTo(0.857, 2);
  });
  it('perdona un espacio mal puesto', () => expect(ev('goodmorning', 'Good morning', 'en').ok).toBe(true));
  it('rechaza otra palabra aunque el parecido sea alto (She/He, 3/4)', () => {
    const r = ev('She is a doctor', 'He is a doctor', 'en');
    expect(r.ok).toBe(false);
    expect(r.similarity).toBeGreaterThan(0.9);
    expect(r.hint).toBe('revisa: she → he');
    expect(closeCallSuffix(r)).toBe(' (revisa: she → he)');
    expect(ev('I have 3 cats', 'I have 4 cats', 'en').ok).toBe(false);
  });
  it('rechaza plurales, género y palabras cortas distintas', () => {
    expect(ev('friends', 'friend', 'en').ok).toBe(false);
    expect(ev('gato', 'gata', 'es').ok).toBe(false);
    expect(ev('ship', 'shop', 'en').ok).toBe(false);
  });
  it('rechaza una palabra de menos o de más', () => {
    expect(ev('he dont', 'he does not', 'en').ok).toBe(false);
    expect(ev('the book (old)', 'the book', 'en').ok).toBe(false);
  });
  it('entrada vacía', () => expect(ev('', 'x', 'en')).toEqual({ ok: false, exact: false, similarity: 0, match: null, hint: '' }));
  it('writeAnswerOk usa español por defecto', () => {
    expect(writeAnswerOk('Buenos días', 'buenos dias')).toBe(true);
    expect(writeAnswerOk('adios', 'hola')).toBe(false);
  });
});

describe('respuestas habladas', () => {
  it('speakTargets: una opción por cada "a / b"', () => expect(speakTargets('Hello / Hi there')).toEqual(['hello', 'hi there']));
  it('isSpeakable descarta [huecos] y "..."', () => {
    expect(isSpeakable(['hola'])).toBe(true);
    expect(isSpeakable(['a [b]'])).toBe(false);
    expect(isSpeakable(['wait...'])).toBe(false);
  });
});

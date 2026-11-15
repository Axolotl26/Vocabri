import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyExamples, applyNotes } from '../app/core/examples.js';

describe('applyExamples', () => {
  it('añade ejemplo por texto en inglés, sin importar el orden', () => {
    const list = [['Hi!', 'Hola'], ['Bye.', 'Adiós']];
    expect(applyExamples(list, [{ en: 'bye.', ex: 'Bye, see you!', exEs: 'Adiós, ¡nos vemos!' }])).toBe(1);
    expect(list[1][2]).toBe('Bye, see you!'); expect(list[1][3]).toBe('Adiós, ¡nos vemos!'); expect(list[0][2]).toBeUndefined();
  });
  it('respeta un ejemplo que ya existe', () => {
    const list = [['Hi!', 'Hola', 'Hi, Ana!', 'Hola, Ana']];
    applyExamples(list, [{ en: 'Hi!', ex: 'otro', exEs: 'otro' }]);
    expect(list[0][2]).toBe('Hi, Ana!');
  });
  it('tolera entradas inválidas', () => { expect(applyExamples(null, [])).toBe(0); expect(applyExamples([], null)).toBe(0); });
});

describe('general_examples en el JSON', () => {
  const db = JSON.parse(readFileSync(new URL('../base_de_datos_de_frases_vocabri.json', import.meta.url), 'utf8'));
  it('hay 1000 ejemplos completos y sin repetir', () => {
    const ex = db.general_examples;
    expect(ex.length).toBe(1000);
    ex.forEach(e => expect(e.en && e.ex && e.exEs).toBeTruthy());
    expect(new Set(ex.map(e => e.en)).size).toBe(1000);
  });
});

describe('applyNotes', () => {
  it('pone nota y registro por texto en inglés', () => {
    const list = [['Thanks.', 'Gracias.'], ['Bye.', 'Chao.']];
    const n = applyNotes(list, [{ en: 'thanks.', note: 'Informal.', reg: { formal: 'Thank you.', normal: 'Thanks.', informal: 'Cheers.' } }]);
    expect(n).toBe(1);
    expect(list[0][5]).toBe('Informal.');
    expect(list[0][6].formal).toBe('Thank you.');
    expect(list[1][5]).toBeUndefined();
  });
  it('el JSON real trae notas para las 1000 frases de General', () => {
    const d = JSON.parse(readFileSync(new URL('../base_de_datos_de_frases_vocabri.json', import.meta.url), 'utf8'));
    expect(d.general_notes.length).toBe(1000);
    expect(d.general_notes.every(e => e.en && e.note)).toBe(true);
  });
});

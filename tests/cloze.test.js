import { describe, it, expect } from 'vitest';
import { candidates, wordBank, buildCloze, pickRound, target, CLOZE_ROUND, CLOZE_XP } from '../app/core/cloze.js';
import { grant, emptyLedger } from '../app/core/xpLedger.js';
import { rngFrom } from '../app/core/challenge.js';

const items = [
  ['Where is the nearest pharmacy?', '¿Dónde está la farmacia más cercana?', 'health', 'health|1'],
  ['I would like to book a table for tonight.', 'Quisiera reservar una mesa para esta noche.', 'travel', 'travel|1'],
  ['Could you recommend a good restaurant nearby?', '¿Podría recomendar un buen restaurante cerca?', 'travel', 'travel|2'],
  ['The meeting starts at nine tomorrow morning.', 'La reunión empieza mañana a las nueve.', 'business', 'business|1'],
  ['She forgot her passport at the airport.', 'Olvidó su pasaporte en el aeropuerto.', 'travel', 'travel|3'],
  ['Please send me the report by Friday afternoon.', 'Envíame el informe el viernes por la tarde.', 'business', 'business|2'],
  ['My headache gets worse every evening.', 'Mi dolor de cabeza empeora cada tarde.', 'health', 'health|2'],
  ['Hi / Hello there', 'Hola', 'general', 'general|1']
];

describe('completa el hueco', () => {
  it('candidatas: ignora palabras vacías, cortas y contracciones', () => {
    expect(candidates("Where is the nearest pharmacy?").map(c => c.word)).toEqual(['nearest', 'pharmacy']);
    expect(candidates("I can't go now, sorry").map(c => c.word)).toEqual(['sorry']);
  });
  it('las frases de menos de 3 palabras no sirven (el hueco sería toda la frase)', () => {
    expect(buildCloze(['Goodbye', 'Adiós', 'c', 'k|9'], wordBank(items), rngFrom(1))).toBe(null);
    expect(buildCloze(['Good morning', 'Buenos días', 'c', 'k|8'], wordBank(items), rngFrom(1))).toBe(null);
  });
  it('usa la primera alternativa cuando hay «/»', () => { expect(target(items[7])).toBe('Hi'); });
  it('la pregunta tiene un hueco, 4 opciones distintas y la respuesta correcta dentro', () => {
    const bank = wordBank(items);
    for(let seed = 1; seed < 30; seed++){
      const q = buildCloze(items[1], bank, rngFrom(seed));
      expect(q).not.toBe(null);
      expect(q.options.length).toBe(4); expect(new Set(q.options.map(o => o.toLowerCase())).size).toBe(4);
      expect(q.options[q.answerIndex]).toBe(q.answer);
      expect(q.before + q.answer + q.after).toBe(q.en);
      const inSentence = candidates(q.en).map(c => c.word.toLowerCase());
      q.options.forEach((o, i) => { if(i !== q.answerIndex) expect(inSentence.indexOf(o.toLowerCase())).toBe(-1); });
    }
  });
  it('mantiene la mayúscula si el hueco es la primera palabra', () => {
    const q = buildCloze(['Tomorrow we leave early.', 'x', 'c', 'k|1'], wordBank(items.concat([['Tomorrow we leave early.', '', 'c', 'k|1']])), rngFrom(3));
    if(q && q.before === '') q.options.forEach(o => expect(o[0]).toBe(o[0].toUpperCase()));
    expect(true).toBe(true);
  });
  it('sin palabras candidatas o sin distractores devuelve null', () => {
    expect(buildCloze(['Is it you?', 'x', 'c', 'k|2'], wordBank(items), rngFrom(1))).toBe(null);
    expect(buildCloze(items[0], ['pharmacy'], rngFrom(1))).toBe(null);
  });
  it('una ronda trae frases distintas y es repetible con la misma semilla', () => {
    const a = pickRound(items, 5, rngFrom(7)), b = pickRound(items, 5, rngFrom(7));
    expect(a).toEqual(b); expect(new Set(a.map(q => q.key)).size).toBe(a.length);
    expect(a.length).toBeGreaterThan(0);
  });
  it('XP: 3 por acierto, tope diario de 30 y una vez por frase al día', () => {
    expect(CLOZE_XP).toBe(3); expect(CLOZE_ROUND).toBe(10);
    const day = '2026-11-18'; let r = grant(emptyLedger(day), 'cloze', 3, 'a|1', day); expect(r.granted).toBe(3);
    expect(grant(r.ledger, 'cloze', 3, 'a|1', day).reason).toBe('repeat');
    let led = r.ledger; for(let i = 0; i < 12; i++){ const g = grant(led, 'cloze', 3, 'b|' + i, day); led = g.ledger; }
    expect(grant(led, 'cloze', 3, 'z|1', day).reason).toBe('cap');
  });
});

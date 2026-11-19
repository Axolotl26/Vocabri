import { describe, it, expect } from 'vitest';
import { scoreAnswer, summarize, compare, rngFrom, hashStr, pickKeys, buildQuestions, encodeChallenge, decodeChallenge, challengeUrl, cleanName, recordPlayed, normalizeStore, CHALLENGE_N } from '../app/core/challenge.js';
import { grant, emptyLedger } from '../app/core/xpLedger.js';

const items = []; for(let i = 0; i < 40; i++) items.push(['phrase ' + i, 'frase ' + i, i < 20 ? 'A' : 'B', (i < 20 ? 'A' : 'B') + '|' + i]);
const keys = items.slice(0, 10).map(x => x[3]);
const ch = { keys, name: 'Ana', score: 900, ok: 8, ms: 41000 };

describe('retos con un amigo', () => {
  it('puntaje: 100 por acierto más bonus por rapidez', () => {
    expect(scoreAnswer(false, 100)).toBe(0);
    expect(scoreAnswer(true, 0)).toBe(150);
    expect(scoreAnswer(true, 2000)).toBe(130);
    expect(scoreAnswer(true, 9000)).toBe(100);
  });
  it('summarize suma aciertos, puntaje y tiempo', () => {
    const s = summarize([{ good: true, ms: 1000 }, { good: false, ms: 3000 }, { good: true, ms: 6000 }]);
    expect(s.ok).toBe(2); expect(s.ms).toBe(10000); expect(s.score).toBe(140 + 100);
  });
  it('compare: puntaje, luego tiempo, luego empate', () => {
    expect(compare({ score: 500, ms: 9 }, { score: 400, ms: 1 })).toBe('win');
    expect(compare({ score: 400, ms: 9 }, { score: 500, ms: 1 })).toBe('lose');
    expect(compare({ score: 400, ms: 5 }, { score: 400, ms: 9 })).toBe('win');
    expect(compare({ score: 400, ms: 9 }, { score: 400, ms: 9 })).toBe('tie');
  });
  it('la semilla da siempre la misma secuencia', () => {
    const a = rngFrom(hashStr('x')), b = rngFrom(hashStr('x'));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(pickKeys(keys, 5, rngFrom(1))).toEqual(pickKeys(keys, 5, rngFrom(1)));
  });
  it('las preguntas son idénticas para los dos jugadores', () => {
    const q1 = buildQuestions(keys, items, 'abc'), q2 = buildQuestions(keys, items, 'abc');
    expect(q1).toEqual(q2); expect(q1.length).toBe(10);
    q1.forEach(q => { expect(q.options.length).toBe(4); expect(q.options[q.answer]).toBe(q.en); expect(new Set(q.options).size).toBe(4); });
  });
  it('código: ida y vuelta, y con enlace completo', () => {
    const code = encodeChallenge(ch), back = decodeChallenge(code);
    expect(back.keys).toEqual(keys); expect(back.name).toBe('Ana'); expect(back.score).toBe(900); expect(back.ok).toBe(8);
    const url = challengeUrl('https://axolotl26.github.io/Vocabri/#x', ch);
    expect(url.indexOf('#reto=')).toBeGreaterThan(0); expect(decodeChallenge(url).score).toBe(900);
    expect(decodeChallenge(code).id).toBe(back.id);
  });
  it('rechaza códigos alterados o basura', () => {
    const code = encodeChallenge(ch);
    expect(decodeChallenge('hola')).toBe(null); expect(decodeChallenge('')).toBe(null); expect(decodeChallenge(null)).toBe(null);
    const bad = code.slice(0, 30) + (code[30] === 'A' ? 'B' : 'A') + code.slice(31);
    expect(decodeChallenge(bad)).toBe(null);
    const forged = encodeChallenge(Object.assign({}, ch, { score: 900 })).replace(/.$/, '');
    expect(decodeChallenge(forged)).toBe(null);
  });
  it('limpia el nombre y admite acentos', () => {
    expect(cleanName('  <b>José</b>   "María" ')).toBe('bJosé/b María');
    expect(cleanName('x'.repeat(40)).length).toBe(16);
    expect(decodeChallenge(encodeChallenge(Object.assign({}, ch, { name: 'Ñoño' }))).name).toBe('Ñoño');
  });
  it('historial y victorias', () => {
    let s = normalizeStore(null);
    s = recordPlayed(s, { id: 'a', name: 'Ana', mine: 5, theirs: 3, res: 'win', at: 1 });
    s = recordPlayed(s, { id: 'b', name: 'Luis', mine: 1, theirs: 3, res: 'lose', at: 2 });
    expect(s.wins).toBe(1); expect(s.total).toBe(2); expect(s.played.length).toBe(2);
  });
  it('el XP de retos tiene tope diario y no se repite el mismo reto', () => {
    const day = '2026-11-18';
    let r = grant(emptyLedger(day), 'challenge', 40, 'r1', day); expect(r.granted).toBe(40);
    expect(grant(r.ledger, 'challenge', 40, 'r1', day).reason).toBe('repeat');
    r = grant(r.ledger, 'challenge', 40, 'r2', day); expect(r.granted).toBe(20);
    expect(grant(r.ledger, 'challenge', 40, 'r3', day).reason).toBe('cap');
  });
  it('el reto tiene 10 frases', () => { expect(CHALLENGE_N).toBe(10); });
});

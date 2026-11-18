import { describe, it, expect } from 'vitest';
import { missionStats, buildSurvivalRound, buildTimeRound, abandonMission, registerAnswer, buildRegisterRound, expireIfNeeded, daysLeft, DURATION_MS, GAP_MISSED_MS, emptyMissions, normalizeMissions, shouldStart, startMission, completeMission, nextMode, tokenize, checkOrder, buildOrderRound, MIN_SEEN, GAP_MS } from '../app/core/missions.js';

const NOW = 1_800_000_000_000;
describe('misiones', () => {
  it('no empieza sin frases vistas suficientes ni con una activa', () => {
    expect(shouldStart(emptyMissions(), NOW, MIN_SEEN - 1)).toBe(false);
    expect(shouldStart(emptyMissions(), NOW, MIN_SEEN)).toBe(true);
    expect(shouldStart(startMission(emptyMissions(), NOW, 'general'), NOW, 99)).toBe(false);
  });
  it('completar guarda historial, libera la activa y exige descanso', () => {
    let s = startMission(emptyMissions(), NOW, 'travel');
    expect(s.active.mode).toBe(nextMode(emptyMissions()));
    s = completeMission(s, NOW + 1000, 7);
    expect(s.active).toBe(null); expect(s.count).toBe(1); expect(s.done[0].score).toBe(7);
    expect(shouldStart(s, NOW + 1000 + GAP_MS - 1, 99)).toBe(false);
    expect(shouldStart(s, NOW + 1000 + GAP_MS, 99)).toBe(true);
  });
  it('la misión vence a los 5 días y queda como perdida', () => {
    const s = startMission(emptyMissions(), NOW, 'general');
    expect(expireIfNeeded(s, NOW + DURATION_MS - 1)).toBe(s);
    expect(daysLeft(s.active, NOW)).toBe(5);
    expect(daysLeft(s.active, NOW + DURATION_MS - 1)).toBe(1);
    const e = expireIfNeeded(s, NOW + DURATION_MS + 5);
    expect(e.active).toBe(null); expect(e.missed.length).toBe(1); expect(e.count).toBe(0);
    expect(shouldStart(e, NOW + DURATION_MS + GAP_MISSED_MS - 1, 99)).toBe(false);
    expect(shouldStart(e, NOW + DURATION_MS + GAP_MISSED_MS, 99)).toBe(true);
  });
  it('normalizeMissions descarta basura', () => {
    expect(normalizeMissions('x')).toEqual(emptyMissions());
    expect(normalizeMissions({ active: { id: 'm1', mode: 'zzz' } }).active).toBe(null);
  });
  it('checkOrder ignora mayúsculas y puntuación', () => {
    expect(checkOrder(tokenize('Where is the gate?'), ['where', 'is', 'the', 'gate'])).toBe(true);
    expect(checkOrder(tokenize('Where is the gate?'), ['is', 'where', 'the', 'gate'])).toBe(false);
  });
  it('buildOrderRound: solo 4–9 palabras, nunca ordenada, prefiere vistas', () => {
    const items = [['Hi', 'Hola', 'c', 'a'], ['Where is the gate?', 'x', 'c', 'b'], ['I would like a table please', 'x', 'c', 'c'], ['This is a very long sentence with way too many words in it', 'x', 'c', 'd']];
    const r = buildOrderRound(items, ['c'], 8, () => 0.3);
    expect(r.map(x => x.key).sort()).toEqual(['b', 'c']);
    expect(r[0].key).toBe('c');
    r.forEach(x => expect(x.tiles.every((t, i) => t.i === i)).toBe(false));
  });
  it('abandonMission cuenta como perdida y aplica el descanso', () => {
    const s = startMission(emptyMissions(), NOW, 'general');
    const a = abandonMission(s, NOW + 1000);
    expect(a.active).toBe(null); expect(a.missed.length).toBe(1);
    expect(shouldStart(a, NOW + 1000 + GAP_MISSED_MS - 1, 99)).toBe(false);
    expect(shouldStart(a, NOW + 1000 + GAP_MISSED_MS, 99)).toBe(true);
    expect(abandonMission(emptyMissions(), NOW).missed.length).toBe(0);
  });
  it('registerAnswer encuentra el registro de la frase', () => {
    const reg = { formal: 'How are you today?', normal: 'How are you?', informal: 'How you doing?' };
    expect(registerAnswer(reg, 'How you doing?')).toBe('informal');
    expect(registerAnswer(reg, 'Hi there')).toBe(null);
  });
  it('buildRegisterRound reparte registros y descarta frases sin respuesta', () => {
    const mk = (k, en, reg) => [en, 'es', 'c', k, '', '', '', reg];
    const R = { formal: 'F one', normal: 'N one', informal: 'I one' };
    const items = [mk('a', 'F one', R), mk('b', 'N one', R), mk('c', 'I one', R), mk('d', 'Zzz', R), mk('e', 'x', null)];
    const r = buildRegisterRound(items, [], 8, () => 0.4);
    expect(r.map(x => x.answer).sort()).toEqual(['formal', 'informal', 'normal']);
    expect(r.every(x => x.rows.length === 3)).toBe(true);
  });
  it('buildTimeRound: 3 opciones, la correcta está y no hay repetidas', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map(k => ['Phrase ' + k, 'Frase ' + k, 'c', k]);
    const r = buildTimeRound(items, ['c'], 40, () => 0.2);
    expect(r.length).toBe(5);
    expect(r[0].key).toBe('c');
    r.forEach(q => { expect(q.options.length).toBe(3); expect(new Set(q.options).size).toBe(3); expect(q.options[q.answer]).toBe(q.en); });
    expect(buildTimeRound(items.slice(0, 2), [], 40)).toEqual([]);
  });
  it('buildSurvivalRound alterna tipos y no repite frases', () => {
    const R = { formal: 'F x', normal: 'N x', informal: 'I x' };
    const items = ['a', 'b', 'c', 'd', 'e', 'f'].map((k, i) => [i % 3 === 0 ? 'F x' : i % 3 === 1 ? 'N x' : 'I x', 'es' + k, 'c', k, '', '', '', R]);
    const r = buildSurvivalRound(items, [], 10, () => 0.3);
    expect(r.length).toBeGreaterThan(0);
    expect(new Set(r.map(q => q.key)).size).toBe(r.length);
    r.forEach(q => expect(['tr', 'reg']).toContain(q.type));
  });
  it('missionStats: racha de cumplidas sin perder, modos y perfectas', () => {
    const st = { active: null, count: 4, done: [
      { id: 'm1', mode: 'order', cat: 'g', at: 1, score: 8 }, { id: 'm2', mode: 'register', cat: 'g', at: 2, score: 6 },
      { id: 'm4', mode: 'time', cat: 'g', at: 4, score: 10 }, { id: 'm5', mode: 'survival', cat: 'g', at: 5, score: 12 }],
      missed: [{ id: 'm3', mode: 'time', cat: 'g', at: 3 }] };
    expect(missionStats(st)).toEqual({ done: 4, missed: 1, modes: 4, bestRun: 2, perfects: 1 });
  });
});

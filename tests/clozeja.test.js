import { describe, it, expect } from 'vitest';
import { buildClozeJa, pickRoundJa } from '../app/core/cloze.js';
const mk = (w, ex, id) => [w, 'es', 'cat', id, ex, 'trad', '', null, '', 'rom'];
const items = [mk('猫', '私は猫が好きです。', 'a'), mk('犬', '犬がいます。', 'b'), mk('水', '水をください。', 'c'), mk('本', '本を読む。', 'd'), mk('車', '車に乗る。', 'e'), mk('空', '', 'f')];
describe('cloze ja', () => {
  it('tapa la palabra y da 4 opciones', () => {
    const q = buildClozeJa(items[0], items.map(i => i[0]), () => 0.3);
    expect(q.before + q.answer + q.after).toBe(items[0][4]);
    expect(q.options.length).toBe(4); expect(q.options[q.answerIndex]).toBe('猫');
    expect(new Set(q.options).size).toBe(4);
  });
  it('descarta sin ejemplo', () => { expect(buildClozeJa(items[5], items.map(i => i[0]), Math.random)).toBe(null); });
  it('ronda', () => { expect(pickRoundJa(items, 10, Math.random).length).toBe(5); });
});

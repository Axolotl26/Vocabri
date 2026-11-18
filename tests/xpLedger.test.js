import { describe, it, expect } from 'vitest';
import { grant, emptyLedger, XP_RULES, capReached } from '../app/core/xpLedger.js';

const D = '2026-11-15';

describe('grant', () => {
  it('paga y acumula por fuente', () => {
    let l = emptyLedger(D);
    const r = grant(l, 'lesson', 10, 'general|1', D);
    expect(r.granted).toBe(10); expect(r.reason).toBe('ok');
    expect(r.ledger.by.lesson).toBe(10);
  });
  it('Escucha y escribe paga una sola vez por frase al día', () => {
    let l = emptyLedger(D);
    const a = grant(l, 'dictation', 5, 'general|7', D);
    const b = grant(a.ledger, 'dictation', 5, 'general|7', D);
    expect(a.granted).toBe(5);
    expect(b.granted).toBe(0); expect(b.reason).toBe('repeat');
  });
  it('respeta el tope diario y recorta el último pago', () => {
    let l = emptyLedger(D), total = 0;
    for(let i = 0; i < 30; i++){ const r = grant(l, 'dictation', 5, 'k' + i, D); l = r.ledger; total += r.granted; }
    expect(total).toBe(XP_RULES.dictation.daily);
    expect(grant(l, 'dictation', 5, 'nueva', D).reason).toBe('cap');
    expect(capReached(l, 'dictation', D)).toBe(true);
  });
  it('las tarjetas propias pagan menos y con su propio tope', () => {
    let l = emptyLedger(D), total = 0;
    for(let i = 0; i < 100; i++){ const r = grant(l, 'lesson', 10, 'custom|' + i, D); l = r.ledger; total += r.granted; }
    expect(total).toBe(XP_RULES.custom.daily);
    expect(grant(l, 'lesson', 10, 'general|1', D).granted).toBe(10);   // las normales no se ven afectadas
  });
  it('cambia el día = libro nuevo', () => {
    let l = grant(emptyLedger(D), 'dictation', 5, 'k', D).ledger;
    const r = grant(l, 'dictation', 5, 'k', '2026-11-16');
    expect(r.granted).toBe(5);
  });
  it('las fuentes sin tope no se recortan', () => {
    expect(grant(emptyLedger(D), 'exam', 55, 'x', D).granted).toBe(55);
    expect(grant(emptyLedger(D), 'inventada', 9, null, D).granted).toBe(9);
  });
});

import { describe, it, expect } from 'vitest';
import {
  DAY_MS, REVIEW_AGAIN_MS, LEECH_LAPSES,
  srsInterval, srsLateDays, srsNextInterval, srsGapText, srsDueAt, srsStartOfDay, srsWouldApply, srsPlanGrade
} from '../app/core/srs.js';

const NOW = Date.UTC(2026, 5, 15, 15, 30, 0);
const MID = () => 0.5;                       // dispersión ±6 %: con 0.5 el factor es exactamente 1
const card = (o) => Object.assign({ m:false, t:0, lvl:0, next:0, reps:0, lapses:0 }, o);

describe('srsInterval', () => {
  it('usa el intervalo guardado', () => expect(srsInterval({ iv: 7 })).toBe(7));
  it('deriva el intervalo del nivel en tarjetas del sistema anterior', () => {
    expect(srsInterval({ lvl: 1 })).toBe(0);
    expect(srsInterval({ lvl: 2 })).toBe(2);
    expect(srsInterval({ lvl: 3 })).toBe(10);
  });
  it('tarjeta nueva = 0', () => expect(srsInterval({})).toBe(0));
});

describe('srsLateDays', () => {
  it('cuenta los días de retraso', () => expect(srsLateDays({ next: NOW - 3 * DAY_MS }, NOW)).toBe(3));
  it('0 si no ha vencido o no hay registro', () => {
    expect(srsLateDays({ next: NOW + 10 }, NOW)).toBe(0);
    expect(srsLateDays(null, NOW)).toBe(0);
  });
});

describe('srsNextInterval', () => {
  it('"Otra vez" siempre vuelve a 0', () => {
    for (const prev of [0, 1, 10, 300]) expect(srsNextInterval(prev, 1, null, NOW)).toBe(0);
  });
  it('tarjeta nueva: Difícil 1 día · Bien 2 días · Fácil 5 días (mínimos)', () => {
    expect(srsNextInterval(0, 2, null, NOW)).toBe(1);
    expect(srsNextInterval(0, 3, null, NOW)).toBe(2);
    expect(srsNextInterval(0, 4, null, NOW)).toBe(5);
  });
  it('multiplica el intervalo: ×1.2 · ×2.2 · ×3.5', () => {
    expect(srsNextInterval(10, 2, null, NOW)).toBe(12);
    expect(srsNextInterval(10, 3, null, NOW)).toBe(22);
    expect(srsNextInterval(10, 4, null, NOW)).toBe(35);
  });
  it('nunca pasa de 365 días', () => {
    expect(srsNextInterval(300, 2, null, NOW)).toBe(360);
    expect(srsNextInterval(300, 3, null, NOW)).toBe(365);
    expect(srsNextInterval(300, 4, null, NOW)).toBe(365);
  });
  it('bonus por acertar una tarjeta vencida (hasta el intervalo previo)', () => {
    const tarde = { next: NOW - 5 * DAY_MS };   // 5 días tarde → +2.5 d efectivos
    expect(srsNextInterval(10, 3, tarde, NOW)).toBe(28);
    const muyTarde = { next: NOW - 40 * DAY_MS };  // el bonus se topa en el intervalo previo
    expect(srsNextInterval(10, 3, muyTarde, NOW)).toBe(44);
  });
  it('sin bonus si la nota es Difícil', () => {
    expect(srsNextInterval(10, 2, { next: NOW - 5 * DAY_MS }, NOW)).toBe(12);
  });
  it('tras un fallo (reaprendizaje) vuelve al tramo reducido, sin multiplicar', () => {
    const rl = { rl: true };
    expect(srsNextInterval(10, 2, rl, NOW)).toBe(8);
    expect(srsNextInterval(10, 3, rl, NOW)).toBe(10);
    expect(srsNextInterval(10, 4, rl, NOW)).toBe(13);
    expect(srsNextInterval(1, 4, rl, NOW)).toBe(2);
  });
});

describe('srsGapText', () => {
  it('formatea el intervalo para los botones', () => {
    expect(srsGapText(0)).toBe('10 min');
    expect(srsGapText(1)).toBe('1 día');
    expect(srsGapText(7)).toBe('7 días');
    expect(srsGapText(29)).toBe('29 días');
    expect(srsGapText(30)).toBe('1 mes');
    expect(srsGapText(60)).toBe('2 meses');
    expect(srsGapText(365)).toBe('12 meses');
  });
});

describe('srsWouldApply', () => {
  it('tarjeta nueva, vencida o en reaprendizaje: la nota mueve el calendario', () => {
    expect(srsWouldApply({}, 3, NOW)).toBe(true);
    expect(srsWouldApply({ next: NOW - 1 }, 3, NOW)).toBe(true);
    expect(srsWouldApply({ next: NOW + DAY_MS, rl: true }, 3, NOW)).toBe(true);
  });
  it('repaso anticipado con acierto: no cambia nada', () => {
    for (const g of [2, 3, 4]) expect(srsWouldApply({ next: NOW + DAY_MS }, g, NOW)).toBe(false);
  });
  it('un fallo siempre se aplica', () => expect(srsWouldApply({ next: NOW + DAY_MS }, 1, NOW)).toBe(true));
});

describe('srsDueAt / srsStartOfDay', () => {
  it('vence a medianoche local, no "dentro de 24 h"', () => {
    const d = new Date(srsDueAt(1, NOW));
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    expect(Math.round((srsDueAt(1, NOW) - srsStartOfDay(NOW)) / DAY_MS)).toBe(1);
    expect(Math.round((srsDueAt(30, NOW) - srsStartOfDay(NOW)) / DAY_MS)).toBe(30);
  });
  it('0 días = el comienzo de hoy', () => expect(srsDueAt(0, NOW)).toBe(srsStartOfDay(NOW)));
});

describe('srsPlanGrade', () => {
  it('tarjeta nueva con "Bien": 2 días, nivel 2, aún no dominada', () => {
    const r = srsPlanGrade(card(), 3, NOW, {}, MID);
    expect(r.applied).toBe(true);
    expect(r.record.iv).toBe(2);
    expect(r.record.lvl).toBe(2);
    expect(r.record.m).toBe(false);
    expect(r.record.rl).toBe(false);
    expect(r.record.reps).toBe(1);
    expect(r.record.t).toBe(NOW);
    expect(r.record.next).toBe(srsDueAt(2, NOW));
  });
  it('tarjeta nueva con "Fácil": 5 días', () => {
    expect(srsPlanGrade(card(), 4, NOW, {}, MID).record.iv).toBe(5);
  });
  it('al llegar a 10 días la tarjeta se da por dominada y guarda cuándo', () => {
    const r = srsPlanGrade(card({ lvl: 2, iv: 10, next: NOW - 1, reps: 3 }), 3, NOW, {}, MID);
    expect(r.record.iv).toBeGreaterThanOrEqual(10);
    expect(r.record.m).toBe(true);
    expect(r.record.lvl).toBe(3);
    expect(r.record.mt).toBe(NOW);
  });
  it('conserva la fecha original de dominio', () => {
    const r = srsPlanGrade(card({ lvl: 3, iv: 20, next: NOW - 1, m: true, mt: 123 }), 3, NOW, {}, MID);
    expect(r.record.mt).toBe(123);
  });
  it('"Otra vez": reduce el intervalo (×0.4), suma un fallo y reaparece en 10 min', () => {
    const r = srsPlanGrade(card({ lvl: 3, iv: 20, next: NOW - 1, m: true, reps: 5 }), 1, NOW, {}, MID);
    expect(r.record.iv).toBe(8);
    expect(r.record.lapses).toBe(1);
    expect(r.record.rl).toBe(true);
    expect(r.record.lvl).toBe(1);
    expect(r.record.m).toBe(false);
    expect(r.record.next).toBe(NOW + REVIEW_AGAIN_MS);
  });
  it('fallar de nuevo en reaprendizaje no suma otro fallo', () => {
    const r = srsPlanGrade(card({ iv: 8, rl: true, next: NOW - 1, lapses: 1 }), 1, NOW, {}, MID);
    expect(r.record.lapses).toBe(1);
    expect(r.record.iv).toBe(8);
  });
  it('tarjeta nueva fallada: intervalo 0 y cuenta el fallo', () => {
    const r = srsPlanGrade(card(), 1, NOW, {}, MID);
    expect(r.record.iv).toBe(0);
    expect(r.record.lapses).toBe(1);
  });
  it('tras un fallo, acertar saca la tarjeta de reaprendizaje', () => {
    const r = srsPlanGrade(card({ iv: 8, rl: true, next: NOW - 1, lapses: 1 }), 3, NOW, {}, MID);
    expect(r.record.rl).toBe(false);
    expect(r.record.iv).toBe(8);
  });
  it('sanguijuela: se marca al llegar a 4 fallos', () => {
    expect(LEECH_LAPSES).toBe(4);
    expect(srsPlanGrade(card({ iv: 5, lapses: 3, next: NOW - 1 }), 1, NOW, {}, MID).leech).toBe(true);
    expect(srsPlanGrade(card({ iv: 5, lapses: 2, next: NOW - 1 }), 1, NOW, {}, MID).leech).toBe(false);
  });
  it('repaso anticipado con acierto: solo cuenta actividad, el calendario no se toca', () => {
    const cur = card({ lvl: 3, iv: 30, next: NOW + 12 * DAY_MS, reps: 9, m: true });
    const r = srsPlanGrade(cur, 3, NOW, {}, MID);
    expect(r.applied).toBe(false);
    expect(r.record.next).toBe(cur.next);
    expect(r.record.iv).toBe(30);
    expect(r.record.reps).toBe(10);
    expect(r.record.t).toBe(NOW);
  });
  it('no modifica el registro recibido', () => {
    const cur = card({ iv: 3, next: NOW - 1 });
    const copia = JSON.stringify(cur);
    srsPlanGrade(cur, 4, NOW, {}, MID);
    expect(JSON.stringify(cur)).toBe(copia);
  });
  it('minIv fija un mínimo (repasos de sección)', () => {
    expect(srsPlanGrade(card(), 2, NOW, { minIv: 3 }, MID).record.iv).toBe(3);
  });
  it('la dispersión ±6 % solo actúa desde 7 días y respeta los extremos', () => {
    const base = card({ iv: 20, next: NOW - 1 });
    const bajo = srsPlanGrade(base, 3, NOW, {}, () => 0).record.iv;
    const alto = srsPlanGrade(base, 3, NOW, {}, () => 0.9999999).record.iv;
    expect(bajo).toBeLessThan(alto);
    expect(bajo).toBeGreaterThanOrEqual(Math.floor(srsNextInterval(20, 3, base, NOW) * 0.94));
    expect(alto).toBeLessThanOrEqual(Math.ceil(srsNextInterval(20, 3, base, NOW) * 1.06));
    expect(srsPlanGrade(card(), 3, NOW, {}, () => 0).record.iv).toBe(2);   // < 7 días: sin dispersión
  });
  it('el intervalo nunca supera 365 días', () => {
    const r = srsPlanGrade(card({ iv: 300, next: NOW - 1 }), 4, NOW, {}, () => 0.9999999);
    expect(r.record.iv).toBe(365);
  });
});

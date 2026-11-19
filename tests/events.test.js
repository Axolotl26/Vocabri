import { describe, it, expect } from 'vitest';
import { GOAL, BONUS_XP, MIN_DAYS, THEMES, themeForWeek, normalizeEvents, recordStudy, eventStatus, daysLeftInWeek } from '../app/core/events.js';

const d = (y, m, day) => new Date(y, m - 1, day, 12);
const OK = { good: true };
const TH = themeForWeek('2026-11-16').id;
// estudia n frases distintas el día `day` de noviembre 2026
const study = (st, n, day, from) => { let r = { state: st }; for(let i = 0; i < n; i++) r = recordStudy(r.state, TH + '|' + (from || 0) + '_' + i, d(2026, 11, day), OK); return r; };

describe('evento de la semana', () => {
  it('el tema rota: semanas seguidas son distintas y se repite cada 6', () => {
    expect(themeForWeek('2026-11-16').id).not.toBe(themeForWeek('2026-11-23').id);
    expect(themeForWeek('2026-11-16').id).toBe(themeForWeek('2026-12-28').id);
    const seen = new Set(); for(let i = 0; i < 6; i++) seen.add(themeForWeek(new Date(Date.UTC(2026, 10, 16 + 7 * i)).toISOString().slice(0, 10)).id);
    expect(seen.size).toBe(THEMES.length);
  });
  it('solo cuentan frases de la categoría del evento, una vez cada una', () => {
    const now = d(2026, 11, 17), other = THEMES.find(t => t.id !== TH).id;
    let r = recordStudy(null, other + '|a', now, OK); expect(r.counted).toBe(false);
    r = recordStudy(r.state, TH + '|a', now, OK); expect(r.counted).toBe(true);
    r = recordStudy(r.state, TH + '|a', now, OK); expect(r.counted).toBe(false);
    r = recordStudy(r.state, 'custom|9', now, OK); expect(r.counted).toBe(false);
    expect(eventStatus(r.state, now).count).toBe(1);
  });
  it('«Otra vez», repasos no aplicados o sin opciones no cuentan', () => {
    const now = d(2026, 11, 17);
    expect(recordStudy(null, TH + '|a', now).counted).toBe(false);
    expect(recordStudy(null, TH + '|a', now, { good: false }).counted).toBe(false);
  });
  it('estudiar las 15 en un solo día NO cierra el evento', () => {
    const r = study(null, GOAL, 17);
    expect(r.completedNow).toBe(false); expect(r.state.done).toBe(false);
    const s = eventStatus(r.state, d(2026, 11, 17));
    expect(s.count).toBe(GOAL); expect(s.waitDays).toBe(true); expect(s.days).toBe(1);
  });
  it('se cierra al juntar 15 frases y 3 días distintos, y paga la insignia una sola vez', () => {
    let r = study(null, 8, 17, 1);
    r = study(r.state, 4, 18, 2);
    expect(r.completedNow).toBe(false);
    r = study(r.state, 3, 19, 3);               // 15 frases, 3 días
    expect(r.completedNow).toBe(true); expect(r.state.badges[TH]).toBe(1); expect(r.state.done).toBe(true);
    const again = recordStudy(r.state, TH + '|otra', d(2026, 11, 20), OK);
    expect(again.completedNow).toBe(false); expect(again.state.badges[TH]).toBe(1);
  });
  it('con las 15 ya hechas, los días que faltan se completan repasando una frase de nuevo', () => {
    let r = study(null, GOAL, 17);
    r = recordStudy(r.state, TH + '|0_0', d(2026, 11, 18), OK); expect(r.counted).toBe(true); expect(r.completedNow).toBe(false);
    r = recordStudy(r.state, TH + '|0_0', d(2026, 11, 18), OK); expect(r.counted).toBe(false);      // mismo día: nada cambia
    r = recordStudy(r.state, TH + '|0_1', d(2026, 11, 19), OK); expect(r.completedNow).toBe(true);
  });
  it('al cambiar de semana el progreso se reinicia pero la insignia se conserva', () => {
    let r = study(null, 8, 17, 1); r = study(r.state, 4, 18, 2); r = study(r.state, 3, 19, 3);
    const next = normalizeEvents(r.state, d(2026, 11, 24));
    expect(next.keys).toEqual([]); expect(next.days).toEqual([]); expect(next.done).toBe(false); expect(next.badges[TH]).toBe(1);
    expect(next.theme).toBe(themeForWeek('2026-11-23').id);
  });
  it('datos corruptos no rompen nada', () => {
    const now = d(2026, 11, 17);
    expect(normalizeEvents('x', now).keys).toEqual([]);
    expect(normalizeEvents({ badges: { travel: 'a', fake: 3 }, keys: [1, 'a|b'], days: ['hola'] }, now).badges).toEqual({ travel: 0 });
    expect(normalizeEvents({ days: ['hola', '2026-11-17'] }, now).days).toEqual([]);   // semana distinta/vacía: se reinicia
  });
  it('días que quedan: lunes 7, domingo 1', () => {
    expect(daysLeftInWeek(d(2026, 11, 16))).toBe(7); expect(daysLeftInWeek(d(2026, 11, 22))).toBe(1);
  });
  it('constantes', () => { expect(GOAL).toBe(15); expect(BONUS_XP).toBe(100); expect(MIN_DAYS).toBe(3); });
});

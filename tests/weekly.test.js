import { describe, it, expect } from 'vitest';
import { GOAL_DAYS, BONUS_XP, weekStartISO, normalizeWeekly, recordDay, chestState, claimChest, weekDays } from '../app/core/weekly.js';

const d = (y, m, day) => new Date(y, m - 1, day, 12);   // mediodía local
describe('cofre semanal', () => {
  it('la semana empieza el lunes', () => {
    expect(weekStartISO(d(2026, 11, 17))).toBe('2026-11-16');   // martes
    expect(weekStartISO(d(2026, 11, 22))).toBe('2026-11-16');   // domingo
    expect(weekStartISO(d(2026, 11, 23))).toBe('2026-11-23');   // lunes siguiente
  });
  it('registra cada día una sola vez', () => {
    let w = recordDay(null, d(2026, 11, 16));
    w = recordDay(w, d(2026, 11, 16)); w = recordDay(w, d(2026, 11, 17));
    expect(w.days).toEqual(['2026-11-16', '2026-11-17']);
  });
  it('se llena con GOAL_DAYS días y se abre una sola vez', () => {
    let w = null;
    for(let i = 16; i < 16 + GOAL_DAYS; i++) w = recordDay(w, d(2026, 11, i));
    const now = d(2026, 11, 19);
    expect(chestState(w, now).ready).toBe(true);
    const r = claimChest(w, now);
    expect(r.xp).toBe(BONUS_XP);
    expect(chestState(r.state, now).claimed).toBe(true);
    expect(claimChest(r.state, now).xp).toBe(0);
  });
  it('sin los días necesarios no hay bono', () => {
    const w = recordDay(null, d(2026, 11, 16));
    expect(chestState(w, d(2026, 11, 17)).left).toBe(GOAL_DAYS - 1);
    expect(claimChest(w, d(2026, 11, 17)).xp).toBe(0);
  });
  it('al cambiar de semana el cofre empieza de cero', () => {
    let w = null; for(let i = 16; i < 20; i++) w = recordDay(w, d(2026, 11, i));
    const next = normalizeWeekly(claimChest(w, d(2026, 11, 19)).state, d(2026, 11, 24));
    expect(next.days).toEqual([]); expect(next.claimed).toBe(false);
  });
  it('weekDays devuelve siete casillas marcando hoy', () => {
    const w = recordDay(null, d(2026, 11, 16)), days = weekDays(w, d(2026, 11, 18));
    expect(days.length).toBe(7); expect(days[0].done).toBe(true);
    expect(days[2].today).toBe(true); expect(days[3].future).toBe(true);
  });
});

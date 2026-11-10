import { describe, it, expect } from 'vitest';
import {
  cardDedupKey, cloudParse, cloudNum, dayKeyNum, cloudDataEqual,
  mergeCardRecord, mergeStageMaps, mergeExamResult, mergeCustomWords, mergeCustomCats, mergeCooldownState, mergeProgressData
} from '../app/core/cloudMerge.js';

const J = JSON.stringify;

describe('ayudas', () => {
  it('cloudParse devuelve el valor de reserva si el JSON no sirve', () => {
    expect(cloudParse('{"a":1}', null)).toEqual({ a: 1 });
    expect(cloudParse('no es json', 7)).toBe(7);
    expect(cloudParse('null', 7)).toBe(7);
    expect(cloudParse(undefined, 'x')).toBe('x');
  });
  it('cloudNum', () => {
    expect(cloudNum('12.5')).toBe(12.5);
    expect(cloudNum('abc')).toBe(0);
    expect(cloudNum(undefined)).toBe(0);
  });
  it('dayKeyNum ordena fechas AAAA-M-D', () => {
    expect(dayKeyNum('2026-06-15')).toBe(20260615);
    expect(dayKeyNum('2026-6-5')).toBe(20260605);
    expect(dayKeyNum('2026-06-15')).toBeGreaterThan(dayKeyNum('2026-06-14'));
    expect(dayKeyNum('basura')).toBe(0);
    expect(dayKeyNum(undefined)).toBe(0);
  });
  it('cardDedupKey ignora mayúsculas', () => expect(cardDedupKey('Hello', 'Hola')).toBe(cardDedupKey('hello', 'HOLA')));
  it('cloudDataEqual', () => {
    expect(cloudDataEqual({ a: '1' }, { a: '1' })).toBe(true);
    expect(cloudDataEqual({ a: '1' }, { a: '2' })).toBe(false);
    expect(cloudDataEqual({ a: '1' }, { a: '1', b: '2' })).toBe(false);
  });
});

describe('mergeCardRecord: gana la tarjeta estudiada más recientemente', () => {
  it('la más reciente', () => expect(mergeCardRecord(J({ t: 5, lvl: 1 }), J({ t: 9, lvl: 2 }))).toBe(J({ t: 9, lvl: 2 })));
  it('empate de fecha: el nivel más alto', () => expect(mergeCardRecord(J({ t: 5, lvl: 3 }), J({ t: 5, lvl: 2 }))).toBe(J({ t: 5, lvl: 3 })));
  it('si una copia está corrupta se queda la otra', () => {
    expect(mergeCardRecord('x', J({ t: 1 }))).toBe(J({ t: 1 }));
    expect(mergeCardRecord(J({ t: 1 }), 'x')).toBe(J({ t: 1 }));
  });
  it('da igual el orden', () => {
    const a = J({ t: 5, lvl: 1 }), b = J({ t: 9, lvl: 2 });
    expect(mergeCardRecord(a, b)).toBe(mergeCardRecord(b, a));
  });
});

describe('mergeStageMaps: gana la etapa más lejana de cada categoría', () => {
  it('máximo por categoría y unión de categorías', () => {
    expect(cloudParse(mergeStageMaps(J({ a: 3, b: 1 }), J({ a: 2, c: 7 })), {})).toEqual({ a: 3, b: 1, c: 7 });
  });
  it('nunca retrocede', () => expect(cloudParse(mergeStageMaps(J({ general: 9 }), J({ general: 0 })), {}).general).toBe(9));
});

describe('mergeExamResult: gana la MEJOR nota', () => {
  it('mejor proporción; conserva el máximo de intentos y la fecha más reciente', () => {
    const r = cloudParse(mergeExamResult(J({ score: 6, total: 12, t: 1, attempts: 2 }), J({ score: 9, total: 12, t: 5, attempts: 1 })), null);
    expect(r.score).toBe(9);
    expect(r.attempts).toBe(2);
    expect(r.t).toBe(5);
  });
  it('compara proporciones, no puntos sueltos', () => {
    const r = cloudParse(mergeExamResult(J({ score: 1, total: 2 }), J({ score: 5, total: 12 })), null);
    expect(r.score).toBe(1);
  });
  it('empate de nota: el intento más reciente', () => {
    const r = cloudParse(mergeExamResult(J({ score: 6, total: 12, t: 7 }), J({ score: 6, total: 12, t: 5 })), null);
    expect(r.t).toBe(7);
  });
  it('si no hay copia local se queda la de la nube', () => expect(mergeExamResult(undefined, J({ score: 1, total: 2 }))).toBe(J({ score: 1, total: 2 })));
});

describe('mergeCustomWords: unión sin duplicados', () => {
  it('une por id y por texto, este dispositivo primero', () => {
    const local = J([{ id: '1', en: 'a', es: 'b' }, { id: '2', en: 'c', es: 'd' }]);
    const nube = J([{ id: '1', en: 'a', es: 'b' }, { id: '9', en: 'C', es: 'D' }, { id: '3', en: 'e', es: 'f' }, null]);
    expect(cloudParse(mergeCustomWords(local, nube), []).map(w => w.id)).toEqual(['1', '2', '3']);
  });
  it('descarta entradas inválidas', () => {
    expect(cloudParse(mergeCustomWords(J([{ id: '1', en: 'a' }, 5, null]), '[]'), [])).toEqual([]);
  });
  it('tolera datos corruptos', () => expect(cloudParse(mergeCustomWords('x', 'y'), [])).toEqual([]));
});

describe('mergeCustomCats: unión sin distinguir mayúsculas', () => {
  it('conserva la primera escritura', () => {
    expect(cloudParse(mergeCustomCats(J(['Mi cat', 'x']), J(['mi cat', 'y', ''])), [])).toEqual(['Mi cat', 'x', 'y']);
  });
});

describe('mergeCooldownState: gana el enfriamiento más reciente', () => {
  it('ambos órdenes dan el mismo resultado', () => {
    const a = J({ ultimoTimestamp: 5 }), b = J({ ultimoTimestamp: 9 });
    expect(mergeCooldownState(a, b)).toBe(b);
    expect(mergeCooldownState(b, a)).toBe(b);
  });
});

describe('mergeProgressData', () => {
  const local = {
    ci_xp_total: '100', ci_time_a: '30', ci_master_x: J({ t: 1, lvl: 1 }), vocabri_unlocked_stage: J({ general: 2 }),
    vocabri_exam_g_1: J({ score: 5, total: 12 }), ci_custom_cats: J(['a']), vocabri_last_study_date: '2026-06-14',
    vocabri_xp_today: '40', vocabri_flip_coach_done: '0', theme: 'dark', vocabriProgress: J({ ultimoTimestamp: 3 })
  };
  const nube = {
    ci_xp_total: '250', ci_time_a: '99', ci_master_x: J({ t: 4, lvl: 2 }), vocabri_unlocked_stage: J({ general: 5, travel: 1 }),
    vocabri_exam_g_1: J({ score: 9, total: 12 }), ci_custom_cats: J(['B']), vocabri_last_study_date: '2026-06-15',
    vocabri_xp_today: '10', vocabri_flip_coach_done: '1', theme: 'light', vocabriProgress: J({ ultimoTimestamp: 8 }), extra: '1'
  };
  const out = mergeProgressData(local, nube);

  it('XP y tiempo de estudio: el mayor', () => {
    expect(out.ci_xp_total).toBe('250');
    expect(out.ci_time_a).toBe('99');
  });
  it('tarjetas, etapas, exámenes, categorías propias y enfriamiento usan su regla', () => {
    expect(out.ci_master_x).toBe(J({ t: 4, lvl: 2 }));
    expect(cloudParse(out.vocabri_unlocked_stage, {})).toEqual({ general: 5, travel: 1 });
    expect(cloudParse(out.vocabri_exam_g_1, {}).score).toBe(9);
    expect(cloudParse(out.ci_custom_cats, [])).toEqual(['a', 'B']);
    expect(out.vocabriProgress).toBe(J({ ultimoTimestamp: 8 }));
  });
  it('las preferencias las decide este dispositivo, y lo que solo está en la nube se añade', () => {
    expect(out.theme).toBe('dark');
    expect(out.extra).toBe('1');
  });
  it('el aviso del tutorial se queda en "hecho" si cualquiera de las copias lo hizo', () => expect(out.vocabri_flip_coach_done).toBe('1'));
  it('los contadores de la meta diaria van juntos: se queda el día de estudio más reciente', () => {
    expect(out.vocabri_last_study_date).toBe('2026-06-15');
    expect(out.vocabri_xp_today).toBe('10');
  });
  it('el mismo día: el XP de hoy más alto y la celebración más reciente', () => {
    const r = mergeProgressData(
      { vocabri_last_study_date: '2026-06-15', vocabri_xp_today: '40', vocabri_goal_celebrated_date: '2026-06-15' },
      { vocabri_last_study_date: '2026-06-15', vocabri_xp_today: '70', vocabri_goal_celebrated_date: '2026-06-14' });
    expect(r.vocabri_xp_today).toBe('70');
    expect(r.vocabri_goal_celebrated_date).toBe('2026-06-15');
  });
  it('fusionar con una copia idéntica no cambia nada', () => expect(mergeProgressData(local, local)).toEqual(local));
  it('no pierde ninguna clave de ninguna de las dos copias', () => {
    for (const k of Object.keys(local).concat(Object.keys(nube))) expect(k in out).toBe(true);
  });
  it('no modifica las copias recibidas', () => {
    const l = JSON.stringify(local), n = JSON.stringify(nube);
    mergeProgressData(local, nube);
    expect(JSON.stringify(local)).toBe(l);
    expect(JSON.stringify(nube)).toBe(n);
  });
  it('el resultado de los campos numéricos y de tarjeta no depende del orden', () => {
    const inv = mergeProgressData(nube, local);
    for (const k of ['ci_xp_total', 'ci_time_a', 'ci_master_x', 'vocabri_unlocked_stage', 'vocabriProgress']) expect(inv[k]).toBe(out[k]);
  });
});

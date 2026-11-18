import { describe, it, expect } from 'vitest';
import { evaluate, catalog, sealItems } from '../app/core/collection.js';

const base = { level: 1, bestStreak: 0, examThreeStars: 0, mastered: 0, cats: [] };

describe('evaluate', () => {
  it('al inicio solo desbloquea el ajolote rosa', () => {
    const r = evaluate(base, []);
    expect([...r.owned]).toEqual(['sticker:pink']);
  });
  it('el nivel 5 desbloquea Océano, marco de bronce y ajolote estrella', () => {
    const ids = [...evaluate({ ...base, level: 5 }, []).owned];
    expect(ids).toContain('theme:ocean'); expect(ids).toContain('frame:bronze'); expect(ids).toContain('sticker:navy');
    expect(ids).not.toContain('frame:silver');
  });
  it('Medianoche exige 14 días de racha (mejor racha, no la actual)', () => {
    expect([...evaluate({ ...base, bestStreak: 13 }, []).owned]).not.toContain('theme:midnight');
    expect([...evaluate({ ...base, bestStreak: 14 }, []).owned]).toContain('theme:midnight');
  });
  it('Sakura exige completar General; el sello sale al 90 %', () => {
    const cats = [{ id: 'general', name: 'General', emoji: '🌍', pct: 0.95 }];
    const ids = [...evaluate({ ...base, cats }, []).owned];
    expect(ids).toContain('theme:sakura'); expect(ids).toContain('seal:general');
    expect([...evaluate({ ...base, cats: [{ ...cats[0], pct: 0.5 }] }, []).owned]).not.toContain('theme:sakura');
  });
  it('lo desbloqueado es permanente y solo se avisa de lo nuevo', () => {
    const first = evaluate({ ...base, level: 5 }, []);
    const again = evaluate(base, [...first.owned]);          // las estadísticas bajan
    expect(again.owned.has('theme:ocean')).toBe(true);
    expect(again.fresh).toEqual([]);
  });
  it('Políglota con 3 sellos', () => {
    const cats = ['a', 'b', 'c'].map(id => ({ id, name: id, emoji: '🏷️', pct: 1 }));
    expect([...evaluate({ ...base, cats }, []).owned]).toContain('title:polyglot');
  });
  it('ids únicos en el catálogo', () => {
    const ids = catalog({ cats: [{ id: 'general', name: 'G', pct: 0 }] }).map(x => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('sealItems usa las categorías recibidas', () => {
    expect(sealItems({ cats: [{ id: 'health_and_medical', name: 'Salud', emoji: '🩺', pct: 0 }] })[0].id).toBe('seal:health_and_medical');
  });
});

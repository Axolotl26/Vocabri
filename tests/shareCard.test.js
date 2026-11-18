import { describe, it, expect } from 'vitest';
import { mix, iconSvgStandalone, CARD_W, CARD_H } from '../app/shareCard.js';

describe('tarjeta de compartir', () => {
  it('mix mezcla colores hex', () => {
    expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mix('#000000', '#FFFFFF', 1)).toBe('#ffffff');
    expect(mix('#FF0000', '#0000FF', .5)).toBe('#800080');
  });
  it('los iconos SVG autónomos llevan su propio estilo (sin depender del CSS de la app)', () => {
    const s = iconSvgStandalone('🔥', 160);
    expect(s.includes('xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(s.includes('<style>')).toBe(true);
    expect(s.includes('width="160"')).toBe(true);
    expect(iconSvgStandalone('no-es-emoji', 80)).toBe('');
  });
  it('formato vertical apto para compartir', () => {
    expect(CARD_W).toBe(1080);
    expect(CARD_H > CARD_W).toBe(true);
  });
});

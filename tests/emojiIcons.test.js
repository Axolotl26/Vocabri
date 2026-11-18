import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMOJI_ICONS, splitEmoji, emojiHtml, hasEmoji, normKey } from '../app/emojiIcons.js';

const RX = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/gu;
// Símbolos tipográficos que se quedan como texto (no son emojis a color)
const TEXTO = new Set(['↔', '✔', '↩', '©']);
function walk(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) { if (!/node_modules|tests|\.git/.test(p)) walk(p, out); }
    else if (/\.(js|html)$/.test(n)) out.push(p);
  }
  return out;
}

describe('emojis → iconos SVG', () => {
  it('cada emoji del código tiene su icono cartoon', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const faltan = new Set();
    for (const f of walk(root)) for (const m of fs.readFileSync(f, 'utf8').matchAll(RX)) {
      const k = normKey(m[0]);
      if (!EMOJI_ICONS[k] && !TEXTO.has(k)) faltan.add(k);
    }
    expect([...faltan]).toEqual([]);
  });
  it('todos los iconos son SVG válidos con el estilo cartoon', () => {
    for (const [k, svg] of Object.entries(EMOJI_ICONS)) {
      expect(svg.startsWith('<svg'), k).toBe(true);
      expect(svg.endsWith('</svg>'), k).toBe(true);
      expect(svg.includes('niMn'), k).toBe(true);
    }
  });
  it('splitEmoji separa texto y emojis, con o sin variante FE0F', () => {
    const p = splitEmoji('Hola 🔥 y ✈️ ok');
    expect(p.map(x => x.e || x.t)).toEqual(['Hola ', '🔥', ' y ', '✈️', ' ok']);
    expect(hasEmoji('sin nada')).toBe(false);
  });
  it('emojiHtml envuelve cada emoji en .ei', () => {
    expect(emojiHtml('A 🎯')).toContain('<span class="ei"');
    expect(emojiHtml('A 🎯').startsWith('A ')).toBe(true);
  });
});

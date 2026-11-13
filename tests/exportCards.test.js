import { describe, it, expect } from 'vitest';
import { isStudied, buildRows, quoteField, toDelimited, toCsv, toAnkiTsv, tagFor } from '../app/core/exportCards.js';

const rec = (o) => Object.assign({ m:false, t:0, lvl:0, next:0, iv:0, lapses:0, rl:false, reps:0 }, o);
const ent = (it, r) => ({ it, rec: rec(r) });
const E = [
  ent(['Hello', 'Hola', 'travel', 'travel|1', 'Hello there', 'Hola, ¿qué tal?'], { reps: 2, iv: 3, lapses: 1, next: Date.UTC(2026, 5, 15, 12) }),
  ent(['Bye', 'Adiós', 'travel', 'travel|2', null, null], {}),
  ent(['A, "b"', 'línea\nnueva', 'pop', 'pop|3', null, null], { lvl: 2 })
];

describe('isStudied / buildRows', () => {
  it('reconoce frases en estudio', () => {
    expect(isStudied(rec({ reps: 1 }))).toBe(true);
    expect(isStudied(rec({ m: true }))).toBe(true);
    expect(isStudied(rec({ next: 5 }))).toBe(true);
    expect(isStudied(rec())).toBe(false);
    expect(isStudied(null)).toBe(false);
  });
  it('por defecto solo las estudiadas; con all, todas', () => {
    expect(buildRows(E).map(r => r.id)).toEqual(['travel|1', 'pop|3']);
    expect(buildRows(E, { all: true }).length).toBe(3);
  });
  it('aplica la etiqueta de categoría', () => expect(buildRows(E, { catLabel: c => c.toUpperCase() })[0].cat).toBe('TRAVEL'));
});

describe('quoteField / toDelimited', () => {
  it('cita comas, comillas y saltos de línea', () => {
    expect(quoteField('a,b', ',')).toBe('"a,b"');
    expect(quoteField('di "hola"', ',')).toBe('"di ""hola"""');
    expect(quoteField('x\ny', ',')).toBe('"x\ny"');
    expect(quoteField('simple', ',')).toBe('simple');
  });
  it('neutraliza fórmulas solo con guard', () => {
    expect(quoteField('=1+1', ',', true)).toBe("'=1+1");
    expect(quoteField('-5 grados', ',', true)).toBe("'-5 grados");
    expect(quoteField('- viñeta', ',', true)).toBe('- viñeta');
    expect(quoteField('=1+1', ',', false)).toBe('=1+1');
  });
  it('une filas con CRLF', () => expect(toDelimited([['a', 'b'], ['c', 'd']], ',')).toBe('a,b\r\nc,d'));
});

describe('toCsv', () => {
  const csv = toCsv(buildRows(E));
  it('empieza con BOM y cabecera', () => { expect(csv.charCodeAt(0)).toBe(0xFEFF); expect(csv).toContain('Inglés,Español,Ejemplo (EN)'); });
  it('incluye progreso y escapa bien', () => {
    expect(csv).toContain('Hello,Hola,Hello there,"Hola, ¿qué tal?",travel,3,1,2026-06-15,travel|1');
    expect(csv).toContain('"A, ""b""","línea\nnueva"');
  });
});

describe('toAnkiTsv / tagFor', () => {
  const tsv = toAnkiTsv(buildRows(E, { catLabel: c => c === 'pop' ? 'Pop & Gaming' : c }));
  it('trae las cabeceras de Anki', () => {
    expect(tsv.startsWith('#separator:tab\n#html:true\n#guid column:1\n#tags column:4\n#deck:Vocabri\n')).toBe(true);
  });
  it('usa el id como GUID y arma el reverso con el ejemplo', () => {
    expect(tsv).toContain('travel|1\tHello\tHola<br><br><i>Hello there</i><br>Hola, ¿qué tal?\ttravel\n');
  });
  it('escapa HTML y etiqueta sin espacios', () => {
    expect(tsv).toContain('"A, ""b"""');   // las comillas se citan como CSV, no como HTML
    expect(toAnkiTsv([{ id: 'x', en: 'a<b', es: 'c&d', ex: '', exEs: '', cat: 'k' }])).toContain('x\ta&lt;b\tc&amp;d\tk');
    expect(tsv).not.toContain('\r');
    expect(tsv).toMatch(/\tPop_Gaming\n$/);
  });
  it('tagFor', () => { expect(tagFor('Pop & Gaming')).toBe('Pop_Gaming'); expect(tagFor('')).toBe('Vocabri'); });
});

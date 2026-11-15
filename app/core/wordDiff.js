// Vocabri — comparación palabra por palabra entre lo que escribió/dijo el usuario y la frase correcta.
// Devuelve segmentos en orden: { s:'ok'|'wrong'|'missing'|'extra', w:<palabra esperada>, t:<palabra del usuario> }

const key = (w) => String(w).toLowerCase().replace(/[^a-z0-9'’áéíóúüñ]/gi, '').replace(/’/g, "'");
const tokens = (s) => String(s || '').trim().split(/\s+/).filter(w => key(w));

export function diffWords(typed, expected){
  const a = tokens(typed), b = tokens(expected);
  const n = a.length, m = b.length;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for(let i = 0; i <= n; i++) d[i][0] = i;
  for(let j = 0; j <= m; j++) d[0][j] = j;
  for(let i = 1; i <= n; i++) for(let j = 1; j <= m; j++){
    const sub = d[i - 1][j - 1] + (key(a[i - 1]) === key(b[j - 1]) ? 0 : 1);
    d[i][j] = Math.min(sub, d[i - 1][j] + 1, d[i][j - 1] + 1);
  }
  const out = [];
  let i = n, j = m;
  while(i > 0 || j > 0){
    if(i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (key(a[i - 1]) === key(b[j - 1]) ? 0 : 1)){
      const same = key(a[i - 1]) === key(b[j - 1]);
      out.push({ s: same ? 'ok' : 'wrong', w: b[j - 1], t: a[i - 1] });
      i--; j--;
    } else if(j > 0 && d[i][j] === d[i][j - 1] + 1){
      out.push({ s: 'missing', w: b[j - 1], t: '' }); j--;
    } else {
      out.push({ s: 'extra', w: '', t: a[i - 1] }); i--;
    }
  }
  return out.reverse();
}

export function diffSummary(segs){
  const c = { ok: 0, wrong: 0, missing: 0, extra: 0 };
  segs.forEach(x => { c[x.s]++; });
  return c;
}

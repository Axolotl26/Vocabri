// Vocabri — «¿Por qué?»: filas del comparador de registro (formal / normal / informal).
export const REG_LABELS = [['formal', 'Formal'], ['normal', 'Normal'], ['informal', 'Informal']];

export function registerRows(reg, en){
  if(!reg || typeof reg !== 'object') return [];
  const mine = String(en || '').trim().toLowerCase();
  let marked = false;
  return REG_LABELS.filter(([k]) => typeof reg[k] === 'string' && reg[k]).map(([k, label]) => {
    const text = reg[k];
    const isMine = !marked && text.trim().toLowerCase() === mine;
    if(isMine) marked = true;
    return { key: k, label, text, mine: isMine };
  });
}

export function hasWhy(note, reg){ return !!(note || registerRows(reg, '').length); }

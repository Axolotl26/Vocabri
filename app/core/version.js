// Vocabri — comparación de versiones y lectura de version.json (puro, sin DOM).
export function parseVersion(v){
  const m = String(v == null ? '' : v).trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  return m ? [+m[1], +m[2], +(m[3] || 0)] : null;
}
// -1 si a < b, 0 si iguales, 1 si a > b; null si alguna no es válida
export function compareVersions(a, b){
  const x = parseVersion(a), y = parseVersion(b);
  if(!x || !y) return null;
  for(let i = 0; i < 3; i++){ if(x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; }
  return 0;
}
export const isNewerVersion = (remote, local) => compareVersions(remote, local) === 1;

// Normaliza el contenido de version.json: { version, date, title, changes[] } o null si no sirve
export function normalizeVersionInfo(raw){
  if(!raw || typeof raw !== 'object' || !parseVersion(raw.version)) return null;
  const clean = t => String(t == null ? '' : t).trim();
  return {
    version: parseVersion(raw.version).join('.'),
    date: clean(raw.date),
    title: clean(raw.title),
    changes: Array.isArray(raw.changes) ? raw.changes.map(clean).filter(Boolean).slice(0, 12) : []
  };
}
// Estado de la búsqueda: 'latest' | 'available' | 'error'
export function updateStatus(info, localVersion){
  if(!info) return 'error';
  return isNewerVersion(info.version, localVersion) ? 'available' : 'latest';
}
// Etapas de la barra de progreso: porcentaje máximo al que puede llegar cada etapa
export const UPDATE_STAGES = [
  { id: 'check',   label: 'Buscando la nueva versión…',  cap: 30 },
  { id: 'install', label: 'Descargando archivos…',       cap: 78 },
  { id: 'ready',   label: 'Aplicando la actualización…', cap: 96 },
  { id: 'done',    label: '¡Listo! Reiniciando Vocabri…', cap: 100 }
];
// Siguiente valor de la barra: se acerca al tope de la etapa sin llegar nunca de golpe
export function easeProgress(cur, cap){
  if(cur >= cap) return cap;
  const next = cur + Math.max(0.35, (cap - cur) * 0.08);
  return Math.min(cap, +next.toFixed(2));
}

// Vocabri — disposición del mapa (pura): cuántas secciones tiene cada etapa y dónde caen los exámenes.
// mapData.js la usa con los datos de cada categoría; los tests la importan directamente.

export const STAGE_SIZE = 8;               // tarjetas de una sección en categorías sin módulos con nombre
export const SESSION_MAX = 8;              // una sección normal tiene exactamente 8 tarjetas (la última de una etapa puede ser más corta)
export const MAX_CONSECUTIVE_NORMAL = 2;   // tras 2 secciones normales seguidas toca examen

// Secciones («sesiones») de una categoría.
//   con módulos con nombre: { names: [...], sizes: [...] }  → cada módulo es una etapa, troceada en secciones de SESSION_MAX
//   sin módulos:            { names: [cat], total: nº de tarjetas } → una sola etapa con secciones de STAGE_SIZE
export function buildSessionLayout(opts){
  const sessSizes = [], sessEtapaIdx = [], sessEtapaPos = [];
  const etapaNames = opts.names;
  if(opts.sizes){
    opts.sizes.forEach((size, ei)=>{
      const n = Math.max(1, Math.ceil(size / SESSION_MAX));
      for(let k=0;k<n;k++){
        sessSizes.push(Math.min(SESSION_MAX, size - k*SESSION_MAX));
        sessEtapaIdx.push(ei);
        sessEtapaPos.push([k+1, n]);
      }
    });
  } else {
    const total = opts.total;
    const n = Math.max(1, Math.ceil(total / STAGE_SIZE));
    for(let k=0;k<n;k++){
      sessSizes.push(Math.min(STAGE_SIZE, total - k*STAGE_SIZE));
      sessEtapaIdx.push(0);
      sessEtapaPos.push([k+1, n]);
    }
  }
  return {sessSizes, sessEtapaIdx, sessEtapaPos, etapaNames};
}

// Nodos del mapa: cada MAX_CONSECUTIVE_NORMAL secciones normales de una etapa se inserta un examen.
// `carryExam` (zonas JSON) hace que el examen pendiente de una etapa no se cierre al cambiar de etapa.
export function buildNodeLayout(L, carryExam){
  const nodes = [];
  let lastEtapa = -1, pending = [];
  for(let i=0;i<L.sessSizes.length;i++){
    const etapaIdx = L.sessEtapaIdx[i];
    if(etapaIdx !== lastEtapa){
      if(pending.length && !carryExam){ nodes.push({type:'exam', etapaIdx:lastEtapa, sources:pending}); pending = []; }
      lastEtapa = etapaIdx;
    }
    nodes.push({type:'normal', sessIdx:i, etapaIdx});
    pending.push(i);
    if(pending.length === MAX_CONSECUTIVE_NORMAL){
      nodes.push({type:'exam', etapaIdx, sources:pending});
      pending = [];
    }
  }
  if(pending.length) nodes.push({type:'exam', etapaIdx:lastEtapa, sources:pending});
  return {nodes, etapaNames: L.etapaNames};
}

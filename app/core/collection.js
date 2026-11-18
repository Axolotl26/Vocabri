// Vocabri — colección de recompensas: catálogo y reglas de desbloqueo. Puro (sin DOM ni localStorage).
// Lo desbloqueado es permanente: nunca se vuelve a bloquear aunque baje una estadística.
//
// stats = { missions, missionModes, missionRun, level, bestStreak, examThreeStars, cats: [{id, name, emoji, pct}], mastered }
//   pct = fracción (0–1) de frases de la categoría ya estudiadas.

export const SEAL_PCT = 0.9;     // 90 % de la categoría estudiada = sello

export const THEME_ITEMS = [
  { id: 'theme:ocean',    kind: 'theme', key: 'ocean',    icon: '🌊', name: 'Océano Profundo', hint: 'Llega al nivel 5',                 test: s => s.level >= 5 },
  { id: 'theme:midnight', kind: 'theme', key: 'midnight', icon: '🌙', name: 'Medianoche',      hint: 'Consigue una racha de 14 días',    test: s => s.bestStreak >= 14 },
  { id: 'theme:sakura',   kind: 'theme', key: 'sakura',   icon: '🌸', name: 'Sakura',          hint: 'Completa la categoría General',    test: s => pctOf(s, 'general') >= SEAL_PCT },
  { id: 'theme:holo',     kind: 'theme', key: 'holo',     icon: '🌈', name: 'Holográfico',     hint: 'Llega al nivel 20',                test: s => s.level >= 20 }
];

export const FRAME_ITEMS = [
  { id: 'frame:bronze', kind: 'frame', key: 'bronze', icon: '🥉', name: 'Marco de Bronce', hint: 'Llega al nivel 5',  test: s => s.level >= 5 },
  { id: 'frame:silver', kind: 'frame', key: 'silver', icon: '🥈', name: 'Marco de Plata',  hint: 'Llega al nivel 8',  test: s => s.level >= 8 },
  { id: 'frame:gold',   kind: 'frame', key: 'gold',   icon: '🥇', name: 'Marco de Oro',    hint: 'Llega al nivel 12', test: s => s.level >= 12 },
  { id: 'frame:quest',  kind: 'frame', key: 'quest',  icon: '🎯', name: 'Marco de Misiones', hint: 'Cumple 6 misiones especiales', test: s => (s.missions || 0) >= 6 },
  { id: 'frame:legend', kind: 'frame', key: 'legend', icon: '👑', name: 'Marco de Leyenda', hint: 'Llega al nivel 20', test: s => s.level >= 20 }
];

export const TITLE_ITEMS = [
  { id: 'title:apprentice', kind: 'title', icon: '🌱', name: 'Aprendiz',      hint: 'Domina 25 frases',                     test: s => s.mastered >= 25 },
  { id: 'title:traveler',   kind: 'title', icon: '🧳', name: 'Viajero',       hint: 'Consigue el sello de Viajes',          test: s => pctOf(s, 'travel') >= SEAL_PCT },
  { id: 'title:steady',     kind: 'title', icon: '🔥', name: 'Constante',     hint: 'Consigue una racha de 30 días',        test: s => s.bestStreak >= 30 },
  { id: 'title:perfect',    kind: 'title', icon: '⭐', name: 'Perfeccionista', hint: 'Saca 3 estrellas en 10 exámenes',     test: s => s.examThreeStars >= 10 },
  { id: 'title:polyglot',   kind: 'title', icon: '🗣️', name: 'Políglota',     hint: 'Consigue 3 sellos de categoría',       test: s => sealCount(s) >= 3 },
  { id: 'title:missionary', kind: 'title', icon: '🎯', name: 'Misionero',     hint: 'Completa 3 misiones especiales',       test: s => (s.missions || 0) >= 3 },
  { id: 'title:hunter',     kind: 'title', icon: '🏹', name: 'Cazador',       hint: 'Cumple los 4 modos de misión',         test: s => (s.missionModes || 0) >= 4 },
  { id: 'title:unstoppable', kind: 'title', icon: '⚡', name: 'Imparable',     hint: 'Cumple 3 misiones seguidas sin perder ninguna', test: s => (s.missionRun || 0) >= 3 },
  { id: 'title:legend',     kind: 'title', icon: '👑', name: 'Leyenda',       hint: 'Llega al nivel 20',                    test: s => s.level >= 20 }
];

// Ajolotes de colores como colección (archivos que ya existen en assets/stickers/…).
export const STICKER_ITEMS = [
  { id: 'sticker:pink',   kind: 'sticker', icon: '🩷', name: 'Ajolote rosa',      file: 'ajolotes_de_colores/ajolote_rosa_brazos_abiertos.png',    hint: 'Desde el inicio',                    test: () => true },
  { id: 'sticker:green',  kind: 'sticker', icon: '💚', name: 'Ajolote verde',     file: 'ajolotes_de_colores/ajolote_verde_bailando.png',          hint: 'Domina 10 frases',                   test: s => s.mastered >= 10 },
  { id: 'sticker:purple', kind: 'sticker', icon: '💜', name: 'Ajolote morado',    file: 'ajolotes_de_colores/ajolote_morado_pensativo.png',        hint: 'Llega al nivel 3',                   test: s => s.level >= 3 },
  { id: 'sticker:red',    kind: 'sticker', icon: '❤️', name: 'Ajolote rojo',      file: 'ajolotes_de_colores/ajolote_rojo_caminando_saludando.png', hint: 'Consigue una racha de 7 días',      test: s => s.bestStreak >= 7 },
  { id: 'sticker:gold',   kind: 'sticker', icon: '💛', name: 'Ajolote dorado',    file: 'ajolotes_de_colores/ajolote_dorado_brillante.png',        hint: 'Llega al nivel 10',                  test: s => s.level >= 10 },
  { id: 'sticker:navy',   kind: 'sticker', icon: '💙', name: 'Ajolote estrella',  file: 'ajolotes_de_colores/ajolote_azul_marino_con_estrella.png', hint: 'Llega al nivel 5',                  test: s => s.level >= 5 },
  { id: 'sticker:holo',   kind: 'sticker', icon: '🌈', name: 'Ajolote holográfico', file: 'ajolotes_de_colores/ajolote_arcoiris_holografico.png',  hint: 'Llega al nivel 20',                  test: s => s.level >= 20 }
];

function pctOf(s, id){ const c = (s.cats || []).find(x => x.id === id); return c ? c.pct : 0; }
function sealCount(s){ return (s.cats || []).filter(c => c.pct >= SEAL_PCT).length; }

// Un sello por categoría (se generan a partir de las categorías existentes)
export function sealItems(stats){
  return (stats.cats || []).map(c => ({
    id: 'seal:' + c.id, kind: 'seal', icon: c.emoji || '🏷️', name: 'Sello de ' + c.name,
    hint: 'Estudia el ' + Math.round(SEAL_PCT * 100) + ' % de ' + c.name, test: s => pctOf(s, c.id) >= SEAL_PCT
  }));
}

export function catalog(stats){
  return [].concat(THEME_ITEMS, FRAME_ITEMS, sealItems(stats || {}), TITLE_ITEMS, STICKER_ITEMS);
}

// Devuelve { owned: Set (con lo ya poseído + lo nuevo), fresh: [items nuevos] }
export function evaluate(stats, ownedIds){
  const owned = new Set(ownedIds || []);
  const fresh = [];
  catalog(stats).forEach(it => {
    if(!owned.has(it.id) && it.test(stats)){ owned.add(it.id); fresh.push(it); }
  });
  return { owned, fresh };
}

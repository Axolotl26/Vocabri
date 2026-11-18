// Vocabri — módulo "profile" (generado a partir de app.js)
import { S } from './core/shared.js';
import { catLabel, computeStreak, getFreezes, isMastered, itemsFor, readStored } from './core/dataRegistry.js';
import { renderCardsSubView } from './map.js';
import { dayKey, renderProgress, renderTable } from './progress.js';
import { THEMES, applyTheme, getThemeStickerPath, themeUnlocked, updateCatSelector } from './settings.js';
import { applyFrame, refreshCollection, renderCollection, wireCollectionUi } from './collection.js';
import { wireMissionsHall } from './missionsHall.js';
import { wireWeeklyChest, syncToday } from './weeklyChest.js';
import { getDailyGoalTarget, getXpToday, getXpTotal, levelFromXp, xpForLevel, xpIntoLevel } from './state.js';
import { buildBottomNav } from './ui.js';
import { renderShareCard } from './shareCard.js';



export const REWARDS = [
  {lvl:1,  icon:'🔰', name:'Primeros pasos',      desc:'Empiezas tu aventura con Vocabri.'},
  {lvl:3,  icon:'🧊', name:'Protector de Racha',  desc:'Perdona un día sin estudiar. Ganas otro cada 7 días de racha (máximo 2 guardados).'},
  {lvl:5,  icon:'🥉', name:'Insignia de Bronce',  desc:'Constancia demostrada: tu insignia aparece en tu perfil.'},
  {lvl:8,  icon:'🥈', name:'Insignia de Plata',   desc:'Ya dominas lo básico: insignia de plata en tu perfil.'},
  {lvl:12, icon:'🥇', name:'Insignia de Oro',     desc:'Practicante de verdad: insignia de oro en tu perfil.'},
  {lvl:20, icon:'👑', name:'Leyenda de Vocabri',  desc:'La insignia más rara. Pocos llegan aquí.'}
];


export function renderProfile(){
  const xp = getXpTotal();
  const lvl = levelFromXp(xp);
  const xpInLevel = xpIntoLevel(xp);
  const xpNeeded = xpForLevel(lvl);
  document.getElementById('pfLevelNum').textContent = 'Nivel ' + lvl;
  document.getElementById('pfXpText').textContent = xpInLevel + '/' + xpNeeded + ' XP';
  document.getElementById('pfLevelFill').style.width = Math.round((xpInLevel/xpNeeded)*100) + '%';
  document.getElementById('pfXpDetail').textContent =
    xp + ' XP acumulado en total · faltan ' + (xpNeeded - xpInLevel) + ' XP para el Nivel ' + (lvl+1) + '.';
  document.getElementById('pfStreak').textContent = computeStreak();
  const allItems = itemsFor("Todas");
  document.getElementById('pfMastered').textContent = allItems.filter(it=> isMastered(it[3])).length;
  const days = new Set();
  allItems.forEach(it=>{ const s = readStored(it[3]); if(s.t) days.add(dayKey(new Date(s.t))); });
  document.getElementById('pfActiveDays').textContent = days.size;

  try{ wireWeeklyChest(); syncToday(); wireMissionsHall(); wireCollectionUi(); refreshCollection(); renderCollection(); applyFrame(); }catch(e){}
  const grid = document.getElementById('rewardsGrid');
  grid.innerHTML = '';
  let nextEl = document.getElementById('rewardNext');
  if(!nextEl){ nextEl = document.createElement('p'); nextEl.id = 'rewardNext'; nextEl.className = 'rewardNext'; grid.parentNode.insertBefore(nextEl, grid); }
  const nxt = REWARDS.find(r => r.lvl > lvl);
  nextEl.textContent = nxt ? 'Siguiente recompensa: ' + nxt.icon + ' ' + nxt.name + ' en el nivel ' + nxt.lvl + ' (' + (nxt.lvl - lvl) + (nxt.lvl - lvl === 1 ? ' nivel' : ' niveles') + ').' : '¡Tienes todas las recompensas! 👑';
  REWARDS.forEach((r, idx)=>{
    const unlocked = lvl >= r.lvl;
    const el = document.createElement('div');
    el.className = 'rewardItem' + (unlocked ? '' : ' locked');
    el.style.setProperty('--i', idx + 1);
    el.title = r.desc;
    el.innerHTML = '<div class="rewardIcon">' + (unlocked ? r.icon : '🔒') + '</div>' +
      '<div class="rewardName">' + r.name + (r.lvl === 3 && unlocked ? ' ×' + getFreezes() : '') + '</div>' +
      '<div class="rewardLvl">Niv. ' + r.lvl + '</div>';
    grid.appendChild(el);
  });
}



export function renderProfileThemeGrid(){
  const themeGrid = document.getElementById('profileThemeGrid');
  if(!themeGrid) return;

  const currentTheme = S.themeKey;
  const currentMode = S.modeSel;

  themeGrid.innerHTML = '';

  Object.entries(THEMES).filter(([key]) => themeUnlocked(key)).forEach(([key, theme])=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'themeOpt' + (key === currentTheme ? ' sel' : '');
    btn.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 8px; border-radius:var(--radius); border:2px solid var(--line); background:var(--paper); cursor:pointer; transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease;';

    // Theme sticker
    const stickerPath = getThemeStickerPath(key);
    const stickerHtml = '<img class="themeSticker" src="'+stickerPath+'" alt="'+theme.name+'" width="48" height="48" style="border-radius:12px; box-shadow:var(--elev1);">';

    btn.innerHTML = stickerHtml + '<span style="font-size:var(--text-xs); font-weight:700; color:var(--ink); text-align:center;">' + theme.name + '</span>';

    if(key === currentTheme){
      btn.style.borderColor = 'var(--primary)';
      btn.style.boxShadow = '0 0 0 2px var(--primary-soft)';
    }

    btn.onclick = () => {
      S.themeKey = key;
      try{ localStorage.setItem('ci_theme', key); }catch(e){}
      applyTheme();
      renderProfileThemeGrid(); // re-render to update selection
    };

    themeGrid.appendChild(btn);
  });

  // Add mode selector (light/dark/auto)
  const modeContainer = document.createElement('div');
  modeContainer.style.cssText = 'grid-column:1/-1; display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:8px;';

  const modes = [
    { key: 'auto', label: 'Auto', emoji: '🤖' },
    { key: 'light', label: 'Claro', emoji: '☀️' },
    { key: 'dark', label: 'Oscuro', emoji: '🌙' }
  ];

  modes.forEach(m => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'themeOpt' + (m.key === currentMode ? ' sel' : '');
    btn.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 16px; border-radius:var(--radius); border:2px solid var(--line); background:var(--paper); cursor:pointer; transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease;';
    btn.innerHTML = '<span style="font-size:20px;">' + m.emoji + '</span>' + '<span style="font-size:var(--text-sm); font-weight:700; color:var(--ink);">' + m.label + '</span>';

    if(m.key === currentMode){
      btn.style.borderColor = 'var(--primary)';
      btn.style.boxShadow = '0 0 0 2px var(--primary-soft)';
    }

    btn.onclick = () => {
      S.modeSel = m.key;
      try{ localStorage.setItem('ci_mode', m.key); }catch(e){}
      applyTheme();
      renderProfileThemeGrid(); // re-render to update selection
    };

    modeContainer.appendChild(btn);
  });

  themeGrid.appendChild(modeContainer);
}



export function render(rebuildNav){
  if(rebuildNav){ buildBottomNav(); updateCatSelector(); }
  S.order = [];
  S.idx = 0;
  if(S.view === "learn"){ renderCardsSubView(); }
  else if(S.view === "table"){ renderTable(); }
  else { renderProgress(); }
}



// Página oficial de Vocabri: el QR de la tarjeta siempre lleva aquí, se abra la app desde donde se abra.
export const OFFICIAL_URL = 'https://axolotl26.github.io/Vocabri/';
export function appJoinUrl(){ return OFFICIAL_URL; }


export async function shareProgressCard(){
  const statusEl = document.getElementById('shareStatus');
  if(!statusEl) return;
  statusEl.textContent = 'Generando tarjeta...';

  const xpTotal = getXpTotal();
  const streak = computeStreak();
  const allItems = itemsFor('Todas');
  const mastered = allItems.filter(it => isMastered(it[3])).length;
  const level = levelFromXp(xpTotal);
  const xpInLevel = xpIntoLevel(xpTotal);
  const xpNeeded = xpForLevel(level);
  const days = new Set();
  allItems.forEach(it => { const st = readStored(it[3]); if(st.t) days.add(dayKey(new Date(st.t))); });
  const activeDays = days.size;
  let cu = null;
  try{ cu = JSON.parse(localStorage.getItem('vocabri_user') || 'null'); }catch(e){}
  const userName = (cu && cu.name) || '';
  const totalLearned = allItems.filter(it => readStored(it[3]).reps > 0 || readStored(it[3]).m).length;
  const currentCategory = catLabel(S.currentCat || 'general');
  const totalXpToday = getXpToday();
  const dailyGoal = getDailyGoalTarget();

  const base = { level, xpInLevel, xpNeeded, xpTotal, streak, mastered, activeDays, totalLearned,
    xpToday: totalXpToday, dailyGoal, category: currentCategory, userName, joinUrl: appJoinUrl(), fallbackSrc: './assets/ajolote_logo.webp' };
  // Cada tema de la app es un estilo de tarjeta: sus colores y su ajolote
  const build = (key) => {
    const th = THEMES[key] || THEMES.axolotl;
    return renderShareCard({ ...base, theme: { primary: th.light.primary, secondary: th.light.secondary }, stickerSrc: './assets/ajolote_logo.png' });   // el ajolote de la marca en todos los estilos
  };
  const startKey = (THEMES[S.themeKey] && themeUnlocked(S.themeKey)) ? S.themeKey : 'axolotl';

  let canvas;
  try{ canvas = await build(startKey); }
  catch(e){ statusEl.textContent = 'No se pudo generar la tarjeta.'; return; }

  showShareModal(canvas, statusEl, { level, streak, mastered, activeDays, totalLearned, xpTotal, userName, currentCategory, totalXpToday, dailyGoal }, { build, startKey });
}



export function showShareModal(canvas, statusEl, data, themes){
  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'gModalOverlay';
  modal.style.zIndex = '10000';
  modal.innerHTML = `
    <div class="gModal gModalWide shareModal" role="dialog" aria-modal="true" aria-labelledby="shareTitle">
      <div class="modalHeader">
        <h3 id="shareTitle">📤 Compartir mi progreso</h3>
        <button class="modalCloseBtn" id="shareModalClose" type="button" aria-label="Cerrar">✕</button>
      </div>
      <div class="shareFrame"><canvas id="shareCanvas" aria-label="Tarjeta con tu progreso en Vocabri"></canvas></div>
      <div class="shareThemesBox">
        <div class="shareThemesLabel">Estilo de la tarjeta: <b id="shareThemeName"></b></div>
        <div class="shareThemes" id="shareThemes" role="radiogroup" aria-label="Estilo de la tarjeta"></div>
      </div>
      <div id="shareStatusM" class="shareStatus" role="status" aria-live="polite"></div>
      <div class="shareBtns">
        <button class="nav shareMain hover-scale focus-glow" id="btnShareApp" type="button">📱 Compartir</button>
        <div class="shareRow">
          <button class="nav shareSub hover-scale focus-glow" id="btnDownload" type="button">💾 Descargar</button>
          <button class="nav shareSub hover-scale focus-glow" id="btnShareMessage" type="button">💬 Mensaje</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Poner el canvas en el modal
  const modalCanvas = modal.querySelector('#shareCanvas');
  const modalCtx = modalCanvas.getContext('2d');
  modalCanvas.width = canvas.width;
  modalCanvas.height = canvas.height;
  modalCtx.drawImage(canvas, 0, 0);

  // Selector de estilos: cambia la vista previa al instante (se cachea cada tarjeta ya generada)
  if(themes && themes.build){
    const cache = new Map([[themes.startKey, canvas]]);
    const box = modal.querySelector('#shareThemes'), nameEl = modal.querySelector('#shareThemeName');
    let cur = themes.startKey, busy = false;
    const keys = Object.keys(THEMES);
    box.innerHTML = keys.map(k => {
      const th = THEMES[k], ok = themeUnlocked(k);
      return '<button type="button" class="shareSw' + (k === cur ? ' sel' : '') + (ok ? '' : ' locked') + '" role="radio" aria-checked="' + (k === cur) + '" data-k="' + k + '"' +
        ' aria-label="' + th.name + (ok ? '' : ' (bloqueado)') + '" title="' + th.name + (ok ? '' : ' · se desbloquea en la Colección') + '"' +
        ' style="--sa:' + th.light.primary + ';--sb:' + th.light.secondary + '">' + (ok ? '' : '🔒') + '</button>';
    }).join('');
    nameEl.textContent = THEMES[cur].name;
    box.onclick = async (e) => {
      const b = e.target.closest('.shareSw'); if(!b || busy) return;
      const k = b.dataset.k;
      if(!themeUnlocked(k)){ statusElModal.textContent = 'Se desbloquea en la Colección.'; setTimeout(()=> statusElModal.textContent = '', 2500); return; }
      if(k === cur) return;
      busy = true;
      try{
        if(!cache.has(k)) cache.set(k, await themes.build(k));
        canvas = cache.get(k); cur = k;
        modalCanvas.width = canvas.width; modalCanvas.height = canvas.height; modalCtx.drawImage(canvas, 0, 0);
        box.querySelectorAll('.shareSw').forEach(x => { const on = x.dataset.k === k; x.classList.toggle('sel', on); x.setAttribute('aria-checked', on); });
        nameEl.textContent = THEMES[k].name;
        modal.dispatchEvent(new Event('sharecanvas'));
      }catch(err){ statusElModal.textContent = 'No se pudo cambiar el estilo.'; setTimeout(()=> statusElModal.textContent = '', 2500); }
      busy = false;
    };
  }

  const statusElModal = modal.querySelector("#shareStatusM");

  // Cerrar modal
  const closeModal = () => {
    modal.remove();
    statusEl.textContent = '';
  };
  modal.querySelector('#shareModalClose').onclick = closeModal;
  modal.onclick = (e) => { if(e.target === modal) closeModal(); };

  // --- BOTÓN 1: Compartir la imagen con otras apps (sin descargarla) ---
  // El archivo se prepara de antemano: navigator.share debe llamarse enseguida tras el toque, sin esperas.
  const fileName = () => `vocabri-progreso-${new Date().toISOString().slice(0,10)}.png`;
  let ready = { canvas: null, file: null, blob: null };
  const prepare = async () => {
    const c = canvas;
    try{ const blob = await canvasToBlob(c); if(c === canvas) ready = { canvas: c, blob, file: new File([blob], fileName(), { type: 'image/png' }) }; }catch(e){}
  };
  prepare();
  modal.addEventListener('sharecanvas', prepare);   // al cambiar de estilo se prepara la imagen nueva

  modal.querySelector('#btnShareApp').onclick = async () => {
    if(ready.canvas !== canvas){ statusElModal.textContent = 'Preparando imagen...'; await prepare(); }
    const file = ready.file, shareText = `¡Mira mi progreso en inglés en Vocabri! Nivel ${data.level} · racha de ${data.streak} días. Juega conmigo: ${OFFICIAL_URL}`;
    if(!file){ statusElModal.textContent = '❌ No se pudo preparar la imagen'; return; }
    try{
      if(navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share){
        await navigator.share({ files: [file], title: 'Mi progreso en Vocabri', text: shareText });
        statusElModal.textContent = '✅ Compartido';
      }else if(navigator.clipboard && window.ClipboardItem){
        // Este navegador no comparte archivos: se copia la imagen para pegarla en cualquier app (sin descargar nada)
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': ready.blob })]);
        statusElModal.textContent = '✅ Imagen copiada: pégala en la app que quieras (Ctrl+V)';
      }else{
        statusElModal.textContent = 'Tu navegador no permite compartir imágenes. Usa «Descargar».';
      }
    }catch(e){
      statusElModal.textContent = e && e.name === 'AbortError' ? 'Compartir cancelado' : 'No se pudo compartir. Prueba con «Descargar».';
    }
    setTimeout(()=> statusElModal.textContent = '', 5000);
  };

  // --- BOTÓN 2: Descargar imagen ---
  modal.querySelector('#btnDownload').onclick = async () => {
    statusElModal.textContent = 'Descargando...';
    try{
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, `vocabri-progreso-${new Date().toISOString().slice(0,10)}.png`);
      statusElModal.textContent = '✅ Imagen descargada';
    }catch(e){
      statusElModal.textContent = '❌ Error al descargar';
    }
    setTimeout(()=> statusElModal.textContent = '', 3000);
  };

  // --- BOTÓN 3: Enviar como mensaje (Web Share con solo texto + link) ---
  modal.querySelector('#btnShareMessage').onclick = async () => {
    statusElModal.textContent = 'Preparando mensaje...';
    const text = `📚 Mi progreso en Vocabri:\n🏆 Nivel ${data.level} | 🔥 Racha: ${data.streak} días | ⭐ ${data.mastered} frases dominadas\n\nAprende inglés conmigo: `;

    try{
      if(navigator.share){
        await navigator.share({
          title: 'Mi progreso en Vocabri',
          text: text,
          url: OFFICIAL_URL
        });
        statusElModal.textContent = '✅ Mensaje enviado';
      }else{
        // Fallback: copiar texto al portapapeles
        await navigator.clipboard.writeText(text + OFFICIAL_URL);
        statusElModal.textContent = '✅ Texto copiado al portapapeles';
      }
    }catch(e){
      if(e.name !== 'AbortError'){
        statusElModal.textContent = '❌ Error al enviar';
      }else{
        statusElModal.textContent = 'Envío cancelado';
      }
    }
    setTimeout(()=> statusElModal.textContent = '', 3000);
  };
}



// Helpers
export function canvasToBlob(canvas){
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No blob')), 'image/png', 0.95);
  });
}



export function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 2000);
}



export async function copyImageToClipboard(blob){
  try{
    await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
  }catch(e){
    // Fallback: descargar
    downloadBlob(blob, 'vocabri-progreso.png');
  }
}



export function drawProfilePhoto(canvas, photoUrl){
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = photoUrl;
  img.onload = () => {
    const scale = canvas.width / 400;
    const x = 170 * scale;
    const y = 185 * scale;
    const size = 60 * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(200 * scale, y + size/2, size/2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  };
}



export function updateShareModalCanvas(canvas){
  const modalCanvas = document.querySelector('#shareCanvas');
  if(modalCanvas){
    const ctx = modalCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
  }
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [

];

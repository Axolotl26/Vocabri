// Vocabri — módulo "profile" (generado a partir de app.js)
import { S } from './core/shared.js';
import { catLabel, computeStreak, isMastered, itemsFor, readStored } from './core/dataRegistry.js';
import { renderCardsSubView } from './map.js';
import { dayKey, renderProgress, renderTable } from './progress.js';
import { THEMES, applyTheme, getThemeStickerPath, updateCatSelector } from './settings.js';
import { getDailyGoalTarget, getXpToday, getXpTotal, levelFromXp, xpForLevel, xpIntoLevel } from './state.js';
import { buildBottomNav } from './ui.js';



export const REWARDS = [
  {lvl:1, icon:'🔰', name:'Primeros pasos'},
  {lvl:3, icon:'🧊', name:'Protector de Racha'},
  {lvl:5, icon:'🥉', name:'Insignia de Bronce'},
  {lvl:8, icon:'🥈', name:'Insignia de Plata'},
  {lvl:12, icon:'🥇', name:'Insignia de Oro'},
  {lvl:20, icon:'👑', name:'Leyenda de Vocabri'}
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

  const grid = document.getElementById('rewardsGrid');
  grid.innerHTML = '';
  REWARDS.forEach((r, idx)=>{
    const unlocked = lvl >= r.lvl;
    const el = document.createElement('div');
    el.className = 'rewardItem' + (unlocked ? '' : ' locked');
    el.style.setProperty('--i', idx + 1);
    el.innerHTML = '<div class="rewardIcon">' + (unlocked ? r.icon : '🔒') + '</div>' +
      '<div class="rewardName">' + r.name + '</div>' +
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

  Object.entries(THEMES).forEach(([key, theme])=>{
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



export function shareProgressCard(){
  const statusEl = document.getElementById('shareStatus');
  if(!statusEl) return;
  statusEl.textContent = 'Generando tarjeta...';

  // Obtener TODOS los datos de progreso
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
  const userName = (cu && cu.name) || 'Usuario';
  const userEmail = (cu && cu.email) || '';
  const userPhoto = (cu && cu.picture) || '';

  const totalLearned = allItems.filter(it => readStored(it[3]).reps > 0 || readStored(it[3]).m).length;
  const currentCategory = catLabel(S.currentCat || 'Casual');
  const totalXpToday = getXpToday();
  const dailyGoal = getDailyGoalTarget();

  // Detectar tema actual (light/dark)
  const isDark = document.documentElement.classList.contains('dark') ||
                 window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Colores Material You
  const colors = isDark ? {
    surface: '#1C1C1E',
    surfaceContainer: '#2C2C2E',
    surfaceContainerHigh: '#3A3A3C',
    onSurface: '#F5F5F4',
    onSurfaceVariant: '#CAC4D0',
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    tertiary: '#D8BCFF',
    onTertiary: '#381E72',
    outline: '#79747E',
    outlineVariant: '#49454F',
    shadow: 'rgba(0,0,0,0.4)',
    xpGold: '#F9D56E',
    success: '#A5D6A7',
    error: '#EF9A9A'
  } : {
    surface: '#FFFFFF',
    surfaceContainer: '#F5F5F4',
    surfaceContainerHigh: '#E7E0EC',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    shadow: 'rgba(0,0,0,0.12)',
    xpGold: '#B8860B',
    success: '#2E7D32',
    error: '#C62828'
  };

  // Crear canvas para la tarjeta
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = window.devicePixelRatio || 1;
  const width = 400 * scale;
  const height = 760 * scale;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '400px';
  canvas.style.height = '760px';
  ctx.scale(scale, scale);

  // ===== DIBUJAR TARJETA MATERIAL YOU =====
  const cardX = 20, cardY = 20, cardW = 360, cardH = 720;
  const radius = 28;

  // Sombra de elevación (Elevation 3)
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  // Tarjeta principal - fondo surface
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = colors.surface;
  ctx.fill();

  // Quitar sombra para elementos internos
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Barra superior decorativa con primaryContainer
  drawRoundRect(ctx, cardX, cardY, cardW, 120, {tl: radius, tr: radius, bl: 0, br: 0});
  const topGrad = ctx.createLinearGradient(0, cardY, 0, cardY + 120);
  topGrad.addColorStop(0, colors.primaryContainer);
  topGrad.addColorStop(1, colors.surfaceContainerHigh);
  ctx.fillStyle = topGrad;
  ctx.fill();

  ctx.fillStyle = colors.onPrimaryContainer;
  ctx.textAlign = 'center';

  // Logo/app name
  ctx.font = '600 22px Nunito, sans-serif';
  ctx.fillText('Vocabri', cardX + cardW/2, cardY + 42);

  ctx.font = '400 13px Nunito, sans-serif';
  ctx.fillStyle = colors.onPrimaryContainer + 'CC';
  ctx.fillText('Mi progreso en inglés', cardX + cardW/2, cardY + 64);

  // Línea separadora sutil
  ctx.strokeStyle = colors.outlineVariant + '40';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 24, cardY + 78);
  ctx.lineTo(cardX + cardW - 24, cardY + 78);
  ctx.stroke();

  // Foto de perfil + Nombre
  let photoY = cardY + 100;
  const avatarSize = 64;

  if(userPhoto){
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = userPhoto;
    // Placeholder circle
    ctx.fillStyle = colors.surfaceContainerHigh;
    drawCircle(ctx, cardX + cardW/2, photoY + avatarSize/2, avatarSize/2);
    ctx.fill();
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cardX + cardW/2, photoY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cardX + cardW/2 - avatarSize/2, photoY, avatarSize, avatarSize);
      ctx.restore();
      updateShareModalCanvas(canvas);
    };
    photoY += avatarSize + 16;
  }

  // Nombre de usuario
  ctx.fillStyle = colors.onSurface;
  ctx.font = '700 24px Nunito, sans-serif';
  ctx.fillText(userName, cardX + cardW/2, photoY + 30);

  // Email si existe
  if(userEmail){
    ctx.font = '400 13px Nunito, sans-serif';
    ctx.fillStyle = colors.onSurfaceVariant;
    ctx.fillText(userEmail, cardX + cardW/2, photoY + 52);
    photoY += 22;
  }

  // Categoría actual - chip style
  photoY += 12;
  const chipText = `Categoría: ${currentCategory}`;
  ctx.font = '500 12px Nunito, sans-serif';
  const chipWidth = ctx.measureText(chipText).width + 24;
  const chipX = cardX + cardW/2 - chipWidth/2;
  const chipY = photoY;
  const chipH = 28;
  drawRoundRect(ctx, chipX, chipY, chipWidth, chipH, 14);
  ctx.fillStyle = colors.primaryContainer;
  ctx.fill();
  ctx.fillStyle = colors.onPrimaryContainer;
  ctx.fillText(chipText, cardX + cardW/2, photoY + 19);
  photoY += chipH + 20;

  // Separador
  ctx.strokeStyle = colors.outlineVariant + '30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 24, photoY);
  ctx.lineTo(cardX + cardW - 24, photoY);
  ctx.stroke();

  // ===== NIVEL Y XP =====
  let currentY = photoY + 24;
  ctx.fillStyle = colors.onSurface;
  ctx.font = '600 18px Nunito, sans-serif';
  ctx.fillText(`Nivel ${level}`, cardX + cardW/2, currentY);

  currentY += 24;
  ctx.font = '400 14px Nunito, sans-serif';
  ctx.fillStyle = colors.onSurfaceVariant;
  ctx.fillText(`${xpInLevel} / ${xpNeeded} XP para siguiente nivel`, cardX + cardW/2, currentY);

  // Barra XP - estilo Material
  currentY += 16;
  const barWidth = cardW - 48;
  const barHeight = 8;
  const barX = cardX + 24;
  drawRoundRect(ctx, barX, currentY, barWidth, barHeight, 4);
  ctx.fillStyle = colors.surfaceContainerHigh;
  ctx.fill();

  const progressWidth = (xpInLevel / xpNeeded) * barWidth;
  drawRoundRect(ctx, barX, currentY, progressWidth, barHeight, 4);
  const xpGrad = ctx.createLinearGradient(barX, currentY, barX + progressWidth, currentY);
  xpGrad.addColorStop(0, colors.primary);
  xpGrad.addColorStop(1, colors.secondary);
  ctx.fillStyle = xpGrad;
  ctx.fill();

  // XP de hoy / Meta
  currentY += 24;
  ctx.font = '400 12px Nunito, sans-serif';
  ctx.fillStyle = colors.outline;
  ctx.fillText(`Hoy: ${totalXpToday} / ${dailyGoal} XP  •  ${Math.min(100, Math.round((totalXpToday/dailyGoal)*100))}% de la meta`, cardX + cardW/2, currentY);

  // ===== STATS GRID - Cards elevadas =====
  currentY += 28;
  const stats = [
    {icon: '🔥', label: 'Racha actual', value: streak + ' días', color: colors.error},
    {icon: '⭐', label: 'Frases dominadas', value: mastered, color: colors.xpGold},
    {icon: '📅', label: 'Días activo', value: activeDays, color: colors.primary},
    {icon: '📚', label: 'Total aprendido', value: totalLearned, color: colors.secondary},
    {icon: '✨', label: 'XP total', value: xpTotal, color: colors.tertiary},
    {icon: '🏆', label: 'Nivel actual', value: level, color: colors.success},
  ];

  stats.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = cardX + 24 + col * (cardW/2 - 12);
    const y = currentY + row * 90;
    const w = cardW/2 - 30;
    const h = 80;

    // Sombra sutil para stat cards (Elevation 1)
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    drawRoundRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = colors.surfaceContainer;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Barra de color superior (acento)
    drawRoundRect(ctx, x, y, w, 4, {tl: 16, tr: 16, bl: 0, br: 0});
    ctx.fillStyle = stat.color + '30';
    ctx.fill();

    // Icon + Label
    ctx.fillStyle = colors.onSurfaceVariant;
    ctx.font = '500 12px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${stat.icon} ${stat.label}`, x + w/2, y + 28);

    // Value
    ctx.fillStyle = colors.onSurface;
    ctx.font = '700 24px Nunito, sans-serif';
    ctx.fillText(stat.value, x + w/2, y + 58);
  });

  currentY += Math.ceil(stats.length / 2) * 90 + 20;

  // Separador final
  ctx.strokeStyle = colors.outlineVariant + '30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 24, currentY);
  ctx.lineTo(cardX + cardW - 24, currentY);
  ctx.stroke();

  // Footer
  currentY += 20;
  ctx.fillStyle = colors.outline;
  ctx.font = '400 11px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Compartido desde Vocabri', cardX + cardW/2, currentY);
  ctx.fillText(new Date().toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'}), cardX + cardW/2, currentY + 18);

  // ===== CREAR MODAL CON CANVAS Y BOTONES =====
  showShareModal(canvas, statusEl, {
    level, streak, mastered, activeDays, totalLearned, xpTotal,
    userName, userEmail, userPhoto, currentCategory, totalXpToday, dailyGoal
  });
}



// Helpers para dibujo
export function drawRoundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  if(typeof r === 'number'){
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
  }else{
    // r = {tl, tr, br, bl}
    const {tl=0, tr=0, br=0, bl=0} = r;
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    if(tr) ctx.arcTo(x + w, y, x + w, y + tr, tr);
    else ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - br);
    if(br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    else ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + bl, y + h);
    if(bl) ctx.arcTo(x, y + h, x, y + h - bl, bl);
    else ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + tl);
    if(tl) ctx.arcTo(x, y, x + tl, y, tl);
  }
  ctx.closePath();
}



export function drawCircle(ctx, x, y, r){
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}



export function showShareModal(canvas, statusEl, data){
  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'gModalOverlay';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '10000';
  modal.innerHTML = `
    <div class="gModal gModalWide" style="max-width:440px; max-height:90vh; overflow:auto;">
      <div class="modalHeader" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:sticky; top:0; background:var(--paper); padding-bottom:12px; border-bottom:1px solid var(--line); z-index:1;">
        <h3 style="margin:0; font-family:var(--font-ui);">📤 Compartir mi progreso</h3>
        <button class="modalCloseBtn" id="shareModalClose" type="button" aria-label="Cerrar">✕</button>
      </div>
      <div style="text-align:center; margin-bottom:16px;">
        <canvas id="shareCanvas" style="max-width:100%; height:auto; border-radius:16px; box-shadow:var(--elev2);"></canvas>
      </div>
      <div id="shareStatus" style="text-align:center; min-height:1.5em; font-size:.85rem; color:var(--muted);"></div>
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
        <button class="nav ripple hover-scale focus-glow" id="btnShareApp" style="width:100%;" type="button">
          📱 Compartir via app
        </button>
        <button class="nav ripple hover-scale" id="btnDownload" style="width:100%;" type="button">
          💾 Descargar imagen
        </button>
        <button class="nav ripple hover-scale" id="btnShareMessage" style="width:100%;" type="button">
          💬 Enviar como mensaje
        </button>
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

  // Si hay foto de Google, dibujarla ahora que el canvas está en el DOM
  if(data.userPhoto){
    drawProfilePhoto(modalCanvas, data.userPhoto);
  }

  const statusElModal = modal.querySelector('#shareStatus');

  // Cerrar modal
  const closeModal = () => {
    modal.remove();
    statusEl.textContent = '';
  };
  modal.querySelector('#shareModalClose').onclick = closeModal;
  modal.onclick = (e) => { if(e.target === modal) closeModal(); };

  // --- BOTÓN 1: Compartir via app (Web Share API con imagen) ---
  modal.querySelector('#btnShareApp').onclick = async () => {
    statusElModal.textContent = 'Preparando para compartir...';
    try{
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], `vocabri-progreso-${new Date().toISOString().slice(0,10)}.png`, {type: 'image/png'});

      if(navigator.share && navigator.canShare && navigator.canShare({files: [file]})){
        await navigator.share({
          title: 'Mi progreso en Vocabri',
          text: `¡Mira mi progreso en inglés! Nivel ${data.level}, racha de ${data.streak} días 🔥`,
          files: [file]
        });
        statusElModal.textContent = '✅ Compartido correctamente';
      }else{
        // Fallback: copiar al portapapeles + descargar
        await copyImageToClipboard(blob);
        statusElModal.textContent = '✅ Imagen copiada al portapapeles (comparte manualmente)';
        downloadBlob(blob, file.name);
      }
    }catch(e){
      if(e.name !== 'AbortError'){
        statusElModal.textContent = '❌ Error al compartir';
      }else{
        statusElModal.textContent = 'Compartir cancelado';
      }
    }
    setTimeout(()=> statusElModal.textContent = '', 4000);
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
          url: window.location.origin
        });
        statusElModal.textContent = '✅ Mensaje enviado';
      }else{
        // Fallback: copiar texto al portapapeles
        await navigator.clipboard.writeText(text + window.location.origin);
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

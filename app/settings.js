// Vocabri — módulo "settings" (generado a partir de app.js)
import { S } from './core/shared.js';
import { computeStreak, cooldownRemainingMs, fmtHhMmSs, setUnlockedStage, todayKeyStr } from './core/dataRegistry.js';
import { buildPathMap } from './mapRenderer.js';
import { render } from './profile.js';
import { renderProgress } from './progress.js';
import { getDailyGoalTarget, getXpToday } from './state.js';
import { CLOUD_PENDING_RESET_KEY, cloudMirrorUser, cloudSync, exportBackup } from './sync.js';
import { updateTrLabels } from './translator.js';
import { addScrollTopBtn, selectFocusCategory, updateGameBar } from './ui.js';



// --- Terms & Conditions modal ---



export function openTermsModal(){
  closeSettings();
  const ov = document.getElementById('termsModalOverlay');
  if(!ov) return;
  S._termsOpener = document.getElementById('settingsBtn');
  ov.style.display = 'flex';
  const box = ov.querySelector('.legalContent');
  if(box){ box.scrollTop = 0; const lm = ov.querySelector('.legalModal'); if(lm) lm.scrollTop = 0; addScrollTopBtn(box); }
  const closeBtn = document.getElementById('termsModalClose');
  if(closeBtn) closeBtn.focus();
}


export function closeTermsModal(){
  const ov = document.getElementById('termsModalOverlay');
  if(!ov) return;
  ov.style.display = 'none';
  if(S._termsOpener && S._termsOpener.focus){ try{ S._termsOpener.focus(); }catch(e){} }
  S._termsOpener = null;
}


export const termsBtnEl = document.getElementById('termsBtn');


export const termsModalCloseEl = document.getElementById('termsModalClose');


export const termsModalDoneEl = document.getElementById('termsModalDoneBtn');


export const termsOverlayEl = document.getElementById('termsModalOverlay');



export const setExpBtn = document.getElementById('setExportBtn');



export const setImpBtn = document.getElementById('setImportBtn');




// --- Configuración y temas ---
export const THEMES = {
  axolotl:{name:'Ajolote Rosa', tag:'Dulce y motivador',
    light:{bg:'#FFF0F5', paper:'#FFFFFF', primary:'#EC4899', secondary:'#F472B6', ink:'#1E1B4B'},
    dark:{bg:'#2D0A1E', paper:'#3D1A2E', primary:'#F472B6', secondary:'#F9A8D4', ink:'#FDF2F8'}},
  vitality:{name:'Vitality', tag:'Energía y enfoque',
    light:{bg:'#F8F9FB', paper:'#FFFFFF', primary:'#FF6B35', secondary:'#00A8E8', ink:'#1E293B'},
    dark:{bg:'#0F172A', paper:'#1E293B', primary:'#FF8C61', secondary:'#38BDF8', ink:'#F1F5F9'}},
  emerald:{name:'Emerald Mint', tag:'Frescura y crecimiento',
    light:{bg:'#F0FDF4', paper:'#FFFFFF', primary:'#10B981', secondary:'#06B6D4', ink:'#0F172A'},
    dark:{bg:'#064E3B', paper:'#022C22', primary:'#34D399', secondary:'#22D3EE', ink:'#ECFDF5'}},
  sunset:{name:'Sunset Dual', tag:'Calidez y fluidez',
    light:{bg:'#FFFBEB', paper:'#FFFFFF', primary:'#F59E0B', secondary:'#EC4899', ink:'#27272A'},
    dark:{bg:'#18181B', paper:'#27272A', primary:'#FBBF24', secondary:'#F472B6', ink:'#FAFAFA'}},
  indigo:{name:'Electric Indigo', tag:'Tecnología y gamificación',
    light:{bg:'#F5F3FF', paper:'#FFFFFF', primary:'#6366F1', secondary:'#10B981', ink:'#1E1B4B'},
    dark:{bg:'#09090B', paper:'#18181B', primary:'#818CF8', secondary:'#34D399', ink:'#F4F4F5'}}
};


export const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;


export function resolvedMode(){ return S.modeSel === 'auto' ? ((mq && mq.matches) ? 'dark' : 'light') : S.modeSel; }


export function lum(hex){
  const c = [1,3,5].map(i=> parseInt(hex.substr(i,2),16)/255)
    .map(v=> v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
  return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
}


export function contrastRatio(a,b){ const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }


export function applyTheme(){
  const m = resolvedMode();
  const t = THEMES[S.themeKey][m];
  const r = document.documentElement;
  r.setAttribute('data-theme', m);
  r.style.colorScheme = m;
  r.style.setProperty('--bg', t.bg);
  r.style.setProperty('--paper', t.paper);
  r.style.setProperty('--ink', t.ink);
  r.style.setProperty('--primary', t.primary);
  r.style.setProperty('--secondary', t.secondary);
  r.style.setProperty('--on-primary', contrastRatio(t.primary,'#FFFFFF') >= contrastRatio(t.primary,'#0B1220') ? '#FFFFFF' : '#0B1220');
  r.style.setProperty('--danger', m === 'dark' ? '#FF8A75' : '#C0392B');
  renderThemeList();
}


// Mapeo de tema → sticker de ajolote de color (carpeta: ajolotes_de_colores)
export const THEME_STICKERS = {
  axolotl: 'ajolote_rosa_brazos_abiertos.png',
  vitality: 'ajolote_rojo_caminando_saludando.png', // rojo/naranja para vitality
  emerald: 'ajolote_verde_bailando.png',
  sunset: 'ajolote_dorado_brillante.png', // dorado para sunset
  indigo: 'ajolote_morado_pensativo.png'
};



export function getThemeStickerPath(themeKey) {
  const filename = THEME_STICKERS[themeKey] || 'ajolote_rosa_brazos_abiertos.png';
  return './assets/stickers/ajolotes_de_colores/' + filename;
}



export function renderThemeList(){
  const box = document.getElementById('themeList');
  box.innerHTML = '';
  const m = resolvedMode();
  Object.keys(THEMES).forEach(k=>{
    const t = THEMES[k], c = t[m];
    const b = document.createElement('button');
    b.className = 'themeOpt' + (k === S.themeKey ? ' sel' : '');
    const stickerPath = getThemeStickerPath(k);
    b.innerHTML = '<span class="themeStickerWrap"><img class="themeSticker" src="'+stickerPath+'" alt="'+t.name+'" loading="lazy"></span>' +
                  '<span class="tn">'+t.name+'<small>'+t.tag+'</small></span>';
    b.onclick = ()=>{ S.themeKey = k; try{ localStorage.setItem('ci_theme', k); }catch(e){} applyTheme(); };
    box.appendChild(b);
  });
  document.querySelectorAll('.modeBtn').forEach(x=> x.classList.toggle('sel', x.dataset.mode === S.modeSel));
}



export const sBtn = document.getElementById('settingsBtn');


export const sPanel = document.getElementById('settingsPanel');


export function closeSettings(){ sPanel.hidden = true; sBtn.setAttribute('aria-expanded', 'false'); }



export function updateCatSelector(){
  const current = S.currentCat;
  document.querySelectorAll('#catSelector .catSelectorBtn').forEach(b=>{
    b.classList.toggle('sel', b.dataset.cat === current);
  });
}



export function initCatSelector(){
  document.querySelectorAll('#catSelector .catSelectorBtn').forEach(b=>{
    b.onclick = ()=> selectFocusCategory(b.dataset.cat);
  });
}

 // attach category selector handlers

// News/Changelog panel
export const APP_VERSION = '1.1.5';


export const APP_CHANGELOG = [
  { version: '1.1.5', date: '2026-11-10', title: 'Escucha y escribe, ajolote reactivo y atajos de teclado', changes: [
    'Nuevo modo «Escucha y escribe» en Repaso: escuchas la frase, la escribes y ajustas la velocidad del audio',
    'Repaso renovado con el mismo estilo que el resto de pestañas: resumen, meta diaria y gráfica de los próximos 7 días',
    'Ahora puedes voltear las tarjetas del Repaso tocándolas, igual que en las lecciones del mapa',
    'El ajolote reacciona cuando calificas una tarjeta, y hay confeti al subir de nivel, cumplir la meta diaria o aprobar un examen',
    'Animación al desbloquear una nueva sección en el mapa',
    'Atajos de teclado en Aprender, Repasar y Examen, con una guía en Ajustes y la opción de desactivarlos',
    'Mejores voces: se elige la más natural que tenga tu navegador y se avisa si solo hay voces básicas',
    'Las animaciones respetan la opción «reducir movimiento» de tu sistema',
    'La tarjeta para compartir tu progreso muestra de nuevo tu nivel, racha y tarjetas dominadas',
    'Si te quedas sin conexión, la sincronización con tu cuenta se reintenta sola al volver internet',
    'Limpieza interna: el SRS, el mapa, la comparación de respuestas y la fusión con la nube están separados y cubiertos por 108 pruebas automáticas'
  ]},
  { version: '1.1.4', date: '2026-11-03', title: 'Progreso por categoría, ejemplos y datos más sólidos', changes: [
    'Nueva sección «Por categoría» en Progreso: barra de dominio, tarjetas dominadas y secciones completadas de cada categoría',
    'Zonas con nombre y carteles en Viajes, Académico, Negocios y Pop & Gaming (Aeropuerto y Transporte, Reuniones, Series, Anime y Cine…)',
    'Las 400 frases de esas categorías ahora traen un ejemplo de uso en inglés y español («Ver ejemplo»)',
    'Corregido: Repaso, racha, estadísticas y tabla ahora cuentan también tu progreso en Viajes, Académico, Negocios y Pop',
    'Tu progreso se guarda con identificadores estables por frase y se migra solo desde versiones anteriores, sin perder nada',
    'Reemplazamos 18 frases repetidas por frases nuevas y corregimos varias traducciones poco naturales',
    'Examen: si dos frases se traducen igual (por ejemplo «Watch out!» y «Look out!»), se acepta cualquiera y no aparecen como opciones falsas',
    'Scroll con la rueda más suave y con inercia al mover el mouse fuera de la columna central (Perfil, Progreso y demás pestañas)',
    'Resultado del examen: el ajolote ya no queda tapado al reabrir la ventana, y es más compacta en pantallas bajas',
    'Las categorías de Mis Tarjetas se muestran con su nombre (General, Viajes…) y se quitó un título vacío en Perfil',
    'Limpieza interna: carga de frases más ligera y documentación actualizada'
  ]},
  { version: '1.1.3', date: '2026-10-28', title: 'Mapa isométrico 2.5D', changes: [
    'Nuevo logo animado del ajolote en el encabezado, con un encabezado más limpio (sin eslogan)',
    'Repaso renovado: repetición espaciada más justa, con intervalos que se ajustan a cómo lo recuerdas, deshacer y resumen de sesión',
    'Repasar una lección ya no borra tus intervalos, y adelantar un repaso ya no infla el progreso',
    'Exámenes de 12 preguntas (opción múltiple, escritura, dictado y pronunciación) con 5 vidas, estrellas por nota y pantalla de resultados',
    'Los errores del examen se envían al Repaso y hay un descanso con reloj de arena antes de repetirlo',
    'Arreglada la tabla completa (las filas ya no se ven por encima del encabezado)',
    'En escritorio, la rueda del mouse desplaza la pantalla desde cualquier punto',
    'Arreglada la instalación como app en GitHub Pages (error 404)',
    'Nuevo mapa con pilares isométricos, camino brillante y fichas 3D',
    'Decoración con nubes, montañas e islotes con ajolotes',
    'El mapa se adapta al ancho de la pantalla',
    'Zonas con nombre en carteles de madera, separadas por puentes',
    'Difuminado en los bordes que se funde con el tema',
    'Más variedad de stickers en el mapa, según el tema de cada zona, sin tapar textos ni quedar ocultos',
    'Nuevos íconos en la barra inferior, hechos a medida',
    'Modo ligero: si el mapa va lento te lo proponemos, y puedes activarlo o quitarlo en Ajustes',
    'El mapa ya no se reconstruye al volver a Aprender si nada cambió',
    'Botones táctiles más grandes y mejor adaptación a móviles en horizontal',
    '¿Te gusta Vocabri? Nuevo botón ⭐ en el encabezado para dar una estrella al repositorio de GitHub'
  ]},
  { version: '1.1.2', date: '2026-10-28', title: '5 Categorías maestras + Onboarding renovado', changes: [
    'Nuevo sistema de 5 categorías: General, Viajes, Académico, Negocios, Pop/Gaming',
    'Onboarding completo con selector de meta XP, nivel, enfoque y tema visual',
    'Carga dinámica de frases desde JSON externo (phraseLoader.js)',
    'Registro de categorías centralizado (categoriesRegistry.js)'
  ]},
  { version: '1.1.1', date: '2026-10-15', title: 'Correcciones y mejoras de estabilidad', changes: [
    'Fix en phraseLoader: carga correcta de frases al iniciar',
    'Sincronización del dropdown de categoría en header',
    'Tema y onboarding persistentes entre sesiones',
    'Metas diarias realistas y reinicio total funcional',
    'Auto-scroll en mapa y ajolote por defecto'
  ]},
  { version: '1.1.0', date: '2026-10-02', title: 'Mapa de progreso + SRS + Exámenes', changes: [
    'Mapa de etapas con nodos desbloqueables y exámenes',
    'Sistema SRS (Repetición Espaciada) para repasar tarjetas',
    'Exámenes por etapa con vidas y tipos de preguntas variados',
    'Racha diaria, meta XP configurable, nivel de usuario'
  ]},
  { version: '1.0.0', date: '2026-09-18', title: 'Lanzamiento inicial', changes: [
    'Tarjetas de vocabulario con volteo 3D',
    'Práctica con calificación (Repasar/Bien/Fácil)',
    'Estadísticas, racha, exportar/importar datos',
    'PWA instalable con service worker'
  ]}
];



export const nBtn = document.getElementById('newsBtn');


export const nPanel = document.getElementById('newsPanel');


export function closeNews(){ nPanel.hidden = true; nBtn.setAttribute('aria-expanded', 'false'); }


export function populateNews(){
  document.getElementById('newsCurrentVersion').innerHTML =
    '<span class="newsVersionLabel">Versión actual</span><span class="newsVersionNumber">' + APP_VERSION + '</span>';
  const changelogEl = document.getElementById('newsChangelog');
  changelogEl.innerHTML = APP_CHANGELOG.map(entry => `
    <div class="newsEntry">
      <div class="newsEntryVersion">v${entry.version} <span class="newsEntryDate">${entry.date}</span></div>
      <div class="newsEntryTitle">${entry.title}</div>
      <ul class="newsEntryChanges">${entry.changes.map(c => '<li>' + c + '</li>').join('')}</ul>
    </div>
  `).join('');
}



// --- Borrar progreso ---
// "Progress" = study data. Preferences (theme, voices, sound, reminders, daily-goal size) and the
// Google session are always kept. The user's own cards are only deleted if they opt in.
export const RESET_PROGRESS_KEYS = [
  'ci_xp_total', 'vocabri_xp_today', 'vocabri_last_study_date', 'vocabri_goal_celebrated_date',
  'vocabri_unlocked_stage', 'vocabriProgress', 'vocabri_flip_coach_done', 'ci_edits',
  'vocabri_language', 'ci_daily_goal_xp', 'ci_user_level', 'ci_user_focus', 'ci_theme',
  'onboardingDone', 'ci_current_master_category', 'ci_master_categories', 'ci_start_node'
];


export const RESET_PROGRESS_PREFIXES = ['ci_master_', 'ci_time_', 'vocabri_exam_'];

   // per-card progress, study minutes, exam results
export const RESET_CARD_KEYS = ['ci_custom_words', 'ci_custom_cats'];

                  // only with the checkbox
export const RESET_CONFIRM_WORD = 'BORRAR';

   // also tells the study-time timer to stop writing while we reset

export function isResetKey(k, includeCards){
  if(RESET_PROGRESS_KEYS.indexOf(k) >= 0) return true;
  if(RESET_PROGRESS_PREFIXES.some(p=> k.indexOf(p) === 0)) return true;
  return !!includeCards && RESET_CARD_KEYS.indexOf(k) >= 0;
}


export function resetAppData(includeCards){
  const doomed = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && isResetKey(k, includeCards)) doomed.push(k);
  }
  doomed.forEach(k=> localStorage.removeItem(k));
  return doomed.length;
}


export function resetConfirmMatches(){
  return document.getElementById('resetConfirmInput').value.trim().toUpperCase() === RESET_CONFIRM_WORD;
}


export function refreshResetConfirm(){
  document.getElementById('resetConfirmBtn').disabled = !resetConfirmMatches();
}


export function openResetModal(){
  closeSettings();
  const ov = document.getElementById('resetModalOverlay');
  document.getElementById('resetCardsChk').checked = false;
  document.getElementById('resetConfirmInput').value = '';
  document.getElementById('resetStatus').textContent = '';
  refreshResetConfirm();
  ov.style.display = 'flex';
  const box = ov.querySelector('.resetModal');
  if(box) box.scrollTop = 0;
  document.getElementById('resetCancelBtn').focus();    // the safest control gets the focus
}


export function closeResetModal(){
  if(S.appResetting) return;
  const ov = document.getElementById('resetModalOverlay');
  ov.style.display = 'none';
  document.getElementById('resetConfirmInput').value = '';
  const opener = document.getElementById('settingsBtn');
  if(opener && opener.focus){ try{ opener.focus(); }catch(e){} }
}


export function confirmResetProgress(){
  if(S.appResetting || !resetConfirmMatches()) return;
  const includeCards = document.getElementById('resetCardsChk').checked;
  const status = document.getElementById('resetStatus');
  S.appResetting = true;
  try{
    resetAppData(includeCards);
  }catch(e){
    S.appResetting = false;
    status.textContent = '❌ No se pudo borrar el progreso. Inténtalo de nuevo.';
    return;
  }
  document.getElementById('resetConfirmBtn').disabled = true;
  document.getElementById('resetCancelBtn').disabled = true;
  document.getElementById('resetBackupBtn').disabled = true;
  status.textContent = '✅ Progreso borrado. Reiniciando…';
  const reloadSoon = ()=> setTimeout(()=> location.reload(), 500);   // reload so every screen starts from a clean state
  if(S.cloudUser || cloudMirrorUser()){
    // the account copy is reset too: the next sync overwrites it instead of merging the old progress back
    try{ localStorage.setItem(CLOUD_PENDING_RESET_KEY, '1'); }catch(e){}
    if(S.cloudApi && S.cloudUser){
      status.textContent = '✅ Progreso borrado. Actualizando tu cuenta…';
      Promise.race([cloudSync({reason: 'reset'}), new Promise(r=> setTimeout(r, 6000))]).then(reloadSoon, reloadSoon);
      return;
    }
  }
  setTimeout(()=> location.reload(), 600);
}


export const resetOverlayEl = document.getElementById('resetModalOverlay');



// Inicializar categoría maestra guardada
export const savedMasterCat = localStorage.getItem('ci_current_master_category');



// Aplicar nodo inicial si está guardado (solo la primera vez)
export const startNode = parseInt(localStorage.getItem('ci_start_node') || '0', 10);



// --- Daily reminders (local notifications through the Service Worker) ---
// Web apps can't schedule an exact future alarm. We combine: (1) Periodic Background Sync, where the
// browser supports it (installed Chrome/Android PWAs), and (2) an in-page check while the app is
// open or backgrounded. Both read a small state file shared with sw.js (Cache Storage).
export const REMINDERS_KEY = 'vocabri_reminders';


export const REMINDER_TAG = 'vocabri-daily-reminder';

          // periodicSync tag + notification tag (same as sw.js)
export const REMINDER_STATE_CACHE = 'vocabri-state';

            // same as sw.js
export const REMINDER_STATE_URL = './vocabri-reminder-state.json';


export const REMINDER_START_HOUR = 10, REMINDER_END_HOUR = 22;

  // keep in sync with sw.js
export const REMINDER_ICON = './assets/origin-logo.png';


export const REMINDER_MESSAGES = [
  '🔥 ¡No pierdas tu racha en Vocabri! Completa tu lección de hoy.',
  '🎯 Tu meta diaria te está esperando en Vocabri. ¡Tú puedes!',
  '📚 Unos minutos hoy hacen la diferencia. ¡Vamos con tu meta diaria!',
  '💪 Un pequeño repaso hoy es un gran progreso mañana. ¡Entra a Vocabri!'
];



export function localIsoDate(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}


export function notificationsSupported(){ return ('Notification' in window) && ('serviceWorker' in navigator); }


export function remindersFlag(){ try{ return localStorage.getItem(REMINDERS_KEY) === '1'; }catch(e){ return false; } }


// "Activated" = the user turned it on AND the browser permission is still granted.
export function remindersActive(){ return remindersFlag() && notificationsSupported() && Notification.permission === 'granted'; }


export function setNotifStatus(msg){
  const el = document.getElementById('notifStatus');
  if(el) el.textContent = msg || '';
}


export function updateNotifToggleUi(){
  const b = document.getElementById('notifToggleBtn');
  if(!b) return;
  const on = remindersActive();
  b.textContent = on ? '🔔 Recordatorios diarios: Activados' : '🔔 Recordatorios diarios: Desactivados';
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
}


export async function readReminderState(){
  try{
    if(!('caches' in window)) return {};
    const cache = await caches.open(REMINDER_STATE_CACHE);
    const res = await cache.match(REMINDER_STATE_URL);
    return res ? await res.json() : {};
  }catch(e){ return {}; }
}


export async function writeReminderState(state){
  try{
    if(!('caches' in window)) return;
    const cache = await caches.open(REMINDER_STATE_CACHE);
    await cache.put(REMINDER_STATE_URL, new Response(JSON.stringify(state), {headers:{'Content-Type':'application/json'}}));
  }catch(e){}
}


// Tells the Service Worker whether reminders are on and whether today's goal is already done.
export async function publishReminderState(){
  const prev = await readReminderState();
  await writeReminderState({
    enabled: remindersActive(),
    date: localIsoDate(new Date()),
    goalDone: getXpToday() >= getDailyGoalTarget(),
    streak: computeStreak(),
    lastReminderDate: prev.lastReminderDate || null
  });
}


export function scheduleReminderStatePublish(){
  clearTimeout(S._reminderPublishTimer);
  S._reminderPublishTimer = setTimeout(()=>{ publishReminderState(); }, 600);
}


export function getSwRegistration(timeoutMs){
  if(!('serviceWorker' in navigator)) return Promise.resolve(null);
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise(resolve=> setTimeout(()=> resolve(null), timeoutMs || 4000))
  ]).catch(()=> null);
}


export function pickReminderBody(){
  const streak = computeStreak();
  if(streak >= 2) return '🔥 Llevas ' + streak + ' días seguidos en Vocabri. ¡No pierdas tu racha! Completa tu lección de hoy.';
  return REMINDER_MESSAGES[Math.floor(Date.now() / 86400000) % REMINDER_MESSAGES.length];
}


export function showReminderNotification(reg, body, tag){
  return reg.showNotification('Vocabri', {
    body: body, tag: tag || REMINDER_TAG, icon: REMINDER_ICON, badge: REMINDER_ICON,
    lang: 'es', data: {url: './'}
  });
}


export async function registerReminderSync(reg){
  try{
    if(!('periodicSync' in reg)) return false;
    const perm = await navigator.permissions.query({name:'periodic-background-sync'});
    if(perm.state !== 'granted') return false;
    await reg.periodicSync.register(REMINDER_TAG, {minInterval: 12 * 60 * 60 * 1000});
    return true;
  }catch(e){ return false; }
}


export async function unregisterReminderSync(){
  try{
    const reg = await navigator.serviceWorker.getRegistration();
    if(reg && reg.periodicSync) await reg.periodicSync.unregister(REMINDER_TAG);
  }catch(e){}
}


export async function enableReminders(){
  if(!notificationsSupported()){ setNotifStatus('Tu navegador no soporta notificaciones.'); return false; }
  if(Notification.permission === 'denied'){
    setNotifStatus('Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador para este sitio.');
    return false;
  }
  let perm = Notification.permission;
  if(perm !== 'granted'){
    try{ perm = await Notification.requestPermission(); }catch(e){ perm = 'denied'; }
  }
  if(perm !== 'granted'){
    setNotifStatus('No se concedió el permiso. Los recordatorios siguen desactivados.');
    return false;
  }
  const reg = await getSwRegistration(4000);
  if(!reg){
    setNotifStatus('El service worker aún no está activo. Recarga la app e inténtalo de nuevo.');
    return false;
  }
  try{ localStorage.setItem(REMINDERS_KEY, '1'); }catch(e){}
  await publishReminderState();
  const background = await registerReminderSync(reg);
  try{ await showReminderNotification(reg, '🔔 Recordatorios activados. Te avisaremos si aún falta tu meta del día.', 'vocabri-reminders-on'); }catch(e){}
  setNotifStatus(background
    ? '✅ Activados. Recibirás un aviso diario si aún no completas tu meta.'
    : '✅ Activados. Tu dispositivo no permite avisos con la app cerrada: te recordaremos mientras Vocabri siga abierta en segundo plano.');
  return true;
}


export async function disableReminders(){
  try{ localStorage.setItem(REMINDERS_KEY, '0'); }catch(e){}
  await unregisterReminderSync();
  await publishReminderState();
  setNotifStatus('Recordatorios desactivados.');
}


// In-page fallback: runs only while the app is alive but in the background.
export async function maybeShowReminderFromPage(){
  if(!remindersActive()) return;
  const now = new Date();
  const hour = now.getHours();
  if(hour < REMINDER_START_HOUR || hour >= REMINDER_END_HOUR) return;
  if(getXpToday() >= getDailyGoalTarget()) return;
  const today = localIsoDate(now);
  const state = await readReminderState();
  if(state.lastReminderDate === today) return;
  const reg = await getSwRegistration(1500);
  if(!reg) return;
  await showReminderNotification(reg, pickReminderBody());
  state.lastReminderDate = today;
  await writeReminderState(state);
  publishReminderState();
}


export function initReminders(){
  updateNotifToggleUi();
  if(remindersFlag() && !remindersActive()){
    setNotifStatus('Los recordatorios necesitan el permiso de notificaciones. Vuelve a activarlos.');
  }
  publishReminderState();
  if(remindersActive()){
    getSwRegistration(2000).then(reg=>{ if(reg) registerReminderSync(reg); });
  }
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) publishReminderState(); });
  setInterval(()=>{ if(document.hidden) maybeShowReminderFromPage(); }, 60 * 1000);
}



// --- PWA auto-update (works together with sw.js) ---



export function showUpdateBanner(worker){
  S._waitingWorker = worker || S._waitingWorker;
  const banner = document.getElementById('updateBanner');
  if(banner) banner.hidden = false;
}


export function applyPwaUpdate(){
  const btn = document.getElementById('updateNowBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Actualizando…'; }
  let reloaded = false;
  const reload = ()=>{ if(reloaded) return; reloaded = true; window.location.reload(); };
  // Reload as soon as the new worker takes control.
  navigator.serviceWorker.addEventListener('controllerchange', reload);
  navigator.serviceWorker.getRegistration().then(reg=>{
    const worker = (reg && reg.waiting) || S._waitingWorker;
    if(worker) worker.postMessage({type: 'SKIP_WAITING'});
    else reload();
  }).catch(reload);
  // Fallback: never leave the user hanging if that event doesn't arrive.
  setTimeout(reload, 2500);
}


export function ensureServiceWorkerRegistered(){
  if(!('serviceWorker' in navigator)) return;
  const register = ()=> navigator.serviceWorker.getRegistration().then(reg=>{
    if(!reg) return navigator.serviceWorker.register('./sw.js');
  }).catch(()=>{});
  if(document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}


export function initPwaUpdates(){
  if(!('serviceWorker' in navigator)) return;
  ensureServiceWorkerRegistered();
  const btn = document.getElementById('updateNowBtn');
  if(btn) btn.onclick = applyPwaUpdate;
  navigator.serviceWorker.ready.then(reg=>{
    const watch = (worker)=>{
      if(!worker) return;
      worker.addEventListener('statechange', ()=>{
        // "installed" with an existing controller = an update (not the very first install)
        if(worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(worker);
      });
    };
    if(reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
    if(reg.installing) watch(reg.installing);
    reg.addEventListener('updatefound', ()=> watch(reg.installing));
    // Look for new versions while the app stays open.
    const check = ()=>{ reg.update().catch(()=>{}); };
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible') check(); });
  }).catch(()=>{});
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [3621, function(){
S._termsOpener = null;
  }],
  [3641, function(){
if(termsBtnEl) termsBtnEl.onclick = openTermsModal;
  }],
  [3643, function(){
if(termsModalCloseEl) termsModalCloseEl.onclick = closeTermsModal;
  }],
  [3645, function(){
if(termsModalDoneEl) termsModalDoneEl.onclick = closeTermsModal;
  }],
  [3647, function(){
if(termsOverlayEl) termsOverlayEl.addEventListener('click', (e)=>{ if(e.target === termsOverlayEl) closeTermsModal(); });
  }],
  [3648, function(){
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && termsOverlayEl && termsOverlayEl.style.display === 'flex') closeTermsModal();
});
  }],
  [3653, function(){
if(setExpBtn) setExpBtn.onclick = exportBackup;
  }],
  [3656, function(){
if(setImpBtn) setImpBtn.onclick = ()=> document.getElementById('importFile').click();
  }],
  [4849, function(){
S.themeKey = 'axolotl';
  }],
  [4849, function(){
S.modeSel = 'auto';
  }],
  [4850, function(){
try{ S.themeKey = localStorage.getItem('ci_theme') || 'axolotl'; S.modeSel = localStorage.getItem('ci_mode') || 'auto'; }catch(e){}
  }],
  [4851, function(){
if(!THEMES[S.themeKey]) S.themeKey = 'axolotl';
  }],
  [4852, function(){
if(['auto','light','dark'].indexOf(S.modeSel) < 0) S.modeSel = 'auto';
  }],
  [4906, function(){
document.querySelectorAll('.modeBtn').forEach(b=>{
  b.onclick = ()=>{ S.modeSel = b.dataset.mode; try{ localStorage.setItem('ci_mode', S.modeSel); }catch(e){} applyTheme(); };
});
  }],
  [4909, function(){
if(mq){
  const onMq = ()=>{ if(S.modeSel === 'auto') applyTheme(); };
  if(mq.addEventListener) mq.addEventListener('change', onMq); else if(mq.addListener) mq.addListener(onMq);
}
  }],
  [4931, function(){
sBtn.onclick = (e)=>{
  e.stopPropagation();
  const opening = sPanel.hidden;
  sPanel.hidden = !opening;
  sBtn.setAttribute('aria-expanded', String(opening));
  if (opening) {
    sPanel.scrollTo(0, 0); // auto-scroll top
    updateCatSelector(); // refresh category selector
  }
};
  }],
  [4942, function(){
initCatSelector();
  }],
  [5023, function(){
nBtn.onclick = (e)=>{
  e.stopPropagation();
  const opening = nPanel.hidden;
  nPanel.hidden = !opening;
  nBtn.setAttribute('aria-expanded', String(opening));
  if (opening) {
    populateNews();
    nPanel.scrollTo(0, 0);
    addScrollTopBtn(nPanel);
  }
};
  }],
  [5034, function(){
document.getElementById('newsCloseBtn').onclick = closeNews;
  }],
  [5035, function(){
document.addEventListener('click', e=>{
  if(nPanel.hidden) return;
  const path = e.composedPath ? e.composedPath() : [];
  const inside = path.length ? path.indexOf(nPanel) >= 0 : nPanel.contains(e.target);
  if(!inside) closeNews();
});
  }],
  [5041, function(){
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeNews(); });
  }],
  [5042, function(){
document.getElementById('themesBtn').onclick = ()=>{
  const box = document.getElementById('themesBox');
  box.hidden = !box.hidden;
};
  }],
  [5047, function(){
document.getElementById('catSelectorBtn').onclick = ()=>{
  const box = document.getElementById('catSelector');
  const opening = box.hidden;
  box.hidden = !opening;
  if (opening) updateCatSelector();
};
  }],
  [5054, function(){
document.addEventListener('click', e=>{
  if(sPanel.hidden) return;
  const path = e.composedPath ? e.composedPath() : [];
  const inside = path.length ? path.indexOf(sPanel) >= 0 : sPanel.contains(e.target);
  if(!inside) closeSettings();
});
  }],
  [5060, function(){
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeSettings(); });
  }],
  [5062, function(){
setInterval(()=>{
  if(S.appResetting) return;
  if(document.visibilityState === 'visible'){
    try{
      const k = 'ci_time_'+todayKeyStr();
      const cur = parseInt(localStorage.getItem(k)||'0',10);
      localStorage.setItem(k, String(cur+10));
    }catch(e){}
    if(S.view === 'progress') renderProgress();
    updateGameBar();
  }
}, 10000);
  }],
  [5074, function(){
setInterval(()=>{
  if(document.visibilityState !== 'visible') return;
  const el = document.querySelector('.nodeTimer');
  if(!el) return;
  const rem = cooldownRemainingMs();
  if(rem <= 0){
    if(S.view === 'learn' && S.cardsSubView === 'map') buildPathMap();
    return;
  }
  el.textContent = fmtHhMmSs(rem);
}, 1000);
  }],
  [5917, function(){
S.appResetting = false;
  }],
  [5987, function(){
document.getElementById('setResetBtn').onclick = openResetModal;
  }],
  [5988, function(){
document.getElementById('resetCancelBtn').onclick = closeResetModal;
  }],
  [5989, function(){
document.getElementById('resetConfirmBtn').onclick = confirmResetProgress;
  }],
  [5990, function(){
document.getElementById('resetConfirmInput').addEventListener('input', refreshResetConfirm);
  }],
  [5991, function(){
document.getElementById('resetConfirmInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){ e.preventDefault(); confirmResetProgress(); }
});
  }],
  [5994, function(){
document.getElementById('resetBackupBtn').onclick = ()=>{
  const ok = exportBackup();
  document.getElementById('resetStatus').textContent = ok
    ? '✅ Respaldo descargado. Guárdalo en un lugar seguro.'
    : '❌ No se pudo exportar el respaldo.';
};
  }],
  [6001, function(){
resetOverlayEl.addEventListener('click', (e)=>{ if(e.target === resetOverlayEl) closeResetModal(); });
  }],
  [6002, function(){
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && resetOverlayEl.style.display === 'flex') closeResetModal();
});
  }],
  [6007, function(){
applyTheme();
  }],
  [6011, function(){
if (savedMasterCat && window.VocabriCategories && window.VocabriCategories.isValidCategory(savedMasterCat)) {
  S.currentCat = savedMasterCat;

  // Mostrar label de la categoría maestra
  let label = savedMasterCat;
  if (window.VocabriCategories) {
    label = window.VocabriCategories.getCategoryShortLabel(savedMasterCat);
  }
  // catSelectLabel removed - category selector moved to settings panel
} else {
  // catSelectLabel removed - category selector moved to settings panel
}
  }],
  [6024, function(){
updateCatSelector();
  }],
  [6026, function(){

// headerCatWrap removed - category selector moved to settings panel
updateTrLabels();
  }],
  [6027, function(){
render(true);
  }],
  [6028, function(){
updateGameBar();
  }],
  [6032, function(){
if (startNode > 0) {
  setUnlockedStage(S.currentCat, startNode);
  localStorage.removeItem('ci_start_node');
}
  }],
  [6038, function(){


// --- Material You ripple feedback (lightweight, event-delegated) ---
document.addEventListener('pointerdown', (e)=>{
  const el = e.target.closest('button.nav, .rateBtn, .showAnswerBtn, .pathNode, .examMcBtn, .navItem');
  if(!el) return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'mdRipple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
  const prevPos = getComputedStyle(el).position;
  if(prevPos === 'static') el.style.position = 'relative';
  el.style.overflow = el.style.overflow || 'hidden';
  el.appendChild(ripple);
  setTimeout(()=> ripple.remove(), 500);
});
  }],
  [6071, function(){
S._reminderPublishTimer = null;
  }],
  [6205, function(){
document.getElementById('notifToggleBtn').onclick = async ()=>{
  const btn = document.getElementById('notifToggleBtn');
  btn.disabled = true;
  try{
    if(remindersActive()) await disableReminders();
    else await enableReminders();
  } finally {
    btn.disabled = false;
    updateNotifToggleUi();
  }
};
  }],
  [6230, function(){
S._waitingWorker = null;
  }],
  [6282, function(){
initReminders();
  }],
  [6283, function(){
initPwaUpdates();
  }]
];

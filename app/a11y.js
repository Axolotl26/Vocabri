// Accesibilidad para lectores de pantalla: roles de diálogo y nombres accesibles.
// Se aplica a lo que ya existe y a lo que se cree después (ventanas dinámicas).
const OVERLAY = '.gModalOverlay';
const PANELS = { settingsPanel: 'Ajustes', newsPanel: 'Novedades', starPanel: 'Mis estrellas',
  collectionPanel: 'Colecciones', situationsPanel: 'Mapa de situaciones', missionsHallPanel: 'Salón de misiones' };
const LABELS = { myCardsImportFile: 'Importar tarjetas', importFile: 'Importar progreso',
  exportCardsAll: 'Seleccionar todas las tarjetas', voiceEn: 'Voz en inglés', voiceEs: 'Voz en español' };

export function labelFor(el){
  const h = el.querySelector('h1,h2,h3,.gModalTitle,.title,b,strong');
  const t = h && h.textContent.replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, 80) : 'Ventana';
}
export function applyA11y(root = document){
  root.querySelectorAll(OVERLAY).forEach(o => {
    if(o.getAttribute('role')) return;
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-label', labelFor(o));
  });
  Object.keys(PANELS).forEach(id => {
    const p = root.querySelector ? root.querySelector('#' + id) : null;
    if(p && !p.getAttribute('role')){ p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', PANELS[id]); }
  });
  Object.keys(LABELS).forEach(id => {
    const e = root.querySelector ? root.querySelector('#' + id) : null;
    if(e && !e.getAttribute('aria-label')) e.setAttribute('aria-label', LABELS[id]);
  });
}
export function startA11y(){
  applyA11y();
  let queued = false;
  new MutationObserver(() => { if(queued) return; queued = true; requestAnimationFrame(() => { queued = false; applyA11y(); }); })
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener('keydown', e => {          // Escape cierra el diálogo superior visible
    if(e.key !== 'Escape') return;
    const open = [...document.querySelectorAll(OVERLAY)].filter(o => getComputedStyle(o).display !== 'none');
    const top = open[open.length - 1]; if(!top) return;
    const btn = top.querySelector('[data-close],.closeBtn,button[id$="Close"],button[id$="close"]');
    if(btn) btn.click();
  });
}

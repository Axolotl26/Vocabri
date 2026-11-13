// Vocabri — Ajustes con orden y estilo nuevos: secciones agrupadas, cabecera con ✕, iconos SVG cartoon
// en lugar de emojis y botones ☰ / Novedades en SVG. Reordena el DOM existente (los botones conservan sus eventos).
import { closeSettings } from './settings.js';
import { _ni } from './ui.js';

const P = (c, e, shapes, extra) => _ni(c, e, shapes, extra || '');
const W = 'fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  palette: P('#F472B6', '#9D2461', '<path d="M14 3.200C7.600 3.200 3 7.600 3 13.400c0 6.200 4.600 11.400 10.400 11.400 1.800 0 2.600-1 2.600-2.200 0-1.700-1.400-1.800-1.400-3.200 0-1.300 1-2.200 2.300-2.200h2.900c3.300 0 5.600-1.800 5.600-5.300C25.400 7 20.400 3.200 14 3.200z"/>', '<circle cx="8.600" cy="12.400" r="1.700" fill="#FDE68A"/><circle cx="11.800" cy="8" r="1.700" fill="#fff"/><circle cx="17.200" cy="8" r="1.700" fill="#A7F3D0"/><circle cx="20.400" cy="12.200" r="1.700" fill="#BAE6FD"/>'),
  books: P('#38BDF8', '#0B6190', '<rect x="3.800" y="5" width="6.800" height="19" rx="1.900"/><rect x="11.600" y="3.200" width="6.800" height="20.800" rx="1.900"/><rect x="19.200" y="7" width="6" height="17" rx="1.900" transform="rotate(12 22.200 15.500)"/>', '<path d="M7.200 9v3.600M15 7.600v3.600" ' + W + ' stroke-opacity=".75" stroke-width="2"/>'),
  speaker: P('#2DD4BF', '#0B6B60', '<path d="M3.500 10.500h4.600l6.400-5.200v17.400l-6.400-5.200H3.500z"/><path class="niLn" d="M18.200 10.200a5.600 5.600 0 0 1 0 7.600M21.800 7a10 10 0 0 1 0 14"/>', ''),
  sparkles: P('#FBBF24', '#9A5A07', '<path d="M11.500 3l2.600 6.800 6.800 2.600-6.800 2.600L11.500 22l-2.600-7-6.800-2.600 6.800-2.600z"/><path d="M21.800 14.800l1.200 3 3 1.200-3 1.200-1.200 3-1.200-3-3-1.200 3-1.200z"/>', '<path d="M8.600 8.800 10 6.400" ' + W + ' stroke-opacity=".7" stroke-width="1.8"/>'),
  keyboard: P('#A78BFA', '#4C2C9E', '<rect x="2.500" y="6.500" width="23" height="15" rx="4"/>', '<path d="M7 11.500h.1M11 11.500h.1M15 11.500h.1M19 11.500h.1M9 16.500h10" ' + W + ' stroke-width="2.4"/>'),
  voice: P('#4ADE80', '#14783B', '<rect x="9.500" y="2.800" width="9" height="14" rx="4.500"/><path class="niLn" d="M6 13.500a8 8 0 0 0 16 0M14 21.800v3"/>', '<path d="M12.200 7.400v3" ' + W + ' stroke-opacity=".7" stroke-width="1.8"/>'),
  bell: P('#F59E0B', '#8A4B05', '<path d="M14 3.500c-4 0-6.800 3-6.800 7v4.200l-2.400 3.600V20h18.400v-1.700l-2.400-3.600v-4.200c0-4-2.800-7-6.800-7z"/><path d="M11 22.200a3 3 0 0 0 6 0z"/>', '<path d="M10 9.600a4.600 4.600 0 0 1 2.200-2.400" ' + W + ' stroke-opacity=".7" stroke-width="1.8"/>'),
  download: P('#38BDF8', '#0B6190', '<circle cx="14" cy="14" r="11"/>', '<path d="M14 8.500v9M9.800 14l4.200 4.200 4.200-4.200" ' + W + '/>'),
  upload: P('#2DD4BF', '#0B6B60', '<circle cx="14" cy="14" r="11"/>', '<path d="M14 19.500v-9M9.800 14.200 14 10l4.200 4.200" ' + W + '/>'),
  trash: P('#F87171', '#8B1A1A', '<path d="M6.500 9h15l-1.200 13.600a2.200 2.200 0 0 1-2.200 2H9.900a2.200 2.200 0 0 1-2.200-2z"/><rect x="4.500" y="5" width="19" height="4" rx="1.800"/>', '<path d="M11.200 12.600v7M16.800 12.600v7" ' + W + ' stroke-width="2.2"/>'),
  doc: P('#A78BFA', '#4C2C9E', '<path d="M7 3h9.500l5.500 5.500V23a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>', '<path d="M9.500 13.500h9M9.500 17.500h9M9.500 9.500h4" ' + W + ' stroke-width="2.2"/>'),
  refresh: P('#4ADE80', '#14783B', '<circle cx="14" cy="14" r="11"/>', '<path d="M19.600 13.400A5.800 5.800 0 0 0 9 10.600M8.400 14.600A5.800 5.800 0 0 0 19 17.400" ' + W + ' stroke-width="2.4"/><path d="M19.800 8.800v4.600h-4.600M8.200 19.200v-4.600h4.600" ' + W + ' stroke-width="2.4"/>'),
  sun: P('#FBBF24', '#9A5A07', '<circle cx="14" cy="14" r="5.800"/><path class="niLn" d="M14 3v2.800M14 22.200V25M3 14h2.800M22.200 14H25M6.200 6.200l2 2M19.800 19.800l2 2M21.800 6.200l-2 2M8.200 19.800l-2 2"/>', ''),
  moon: P('#818CF8', '#3730A3', '<path d="M21 18.800A9.400 9.400 0 0 1 10.200 4.600a9.800 9.800 0 1 0 10.800 14.200z"/>', ''),
  auto: P('#94A3B8', '#334155', '<circle cx="14" cy="14" r="10.500"/>', '<path d="M14 3.500a10.500 10.500 0 0 1 0 21z" fill="#fff" fill-opacity=".9"/>'),
  globe: P('#38BDF8', '#0B6190', '<circle cx="14" cy="14" r="10.500"/>', '<path d="M3.800 14h20.400M14 3.600c3.200 3 3.200 17.800 0 20.800M14 3.600c-3.200 3-3.200 17.800 0 20.800" fill="none" stroke="#fff" stroke-width="1.900" stroke-opacity=".85" stroke-linecap="round"/>'),
  plane: P('#38BDF8', '#0B6190', '<path d="M14 2.800c1.700 0 2.500 1.300 2.500 3V11l7.600 4.500v2.700l-7.600-2.200v4.500l2.300 1.800V25L14 23.500 9.200 25v-2.700l2.300-1.800V16L3.900 18.200v-2.700L11.500 11V5.800c0-1.700.8-3 2.500-3z"/>', ''),
  cap: P('#A78BFA', '#4C2C9E', '<path d="M14 5.500 2.800 11 14 16.600 25.200 11z"/><path d="M7.500 14.600v4.800c0 1.700 2.900 3.100 6.500 3.100s6.500-1.400 6.500-3.100v-4.800L14 18z"/>', ''),
  briefcase: P('#F59E0B', '#8A4B05', '<rect x="3.500" y="9" width="21" height="14.500" rx="3.800"/><path class="niLn" d="M10.200 9V7.400a2 2 0 0 1 2-2h3.600a2 2 0 0 1 2 2V9"/>', '<path d="M3.800 15.200h20.400" fill="none" stroke="#8A4B05" stroke-width="2"/>'),
  gamepad: P('#4ADE80', '#14783B', '<path d="M8 8.500h12c3.300 0 5.300 3.500 5.800 8 .3 2.700-.6 5-2.900 5-1.600 0-2.600-1.200-3.700-2.500H8.800c-1.100 1.300-2.100 2.500-3.700 2.500-2.300 0-3.200-2.300-2.900-5C2.700 12 4.700 8.500 8 8.500z"/>', '<path d="M8.800 13.200v4.200M6.700 15.300h4.200" ' + W + ' stroke-width="2.2"/><circle cx="18.200" cy="14.200" r="1.300" fill="#fff"/><circle cx="21" cy="16.600" r="1.300" fill="#fff"/>'),
  star: P('#FBBF24', '#9A5A07', '<polygon points="14,2.600 17.500,10 25.500,10.900 19.600,16.300 21.300,24.200 14,20.200 6.700,24.200 8.400,16.300 2.500,10.900 10.500,10"/>', '<path d="M9.600 9.600l2.800-3.600" ' + W + ' stroke-opacity=".7" stroke-width="1.8"/>'),
  folder: P('#38BDF8', '#0B6190', '<path d="M3.500 8.500a2.500 2.500 0 0 1 2.500-2.500h5.200l2.600 3h8.200a2.500 2.500 0 0 1 2.500 2.500v9.500a2.500 2.500 0 0 1-2.500 2.500H6a2.500 2.500 0 0 1-2.500-2.500z"/>', '<path d="M3.800 12.800h20.400" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.800"/>'),
  menu: P('#A78BFA', '#4C2C9E', '<rect x="3" y="5" width="22" height="16" rx="4.500"/>', '<path d="M8.200 10.200h11.600M8.200 13h11.600M8.200 15.800h11.600" ' + W + ' stroke-width="2.2"/>'),
  close: P('#F472B6', '#9D2461', '<rect x="3" y="5" width="22" height="16" rx="4.500"/>', '<path d="M9.800 9.600l8.400 7.200M18.200 9.600l-8.400 7.200" ' + W + ' stroke-width="2.4"/>'),
  news: P('#38BDF8', '#0B6190', '<rect x="3" y="5" width="22" height="16" rx="3.800"/>', '<path d="M7.400 9.600h5.400v4.200H7.400zM15 10.200h5.600M15 13.600h5.600M7.400 17h13.200" ' + W + ' stroke-width="2"/>')
};
const EMOJI_KEY = { '🎨': 'palette', '📚': 'books', '🔊': 'speaker', '🔈': 'speaker', '✨': 'sparkles', '⌨': 'keyboard', '🗣': 'voice', '🔔': 'bell', '⬇': 'download', '⬆': 'upload', '🗑': 'trash', '📄': 'doc', '🔄': 'refresh', '⏳': 'refresh', '☀': 'sun', '🌙': 'moon', '🌍': 'globe', '✈': 'plane', '🎓': 'cap', '💼': 'briefcase', '🎮': 'gamepad', '⭐': 'star', '📂': 'folder' };
const EMOJI_RE = /^((?:\p{Extended_Pictographic})[️‍]*)\s*/u;
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = id => document.getElementById(id);

// Cambia el emoji inicial de un botón por su SVG (y lo repite si otro código vuelve a escribir el texto)
function decorate(btn){
  if(!btn || btn.querySelector('small') || btn.querySelector('.spBtnIc')) return;
  const txt = btn.textContent, m = txt.match(EMOJI_RE);
  if(!m) return;
  const key = EMOJI_KEY[m[1].replace(/[️‍]/g, '')];
  if(!key) return;
  btn.innerHTML = '<span class="spBtnIc" aria-hidden="true">' + ICONS[key] + '</span><span class="spBtnTx">' + esc(txt.slice(m[0].length).trim()) + '</span>';
}
function decorateAll(root){
  root.querySelectorAll('button.setBtn, button.modeBtn, button.catSelectorBtn').forEach(decorate);
}

function titleHtml(icon, text){ return '<span class="spIc" aria-hidden="true">' + ICONS[icon] + '</span><span>' + esc(text) + '</span>'; }
function section(icon, text, i){
  const s = document.createElement('div');
  s.className = 'setSec spSec'; s.style.setProperty('--i', i);
  s.innerHTML = '<div class="setTitle spTitle">' + titleHtml(icon, text) + '</div>';
  return s;
}
const mv = (to, ...els) => els.forEach(e => { if(e) to.appendChild(e); });

function restructure(panel){
  if(panel.dataset.spDone) return; panel.dataset.spDone = '1';
  const get = id => q(id);
  const old = [...panel.querySelectorAll(':scope > .setSec')];

  const head = document.createElement('div');
  head.className = 'spHead';
  head.innerHTML = '<h2 class="spHeadTitle">Ajustes</h2><button type="button" class="spClose hover-scale focus-glow" id="spClose" aria-label="Cerrar ajustes">' + ICONS.close + '</button>';
  panel.insertBefore(head, panel.firstChild);

  const look = section('palette', 'Apariencia', 1);
  mv(look, get('themesBtn'), get('themesBox'));

  const study = section('books', 'Estudio', 2);
  const goalRow = panel.querySelector('.goalRow');
  const goalLbl = document.createElement('div'); goalLbl.className = 'spSub'; goalLbl.textContent = 'Meta diaria';
  mv(study, get('catSelectorBtn'), get('catSelector'), goalLbl, goalRow);

  const sound = section('speaker', 'Sonido y avisos', 3);
  mv(sound, get('sfxToggleBtn'), get('voiceConfigBtn'), get('notifToggleBtn'), get('notifStatus'));

  const exp = section('sparkles', 'Experiencia', 4);
  mv(exp, get('fxToggleBtn'), get('shortcutsBtn'));

  const data = section('download', 'Datos y cuenta', 5);
  mv(data, panel.querySelector('.backupRow'), get('syncStatus'), get('setResetBtn'));

  const upd = get('updCheckBtn') && get('updCheckBtn').closest('.setSec');
  const about = section('doc', 'Acerca de', 7);
  mv(about, get('termsBtn'));

  [look, study, sound, exp, data].forEach(s => panel.appendChild(s));
  if(upd){
    const t = upd.querySelector('.setTitle'); if(t){ t.classList.add('spTitle'); t.innerHTML = titleHtml('refresh', 'Actualizaciones'); }
    upd.classList.add('spSec'); panel.appendChild(upd);
  }
  panel.appendChild(about);
  old.forEach(s => { if(s !== upd && !s.querySelector('button, .goalRow, input, select')) s.remove(); });
  old.forEach(s => { if(s !== upd && s.isConnected && !s.children.length) s.remove(); });

  decorateAll(panel);
  let busy = false;
  const obs = new MutationObserver(recs => {
    if(busy) return; busy = true;
    const seen = new Set();
    recs.forEach(r => { const b = (r.target.nodeType === 3 ? r.target.parentElement : r.target).closest && (r.target.nodeType === 3 ? r.target.parentElement : r.target).closest('button.setBtn, button.modeBtn, button.catSelectorBtn'); if(b && !seen.has(b)){ seen.add(b); decorate(b); } });
    obs.takeRecords(); busy = false;
  });
  obs.observe(panel, { childList: true, characterData: true, subtree: true });

  q('spClose').addEventListener('click', () => { closeSettings(); const b = q('settingsBtn'); if(b) b.focus({ preventScroll: true }); });
}

// ☰ y 📰 pasan a ser iconos cartoon (el ☰ se convierte en ✕ cuando el menú está abierto)
function swapHeaderIcons(){
  const mk = html => { const s = document.createElement('span'); s.className = 'navIcon hdrIcon'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = html; return s; };
  const sb = q('settingsBtn');
  if(sb && !sb.querySelector('.hdrIcon')){
    [...sb.childNodes].forEach(n => { if(n.nodeType === 3) n.remove(); });
    const s = mk('<span class="menuOn">' + ICONS.menu + '</span><span class="menuX">' + ICONS.close + '</span>');
    s.classList.add('menuIcon'); sb.insertBefore(s, sb.firstChild);
  }
  const nb = q('newsBtn');
  if(nb && !nb.querySelector('.hdrIcon')){
    [...nb.childNodes].forEach(n => { if(n.nodeType === 3) n.remove(); });
    nb.insertBefore(mk(ICONS.news), nb.firstChild);
  }
}

// ---- Menús del encabezado: se abren en el centro, de uno en uno, con fondo oscuro ----
const MENUS = [['settingsPanel', 'settingsBtn', 'Ajustes'], ['newsPanel', 'newsBtn', 'Novedades'], ['starPanel', 'starBtn', 'Apoya el proyecto']];
function centerMenus(){
  const header = document.querySelector('header'); if(!header || q('hdrBackdrop')) return;
  const back = document.createElement('div');
  back.id = 'hdrBackdrop'; back.className = 'hdrBackdrop'; back.hidden = true;
  header.appendChild(back);
  const panels = MENUS.map(m => ({ p: q(m[0]), b: q(m[1]), t: m[2] })).filter(m => m.p);
  const closeAll = except => panels.forEach(m => { if(m.p !== except && !m.p.hidden){ m.p.hidden = true; if(m.b) m.b.setAttribute('aria-expanded', 'false'); } });
  const sync = () => { back.hidden = !panels.some(m => !m.p.hidden); document.body.classList.toggle('hdrMenuOpen', !back.hidden); };
  panels.forEach(m => {
    if(m.p.id !== 'settingsPanel' && !m.p.querySelector('.spHead')){
      const h = document.createElement('div'); h.className = 'spHead';
      h.innerHTML = '<h2 class="spHeadTitle">' + esc(m.t) + '</h2><button type="button" class="spClose hover-scale focus-glow" aria-label="Cerrar">' + ICONS.close + '</button>';
      m.p.insertBefore(h, m.p.firstChild);
      h.querySelector('.spClose').addEventListener('click', () => { m.p.hidden = true; if(m.b){ m.b.setAttribute('aria-expanded', 'false'); m.b.focus({ preventScroll: true }); } });
      const t = m.p.querySelector('.setTitle'); if(t) t.classList.add('spHideTitle');
    }
    new MutationObserver(() => { if(!m.p.hidden) closeAll(m.p); sync(); }).observe(m.p, { attributes: true, attributeFilter: ['hidden'] });
  });
  back.addEventListener('click', e => { e.stopPropagation(); closeAll(null); sync(); });
  const ico = document.querySelector('#starPanel .starRepoIco'); if(ico) ico.innerHTML = ICONS.folder;
  document.querySelectorAll('#starPanel .setBtn').forEach(decorate);
}

function wire(){
  const panel = q('settingsPanel'); if(!panel) return;
  swapHeaderIcons();
  restructure(panel);
  centerMenus();
}
export const __inits = [[9120, wire]];

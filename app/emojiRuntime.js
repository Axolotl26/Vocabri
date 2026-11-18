// Vocabri — sustituye los emojis del DOM por iconos SVG cartoon (ver emojiIcons.js).
// Recorre el texto ya presente y observa los cambios, así también cubre lo que se pinta con innerHTML.
import { splitEmoji } from './emojiIcons.js';

const SKIP = 'SCRIPT,STYLE,TEXTAREA,OPTION,TITLE,NOSCRIPT,.ei';
const SVGNS = 'http://www.w3.org/2000/svg';
let obs = null;

// Reglas mínimas del icono: van con el JS para que, aunque la hoja de estilos esté en caché
// o no se haya actualizado, el icono nunca salga negro ni gigante.
const CORE_CSS = `.ei{display:inline-block;width:1.18em;height:1.18em;vertical-align:-.24em;line-height:0;flex:none}
.ei svg{width:100%;height:100%;display:block;overflow:visible}
.ei .niEd *{fill:var(--e);stroke:var(--e);stroke-width:2.2;stroke-linejoin:round}
.ei .niMn>*{fill:var(--c);stroke:var(--e);stroke-width:2.2;stroke-linejoin:round}
.ei .niEd .niLn,.ei .niMn .niLn{fill:none;stroke-linecap:round}
.ei .niEd .niLn{stroke:var(--e);stroke-width:6.6}.ei .niMn .niLn{stroke:var(--c);stroke-width:3.4}
.ei .niEd .niFl,.ei .niMn .niFl{stroke-width:1.4}`;
function injectCoreCss() {
  if (document.getElementById('eiCore')) return;
  const st = document.createElement('style'); st.id = 'eiCore'; st.textContent = CORE_CSS;
  document.head.prepend(st);
}

function convertText(node) {
  const p = node.parentElement;
  if (!p || p.namespaceURI === SVGNS || p.closest(SKIP)) return;
  const v = node.nodeValue;
  if (!v || v.length > 4000) return;
  const parts = splitEmoji(v);
  if (!parts.some(x => x.e)) return;
  const frag = document.createDocumentFragment();
  for (const x of parts) {
    if (x.e) {
      const sp = document.createElement('span');
      sp.className = 'ei'; sp.setAttribute('aria-hidden', 'true'); sp.dataset.e = x.e; sp.innerHTML = x.svg;
      frag.appendChild(sp);
    } else frag.appendChild(document.createTextNode(x.t));
  }
  node.replaceWith(frag);
}

export function convertTree(root) {
  if (!root) return;
  if (root.nodeType === 3) { convertText(root); return; }
  if (root.nodeType !== 1 || root.closest?.(SKIP)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const list = []; let n;
  while ((n = w.nextNode())) list.push(n);
  list.forEach(convertText);
}

export function startEmojiIcons() {
  injectCoreCss();
  if (obs || typeof document === 'undefined') return;
  convertTree(document.body);
  obs = new MutationObserver(muts => {
    obs.disconnect();
    try {
      for (const m of muts) {
        if (m.type === 'characterData') convertText(m.target);
        else m.addedNodes.forEach(n => convertTree(n));
      }
    } finally { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
}

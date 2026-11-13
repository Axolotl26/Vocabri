// Vocabri — modo «Abecedario»: las 26 letras en inglés con su nombre en texto y con sonido.
// Vista propia (como Escucha y escribe y Rutas). No toca el calendario de repaso ni guarda nada.
import { ALPHABET, isVowel, spellSay, spellWord } from './core/alphabet.js';
import { TTS_SUPPORTED } from './exam.js';
import { _ni, scrollTopNow, switchView } from './ui.js';

export const ABC_ICON = _ni('#A78BFA', '#4C2C9E',
  '<rect x="3" y="3.5" width="22" height="21" rx="6.5"/>',
  '<text x="14" y="19.4" text-anchor="middle" font-size="15.5" font-weight="900" font-family="Nunito,system-ui,sans-serif" fill="#fff" stroke="none">A</text>' +
  '<path d="M7.4 8.4a6 6 0 0 1 3.4-2" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>');

const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = id => document.getElementById(id);
let cur = 0, playing = 0;   // playing: id de la reproducción en cadena (0 = parada)

function voice(text, rate, onend){
  if(!TTS_SUPPORTED){ if(onend) onend(); return; }
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate || 0.85;
    let fired = false;
    const end = () => { if(fired) return; fired = true; if(onend) onend(); };
    u.onend = end; u.onerror = end;
    window.speechSynthesis.speak(u);
    if(onend) setTimeout(end, 3500);   // red de seguridad si el navegador nunca avisa del final
  }catch(e){ if(onend) onend(); }
}

function stopAll(){
  playing = 0;
  try{ if(TTS_SUPPORTED) window.speechSynthesis.cancel(); }catch(e){}
  const b = q('abcAll'); if(b) b.textContent = '▶ Escuchar todo el abecedario';
  document.querySelectorAll('.abcKey.isPlaying').forEach(k => k.classList.remove('isPlaying'));
}

function select(i, sound){
  cur = (i + 26) % 26;
  const a = ALPHABET[cur];
  q('abcBig').innerHTML = '<span>' + a.l + '</span><small>' + a.l.toLowerCase() + '</small>';
  q('abcName').textContent = a.es;
  q('abcSay').textContent = 'En inglés se llama «' + a.say + '»';
  q('abcWord').innerHTML = '<b>' + esc(a.word) + '</b> <i>' + esc(a.wordEs) + '</i><span class="abcSpell">' + spellWord(a.word) + '</span>';
  const tip = q('abcTip'); tip.textContent = a.tip || ''; tip.style.display = a.tip ? '' : 'none';
  q('abcDetail').classList.toggle('isVowel', isVowel(a.l));
  document.querySelectorAll('.abcKey').forEach((k, n) => { k.classList.toggle('isSel', n === cur); k.setAttribute('aria-pressed', n === cur); });
  if(sound) voice(a.say, 0.8);
}

function playAll(){
  if(playing){ stopAll(); return; }
  const id = playing = Date.now();
  q('abcAll').textContent = '⏹ Detener';
  const step = i => {
    if(playing !== id) return;
    if(i >= 26){ stopAll(); return; }
    select(i, false);
    document.querySelectorAll('.abcKey').forEach((k, n) => k.classList.toggle('isPlaying', n === i));
    const k = document.querySelectorAll('.abcKey')[i]; if(k) try{ k.scrollIntoView({ block: 'nearest' }); }catch(e){}
    voice(ALPHABET[i].say, 0.8, () => setTimeout(() => step(i + 1), 250));
  };
  step(0);
}

export function openAlphabet(){
  const v = q('abcView'); if(!v) return;
  const rv = q('reviewView'); if(rv) rv.style.display = 'none';
  stopAll();
  v.style.display = '';
  select(cur, false);
  scrollTopNow('abcView');
}
export function hideAlphabet(){
  stopAll();
  const v = q('abcView'); if(v) v.style.display = 'none';
}
export function closeAlphabet(){
  if(!q('abcView') || q('abcView').style.display === 'none') return;
  hideAlphabet();
  switchView('review');
}

function wire(){
  if(q('abcView')) return;
  const v = document.createElement('div');
  v.id = 'abcView'; v.style.display = 'none';
  v.innerHTML =
    '<div class="dictHead"><button class="miniBtn hover-scale focus-glow" id="abcBackBtn" type="button" aria-label="Volver a Repaso">←</button>' +
    '<h2 class="dictTitle"><span class="tabIcon abcHeadIc" aria-hidden="true">' + ABC_ICON + '</span><span class="rvTitleText">Abecedario</span></h2></div>' +
    '<p class="hint dictSub">Toca una letra para ver cómo se llama y escucharla en inglés.</p>' +
    '<div class="abcDetail" id="abcDetail" aria-live="polite">' +
      '<div class="abcBig" id="abcBig"></div>' +
      '<div class="abcInfo"><div class="abcNameLbl">Suena como</div><div class="abcName" id="abcName"></div><div class="abcSay" id="abcSay"></div></div>' +
      '<div class="abcBtns">' +
        '<button class="abcBtn hover-scale focus-glow" id="abcPlay" type="button" aria-label="Escuchar la letra">🔊 Letra</button>' +
        '<button class="abcBtn hover-scale focus-glow" id="abcSlow" type="button" aria-label="Escuchar la letra despacio">🐢 Lento</button>' +
        '<button class="abcBtn hover-scale focus-glow" id="abcPlayWord" type="button" aria-label="Escuchar la palabra de ejemplo">🔊 Palabra</button>' +
        '<button class="abcBtn hover-scale focus-glow" id="abcSpellBtn" type="button" aria-label="Escuchar la palabra deletreada">🔤 Deletrear</button>' +
      '</div>' +
      '<div class="abcWord" id="abcWord"></div><p class="abcTip" id="abcTip" style="display:none;"></p>' +
      '<div class="abcNav"><button class="abcArrow hover-scale focus-glow" id="abcPrev" type="button" aria-label="Letra anterior">←</button>' +
      '<button class="abcArrow hover-scale focus-glow" id="abcNext" type="button" aria-label="Letra siguiente">→</button></div>' +
    '</div>' +
    '<button class="nav hover-scale focus-glow abcAll" id="abcAll" type="button">▶ Escuchar todo el abecedario</button>' +
    '<div class="abcLegend"><span class="abcDot isV"></span>Vocales <span class="abcDot"></span>Consonantes</div>' +
    '<div class="abcGrid" id="abcGrid" role="group" aria-label="Letras">' +
      ALPHABET.map((a, i) => '<button type="button" class="abcKey' + (isVowel(a.l) ? ' isVowel' : '') + ' hover-scale focus-glow" data-i="' + i + '" aria-pressed="false" aria-label="Letra ' + a.l + '">' +
        '<b>' + a.l + '</b><small>' + a.es + '</small></button>').join('') +
    '</div>' +
    (TTS_SUPPORTED ? '' : '<p class="hint">Tu navegador no tiene síntesis de voz: aquí solo verás las letras en texto.</p>');
  const anchor = q('tableView');
  anchor.parentNode.insertBefore(v, anchor);

  q('abcBackBtn').onclick = closeAlphabet;
  q('abcPlay').onclick = () => { stopAll(); voice(ALPHABET[cur].say, 0.8); };
  q('abcSlow').onclick = () => { stopAll(); voice(ALPHABET[cur].say, 0.5); };
  q('abcPlayWord').onclick = () => { stopAll(); voice(ALPHABET[cur].word, 0.85); };
  q('abcSpellBtn').onclick = () => { stopAll(); voice(spellSay(ALPHABET[cur].word), 0.7); };
  q('abcPrev').onclick = () => { stopAll(); select(cur - 1, true); };
  q('abcNext').onclick = () => { stopAll(); select(cur + 1, true); };
  q('abcAll').onclick = playAll;
  q('abcGrid').addEventListener('click', e => {
    const k = e.target.closest('.abcKey'); if(!k) return;
    stopAll(); select(+k.dataset.i, true);
    q('abcDetail').scrollIntoView({ block: 'nearest' });
  });
  document.addEventListener('keydown', e => {
    if(v.style.display === 'none') return;
    if(e.key === 'Escape') closeAlphabet();
  });
}

export const __inits = [[9085, wire]];

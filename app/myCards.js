// Vocabri — módulo "myCards" (generado a partir de app.js)
import { S } from './core/shared.js';
import { cardDedupKey } from './core/cloudMerge.js';
import { allCats, catLabel } from './core/dataRegistry.js';
import { openMyCardsPractice } from './map.js';
import { addWord } from './state.js';
import { addCategory } from './ui.js';



export function escapeHtml(str){
  if(!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}



export function populateCardModalCats(selectVal){
  const sel = document.getElementById('cardModalCat');
  if(!sel) return;
  sel.innerHTML = '';
  allCats().forEach(c=>{
    const o = document.createElement('option');
    o.value = c;
    o.textContent = catLabel(c);
    sel.appendChild(o);
  });
  if(selectVal){
    if(!Array.from(sel.options).some(o=> o.value === selectVal)){   // etiqueta heredada: se conserva como opción
      const o = document.createElement('option'); o.value = selectVal; o.textContent = catLabel(selectVal); sel.appendChild(o);
    }
    sel.value = selectVal;
  }
}



export function openCardModal(cardId){
  S.editingCardId = cardId || null;
  const overlay = document.getElementById('cardModalOverlay');
  const title = document.getElementById('cardModalTitle');
  const enInput = document.getElementById('cardModalEn');
  const esInput = document.getElementById('cardModalEs');
  const catSel = document.getElementById('cardModalCat');
  const exInput = document.getElementById('cardModalEx');
  const exEsInput = document.getElementById('cardModalExEs');
  const status = document.getElementById('cardModalStatus');
  const newCatBox = document.getElementById('cardModalNewCatBox');
  if(newCatBox) newCatBox.style.display = 'none';
  if(status) status.textContent = '';

  populateCardModalCats();

  if(S.editingCardId){
    const card = S.customWords.find(w=> String(w.id) === String(S.editingCardId));
    if(card){
      title.textContent = 'Editar Tarjeta';
      enInput.value = card.en || '';
      esInput.value = card.es || '';
      if(catSel && card.cat){
        if(!Array.from(catSel.options).some(o=> o.value === card.cat)){ const o = document.createElement('option'); o.value = card.cat; o.textContent = catLabel(card.cat); catSel.appendChild(o); }
        catSel.value = card.cat;
      }
      exInput.value = card.ex || '';
      exEsInput.value = card.exEs || '';
    }
  } else {
    title.textContent = 'Crear Tarjeta';
    enInput.value = '';
    esInput.value = '';
    if(catSel) catSel.value = allCats()[0] || 'general';
    exInput.value = '';
    exEsInput.value = '';
  }
  overlay.style.display = 'flex';
  setTimeout(()=>{ enInput.focus(); }, 80);
}



export function closeCardModal(){
  const overlay = document.getElementById('cardModalOverlay');
  if(overlay) overlay.style.display = 'none';
  S.editingCardId = null;
}



export async function saveCardFromModal(){
  const en = document.getElementById('cardModalEn').value.trim();
  const es = document.getElementById('cardModalEs').value.trim();
  const cat = document.getElementById('cardModalCat').value;
  const ex = document.getElementById('cardModalEx').value.trim();
  const exEs = document.getElementById('cardModalExEs').value.trim();
  const statusEl = document.getElementById('cardModalStatus');

  if(!en || !es){
    if(statusEl) statusEl.textContent = '⚠️ Escribe la frase en inglés y su traducción.';
    return;
  }

  if(S.editingCardId){
    const idx = S.customWords.findIndex(w=> String(w.id) === String(S.editingCardId));
    if(idx >= 0){
      S.customWords[idx] = {
        id: S.editingCardId,
        en: en,
        es: es,
        cat: cat,
        ex: ex || undefined,
        exEs: exEs || undefined
      };
      try{ localStorage.setItem('ci_custom_words', JSON.stringify(S.customWords)); }catch(e){}
      if(statusEl) statusEl.textContent = '✅ Tarjeta actualizada con éxito.';
      setTimeout(()=>{
        closeCardModal();
        renderMyCardsHome();
      }, 350);
    }
  } else {
    const ok = await addWord(en, es, cat, ex, exEs);
    if(ok){
      if(statusEl) statusEl.textContent = '✅ Tarjeta creada con éxito.';
      setTimeout(()=>{
        closeCardModal();
        renderMyCardsHome();
      }, 350);
    } else {
      if(statusEl) statusEl.textContent = '❌ No se pudo crear la tarjeta.';
    }
  }
}



export function deleteCustomCard(id){
  const card = S.customWords.find(w=> String(w.id) === String(id));
  const name = card ? ('"' + card.en + '"') : 'esta tarjeta';
  if(confirm('¿Eliminar ' + name + ' de Mis Tarjetas?')){
    S.customWords = S.customWords.filter(w=> String(w.id) !== String(id));
    try{
      localStorage.setItem('ci_custom_words', JSON.stringify(S.customWords));
      localStorage.removeItem('ci_master_custom|' + id);
    }catch(e){}
    renderMyCardsHome();
  }
}



export function renderMyCardsHome(){
  const n = S.customWords.length;
  const countEl = document.getElementById('myCardsCount');
  if(countEl){
    countEl.textContent = n
      ? (n + ' tarjeta' + (n===1?'':'s') + ' propia' + (n===1?'':'s') + ' en tu colección.')
      : 'Aún no tienes tarjetas propias. ¡Crea la primera!';
  }
  const practiceBtn = document.getElementById('myCardsPracticeBtn');
  if(practiceBtn){
    practiceBtn.disabled = (n === 0);
    practiceBtn.style.opacity = (n === 0) ? .5 : 1;
  }
  const exportCardsBtn = document.getElementById('myCardsExportBtn');
  if(exportCardsBtn) exportCardsBtn.disabled = (n === 0);

  const listEl = document.getElementById('myCardsList');
  if(!listEl) return;
  listEl.innerHTML = '';

  if(n === 0){
    const empty = document.createElement('div');
    empty.className = 'myCardsEmpty';
    empty.innerHTML = '<div style="font-size:2.2rem; margin-bottom:8px;">🎴</div>' +
      '<p style="margin:0 0 6px; font-weight:700; color:var(--ink);">Colección vacía</p>' +
      '<p style="margin:0; font-size:.85rem;">Toca en <strong>"➕ Crear tarjeta"</strong> para agregar tus propias frases personalizadas.</p>';
    listEl.appendChild(empty);
    return;
  }

  S.customWords.forEach((w, idx)=>{
    const item = document.createElement('div');
    item.className = 'myCardItem';
    // Stagger index for entrance animation
    item.style.setProperty('--i', idx + 1);

    const content = document.createElement('div');
    content.className = 'myCardContent';

    let exHtml = '';
    if(w.ex){
      exHtml = '<div class="myCardEx">💬 ' + escapeHtml(w.ex) + (w.exEs ? ' · ' + escapeHtml(w.exEs) : '') + '</div>';
    }

    content.innerHTML =
      '<div class="myCardEn">' + escapeHtml(w.en) + '</div>' +
      '<div class="myCardEs">' + escapeHtml(w.es) + '</div>' +
      '<div class="myCardMeta">' +
        '<span class="myCardCat">' + escapeHtml(w.cat ? catLabel(w.cat) : 'Personalizada') + '</span>' +
        exHtml +
      '</div>';

    const actions = document.createElement('div');
    actions.className = 'myCardActions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'myCardBtn';
    editBtn.textContent = '✏️ Editar';
    editBtn.onclick = ()=> openCardModal(w.id);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'myCardBtn myCardDeleteBtn';
    delBtn.textContent = '🗑️';
    delBtn.title = 'Eliminar tarjeta';
    delBtn.onclick = ()=> deleteCustomCard(w.id);

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(content);
    item.appendChild(actions);
    listEl.appendChild(item);
  });
}



export const cardModalCloseBtn = document.getElementById('cardModalClose');



export const cardModalSaveBtn = document.getElementById('cardModalSaveBtn');



export const cardModalNewCatBtn = document.getElementById('cardModalNewCatBtn');



export const cardModalNewCatSaveBtn = document.getElementById('cardModalNewCatSaveBtn');


// --- Mis Tarjetas: export / import ONLY the user's own cards (.json) ---
// File shape: { app:'vocabri', type:'custom-cards', version:1, exportedAt, count, cards:[{en, es, cat, ex?, exEs?}] }
export const MYCARDS_FILE_TYPE = 'custom-cards';


export const MYCARDS_MAX_IMPORT_BYTES = 1024 * 1024;

   // 1 MB per file
export const MYCARDS_MAX_IMPORT_CARDS = 1000;

          // cards per file
export const MYCARD_MAX_LEN = 300;

                     // en / es / ex / exEs
export const MYCARD_MAX_CAT_LEN = 40;



export function setMyCardsIOStatus(msg){
  const el = document.getElementById('myCardsIOStatus');
  if(el) el.textContent = msg || '';
}


export function cleanCardText(v){
  if(typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
}


export { cardDedupKey };


// Returns a clean {en, es, cat, ex, exEs} or null when the entry isn't a usable card.
export function validateImportedCard(raw){
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if((raw.ex != null && typeof raw.ex !== 'string') || (raw.exEs != null && typeof raw.exEs !== 'string')) return null;
  if(raw.cat != null && typeof raw.cat !== 'string') return null;
  const en = cleanCardText(raw.en), es = cleanCardText(raw.es);
  if(!en || !es || en.length > MYCARD_MAX_LEN || es.length > MYCARD_MAX_LEN) return null;
  const ex = cleanCardText(raw.ex), exEs = cleanCardText(raw.exEs), cat = cleanCardText(raw.cat);
  if(ex.length > MYCARD_MAX_LEN || exEs.length > MYCARD_MAX_LEN || cat.length > MYCARD_MAX_CAT_LEN) return null;
  return {en, es, cat, ex, exEs};
}


// Existing category (case-insensitive) or a new custom label; empty → the first category.
export function resolveImportCategory(name){
  if(!name) return allCats()[0] || 'general';
  const found = allCats().find(c=> c.toLowerCase() === name.toLowerCase());
  if(found) return found;
  S.customCats.push(name);
  try{ localStorage.setItem('ci_custom_cats', JSON.stringify(S.customCats)); }catch(e){}
  return name;
}


export function exportMyCards(){
  if(!S.customWords.length){
    setMyCardsIOStatus('Aún no tienes tarjetas propias para exportar.');
    return;
  }
  try{
    const cards = S.customWords.map(w=>{
      const c = {en: w.en, es: w.es, cat: w.cat || ''};
      if(w.ex) c.ex = w.ex;
      if(w.exEs) c.exEs = w.exEs;
      return c;
    });
    const payload = {app:'vocabri', type:MYCARDS_FILE_TYPE, version:1, exportedAt:new Date().toISOString(), count:cards.length, cards};
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabri-mis-tarjetas-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
    setMyCardsIOStatus('✅ Se exportaron ' + cards.length + ' tarjeta' + (cards.length === 1 ? '' : 's') + '.');
  }catch(e){
    setMyCardsIOStatus('❌ No se pudieron exportar las tarjetas.');
  }
}


export async function importMyCardsFile(file){
  const input = document.getElementById('myCardsImportFile');
  try{
    if(file.size > MYCARDS_MAX_IMPORT_BYTES){
      setMyCardsIOStatus('❌ El archivo es demasiado grande (máx. 1 MB).');
      return;
    }
    let payload;
    try{ payload = JSON.parse(await file.text()); }
    catch(e){ setMyCardsIOStatus('❌ El archivo no es un JSON válido.'); return; }

    const list = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.cards) ? payload.cards : null);
    if(!list){
      setMyCardsIOStatus(payload && payload.app === 'vocabri' && payload.data
        ? 'ℹ️ Ese archivo es un respaldo completo de la app. Impórtalo desde Ajustes → Datos y cuenta.'
        : '❌ El archivo no contiene una lista de tarjetas.');
      return;
    }
    if(list.length > MYCARDS_MAX_IMPORT_CARDS){
      setMyCardsIOStatus('❌ Demasiadas tarjetas en un archivo (máx. ' + MYCARDS_MAX_IMPORT_CARDS + ').');
      return;
    }

    const seen = new Set(S.customWords.map(w=> cardDedupKey(w.en, w.es)));
    const stamp = Date.now();
    const fresh = [];
    let duplicates = 0, invalid = 0;
    list.forEach(raw=>{
      const c = validateImportedCard(raw);
      if(!c){ invalid++; return; }
      const key = cardDedupKey(c.en, c.es);
      if(seen.has(key)){ duplicates++; return; }
      seen.add(key);
      const item = {id: 'local_' + stamp + '_' + (fresh.length + 1), en: c.en, es: c.es, cat: resolveImportCategory(c.cat)};
      if(c.ex) item.ex = c.ex;
      if(c.exEs) item.exEs = c.exEs;
      fresh.push(item);
    });

    if(fresh.length){
      const merged = S.customWords.concat(fresh);
      try{ localStorage.setItem('ci_custom_words', JSON.stringify(merged)); }
      catch(e){ setMyCardsIOStatus('❌ No se pudieron guardar las tarjetas (almacenamiento lleno).'); return; }
      S.customWords = merged;
      populateCardModalCats();
      renderMyCardsHome();
    }

    const notes = [];
    if(duplicates) notes.push(duplicates + ' repetida' + (duplicates === 1 ? '' : 's'));
    if(invalid) notes.push(invalid + ' inválida' + (invalid === 1 ? '' : 's'));
    const tail = notes.length ? ' Omitidas: ' + notes.join(', ') + '.' : '';
    if(fresh.length){
      setMyCardsIOStatus('✅ Se importaron ' + fresh.length + ' tarjeta' + (fresh.length === 1 ? '' : 's') + '.' + tail);
    } else if(invalid && !duplicates){
      setMyCardsIOStatus('❌ No se encontraron tarjetas válidas (cada una necesita «en» y «es»).');
    } else {
      setMyCardsIOStatus('⚠️ No se agregó ninguna tarjeta nueva.' + tail);
    }
  }catch(e){
    setMyCardsIOStatus('❌ No se pudo leer el archivo.');
  }finally{
    if(input) input.value = '';
  }
}



// Card modal keyboard support: Enter saves (or saves the new category), Escape closes.
export const cardModalFormEl = document.getElementById('cardModalForm');

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [2975, function(){
S.editingCardId = null;
  }],
  [3187, function(){
document.getElementById('myCardsAddToggle').onclick = ()=> openCardModal();
  }],
  [3188, function(){
document.getElementById('myCardsPracticeBtn').onclick = ()=>{
  if(S.customWords.length) openMyCardsPractice();
};
  }],
  [3193, function(){
if(cardModalCloseBtn) cardModalCloseBtn.onclick = closeCardModal;
  }],
  [3196, function(){
if(cardModalSaveBtn) cardModalSaveBtn.onclick = saveCardFromModal;
  }],
  [3199, function(){
if(cardModalNewCatBtn){
  cardModalNewCatBtn.onclick = ()=>{
    const box = document.getElementById('cardModalNewCatBox');
    box.style.display = (box.style.display === 'none') ? 'block' : 'none';
    if(box.style.display !== 'none') document.getElementById('cardModalNewCatInput').focus();
  };
}
  }],
  [3208, function(){
if(cardModalNewCatSaveBtn){
  cardModalNewCatSaveBtn.onclick = ()=>{
    const input = document.getElementById('cardModalNewCatInput');
    const name = input.value.trim();
    if(addCategory(name)){
      populateCardModalCats(name);
      input.value = '';
      document.getElementById('cardModalNewCatBox').style.display = 'none';
    } else {
      input.placeholder = 'Escribe un nombre válido y no repetido';
    }
  };
}
  }],
  [3350, function(){
document.getElementById('myCardsExportBtn').onclick = exportMyCards;
  }],
  [3351, function(){
document.getElementById('myCardsImportBtn').onclick = ()=> document.getElementById('myCardsImportFile').click();
  }],
  [3352, function(){
document.getElementById('myCardsImportFile').onchange = (e)=>{
  const f = e.target.files && e.target.files[0];
  if(f) importMyCardsFile(f);
};
  }],
  [3359, function(){
if(cardModalFormEl){
  cardModalFormEl.addEventListener('keydown', (e)=>{
    if(e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    if(e.target.id === 'cardModalNewCatInput') document.getElementById('cardModalNewCatSaveBtn').click();
    else saveCardFromModal();
  });
}
  }],
  [3367, function(){
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  const ov = document.getElementById('cardModalOverlay');
  if(ov && ov.style.display === 'flex') closeCardModal();
});
  }]
];

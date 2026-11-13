// Vocabri — exportar tus frases a Anki (.txt) o CSV. Los botones se crean aquí (Perfil → Respaldo), sin tocar index.html.
import { catLabel, itemsFor, readStored } from './core/dataRegistry.js';
import { buildRows, toAnkiTsv, toCsv } from './core/exportCards.js';
import { downloadBlob } from './profile.js';

function today(){ return new Date().toISOString().slice(0, 10); }

export function exportRows(all){
  const entries = itemsFor('Todas').map(it => ({ it, rec: readStored(it[3]) }));
  return buildRows(entries, { all, catLabel });
}

function run(kind){
  const status = document.getElementById('exportCardsStatus');
  const all = !!(document.getElementById('exportCardsAll') || {}).checked;
  const rows = exportRows(all);
  if(!rows.length){
    status.textContent = 'Aún no tienes frases estudiadas. Aprende algunas en el mapa o marca «incluir también las que aún no estudio».';
    return;
  }
  try{
    if(kind === 'anki') downloadBlob(new Blob([toAnkiTsv(rows)], { type: 'text/plain;charset=utf-8' }), 'vocabri-anki-' + today() + '.txt');
    else downloadBlob(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }), 'vocabri-frases-' + today() + '.csv');
    status.textContent = '✅ ' + rows.length + (rows.length === 1 ? ' frase exportada.' : ' frases exportadas.') +
      (kind === 'anki' ? ' En Anki: Archivo → Importar y elige el tipo de nota «Básico».' : '');
  }catch(e){ status.textContent = '❌ No se pudo exportar.'; }
}

function wire(){
  if(document.getElementById('exportAnkiBtn')) return;
  const anchor = document.getElementById('backupStatus');
  if(!anchor) return;
  const box = document.createElement('div');
  box.innerHTML =
    '<div class="setTitle" style="margin:22px 0 8px;">Exportar tus frases</div>' +
    '<div class="backupRow">' +
      '<button class="nav hover-scale focus-glow" id="exportAnkiBtn" type="button">🃏 Exportar a Anki (.txt)</button>' +
      '<button class="nav hover-scale focus-glow" id="exportCsvBtn" type="button">📊 Exportar a CSV</button>' +
    '</div>' +
    '<label class="hint" style="display:flex; gap:8px; align-items:center; text-align:left; margin-top:8px;"><input type="checkbox" id="exportCardsAll"> Incluir también las que aún no estudio</label>' +
    '<p class="hint" id="exportCardsStatus" style="text-align:left;"></p>';
  anchor.insertAdjacentElement('afterend', box);
  document.getElementById('exportAnkiBtn').onclick = () => run('anki');
  document.getElementById('exportCsvBtn').onclick = () => run('csv');
}

export const __inits = [[9060, wire]];

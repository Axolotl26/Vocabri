// Vocabri — módulo "state" (generado a partir de app.js)
import { S } from './core/shared.js';
import { DATA, itemsFor, readStored, todayKeyStr, writeCard } from './core/dataRegistry.js';
import { dayKey } from './progress.js';
import { scheduleReminderStatePublish } from './settings.js';
import { mergeCardRecord, mergeExamResult } from './sync.js';
import { updateGameBar } from './ui.js';


export const GOAL_PRESETS = {relajado:30, normal:50, serio:100, intenso:150};



// ==================== REPASAR HOY (SRS) ====================
import { DAY_MS, REVIEW_AGAIN_MS, REVIEW_SESSION_CAP, REVIEW_XP, LEECH_LAPSES, srsInterval, srsLateDays, srsNextInterval, srsGapText, srsDueAt, srsStartOfDay, srsWouldApply, srsPlanGrade } from './core/srs.js';
export { DAY_MS, REVIEW_AGAIN_MS, REVIEW_SESSION_CAP, REVIEW_XP, LEECH_LAPSES, srsInterval, srsLateDays, srsNextInterval, srsGapText, srsDueAt, srsStartOfDay, srsWouldApply, srsPlanGrade };


export function srsGrade(key, grade, opts){
  opts = opts || {};
  if(!key) return {applied:false};
  const cur = readStored(key);
  const plan = srsPlanGrade(cur, grade, Date.now(), opts);
  writeCard(key, plan.record);   // si no se aplica, cuenta como actividad (racha) y deja el calendario intacto
  return plan.applied ? {applied:true, leech:plan.leech, lapses:plan.lapses} : {applied:false, leech:plan.leech};
}



// Registro diario de repasos {día:[total, acertados]} para la retención (últimos 30 días)
export function srsLog(ok, delta){
  delta = delta || 1;
  try{
    const log = JSON.parse(localStorage.getItem('ci_review_log') || '{}');
    const k = dayKey(new Date());
    const e = log[k] || [0,0];
    e[0] = Math.max(0, e[0] + delta); if(ok) e[1] = Math.max(0, e[1] + delta);
    log[k] = e;
    const keys = Object.keys(log);
    if(keys.length > 30){ keys.slice(0, keys.length - 30).forEach(x => delete log[x]); }
    localStorage.setItem('ci_review_log', JSON.stringify(log));
  }catch(e){}
}


export function srsRetention7(){
  try{
    const log = JSON.parse(localStorage.getItem('ci_review_log') || '{}');
    let n = 0, ok = 0;
    for(let i = 0; i < 7; i++){ const d = new Date(); d.setDate(d.getDate() - i); const e = log[dayKey(d)]; if(e){ n += e[0]; ok += e[1]; } }
    return n >= 5 ? Math.round(ok / n * 100) : null;
  }catch(e){ return null; }
}



// Escaneo de tarjetas programadas, con caché breve (se invalida al calificar) para no recorrer 1000+ tarjetas en cada llamada.



export function srsInvalidate(){ S._srsScan = null; }


export function srsScanAll(){
  const t = Date.now();
  if(S._srsScan && t - S._srsScanAt < 3000) return S._srsScan;
  const out = [];
  itemsFor("Todas").forEach(it=>{
    const s = readStored(it[3]);
    if(s.next) out.push({it, next:s.next, s});
  });
  S._srsScan = out; S._srsScanAt = t;
  return out;
}



// Tarjetas vencidas ahora (única fuente de verdad: lista, contador del menú y sesión usan esto).
export function getDueCards(){
  const now = Date.now();
  return srsScanAll().filter(d => d.next <= now).sort((a,b)=> a.next - b.next).map(d => d.it);
}


export function getDueTodayCount(){ return getDueCards().length; }


// Próxima tarjeta que vencerá (ms) o null
export function getNextDueTime(){
  const now = Date.now();
  let best = null;
  srsScanAll().forEach(d=>{ if(d.next > now && (best === null || d.next < best)) best = d.next; });
  return best;
}


// Tarjetas que vencen cada uno de los próximos 7 días (el día 0 incluye las atrasadas)
export function srsForecast(){
  const out = [0,0,0,0,0,0,0];
  const today = srsStartOfDay(Date.now());
  srsScanAll().forEach(d=>{
    const k = Math.round((srsStartOfDay(d.next) - today) / DAY_MS);
    if(k <= 0) out[0]++; else if(k < 7) out[k]++;
  });
  return out;
}


export function fmtWhen(ts){
  const diff = ts - Date.now();
  if(diff < 3600*1000) return 'en ' + Math.max(1, Math.round(diff/60000)) + ' min';
  const d = Math.round((srsStartOfDay(ts) - srsStartOfDay(Date.now())) / DAY_MS);
  if(d <= 0) return 'en ' + Math.max(1, Math.round(diff/3600000)) + ' h';
  return d === 1 ? 'mañana' : 'en ' + d + ' días';
}


export function getXpTotal(){ try{ return parseInt(localStorage.getItem('ci_xp_total')||'0',10); }catch(e){ return 0; } }


export function setXpTotal(v){ try{ localStorage.setItem('ci_xp_total', String(v)); }catch(e){} }


// Progressive XP curve: the XP needed to clear level n (go from n to n+1)
// grows with n, so reaching high levels takes real, sustained practice.
// n=1:100, n=2:~246, n=3:~417, n=4:~606  (cumulative to reach level 5 ≈ 1369)
export function xpForLevel(n){ return Math.round(100 * Math.pow(n, 1.3)); }


export function levelFromXp(xp){
  let lvl = 1, remaining = xp;
  while(remaining >= xpForLevel(lvl)){ remaining -= xpForLevel(lvl); lvl++; }
  return lvl;
}


export function xpIntoLevel(xp){
  let lvl = 1, remaining = xp;
  while(remaining >= xpForLevel(lvl)){ remaining -= xpForLevel(lvl); lvl++; }
  return remaining;
}



export function getDailyGoalTarget(){
  try{ const v = parseInt(localStorage.getItem('ci_daily_goal_xp')||'0',10); return v>0 ? v : 200; }
  catch(e){ return 200; }
}


export function setDailyGoalTarget(v){
  try{ localStorage.setItem('ci_daily_goal_xp', String(v)); }catch(e){}
  updateGameBar();
  scheduleReminderStatePublish();
}


// Resets vocabri_xp_today to 0 whenever the stored last-study date isn't today.
export function checkDailyReset(){
  const today = todayKeyStr();
  let last = null;
  try{ last = localStorage.getItem('vocabri_last_study_date'); }catch(e){}
  if(last !== today){
    try{
      localStorage.setItem('vocabri_xp_today', '0');
      localStorage.setItem('vocabri_last_study_date', today);
    }catch(e){}
  }
}


export function getXpToday(){
  checkDailyReset();
  try{ return parseInt(localStorage.getItem('vocabri_xp_today')||'0',10); }catch(e){ return 0; }
}


export function addXpToday(amount){
  checkDailyReset();
  try{
    localStorage.setItem('vocabri_xp_today', String(getXpToday()+amount));
    localStorage.setItem('vocabri_last_study_date', todayKeyStr());
  }catch(e){}
}


export function goalAlreadyCelebratedToday(){
  try{ return localStorage.getItem('vocabri_goal_celebrated_date') === todayKeyStr(); }catch(e){ return false; }
}


export function markGoalCelebrated(){
  try{ localStorage.setItem('vocabri_goal_celebrated_date', todayKeyStr()); }catch(e){}
}


export function loadCustomWords(){
  try{
    const raw = localStorage.getItem('ci_custom_words');
    S.customWords = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(S.customWords)) S.customWords = [];
  }catch(e){ S.customWords = []; }
}



// --- Migración de progreso (idempotente, no destructiva) ---
// 1) 'Casual|i' → 'general|i'   2) 'travel|<posición>' → 'travel|<id>' (ids estables del JSON)
// 3) exámenes y etapa desbloqueada de Casual → general   4) tarjetas propias con etiqueta 'Casual' → 'general'
export function migrateProgressKeys(){
  try{
    const ls = localStorage, moves = [];
    for(let i = 0; i < ls.length; i++){
      const k = ls.key(i); if(!k) continue;
      let m = /^ci_master_(Casual|travel|academic|business|pop)\|(\d+)$/.exec(k);
      if(m){
        let cat = m[1], idx = +m[2];
        if(cat === 'Casual'){ moves.push([k, 'ci_master_general|' + idx, 'card']); continue; }
        const row = DATA[cat] && DATA[cat][idx];
        if(row && row[4]) moves.push([k, 'ci_master_' + cat + '|' + row[4], 'card']);
        continue;
      }
      m = /^vocabri_exam_Casual_(\d+)$/.exec(k);
      if(m) moves.push([k, 'vocabri_exam_general_' + m[1], 'exam']);
    }
    moves.forEach(([from, to, type])=>{
      const a = ls.getItem(from), b = ls.getItem(to);
      if(b === null) ls.setItem(to, a);
      else ls.setItem(to, type === 'card' ? mergeCardRecord(b, a) : mergeExamResult(b, a));
      ls.removeItem(from);
    });
    // Etapa desbloqueada (la más avanzada de las dos)
    if(S.unlockedStage && S.unlockedStage.Casual != null){
      S.unlockedStage.general = Math.max(Number(S.unlockedStage.general) || 0, Number(S.unlockedStage.Casual) || 0);
      delete S.unlockedStage.Casual;
      ls.setItem('vocabri_unlocked_stage', JSON.stringify(S.unlockedStage));
    }
    // Tarjetas propias
    let ch = false;
    S.customWords.forEach(w=>{ if(w && w.cat === 'Casual'){ w.cat = 'general'; ch = true; } });
    if(ch) ls.setItem('ci_custom_words', JSON.stringify(S.customWords));
    if(moves.length || ch) srsInvalidate();
  }catch(e){ console.warn('[migrate]', e); }
}


export function addWord(en, es, cat, ex, exEs){
  en = en.trim(); es = es.trim(); ex = (ex||'').trim(); exEs = (exEs||'').trim();
  if(!en || !es || !cat) return Promise.resolve(false);
  const item = {id: 'local_'+Date.now(), en, es, cat};
  if(ex) item.ex = ex;
  if(exEs) item.exEs = exEs;
  S.customWords.push(item);
  try{ localStorage.setItem('ci_custom_words', JSON.stringify(S.customWords)); }catch(e){}
  return Promise.resolve(true);
}

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [2039, function(){
S._srsScan = null;
  }],
  [2039, function(){
S._srsScanAt = 0;
  }],
  [2350, function(){
loadCustomWords();
  }],
  [2390, function(){
(function(){
  const run = ()=> migrateProgressKeys();
  if(window.VocabriPhraseData && window.VocabriPhraseData.loaded) run();
  window.addEventListener('vocabri:phrasesLoaded', run);
})();
  }]
];

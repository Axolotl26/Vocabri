// Vocabri — Abecedario japonés (hiragana y katakana): tabla de consulta + ruta de práctica (mini mapa con lecciones, examen y coronas) + velo de nubes sobre el mapa.
// Los datos salen de data/ja/jp_kana.json. El progreso (letras vistas, estrellas por nodo, niveles superados) se guarda en este dispositivo.
import { speak, hasJaVoice, noVoicesAtAll, NO_VOICES_MSG } from './speech.js';
import { _ni, scrollTopNow, switchView, showToast } from './ui.js';
import { openTrace } from './trace.js';
import { getCategoryLang } from '../categoriesRegistry.js';
import { romajiMatches } from './core/course.js';
import { layoutFuji, fujiSvg, W as FW } from './fuji.js';
import { S } from './core/shared.js';

const KEY = 'ci_kana';
const GROUPS = [
  { id: 'h1', script: 'Hiragana', name: 'Básicos', zone: 0 }, { id: 'h2', script: 'Hiragana', name: 'Con marcas', zone: 1 }, { id: 'h3', script: 'Hiragana', name: 'Combinados', zone: 2 },
  { id: 'k1', script: 'Katakana', name: 'Básicos', zone: 3 }, { id: 'k2', script: 'Katakana', name: 'Con marcas', zone: 4 }, { id: 'k3', script: 'Katakana', name: 'Combinados', zone: 5 }
];
const LESSON = 5, EXAM_LEN = 20, EXAM_PASS = 0.8, LESSON_PASS = 0.7;
const XS = [50, 70, 78, 62, 38, 22, 28, 46], ROW = 116;
export const KANA_ICON = _ni('#F472B6', '#9D2461', '<rect x="3" y="3.5" width="22" height="21" rx="6.5"/>',
  '<text x="14" y="19.2" text-anchor="middle" font-size="15" font-weight="900" font-family="\'Noto Sans JP\',system-ui,sans-serif" fill="#fff" stroke="none">あ</text>');
const SPK = '<svg class="knSpk" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = id => document.getElementById(id);
const first = r => String(r).split('/')[0].trim();
const shuffle = a => { const r = a.slice(); for(let i = r.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

let DATA = null, PLANS = null, GID = {}, loading = null;
let script = 'Hiragana', group = 'h1', cur = null, tab = 'ruta', run = null;

// ── progreso ──
function load(){ try{ const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return { seen: o.seen || {}, done: o.done || {}, stars: o.stars || {}, skip: !!o.skip }; }catch(e){ return { seen: {}, done: {}, stars: {}, skip: false }; } }
function save(p){ try{ localStorage.setItem(KEY, JSON.stringify(p)); }catch(e){} }
export function kanaState(){ return load(); }
/** ¿Qué grupo hay que superar antes de abrir este curso? null = ya está abierto (o no es de japonés). */
export function kanaNeeded(cat){
  if(getCategoryLang(cat) !== 'ja') return null;
  const p = load(); if(p.skip) return null;
  if(!p.done.h1) return 'h1';
  if(cat === 'jp_n4' && !p.done.k1) return 'k1';
  return null;
}

const chars = id => (DATA[id] || []).filter(i => i.kind === 'char');
const words = id => (DATA[id] || []).filter(i => i.kind === 'word');
const find = id => { const g = GID[id]; return g ? (DATA[g] || []).find(i => i.id === id) || null : null; };

/** Plan de cada nivel: lecciones de ~5 letras, una de palabras (si hay) y el examen. */
function planOf(g){
  const list = chars(g.id), n = Math.max(1, Math.ceil(list.length / LESSON)), size = Math.ceil(list.length / n), nodes = [];
  for(let i = 0; i < n; i++){ const items = list.slice(i * size, (i + 1) * size); if(items.length) nodes.push({ key: g.id + ':' + i, type: 'lesson', n: i + 1, items }); }
  if(words(g.id).length) nodes.push({ key: g.id + ':w', type: 'words', items: words(g.id) });
  nodes.push({ key: g.id + ':x', type: 'exam', items: list });
  return nodes;
}

function ensureData(){
  if(DATA) return Promise.resolve(true);
  if(loading) return loading;
  loading = fetch('./data/ja/jp_kana.json').then(r => r.json()).then(raw => {
    DATA = {}; GID = {};
    GROUPS.forEach(g => { DATA[g.id] = raw.zones[g.zone].items; DATA[g.id].forEach(i => { GID[i.id] = g.id; }); });
    PLANS = GROUPS.map(g => ({ g, nodes: planOf(g) }));
    return true;
  }).catch(() => false).finally(() => { loading = null; });
  return loading;
}

// ── voz ──
const romOf = it => first(it.romaji);
const romOfEx = it => { const m = /\(([^)]+)\)\s*$/.exec(it.exEs || ''); return m ? m[1] : romOf(it); };
function say(text, rate, rom){ speak(text, 'ja-JP', rate || 0.8, { rom: rom || (cur ? romOf(cur) : '') }); }
function voiceNote(){
  const n = q('knVoiceNote'); if(!n) return;
  if(noVoicesAtAll()){ n.textContent = NO_VOICES_MSG + ' Mientras tanto la práctica usa solo preguntas de leer y elegir.'; n.style.display = ''; return; }
  n.textContent = '🔇 Tu navegador no tiene voz japonesa: se usa una aproximación con voz en español. Para el sonido real, instala una voz japonesa en el sistema (en Windows: Configuración → Hora e idioma → Voz) o usa Edge/Chrome en línea.';
  n.style.display = hasJaVoice() ? 'none' : '';
}

// ── tabla de consulta ──
function paintGrid(){
  const p = load();
  q('knTabs').innerHTML = ['Hiragana', 'Katakana'].map(s => '<button type="button" class="knTab hover-scale focus-glow' + (s === script ? ' isSel' : '') + '" data-s="' + s + '" role="tab" aria-selected="' + (s === script) + '">' + s + '</button>').join('');
  q('knGroups').innerHTML = GROUPS.filter(x => x.script === script).map(x => {
    const n = chars(x.id).length, seen = chars(x.id).filter(i => p.seen[i.id]).length;
    return '<button type="button" class="knGroup hover-scale focus-glow' + (x.id === group ? ' isSel' : '') + (p.done[x.id] ? ' isDone' : '') + '" data-g="' + x.id + '"><b>' + esc(x.name) + '</b><small>' + (p.done[x.id] ? '✓ superado' : seen + '/' + n) + '</small></button>';
  }).join('');
  q('knGrid').innerHTML = chars(group).map(i => '<button type="button" class="abcKey knKey hover-scale focus-glow' + (p.seen[i.id] ? ' isSeen' : '') + (cur && cur.id === i.id ? ' isSel' : '') + '" data-id="' + i.id + '" lang="ja" aria-label="' + esc(i.ja) + ', ' + esc(first(i.romaji)) + '"><b>' + esc(i.ja) + '</b><small>' + esc(first(i.romaji)) + '</small></button>').join('');
  const ws = words(group);
  q('knWords').innerHTML = ws.length ? '<div class="knWordsHead">Palabras para practicar</div>' + ws.map(w => '<button type="button" class="knWord hover-scale focus-glow" data-id="' + w.id + '" lang="ja"><b>' + esc(w.ja) + '</b><small>' + esc(first(w.romaji)) + ' · ' + esc(w.es) + '</small></button>').join('') : '';
  q('knPractice').textContent = '🗺 Ir a la ruta de práctica';
}

function select(id, sound){
  const it = find(id); if(!it) return;
  cur = it;
  const p = load(); p.seen[it.id] = 1; save(p);
  q('knBig').textContent = it.ja; q('knBig').lang = 'ja';
  q('knName').textContent = first(it.romaji);
  q('knSay').textContent = it.es;
  q('knExample').innerHTML = it.ex ? '<b lang="ja">' + esc(it.ex) + '</b> <i>' + esc(it.exEs) + '</i>' : (it.kind === 'word' ? '<i>' + esc(it.es) + '</i>' : '');
  q('knExample').style.display = (it.ex || it.kind === 'word') ? '' : 'none';
  const tip = q('knTip'); tip.textContent = it.note || ''; tip.style.display = it.note ? '' : 'none';
  q('knTrace').style.display = '';
  paintGrid();
  voiceNote();
  if(sound) say(it.ja);
}

// ── paneles: ruta · tabla · lección ──
function showPane(name){
  const run_ = name === 'run';
  q('knModeTabs').style.display = run_ ? 'none' : '';
  q('knRoute').style.display = (!run_ && tab === 'ruta') ? '' : 'none';
  q('knMain').style.display = (!run_ && tab === 'tabla') ? '' : 'none';
  q('knQuiz').style.display = run_ ? '' : 'none';
  q('knModeTabs').querySelectorAll('.knTab').forEach(b => { const on = b.dataset.t === tab; b.classList.toggle('isSel', on); b.setAttribute('aria-selected', String(on)); });
}
function setTab(t){
  tab = t; run = null; showPane(t);
  if(t === 'ruta'){ paintRoute(); scrollToCur(); } else { paintGrid(); scrollTopNow('kanaView'); }
}

export function openKana(opts){
  ensureData().then(ok => {
    if(!ok){ showToast('No se pudo cargar el abecedario. Revisa tu conexión.', '⚠'); return; }
    const v = q('kanaView'); if(!v) return;
    ['reviewView', 'cardsView', 'stageMapView'].forEach(id => { const el = q(id); if(el) el.style.display = 'none'; });
    const g = opts && opts.group; if(g){ group = g; script = GROUPS.find(x => x.id === g).script; tab = 'ruta'; }
    if(opts && opts.tab) tab = opts.tab;
    run = null;
    v.style.display = '';
    const list = chars(group); select((cur && list.some(i => i.id === cur.id)) ? cur.id : list[0].id, false);
    showPane(tab);
    if(tab === 'ruta') paintRoute();
    scrollTopNow('kanaView');
    if(tab === 'ruta') requestAnimationFrame(scrollToCur);
  });
}
export function hideKana(){ try{ window.speechSynthesis.cancel(); }catch(e){} const v = q('kanaView'); if(v) v.style.display = 'none'; }
export function closeKana(){
  if(!q('kanaView') || q('kanaView').style.display === 'none') return;
  hideKana();
  const back = S.kanaFrom === 'map' ? 'learn' : 'review';
  S.kanaFrom = null;
  switchView(back);
}

// ── ruta de práctica: estados y mapa ──
const starsOf = (p, nd, g) => p.stars[nd.key] || (p.done[g.id] ? 1 : 0);
/** Estado de cada nodo: lock · open · done; y cuál es el siguiente por hacer (cur). */
function computeStates(p){
  let cur_ = null;
  const lv = PLANS.map(({ g, nodes }, gi) => {
    const levelOpen = gi === 0 || p.skip || !!p.done[GROUPS[gi - 1].id];
    let prevDone = true;
    return nodes.map(nd => {
      const s = starsOf(p, nd, g);
      let st;
      if(!levelOpen) st = 'lock';
      else if(s) st = 'done';
      else if(nd.type === 'exam') st = 'open';
      else st = prevDone ? 'open' : 'lock';
      if(nd.type !== 'exam') prevDone = !!s;
      const o = { nd, st, stars: s };
      if(!cur_ && st === 'open') cur_ = o;
      return o;
    });
  });
  return { lv, cur: cur_ };
}
const starsTx = n => '<span class="knStars" aria-hidden="true">' + [1, 2, 3].map(i => '<i class="' + (i <= n ? 'on' : '') + '">★</i>').join('') + '</span>';

let scrollRaf = 0;
function stopScroll(){ if(scrollRaf){ cancelAnimationFrame(scrollRaf); scrollRaf = 0; } }
/** Desplaza el panel hasta `target` con aceleración y frenado suaves (si el usuario toca o gira la rueda, se detiene). */
function smoothScroll(target, ms){
  const el = q('kanaView'); if(!el) return;
  stopScroll();
  const from = el.scrollTop, dist = target - from;
  if(Math.abs(dist) < 4 || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){ el.scrollTop = target; return; }
  const dur = Math.max(500, Math.min(ms || 1600, 3600)), t0 = performance.now();
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = now => { const t = Math.min(1, (now - t0) / dur); el.scrollTop = from + dist * ease(t); scrollRaf = t < 1 ? requestAnimationFrame(step) : 0; };
  scrollRaf = requestAnimationFrame(step);
}
const targetFor = node => { const el = q('kanaView'); const r = node.getBoundingClientRect(), c = el.getBoundingClientRect(); return r.top - c.top + el.scrollTop - el.clientHeight / 2 + 40; };
const W_ = 420;
let lastEx = 0;
/** Unidades de escena que sobran a cada lado según el ancho disponible. */
function sideExtra(){
  const box = q('knPath'), cw = (box && box.clientWidth) || 0;
  if(!cw) return 0;
  const k = Math.min(cw / FW, 1.45);
  return Math.min(1400, Math.max(0, Math.ceil((cw / k - FW) / 2) + 2));
}
function onResize(){
  if(!q('knClimb')) return;
  if(Math.abs(sideExtra() - lastEx) > 30 && q('kanaView').style.display !== 'none' && q('knRoute').style.display !== 'none') paintRoute();
  fitClimb();
}
function fitClimb(){
  const box = q('knClimb'), sc = q('knScene'); if(!box || !sc) return;
  const cw = box.clientWidth || FW, k = Math.min(cw / FW, 1.45), H = +sc.dataset.h;
  sc.style.transform = 'translateX(' + Math.round((cw - FW * k) / 2) + 'px) scale(' + k + ')';
  box.style.height = Math.round(H * k) + 'px';
}
function goCur(ms){ const n = q('knPath') && q('knPath').querySelector('.knNode.isCur'); if(n) smoothScroll(targetFor(n), ms); }
function goSummit(ms){ const c = q('knClimb'); if(c) smoothScroll(Math.max(0, targetFor(c) - c.clientHeight / 2 + q('kanaView').clientHeight / 2 - 40 - 90), ms); }

function paintRoute(){
  if(!PLANS) return;
  const p = load(), { lv, cur: cn } = computeStates(p);
  let total = 0, doneN = 0, starN = 0;
  lv.forEach(l => l.forEach(o => { total++; if(o.st === 'done'){ doneN++; starN += o.stars; } }));
  q('knRouteSum').innerHTML = '<div class="knSumTop"><b>' + doneN + ' de ' + total + ' pasos</b><span>★ ' + starN + '</span></div><div class="knQBar" aria-hidden="true"><i style="width:' + Math.round(doneN / total * 100) + '%"></i></div>';
  const L = layoutFuji(lv.map(l => l.length));
  const flat = []; lv.forEach(l => l.forEach(o => flat.push(o)));
  const done = flat.slice(0, -1).map(o => o.st === 'done');
  const allDone = GROUPS.every(g => !!p.done[g.id]);
  const ex = sideExtra();   // pantallas anchas: el cielo, las colinas y el bosque se extienden a los lados
  lastEx = ex;
  let html = fujiSvg(L, done, ex);
  const clouds = [[0.12, -70], [0.26, 300], [0.4, -90], [0.55, 310], [0.7, -60], [0.84, 290]];
  if(ex > 60){ const n = Math.min(3, Math.ceil(ex / 160)); for(let j = 1; j <= n; j++){ const dx = (ex * j) / n; clouds.push([0.06 + 0.17 * j, -dx - 40], [0.14 + 0.19 * j, W_ + dx - 120], [0.5 + 0.1 * j, -dx * 0.8], [0.62 + 0.09 * j, W_ + dx * 0.7 - 80]); } }
  clouds.forEach((c, i) => { html += '<span class="knCloudB c' + (i % 2) + '" style="top:' + Math.round(L.H * c[0]) + 'px;left:' + Math.round(c[1]) + 'px" aria-hidden="true">' + CLOUD + '</span>'; });
  html += '<div class="knSign knSummit' + (allDone ? ' isOn' : '') + '" style="top:' + (L.apexY - 150) + 'px"><b>Cumbre</b><small>' + (allDone ? '¡Dominas el kana!' : 'Supera los 6 niveles') + '</small></div>';
  L.signs.forEach(sg => {
    const g = GROUPS[sg.gi], l = lv[sg.gi], doneL = l.filter(o => o.st === 'done').length;
    html += '<div class="knSign ' + (g.script === 'Katakana' ? 'isKata' : '') + '" style="top:' + (sg.y - 30) + 'px"><span class="knSignDot" aria-hidden="true"></span><div class="knSignTx"><small>ESTACIÓN ' + (sg.gi + 1) + '</small><b>' + esc(g.script) + ' · ' + esc(g.name) + '</b></div><span class="knSignCount' + (p.done[g.id] ? ' isDone' : '') + '">' + (p.done[g.id] ? '✓' : doneL + '/' + l.length) + '</span></div>';
  });
  L.nodes.forEach((n, idx) => {
    const o = lv[n.gi][n.ni], nd = o.nd, g = GROUPS[n.gi], isCur = cn && cn.nd.key === nd.key;
    const face = o.st === 'lock' ? '🔒' : nd.type === 'exam' ? '👑' : nd.type === 'words' ? '<span lang="ja">語</span>' : '<span lang="ja">' + esc(nd.items[0].ja) + '</span>';
    const cap = nd.type === 'exam' ? 'Examen' : nd.type === 'words' ? 'Palabras' : 'Lección ' + nd.n;
    const sub = nd.type === 'exam' ? 'del nivel' : nd.type === 'words' ? 'vocabulario' : nd.items.map(romOf).join(' ');
    const label = (nd.type === 'exam' ? 'Examen de ' : nd.type === 'words' ? 'Palabras de ' : 'Lección ' + nd.n + ' de ') + g.script + ' ' + g.name + (o.st === 'lock' ? ' (bloqueada)' : o.st === 'done' ? ' (' + o.stars + ' de 3 estrellas)' : '');
    html += '<button type="button" class="knNode ' + (g.script === 'Katakana' ? 'isKata ' : '') + 't-' + nd.type + ' s-' + o.st + (isCur ? ' isCur' : '') + '" style="left:' + (n.x - 48) + 'px;top:' + (n.y - 36) + 'px;width:96px;transform:none" data-gi="' + n.gi + '" data-ni="' + n.ni + '" aria-label="' + esc(label) + '">' +
      '<span class="knPlat" aria-hidden="true"></span><span class="knPuck">' + face + '</span>' + (o.st === 'lock' ? '<span class="knStars knStarsOff"></span>' : starsTx(o.stars)) + '<span class="knLbl"><b>' + esc(cap) + '</b><small>' + esc(sub) + '</small></span></button>';
  });
  q('knPath').innerHTML = '<div class="knClimb" id="knClimb"><div class="knScene" id="knScene" data-h="' + Math.round(L.H) + '" style="height:' + Math.round(L.H) + 'px">' + html + '</div></div>';
  fitClimb();
}
function scrollToCur(){
  const v = q('kanaView'); if(!v || !q('knPath')) return;
  let first = false; try{ first = !localStorage.getItem('ci_kana_intro'); }catch(e){}
  if(first){
    try{ localStorage.setItem('ci_kana_intro', '1'); }catch(e){}
    v.scrollTop = 0; setTimeout(() => goCur(3200), 900);   // primera vez: se baja desde la cumbre hasta tu nodo
    return;
  }
  const n = q('knPath').querySelector('.knNode.isCur'); if(n) v.scrollTop = targetFor(n);
}
// ── lecciones ──
function qFor(it, type, pool){
  const rom = first(it.romaji);
  const others = shuffle(pool.filter(o => o.id !== it.id && (it.kind === 'word' ? o.es !== it.es : first(o.romaji) !== rom))).slice(0, 3);
  return { it, type, opts: type === 'type' ? [] : shuffle([it].concat(others)) };
}
function reviewPool(gi, ni){
  const out = [], sc = GROUPS[gi].script;
  for(let a = 0; a < gi; a++) if(GROUPS[a].script === sc) out.push(...chars(GROUPS[a].id));
  PLANS[gi].nodes.slice(0, ni).forEach(n => { if(n.type === 'lesson') out.push(...n.items); });
  return out;
}
function spread(qs){   // evita dos preguntas seguidas de la misma letra
  for(let i = 1; i < qs.length; i++){
    if(qs[i].it.id === qs[i - 1].it.id){ const j = qs.findIndex((z, k) => k > i && z.it.id !== qs[i - 1].it.id && (!qs[i + 1] || z.it.id !== qs[i + 1].it.id)); if(j > 0){ const t = qs[i]; qs[i] = qs[j]; qs[j] = t; } }
  }
  return qs;
}
function buildRun(gi, ni, skipIntro){
  const g = GROUPS[gi], nd = PLANS[gi].nodes[ni];
  const r = { gi, ni, g, nd, ii: 0, i: 0, first: 0, base: 0, locked: false, phase: skipIntro ? 'q' : 'intro', qs: [] };
  const hear = !noVoicesAtAll();
  const T = hear ? ['read', 'pick', 'listen'] : ['read', 'pick'];
  if(nd.type === 'lesson'){
    const pool = chars(g.id);
    nd.items.forEach((it, k) => { [T[k % T.length], T[(k + 1) % T.length]].forEach(t => r.qs.push(qFor(it, t, pool))); });
    shuffle(reviewPool(gi, ni)).slice(0, 3).forEach(it => r.qs.push(qFor(it, 'read', chars(GID[it.id]))));
    r.qs = spread(shuffle(r.qs));
  } else if(nd.type === 'words'){
    const pool = GROUPS.flatMap(x => words(x.id));
    const types = (nd.items.length > 4 || !hear) ? ['wread', 'wpick'] : ['wread', 'wpick', 'wlisten'];
    nd.items.forEach(it => types.forEach(t => r.qs.push(qFor(it, t, pool))));
    r.qs = spread(shuffle(r.qs));
  } else {
    const pool = chars(g.id), ty = hear ? ['read', 'pick', 'listen', 'type'] : ['read', 'pick', 'type', 'pick'];
    r.qs = shuffle(shuffle(pool).slice(0, EXAM_LEN).map((it, n) => qFor(it, ty[n % 4], pool)));
  }
  r.base = r.qs.length;
  return r;
}
function startRun(gi, ni, skipIntro){
  run = buildRun(gi, ni, skipIntro);
  showPane('run'); paintRun(); scrollTopNow('kanaView');
}
const tagOf = r => (r.nd.type === 'exam' ? 'EXAMEN' : r.nd.type === 'words' ? 'PALABRAS' : 'LECCIÓN ' + r.nd.n) + ' · ' + r.g.script.toUpperCase();

function paintRun(){
  const r = run; if(!r) return;
  q('knQTag').textContent = tagOf(r);
  const intro = r.phase === 'intro' && r.nd.type !== 'exam' ? r.nd.items.length : 0;
  const pct = r.phase === 'end' ? 100 : r.phase === 'intro' ? Math.round(r.ii / Math.max(1, intro || 1) * 8) : 8 + Math.round(r.i / r.qs.length * 92);
  q('knQBarFill').style.width = pct + '%';
  const body = q('knQBody');
  if(r.phase === 'intro') body.innerHTML = r.nd.type === 'exam' ? examIntroHtml(r) : introHtml(r);
  else if(r.phase === 'q') body.innerHTML = qHtml(r);
  else body.innerHTML = endHtml(r);
  voiceNote();
  if(r.phase === 'intro' && r.nd.type !== 'exam') say(r.nd.items[r.ii].ja, 0.8, romOf(r.nd.items[r.ii]));
  if(r.phase === 'q'){
    const z = r.qs[r.i];
    if(z.type === 'listen' || z.type === 'wlisten') say(z.it.ja, 0.8, romOf(z.it));
    const inp = q('knTypeIn'); if(inp) setTimeout(() => { try{ inp.focus(); }catch(e){} }, 60);
  }
}
const listenBtns = () => '<div class="knListenRow"><button type="button" class="knListen hover-scale focus-glow" data-act="play">' + SPK + '<span>Escuchar</span></button><button type="button" class="knListenAlt hover-scale focus-glow" data-act="slow" aria-label="Escuchar despacio">🐢 <span>Lento</span></button></div>';
function introHtml(r){
  const it = r.nd.items[r.ii], last = r.ii >= r.nd.items.length - 1, isW = it.kind === 'word';
  const dots = r.nd.items.map((_, k) => '<i class="' + (k === r.ii ? 'on' : k < r.ii ? 'past' : '') + '"></i>').join('');
  return '<div class="knDots" aria-hidden="true">' + dots + '</div><p class="knIntroKick">' + (isW ? 'Palabra nueva' : 'Carácter nuevo') + ' · ' + (r.ii + 1) + ' de ' + r.nd.items.length + '</p>' +
    '<div class="knQPrompt"><span class="knQBig' + (isW ? ' knQWord' : '') + '" lang="ja">' + esc(it.ja) + '</span></div>' +
    '<div class="knIntroRom">' + esc(first(it.romaji)) + '</div>' + (isW ? '<div class="knIntroEs">' + esc(it.es) + '</div>' : '') +
    (it.ex ? '<div class="knIntroEx"><b lang="ja">' + esc(it.ex) + '</b> <i>' + esc(it.exEs) + '</i></div>' : '') +
    (it.note ? '<p class="knIntroNote">' + esc(it.note) + '</p>' : '') +
    listenBtns() +
    (isW ? '' : '<button type="button" class="knGhost hover-scale focus-glow" data-act="trace">✍ Calcar este carácter</button>') +
    '<div class="knFoot"><button type="button" class="knNextBtn hover-scale focus-glow" data-act="inext">' + (last ? '¡A practicar!' : 'Siguiente') + ' <span aria-hidden="true">→</span></button></div>';
}
function examIntroHtml(r){
  return '<div class="knExamBadge" aria-hidden="true">👑</div><h3 class="knResH">Examen de nivel</h3>' +
    '<p class="knResP">' + r.qs.length + ' preguntas mezcladas (leer, escuchar, elegir y escribir). Necesitas <b>' + Math.ceil(r.qs.length * EXAM_PASS) + '</b> aciertos para superar <b>' + esc(r.g.script) + ' · ' + esc(r.g.name) + '</b>. Aquí no hay segunda oportunidad por pregunta.</p>' +
    '<div class="knFoot"><button type="button" class="knNextBtn hover-scale focus-glow" data-act="istart">Empezar examen <span aria-hidden="true">→</span></button></div>';
}
function qHtml(r){
  const z = r.qs[r.i], it = z.it;
  const ja = o => '<button type="button" class="knOpt knOptJa hover-scale focus-glow" lang="ja" data-id="' + o.id + '">' + esc(o.ja) + '</button>';
  const jaW = o => '<button type="button" class="knOpt knOptJa knOptWord hover-scale focus-glow" lang="ja" data-id="' + o.id + '">' + esc(o.ja) + '</button>';
  let prompt, hint, opts = '';
  if(z.type === 'read'){ prompt = '<div class="knQPrompt"><span class="knQBig" lang="ja">' + esc(it.ja) + '</span></div>'; hint = '¿Cómo se lee?'; opts = z.opts.map(o => '<button type="button" class="knOpt hover-scale focus-glow" data-id="' + o.id + '">' + esc(first(o.romaji)) + '</button>').join(''); }
  else if(z.type === 'listen'){ prompt = listenBtns(); hint = '¿Qué carácter es?'; opts = z.opts.map(ja).join(''); }
  else if(z.type === 'pick'){ prompt = '<div class="knQPrompt"><span class="knQBig">' + esc(first(it.romaji)) + '</span></div>'; hint = '¿Qué carácter es?'; opts = z.opts.map(ja).join(''); }
  else if(z.type === 'type'){ prompt = '<div class="knQPrompt"><span class="knQBig" lang="ja">' + esc(it.ja) + '</span></div>'; hint = 'Escribe cómo se lee (en romaji)'; }
  else if(z.type === 'wread'){ prompt = '<div class="knQPrompt"><span class="knQBig knQWord" lang="ja">' + esc(it.ja) + '</span></div>'; hint = '¿Qué significa?'; opts = z.opts.map(o => '<button type="button" class="knOpt knOptEs hover-scale focus-glow" data-id="' + o.id + '">' + esc(o.es) + '</button>').join(''); }
  else if(z.type === 'wlisten'){ prompt = listenBtns(); hint = '¿Qué palabra es?'; opts = z.opts.map(jaW).join(''); }
  else { prompt = '<div class="knQPrompt"><span class="knQBig knQEs">' + esc(it.es) + '</span></div>'; hint = '¿Cuál es la palabra en japonés?'; opts = z.opts.map(jaW).join(''); }
  const n = r.nd.type === 'exam' ? '<p class="knQProgTx">Pregunta ' + (r.i + 1) + ' de ' + r.qs.length + '</p>' : '<p class="knQProgTx">' + (r.i + 1) + ' / ' + r.qs.length + '</p>';
  const input = z.type === 'type' ? '<div class="knTypeBox"><input id="knTypeIn" class="knTypeIn" type="text" inputmode="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="ka, shi, kya…" aria-label="Escribe el romaji"></div>' : '';
  return n + prompt + '<p class="knQAsk">' + hint + '</p>' + input + (opts ? '<div class="knQOpts' + (z.type === 'wread' ? ' isOne' : '') + '" id="knQOpts">' + opts + '</div>' : '') +
    '<div class="knFoot" id="knFoot">' + (z.type === 'type' ? '<button type="button" class="knNextBtn hover-scale focus-glow" data-act="check">Comprobar</button>' : '') + '</div>';
}
function answerHtml(z, ok){
  const it = z.it, isW = it.kind === 'word';
  const msg = ok ? ['¡Correcto!', '¡Muy bien!', '¡Eso es!', '¡Perfecto!'][Math.floor(Math.random() * 4)]
    : 'Era <span lang="ja">' + esc(it.ja) + '</span> (' + esc(first(it.romaji)) + ')' + (isW ? ' = ' + esc(it.es) : '');
  const last = run.i >= run.qs.length - 1;
  return '<div class="knFb ' + (ok ? 'isOk' : 'isBad') + '" role="status"><div class="knFbTx"><span class="knFbIc" aria-hidden="true">' + (ok ? '✓' : '✕') + '</span><span>' + msg + '</span></div>' +
    '<button type="button" class="knNextBtn hover-scale focus-glow" data-act="qnext" id="knQNext">' + (last ? 'Ver resultado' : 'Continuar') + ' <span aria-hidden="true">→</span></button></div>';
}
function finishAnswer(z, ok, picked){
  const r = run; r.locked = true; r.started = true;
  if(!z.retry && ok) r.first++;
  if(!ok && r.nd.type !== 'exam' && !z.retry){
    const alt = { read: 'pick', pick: noVoicesAtAll() ? 'read' : 'listen', listen: 'read', wread: 'wpick', wpick: noVoicesAtAll() ? 'wread' : 'wlisten', wlisten: 'wread' }[z.type] || 'read';
    const pool = z.it.kind === 'word' ? GROUPS.flatMap(x => words(x.id)) : chars(GID[z.it.id]);
    const rq = qFor(z.it, alt, pool); rq.retry = true; r.qs.push(rq);
  }
  document.querySelectorAll('#knQOpts .knOpt').forEach(b => { b.disabled = true; if(b.dataset.id === z.it.id) b.classList.add('isRight'); });
  if(picked && !ok) picked.classList.add('isWrong');
  q('knFoot').innerHTML = answerHtml(z, ok);
  const inp = q('knTypeIn'); if(inp) inp.disabled = true;
  const nb = q('knQNext'); if(nb) nb.focus({ preventScroll: true });
}
function answerOpt(btn){
  const r = run; if(!r || r.locked) return;
  const z = r.qs[r.i];
  finishAnswer(z, btn.dataset.id === z.it.id, btn);
}
function answerType(){
  const r = run; if(!r || r.locked) return;
  const z = r.qs[r.i], inp = q('knTypeIn'), v = inp ? inp.value.trim() : '';
  if(!v){ if(inp){ inp.classList.add('isShake'); setTimeout(() => inp.classList.remove('isShake'), 400); inp.focus(); } return; }
  const ok = romajiMatches(v, z.it.romaji);
  if(inp) inp.classList.add(ok ? 'isRight' : 'isWrong');
  finishAnswer(z, ok, null);
}
function nextQ(){
  const r = run; if(!r) return;
  r.locked = false;
  if(r.i >= r.qs.length - 1){ endRun(); return; }
  r.i++; paintRun(); scrollTopNow('kanaView');
}
function endRun(){
  const r = run, acc = r.first / r.base, isExam = r.nd.type === 'exam';
  const pass = acc + 1e-9 >= (isExam ? EXAM_PASS : LESSON_PASS);
  const stars = !pass ? 0 : isExam ? (acc >= 1 ? 3 : acc >= 0.9 ? 2 : 1) : (acc >= 0.95 ? 3 : acc >= 0.8 ? 2 : 1);
  r.pass = pass; r.stars = stars; r.phase = 'end';
  if(pass){
    const p = load();
    p.stars[r.nd.key] = Math.max(p.stars[r.nd.key] || 0, stars);
    if(isExam) p.done[r.g.id] = 1;
    save(p);
    if(isExam) document.dispatchEvent(new CustomEvent('vocabri-kana-changed'));
  }
  paintRun(); scrollTopNow('kanaView');
}
function endHtml(r){
  const isExam = r.nd.type === 'exam', n = r.first, tot = r.base, p = load();
  const st = '<div class="knResStars" aria-label="' + r.stars + ' de 3 estrellas">' + [1, 2, 3].map(i => '<i class="' + (i <= r.stars ? 'on' : '') + '" style="--d:' + (i * 0.18) + 's">★</i>').join('') + '</div>';
  if(r.pass){
    return (isExam ? '<div class="knExamBadge isWin" aria-hidden="true">👑</div>' : '') + st +
      '<h3 class="knResH">' + (isExam ? '¡Nivel superado!' : r.nd.type === 'words' ? '¡Palabras aprendidas!' : '¡Lección completada!') + '</h3>' +
      '<p class="knResP"><b>' + n + ' de ' + tot + '</b> a la primera' + (isExam ? ' en ' + esc(r.g.script) + ' · ' + esc(r.g.name) + '.' : '.') + (isExam && GROUPS[r.gi + 1] ? ' Se abre el siguiente nivel.' : '') + '</p>' +
      '<div class="knFoot"><button type="button" class="knNextBtn hover-scale focus-glow" data-act="toRoute">Continuar <span aria-hidden="true">→</span></button>' +
      '<button type="button" class="knGhost hover-scale focus-glow" data-act="again">Repetir para mejorar</button>' +
      (isExam && p.done.h1 && S.kanaFrom === 'map' ? '<button type="button" class="knGhost hover-scale focus-glow" data-act="toMap">Ir al mapa del curso</button>' : '') + '</div>';
  }
  return st + '<h3 class="knResH">' + (isExam ? 'Casi lo logras' : 'Casi') + '</h3>' +
    '<p class="knResP"><b>' + n + ' de ' + tot + '</b> a la primera. Necesitas ' + Math.ceil(tot * (isExam ? EXAM_PASS : LESSON_PASS)) + '. ' + (isExam ? 'Repasa las lecciones del nivel y vuelve a intentarlo.' : 'Inténtalo otra vez, ¡cada intento ayuda!') + '</p>' +
    '<div class="knFoot"><button type="button" class="knNextBtn hover-scale focus-glow" data-act="again">Reintentar <span aria-hidden="true">→</span></button>' +
    '<button type="button" class="knGhost hover-scale focus-glow" data-act="toRoute">Volver a la ruta</button></div>';
}
function exitRun(force){
  if(run && run.phase === 'q' && run.started && !force && !window.confirm('¿Salir de la lección? Se perderá el avance de este intento.')) return false;
  try{ window.speechSynthesis.cancel(); }catch(e){}
  run = null; showPane(tab); if(tab === 'ruta'){ paintRoute(); scrollToCur(); } else { paintGrid(); scrollTopNow('kanaView'); }
  return true;
}

function runClick(e){
  const b = e.target.closest('[data-act], .knOpt'); if(!b || !run) return;
  const r = run;
  if(b.classList.contains('knOpt')){ answerOpt(b); return; }
  const a = b.dataset.act, it = r.phase === 'intro' ? r.nd.items[r.ii] : (r.qs[r.i] || {}).it;
  if(a === 'play' && it) say(it.ja, 0.8, romOf(it));
  else if(a === 'slow' && it) say(it.ja, 0.5, romOf(it));
  else if(a === 'trace'){ openTrace(r.nd.items[r.ii].ja); }
  else if(a === 'inext'){
    if(r.ii < r.nd.items.length - 1){ r.ii++; const nx = r.nd.items[r.ii]; if(nx.kind === 'char'){ const p = load(); p.seen[nx.id] = 1; save(p); } paintRun(); }
    else { r.phase = 'q'; paintRun(); scrollTopNow('kanaView'); }
  }
  else if(a === 'istart'){ r.phase = 'q'; paintRun(); scrollTopNow('kanaView'); }
  else if(a === 'check'){ answerType(); }
  else if(a === 'qnext'){ nextQ(); }
  else if(a === 'again'){ startRun(r.gi, r.ni, true); }
  else if(a === 'toRoute'){ exitRun(true); }
  else if(a === 'toMap'){ exitRun(true); S.kanaFrom = 'map'; closeKana(); }
}

// ── velo de nubes sobre el mapa ──
const CLOUD = '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M20 50a14 14 0 0 1 2-27 20 20 0 0 1 38-6 16 16 0 0 1 28 8 13 13 0 0 1 12 25z" fill="currentColor"/></svg>';
export function applyKanaGate(){
  const host = q('stageMapView'); if(!host) return;
  let veil = q('kanaVeil');
  const need = (S.currentCat && S.view === 'learn') ? kanaNeeded(S.currentCat) : null;
  if(!need){ if(veil) veil.remove(); host.classList.remove('kanaLocked'); return; }
  host.classList.add('kanaLocked');
  if(!veil){ veil = document.createElement('div'); veil.id = 'kanaVeil'; veil.className = 'kanaVeil'; host.insertBefore(veil, host.firstChild); }
  const hh = Math.max(host.clientHeight, 420); veil.style.height = hh + 'px'; veil.style.marginBottom = (-hh) + 'px';
  const g = GROUPS.find(x => x.id === need);
  veil.innerHTML = '<span class="kvCloud c1">' + CLOUD + '</span><span class="kvCloud c2">' + CLOUD + '</span><span class="kvCloud c3">' + CLOUD + '</span>' +
    '<div class="gModal kvCard" role="dialog" aria-label="Abecedario japonés"><div class="gModalEmoji" id="kvMascot"></div>' +
    '<h3>El mapa está entre nubes</h3>' +
    '<p>Antes de empezar, aprende el <b>' + esc(g.script) + ' básico</b>: 46 caracteres en lecciones cortas y un examen final.</p>' +
    '<button type="button" class="nav hover-scale focus-glow" id="kvOpen">Empezar la ruta</button>' +
    '<button type="button" class="kvSkip hover-scale focus-glow" id="kvSkip">Ya sé kana, saltar</button></div>';
  q('kvMascot').innerHTML = KANA_ICON; q('kvMascot').classList.add('tabIcon');
  q('kvOpen').onclick = () => { S.kanaFrom = 'map'; openKana({ group: need }); };
  q('kvSkip').onclick = () => {
    if(!window.confirm('¿Seguro? Se abrirá todo el mapa sin pasar la práctica del abecedario. Podrás practicarlo cuando quieras desde Repasar → Modos de práctica.')) return;
    const p = load(); p.skip = true; save(p); applyKanaGate();
  };
}

function wire(){
  if(q('kanaView')) return;
  const v = document.createElement('div');
  v.id = 'kanaView'; v.style.display = 'none';
  v.innerHTML =
    '<div class="dictHead"><button class="miniBtn hover-scale focus-glow" id="knBackBtn" type="button" aria-label="Volver">←</button>' +
    '<h2 class="dictTitle"><span class="tabIcon abcHeadIc" aria-hidden="true">' + KANA_ICON + '</span><span class="rvTitleText">Abecedario japonés</span></h2></div>' +
    '<p class="hint knVoiceNote" id="knVoiceNote" style="display:none;">🔇 Tu navegador no tiene voz japonesa: se usa una aproximación con voz en español. Para el sonido real, instala una voz japonesa en el sistema (en Windows: Configuración → Hora e idioma → Voz) o usa Edge/Chrome en línea.</p>' +
    '<div class="knTabs knModeTabs" id="knModeTabs" role="tablist"><button type="button" class="knTab hover-scale focus-glow" data-t="ruta" role="tab">🗺 Ruta</button><button type="button" class="knTab hover-scale focus-glow" data-t="tabla" role="tab">📖 Tabla</button></div>' +
    '<div id="knRoute"><p class="hint dictSub">Aprende los caracteres en orden: lecciones cortas, palabras y un examen por nivel. Gana estrellas y desbloquea el siguiente nivel.</p><div class="knRouteSum" id="knRouteSum"></div><div id="knPath"></div>' +
      '<button type="button" class="knFab l hover-scale focus-glow" id="knFabCur" aria-label="Ir a mi nodo"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 4v13M6 12l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Mi nodo</span></button>' +
      '<button type="button" class="knFab r hover-scale focus-glow" id="knFabTop" aria-label="Ir a la cima"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 20V7M6 12l6-6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Cima</span></button></div>' +
    '<div id="knMain" style="display:none;">' +
    '<p class="hint dictSub">Toca un carácter para ver cómo se lee y escucharlo.</p>' +
    '<div class="abcDetail knDetail" id="knDetail" aria-live="polite">' +
      '<div class="abcBig knBig" id="knBig" lang="ja"></div>' +
      '<div class="abcInfo"><div class="abcNameLbl">Se lee</div><div class="abcName" id="knName"></div><div class="abcSay" id="knSay"></div></div>' +
      '<div class="abcBtns knBtns">' +
        '<button class="knListen hover-scale focus-glow" id="knPlay" type="button">' + SPK + '<span>Escuchar</span></button>' +
        '<button class="abcBtn hover-scale focus-glow" id="knSlow" type="button">🐢 Lento</button>' +
        '<button class="abcBtn hover-scale focus-glow" id="knEx" type="button">🔊 Ejemplo</button>' +
        '<button class="abcBtn hover-scale focus-glow" id="knTrace" type="button">✍ Calcar</button>' +
      '</div>' +
      '<div class="abcWord" id="knExample"></div><p class="abcTip" id="knTip" style="display:none;"></p>' +
      '<div class="abcNav"><button class="abcArrow hover-scale focus-glow" id="knPrev" type="button" aria-label="Anterior">←</button><button class="abcArrow hover-scale focus-glow" id="knNext" type="button" aria-label="Siguiente">→</button></div>' +
    '</div>' +
    '<div class="knTabs" id="knTabs" role="tablist"></div><div class="knGroups" id="knGroups"></div>' +
    '<div class="abcGrid knGrid" id="knGrid" role="group" aria-label="Caracteres"></div>' +
    '<div class="knWords" id="knWords"></div>' +
    '<button class="nav hover-scale focus-glow abcAll" id="knPractice" type="button"></button>' +
    '</div>' +
    '<div id="knQuiz" style="display:none;"><div class="knQCard"><span class="knQTag" id="knQTag">PRÁCTICA</span>' +
      '<div class="knQBar" aria-hidden="true"><i id="knQBarFill"></i></div><div id="knQBody"></div></div></div>';
  const anchor = q('tableView'); anchor.parentNode.insertBefore(v, anchor);

  q('knBackBtn').onclick = () => { if(run){ exitRun(false); } else closeKana(); };
  q('knModeTabs').addEventListener('click', e => { const b = e.target.closest('.knTab'); if(b) setTab(b.dataset.t); });
  q('knPath').addEventListener('click', e => {
    const b = e.target.closest('.knNode'); if(!b) return;
    const gi = +b.dataset.gi, ni = +b.dataset.ni, o = computeStates(load()).lv[gi][ni];
    if(o.st === 'lock'){ showToast(ni === 0 ? 'Supera el nivel anterior para abrir este.' : 'Completa antes la lección anterior.', '🔒'); return; }
    startRun(gi, ni, false);
  });
  q('knFabCur').onclick = () => goCur(1500); q('knFabTop').onclick = () => goSummit(1900);
  ['wheel', 'touchstart', 'keydown'].forEach(ev => v.addEventListener(ev, stopScroll, { passive: true }));
  window.addEventListener('resize', onResize);
  q('knQBody').addEventListener('click', runClick);
  q('knQBody').addEventListener('keydown', e => { if(e.key === 'Enter' && e.target && e.target.id === 'knTypeIn'){ e.preventDefault(); answerType(); } });
  q('knPlay').onclick = () => cur && say(cur.ja);
  try{ window.speechSynthesis.addEventListener('voiceschanged', voiceNote); }catch(e){}
  q('knSlow').onclick = () => cur && say(cur.ja, 0.5);
  q('knEx').onclick = () => cur && say(cur.ex ? cur.ex : cur.ja, 0.85, cur.ex ? romOfEx(cur) : romOf(cur));
  q('knTrace').onclick = () => cur && openTrace(cur.ja);
  const step = d => { const l = chars(group); const i = l.findIndex(x => cur && x.id === cur.id); select(l[(i + d + l.length) % l.length].id, true); };
  q('knPrev').onclick = () => step(-1); q('knNext').onclick = () => step(1);
  q('knTabs').addEventListener('click', e => { const b = e.target.closest('.knTab'); if(!b) return; script = b.dataset.s; group = GROUPS.find(x => x.script === script).id; cur = null; const l = chars(group); select(l[0].id, false); });
  q('knGroups').addEventListener('click', e => { const b = e.target.closest('.knGroup'); if(!b) return; group = b.dataset.g; cur = null; select(chars(group)[0].id, false); });
  q('knGrid').addEventListener('click', e => { const k = e.target.closest('.knKey'); if(k){ select(k.dataset.id, true); q('knDetail').scrollIntoView({ block: 'nearest' }); } });
  q('knWords').addEventListener('click', e => { const k = e.target.closest('.knWord'); if(k){ select(k.dataset.id, true); q('knDetail').scrollIntoView({ block: 'nearest' }); } });
  q('knPractice').onclick = () => setTab('ruta');
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && v.style.display !== 'none' && !(q('traceOverlay') && q('traceOverlay').style.display !== 'none')) q('knBackBtn').click(); });
  document.addEventListener('vocabri-open-kana', () => { try{ const sp = q('settingsPanel'); if(sp) sp.hidden = true; const sb = q('settingsBtn'); if(sb) sb.setAttribute('aria-expanded', 'false'); }catch(e){} S.kanaFrom = null; openKana(); });
  document.addEventListener('vocabri-map-built', applyKanaGate);
  document.addEventListener('vocabri-kana-changed', applyKanaGate);
}
export const __inits = [[9086, wire]];

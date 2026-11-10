/**
 * Vocabri — Modos de Juego (v1.5+)
 * Speed Run, Supervivencia, Dictado, Duelo
 */

import { getState, updateState, addXP, persistState } from './state.js';
import { showView, showToast, vbPrompt } from './ui.js';
import { mapItemsFor, stageItems, getUnlockedStage } from './map.js';
import { speakText } from './speech.js';

// ============================================================
// CONSTANTES
// ============================================================
const SPEED_RUN_DURATIONS = [60, 120, 180]; // segundos
const SURVIVAL_START_LIVES = 3;
const SURVIVAL_MAX_LIVES = 5;
const SURVIVAL_BASE_DIFFICULTY = 0.3; // probabilidad inicial de fallo

// Estado temporal de modos de juego
let gameModeState = {
  speedRun: { active: false, timer: null, endTime: 0, score: 0, cards: [], currentIndex: 0, duration: 60 },
  survival: { active: false, lives: 3, score: 0, streak: 0, difficulty: SURVIVAL_BASE_DIFFICULTY, cards: [], currentIndex: 0 },
  dictation: { active: false, cards: [], currentIndex: 0, score: 0 },
  duel: { active: false, player1: { score: 0, cards: [] }, player2: { score: 0, cards: [] }, currentPlayer: 1, currentIndex: 0 },
};

// ============================================================
// SPEED RUN
// ============================================================
function startSpeedRun(duration = 60) {
  const state = getState();
  const cat = state.currentCat;
  const unlocked = getUnlockedStage(cat);

  // Obtener todas las tarjetas disponibles hasta el stage desbloqueado
  let allCards = [];
  for (let i = 0; i <= unlocked; i++) {
    const items = stageItems(cat, i);
    allCards = allCards.concat(items.map((item, idx) => ({
      ...item,
      id: item[3] || `${cat}-${i}-${idx}`,
      en: item[0],
      es: item[1],
      ex: item[2],
    })));
  }

  if (allCards.length === 0) {
    showToast('No hay tarjetas disponibles para esta categoría', '⚠️', 2000);
    return;
  }

  // Mezclar y tomar subconjunto
  allCards = shuffleArray(allCards).slice(0, 50);

  gameModeState.speedRun = {
    active: true,
    timer: null,
    endTime: Date.now() + duration * 1000,
    score: 0,
    correct: 0,
    wrong: 0,
    cards: allCards,
    currentIndex: 0,
    duration,
  };

  showView('speedRunView');
  renderSpeedRunUI();
  startSpeedRunTimer();
  showNextSpeedRunCard();
}

function startSpeedRunTimer() {
  const { speedRun } = gameModeState;
  speedRun.timer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((speedRun.endTime - Date.now()) / 1000));
    updateSpeedRunTimer(remaining);
    if (remaining <= 0) {
      endSpeedRun();
    }
  }, 100);
}

function renderSpeedRunUI() {
  const container = document.getElementById('speedRunView');
  if (!container) return;

  const { speedRun } = gameModeState;
  container.innerHTML = `
    <div class="speedRunHeader">
      <div class="speedRunTimer" id="speedRunTimer">${formatTime(speedRun.duration)}</div>
      <div class="speedRunScore">⚡ ${speedRun.score} pts (✓${speedRun.correct} ✗${speedRun.wrong})</div>
    </div>
    <div class="speedRunCard" id="speedRunCard">
      <div class="card-inner" onclick="window.VocabriGameModes?.flipSpeedRunCard()">
        <div class="face front">
          <span class="tag">EN</span>
          <p id="speedRunFrontText"></p>
        </div>
        <div class="face back">
          <span class="tag">ES</span>
          <p id="speedRunBackText"></p>
        </div>
      </div>
    </div>
    <div class="speedRunActions">
      <button class="nav hover-scale focus-glow" id="speedRunKnowBtn" type="button">✓ Sabía</button>
      <button class="nav hover-scale focus-glow" id="speedRunDontKnowBtn" type="button">✗ No sabía</button>
    </div>
    <div class="speedRunProgress">
      <div class="progBarOuter"><div class="progBarFill" id="speedRunProgBar" style="width:0%"></div></div>
      <span class="hint" id="speedRunProgressText">Tarjeta 1 de ${speedRun.cards.length}</span>
    </div>
    <button class="nav dangerBtn hover-scale focus-glow" id="speedRunQuitBtn" type="button" style="margin-top:16px;">Salir</button>
  `;

  // Event listeners
  document.getElementById('speedRunKnowBtn').onclick = () => handleSpeedRunAnswer(true);
  document.getElementById('speedRunDontKnowBtn').onclick = () => handleSpeedRunAnswer(false);
  document.getElementById('speedRunQuitBtn').onclick = () => endSpeedRun(true);
}

function showNextSpeedRunCard() {
  const { speedRun } = gameModeState;
  if (speedRun.currentIndex >= speedRun.cards.length) {
    // Regenerar cartas si se acaban
    speedRun.currentIndex = 0;
    speedRun.cards = shuffleArray(speedRun.cards);
  }

  const card = speedRun.cards[speedRun.currentIndex];
  document.getElementById('speedRunFrontText').textContent = card.en;
  document.getElementById('speedRunBackText').textContent = card.es;
  document.getElementById('speedRunCard').classList.remove('flipped');
  document.getElementById('speedRunProgressText').textContent = `Tarjeta ${speedRun.currentIndex + 1} de ${speedRun.cards.length}`;
  document.getElementById('speedRunProgBar').style.width = `${((speedRun.currentIndex) / speedRun.cards.length) * 100}%`;
}

function handleSpeedRunAnswer(knew) {
  const { speedRun } = gameModeState;
  if (!speedRun.active) return;

  if (knew) {
    speedRun.score += 10;
    speedRun.correct++;
    addXP(5); // XP reducido en modo juego
  } else {
    speedRun.wrong++;
  }

  speedRun.currentIndex++;
  document.getElementById('speedRunScore').textContent = `⚡ ${speedRun.score} pts (✓${speedRun.correct} ✗${speedRun.wrong})`;
  showNextSpeedRunCard();
}

function updateSpeedRunTimer(seconds) {
  const el = document.getElementById('speedRunTimer');
  if (el) el.textContent = formatTime(seconds);
}

function endSpeedRun(quit = false) {
  const { speedRun } = gameModeState;
  if (speedRun.timer) clearInterval(speedRun.timer);
  speedRun.active = false;

  const state = getState();
  const isHighScore = speedRun.score > (state.speedRunHighScore || 0);
  if (isHighScore) {
    updateState({ speedRunHighScore: speedRun.score });
    persistState();
    showToast(`🏆 ¡Nuevo récord: ${speedRun.score} pts!`, '🏆', 3000);
  }

  const msg = quit
    ? `Partida terminada. Puntuación: ${speedRun.score} pts`
    : `¡Tiempo! Puntuación final: ${speedRun.score} pts (✓${speedRun.correct} ✗${speedRun.wrong})`;

  vbPrompt({
    icon: '⚡',
    title: 'Speed Run Finalizado',
    text: msg,
    buttons: [
      { label: 'Jugar de nuevo', primary: true, onClick: () => startSpeedRun(speedRun.duration) },
      { label: 'Volver al mapa', onClick: () => showView('cardsView') },
    ],
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ============================================================
// SUPERVIVENCIA
// ============================================================
function startSurvival() {
  const state = getState();
  const cat = state.currentCat;
  const unlocked = getUnlockedStage(cat);

  let allCards = [];
  for (let i = 0; i <= unlocked; i++) {
    const items = stageItems(cat, i);
    allCards = allCards.concat(items.map((item, idx) => ({
      ...item,
      id: item[3] || `${cat}-${i}-${idx}`,
      en: item[0],
      es: item[1],
      ex: item[2],
    })));
  }

  if (allCards.length === 0) {
    showToast('No hay tarjetas disponibles', '⚠️', 2000);
    return;
  }

  allCards = shuffleArray(allCards);

  gameModeState.survival = {
    active: true,
    lives: SURVIVAL_START_LIVES,
    score: 0,
    streak: 0,
    difficulty: SURVIVAL_BASE_DIFFICULTY,
    cards: allCards,
    currentIndex: 0,
  };

  showView('survivalView');
  renderSurvivalUI();
  showNextSurvivalCard();
}

function renderSurvivalUI() {
  const container = document.getElementById('survivalView');
  if (!container) return;

  const { survival } = gameModeState;
  container.innerHTML = `
    <div class="survivalHeader">
      <div class="survivalLives" id="survivalLives">${'❤️'.repeat(survival.lives)}</div>
      <div class="survivalScore">🏅 ${survival.score} pts | 🔥 Racha: ${survival.streak}</div>
    </div>
    <div class="survivalCard" id="survivalCard">
      <div class="card-inner" onclick="window.VocabriGameModes?.flipSurvivalCard()">
        <div class="face front">
          <span class="tag">EN</span>
          <p id="survivalFrontText"></p>
        </div>
        <div class="face back">
          <span class="tag">ES</span>
          <p id="survivalBackText"></p>
        </div>
      </div>
    </div>
    <div class="survivalActions">
      <button class="nav hover-scale focus-glow rateBtn rateGood" id="survivalKnowBtn" type="button">✓ Sabía</button>
      <button class="nav hover-scale focus-glow rateBtn rateHard" id="survivalDontKnowBtn" type="button">✗ No sabía</button>
    </div>
    <div class="survivalProgress">
      <div class="progBarOuter"><div class="progBarFill" id="survivalProgBar" style="width:0%"></div></div>
    </div>
    <div class="survivalDifficulty" id="survivalDifficulty">Dificultad: ${Math.round(survival.difficulty * 100)}%</div>
    <button class="nav dangerBtn hover-scale focus-glow" id="survivalQuitBtn" type="button" style="margin-top:16px;">Rendirse</button>
  `;

  document.getElementById('survivalKnowBtn').onclick = () => handleSurvivalAnswer(true);
  document.getElementById('survivalDontKnowBtn').onclick = () => handleSurvivalAnswer(false);
  document.getElementById('survivalQuitBtn').onclick = () => endSurvival(true);
}

function showNextSurvivalCard() {
  const { survival } = gameModeState;
  if (survival.currentIndex >= survival.cards.length) {
    survival.currentIndex = 0;
    survival.cards = shuffleArray(survival.cards);
    // Aumentar dificultad cada ciclo
    survival.difficulty = Math.min(0.8, survival.difficulty + 0.05);
    document.getElementById('survivalDifficulty').textContent = `Dificultad: ${Math.round(survival.difficulty * 100)}%`;
  }

  const card = survival.cards[survival.currentIndex];
  document.getElementById('survivalFrontText').textContent = card.en;
  document.getElementById('survivalBackText').textContent = card.es;
  document.getElementById('survivalCard').classList.remove('flipped');
  document.getElementById('survivalProgBar').style.width = `${((survival.currentIndex) / survival.cards.length) * 100}%`;
}

function handleSurvivalAnswer(knew) {
  const { survival } = gameModeState;
  if (!survival.active) return;

  if (knew) {
    survival.score += 10 + survival.streak * 2; // Bonus por racha
    survival.streak++;
    addXP(5);
  } else {
    survival.lives--;
    survival.streak = 0;
    updateSurvivalLives();
    if (survival.lives <= 0) {
      endSurvival();
      return;
    }
  }

  survival.currentIndex++;
  document.getElementById('survivalScore').textContent = `🏅 ${survival.score} pts | 🔥 Racha: ${survival.streak}`;
  showNextSurvivalCard();
}

function updateSurvivalLives() {
  const { survival } = gameModeState;
  document.getElementById('survivalLives').textContent = '❤️'.repeat(survival.lives) + '🖤'.repeat(SURVIVAL_MAX_LIVES - survival.lives);
}

function endSurvival(quit = false) {
  const { survival } = gameModeState;
  survival.active = false;

  const state = getState();
  const isHighScore = survival.score > (state.survivalHighScore || 0);
  if (isHighScore) {
    updateState({ survivalHighScore: survival.score });
    persistState();
    showToast(`🏆 ¡Nuevo récord supervivencia: ${survival.score} pts!`, '🏆', 3000);
  }

  const msg = `Supervivencia terminada. Puntuación: ${survival.score} pts | Racha máx: ${survival.streak}`;

  vbPrompt({
    icon: '💀',
    title: 'Fin de la Supervivencia',
    text: msg,
    buttons: [
      { label: 'Reintentar', primary: true, onClick: () => startSurvival() },
      { label: 'Volver al mapa', onClick: () => showView('cardsView') },
    ],
  });
}

// ============================================================
// DICTADO PURO
// ============================================================
function startDictationMode() {
  const state = getState();
  const cat = state.currentCat;
  const unlocked = getUnlockedStage(cat);

  let allCards = [];
  for (let i = 0; i <= unlocked; i++) {
    const items = stageItems(cat, i);
    allCards = allCards.concat(items.map((item, idx) => ({
      ...item,
      id: item[3] || `${cat}-${i}-${idx}`,
      en: item[0],
      es: item[1],
    })));
  }

  if (allCards.length === 0) {
    showToast('No hay tarjetas disponibles', '⚠️', 2000);
    return;
  }

  allCards = shuffleArray(allCards).slice(0, 20);

  gameModeState.dictation = {
    active: true,
    cards: allCards,
    currentIndex: 0,
    score: 0,
    correct: 0,
  };

  showView('dictationView');
  renderDictationUI();
  playDictationAudio();
}

function renderDictationUI() {
  const container = document.getElementById('dictationView');
  if (!container) return;

  container.innerHTML = `
    <div class="dictationHeader">
      <div class="dictationScore">🎧 ${gameModeState.dictation.score} pts (✓${gameModeState.dictation.correct}/${gameModeState.dictation.cards.length})</div>
    </div>
    <div class="dictationCard">
      <div class="dictationAudio">
        <button class="nav hover-scale focus-glow" id="dictationPlayBtn" type="button">🔊 Escuchar</button>
        <button class="nav hover-scale focus-glow" id="dictationSlowBtn" type="button">🐢 Lento</button>
      </div>
      <input type="text" id="dictationInput" class="search focus-glow" placeholder="Escribe lo que escuchaste en inglés..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" lang="en">
      <button class="nav hover-scale focus-glow" id="dictationCheckBtn" type="button" style="width:100%; margin-top:8px;">Verificar</button>
      <button class="linkBtn hover-scale focus-glow" id="dictationSkipBtn" type="button" style="margin-top:8px;">Omitir</button>
    </div>
    <div class="dictationFeedback" id="dictationFeedback" style="display:none;"></div>
    <div class="dictationProgress">
      <div class="progBarOuter"><div class="progBarFill" id="dictationProgBar" style="width:0%"></div></div>
    </div>
    <button class="nav dangerBtn hover-scale focus-glow" id="dictationQuitBtn" type="button" style="margin-top:16px;">Salir</button>
  `;

  document.getElementById('dictationPlayBtn').onclick = () => playDictationAudio(false);
  document.getElementById('dictationSlowBtn').onclick = () => playDictationAudio(true);
  document.getElementById('dictationCheckBtn').onclick = checkDictationAnswer;
  document.getElementById('dictationSkipBtn').onclick = skipDictationCard;
  document.getElementById('dictationQuitBtn').onclick = () => endDictation(true);

  // Enter para verificar
  document.getElementById('dictationInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkDictationAnswer();
  });

  document.getElementById('dictationInput').focus();
}

function playDictationAudio(slow = false) {
  const { dictation } = gameModeState;
  const card = dictation.cards[dictation.currentIndex];
  speakText(card.en, 'en', slow ? 0.6 : 1.0);
}

function checkDictationAnswer() {
  const { dictation } = gameModeState;
  const input = document.getElementById('dictationInput').value.trim().toLowerCase();
  const card = dictation.cards[dictation.currentIndex];
  const target = card.en.toLowerCase();

  const feedback = document.getElementById('dictationFeedback');
  const similarity = levenshteinSimilarity(input, target);

  if (similarity >= 0.85) {
    dictation.score += 10;
    dictation.correct++;
    feedback.textContent = '✅ ¡Correcto!';
    feedback.className = 'dictationFeedback success';
    addXP(5);
  } else {
    feedback.textContent = `❌ Era: "${card.en}"`;
    feedback.className = 'dictationFeedback error';
  }
  feedback.style.display = 'block';

  setTimeout(() => {
    nextDictationCard();
  }, 1500);
}

function skipDictationCard() {
  const { dictation } = gameModeState;
  const card = dictation.cards[dictation.currentIndex];
  const feedback = document.getElementById('dictationFeedback');
  feedback.textContent = `⏭️ Era: "${card.en}"`;
  feedback.className = 'dictationFeedback warning';
  feedback.style.display = 'block';
  setTimeout(() => nextDictationCard(), 1500);
}

function nextDictationCard() {
  const { dictation } = gameModeState;
  dictation.currentIndex++;
  document.getElementById('dictationInput').value = '';
  document.getElementById('dictationFeedback').style.display = 'none';
  document.getElementById('dictationProgBar').style.width = `${(dictation.currentIndex / dictation.cards.length) * 100}%`;
  document.getElementById('dictationScore').textContent = `🎧 ${dictation.score} pts (✓${dictation.correct}/${dictation.cards.length})`;

  if (dictation.currentIndex >= dictation.cards.length) {
    endDictation();
  } else {
    playDictationAudio();
  }
}

function endDictation(quit = false) {
  const { dictation } = gameModeState;
  dictation.active = false;

  const msg = `Dictado completado. Puntuación: ${dictation.score} pts (${dictation.correct}/${dictation.cards.length} correctas)`;

  vbPrompt({
    icon: '🎧',
    title: 'Dictado Finalizado',
    text: msg,
    buttons: [
      { label: 'Otra ronda', primary: true, onClick: () => startDictationMode() },
      { label: 'Volver al mapa', onClick: () => showView('cardsView') },
    ],
  });
}

// ============================================================
// DUELO (PvP Local - 2 jugadores)
// ============================================================
function startDuel() {
  vbPrompt({
    icon: '⚔️',
    title: 'Modo Duelo',
    text: 'Dos jugadores, mismo dispositivo. Turnos alternados. ¿Listos?',
    buttons: [
      { label: '¡Empezar!', primary: true, onClick: initDuel },
      { label: 'Cancelar', onClick: () => {} },
    ],
  });
}

function initDuel() {
  const state = getState();
  const cat = state.currentCat;
  const unlocked = getUnlockedStage(cat);

  let allCards = [];
  for (let i = 0; i <= unlocked; i++) {
    const items = stageItems(cat, i);
    allCards = allCards.concat(items.map((item, idx) => ({
      ...item,
      id: item[3] || `${cat}-${i}-${idx}`,
      en: item[0],
      es: item[1],
    })));
  }

  if (allCards.length < 10) {
    showToast('Se necesitan al menos 10 tarjetas', '⚠️', 2000);
    return;
  }

  allCards = shuffleArray(allCards).slice(0, 20);

  gameModeState.duel = {
    active: true,
    player1: { score: 0, name: 'Jugador 1' },
    player2: { score: 0, name: 'Jugador 2' },
    currentPlayer: 1,
    cards: allCards,
    currentIndex: 0,
    turn: 1, // 1 o 2
  };

  showView('duelView');
  renderDuelUI();
  showNextDuelCard();
}

function renderDuelUI() {
  const container = document.getElementById('duelView');
  if (!container) return;

  const { duel } = gameModeState;
  const currentPlayer = duel.turn === 1 ? duel.player1 : duel.player2;
  const otherPlayer = duel.turn === 1 ? duel.player2 : duel.player1;

  container.innerHTML = `
    <div class="duelHeader">
      <div class="duelScores">
        <div class="duelPlayer ${duel.turn === 1 ? 'active' : ''}">
          <span>${duel.player1.name}</span>
          <strong>${duel.player1.score} pts</strong>
        </div>
        <div class="duelVS">VS</div>
        <div class="duelPlayer ${duel.turn === 2 ? 'active' : ''}">
          <span>${duel.player2.name}</span>
          <strong>${duel.player2.score} pts</strong>
        </div>
      </div>
      <div class="duelTurn">Turno de: <strong>${currentPlayer.name}</strong></div>
    </div>
    <div class="duelCard" id="duelCard">
      <div class="card-inner" onclick="window.VocabriGameModes?.flipDuelCard()">
        <div class="face front">
          <span class="tag">EN</span>
          <p id="duelFrontText"></p>
        </div>
        <div class="face back">
          <span class="tag">ES</span>
          <p id="duelBackText"></p>
        </div>
      </div>
    </div>
    <div class="duelActions">
      <button class="nav hover-scale focus-glow rateBtn rateGood" id="duelKnowBtn" type="button">✓ Sabía</button>
      <button class="nav hover-scale focus-glow rateBtn rateHard" id="duelDontKnowBtn" type="button">✗ No sabía</button>
    </div>
    <div class="duelProgress">
      <div class="progBarOuter"><div class="progBarFill" id="duelProgBar" style="width:0%"></div></div>
    </div>
    <button class="nav dangerBtn hover-scale focus-glow" id="duelQuitBtn" type="button" style="margin-top:16px;">Terminar duelo</button>
  `;

  document.getElementById('duelKnowBtn').onclick = () => handleDuelAnswer(true);
  document.getElementById('duelDontKnowBtn').onclick = () => handleDuelAnswer(false);
  document.getElementById('duelQuitBtn').onclick = () => endDuel(true);
}

function showNextDuelCard() {
  const { duel } = gameModeState;
  if (duel.currentIndex >= duel.cards.length) {
    endDuel();
    return;
  }

  const card = duel.cards[duel.currentIndex];
  document.getElementById('duelFrontText').textContent = card.en;
  document.getElementById('duelBackText').textContent = card.es;
  document.getElementById('duelCard').classList.remove('flipped');
  document.getElementById('duelProgBar').style.width = `${(duel.currentIndex / duel.cards.length) * 100}%`;

  // Actualizar UI de turno
  renderDuelUI();
}

function handleDuelAnswer(knew) {
  const { duel } = gameModeState;
  if (!duel.active) return;

  const currentPlayer = duel.turn === 1 ? duel.player1 : duel.player2;
  if (knew) {
    currentPlayer.score += 10;
  }

  duel.currentIndex++;
  duel.turn = duel.turn === 1 ? 2 : 1;

  if (duel.currentIndex >= duel.cards.length) {
    endDuel();
  } else {
    showNextDuelCard();
  }
}

function endDuel(quit = false) {
  const { duel } = gameModeState;
  duel.active = false;

  const winner = duel.player1.score > duel.player2.score ? duel.player1 : duel.player2;
  const isTie = duel.player1.score === duel.player2.score;

  let msg;
  if (isTie) {
    msg = `¡Empate! ${duel.player1.score} - ${duel.player2.score}`;
  } else {
    msg = `¡${winner.name} gana! ${duel.player1.score} - ${duel.player2.score}`;
  }

  vbPrompt({
    icon: '⚔️',
    title: 'Duelo Terminado',
    text: msg,
    buttons: [
      { label: 'Revancha', primary: true, onClick: () => startDuel() },
      { label: 'Volver al mapa', onClick: () => showView('cardsView') },
    ],
  });
}

// ============================================================
// UTILIDADES
// ============================================================
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function levenshteinSimilarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(a.length, b.length);
  return 1 - matrix[b.length][a.length] / maxLen;
}

// ============================================================
// EXPORTACIONES
// ============================================================
export {
  startSpeedRun,
  startSurvival,
  startDictationMode,
  startDuel,
  gameModeState,
};

window.VocabriGameModes = {
  startSpeedRun,
  startSurvival,
  startDictationMode,
  startDuel,
  flipSpeedRunCard: () => document.getElementById('speedRunCard')?.classList.toggle('flipped'),
  flipSurvivalCard: () => document.getElementById('survivalCard')?.classList.toggle('flipped'),
  flipDuelCard: () => document.getElementById('duelCard')?.classList.toggle('flipped'),
};
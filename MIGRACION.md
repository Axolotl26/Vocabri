# Corrección de la modularización de Vocabri

## Causa del bug
`app/main.js` importaba 46 nombres que los módulos no exportaban (`initLesson`, `initExam`, `checkExamAnswer`, …).
En ES modules un solo import faltante hace fallar el enlace de TODO el grafo: ningún módulo se ejecutaba, por eso
"Comenzar" no hacía nada. Además había identificadores sin definir (`showToast`, `DATA`, `categoryMap` fuera de
su bloque en `phraseLoader.js`), claves de localStorage inventadas (rompían el progreso guardado), lógica duplicada y
~90 IDs de DOM que no existen en `index.html`.

## Qué se hizo
Los módulos se regeneraron a partir de tu `app.js` original (misma lógica, mismos IDs y mismas claves de
localStorage), conservando tus nombres de archivo:
core/dataRegistry, mapData, mapRenderer, map, state, ui, lesson, progress, review, myCards, profile, speech, exam,
settings, translator, sync, main.

* Las variables `let` de nivel superior compartidas viven en `app/core/shared.js` (`S.nombre`).
* Las sentencias imperativas del original (cablear botones, etc.) se exportan en `__inits` con su línea original y
  `main.js` las ejecuta en el mismo orden que el monolito.
* `phraseLoader.js` corregido: rellena `DATA` vía `initializeDataRegistry` y alias `general = Casual`.
* `DATA.general` ya existe (antes faltaba el contenido Casual).

## Verificación (Chromium headless + vitest)
Comenzar → idioma → onboarding → mapa → lección → calificar → etapa completada; examen; repaso; progreso;
Mis Tarjetas (crear); traductor; perfil/compartir; ajustes; respaldo; borrar progreso: sin errores de consola.
vitest: 202/202.

## Pendiente / a tener en cuenta
* `gameModes.js`, `keyboard.js`, `accessibility.js` NO se incluyen: dependen de vistas (speedRun, survival, duel,
  dictation…) y IDs que no existen en `index.html`, y los atajos ya están en el código original.
* `src/core/*` (con sus tests) no está conectado a la app: el original tiene esa lógica inline.
* `config.js` no crea `window.VocabriFirebase`: la sincronización en la nube queda inactiva hasta que se cargue el
  módulo de Firebase (el app lo detecta y no falla).
* Se probó con un index.html y JSON de prueba con los mismos IDs; conviene que lo pruebes con tus assets reales.

/* Vocabri — Service Worker
 *
 *  - Offline shell (stale-while-revalidate for same-origin GET requests).
 *  - Controlled updates: a new worker WAITS until the page sends { type: 'SKIP_WAITING' }.
 *  - Old caches are removed on `activate`.
 *  - Daily reminders: shows a local notification (registration.showNotification) from a
 *    Periodic Background Sync event when today's goal isn't completed.
 *
 *  When you change any shipped file, bump CACHE_VERSION (and the ?v= in index.html)
 *  so installed apps detect the new version and show "✨ Nueva versión disponible".
 */
const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'vocabri-';
const CACHE_NAME = CACHE_PREFIX + 'shell-' + CACHE_VERSION;

// Small JSON written by the page (app.js) and read here; it must survive version cleanups.
const STATE_CACHE = 'vocabri-state';
const STATE_URL = './vocabri-reminder-state.json';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css?v=1',
  './app.js?v=1',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// ---- Reminders (keep in sync with app.js) ----
const REMINDER_TAG = 'vocabri-daily-reminder';
const REMINDER_START_HOUR = 10;   // local time window in which a reminder may be sent
const REMINDER_END_HOUR = 22;
const REMINDER_MESSAGES = [
  '🔥 ¡No pierdas tu racha en Vocabri! Completa tu lección de hoy.',
  '🎯 Tu meta diaria te está esperando en Vocabri. ¡Tú puedes!',
  '📚 Unos minutos hoy hacen la diferencia. ¡Vamos con tu meta diaria!',
  '💪 Un pequeño repaso hoy es un gran progreso mañana. ¡Entra a Vocabri!'
];

/* ------------------------------ install ------------------------------ */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Add one by one so a single missing file can't abort the whole install.
    await Promise.allSettled(
      PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
    );
  })());
  // No skipWaiting() here on purpose: the page decides when to switch (see 'message').
});

/* ------------------------------ activate ----------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME && key !== STATE_CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

/* ------------------------------ message ------------------------------ */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ------------------------------- fetch ------------------------------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;              // fonts, Google sign-in, translation APIs → network
  if (url.pathname.endsWith('/vocabri-reminder-state.json')) return;

  if (req.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(event, req, './index.html'));
    return;
  }
  event.respondWith(staleWhileRevalidate(event, req, req));
});

async function staleWhileRevalidate(event, req, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey);

  const refresh = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(cacheKey, res.clone());
      return res;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(refresh);          // update the cache in the background
    return cached;
  }
  const fresh = await refresh;
  if (fresh) return fresh;
  return (await cache.match('./index.html')) || Response.error();
}

/* ------------------------- daily reminder logic ----------------------- */
function localDateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}
async function readState() {
  try {
    const cache = await caches.open(STATE_CACHE);
    const res = await cache.match(STATE_URL);
    return res ? await res.json() : null;
  } catch (e) { return null; }
}
async function writeState(state) {
  const cache = await caches.open(STATE_CACHE);
  await cache.put(STATE_URL, new Response(JSON.stringify(state), {
    headers: { 'Content-Type': 'application/json' }
  }));
}
function pickReminderBody(state, now) {
  const yesterday = new Date(now.getTime() - 86400000);
  const streakAlive = state.streak >= 2 &&
    (state.date === localDateKey(now) || state.date === localDateKey(yesterday));
  if (streakAlive) {
    return '🔥 Llevas ' + state.streak + ' días seguidos en Vocabri. ¡No pierdas tu racha! Completa tu lección de hoy.';
  }
  const dayNumber = Math.floor(now.getTime() / 86400000);
  return REMINDER_MESSAGES[dayNumber % REMINDER_MESSAGES.length];
}

async function checkAndNotify() {
  const state = await readState();
  if (!state || !state.enabled) return;
  if (self.Notification && Notification.permission !== 'granted') return;

  const now = new Date();
  const today = localDateKey(now);
  const goalDoneToday = state.date === today && state.goalDone === true;
  if (goalDoneToday) return;                          // goal already completed today
  if (state.lastReminderDate === today) return;       // one reminder per day
  const hour = now.getHours();
  if (hour < REMINDER_START_HOUR || hour >= REMINDER_END_HOUR) return;

  // Don't interrupt someone who is already using the app.
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (windows.some((c) => c.visibilityState === 'visible')) return;

  await self.registration.showNotification('Vocabri', {
    body: pickReminderBody(state, now),
    tag: REMINDER_TAG,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    lang: 'es',
    data: { url: './' }
  });
  state.lastReminderDate = today;
  await writeState(state);
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === REMINDER_TAG) event.waitUntil(checkAndNotify());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) return client.focus();
    }
    return self.clients.openWindow(target);
  })());
});

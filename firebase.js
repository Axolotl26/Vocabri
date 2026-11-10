/**
 * Vocabri — puente con Firebase (Auth con Google + Firestore).
 * Se carga como <script type="module" src="firebase.js"></script> DESPUÉS de config.js.
 *
 * Expone:
 *   window.vocabriLoadFirebase()    -> Promise; carga el SDK (una sola vez) y se puede volver a llamar si falló
 *                                      (p. ej. al volver la conexión). Rechaza con un Error cuyo .code es
 *                                      'vocabri/not-configured', 'vocabri/offline' o 'vocabri/sdk-failed'.
 *   window.VocabriFirebase          -> la API que usa app/sync.js (cuando ya cargó)
 *   window.VocabriFirebaseUnavailable -> {code, message} si no está disponible (null si todo bien); sirve para
 *                                      quien se suscribe tarde y se perdió el evento
 * Eventos:
 *   'vocabri-firebase-ready'        -> todo listo
 *   'vocabri-firebase-unavailable'  -> sin config o el SDK no cargó (la app sigue funcionando en local)
 */
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

let mods = null;       // módulos del SDK ya importados
let inst = null;       // app, auth y Firestore ya creados (se crean una sola vez aunque se reintente)
let loading = null;    // carga en curso (evita cargas duplicadas)

function unavailable(code, message){
  const detail = { code, message };
  window.VocabriFirebaseUnavailable = detail;
  window.dispatchEvent(new CustomEvent('vocabri-firebase-unavailable', { detail }));
  const err = new Error(message || code);
  err.code = code;
  return err;
}

async function load(){
  if (window.VocabriFirebase) return window.VocabriFirebase;
  const cfg = window.VocabriConfig && window.VocabriConfig.firebaseConfig;
  if (!cfg || !cfg.apiKey) throw unavailable('vocabri/not-configured', 'Falta firebaseConfig en config.js');
  // Sin conexión no intentamos importar el SDK: el navegador recuerda un import fallido hasta que se recarga la página,
  // así que un intento a ciegas dejaría Firebase inservible aunque luego vuelva internet.
  if (navigator.onLine === false) throw unavailable('vocabri/offline', 'Sin conexión: la sincronización se activará al volver internet');
  try {
    if (!mods) {
      const [app, auth, fs] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`)
      ]);
      mods = { app, auth, fs };
    }
    const { app: A, auth, fs } = mods;
    if (!inst) {
      const app = A.initializeApp(cfg);
      const a = auth.getAuth(app);
      const db = fs.initializeFirestore(app, {
        localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
      });
      inst = { a, db };
    }
    const { a, db } = inst;
    const provider = new auth.GoogleAuthProvider();
    const progressRef = (uid) => fs.doc(db, 'users', uid, 'data', 'progress');

    window.VocabriFirebase = {
      onAuthStateChanged: (cb) => auth.onAuthStateChanged(a, cb),
      redirectResult: () => auth.getRedirectResult(a),
      async signIn() {
        try { return await auth.signInWithPopup(a, provider); }
        catch (e) {
          // Popup bloqueado (móviles / PWA): usar redirección.
          if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-environment')) {
            return auth.signInWithRedirect(a, provider);
          }
          throw e;
        }
      },
      signOut: () => auth.signOut(a),
      upsertUser: (uid, info) =>
        fs.setDoc(fs.doc(db, 'users', uid), { ...info, lastSeen: fs.serverTimestamp() }, { merge: true }),
      async getProgress(uid) {
        const snap = await fs.getDoc(progressRef(uid));
        return snap.exists() ? snap.data() : null;
      },
      setProgress: (uid, payload) => fs.setDoc(progressRef(uid), payload)
    };
    window.VocabriFirebaseUnavailable = null;
    window.dispatchEvent(new CustomEvent('vocabri-firebase-ready'));
    return window.VocabriFirebase;
  } catch (err) {
    console.warn('[firebase] no disponible:', err);
    throw unavailable('vocabri/sdk-failed', String(err && err.message || err));
  }
}

window.vocabriLoadFirebase = function vocabriLoadFirebase(){
  if (!loading) loading = load().finally(() => { loading = null; });
  return loading;
};

// Arranque: se intenta cargar al abrir la app; si falla (sin conexión), sync.js lo reintenta al volver la red.
window.vocabriLoadFirebase().catch(() => {});

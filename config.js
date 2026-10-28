/**
 * Vocabri — Firebase Configuration
 *
 * This file contains the PUBLIC Firebase configuration keys.
 * These are safe to include in client-side code (they're meant to be public).
 *
 * For production, consider using environment-specific configs.
 * Never commit service account keys or admin SDK credentials here.
 */

// Firebase configuration - replace with your project's values
const firebaseConfig = {
  apiKey: "AIzaSyBwlMVUzgjDmIFB92N55ZI2RhdyI2k75nU",
  authDomain: "vocabri-9571e.firebaseapp.com",
  projectId: "vocabri-9571e",
  storageBucket: "vocabri-9571e.firebasestorage.app",
  messagingSenderId: "718289834673",
  appId: "1:718289834673:web:caa9c068ce7b27fa85c890",
  measurementId: "G-DY5KLZSQKM"
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
}

// Also expose globally for non-module scripts
if (typeof window !== 'undefined') {
  window.VocabriConfig = { firebaseConfig };
}
/**
 * Sticker System for Vocabri
 * Loads the sticker manifest and provides semantic access to stickers
 * Integrates with the existing MASCOT system and extends it with rich sticker library
 */

const STICKER_BASE = './assets/stickers/';

class StickerSystem {
  constructor() {
    this.manifest = null;
    this.loaded = false;
    this.preloadCache = new Set();
    this.randomCache = new Map(); // Cache for random selections per context
  }

  async load() {
    if (this.loaded) return this;

    try {
      const response = await fetch('./assets/stickers/sticker-manifest.json');
      if (!response.ok) throw new Error('Failed to load manifest');
      this.manifest = await response.json();
      this.loaded = true;
      this.preloadCommonStickers();
      console.log('[Stickers] Manifest loaded:', Object.keys(this.manifest.categories));
    } catch (e) {
      console.warn('[Stickers] Could not load manifest, using fallback:', e);
      this.loaded = false;
    }
    return this;
  }

  preloadCommonStickers() {
    // Preload frequently used stickers for instant display
    const commonTags = ['celebration', 'encouragement', 'thinking', 'happy', 'sad'];
    commonTags.forEach(tag => {
      this.getRandomSticker(tag).forEach(path => {
        if (!this.preloadCache.has(path)) {
          const img = new Image();
          img.src = path;
          this.preloadCache.add(path);
        }
      });
    });
  }

  // Get full path for a sticker filename
  getPath(filename, folder) {
    return STICKER_BASE + folder + '/' + filename;
  }

  // Get all stickers for a semantic tag
  getStickersForTag(tag) {
    if (!this.loaded || !this.manifest || !this.manifest.semanticTags[tag]) return [];
    const filenames = this.manifest.semanticTags[tag];
    return filenames.map(f => this.resolvePath(f));
  }

  // Get random sticker(s) for a semantic tag
  getRandomSticker(tag, count = 1) {
    const stickers = this.getStickersForTag(tag);
    if (!stickers.length) return count === 1 ? './assets/stickers/ajolotes_emociones/feliz_brazos_arriba.png' : ['./assets/stickers/ajolotes_emociones/feliz_brazos_arriba.png'];

    const shuffled = [...stickers].sort(() => Math.random() - 0.5);
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
  }

  // Get stickers for a specific context (uses contextMapping)
  getStickersForContext(context) {
    if (!this.loaded || !this.manifest || !this.manifest.contextMapping[context]) {
      return this.getRandomSticker('encouragement');
    }
    const tags = this.manifest.contextMapping[context];
    // Combine all stickers from all tags for this context
    const allStickers = tags.flatMap(tag => this.getStickersForTag(tag));
    return allStickers.length ? allStickers : this.getRandomSticker('encouragement');
  }

  getRandomStickerForContext(context) {
    const stickers = this.getStickersForContext(context);
    return stickers[Math.floor(Math.random() * stickers.length)];
  }

  // Resolve a filename to full path by checking all folders
  resolvePath(filename) {
    if (!this.loaded || !this.manifest) return STICKER_BASE + 'ajolotes_emociones/' + filename;

    for (const [catKey, cat] of Object.entries(this.manifest.categories)) {
      for (const [subKey, files] of Object.entries(cat.stickers)) {
        if (files.includes(filename)) {
          return STICKER_BASE + cat.folder + '/' + filename;
        }
      }
    }
    return STICKER_BASE + 'ajolotes_emociones/' + filename;
  }

  // Get color variant stickers (for avatar customization, achievements)
  getColorVariants() {
    if (!this.loaded || !this.manifest) return [];
    const variants = [];
    for (const [color, files] of Object.entries(this.manifest.categories.colores_variantes.stickers)) {
      files.forEach(f => variants.push({color, path: this.resolvePath(f)}));
    }
    return variants;
  }

  // Get family/emoji stickers
  getFamilyStickers() {
    if (!this.loaded || !this.manifest) return [];
    const families = [];
    for (const [subKey, files] of Object.entries(this.manifest.categories.familias_emojis.stickers)) {
      files.forEach(f => families.push({type: subKey, path: this.resolvePath(f)}));
    }
    return families;
  }

  // Get all emotion categories
  getEmotionCategories() {
    if (!this.loaded || !this.manifest) return {};
    return this.manifest.categories.emociones.stickers;
  }

  // Get a specific emotion sticker
  getEmotion(emotion) {
    if (!this.loaded || !this.manifest) return this.resolvePath('feliz_brazos_arriba.png');
    const files = this.manifest.categories.emociones.stickers[emotion];
    if (!files || !files.length) return this.resolvePath('feliz_brazos_arriba.png');
    return this.resolvePath(files[Math.floor(Math.random() * files.length)]);
  }
}

// Global instance
window.StickerSystem = new StickerSystem();

// Backward compatibility: Enhanced MASCOT object that uses sticker system
// This will be populated after manifest loads
const STICKER_MASCOT = {
  happy: './assets/stickers/ajolotes_emociones/feliz_brazos_arriba.png',
  thinking: './assets/stickers/ajolotes_emociones/pensando_idea_o_duda.png',
  sad: './assets/stickers/ajolotes_emociones/triste_llorando.png',
  scared: './assets/stickers/ajolotes_emociones/asustado_manos_en_mejillas.png',
  hero: './assets/stickers/ajolotes_emociones/feliz_brazos_arriba.png',
  // New emotional states from sticker library
  celebrating: null, // Will be filled after load
  confused: null,
  surprised: null,
  angry: null,
  sleepy: null,
  love: null,
  reading: null,
  walking: null,
  dancing: null,
  floating: null,
  gold: null,
  rainbow: null,
  silver: null
};

// Initialize and enhance MASCOT after load
window.StickerSystem.load().then(() => {
  const ss = window.StickerSystem;

  // Map new emotional states to stickers
  STICKER_MASCOT.celebrating = ss.getRandomSticker('celebration');
  STICKER_MASCOT.confused = ss.getRandomSticker('confused');
  STICKER_MASCOT.surprised = ss.getRandomSticker('surprised');
  STICKER_MASCOT.angry = ss.getRandomSticker('angry');
  STICKER_MASCOT.sleepy = ss.getRandomSticker('sleepy');
  STICKER_MASCOT.love = ss.getRandomSticker('love');
  STICKER_MASCOT.reading = ss.getRandomSticker('reading');
  STICKER_MASCOT.walking = ss.getRandomSticker('walking');
  STICKER_MASCOT.dancing = ss.getRandomSticker('dancing');
  STICKER_MASCOT.floating = ss.getRandomSticker('floating');
  STICKER_MASCOT.gold = ss.getRandomSticker('special_gold');
  STICKER_MASCOT.rainbow = ss.getRandomSticker('special_rainbow');
  STICKER_MASCOT.silver = ss.getRandomSticker('special_silver');

  // Also update the global MASCOT if it exists (for backward compatibility)
  if (window.MASCOT) {
    Object.assign(window.MASCOT, STICKER_MASCOT);
  }

  console.log('[Stickers] Enhanced MASCOT ready with', Object.keys(STICKER_MASCOT).length, 'states');
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StickerSystem, STICKER_MASCOT };
}
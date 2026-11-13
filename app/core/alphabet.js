// Vocabri — datos del abecedario inglés (puro, sin DOM).
// `say`: texto que lee la voz (el nombre de la letra escrito como palabra, para que no la lea como "a" suelta).
// `es`: aproximación en español de cómo suena el nombre de la letra (inglés americano).
export const ALPHABET = [
  { l: 'A', say: 'ay',     es: 'ei',      word: 'Apple',    wordEs: 'manzana' },
  { l: 'B', say: 'bee',    es: 'bi',      word: 'Banana',   wordEs: 'plátano' },
  { l: 'C', say: 'see',    es: 'si',      word: 'Cat',      wordEs: 'gato' },
  { l: 'D', say: 'dee',    es: 'di',      word: 'Dog',      wordEs: 'perro' },
  { l: 'E', say: 'ee',     es: 'i',       word: 'Egg',      wordEs: 'huevo', tip: 'La E suena como nuestra «i», no como «e».' },
  { l: 'F', say: 'eff',    es: 'ef',      word: 'Fish',     wordEs: 'pez' },
  { l: 'G', say: 'jee',    es: 'yi',      word: 'Green',    wordEs: 'verde', tip: 'La G suena «yi», no «ye» ni «ge».' },
  { l: 'H', say: 'aitch',  es: 'eich',    word: 'House',    wordEs: 'casa', tip: 'La H se llama «eich». Dentro de las palabras suena como una J muy suave.' },
  { l: 'I', say: 'eye',    es: 'ai',      word: 'Ice',      wordEs: 'hielo', tip: 'La I suena «ai», como la palabra «eye» (ojo).' },
  { l: 'J', say: 'jay',    es: 'yei',     word: 'Juice',    wordEs: 'jugo', tip: 'La J suena «yei», no como nuestra «jota».' },
  { l: 'K', say: 'kay',    es: 'kei',     word: 'Key',      wordEs: 'llave' },
  { l: 'L', say: 'ell',    es: 'el',      word: 'Lemon',    wordEs: 'limón' },
  { l: 'M', say: 'em',     es: 'em',      word: 'Moon',     wordEs: 'luna' },
  { l: 'N', say: 'en',     es: 'en',      word: 'Night',    wordEs: 'noche' },
  { l: 'O', say: 'oh',     es: 'ou',      word: 'Orange',   wordEs: 'naranja', tip: 'La O suena «ou», como en «go».' },
  { l: 'P', say: 'pee',    es: 'pi',      word: 'Pencil',   wordEs: 'lápiz' },
  { l: 'Q', say: 'queue',  es: 'kiu',     word: 'Queen',    wordEs: 'reina', tip: 'La Q suena «kiu», como la palabra «queue» (fila).' },
  { l: 'R', say: 'are',    es: 'ar',      word: 'Rain',     wordEs: 'lluvia', tip: 'La R se llama «ar», con la lengua sin vibrar.' },
  { l: 'S', say: 'ess',    es: 'es',      word: 'Sun',      wordEs: 'sol' },
  { l: 'T', say: 'tee',    es: 'ti',      word: 'Tree',     wordEs: 'árbol' },
  { l: 'U', say: 'you',    es: 'iu',      word: 'Umbrella', wordEs: 'paraguas', tip: 'La U suena «iu», como la palabra «you» (tú).' },
  { l: 'V', say: 'vee',    es: 'vi',      word: 'Violin',   wordEs: 'violín', tip: 'La V toca el labio inferior con los dientes de arriba; no es una B.' },
  { l: 'W', say: 'double you', es: 'dábol-iu', word: 'Water', wordEs: 'agua', tip: 'La W se llama «dábol-iu» (doble U).' },
  { l: 'X', say: 'ex',     es: 'eks',     word: 'X-ray',    wordEs: 'rayos X' },
  { l: 'Y', say: 'why',    es: 'uai',     word: 'Yellow',   wordEs: 'amarillo', tip: 'La Y suena «uai», como la palabra «why» (por qué).' },
  { l: 'Z', say: 'zee',    es: 'zi',      word: 'Zebra',    wordEs: 'cebra', tip: 'En EE. UU. es «zi»; en Reino Unido se dice «zed».' }
];
export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const isVowel = l => VOWELS.includes(String(l).toUpperCase());
// «C-A-T»: la palabra deletreada
export const spellWord = w => String(w).toUpperCase().replace(/[^A-Z]/g, '').split('').join('-');
// Texto que se lee para deletrear una palabra: cada letra por su nombre
export function spellSay(w){
  const by = new Map(ALPHABET.map(a => [a.l, a.say]));
  return String(w).toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => by.get(c)).join(', ');
}

# Guía: activar el orden de trazos (KanjiVG)

El botón **▶ Trazos** del modo ✍ Calcar anima el orden de escritura de cada kana y kanji.
Esos datos no vienen en el proyecto: se descargan una sola vez con `tools/fetch-kanjivg.mjs`.

## Qué necesitas
- **Node.js 18 o superior** (comprueba con `node -v`). Si no lo tienes: <https://nodejs.org>.
- Conexión a internet (solo para la descarga).
- Estar en la **raíz del repositorio** (la carpeta donde está `index.html`).

## Pasos
1. Abre una terminal (Linux/Mac) o PowerShell (Windows) y entra al repo:
   ```bash
   cd ruta/a/Vocabri
   ls            # debes ver index.html, app/, data/, tools/
   ```
2. Ejecuta el script:
   ```bash
   node tools/fetch-kanjivg.mjs
   ```
3. Verás un contador `NNN/310` y, al final:
   ```
   ✓ Descargados: 310 · ya estaban: 0 · fallidos: 0
   Listo. Sube la carpeta data/kanjivg/ junto con el resto del proyecto.
   ```
4. Comprueba que existe `data/kanjivg/` con archivos como `065e5.svg` (日) y `ATTRIBUTION.txt`.
5. Pruébalo en local: abre la app, ve a un kanji o kana → **✍ Calcar** → **▶ Trazos**.
6. Súbelo a GitHub:
   ```bash
   git add data/kanjivg tools docs
   git commit -m "Trazos KanjiVG para el modo Calcar"
   git push
   ```
   Tras publicar, haz una recarga forzada (Ctrl+Shift+R) para que el navegador baje los SVG.

## Detalles útiles
- El script se puede repetir: **salta lo que ya está** y solo reintenta lo que falló. `--force` lo vuelve a bajar todo.
- Nombres de archivo: el carácter en Unicode hexadecimal de 5 cifras (日 = U+65E5 → `065e5.svg`).
- Solo se bajan caracteres **sueltos** de los cursos (kana y kanji). Las palabras y los sonidos combinados (きゃ) no tienen trazos.
- Si añades kanji nuevos a un curso (`data/ja/*.json`), vuelve a ejecutar el script.
- Una vez vistos, los SVG quedan guardados por el service worker y funcionan sin conexión.

## Si falla
| Síntoma | Qué hacer |
|---|---|
| `No encuentro data/ja/` | Estás fuera de la raíz del repo. `cd` a la carpeta con `index.html`. |
| `fetch is not defined` / error de sintaxis | Node demasiado viejo. Actualiza a la 18+. |
| `Fallidos: … HTTP 404/403` | Vuelve a ejecutar; si persiste, abre `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/065e5.svg` en el navegador para comprobar que GitHub responde. |
| Sin internet / proxy | Usa la alternativa manual de abajo. |

## Alternativa manual (sin Node)
1. Descarga la última versión de <https://github.com/KanjiVG/kanjivg/releases> (archivo `kanjivg-AAAAMMDD-main.zip` o similar).
2. Descomprímelo: dentro hay una carpeta `kanji/` con archivos `065e5.svg`, `065e5-Kaisho.svg`, …
3. Copia a `data/kanjivg/` **solo los archivos sin guion** (por ejemplo `065e5.svg`; los `…-Kaisho.svg` son variantes y no se usan).
4. Crea `data/kanjivg/ATTRIBUTION.txt` con el texto de atribución (puedes copiarlo del script).

## Licencia (importante)
KanjiVG es © Ulrich Apel y colaboradores, **CC BY-SA 3.0**. Debes mantener la atribución (ya está en *Términos* y en el README)
y los archivos de `data/kanjivg/` siguen bajo esa misma licencia (el resto de Vocabri sigue bajo MIT).

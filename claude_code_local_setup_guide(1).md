# Guía de Configuración e Instalación de Free Claude Code

Guía rápida para la instalación, configuración y uso diario del proxy local de Claude Code utilizando **NVIDIA NIM** y **`uv`** en entornos Linux (MX Linux / i3wm).

## 📋 Requisitos Previos

* **Python & uv:** Tener instalado el gestor de paquetes `uv`.
* **Git:** Para clonar el repositorio.
* **API Key de NVIDIA NIM:** Guardada en un archivo `.env` dentro del proyecto del proxy.

---

## 🚀 Paso a Paso: Instalación Inicial

### Paso 1: Clonar el Repositorio

Abre tu terminal y clona la herramienta en tu directorio de preferencia (por ejemplo, en el directorio raíz de tu usuario):

```bash
git clone https://github.com/Alishahryar1/free-claude-code.git
cd free-claude-code
```

### Paso 2: Sincronizar Dependencias y Entorno Virtual

Crea el entorno virtual e instala las dependencias automáticamente utilizando `uv`:

```bash
uv sync
```

> **Nota:** Asegúrate de crear el archivo `.env` dentro de la carpeta `free-claude-code/` configurando la API Key del modelo asignado de NVIDIA NIM antes de iniciar el servidor.

---

## 🔄 Flujo de Trabajo Diario

El flujo de trabajo consta de dos partes: el **Servidor Proxy** ejecutándose en segundo plano y el **Cliente Interactivo** dentro del directorio de tu proyecto activo.

### 1. Iniciar el Servidor Proxy (Terminal Kitty)

Ejecuta el servidor local en una ventana de terminal separada o en segundo plano (por ejemplo, en Kitty):

```bash
uv run fcc-server
```

*Deja esta terminal abierta mientras trabajas.*

### 2. Iniciar el Cliente de Claude Code (En tu Proyecto Activo)

Abre la terminal integrada de **VS Code** en cualquier proyecto (por ejemplo, `Anatenea` o `Vocabri`) y ejecuta el cliente indicándole que trabaje sobre la carpeta actual (`.`):

```bash
PATH="$HOME/free-claude-code/.venv/bin:$PATH" uv run --directory . fcc-claude
```

---

## 💡 Aliases Recomendados (Opcional)

Para no escribir la ruta completa del cliente cada vez que cambies de proyecto en VS Code, puedes añadir los siguientes alias a tu archivo de configuración de terminal (`~/.bashrc` o `~/.zshrc`):

```bash
# Aliases para Free Claude Code
alias fcc-server="uv run --directory ~/free-claude-code fcc-server"
alias fcc-claude="PATH=\"\$HOME/free-claude-code/.venv/bin:\$PATH\" uv run --directory . fcc-claude"
```

Una vez añadidos, solo bastará con ejecutar `fcc-server` en Kitty y `fcc-claude` desde la terminal integrada de VS Code en cualquier proyecto.

---

## 🧠 Base de Conocimientos con Obsidian

Para asociar una base de conocimientos en Markdown a cualquier proyecto:

1. Crea la carpeta `knowledge/` en la raíz de tu proyecto.
2. Ábrela como bóveda (*Vault*) en **Obsidian**.
3. En el archivo `CLAUDE.md` de tu proyecto, añade la instrucción:

```markdown
# Contexto del Proyecto
- Consulta los archivos en `knowledge/` para revisar especificaciones técnicas y documentación.
```
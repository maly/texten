# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TEXTEN** is a browser-based interactive text adventure game engine built in JavaScript. The current game is "Gordonova farma" (Gordon's Farm), written in Czech, set in Colorado. The engine handles room exploration, item interactions, and natural-language command parsing with full Czech grammar support.

## Commands

```bash
# Start development server (Parcel, hot reload)
npm run dev

# Build for production (outputs to docs/gordon/ for GitHub Pages)
npm run build

# Lint (no test suite exists)
npx eslint js/ game/
```

## Architecture

### Entry Points
- **`index.html`** — HTML shell with canvas, video, and audio elements
- **`main.js`** — Bootstraps all modules, registers handlers, starts the `requestAnimationFrame` game loop

### Game Loop (`main.js`)
Each frame: poll keyboard → parse command → resolve ambiguities → execute verb (pre/run/post) → update atmosphere → tick timers.

### Core Engine (`js/`)

| File | Role |
|------|------|
| `game.js` | Central state: player location (`game.where`), item/room registries, attribute tracking |
| `parser.js` | Maps typed text to verb+param objects; pattern markers: `^`=exit, `%`=movable item here, `@`=any item here, `$`=inventory, `#`=near player, `&`=in crate, `*`=raw string |
| `display.js` | Canvas (650×490) text renderer; `printText()`, `printTextMultiline()` (async, waits for Enter), color variants |
| `keyboard.js` | Raw input; Enter=13, Backspace=8, Up=7 (recall last command); `doOutput` flag disables input during cutscenes |
| `FSM.js` | State machine: `begin → titlescreen → intro0 → game0` |
| `language.js` | Czech inflection (`flex()`), list formatting, shuffle utilities |
| `flexis.js` | Noun inflection tables for all 6 Czech grammatical cases |
| `timer.js` | Tick-based timer management |
| `music.js` / `video.js` | Audio/video element control with fade transitions |

### Game Content (`game/`)

| File | Role |
|------|------|
| `items.js` | Array of item definitions: `id`, `name`, `adj` (6 cases), `desc`, `attrs`, `where`, `strings`, `actions` |
| `rooms.js` | Array of room definitions: `id`, `title`, `desc`, `ext`, `exits`, `attrs`, `_enter` callback |
| `commands.js` | Verb definitions: `id`, `_cmd[]` (aliases), `_run()` async, `_prerun()`, `_postrun()`, error message fields |
| `strings.js` | Shared text constants |
| `room/road/` | Individual room modules (r1–r3, rstop, auto, gordvan, etc.) |
| `item/` | Individual item modules with custom action logic |
| `text/` | Intro sequence text scripts |

### Key Patterns

**Item attributes** (`attrs` array): `movable`, `nonmovable`, `crate` — control parser behavior and valid verbs.

**Command `_run()` receives**: `p` (parsed params with item/exit refs), `g` (game instance), `n` (syscmd helper).

**Async text display**: `display.printTextMultiline()` returns a Promise that resolves after the player presses Enter — use `await` in FSM states and command handlers.

**Ambiguity resolution**: When the parser matches multiple items or exits, it returns a Promise-based dialog. The game loop in `main.js` handles resolution before executing the command.

**Save/load**: Uses `lz-string` for compressed serialization (implemented in `commands.js`).

## Tech Stack

- **Bundler**: Parcel 2 (dev) / Parcel 1 (production build to `docs/gordon/`)
- **Language**: ES6+ with Babel transpilation (preset-env + stage-0)
- **Runtime deps**: jQuery 3.5, Bootstrap 4, lz-string, md5
- **Linting**: ESLint (ES6, CommonJS, browser + jQuery environments, double quotes)
- **Output**: GitHub Pages at `/gordon/` path

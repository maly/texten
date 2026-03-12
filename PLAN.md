# TEXTEN v2 — Implementační plán

## Cíle

Přepis enginu do moderního JS: ESM moduly, arrow funkce, async/await, žádné třídy.
Nový DSL (JSON), web editor (Svelte), NPC systém.

## Stack

| Vrstva  | Technologie                         |
|---------|-------------------------------------|
| Engine  | Vanilla ESM JS, Vite                |
| Editor  | Svelte 5 + Vite                     |
| Data    | JSON soubory                        |
| Display | DOM terminál (retro CSS)            |
| Testy   | Vitest + @vitest/coverage-v8        |

## Adresářová struktura (finální)

```
texten/
├── (stávající hra — beze změny)
├── PLAN.md
├── engine/               ← nový ESM engine + testy
│   ├── package.json
│   ├── vitest.config.js
│   ├── src/
│   │   ├── language.js   ← flex, noDia, matchVerbWord, listToText
│   │   ├── state.js      ← herní stav (immutable, pure functions)
│   │   ├── parser.js     ← parser příkazů
│   │   ├── loader.js     ← DSL validace
│   │   ├── display.js    ← DOM terminál (fáze 2)
│   │   ├── keyboard.js   ← vstup (fáze 2)
│   │   ├── fsm.js        ← stavový automat (fáze 3)
│   │   ├── timer.js      ← tick timery (fáze 3)
│   │   ├── npc.js        ← NPC systém (fáze 4)
│   │   └── save.js       ← save/load (fáze 5)
│   └── tests/
│       ├── language.test.js
│       ├── state.test.js
│       ├── parser.test.js
│       └── loader.test.js
├── editor/               ← Svelte editor (fáze 6)
│   ├── package.json
│   └── src/
│       ├── App.svelte
│       └── panels/
│           ├── MapPanel.svelte
│           ├── RoomEditor.svelte
│           ├── ItemEditor.svelte
│           ├── NpcEditor.svelte
│           ├── DialogEditor.svelte
│           └── CommandEditor.svelte
└── game-demo/            ← testovací hra v novém DSL (fáze 7)
    ├── rooms.json
    ├── items.json
    ├── npcs.json
    ├── commands.json
    └── scripts/
```

## Nový DSL (JSON)

### Místnost (rooms.json)

```json
{
  "id": "kitchen",
  "title": "Kuchyně",
  "desc": "Malá kuchyň se starým sporákem.",
  "ext": "Delší popis při prvním vstupu...",
  "exits": [
    { "label": "do obýváku", "to": "living_room" },
    { "label": "ven", "to": "garden", "hidden": true }
  ],
  "attrs": ["start"],
  "atmosphere": {
    "type": "shuffle",
    "density": 4,
    "strings": ["Někde kape kohoutek.", "Ticho."]
  },
  "scripts": {
    "onEnter": "kitchen/onEnter"
  }
}
```

### Předmět (items.json)

```json
{
  "id": "knife",
  "name": "nůž-,e,i,,i,em",
  "adj": null,
  "desc": "Ostrý kuchyňský nůž.",
  "attrs": ["movable"],
  "location": "kitchen",
  "scripts": {
    "onExamine": null,
    "onTake": null
  }
}
```

### NPC (npcs.json)

```json
{
  "id": "gordon",
  "name": "Gordon",
  "desc": "Vysoký farmář s kloboukem.",
  "location": "barn",
  "state": "friendly",
  "inventory": ["pitchfork"],
  "schedule": [
    { "tick": 0,  "location": "barn" },
    { "tick": 10, "location": "field" }
  ],
  "dialogs": {
    "start": {
      "text": "Ahoj, co tě sem přivádí?",
      "choices": [
        { "text": "Hledám práci.", "next": "work" },
        { "text": "Jen se dívám.", "next": "bye" }
      ]
    },
    "work": {
      "text": "Práce je tady dost.",
      "choices": []
    }
  }
}
```

### Příkaz (commands.json)

```json
{
  "id": "examine",
  "patterns": ["prozkoumej #3", "prohlédni #3", "podívej se na #3"],
  "onNoParam": "Na co se chceš podívat?",
  "script": "verbs/examine"
}
```

**Markery v patterns:**

| Marker | Význam                          |
|--------|---------------------------------|
| `^`    | exit (směr pohybu)              |
| `%N`   | movable item zde nebo v crate   |
| `@N`   | jakýkoli item zde nebo v crate  |
| `$N`   | item v inventáři hráče          |
| `#N`   | item zde nebo v inventáři       |
| `&N`   | item v crate, která je zde      |
| `*`    | raw string (cokoli)             |

`N` = index gramatického pádu (0=nom, 1=gen, 2=dat, 3=acc, 4=lok, 5=ins). Default: 3 (akuzativ).

## Architektura enginu

### State (immutable, pure functions)

```js
// state je plain object, nikdy se nemutuje přímo
const state = createState(gameData)
const newState = takeItem(state, 'knife')
const newState2 = movePlayer(newState, 'living_room')
```

### Parser

```js
const parser = createParser(commands)
const results = parser.parse('zvedni nůž', gameData, state)
// → [{ commandId: 'take', params: [[{ type: 'item', itemId: 'knife' }]] }]
```

### Display (DOM terminál)

- Fixed-size `<div class="terminal">` místo canvas
- Monospace font (stávající "farroregular"), tmavé pozadí, světlý text
- Řádky přibývají do DOM, při přetečení se odstraní první (scroll up)
- CSS animace pro přechody
- Zachovává retro/8-bit feeling

## Fáze implementace

### ✅ Fáze 1 — Parser + DSL (aktuálně)

- `language.js`: flex inflection, noDia, matchVerbWord, listToText
- `state.js`: createState, getItemsMatching, getExitsMatching, manipulace stavem
- `parser.js`: createParser, parse()
- `loader.js`: validateRoom, validateItem, validateNpc, validateCommand, validateGame
- Kompletní test suite (Vitest), coverage ≥ 80 %

### Fáze 2 — Display + Keyboard

- `display.js`: DOM terminál, printLine, waitForEnter, cls, scrollUp, barevné varianty
- `keyboard.js`: vstup, Enter, Backspace, šipka nahoru (recall)
- Integrační testy

### Fáze 3 — Engine Core

- `fsm.js`: stavový automat (begin → titlescreen → game0)
- `timer.js`: tick timery
- Hlavní game loop (rAF)
- `save.js`: lz-string + localStorage
- Integrační testy

### Fáze 4 — NPC systém

- `npc.js`: tick-based pohyb, dialog engine, inventář, stavy
- Testy

### Fáze 5 — Editor (Svelte)

- Mapa místností (SVG, drag & drop)
- Formulářové editory: místnosti, předměty, NPC, příkazy
- Dialog editor (vizuální strom)
- Export/import JSON (File System Access API)
- Live preview (embedded engine)

### Fáze 6 — Demo hra

- Malá testovací hra v novém DSL (3–5 místností, několik předmětů, 1 NPC)
- Ověření celého pipeline: JSON → engine → hra

## Testovací filosofie

- **TDD**: testy se píší před implementací
- **Pozitivní testy**: správné chování za normálních podmínek
- **Negativní testy**: chybové stavy, neplatné vstupy, boundary conditions
- **Coverage cíl**: ≥ 80 % lines/functions/branches pro každý modul

## Zpětná kompatibilita

Není vyžadována. Stávající hra (Gordonova farma) zůstává v původní podobě.
Migrace proběhne volitelně jako součást Fáze 6 nebo pozdějšího sprintu.

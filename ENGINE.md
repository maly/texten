# ENGINE.md — Rozbor enginu TEXTEN

## Architektura a tok dat

### Inicializace (`main.js`)
1. Načtou se moduly: `parser`, `display`, `keyboard`, `game`, `FSM`, `timer`
2. `game.init()` → `game.initItems()` → `game.initRooms()` → `parser.setVerbs(verbs)`
3. `$(document).ready` → `onLoad()` → čeká na klik → `onStartPressed()` → `FSM.newState("begin")` → `requestAnimationFrame(endless)`

### Herní smyčka (`endless`)
Každý frame:
1. `keyboard.waitForLine()` — vrátí řádek nebo `null`
2. Pokud řádek existuje: zkontroluj `enterWaiter` → `lineWaiter` → `parser.parse()`
3. `doCommand(command)` — async, řeší nejednoznačnosti, spouští `_prerun` / `_run` / item akci / `_postrun`
4. `FSM.states[FSM.state].test()` — stavový automat
5. `timer.allTick()` — odpočítávání timerů

---

## Parser (`js/parser.js`)

### Jak funguje
Každé sloveso má pole vzorů `_cmd`, např. `["vezmi %3", "seber %3"]`. Pro každý vstup parser:

1. Odstraní diakritiku (přes `diacritic.js`) ze vstupu i vzoru
2. Speciální markery (`^%$#@&*`) nahradí regexem `(.*?)`
3. Normální slova zkrátí na prefix 3 znaky + `\S*` — zkrácené porovnávání funkční pro češtinu
4. Zkusí regex na vstup; při shodě vyřeší parametry voláním `game.getFilteredItemsBy` / `game.getExit`
5. Odstraní duplicitní slovesa (aliasy) a pokud zbyde víc než jeden výsledek, vezme první

### Pattern markery
| Marker | Význam |
|--------|--------|
| `^` | východ z místnosti |
| `%` | movable předmět zde nebo v kontejneru |
| `@` | libovolný předmět zde (i nonmovable) |
| `$` | předmět v inventáři hráče |
| `#` | předmět zde nebo v inventáři |
| `&` | předmět v kontejneru, který je zde |
| `*` | libovolný řetězec |

Marker může mít příponu s číslem pádu, např. `%3` = akuzativ.

### Nejednoznačnost
Pokud parametr odpovídá více předmětům/východům, `doCommand` zobrazí otázku a čeká na `lineWaiter`. Po odpovědi zkusí `game.getExactItem()` / `game.getExit()` znovu.

---

## Herní stav (`js/game.js`)

### Stav předmětů
- `game.items[id]` — kde předmět je: ID místnosti, `"*"` (inventář hráče), nebo ID kontejneru
- `game.itemAttrs[id]` — pole aktuálních atributů, mění se přes `addAttr` / `removeAttr`

### Shadow mechanismus
Předmět s atributem `"shadow"` je v místnosti skrytý (nenabídne se parserem). Shadow se odstraní při:
- vstupu do místnosti (`roomEnter` / `sysRoomLook`)
- prozkoumání kontejneru, ve kterém předmět leží

### Timery a step-tickery
- **Timer** (`timer.js`): odpočítává herní framy, po vypršení volá callback
- **StepTicker**: odpočítává tahy hráče (příkazy), po vypršení přesune hráče do jiné místnosti — `whereToGo` field

### Save / Load
Celý stav (`items`, `itemAttrs`, `rooms`, `where`, proměnné, timery, step-tickery) se serializuje do JSON, komprimuje LZ-String a uloží do `localStorage`. Slotů 1–9.

---

## Display (`js/display.js`)

Čistý canvas renderer (650×490 px), bez DOM textových elementů.

- Text se vykresluje po řádcích; `cline` sleduje aktuální řádek
- `scrollUp()` kopíruje pixeldata přes `getImageData` / `putImageData` — žádný DOM scroll
- Po `maxLinesAtOnce` řádcích najednou se automaticky pozastaví a čeká na Enter
- `printTextMultiline(text, waitAll)` vrací Promise, resolved po stisku Enter
- `noPrint` flag potlačí veškerý výstup (cutscény, čekání na Enter)

---

## FSM (`js/FSM.js`)

Čtyři stavy s metodami `start()` a `test()` (volaná každý frame):

```
begin (300 tiků intro videa)
  → titlescreen (čeká na Enter)
    → intro0 (async: intro texty + video)
      → game0 (cEnter(), hra běží)
```

`intro0.start()` je `async` — FSM ho nevolá s `await`, místo toho `test()` každý frame kontroluje `this.done`. Přechod nastane až po doběhnutí všech awaitů.

---

## Systém řetězců / `fixString` (`js/language.js`)

Embedded DSL pro dynamické texty — vše uvnitř JS stringů nebo objektů.

### Podmíněné části
```
{podmínka|text pokud platí|text jinak}
{!podmínka|text}
```

Podmínky:
| Kód | Význam |
|-----|--------|
| `VZ,var` | proměnná var === 0 |
| `VE,var,val` | proměnná var == val |
| `IC,id` | předmět id je v inventáři |
| `IH,id` | předmět id je v aktuální místnosti |
| `!` prefix | negace |

### Variantní řetězce
```
[S[varianta1][varianta2][varianta3]]
```
Typy: `S` (shuffle — zamíchá, pak dokola), `O` (oneshot — po zobrazení všech vrací prázdný string), `L` (loop — bez shuffle), `R` (random — náhodně), `T` (last — po vyčerpání opakuje poslední).

Stav variant se hashuje MD5 a ukládá do `savedStrings` — opakované volání zachovává pořadí.

### Density
Objekt s `density: N` se zobrazí jen s pravděpodobností `1/N`. Používá se pro atmosférické zprávy v místnostech.

### Formátování pádů
```
#0 – #5   jméno předmětu v pádu 0–5
^0 – ^5   dtto, první písmeno velké
```

---

## Herní obsah (`game/`)

### Definice předmětu (`items.js`)
```js
{
  id: "nuz",
  name: ["nůž", "nože", ...],   // 6 pádů jednotného čísla
  adj: ["malý", "malého", ...], // volitelně přídavné jméno
  desc: "Popis předmětu",
  attrs: ["movable"],
  where: "dilna",               // počáteční umístění
  strings: { cexamine: "..." }, // per-verb text override
  actions: { ctake: (itm, g) => { ... } } // per-verb callback
}
```

### Definice místnosti (`rooms.js`)
```js
{
  id: "dilna",
  title: "Dílna",
  desc: "Popis místnosti",
  ext: "...",         // krátký popis pro výpis exitů
  exits: [{ to: "dvur", text: "dvůr" }],
  attrs: [],
  atmosphere: { strings: [...], density: 3 },
  _enter(g) { ... }  // callback při vstupu
}
```

### Definice slovesa (`commands.js`)
```js
{
  id: "ctake",
  _cmd: ["vezmi %3", "seber %3"],
  _prerun(p, g, n) { ... },
  async _run(p, g, n) { ... },
  _postrun(p, g, n) { ... },
  _noparam: "chybový text bez parametru",
  _nothing: "text pokud nic nenastalo"
}
```

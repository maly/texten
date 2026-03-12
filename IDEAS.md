# IDEAS.md — Nápady na rozšíření enginu TEXTEN

## Silné stránky enginu (základ pro rozšíření)

- **Parser s diacritic-stripem a prefix matchingem** — robustní pro češtinu bez NLP
- **`fixString` DSL** — podmíněné texty, variantní řetězce, density, pádové formátování; umožňuje živé texty bez herní logiky
- **Oddělení obsahu od enginu** — `items.js`, `rooms.js`, `commands.js` jsou čistá data; nová hra bez dotyku enginu
- **Atmosféra jako first-class citizen** — `room.atmosphere` s density je elegantní mechanismus

---

## Opravy nedodělků

### `gameList()` — výsledek se nikde nevrací
`gameList()` sestaví seznam uložených pozic, ale výsledek chybí v UI. Hráč musí tipovat číslo slotu.
Propojit s příkazem `list` a zobrazit přes canvas.

### StepTicker — `fn` callback nedodělán
`stepTickers[id].fn` existuje v kódu, ale nikdy se nevolá — jen `whereToGo`. Obecný callback je silnější než pohyb hráče.
Zavolat `fn()` při `remain === 0`, pokud je definováno.

### `roomAttrs` — todo bez implementace
Místnosti mají `attrs` pole, ale chybí runtime správa (`addAttr` / `removeAttr` / `hasAttr`) jako u předmětů.

---

## Navrhovaná rozšíření

### 1. Synonyma předmětů
Hráč napíše `vezmi kapesák` místo `nůž` — parser selže, protože předmět má jen `name`. Pro větší hry problém.

```js
// Přidat do definice předmětu:
synonyms: ["kapesák", "čepel", "nůž"]
```

Prohledávat `synonyms` v `getFilteredItemsBy` stejným prefix mechanismem jako `name`.

---

### 2. Namespace pro proměnné
`vars.getVar("pocitadlo")` je globální plochý slovník. Pro větší hru s větvením rychle nepřehledné.

```js
vars.getVar("farmar.nalada")  // tečková notace jako namespace
vars.getVar("farmar.poloha")
```

Implementace: split podle `.`, vnořený objekt — žádná breaking change pro stávající kód.

---

### 3. Kombinované podmínky v `fixString`
`{IC,nuz|text}` — jedna podmínka. Nelze kombinovat AND, takže složité situace přepadají do `_run()`.

```
{IC,nuz|VE,stav,2|text}     → AND kombinace
{IC,nuz||VE,stav,2|text}    → OR kombinace (volitelně)
```

Rozšíření `tConds()` v `language.js` — parsovat pole podmínek místo jedné.

---

### 4. Podmíněné exity
Exit, který existuje jen při splněné podmínce, nebo se zobrazuje jinak podle stavu hry. Teď obejitelné přes `_enter` callback místnosti, ale v definici exitů chybí.

```js
exits: [
  { to: "sklep", text: "sklep", cond: "IH,klice" },  // viditelný jen s klíčem
  { to: "les", text: "hustý les", condText: { "VE,cas,noc": "temný les" } }
]
```

---

### 5. NPC jako entita
Postavy jsou teď buď `nonmovable` předměty nebo simulace step-tickery. Žádný vlastní stav, pohyb ani dialogy.

```js
// Nový typ entity vedle items a rooms:
{
  id: "farmar",
  name: [...],         // pády jako u předmětů
  where: "dvur",       // pohybuje se
  attrs: [],
  dialogue: { ... },   // strom dialogů
  atmosphere: { ... }, // co říká při průchodu
  _tick(g) { ... }     // vlastní logika každý tah
}
```

Parser: nový marker, např. `?` = NPC here.

---

### 6. Event bus
Engine komunikuje výhradně přes `display.printText*`. Žádný hook pro vedlejší UI (mapa, portréty, stavový panel).

```js
game.on("roomEnter", room => { ... })
game.on("itemTaken", item => { ... })
game.on("varChanged", (name, val) => { ... })
```

Implementace: jednoduchý pub/sub, `game.emit()` na klíčových místech. Nezmění engine logiku, ale otevře dveře pro UI rozšíření.

---

### 7. Kontextové `jdi` bez parametru
Klasická IF konvence: pokud je v místnosti jediný exit, `jdi` bez parametru projde automaticky. Pokud víc, zeptá se.

Rozšíření `sysGo` v `game.js` — pokud `p` je prázdné, zkontrolovat počet exitů místnosti.

---

### 8. Hint systém
Na základě aktuálního stavu hry vrátit nápovědu hráči. Definovatelné přímo v místnosti nebo globálně.

```js
// V definici místnosti:
hints: [
  { cond: "!IC,klice", text: "Možná bys mohl prozkoumat dílnu..." },
  { cond: "VZ,pozar", text: "Někde tu musí být voda." }
]
```

Příkaz `nápověda` / `hint` projde hinty aktuální místnosti a zobrazí první platnou.

---

### 9. Transcript / replay
Logovat všechny příkazy hráče s číslem tahu do localStorage. Hodí se pro:
- debugování hry autorem
- sdílení řešení mezi hráči
- `undo` (krokovat zpět přehráním od save pointu)

---

### 10. Víceúrovňový inventář
Kontejner (`crate`) je jen jeden level — batoh v batohu nefunguje, `cratesHere` hledá nerekurzivně.
Rekurzivní prohledávání kontejnerů v `getFilteredItemsBy` by to řešilo bez změny definic.

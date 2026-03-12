# LLM Integration Ideas for TEXTEN

## Kde LLM pomůže a kde ne

**Pomůže**: přirozený jazyk → strukturovaný příkaz. Hráč napíše cokoli česky, LLM to mapuje na existující sloveso + existující předmět.

**Nepomůže jako náhrada enginu**: nechceš, aby LLM generoval odpovědi hry. Ztratíš kontrolu nad příběhem, konzistencí světa a autorský záměr. Hra by přestala být hra a stala by se chatem.

---

## Architektura: LLM jako fallback parser

```
hráč zadá vstup
       ↓
  stávající parser
       ↓
  výsledek?  ──── ANO ──→  doCommand() [beze změny]
       │
      NE
       ↓
  LLM intent resolver
  (kontext: místnost, předměty tady, seznam sloves)
       ↓
  vrátí { verb: "cexamine", item: "stul" }
       ↓
  doCommand() [beze změny]
```

LLM nikdy negeneruje text pro hráče. Jen překládá vstup na strukturu, které rozumí existující engine. Fallback, ne replacement.

---

## Co poslat LLM jako kontext

LLM potřebuje vědět, co ve hře existuje, jinak bude halucinovat předměty:

```
Jsi parser české textové adventury. Přelož hráčův vstup na JSON příkaz.

Dostupná slovesa: [prozkoumej, vezmi, polož, jdi, mluv, ...]
Předměty v místnosti: [stůl (stul), lucerna (lucerna), dveře (dvere)]
Předměty v inventáři: [nůž (nuz)]
Východy: [sever (dvur), jih (les)]

Pravidla:
- Vrať POUZE JSON: {"verb": "cexamine", "item": "stul"}
- Pokud vstup nedává smysl v kontextu hry, vrať {"verb": null}
- Nikdy nevymýšlej předměty ani místa, která nejsou v seznamu

Vstup hráče: "Co je to za stůl?"
```

Klíčové je, že seznam předmětů a sloves sestavuješ dynamicky z `game.getItemsHere()` a `verbs` — LLM tedy pracuje jen s tím, co ve hře reálně existuje.

---

## Kde to zapojit v kódu

V `main.js`, v `endless()`, těsně za `parser.parse()`:

```js
var pc = parser.parse(cmd);

if (pc.length === 0) {
  // stávající parser nerozuměl → zkus LLM
  pc = await llmResolve(cmd, game);
}

if (pc.length === 0) {
  display.printTextRed("To nechápu, promiň");
}
```

`llmResolve()` vrátí stejný formát jako `parser.parse()` — engine neví, jestli příkaz přišel od parseru nebo LLM.

---

## Praktické problémy

**Latence** je největší problém. LLM call trvá 0.5–2s. Textovka by se měla cítit okamžitě. Řešení:
- Zobraz spinner nebo "Přemýšlím..." hned po Enteru
- Používej nejmenší model (Haiku) — pro mapování vstup→JSON stačí

**Cena** — každý hráčský příkaz, který parser nezná, stojí peníze. Haiku je levný (~$0.25/M tokenů), ale u větší hry to čítat začne. Alternativa: lokální model přes Ollama pro vlastní deploy.

**Čeština** — moderní LLM ji zvládají dobře, ale v systémovém promptu explicitně napiš, že hra je česky a ID předmětů jsou anglická (aby LLM nezmátlo `stůl` vs `stul`).

**Determinismus** — LLM občas vrátí různé věci pro stejný vstup. Přidej `temperature: 0` a few-shot příklady do systémového promptu.

---

## Druhé použití LLM: bohatší popisy

Místo statických `desc` textů v místnostech by LLM mohl generovat variace popisu — ale jen jednou při prvním vstupu, výsledek se pak cachuje (jako `savedStrings` v `fixString`). Hráč pak nevidí stejný text pokaždé, ale hra zůstane konzistentní.

```js
if (!room._generatedDesc) {
  room._generatedDesc = await llmDescribe(room.desc, room.atmosphere);
}
display.printText(room._generatedDesc);
```

Toto by výrazně rozšířilo expresivitu beze změny herní logiky.

---

## Co implementovat jako první

Jednoznačně **fallback parser** — má největší dopad na hratelnost, minimální zásah do architektury, a výsledek je předvídatelný (LLM vrací JSON, ne volný text). Druhý krok by byl dynamické cachované popisy.

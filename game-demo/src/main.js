// TEXTEN engine demo — Farma Gordona
// Demonstrates all engine features:
//   display, keyboard, FSM, parser, state (shadow/crate/dark),
//   NPC (schedule/dialog/inventory/mood), timer, save/load

import { createDisplay }    from "../../engine/src/display.js"
import { createKeyboard }   from "../../engine/src/keyboard.js"
import { createFSM }        from "../../engine/src/fsm.js"
import { createTimerSystem } from "../../engine/src/timer.js"
import { createSaveSystem } from "../../engine/src/save.js"
import { createParser }     from "../../engine/src/parser.js"
import {
  createState, movePlayer, takeItem, dropItem,
  isVisible, hasAttr, addAttr,
  getItemsMatching, getExitsMatching,
} from "../../engine/src/state.js"
import {
  createNpcState, tickNpcs, getNpcsHere,
  getNpcLocation, getNpcMood, setNpcMood,
  getNpcInventory, giveItemToNpc, takeItemFromNpc, npcHasItem,
  getDialogNode, startDialogSession, advanceDialog, isDialogOver,
} from "../../engine/src/npc.js"

import roomsData    from "../data/rooms.json"
import itemsData    from "../data/items.json"
import npcsData     from "../data/npcs.json"
import commandsData from "../data/commands.json"

// ─── Game data ───────────────────────────────────────────────────────────────

const gameData = { rooms: roomsData, items: itemsData, npcs: npcsData, commands: commandsData }

// ─── Subsystems (created once) ───────────────────────────────────────────────

const display  = createDisplay(document.getElementById("terminal"), { maxLines: 22, charWidth: 52 })
const keyboard = createKeyboard()
const timers   = createTimerSystem()
const saves    = createSaveSystem("gordon-demo")
const parser   = createParser(commandsData)

// ─── Mutable game world (replaced on each state change) ─────────────────────

let state    = createState(gameData)
let npcState = createNpcState(gameData)
let tick     = 0          // counts player actions
let dialogSession = null  // active NPC dialog session, or null
let dialogNpc = null      // NPC def currently in dialog

// ─── Helpers ─────────────────────────────────────────────────────────────────

const room = (id) => gameData.rooms.find((r) => r.id === id)
const item = (id) => gameData.items.find((i) => i.id === id)
const npc  = (id) => gameData.npcs.find((n) => n.id === id)

const p = (text, color) => display.printLine(text, color)
const pt = (text, color) => display.printText(text, color)

function currentRoom() {
  return room(state.where)
}

function describeRoom() {
  const r = currentRoom()
  display.cls()
  p(`── ${r.title.toUpperCase()} ──`, "yellow")
  p("")
  pt(r.ext && !state._visited?.[r.id] ? r.ext : r.desc)

  // Track first visit
  if (!state._visited) state = { ...state, _visited: {} }
  if (!state._visited[r.id]) state = { ...state, _visited: { ...state._visited, [r.id]: true } }

  // Dark room warning
  if (hasAttr(state, r.id, "dark") || r.attrs?.includes("dark")) {
    const hasLamp = state.items["lampa"]?.location === "*"
    if (!hasLamp) {
      p("")
      p("Je tu tma. Potřebuješ lampu.", "red")
    }
  }

  // Items visible here
  const visibleItems = gameData.items.filter(
    (it) => isVisible(state, it.id) && state.items[it.id]?.location === state.where
  )
  if (visibleItems.length > 0) {
    p("")
    for (const it of visibleItems) {
      const adjForm = it.adj ? `${it.adj.split("-")[0]} ` : ""
      const nomForm = it.name.split("-")[0]
      p(`Vidíš: ${adjForm}${nomForm}.`, "green")
    }
  }

  // NPCs here
  const npcsHere = getNpcsHere(gameData, npcState, state.where)
  if (npcsHere.length > 0) {
    p("")
    for (const n of npcsHere) p(`Je tu: ${n.name}.`, "cyan")
  }

  // Exits
  const exits = gameData.rooms.find((r) => r.id === state.where)?.exits ?? []
  const visibleExits = exits.filter((e) => !e.hidden || state._revealedExits?.[state.where + ":" + e.to])
  if (visibleExits.length > 0) {
    p("")
    p("Východy: " + visibleExits.map((e) => e.label).join(", ") + ".", "blue")
  }
}

function describeInventory() {
  const carried = gameData.items.filter((it) => state.items[it.id]?.location === "*")
  if (carried.length === 0) {
    p("Nic u sebe nemáš.")
  } else {
    p("U sebe máš:")
    for (const it of carried) {
      const nom = it.name.split("-")[0]
      p(`  · ${nom}`)
    }
  }
}

function atmosphereTick() {
  const r = currentRoom()
  if (!r.atmosphere) return
  tick % r.atmosphere.density === 0 && r.atmosphere.strings.length > 0
    ? p(r.atmosphere.strings[Math.floor(Math.random() * r.atmosphere.strings.length)], "dim")
    : null
}

// ─── Command handlers ─────────────────────────────────────────────────────────

const HANDLERS = {
  pohled() {
    describeRoom()
  },

  jdi({ params }) {
    const exits = params.filter((p) => p.type === "exit")
    if (exits.length === 0) { p("Kam chceš jít?", "red"); return }
    const exit = exits[0]
    // Key check: entering house requires key
    if (exit.to === "dum" && state.items["klic"]?.location !== "*") {
      p("Dveře jsou zamčené. Potřebuješ klíč.", "red"); return
    }
    state = movePlayer(state, gameData, exit.to)
    // Reveal hidden exit to house if player has map
    if (exit.to === "dvur" || state.where === "dvur") {
      if (state.items["mapa"]?.location === "*") {
        state = { ...state, _revealedExits: { ...state._revealedExits, "dvur:dum": true } }
      }
    }
    describeRoom()
  },

  vezmi({ params }) {
    const movable = params.filter((p) => p.type === "item")
    if (movable.length === 0) { p("Co chceš vzít?", "red"); return }
    const target = movable[0]
    state = takeItem(state, target.id)
    const nom = item(target.id)?.name.split("-")[0] ?? target.id
    p(`Vzal jsi: ${nom}.`, "green")

    // Timer demo: after picking up apple, 3 ticks later print aroma message
    if (target.id === "jablko") {
      timers.add("jablko_aroma", 3, () => {
        p("Jablko v tašce stále voní — příjemná vůně jablek.", "dim")
      })
    }
    // Revealing house exit via map
    if (target.id === "mapa") {
      state = { ...state, _revealedExits: { ...state._revealedExits, "dvur:dum": true } }
      p("Mapa ukazuje skryté dveře do domu na dvoře!", "yellow")
    }
  },

  poloz({ params }) {
    const carried = params.filter((p) => p.type === "item")
    if (carried.length === 0) { p("Co chceš položit?", "red"); return }
    const target = carried[0]
    state = dropItem(state, target.id)
    const nom = item(target.id)?.name.split("-")[0] ?? target.id
    p(`Položil jsi: ${nom}.`)
  },

  prozkoumej({ params }) {
    const items = params.filter((p) => p.type === "item")
    if (items.length === 0) { p("Co chceš prozkoumat?", "red"); return }
    const target = items[0]
    const def = item(target.id)
    if (!def) { p("Nic takového tady není.", "red"); return }
    pt(def.desc)
    if (def.attrs.includes("crate")) {
      const inside = gameData.items.filter((i) => state.items[i.id]?.location === def.id)
      if (inside.length > 0) {
        p(`Uvnitř vidíš: ${inside.map((i) => i.name.split("-")[0]).join(", ")}.`, "green")
      } else {
        p("Uvnitř je prázdno.")
      }
    }
  },

  inventar() {
    describeInventory()
  },

  mluv({ params }) {
    // #N params: NPCs or items near player
    const nearItems = params.filter((p) => p.type === "item")
    if (nearItems.length === 0) { p("S kým chceš mluvit?", "red"); return }
    const npcId = nearItems[0].id
    const npcDef = npc(npcId)
    if (!npcDef || !npcDef.dialogs || Object.keys(npcDef.dialogs).length === 0) {
      p("Tato postava s tebou nechce mluvit.", "red"); return
    }
    if (getNpcLocation(npcState, npcId) !== state.where) {
      p("Tady nikdo takový není.", "red"); return
    }
    try {
      dialogSession = startDialogSession(npcDef)
      dialogNpc = npcDef
      fsm.transition("dialog")
      showDialogNode()
    } catch {
      p("S touto postavou nelze mluvit.", "red")
    }
  },

  otevri({ params }) {
    const items = params.filter((p) => p.type === "item")
    if (items.length === 0) { p("Co chceš otevřít?", "red"); return }
    const target = items[0]
    const def = item(target.id)
    if (!def?.attrs.includes("crate")) {
      p("To nejde otevřít.", "red"); return
    }
    const inside = gameData.items.filter((i) => state.items[i.id]?.location === def.id)
    if (inside.length === 0) {
      p("Bedna je prázdná.")
    } else {
      p("Otevřel jsi bednu. Uvnitř je:")
      for (const i of inside) p(`  · ${i.name.split("-")[0]}`, "green")
    }
  },

  vezmi_z({ params }) {
    const cratedItems = params.filter((p) => p.type === "item")
    if (cratedItems.length === 0) { p("Co chceš vytáhnout?", "red"); return }
    const target = cratedItems[0]
    state = takeItem(state, target.id)
    const nom = item(target.id)?.name.split("-")[0] ?? target.id
    p(`Vytáhl jsi z bedny: ${nom}.`, "green")
  },

  dej({ params }) {
    const itemParam = params.filter((p) => p.type === "item" && state.items[p.id]?.location === "*")[0]
    const npcParam  = params.filter((p) => p.type === "item" && npc(p.id))[0]
    if (!itemParam || !npcParam) { p("Komu chceš co dát?", "red"); return }
    if (getNpcLocation(npcState, npcParam.id) !== state.where) {
      p("Tady nikdo takový není.", "red"); return
    }
    state = takeItem(state, itemParam.id)
    npcState = giveItemToNpc(npcState, npcParam.id, itemParam.id)
    const nom = item(itemParam.id)?.name.split("-")[0] ?? itemParam.id

    // Special: give apple to Gordon → mood change, get letter
    if (npcParam.id === "gordon" && itemParam.id === "jablko") {
      npcState = setNpcMood(npcState, "gordon", "happy")
      if (npcHasItem(npcState, "gordon", "dopis")) {
        npcState = takeItemFromNpc(npcState, "gordon", "dopis")
        state = { ...state, items: { ...state.items, dopis: { location: "*" } } }
        p(`Předal jsi ${nom} Gordonovi.`, "green")
        p("Gordon se usmívá. \"Přesně takové jsem chtěl! Tady máš ten dopis.\"", "cyan")
        p("Dostal jsi: dopis.", "yellow")
        // Switch to special dialog
        dialogSession = startDialogSession(npc("gordon"), "daroval")
        dialogNpc = npc("gordon")
        fsm.transition("dialog")
        showDialogNode()
        return
      }
    }
    p(`Předal jsi ${nom}.`, "green")
  },

  pouzij({ params }) {
    const carried = params.filter((p) => p.type === "item" && state.items[p.id]?.location === "*")[0]
    if (!carried) { p("To u sebe nemáš.", "red"); return }
    // Use key on house door
    if (carried.id === "klic" && state.where === "dvur") {
      state = { ...state, _revealedExits: { ...state._revealedExits, "dvur:dum": true } }
      // Remove hidden flag effect
      p("Otočil jsi klíčem. Dveře do domu se odemkly!", "yellow")
      describeRoom()
      return
    }
    p("Tady nemá smysl to použít.", "red")
  },

  uloz({ params }) {
    const raw = params.find((p) => p.type === "string")
    const slot = parseInt(raw?.value) || 1
    if (slot < 1 || slot > 9) { p("Slot musí být 1–9.", "red"); return }
    saves.save({ items: state.items, where: state.where, npcState, tick }, slot, `Slot ${slot} — ${currentRoom().title}`)
    p(`Hra uložena do slotu ${slot}.`, "green")
  },

  nacti({ params }) {
    const raw = params.find((p) => p.type === "string")
    const slot = parseInt(raw?.value) || 1
    if (slot < 1 || slot > 9) { p("Slot musí být 1–9.", "red"); return }
    const saved = saves.load(slot)
    if (!saved) { p(`Slot ${slot} je prázdný.`, "red"); return }
    state    = { ...state, items: saved.items, where: saved.where }
    npcState = saved.npcState
    tick     = saved.tick ?? tick
    p(`Hra načtena ze slotu ${slot}.`, "green")
    describeRoom()
  },

  napoveda() {
    p("── NÁPOVĚDA ──", "yellow")
    p("pohleď / r          — rozhlédni se")
    p("jdi [směr]          — pohyb")
    p("vezmi [předmět]     — seber předmět")
    p("polož [předmět]     — odlož z inventáře")
    p("prozkoumej [věc]    — podívej se na věc")
    p("inventář / i        — co u sebe máš")
    p("mluv s [postava]    — hovor s NPC")
    p("otevři [bedna]      — otevři bednu")
    p("vezmi [obsah]       — vezmi z otevřené bedny")
    p("dej [věc] [komu]    — dej předmět NPC")
    p("použij [věc]        — použij předmět")
    p("ulož [1-9]          — ulož hru")
    p("načti [1-9]         — načti uloženou hru")
    p("↑                   — opakuj poslední příkaz")
  },
}

// ─── Dialog mode ─────────────────────────────────────────────────────────────

function showDialogNode() {
  if (!dialogSession || !dialogNpc) return
  const node = getDialogNode(dialogNpc, dialogSession.nodeId)
  if (!node) { endDialog(); return }

  p("")
  p(`${dialogNpc.name}: "${node.text}"`, "cyan")

  if (isDialogOver(dialogNpc, dialogSession)) {
    p("[Konec dialogu — stiskni Enter]", "dim")
  } else {
    node.choices.forEach((choice, i) => {
      p(`  ${i + 1}. ${choice.text}`)
    })
  }
}

function handleDialogInput(input) {
  if (!dialogSession) { endDialog(); return }
  const node = getDialogNode(dialogNpc, dialogSession.nodeId)

  if (isDialogOver(dialogNpc, dialogSession)) {
    endDialog(); return
  }

  const idx = parseInt(input.trim()) - 1
  if (isNaN(idx) || idx < 0 || idx >= node.choices.length) {
    p(`Zadej číslo 1–${node.choices.length}.`, "red")
    showDialogNode()
    return
  }

  const next = advanceDialog(dialogNpc, dialogSession, idx)
  if (!next) {
    endDialog(); return
  }
  dialogSession = next
  showDialogNode()
}

function endDialog() {
  dialogSession = null
  dialogNpc = null
  fsm.transition("game")
  describeRoom()
}

// ─── FSM ─────────────────────────────────────────────────────────────────────

const fsm = createFSM(
  {
    title: {
      enter() {
        display.cls()
        p("")
        p("  ████████╗███████╗██╗  ██╗████████╗███████╗███╗   ██╗", "yellow")
        p("     ██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝████╗  ██║", "yellow")
        p("     ██║   █████╗   ╚███╔╝    ██║   █████╗  ██╔██╗ ██║", "yellow")
        p("     ██║   ██╔══╝   ██╔██╗    ██║   ██╔══╝  ██║╚██╗██║", "yellow")
        p("     ██║   ███████╗██╔╝ ██╗   ██║   ███████╗██║ ╚████║", "yellow")
        p("     ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝", "yellow")
        p("")
        p("           F A R M A   G O R D O N A", "cyan")
        p("")
        p("  Demo hra – ukazuje všechny featury TEXTEN enginu.", "dim")
        p("")
        p("  Stiskni Enter pro start...", "dim")
      },
    },

    intro: {
      enter() {
        display.cls()
        pt("Přijíždíš na farmu Gordona Freemana v Coloradu. Je krásné jarní ráno. Farma vypadá opuštěně — ale určitě se někde něco děje.")
        p("")
        pt("Máš u sebe mapu farmy, kterou ti dal starý průvodce. Prozkoumej farmu, pohovoř s Gordonem a najdi skrytý klíč od domu.")
        p("")
        p("[Enter pro pokračování]", "dim")
        display.waitForEnter().then(() => fsm.transition("game"))
      },
    },

    game: {
      enter() {
        if (!state._introShown) {
          state = { ...state, _introShown: true }
          describeRoom()
        }
      },
      tick() {
        timers.tick()
      },
    },

    dialog: {
      // Dialog handled via handleDialogInput, not keyboard.onSubmit
    },
  },
  "title"
)

// ─── Input handling ───────────────────────────────────────────────────────────

keyboard.onSubmit((input) => {
  // Resolve any pending waitForEnter first (intro screen, etc.)
  if (display.resolveEnter()) return

  const currentState = fsm.getState()

  if (currentState === "title") {
    fsm.transition("intro")
    return
  }

  const trimmed = input.trim()
  if (!trimmed) return

  if (currentState === "dialog") {
    handleDialogInput(trimmed)
    return
  }

  if (currentState !== "game") return

  // Parse and execute
  const results = parser.parse(trimmed, gameData, state)

  if (results.length === 0) {
    p(`Nerozumím příkazu: "${trimmed}".`, "red")
    return
  }

  // Use first match (ambiguity resolution omitted in demo for brevity)
  const { commandId, params } = results[0]
  const handler = HANDLERS[commandId]

  if (!handler) {
    p(`Příkaz "${commandId}" není implementován.`, "red")
    return
  }

  // Advance tick + NPC schedule
  tick++
  npcState = tickNpcs(gameData, npcState, tick)
  fsm.tick()

  // Atmosphere every few actions
  atmosphereTick()

  handler({ params, trimmed })
})

keyboard.onRecall((text) => {
  // Visual feedback: show recalled command in input echo
  p(`↑ ${text}`, "dim")
})

// ─── DOM keyboard bridge ─────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  keyboard.handleKey(e.key)
  // Update visible buffer
  const bufEl = document.getElementById("buffer")
  if (bufEl) bufEl.textContent = "> " + keyboard.getBuffer()
})

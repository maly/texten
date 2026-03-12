// Headless game runner — replicates game-demo/src/main.js without DOM
// Used by tests; no display, no keyboard, no FSM — pure logic.

import { createParser }     from "../../engine/src/parser.js"
import { createTimerSystem } from "../../engine/src/timer.js"
import { flex, noDia }      from "../../engine/src/language.js"
import {
  createState, movePlayer, takeItem, dropItem,
  isVisible, hasAttr, getExitsMatching,
} from "../../engine/src/state.js"
import {
  createNpcState, tickNpcs, getNpcsHere, getNpcLocation,
  setNpcMood, giveItemToNpc, takeItemFromNpc, npcHasItem,
  startDialogSession, advanceDialog, isDialogOver, getDialogNode,
} from "../../engine/src/npc.js"

import roomsData    from "../data/rooms.json"    with { type: "json" }
import itemsData    from "../data/items.json"    with { type: "json" }
import npcsData     from "../data/npcs.json"     with { type: "json" }
import commandsData from "../data/commands.json" with { type: "json" }

const gameData = { rooms: roomsData, items: itemsData, npcs: npcsData }

export function createGame() {
  const lines = []
  const p  = (text) => lines.push(text)
  const pt = (text) => lines.push(text)
  const nom = (flexStr) => flexStr ? flex(flexStr)[0] : ""

  let state    = createState(gameData)
  let npcState = createNpcState(gameData)
  let tick     = 0
  let dialogSession = null
  let dialogNpc     = null

  const parser = createParser(commandsData)
  const timers = createTimerSystem()

  const room = (id) => gameData.rooms.find((r) => r.id === id)
  const item = (id) => gameData.items.find((i) => i.id === id)
  const npc  = (id) => gameData.npcs.find((n) => n.id === id)

  function currentRoom() { return room(state.where) }

  function describeRoom() {
    const r = currentRoom()
    p(`── ${r.title.toUpperCase()} ──`)
    p(r.ext && !state._visited?.[r.id] ? r.ext : r.desc)

    if (!state._visited) state = { ...state, _visited: {} }
    if (!state._visited[r.id])
      state = { ...state, _visited: { ...state._visited, [r.id]: true } }

    if (hasAttr(state, r.id, "dark") || r.attrs?.includes("dark")) {
      if (state.items["lampa"] !== "*") p("Je tu tma. Potřebuješ lampu.")
    }

    const visibleItems = gameData.items.filter(
      (it) => isVisible(state, it.id) && state.items[it.id] === state.where
    )
    for (const it of visibleItems) {
      const adjForm = it.adj ? `${nom(it.adj)} ` : ""
      p(`Vidíš: ${adjForm}${nom(it.name)}.`)
    }

    const npcsHere = getNpcsHere(gameData, npcState, state.where)
    for (const n of npcsHere) p(`Je tu: ${n.name}.`)

    const exits = r.exits ?? []
    const visibleExits = exits.filter(
      (e) => !e.hidden || state._revealedExits?.[state.where + ":" + e.to]
    )
    if (visibleExits.length > 0)
      p("Východy: " + visibleExits.map((e) => e.label).join(", ") + ".")
  }

  function describeInventory() {
    const carried = gameData.items.filter((it) => state.items[it.id] === "*")
    if (carried.length === 0) {
      p("Nic u sebe nemáš.")
    } else {
      p("U sebe máš:")
      for (const it of carried) p(`  · ${nom(it.name)}`)
    }
  }

  function showDialogNode() {
    if (!dialogSession || !dialogNpc) return
    const node = getDialogNode(dialogNpc, dialogSession.nodeId)
    if (!node) { endDialog(); return }
    p(`${dialogNpc.name}: "${node.text}"`)
    if (!isDialogOver(dialogNpc, dialogSession))
      node.choices.forEach((choice, i) => p(`  ${i + 1}. ${choice.text}`))
  }

  function endDialog() {
    dialogSession = null
    dialogNpc = null
    describeRoom()
  }

  function handleDialogInput(input) {
    if (!dialogSession) { endDialog(); return }
    const node = getDialogNode(dialogNpc, dialogSession.nodeId)
    if (isDialogOver(dialogNpc, dialogSession)) { endDialog(); return }
    const idx = parseInt(input.trim()) - 1
    if (isNaN(idx) || idx < 0 || idx >= node.choices.length) {
      p(`Zadej číslo 1–${node.choices.length}.`)
      showDialogNode()
      return
    }
    const next = advanceDialog(dialogNpc, dialogSession, idx)
    if (!next) { endDialog(); return }
    dialogSession = next
    showDialogNode()
  }

  const HANDLERS = {
    pohled() { describeRoom() },

    jdi({ params }) {
      const exits = params.filter((p) => p.type === "exit")
      if (exits.length === 0) { p("Kam chceš jít?"); return }
      const exit = exits[0]
      if (exit.to === "dum" && state.items["klic"] !== "*") {
        p("Dveře jsou zamčené. Potřebuješ klíč."); return
      }
      state = movePlayer(state, exit.to)
      if (exit.to === "dvur" || state.where === "dvur") {
        if (state.items["mapa"] === "*")
          state = { ...state, _revealedExits: { ...state._revealedExits, "dvur:dum": true } }
      }
      describeRoom()
    },

    vezmi({ params }) {
      const movable = params.filter((p) => p.type === "item")
      if (movable.length === 0) { p("Co chceš vzít?"); return }
      const target = movable[0]
      state = takeItem(state, target.itemId)
      const itemName = nom(item(target.itemId)?.name) || target.itemId
      p(`Vzal jsi: ${itemName}.`)
      if (target.itemId === "jablko")
        timers.add("jablko_aroma", 3, () => p("Jablko v tašce stále voní."))
      if (target.itemId === "mapa") {
        state = { ...state, _revealedExits: { ...state._revealedExits, "dvur:dum": true } }
        p("Mapa ukazuje skryté dveře do domu na dvoře!")
      }
    },

    poloz({ params }) {
      const carried = params.filter((p) => p.type === "item")
      if (carried.length === 0) { p("Co chceš položit?"); return }
      const target = carried[0]
      state = dropItem(state, target.itemId)
      p(`Položil jsi: ${nom(item(target.itemId)?.name) || target.itemId}.`)
    },

    prozkoumej({ params }) {
      const items = params.filter((p) => p.type === "item")
      if (items.length === 0) { p("Co chceš prozkoumat?"); return }
      const target = items[0]
      const def = item(target.itemId)
      if (!def) { p("Nic takového tady není."); return }
      p(def.desc)
      if (def.attrs.includes("crate")) {
        const inside = gameData.items.filter((i) => state.items[i.id] === def.id)
        if (inside.length > 0)
          p(`Uvnitř vidíš: ${inside.map((i) => nom(i.name)).join(", ")}.`)
        else
          p("Uvnitř je prázdno.")
      }
    },

    inventar() { describeInventory() },

    mluv({ params }) {
      const raw = params.find((p) => p.type === "string")
      if (!raw) { p("S kým chceš mluvit?"); return }
      const input = noDia(raw.value.toLowerCase())
      const npcDef = gameData.npcs.find(
        (n) => noDia(n.name.toLowerCase()).startsWith(input.split(/\s+/).pop())
      )
      if (!npcDef) { p("Nikoho takového tady nevidím."); return }
      if (!npcDef.dialogs || Object.keys(npcDef.dialogs).length === 0) {
        p("Tato postava s tebou nechce mluvit."); return
      }
      if (getNpcLocation(npcState, npcDef.id) !== state.where) {
        p("Tady nikdo takový není."); return
      }
      dialogSession = startDialogSession(npcDef)
      dialogNpc = npcDef
      showDialogNode()
    },

    otevri({ params }) {
      const items = params.filter((p) => p.type === "item")
      if (items.length === 0) { p("Co chceš otevřít?"); return }
      const target = items[0]
      const def = item(target.itemId)
      if (!def?.attrs.includes("crate")) { p("To nejde otevřít."); return }
      const inside = gameData.items.filter((i) => state.items[i.id] === def.id)
      if (inside.length === 0) p("Bedna je prázdná.")
      else {
        p("Otevřel jsi bednu. Uvnitř je:")
        for (const i of inside) p(`  · ${nom(i.name)}`)
      }
    },

    vezmi_z({ params }) {
      const cratedItems = params.filter((p) => p.type === "item")
      if (cratedItems.length === 0) { p("Co chceš vytáhnout?"); return }
      const target = cratedItems[0]
      state = takeItem(state, target.itemId)
      p(`Vytáhl jsi z bedny: ${nom(item(target.itemId)?.name) || target.itemId}.`)
    },

    dej({ params }) {
      const itemParam = params.find((p) => p.type === "item" && state.items[p.itemId] === "*")
      const raw       = params.find((p) => p.type === "string")
      if (!itemParam || !raw) { p("Komu chceš co dát?"); return }
      const npcInput = noDia(raw.value.toLowerCase()).split(/\s+/).pop()
      const npcDef = gameData.npcs.find(
        (n) => noDia(n.name.toLowerCase()).startsWith(npcInput)
      )
      if (!npcDef) { p("Nikoho takového tady nevidím."); return }
      if (getNpcLocation(npcState, npcDef.id) !== state.where) {
        p("Tady nikdo takový není."); return
      }
      state = { ...state, items: { ...state.items, [itemParam.itemId]: npcDef.id } }
      npcState = giveItemToNpc(npcState, npcDef.id, itemParam.itemId)
      const itemName = nom(item(itemParam.itemId)?.name) || itemParam.itemId

      if (npcDef.id === "gordon" && itemParam.itemId === "jablko") {
        npcState = setNpcMood(npcState, "gordon", "happy")
        if (npcHasItem(npcState, "gordon", "dopis")) {
          npcState = takeItemFromNpc(npcState, "gordon", "dopis")
          state = takeItem(state, "dopis")
          p(`Předal jsi ${itemName} Gordonovi.`)
          p("Gordon se usmívá. \"Přesně takové jsem chtěl! Tady máš ten dopis.\"")
          p("Dostal jsi: dopis.")
          dialogSession = startDialogSession(npc("gordon"), "daroval")
          dialogNpc = npc("gordon")
          showDialogNode()
          return
        }
      }
      p(`Předal jsi ${itemName} ${npcDef.name}.`)
    },

    pouzij({ params }) {
      const carried = params.filter((p) => p.type === "item" && state.items[p.itemId] === "*")[0]
      if (!carried) { p("To u sebe nemáš."); return }
      if (carried.itemId === "klic" && state.where === "dvur") {
        state = { ...state, _revealedExits: { ...state._revealedExits, "dvur:dum": true } }
        p("Otočil jsi klíčem. Dveře do domu se odemkly!")
        describeRoom()
        return
      }
      p("Tady nemá smysl to použít.")
    },

    napoveda() { p("Nápověda dostupná.") },
    uloz()     { p("[headless: ulož přeskočeno]") },
    nacti()    { p("[headless: načti přeskočeno]") },
  }

  function send(command) {
    lines.length = 0

    if (dialogSession) {
      handleDialogInput(command)
      return
    }

    const trimmed = command.trim()
    if (!trimmed) return

    const results = parser.parse(trimmed, gameData, state)
    if (results.length === 0) { p(`Nerozumím: "${trimmed}".`); return }

    const { commandId, params } = results[0]
    const handler = HANDLERS[commandId]
    if (!handler) { p(`Neimplementováno: "${commandId}".`); return }

    tick++
    npcState = tickNpcs(gameData, npcState, tick)
    timers.tick()

    handler({ params: params.flat(), trimmed })
  }

  // Boot: place player in start room (reveal shadows there)
  state = movePlayer(state, state.where)
  describeRoom()

  return {
    send,
    output:      () => [...lines],
    hasOutput:   (text) => lines.some((l) => l.includes(text)),
    getState:    () => state,
    getNpcState: () => npcState,
    getTick:     () => tick,
    inDialog:    () => dialogSession !== null,
  }
}

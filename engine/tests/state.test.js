import { describe, it, expect, beforeEach } from "vitest"
import {
  createState,
  hasAttr,
  addAttr,
  removeAttr,
  takeItem,
  dropItem,
  movePlayer,
  getItemsMatching,
  getExitsMatching,
  isVisible,
} from "../src/state.js"

// ─── Test fixtures ─────────────────────────────────────────────────────────

const makeGameData = () => ({
  rooms: [
    {
      id: "kitchen",
      title: "Kuchyně",
      desc: "Malá kuchyň.",
      exits: [
        { label: "do obýváku", to: "living_room" },
        { label: "ven", to: "garden", hidden: true },
      ],
      attrs: ["start"],
    },
    {
      id: "living_room",
      title: "Obývák",
      desc: "Velký pokoj.",
      exits: [{ label: "do kuchyně", to: "kitchen" }],
      attrs: [],
    },
    {
      id: "garage",
      title: "Garáž",
      desc: "Temná garáž.",
      exits: [],
      attrs: [],
    },
  ],
  items: [
    {
      id: "knife",
      name: "nůž-,e,i,,i,em",
      adj: null,
      desc: "Ostrý nůž.",
      attrs: ["movable"],
      location: "kitchen",
    },
    {
      id: "table",
      name: "stůl-,u,u,u,e,em",
      adj: null,
      desc: "Starý stůl.",
      attrs: ["nonmovable"],
      location: "kitchen",
    },
    {
      id: "key",
      name: "klíč-,e,i,,i,em",
      adj: null,
      desc: "Malý klíč.",
      attrs: ["movable"],
      location: "*", // v inventáři
    },
    {
      id: "car",
      name: "aut-o,a,u,o,ě,em",
      adj: null,
      desc: "Staré auto.",
      attrs: ["movable"],
      location: "garage",
    },
    {
      id: "box",
      name: "bedna-,y,ě,u,ě,ou",
      adj: null,
      desc: "Dřevěná bedna.",
      attrs: ["nonmovable", "crate"],
      location: "kitchen",
    },
    {
      id: "screwdriver",
      name: "šroubovák-,u,u,,u,em",
      adj: null,
      desc: "Křížový šroubovák.",
      attrs: ["movable"],
      location: "box", // v bedně v kuchyni
    },
  ],
  npcs: [],
  commands: [],
})

// Stav po vstupu do kitchen (items v kitchen odhaleny, inventory odhaleno ručně)
const makeVisibleState = (gameData) => {
  let state = createState(gameData)
  state = movePlayer(state, "kitchen") // odstraní shadow z kitchen items
  // Ručně odstraníme shadow z inventory (klíč)
  state = removeAttr(state, "key", "shadow")
  return state
}

// ─── createState() ─────────────────────────────────────────────────────────

describe("createState()", () => {
  it("sets where to room with start attr", () => {
    const state = createState(makeGameData())
    expect(state.where).toBe("kitchen")
  })

  it("falls back to first room if no start attr", () => {
    const data = makeGameData()
    data.rooms[0].attrs = []
    const state = createState(data)
    expect(state.where).toBe("kitchen") // první místnost
  })

  it("items have correct initial locations", () => {
    const state = createState(makeGameData())
    expect(state.items["knife"]).toBe("kitchen")
    expect(state.items["key"]).toBe("*")
    expect(state.items["car"]).toBe("garage")
  })

  it("room items get shadow attr; inventory and crate items do not", () => {
    const state = createState(makeGameData())
    expect(state.itemAttrs["knife"]).toContain("shadow")       // in kitchen → shadow
    expect(state.itemAttrs["table"]).toContain("shadow")       // in kitchen → shadow
    expect(state.itemAttrs["car"]).toContain("shadow")         // in garage → shadow
    expect(state.itemAttrs["key"]).not.toContain("shadow")     // in * (inventory) → no shadow
    expect(state.itemAttrs["screwdriver"]).not.toContain("shadow") // in box (crate) → no shadow
  })

  it("original item attrs preserved alongside shadow", () => {
    const state = createState(makeGameData())
    expect(state.itemAttrs["knife"]).toContain("movable")
    expect(state.itemAttrs["table"]).toContain("nonmovable")
    expect(state.itemAttrs["box"]).toContain("crate")
  })

  it("all rooms created with looked: false", () => {
    const state = createState(makeGameData())
    expect(state.rooms["kitchen"].looked).toBe(false)
    expect(state.rooms["living_room"].looked).toBe(false)
  })

  it("item flex forms pre-computed in _itemForms", () => {
    const state = createState(makeGameData())
    expect(state._itemForms["knife"]).toBeDefined()
    expect(state._itemForms["knife"].names).toHaveLength(6)
    expect(state._itemForms["knife"].names[0]).toBe("nůž")
    expect(state._itemForms["knife"].adjs).toBeNull()
  })

  it("throws if gameData is null", () => {
    expect(() => createState(null)).toThrow(TypeError)
  })

  it("throws if gameData has no rooms", () => {
    expect(() => createState({ items: [] })).toThrow(TypeError)
  })

  it("throws if gameData has no items", () => {
    expect(() => createState({ rooms: [] })).toThrow(TypeError)
  })
})

// ─── isVisible() ───────────────────────────────────────────────────────────

describe("isVisible()", () => {
  it("item with shadow is not visible", () => {
    const state = createState(makeGameData())
    expect(isVisible(state, "knife")).toBe(false)
  })

  it("item without shadow is visible", () => {
    let state = createState(makeGameData())
    state = removeAttr(state, "knife", "shadow")
    expect(isVisible(state, "knife")).toBe(true)
  })
})

// ─── hasAttr() ─────────────────────────────────────────────────────────────

describe("hasAttr()", () => {
  it("returns true for existing attr", () => {
    const state = createState(makeGameData())
    expect(hasAttr(state, "knife", "movable")).toBe(true)
  })

  it("returns true for shadow (added by createState)", () => {
    const state = createState(makeGameData())
    expect(hasAttr(state, "knife", "shadow")).toBe(true)
  })

  it("returns false for non-existent attr", () => {
    const state = createState(makeGameData())
    expect(hasAttr(state, "knife", "crate")).toBe(false)
  })

  it("returns false for unknown itemId", () => {
    const state = createState(makeGameData())
    expect(hasAttr(state, "ghost", "movable")).toBe(false)
  })
})

// ─── addAttr() ─────────────────────────────────────────────────────────────

describe("addAttr()", () => {
  it("adds a new attr", () => {
    const state = createState(makeGameData())
    const newState = addAttr(state, "knife", "wetted")
    expect(hasAttr(newState, "knife", "wetted")).toBe(true)
  })

  it("does not duplicate existing attr", () => {
    const state = createState(makeGameData())
    const newState = addAttr(state, "knife", "movable")
    const count = newState.itemAttrs["knife"].filter(a => a === "movable").length
    expect(count).toBe(1)
  })

  it("returns new state (original unchanged)", () => {
    const state = createState(makeGameData())
    const newState = addAttr(state, "knife", "wetted")
    expect(hasAttr(state, "knife", "wetted")).toBe(false) // original untouched
    expect(hasAttr(newState, "knife", "wetted")).toBe(true)
  })

  it("returns same state reference if attr already present", () => {
    const state = createState(makeGameData())
    const newState = addAttr(state, "knife", "movable")
    expect(newState).toBe(state) // same reference
  })
})

// ─── removeAttr() ──────────────────────────────────────────────────────────

describe("removeAttr()", () => {
  it("removes existing attr", () => {
    const state = createState(makeGameData())
    const newState = removeAttr(state, "knife", "shadow")
    expect(hasAttr(newState, "knife", "shadow")).toBe(false)
  })

  it("preserves other attrs when removing one", () => {
    const state = createState(makeGameData())
    const newState = removeAttr(state, "knife", "shadow")
    expect(hasAttr(newState, "knife", "movable")).toBe(true)
  })

  it("no-op when attr not present", () => {
    const state = createState(makeGameData())
    const newState = removeAttr(state, "knife", "nonexistent")
    expect(newState.itemAttrs["knife"]).toEqual(state.itemAttrs["knife"])
  })

  it("returns new state (original unchanged)", () => {
    const state = createState(makeGameData())
    const newState = removeAttr(state, "knife", "movable")
    expect(hasAttr(state, "knife", "movable")).toBe(true)  // original untouched
    expect(hasAttr(newState, "knife", "movable")).toBe(false)
  })
})

// ─── takeItem() ────────────────────────────────────────────────────────────

describe("takeItem()", () => {
  it("moves item to inventory (*)", () => {
    const state = createState(makeGameData())
    const newState = takeItem(state, "knife")
    expect(newState.items["knife"]).toBe("*")
  })

  it("returns new state (original unchanged)", () => {
    const state = createState(makeGameData())
    const newState = takeItem(state, "knife")
    expect(state.items["knife"]).toBe("kitchen")
    expect(newState.items["knife"]).toBe("*")
  })

  it("other items unaffected", () => {
    const state = createState(makeGameData())
    const newState = takeItem(state, "knife")
    expect(newState.items["table"]).toBe("kitchen")
  })
})

// ─── dropItem() ────────────────────────────────────────────────────────────

describe("dropItem()", () => {
  it("moves item from inventory to current room", () => {
    const state = createState(makeGameData()) // where = kitchen
    const newState = dropItem(state, "key") // key was in inventory
    expect(newState.items["key"]).toBe("kitchen")
  })

  it("returns new state (original unchanged)", () => {
    const state = createState(makeGameData())
    const newState = dropItem(state, "key")
    expect(state.items["key"]).toBe("*")
    expect(newState.items["key"]).toBe("kitchen")
  })
})

// ─── movePlayer() ──────────────────────────────────────────────────────────

describe("movePlayer()", () => {
  it("changes state.where", () => {
    const state = createState(makeGameData())
    const newState = movePlayer(state, "living_room")
    expect(newState.where).toBe("living_room")
  })

  it("removes shadow from items in new room", () => {
    const state = createState(makeGameData())
    // knife is in kitchen; knife has shadow; move to kitchen reveals it
    const newState = movePlayer(state, "kitchen")
    expect(hasAttr(newState, "knife", "shadow")).toBe(false)
    expect(hasAttr(newState, "table", "shadow")).toBe(false)
  })

  it("items in other rooms keep shadow", () => {
    const state = createState(makeGameData())
    const newState = movePlayer(state, "kitchen")
    expect(hasAttr(newState, "car", "shadow")).toBe(true) // car is in garage
  })

  it("inventory items never get shadow (no shadow to remove)", () => {
    const state = createState(makeGameData())
    expect(hasAttr(state, "key", "shadow")).toBe(false) // key in * → no shadow from start
    const newState = movePlayer(state, "kitchen")
    expect(hasAttr(newState, "key", "shadow")).toBe(false) // still no shadow after move
  })

  it("returns new state (original where unchanged)", () => {
    const state = createState(makeGameData())
    const newState = movePlayer(state, "living_room")
    expect(state.where).toBe("kitchen")
    expect(newState.where).toBe("living_room")
  })
})

// ─── getItemsMatching() ────────────────────────────────────────────────────

describe("getItemsMatching()", () => {
  let gameData
  let state

  beforeEach(() => {
    gameData = makeGameData()
    state = makeVisibleState(gameData) // kitchen items visible, key visible
  })

  it("matches item name in nominative (case 0)", () => {
    const result = getItemsMatching(gameData, state, "nůž", 0, { near: true })
    expect(result.map(r => r.itemId)).toContain("knife")
  })

  it("matches item name in accusative (case 3)", () => {
    // nůž acc = nůž (same as nom for this word)
    const result = getItemsMatching(gameData, state, "nůž", 3, { near: true })
    expect(result.map(r => r.itemId)).toContain("knife")
  })

  it("matches without diacritics (nuz → nůž)", () => {
    const result = getItemsMatching(gameData, state, "nuz", 3, { near: true })
    expect(result.map(r => r.itemId)).toContain("knife")
  })

  it("prefix match: 'nůž' prefix matches 'nůže' (genitive case 1)", () => {
    const result = getItemsMatching(gameData, state, "nůž", 1, { near: true })
    expect(result.map(r => r.itemId)).toContain("knife")
  })

  it("filter carried: returns only inventory items", () => {
    const result = getItemsMatching(gameData, state, "klíč", 0, { carried: true })
    expect(result.map(r => r.itemId)).toEqual(["key"])
  })

  it("filter carried: excludes non-inventory items", () => {
    const result = getItemsMatching(gameData, state, "nůž", 0, { carried: true })
    expect(result).toHaveLength(0)
  })

  it("filter hereOrCrated: includes items in current room", () => {
    const result = getItemsMatching(gameData, state, "nůž", 0, { hereOrCrated: true })
    expect(result.map(r => r.itemId)).toContain("knife")
  })

  it("filter hereOrCrated: excludes items in other rooms", () => {
    const result = getItemsMatching(gameData, state, "auto", 0, { hereOrCrated: true })
    expect(result).toHaveLength(0)
  })

  it("filter hereOrCrated: includes items in a crate that is here", () => {
    // Šroubovák je v bedně; bedna je v kitchen; hráč je v kitchen
    // Musíme odhalit šroubovák (remove shadow)
    const visibleState = removeAttr(state, "screwdriver", "shadow")
    const result = getItemsMatching(gameData, visibleState, "šroubovák", 0, { hereOrCrated: true })
    expect(result.map(r => r.itemId)).toContain("screwdriver")
  })

  it("filter movable: excludes nonmovable items", () => {
    const result = getItemsMatching(gameData, state, "stůl", 0, { movable: true, hereOrCrated: true })
    expect(result).toHaveLength(0)
  })

  it("filter movable: includes movable items", () => {
    const result = getItemsMatching(gameData, state, "nůž", 0, { movable: true, hereOrCrated: true })
    expect(result.map(r => r.itemId)).toContain("knife")
  })

  it("hidden items (shadow) not returned", () => {
    // Shadow znovu přidáme ke knife
    const hiddenState = addAttr(state, "knife", "shadow")
    const result = getItemsMatching(gameData, hiddenState, "nůž", 0, { near: true })
    expect(result.map(r => r.itemId)).not.toContain("knife")
  })

  it("empty name input returns empty array", () => {
    const result = getItemsMatching(gameData, state, "", 0, { near: true })
    expect(result).toHaveLength(0)
  })

  it("unknown item name returns empty array", () => {
    const result = getItemsMatching(gameData, state, "drak", 0, { near: true })
    expect(result).toHaveLength(0)
  })

  it("filter near: includes inventory items", () => {
    const result = getItemsMatching(gameData, state, "klíč", 0, { near: true })
    expect(result.map(r => r.itemId)).toContain("key")
  })

  it("result items have type: 'item'", () => {
    const result = getItemsMatching(gameData, state, "nůž", 0, { near: true })
    expect(result[0].type).toBe("item")
  })
})

// ─── getExitsMatching() ────────────────────────────────────────────────────

describe("getExitsMatching()", () => {
  let gameData
  let state

  beforeEach(() => {
    gameData = makeGameData()
    state = makeVisibleState(gameData) // where = kitchen
  })

  it("matches exit by full label", () => {
    const result = getExitsMatching(gameData, state, "do obýváku")
    expect(result).toHaveLength(1)
    expect(result[0].to).toBe("living_room")
  })

  it("substring match: partial label works", () => {
    const result = getExitsMatching(gameData, state, "obyvaku") // noDia substring
    expect(result).toHaveLength(1)
    expect(result[0].to).toBe("living_room")
  })

  it("diacritics-free match", () => {
    const result = getExitsMatching(gameData, state, "do obyvaku")
    expect(result).toHaveLength(1)
    expect(result[0].to).toBe("living_room")
  })

  it("hidden exits are excluded", () => {
    const result = getExitsMatching(gameData, state, "ven")
    expect(result).toHaveLength(0)
  })

  it("unknown direction returns empty array", () => {
    const result = getExitsMatching(gameData, state, "na mars")
    expect(result).toHaveLength(0)
  })

  it("result items have type: 'exit'", () => {
    const result = getExitsMatching(gameData, state, "do obýváku")
    expect(result[0].type).toBe("exit")
    expect(result[0].label).toBe("do obýváku")
  })

  it("returns empty array when in room with no exits", () => {
    const noExitState = movePlayer(state, "garage")
    const result = getExitsMatching(gameData, noExitState, "ven")
    expect(result).toHaveLength(0)
  })
})

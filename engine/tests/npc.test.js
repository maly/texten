import { describe, it, expect, beforeEach } from "vitest"
import {
  createNpcState,
  getNpcsHere,
  getNpcLocation,
  moveNpc,
  tickNpcs,
  getNpcMood,
  setNpcMood,
  getNpcInventory,
  giveItemToNpc,
  takeItemFromNpc,
  npcHasItem,
  getDialogNode,
  startDialogSession,
  advanceDialog,
  isDialogOver,
} from "../src/npc.js"

// ─── Test fixtures ─────────────────────────────────────────────────────────

const makeGameData = () => ({
  npcs: [
    {
      id: "gordon",
      name: "Gordon",
      desc: "Vysoký farmář.",
      location: "barn",
      state: "friendly",
      inventory: ["pitchfork"],
      schedule: [
        { tick: 0, location: "barn" },
        { tick: 5, location: "field" },
        { tick: 10, location: "barn" },
      ],
      dialogs: {
        start: {
          text: "Ahoj, co tě sem přivádí?",
          choices: [
            { text: "Hledám práci.", next: "work" },
            { text: "Jen se dívám.", next: "bye" },
            { text: "Nashledanou.", next: null },
          ],
        },
        work: {
          text: "Práce je tady dost.",
          choices: [{ text: "Výborně.", next: "end" }],
        },
        bye: {
          text: "Jasně, rozhlédni se.",
          choices: [],
        },
        end: {
          text: "Tak se uvidíme zítra ráno.",
          choices: [],
        },
      },
    },
    {
      id: "dog",
      name: "pes",
      desc: "Malý pes.",
      location: "garden",
      state: "neutral",
      inventory: [],
      schedule: [],
      dialogs: {},
    },
  ],
})

// ─── createNpcState() ──────────────────────────────────────────────────────

describe("createNpcState()", () => {
  it("returns state with entry for each NPC", () => {
    const ns = createNpcState(makeGameData())
    expect(ns["gordon"]).toBeDefined()
    expect(ns["dog"]).toBeDefined()
  })

  it("sets initial location from gameData", () => {
    const ns = createNpcState(makeGameData())
    expect(ns["gordon"].location).toBe("barn")
    expect(ns["dog"].location).toBe("garden")
  })

  it("sets initial mood from NPC state field", () => {
    const ns = createNpcState(makeGameData())
    expect(ns["gordon"].mood).toBe("friendly")
    expect(ns["dog"].mood).toBe("neutral")
  })

  it("copies initial inventory (not a reference)", () => {
    const gameData = makeGameData()
    const ns = createNpcState(gameData)
    ns["gordon"].inventory.push("extra")
    expect(gameData.npcs[0].inventory).toHaveLength(1) // original unaffected
  })

  it("NPC with empty inventory starts with empty array", () => {
    const ns = createNpcState(makeGameData())
    expect(ns["dog"].inventory).toEqual([])
  })

  it("throws if gameData has no npcs array", () => {
    expect(() => createNpcState(null)).toThrow(TypeError)
    expect(() => createNpcState({})).toThrow(TypeError)
  })
})

// ─── getNpcsHere() ─────────────────────────────────────────────────────────

describe("getNpcsHere()", () => {
  let gameData, ns

  beforeEach(() => {
    gameData = makeGameData()
    ns = createNpcState(gameData)
  })

  it("returns NPCs in specified room", () => {
    const result = getNpcsHere(gameData, ns, "barn")
    expect(result.map((n) => n.id)).toContain("gordon")
  })

  it("does not return NPCs in other rooms", () => {
    const result = getNpcsHere(gameData, ns, "barn")
    expect(result.map((n) => n.id)).not.toContain("dog")
  })

  it("returns empty array when no NPCs in room", () => {
    expect(getNpcsHere(gameData, ns, "kitchen")).toHaveLength(0)
  })

  it("returns multiple NPCs when they share a room", () => {
    const ns2 = moveNpc(ns, "dog", "barn") // move dog to barn too
    const result = getNpcsHere(gameData, ns2, "barn")
    expect(result).toHaveLength(2)
  })

  it("result objects include id and name from gameData", () => {
    const result = getNpcsHere(gameData, ns, "barn")
    expect(result[0].id).toBe("gordon")
    expect(result[0].name).toBe("Gordon")
  })
})

// ─── getNpcLocation() ──────────────────────────────────────────────────────

describe("getNpcLocation()", () => {
  it("returns current NPC location", () => {
    const ns = createNpcState(makeGameData())
    expect(getNpcLocation(ns, "gordon")).toBe("barn")
  })

  it("returns undefined for unknown NPC", () => {
    const ns = createNpcState(makeGameData())
    expect(getNpcLocation(ns, "ghost")).toBeUndefined()
  })
})

// ─── moveNpc() ─────────────────────────────────────────────────────────────

describe("moveNpc()", () => {
  it("changes NPC location", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = moveNpc(ns, "gordon", "field")
    expect(getNpcLocation(ns2, "gordon")).toBe("field")
  })

  it("returns new state (original unchanged)", () => {
    const ns = createNpcState(makeGameData())
    moveNpc(ns, "gordon", "field")
    expect(getNpcLocation(ns, "gordon")).toBe("barn") // original intact
  })

  it("other NPCs unaffected by move", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = moveNpc(ns, "gordon", "field")
    expect(getNpcLocation(ns2, "dog")).toBe("garden")
  })
})

// ─── tickNpcs() ────────────────────────────────────────────────────────────

describe("tickNpcs()", () => {
  let gameData, ns

  beforeEach(() => {
    gameData = makeGameData()
    ns = createNpcState(gameData)
  })

  it("tick 0: NPC at schedule[0].location", () => {
    const ns2 = tickNpcs(gameData, ns, 0)
    expect(getNpcLocation(ns2, "gordon")).toBe("barn")
  })

  it("tick 5: NPC moves to schedule[1].location", () => {
    const ns2 = tickNpcs(gameData, ns, 5)
    expect(getNpcLocation(ns2, "gordon")).toBe("field")
  })

  it("tick 7: NPC stays at last applicable schedule location (field)", () => {
    const ns2 = tickNpcs(gameData, ns, 7)
    expect(getNpcLocation(ns2, "gordon")).toBe("field")
  })

  it("tick 10: NPC moves back to barn", () => {
    const ns2 = tickNpcs(gameData, ns, 10)
    expect(getNpcLocation(ns2, "gordon")).toBe("barn")
  })

  it("NPC with empty schedule stays at initial location", () => {
    const ns2 = tickNpcs(gameData, ns, 99)
    expect(getNpcLocation(ns2, "dog")).toBe("garden")
  })

  it("tick before any schedule entry: NPC stays at initial location", () => {
    // Modify gordon's schedule to start at tick 3
    gameData.npcs[0].schedule = [{ tick: 3, location: "field" }]
    const ns2 = tickNpcs(gameData, createNpcState(gameData), 1)
    expect(getNpcLocation(ns2, "gordon")).toBe("barn") // no schedule applies yet
  })

  it("returns new state (original unchanged)", () => {
    tickNpcs(gameData, ns, 5)
    expect(getNpcLocation(ns, "gordon")).toBe("barn") // original unchanged
  })
})

// ─── getNpcMood() / setNpcMood() ───────────────────────────────────────────

describe("getNpcMood() / setNpcMood()", () => {
  it("returns initial mood", () => {
    const ns = createNpcState(makeGameData())
    expect(getNpcMood(ns, "gordon")).toBe("friendly")
  })

  it("setNpcMood changes the mood", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = setNpcMood(ns, "gordon", "hostile")
    expect(getNpcMood(ns2, "gordon")).toBe("hostile")
  })

  it("setNpcMood returns new state (original unchanged)", () => {
    const ns = createNpcState(makeGameData())
    setNpcMood(ns, "gordon", "hostile")
    expect(getNpcMood(ns, "gordon")).toBe("friendly")
  })

  it("other NPCs unaffected by mood change", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = setNpcMood(ns, "gordon", "hostile")
    expect(getNpcMood(ns2, "dog")).toBe("neutral")
  })
})

// ─── NPC inventory ─────────────────────────────────────────────────────────

describe("getNpcInventory()", () => {
  it("returns current inventory", () => {
    const ns = createNpcState(makeGameData())
    expect(getNpcInventory(ns, "gordon")).toEqual(["pitchfork"])
  })

  it("returns empty array for NPC with no items", () => {
    const ns = createNpcState(makeGameData())
    expect(getNpcInventory(ns, "dog")).toEqual([])
  })
})

describe("giveItemToNpc()", () => {
  it("adds item to NPC inventory", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = giveItemToNpc(ns, "gordon", "hat")
    expect(getNpcInventory(ns2, "gordon")).toContain("hat")
  })

  it("does not duplicate existing item", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = giveItemToNpc(ns, "gordon", "pitchfork")
    const count = getNpcInventory(ns2, "gordon").filter((i) => i === "pitchfork").length
    expect(count).toBe(1)
  })

  it("returns new state (original unchanged)", () => {
    const ns = createNpcState(makeGameData())
    giveItemToNpc(ns, "gordon", "hat")
    expect(getNpcInventory(ns, "gordon")).not.toContain("hat")
  })
})

describe("takeItemFromNpc()", () => {
  it("removes item from NPC inventory", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = takeItemFromNpc(ns, "gordon", "pitchfork")
    expect(getNpcInventory(ns2, "gordon")).not.toContain("pitchfork")
  })

  it("no-op if NPC doesn't have the item", () => {
    const ns = createNpcState(makeGameData())
    const ns2 = takeItemFromNpc(ns, "gordon", "nonexistent")
    expect(getNpcInventory(ns2, "gordon")).toEqual(getNpcInventory(ns, "gordon"))
  })

  it("returns new state (original unchanged)", () => {
    const ns = createNpcState(makeGameData())
    takeItemFromNpc(ns, "gordon", "pitchfork")
    expect(getNpcInventory(ns, "gordon")).toContain("pitchfork")
  })
})

describe("npcHasItem()", () => {
  it("returns true if NPC has the item", () => {
    const ns = createNpcState(makeGameData())
    expect(npcHasItem(ns, "gordon", "pitchfork")).toBe(true)
  })

  it("returns false if NPC doesn't have the item", () => {
    const ns = createNpcState(makeGameData())
    expect(npcHasItem(ns, "gordon", "hat")).toBe(false)
  })

  it("returns false for unknown NPC", () => {
    const ns = createNpcState(makeGameData())
    expect(npcHasItem(ns, "ghost", "hat")).toBe(false)
  })
})

// ─── Dialog ────────────────────────────────────────────────────────────────

describe("getDialogNode()", () => {
  it("returns a node by its ID", () => {
    const [gordon] = makeGameData().npcs
    const node = getDialogNode(gordon, "start")
    expect(node.text).toBe("Ahoj, co tě sem přivádí?")
    expect(node.choices).toHaveLength(3)
  })

  it("returns null for unknown node ID", () => {
    const [gordon] = makeGameData().npcs
    expect(getDialogNode(gordon, "nonexistent")).toBeNull()
  })

  it("returns null when NPC has no dialogs", () => {
    const [, dog] = makeGameData().npcs
    expect(getDialogNode(dog, "start")).toBeNull()
  })
})

describe("startDialogSession()", () => {
  it("creates a session at the 'start' node by default", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon)
    expect(session.nodeId).toBe("start")
    expect(session.npcId).toBe("gordon")
  })

  it("creates a session at a specified node", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon, "work")
    expect(session.nodeId).toBe("work")
  })

  it("throws when NPC has no dialogs and no 'start' node", () => {
    const [, dog] = makeGameData().npcs
    expect(() => startDialogSession(dog)).toThrow()
  })
})

describe("advanceDialog()", () => {
  it("follows choice[0] to the next node", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon)
    const next = advanceDialog(gordon, session, 0) // choice[0] → "work"
    expect(next.nodeId).toBe("work")
  })

  it("follows choice[1] to the correct next node", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon)
    const next = advanceDialog(gordon, session, 1) // choice[1] → "bye"
    expect(next.nodeId).toBe("bye")
  })

  it("returns null when choice.next is null (end of dialog)", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon)
    const result = advanceDialog(gordon, session, 2) // choice[2].next = null
    expect(result).toBeNull()
  })

  it("returns null when current node has no choices", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon, "bye") // bye has empty choices
    expect(advanceDialog(gordon, session, 0)).toBeNull()
  })

  it("maintains npcId across session advances", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon)
    const next = advanceDialog(gordon, session, 0)
    expect(next.npcId).toBe("gordon")
  })
})

describe("isDialogOver()", () => {
  it("returns false when session has choices", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon) // start has choices
    expect(isDialogOver(gordon, session)).toBe(false)
  })

  it("returns true when current node has empty choices", () => {
    const [gordon] = makeGameData().npcs
    const session = startDialogSession(gordon, "bye") // bye has no choices
    expect(isDialogOver(gordon, session)).toBe(true)
  })

  it("null session means dialog is over", () => {
    const [gordon] = makeGameData().npcs
    expect(isDialogOver(gordon, null)).toBe(true)
  })
})

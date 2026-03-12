import { describe, it, expect, beforeEach } from "vitest"
import { createSaveSystem } from "../src/save.js"

// ─── Mock localStorage ────────────────────────────────────────────────────────

const makeStorage = () => {
  const store = new Map()
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  }
}

// ─── createSaveSystem() ───────────────────────────────────────────────────────

describe("createSaveSystem()", () => {
  it("returns save API", () => {
    const s = createSaveSystem("testgame", { storage: makeStorage() })
    expect(typeof s.save).toBe("function")
    expect(typeof s.load).toBe("function")
    expect(typeof s.list).toBe("function")
  })
})

// ─── save() ──────────────────────────────────────────────────────────────────

describe("save()", () => {
  let sys, storage

  beforeEach(() => {
    storage = makeStorage()
    sys = createSaveSystem("testgame", { storage })
  })

  it("saves state to a slot without error", () => {
    const state = { where: "kitchen", items: { knife: "kitchen" } }
    expect(() => sys.save(state, 1)).not.toThrow()
  })

  it("saved data can be retrieved by load()", () => {
    const state = { where: "kitchen", items: {} }
    sys.save(state, 1)
    const loaded = sys.load(1)
    expect(loaded.where).toBe("kitchen")
  })

  it("saves to different slots independently", () => {
    sys.save({ where: "kitchen" }, 1)
    sys.save({ where: "garden" }, 2)
    expect(sys.load(1).where).toBe("kitchen")
    expect(sys.load(2).where).toBe("garden")
  })

  it("overwrites existing slot on second save", () => {
    sys.save({ where: "kitchen" }, 1)
    sys.save({ where: "garden" }, 1)
    expect(sys.load(1).where).toBe("garden")
  })

  it("save adds a timestamp to the saved data", () => {
    sys.save({ where: "kitchen" }, 1)
    const loaded = sys.load(1)
    expect(typeof loaded.timestamp).toBe("number")
    expect(loaded.timestamp).toBeGreaterThan(0)
  })

  it("save with optional remark stores the remark", () => {
    sys.save({ where: "kitchen" }, 1, "Po nalezení klíče")
    const loaded = sys.load(1)
    expect(loaded.remark).toBe("Po nalezení klíče")
  })

  it("complex nested state survives save/load round-trip", () => {
    const state = {
      where: "barn",
      items: { knife: "kitchen", key: "*" },
      itemAttrs: { knife: ["movable"], key: ["movable"] },
      vars: { globalTimer: 42 },
    }
    sys.save(state, 3)
    const loaded = sys.load(3)
    expect(loaded.items).toEqual(state.items)
    expect(loaded.itemAttrs).toEqual(state.itemAttrs)
    expect(loaded.vars).toEqual(state.vars)
  })

  it("slot numbers 1-9 all work", () => {
    for (let i = 1; i <= 9; i++) {
      sys.save({ where: `room${i}` }, i)
      expect(sys.load(i).where).toBe(`room${i}`)
    }
  })
})

// ─── load() ──────────────────────────────────────────────────────────────────

describe("load()", () => {
  let sys

  beforeEach(() => {
    sys = createSaveSystem("testgame", { storage: makeStorage() })
  })

  it("returns null for empty slot", () => {
    expect(sys.load(1)).toBeNull()
  })

  it("returns null for slot that was never used", () => {
    sys.save({ where: "a" }, 1)
    expect(sys.load(5)).toBeNull() // slot 5 never saved
  })
})

// ─── list() ──────────────────────────────────────────────────────────────────

describe("list()", () => {
  it("returns array of 9 entries (null for empty slots)", () => {
    const sys = createSaveSystem("testgame", { storage: makeStorage() })
    const l = sys.list()
    expect(l).toHaveLength(9)
  })

  it("used slots show save data, empty slots are null", () => {
    const sys = createSaveSystem("testgame", { storage: makeStorage() })
    sys.save({ where: "x" }, 2, "Test save")
    const l = sys.list()
    expect(l[0]).toBeNull()      // slot 1 empty
    expect(l[1]).not.toBeNull()  // slot 2 has data
    expect(l[1].remark).toBe("Test save")
    expect(l[2]).toBeNull()      // slot 3 empty
  })
})

// ─── isolation between game IDs ───────────────────────────────────────────────

describe("isolation between game IDs", () => {
  it("two games with different IDs don't share saves", () => {
    const storage = makeStorage()
    const game1 = createSaveSystem("game1", { storage })
    const game2 = createSaveSystem("game2", { storage })
    game1.save({ where: "room-a" }, 1)
    expect(game2.load(1)).toBeNull()
  })
})

// ─── compression round-trip ───────────────────────────────────────────────────

describe("custom compress/decompress", () => {
  it("custom compress/decompress are used and round-trip correctly", () => {
    const compressed = []
    const compress = (s) => { const r = `[COMPRESSED:${s}]`; compressed.push(r); return r }
    const decompress = (s) => s.replace(/^\[COMPRESSED:/, "").replace(/\]$/, "")

    const sys = createSaveSystem("game", {
      storage: makeStorage(),
      compress,
      decompress,
    })

    sys.save({ where: "vault" }, 1)
    expect(compressed.length).toBeGreaterThan(0) // compress was called
    expect(sys.load(1).where).toBe("vault")
  })
})

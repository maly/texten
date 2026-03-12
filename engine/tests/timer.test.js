import { describe, it, expect, vi } from "vitest"
import { createTimerSystem } from "../src/timer.js"

// ─── createTimerSystem() ─────────────────────────────────────────────────────

describe("createTimerSystem()", () => {
  it("returns timer API", () => {
    const t = createTimerSystem()
    expect(typeof t.add).toBe("function")
    expect(typeof t.tick).toBe("function")
    expect(typeof t.clear).toBe("function")
    expect(typeof t.has).toBe("function")
    expect(typeof t.count).toBe("function")
  })

  it("starts with zero timers", () => {
    expect(createTimerSystem().count()).toBe(0)
  })
})

// ─── add() / has() / count() ─────────────────────────────────────────────────

describe("add() / has() / count()", () => {
  it("add() registers a timer", () => {
    const t = createTimerSystem()
    t.add("t1", 3, vi.fn())
    expect(t.has("t1")).toBe(true)
  })

  it("count() reflects number of active timers", () => {
    const t = createTimerSystem()
    t.add("a", 1, vi.fn())
    t.add("b", 2, vi.fn())
    expect(t.count()).toBe(2)
  })

  it("has() returns false for unknown timer id", () => {
    expect(createTimerSystem().has("ghost")).toBe(false)
  })

  it("adding timer with same id overwrites the old one", () => {
    const t = createTimerSystem()
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    t.add("t1", 5, fn1)
    t.add("t1", 2, fn2)
    t.tick()
    t.tick()
    expect(fn2).toHaveBeenCalled()
    expect(fn1).not.toHaveBeenCalled()
    expect(t.count()).toBe(0) // fn2 fired after 2 ticks
  })
})

// ─── tick() ──────────────────────────────────────────────────────────────────

describe("tick()", () => {
  it("callback called after exact number of ticks", () => {
    const t = createTimerSystem()
    const fn = vi.fn()
    t.add("t1", 3, fn)
    t.tick()
    t.tick()
    expect(fn).not.toHaveBeenCalled()
    t.tick() // 3rd tick
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("timer removed after firing", () => {
    const t = createTimerSystem()
    t.add("t1", 1, vi.fn())
    t.tick()
    expect(t.has("t1")).toBe(false)
    expect(t.count()).toBe(0)
  })

  it("callback not called again after firing (removed)", () => {
    const t = createTimerSystem()
    const fn = vi.fn()
    t.add("t1", 1, fn)
    t.tick()
    t.tick()
    t.tick()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("multiple timers tick independently", () => {
    const t = createTimerSystem()
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    t.add("a", 1, fn1)
    t.add("b", 3, fn2)
    t.tick() // fn1 fires
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()
    t.tick()
    t.tick() // fn2 fires
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it("tick() with no timers is a no-op", () => {
    const t = createTimerSystem()
    expect(() => t.tick()).not.toThrow()
  })

  it("timer with 1 tick fires on first tick", () => {
    const t = createTimerSystem()
    const fn = vi.fn()
    t.add("fast", 1, fn)
    t.tick()
    expect(fn).toHaveBeenCalled()
  })
})

// ─── clear() ─────────────────────────────────────────────────────────────────

describe("clear()", () => {
  it("removes a timer before it fires", () => {
    const t = createTimerSystem()
    const fn = vi.fn()
    t.add("t1", 5, fn)
    t.clear("t1")
    for (let i = 0; i < 10; i++) t.tick()
    expect(fn).not.toHaveBeenCalled()
  })

  it("clear on non-existent timer is a no-op", () => {
    const t = createTimerSystem()
    expect(() => t.clear("ghost")).not.toThrow()
  })

  it("has() returns false after clear", () => {
    const t = createTimerSystem()
    t.add("t1", 5, vi.fn())
    t.clear("t1")
    expect(t.has("t1")).toBe(false)
  })

  it("count decrements after clear", () => {
    const t = createTimerSystem()
    t.add("a", 5, vi.fn())
    t.add("b", 5, vi.fn())
    t.clear("a")
    expect(t.count()).toBe(1)
  })
})

// ─── edge cases ───────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("timer fires even if new timers are added during tick", () => {
    const t = createTimerSystem()
    const fn = vi.fn()
    t.add("trigger", 1, () => {
      fn()
      t.add("child", 1, vi.fn()) // add during tick
    })
    t.tick()
    expect(fn).toHaveBeenCalled()
    expect(t.count()).toBe(1) // child timer registered
  })

  it("timer added inside callback with id=0 ticks works", () => {
    const t = createTimerSystem()
    t.add("parent", 1, () => t.add("child", 2, vi.fn()))
    t.tick()
    expect(t.has("child")).toBe(true)
  })
})

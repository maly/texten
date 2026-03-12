import { describe, it, expect, vi } from "vitest"
import { createFSM } from "../src/fsm.js"

// ─── createFSM() ─────────────────────────────────────────────────────────────

describe("createFSM()", () => {
  it("returns FSM API", () => {
    const fsm = createFSM({ idle: {} }, "idle")
    expect(typeof fsm.getState).toBe("function")
    expect(typeof fsm.transition).toBe("function")
    expect(typeof fsm.tick).toBe("function")
  })

  it("initial state is set to given value", () => {
    const fsm = createFSM({ idle: {}, active: {} }, "idle")
    expect(fsm.getState()).toBe("idle")
  })

  it("calls enter() on initial state when created", () => {
    const enter = vi.fn()
    createFSM({ start: { enter } }, "start")
    expect(enter).toHaveBeenCalledTimes(1)
  })

  it("does not call tick() on creation", () => {
    const tick = vi.fn()
    createFSM({ start: { tick } }, "start")
    expect(tick).not.toHaveBeenCalled()
  })

  it("states without enter/tick/exit don't crash", () => {
    expect(() => createFSM({ empty: {} }, "empty")).not.toThrow()
  })

  it("throws if initial state not found", () => {
    expect(() => createFSM({ a: {} }, "nonexistent")).toThrow()
  })
})

// ─── tick() ──────────────────────────────────────────────────────────────────

describe("tick()", () => {
  it("calls tick() of current state", () => {
    const tick = vi.fn()
    const fsm = createFSM({ active: { tick } }, "active")
    fsm.tick()
    expect(tick).toHaveBeenCalledTimes(1)
  })

  it("multiple ticks call tick() each time", () => {
    const tick = vi.fn()
    const fsm = createFSM({ active: { tick } }, "active")
    fsm.tick()
    fsm.tick()
    fsm.tick()
    expect(tick).toHaveBeenCalledTimes(3)
  })

  it("tick() on state without tick callback is a no-op", () => {
    const fsm = createFSM({ idle: {} }, "idle")
    expect(() => fsm.tick()).not.toThrow()
  })

  it("tick() calls tick of CURRENT state, not original state", () => {
    const tickA = vi.fn()
    const tickB = vi.fn()
    const fsm = createFSM({ a: { tick: tickA }, b: { tick: tickB } }, "a")
    fsm.transition("b")
    fsm.tick()
    expect(tickA).not.toHaveBeenCalled()
    expect(tickB).toHaveBeenCalledTimes(1)
  })
})

// ─── transition() ────────────────────────────────────────────────────────────

describe("transition()", () => {
  it("changes current state", () => {
    const fsm = createFSM({ a: {}, b: {} }, "a")
    fsm.transition("b")
    expect(fsm.getState()).toBe("b")
  })

  it("calls exit() on current state before leaving", () => {
    const exit = vi.fn()
    const fsm = createFSM({ a: { exit }, b: {} }, "a")
    fsm.transition("b")
    expect(exit).toHaveBeenCalledTimes(1)
  })

  it("calls enter() on new state after arriving", () => {
    const enter = vi.fn()
    const fsm = createFSM({ a: {}, b: { enter } }, "a")
    fsm.transition("b")
    expect(enter).toHaveBeenCalledTimes(1)
  })

  it("exit called BEFORE enter on transition", () => {
    const order = []
    const fsm = createFSM(
      {
        a: { exit: () => order.push("exit-a") },
        b: { enter: () => order.push("enter-b") },
      },
      "a"
    )
    fsm.transition("b")
    expect(order).toEqual(["exit-a", "enter-b"])
  })

  it("throws when transitioning to unknown state", () => {
    const fsm = createFSM({ a: {} }, "a")
    expect(() => fsm.transition("nonexistent")).toThrow()
  })

  it("transition to same state calls exit then enter again", () => {
    const enter = vi.fn()
    const exit = vi.fn()
    const fsm = createFSM({ a: { enter, exit } }, "a")
    // Initial enter already called once
    fsm.transition("a") // re-enter same state
    expect(exit).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(2) // once on create, once on re-enter
  })

  it("chain of transitions works correctly", () => {
    const fsm = createFSM({ a: {}, b: {}, c: {} }, "a")
    fsm.transition("b")
    fsm.transition("c")
    expect(fsm.getState()).toBe("c")
  })
})

// ─── negative tests ───────────────────────────────────────────────────────────

describe("negative", () => {
  it("throws if states is not an object", () => {
    expect(() => createFSM(null, "a")).toThrow()
  })

  it("throws if initialState is not a string", () => {
    expect(() => createFSM({ a: {} }, null)).toThrow()
  })

  it("throws if states is empty object", () => {
    expect(() => createFSM({}, "start")).toThrow()
  })
})

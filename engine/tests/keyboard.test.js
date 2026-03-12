import { describe, it, expect, vi } from "vitest"
import { createKeyboard } from "../src/keyboard.js"

// ─── createKeyboard() ────────────────────────────────────────────────────────

describe("createKeyboard()", () => {
  it("returns keyboard API", () => {
    const kb = createKeyboard()
    expect(typeof kb.handleKey).toBe("function")
    expect(typeof kb.getBuffer).toBe("function")
    expect(typeof kb.onSubmit).toBe("function")
    expect(typeof kb.onRecall).toBe("function")
  })

  it("initial buffer is empty", () => {
    expect(createKeyboard().getBuffer()).toBe("")
  })
})

// ─── handleKey() — character input ──────────────────────────────────────────

describe("handleKey() — character input", () => {
  it("adds typed character to buffer", () => {
    const kb = createKeyboard()
    kb.handleKey("a")
    expect(kb.getBuffer()).toBe("a")
  })

  it("accumulates multiple characters", () => {
    const kb = createKeyboard()
    "hello".split("").forEach((c) => kb.handleKey(c))
    expect(kb.getBuffer()).toBe("hello")
  })

  it("handles space character", () => {
    const kb = createKeyboard()
    kb.handleKey("j")
    kb.handleKey("d")
    kb.handleKey("i")
    kb.handleKey(" ")
    kb.handleKey("v")
    expect(kb.getBuffer()).toBe("jdi v")
  })

  it("handles diacritic characters (e.g. Czech ž, š, č)", () => {
    const kb = createKeyboard()
    kb.handleKey("ž")
    kb.handleKey("l")
    kb.handleKey("u")
    expect(kb.getBuffer()).toBe("žlu")
  })

  it("ignores multi-char key names (special keys like Shift, Control)", () => {
    const kb = createKeyboard()
    kb.handleKey("Shift")
    kb.handleKey("Control")
    expect(kb.getBuffer()).toBe("")
  })

  it("ignores function keys (F1, F2...)", () => {
    const kb = createKeyboard()
    kb.handleKey("F1")
    kb.handleKey("F12")
    expect(kb.getBuffer()).toBe("")
  })
})

// ─── handleKey() — Backspace ─────────────────────────────────────────────────

describe("handleKey() — Backspace", () => {
  it("removes last character from buffer", () => {
    const kb = createKeyboard()
    kb.handleKey("a")
    kb.handleKey("b")
    kb.handleKey("Backspace")
    expect(kb.getBuffer()).toBe("a")
  })

  it("Backspace on empty buffer stays empty", () => {
    const kb = createKeyboard()
    kb.handleKey("Backspace")
    expect(kb.getBuffer()).toBe("")
  })

  it("multiple Backspaces clear the buffer", () => {
    const kb = createKeyboard()
    "abc".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Backspace")
    kb.handleKey("Backspace")
    kb.handleKey("Backspace")
    expect(kb.getBuffer()).toBe("")
  })
})

// ─── handleKey() — Enter ─────────────────────────────────────────────────────

describe("handleKey() — Enter", () => {
  it("calls onSubmit with current buffer", () => {
    const kb = createKeyboard()
    const onSubmit = vi.fn()
    kb.onSubmit(onSubmit)
    "jdi ven".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Enter")
    expect(onSubmit).toHaveBeenCalledWith("jdi ven")
  })

  it("clears buffer after Enter", () => {
    const kb = createKeyboard()
    "abc".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Enter")
    expect(kb.getBuffer()).toBe("")
  })

  it("Enter with empty buffer calls onSubmit with empty string", () => {
    const kb = createKeyboard()
    const onSubmit = vi.fn()
    kb.onSubmit(onSubmit)
    kb.handleKey("Enter")
    expect(onSubmit).toHaveBeenCalledWith("")
  })

  it("onSubmit not set: Enter is a no-op (no crash)", () => {
    const kb = createKeyboard()
    kb.handleKey("a")
    expect(() => kb.handleKey("Enter")).not.toThrow()
  })

  it("multiple Enter presses each call onSubmit", () => {
    const kb = createKeyboard()
    const onSubmit = vi.fn()
    kb.onSubmit(onSubmit)
    kb.handleKey("Enter")
    kb.handleKey("Enter")
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })
})

// ─── handleKey() — ArrowUp (recall) ──────────────────────────────────────────

describe("handleKey() — ArrowUp (recall last command)", () => {
  it("ArrowUp recalls last submitted command", () => {
    const kb = createKeyboard()
    "jdi ven".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Enter")
    kb.handleKey("ArrowUp")
    expect(kb.getBuffer()).toBe("jdi ven")
  })

  it("ArrowUp before any submission returns empty string", () => {
    const kb = createKeyboard()
    kb.handleKey("ArrowUp")
    expect(kb.getBuffer()).toBe("")
  })

  it("ArrowUp replaces current buffer with last command", () => {
    const kb = createKeyboard()
    "první".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Enter")
    "druhý".split("").forEach((c) => kb.handleKey(c)) // typed but not submitted
    kb.handleKey("ArrowUp")
    expect(kb.getBuffer()).toBe("první") // replaces 'druhý'
  })

  it("onRecall callback is called with recalled command", () => {
    const kb = createKeyboard()
    const onRecall = vi.fn()
    kb.onRecall(onRecall)
    "test".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Enter")
    kb.handleKey("ArrowUp")
    expect(onRecall).toHaveBeenCalledWith("test")
  })

  it("recalls most recent command (last Enter)", () => {
    const kb = createKeyboard()
    "first".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Enter")
    "second".split("").forEach((c) => kb.handleKey(c))
    kb.handleKey("Enter")
    kb.handleKey("ArrowUp")
    expect(kb.getBuffer()).toBe("second")
  })
})

// ─── onSubmit / onRecall registration ────────────────────────────────────────

describe("onSubmit / onRecall registration", () => {
  it("onSubmit replaces previous handler", () => {
    const kb = createKeyboard()
    const first = vi.fn()
    const second = vi.fn()
    kb.onSubmit(first)
    kb.onSubmit(second)
    kb.handleKey("Enter")
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
  })

  it("onRecall replaces previous handler", () => {
    const kb = createKeyboard()
    const first = vi.fn()
    const second = vi.fn()
    kb.onRecall(first)
    kb.onRecall(second)
    kb.handleKey("Enter")
    kb.handleKey("ArrowUp")
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
  })
})

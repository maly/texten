// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest"
import { createDisplay } from "../src/display.js"

// ─── helpers ────────────────────────────────────────────────────────────────

const makeTerminal = () => {
  const el = document.createElement("div")
  document.body.appendChild(el)
  return el
}

const lines = (el) => [...el.querySelectorAll(".line")]

// ─── createDisplay() ────────────────────────────────────────────────────────

describe("createDisplay()", () => {
  it("returns display API object", () => {
    const d = createDisplay(makeTerminal())
    expect(typeof d.printLine).toBe("function")
    expect(typeof d.printText).toBe("function")
    expect(typeof d.cls).toBe("function")
    expect(typeof d.waitForEnter).toBe("function")
    expect(typeof d.resolveEnter).toBe("function")
    expect(typeof d.getLineCount).toBe("function")
  })

  it("throws when terminal element is missing", () => {
    expect(() => createDisplay(null)).toThrow()
    expect(() => createDisplay(undefined)).toThrow()
  })
})

// ─── printLine() ────────────────────────────────────────────────────────────

describe("printLine()", () => {
  let terminal, d

  beforeEach(() => {
    terminal = makeTerminal()
    d = createDisplay(terminal, { maxLines: 5 })
  })

  it("adds a .line element with the given text", () => {
    d.printLine("Hello")
    const ls = lines(terminal)
    expect(ls).toHaveLength(1)
    expect(ls[0].textContent).toBe("Hello")
    expect(ls[0].classList.contains("line")).toBe(true)
  })

  it("adds multiple lines in order", () => {
    d.printLine("First")
    d.printLine("Second")
    d.printLine("Third")
    const ls = lines(terminal)
    expect(ls).toHaveLength(3)
    expect(ls[0].textContent).toBe("First")
    expect(ls[2].textContent).toBe("Third")
  })

  it("color 'red' adds class text-red", () => {
    d.printLine("Error", "red")
    expect(lines(terminal)[0].classList.contains("text-red")).toBe(true)
  })

  it("color 'yellow' adds class text-yellow", () => {
    d.printLine("Warning", "yellow")
    expect(lines(terminal)[0].classList.contains("text-yellow")).toBe(true)
  })

  it("color 'green' adds class text-green", () => {
    d.printLine("OK", "green")
    expect(lines(terminal)[0].classList.contains("text-green")).toBe(true)
  })

  it("no color leaves no text-* class", () => {
    d.printLine("Normal")
    const cls = [...lines(terminal)[0].classList]
    expect(cls.some((c) => c.startsWith("text-"))).toBe(false)
  })

  it("scroll: exceeding maxLines removes oldest line", () => {
    for (let i = 1; i <= 6; i++) d.printLine(`Line ${i}`)
    const ls = lines(terminal)
    expect(ls).toHaveLength(5) // maxLines = 5
    expect(ls[0].textContent).toBe("Line 2") // oldest removed
    expect(ls[4].textContent).toBe("Line 6")
  })

  it("getLineCount reflects current line count", () => {
    d.printLine("A")
    d.printLine("B")
    expect(d.getLineCount()).toBe(2)
  })

  it("getLineCount never exceeds maxLines", () => {
    for (let i = 0; i < 10; i++) d.printLine(`L${i}`)
    expect(d.getLineCount()).toBe(5)
  })
})

// ─── cls() ──────────────────────────────────────────────────────────────────

describe("cls()", () => {
  it("removes all lines", () => {
    const terminal = makeTerminal()
    const d = createDisplay(terminal, { maxLines: 5 })
    d.printLine("A")
    d.printLine("B")
    d.cls()
    expect(lines(terminal)).toHaveLength(0)
  })

  it("getLineCount returns 0 after cls", () => {
    const terminal = makeTerminal()
    const d = createDisplay(terminal, { maxLines: 5 })
    d.printLine("X")
    d.cls()
    expect(d.getLineCount()).toBe(0)
  })

  it("can print lines again after cls", () => {
    const terminal = makeTerminal()
    const d = createDisplay(terminal, { maxLines: 5 })
    d.printLine("Before")
    d.cls()
    d.printLine("After")
    expect(lines(terminal)).toHaveLength(1)
    expect(lines(terminal)[0].textContent).toBe("After")
  })
})

// ─── printText() ────────────────────────────────────────────────────────────

describe("printText()", () => {
  it("short text fits on one line", () => {
    const terminal = makeTerminal()
    const d = createDisplay(terminal, { maxLines: 20, charWidth: 40 })
    d.printText("Ahoj světe.")
    expect(d.getLineCount()).toBe(1)
    expect(lines(terminal)[0].textContent).toBe("Ahoj světe.")
  })

  it("long text is word-wrapped across multiple lines", () => {
    const terminal = makeTerminal()
    const d = createDisplay(terminal, { maxLines: 20, charWidth: 20 })
    // 5 words, each 4 chars + space — forces wrapping at charWidth=20
    d.printText("abcd efgh ijkl mnop qrst uvwx")
    expect(d.getLineCount()).toBeGreaterThan(1)
  })

  it("newline character forces a new line", () => {
    const terminal = makeTerminal()
    const d = createDisplay(terminal, { maxLines: 20, charWidth: 40 })
    d.printText("Line one.\nLine two.")
    expect(d.getLineCount()).toBe(2)
    expect(lines(terminal)[0].textContent).toBe("Line one.")
    expect(lines(terminal)[1].textContent).toBe("Line two.")
  })

  it("empty string adds no lines", () => {
    const terminal = makeTerminal()
    const d = createDisplay(terminal, { maxLines: 20 })
    d.printText("")
    expect(d.getLineCount()).toBe(0)
  })
})

// ─── waitForEnter() / resolveEnter() ────────────────────────────────────────

describe("waitForEnter() / resolveEnter()", () => {
  it("waitForEnter returns a Promise", () => {
    const d = createDisplay(makeTerminal())
    const p = d.waitForEnter()
    expect(p).toBeInstanceOf(Promise)
    d.resolveEnter() // clean up
  })

  it("Promise resolves when resolveEnter is called", async () => {
    const d = createDisplay(makeTerminal())
    let resolved = false
    const p = d.waitForEnter().then(() => { resolved = true })
    expect(resolved).toBe(false)
    d.resolveEnter()
    await p
    expect(resolved).toBe(true)
  })

  it("resolveEnter with no pending waiter is a no-op", () => {
    const d = createDisplay(makeTerminal())
    expect(() => d.resolveEnter()).not.toThrow()
  })

  it("second waitForEnter after resolution works", async () => {
    const d = createDisplay(makeTerminal())
    d.resolveEnter() // no-op
    let resolved = false
    const p = d.waitForEnter().then(() => { resolved = true })
    d.resolveEnter()
    await p
    expect(resolved).toBe(true)
  })
})

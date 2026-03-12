// TEXTEN engine — DOM terminal display
//
// Creates a retro-style text terminal inside a given DOM element.
// Lines are added from the bottom; when maxLines is exceeded the oldest
// line is removed (scroll-up effect).
//
// Usage:
//   const display = createDisplay(document.getElementById("terminal"))
//   display.printLine("Jsi v kuchyni.")
//   display.printLine("Chyba!", "red")
//   await display.waitForEnter()

// Word-wrap `text` to fit within `charWidth` characters per line.
// Splits on explicit \n first, then wraps long words.
const wrapText = (text, charWidth) => {
  if (!text) return []

  const result = []

  for (const paragraph of text.split("\n")) {
    if (paragraph === "") {
      result.push("")
      continue
    }

    const words = paragraph.split(" ")
    let current = ""

    for (const word of words) {
      const candidate = current ? current + " " + word : word
      if (candidate.length <= charWidth) {
        current = candidate
      } else {
        if (current) result.push(current)
        // If a single word exceeds charWidth, push it as-is
        current = word
      }
    }
    if (current) result.push(current)
  }

  return result
}

// Create a display bound to a DOM element.
//
// Options:
//   maxLines  {number}  Maximum lines on screen before scrolling (default 20)
//   charWidth {number}  Characters per line for word-wrap (default 40)
export const createDisplay = (terminalEl, options = {}) => {
  if (!terminalEl) throw new TypeError("createDisplay: terminalEl is required")

  const maxLines = options.maxLines ?? 20
  const charWidth = options.charWidth ?? 40

  let lineEls = []       // tracked DOM line elements
  let enterWaiter = null // current pending waitForEnter resolver

  // Internal: append one line element to the terminal
  const addLineEl = (text, color) => {
    const el = document.createElement("div")
    el.className = "line" + (color ? ` text-${color}` : "")
    el.textContent = text
    terminalEl.appendChild(el)
    lineEls.push(el)

    // Scroll: remove oldest line when over limit
    while (lineEls.length > maxLines) {
      terminalEl.removeChild(lineEls[0])
      lineEls.shift()
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  // Add one line of text, with optional color ('red', 'yellow', 'green', …)
  const printLine = (text, color = null) => {
    addLineEl(text ?? "", color)
  }

  // Add text, word-wrapping to charWidth. Respects \n as hard line-break.
  const printText = (text, color = null) => {
    const wrappedLines = wrapText(text, charWidth)
    for (const line of wrappedLines) {
      addLineEl(line, color)
    }
  }

  // Clear all lines from the terminal
  const cls = () => {
    terminalEl.innerHTML = ""
    lineEls = []
  }

  // Return a Promise that resolves the next time resolveEnter() is called.
  const waitForEnter = () =>
    new Promise((resolve) => {
      enterWaiter = resolve
    })

  // Resolve any pending waitForEnter Promise. Called by keyboard on Enter.
  // Returns true if a waiter was resolved, false if there was nothing to resolve.
  const resolveEnter = () => {
    if (enterWaiter) {
      const fn = enterWaiter
      enterWaiter = null
      fn()
      return true
    }
    return false
  }

  const getLineCount = () => lineEls.length

  return { printLine, printText, cls, waitForEnter, resolveEnter, getLineCount }
}

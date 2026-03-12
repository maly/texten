// TEXTEN engine — keyboard input manager
//
// Maintains a text buffer, handles Backspace / Enter / ArrowUp, and fires
// registered callbacks. Intentionally DOM-free so it can be tested in Node.
//
// Usage:
//   const kb = createKeyboard()
//   kb.onSubmit((text) => engine.execute(text))
//   document.addEventListener("keydown", (e) => kb.handleKey(e.key))

export const createKeyboard = () => {
  let buffer = ""
  let lastCommand = ""
  let submitHandler = null
  let recallHandler = null

  // Process a single key event by key name (e.g. "a", "Enter", "Backspace")
  const handleKey = (key) => {
    if (key === "Enter") {
      const input = buffer
      lastCommand = buffer
      buffer = ""
      submitHandler?.(input)
    } else if (key === "Backspace") {
      buffer = buffer.slice(0, -1)
    } else if (key === "ArrowUp") {
      buffer = lastCommand
      recallHandler?.(buffer)
    } else if (key.length === 1) {
      // Single printable character (letters, digits, diacritics, space…)
      buffer += key
    }
    // Multi-char keys (Shift, Control, F1…) are ignored
  }

  // Register a callback for Enter (receives the submitted input string)
  const onSubmit = (fn) => { submitHandler = fn }

  // Register a callback for ArrowUp (receives the recalled command string)
  const onRecall = (fn) => { recallHandler = fn }

  const getBuffer = () => buffer

  // Directly set the buffer (useful for programmatic input in tests / cutscenes)
  const setBuffer = (text) => { buffer = text }

  return { handleKey, onSubmit, onRecall, getBuffer, setBuffer }
}

// TEXTEN engine — save / load system
//
// Saves up to 9 named slots. Each slot stores a snapshot of game state plus
// optional metadata (timestamp, remark).
//
// By default uses lz-string for compression and window.localStorage for
// storage. Both are injectable for testing.
//
// Usage (production):
//   import LZString from "lz-string"
//   const saves = createSaveSystem("gordonfarm", {
//     compress:   LZString.compressToUTF16,
//     decompress: LZString.decompressFromUTF16,
//   })
//   saves.save(state, 1, "Před stodolou")
//   const state = saves.load(1)
//
// Usage (tests):
//   const saves = createSaveSystem("game", { storage: mockStorage })

const SLOTS = 9

export const createSaveSystem = (gameId, options = {}) => {
  const storage = options.storage ?? globalThis.localStorage
  // compress/decompress operate on strings (e.g. lz-string); JSON is handled separately
  const compress   = options.compress   ?? ((s) => s)
  const decompress = options.decompress ?? ((s) => s)

  const storageKey = `texten:${gameId}:saves`

  const readAll = () => {
    const raw = storage.getItem(storageKey)
    if (!raw) return new Array(SLOTS).fill(null)
    try {
      return JSON.parse(decompress(raw))
    } catch {
      return new Array(SLOTS).fill(null)
    }
  }

  const writeAll = (slots) => {
    storage.setItem(storageKey, compress(JSON.stringify(slots)))
  }

  return {
    // Save `state` into `slot` (1–9) with optional remark string.
    save: (state, slot, remark = "") => {
      const slots = readAll()
      slots[slot - 1] = {
        ...state,
        timestamp: Date.now(),
        remark,
      }
      writeAll(slots)
    },

    // Load state from `slot` (1–9). Returns null if slot is empty.
    load: (slot) => {
      const slots = readAll()
      return slots[slot - 1] ?? null
    },

    // Return array of 9 entries (null for empty slots, save object otherwise).
    list: () => readAll(),
  }
}

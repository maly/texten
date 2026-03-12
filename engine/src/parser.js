// TEXTEN engine — command parser
//
// Pattern markers:
//   ^   exit (room direction)
//   %N  movable item here or in crate (N = grammatical case, default 3 = acc)
//   @N  any item here or in crate
//   $N  item in player inventory
//   #N  item here, carried, or in crate here (near)
//   &N  item in a crate that is here
//   *   raw string capture

import { noDia } from "./language.js"
import { getItemsMatching, getExitsMatching } from "./state.js"

const MARKER_CHARS = "^%@$#&*"
const isMarker = (word) => MARKER_CHARS.includes(word[0])

const parseMarker = (markerStr) => ({
  type: markerStr[0],
  caseIdx: markerStr.length > 1 ? parseInt(markerStr[1], 10) : 3,
})

// Build a RegExp + ordered marker list from one pattern string.
// Non-marker words are matched by their first 3 characters (lazy).
// Marker positions become lazy capture groups.
const buildPatternInfo = (pattern) => {
  const words = noDia(pattern.toLowerCase())
    .split(/\s+/)
    .filter((w) => w.length > 0)

  const markers = words.filter(isMarker)

  const regexParts = words.map((w) => {
    if (isMarker(w)) return "(.*?)"
    const prefix = w.slice(0, Math.min(3, w.length)).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return prefix + "\\S*?"
  })

  const regex = new RegExp("^" + regexParts.join("\\s+") + "$")
  return { regex, markers }
}

// Resolve a single marker against current game state
const resolveMarker = (markerStr, captured, gameData, state) => {
  const { type, caseIdx } = parseMarker(markerStr)
  switch (type) {
    case "^": return getExitsMatching(gameData, state, captured)
    case "%": return getItemsMatching(gameData, state, captured, caseIdx, { hereOrCrated: true, movable: true })
    case "@": return getItemsMatching(gameData, state, captured, caseIdx, { hereOrCrated: true })
    case "$": return getItemsMatching(gameData, state, captured, caseIdx, { carried: true })
    case "#": return getItemsMatching(gameData, state, captured, caseIdx, { near: true })
    case "&": return getItemsMatching(gameData, state, captured, caseIdx, { cratedHere: true })
    case "*": return [{ type: "string", value: captured }]
    default: return []
  }
}

// Create a parser bound to a set of command definitions.
// Each command has: { id, patterns: string[] }
//
// Returns { parse(input, gameData, state) → [{ commandId, params }] }
export const createParser = (commands) => {
  if (!Array.isArray(commands)) {
    throw new TypeError("createParser: commands must be an array")
  }

  // Pre-build pattern info for all commands at creation time
  const prepared = commands.map((cmd) => ({
    id: cmd.id,
    patternInfos: (cmd.patterns ?? []).map(buildPatternInfo),
  }))

  return {
    parse(input, gameData, state) {
      if (!input || typeof input !== "string") return []

      const inputNoDia = noDia(input.trim().toLowerCase())
      if (!inputNoDia) return []

      const results = []
      const seen = new Set()

      for (const { id, patternInfos } of prepared) {
        if (seen.has(id)) continue

        for (const { regex, markers } of patternInfos) {
          const match = inputNoDia.match(regex)
          if (!match) continue

          const captures = match.slice(1) // skip full-match group
          const params = markers.map((marker, i) =>
            resolveMarker(marker, captures[i] ?? "", gameData, state)
          )

          results.push({ commandId: id, params })
          seen.add(id)
          break // first matching pattern wins; skip remaining for this command
        }
      }

      return results
    },
  }
}

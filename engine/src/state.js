// TEXTEN engine — immutable game state
// All functions return new state objects; originals are never mutated.

import { flex, noDia } from "./language.js"

// ─── createState ────────────────────────────────────────────────────────────

// Build initial game state from loaded JSON game data.
// Pre-computes item flex forms and adds 'shadow' attr to all items.
export const createState = (gameData) => {
  if (
    !gameData ||
    !Array.isArray(gameData.rooms) ||
    !Array.isArray(gameData.items)
  ) {
    throw new TypeError(
      "createState: gameData must have rooms and items arrays"
    )
  }

  // Pre-compute flex forms for every item (name + optional adj)
  const itemForms = {}
  for (const item of gameData.items) {
    itemForms[item.id] = {
      names: flex(item.name),
      adjs: item.adj ? flex(item.adj) : null,
    }
  }

  // Find start room; fall back to first room
  const startRoom =
    gameData.rooms.find((r) => r.attrs?.includes("start")) ?? gameData.rooms[0]

  return {
    where: startRoom?.id ?? "",
    items: Object.fromEntries(
      gameData.items.map((i) => [i.id, i.location ?? ""])
    ),
    itemAttrs: Object.fromEntries(
      gameData.items.map((i) => [i.id, [...(i.attrs ?? []), "shadow"]])
    ),
    rooms: Object.fromEntries(
      gameData.rooms.map((r) => [r.id, { looked: false }])
    ),
    vars: {},
    _itemForms: itemForms,
  }
}

// ─── Attribute helpers ───────────────────────────────────────────────────────

export const isVisible = (state, itemId) =>
  !state.itemAttrs[itemId]?.includes("shadow")

export const hasAttr = (state, itemId, attr) =>
  state.itemAttrs[itemId]?.includes(attr) ?? false

export const addAttr = (state, itemId, attr) => {
  if (!state.itemAttrs[itemId]) return state
  if (state.itemAttrs[itemId].includes(attr)) return state
  return {
    ...state,
    itemAttrs: {
      ...state.itemAttrs,
      [itemId]: [...state.itemAttrs[itemId], attr],
    },
  }
}

export const removeAttr = (state, itemId, attr) => {
  if (!state.itemAttrs[itemId]) return state
  return {
    ...state,
    itemAttrs: {
      ...state.itemAttrs,
      [itemId]: state.itemAttrs[itemId].filter((a) => a !== attr),
    },
  }
}

// ─── Item movement ───────────────────────────────────────────────────────────

export const takeItem = (state, itemId) => ({
  ...state,
  items: { ...state.items, [itemId]: "*" },
})

export const dropItem = (state, itemId) => ({
  ...state,
  items: { ...state.items, [itemId]: state.where },
})

// Move player to a room; reveal items in that room by removing 'shadow'.
export const movePlayer = (state, roomId) => {
  const newItemAttrs = { ...state.itemAttrs }
  for (const [itemId, location] of Object.entries(state.items)) {
    if (location === roomId && newItemAttrs[itemId]?.includes("shadow")) {
      newItemAttrs[itemId] = newItemAttrs[itemId].filter((a) => a !== "shadow")
    }
  }
  return { ...state, where: roomId, itemAttrs: newItemAttrs }
}

// ─── Internal query helpers ──────────────────────────────────────────────────

// IDs of crates that are in the current room or in the player's inventory
const getCrateIdsHere = (gameData, state) =>
  gameData.items
    .filter((item) => {
      const loc = state.items[item.id]
      return (
        (loc === state.where || loc === "*") &&
        state.itemAttrs[item.id]?.includes("crate")
      )
    })
    .map((item) => item.id)

// True if itemId is stored inside a crate that is here
const isInCrateHere = (gameData, state, itemId) =>
  getCrateIdsHere(gameData, state).includes(state.items[itemId])

// ─── Item matching (for parser) ──────────────────────────────────────────────

// Return item objects matching `nameInput` in grammatical case `caseIdx`
// with optional location/attribute filters.
//
// filter keys:
//   carried     — item must be in player inventory
//   here        — item must be in current room
//   hereOrCrated — item is in current room OR in a crate that is here
//   near        — item is here, carried, or in crate here
//   cratedHere  — item is inside a crate that is here
//   movable     — exclude nonmovable items
export const getItemsMatching = (gameData, state, nameInput, caseIdx, filter = {}) => {
  if (!nameInput) return []

  const inputNoDia = noDia(nameInput.toLowerCase())
  const inputWords = inputNoDia.split(/\s+/).filter((w) => w.length > 0)
  if (inputWords.length === 0) return []

  return gameData.items
    .filter((item) => {
      // Must be visible (no shadow)
      if (!isVisible(state, item.id)) return false

      const forms = state._itemForms[item.id]
      if (!forms) return false

      // Name match in the given grammatical case
      const nameNoDia = noDia((forms.names[caseIdx] ?? "").toLowerCase())

      if (inputWords.length === 1) {
        if (!nameNoDia.startsWith(inputWords[0])) return false
      } else if (inputWords.length === 2) {
        // Two-word input: try "adjective noun" match
        if (!forms.adjs) return false
        const adjNoDia = noDia((forms.adjs[caseIdx] ?? "").toLowerCase())
        if (!adjNoDia.startsWith(inputWords[0])) return false
        if (!nameNoDia.startsWith(inputWords[1])) return false
      } else {
        return false
      }

      // Location filters
      const loc = state.items[item.id]

      if (filter.carried && loc !== "*") return false
      if (filter.here && loc !== state.where) return false

      if (filter.hereOrCrated) {
        if (loc !== state.where && !isInCrateHere(gameData, state, item.id))
          return false
      }

      if (filter.near) {
        if (
          loc !== state.where &&
          loc !== "*" &&
          !isInCrateHere(gameData, state, item.id)
        )
          return false
      }

      if (filter.cratedHere) {
        if (!isInCrateHere(gameData, state, item.id)) return false
      }

      // Attribute filters
      if (filter.movable && state.itemAttrs[item.id]?.includes("nonmovable"))
        return false

      return true
    })
    .map((item) => ({ type: "item", itemId: item.id }))
}

// ─── Exit matching (for parser) ─────────────────────────────────────────────

// Return exits of the current room whose label contains `labelInput` as
// a substring (diacritics-insensitive). Hidden exits are excluded.
export const getExitsMatching = (gameData, state, labelInput) => {
  const room = gameData.rooms.find((r) => r.id === state.where)
  if (!room || !room.exits) return []

  const inputNoDia = noDia(labelInput.toLowerCase())

  return room.exits
    .filter((exit) => {
      if (exit.hidden && !state._revealedExits?.[state.where + ":" + exit.to]) return false
      const labelNoDia = noDia((exit.label ?? "").toLowerCase())
      return labelNoDia.includes(inputNoDia)
    })
    .map((exit) => ({ type: "exit", to: exit.to, label: exit.label }))
}

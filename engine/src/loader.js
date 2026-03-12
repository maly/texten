// TEXTEN engine — DSL (JSON) validator
// Validates individual entities and full game cross-references.

import { flex } from "./language.js"

const VALID_ITEM_ATTRS = ["movable", "nonmovable", "crate"]
const VALID_ROOM_ATTRS = ["start"]
const VALID_ATMOSPHERE_TYPES = ["shuffle", "loop", "oneshot", "rand", "last"]

// ─── validateRoom ────────────────────────────────────────────────────────────

export const validateRoom = (room) => {
  const errors = []

  if (!room) return { valid: false, errors: ["Room is null or undefined"] }

  if (!room.id || typeof room.id !== "string")
    errors.push("Room missing required string field: id")

  if (!room.title || typeof room.title !== "string")
    errors.push("Room missing required string field: title")

  if (!room.desc || typeof room.desc !== "string")
    errors.push("Room missing required string field: desc")

  if (!Array.isArray(room.exits))
    errors.push("Room.exits must be an array")

  if (Array.isArray(room.exits)) {
    room.exits.forEach((exit, i) => {
      if (!exit.label)
        errors.push(`Room exit[${i}] missing required field: label`)
      if (!exit.to)
        errors.push(`Room exit[${i}] missing required field: to`)
    })
  }

  if (room.atmosphere !== undefined && room.atmosphere !== null) {
    if (!VALID_ATMOSPHERE_TYPES.includes(room.atmosphere.type)) {
      errors.push(
        `Room atmosphere.type must be one of: ${VALID_ATMOSPHERE_TYPES.join(", ")}`
      )
    }
    if (
      !Array.isArray(room.atmosphere.strings) ||
      room.atmosphere.strings.length === 0
    ) {
      errors.push("Room atmosphere.strings must be a non-empty array")
    }
  }

  if (Array.isArray(room.attrs)) {
    room.attrs.forEach((attr) => {
      if (!VALID_ROOM_ATTRS.includes(attr))
        errors.push(`Unknown room attribute: '${attr}'`)
    })
  }

  return { valid: errors.length === 0, errors }
}

// ─── validateItem ────────────────────────────────────────────────────────────

export const validateItem = (item) => {
  const errors = []

  if (!item) return { valid: false, errors: ["Item is null or undefined"] }

  if (!item.id || typeof item.id !== "string")
    errors.push("Item missing required string field: id")

  if (!item.name || typeof item.name !== "string")
    errors.push("Item missing required string field: name")

  if (!item.desc || typeof item.desc !== "string")
    errors.push("Item missing required string field: desc")

  // Validate flex string for name
  if (item.name && typeof item.name === "string") {
    try {
      flex(item.name)
    } catch (e) {
      errors.push(`Item name has invalid flex string format: ${e.message}`)
    }
  }

  // Validate flex string for adj (if provided)
  if (item.adj && typeof item.adj === "string") {
    try {
      flex(item.adj)
    } catch (e) {
      errors.push(`Item adj has invalid flex string format: ${e.message}`)
    }
  }

  if (Array.isArray(item.attrs)) {
    item.attrs.forEach((attr) => {
      if (!VALID_ITEM_ATTRS.includes(attr))
        errors.push(`Unknown item attribute: '${attr}'`)
    })
  }

  return { valid: errors.length === 0, errors }
}

// ─── validateNpc ─────────────────────────────────────────────────────────────

export const validateNpc = (npc) => {
  const errors = []

  if (!npc) return { valid: false, errors: ["NPC is null or undefined"] }

  if (!npc.id || typeof npc.id !== "string")
    errors.push("NPC missing required string field: id")

  if (!npc.name || typeof npc.name !== "string")
    errors.push("NPC missing required string field: name")

  // Validate dialog tree: all 'next' references must resolve to existing nodes
  if (npc.dialogs && typeof npc.dialogs === "object") {
    const nodeIds = new Set(Object.keys(npc.dialogs))
    for (const [nodeId, node] of Object.entries(npc.dialogs)) {
      if (Array.isArray(node.choices)) {
        node.choices.forEach((choice, i) => {
          if (choice.next && !nodeIds.has(choice.next)) {
            errors.push(
              `NPC dialog node '${nodeId}' choice[${i}]: next='${choice.next}' references non-existent dialog node`
            )
          }
        })
      }
    }
  }

  // Validate schedule entries
  if (Array.isArray(npc.schedule)) {
    npc.schedule.forEach((entry, i) => {
      if (entry.location === undefined || entry.location === null)
        errors.push(`NPC schedule[${i}] missing required field: location`)
      if (entry.tick === undefined || entry.tick === null)
        errors.push(`NPC schedule[${i}] missing required field: tick`)
    })
  }

  return { valid: errors.length === 0, errors }
}

// ─── validateCommand ─────────────────────────────────────────────────────────

export const validateCommand = (cmd) => {
  const errors = []

  if (!cmd) return { valid: false, errors: ["Command is null or undefined"] }

  if (!cmd.id || typeof cmd.id !== "string")
    errors.push("Command missing required string field: id")

  if (!Array.isArray(cmd.patterns))
    errors.push("Command missing required array field: patterns")
  else if (cmd.patterns.length === 0)
    errors.push("Command.patterns must not be empty")

  return { valid: errors.length === 0, errors }
}

// ─── validateGame ─────────────────────────────────────────────────────────────

// Full cross-reference validation of a complete game object.
// Returns { valid, errors } where errors may include warnings (prefixed "Warning:").
export const validateGame = (gameData) => {
  const errors = []

  const rooms = gameData?.rooms ?? []
  const items = gameData?.items ?? []
  const npcs = gameData?.npcs ?? []
  const commands = gameData?.commands ?? []

  // Validate each entity individually
  rooms.forEach((r) => {
    const result = validateRoom(r)
    if (!result.valid) errors.push(...result.errors.map((e) => `Room '${r.id ?? "?"}': ${e}`))
  })
  items.forEach((i) => {
    const result = validateItem(i)
    if (!result.valid) errors.push(...result.errors.map((e) => `Item '${i.id ?? "?"}': ${e}`))
  })
  npcs.forEach((n) => {
    const result = validateNpc(n)
    if (!result.valid) errors.push(...result.errors.map((e) => `NPC '${n.id ?? "?"}': ${e}`))
  })
  commands.forEach((c) => {
    const result = validateCommand(c)
    if (!result.valid) errors.push(...result.errors.map((e) => `Command '${c.id ?? "?"}': ${e}`))
  })

  // Check for duplicate IDs
  const roomIds = rooms.map((r) => r.id)
  const itemIds = items.map((i) => i.id)

  const dupeRooms = roomIds.filter((id, i) => roomIds.indexOf(id) !== i)
  dupeRooms.forEach((id) => errors.push(`Duplicate room id: '${id}'`))

  const dupeItems = itemIds.filter((id, i) => itemIds.indexOf(id) !== i)
  dupeItems.forEach((id) => errors.push(`Duplicate item id: '${id}'`))

  const roomIdSet = new Set(roomIds)

  // Cross-reference: item locations must be known rooms or '*'
  items.forEach((item) => {
    if (
      item.location &&
      item.location !== "*" &&
      !roomIdSet.has(item.location)
    ) {
      errors.push(
        `Item '${item.id}' has location '${item.location}' which references unknown room`
      )
    }
  })

  // Cross-reference: room exits must reference known rooms
  rooms.forEach((room) => {
    (room.exits ?? []).forEach((exit) => {
      if (exit.to && !roomIdSet.has(exit.to)) {
        errors.push(
          `Room '${room.id}' has exit to unknown room '${exit.to}'`
        )
      }
    })
  })

  // Cross-reference: NPC locations must be known rooms
  npcs.forEach((npc) => {
    if (npc.location && !roomIdSet.has(npc.location)) {
      errors.push(
        `NPC '${npc.id}' has location '${npc.location}' which references unknown room`
      )
    }
  })

  // Warning: no start room defined
  const hasStart = rooms.some((r) => r.attrs?.includes("start"))
  if (!hasStart && rooms.length > 0) {
    errors.push("Warning: no room has 'start' attribute — player start position undefined")
  }

  return { valid: errors.length === 0, errors }
}

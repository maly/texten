// Central reactive game data store (Svelte 5 runes)

const emptyGame = () => ({
  rooms: [],
  items: [],
  npcs: [],
  commands: [],
})

// ─── Reactive state ─────────────────────────────────────────────────────────

let game = $state(emptyGame())

export const getGame = () => game

// ─── Rooms ──────────────────────────────────────────────────────────────────

export const addRoom = () => {
  const id = `room_${Date.now()}`
  game.rooms.push({
    id,
    title: "Nová místnost",
    desc: "",
    ext: "",
    exits: [],
    attrs: [],
    atmosphere: null,
  })
  return id
}

export const updateRoom = (id, patch) => {
  const i = game.rooms.findIndex((r) => r.id === id)
  if (i !== -1) game.rooms[i] = { ...game.rooms[i], ...patch }
}

export const deleteRoom = (id) => {
  game.rooms = game.rooms.filter((r) => r.id !== id)
  // Remove exits pointing to deleted room
  for (const r of game.rooms) {
    r.exits = r.exits.filter((e) => e.to !== id)
  }
}

// ─── Items ───────────────────────────────────────────────────────────────────

export const addItem = () => {
  const id = `item_${Date.now()}`
  game.items.push({
    id,
    name: "věc-,,",
    adj: null,
    desc: "",
    attrs: ["movable"],
    location: null,
  })
  return id
}

export const updateItem = (id, patch) => {
  const i = game.items.findIndex((it) => it.id === id)
  if (i !== -1) game.items[i] = { ...game.items[i], ...patch }
}

export const deleteItem = (id) => {
  game.items = game.items.filter((it) => it.id !== id)
}

// ─── NPCs ────────────────────────────────────────────────────────────────────

export const addNpc = () => {
  const id = `npc_${Date.now()}`
  game.npcs.push({
    id,
    name: "postava",
    desc: "",
    location: null,
    state: "neutral",
    inventory: [],
    schedule: [],
    dialogs: {
      start: { text: "Ahoj.", choices: [] },
    },
  })
  return id
}

export const updateNpc = (id, patch) => {
  const i = game.npcs.findIndex((n) => n.id === id)
  if (i !== -1) game.npcs[i] = { ...game.npcs[i], ...patch }
}

export const deleteNpc = (id) => {
  game.npcs = game.npcs.filter((n) => n.id !== id)
}

// ─── Commands ────────────────────────────────────────────────────────────────

export const addCommand = () => {
  const id = `cmd_${Date.now()}`
  game.commands.push({
    id,
    patterns: [],
    notHereMsg: "",
    notCarriedMsg: "",
    unknownMsg: "",
  })
  return id
}

export const updateCommand = (id, patch) => {
  const i = game.commands.findIndex((c) => c.id === id)
  if (i !== -1) game.commands[i] = { ...game.commands[i], ...patch }
}

export const deleteCommand = (id) => {
  game.commands = game.commands.filter((c) => c.id !== id)
}

// ─── Import / Export ─────────────────────────────────────────────────────────

const CATEGORIES = ["rooms", "items", "npcs", "commands"]

export const exportJson = () => JSON.stringify(game, null, 2)

export const exportIndividualFiles = () =>
  CATEGORIES.map((cat) => ({
    filename: `${cat}.json`,
    content: JSON.stringify(game[cat], null, 2),
  }))

export const importJson = (jsonStr) => {
  const parsed = JSON.parse(jsonStr)
  game.rooms = parsed.rooms ?? []
  game.items = parsed.items ?? []
  game.npcs = parsed.npcs ?? []
  game.commands = parsed.commands ?? []
}

export const importPartial = (partial) => {
  for (const key of CATEGORIES) {
    if (Array.isArray(partial[key])) {
      game[key] = partial[key]
    }
  }
}

export const parseImportFiles = (files) => {
  const result = {}
  for (const f of files) {
    const parsed = JSON.parse(f.text)
    if (Array.isArray(parsed)) {
      const base = f.name.replace(/\.json$/i, "").toLowerCase()
      if (CATEGORIES.includes(base)) {
        result[base] = parsed
      } else {
        throw new Error(`Neznámý soubor: ${f.name}`)
      }
    } else if (typeof parsed === "object" && parsed !== null) {
      for (const key of CATEGORIES) {
        if (Array.isArray(parsed[key])) {
          result[key] = parsed[key]
        }
      }
    }
  }
  if (Object.keys(result).length === 0) {
    throw new Error("Žádná platná data nenalezena.")
  }
  return result
}

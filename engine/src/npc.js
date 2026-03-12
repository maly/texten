// TEXTEN engine — NPC system
//
// Manages NPC state (location, mood, inventory) separately from gameData
// definitions. All state-mutating functions return new state objects
// (immutable pattern).

// ─── State initialization ───────────────────────────────────────────────────

export const createNpcState = (gameData) => {
  if (!gameData || !Array.isArray(gameData.npcs)) {
    throw new TypeError("createNpcState: gameData.npcs must be an array")
  }
  const ns = {}
  for (const npc of gameData.npcs) {
    ns[npc.id] = {
      location: npc.location,
      mood: npc.state,
      inventory: [...npc.inventory],
    }
  }
  return ns
}

// ─── Location ───────────────────────────────────────────────────────────────

export const getNpcLocation = (ns, npcId) => ns[npcId]?.location

export const moveNpc = (ns, npcId, roomId) => ({
  ...ns,
  [npcId]: { ...ns[npcId], location: roomId },
})

export const getNpcsHere = (gameData, ns, roomId) =>
  gameData.npcs.filter((npc) => ns[npc.id]?.location === roomId)

// ─── Tick / schedule ────────────────────────────────────────────────────────

export const tickNpcs = (gameData, ns, currentTick) => {
  let next = ns
  for (const npc of gameData.npcs) {
    if (!npc.schedule || npc.schedule.length === 0) continue
    // Find the last schedule entry whose tick <= currentTick
    const applicable = npc.schedule
      .filter((e) => e.tick <= currentTick)
      .at(-1)
    if (applicable) {
      next = moveNpc(next, npc.id, applicable.location)
    }
  }
  return next
}

// ─── Mood ────────────────────────────────────────────────────────────────────

export const getNpcMood = (ns, npcId) => ns[npcId]?.mood

export const setNpcMood = (ns, npcId, mood) => ({
  ...ns,
  [npcId]: { ...ns[npcId], mood },
})

// ─── Inventory ───────────────────────────────────────────────────────────────

export const getNpcInventory = (ns, npcId) => ns[npcId]?.inventory ?? []

export const giveItemToNpc = (ns, npcId, item) => {
  const inv = ns[npcId]?.inventory ?? []
  if (inv.includes(item)) return ns
  return {
    ...ns,
    [npcId]: { ...ns[npcId], inventory: [...inv, item] },
  }
}

export const takeItemFromNpc = (ns, npcId, item) => {
  const inv = ns[npcId]?.inventory ?? []
  if (!inv.includes(item)) return ns
  return {
    ...ns,
    [npcId]: { ...ns[npcId], inventory: inv.filter((i) => i !== item) },
  }
}

export const npcHasItem = (ns, npcId, item) => {
  const inv = ns[npcId]?.inventory
  return Array.isArray(inv) && inv.includes(item)
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

export const getDialogNode = (npcDef, nodeId) =>
  npcDef.dialogs?.[nodeId] ?? null

export const startDialogSession = (npcDef, nodeId = "start") => {
  const node = getDialogNode(npcDef, nodeId)
  if (!node) throw new Error(`startDialogSession: node '${nodeId}' not found for NPC '${npcDef.id}'`)
  return { nodeId, npcId: npcDef.id }
}

export const advanceDialog = (npcDef, session, choiceIndex) => {
  const node = getDialogNode(npcDef, session.nodeId)
  if (!node || !node.choices || node.choices.length === 0) return null
  const choice = node.choices[choiceIndex]
  if (!choice || choice.next === null) return null
  return { nodeId: choice.next, npcId: session.npcId }
}

export const isDialogOver = (npcDef, session) => {
  if (!session) return true
  const node = getDialogNode(npcDef, session.nodeId)
  return !node || node.choices.length === 0
}

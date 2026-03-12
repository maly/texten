import { describe, it, expect } from "vitest"
import {
  validateRoom,
  validateItem,
  validateNpc,
  validateCommand,
  validateGame,
} from "../src/loader.js"

// ─── validateRoom() ─────────────────────────────────────────────────────────

describe("validateRoom()", () => {
  const validRoom = () => ({
    id: "kitchen",
    title: "Kuchyně",
    desc: "Malá kuchyň.",
    exits: [],
    attrs: [],
  })

  describe("positive", () => {
    it("minimal valid room passes", () => {
      const { valid } = validateRoom(validRoom())
      expect(valid).toBe(true)
    })

    it("room with exits passes", () => {
      const room = validRoom()
      room.exits = [{ label: "ven", to: "garden" }]
      expect(validateRoom(room).valid).toBe(true)
    })

    it("room with valid atmosphere passes", () => {
      const room = validRoom()
      room.atmosphere = { type: "shuffle", density: 3, strings: ["Ticho.", "Vítr."] }
      expect(validateRoom(room).valid).toBe(true)
    })

    it("room with start attr passes", () => {
      const room = validRoom()
      room.attrs = ["start"]
      expect(validateRoom(room).valid).toBe(true)
    })

    it("room with optional ext field passes", () => {
      const room = validRoom()
      room.ext = "Podrobnější popis..."
      expect(validateRoom(room).valid).toBe(true)
    })

    it("room with scripts field passes", () => {
      const room = validRoom()
      room.scripts = { onEnter: "kitchen/onEnter" }
      expect(validateRoom(room).valid).toBe(true)
    })
  })

  describe("negative", () => {
    it("null room returns invalid", () => {
      const { valid } = validateRoom(null)
      expect(valid).toBe(false)
    })

    it("missing id → error", () => {
      const room = validRoom()
      delete room.id
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /id/i.test(e))).toBe(true)
    })

    it("missing title → error", () => {
      const room = validRoom()
      delete room.title
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /title/i.test(e))).toBe(true)
    })

    it("missing desc → error", () => {
      const room = validRoom()
      delete room.desc
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /desc/i.test(e))).toBe(true)
    })

    it("exits not array → error", () => {
      const room = validRoom()
      room.exits = "ven"
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /exits/i.test(e))).toBe(true)
    })

    it("exit missing label → error", () => {
      const room = validRoom()
      room.exits = [{ to: "garden" }]
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /label/i.test(e))).toBe(true)
    })

    it("exit missing to → error", () => {
      const room = validRoom()
      room.exits = [{ label: "ven" }]
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /\bto\b/i.test(e))).toBe(true)
    })

    it("invalid atmosphere type → error", () => {
      const room = validRoom()
      room.atmosphere = { type: "blabla", strings: ["x"] }
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /atmosphere/i.test(e))).toBe(true)
    })

    it("atmosphere with empty strings array → error", () => {
      const room = validRoom()
      room.atmosphere = { type: "shuffle", strings: [] }
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /strings/i.test(e))).toBe(true)
    })

    it("unknown room attr → error", () => {
      const room = validRoom()
      room.attrs = ["superroomattr"]
      const { valid, errors } = validateRoom(room)
      expect(valid).toBe(false)
      expect(errors.some(e => /attr/i.test(e))).toBe(true)
    })
  })
})

// ─── validateItem() ─────────────────────────────────────────────────────────

describe("validateItem()", () => {
  const validItem = () => ({
    id: "knife",
    name: "nůž-,e,i",
    desc: "Ostrý nůž.",
    attrs: ["movable"],
    location: "kitchen",
  })

  describe("positive", () => {
    it("minimal valid item passes", () => {
      expect(validateItem(validItem()).valid).toBe(true)
    })

    it("item in inventory (location='*') passes", () => {
      const item = validItem()
      item.location = "*"
      expect(validateItem(item).valid).toBe(true)
    })

    it("nonmovable item passes", () => {
      const item = validItem()
      item.attrs = ["nonmovable"]
      expect(validateItem(item).valid).toBe(true)
    })

    it("crate item passes", () => {
      const item = validItem()
      item.attrs = ["nonmovable", "crate"]
      expect(validateItem(item).valid).toBe(true)
    })

    it("item with valid adjective flex string passes", () => {
      const item = validItem()
      item.adj = "velk-ý,ého,ému,ý,ém,ým"
      expect(validateItem(item).valid).toBe(true)
    })

    it("item without adj (null) passes", () => {
      const item = validItem()
      item.adj = null
      expect(validateItem(item).valid).toBe(true)
    })

    it("item with scripts field passes", () => {
      const item = validItem()
      item.scripts = { onExamine: "knife/onExamine" }
      expect(validateItem(item).valid).toBe(true)
    })
  })

  describe("negative", () => {
    it("null item returns invalid", () => {
      expect(validateItem(null).valid).toBe(false)
    })

    it("missing id → error", () => {
      const item = validItem()
      delete item.id
      const { valid, errors } = validateItem(item)
      expect(valid).toBe(false)
      expect(errors.some(e => /id/i.test(e))).toBe(true)
    })

    it("missing name → error", () => {
      const item = validItem()
      delete item.name
      const { valid, errors } = validateItem(item)
      expect(valid).toBe(false)
      expect(errors.some(e => /name/i.test(e))).toBe(true)
    })

    it("missing desc → error", () => {
      const item = validItem()
      delete item.desc
      const { valid, errors } = validateItem(item)
      expect(valid).toBe(false)
      expect(errors.some(e => /desc/i.test(e))).toBe(true)
    })

    it("invalid flex string in name → error", () => {
      const item = validItem()
      item.name = "invalid_flex_format"
      const { valid, errors } = validateItem(item)
      expect(valid).toBe(false)
      expect(errors.some(e => /flex|name/i.test(e))).toBe(true)
    })

    it("invalid attr value → error", () => {
      const item = validItem()
      item.attrs = ["superitemattr"]
      const { valid, errors } = validateItem(item)
      expect(valid).toBe(false)
      expect(errors.some(e => /attr/i.test(e))).toBe(true)
    })

    it("invalid adj flex string → error", () => {
      const item = validItem()
      item.adj = "not_valid"
      const { valid, errors } = validateItem(item)
      expect(valid).toBe(false)
      expect(errors.some(e => /adj|flex/i.test(e))).toBe(true)
    })
  })
})

// ─── validateNpc() ──────────────────────────────────────────────────────────

describe("validateNpc()", () => {
  const validNpc = () => ({
    id: "gordon",
    name: "Gordon",
    desc: "Vysoký farmář.",
    location: "barn",
    state: "friendly",
    inventory: [],
    dialogs: {
      start: {
        text: "Ahoj!",
        choices: [],
      },
    },
  })

  describe("positive", () => {
    it("minimal valid NPC passes", () => {
      expect(validateNpc(validNpc()).valid).toBe(true)
    })

    it("NPC without dialogs passes", () => {
      const npc = validNpc()
      delete npc.dialogs
      expect(validateNpc(npc).valid).toBe(true)
    })

    it("NPC with schedule passes", () => {
      const npc = validNpc()
      npc.schedule = [
        { tick: 0, location: "barn" },
        { tick: 10, location: "field" },
      ]
      expect(validateNpc(npc).valid).toBe(true)
    })

    it("NPC with inventory items passes", () => {
      const npc = validNpc()
      npc.inventory = ["pitchfork"]
      expect(validateNpc(npc).valid).toBe(true)
    })

    it("NPC with dialog choices passes", () => {
      const npc = validNpc()
      npc.dialogs.start.choices = [{ text: "Jak se máš?", next: "greeting" }]
      npc.dialogs.greeting = { text: "Dobře!", choices: [] }
      expect(validateNpc(npc).valid).toBe(true)
    })
  })

  describe("negative", () => {
    it("null NPC returns invalid", () => {
      expect(validateNpc(null).valid).toBe(false)
    })

    it("missing id → error", () => {
      const npc = validNpc()
      delete npc.id
      const { valid, errors } = validateNpc(npc)
      expect(valid).toBe(false)
      expect(errors.some(e => /id/i.test(e))).toBe(true)
    })

    it("missing name → error", () => {
      const npc = validNpc()
      delete npc.name
      const { valid, errors } = validateNpc(npc)
      expect(valid).toBe(false)
      expect(errors.some(e => /name/i.test(e))).toBe(true)
    })

    it("dialog choice with unresolved 'next' → error", () => {
      const npc = validNpc()
      npc.dialogs.start.choices = [{ text: "Ahoj!", next: "nonexistent_node" }]
      const { valid, errors } = validateNpc(npc)
      expect(valid).toBe(false)
      expect(errors.some(e => /next|dialog/i.test(e))).toBe(true)
    })

    it("schedule entry missing location → error", () => {
      const npc = validNpc()
      npc.schedule = [{ tick: 0 }] // missing location
      const { valid, errors } = validateNpc(npc)
      expect(valid).toBe(false)
      expect(errors.some(e => /location|schedule/i.test(e))).toBe(true)
    })

    it("schedule entry missing tick → error", () => {
      const npc = validNpc()
      npc.schedule = [{ location: "barn" }] // missing tick
      const { valid, errors } = validateNpc(npc)
      expect(valid).toBe(false)
      expect(errors.some(e => /tick|schedule/i.test(e))).toBe(true)
    })
  })
})

// ─── validateCommand() ──────────────────────────────────────────────────────

describe("validateCommand()", () => {
  const validCommand = () => ({
    id: "examine",
    patterns: ["prozkoumej #3", "prohlédni #3"],
  })

  describe("positive", () => {
    it("valid command passes", () => {
      expect(validateCommand(validCommand()).valid).toBe(true)
    })

    it("command with single pattern passes", () => {
      const cmd = validCommand()
      cmd.patterns = ["prozkoumej #3"]
      expect(validateCommand(cmd).valid).toBe(true)
    })

    it("command with optional fields passes", () => {
      const cmd = validCommand()
      cmd.onNoParam = "Na co?"
      cmd.script = "verbs/examine"
      expect(validateCommand(cmd).valid).toBe(true)
    })

    it("command with all marker types in pattern passes", () => {
      const cmd = {
        id: "complex",
        patterns: ["dej $3 do &3", "položit $3 na @3"],
      }
      expect(validateCommand(cmd).valid).toBe(true)
    })
  })

  describe("negative", () => {
    it("null command returns invalid", () => {
      expect(validateCommand(null).valid).toBe(false)
    })

    it("missing id → error", () => {
      const cmd = validCommand()
      delete cmd.id
      const { valid, errors } = validateCommand(cmd)
      expect(valid).toBe(false)
      expect(errors.some(e => /id/i.test(e))).toBe(true)
    })

    it("missing patterns → error", () => {
      const cmd = validCommand()
      delete cmd.patterns
      const { valid, errors } = validateCommand(cmd)
      expect(valid).toBe(false)
      expect(errors.some(e => /pattern/i.test(e))).toBe(true)
    })

    it("empty patterns array → error", () => {
      const cmd = validCommand()
      cmd.patterns = []
      const { valid, errors } = validateCommand(cmd)
      expect(valid).toBe(false)
      expect(errors.some(e => /pattern/i.test(e))).toBe(true)
    })
  })
})

// ─── validateGame() ─────────────────────────────────────────────────────────

describe("validateGame()", () => {
  const validGame = () => ({
    rooms: [
      {
        id: "kitchen",
        title: "Kuchyně",
        desc: "Malá kuchyň.",
        exits: [{ label: "ven", to: "garden" }],
        attrs: ["start"],
      },
      {
        id: "garden",
        title: "Zahrada",
        desc: "Zelená zahrada.",
        exits: [{ label: "dovnitř", to: "kitchen" }],
        attrs: [],
      },
    ],
    items: [
      {
        id: "knife",
        name: "nůž-,e,i",
        desc: "Nůž.",
        attrs: ["movable"],
        location: "kitchen",
      },
    ],
    npcs: [
      {
        id: "bob",
        name: "Bob",
        desc: "Muž.",
        location: "garden",
        state: "friendly",
        inventory: [],
      },
    ],
    commands: [
      {
        id: "examine",
        patterns: ["prozkoumej #3"],
      },
    ],
  })

  describe("positive", () => {
    it("complete valid game passes", () => {
      expect(validateGame(validGame()).valid).toBe(true)
    })

    it("game with empty npcs and commands passes", () => {
      const game = validGame()
      game.npcs = []
      game.commands = []
      expect(validateGame(game).valid).toBe(true)
    })
  })

  describe("negative", () => {
    it("duplicate room id → error", () => {
      const game = validGame()
      game.rooms.push({
        id: "kitchen", // duplicate!
        title: "Jiná kuchyň",
        desc: "...",
        exits: [],
        attrs: [],
      })
      const { valid, errors } = validateGame(game)
      expect(valid).toBe(false)
      expect(errors.some(e => /duplicate|room.*id/i.test(e))).toBe(true)
    })

    it("duplicate item id → error", () => {
      const game = validGame()
      game.items.push({
        id: "knife", // duplicate!
        name: "nůž-,e,i",
        desc: "Jiný nůž.",
        attrs: ["movable"],
        location: "kitchen",
      })
      const { valid, errors } = validateGame(game)
      expect(valid).toBe(false)
      expect(errors.some(e => /duplicate|item.*id/i.test(e))).toBe(true)
    })

    it("item location references unknown room → error", () => {
      const game = validGame()
      game.items[0].location = "nonexistent_room"
      const { valid, errors } = validateGame(game)
      expect(valid).toBe(false)
      expect(errors.some(e => /location|room/i.test(e))).toBe(true)
    })

    it("room exit to unknown room → error", () => {
      const game = validGame()
      game.rooms[0].exits.push({ label: "do tmy", to: "nonexistent_room" })
      const { valid, errors } = validateGame(game)
      expect(valid).toBe(false)
      expect(errors.some(e => /exit|room/i.test(e))).toBe(true)
    })

    it("NPC location references unknown room → error", () => {
      const game = validGame()
      game.npcs[0].location = "nonexistent_room"
      const { valid, errors } = validateGame(game)
      expect(valid).toBe(false)
      expect(errors.some(e => /location|room/i.test(e))).toBe(true)
    })

    it("no start room → warning in errors", () => {
      const game = validGame()
      game.rooms.forEach(r => { r.attrs = [] })
      const { errors } = validateGame(game)
      expect(errors.some(e => /start/i.test(e))).toBe(true)
    })
  })
})

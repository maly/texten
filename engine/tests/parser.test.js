import { describe, it, expect, beforeEach } from "vitest"
import { createParser } from "../src/parser.js"
import { createState, movePlayer, removeAttr } from "../src/state.js"

// ─── Test fixtures ─────────────────────────────────────────────────────────

const makeGameData = () => ({
  rooms: [
    {
      id: "kitchen",
      title: "Kuchyně",
      desc: "Malá kuchyň.",
      exits: [
        { label: "do obýváku", to: "living_room" },
        { label: "do garáže", to: "garage" },
      ],
      attrs: ["start"],
    },
    {
      id: "living_room",
      title: "Obývák",
      desc: "Velký pokoj.",
      exits: [],
      attrs: [],
    },
    {
      id: "garage",
      title: "Garáž",
      desc: "Temná garáž.",
      exits: [],
      attrs: [],
    },
  ],
  items: [
    {
      id: "knife",
      name: "nůž-,e,i,,i,em",
      adj: null,
      desc: "Ostrý nůž.",
      attrs: ["movable"],
      location: "kitchen",
    },
    {
      id: "table",
      name: "stůl-,u,u,u,e,em",
      adj: null,
      desc: "Starý stůl.",
      attrs: ["nonmovable"],
      location: "kitchen",
    },
    {
      id: "key",
      name: "klíč-,e,i,,i,em",
      adj: null,
      desc: "Malý klíč.",
      attrs: ["movable"],
      location: "*", // v inventáři
    },
    {
      id: "car",
      name: "aut-o,a,u,o,ě,em",
      adj: null,
      desc: "Staré auto.",
      attrs: ["movable"],
      location: "garage", // jiná místnost
    },
  ],
  npcs: [],
  commands: [],
})

const makeCommands = () => [
  {
    id: "examine",
    patterns: ["prozkoumej #3", "prohlédni #3", "podívej se na #3"],
    onNoParam: "Na co se chceš podívat?",
  },
  {
    id: "take",
    patterns: ["vezmi %3", "seber %3", "zvedni %3"],
    onNoParam: "Co chceš zvednout?",
  },
  {
    id: "go",
    patterns: ["jdi ^", "jděme ^", "běž ^"],
    onNoParam: "Kam chceš jít?",
  },
  {
    id: "drop",
    patterns: ["odlož $3", "polož $3"],
    onNoParam: "Co chceš položit?",
  },
  {
    id: "inventory",
    patterns: ["inventář", "co mám"],
  },
  {
    id: "say",
    patterns: ["řekni *"],
  },
]

const makeVisibleState = (gameData) => {
  let state = createState(gameData)
  state = movePlayer(state, "kitchen")
  state = removeAttr(state, "key", "shadow")
  return state
}

// ─── createParser() ────────────────────────────────────────────────────────

describe("createParser()", () => {
  it("returns object with parse() method", () => {
    const parser = createParser(makeCommands())
    expect(typeof parser.parse).toBe("function")
  })

  it("throws when commands is not an array", () => {
    expect(() => createParser(null)).toThrow(TypeError)
    expect(() => createParser("blah")).toThrow(TypeError)
    expect(() => createParser(42)).toThrow(TypeError)
  })

  it("accepts empty commands array", () => {
    const parser = createParser([])
    expect(parser.parse("jdi ven", makeGameData(), createState(makeGameData()))).toEqual([])
  })
})

// ─── parse() — positive ─────────────────────────────────────────────────────

describe("parse() — positive", () => {
  let parser
  let gameData
  let state

  beforeEach(() => {
    gameData = makeGameData()
    state = makeVisibleState(gameData)
    parser = createParser(makeCommands())
  })

  it("simple verb with no params (inventář)", () => {
    const result = parser.parse("inventář", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("inventory")
    expect(result[0].params).toHaveLength(0)
  })

  it("two-word no-marker verb (co mám)", () => {
    const result = parser.parse("co mám", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("inventory")
  })

  it("verb + # item: examine knife", () => {
    const result = parser.parse("prozkoumej nůž", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("examine")
    expect(result[0].params[0].map(p => p.itemId)).toContain("knife")
  })

  it("alternative pattern: prohlédni matches examine", () => {
    const result = parser.parse("prohlédni nůž", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("examine")
  })

  it("verb + % movable item: take knife", () => {
    const result = parser.parse("zvedni nůž", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("take")
    expect(result[0].params[0].map(p => p.itemId)).toContain("knife")
  })

  it("verb + $ carried item: drop key", () => {
    const result = parser.parse("polož klíč", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("drop")
    expect(result[0].params[0].map(p => p.itemId)).toContain("key")
  })

  it("verb + ^ exit: go to living room", () => {
    const result = parser.parse("jdi do obýváku", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("go")
    expect(result[0].params[0][0].type).toBe("exit")
    expect(result[0].params[0][0].to).toBe("living_room")
  })

  it("diacritics-free input: 'prozkoumej nuz'", () => {
    const result = parser.parse("prozkoumej nuz", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("examine")
    expect(result[0].params[0].map(p => p.itemId)).toContain("knife")
  })

  it("3-char verb prefix: 'proz nůž' matches examine", () => {
    const result = parser.parse("proz nůž", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("examine")
  })

  it("* marker captures raw string (noDia'd, consistent with parser normalization)", () => {
    // Parser normalizes the whole input via noDia, so captured value is also noDia'd.
    // This is consistent: "řekni heslo" captures "heslo" which is fine for puzzle checks.
    const result = parser.parse("řekni ahoj světe", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("say")
    expect(result[0].params[0][0].type).toBe("string")
    expect(result[0].params[0][0].value).toBe("ahoj svete")
  })

  it("deduplicates: same commandId returned only once", () => {
    // 'vezmi nůž' AND 'seber nůž' would both match 'take' — only one result
    const result = parser.parse("vezmi nůž", gameData, state)
    const ids = result.map(r => r.commandId)
    expect(ids.filter(id => id === "take").length).toBe(1)
  })

  it("# marker includes inventory items (near = here or carried)", () => {
    // examine the key (in inventory) — # matches near (here or carried)
    const result = parser.parse("prozkoumej klíč", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].params[0].map(p => p.itemId)).toContain("key")
  })

  it("exit: partial label match (obyvak substring)", () => {
    const result = parser.parse("jdi obyvaku", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("go")
    expect(result[0].params[0][0].to).toBe("living_room")
  })
})

// ─── parse() — negative ─────────────────────────────────────────────────────

describe("parse() — negative", () => {
  let parser
  let gameData
  let state

  beforeEach(() => {
    gameData = makeGameData()
    state = makeVisibleState(gameData)
    parser = createParser(makeCommands())
  })

  it("empty string returns []", () => {
    expect(parser.parse("", gameData, state)).toEqual([])
  })

  it("spaces-only input returns []", () => {
    expect(parser.parse("   ", gameData, state)).toEqual([])
  })

  it("null input returns []", () => {
    expect(parser.parse(null, gameData, state)).toEqual([])
  })

  it("completely unknown verb returns []", () => {
    expect(parser.parse("bláboj nůž", gameData, state)).toEqual([])
  })

  it("% marker: nonmovable item → empty params", () => {
    // 'zvedni stůl' — stůl je nonmovable, % neprojde
    const result = parser.parse("zvedni stůl", gameData, state)
    // Verb matched but no items resolved
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("take")
    expect(result[0].params[0]).toHaveLength(0)
  })

  it("% marker: item in different room → empty params", () => {
    // 'zvedni auto' — auto je v garáži, hráč je v kuchyni
    const result = parser.parse("zvedni auto", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].params[0]).toHaveLength(0)
  })

  it("$ marker: item not in inventory → empty params", () => {
    // 'polož nůž' — nůž je v kuchyni, ne v inventáři
    const result = parser.parse("polož nůž", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("drop")
    expect(result[0].params[0]).toHaveLength(0)
  })

  it("# marker: item in another room (not here, not carried) → empty params", () => {
    // 'prozkoumej auto' — auto je v garáži, # = near (here or carried)
    const result = parser.parse("prozkoumej auto", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].params[0]).toHaveLength(0)
  })

  it("^ marker: unknown exit → empty params", () => {
    const result = parser.parse("jdi na mars", gameData, state)
    expect(result).toHaveLength(1)
    expect(result[0].commandId).toBe("go")
    expect(result[0].params[0]).toHaveLength(0)
  })

  it("hidden item not returned by parser", () => {
    // Přidáme shadow zpět ke knife
    const hiddenState = addAttr(state, "knife", "shadow")
    const result = parser.parse("prozkoumej nůž", gameData, hiddenState)
    expect(result).toHaveLength(1)
    expect(result[0].params[0]).toHaveLength(0)
  })
})

// addAttr pro test hidden item (importujeme z state)
import { addAttr } from "../src/state.js"

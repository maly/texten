import { describe, it, expect, beforeEach } from "vitest"
import { createGame } from "./runner.js"

// ─── helpers ──────────────────────────────────────────────────────────────────

function walkTo(game, ...commands) {
  for (const cmd of commands) game.send(cmd)
}

// ─── Start state ──────────────────────────────────────────────────────────────

describe("start", () => {
  it("player starts at dvur", () => {
    const game = createGame()
    expect(game.getState().where).toBe("dvur")
  })

  it("mapa is in player inventory at start", () => {
    const game = createGame()
    expect(game.getState().items["mapa"]).toBe("*")
  })

  it("intro text contains dvur", () => {
    const game = createGame()
    expect(game.hasOutput("DVŮR")).toBe(true)
  })
})

// ─── Movement ────────────────────────────────────────────────────────────────

describe("pohyb", () => {
  it("jdi do stodoly", () => {
    const game = createGame()
    game.send("jdi do stodoly")
    expect(game.getState().where).toBe("stodola")
    expect(game.hasOutput("STODOLA")).toBe(true)
  })

  it("jdi do zahrady", () => {
    const game = createGame()
    game.send("jdi do zahrady")
    expect(game.getState().where).toBe("zahrada")
  })

  it("jdi do stodoly na pole zpet", () => {
    const game = createGame()
    game.send("jdi do stodoly")
    game.send("jdi na pole")
    expect(game.getState().where).toBe("pole")
    game.send("jdi do stodoly")
    expect(game.getState().where).toBe("stodola")
  })

  it("neznamy smer: kam chces jit?", () => {
    const game = createGame()
    game.send("jdi do Tokia")
    expect(game.hasOutput("Kam chceš jít?")).toBe(true)
    expect(game.getState().where).toBe("dvur")
  })
})

// ─── Klíč a dveře do domu ────────────────────────────────────────────────────

describe("klic a dum", () => {
  it("klic neni viditelny na dvore hned od zacatku (shadow)", () => {
    const game = createGame()
    // after boot movePlayer(dvur) is called, so shadow IS removed
    expect(game.getState().items["klic"]).toBe("dvur")
    // isVisible check: shadow should be removed by initial movePlayer
    expect(game.hasOutput("klíč")).toBe(true)
  })

  it("bez klice nelze jit do domu", () => {
    const game = createGame()
    // reveal exit first
    game.send("jdi do stodoly")
    game.send("jdi na dvur")
    game.send("jdi do domu")
    expect(game.hasOutput("Dveře jsou zamčené")).toBe(true)
    expect(game.getState().where).toBe("dvur")
  })

  it("vezmi klic a jdi do domu", () => {
    const game = createGame()
    game.send("vezmi klíč")
    expect(game.getState().items["klic"]).toBe("*")
    game.send("jdi do stodoly")
    game.send("jdi na dvur")
    game.send("jdi do domu")
    expect(game.getState().where).toBe("dum")
  })

  it("dum je tmavy bez lampy", () => {
    const game = createGame()
    game.send("vezmi klíč")
    game.send("jdi do stodoly")
    game.send("jdi na dvur")
    game.send("jdi do domu")
    expect(game.hasOutput("Je tu tma")).toBe(true)
  })
})

// ─── Předměty ─────────────────────────────────────────────────────────────────

describe("predmety", () => {
  it("vezmi jablko v zahrade", () => {
    const game = createGame()
    game.send("jdi do zahrady")
    game.send("vezmi jablko")
    expect(game.getState().items["jablko"]).toBe("*")
    expect(game.hasOutput("jablko")).toBe(true)
  })

  it("jablko neni v zahrade po smazani", () => {
    const game = createGame()
    game.send("jdi do zahrady")
    game.send("vezmi jablko")
    game.send("jdi na dvur")
    game.send("r")
    expect(game.hasOutput("červené jablko")).toBe(false)
  })

  it("inventar ukazuje vzate predmety", () => {
    const game = createGame()
    game.send("jdi do zahrady")
    game.send("vezmi jablko")
    game.send("i")
    expect(game.hasOutput("jablko")).toBe(true)
  })

  it("prozkoumej bednu ve stodole", () => {
    const game = createGame()
    game.send("jdi do stodoly")
    game.send("prozkoumej bednu")
    expect(game.hasOutput("semíško")).toBe(true)
  })

  it("otevri bednu a vezmi semena", () => {
    const game = createGame()
    game.send("jdi do stodoly")
    game.send("otevři bednu")
    game.send("vezmi semíško")
    expect(game.getState().items["semena"]).toBe("*")
  })
})

// ─── Prozkoumej ──────────────────────────────────────────────────────────────

describe("prozkoumej", () => {
  it("prozkoumej klic v inventari", () => {
    const game = createGame()
    game.send("vezmi klíč")
    game.send("prozkoumej klíč")
    expect(game.hasOutput("Rezavý")).toBe(true)
  })

  it("prozkoumej dopis po obdrzeni od gordona", () => {
    const game = createGame()
    game.send("jdi do zahrady")
    game.send("vezmi jablko")
    game.send("jdi na dvur")
    game.send("jdi do stodoly")
    game.send("dej jablko gordon")
    game.send("1") // ukončit dialog
    game.send("prozkoumej dopis")
    expect(game.hasOutput("Zapečetěný")).toBe(true)
  })
})

// ─── Gordon a dialog ──────────────────────────────────────────────────────────

describe("gordon", () => {
  it("gordon je ve stodole na zacatku", () => {
    const game = createGame()
    game.send("jdi do stodoly")
    expect(game.hasOutput("Gordon")).toBe(true)
  })

  it("mluv s gordonem spusti dialog", () => {
    const game = createGame()
    game.send("jdi do stodoly")
    game.send("mluv s gordon")
    expect(game.inDialog()).toBe(true)
    expect(game.hasOutput("Ahoj, cizinče")).toBe(true)
  })

  it("dialog: volba 4 = nashledanou ukonci dialog", () => {
    const game = createGame()
    game.send("jdi do stodoly")
    game.send("mluv s gordon")
    game.send("4") // Nashledanou → next: null → endDialog
    expect(game.inDialog()).toBe(false)
  })

  it("gordon neni tady kdyz hrac neni ve stodole", () => {
    const game = createGame()
    game.send("mluv s gordon")
    expect(game.hasOutput("Tady nikdo takový není")).toBe(true)
  })
})

// ─── Kompletní walkthrough ────────────────────────────────────────────────────

describe("walkthrough", () => {
  it("dej jablko gordonovi a dostane dopis", () => {
    const game = createGame()

    // Jít do zahrady a vzít jablko
    game.send("jdi do zahrady")
    game.send("vezmi jablko")
    expect(game.getState().items["jablko"]).toBe("*")

    // Jít do stodoly ke Gordonovi
    game.send("jdi na dvur")
    game.send("jdi do stodoly")

    // Dát jablko Gordonovi
    game.send("dej jablko gordon")
    expect(game.getState().items["jablko"]).not.toBe("*")  // jablko pryč
    expect(game.getState().items["dopis"]).toBe("*")       // dopis dostán
    expect(game.hasOutput("dopis")).toBe(true)
    expect(game.inDialog()).toBe(true)  // special dialog spuštěn
  })

  it("kompletni walkthrough: jablko → dopis → klic → dum", () => {
    const game = createGame()

    // Vzít klíč na dvoře
    game.send("vezmi klíč")
    expect(game.getState().items["klic"]).toBe("*")

    // Vzít jablko v zahradě
    game.send("jdi do zahrady")
    game.send("vezmi jablko")

    // Dát jablko Gordonovi ve stodole
    game.send("jdi na dvur")
    game.send("jdi do stodoly")
    game.send("dej jablko gordon")
    expect(game.getState().items["dopis"]).toBe("*")

    // Ukončit dialog
    game.send("1") // "Díky moc!" → next: null
    expect(game.inDialog()).toBe(false)

    // Jít do domu s klíčem
    game.send("jdi na dvur")
    game.send("jdi do domu")
    expect(game.getState().where).toBe("dum")
  })
})

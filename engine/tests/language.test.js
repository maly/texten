import { describe, it, expect } from "vitest"
import { flex, noDia, matchVerbWord, listToText, listToQuestion } from "../src/language.js"

// ─── flex() ────────────────────────────────────────────────────────────────

describe("flex()", () => {
  describe("positive", () => {
    it("returns exactly 6 forms", () => {
      expect(flex("bot-a,y,ě,u")).toHaveLength(6)
    })

    it("4-suffix noun: generates correct forms", () => {
      const f = flex("bot-a,y,ě,u")
      expect(f[0]).toBe("bota")   // nominativ
      expect(f[1]).toBe("boty")   // genitiv
      expect(f[2]).toBe("botě")   // dativ
      expect(f[3]).toBe("botu")   // akuzativ
      expect(f[4]).toBe("bota")   // lokativ → default nominativ
      expect(f[5]).toBe("bota")   // instrumentál → default nominativ
    })

    it("3-suffix noun: acc/lok/ins default to nominative", () => {
      const f = flex("nůž-,e,i")
      expect(f[0]).toBe("nůž")
      expect(f[1]).toBe("nůže")
      expect(f[2]).toBe("nůži")
      expect(f[3]).toBe("nůž")   // acc = nom
      expect(f[4]).toBe("nůž")   // lok = nom
      expect(f[5]).toBe("nůž")   // ins = nom
    })

    it("5-suffix noun: explicit lokativ", () => {
      const f = flex("stůl-,u,u,u,e")
      expect(f[0]).toBe("stůl")
      expect(f[3]).toBe("stůlu")
      expect(f[4]).toBe("stůle")  // explicitní lokativ
      expect(f[5]).toBe("stůl")   // ins = nom
    })

    it("6-suffix noun: all forms explicit", () => {
      const f = flex("nůž-,e,i,,i,em")
      expect(f[0]).toBe("nůž")
      expect(f[1]).toBe("nůže")
      expect(f[2]).toBe("nůži")
      expect(f[3]).toBe("nůž")    // prázdný suffix = nominativ základ
      expect(f[4]).toBe("nůži")
      expect(f[5]).toBe("nůžem")
    })

    it("empty first suffix: base word as nominative", () => {
      // core="nůž", suffix[0]="" → nom = "nůž" (already tested above)
      // For "auto": correct stem is "aut-", suffix "o,a,u" → auto, auta, autu
      const f = flex("aut-o,a,u")
      expect(f[0]).toBe("auto")
      expect(f[1]).toBe("auta")
      expect(f[2]).toBe("autu")
    })

    it("word with diacritics in base: base preserved", () => {
      const f = flex("klíč-,e,i")
      expect(f[0]).toBe("klíč")
      expect(f[1]).toBe("klíče")
    })

    it("adjective inflection: all 6 forms", () => {
      const f = flex("červen-ý,ého,ému,ý,ém,ým")
      expect(f[0]).toBe("červený")
      expect(f[1]).toBe("červeného")
      expect(f[5]).toBe("červeným")
    })
  })

  describe("negative", () => {
    it("throws on empty string", () => {
      expect(() => flex("")).toThrow()
    })

    it("throws on null", () => {
      expect(() => flex(null)).toThrow()
    })

    it("throws on undefined", () => {
      expect(() => flex(undefined)).toThrow()
    })

    it("throws on non-string", () => {
      expect(() => flex(42)).toThrow()
    })

    it("throws when missing dash separator", () => {
      expect(() => flex("bota,y,ě,u")).toThrow(/dash|separator|-/i)
    })

    it("throws with only 2 suffixes", () => {
      expect(() => flex("bot-a,y")).toThrow()
    })

    it("throws with only 1 suffix", () => {
      expect(() => flex("bot-a")).toThrow()
    })
  })
})

// ─── noDia() ───────────────────────────────────────────────────────────────

describe("noDia()", () => {
  describe("positive", () => {
    it("removes č → c", () => expect(noDia("čaj")).toBe("caj"))
    it("removes š → s", () => expect(noDia("šátek")).toBe("satek"))
    it("removes ž → z", () => expect(noDia("žába")).toBe("zaba"))
    it("removes ě → e", () => expect(noDia("měď")).toBe("med"))
    it("removes ř → r", () => expect(noDia("řeka")).toBe("reka"))
    it("removes á → a", () => expect(noDia("nůžá")).toBe("nuza"))
    it("removes ů → u", () => expect(noDia("nůž")).toBe("nuz"))
    it("removes ý → y", () => expect(noDia("žlutý")).toBe("zluty"))
    it("removes í → i", () => expect(noDia("klíč")).toBe("klic"))
    it("removes ú → u", () => expect(noDia("úžasný")).toBe("uzasny"))

    it("handles full Czech word: čeština → cestina", () => {
      expect(noDia("čeština")).toBe("cestina")
    })

    it("handles multi-word string", () => {
      expect(noDia("žlutý kůň")).toBe("zluty kun")
    })

    it("leaves plain ASCII unchanged", () => {
      expect(noDia("hello world")).toBe("hello world")
    })

    it("empty string → empty string", () => {
      expect(noDia("")).toBe("")
    })

    it("removes uppercase diacritics: Č → C", () => {
      expect(noDia("ČEŠKA")).toBe("CESKA")
    })

    it("uppercase Š → S, Ž → Z", () => {
      expect(noDia("ŠÉFKA")).toBe("SEFKA")
    })
  })

  describe("negative", () => {
    it("throws on null", () => {
      expect(() => noDia(null)).toThrow(TypeError)
    })

    it("throws on undefined", () => {
      expect(() => noDia(undefined)).toThrow(TypeError)
    })

    it("throws on number", () => {
      expect(() => noDia(42)).toThrow(TypeError)
    })

    it("throws on object", () => {
      expect(() => noDia({})).toThrow(TypeError)
    })
  })
})

// ─── matchVerbWord() ────────────────────────────────────────────────────────

describe("matchVerbWord()", () => {
  describe("positive", () => {
    it("exact 3-char word matches itself", () => {
      expect(matchVerbWord("jdi", "jdi")).toBe(true)
    })

    it("pattern 'prozkoumej': first 3 chars 'pro' match 'prozkoumej'", () => {
      expect(matchVerbWord("prozkoumej", "prozkoumej")).toBe(true)
    })

    it("pattern 'pro' (3 chars) matches 'prohlédni'", () => {
      expect(matchVerbWord("prozkoumej", "prohlédni")).toBe(true)
    })

    it("pattern word shorter than 3 chars: full word used", () => {
      // 'na' is 2 chars, prefix = 'na', input 'na' matches
      expect(matchVerbWord("na", "na")).toBe(true)
    })

    it("diacritics in pattern are stripped: 'přidej' → prefix 'pri'", () => {
      expect(matchVerbWord("přidej", "přidej")).toBe(true)
    })

    it("diacritics-free input matches diacritic pattern", () => {
      expect(matchVerbWord("přidej", "pridej")).toBe(true)
    })

    it("diacritic pattern matches diacritic input", () => {
      expect(matchVerbWord("zvedni", "zvedni")).toBe(true)
    })

    it("longer input with same prefix matches", () => {
      // pattern 'jdi', prefix 'jdi'; input 'jdíme' (noDia: 'jdime') starts with 'jdi' ✓
      expect(matchVerbWord("jdi", "jdíme")).toBe(true)
    })

    it("case insensitive: uppercase input matches", () => {
      expect(matchVerbWord("jdi", "JDI")).toBe(true)
    })
  })

  describe("negative", () => {
    it("completely different words do not match", () => {
      expect(matchVerbWord("jdi", "vezmi")).toBe(false)
    })

    it("empty pattern returns false", () => {
      expect(matchVerbWord("", "jdi")).toBe(false)
    })

    it("empty input returns false", () => {
      expect(matchVerbWord("jdi", "")).toBe(false)
    })

    it("null pattern returns false", () => {
      expect(matchVerbWord(null, "jdi")).toBe(false)
    })

    it("input that doesn't start with prefix fails", () => {
      // 'seber' prefix 'seb', input 'vezmi' starts with 'vez' ≠ 'seb'
      expect(matchVerbWord("seber", "vezmi")).toBe(false)
    })
  })
})

// ─── listToText() ───────────────────────────────────────────────────────────

describe("listToText()", () => {
  it("empty array returns empty string", () => {
    expect(listToText([])).toBe("")
  })

  it("one item ends with period", () => {
    expect(listToText(["nůž"])).toBe("nůž.")
  })

  it("two items joined with ' a '", () => {
    expect(listToText(["nůž", "klíč"])).toBe("nůž a klíč.")
  })

  it("three items: comma-separated with ' a ' before last", () => {
    expect(listToText(["nůž", "klíč", "bota"])).toBe("nůž, klíč a bota.")
  })

  it("custom separator", () => {
    expect(listToText(["nůž", "klíč"], " nebo ")).toBe("nůž nebo klíč.")
  })
})

// ─── listToQuestion() ───────────────────────────────────────────────────────

describe("listToQuestion()", () => {
  it("empty array returns empty string", () => {
    expect(listToQuestion([])).toBe("")
  })

  it("one item ends with question mark", () => {
    expect(listToQuestion(["nůž"])).toBe("nůž?")
  })

  it("two items: 'x, nebo y?'", () => {
    expect(listToQuestion(["nůž", "klíč"])).toBe("nůž, nebo klíč?")
  })

  it("three items: comma + nebo before last", () => {
    expect(listToQuestion(["nůž", "klíč", "bota"])).toBe("nůž, klíč, nebo bota?")
  })
})

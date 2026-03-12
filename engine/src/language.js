// Czech language utilities for TEXTEN engine

// Czech diacritics map (lowercase + uppercase)
const DIA_MAP = {
  á: "a", č: "c", ď: "d", é: "e", ě: "e", í: "i",
  ň: "n", ó: "o", ř: "r", š: "s", ť: "t", ú: "u",
  ů: "u", ý: "y", ž: "z",
  Á: "A", Č: "C", Ď: "D", É: "E", Ě: "E", Í: "I",
  Ň: "N", Ó: "O", Ř: "R", Š: "S", Ť: "T", Ú: "U",
  Ů: "U", Ý: "Y", Ž: "Z",
}

// Remove Czech diacritics from a string
export const noDia = (str) => {
  if (str === null || str === undefined || typeof str !== "string") {
    throw new TypeError("noDia: expected a string")
  }
  return str.replace(/[^\u0000-\u007E]/g, (ch) => DIA_MAP[ch] ?? ch)
}

// Generate 6 grammatical case forms from a flex string.
//
// Format: "base-nom,gen,dat[,acc[,lok[,ins]]]"
//   - Minimum 3 suffixes (nominative, genitive, dative)
//   - acc defaults to nominative if omitted
//   - lok defaults to nominative if omitted
//   - ins defaults to nominative if omitted
//
// Examples:
//   flex("bot-a,y,ě,u")       → ["bota","boty","botě","botu","bota","bota"]
//   flex("nůž-,e,i")          → ["nůž","nůže","nůži","nůž","nůž","nůž"]
//   flex("stůl-,u,u,u,e,em")  → ["stůl","stůlu","stůlu","stůlu","stůle","stůlem"]
export const flex = (flexStr) => {
  if (!flexStr || typeof flexStr !== "string") {
    throw new TypeError("flex: expected a non-empty string")
  }

  const parts = flexStr.split(",")
  const firstPart = parts[0]
  const dashIdx = firstPart.indexOf("-")

  if (dashIdx === -1) {
    throw new Error(
      'flex: invalid format — missing "-" separator (expected "base-suffix1,suffix2,...")'
    )
  }

  const core = firstPart.slice(0, dashIdx)
  const allSuffixes = [firstPart.slice(dashIdx + 1), ...parts.slice(1)]

  if (allSuffixes.length < 3) {
    throw new Error(
      `flex: need at least 3 suffixes (nom, gen, dat), got ${allSuffixes.length}`
    )
  }

  const nom = core + allSuffixes[0]

  return [
    nom,                                                                   // 0: nominativ
    core + allSuffixes[1],                                                 // 1: genitiv
    core + allSuffixes[2],                                                 // 2: dativ
    allSuffixes[3] !== undefined ? core + allSuffixes[3] : nom,           // 3: akuzativ
    allSuffixes[4] !== undefined ? core + allSuffixes[4] : nom,           // 4: lokativ
    allSuffixes[5] !== undefined ? core + allSuffixes[5] : nom,           // 5: instrumentál
  ]
}

// Check if a verb pattern word (first ≤3 chars) matches an input word.
// Both are diacritics-stripped and lowercased before comparison.
export const matchVerbWord = (patternWord, inputWord) => {
  if (!patternWord || !inputWord) return false
  const prefixLen = Math.min(3, patternWord.length)
  const prefix = noDia(patternWord.slice(0, prefixLen).toLowerCase())
  const inputNoDia = noDia(inputWord.toLowerCase())
  return inputNoDia.startsWith(prefix)
}

// Format a list of strings as natural Czech text ("x, y a z.")
export const listToText = (items, sep = " a ") => {
  if (!items || items.length === 0) return ""
  if (items.length === 1) return items[0] + "."
  return items.slice(0, -1).join(", ") + sep + items[items.length - 1] + "."
}

// Format a list of strings as a Czech choice question ("x, nebo y?")
export const listToQuestion = (items) => {
  if (!items || items.length === 0) return ""
  if (items.length === 1) return items[0] + "?"
  return items.slice(0, -1).join(", ") + ", nebo " + items[items.length - 1] + "?"
}

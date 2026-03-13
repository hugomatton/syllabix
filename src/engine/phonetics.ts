// src/engine/phonetics.ts
import { PHONETIC_TOLERANCE, BLACKLIST } from '../config'

export type BonusType = 'none' | 'ortho' | 'combo' | 'both'

export type ValidationResult = {
  valid: boolean
  reason: 'not-in-dictionary' | 'wrong-syllable' | 'inflection' | 'blacklisted' | null
  bonusType: BonusType
  scorePoints: number
}

/**
 * Normalise une chaîne IPA en NFC et la décompose en array de caractères.
 * Critique pour la gestion correcte des voyelles nasales (ɛ̃, ɔ̃, ɑ̃, œ̃).
 * Équivalent de normalize_ipa_chars() dans scripts/run_tests.py
 */
export function normalizeIPAChars(s: string): string[] {
  return [...s.normalize('NFC')]
}

/**
 * Distance de Levenshtein entre deux chaînes IPA, opérant sur des caractères NFC.
 * Algorithme DP optimisé O(m*n) — equivalent de levenshtein() dans scripts/run_tests.py
 * @returns distance d'édition entière ≥ 0
 */
export function levenshteinIPA(a: string, b: string): number {
  const aChars = normalizeIPAChars(a)
  const bChars = normalizeIPAChars(b)
  if (aChars.join('') === bChars.join('')) return 0
  if (!aChars.length) return bChars.length
  if (!bChars.length) return aChars.length

  const m = aChars.length
  const n = bChars.length
  const dp = Array.from({ length: n + 1 }, (_, i) => i)

  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = Math.min(
        dp[j] + 1, // deletion
        dp[j - 1] + 1, // insertion
        prev + (aChars[i - 1] === bChars[j - 1] ? 0 : 1), // substitution
      )
      prev = temp
    }
  }

  return dp[n]
}

/**
 * Retourne la dernière syllabe phonétique IPA d'un mot.
 * Stratégie : chercher la clé graph la plus longue qui est un suffixe de l'IPA du mot.
 * Les clés de graph.json sont exactement les dernières syllabes des mots valides.
 *
 * Ex: getLastSyllable("chocolat", dict, graph)
 *   → dict.get("chocolat") = "ʃokola"
 *   → graph key "la" est un suffixe de "ʃokola" → retourne "la"
 */
export function getLastSyllable(
  word: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>,
): string | null {
  const ipa = dictionary.get(word.toLowerCase())
  if (!ipa) return null

  const normalizedIPA = ipa.normalize('NFC')
  let bestKey = ''
  let bestKeyNormalizedLength = 0

  for (const key of Object.keys(graph)) {
    const normalizedKey = key.normalize('NFC')
    if (normalizedIPA.endsWith(normalizedKey) && normalizedKey.length > bestKeyNormalizedLength) {
      bestKey = key
      bestKeyNormalizedLength = normalizedKey.length
    }
  }

  return bestKey || null
}

/**
 * Retourne la première syllabe phonétique IPA d'un mot.
 *
 * Stratégie principale : lookup direct dans `syllables` (mot → first_syl_IPA depuis Lexique).
 * Fallback si absent : chercher la clé graph la plus longue qui est un PRÉFIXE de l'IPA du mot.
 *
 * Ex: getFirstSyllable("repasser", dict, graph, syllables)
 *   → syllables.get("repasser") = "ʁə" → retourne "ʁə" (NFC normalisé)
 *
 * Ex fallback: getFirstSyllable("aicher", dict, graph, new Map())
 *   → dict.get("aicher") = "ɛʃe"
 *   → graph key "ɛ" est un préfixe de "ɛʃe" → retourne "ɛ"
 */
export function getFirstSyllable(
  word: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>,
  syllables: Map<string, string> = new Map(),
): string | null {
  const wordLower = word.toLowerCase()

  // Lookup direct dans syllables (source de vérité Lexique)
  const fromSyllables = syllables.get(wordLower)
  if (fromSyllables) return fromSyllables.normalize('NFC')

  // Fallback : préfixe le plus long dans les clés graph
  const ipa = dictionary.get(wordLower)
  if (!ipa) return null

  const normalizedIPA = ipa.normalize('NFC')
  let bestKey = ''
  let bestKeyNormalizedLength = 0

  for (const key of Object.keys(graph)) {
    const normalizedKey = key.normalize('NFC')
    if (normalizedIPA.startsWith(normalizedKey) && normalizedKey.length > bestKeyNormalizedLength) {
      bestKey = key
      bestKeyNormalizedLength = normalizedKey.length
    }
  }

  // Normaliser NFC pour cohérence avec le path syllables (F12)
  return bestKey ? bestKey.normalize('NFC') : null
}

/**
 * Retourne la concaténation des 2 dernières syllabes IPA d'un mot.
 * Stratégie : trouver la dernière syllabe (getLastSyllable), puis chercher
 * la syllabe qui précède (suffixe le plus long du reste dans les clés graph).
 *
 * Ex: getLastTwoSyllables("chocolat", dict, graph)
 *   → IPA "ʃokola"
 *   → lastSyl = "la" → remaining = "ʃoko"
 *   → penultimateSyl = "ko" → retourne "kola"
 *
 * Retourne uniquement la dernière syllabe si le mot est mono-syllabique
 * ou si la deuxième syllabe est introuvable dans graph.
 */
export function getLastTwoSyllables(
  word: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>,
): string | null {
  const ipa = dictionary.get(word.toLowerCase())
  if (!ipa) return null

  const normalizedIPA = ipa.normalize('NFC')

  const lastSyl = getLastSyllable(word, dictionary, graph)
  if (!lastSyl) return null

  const normalizedLastSyl = lastSyl.normalize('NFC')
  const remaining = normalizedIPA.slice(0, normalizedIPA.length - normalizedLastSyl.length)

  if (!remaining) return normalizedLastSyl

  let bestKey = ''
  let bestKeyNormalizedLength = 0

  for (const key of Object.keys(graph)) {
    const normalizedKey = key.normalize('NFC')
    if (remaining.endsWith(normalizedKey) && normalizedKey.length > bestKeyNormalizedLength) {
      bestKey = key
      bestKeyNormalizedLength = normalizedKey.length
    }
  }

  if (!bestKey) return normalizedLastSyl

  return bestKey.normalize('NFC') + normalizedLastSyl
}

/**
 * Valide si un mot soumis peut suivre le mot courant du bot.
 * Logique en 4 étapes alignée sur validate_word() de scripts/run_tests.py
 *
 * @param input       mot soumis par le joueur (non normalisé)
 * @param currentWord mot courant du bot (dans le dictionnaire, last syllable = graph key)
 * @param dictionary  Map<mot, IPA> pré-chargée
 * @param graph       Record<syllabe, mots[]> pré-chargé
 * @param syllables   Map<mot, first_syl_IPA> depuis syllables.json (optionnel, fallback si absent)
 */
export function validateWord(
  input: string,
  currentWord: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>,
  syllables: Map<string, string> = new Map(),
): ValidationResult {
  const normalizedInput = input.toLowerCase().trim()

  // Étape 0 : rejeter les mots blacklistés (onomatopées, formes parasites…)
  if (BLACKLIST.has(normalizedInput)) {
    return { valid: false, reason: 'blacklisted', bonusType: 'none', scorePoints: 1 }
  }

  // Étape 1 : le mot doit être dans le dictionnaire (FR10)
  const inputIPA = dictionary.get(normalizedInput)
  if (!inputIPA) return { valid: false, reason: 'not-in-dictionary', bonusType: 'none', scorePoints: 1 }

  // Étape 1bis : rejeter les formes fléchies du mot courant (bidirectionnel)
  // Direction A : input est le stem du currentWord → "songe" après "songes" ("songe"+"s"="songes")
  // Direction B : input est l'inflexion du currentWord → "pains" après "pain" ("pain"+"s"="pains")
  // Note: si currentIPA est absent (bot word hors dict — invariant impossible en jeu normal),
  // le break déclenche quand même le skip vers l'étape 2 qui retournera wrong-syllable.
  const currentWordLower = currentWord.toLowerCase()
  const currentIPA = dictionary.get(currentWordLower)
  const suffixes = ['aux', 'es', 's', 'e']  // ordre : plus long d'abord
  if (currentIPA) {
    const normalizedCurrentIPA = currentIPA.normalize('NFC')
    const normalizedInputIPA = inputIPA.normalize('NFC')
    for (const suffix of suffixes) {
      // Direction A : input + suffix = currentWord (joueur soumet le singulier/base)
      if (normalizedInput + suffix === currentWordLower) {
        if (normalizedInputIPA === normalizedCurrentIPA) {
          return { valid: false, reason: 'inflection', bonusType: 'none', scorePoints: 1 }
        }
        break
      }
      // Direction B : currentWord + suffix = input (joueur soumet le pluriel/fléchi)
      if (currentWordLower + suffix === normalizedInput) {
        if (normalizedInputIPA === normalizedCurrentIPA) {
          return { valid: false, reason: 'inflection', bonusType: 'none', scorePoints: 1 }
        }
        break
      }
    }
  }

  // Étape 2 : obtenir la dernière syllabe du mot courant (clé graph garantie car bot word)
  const targetSyl = getLastSyllable(currentWord, dictionary, graph)
  if (!targetSyl) return { valid: false, reason: 'wrong-syllable', bonusType: 'none', scorePoints: 1 }

  // Étape 3 : obtenir la première syllabe de l'input via syllables (lookup O(1)) ou graph-prefix (fallback)
  const firstSyl = getFirstSyllable(normalizedInput, dictionary, graph, syllables)

  let inputStart: string
  if (firstSyl) {
    inputStart = firstSyl
  } else {
    // Fallback : préfixe de longueur fixe (ne devrait pas arriver pour les mots valides)
    const targetChars = normalizeIPAChars(targetSyl)
    const inputIPAChars = normalizeIPAChars(inputIPA)
    inputStart = inputIPAChars.slice(0, targetChars.length).join('')
  }

  // Étape 4 : distance de Levenshtein ≤ PHONETIC_TOLERANCE (FR8)
  const dist = levenshteinIPA(inputStart, targetSyl)
  if (dist > PHONETIC_TOLERANCE) return { valid: false, reason: 'wrong-syllable', bonusType: 'none', scorePoints: 1 }

  // ✅ Mot valide — calculer les bonus (FR16, FR17)
  const isOrthoBonus = dist === 0 // match phonétique exact → bonus orthographe (FR16)

  // Combo : l'IPA de l'input commence-t-il par les 2 dernières syllabes du mot courant ? (FR17)
  const lastTwoSyl = getLastTwoSyllables(currentWord, dictionary, graph)
  const isComboBonus = lastTwoSyl !== null
    && inputIPA.normalize('NFC').startsWith(lastTwoSyl.normalize('NFC'))

  let bonusType: BonusType = 'none'
  let scorePoints = 1
  if (isOrthoBonus && isComboBonus) { bonusType = 'both'; scorePoints = 4 }
  else if (isComboBonus)            { bonusType = 'combo'; scorePoints = 3 }
  else if (isOrthoBonus)            { bonusType = 'ortho'; scorePoints = 2 }

  return { valid: true, reason: null, bonusType, scorePoints }
}

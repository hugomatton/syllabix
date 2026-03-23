// src/engine/phonetics.test.ts
import { describe, it, expect } from 'vitest'
import testCases from '../../scripts/test_cases.json'
import { validateWord, getLastSyllable, getLastTwoSyllables, levenshteinIPA, getFirstSyllable } from './phonetics'

import dictionaryRaw from '../../public/dictionary.json'
import graphRaw from '../../public/graph.json'

const dictionary = new Map<string, string>(Object.entries(dictionaryRaw))
const graph = graphRaw as Record<string, string[]>

describe('levenshteinIPA', () => {
  it('retourne 0 pour des strings identiques', () => {
    expect(levenshteinIPA('la', 'la')).toBe(0)
    expect(levenshteinIPA('pɛ̃', 'pɛ̃')).toBe(0)
  })
  it('retourne la longueur de la string pour comparaison avec vide', () => {
    expect(levenshteinIPA('', 'la')).toBe(2)
    expect(levenshteinIPA('la', '')).toBe(2)
  })
  it('gère les voyelles nasales NFC (ɛ̃, ɔ̃)', () => {
    expect(levenshteinIPA('pɛ̃', 'pɔ̃')).toBe(1) // ɛ vs ɔ — 1 substitution
  })
  it('retourne 0 pour strings vides', () => {
    expect(levenshteinIPA('', '')).toBe(0)
  })
  it('calcule distance > 0 pour strings différentes', () => {
    expect(levenshteinIPA('la', 'le')).toBe(1)
    expect(levenshteinIPA('abc', 'xyz')).toBe(3)
  })
})

describe('getLastSyllable', () => {
  it('retourne "la" pour "chocolat"', () => {
    expect(getLastSyllable('chocolat', dictionary, graph)).toBe('la')
  })
  it('retourne null pour un mot absent du dictionnaire', () => {
    expect(getLastSyllable('motinexistant', dictionary, graph)).toBeNull()
  })
  it('retourne la bonne syllabe pour "lapin"', () => {
    const result = getLastSyllable('lapin', dictionary, graph)
    // lapin IPA = lapɛ̃ → last syllable should be "pɛ̃"
    expect(result).toBe('pɛ̃')
  })
})

describe('getFirstSyllable', () => {
  it('retourne "lap" pour "lapin" (lap = plus long préfixe de lapɛ̃ dans graph) — fallback sans syllables', () => {
    expect(getFirstSyllable('lapin', dictionary, graph)).toBe('lap')
  })
  it('retourne "ɛ" pour "aicher" (ɛ = préfixe de ɛʃe, clé graph) — fallback sans syllables', () => {
    expect(getFirstSyllable('aicher', dictionary, graph)).toBe('ɛ')
  })
  it('retourne null pour un mot absent du dictionnaire', () => {
    expect(getFirstSyllable('motinexistant', dictionary, graph)).toBeNull()
  })
  it('AC2 — utilise syllables map en priorité sur le fallback graph-prefix (happy path)', () => {
    // Simule syllables.get('repasser') = 'ʁə' — lookupO(1) depuis Lexique
    const mockSyllables = new Map<string, string>([['repasser', 'ʁə']])
    const result = getFirstSyllable('repasser', dictionary, graph, mockSyllables)
    expect(result).toBe('ʁə')
  })
  it('AC2 — retourne le fallback graph-prefix quand mot absent de syllables', () => {
    // syllables vide → fallback → comportement pré-T3
    const emptySyllables = new Map<string, string>()
    const result = getFirstSyllable('lapin', dictionary, graph, emptySyllables)
    expect(result).toBe('lap')  // même résultat que le test fallback ci-dessus
  })
})

describe('validateWord — 55 cas de test_cases.json', () => {
  it.each(testCases)('$word suit $previous → expected=$expected', ({ word, previous, expected }) => {
    const result = validateWord(word, previous, dictionary, graph)
    expect(result.valid).toBe(expected)
  })
})

describe('validateWord — cas unitaires', () => {
  it('retourne not-in-dictionary pour un mot absent', () => {
    const result = validateWord('zzzmotbidon', 'chocolat', dictionary, graph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('not-in-dictionary')
    expect(result.bonusType).toBe('none')
    expect(result.scorePoints).toBe(1)
  })
  it('retourne wrong-syllable pour mauvaise syllabe', () => {
    // chocolat suit maison → last_syl(maison)='zɔ̃', first_syl(chocolat)='ʃo' → dist=3 > 2
    const result = validateWord('chocolat', 'maison', dictionary, graph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('wrong-syllable')
    expect(result.bonusType).toBe('none')
  })
  it('retourne valid=true pour mot avec bonne syllabe (match exact)', () => {
    const result = validateWord('lapin', 'chocolat', dictionary, graph) // "la" = "la"
    expect(result.valid).toBe(true)
    expect(result.reason).toBeNull()
  })
  it('AC5 — rejette quand dist=2 mais firstSyl trop court (tolérance proportionnelle)', () => {
    // 'aicher' (IPA: ɛʃe, first_syl: ɛ, len=1) suit 'lapin' (last_syl: pɛ̃, len=3)
    // levenshteinIPA('ɛ', 'pɛ̃') = 2 → effectiveTolerance = min(2, min(1,3)) = 1 → rejeté
    const result = validateWord('aicher', 'lapin', dictionary, graph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('wrong-syllable')
  })
  it('AC5b — accepte dans la zone de tolérance quand syllabes de longueur comparable', () => {
    // 'lac' (first_syl: lak, len=3) suit 'chocolat' (last_syl: la, len=2)
    // levenshteinIPA('lak', 'la') = 1 → effectiveTolerance = min(2, min(3,2)) = 2 → accepté
    const result = validateWord('lac', 'chocolat', dictionary, graph)
    expect(result.valid).toBe(true)
    expect(result.reason).toBeNull()
  })
  it('fallback (getFirstSyllable=null) — préfixe fixe utilisé, résultat déterministe', () => {
    // IPA 'qzz' n'a aucun préfixe dans mockGraph → getFirstSyllable retourne null → fallback activé
    // Fallback : inputStart = 'qz' (targetChars.length=2 pour 'la'), dist('qz','la')=2 > 1 → invalid
    const mockDict = new Map<string, string>([
      ['motfallback', 'qzz'],
      ['current', 'xla'],
    ])
    const mockGraph: Record<string, string[]> = { la: ['current'] }
    const result = validateWord('motfallback', 'current', mockDict, mockGraph)
    expect(result.valid).toBe(false) // dist(2) > PHONETIC_TOLERANCE(1)
    expect(result.reason).toBe('wrong-syllable')
  })
  it('currentWord absent du dict → valid=false avec reason wrong-syllable (état jeu invalide)', () => {
    // Si le bot fournit un mot hors dictionnaire, la raison est wrong-syllable
    // Le bot ne devrait jamais être dans cet état (invariant garanti par botSelector)
    const result = validateWord('lapin', 'motinexistant', dictionary, graph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('wrong-syllable')
  })
})

// ─── Tests Story 4.3 : Bonus Orthographe & Combo Syllabe Double (FR16, FR17) ───

describe('getLastTwoSyllables', () => {
  it('retourne null pour un mot absent du dictionnaire', () => {
    expect(getLastTwoSyllables('motinexistant', dictionary, graph)).toBeNull()
  })

  it('retourne une string non-nulle pour "chocolat"', () => {
    const result = getLastTwoSyllables('chocolat', dictionary, graph)
    expect(result).not.toBeNull()
    // Doit être plus long que la dernière syllabe seule ("la")
    const lastSyl = getLastSyllable('chocolat', dictionary, graph)
    expect(result!.length).toBeGreaterThanOrEqual(lastSyl!.length)
  })

  it('se termine par la dernière syllabe du mot', () => {
    const lastSyl = getLastSyllable('chocolat', dictionary, graph)
    const lastTwoSyl = getLastTwoSyllables('chocolat', dictionary, graph)
    expect(lastTwoSyl!.endsWith(lastSyl!.normalize('NFC'))).toBe(true)
  })

  it('utilise un mock pour valider la logique "kola" pour "chocolat" (IPA: ʃokola)', () => {
    // Contrôle précis via mock : IPA = ʃokola
    // lastSyl = "la" (suffix dans mockGraph), remaining = "ʃoko"
    // penultimate = "ko" (suffix de "ʃoko" dans mockGraph) → "kola"
    const mockDict = new Map<string, string>([
      ['chocolat', 'ʃokola'],
      ['kolagene', 'kolaʒɛn'],
    ])
    const mockGraph: Record<string, string[]> = {
      la: ['kolagene'],
      ko: ['kolagene'],
    }
    const result = getLastTwoSyllables('chocolat', mockDict, mockGraph)
    expect(result).toBe('kola')
  })

  it('retourne la dernière syllabe seule pour mot mono-syllabique (mock)', () => {
    const mockDict = new Map<string, string>([['monosyl', 'la']])
    const mockGraph: Record<string, string[]> = { la: ['monosyl'] }
    const result = getLastTwoSyllables('monosyl', mockDict, mockGraph)
    expect(result).toBe('la') // Pas de deuxième syllabe disponible
  })
})

describe('validateWord — bonus orthographe (AC1, FR16)', () => {
  it("bonusType='ortho' et scorePoints=2 quand dist IPA = 0 (match exact)", () => {
    // Mock : current IPA = "xyla"
    //   → lastSyl = "la" (suffix "la" dans graph, len 2)
    //   → remaining = "xy", penultimate = "xy" (suffix "xy" dans graph)
    //   → lastTwoSyl = "xyla" (clé "xy" + "la")
    // motvalide IPA = "lapin" → firstSyl = "la" (prefix, len 2)
    //   → dist("la", "la") = 0 → isOrthoBonus = true
    //   → "lapin".startsWith("xyla") = false → isComboBonus = false
    //   → bonusType = 'ortho'
    const mockDict = new Map<string, string>([
      ['current', 'xyla'],
      ['motvalide', 'lapin'],
    ])
    const mockGraph: Record<string, string[]> = {
      la: ['motvalide'],
      xy: ['current'],
      pin: ['motvalide'],
    }
    const result = validateWord('motvalide', 'current', mockDict, mockGraph)
    expect(result.valid).toBe(true)
    expect(result.bonusType).toBe('ortho')
    expect(result.scorePoints).toBe(2)
  })

  it("bonusType='none' et scorePoints=1 quand dist IPA > 0 (match tolérancé)", () => {
    // 'lapin' suit 'chocolat' : first_syl(lapin)="lap", last_syl(chocolat)="la"
    // dist("lap","la") = 1 → valide mais pas de bonus ortho
    const result = validateWord('lapin', 'chocolat', dictionary, graph)
    expect(result.valid).toBe(true)
    expect(result.bonusType).toBe('none')
    expect(result.scorePoints).toBe(1)
  })
})

describe('validateWord — combo syllabe double (AC2, FR17)', () => {
  it("bonusType='combo' et scorePoints=3 quand préfixe IPA = 2 dernières syllabes", () => {
    // Mock : current IPA = "ʃokola" → lastSyl = "la", lastTwoSyl = "kola"
    //        motcombo IPA = "kolaʒɛn" → syllables force firstSyl = "lo" → dist("lo","la")=1 → valid
    //        "kolaʒɛn".startsWith("kola") → combo, mais dist>0 → pas ortho → bonusType='combo'
    const mockDict = new Map<string, string>([
      ['current', 'ʃokola'],
      ['motcombo', 'kolaʒɛn'],
    ])
    const mockGraph: Record<string, string[]> = {
      la: ['motcombo'],
      ko: ['motcombo'],
    }
    const mockSyllables = new Map<string, string>([['motcombo', 'lo']])
    const result = validateWord('motcombo', 'current', mockDict, mockGraph, mockSyllables)
    expect(result.valid).toBe(true)
    expect(result.bonusType).toBe('combo')
    expect(result.scorePoints).toBe(3)
  })
})

describe('validateWord — filtre inflexions (AC3 tech-spec)', () => {
  it('AC3 — direction A : player soumet singulier du mot courant (même IPA)', () => {
    // songe IPA = sɔ̃ʒ, songes IPA = sɔ̃ʒ
    // "songe" + "s" = "songes" (currentWord) ET IPA identique → inflexion
    const result = validateWord('songe', 'songes', dictionary, graph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('inflection')
    expect(result.bonusType).toBe('none')
  })
  it('AC3 — direction B : player soumet pluriel du mot courant (même IPA)', () => {
    // pain IPA = pɛ̃, pains IPA = pɛ̃
    // currentWord="pain", "pain"+"s"="pains"=input → inflexion
    const mockDict = new Map<string, string>([['pain', 'pɛ̃'], ['pains', 'pɛ̃']])
    const mockGraph: Record<string, string[]> = { pɛ̃: ['pain', 'pains'] }
    const result = validateWord('pains', 'pain', mockDict, mockGraph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('inflection')
  })
  it('ne rejette pas les mots valides dont le stem+suffix ≠ currentWord', () => {
    // "lapin" + suffixes ≠ "chocolat" → pas d'inflexion
    const result = validateWord('lapin', 'chocolat', dictionary, graph)
    expect(result.valid).toBe(true)
    expect(result.reason).toBeNull()
  })
  it('ne rejette pas quand IPA différent malgré correspondance orthographique avec suffix', () => {
    // "verre" et "verres" ont même IPA (vɛʁ) → inflexion correctement rejetée
    // Mais "ver" (vɛʁ) et "verres" (vɛʁ) → aussi inflexion si "ver"+"s"="vers"≠"verres"
    // Test : "ver" + "s" = "vers" ≠ "verres" → pas d'inflexion → résultat phonétique normal
    const mockDict = new Map<string, string>([
      ['verres', 'vɛʁ'],  // currentWord
      ['ver', 'vɛʁ'],     // player submits — ver+s=vers≠verres → pas inflexion
    ])
    const mockGraph: Record<string, string[]> = { vɛʁ: ['verres', 'ver'] }
    const result = validateWord('ver', 'verres', mockDict, mockGraph)
    // Pas d'inflexion car "ver"+"s"="vers" ≠ "verres"
    // Mais phonétiquement valid : firstSyl("ver")="vɛʁ", targetSyl="vɛʁ", dist=0
    expect(result.reason).not.toBe('inflection')
    expect(result.valid).toBe(true)
  })
})

describe('validateWord — cumul bonus ortho + combo (AC3)', () => {
  it("bonusType='both' et scorePoints=4 quand dist=0 ET préfixe 2 syllabes", () => {
    // Pour 'both', on utilise un current mono-syllabique → lastTwoSyl = lastSyl = "la"
    // motcumul IPA = "lapin" → firstSyl = "la" → dist("la","la") = 0 → isOrthoBonus = true
    //                        → "lapin".startsWith("la") = true → isComboBonus = true
    // → bonusType = 'both', scorePoints = 4
    const mockDict = new Map<string, string>([
      ['current', 'la'],    // mot mono-syllabique : lastSyl = "la", lastTwoSyl = "la"
      ['motcumul', 'lapin'],
    ])
    const mockGraph: Record<string, string[]> = {
      la: ['motcumul'],
      pin: ['motcumul'],
    }
    const result = validateWord('motcumul', 'current', mockDict, mockGraph)
    expect(result.valid).toBe(true)
    expect(result.bonusType).toBe('both')
    expect(result.scorePoints).toBe(4)
  })
})

describe('validateWord — doublons chaîne joueur (case 4)', () => {
  it('rejette un mot déjà présent dans la chaîne', () => {
    const result = validateWord('lapin', 'chocolat', dictionary, graph, new Map(), ['chocolat', 'lapin'])
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('already-played')
  })
  it('accepte un mot absent de la chaîne', () => {
    const result = validateWord('lapin', 'chocolat', dictionary, graph, new Map(), ['chocolat'])
    expect(result.valid).toBe(true)
  })
  it('vérifie la chaîne en case-insensitive', () => {
    const result = validateWord('Lapin', 'chocolat', dictionary, graph, new Map(), ['chocolat', 'LAPIN'])
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('already-played')
  })
  it('fonctionne sans chaîne (rétrocompatibilité)', () => {
    const result = validateWord('lapin', 'chocolat', dictionary, graph)
    expect(result.valid).toBe(true)
  })
})

describe('validateWord — inflexions stem commun (case 2)', () => {
  it('rejette conjugaison partageant stem long et IPA préfixe', () => {
    // chante IPA=ʃɑ̃t, chanter IPA=ʃɑ̃te — "chante" (5 chars) est préfixe de "chanter" (7 chars)
    // stem commun "chant" = 5 chars, minLen=6, threshold=max(5, ceil(6*0.7))=max(5,5)=5 → 5≥5 ✓
    // IPA "ʃɑ̃t" est préfixe de "ʃɑ̃te" → inflexion
    const mockDict = new Map<string, string>([
      ['chante', 'ʃɑ̃t'],
      ['chanter', 'ʃɑ̃te'],
    ])
    const mockGraph: Record<string, string[]> = { 'ʃɑ̃t': ['chante'], 'ʃɑ̃': ['chanter'] }
    const result = validateWord('chanter', 'chante', mockDict, mockGraph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('inflection')
  })
  it('ne rejette pas des mots avec stem court (< 5 chars)', () => {
    // port/porte — stem "port" = 4 chars < threshold(5) → pas d'inflexion
    const mockDict = new Map<string, string>([
      ['port', 'pɔʁ'],
      ['porte', 'pɔʁt'],
    ])
    const mockGraph: Record<string, string[]> = { 'pɔʁ': ['port'], 'pɔʁt': ['porte'] }
    const result = validateWord('porte', 'port', mockDict, mockGraph)
    expect(result.reason).not.toBe('inflection')
  })
})

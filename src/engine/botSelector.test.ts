// src/engine/botSelector.test.ts
import { describe, it, expect } from 'vitest'
import { selectBotWord, selectInitialWord } from './botSelector'
import { getLastSyllable } from './phonetics'

import dictionaryRaw from '../../public/dictionary.json'
import graphRaw from '../../public/graph.json'

const dictionary = new Map<string, string>(Object.entries(dictionaryRaw))
const graph = graphRaw as Record<string, string[]>

describe('selectBotWord', () => {
  it('retourne un mot de graph["la"] pour lastSyllable="la"', () => {
    const word = selectBotWord('la', graph)
    expect(word).not.toBeNull()
    expect(graph['la']).toContain(word)
  })

  it('retourne null pour une syllabe inconnue', () => {
    const word = selectBotWord('syllabe_inconnue_xyz', graph)
    expect(word).toBeNull()
  })

  it('produit des résultats variés (Math.random)', () => {
    const results = new Set(Array.from({ length: 20 }, () => selectBotWord('la', graph)))
    expect(results.size).toBeGreaterThan(1)
  })

  it('aucun dead end — la dernière syllabe du mot retourné est une clé graph', () => {
    const words = Array.from({ length: 20 }, () => selectBotWord('la', graph))
    for (const word of words) {
      expect(word).not.toBeNull()
      const lastSyl = getLastSyllable(word!, dictionary, graph)
      expect(lastSyl).not.toBeNull()
      expect(graph[lastSyl!]).toBeDefined()
      expect(graph[lastSyl!].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('aucun dead end — syllabe alternative "pɛ̃" (couvre plusieurs syllabes)', () => {
    const words = Array.from({ length: 10 }, () => selectBotWord('pɛ̃', graph))
    for (const word of words) {
      expect(word).not.toBeNull()
      const lastSyl = getLastSyllable(word!, dictionary, graph)
      expect(lastSyl).not.toBeNull()
      expect(graph[lastSyl!]).toBeDefined()
      expect(graph[lastSyl!].length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('selectBotWord — filtres chain et previousWord', () => {
  it('ne retourne pas un mot déjà dans la chaîne', () => {
    const candidates = graph['la'] ?? []
    expect(candidates.length).toBeGreaterThan(1)
    // Remplir la chaîne avec tous les candidats sauf le dernier
    const allButOne = candidates.slice(0, -1)
    const lastOne = candidates[candidates.length - 1]
    const result = selectBotWord('la', graph, allButOne, '')
    expect(result).toBe(lastOne)
  })

  it('ne retourne pas un mot qui est une terminaison du mot précédent', () => {
    const candidates = graph['la'] ?? []
    expect(candidates.length).toBeGreaterThan(1)
    const target = candidates[0]
    const previousWord = 'prefixe' + target // previousWord.endsWith(target) = true
    const nonTargetCandidates = candidates.filter(c => !previousWord.toLowerCase().endsWith(c.toLowerCase()))
    // Seulement pertinent si d'autres candidats existent
    if (nonTargetCandidates.length === 0) return
    const results = new Set(Array.from({ length: 30 }, () =>
      selectBotWord('la', graph, [], previousWord)
    ))
    // target ne doit jamais apparaître dans les résultats
    expect(results.has(target)).toBe(false)
  })

  it('retourne null si tous les candidats sont dans la chaîne (dead-end)', () => {
    // Utiliser une syllabe avec peu de candidats pour limiter la taille de la chaîne
    const syl = 'pɛ̃'
    const candidates = graph[syl] ?? []
    expect(candidates.length).toBeGreaterThan(0)
    const result = selectBotWord(syl, graph, candidates, '')
    expect(result).toBeNull()
  })

  it('ne retourne pas un homophone d\'un mot déjà dans la chaîne (pluriel/féminin)', () => {
    // lattes et latte ont le même IPA — si latte est dans la chaîne, lattes doit être exclu
    const mockDict = new Map<string, string>([
      ['latte', 'lat'],
      ['lattes', 'lat'],
      ['lampe', 'lɑ̃p'],
    ])
    const mockGraph: Record<string, string[]> = { la: ['latte', 'lattes', 'lampe'] }
    // chain contient 'latte' → lattes doit être filtré (même IPA)
    const results = new Set(Array.from({ length: 30 }, () =>
      selectBotWord('la', mockGraph, ['latte'], '', mockDict)
    ))
    expect(results.has('lattes')).toBe(false)
    expect(results.has('latte')).toBe(false)  // déjà dans chain
    // lampe doit rester disponible
    expect(results.has('lampe')).toBe(true)
  })
})

describe('selectInitialWord', () => {
  it('retourne un mot présent dans dictionary', () => {
    const word = selectInitialWord(graph, dictionary)
    expect(dictionary.has(word)).toBe(true)
  })

  it('retourne un mot dont la dernière syllabe a ≥ 5 réponses', () => {
    const word = selectInitialWord(graph, dictionary)
    const lastSyl = getLastSyllable(word, dictionary, graph)
    expect(lastSyl).not.toBeNull()
    expect(graph[lastSyl!].length).toBeGreaterThanOrEqual(5)
  })

  it('produit des résultats variés (Math.random)', () => {
    const results = new Set(Array.from({ length: 30 }, () => selectInitialWord(graph, dictionary)))
    expect(results.size).toBeGreaterThan(1)
  })

  it('AC4 — produit au moins 5 mots distincts en 30 appels (variété STARTER_WORDS élargie)', () => {
    const results = new Set(Array.from({ length: 30 }, () => selectInitialWord(graph, dictionary)))
    expect(results.size).toBeGreaterThanOrEqual(5)
  })
})

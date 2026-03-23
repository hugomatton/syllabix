// src/engine/botSelector.test.ts
import { describe, it, expect } from 'vitest'
import { selectBotWord, selectInitialWord, getSuggestions } from './botSelector'
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

  it('ne retourne pas une inflexion triviale du mot précédent (suffix connu)', () => {
    // "tables" → bot ne doit pas jouer "table" (tables = table + s)
    const mockGraph: Record<string, string[]> = { la: ['table', 'lampe', 'latte'] }
    const results = new Set(Array.from({ length: 30 }, () =>
      selectBotWord('la', mockGraph, [], 'tables')
    ))
    expect(results.has('table')).toBe(false)
    expect(results.has('lampe')).toBe(true)
  })
  it('retourne un mot légitime même s\'il est terminaison orthographique du mot précédent', () => {
    // "acceptable" se termine par "table" mais "table" est un mot légitime, pas une inflexion
    const mockGraph: Record<string, string[]> = { la: ['table', 'lampe'] }
    const results = new Set(Array.from({ length: 30 }, () =>
      selectBotWord('la', mockGraph, [], 'acceptable')
    ))
    // "table" DOIT être possible car "acceptable" ≠ "table" + suffixe connu
    expect(results.has('table')).toBe(true)
  })

  it('retourne null si tous les candidats sont dans la chaîne (dead-end)', () => {
    const mockGraph: Record<string, string[]> = { la: ['latte', 'lampe'] }
    const result = selectBotWord('la', mockGraph, ['latte', 'lampe'], '')
    expect(result).toBeNull()
  })

  it('autorise les homophones de mots déjà dans la chaîne (cas 8)', () => {
    // lattes et latte ont le même IPA — homophones autorisés (filtre homophone supprimé)
    const mockGraph: Record<string, string[]> = { la: ['latte', 'lattes', 'lampe'] }
    // chain contient 'latte' → lattes est un homophone mais DOIT rester disponible
    const results = new Set(Array.from({ length: 30 }, () =>
      selectBotWord('la', mockGraph, ['latte'], '')
    ))
    expect(results.has('latte')).toBe(false)  // exact match in chain — still excluded
    expect(results.has('lattes')).toBe(true)   // homophone — now allowed
    expect(results.has('lampe')).toBe(true)
  })
})

describe('getSuggestions', () => {
  it('retourne au maximum count mots (défaut 5)', () => {
    const suggestions = getSuggestions('lapin', [], graph, dictionary)
    expect(suggestions.length).toBeLessThanOrEqual(5)
  })

  it('aucun mot retourné n\'est dans la chaîne fournie', () => {
    const chain = ['lapin', 'chien', 'canard']
    const suggestions = getSuggestions('lapin', chain, graph, dictionary)
    const chainSet = new Set(chain.map(w => w.toLowerCase()))
    for (const word of suggestions) {
      expect(chainSet.has(word.toLowerCase())).toBe(false)
    }
  })

  it('retourne [] pour une syllabe inconnue (currentWord absent du dictionnaire et du graph)', () => {
    const suggestions = getSuggestions('motxyzinconnu', [], graph, dictionary)
    expect(suggestions).toEqual([])
  })

  it('retourne [] si currentWord est une chaîne vide', () => {
    const suggestions = getSuggestions('', [], graph, dictionary)
    expect(suggestions).toEqual([])
  })

  it('aucun mot retourné n\'est dans la blacklist', () => {
    // 'voilà' a l'IPA 'vwala' → getLastSyllable trouvera la clé 'la' dans le mockGraph
    const mockGraph: Record<string, string[]> = { la: ['zzz', 'lapin', 'lampe'] }
    const mockDict = new Map<string, string>([
      ['voilà', 'vwala'],
      ['zzz', 'z'],
      ['lapin', 'lapɛ̃'],
      ['lampe', 'lɑ̃p'],
    ])
    const suggestions = getSuggestions('voilà', [], mockGraph, mockDict)
    // S'assurer que des candidats ont bien été trouvés (sinon le test est vacueux)
    expect(suggestions.length).toBeGreaterThan(0)
    for (const word of suggestions) {
      expect(word).not.toBe('zzz')
    }
  })

  it('produit des résultats variés entre deux appels (aléatoire)', () => {
    // On a besoin d'assez de candidats pour avoir de la variété
    const results1 = new Set(Array.from({ length: 20 }, () =>
      getSuggestions('lapin', [], graph, dictionary)
    ).map(arr => arr.join(',')))
    expect(results1.size).toBeGreaterThan(1)
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

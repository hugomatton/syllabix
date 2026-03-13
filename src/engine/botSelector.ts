// src/engine/botSelector.ts

import { getLastSyllable } from './phonetics'
import { BLACKLIST } from '../config'

/**
 * Mots français communs utilisés pour démarrer une partie.
 * `selectInitialWord` filtre automatiquement sur ≥ 5 réponses dans graph.json,
 * donc les mots absents du dictionnaire ou aux syllabes trop rares sont ignorés au runtime.
 */
export const STARTER_WORDS = [
  // existants
  'chocolat', 'lapin', 'maison', 'canard', 'poisson',
  'tambour', 'guitare', 'jardin', 'balcon', 'mouton',
  // ajouts
  'soleil', 'conseil', 'réveil', 'appareil',
  'fenêtre', 'montre', 'centre', 'titre',
  'cadeau', 'gâteau', 'chapeau', 'rideau', 'bateau', 'plateau', 'manteau', 'tableau',
  'chemin', 'raisin', 'cousin', 'dessin', 'bassin', 'sapin',
  'citron', 'patron', 'chanson', 'saison', 'raison', 'horizon',
  'départ', 'regard', 'hasard',
  'couloir', 'miroir', 'espoir',
  'minute', 'recette', 'vedette',
]

/**
 * Sélectionne un mot bot aléatoire pour une syllabe donnée.
 * Repose sur l'invariant graph.json : tous les mots dans graph[syl] ont
 * leur dernière syllabe comme clé graph avec ≥ 2 entrées (FR11, FR9).
 *
 * @param lastSyllable - dernière syllabe IPA du mot précédent (clé graph)
 * @param graph        - Record<syllabe, mots[]> pré-chargé depuis graph.json
 * @param chain        - mots déjà joués dans la partie (bot + joueur), pour exclure les doublons
 * @param previousWord - mot soumis par le joueur, pour exclure les terminaisons orthographiques
 * @param dictionary   - Map<mot, IPA> pour exclure les homophones de mots déjà joués (pluriels, féminins…)
 * @returns mot bot aléatoire, ou null si lastSyllable inconnue ou tous les candidats filtrés
 */
export function selectBotWord(
  lastSyllable: string,
  graph: Record<string, string[]>,
  chain: string[] = [],
  previousWord: string = '',
  dictionary: Map<string, string> = new Map(),
): string | null {
  const candidates = graph[lastSyllable]
  if (!candidates || candidates.length === 0) return null

  const chainSet = new Set(chain.map(w => w.toLowerCase()))
  const lowerPrev = previousWord.toLowerCase()

  // IPA de tous les mots déjà joués — exclure les candidats avec la même prononciation (pluriels, féminins…)
  const chainIPAs = new Set(
    chain.map(w => dictionary.get(w.toLowerCase())?.normalize('NFC')).filter(Boolean) as string[]
  )

  const filtered = candidates.filter(candidate => {
    const lowerCandidate = candidate.toLowerCase()
    // Exclure les doublons de chaîne (orthographe identique)
    if (chainSet.has(lowerCandidate)) return false
    // Exclure les terminaisons orthographiques du mot précédent
    if (lowerPrev && lowerPrev.endsWith(lowerCandidate)) return false
    // Exclure les homophones de mots déjà joués (même IPA NFC = même mot effectivement)
    const candidateIPA = dictionary.get(lowerCandidate)?.normalize('NFC')
    if (candidateIPA && chainIPAs.has(candidateIPA)) return false
    // Exclure les mots blacklistés
    if (BLACKLIST.has(lowerCandidate)) return false
    return true
  })

  if (filtered.length === 0) return null
  return filtered[Math.floor(Math.random() * filtered.length)]
}

/**
 * Retourne jusqu'à `count` mots candidats valides pour une fin de partie par timeout.
 * Filtre les mots déjà joués (chain) et la blacklist. Pas de filtre homophone :
 * objectif pédagogique — montrer toutes les formes possibles.
 *
 * @param currentWord  - dernier mot joué (on cherche ses continuations)
 * @param chain        - mots déjà joués dans la partie (exclus des suggestions)
 * @param graph        - Record<syllabe, mots[]> pré-chargé
 * @param dictionary   - Map<mot, IPA> pré-chargée (pour getLastSyllable)
 * @param count        - nombre max de suggestions (défaut 5)
 * @returns liste de mots suggérés ([] si aucun candidat ou syllabe inconnue)
 */
export function getSuggestions(
  currentWord: string,
  chain: string[],
  graph: Record<string, string[]>,
  dictionary: Map<string, string>,
  count = 5,
): string[] {
  if (!currentWord) return []

  const lastSyl = getLastSyllable(currentWord, dictionary, graph)
  if (!lastSyl || !graph[lastSyl]) return []

  const safeCount = Math.max(0, count)
  if (safeCount === 0) return []

  const chainSet = new Set(chain.map(w => w.toLowerCase()))

  const filtered = [...graph[lastSyl]].filter(candidate => {
    const lower = candidate.toLowerCase()
    if (chainSet.has(lower)) return false
    if (BLACKLIST.has(lower)) return false
    return true
  })

  // Fisher-Yates shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[filtered[i], filtered[j]] = [filtered[j], filtered[i]]
  }

  return filtered.slice(0, safeCount)
}

/**
 * Sélectionne le mot initial du bot pour démarrer une partie.
 * Choisit parmi STARTER_WORDS ceux dont la dernière syllabe a ≥ 5 réponses
 * dans graph.json, garantissant une bonne expérience de démarrage.
 *
 * @param graph      - Record<syllabe, mots[]> pré-chargé
 * @param dictionary - Map<mot, IPA> pré-chargée (pour getLastSyllable)
 * @returns mot initial français commun
 */
export function selectInitialWord(
  graph: Record<string, string[]>,
  dictionary: Map<string, string>,
): string {
  const validStarters = STARTER_WORDS.filter(word => {
    const lastSyl = getLastSyllable(word, dictionary, graph)
    return lastSyl !== null && (graph[lastSyl]?.length ?? 0) >= 5
  })

  const fallback = STARTER_WORDS.filter(w => dictionary.has(w))
  const pool = validStarters.length > 0 ? validStarters : (fallback.length > 0 ? fallback : STARTER_WORDS)
  return pool[Math.floor(Math.random() * pool.length)]
}

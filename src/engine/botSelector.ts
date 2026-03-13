// src/engine/botSelector.ts

import { getLastSyllable } from './phonetics'

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
 * @returns mot bot aléatoire, ou null si lastSyllable inconnue ou tous les candidats filtrés
 */
export function selectBotWord(
  lastSyllable: string,
  graph: Record<string, string[]>,
  chain: string[] = [],
  previousWord: string = '',
): string | null {
  const candidates = graph[lastSyllable]
  if (!candidates || candidates.length === 0) return null

  const chainSet = new Set(chain.map(w => w.toLowerCase()))
  const lowerPrev = previousWord.toLowerCase()

  const filtered = candidates.filter(candidate => {
    const lowerCandidate = candidate.toLowerCase()
    // Exclure les doublons de chaîne
    if (chainSet.has(lowerCandidate)) return false
    // Exclure les terminaisons orthographiques du mot précédent
    if (lowerPrev && lowerPrev.endsWith(lowerCandidate)) return false
    return true
  })

  if (filtered.length === 0) return null
  return filtered[Math.floor(Math.random() * filtered.length)]
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

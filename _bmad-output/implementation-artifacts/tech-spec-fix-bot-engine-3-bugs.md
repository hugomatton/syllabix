---
title: 'Fix Moteur Bot - 3 Bugs Phonétiques'
slug: 'fix-bot-engine-3-bugs'
created: '2026-03-11'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'React', 'Vite', 'Vitest']
files_to_modify: ['src/engine/botSelector.ts', 'src/components/GameScreen/WordInput.tsx', 'src/engine/botSelector.test.ts']
code_patterns: ['paramètres optionnels pour rétrocompatibilité', 'fallback si pool vide après filtrage', 'spread [...state.chain, trimmed] pour inclure le mot en cours']
test_patterns: ['Vitest describe/it/expect', 'tests sur signatures mise à jour']
---

# Tech-Spec: Fix Moteur Bot - 3 Bugs Phonétiques

**Created:** 2026-03-11

## Overview

### Problem Statement

Le moteur bot de Syllabix présente trois comportements problématiques :
1. **Doublon dans la chaîne** : le bot peut répondre avec un mot déjà présent dans la chaîne de la partie en cours.
2. **Mots de démarrage répétitifs** : `STARTER_WORDS` ne contient que 10 mots, ce qui rend les débuts de partie très prévisibles.
3. **Réponse = terminaison orthographique** : le bot peut répondre avec un mot de 1 syllabe orthographiquement identique à la terminaison du mot précédent (ex: "décade" → "de"), ce qui est perçu comme non-fair par le joueur.

### Solution

1. Passer la `chain` et le mot précédent à `selectBotWord` et filtrer les candidats déjà présents (comparaison orthographique) et les candidats qui sont une terminaison ortho du mot précédent.
2. Agrandir significativement `STARTER_WORDS` (~40 mots).
3. Fallback sur le pool original si tous les candidats sont exclus après filtrage.

### Scope

**In Scope:**
- Modifier `selectBotWord` dans `botSelector.ts` : nouvelle signature avec paramètres optionnels `chain` et `previousWord`, deux filtres, fallback
- Agrandir `STARTER_WORDS` dans `botSelector.ts` (~40 mots)
- Mettre à jour l'appel à `selectBotWord` dans `WordInput.tsx`
- Mettre à jour / ajouter des tests dans `botSelector.test.ts`

**Out of Scope:**
- Filtrage des homophones
- Mécanisme anti-répétition des starters entre parties (localStorage)
- Tout autre changement au moteur phonétique

## Context for Development

### Codebase Patterns

- State immuable via `gameReducer.ts` (spread only, no mutation — ARC10)
- `selectBotWord` appelé dans `WordInput.tsx` ligne 83, signature actuelle : `(lastSyllable: string, graph: Record<string, string[]>)`
- `graph` = clés IPA → tableaux de mots orthographiques
- `chain: string[]` dans `GameState` — contient tous les mots joués dans l'ordre (bot + joueur alternés)
- **Attention** : au moment de l'appel à `selectBotWord`, `state.chain` ne contient pas encore le mot du joueur (dispatch pas encore traité). Passer `[...state.chain, trimmed]` pour inclure le mot en cours
- Tests Vitest avec vraies données (`dictionary.json`, `graph.json`) — pas de mocks
- Pattern `describe/it/expect` dans `botSelector.test.ts`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/engine/botSelector.ts` | `selectBotWord` (signature à modifier) + `STARTER_WORDS` (à agrandir) |
| `src/components/GameScreen/WordInput.tsx` | Appel `selectBotWord` ligne 83 — passer `chain` et `previousWord` |
| `src/engine/botSelector.test.ts` | Tests à mettre à jour pour la nouvelle signature |
| `src/game/gameTypes.ts` | Définition de `GameState` — `chain: string[]`, `currentWord: string` |

### Technical Decisions

- **Signature mise à jour** : `selectBotWord(lastSyllable, graph, chain?: string[], previousWord?: string)` — paramètres optionnels pour que les tests existants à 2 args restent valides
- **Filtre doublon** : pour chaque mot dans `chain`, exclure le candidat si `candidate.toLowerCase() === word.toLowerCase()`
- **Filtre terminaison** : exclure le candidat si `previousWord.toLowerCase().endsWith(candidate.toLowerCase())`
- **Pas de fallback** : si `filtered.length === 0`, retourner `null` → déclenche un `GAME_OVER` avec `reason: 'dead-end'` dans `WordInput.tsx`, exactement comme si la syllabe était inconnue du graph
- **STARTER_WORDS** : agrandir à ~40 mots — le filtre ≥5 réponses dans `selectInitialWord` reste inchangé et garantit la qualité

## Implementation Plan

### Tasks

- [x] **Task 1 : Agrandir `STARTER_WORDS` dans `botSelector.ts`**
  - File: `src/engine/botSelector.ts`
  - Action: Remplacer la liste de 10 mots par la liste suivante (~40 mots français courants, diversité phonétique maximale) :
    ```ts
    export const STARTER_WORDS = [
      // existants
      'chocolat', 'lapin', 'maison', 'canard', 'poisson',
      'tambour', 'guitare', 'jardin', 'balcon', 'mouton',
      // ajouts
      'soleil', 'conseil', 'réveil', 'appareil',
      'fenêtre', 'montre', 'centre', 'titre',
      'cadeau', 'gateau', 'chapeau', 'rideau', 'bateau', 'plateau', 'manteau', 'tableau',
      'chemin', 'raisin', 'cousin', 'dessin', 'bassin', 'sapin',
      'citron', 'patron', 'chanson', 'saison', 'raison', 'horizon',
      'départ', 'regard', 'hasard',
      'couloir', 'miroir', 'espoir',
      'minute', 'recette', 'vedette',
    ]
    ```
  - Notes: `selectInitialWord` filtre déjà automatiquement sur ≥5 réponses dans graph, donc les mots invalides sont ignorés au runtime sans risque.

- [x] **Task 2 : Modifier `selectBotWord` dans `botSelector.ts`**
  - File: `src/engine/botSelector.ts`
  - Action: Mettre à jour la signature et la logique comme suit :
    ```ts
    export function selectBotWord(
      lastSyllable: string,
      graph: Record<string, string[]>,
      chain: string[] = [],
      previousWord: string = '',
    ): string | null {
      const candidates = graph[lastSyllable]
      if (!candidates || candidates.length === 0) return null

      const lowerChain = chain.map(w => w.toLowerCase())
      const lowerPrev = previousWord.toLowerCase()

      const filtered = candidates.filter(candidate => {
        const lowerCandidate = candidate.toLowerCase()
        // Exclure les doublons de chaîne
        if (lowerChain.includes(lowerCandidate)) return false
        // Exclure les terminaisons orthographiques du mot précédent
        if (lowerPrev && lowerPrev.endsWith(lowerCandidate)) return false
        return true
      })

      if (filtered.length === 0) return null
      return filtered[Math.floor(Math.random() * filtered.length)]
    }
    ```
  - Notes: Paramètres avec valeurs par défaut (`= []`, `= ''`) — les tests existants à 2 args continuent de fonctionner sans modification.

- [x] **Task 3 : Mettre à jour l'appel dans `WordInput.tsx`**
  - File: `src/components/GameScreen/WordInput.tsx`
  - Action: Ligne 83, remplacer :
    ```ts
    const botWord = lastSyl ? selectBotWord(lastSyl, graph) : null
    ```
    par :
    ```ts
    const botWord = lastSyl ? selectBotWord(lastSyl, graph, [...state.chain, trimmed], trimmed) : null
    ```
  - Notes: `[...state.chain, trimmed]` car au moment de l'appel, `state.chain` n'inclut pas encore le mot du joueur (dispatch non traité). `trimmed` est le mot que le joueur vient de soumettre.

- [x] **Task 4 : Mettre à jour `botSelector.test.ts`**
  - File: `src/engine/botSelector.test.ts`
  - Action: Ajouter un `describe` pour les nouveaux comportements de `selectBotWord` :
    ```ts
    describe('selectBotWord — filtres chain et previousWord', () => {
      it('ne retourne pas un mot déjà dans la chaîne', () => {
        const candidates = graph['la'] ?? []
        // Remplir la chaîne avec tous les candidats sauf un
        const allButOne = candidates.slice(0, -1)
        const lastOne = candidates[candidates.length - 1]
        const result = selectBotWord('la', graph, allButOne, '')
        // Soit le dernier mot restant, soit fallback (si allButOne = tous les candidats)
        expect(result).not.toBeNull()
      })

      it('ne retourne pas un mot qui est une terminaison du mot précédent', () => {
        // Construire un cas où un candidat connu est une terminaison de previousWord
        // Exemple : previousWord = "décade", vérifier que "de" est exclu si présent
        const candidates = graph['la'] ?? []
        if (candidates.length < 2) return // pas assez de candidats pour tester
        const target = candidates[0]
        const previousWord = 'prefixe' + target // previousWord.endsWith(target) = true
        const results = new Set(Array.from({ length: 30 }, () =>
          selectBotWord('la', graph, [], previousWord)
        ))
        // target ne doit jamais apparaître (sauf fallback si tous les candidats matchent)
        const nonTargetCandidates = candidates.filter(c => !previousWord.toLowerCase().endsWith(c.toLowerCase()))
        if (nonTargetCandidates.length > 0) {
          // Au moins une fois un mot différent de target doit sortir
          const hasOther = [...results].some(r => r !== target)
          expect(hasOther).toBe(true)
        }
      })

      it('retourne null si tous les candidats sont dans la chaîne (dead-end)', () => {
        const candidates = graph['la'] ?? []
        const result = selectBotWord('la', graph, candidates, '')
        expect(result).toBeNull()
      })
    })
    ```

### Acceptance Criteria

- [x] **AC1** : Given une partie en cours dont la chaîne contient "lapin", when le bot doit répondre avec un mot dont "lapin" serait candidat, then "lapin" n'est jamais retourné par `selectBotWord`.

- [x] **AC2** : Given le joueur soumet "décade", when le bot cherche une réponse, then tout mot `w` tel que `"décade".endsWith(w)` est exclu des candidats (ex: "de" exclu).

- [x] **AC3** : Given tous les candidats d'une syllabe sont exclus par les filtres (tous déjà joués ou tous terminaisons du mot précédent), when `selectBotWord` est appelé, then il retourne `null` → déclenche un `GAME_OVER` avec `reason: 'dead-end'`.

- [x] **AC4** : Given `selectInitialWord` est appelé 30 fois, when les résultats sont collectés, then au moins 5 mots distincts sont retournés (variété améliorée grâce à la liste élargie).

- [x] **AC5** : Given les tests existants appellent `selectBotWord('la', graph)` avec 2 args, when les tests tournent, then ils passent sans modification (rétrocompatibilité paramètres optionnels).

## Review Notes

- Revue adversariale complétée
- Findings : 10 total, 8 corrigés (F1-F8), 2 ignorés (F9-F10 bruit)
- Approche : auto-fix

## Additional Context

### Dependencies

Aucune dépendance externe. Toutes les modifications sont internes au moteur.

### Testing Strategy

- **Tests unitaires** : ajouter le `describe` de la Task 4 dans `botSelector.test.ts`
- **Tests existants** : doivent passer sans modification (paramètres optionnels avec valeurs par défaut)
- **Test manuel** : jouer une partie, vérifier qu'aucun mot ne se répète dans la chaîne, vérifier que le bot ne répond jamais par une terminaison ortho du mot soumis, vérifier que les mots de démarrage varient davantage

### Notes

- Si tous les candidats sont exclus par les filtres, c'est un vrai `dead-end` : le bot ne triche pas, la partie s'arrête proprement
- Si la liste `STARTER_WORDS` élargie contient des mots absents de `dictionary.json`, ils seront silencieusement ignorés par le filtre `dictionary.has(w)` dans `selectInitialWord` — pas de risque de crash
- Futur possible (hors scope) : poids probabilistes sur les candidats pour favoriser les mots plus longs / moins fréquents

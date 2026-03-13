---
title: 'Suggestions de mots en fin de partie (timeout)'
slug: 'suggestions-mots-timeout'
created: '2026-03-13'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 18', 'TypeScript', 'Vitest']
files_to_modify:
  - 'src/engine/botSelector.ts'
  - 'src/components/GameOver/GameOver.tsx'
  - 'src/components/GameOver/GameOver.module.css'
  - 'src/engine/botSelector.test.ts'
code_patterns:
  - 'useGameData() hook pour accéder à graph/dictionary via Context'
  - 'useState pour selectedWord → DefinitionPanel (pattern existant à réutiliser)'
  - 'useMemo pour calcul dérivé du state'
test_patterns:
  - 'Vitest — describe/it/expect'
  - 'graph.json + dictionary.json réels importés dans les tests'
---

# Tech-Spec: Suggestions de mots en fin de partie (timeout)

**Created:** 2026-03-13

## Overview

### Problem Statement

Quand le joueur perd par timeout (chrono épuisé), il n'a aucun retour pédagogique sur ce qu'il aurait pu jouer. Il ne peut pas progresser en vocabulaire ni comprendre ce qu'il a manqué.

### Solution

À l'écran GameOver, uniquement si `gameOverReason === 'timeout'`, afficher une section "Vous auriez pu jouer..." contenant 5 mots candidats valides (tirés du graph pour la dernière syllabe de `currentWord`, filtrés des mots déjà joués dans la chaîne). Ces mots sont cliquables pour afficher leur définition via le `DefinitionPanel` existant.

### Scope

**In Scope:**
- Fonction utilitaire `getSuggestions(currentWord, chain, graph, dictionary)` dans `botSelector.ts` retournant max 5 mots
- Affichage d'une section "Vous auriez pu jouer" dans `GameOver.tsx` uniquement si `gameOverReason === 'timeout'`
- Mots suggérés cliquables → ouvre `DefinitionPanel` (même mécanique que les mots de la chaîne)

**Out of Scope:**
- Suggestions sur dead-end (sans intérêt : aucun mot valide n'existe)
- Plus de 5 suggestions
- Suggestions pendant la partie

## Context for Development

### Codebase Patterns

- `GameData = { dictionary: Map<string,string>, graph: Record<string,string[]>, syllables: Map<string,string> }` — disponible via `useGameData()` (Context) depuis n'importe quel composant enfant de `<GameDataContext.Provider>`
- `App.tsx` rend `<GameOver state={state} dispatch={dispatch} />` sans passer `graph`/`dictionary` en props — il faut appeler `useGameData()` directement dans `GameOver.tsx` (pattern propre, pas de changement de signature)
- `GameOver.tsx` gère déjà `selectedWord: string | null` avec `useState` + `handleWordClick` → `DefinitionPanel`. Les mots suggérés réutilisent cette mécanique **telle quelle** (même `selectedWord`, même `handleWordClick`)
- `selectBotWord` dans `botSelector.ts` : filtre `chain` + `BLACKLIST` + homophones IPA. Pour `getSuggestions`, on applique uniquement filtre `chain` + `BLACKLIST` (pas de filtre homophone — objectif pédagogique : montrer toutes les formes possibles)
- Toutes les comparaisons de mots se font en `.toLowerCase()`
- CSS : `GameOver.module.css` utilise flexbox colonne, classes `.label`, `.chainSection` — pattern à suivre pour la nouvelle section

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/engine/botSelector.ts` | Ajouter `getSuggestions` (export) |
| `src/components/GameOver/GameOver.tsx` | Ajouter appel `useGameData()` + `useMemo` suggestions + section JSX |
| `src/components/GameOver/GameOver.module.css` | Ajouter `.suggestionsSection`, `.suggestionsList`, `.suggestionWord` |
| `src/engine/botSelector.test.ts` | Ajouter describe `getSuggestions` |
| `src/game/gameTypes.ts` | Lecture seule — `GameState.currentWord` et `gameOverReason` |
| `src/engine/dataLoader.ts` | Lecture seule — type `GameData` |

### Technical Decisions

- `getSuggestions` est une nouvelle fonction exportée dans `botSelector.ts` — signature : `getSuggestions(currentWord: string, chain: string[], graph: Record<string, string[]>, dictionary: Map<string, string>, count = 5): string[]`
- Tirage : shuffle aléatoire (Fisher-Yates) de tous les candidats valides, retourner les `count` premiers
- Filtre : exclure mots dans `chain` (`.toLowerCase()`) + mots dans `BLACKLIST`
- `getLastSyllable` est déjà importé dans `botSelector.ts` — l'utiliser pour trouver la syllabe de `currentWord`
- `useMemo` dans `GameOver.tsx` avec `[state.currentWord, state.chain, graph, dictionary]` comme dépendances
- `getSuggestions` retourne `[]` si `currentWord` est vide ou si la syllabe est absente du graph

## Implementation Plan

### Tasks

- [x] **Task 1 : Ajouter `getSuggestions` dans `src/engine/botSelector.ts`**
  - File: `src/engine/botSelector.ts`
  - Action: Ajouter la fonction exportée `getSuggestions` après `selectBotWord`. Elle:
    1. Appelle `getLastSyllable(currentWord, dictionary, graph)` → `lastSyl`
    2. Si `lastSyl` est `null` ou absent du graph, retourne `[]`
    3. Récupère `graph[lastSyl]` → `candidates`
    4. Filtre : exclure les mots dont `.toLowerCase()` est dans `new Set(chain.map(w => w.toLowerCase()))` et exclure les mots dans `BLACKLIST`
    5. Shuffle Fisher-Yates sur les candidats filtrés
    6. Retourne les `count` (défaut 5) premiers éléments
  - Notes: `getLastSyllable` et `BLACKLIST` sont déjà importés dans le fichier. Exporter `getSuggestions` depuis `src/engine/index.ts` si nécessaire.

- [x] **Task 2 : Mettre à jour `src/engine/index.ts` pour exporter `getSuggestions`**
  - File: `src/engine/index.ts`
  - Action: Vérifier si `botSelector.ts` est déjà ré-exporté. Si oui, `getSuggestions` sera auto-exporté. Sinon, ajouter l'export nommé.
  - Notes: Vérifier le contenu actuel de `src/engine/index.ts`.

- [x] **Task 3 : Modifier `src/components/GameOver/GameOver.tsx`**
  - File: `src/components/GameOver/GameOver.tsx`
  - Action:
    1. Ajouter import `useMemo` depuis `react`
    2. Ajouter import `useGameData` depuis `'../../hooks'`
    3. Ajouter import `getSuggestions` depuis `'../../engine'`
    4. Dans le corps du composant, ajouter : `const { graph, dictionary } = useGameData()`
    5. Ajouter : `const suggestions = useMemo(() => state.gameOverReason === 'timeout' ? getSuggestions(state.currentWord, state.chain, graph, dictionary) : [], [state.currentWord, state.chain, state.gameOverReason, graph, dictionary])`
    6. Ajouter la section JSX après `chainSection` et avant le bouton Rejouer :
       ```tsx
       {state.gameOverReason === 'timeout' && suggestions.length > 0 && (
         <div className={styles.suggestionsSection}>
           <p className={styles.label}>Vous auriez pu jouer</p>
           <ul className={styles.suggestionsList}>
             {suggestions.map(word => (
               <li key={word}>
                 <button
                   type="button"
                   className={styles.suggestionWord}
                   onClick={() => handleWordClick(word)}
                 >
                   {word}
                 </button>
               </li>
             ))}
           </ul>
         </div>
       )}
       ```
  - Notes: `handleWordClick` et `selectedWord` existants gèrent déjà le toggle du `DefinitionPanel` — aucun ajout d'état nécessaire.

- [x] **Task 4 : Ajouter les styles dans `src/components/GameOver/GameOver.module.css`**
  - File: `src/components/GameOver/GameOver.module.css`
  - Action: Ajouter à la fin du fichier :
    ```css
    .suggestionsSection {
      width: 100%;
      max-width: 560px;
    }

    .suggestionsList {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      list-style: none;
      padding: 0;
      margin: 8px 0 0 0;
    }

    .suggestionWord {
      background: none;
      border: 1px solid var(--color-muted);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.95rem;
      font-family: var(--font-family);
      color: var(--color-text);
      cursor: pointer;
      transition: border-color 150ms ease, color 150ms ease;
    }

    .suggestionWord:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }

    .suggestionWord:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
    ```
  - Notes: Utilise les design tokens existants (`--color-muted`, `--color-accent`, `--color-text`, `--font-family`).

- [x] **Task 5 : Ajouter les tests dans `src/engine/botSelector.test.ts`**
  - File: `src/engine/botSelector.test.ts`
  - Action: Ajouter un nouveau `describe('getSuggestions', ...)` à la fin du fichier :
    1. Importer `getSuggestions` depuis `'./botSelector'`
    2. Test : retourne au maximum `count` mots (défaut 5)
    3. Test : aucun mot retourné n'est dans la chaîne fournie
    4. Test : retourne `[]` pour une syllabe inconnue (currentWord absent du dictionnaire et du graph)
    5. Test : retourne `[]` si `currentWord` est une chaîne vide
    6. Test : aucun mot retourné n'est dans la blacklist
    7. Test : produit des résultats variés entre deux appels (aléatoire)

### Acceptance Criteria

- [x] **AC1** : Given une partie terminée par timeout, when l'écran GameOver s'affiche, then une section "Vous auriez pu jouer" est visible avec 1 à 5 mots.

- [x] **AC2** : Given la section suggestions affichée, when le joueur clique sur un mot suggéré, then le `DefinitionPanel` s'ouvre pour ce mot (même comportement que les mots de la chaîne).

- [x] **AC3** : Given une partie terminée par dead-end, when l'écran GameOver s'affiche, then aucune section suggestions n'est affichée.

- [x] **AC4** : Given une chaîne de jeu contenant certains candidats valides pour la syllabe de `currentWord`, when `getSuggestions` est appelé, then aucun mot de la chaîne n'apparaît dans les suggestions.

- [x] **AC5** : Given `getSuggestions` appelé avec un `currentWord` dont la dernière syllabe est absente du graph, when la fonction s'exécute, then elle retourne `[]` sans erreur.

- [x] **AC6** : Given `getSuggestions` appelé avec `currentWord` vide (`""`), when la fonction s'exécute, then elle retourne `[]` sans erreur.

## Additional Context

### Dependencies

- `graph.json` et `dictionary.json` déjà chargés en mémoire via `useGameData` — aucune dépendance externe à ajouter
- `DefinitionPanel` déjà fonctionnel et utilisé dans `GameOver.tsx` — aucune modification nécessaire
- `getLastSyllable` et `BLACKLIST` déjà disponibles dans `botSelector.ts`

### Testing Strategy

- **Tests unitaires** (`botSelector.test.ts`) : couvrent `getSuggestions` en isolation avec les vrais fichiers `graph.json` et `dictionary.json` (pattern établi dans le projet)
- **Test manuel** : lancer une partie en difficulté facile (chrono long), laisser expirer le chrono, vérifier que la section apparaît avec des mots valides non joués, cliquer sur un mot pour vérifier le `DefinitionPanel`
- **Vérification dead-end** : terminer une partie via dead-end (difficile à provoquer manuellement — vérifier visuellement que la section n'apparaît pas)

### Notes

- **Risque** : `getLastSyllable` peut retourner `null` si `currentWord` est vide ou non trouvé — `getSuggestions` doit gérer ce cas (`if (!lastSyl) return []`)
- **Limite connue** : les suggestions sont aléatoires à chaque affichage — si le joueur recharge, il verra potentiellement d'autres mots (acceptable, voire enrichissant)
- **Future consideration (hors scope)** : afficher la syllabe cible à côté du titre de section pour aider le joueur à comprendre le pattern phonétique

## Review Notes

- Adversarial review complétée
- Findings : 11 total, 7 corrigés (F1, F2, F3, F5, F7, F8, F10), 4 ignorés (noise : F4, F6, F9, F11)
- Approche : auto-fix

# Story 3.2 : GameState Architecture — useReducer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux un état de jeu centralisé géré via useReducer,
Afin que toute la logique de jeu passe par une machine à états unique et prévisible. (ARC3)

## Acceptance Criteria

**AC1 — `src/game/gameTypes.ts` exporte les types fondamentaux**
- **Given** `src/game/gameTypes.ts` existe
- **When** je l'inspecte
- **Then** il exporte `GamePhase = 'idle' | 'playing' | 'game-over'`
- **And** `GameState` avec : `phase`, `difficulty`, `chain`, `currentWord`, `score`, `sessionRecord`, `timeLeft`, `lastError`
- **And** `GameAction` couvre toutes les actions : `START_GAME`, `SUBMIT_WORD`, `BOT_RESPOND`, `TICK_TIMER`, `GAME_OVER`, `RESTART`

**AC2 — `src/game/gameReducer.ts` implémente les transitions d'état**
- **Given** `src/game/gameReducer.ts` existe
- **When** chaque action est dispatchée
- **Then** le state est mis à jour de façon immutable — spread operator, jamais de mutation directe (ARC10)
- **And** `SUBMIT_WORD` met à jour `chain` + `score` ou `lastError` selon validation
- **And** `GAME_OVER` passe la phase en `'game-over'` avec `reason: 'timeout' | 'dead-end'`
- **And** `RESTART` réinitialise tous les champs sauf `sessionRecord`

**AC3 — `src/hooks/useGameState.ts` encapsule le useReducer**
- **Given** `src/hooks/useGameState.ts` existe
- **When** un composant utilise le hook
- **Then** il reçoit `{ state, dispatch }` avec accès typé
- **And** `localStorage.getItem('syllabix-record')` est lu une seule fois à l'initialisation (ARC12)

**AC4 — `src/game/gameReducer.test.ts` couvre toutes les transitions**
- **Given** `src/game/gameReducer.test.ts` existe
- **When** j'exécute `npm run test`
- **Then** toutes les transitions d'état sont couvertes et passent

## Tasks / Subtasks

- [x] **T1 — Créer `src/game/gameTypes.ts`** (AC: 1)
  - [x] T1.1 — Définir et exporter `GamePhase = 'idle' | 'playing' | 'game-over'`
  - [x] T1.2 — Définir et exporter `Difficulty = 'easy' | 'medium' | 'hard'`
  - [x] T1.3 — Définir et exporter l'interface `GameState` complète
  - [x] T1.4 — Définir et exporter le type union `GameAction` avec tous les discriminants

- [x] **T2 — Créer `src/game/gameReducer.ts`** (AC: 2)
  - [x] T2.1 — Implémenter `initialState` avec lecture localStorage pour `sessionRecord`
  - [x] T2.2 — Implémenter le case `START_GAME` (phase → 'playing', reset chain/score/lastError, set difficulty/currentWord/timeLeft)
  - [x] T2.3 — Implémenter le case `SUBMIT_WORD` (validation externe, màj chain+score ou lastError)
  - [x] T2.4 — Implémenter le case `BOT_RESPOND` (màj currentWord)
  - [x] T2.5 — Implémenter le case `TICK_TIMER` (décrément timeLeft)
  - [x] T2.6 — Implémenter le case `GAME_OVER` (phase → 'game-over', set reason)
  - [x] T2.7 — Implémenter le case `RESTART` (réinitialisation totale sauf sessionRecord)
  - [x] T2.8 — Vérifier que TOUTES les mutations utilisent le spread operator

- [x] **T3 — Créer `src/hooks/useGameState.ts`** (AC: 3)
  - [x] T3.1 — Wraper `useReducer(gameReducer, initialState)`
  - [x] T3.2 — Retourner `{ state, dispatch }` typé

- [x] **T4 — Mettre à jour `src/game/index.ts`** (AC: 1, 2)
  - [x] T4.1 — Exporter tous les types depuis `gameTypes.ts`
  - [x] T4.2 — Exporter `gameReducer` et `initialState` depuis `gameReducer.ts`

- [x] **T5 — Mettre à jour `src/hooks/index.ts`** (AC: 3)
  - [x] T5.1 — Exporter `useGameState` depuis `useGameState.ts`

- [x] **T6 — Créer `src/game/gameReducer.test.ts`** (AC: 4)
  - [x] T6.1 — Test initial state (phase 'idle', score 0, etc.)
  - [x] T6.2 — Test `START_GAME` → phase 'playing', correct difficulty/timeLeft
  - [x] T6.3 — Test `SUBMIT_WORD` valide → chain+1, score+1, lastError null
  - [x] T6.4 — Test `SUBMIT_WORD` invalide → lastError non null, chain inchangée
  - [x] T6.5 — Test `BOT_RESPOND` → currentWord mis à jour
  - [x] T6.6 — Test `TICK_TIMER` → timeLeft décrémenté
  - [x] T6.7 — Test `GAME_OVER` timeout → phase 'game-over', reason 'timeout'
  - [x] T6.8 — Test `GAME_OVER` dead-end → phase 'game-over', reason 'dead-end'
  - [x] T6.9 — Test `RESTART` → chain vide, score 0, phase 'idle', sessionRecord préservé
  - [x] T6.10 — Test immutabilité : vérifier que le state original n'est pas muté

## Dev Notes

### Contexte Critique

La Story 3.2 est le **cœur de l'architecture de jeu**. Toutes les stories suivantes (3.3 à 3.6, puis 4.x, 5.x) dépendront de cette machine à états. Une erreur ici se propagera à toute l'application. **Prendre le temps de bien faire les types et le reducer avant de passer à l'UI.**

**Ce que la story crée :**
- `src/game/gameTypes.ts` — types TypeScript fondamentaux
- `src/game/gameReducer.ts` — reducer pur + état initial
- `src/game/gameReducer.test.ts` — suite de tests complète
- `src/hooks/useGameState.ts` — hook React encapsulant le reducer

**Ce que la story ne touche PAS :**
- `src/engine/` — déjà implémenté avec 91 tests passants — NE PAS MODIFIER
- `src/styles/globals.css` — déjà complet (Story 3.1 done)
- `src/config/constants.ts` — déjà stable — NE PAS MODIFIER
- `src/hooks/useGameData.ts` — déjà implémenté — NE PAS MODIFIER
- Aucun composant React n'est créé dans cette story

### État Actuel du Projet

```
src/
├── config/
│   ├── constants.ts        ✅ STABLE — TIMER_EASY=15, TIMER_MEDIUM=10, TIMER_HARD=6, PHONETIC_TOLERANCE=2
│   └── index.ts            ✅ STABLE
├── engine/
│   ├── phonetics.ts        ✅ STABLE (91 tests passants)
│   ├── phonetics.test.ts   ✅ STABLE
│   ├── botSelector.ts      ✅ STABLE
│   ├── botSelector.test.ts ✅ STABLE
│   ├── dataLoader.ts       ✅ STABLE
│   └── index.ts            ✅ STABLE (exporte GameData type)
├── game/
│   └── index.ts            🔲 VIDE (export {}) — À REMPLIR
├── hooks/
│   ├── useGameData.ts      ✅ STABLE — hook pour données JSON (Map + Record)
│   └── index.ts            🔲 À METTRE À JOUR
├── styles/
│   └── globals.css         ✅ COMPLET (Story 3.1 done)
└── main.tsx                ✅ STABLE
```

**`src/hooks/useGameData.ts` déjà existant** — ne pas confondre avec `useGameState.ts` à créer :
- `useGameData` → accès au contexte des données JSON (dictionary Map + graph Record)
- `useGameState` → à créer → accès au state de jeu via useReducer

### Implémentation Complète Attendue

#### `src/game/gameTypes.ts`

```typescript
// src/game/gameTypes.ts
// ARC3 : State management via useReducer centralisé

export type GamePhase = 'idle' | 'playing' | 'game-over'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameState {
  phase: GamePhase
  difficulty: Difficulty
  chain: string[]           // mots joués dans l'ordre (alternance bot/joueur)
  currentWord: string       // mot actuellement affiché (proposé par le bot)
  score: number             // nombre de mots validés par le joueur
  sessionRecord: number     // meilleur score de la session (lu depuis localStorage)
  timeLeft: number          // temps restant en millisecondes
  lastError: string | null  // message d'erreur actuel (null = pas d'erreur)
}

export type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty; firstWord: string }
  | { type: 'SUBMIT_WORD'; word: string; isValid: boolean; error?: string }
  | { type: 'BOT_RESPOND'; word: string }
  | { type: 'TICK_TIMER'; elapsed: number }
  | { type: 'GAME_OVER'; reason: 'timeout' | 'dead-end'; deadSyllable?: string }
  | { type: 'RESTART' }
```

#### `src/game/gameReducer.ts`

```typescript
// src/game/gameReducer.ts
// ARC10 : State immutable — spread operator uniquement, jamais de mutation directe
// ARC12 : localStorage clé 'syllabix-record' — lecture une seule fois à l'init

import { TIMER_EASY } from '../config'
import type { GameState, GameAction, Difficulty } from './gameTypes'

function getTimerDuration(difficulty: Difficulty): number {
  // Durées en millisecondes (TIMER_* dans constants.ts sont en secondes)
  const { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD } = await import('../config')
  // Note: utiliser import statique plutôt que dynamique — voir note ci-dessous
}

// Import statique recommandé :
import { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD } from '../config'

function getTimerMs(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':   return TIMER_EASY   * 1000
    case 'medium': return TIMER_MEDIUM * 1000
    case 'hard':   return TIMER_HARD   * 1000
  }
}

export const initialState: GameState = {
  phase: 'idle',
  difficulty: 'medium',
  chain: [],
  currentWord: '',
  score: 0,
  sessionRecord: Number(localStorage.getItem('syllabix-record') ?? 0),
  timeLeft: TIMER_MEDIUM * 1000,
  lastError: null,
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        phase: 'playing',
        difficulty: action.difficulty,
        chain: [action.firstWord],
        currentWord: action.firstWord,
        score: 0,
        lastError: null,
        timeLeft: getTimerMs(action.difficulty),
      }

    case 'SUBMIT_WORD':
      if (!action.isValid) {
        return {
          ...state,
          lastError: action.error ?? 'Mot invalide',
        }
      }
      return {
        ...state,
        chain: [...state.chain, action.word],
        score: state.score + 1,
        lastError: null,
      }

    case 'BOT_RESPOND':
      return {
        ...state,
        chain: [...state.chain, action.word],
        currentWord: action.word,
        timeLeft: getTimerMs(state.difficulty), // reset timer après réponse bot
      }

    case 'TICK_TIMER':
      return {
        ...state,
        timeLeft: Math.max(0, state.timeLeft - action.elapsed),
      }

    case 'GAME_OVER': {
      const newRecord = Math.max(state.sessionRecord, state.score)
      if (newRecord > state.sessionRecord) {
        localStorage.setItem('syllabix-record', String(newRecord))
      }
      return {
        ...state,
        phase: 'game-over',
        sessionRecord: newRecord,
      }
    }

    case 'RESTART':
      return {
        ...initialState,
        sessionRecord: state.sessionRecord, // préserver le record de session (ARC12)
      }

    default:
      return state
  }
}
```

> ⚠️ **Note implémentation** : Le code ci-dessus contient un import dynamique erroné (exemple pédagogique). Utiliser **uniquement des imports statiques** en haut du fichier pour `TIMER_EASY`, `TIMER_MEDIUM`, `TIMER_HARD`. La fonction `getTimerMs` correcte :
> ```typescript
> import { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD } from '../config'
>
> function getTimerMs(difficulty: Difficulty): number {
>   switch (difficulty) {
>     case 'easy':   return TIMER_EASY   * 1000
>     case 'medium': return TIMER_MEDIUM * 1000
>     case 'hard':   return TIMER_HARD   * 1000
>   }
> }
> ```

#### `src/hooks/useGameState.ts`

```typescript
// src/hooks/useGameState.ts
import { useReducer } from 'react'
import { gameReducer, initialState } from '../game'
import type { GameState, GameAction } from '../game'

export function useGameState(): { state: GameState; dispatch: React.Dispatch<GameAction> } {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  return { state, dispatch }
}
```

#### `src/game/index.ts` (barrel file)

```typescript
// src/game/index.ts
export type { GamePhase, Difficulty, GameState, GameAction } from './gameTypes'
export { gameReducer, initialState } from './gameReducer'
```

#### `src/hooks/index.ts` (mise à jour)

```typescript
// src/hooks/index.ts
export { useGameData } from './useGameData'
export { useGameState } from './useGameState'
```

### Règles Architecturales Critiques à Respecter

**ARC10 — Immutabilité absolue :**
```typescript
// ✅ Correct
case 'SUBMIT_WORD':
  return { ...state, chain: [...state.chain, action.word], score: state.score + 1 }

// ❌ INTERDIT — mutation directe
state.chain.push(action.word)
return state
```

**ARC12 — localStorage :**
- `localStorage.getItem('syllabix-record')` → lu UNE SEULE FOIS dans `initialState`
- `localStorage.setItem('syllabix-record', ...)` → écrit UNIQUEMENT dans le case `GAME_OVER` (quand nouveau record)

**ARC3 — useReducer, pas useState :**
- Toute la logique de jeu passe par le reducer
- Aucun `useState` pour des données de jeu dans les composants

**ARC9 — Barrel files obligatoires :**
- `src/game/index.ts` doit exporter TOUT ce qui est public
- `src/hooks/index.ts` doit inclure le nouveau hook

**Naming conventions :**
- `GamePhase`, `GameState`, `GameAction`, `Difficulty` → PascalCase (types)
- `START_GAME`, `SUBMIT_WORD`, `GAME_OVER` etc. → SCREAMING_SNAKE_CASE (actions)
- `gameReducer`, `initialState`, `useGameState` → camelCase (fonctions)

### Design du Type GameAction — Choix Discriminant

**Le discriminant `type` est la clé** — chaque action doit avoir un `type` unique et littéral :
```typescript
// ✅ Correct — discriminant union type
type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty; firstWord: string }
  | { type: 'GAME_OVER'; reason: 'timeout' | 'dead-end'; deadSyllable?: string }
  // ...

// ❌ Éviter — enum Action (plus verbeux, moins idiomatique en React moderne)
```

**Propriété `firstWord` dans `START_GAME` :** le mot initial est sélectionné par `selectInitialWord()` depuis `src/engine/botSelector` avant le dispatch. Le reducer reçoit le mot déjà choisi — il ne fait pas de sélection lui-même. C'est crucial pour l'isolation des responsabilités.

**Propriété `elapsed` dans `TICK_TIMER` :** le temps écoulé depuis le dernier frame (en ms via `performance.now()`). Pas un timestamp absolu, mais un delta. Cela permet au reducer de rester pur (pas d'appel à `Date.now()` ou `performance.now()` dans le reducer).

### Intelligence Héritée de la Story 3.1

| Leçon Story 3.1 | Application Story 3.2 |
|---|---|
| `src/hooks/useGameData.ts` déjà existant | Ne pas le modifier — créer `useGameState.ts` séparément |
| `src/game/index.ts` actuellement `export {}` | À remplacer par les exports réels |
| Import CSS dans main.tsx déjà fait | Sans impact sur cette story |
| 91 tests Vitest passants dans `src/engine/` | Vérifier après implémentation que les tests passent toujours |
| Pattern d'export via barrel file bien établi | Appliquer le même pattern pour `src/game/` et `src/hooks/` |

**État actuel de `src/game/index.ts` :**
```typescript
export {}
```
→ Remplacer entièrement par les exports corrects.

**État actuel de `src/hooks/index.ts` :** inconnu — vérifier s'il exporte déjà `useGameData` avant d'ajouter `useGameState`.

### Project Structure Notes

#### Alignement avec l'architecture définie

```
src/
├── game/
│   ├── gameTypes.ts        ← CRÉER ICI (types fondamentaux)
│   ├── gameReducer.ts      ← CRÉER ICI (reducer + initialState)
│   ├── gameReducer.test.ts ← CRÉER ICI (tests co-localisés — ARC6)
│   └── index.ts            ← MODIFIER (barrel file)
└── hooks/
    ├── useGameData.ts      ← NE PAS TOUCHER (déjà implémenté)
    ├── useGameState.ts     ← CRÉER ICI (hook React)
    └── index.ts            ← MODIFIER (ajouter useGameState)
```

[Source: architecture.md#Structure Complète du Projet — `src/game/gameReducer.ts`, `src/game/gameTypes.ts`, `src/hooks/useGameState.ts` documentés]

#### Dépendances inter-stories

- **Cette story dépend de :** `src/config/constants.ts` (TIMER_*) — déjà stable
- **Cette story fournit à Story 3.3 :** la structure `GameState.timeLeft` que le timer mettra à jour
- **Cette story fournit à Stories 3.4–3.6 :** `useGameState` hook + toutes les actions du reducer
- **Cette story fournit à Story 4.1 :** `sessionRecord` dans le GameState, gestion localStorage dans reducer
- **Cette story NE DOIT PAS** créer de composants React — uniquement de la logique pure

#### Conflits Potentiels

1. **`START_GAME` vs sélection du mot initial** : le mot initial est sélectionné par `selectInitialWord()` dans le composant (Story 3.4), pas dans le reducer. Le payload `firstWord` dans `START_GAME` doit être fourni par l'appelant.

2. **Timer reset dans `BOT_RESPOND`** : la spec Story 3.2 dit que le reducer doit inclure le reset du timer après réponse bot. Dans `BOT_RESPOND`, `timeLeft` est remis à `getTimerMs(state.difficulty)`. Cela implique que Story 3.3 (timer hook) devra appeler `TICK_TIMER` en continu mais se comporter correctement quand `BOT_RESPOND` remet `timeLeft` à sa valeur max.

3. **`sessionRecord` à l'initialisation** : `localStorage.getItem('syllabix-record')` retourne `null` si absent. L'expression `Number(localStorage.getItem('syllabix-record') ?? 0)` retourne `0` dans ce cas — comportement correct.

4. **`useGameData` vs `useGameState`** : deux hooks différents avec des responsabilités séparées. `useGameData` = données statiques JSON. `useGameState` = état dynamique du jeu. Ne pas fusionner.

### References

- [Source: epics.md#Story 3.2] — User story complète, Acceptance Criteria (ARC3, ARC10, ARC12)
- [Source: architecture.md#Architecture Frontend — State Management] — Type GameState complet, pattern useReducer
- [Source: architecture.md#Patterns de State] — Règles d'immutabilité + localStorage
- [Source: architecture.md#Patterns de State — localStorage] — Lecture à l'init, écriture via UPDATE_RECORD
- [Source: architecture.md#Naming Patterns] — PascalCase types, SCREAMING_SNAKE_CASE actions, camelCase fonctions
- [Source: architecture.md#Structure Complète du Projet] — Localisation des fichiers game/ et hooks/
- [Source: architecture.md#Flux de Données] — Tour de jeu InputField → dispatch → reducer
- [Source: architecture.md#Frontières Architecturales] — `src/game/` zéro UI, exposé via barrel file
- [Source: epics.md#Additional Requirements] — ARC3 (useReducer), ARC10 (immutabilité), ARC12 (localStorage clé)
- [Source: 3-1-css-globals-design-tokens.md#Dev Notes] — Intelligence héritée Story 3.1

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage rencontré.

### Completion Notes List

- Tous les fichiers créés conformément aux Dev Notes (implémentation exacte spécifiée)
- `src/game/gameTypes.ts` : types fondamentaux (GamePhase, Difficulty, GameState, GameAction)
- `src/game/gameReducer.ts` : reducer pur + initialState (ARC10 immutabilité, ARC12 localStorage)
- `src/hooks/useGameState.ts` : hook React encapsulant useReducer
- `src/game/gameReducer.test.ts` : 18 tests couvrant toutes les transitions + immutabilité
- `src/game/index.ts` + `src/hooks/index.ts` : barrel files mis à jour
- 109 tests passants au total (0 régressions sur les 91 tests engine existants)

### File List

- src/game/gameTypes.ts (créé)
- src/game/gameReducer.ts (créé)
- src/game/gameReducer.test.ts (créé)
- src/game/index.ts (modifié)
- src/hooks/useGameState.ts (créé)
- src/hooks/index.ts (modifié)

## Change Log

- 2026-03-09 : Implémentation complète de la Story 3.2 — GameState Architecture useReducer. Création de gameTypes.ts, gameReducer.ts, useGameState.ts, gameReducer.test.ts. Mise à jour des barrel files game/index.ts et hooks/index.ts. 18 tests ajoutés, 109 tests au total passants.
- 2026-03-09 : Code review — 6 issues corrigées (2 HIGH, 4 MEDIUM) : ajout de `gameOverReason`/`deadSyllable` dans `GameState` et stockage dans `GAME_OVER`; export de `createInitialState()` pour initialisation lazy dans `useGameState` (+ correctif L2 `React.Dispatch` → `Dispatch`); gardes de phase dans `SUBMIT_WORD`/`BOT_RESPOND`/`TICK_TIMER`; `RESTART` migré vers `createInitialState()`; 9 tests ajoutés (immutabilité complète, guards, localStorage, score=record). 118 tests passants.

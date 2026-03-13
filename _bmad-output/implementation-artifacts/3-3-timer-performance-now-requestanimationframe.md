# Story 3.3 : Timer — performance.now() + requestAnimationFrame

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux un timer précis qui rythme la pression de jeu,
Afin que la contrainte de temps soit équitable et cohérente. (FR19, FR20, FR21)

## Acceptance Criteria

**AC1 — `src/game/timer.ts` implémente la boucle rAF**
- **Given** `src/game/timer.ts` existe et exporte `createTimer(onTick, onExpire, durationMs)`
- **When** le timer démarre
- **Then** il utilise `performance.now()` pour le calcul du temps écoulé (NFR3, ARC4)
- **And** `requestAnimationFrame` est utilisé pour la boucle de tick — jamais `setInterval`
- **And** `onTick(timeLeft: number)` est appelé chaque frame avec le temps restant en ms
- **And** `onExpire()` est appelé une seule fois quand `timeLeft` atteint 0

**AC2 — `src/hooks/useTimer.ts` enveloppe le timer pour React**
- **Given** `src/hooks/useTimer.ts` existe et exporte `useTimer`
- **When** le hook est utilisé dans un composant
- **Then** le timer démarre automatiquement et se nettoie (cancel rAF) au démontage
- **And** la précision est dans ±100ms (NFR3)

**AC3 — Durées correctes par difficulté**
- **Given** la difficulté est Easy / Medium / Hard
- **When** la partie démarre
- **Then** la durée est 15000ms / 10000ms / 6000ms respectivement (FR18)
- **And** le timer se remet à la durée complète après chaque soumission réussie (FR19)

**AC4 — Intégration avec GameState via dispatch**
- **Given** `useTimer` est actif pendant la phase 'playing'
- **When** chaque frame rAF s'exécute
- **Then** `dispatch({ type: 'TICK_TIMER', elapsed })` est appelé avec le delta en ms
- **And** quand `state.timeLeft <= 0`, `dispatch({ type: 'GAME_OVER', reason: 'timeout' })` est déclenché une seule fois (FR20)
- **And** quand `state.phase !== 'playing'`, la boucle rAF est annulée

**AC5 — Tests unitaires pour `timer.ts`**
- **Given** `src/game/timer.test.ts` existe
- **When** j'exécute `npm run test`
- **Then** les tests passent sans régression sur les 118 tests existants

## Tasks / Subtasks

- [x] **T1 — Créer `src/game/timer.ts`** (AC: 1)
  - [x] T1.1 — Définir l'interface `TimerHandle { start(): void; cancel(): void }`
  - [x] T1.2 — Implémenter `createTimer(onTick, onExpire, durationMs)` retournant `TimerHandle`
  - [x] T1.3 — Utiliser `performance.now()` pour calculer `elapsed` entre chaque frame
  - [x] T1.4 — Accumuler `totalElapsed` et appeler `onTick(Math.max(0, durationMs - totalElapsed))`
  - [x] T1.5 — Appeler `onExpire()` une seule fois quand `totalElapsed >= durationMs`, puis stopper
  - [x] T1.6 — `cancel()` doit appeler `cancelAnimationFrame` sur l'ID courant

- [x] **T2 — Mettre à jour `src/game/index.ts`** (AC: 1)
  - [x] T2.1 — Exporter `createTimer` et `TimerHandle` depuis `timer.ts`

- [x] **T3 — Créer `src/hooks/useTimer.ts`** (AC: 2, 3, 4)
  - [x] T3.1 — Accepter `dispatch: React.Dispatch<GameAction>` et `state: GameState` en paramètres
  - [x] T3.2 — Créer un `useEffect` déclenché par `[state.phase, state.currentWord]`
  - [x] T3.3 — Si `state.phase !== 'playing'`, annuler le timer et retourner
  - [x] T3.4 — Créer un timer via `createTimer` avec `state.timeLeft` comme `durationMs`
  - [x] T3.5 — Dans `onTick(timeLeft)`: calculer `elapsed = prevTimeLeftRef.current - timeLeft`, mettre à jour `prevTimeLeftRef`, dispatcher `TICK_TIMER`
  - [x] T3.6 — Dans `onExpire()`: dispatcher `GAME_OVER` avec `reason: 'timeout'`
  - [x] T3.7 — Cleanup: appeler `timer.cancel()` dans le return du useEffect
  - [x] T3.8 — Utiliser `useRef` pour `prevTimeLeftRef` et `timerRef`

- [x] **T4 — Mettre à jour `src/hooks/index.ts`** (AC: 2)
  - [x] T4.1 — Ajouter `export { useTimer } from './useTimer'`

- [x] **T5 — Créer `src/game/timer.test.ts`** (AC: 5)
  - [x] T5.1 — Mock `requestAnimationFrame` / `cancelAnimationFrame` / `performance.now()` dans Vitest
  - [x] T5.2 — Test: `onTick` reçoit `durationMs` au premier tick (0 elapsed)
  - [x] T5.3 — Test: `onTick` reçoit valeurs décroissantes au fil des frames
  - [x] T5.4 — Test: `onExpire` est appelé exactement une fois quand totalElapsed >= durationMs
  - [x] T5.5 — Test: `cancel()` arrête la boucle (onTick n'est plus appelé)
  - [x] T5.6 — Test: `onTick` est appelé avec `timeLeft = 0` au dernier frame avant expiration

## Dev Notes

### Contexte Critique

La Story 3.3 implémente le **moteur de timing** du jeu. Deux artefacts distincts :
1. `src/game/timer.ts` — utilitaire pur TypeScript (zéro React, zéro dépendance state)
2. `src/hooks/useTimer.ts` — colle le timer au GameState via dispatch

**Ce que la story crée :**
- `src/game/timer.ts` — factory `createTimer`, interface `TimerHandle`
- `src/game/timer.test.ts` — tests unitaires du timer (avec mocks rAF)
- `src/hooks/useTimer.ts` — hook React intégrant le timer au game state

**Ce que la story ne touche PAS :**
- `src/game/gameTypes.ts` — déjà stable (`TICK_TIMER`, `GAME_OVER` actions déjà définis)
- `src/game/gameReducer.ts` — déjà stable (`TICK_TIMER` et `BOT_RESPOND` déjà implémentés)
- `src/engine/` — 118 tests passants — NE PAS TOUCHER
- `src/config/constants.ts` — `TIMER_EASY`, `TIMER_MEDIUM`, `TIMER_HARD` déjà stables
- Aucun composant React n'est créé dans cette story

### État Actuel du Projet (post Story 3.2)

```
src/
├── config/
│   ├── constants.ts        ✅ STABLE — TIMER_EASY=15, TIMER_MEDIUM=10, TIMER_HARD=6 (en secondes)
│   └── index.ts            ✅ STABLE
├── engine/                 ✅ STABLE (118 tests passants post code review Story 3.2)
│   ├── phonetics.ts
│   ├── phonetics.test.ts
│   ├── botSelector.ts
│   ├── botSelector.test.ts
│   ├── dataLoader.ts
│   └── index.ts
├── game/
│   ├── gameTypes.ts        ✅ STABLE — GameState, GameAction, GamePhase, Difficulty
│   ├── gameReducer.ts      ✅ STABLE — reducer pur + createInitialState()
│   ├── gameReducer.test.ts ✅ STABLE — 18+ tests
│   ├── timer.ts            🔲 À CRÉER
│   ├── timer.test.ts       🔲 À CRÉER
│   └── index.ts            🔲 À METTRE À JOUR (ajouter createTimer)
├── hooks/
│   ├── useGameData.ts      ✅ STABLE
│   ├── useGameState.ts     ✅ STABLE — expose { state, dispatch }
│   ├── useTimer.ts         🔲 À CRÉER
│   └── index.ts            🔲 À METTRE À JOUR (ajouter useTimer)
├── styles/
│   └── globals.css         ✅ COMPLET
└── main.tsx                ✅ STABLE
```

### Implémentation Complète Attendue

#### Contrat `GameState` et `GameAction` déjà en place

Ces types existent dans `src/game/gameTypes.ts` — **NE PAS REDÉFINIR** :

```typescript
// ✅ DÉJÀ DÉFINI — GameState contient :
timeLeft: number          // temps restant en ms (géré par TICK_TIMER + BOT_RESPOND)
phase: GamePhase          // 'idle' | 'playing' | 'game-over'
difficulty: Difficulty    // 'easy' | 'medium' | 'hard'
currentWord: string       // change à chaque BOT_RESPOND (déclencheur de reset timer)

// ✅ DÉJÀ DÉFINI — Actions timer :
| { type: 'TICK_TIMER'; elapsed: number }                              // delta en ms
| { type: 'GAME_OVER'; reason: 'timeout' | 'dead-end'; deadSyllable?: string }
```

**Dans `gameReducer.ts` — comportements déjà implémentés :**
```typescript
case 'TICK_TIMER':
  if (state.phase !== 'playing') return state  // GUARD existant
  return { ...state, timeLeft: Math.max(0, state.timeLeft - action.elapsed) }

case 'BOT_RESPOND':
  if (state.phase !== 'playing') return state  // GUARD existant
  return {
    ...state,
    chain: [...state.chain, action.word],
    currentWord: action.word,
    timeLeft: getTimerMs(state.difficulty),  // ← RESET AUTOMATIQUE du timer !
  }
```

**Implication critique :** Le reset du timer après soumission réussie est DÉJÀ géré par `BOT_RESPOND` dans le reducer. `useTimer` doit détecter ce reset via `state.currentWord` (qui change à chaque BOT_RESPOND).

#### `src/game/timer.ts` — Utilitaire pur

```typescript
// src/game/timer.ts
// ARC4 : performance.now() + requestAnimationFrame — jamais setInterval
// Utilitaire pur : zéro React, zéro React, testable en isolation

export interface TimerHandle {
  start(): void
  cancel(): void
}

export function createTimer(
  onTick: (timeLeft: number) => void,
  onExpire: () => void,
  durationMs: number
): TimerHandle {
  let rafId: number | null = null
  let startTime: number | null = null
  let totalElapsed = 0
  let expired = false

  function tick(now: number) {
    if (startTime === null) startTime = now

    const frameDelta = now - startTime
    startTime = now  // reset startTime pour le prochain frame
    totalElapsed += frameDelta

    if (totalElapsed >= durationMs) {
      onTick(0)
      if (!expired) {
        expired = true
        onExpire()
      }
      return  // stopper la boucle
    }

    onTick(durationMs - totalElapsed)
    rafId = requestAnimationFrame(tick)
  }

  return {
    start() {
      startTime = null
      totalElapsed = 0
      expired = false
      rafId = requestAnimationFrame(tick)
    },
    cancel() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },
  }
}
```

> **Note implémentation :** La variable `startTime` est réutilisée à chaque frame pour calculer le delta (`frameDelta = now - startTime`). Après calcul, `startTime = now` est mis à jour pour le prochain frame. Cela garantit une mesure précise du temps écoulé par frame sans dérive cumulée.

#### `src/hooks/useTimer.ts` — Hook React

```typescript
// src/hooks/useTimer.ts
// Intègre createTimer avec le GameState via dispatch
// Reset automatique sur BOT_RESPOND (détecté via state.currentWord)

import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import { createTimer } from '../game/timer'
import type { GameAction, GameState } from '../game'

export function useTimer(dispatch: Dispatch<GameAction>, state: GameState): void {
  const prevTimeLeftRef = useRef<number>(state.timeLeft)
  const timerRef = useRef<ReturnType<typeof createTimer> | null>(null)

  useEffect(() => {
    // Arrêter le timer si la phase n'est pas 'playing'
    if (state.phase !== 'playing') {
      timerRef.current?.cancel()
      timerRef.current = null
      return
    }

    // Créer et démarrer un nouveau timer
    // Déclenché par : transition vers 'playing' ET changement de currentWord (BOT_RESPOND)
    prevTimeLeftRef.current = state.timeLeft

    timerRef.current?.cancel()

    timerRef.current = createTimer(
      (timeLeft) => {
        // Calculer le delta elapsed depuis le dernier tick
        const elapsed = prevTimeLeftRef.current - timeLeft
        prevTimeLeftRef.current = timeLeft

        if (elapsed > 0) {
          dispatch({ type: 'TICK_TIMER', elapsed })
        }
      },
      () => {
        // Timer expiré — déclencher GAME_OVER
        dispatch({ type: 'GAME_OVER', reason: 'timeout' })
      },
      state.timeLeft  // Utiliser le timeLeft actuel du state comme durée
    )

    timerRef.current.start()

    return () => {
      timerRef.current?.cancel()
      timerRef.current = null
    }
  }, [state.phase, state.currentWord, dispatch])
  // Dépendances : phase (transitions idle/playing/game-over) + currentWord (BOT_RESPOND reset)
  // NE PAS ajouter state.timeLeft dans les deps : cela recréerait le timer à chaque TICK_TIMER !
}
```

> **⚠️ Dépendances useEffect CRITIQUE :**
> - `state.phase` : pour démarrer/arrêter selon la phase
> - `state.currentWord` : pour redémarrer après chaque BOT_RESPOND (qui reset timeLeft dans le reducer)
> - `dispatch` : stable (useReducer garantit une référence stable)
> - **NE PAS** inclure `state.timeLeft` : cela provoquerait une recréation du timer à chaque frame !

#### `src/game/index.ts` (mise à jour)

```typescript
// src/game/index.ts
export type { GamePhase, Difficulty, GameState, GameAction } from './gameTypes'
export { gameReducer, initialState, createInitialState } from './gameReducer'
export type { TimerHandle } from './timer'
export { createTimer } from './timer'
```

#### `src/hooks/index.ts` (mise à jour)

```typescript
// src/hooks/index.ts
export { useGameData } from './useGameData'
export { useGameState } from './useGameState'
export { useTimer } from './useTimer'
```

### Testing du Timer — Stratégie Mock rAF

Le test de `createTimer` nécessite de mocker les APIs navigateur :

```typescript
// src/game/timer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTimer } from './timer'

describe('createTimer', () => {
  let rafCallbacks: Array<(time: number) => void> = []
  let currentTime = 0

  beforeEach(() => {
    rafCallbacks = []
    currentTime = 0

    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length - 1
    })

    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks[id] = () => {}  // noop
    })

    vi.stubGlobal('performance', { now: () => currentTime })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function advanceTime(ms: number) {
    currentTime += ms
    // Exécuter tous les callbacks rAF en attente
    const callbacks = [...rafCallbacks]
    rafCallbacks = []
    callbacks.forEach(cb => cb(currentTime))
  }

  it('appelle onTick avec durationMs au premier tick (0 elapsed)', () => {
    const onTick = vi.fn()
    const onExpire = vi.fn()
    const timer = createTimer(onTick, onExpire, 10000)
    timer.start()
    advanceTime(0)
    expect(onTick).toHaveBeenCalledWith(10000)
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('appelle onTick avec des valeurs décroissantes', () => {
    const ticks: number[] = []
    const timer = createTimer((t) => ticks.push(t), vi.fn(), 10000)
    timer.start()
    advanceTime(16)   // frame 1
    advanceTime(16)   // frame 2
    advanceTime(16)   // frame 3
    expect(ticks[0]).toBeCloseTo(9984, 0)
    expect(ticks[1]).toBeCloseTo(9968, 0)
    expect(ticks[2]).toBeCloseTo(9952, 0)
    expect(ticks[0] > ticks[1]).toBe(true)
  })

  it('appelle onExpire exactement une fois quand totalElapsed >= durationMs', () => {
    const onExpire = vi.fn()
    const timer = createTimer(vi.fn(), onExpire, 1000)
    timer.start()
    advanceTime(500)
    expect(onExpire).not.toHaveBeenCalled()
    advanceTime(600)  // total 1100ms > 1000ms
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('cancel() arrête la boucle', () => {
    const onTick = vi.fn()
    const timer = createTimer(onTick, vi.fn(), 10000)
    timer.start()
    advanceTime(16)
    expect(onTick).toHaveBeenCalledTimes(1)
    timer.cancel()
    advanceTime(16)
    expect(onTick).toHaveBeenCalledTimes(1)  // toujours 1 après cancel
  })

  it('onTick reçoit 0 au frame final avant expiration', () => {
    const ticks: number[] = []
    const timer = createTimer((t) => ticks.push(t), vi.fn(), 100)
    timer.start()
    advanceTime(110)  // dépasse durationMs
    expect(ticks[ticks.length - 1]).toBe(0)
  })
})
```

> **Vitest mock technique :** `vi.stubGlobal` est préféré à `global.requestAnimationFrame = ...` car il supporte le restore automatique via `vi.unstubAllGlobals()`.

### Intelligence Héritée de la Story 3.2

| Leçon Story 3.2 | Application Story 3.3 |
|---|---|
| `createInitialState()` exporté (pas `initialState` directement) | `useTimer` doit importer depuis `'../game'` (barrel), pas `'../game/gameReducer'` |
| `TICK_TIMER` guard : `if (state.phase !== 'playing') return state` | Le reducer filtre déjà les TICK_TIMER hors-phase — pas de double guard dans le hook |
| `BOT_RESPOND` reset `timeLeft = getTimerMs(difficulty)` | C'est le mécanisme de reset timer — détecter via `state.currentWord` dans les deps |
| `GAME_OVER` accepte `deadSyllable?: string` | `useTimer` dispatch `{ type: 'GAME_OVER', reason: 'timeout' }` — sans deadSyllable |
| Import statique uniquement depuis `'../config'` | `useTimer` n'importe PAS `TIMER_*` — il lit `state.timeLeft` directement |
| Barrel file pattern : toujours exporter depuis index.ts | `createTimer` exposé via `src/game/index.ts`, `useTimer` via `src/hooks/index.ts` |
| 118 tests passants après code review | Vérifier `npm run test` : 0 régression |

### Règles Architecturales Critiques (ARC4, ARC10)

**ARC4 — Timer via performance.now() + rAF UNIQUEMENT :**
```typescript
// ✅ Correct
const delta = performance.now() - lastTime

// ❌ INTERDIT — ces approches causent une dérive
setInterval(() => ..., 16)
setTimeout(() => ..., 100)
Date.now()  // moins précis que performance.now()
```

**Pourquoi pas `setInterval` :**
- `setInterval` accumule de la dérive sur le temps (throttle navigateur, inactivité onglet)
- `requestAnimationFrame` est synchronisé avec le refresh rate du navigateur
- `performance.now()` donne une précision sub-milliseconde (contrairement à `Date.now()`)
- NFR3 : précision ±100ms — seulement atteignable avec rAF + performance.now()

**ARC10 — Immutabilité dans le reducer (déjà respecté, rappel) :**
```typescript
// ✅ Le reducer gère timeLeft de façon immutable — NE PAS modifier timeLeft directement
// useTimer dispatch TICK_TIMER et le reducer décrémente
```

### Flux de Données Timer Complet

```
useTimer hook (src/hooks/useTimer.ts)
  │
  ├─ createTimer() appelé lors de : phase → 'playing' OU currentWord change
  │   └─ performance.now() + rAF : delta calculé par frame (~16ms à 60fps)
  │
  ├─ onTick(timeLeft) → dispatch({ type: 'TICK_TIMER', elapsed: delta })
  │   └─ gameReducer case 'TICK_TIMER' : timeLeft = Math.max(0, timeLeft - elapsed)
  │       └─ [guard: if phase !== 'playing' → no-op]
  │
  ├─ onExpire() → dispatch({ type: 'GAME_OVER', reason: 'timeout' })
  │   └─ gameReducer case 'GAME_OVER' : phase → 'game-over', sessionRecord mis à jour
  │
  └─ BOT_RESPOND dispatché (après mot valide joueur)
      └─ gameReducer : currentWord change + timeLeft reset à getTimerMs(difficulty)
          └─ useEffect [state.currentWord] → recréer timer avec nouveau state.timeLeft
```

### Interactions avec GameScreen (Story 3.5)

`useTimer` sera appelé dans `GameScreen.tsx` (créé en Story 3.5) :
```typescript
// Usage attendu dans GameScreen (Story 3.5)
const { state, dispatch } = useGameState()
useTimer(dispatch, state)
// Ensuite GameScreen utilise state.timeLeft pour afficher TimerRing
```

`useTimer` ne doit PAS être dans `useGameState` — c'est un effet de bord distinct. Deux hooks séparés, utilisés ensemble dans le composant.

### Project Structure Notes

#### Alignement avec l'architecture définie

```
src/
├── game/
│   ├── timer.ts            ← CRÉER ICI (utilitaire pur, zéro React)
│   ├── timer.test.ts       ← CRÉER ICI (tests co-localisés — ARC6)
│   └── index.ts            ← MODIFIER (ajouter exports createTimer, TimerHandle)
└── hooks/
    ├── useTimer.ts         ← CRÉER ICI (hook React intégrant timer + dispatch)
    └── index.ts            ← MODIFIER (ajouter useTimer)
```

[Source: architecture.md#Structure Complète du Projet — `src/game/timer.ts`, `src/hooks/useTimer.ts` documentés]

#### Dépendances inter-stories

- **Cette story dépend de :**
  - `src/game/gameTypes.ts` (TICK_TIMER, GAME_OVER actions) — ✅ stable
  - `src/game/gameReducer.ts` (BOT_RESPOND reset comportement) — ✅ stable
  - `src/config/constants.ts` (TIMER_* — indirectement via state.timeLeft) — ✅ stable

- **Cette story fournit à Story 3.4 (StartScreen) :** rien directement (StartScreen ne gère pas le timer)

- **Cette story fournit à Story 3.5 (GameScreen) :** `useTimer` hook, `createTimer` utilitaire

- **Cette story NE CRÉE PAS** de composants React — uniquement logique pure

#### Conflits Potentiels

1. **`state.timeLeft` dans les dépendances useEffect :** NE PAS ajouter — créerait un timer à chaque TICK_TIMER dispatch (chaque frame). Utiliser uniquement `state.phase` et `state.currentWord`.

2. **Double dispatch GAME_OVER :** Si `state.timeLeft` atteint 0 dans le reducer ET que `onExpire()` dispatche GAME_OVER, il y a risque de double dispatch. Le guard `if (state.phase !== 'playing') return state` dans le reducer protège contre ça. `createTimer` doit aussi garantir que `onExpire()` est appelé exactement une fois.

3. **Timer pendant la saisie bot :** Après `SUBMIT_WORD` valide (joueur), le bot répond avec `BOT_RESPOND`. Entre ces deux dispatches, `state.phase === 'playing'` et `state.timeLeft` n'a pas encore été reset. Le timer continue de tourner. C'est le comportement CORRECT : le joueur ne peut pas gagner du temps en attendant la réponse bot.

4. **Performance rAF :** `requestAnimationFrame` est throttled quand l'onglet est en background. Ce comportement est acceptable — si le joueur n'est pas sur l'onglet, le timer peut être imprécis. Ne pas compenser via `performance.now()` en arrière-plan (non nécessaire pour V1).

### References

- [Source: epics.md#Story 3.3] — User story complète, Acceptance Criteria (FR19, FR20, FR21, NFR3, ARC4)
- [Source: architecture.md#Architecture Frontend — State Management] — Flux Timer useTimer → dispatch TICK_TIMER
- [Source: architecture.md#Décisions Architecturales Core — Précision du timer] — `performance.now()` + rAF obligatoire
- [Source: architecture.md#Patterns de State] — Immutabilité reducer, guard de phase
- [Source: architecture.md#Flux de Données — Timer] — `useTimer → performance.now() + rAF → dispatch TICK_TIMER`
- [Source: architecture.md#Structure Complète du Projet] — `src/game/timer.ts` et `src/hooks/useTimer.ts` documentés
- [Source: architecture.md#Frontières Architecturales] — `src/game/` zéro React, `src/hooks/` seul pont React
- [Source: epics.md#Additional Requirements] — ARC4 (timer strategy), NFR3 (précision ±100ms)
- [Source: 3-2-gamestate-architecture-usereducer.md#Dev Notes] — Intelligence héritée Story 3.2
- [Source: gameReducer.ts] — `TICK_TIMER` action, `BOT_RESPOND` reset timeLeft, guards de phase existants

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Correction clé : `startTime` initialisé via `performance.now()` dans `start()` (et non dans `tick()`) pour que le delta du premier frame soit correctement calculé par rapport au moment de démarrage réel.

### Completion Notes List

- ✅ `src/game/timer.ts` créé : utilitaire pur TypeScript, zéro React. `createTimer(onTick, onExpire, durationMs)` utilise `performance.now()` + `requestAnimationFrame`, jamais `setInterval`. `onExpire()` garanti appelé exactement une fois via flag `expired`.
- ✅ `src/game/timer.test.ts` créé : 5 tests unitaires avec mocks `vi.stubGlobal` pour `requestAnimationFrame`, `cancelAnimationFrame`, `performance.now()`. Tous passent.
- ✅ `src/hooks/useTimer.ts` créé : hook React intégrant le timer au GameState. Dépendances `[state.phase, state.currentWord]` — `state.timeLeft` intentionnellement exclu pour éviter recréation à chaque tick.
- ✅ `src/game/index.ts` mis à jour : exports `createTimer` et `TimerHandle` ajoutés.
- ✅ `src/hooks/index.ts` mis à jour : export `useTimer` ajouté.
- ✅ 123 tests passent (118 existants + 5 nouveaux), 0 régression.

### File List

- src/game/timer.ts (créé)
- src/game/timer.test.ts (créé)
- src/hooks/useTimer.ts (créé)
- src/hooks/useTimer.test.ts (créé — code review)
- src/game/index.ts (modifié)
- src/hooks/index.ts (modifié)
- src/game/gameReducer.ts (modifié — code review)

## Change Log

- 2026-03-09 — Story 3.3 implémentée : création de `timer.ts` (utilitaire pur rAF), `useTimer.ts` (hook React), `timer.test.ts` (5 tests unitaires). Mise à jour des barrel files `game/index.ts` et `hooks/index.ts`. 123 tests passants, 0 régression.
- 2026-03-09 — Code review : 6 issues corrigées (3H, 3M). Guard de phase dans `GAME_OVER` reducer, guard double-start dans `createTimer`, import barrel dans `useTimer`, mock `cancelAnimationFrame` Map-based dans `timer.test.ts`, création de `useTimer.test.ts` (6 nouveaux tests AC2/AC3/AC4). 129 tests passants, 0 régression.

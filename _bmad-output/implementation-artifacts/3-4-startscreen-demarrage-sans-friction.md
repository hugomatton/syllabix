# Story 3.4 : StartScreen — Démarrage Sans Friction

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux un écran de démarrage épuré où je choisis ma difficulté et lance la partie en un clic,
Afin de commencer à jouer immédiatement sans friction. (FR1, FR18, FR22)

## Acceptance Criteria

**AC1 — Rendu visuel du StartScreen**
- **Given** l'app est chargée et les données sont prêtes (phase = `'idle'`)
- **When** je vois le StartScreen
- **Then** le titre `"Syllabix"` est affiché en `<h1>`
- **And** la règle est affichée en une ligne : `"Trouve un mot qui commence par la dernière syllabe du mot proposé."` (FR22)
- **And** `DifficultySelector` affiche 3 boutons : `Facile (15s)` / `Moyen (10s)` / `Difficile (6s)` (FR18)
- **And** `"Moyen"` est sélectionné par défaut
- **And** un bouton `"Jouer"` proéminent est visible

**AC2 — Lancement de la partie**
- **Given** je clique `"Jouer"`
- **When** la partie démarre
- **Then** `selectInitialWord(graph, dictionary)` est appelé pour obtenir `firstWord`
- **And** `dispatch({ type: 'START_GAME', difficulty, firstWord })` est déclenché
- **And** le GameScreen s'affiche immédiatement (phase → `'playing'`)

**AC3 — Accessibilité mobile (320px+)**
- **Given** je suis sur mobile (320px)
- **When** je vois le DifficultySelector
- **Then** les 3 boutons ont `min-height: 44px` (UX8)
- **And** le layout n'est pas cassé à 320px (NFR10)
- **And** à `< 380px`, les boutons `DifficultySelector` passent en colonne

**AC4 — Accessibilité clavier et ARIA**
- **Given** `DifficultySelector`
- **When** il est rendu
- **Then** il utilise `role="radiogroup"` et `aria-label="Mode de difficulté"`
- **And** la navigation clavier entre les 3 boutons est fonctionnelle
- **And** le bouton sélectionné a `aria-checked="true"` ou l'attribut approprié

**AC5 — Intégration App.tsx (routing par phase)**
- **Given** `state.phase === 'idle'`
- **When** `App.tsx` route vers les composants
- **Then** `StartScreen` reçoit `dispatch` et accède à `GameData` via `GameDataContext`
- **And** `state.phase === 'playing'` rend `GameScreen` (placeholder existant)
- **And** `state.phase === 'game-over'` rend `GameOver` (placeholder existant)

## Tasks / Subtasks

- [x] **T1 — Mettre à jour `src/components/App/App.tsx`** (AC: 5)
  - [x] T1.1 — Ajouter `useGameState` hook dans `App`
  - [x] T1.2 — Implémenter le routing par phase : `idle` → `StartScreen`, `playing` → `GameScreen`, `game-over` → `GameOver`
  - [x] T1.3 — Passer `dispatch` et `state` aux composants enfants (via props ou Context selon besoin)
  - [x] T1.4 — Garder `GameDataContext.Provider` wrappant l'arbre complet

- [x] **T2 — Créer `src/components/StartScreen/DifficultySelector.tsx`** (AC: 1, 3, 4)
  - [x] T2.1 — Props : `{ value: Difficulty; onChange: (d: Difficulty) => void }`
  - [x] T2.2 — `role="radiogroup"`, `aria-label="Mode de difficulté"`
  - [x] T2.3 — 3 boutons : Facile (easy/15s), Moyen (medium/10s), Difficile (hard/6s)
  - [x] T2.4 — État sélectionné : fond `--color-accent-bg`, bordure `--color-accent`
  - [x] T2.5 — `min-height: 44px` sur chaque bouton (UX8)
  - [x] T2.6 — Responsive : colonne sur `< 380px`, ligne sinon

- [x] **T3 — Implémenter `src/components/StartScreen/StartScreen.tsx`** (AC: 1, 2, 3)
  - [x] T3.1 — Props : `{ dispatch: Dispatch<GameAction> }` + accès `GameDataContext` via `useContext`
  - [x] T3.2 — État local : `difficulty: Difficulty` initialisé à `'medium'`
  - [x] T3.3 — Rendu : `<h1>Syllabix</h1>`, règle phonétique en `<p>`, `DifficultySelector`, bouton `"Jouer"`
  - [x] T3.4 — Handler `handleStart` : appelle `selectInitialWord(graph, dictionary)` depuis `GameDataContext`, dispatch `START_GAME`
  - [x] T3.5 — Bouton "Jouer" : style proéminent (fond `--color-accent`, texte blanc, `min-width: 160px`, `padding: 12px 32px`, `font-weight: 600`, `border-radius: 8px`)

- [x] **T4 — Mettre à jour `src/components/StartScreen/StartScreen.module.css`** (AC: 1, 3)
  - [x] T4.1 — Layout centré : `flex column`, `align-items: center`, `gap` cohérent
  - [x] T4.2 — `h1` : typographie forte, taille `clamp(2rem, 6vw, 3.5rem)`
  - [x] T4.3 — Règle phonétique : `font-size: 1rem`, `color: var(--color-muted)`, `text-align: center`, `max-width: 400px`
  - [x] T4.4 — Bouton "Jouer" : hover `brightness(1.1)` transition 150ms, focus outline 2px `--color-accent` offset 2px
  - [x] T4.5 — Responsive 320px : `padding: 24px 16px`, bouton `width: 100%` sur mobile

- [x] **T5 — Créer `src/components/StartScreen/DifficultySelector.module.css`** (AC: 3, 4)
  - [x] T5.1 — Container `flex row`, `gap: 8px`, wrap sur petits écrans
  - [x] T5.2 — Bouton base : fond transparent, bordure `--color-border`, `border-radius: 6px`, padding `10px 16px`
  - [x] T5.3 — Bouton sélectionné : fond `--color-accent-bg`, bordure `--color-accent`
  - [x] T5.4 — `@media (max-width: 380px)` : flex-direction column, boutons `width: 100%`

- [x] **T6 — Mettre à jour `src/components/StartScreen/index.ts`** (AC: -)
  - [x] T6.1 — Exporter `DifficultySelector` depuis `./DifficultySelector`
  - [x] T6.2 — Vérifier que `StartScreen` est exporté

- [x] **T7 — Créer `src/components/StartScreen/StartScreen.test.tsx`** (AC: 1, 2, 3, 4)
  - [x] T7.1 — Test : le titre "Syllabix" est rendu en `<h1>`
  - [x] T7.2 — Test : la règle phonétique est affichée
  - [x] T7.3 — Test : `DifficultySelector` affiche 3 boutons
  - [x] T7.4 — Test : "Moyen" est sélectionné par défaut
  - [x] T7.5 — Test : clic "Jouer" dispatche `START_GAME` avec difficulty = 'medium' par défaut
  - [x] T7.6 — Test : changer la difficulté en "Difficile" puis cliquer "Jouer" dispatche `START_GAME` avec `difficulty: 'hard'`

## Dev Notes

### Contexte Critique

La Story 3.4 implémente le **premier composant UI interactif** du jeu. C'est l'écran que le joueur voit en premier après le chargement.

**Ce que la story crée/modifie :**
- `src/components/App/App.tsx` — MODIFIER : ajouter routing par phase + `useGameState`
- `src/components/StartScreen/StartScreen.tsx` — IMPLÉMENTER (actuellement placeholder)
- `src/components/StartScreen/StartScreen.module.css` — REMPLIR (actuellement vide)
- `src/components/StartScreen/DifficultySelector.tsx` — CRÉER (nouveau composant)
- `src/components/StartScreen/DifficultySelector.module.css` — CRÉER
- `src/components/StartScreen/index.ts` — MODIFIER (ajouter export DifficultySelector)
- `src/components/StartScreen/StartScreen.test.tsx` — CRÉER

**Ce que la story ne touche PAS :**
- `src/engine/` — 129 tests passants — NE PAS TOUCHER
- `src/game/gameReducer.ts` — stable, `START_GAME` déjà implémenté
- `src/game/gameTypes.ts` — stable, `Difficulty` type déjà défini
- `src/hooks/useTimer.ts` — ne sera utilisé que dans GameScreen (Story 3.5)
- `src/components/GameScreen/` — reste placeholder
- `src/components/GameOver/` — reste placeholder

### État Actuel du Projet (post Story 3.3)

```
src/
├── config/
│   ├── constants.ts        ✅ STABLE — TIMER_EASY=15s, TIMER_MEDIUM=10s, TIMER_HARD=6s
│   └── index.ts            ✅ STABLE
├── engine/                 ✅ STABLE (129 tests passants)
│   ├── phonetics.ts
│   ├── phonetics.test.ts
│   ├── botSelector.ts      ✅ STABLE — selectInitialWord(graph, dictionary) disponible
│   ├── botSelector.test.ts
│   ├── dataLoader.ts       ✅ STABLE — loadGameData() → Promise<GameData>
│   └── index.ts
├── game/
│   ├── gameTypes.ts        ✅ STABLE — Difficulty, GameState, GameAction, GamePhase
│   ├── gameReducer.ts      ✅ STABLE — START_GAME, RESTART implémentés
│   ├── gameReducer.test.ts ✅ STABLE
│   ├── timer.ts            ✅ STABLE
│   ├── timer.test.ts       ✅ STABLE
│   └── index.ts            ✅ STABLE
├── hooks/
│   ├── useGameData.ts      ✅ STABLE
│   ├── useGameState.ts     ✅ STABLE — expose { state, dispatch }
│   ├── useTimer.ts         ✅ STABLE — sera utilisé Story 3.5
│   ├── useTimer.test.ts    ✅ STABLE
│   └── index.ts            ✅ STABLE
├── components/
│   ├── App/
│   │   ├── App.tsx         🔲 À MODIFIER — ajouter useGameState + routing par phase
│   │   ├── App.module.css  ✅ existant
│   │   ├── App.test.tsx    ✅ existant (4 tests) — ne pas casser
│   │   └── index.ts        ✅ existant
│   ├── StartScreen/
│   │   ├── StartScreen.tsx        🔲 À IMPLÉMENTER (placeholder actuel : 1 ligne)
│   │   ├── StartScreen.module.css 🔲 À REMPLIR (actuellement vide)
│   │   ├── DifficultySelector.tsx 🔲 À CRÉER
│   │   ├── DifficultySelector.module.css 🔲 À CRÉER
│   │   ├── StartScreen.test.tsx   🔲 À CRÉER
│   │   └── index.ts               🔲 À MODIFIER (ajouter DifficultySelector)
│   ├── GameScreen/
│   │   ├── GameScreen.tsx         placeholder — NE PAS MODIFIER (Story 3.5)
│   │   └── ...
│   ├── GameOver/
│   │   ├── GameOver.tsx           placeholder — NE PAS MODIFIER
│   │   └── ...
│   └── shared/
│       ├── LoadingScreen.tsx      ✅ existant — NE PAS TOUCHER
│       ├── ErrorScreen.tsx        ✅ existant — NE PAS TOUCHER
│       └── index.ts               ✅ existant
├── styles/
│   └── globals.css         ✅ COMPLET
└── main.tsx                ✅ STABLE
```

### Implémentation Attendue Détaillée

#### `src/components/App/App.tsx` — Architecture mise à jour

```tsx
// src/components/App/App.tsx
import { createContext, useEffect, useState } from 'react'
import { loadGameData, type GameData } from '../../engine'
import { LoadingScreen, ErrorScreen } from '../shared'
import { StartScreen } from '../StartScreen'
import { GameScreen } from '../GameScreen'
import { GameOver } from '../GameOver'
import { useGameState } from '../../hooks'

export const GameDataContext = createContext<GameData | null>(null)

export function App() {
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [gameData, setGameData] = useState<GameData | null>(null)
  const { state, dispatch } = useGameState()

  useEffect(() => {
    let cancelled = false
    loadGameData()
      .then(data => {
        if (!cancelled) {
          setGameData(data)
          setLoadingState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingState('error')
        }
      })
    return () => { cancelled = true }
  }, [])

  if (loadingState === 'loading') return <LoadingScreen />
  if (loadingState === 'error') return <ErrorScreen message="Impossible de charger les données du jeu." />

  return (
    <GameDataContext.Provider value={gameData!}>
      {state.phase === 'idle' && <StartScreen dispatch={dispatch} />}
      {state.phase === 'playing' && <GameScreen state={state} dispatch={dispatch} />}
      {state.phase === 'game-over' && <GameOver state={state} dispatch={dispatch} />}
    </GameDataContext.Provider>
  )
}
```

> **Note :** `useGameState` instancie `useReducer` avec `createInitialState()` qui lit `localStorage('syllabix-record')` une seule fois.

> **Attention App.test.tsx :** Les 4 tests existants testent LoadingScreen, ErrorScreen, et StartScreen. Ils mockent `loadGameData`. Vérifier que les tests passent toujours après modification — en particulier le test qui vérifie le rendu de `StartScreen` après chargement.

#### `src/components/StartScreen/DifficultySelector.tsx`

```tsx
// src/components/StartScreen/DifficultySelector.tsx
import type { Difficulty } from '../../game'
import styles from './DifficultySelector.module.css'

interface DifficultySelectorProps {
  value: Difficulty
  onChange: (d: Difficulty) => void
}

const DIFFICULTIES: { key: Difficulty; label: string; seconds: number }[] = [
  { key: 'easy',   label: 'Facile',   seconds: 15 },
  { key: 'medium', label: 'Moyen',    seconds: 10 },
  { key: 'hard',   label: 'Difficile', seconds: 6  },
]

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div
      className={styles.container}
      role="radiogroup"
      aria-label="Mode de difficulté"
    >
      {DIFFICULTIES.map(({ key, label, seconds }) => (
        <button
          key={key}
          className={`${styles.button} ${value === key ? styles.selected : ''}`}
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          type="button"
        >
          {label}
          <span className={styles.duration}>{seconds}s</span>
        </button>
      ))}
    </div>
  )
}
```

#### `src/components/StartScreen/StartScreen.tsx`

```tsx
// src/components/StartScreen/StartScreen.tsx
import { useContext, useState } from 'react'
import type { Dispatch } from 'react'
import { GameDataContext } from '../App/App'
import { selectInitialWord } from '../../engine'
import type { GameAction, Difficulty } from '../../game'
import { DifficultySelector } from './DifficultySelector'
import styles from './StartScreen.module.css'

interface StartScreenProps {
  dispatch: Dispatch<GameAction>
}

export function StartScreen({ dispatch }: StartScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const gameData = useContext(GameDataContext)

  function handleStart() {
    if (!gameData) return
    const firstWord = selectInitialWord(gameData.graph, gameData.dictionary)
    dispatch({ type: 'START_GAME', difficulty, firstWord })
  }

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>Syllabix</h1>
      <p className={styles.rule}>
        Trouve un mot qui commence par la dernière syllabe du mot proposé.
      </p>
      <DifficultySelector value={difficulty} onChange={setDifficulty} />
      <button
        className={styles.playButton}
        onClick={handleStart}
        type="button"
      >
        Jouer
      </button>
    </main>
  )
}
```

#### Contrat `GameAction.START_GAME` — déjà en place

```typescript
// ✅ DÉJÀ DÉFINI dans gameTypes.ts :
| { type: 'START_GAME'; difficulty: Difficulty; firstWord: string }

// ✅ DÉJÀ IMPLÉMENTÉ dans gameReducer.ts :
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
    gameOverReason: undefined,
    deadSyllable: undefined,
  }
```

#### `selectInitialWord` — déjà en place

```typescript
// ✅ DÉJÀ DÉFINI dans src/engine/botSelector.ts :
export function selectInitialWord(
  graph: Record<string, string[]>,
  dictionary: Map<string, string>,
): string
// Choisit parmi STARTER_WORDS ceux dont dernière syllabe a ≥5 réponses
// Retourne toujours un mot (fallback garanti)
```

#### `GameData` — contrat disponible

```typescript
// ✅ Type disponible depuis src/engine/dataLoader.ts :
export interface GameData {
  dictionary: Map<string, string>
  graph: Record<string, string[]>
}
// Accessible via useContext(GameDataContext) dans StartScreen
```

### Design Tokens CSS à utiliser

```css
/* Variables globales disponibles depuis globals.css */
--color-bg:         #fafafa;   /* fond principal */
--color-surface:    #f7f7f5;   /* surfaces élevées */
--color-text:       #111111;   /* texte principal */
--color-muted:      #9ca3af;   /* texte secondaire */
--color-accent:     #d97706;   /* amber — accent, boutons primaires */
--color-accent-bg:  #fffbeb;   /* fond bouton sélectionné DifficultySelector */
--color-border:     #e0e0e0;   /* bordures subtiles */
--color-success:    #16a34a;
--color-error:      #dc2626;
--font-family:      'Inter', system-ui, sans-serif;
```

> **⚠️ Note contraste :** `--color-accent` (#d97706) a un ratio ~3.1:1 sur fond clair — INSUFFISANT pour du texte seul (WCAG AA). Toujours doubler avec fond (ex. fond blanc sur bouton accent, texte blanc sur fond accent).

### Règles Architecturales Critiques

**ARC5 — CSS Modules uniquement :**
```
// ✅ Correct
import styles from './StartScreen.module.css'

// ❌ INTERDIT — aucune lib externe de composants (MUI, Chakra, etc.)
// ❌ INTERDIT — style inline au-delà du strict minimum
```

**ARC9 — Barrel files obligatoires :**
```typescript
// src/components/StartScreen/index.ts — DOIT exporter :
export { StartScreen } from './StartScreen'
export { DifficultySelector } from './DifficultySelector'
```

**Frontières architecturales :**
- `StartScreen` est un composant React — il peut utiliser `useContext`, `useState`
- `StartScreen` NE DOIT PAS importer depuis `'../game/gameReducer'` directement
- `StartScreen` consomme `dispatch` via props + `GameDataContext` via Context
- `selectInitialWord` est importé depuis `'../../engine'` (barrel file)

### Stratégie de Test

Le `StartScreen.test.tsx` doit mocker :
1. `GameDataContext` — fournir un `gameData` mock avec `dictionary` et `graph` factices
2. `selectInitialWord` — retourner un mot mock fixe pour les assertions
3. `dispatch` — `vi.fn()` pour capturer les appels

```tsx
// Exemple de setup test
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GameDataContext } from '../App/App'
import { StartScreen } from './StartScreen'

const mockDispatch = vi.fn()
const mockGameData = {
  dictionary: new Map([['chocolat', 'ʃɔkɔla']]),
  graph: { 'la': ['lapin', 'lac'] }
}

vi.mock('../../engine', () => ({
  selectInitialWord: vi.fn(() => 'chocolat')
}))

function renderStartScreen() {
  return render(
    <GameDataContext.Provider value={mockGameData}>
      <StartScreen dispatch={mockDispatch} />
    </GameDataContext.Provider>
  )
}
```

### Intelligence Héritée des Stories 3.2 et 3.3

| Leçon précédente | Application Story 3.4 |
|---|---|
| `useGameState` expose `{ state, dispatch }` via `useReducer` | `App.tsx` appelle `useGameState()` une seule fois au niveau App |
| `createInitialState()` lit localStorage une seule fois | Pas de second `useGameState` dans StartScreen — `dispatch` passé en props |
| Imports via barrel files uniquement | `import { useGameState } from '../../hooks'`, `import { selectInitialWord } from '../../engine'` |
| `Difficulty` type défini dans `gameTypes.ts`, exporté via `game/index.ts` | `import type { Difficulty } from '../../game'` |
| `START_GAME` attend `firstWord: string` | `selectInitialWord()` retourne toujours un string (fallback garanti) |
| Guard de phase dans reducer : `if (state.phase !== 'playing') return state` | `handleStart()` ne peut être appelé qu'en phase `'idle'` (StartScreen non rendu sinon) |
| 129 tests passants post Story 3.3 | Vérifier `npm run test` : 0 régression, + nouveaux tests StartScreen |

### Interactions avec les Stories Suivantes

**Story 3.5 (GameScreen)** — cette story lui prépare :
- `state.phase === 'playing'` : App.tsx rend `<GameScreen state={state} dispatch={dispatch} />`
- `state.currentWord` : le premier mot du bot (fixé via `START_GAME`)
- `state.timeLeft` : initialisé via `getTimerMs(difficulty)` dans le reducer
- `state.difficulty` : transmis pour que `useTimer` puisse calculer les durées

**Story 3.6 (WordInput)** — s'intégrera dans GameScreen, pas de dépendance directe avec StartScreen.

### Project Structure Notes

#### Alignement avec l'architecture définie

```
src/components/
├── App/
│   └── App.tsx              ← MODIFIER (ajouter routing phase + useGameState)
├── StartScreen/
│   ├── StartScreen.tsx      ← IMPLÉMENTER
│   ├── StartScreen.module.css ← REMPLIR
│   ├── StartScreen.test.tsx ← CRÉER
│   ├── DifficultySelector.tsx ← CRÉER
│   ├── DifficultySelector.module.css ← CRÉER
│   └── index.ts             ← MODIFIER
```

[Source: architecture.md#Structure Complète du Projet — `StartScreen/`, `DifficultySelector` dans StartScreen]
[Source: architecture.md#Frontières Architecturales — Composants consomment `useGameState` hook]

#### Conflits Potentiels

1. **App.test.tsx et le routing :** Le fichier `App.test.tsx` contient actuellement 4 tests qui vérifient le chargement et le rendu de `StartScreen`. Après la modification de `App.tsx` pour ajouter le routing par phase, vérifier que les tests existants passent encore. En particulier, le test qui vérifie que `StartScreen` est rendu après le chargement suppose que `state.phase === 'idle'` à l'initialisation — ce qui est le cas (`createInitialState()` retourne `phase: 'idle'`).

2. **`import { StartScreen } from '../StartScreen/StartScreen'` dans App.tsx :** Changer vers `import { StartScreen } from '../StartScreen'` (barrel) pour cohérence ARC9.

3. **`GameDataContext` importé dans StartScreen depuis `'../App/App'` :** Possible couplage. Alternative : déplacer `GameDataContext` dans `src/contexts/GameDataContext.ts`. Mais pour V1, l'import depuis App est acceptable et cohérent avec l'existant (`App.test.tsx` utilise déjà ce pattern).

4. **`useGameState` dans App.tsx :** `useReducer` sera appelé au niveau App, ce qui signifie que `state` et `dispatch` persistent pendant toute la durée de vie de l'app. C'est le comportement correct : le game state ne doit pas être détruit entre les phases.

### References

- [Source: epics.md#Story 3.4] — User story, Acceptance Criteria (FR1, FR18, FR22, NFR10, UX8)
- [Source: ux-design-specification.md#DifficultySelector] — Anatomy, states, role radiogroup
- [Source: ux-design-specification.md#Action primaire] — Bouton "Jouer" style (fond amber, texte blanc, min-width 160px)
- [Source: ux-design-specification.md#Responsive] — DifficultySelector colonne < 380px, bouton Jouer width 100% mobile
- [Source: architecture.md#Architecture Frontend] — `useReducer`, `GameDataContext`, routing par phase
- [Source: architecture.md#Frontières Architecturales] — Composants consomment hook, jamais import direct reducer
- [Source: architecture.md#Naming Patterns] — `PascalCase.tsx` composants, CSS Modules même nom
- [Source: architecture.md#Patterns de State] — ARC5 (CSS Modules), ARC9 (barrel files), ARC10 (immutabilité)
- [Source: epics.md#Additional Requirements] — ARC5 (CSS Modules), UX1 (palette amber), UX2 (layout), UX8 (touch 44px)
- [Source: globals.css] — Design tokens disponibles (couleurs, typographie)
- [Source: gameTypes.ts] — `Difficulty`, `GameAction`, `START_GAME` interface
- [Source: gameReducer.ts] — `START_GAME` handler, `createInitialState()` → `phase: 'idle'`
- [Source: botSelector.ts] — `selectInitialWord(graph, dictionary)` signature
- [Source: 3-3-timer-performance-now-requestanimationframe.md#Dev Notes] — Patterns barrel file, import depuis game/engine

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implémentation complète du StartScreen avec routing par phase dans App.tsx
- App.tsx mis à jour : ajout de `useGameState`, routing `idle`→StartScreen / `playing`→GameScreen / `game-over`→GameOver
- `DifficultySelector.tsx` créé : radiogroup ARIA, 3 boutons (Facile/Moyen/Difficile), `min-height: 44px`, responsive < 380px
- `StartScreen.tsx` implémenté : état local `difficulty` initialisé à 'medium', `handleStart` dispatche `START_GAME`
- CSS Modules complets pour StartScreen et DifficultySelector (design tokens, responsive, focus styles)
- `index.ts` mis à jour avec export `DifficultySelector`
- 6 tests créés dans `StartScreen.test.tsx`, tous passants
- `App.test.tsx` mis à jour : dernier test adapté au vrai StartScreen (cherche 'Syllabix' au lieu du placeholder)
- 135 tests au total : 0 régression, 6 nouveaux tests passants
- Cycle rouge-vert-refactor respecté : tests écrits avant implémentation, confirmés en échec, puis verts

**Fixes post code-review (claude-sonnet-4-6) :**
- [HIGH FIXED] `DifficultySelector.tsx` : ARIA corrigée — `role="radio"` + `aria-checked` sur chaque bouton, navigation flèches ↑↓←→ via `onKeyDown`, roving `tabIndex` (sélectionné=0, autres=-1)
- [MEDIUM FIXED] `StartScreen.test.tsx` : T7.3 refactorisé avec `within(radioGroup).getAllByRole('radio')` — plus fragile
- [MEDIUM FIXED] `StartScreen.test.tsx` : T7.4 mis à jour `aria-pressed` → `aria-checked`, T7.6 utilise `role="radio"`
- [MEDIUM FIXED] `StartScreen.test.tsx` : T7.7 et T7.8 ajoutés — couverture navigation clavier ArrowRight/ArrowLeft
- 137 tests au total : 0 régression, +2 tests clavier

### File List

- src/components/App/App.tsx (modifié)
- src/components/App/App.test.tsx (modifié)
- src/components/StartScreen/StartScreen.tsx (modifié)
- src/components/StartScreen/StartScreen.module.css (modifié)
- src/components/StartScreen/DifficultySelector.tsx (créé)
- src/components/StartScreen/DifficultySelector.module.css (créé)
- src/components/StartScreen/StartScreen.test.tsx (créé)
- src/components/StartScreen/index.ts (modifié)

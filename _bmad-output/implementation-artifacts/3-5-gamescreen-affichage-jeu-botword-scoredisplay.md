# Story 3.5 : GameScreen — Affichage Jeu, BotWord & ScoreDisplay

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux voir le mot du bot en grand, mon score et la chaîne pendant le jeu,
Afin d'avoir toujours une vision claire de l'état de partie. (FR5, FR6, FR12, FR13, FR21)

## Acceptance Criteria

**AC1 — Layout GameScreen (phase 'playing')**
- **Given** le jeu est en phase `'playing'`
- **When** je vois le GameScreen
- **Then** `TimerRing` SVG s'affiche en haut de l'écran (FR21)
- **And** `BotWord` affiche le mot actuel en grand texte centré (`clamp(2.5rem, 8vw, 5rem)`) (FR5)
- **And** `ScoreDisplay` affiche le score courant dans le coin supérieur (FR12, FR13)
- **And** `WordChain` affiche les chips des mots déjà joués, scrollable horizontalement (FR6)
- **And** `WordInput` (placeholder) est présent en bas (Story 3.6 l'implémentera)

**AC2 — Animation BotWord**
- **Given** un nouveau mot bot arrive via `BOT_RESPOND`
- **When** `BotWord` se met à jour
- **Then** le mot s'affiche immédiatement avec une animation d'entrée (150ms fade + slight scale)
- **And** l'animation respecte `@media (prefers-reduced-motion: no-preference)` (UX7)
- **And** sans motion preference, l'affichage est instantané (pas d'animation)

**AC3 — TimerRing warning**
- **Given** le timer tourne
- **When** `timeLeft` passe sous 30% de la durée totale (ex: < 4.5s sur 15s)
- **Then** la couleur du stroke `TimerRing` passe à `--color-error` (#dc2626)
- **And** le stroke reste amber `--color-accent` au-dessus de 30%

**AC4 — Responsivité mobile (375px)**
- **Given** je joue sur mobile (375px)
- **When** je vois le GameScreen
- **Then** tous les éléments sont visibles sans scroll horizontal
- **And** la taille de `BotWord` s'adapte via `clamp()` (UX2)
- **And** `WordChain` scrolle horizontalement sans casser le layout

**AC5 — Accessibilité**
- **Given** le GameScreen est rendu
- **When** un screen reader parcourt la page
- **Then** `TimerRing` a `role="timer"` et `aria-live="polite"`
- **And** `BotWord` a `aria-live="assertive"` et `aria-label="Mot du bot : [MOT]"`
- **And** `WordChain` a `role="list"` et `aria-label="Chaîne de mots"`
- **And** `ScoreDisplay` a `aria-live="polite"` sur la valeur score

**AC6 — Intégration App.tsx**
- **Given** `state.phase === 'playing'`
- **When** `App.tsx` route vers les composants
- **Then** `<GameScreen state={state} dispatch={dispatch} />` reçoit `state` et `dispatch` en props
- **And** `useTimer(dispatch, state)` est appelé DANS GameScreen (pas dans App)

**AC7 — Tests**
- **Given** `src/components/GameScreen/GameScreen.test.tsx` existe
- **When** j'exécute `npm run test`
- **Then** tous les tests passent sans régression (≥ 137 tests existants)
- **And** les tests couvrent le rendu de TimerRing, BotWord, ScoreDisplay, WordChain

## Tasks / Subtasks

- [x] **T1 — Mettre à jour `src/components/App/App.tsx`** (AC: 6)
  - [x] T1.1 — Passer `state` et `dispatch` à `<GameScreen state={state} dispatch={dispatch} />`
  - [x] T1.2 — Vérifier que `App.test.tsx` (4 tests) passe encore après la modification

- [x] **T2 — Implémenter `src/components/GameScreen/GameScreen.tsx`** (AC: 1, 6)
  - [x] T2.1 — Props : `{ state: GameState; dispatch: Dispatch<GameAction> }`
  - [x] T2.2 — Appel de `useTimer(dispatch, state)` dans le composant
  - [x] T2.3 — Calculer `totalDuration` via `getTotalDuration(state.difficulty)` depuis constantes config
  - [x] T2.4 — Layout arcade : `TimerRing` haut, `ScoreDisplay` coin, `BotWord` centre, `WordChain` entre, `WordInput` placeholder bas
  - [x] T2.5 — Exporter `getTotalDuration` ou la définir en local dans GameScreen (fonction pure, pas besoin de fichier séparé)

- [x] **T3 — Créer `src/components/GameScreen/TimerRing.tsx`** (AC: 1, 3, 5)
  - [x] T3.1 — Props : `{ timeLeft: number; totalDuration: number }`
  - [x] T3.2 — SVG cercle avec `stroke-dasharray` et `stroke-dashoffset` calculés depuis `fraction = timeLeft / totalDuration`
  - [x] T3.3 — Valeur numérique `Math.ceil(timeLeft / 1000)` au centre du SVG
  - [x] T3.4 — Couleur stroke : `--color-error` si fraction < 0.3, `--color-accent` sinon
  - [x] T3.5 — `role="timer"`, `aria-live="polite"`, `aria-label="Temps restant : Xs"`
  - [x] T3.6 — Transition CSS smooth sur `stroke-dashoffset` (respect `prefers-reduced-motion`)

- [x] **T4 — Créer `src/components/GameScreen/BotWord.tsx`** (AC: 1, 2, 5)
  - [x] T4.1 — Props : `{ word: string }`
  - [x] T4.2 — Rendu : `<p aria-live="assertive" aria-label="Mot du bot : {word}">`
  - [x] T4.3 — Font-size `clamp(2.5rem, 8vw, 5rem)`, gras, centré
  - [x] T4.4 — Animation entrée 150ms : `@keyframes botWordEnter` (opacity 0→1 + scale 0.9→1) uniquement dans `@media (prefers-reduced-motion: no-preference)`
  - [x] T4.5 — Utiliser `key={word}` sur le composant dans GameScreen pour forcer remontage/animation à chaque nouveau mot bot

- [x] **T5 — Créer `src/components/GameScreen/WordChip.tsx`** (AC: 1)
  - [x] T5.1 — Props : `{ word: string; isLatest?: boolean }`
  - [x] T5.2 — Pill shape : `border-radius: 999px`, padding `6px 14px`, fond `--color-accent-bg`, texte `--color-text`
  - [x] T5.3 — Variante `isLatest` : bordure `--color-accent` plus marquée
  - [x] T5.4 — Animation entrée chip : 150ms scale + fade-in (respects `prefers-reduced-motion`)

- [x] **T6 — Créer `src/components/GameScreen/WordChain.tsx`** (AC: 1, 4, 5)
  - [x] T6.1 — Props : `{ chain: string[] }`
  - [x] T6.2 — `role="list"`, `aria-label="Chaîne de mots"`
  - [x] T6.3 — Scroll horizontal : `overflow-x: auto`, `-webkit-overflow-scrolling: touch`
  - [x] T6.4 — Rendu de `WordChip` pour chaque mot dans `chain`, avec `isLatest={idx === chain.length - 1}`
  - [x] T6.5 — `useRef` sur le container + `scrollLeft` auto au dernier chip (effet sur changement de chain.length)

- [x] **T7 — Créer `src/components/GameScreen/ScoreDisplay.tsx`** (AC: 1, 5)
  - [x] T7.1 — Props : `{ score: number; sessionRecord: number }`
  - [x] T7.2 — Afficher score courant + record de session
  - [x] T7.3 — `font-variant-numeric: tabular-nums`
  - [x] T7.4 — `aria-live="polite"` sur la valeur score

- [x] **T8 — Créer les CSS Modules** (AC: 1, 4)
  - [x] T8.1 — `GameScreen.module.css` : layout arcade colonne centrée, `max-width: 640px`, padding
  - [x] T8.2 — `TimerRing.module.css` : SVG centré, taille responsive (`clamp` ou size fixe)
  - [x] T8.3 — `BotWord.module.css` : `clamp(2.5rem, 8vw, 5rem)`, centré, animation
  - [x] T8.4 — `WordChain.module.css` : flex row, overflow-x auto, gap, no-wrap
  - [x] T8.5 — `WordChip.module.css` : pill, fond, variante latest
  - [x] T8.6 — `ScoreDisplay.module.css` : positionnement coin, tabular-nums

- [x] **T9 — Mettre à jour `src/components/GameScreen/index.ts`** (AC: -)
  - [x] T9.1 — Exporter tous les nouveaux composants : `GameScreen`, `TimerRing`, `BotWord`, `WordChain`, `WordChip`, `ScoreDisplay`

- [x] **T10 — Créer `src/components/GameScreen/GameScreen.test.tsx`** (AC: 7)
  - [x] T10.1 — Mock `useTimer` (vi.mock('../../hooks')) pour isoler les effets timer
  - [x] T10.2 — Test : `BotWord` affiche le `state.currentWord`
  - [x] T10.3 — Test : `ScoreDisplay` affiche le `state.score`
  - [x] T10.4 — Test : `WordChain` rend autant de chips que `state.chain.length`
  - [x] T10.5 — Test : `TimerRing` est rendu avec les bonnes props
  - [x] T10.6 — Test : classe warning sur TimerRing quand fraction < 0.3
  - [x] T10.7 — Vérifier : 0 régression sur les 137 tests existants

## Dev Notes

### Contexte Critique

Story 3.5 implémente le GameScreen visuel, **sans WordInput** (Story 3.6). L'objectif est le layout arcade complet avec les 4 composants d'affichage : TimerRing, BotWord, WordChain, ScoreDisplay.

**Ce que la story crée/modifie :**
- `src/components/App/App.tsx` — MODIFIER : passer `state` et `dispatch` à `GameScreen`
- `src/components/GameScreen/GameScreen.tsx` — IMPLÉMENTER (placeholder actuel)
- `src/components/GameScreen/GameScreen.module.css` — REMPLIR
- `src/components/GameScreen/TimerRing.tsx` — CRÉER
- `src/components/GameScreen/TimerRing.module.css` — CRÉER
- `src/components/GameScreen/BotWord.tsx` — CRÉER
- `src/components/GameScreen/BotWord.module.css` — CRÉER
- `src/components/GameScreen/WordChain.tsx` — CRÉER
- `src/components/GameScreen/WordChain.module.css` — CRÉER
- `src/components/GameScreen/WordChip.tsx` — CRÉER
- `src/components/GameScreen/WordChip.module.css` — CRÉER
- `src/components/GameScreen/ScoreDisplay.tsx` — CRÉER
- `src/components/GameScreen/ScoreDisplay.module.css` — CRÉER
- `src/components/GameScreen/GameScreen.test.tsx` — CRÉER
- `src/components/GameScreen/index.ts` — MODIFIER (ajouter exports)

**Ce que la story ne touche PAS :**
- `src/engine/` — 129 tests passants — **NE PAS TOUCHER**
- `src/game/` — stable (gameReducer, gameTypes, timer) — **NE PAS TOUCHER**
- `src/hooks/useGameState.ts` — **NE PAS TOUCHER**
- `src/hooks/useTimer.ts` — **NE PAS TOUCHER** (sera utilisé dans GameScreen, pas modifié)
- `src/components/StartScreen/` — **NE PAS TOUCHER**
- `src/components/GameOver/` — reste placeholder (Story 5.x)

### État Actuel du Projet (post Story 3.4)

```
src/
├── config/
│   ├── constants.ts        ✅ STABLE — TIMER_EASY=15, TIMER_MEDIUM=10, TIMER_HARD=6, PHONETIC_TOLERANCE=2
│   └── index.ts            ✅ STABLE — export { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD, PHONETIC_TOLERANCE }
├── engine/                 ✅ STABLE (129 tests passants)
│   ├── phonetics.ts
│   ├── botSelector.ts      ✅ selectInitialWord(graph, dictionary) + selectBotWord(syllable, graph)
│   ├── dataLoader.ts       ✅ loadGameData() → Promise<GameData>
│   └── index.ts
├── game/
│   ├── gameTypes.ts        ✅ GamePhase, Difficulty, GameState, GameAction
│   ├── gameReducer.ts      ✅ START_GAME, SUBMIT_WORD, BOT_RESPOND, TICK_TIMER, GAME_OVER, RESTART
│   ├── timer.ts            ✅ createTimer(onTick, onExpire, durationMs)
│   └── index.ts            ✅ exports: GamePhase, Difficulty, GameState, GameAction, createTimer, etc.
├── hooks/
│   ├── useGameData.ts      ✅ STABLE
│   ├── useGameState.ts     ✅ expose { state, dispatch }
│   ├── useTimer.ts         ✅ useTimer(dispatch, state) — dispatch TICK_TIMER + GAME_OVER timeout
│   └── index.ts            ✅
├── components/
│   ├── App/
│   │   ├── App.tsx         ✅ routing par phase — MODIFIER : passer state/dispatch à GameScreen
│   │   ├── App.test.tsx    ✅ 4 tests — NE PAS CASSER
│   │   └── index.ts        ✅
│   ├── StartScreen/        ✅ COMPLET — 137 tests au total (dont 8 StartScreen)
│   │   ├── StartScreen.tsx
│   │   ├── DifficultySelector.tsx
│   │   └── ...
│   ├── GameScreen/
│   │   ├── GameScreen.tsx  🔲 À IMPLÉMENTER (placeholder : 1 ligne)
│   │   ├── GameScreen.module.css 🔲 À REMPLIR (vide)
│   │   └── index.ts        🔲 À METTRE À JOUR
│   ├── GameOver/
│   │   ├── GameOver.tsx    placeholder — NE PAS MODIFIER (Story 5.x)
│   │   └── ...
│   └── shared/
│       ├── LoadingScreen.tsx  ✅ NE PAS TOUCHER
│       └── ErrorScreen.tsx   ✅ NE PAS TOUCHER
├── styles/
│   └── globals.css         ✅ COMPLET — tokens CSS disponibles
└── main.tsx                ✅ STABLE
```

### Implémentation Attendue Détaillée

#### `src/components/App/App.tsx` — Changement minimal

```tsx
// AVANT (placeholder) :
{state.phase === 'playing' && <GameScreen />}

// APRÈS (Story 3.5) :
{state.phase === 'playing' && <GameScreen state={state} dispatch={dispatch} />}
```

> **Attention App.test.tsx :** Les 4 tests existants testent LoadingScreen, ErrorScreen, StartScreen. Le test du GameScreen est probablement absent ou minimal. Vérifier que ces 4 tests passent après la modification — ils ne devraient pas être impactés car ils ne testent pas la phase `'playing'`.

#### `src/components/GameScreen/GameScreen.tsx`

```tsx
// src/components/GameScreen/GameScreen.tsx
import type { Dispatch } from 'react'
import type { GameAction, GameState, Difficulty } from '../../game'
import { useTimer } from '../../hooks'
import { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD } from '../../config'
import { TimerRing } from './TimerRing'
import { BotWord } from './BotWord'
import { WordChain } from './WordChain'
import { ScoreDisplay } from './ScoreDisplay'
import styles from './GameScreen.module.css'

// ⚠️ Fonction locale — ne PAS importer depuis game/ (gameReducer ne l'exporte pas)
function getTotalDuration(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':   return TIMER_EASY   * 1000
    case 'medium': return TIMER_MEDIUM * 1000
    case 'hard':   return TIMER_HARD   * 1000
  }
}

interface GameScreenProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function GameScreen({ state, dispatch }: GameScreenProps) {
  // useTimer gère TICK_TIMER + GAME_OVER timeout — co-localisé ici (pas dans App)
  useTimer(dispatch, state)

  const totalDuration = getTotalDuration(state.difficulty)

  return (
    <main className={styles.root}>
      <div className={styles.topRow}>
        <ScoreDisplay score={state.score} sessionRecord={state.sessionRecord} />
        <TimerRing timeLeft={state.timeLeft} totalDuration={totalDuration} />
      </div>
      <BotWord key={state.currentWord} word={state.currentWord} />
      <WordChain chain={state.chain} />
      {/* WordInput : placeholder — implémenté en Story 3.6 */}
      <div className={styles.inputPlaceholder} aria-hidden="true" />
    </main>
  )
}
```

> **Raison du `key={state.currentWord}` sur BotWord :** React recrée le composant à chaque changement de mot, ce qui déclenche l'animation CSS d'entrée automatiquement via remontage. C'est le pattern le plus simple et propre.

#### `src/components/GameScreen/TimerRing.tsx`

```tsx
// src/components/GameScreen/TimerRing.tsx
import styles from './TimerRing.module.css'

const RADIUS = 45  // rayon du cercle SVG (viewBox 100x100)
const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ≈ 282.7

interface TimerRingProps {
  timeLeft: number      // ms restants
  totalDuration: number // ms totaux (pour calculer fraction)
}

export function TimerRing({ timeLeft, totalDuration }: TimerRingProps) {
  const fraction = totalDuration > 0 ? Math.max(0, timeLeft / totalDuration) : 0
  const offset = CIRCUMFERENCE * (1 - fraction)
  const seconds = Math.ceil(timeLeft / 1000)
  const isWarning = fraction < 0.3

  return (
    <div
      className={styles.container}
      role="timer"
      aria-live="polite"
      aria-label={`Temps restant : ${seconds}s`}
    >
      <svg
        viewBox="0 0 100 100"
        className={styles.svg}
        aria-hidden="true"
      >
        {/* Track de fond */}
        <circle
          cx="50" cy="50" r={RADIUS}
          className={styles.track}
        />
        {/* Arc animé */}
        <circle
          cx="50" cy="50" r={RADIUS}
          className={`${styles.arc} ${isWarning ? styles.warning : ''}`}
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: offset,
          }}
          transform="rotate(-90 50 50)"
        />
      </svg>
      {/* Valeur numérique au centre */}
      <span className={styles.value} aria-hidden="true">
        {seconds}
      </span>
    </div>
  )
}
```

> **Géométrie SVG :** `strokeDashoffset = CIRCUMFERENCE * (1 - fraction)`. Quand fraction=1 → offset=0 (cercle plein). Quand fraction=0 → offset=CIRCUMFERENCE (cercle vide). `rotate(-90 50 50)` pour démarrer en haut (12h).

#### `src/components/GameScreen/BotWord.tsx`

```tsx
// src/components/GameScreen/BotWord.tsx
import styles from './BotWord.module.css'

interface BotWordProps {
  word: string
}

export function BotWord({ word }: BotWordProps) {
  return (
    <p
      className={styles.word}
      aria-live="assertive"
      aria-label={`Mot du bot : ${word}`}
    >
      {word}
    </p>
  )
}
```

> **Animation via remontage (key prop dans GameScreen) :** BotWord ne gère pas lui-même le changement de mot. Quand `GameScreen` rend `<BotWord key={state.currentWord} word={state.currentWord} />`, React démonte et remonte le composant à chaque nouveau mot. La classe CSS `styles.word` démarre l'animation `botWordEnter` au montage. Simple et idiomatique.

#### `src/components/GameScreen/WordChain.tsx`

```tsx
// src/components/GameScreen/WordChain.tsx
import { useRef, useEffect } from 'react'
import { WordChip } from './WordChip'
import styles from './WordChain.module.css'

interface WordChainProps {
  chain: string[]
}

export function WordChain({ chain }: WordChainProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll vers le dernier chip
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [chain.length])

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="list"
      aria-label="Chaîne de mots"
    >
      {chain.map((word, idx) => (
        <WordChip
          key={`${word}-${idx}`}
          word={word}
          isLatest={idx === chain.length - 1}
        />
      ))}
    </div>
  )
}
```

> **Note key :** `${word}-${idx}` pour éviter les doublons si le même mot apparaît plusieurs fois dans la chaîne.

#### `src/components/GameScreen/WordChip.tsx`

```tsx
// src/components/GameScreen/WordChip.tsx
import styles from './WordChip.module.css'

interface WordChipProps {
  word: string
  isLatest?: boolean
}

export function WordChip({ word, isLatest = false }: WordChipProps) {
  return (
    <span
      role="listitem"
      className={`${styles.chip} ${isLatest ? styles.latest : ''}`}
    >
      {word}
    </span>
  )
}
```

#### `src/components/GameScreen/ScoreDisplay.tsx`

```tsx
// src/components/GameScreen/ScoreDisplay.tsx
import styles from './ScoreDisplay.module.css'

interface ScoreDisplayProps {
  score: number
  sessionRecord: number
}

export function ScoreDisplay({ score, sessionRecord }: ScoreDisplayProps) {
  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <span className={styles.label}>Score</span>
        <span
          className={styles.value}
          aria-live="polite"
          aria-label={`Score : ${score}`}
        >
          {score}
        </span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Record</span>
        <span className={styles.value} aria-label={`Record de session : ${sessionRecord}`}>
          {sessionRecord}
        </span>
      </div>
    </div>
  )
}
```

### Design Tokens CSS à utiliser

```css
/* Variables globales disponibles depuis globals.css */
--color-bg:         #fafafa;   /* fond principal */
--color-surface:    #f7f7f5;   /* surfaces élevées */
--color-text:       #111111;   /* texte principal */
--color-muted:      #9ca3af;   /* labels secondaires (Score, Record) */
--color-accent:     #d97706;   /* amber — stroke TimerRing normal */
--color-accent-bg:  #fffbeb;   /* fond WordChip */
--color-border:     #e0e0e0;   /* track SVG, bordures */
--color-error:      #dc2626;   /* stroke TimerRing warning < 30% */
--font-family:      'Inter', system-ui, sans-serif;
```

### CSS Modules — Spécifications Clés

```css
/* TimerRing.module.css */
.container { position: relative; width: 120px; height: 120px; }
.svg { width: 100%; height: 100%; }
.track { fill: none; stroke: var(--color-border); stroke-width: 6; }
.arc {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 6;
  stroke-linecap: round;
  @media (prefers-reduced-motion: no-preference) {
    transition: stroke-dashoffset 100ms linear, stroke 300ms ease;
  }
}
.arc.warning { stroke: var(--color-error); }
.value {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* BotWord.module.css */
.word {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 800;
  text-align: center;
  color: var(--color-text);
  margin: 0;
  @media (prefers-reduced-motion: no-preference) {
    animation: botWordEnter 150ms ease-out;
  }
}
@keyframes botWordEnter {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

/* WordChain.module.css */
.container {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  gap: 8px;
  padding: 8px 0;
  scrollbar-width: none;  /* Firefox */
}
.container::-webkit-scrollbar { display: none; }

/* WordChip.module.css */
.chip {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--color-accent-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  white-space: nowrap;
  border: 1.5px solid transparent;
  @media (prefers-reduced-motion: no-preference) {
    animation: chipEnter 150ms ease-out;
  }
}
.chip.latest { border-color: var(--color-accent); }
@keyframes chipEnter {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}

/* ScoreDisplay.module.css */
.container {
  display: flex;
  gap: 16px;
  font-variant-numeric: tabular-nums;
}
.item { display: flex; flex-direction: column; align-items: center; }
.label { font-size: 0.75rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.value { font-size: 1.5rem; font-weight: 700; color: var(--color-text); }

/* GameScreen.module.css */
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px 16px;
  min-height: 100vh;
  max-width: 640px;
  margin: 0 auto;
}
.topRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.inputPlaceholder { height: 52px; }  /* Réservé pour Story 3.6 */
```

### Stratégie de Test

```tsx
// GameScreen.test.tsx — setup de base
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GameScreen } from './GameScreen'
import { GameDataContext } from '../App/App'
import type { GameState } from '../../game'

// ⚠️ CRITIQUE : mocker useTimer pour éviter rAF + dispatch dans les tests
vi.mock('../../hooks', () => ({
  useTimer: vi.fn(),
}))

const mockDispatch = vi.fn()
const mockState: GameState = {
  phase: 'playing',
  difficulty: 'medium',
  chain: ['chocolat', 'lapin'],
  currentWord: 'lapin',
  score: 1,
  sessionRecord: 5,
  timeLeft: 8000,   // 8s sur 10s → fraction 0.8 (pas en warning)
  lastError: null,
}
const mockGameData = {
  dictionary: new Map([['chocolat', 'ʃɔkɔla'], ['lapin', 'lapɛ̃']]),
  graph: { 'pɛ̃': ['pingouin'] },
}

function renderGameScreen(stateOverride?: Partial<GameState>) {
  const state = { ...mockState, ...stateOverride }
  return render(
    <GameDataContext.Provider value={mockGameData}>
      <GameScreen state={state} dispatch={mockDispatch} />
    </GameDataContext.Provider>
  )
}
```

### Règles Architecturales Critiques

**ARC5 — CSS Modules uniquement :**
```
✅ import styles from './TimerRing.module.css'
❌ INTERDIT — aucune lib externe de composants
❌ INTERDIT — style inline au-delà du strict minimum (ex: strokeDashoffset est acceptable via `style` car valeur dynamique)
```

**ARC9 — Barrel files obligatoires :**
```typescript
// src/components/GameScreen/index.ts — DOIT exporter :
export { GameScreen } from './GameScreen'
export { TimerRing } from './TimerRing'
export { BotWord } from './BotWord'
export { WordChain } from './WordChain'
export { WordChip } from './WordChip'
export { ScoreDisplay } from './ScoreDisplay'
```

**ARC3 — useReducer / useTimer :**
- `useTimer` est appelé DANS `GameScreen`, pas dans `App`
- Ceci co-localise la logique timer avec l'écran de jeu
- `App` ne connaît pas le timer — il passe juste `state` et `dispatch`

**Frontières architecturales :**
- `GameScreen` importe depuis `'../../game'` (types), `'../../hooks'` (useTimer), `'../../config'` (constantes)
- `GameScreen` NE DOIT PAS importer depuis `'../../engine'` directement (pas de lookup phonétique ici)
- Les sous-composants (TimerRing, BotWord, etc.) NE DOIT PAS connaître le game state global — props seulement

### Intelligence Héritée de la Story 3.4

| Leçon 3.4 | Application Story 3.5 |
|---|---|
| `useGameState` expose `{ state, dispatch }` via `useReducer` dans App | `GameScreen` reçoit `state` et `dispatch` en props depuis App |
| `GameDataContext` importé depuis `'../App/App'` — pattern établi | `GameScreen` peut utiliser ce même contexte si besoin (pas nécessaire ici) |
| Barrel files via `index.ts` | `src/components/GameScreen/index.ts` exporte tous les sous-composants |
| Imports via barrel files uniquement | `import { useTimer } from '../../hooks'`, `import { TIMER_EASY, ... } from '../../config'` |
| `key` prop pour forcer remontage (DifficultySelector) | `key={state.currentWord}` sur BotWord pour trigger l'animation d'entrée |
| `@media (prefers-reduced-motion: no-preference)` sur animations | Appliqué sur `botWordEnter`, `chipEnter`, `stroke-dashoffset transition` |
| Tests mockent les dépendances externes | `vi.mock('../../hooks')` pour isoler `useTimer` (rAF ne fonctionne pas en jsdom) |
| 137 tests passants post 3.4 | Vérifier `npm run test` : 0 régression + nouveaux tests GameScreen |
| `App.test.tsx` : 4 tests existants | Vérifier qu'ils passent après ajout des props à `<GameScreen>` |

### Interactions avec les Stories Suivantes

**Story 3.6 (WordInput)** — cette story lui prépare :
- `state.phase === 'playing'` : GameScreen déjà monté avec layout arcade
- Placeholder `<div className={styles.inputPlaceholder} />` réservé en bas du layout
- Story 3.6 remplacera ce placeholder par `<WordInput state={state} dispatch={dispatch} />`
- `state.lastError` : déjà dans GameState, sera consommé par WordInput
- `state.currentWord` : mot de référence pour la validation phonétique (selectBotWord, validateWord)

### Project Structure Notes

```
src/components/GameScreen/
├── GameScreen.tsx             ← IMPLÉMENTER (placeholder actuel)
├── GameScreen.module.css      ← REMPLIR
├── GameScreen.test.tsx        ← CRÉER
├── TimerRing.tsx              ← CRÉER
├── TimerRing.module.css       ← CRÉER
├── BotWord.tsx                ← CRÉER
├── BotWord.module.css         ← CRÉER
├── WordChain.tsx              ← CRÉER
├── WordChain.module.css       ← CRÉER
├── WordChip.tsx               ← CRÉER
├── WordChip.module.css        ← CRÉER
├── ScoreDisplay.tsx           ← CRÉER
├── ScoreDisplay.module.css    ← CRÉER
└── index.ts                   ← MODIFIER (ajouter exports)
```

**Conflit potentiel — App.tsx vs App.test.tsx :**
La modification de `<GameScreen />` → `<GameScreen state={state} dispatch={dispatch} />` dans App.tsx ne devrait pas casser `App.test.tsx` car ces tests testent les phases `'loading'`, `'error'`, et `'idle'` (StartScreen). La phase `'playing'` (GameScreen) n'est probablement pas testée dans App.test.tsx. Vérifier quand même.

**Conflit potentiel — GameScreen.test.tsx et useTimer :**
`useTimer` utilise `requestAnimationFrame` qui n'existe pas dans jsdom. **Toujours mocker `useTimer`** dans les tests GameScreen pour éviter les erreurs. Le pattern : `vi.mock('../../hooks', () => ({ useTimer: vi.fn() }))`.

### References

- [Source: epics.md#Story 3.5] — User story, AC (FR5, FR6, FR12, FR13, FR21, UX2, UX7)
- [Source: ux-design-specification.md#TimerRing] — SVG anatomy, states (idle/ticking/warning), role="timer", aria-live
- [Source: ux-design-specification.md#BotWord] — clamp(2.5rem, 8vw, 5rem), aria-live="assertive", animation d'entrée
- [Source: ux-design-specification.md#WordChain] — flex horizontal, scroll, role="list"
- [Source: ux-design-specification.md#WordChip] — pill shape, accent-bg, latest variant
- [Source: ux-design-specification.md#ScoreDisplay] — tabular-nums, aria-live="polite"
- [Source: ux-design-specification.md#Direction Retenue] — Layout Arcade, palette Light Amber verrouillée
- [Source: ux-design-specification.md#Micro-interactions] — 150ms ease-out, prefers-reduced-motion
- [Source: ux-design-specification.md#Responsive] — clamp(), max-width 640px, mobile-first
- [Source: architecture.md#Patterns de State] — ARC5 (CSS Modules), ARC9 (barrel files)
- [Source: architecture.md#Frontières Architecturales] — Composants via hooks, engine isolé
- [Source: architecture.md#Naming Patterns] — PascalCase.tsx, CSS Modules même nom
- [Source: epics.md#Additional Requirements] — ARC3 (useReducer), ARC5 (CSS Modules), ARC9 (barrel), UX7 (reduced-motion)
- [Source: hooks/useTimer.ts] — signature `useTimer(dispatch, state)`, deps: phase + currentWord
- [Source: game/gameTypes.ts] — `GameState` (timeLeft, currentWord, chain, score, sessionRecord, difficulty)
- [Source: game/gameReducer.ts] — `BOT_RESPOND` remet timeLeft via `getTimerMs(difficulty)`
- [Source: config/constants.ts] — `TIMER_EASY=15, TIMER_MEDIUM=10, TIMER_HARD=6`
- [Source: 3-4-startscreen-demarrage-sans-friction.md#Dev Notes] — 137 tests, patterns barrel, key pour animation, prefers-reduced-motion

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Aucun blocage majeur. L'ordre d'implémentation a été légèrement adapté (T2 avant T1) pour éviter les erreurs TypeScript lors de l'ajout des props à GameScreen.

### Completion Notes List

- Implémentation complète du GameScreen (layout arcade : TimerRing, ScoreDisplay, BotWord, WordChain, placeholder WordInput)
- `useTimer` co-localisé dans GameScreen, pas dans App (ARC3)
- Animation BotWord via `key={state.currentWord}` + `@keyframes botWordEnter` sous `prefers-reduced-motion: no-preference`
- TimerRing SVG : stroke amber > 30%, rouge `--color-error` < 30%, avec transition CSS conditionnelle
- WordChain scroll horizontal auto-scrollé via `useRef` + `scrollLeft`
- CSS Modules uniquement, aucune lib externe (ARC5)
- Barrel file index.ts mis à jour avec tous les exports (ARC9)
- 151 tests passants (137 existants + 14 nouveaux GameScreen), 0 régression
- [Code Review] TimerRing : ajout `data-warning` attribute pour testabilité + `Math.max(0, ...)` sur seconds
- [Code Review] GameScreen.tsx : clause `default: throw` dans getTotalDuration (défense en profondeur)
- [Code Review] Tests : T10.6 réécrit pour vérifier réellement `data-warning`, assertion `useTimer` ajoutée, label T10.3b corrigé
- [Code Review] CSS : `@keyframes` déplacés à l'intérieur des blocs `@media` dans BotWord.module.css et WordChip.module.css

### File List

- src/components/App/App.tsx (modifié)
- src/components/GameScreen/GameScreen.tsx (implémenté)
- src/components/GameScreen/GameScreen.module.css (rempli)
- src/components/GameScreen/GameScreen.test.tsx (créé)
- src/components/GameScreen/TimerRing.tsx (créé)
- src/components/GameScreen/TimerRing.module.css (créé)
- src/components/GameScreen/BotWord.tsx (créé)
- src/components/GameScreen/BotWord.module.css (créé)
- src/components/GameScreen/WordChain.tsx (créé)
- src/components/GameScreen/WordChain.module.css (créé)
- src/components/GameScreen/WordChip.tsx (créé)
- src/components/GameScreen/WordChip.module.css (créé)
- src/components/GameScreen/ScoreDisplay.tsx (créé)
- src/components/GameScreen/ScoreDisplay.module.css (créé)
- src/components/GameScreen/index.ts (modifié)

# Story 3.6 : WordInput — Saisie & Boucle de Validation Complète

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux taper mon mot et le soumettre par Entrée pour une validation instantanée,
Afin que le flux de jeu soit continu et sans friction. (FR3, FR23, FR24, FR25)

## Acceptance Criteria

**AC1 — Focus automatique & attributs accessibilité**
- **Given** le jeu est en phase `'playing'`
- **When** le `GameScreen` monte
- **Then** `WordInput` reçoit le focus automatiquement (`autofocus`) (UX3)
- **And** les attributs `inputmode="text"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"` sont présents (UX10)

**AC2 — Soumission d'un mot valide**
- **Given** je tape un mot et appuie sur Entrée
- **When** le mot est valide (bonne syllabe phonétique + dans le dictionnaire)
- **Then** l'input flashe vert pendant 150ms (FR23)
- **And** un son léger de succès est joué (FR24)
- **And** le mot est ajouté en chip à `WordChain` (via `dispatch SUBMIT_WORD isValid:true`)
- **And** le bot répond avec un nouveau mot via `selectBotWord()` → `dispatch BOT_RESPOND`
- **And** l'input se vide et reprend le focus automatiquement (UX3)
- **And** le score s'incrémente de 1 (FR12, via reducer)

**AC3 — Soumission d'un mot hors dictionnaire**
- **Given** je soumets un mot hors dictionnaire
- **When** la validation échoue avec `reason: 'not-in-dictionary'`
- **Then** l'input flashe rouge 150ms (FR23)
- **And** `ErrorMessage` affiche "Mot non reconnu dans le dictionnaire" sous l'input (FR25)
- **And** le texte de l'input est sélectionné pour correction facile
- **And** le message disparaît après 2s (UX5)
- **And** le timer continue de tourner

**AC4 — Soumission d'un mot avec mauvaise syllabe**
- **Given** je soumets un mot avec mauvaise syllabe
- **When** la validation échoue avec `reason: 'wrong-syllable'`
- **Then** `ErrorMessage` affiche "Ne commence pas par [SYLLABE]" où SYLLABE est la dernière syllabe IPA du mot courant (FR25)
- **And** le même comportement de récupération s'applique (flash rouge, texte sélectionné, message 2s)

**AC5 — Dead end phonétique**
- **Given** je soumets un mot valide
- **When** après `SUBMIT_WORD`, la dernière syllabe du mot soumis n'a aucune continuation dans `graph.json` (via `selectBotWord()` → null)
- **Then** `dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable })` est déclenché (FR26)
- **And** le jeu transite vers `GameOverScreen` (phase 'game-over')

**AC6 — Timeout**
- **Given** le timer atteint 0
- **When** aucune soumission valide n'a été faite
- **Then** `dispatch({ type: 'GAME_OVER', reason: 'timeout' })` est déclenché (FR20)
- **Note :** Ce comportement est géré par `useTimer` (déjà implémenté en Story 3.3) — WordInput n'a pas à l'implémenter, juste ne pas interférer

**AC7 — Re-focus automatique**
- **Given** une soumission (succès ou erreur)
- **When** la validation est terminée
- **Then** l'input reprend le focus automatiquement dans tous les cas (UX3)
- **And** sur succès : input vidé + re-focus
- **And** sur erreur : texte sélectionné + re-focus (prêt à corriger)

**AC8 — Tests**
- **Given** `src/components/GameScreen/WordInput.test.tsx` existe
- **When** j'exécute `npm run test`
- **Then** tous les tests passent sans régression (≥ 151 tests existants)
- **And** les tests couvrent la soumission valide, invalide, dead-end, autofocus, ErrorMessage

## Tasks / Subtasks

- [x] **T1 — Créer `src/components/GameScreen/WordInput.tsx`** (AC: 1, 2, 3, 4, 5, 7)
  - [x] T1.1 — Props : `{ state: GameState; dispatch: Dispatch<GameAction> }`
  - [x] T1.2 — Consommer `GameDataContext` avec `useContext` pour accéder à `dictionary` et `graph`
  - [x] T1.3 — `useRef<HTMLInputElement>` pour contrôler le focus programmatiquement
  - [x] T1.4 — State local : `inputValue: string`, `flashState: 'none' | 'success' | 'error'`
  - [x] T1.5 — `autofocus` + `inputmode="text"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"`
  - [x] T1.6 — `aria-label="Tape ton mot"` sur l'input
  - [x] T1.7 — Gestion `onKeyDown` : si `key === 'Enter'` → appeler `handleSubmit()`
  - [x] T1.8 — `handleSubmit()` : (a) valider avec `validateWord()`, (b) si valide → happy path, (c) si invalide → error path

- [x] **T2 — Implémenter le happy path dans WordInput** (AC: 2, 5)
  - [x] T2.1 — `dispatch({ type: 'SUBMIT_WORD', word: trimmed, isValid: true })` — ajoute le mot à la chaîne
  - [x] T2.2 — Calculer `lastSyllable` via `getLastSyllable(trimmed, dictionary, graph)`
  - [x] T2.3 — `botWord = selectBotWord(lastSyllable, graph)` — si `null` → dead-end
  - [x] T2.4 — Si dead-end : `dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: lastSyllable ?? undefined })`
  - [x] T2.5 — Sinon : `dispatch({ type: 'BOT_RESPOND', word: botWord })` — remet le timer
  - [x] T2.6 — Flash vert : `setFlashState('success')`, `setTimeout(() => setFlashState('none'), 150)`
  - [x] T2.7 — Son de succès : appeler `playSuccessSound()` (Web Audio API — voir T5)
  - [x] T2.8 — Vider l'input : `setInputValue('')`
  - [x] T2.9 — Re-focus : `inputRef.current?.focus()`

- [x] **T3 — Implémenter le error path dans WordInput** (AC: 3, 4, 7)
  - [x] T3.1 — `dispatch({ type: 'SUBMIT_WORD', word: trimmed, isValid: false, error: errorMessage })` — met à jour `state.lastError`
  - [x] T3.2 — Construire `errorMessage` : si `reason === 'not-in-dictionary'` → `"Mot non reconnu dans le dictionnaire"` ; si `reason === 'wrong-syllable'` → `"Ne commence pas par ${displaySyllable}"`
  - [x] T3.3 — Pour le message syllabe : utiliser `getLastSyllable(state.currentWord, dictionary, graph)` pour obtenir la syllabe cible (déjà dans phonetics.ts)
  - [x] T3.4 — Flash rouge : `setFlashState('error')`, `setTimeout(() => setFlashState('none'), 150)`
  - [x] T3.5 — Son d'erreur : appeler `playErrorSound()` (Web Audio API — voir T5)
  - [x] T3.6 — Sélectionner le texte : `inputRef.current?.select()`
  - [x] T3.7 — Re-focus : `inputRef.current?.focus()`
  - [x] T3.8 — `dispatch SUBMIT_WORD` suffit à mettre `state.lastError` — `ErrorMessage` consommera depuis `state.lastError` ou depuis le state local

- [x] **T4 — Créer `src/components/GameScreen/ErrorMessage.tsx`** (AC: 3, 4)
  - [x] T4.1 — Props : `{ message: string | null }`
  - [x] T4.2 — Rendu : `<p role="alert" aria-live="assertive" className={...}>{message}</p>` — caché si `message` est null
  - [x] T4.3 — Disparition auto 2s : gérée via `localError` + setTimeout dans `WordInput` (Option A recommandée)
  - [x] T4.4 — Animation fade-in 200ms entrée (respecte `prefers-reduced-motion`)
  - [x] T4.5 — Couleur `--color-error`, taille `0.875rem`, positionnement sous l'input

- [x] **T5 — Implémenter les sons Web Audio** (AC: 2, 3)
  - [x] T5.1 — Créer `src/components/GameScreen/sounds.ts`
  - [x] T5.2 — `playSuccessSound()` : `AudioContext` + oscillateur sinus, fréquence 523Hz (C5), durée 150ms, volume 0.15
  - [x] T5.3 — `playErrorSound()` : oscillateur sinus, fréquence 220Hz, durée 100ms, volume 0.1
  - [x] T5.4 — Pattern défensif : `try/catch` sur toute l'initialisation AudioContext
  - [x] T5.5 — Lazy init : créer `AudioContext` au premier appel
  - [x] T5.6 — `audioContext.resume()` avant de jouer (iOS suspend AudioContext après inactivité)

- [x] **T6 — Créer `src/components/GameScreen/WordInput.module.css`** (AC: 1, 2, 3)
  - [x] T6.1 — `.container` : flex column, width 100%
  - [x] T6.2 — `.input` : `width: 100%`, `min-height: 52px`, `font-size: 1.25rem`, `text-align: center`, border, border-radius, background
  - [x] T6.3 — `.input:focus` : `outline: 2px solid var(--color-accent)`, `outline-offset: 2px`, `border-color: var(--color-accent)`
  - [x] T6.4 — `.input.success` : `border-color: var(--color-success)` + background flash vert léger
  - [x] T6.5 — `.input.error` : `border-color: var(--color-error)` + background flash rouge léger
  - [x] T6.6 — Mobile : `font-size: 1rem` (NFR8)
  - [x] T6.7 — `@keyframes errorShake` sous `prefers-reduced-motion: no-preference`

- [x] **T7 — Créer `src/components/GameScreen/ErrorMessage.module.css`** (AC: 3, 4)
  - [x] T7.1 — `.message` : `font-size: 0.875rem`, `color: var(--color-error)`, `min-height: 1.25rem`
  - [x] T7.2 — Animation entrée 200ms fade-in : `@media (prefers-reduced-motion: no-preference)`

- [x] **T8 — Modifier `src/components/GameScreen/GameScreen.tsx`** (AC: 1)
  - [x] T8.1 — Remplacé `<div className={styles.inputPlaceholder} aria-hidden="true" />` par `<WordInput state={state} dispatch={dispatch} />`
  - [x] T8.2 — Importé `WordInput` depuis `'./WordInput'`
  - [x] T8.3 — Supprimé `inputPlaceholder` de `GameScreen.module.css`

- [x] **T9 — Mettre à jour `src/components/GameScreen/index.ts`** (AC: -)
  - [x] T9.1 — Ajouté : `export { WordInput } from './WordInput'`
  - [x] T9.2 — Ajouté : `export { ErrorMessage } from './ErrorMessage'`

- [x] **T10 — Créer `src/components/GameScreen/WordInput.test.tsx`** (AC: 8)
  - [x] T10.1 — Mock `useTimer` + mock `GameDataContext` + mock engine + mock sounds
  - [x] T10.2 — Test : `WordInput` a `autofocus` au rendu ✅
  - [x] T10.3 — Test : saisie d'un mot valide → `dispatch` appelé avec `SUBMIT_WORD isValid:true` puis `BOT_RESPOND` ✅
  - [x] T10.4 — Test : saisie d'un mot hors dictionnaire → message "Mot non reconnu" ✅
  - [x] T10.5 — Test : saisie d'un mot mauvaise syllabe → message "Ne commence pas par..." ✅
  - [x] T10.6 — Test : dead-end → `dispatch GAME_OVER reason:'dead-end'` ✅
  - [x] T10.7 — Test : input vidé après soumission réussie ✅
  - [x] T10.8 — Test : message d'erreur disparaît après 2s ✅
  - [x] T10.9 — 0 régression : 161 tests passants (151 existants + 10 nouveaux) ✅

## Dev Notes

### Contexte Critique

Story 3.6 complète la **boucle de jeu** en remplaçant le placeholder `inputPlaceholder` de Story 3.5 par le composant `WordInput` fonctionnel. C'est la pièce manquante qui rend le jeu jouable de bout en bout.

**Ce que la story crée/modifie :**
- `src/components/GameScreen/GameScreen.tsx` — MODIFIER : remplacer `<div inputPlaceholder>` par `<WordInput state={state} dispatch={dispatch} />`
- `src/components/GameScreen/GameScreen.module.css` — MODIFIER : supprimer `.inputPlaceholder`
- `src/components/GameScreen/WordInput.tsx` — CRÉER
- `src/components/GameScreen/WordInput.module.css` — CRÉER
- `src/components/GameScreen/ErrorMessage.tsx` — CRÉER
- `src/components/GameScreen/ErrorMessage.module.css` — CRÉER
- `src/components/GameScreen/sounds.ts` — CRÉER (ou inline)
- `src/components/GameScreen/WordInput.test.tsx` — CRÉER
- `src/components/GameScreen/index.ts` — MODIFIER (ajouter exports)

**Ce que la story ne touche PAS :**
- `src/engine/` — 129 tests passants — **NE PAS TOUCHER** (validateWord, getLastSyllable, selectBotWord sont stables)
- `src/game/gameReducer.ts` — **NE PAS TOUCHER** (SUBMIT_WORD, BOT_RESPOND, GAME_OVER déjà implémentés)
- `src/game/gameTypes.ts` — **NE PAS TOUCHER** (GameAction déjà contient tout le nécessaire)
- `src/hooks/useTimer.ts` — **NE PAS TOUCHER** (gère déjà TICK_TIMER et GAME_OVER timeout)
- `src/components/StartScreen/` — **NE PAS TOUCHER**
- `src/components/GameOver/` — reste placeholder (Story 5.x)
- `src/components/App/App.tsx` — **NE PAS TOUCHER** (déjà correct, passe `state` et `dispatch` à GameScreen)
- `src/components/GameScreen/TimerRing.tsx`, `BotWord.tsx`, `WordChain.tsx`, `ScoreDisplay.tsx` — **NE PAS TOUCHER**

---

### État Actuel du Projet (post Story 3.5)

```
src/
├── config/
│   ├── constants.ts        ✅ STABLE — TIMER_EASY=15, TIMER_MEDIUM=10, TIMER_HARD=6, PHONETIC_TOLERANCE=2
│   └── index.ts            ✅
├── engine/                 ✅ STABLE (129 tests passants)
│   ├── phonetics.ts        ✅ validateWord(), getLastSyllable(), getFirstSyllable(), levenshteinIPA()
│   ├── botSelector.ts      ✅ selectInitialWord(graph, dictionary) + selectBotWord(syllable, graph)
│   ├── dataLoader.ts       ✅ loadGameData() → Promise<GameData>
│   └── index.ts            ✅
├── game/
│   ├── gameTypes.ts        ✅ GamePhase, Difficulty, GameState, GameAction (SUBMIT_WORD, BOT_RESPOND, GAME_OVER...)
│   ├── gameReducer.ts      ✅ STABLE — SUBMIT_WORD, BOT_RESPOND, GAME_OVER, TICK_TIMER, RESTART
│   ├── timer.ts            ✅
│   └── index.ts            ✅
├── hooks/
│   ├── useGameData.ts      ✅ STABLE
│   ├── useGameState.ts     ✅ expose { state, dispatch }
│   ├── useTimer.ts         ✅ STABLE — dispatch TICK_TIMER + GAME_OVER timeout
│   └── index.ts            ✅
├── components/
│   ├── App/
│   │   ├── App.tsx         ✅ STABLE — GameDataContext exposé + routing par phase
│   │   └── index.ts        ✅
│   ├── StartScreen/        ✅ COMPLET
│   ├── GameScreen/
│   │   ├── GameScreen.tsx  ✅ Layout arcade — MODIFIER: remplacer inputPlaceholder par <WordInput>
│   │   ├── GameScreen.module.css  ✅ — MODIFIER: retirer .inputPlaceholder
│   │   ├── GameScreen.test.tsx  ✅ 14 tests
│   │   ├── TimerRing.tsx   ✅ NE PAS TOUCHER
│   │   ├── BotWord.tsx     ✅ NE PAS TOUCHER
│   │   ├── WordChain.tsx   ✅ NE PAS TOUCHER
│   │   ├── WordChip.tsx    ✅ NE PAS TOUCHER
│   │   ├── ScoreDisplay.tsx ✅ NE PAS TOUCHER
│   │   ├── index.ts        ✅ MODIFIER: ajouter WordInput, ErrorMessage
│   │   ├── WordInput.tsx   🔲 À CRÉER
│   │   ├── WordInput.module.css  🔲 À CRÉER
│   │   ├── ErrorMessage.tsx  🔲 À CRÉER
│   │   ├── ErrorMessage.module.css  🔲 À CRÉER
│   │   └── sounds.ts       🔲 À CRÉER
│   ├── GameOver/           placeholder — NE PAS MODIFIER (Story 5.x)
│   └── shared/
│       ├── LoadingScreen.tsx  ✅ NE PAS TOUCHER
│       └── ErrorScreen.tsx   ✅ NE PAS TOUCHER
├── styles/
│   └── globals.css         ✅ COMPLET
└── main.tsx                ✅ STABLE
```

---

### Signatures d'API Critiques

#### Engine — Fonctions à utiliser (NE PAS réimplémenter)

```typescript
// IMPORT : import { validateWord, getLastSyllable } from '../../engine'
// IMPORT : import { selectBotWord } from '../../engine'

// validateWord — retourne {valid, reason}
validateWord(
  input: string,          // mot tapé par le joueur (sera normalisé en interne)
  currentWord: string,    // state.currentWord (mot du bot affiché)
  dictionary: Map<string, string>,  // depuis GameDataContext
  graph: Record<string, string[]>,  // depuis GameDataContext
): ValidationResult  // { valid: boolean; reason: 'not-in-dictionary' | 'wrong-syllable' | null }

// getLastSyllable — clé graph de la dernière syllabe d'un mot
getLastSyllable(
  word: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>,
): string | null  // ex: "la" pour "chocolat", null si mot absent

// selectBotWord — mot bot aléatoire ou null si dead-end
selectBotWord(
  lastSyllable: string,
  graph: Record<string, string[]>,
): string | null  // null = dead-end phonétique
```

#### GameDataContext — Accès aux données

```typescript
// IMPORT : import { GameDataContext } from '../App/App'
// IMPORT : import { useContext } from 'react'

const gameData = useContext(GameDataContext)
// gameData est non-null car WordInput n'est rendu que quand phase='playing'
// et App ne monte la phase 'playing' qu'après loadGameData() succès

const { dictionary, graph } = gameData!
// dictionary : Map<string, string>  — mot → IPA
// graph : Record<string, string[]>  — syllabe → mots suivants
```

#### GameAction — Actions à dispatcher

```typescript
// SUBMIT_WORD (valide) — ajoute mot + score
dispatch({ type: 'SUBMIT_WORD', word: trimmedWord, isValid: true })

// SUBMIT_WORD (invalide) — met state.lastError
dispatch({ type: 'SUBMIT_WORD', word: trimmedWord, isValid: false, error: 'Message d\'erreur' })

// BOT_RESPOND — nouveau mot bot + reset timer
dispatch({ type: 'BOT_RESPOND', word: botWord })

// GAME_OVER — fin de partie
dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: syllable })
dispatch({ type: 'GAME_OVER', reason: 'timeout' })  // géré par useTimer — pas par WordInput
```

---

### Implémentation Attendue Détaillée

#### `src/components/GameScreen/WordInput.tsx`

```tsx
import { useState, useRef, useContext } from 'react'
import type { Dispatch } from 'react'
import type { GameAction, GameState } from '../../game'
import { validateWord, getLastSyllable, selectBotWord } from '../../engine'
import { GameDataContext } from '../App/App'
import { ErrorMessage } from './ErrorMessage'
import { playSuccessSound, playErrorSound } from './sounds'
import styles from './WordInput.module.css'

interface WordInputProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function WordInput({ state, dispatch }: WordInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [flashState, setFlashState] = useState<'none' | 'success' | 'error'>('none')
  const inputRef = useRef<HTMLInputElement>(null)
  const gameData = useContext(GameDataContext)!
  const { dictionary, graph } = gameData

  function flash(type: 'success' | 'error') {
    setFlashState(type)
    setTimeout(() => setFlashState('none'), 150)
  }

  function handleSubmit() {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    const result = validateWord(trimmed, state.currentWord, dictionary, graph)

    if (result.valid) {
      // Happy path
      dispatch({ type: 'SUBMIT_WORD', word: trimmed, isValid: true })
      flash('success')
      playSuccessSound()

      // Vérifier dead-end : la dernière syllabe du mot soumis a-t-elle des continuations ?
      const lastSyl = getLastSyllable(trimmed, dictionary, graph)
      if (!lastSyl || !selectBotWord(lastSyl, graph)) {
        dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: lastSyl ?? undefined })
      } else {
        const botWord = selectBotWord(lastSyl, graph)!
        dispatch({ type: 'BOT_RESPOND', word: botWord })
      }

      setInputValue('')
      inputRef.current?.focus()
    } else {
      // Error path
      const targetSyl = getLastSyllable(state.currentWord, dictionary, graph)
      const errorMsg = result.reason === 'not-in-dictionary'
        ? 'Mot non reconnu dans le dictionnaire'
        : `Ne commence pas par ${targetSyl ?? '?'}`

      dispatch({ type: 'SUBMIT_WORD', word: trimmed, isValid: false, error: errorMsg })
      flash('error')
      playErrorSound()
      inputRef.current?.select()
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const inputClass = [
    styles.input,
    flashState === 'success' ? styles.success : '',
    flashState === 'error' ? styles.error : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.container}>
      <input
        ref={inputRef}
        type="text"
        className={inputClass}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Tape ton mot"
        aria-describedby="word-input-error"
      />
      <ErrorMessage
        id="word-input-error"
        message={state.lastError}
      />
    </div>
  )
}
```

**⚠️ ATTENTION — Double dispatch dead-end :** Dans le happy path, `selectBotWord` est appelé 2 fois. Pour éviter ça, stocker le résultat :

```tsx
// Version optimisée (recommandée) :
const botWord = lastSyl ? selectBotWord(lastSyl, graph) : null
if (!botWord) {
  dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: lastSyl ?? undefined })
} else {
  dispatch({ type: 'BOT_RESPOND', word: botWord })
}
```

**⚠️ ATTENTION — Ordre des dispatches :** `SUBMIT_WORD` DOIT être dispatché AVANT `BOT_RESPOND` ou `GAME_OVER`. Le reducer gère `SUBMIT_WORD` uniquement quand `phase === 'playing'`. `GAME_OVER` passe la phase en 'game-over', donc le `SUBMIT_WORD` précédent ne serait pas appliqué si `GAME_OVER` passe en premier.

En réalité, dans React, les `dispatch` en série dans le même handler sont **batchés** — ils ne causent pas de re-renders intermédiaires. Le reducer est appliqué séquentiellement : `SUBMIT_WORD` d'abord, puis `GAME_OVER`. C'est correct.

---

#### `src/components/GameScreen/ErrorMessage.tsx`

```tsx
import { useEffect, useRef } from 'react'
import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  id?: string
  message: string | null
}

export function ErrorMessage({ id, message }: ErrorMessageProps) {
  // Toujours rendu pour éviter le layout shift — contenu conditionnel
  return (
    <p
      id={id}
      role="alert"
      aria-live="assertive"
      className={styles.message}
      aria-hidden={!message}
    >
      {message ?? ''}
    </p>
  )
}
```

**Note :** `state.lastError` est remis à null par `SUBMIT_WORD isValid:true` et par `START_GAME`. Le composant n'a pas besoin de gérer la disparition après 2s en interne si on s'appuie sur state — mais l'AC stipule que le message disparaît après 2s. Il y a deux approches :

**Option A (recommandée) :** Gérer le clear localement dans `WordInput` — après le flash error, `setTimeout(() => dispatch({ type: 'SUBMIT_WORD', ... }), 2000)` ne fonctionne pas car SUBMIT_WORD n'a pas de "clear error" action. Mieux : dans `WordInput`, stocker l'erreur en state local + timeout pour la clear.

**Option B :** Dans `ErrorMessage`, `useEffect` qui clear après 2s via une callback.

**Implémentation recommandée (Option A simplifié) :** Gérer `localError` dans `WordInput` qui s'efface après 2s, indépendamment de `state.lastError` :

```tsx
// Dans WordInput — state local pour l'affichage temporaire
const [localError, setLocalError] = useState<string | null>(null)

// Dans le error path :
setLocalError(errorMsg)
const timer = setTimeout(() => setLocalError(null), 2000)
// Cleanup dans useEffect si besoin

// Passer localError (pas state.lastError) à ErrorMessage
<ErrorMessage id="word-input-error" message={localError} />
```

Avantage : l'erreur s'efface après 2s sans dépendre d'une action reducer de "clear". Cohérent avec UX5.

Aussi : l'erreur doit disparaître "dès que le joueur tape le premier caractère suivant" (UX spec). Implémenter via `onChange` : `if (localError) setLocalError(null)` dans le handler `onChange`.

---

#### `src/components/GameScreen/sounds.ts`

```typescript
// src/components/GameScreen/sounds.ts
// Sons Web Audio API — synthesisés, zéro fichier externe (100% statique, FR24)

let _audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!_audioContext) {
      _audioContext = new AudioContext()
    }
    return _audioContext
  } catch {
    return null // Safari ou navigateur sans AudioContext
  }
}

function playTone(frequency: number, duration: number, volume: number): void {
  const ctx = getAudioContext()
  if (!ctx) return

  // iOS : l'AudioContext est souvent suspendu jusqu'à interaction utilisateur
  void ctx.resume().then(() => {
    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch {
      // Silently ignore si AudioContext échoue
    }
  })
}

export function playSuccessSound(): void {
  playTone(523, 0.15, 0.15) // C5, 150ms, volume léger
}

export function playErrorSound(): void {
  playTone(220, 0.10, 0.10) // La2, 100ms, buzz court
}
```

**⚠️ CRITIQUE iOS/Safari :** `AudioContext` est suspendu jusqu'à une interaction utilisateur explicite. L'appel `ctx.resume()` est obligatoire. Le pattern `void ctx.resume().then(...)` est correct et idiomatique.

**⚠️ Pattern défensif :** Tout est dans `try/catch` car certains navigateurs ou configurations peuvent rejeter l'API. Le jeu fonctionne parfaitement sans son.

---

#### `src/components/GameScreen/WordInput.module.css`

```css
.container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input {
  width: 100%;
  min-height: 52px;
  padding: 12px 16px;
  font-size: 1.25rem;
  font-family: inherit;
  font-weight: 500;
  text-align: center;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  outline: none;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.input:focus {
  border-color: var(--color-accent);
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.input.success {
  border-color: var(--color-success);
  background-color: color-mix(in srgb, var(--color-success) 10%, var(--color-surface));
}

.input.error {
  border-color: var(--color-error);
  background-color: color-mix(in srgb, var(--color-error) 10%, var(--color-surface));

  @media (prefers-reduced-motion: no-preference) {
    animation: errorShake 150ms ease-out;
  }
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes errorShake {
    0%  { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
    100% { transform: translateX(0); }
  }
}

/* Mobile */
@media (max-width: 639px) {
  .input {
    font-size: 1rem; /* ≥16px — évite le zoom automatique iOS (NFR8) */
  }
}
```

**Note `color-mix` :** Supported dans tous les navigateurs modernes (Chrome 111+, Safari 16.2+, Firefox 113+). Alternative si support legacy requis : utiliser une couleur hardcodée légère.

---

#### `src/components/GameScreen/ErrorMessage.module.css`

```css
.message {
  font-size: 0.875rem;
  color: var(--color-error);
  text-align: center;
  min-height: 1.25rem; /* Évite le layout shift — réserve l'espace même vide */
  margin: 0;

  @media (prefers-reduced-motion: no-preference) {
    animation: errorFadeIn 200ms ease-out;
  }
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes errorFadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}
```

---

### Stratégie de Test

```tsx
// WordInput.test.tsx — setup de base

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { WordInput } from './WordInput'
import { GameDataContext } from '../App/App'
import type { GameState } from '../../game'

// Mocks
vi.mock('../../hooks', () => ({
  useTimer: vi.fn(),
}))

// Mock sons — évite AudioContext en jsdom
vi.mock('./sounds', () => ({
  playSuccessSound: vi.fn(),
  playErrorSound: vi.fn(),
}))

// Mock engine — contrôler les résultats de validation
vi.mock('../../engine', () => ({
  validateWord: vi.fn(),
  getLastSyllable: vi.fn(),
  selectBotWord: vi.fn(),
  // Autres exports engine si besoin
}))

import { validateWord, getLastSyllable, selectBotWord } from '../../engine'

const mockDispatch = vi.fn()
const mockGameData = {
  dictionary: new Map([['chocolat', 'ʃokola'], ['lapin', 'lapɛ̃']]),
  graph: { 'la': ['lapin', 'lavabo'], 'pɛ̃': ['pingouin'] },
}

const mockState: GameState = {
  phase: 'playing',
  difficulty: 'medium',
  chain: ['chocolat'],
  currentWord: 'chocolat',
  score: 0,
  sessionRecord: 0,
  timeLeft: 10000,
  lastError: null,
}

function renderWordInput(stateOverride?: Partial<GameState>) {
  const state = { ...mockState, ...stateOverride }
  return render(
    <GameDataContext.Provider value={mockGameData}>
      <WordInput state={state} dispatch={mockDispatch} />
    </GameDataContext.Provider>
  )
}

describe('WordInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('a autofocus au rendu', () => {
    renderWordInput()
    const input = screen.getByRole('textbox')
    expect(document.activeElement).toBe(input)
  })

  it('soumet un mot valide correctement', async () => {
    vi.mocked(validateWord).mockReturnValue({ valid: true, reason: null })
    vi.mocked(getLastSyllable).mockReturnValue('la')
    vi.mocked(selectBotWord).mockReturnValue('lapin')

    renderWordInput()
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'lapin')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT_WORD', word: 'lapin', isValid: true })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'BOT_RESPOND', word: 'lapin' })
  })

  it('dispatche GAME_OVER sur dead-end', async () => {
    vi.mocked(validateWord).mockReturnValue({ valid: true, reason: null })
    vi.mocked(getLastSyllable).mockReturnValue('wich')
    vi.mocked(selectBotWord).mockReturnValue(null) // dead-end

    renderWordInput()
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'sandwich')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GAME_OVER',
      reason: 'dead-end',
      deadSyllable: 'wich',
    })
  })

  it('affiche un message d\'erreur sur mot hors dictionnaire', async () => {
    vi.mocked(validateWord).mockReturnValue({ valid: false, reason: 'not-in-dictionary' })

    renderWordInput()
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'blabla')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText(/Mot non reconnu/i)).toBeInTheDocument()
  })
})
```

**⚠️ `userEvent` vs `fireEvent` :** Préférer `@testing-library/user-event` pour les interactions utilisateur réalistes. Si non installé, `fireEvent.change` + `fireEvent.keyDown` fonctionnent aussi.

**⚠️ Mock engine :** Les fonctions engine (`validateWord`, `getLastSyllable`, `selectBotWord`) DOIVENT être mockées — elles dépendent de vrais JSON (dictionary, graph) qui ne sont pas disponibles en jsdom. Utiliser `vi.mock('../../engine', ...)` avec des retours contrôlés.

**⚠️ Mock sons :** `AudioContext` n'existe pas en jsdom. Toujours mocker `./sounds` pour éviter les erreurs.

---

### Design Tokens CSS disponibles (depuis globals.css)

```css
--color-bg:         #fafafa;   /* fond principal */
--color-surface:    #f7f7f5;   /* fond input (état normal) */
--color-text:       #111111;   /* texte input */
--color-muted:      #9ca3af;   /* placeholder */
--color-accent:     #d97706;   /* amber — focus outline, border focus */
--color-accent-bg:  #fffbeb;   /* fond hover léger */
--color-border:     #e0e0e0;   /* border normal */
--color-success:    #16a34a;   /* flash vert validation réussie */
--color-error:      #dc2626;   /* flash rouge + texte ErrorMessage */
```

---

### Intelligence Héritée de la Story 3.5

| Leçon 3.5 | Application Story 3.6 |
|---|---|
| `GameDataContext` importé depuis `'../App/App'` | `WordInput` consomme `useContext(GameDataContext)` pour dictionary+graph |
| CSS Modules uniquement (ARC5) | `WordInput.module.css`, `ErrorMessage.module.css` — zéro lib externe |
| Barrel files via `index.ts` (ARC9) | Ajouter `WordInput` et `ErrorMessage` dans `GameScreen/index.ts` |
| `@media (prefers-reduced-motion: no-preference)` | Animations flash + ErrorMessage fade-in uniquement sous cette media query |
| `vi.mock('../../hooks')` pour `useTimer` | Même pattern dans `WordInput.test.tsx` |
| 151 tests passants (137 + 14 GameScreen) | Vérifier `npm run test` : 0 régression |
| `key={state.currentWord}` sur BotWord | Sans rapport pour WordInput, mais pattern React établi |
| `getTotalDuration` locale dans GameScreen | `getLastSyllable` et `validateWord` importés depuis engine via barrel |
| `inputPlaceholder` placeholder `<div>` réservé | C'est ici qu'on le remplace par `<WordInput>` |
| `state.lastError` dans GameState | Exploité par ErrorMessage pour afficher le feedback d'erreur |
| Composants reçoivent `state` et `dispatch` en props | `WordInput` a exactement `{ state: GameState; dispatch: Dispatch<GameAction> }` |
| `data-warning` attribute pour testabilité (code review 3.5) | Utiliser `data-flash` ou `aria-*` sur input pour testabilité du flash state |
| Dispatch multiple dans un handler React = batché | SUBMIT_WORD + BOT_RESPOND ou GAME_OVER dans le même handler = correct |

---

### Interactions avec les Stories Suivantes

**Story 4.x (RecordBurst) :** Le record est déjà géré dans `gameReducer.ts` via `GAME_OVER` (ligne 80-83). `WordInput` n'a pas à gérer le record — il dispatch juste les actions correctes.

**Story 5.x (GameOverScreen) :** `GAME_OVER` est dispatché par WordInput (dead-end) ou useTimer (timeout). `GameOver` component n'est pas encore implémenté (placeholder), aucun impact ici.

**Story 3.x — Régression possible :** `GameScreen.test.tsx` (14 tests) teste probablement le placeholder `<div inputPlaceholder>`. Après remplacement par `<WordInput>`, certains tests pourraient nécessiter des mises à jour. Adapter en mockant WordInput si nécessaire (`vi.mock('./WordInput', () => ({ WordInput: () => <div data-testid="word-input" /> }))`).

---

### Points d'Attention Critiques

1. **`getLastSyllable` peut retourner null** : si le bot a joué un mot qui pour une raison quelconque n'est pas dans le dictionnaire (ne devrait pas arriver, mais défensif). Gérer : `if (!lastSyl) → dispatch GAME_OVER dead-end` par sécurité.

2. **`selectBotWord` appelé 2 fois** : À éviter. Stocker le résultat dans une variable locale avant de le dispatcher.

3. **Ordre dispatches dead-end** : `SUBMIT_WORD` (isValid:true) AVANT `GAME_OVER`. Le reducer ignore `GAME_OVER` si `phase !== 'playing'`, donc SUBMIT_WORD doit passer en premier. Dans React, les dispatches séquentiels dans un handler sont batchés → l'ordre est préservé → c'est safe.

4. **Focus + iOS clavier virtuel** : `autofocus` fonctionne sur desktop. Sur iOS Safari, le focus automatique peut être ignoré sauf si déclenché par une interaction utilisateur. Comportement acceptable — l'UX spec le mentionne comme edge case à tester.

5. **`inputRef.current?.focus()` après dispatch** : Les dispatches React sont asynchrones dans le sens où le re-render n'est pas immédiat. Mais `inputRef` pointe vers le vrai DOM node — `focus()` est immédiat et ne dépend pas du re-render. C'est correct.

6. **`@keyframes` dans CSS Modules** : Comme établi en 3.5, les `@keyframes` doivent être dans le bloc `@media (prefers-reduced-motion: no-preference)` — voir pattern dans `BotWord.module.css`.

7. **`color-mix`** : Alternative si non supporté : utiliser une couleur hardcodée `#f0fdf4` (vert très clair) et `#fef2f2` (rouge très clair) au lieu de `color-mix()`.

---

### Project Structure Notes

**Alignement avec la structure unifiée :**
```
src/components/GameScreen/
├── GameScreen.tsx         ← MODIFIER (remplacer placeholder)
├── GameScreen.module.css  ← MODIFIER (retirer .inputPlaceholder)
├── GameScreen.test.tsx    ← Potentiellement adapter si test du placeholder
├── TimerRing.tsx          ← NE PAS TOUCHER
├── TimerRing.module.css   ← NE PAS TOUCHER
├── BotWord.tsx            ← NE PAS TOUCHER
├── BotWord.module.css     ← NE PAS TOUCHER
├── WordChain.tsx          ← NE PAS TOUCHER
├── WordChain.module.css   ← NE PAS TOUCHER
├── WordChip.tsx           ← NE PAS TOUCHER
├── WordChip.module.css    ← NE PAS TOUCHER
├── ScoreDisplay.tsx       ← NE PAS TOUCHER
├── ScoreDisplay.module.css ← NE PAS TOUCHER
├── WordInput.tsx          ← CRÉER
├── WordInput.module.css   ← CRÉER
├── WordInput.test.tsx     ← CRÉER
├── ErrorMessage.tsx       ← CRÉER
├── ErrorMessage.module.css ← CRÉER
├── sounds.ts              ← CRÉER
└── index.ts               ← MODIFIER (ajouter exports)
```

**Conventions respectées :**
- PascalCase pour composants React (WordInput, ErrorMessage) — [Source: architecture.md#Naming Patterns]
- Même nom pour CSS Module (WordInput.module.css) — [Source: architecture.md#Naming Patterns]
- Tests co-localisés (WordInput.test.tsx dans GameScreen/) — [Source: architecture.md#Structure Patterns]
- Barrel file index.ts mis à jour — [Source: architecture.md#Patterns ARC9]
- CSS Modules uniquement, zéro lib externe — [Source: architecture.md#Patterns ARC5]

**Conflit détecté (non-bloquant) :**
- `src/components/shared/ErrorMessage.tsx` mentionné dans l'architecture comme emplacement possible. Dans ce projet, `ErrorMessage` est étroitement couplé à `WordInput` (connait `state.lastError`, timeout 2s). Le placer dans `GameScreen/` est plus cohérent avec le pattern établi en 3.5 (composants dans leur dossier parent). Décision : `GameScreen/ErrorMessage.tsx` — conforme au pattern 3.5.

### References

- [Source: epics.md#Story 3.6] — User story, AC (FR3, FR20, FR23, FR24, FR25, FR26, UX3, UX5, UX10)
- [Source: ux-design-specification.md#WordInput] — autofocus, attributs inputmode/autocomplete, flash 150ms, re-focus, disabled states
- [Source: ux-design-specification.md#ErrorMessage] — inline sous input, role="alert", aria-live="assertive", disparition 2s
- [Source: ux-design-specification.md#Feedback Patterns] — Flash vert 150ms (tick) + Flash rouge 150ms (buzz), non-bloquant
- [Source: ux-design-specification.md#Form Patterns] — Enter = submit, texte sélectionné après erreur, input vidé après succès
- [Source: ux-design-specification.md#Micro-interactions] — 150ms ease-out, 200ms errorFadeIn, prefers-reduced-motion
- [Source: ux-design-specification.md#Responsive Design] — font-size 1rem mobile (≥16px NFR8), min-height 52px (UX8)
- [Source: architecture.md#Patterns de State] — ARC5 (CSS Modules), ARC9 (barrel files), ARC10 (immutabilité)
- [Source: architecture.md#Patterns d'Erreur] — lastError via state, jamais console.error
- [Source: architecture.md#Flux de Données] — InputField → dispatch SUBMIT_WORD → botSelector → dispatch BOT_RESPOND
- [Source: engine/phonetics.ts] — validateWord(), getLastSyllable() — signatures exactes documentées
- [Source: engine/botSelector.ts] — selectBotWord(lastSyllable, graph) retourne null si dead-end
- [Source: components/App/App.tsx] — GameDataContext exposé, { dictionary, graph } accessibles via useContext
- [Source: game/gameTypes.ts] — GameAction: SUBMIT_WORD, BOT_RESPOND, GAME_OVER avec payloads exacts
- [Source: game/gameReducer.ts] — SUBMIT_WORD: lastError=null si valide, lastError=action.error si invalide
- [Source: 3-5-gamescreen-affichage-jeu-botword-scoredisplay.md#Dev Notes] — 151 tests, patterns CSS Modules, prefers-reduced-motion, placeholder inputPlaceholder à remplacer
- [Source: 3-5-gamescreen-affichage-jeu-botword-scoredisplay.md#Interactions Suivantes] — "Story 3.6 remplacera le placeholder par <WordInput state={state} dispatch={dispatch} />"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage rencontré._

### Completion Notes List

- Créé `WordInput.tsx` : composant principal avec happy/error path, flash 150ms, re-focus, gestion `localError` avec timeout 2s
- Créé `ErrorMessage.tsx` : composant `<p role="alert">` toujours rendu (évite layout shift), contenu conditionnel
- Créé `sounds.ts` : Web Audio API synthétisée, lazy init, pattern défensif iOS Safari avec `ctx.resume()`
- Créé `WordInput.module.css` : tokens CSS, flash success/error, shake animation, responsive mobile 1rem
- Créé `ErrorMessage.module.css` : fade-in 200ms, `min-height` pour éviter le layout shift
- Modifié `GameScreen.tsx` : remplacé `<div inputPlaceholder>` par `<WordInput state={state} dispatch={dispatch} />`
- Modifié `GameScreen.module.css` : supprimé `.inputPlaceholder` devenu inutile
- Modifié `index.ts` : ajouté exports `WordInput` et `ErrorMessage`
- Créé `WordInput.test.tsx` : 10 tests couvrant autofocus, soumission valide/invalide, dead-end, timeout erreur 2s, clear sur frappe
- **161 tests passants, 0 régression** (151 existants + 10 nouveaux)

### File List

- `src/components/GameScreen/WordInput.tsx` — CRÉÉ
- `src/components/GameScreen/WordInput.module.css` — CRÉÉ
- `src/components/GameScreen/WordInput.test.tsx` — CRÉÉ
- `src/components/GameScreen/ErrorMessage.tsx` — CRÉÉ
- `src/components/GameScreen/ErrorMessage.module.css` — CRÉÉ
- `src/components/GameScreen/sounds.ts` — CRÉÉ
- `src/components/GameScreen/GameScreen.tsx` — MODIFIÉ (remplacé placeholder par WordInput)
- `src/components/GameScreen/GameScreen.module.css` — MODIFIÉ (supprimé .inputPlaceholder)
- `src/components/GameScreen/index.ts` — MODIFIÉ (ajouté exports WordInput, ErrorMessage)

### Change Log

- 2026-03-10 : Story 3.6 implémentée — Composant `WordInput` créé avec boucle de validation complète (soumission, flash, sons Web Audio, ErrorMessage, dead-end, re-focus). 161 tests passants, 0 régression.
- 2026-03-10 : Code review — 7 problèmes corrigés (3 HIGH, 4 MEDIUM) :
  - [HIGH] Flash timer stocké dans `flashTimerRef`, nettoyé au démontage + annulé avant chaque nouveau flash
  - [HIGH] `aria-hidden` supprimé de `ErrorMessage` (ne jamais poser aria-hidden sur un live region)
  - [HIGH] Animation `errorFadeIn` déplacée dans `.visible` (déclenchée uniquement quand un message apparaît)
  - [MEDIUM] `data-flash={flashState}` ajouté sur l'input pour testabilité du flash state
  - [MEDIUM] Guard `isSubmittingRef` ajouté contre les doubles soumissions rapides
  - [MEDIUM] T10.7 complété : assertion re-focus ajoutée (`document.activeElement`)
  - [MEDIUM] Classe conditionnelle `.visible` sur ErrorMessage pour animation correcte

# Story 4.2 : RecordBurst — Effet Visuel Record Battu

Status: done

## Story

En tant que joueur,
Je veux un effet visuel mémorable quand je bats mon record de session,
Afin que l'accomplissement soit marquant sans interrompre le gameplay. (FR15)

## Acceptance Criteria

**AC1 — Déclenchement du burst quand le record est battu**
- **Given** je joue et mon score dépasse `sessionRecord`
- **When** le score s'incrémente (validation d'un mot valide)
- **Then** `RecordBurst` s'affiche en overlay avec le texte "Nouveau record !"
- **And** l'overlay a `pointer-events: none` — je peux continuer à taper (UX6)
- **And** `sessionRecord` dans `ScoreDisplay` se met à jour uniquement après `GAME_OVER`

**AC2 — Durée et timing de l'animation**
- **Given** le RecordBurst est déclenché
- **When** l'animation se joue
- **Then** la durée totale est 1.5s : 300ms entrée + 900ms visible + 300ms sortie
- **And** après 1.5s, l'overlay disparaît automatiquement

**AC3 — Gameplay non interrompu pendant le burst**
- **Given** le RecordBurst est actif
- **When** je soumets mon prochain mot
- **Then** le gameplay continue sans interruption
- **And** le burst termine son animation indépendamment

**AC4 — Un seul burst à la fois**
- **Given** le burst est déjà visible
- **When** je bats à nouveau le record sur le même tour (impossible logiquement, mais en guard)
- **Then** un seul overlay est affiché simultanément

**AC5 — Respect de prefers-reduced-motion**
- **Given** l'utilisateur a activé `prefers-reduced-motion`
- **When** le record est battu
- **Then** l'overlay s'affiche et disparaît sans animation CSS (apparition/disparition directe)
- **And** le texte "Nouveau record !" reste visible pendant 1.5s

**AC6 — Accessibilité**
- **Given** le RecordBurst s'affiche
- **When** un lecteur d'écran est actif
- **Then** l'élément a `role="status"` et `aria-live="polite"` (UX spec)

**AC7 — Tests**
- **Given** `RecordBurst.test.tsx` existe
- **When** j'exécute `npm run test`
- **Then** tous les tests passent sans régression (≥ 168 tests existants)

## Tasks / Subtasks

- [x] **T1 — Créer `src/components/GameScreen/RecordBurst.tsx`** (AC: 1, 2, 3, 5, 6)
  - [x] T1.1 — Props : `active: boolean` — contrôle l'affichage/déclenchement
  - [x] T1.2 — Structure JSX : `div` overlay avec `role="status"` + `aria-live="polite"` + `pointer-events: none`
  - [x] T1.3 — Texte "Nouveau record !" + animation CSS via classe `.burst` conditionnelle
  - [x] T1.4 — Composant stateless : affiche si `active=true`, retourne `null` sinon — toute la logique de timing (1500ms) est dans `GameScreen`

- [x] **T2 — Créer `src/components/GameScreen/RecordBurst.module.css`** (AC: 2, 5)
  - [x] T2.1 — `.overlay` : `position: fixed`, `inset: 0`, `display: flex` centré, `pointer-events: none`, `z-index: 100`
  - [x] T2.2 — `.message` : animation `scale + fade` via `@keyframes recordBurst` dans `@media (prefers-reduced-motion: no-preference)` — 1.5s total
  - [x] T2.3 — `@media (prefers-reduced-motion: reduce)` : `animation: none`, `transition: none`, opacity directement gérée

- [x] **T3 — Modifier `src/components/GameScreen/GameScreen.tsx`** (AC: 1, 3, 4)
  - [x] T3.1 — Ajouter `useState(false)` pour `showBurst`
  - [x] T3.2 — Ajouter `useRef` pour tracking `prevScore` + `hasBeatenRecordRef` (guard anti re-déclenchement)
  - [x] T3.3 — `useEffect` sur `state.score` : si `!hasBeatenRecord && score > prev && score > sessionRecord` → burst une seule fois par session ; reset à score=0
  - [x] T3.4 — Rendre `<RecordBurst active={showBurst} />` dans le JSX
  - [x] T3.5 — Cleanup : `clearTimeout` au démontage

- [x] **T4 — Mettre à jour `src/components/GameScreen/index.ts`** (AC: -)
  - [x] T4.1 — Ajouter `export { RecordBurst } from './RecordBurst'`

- [x] **T5 — Créer `src/components/GameScreen/RecordBurst.test.tsx`** (AC: 7)
  - [x] T5.1 — Test : `active=false` → rien affiché (overlay non visible)
  - [x] T5.2 — Test : `active=true` → texte "Nouveau record !" visible
  - [x] T5.3 — Test : présence de `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
  - [x] T5.4 — Test : présence de la classe `overlay` (pointer-events: none via CSS Module)
  - [x] T5.5 — Test : après le changement `active: false→true`, le composant s'affiche
  - [x] T5.6 — Test AC4 dans `GameScreen.test.tsx` : le burst ne se redéclenche pas après expiration

## Dev Notes

### Analyse de l'État Existant

**Ce qui est en place post-Story 4.1 :**

| Élément | Statut | Fichier |
|---|---|---|
| `state.score` — score courant | ✅ STABLE | `src/game/gameReducer.ts` |
| `state.sessionRecord` — record session | ✅ STABLE | `src/game/gameReducer.ts` |
| `SUBMIT_WORD` → `score + 1` | ✅ STABLE | `src/game/gameReducer.ts` |
| `GAME_OVER` → `sessionRecord` mis à jour | ✅ STABLE | `src/game/gameReducer.ts` |
| `GameScreen` reçoit `state` complet | ✅ STABLE | `src/components/GameScreen/GameScreen.tsx` |
| `ScoreDisplay` affiche score + record | ✅ STABLE | `src/components/GameScreen/ScoreDisplay.tsx` |

**168 tests passants actuellement. Target après story 4.2 : ≥ 173 tests.**

---

### Décision d'Implémentation : État Local vs GameState

**⚠️ DÉCISION CRITIQUE : NE PAS AJOUTER `showRecordBurst` à `GameState`**

Le `RecordBurst` est purement un effet UI éphémère. L'ajouter au reducer créerait :
1. Un state qui nécessite une action `DISMISS_RECORD_BURST` (boilerplate inutile)
2. Des complications pour reset au RESTART

**Solution retenue : état local dans `GameScreen.tsx`**

```tsx
// Dans GameScreen.tsx
const [showBurst, setShowBurst] = useState(false)
const prevScoreRef = useRef(state.score)
const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  if (state.score > prevScoreRef.current && state.score > state.sessionRecord) {
    // Record vient d'être battu sur ce coup
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
    setShowBurst(true)
    burstTimerRef.current = setTimeout(() => setShowBurst(false), 1500)
  }
  prevScoreRef.current = state.score
}, [state.score, state.sessionRecord])

// Cleanup au démontage
useEffect(() => {
  return () => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
  }
}, [])
```

**Pourquoi cette approche est correcte :**
- `sessionRecord` ne se met à jour qu'au `GAME_OVER` → pendant le jeu, `state.score > state.sessionRecord` est la condition exacte
- La comparaison avec `prevScore` garantit qu'on ne déclenche le burst qu'à chaque fois que le score s'incrémente (pas à chaque re-render)
- L'état local est approprié pour un effet UI temporaire (c.f. `flashState` dans `WordInput.tsx` — même pattern)

---

### Implémentation RecordBurst.tsx

```tsx
// src/components/GameScreen/RecordBurst.tsx
import { useEffect, useRef } from 'react'
import styles from './RecordBurst.module.css'

interface RecordBurstProps {
  active: boolean
}

export function RecordBurst({ active }: RecordBurstProps) {
  const visibleRef = useRef(false)

  useEffect(() => {
    if (active) {
      visibleRef.current = true
    }
  }, [active])

  if (!active && !visibleRef.current) return null

  return (
    <div
      className={`${styles.overlay} ${active ? styles.burst : styles.exit}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.message}>Nouveau record !</span>
    </div>
  )
}
```

> **Note architecturale simplifiée :** Le composant peut être encore plus simple — `RecordBurst` reçoit `active` et affiche conditionnellement. La logique de timing (1500ms) est entièrement dans `GameScreen`. Le composant lui-même gère uniquement l'animation CSS.

**Version la plus simple — recommandée :**

```tsx
// src/components/GameScreen/RecordBurst.tsx
import styles from './RecordBurst.module.css'

interface RecordBurstProps {
  active: boolean
}

export function RecordBurst({ active }: RecordBurstProps) {
  if (!active) return null

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
    >
      <span className={styles.message}>Nouveau record !</span>
    </div>
  )
}
```

Animation gérée uniquement dans `RecordBurst.module.css` avec `@keyframes`.

---

### Implémentation RecordBurst.module.css

```css
/* src/components/GameScreen/RecordBurst.module.css */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 100;
}

.message {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  font-weight: 800;
  color: var(--color-accent);
  text-align: center;
  padding: 0.5em 1em;
  background: var(--color-accent-bg);
  border: 2px solid var(--color-accent);
  border-radius: 12px;

  /* Animation active uniquement si reduced-motion non demandé */
  @media (prefers-reduced-motion: no-preference) {
    animation: recordBurst 1.5s ease-out forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    /* Pas d'animation — affiché directement via timing du parent */
    animation: none;
  }
}

@keyframes recordBurst {
  0%   { opacity: 0; transform: scale(0.7); }
  20%  { opacity: 1; transform: scale(1.05); }
  30%  { transform: scale(1.0); }
  80%  { opacity: 1; transform: scale(1.0); }
  100% { opacity: 0; transform: scale(0.9); }
}
```

**Timing breakdown :**
- 0% → 20% = 300ms (entrée — scale 0.7→1.05 + fade in)
- 20% → 80% = 900ms (maintien — scale 1.0, opacity 1)
- 80% → 100% = 300ms (sortie — scale 0.9, fade out)
- Total = 1500ms = 1.5s ✅ (UX spec)

---

### Intégration dans GameScreen.tsx

```tsx
// Ajouts dans GameScreen.tsx
import { useState, useRef, useEffect } from 'react'
import { RecordBurst } from './RecordBurst'

// Dans le corps du composant GameScreen :
const [showBurst, setShowBurst] = useState(false)
const prevScoreRef = useRef(0)
const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  if (state.score > prevScoreRef.current && state.score > state.sessionRecord) {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
    setShowBurst(true)
    burstTimerRef.current = setTimeout(() => setShowBurst(false), 1500)
  }
  prevScoreRef.current = state.score
}, [state.score, state.sessionRecord])

useEffect(() => {
  return () => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
  }
}, [])

// Dans le JSX retourné :
return (
  <main className={styles.root}>
    <RecordBurst active={showBurst} />
    {/* ...reste inchangé */}
  </main>
)
```

---

### Structure des Tests RecordBurst.test.tsx

```tsx
// src/components/GameScreen/RecordBurst.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RecordBurst } from './RecordBurst'

describe('RecordBurst', () => {
  it('ne rend rien quand active=false', () => {
    const { container } = render(<RecordBurst active={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche "Nouveau record !" quand active=true', () => {
    render(<RecordBurst active={true} />)
    expect(screen.getByText('Nouveau record !')).toBeInTheDocument()
  })

  it('a role="status" et aria-live="polite"', () => {
    render(<RecordBurst active={true} />)
    const overlay = screen.getByRole('status')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveAttribute('aria-live', 'polite')
  })

  it('l\'overlay a pointer-events: none (via style global ou CSS Module)', () => {
    render(<RecordBurst active={true} />)
    const overlay = screen.getByRole('status')
    // Vérification que l'overlay est bien rendu sans comportement interactif
    expect(overlay).toBeInTheDocument()
    // Note : CSS Modules ne sont pas appliqués dans jsdom — tester via classe présente
    expect(overlay.className).toContain('overlay')
  })

  it('disparaît quand active passe de true à false', () => {
    const { rerender } = render(<RecordBurst active={true} />)
    expect(screen.getByText('Nouveau record !')).toBeInTheDocument()
    rerender(<RecordBurst active={false} />)
    expect(screen.queryByText('Nouveau record !')).not.toBeInTheDocument()
  })
})
```

---

### État du Projet Post-Story 4.1

```
src/
├── config/               ✅ STABLE
├── engine/               ✅ STABLE (129 tests)
├── game/
│   ├── gameTypes.ts      ✅ STABLE — NE PAS MODIFIER
│   ├── gameReducer.ts    ✅ STABLE — NE PAS MODIFIER
│   ├── gameReducer.test.ts ✅ STABLE
│   ├── timer.ts          ✅ STABLE
│   └── index.ts          ✅ STABLE
├── hooks/                ✅ STABLE
├── components/
│   ├── App/              ✅ STABLE — NE PAS MODIFIER
│   ├── StartScreen/      ✅ STABLE — NE PAS MODIFIER
│   ├── GameScreen/
│   │   ├── GameScreen.tsx       ✅ STABLE — MODIFIER (ajouter RecordBurst)
│   │   ├── RecordBurst.tsx      🔲 CRÉER
│   │   ├── RecordBurst.module.css 🔲 CRÉER
│   │   ├── RecordBurst.test.tsx 🔲 CRÉER (5 tests)
│   │   ├── ScoreDisplay.tsx     ✅ STABLE — NE PAS MODIFIER
│   │   ├── ScoreDisplay.test.tsx ✅ STABLE
│   │   ├── TimerRing.tsx        ✅ NE PAS TOUCHER
│   │   ├── BotWord.tsx          ✅ NE PAS TOUCHER
│   │   ├── WordChain.tsx        ✅ NE PAS TOUCHER
│   │   ├── WordChip.tsx         ✅ NE PAS TOUCHER
│   │   ├── WordInput.tsx        ✅ NE PAS TOUCHER
│   │   ├── ErrorMessage.tsx     ✅ NE PAS TOUCHER
│   │   ├── sounds.ts            ✅ NE PAS TOUCHER
│   │   └── index.ts             ✅ MODIFIER (export RecordBurst)
│   ├── GameOver/         placeholder — NE PAS MODIFIER
│   └── shared/           ✅ NE PAS TOUCHER
└── styles/               ✅ STABLE
```

---

### Ce que cette Story NE Touche PAS

- **`gameTypes.ts`** — pas de nouveau champ dans `GameState`
- **`gameReducer.ts`** — zéro nouvelle action
- **`ScoreDisplay.tsx`** — `sessionRecord` continue à se mettre à jour uniquement au `GAME_OVER` (comportement voulu — le burst est déclenché AVANT la mise à jour du record)
- **Bonus orthographe / combo** — Story 4.3
- **GameOver screen** — Stories 5.x

---

### Interactions avec les Stories Suivantes

**Story 4.3 (Bonus orthographe + combo syllabe double) :**
- Modifiera `SUBMIT_WORD` pour retourner `score + 2` ou `+ 3` selon le type de match
- La logique de détection RecordBurst dans `GameScreen.tsx` fonctionnera sans modification car elle compare `state.score > state.sessionRecord` (agnostique du montant de l'incrément)

**Story 5.1 (GameOver screen) :**
- Le `sessionRecord` final sera affiché — déjà géré par `GAME_OVER` dans le reducer

---

### Project Structure Notes

**Fichiers à créer :**
- `src/components/GameScreen/RecordBurst.tsx`
- `src/components/GameScreen/RecordBurst.module.css`
- `src/components/GameScreen/RecordBurst.test.tsx` (5 tests)

**Fichiers à modifier :**
- `src/components/GameScreen/GameScreen.tsx` (ajout burst logic + `<RecordBurst>`)
- `src/components/GameScreen/index.ts` (export RecordBurst)

**Conventions respectées :**
- Test co-localisé avec le composant (ARC6)
- CSS Modules uniquement (ARC5) — zéro lib externe
- État local React pour effet UI temporaire — pas dans le reducer (état purement éphémère UI)
- Barrel file mis à jour (ARC9)
- `pointer-events: none` conforme UX6
- `prefers-reduced-motion` conforme UX7

### References

- [Source: epics.md#Story 4.2] — User story, ACs (FR15, UX6, UX7)
- [Source: ux-design-specification.md#RecordBurst] — Anatomy, states, accessibilité, timing 300+900+300ms
- [Source: ux-design-specification.md#Feedback Patterns] — RecordBurst durée 1.5s, non bloquant
- [Source: ux-design-specification.md#Overlay & Panel Patterns] — pointer-events: none, pas de backdrop
- [Source: ux-design-specification.md#Micro-interactions] — RecordBurst: 300ms entrée + 900ms maintien + 300ms sortie
- [Source: architecture.md#Patterns de State] — immutabilité, pas de mutation directe
- [Source: architecture.md#Mapping Exigences → Structure] — FR12-17 dans game/ + components/GameScreen/
- [Source: 4-1-record-de-session-persistance-localstorage.md#Interactions avec les Stories Suivantes] — "détecte que state.score > state.sessionRecord AVANT GAME_OVER"
- [Source: src/components/GameScreen/GameScreen.tsx] — structure existante (lu directement)
- [Source: src/game/gameTypes.ts] — GameState actuel, NE PAS ajouter showRecordBurst
- [Source: src/game/gameReducer.ts] — GAME_OVER met à jour sessionRecord
- [Source: src/components/GameScreen/WordInput.tsx] — pattern état local (flashState) à reproduire

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage rencontré._

### Completion Notes List

- Composant `RecordBurst` créé — version simple (active/null), logique de timing entièrement dans `GameScreen`
- CSS Module avec `@keyframes recordBurst` (300ms entrée + 900ms maintien + 300ms sortie = 1.5s total)
- `prefers-reduced-motion: reduce` → `animation: none` conforme AC5
- `pointer-events: none` sur l'overlay — gameplay non interrompu (AC3)
- `role="status"` + `aria-live="polite"` — accessibilité conforme AC6
- Logique de déclenchement dans `GameScreen` : `hasBeatenRecordRef` booléen — burst déclenché une seule fois par session, reset à score=0
- `aria-atomic="true"` ajouté sur l'overlay pour les lecteurs d'écran
- `clearTimeout` au démontage — pas de fuite mémoire
- 174 tests passants (168 existants + 5 RecordBurst + 1 AC4 GameScreen) — aucune régression

### Code Review Fixes (2026-03-10)
- **[H1 fixé]** Bug re-déclenchement burst : `hasBeatenRecordRef` remplace la condition naïve `score > sessionRecord` — le burst ne se déclenche qu'une fois par partie
- **[M1 fixé]** Test AC4 ajouté dans `GameScreen.test.tsx` (fake timers + rerender)
- **[M2 fixé]** Descriptions T1.4, T2.2, T3.2, T3.3 corrigées pour refléter l'implémentation réelle
- **[M3 fixé]** `aria-atomic="true"` ajouté sur `RecordBurst` overlay

### File List

- src/components/GameScreen/RecordBurst.tsx (créé)
- src/components/GameScreen/RecordBurst.module.css (créé)
- src/components/GameScreen/RecordBurst.test.tsx (créé)
- src/components/GameScreen/GameScreen.tsx (modifié)
- src/components/GameScreen/index.ts (modifié)

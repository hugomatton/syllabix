# Story 5.4 : DefinitionPanel — Définitions Cliquables

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux tapper sur n'importe quel mot du récap pour voir sa définition,
Afin d'apprendre de mes mots et des mots insolites du bot. (FR29)

## Acceptance Criteria

1. **Ouverture du DefinitionPanel sur clic**
   - **Given** `GameOverScreen` affiche le récap de chaîne
   - **When** je clique/tape sur un `WordChip`
   - **Then** `DefinitionPanel` s'ouvre inline sous le chip cliqué (FR29)
   - **And** il affiche le mot en titre et le texte "Définition non disponible" *(V1 — décision Hugo 2026-03-07)*
   - **And** un seul panel est ouvert à la fois

2. **Fermeture du DefinitionPanel**
   - **Given** `DefinitionPanel` est ouvert
   - **When** je clique le même chip à nouveau ou le bouton de fermeture
   - **Then** le panel se ferme

3. **Navigation clavier**
   - **Given** j'utilise la navigation clavier
   - **When** je focus un chip avec Tab et appuie sur Entrée
   - **Then** `DefinitionPanel` s'ouvre (NFR9)
   - **And** Escape le ferme

## Tasks / Subtasks

- [x] Task 1 — Rendre `WordChip` cliquable en mode récap (AC: #1, #2, #3)
  - [x] Ajouter `onClick?: (word: string) => void` et `isSelected?: boolean` à l'interface `WordChipProps`
  - [x] Quand `onClick` fourni : rendre `<button>` au lieu de `<span>`, avec `aria-label="[word] — voir définition"` et `aria-expanded={isSelected}`
  - [x] Ajouter classe `.selected` dans `WordChip.module.css` (bordure amber, fond `--color-accent-bg`)
  - [x] Conserver `role="listitem"` comportement existant quand `onClick` absent (pas de régression GameScreen)

- [x] Task 2 — Propager le callback dans `WordChain` (AC: #1, #2)
  - [x] Ajouter `onWordClick?: (word: string) => void` et `selectedWord?: string` à l'interface `WordChainProps`
  - [x] Passer `onClick` et `isSelected` à chaque `WordChip` quand `recap=true` et `onWordClick` défini

- [x] Task 3 — Créer `DefinitionPanel.tsx` (AC: #1, #2, #3)
  - [x] Créer `src/components/GameOver/DefinitionPanel.tsx`
  - [x] Props : `word: string`, `onClose: () => void`
  - [x] Structure : `<div role="dialog" aria-modal="true" aria-label="Définition de [word]">` + titre + texte + bouton fermeture
  - [x] Gérer `Escape` via `useEffect` + `keydown` listener
  - [x] Créer `src/components/GameOver/DefinitionPanel.module.css`

- [x] Task 4 — Intégrer `DefinitionPanel` dans `GameOver.tsx` (AC: #1, #2)
  - [x] Ajouter `const [selectedWord, setSelectedWord] = useState<string | null>(null)`
  - [x] Passer `onWordClick` et `selectedWord` à `WordChain`
  - [x] Afficher `<DefinitionPanel>` après `.chainSection` quand `selectedWord !== null`
  - [x] Exporter `DefinitionPanel` depuis `src/components/GameOver/index.ts`

- [x] Task 5 — Mettre à jour T5.3.5 + ajouter tests T5.4.x (AC: #1, #2, #3)
  - [x] Mettre à jour T5.3.5 : les chips en récap deviennent `role="button"` → remplacer `getAllByRole('listitem')` par `getAllByRole('button', { name: /voir définition/i })`
  - [x] T5.4.1 — `DefinitionPanel` absent au montage (aucun chip sélectionné)
  - [x] T5.4.2 — clic sur un chip ouvre le panel avec le bon mot
  - [x] T5.4.3 — clic sur le même chip ferme le panel (toggle)
  - [x] T5.4.4 — clic sur un chip différent remplace le panel (un seul panel à la fois)
  - [x] T5.4.5 — clic sur le bouton "Fermer" ferme le panel
  - [x] T5.4.6 — le panel affiche "Définition non disponible" en V1
  - [x] T5.4.7 — touche Escape ferme le panel
  - [x] T5.4.8 — chips ont `aria-expanded="true"` quand sélectionnés

## Dev Notes

### État actuel du code — ce qui existe déjà

#### `WordChip.tsx` (état post-story-5.3)

```tsx
interface WordChipProps {
  word: string
  isLatest?: boolean
  isBot?: boolean
  noAnimation?: boolean
  // ← onClick et isSelected à AJOUTER dans cette story
}

export function WordChip({ word, isLatest = false, isBot = false, noAnimation = false }: WordChipProps) {
  return (
    <span
      role="listitem"          // ← devient <button> quand onClick fourni
      className={[
        styles.chip,
        isLatest ? styles.latest : '',
        isBot ? styles.bot : '',
        noAnimation ? styles.noAnimation : '',
      ].filter(Boolean).join(' ')}
    >
      {word}
    </span>
  )
}
```

#### `WordChain.tsx` (état post-story-5.3)

```tsx
interface WordChainProps {
  chain: string[]
  recap?: boolean
  // ← onWordClick et selectedWord à AJOUTER dans cette story
}
// Passe déjà : isBot={recap ? idx % 2 === 0 : false}, noAnimation={recap}
```

#### `GameOver.tsx` (état post-story-5.3)

```tsx
// Affiche : DeadEndMessage, score, record, <WordChain chain={state.chain} recap />, Rejouer
// ← selectedWord state + DefinitionPanel à AJOUTER dans cette story
```

---

### Implémentation attendue

#### `WordChip.tsx` — nouveau rendu conditionnel

```tsx
interface WordChipProps {
  word: string
  isLatest?: boolean
  isBot?: boolean
  noAnimation?: boolean
  onClick?: (word: string) => void    // ← nouveau
  isSelected?: boolean                // ← nouveau
}

export function WordChip({
  word,
  isLatest = false,
  isBot = false,
  noAnimation = false,
  onClick,
  isSelected = false,
}: WordChipProps) {
  const className = [
    styles.chip,
    isLatest ? styles.latest : '',
    isBot ? styles.bot : '',
    noAnimation ? styles.noAnimation : '',
    isSelected ? styles.selected : '',
  ].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onClick(word)}
        aria-label={`${word} — voir définition`}
        aria-expanded={isSelected}
      >
        {word}
      </button>
    )
  }

  return (
    <span role="listitem" className={className}>
      {word}
    </span>
  )
}
```

**Pourquoi `<button>` et non `<span role="button">`** : sémantique HTML native, focus clavier et `Enter`/`Space` gérés automatiquement par le navigateur, pas de `tabIndex` ni `onKeyDown` à gérer manuellement. (ARC conforme — semantic HTML d'abord, UX spec section Accessibility)

#### `WordChip.module.css` — ajout classe `.selected`

```css
/* Ajouter après .chip.bot : */
.chip.selected {
  border-color: var(--color-accent);
  background: var(--color-accent-bg);
  color: var(--color-text);
}
```

#### `WordChain.tsx` — nouveau

```tsx
interface WordChainProps {
  chain: string[]
  recap?: boolean
  onWordClick?: (word: string) => void    // ← nouveau
  selectedWord?: string | null            // ← nouveau
}

export function WordChain({ chain, recap = false, onWordClick, selectedWord }: WordChainProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!recap && containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [chain.length, recap])

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
          isLatest={!recap && idx === chain.length - 1}
          isBot={recap ? idx % 2 === 0 : false}
          noAnimation={recap}
          onClick={recap ? onWordClick : undefined}
          isSelected={recap && selectedWord === word}
        />
      ))}
    </div>
  )
}
```

**Note :** `isSelected={recap && selectedWord === word}` — si deux mots identiques dans la chaîne, tous les chips avec ce mot seront visuellement sélectionnés, mais le panel n'en affiche qu'un. C'est acceptable en V1 (edge case rare).

#### `DefinitionPanel.tsx` — nouveau composant

```tsx
import { useEffect } from 'react'
import styles from './DefinitionPanel.module.css'

interface DefinitionPanelProps {
  word: string
  onClose: () => void
}

export function DefinitionPanel({ word, onClose }: DefinitionPanelProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Définition de ${word}`}
      className={styles.panel}
    >
      <div className={styles.header}>
        <h3 className={styles.word}>{word}</h3>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer la définition"
        >
          ✕
        </button>
      </div>
      <p className={styles.definition}>Définition non disponible</p>
    </div>
  )
}
```

#### `DefinitionPanel.module.css` — nouveau

```css
.panel {
  width: 100%;
  max-width: 560px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.word {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.closeButton {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-muted);
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
  min-height: 32px;
  min-width: 32px;
}

.closeButton:hover {
  color: var(--color-text);
}

.closeButton:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.definition {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .panel {
    animation: panelEnter 150ms ease-out;
  }

  @keyframes panelEnter {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

#### `GameOver.tsx` — modifications

```tsx
import { useState, type Dispatch } from 'react'
import type { GameState, GameAction } from '../../game/gameTypes'
import styles from './GameOver.module.css'
import { DeadEndMessage } from './DeadEndMessage'
import { DefinitionPanel } from './DefinitionPanel'
import { WordChain } from '../GameScreen'

interface GameOverProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function GameOver({ state, dispatch }: GameOverProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  function handleWordClick(word: string) {
    setSelectedWord(prev => prev === word ? null : word)
  }

  return (
    <div className={styles.root}>
      {state.gameOverReason === 'dead-end' && state.deadSyllable && (
        <DeadEndMessage syllable={state.deadSyllable} />
      )}
      <p className={styles.label} id="gameover-score-label">Score final</p>
      <p className={styles.score} aria-labelledby="gameover-score-label">{state.score}</p>
      <p className={styles.record}>Record : {state.sessionRecord}</p>
      {state.chain.length > 0 && (
        <div className={styles.chainSection}>
          <p className={`${styles.label} ${styles.chainLabel}`}>Chaîne</p>
          <WordChain
            chain={state.chain}
            recap
            onWordClick={handleWordClick}
            selectedWord={selectedWord}
          />
        </div>
      )}
      {selectedWord !== null && (
        <DefinitionPanel
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
      <button
        type="button"
        className={styles.playButton}
        onClick={() => dispatch({ type: 'RESTART' })}
      >
        Rejouer
      </button>
    </div>
  )
}
```

---

### Mise à jour obligatoire de T5.3.5

Le test T5.3.5 dans `GameOver.test.tsx` sera cassé par cette story car les chips en mode récap deviennent `<button>` (plus `role="listitem"`).

**Avant (story 5.3) :**
```tsx
it('T5.3.5 — chips d\'index pair (bot) ont la classe "bot", index impair (joueur) non', () => {
  renderGameOver({ ...baseState, chain: ['chocolat', 'lapin', 'nuit'] })
  const chips = screen.getAllByRole('listitem')          // ← NE MARCHE PLUS
  expect(chips[0].className).toMatch(/bot/)
  ...
})
```

**Après (story 5.4) :**
```tsx
it('T5.3.5 — chips d\'index pair (bot) ont la classe "bot", index impair (joueur) non', () => {
  renderGameOver({ ...baseState, chain: ['chocolat', 'lapin', 'nuit'] })
  // Les chips en recap sont des <button> — queryable via aria-label
  const chips = screen.getAllByRole('button', { name: /voir définition/i })
  expect(chips[0].className).toMatch(/bot/)   // index 0 → bot
  expect(chips[1].className).not.toMatch(/bot/) // index 1 → joueur
  expect(chips[2].className).toMatch(/bot/)   // index 2 → bot
})
```

---

### Prévention des régressions

#### Mode jeu (GameScreen) — CRITIQUE : ne pas toucher

```tsx
// GameScreen.tsx — usage existant, NE PAS MODIFIER
<WordChain chain={state.chain} />
// recap=false par défaut → onWordClick=undefined → chips restent des <span role="listitem">
// AUCUN changement de comportement en mode jeu
```

Les tests existants de `GameScreen.test.tsx` et `WordChain.test.tsx` testent des `role="listitem"` — ils **ne doivent pas être modifiés** (mode jeu hors scope).

#### Tests à vérifier après implémentation

- `GameOver.test.tsx` — T5.3.5 à mettre à jour (voir ci-dessus)
- `WordChain.test.tsx` — tester uniquement les NOUVEAUX comportements recap si `onWordClick` est fourni
- `GameScreen.test.tsx` — doit passer sans modification
- Nombre de tests total attendu : 225+ (était 225 après story 5.3)

---

### Fichiers à créer / modifier — liste exhaustive

```
CRÉER :
  src/components/GameOver/DefinitionPanel.tsx
  src/components/GameOver/DefinitionPanel.module.css
  src/components/GameOver/DefinitionPanel.test.tsx    ← tests T5.4.x (optionnel ici ou dans GameOver.test.tsx)

MODIFIER :
  src/components/GameScreen/WordChip.tsx              ← onClick, isSelected, render conditionnel <button>
  src/components/GameScreen/WordChip.module.css       ← .selected class
  src/components/GameScreen/WordChain.tsx             ← onWordClick, selectedWord props
  src/components/GameOver/GameOver.tsx                ← selectedWord state, onWordClick, DefinitionPanel
  src/components/GameOver/GameOver.test.tsx           ← mise à jour T5.3.5 + ajout T5.4.x
  src/components/GameOver/index.ts                    ← exporter DefinitionPanel

NE PAS TOUCHER :
  src/game/gameReducer.ts        ← rien à changer, state.chain déjà correct
  src/game/gameTypes.ts          ← rien à changer
  src/components/GameScreen/index.ts   ← WordChain et WordChip déjà exportés
  src/components/GameScreen/WordChain.test.tsx  ← mode jeu non impacté
  src/components/GameScreen/GameScreen.tsx      ← usage de WordChain inchangé
```

---

### Règles architecture à respecter

- **CSS Modules uniquement** — zéro `style={}` inline (ARC5)
- **PascalCase** pour composants et `*.module.css` même nom
- **Barrel files** : exporter `DefinitionPanel` depuis `src/components/GameOver/index.ts` (ARC9)
- **Immutabilité** : utiliser `useState` setter fonctionnel `prev => prev === word ? null : word`
- **Animations** : `@keyframes` dans `@media (prefers-reduced-motion: no-preference)` (UX7)
- **Semantic HTML** : `<button>` pour éléments interactifs, jamais `<div onClick>`
- **ARIA** : `role="dialog"`, `aria-modal="true"`, `aria-label`, `aria-expanded` selon UX spec

---

### Scope strict de cette story

**In scope story 5.4 :**
- Rendre les chips cliquables en mode récap
- DefinitionPanel inline avec "Définition non disponible" (V1)
- Un seul panel ouvert à la fois
- Navigation clavier (Tab, Enter, Escape)

**Out of scope (V2 ou histoire séparée) :**
- Appel API / LLM pour vraies définitions
- DefinitionPanel avec focus trap complet (focus revient sur le chip à la fermeture)
- Animation de fermeture du panel (slide-up)

---

### Variables CSS disponibles (`globals.css`)

```
--color-bg:        #fafafa
--color-surface:   #f7f7f5   ← fond DefinitionPanel
--color-text:      #111111
--color-muted:     #9ca3af   ← texte "Définition non disponible"
--color-accent:    #d97706
--color-accent-bg: #fffbeb   ← fond chips sélectionnés
--color-border:    #e0e0e0   ← bordure DefinitionPanel
--color-success:   #16a34a
--color-error:     #dc2626
```

---

### Raisonnement sur la localisation du DefinitionPanel

L'UX spec dit "inline sous le chip cliqué". Dans la chaîne horizontale scrollable, afficher le panel littéralement sous le chip serait complexe (position absolute dans un overflow scroll). La décision architecturale V1 : le panel s'affiche **après `.chainSection`**, pleine largeur. C'est ce que le AC dit aussi : "s'ouvre inline sous le chip cliqué" → interprété comme "sous la section chaîne", pas dans le flux horizontal. Conforme au pattern OverlayPanel de l'UX spec : "inline sous la chaîne".

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.4] — Acceptance criteria complets
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#DefinitionPanel] — `role="dialog"`, `aria-modal`, `aria-label`, focus trap, Escape
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#WordChip] — `role="button"`, `aria-label="[MOT] — voir définition"` en mode cliquable
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Overlay-Panel-Patterns] — inline sous la chaîne, 1 seul panel, fermeture par clic chip ou croix
- [Source: _bmad-output/planning-artifacts/architecture.md#Patterns-d-Implementation] — CSS Modules, barrel files, semantic HTML, pas de mutation state directe
- [Source: _bmad-output/implementation-artifacts/5-3-wordchain-recap-chaine-complete.md#Dev-Notes] — État exact de WordChip, WordChain, GameOver post-story-5.3
- [Source: src/components/GameScreen/WordChip.tsx] — Interface actuelle (word, isLatest, isBot, noAnimation)
- [Source: src/components/GameScreen/WordChain.tsx] — Interface actuelle (chain, recap)
- [Source: src/components/GameOver/GameOver.tsx] — Structure JSX actuelle
- [Source: src/components/GameOver/GameOver.test.tsx] — T5.3.5 à mettre à jour (getAllByRole listitem → button)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage._

### Completion Notes List

- Implémenté `WordChip` avec rendu conditionnel `<button>` / `<span>` selon présence de `onClick`
- `WordChain` propage `onWordClick` et `selectedWord` aux chips uniquement en mode `recap`
- `DefinitionPanel` créé avec `role="dialog"`, gestion Escape via `useEffect`
- `GameOver` intègre state `selectedWord` avec toggle : clic même chip ferme, clic différent remplace
- T5.3.5 mis à jour : `getAllByRole('listitem')` → `getAllByRole('button', { name: /voir définition/i })`
- 8 nouveaux tests T5.4.x ajoutés — tous verts
- Total : 233 tests, 0 régression

**Corrections code review (2026-03-11) :**
- [HIGH-1] `WordChain` : chips cliquables enveloppés dans `<span role="listitem">` — ARIA list sémantique correcte
- [HIGH-2] `DefinitionPanel` : suppression `aria-modal="true"` (panel inline sans focus trap), ajout `useRef` + `focus()` au montage + `tabIndex={-1}`
- [MEDIUM-1] `GameOver` : `handleWordClick` et `handleClose` wrappés dans `useCallback` — stabilité des références
- [MEDIUM-2] couvert par HIGH-2 (focus géré à l'ouverture)

### File List

- src/components/GameScreen/WordChip.tsx (modifié)
- src/components/GameScreen/WordChip.module.css (modifié)
- src/components/GameScreen/WordChain.tsx (modifié)
- src/components/GameOver/DefinitionPanel.tsx (créé)
- src/components/GameOver/DefinitionPanel.module.css (créé)
- src/components/GameOver/GameOver.tsx (modifié)
- src/components/GameOver/GameOver.test.tsx (modifié)
- src/components/GameOver/index.ts (modifié)

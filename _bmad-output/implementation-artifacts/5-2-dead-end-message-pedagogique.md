# Story 5.2 : Dead End — Message Pédagogique

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux comprendre pourquoi mon mot a terminé la partie,
Afin d'apprendre quelque chose d'intéressant plutôt que de me sentir lésé. (FR26, FR27)

## Acceptance Criteria

1. **DeadEndMessage affiché en cas de dead end**
   - **Given** la partie s'est terminée par un dead end
   - **When** `GameOverScreen` s'affiche
   - **Then** `DeadEndMessage` est affiché de façon proéminente avant le récap (FR27)
   - **And** le message lit : "Aucun mot français ne commence par '[SYLLABE]' — fin de chaîne !"
   - **And** la syllabe problématique est en gras amber
   - **And** le ton est informatif, pas punitif

2. **DeadEndMessage absent en cas de timeout**
   - **Given** la partie s'est terminée par timeout
   - **When** `GameOverScreen` s'affiche
   - **Then** `DeadEndMessage` n'est PAS affiché
   - **And** l'écran montre uniquement score + record + Rejouer

## Tasks / Subtasks

- [x] Task 1 — Créer `DeadEndMessage.tsx` dans `src/components/GameOver/` (AC: #1)
  - [x] Prop `syllable: string` — la syllabe bloquante
  - [x] Afficher le texte avec la syllabe en `<strong>` amber
  - [x] `role="status"` sur le conteneur (UX spec)

- [x] Task 2 — Créer `DeadEndMessage.module.css` (AC: #1)
  - [x] Fond `--color-accent-bg` (#fffbeb), bordure amber `--color-accent`
  - [x] Texte `--color-text`, syllabe `<strong>` en `--color-accent` et `font-weight: 700`
  - [x] `border-radius: 8px`, `padding: 12px 16px`, `width: 100%`, `max-width: 560px`

- [x] Task 3 — Intégrer `DeadEndMessage` dans `GameOver.tsx` (AC: #1, #2)
  - [x] Afficher conditionnellement : `state.gameOverReason === 'dead-end' && state.deadSyllable`
  - [x] Placer avant la section score (position proéminente)
  - [x] Exporter `DeadEndMessage` via `src/components/GameOver/index.ts`

- [x] Task 4 — Tests T5.2.x dans `GameOver.test.tsx` (AC: #1, #2)
  - [x] T5.2.1 — message affiché quand `gameOverReason === 'dead-end'`
  - [x] T5.2.2 — syllabe apparaît dans le message
  - [x] T5.2.3 — message absent quand `gameOverReason === 'timeout'`
  - [x] T5.2.4 — `role="status"` présent sur le composant

## Dev Notes

### État actuel de `GameOver.tsx`

Le composant existe et affiche score, record, bouton Rejouer — mais **pas de `DeadEndMessage`** :

```tsx
// src/components/GameOver/GameOver.tsx — état actuel
export function GameOver({ state, dispatch }: GameOverProps) {
  return (
    <div className={styles.root}>
      <p className={styles.label} id="gameover-score-label">Score final</p>
      <p className={styles.score} aria-labelledby="gameover-score-label">{state.score}</p>
      <p className={styles.record}>Record : {state.sessionRecord}</p>
      <button type="button" className={styles.playButton} onClick={() => dispatch({ type: 'RESTART' })}>
        Rejouer
      </button>
    </div>
  )
}
```

### Données disponibles dans `GameState`

```ts
state.gameOverReason  // 'timeout' | 'dead-end' | undefined
state.deadSyllable    // string | undefined — syllabe IPA bloquante (ex: "wɪtʃ")
// Source: src/game/gameTypes.ts
```

Ces champs sont peuplés par l'action `GAME_OVER` dans `gameReducer.ts` :
```ts
case 'GAME_OVER':
  return {
    ...state,
    phase: 'game-over',
    gameOverReason: action.reason,
    deadSyllable: action.deadSyllable,  // transmis depuis WordInput via botSelector
  }
```

### Fichiers à créer/modifier

```
CRÉER :
  src/components/GameOver/DeadEndMessage.tsx
  src/components/GameOver/DeadEndMessage.module.css

MODIFIER :
  src/components/GameOver/GameOver.tsx         ← intégration conditionnelle
  src/components/GameOver/index.ts             ← ajouter export DeadEndMessage
  src/components/GameOver/GameOver.test.tsx    ← tests T5.2.x

NE PAS TOUCHER :
  src/game/gameReducer.ts   ← GAME_OVER déjà peuplé
  src/game/gameTypes.ts     ← gameOverReason et deadSyllable déjà définis
```

### Implémentation attendue pour `DeadEndMessage.tsx`

```tsx
// src/components/GameOver/DeadEndMessage.tsx
import styles from './DeadEndMessage.module.css'

interface DeadEndMessageProps {
  syllable: string
}

export function DeadEndMessage({ syllable }: DeadEndMessageProps) {
  return (
    <div role="status" className={styles.container}>
      <p className={styles.text}>
        Aucun mot français ne commence par <strong className={styles.syllable}>{syllable}</strong> — fin de chaîne !
      </p>
    </div>
  )
}
```

### Implémentation attendue pour `DeadEndMessage.module.css`

```css
.container {
  background: var(--color-accent-bg);   /* #fffbeb amber très clair */
  border: 1.5px solid var(--color-accent); /* #d97706 */
  border-radius: 8px;
  padding: 12px 16px;
  width: 100%;
  max-width: 560px;
  box-sizing: border-box;
}

.text {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.5;
}

.syllable {
  color: var(--color-accent);
  font-weight: 700;
}
```

### Intégration dans `GameOver.tsx`

```tsx
import { DeadEndMessage } from './DeadEndMessage'

// Dans le JSX, avant le score :
{state.gameOverReason === 'dead-end' && state.deadSyllable && (
  <DeadEndMessage syllable={state.deadSyllable} />
)}
```

### Export `index.ts` à mettre à jour

```ts
// src/components/GameOver/index.ts — après modification
export { GameOver } from './GameOver'
export { DeadEndMessage } from './DeadEndMessage'
```

### Impact sur story 5.3

Story 5.3 (WordChain récap) ajoutera aussi du contenu dans `GameOver.tsx`. L'ordre visuel final attendu dans `GameOver` :

```
1. DeadEndMessage (conditionnel — dead end uniquement) ← story 5.2
2. Score final                                          ← story 5.1
3. Record de session                                    ← story 5.1
4. WordChain récap (chaîne complète)                    ← story 5.3
5. Bouton Rejouer                                       ← story 5.1
```

**Le dev story 5.2 ne doit PAS ajouter le `WordChain` récap** — c'est story 5.3.

### Règles architecture (ARC5, ARC9)

- **CSS Modules uniquement** — zéro `style={}` inline
- **PascalCase** pour `DeadEndMessage.tsx` + `DeadEndMessage.module.css` même nom
- **Barrel file obligatoire** — ajouter export dans `src/components/GameOver/index.ts`
- **Tests co-localisés** — dans `GameOver.test.tsx` (même fichier, ajout des T5.2.x)

### Variables CSS disponibles (`globals.css`)

```
--color-accent-bg: #fffbeb   ← fond du message
--color-accent:    #d97706   ← bordure + syllabe en gras
--color-text:      #111111   ← texte du message
```

### Ton du message (UX spec)

> "Aucun mot français ne commence par '[SYLLABE]' — fin de chaîne !"

- **Informatif, pas punitif** — constater un fait linguistique, pas accuser le joueur
- Pas de "❌ Erreur" ni "Tu as perdu parce que..."
- La syllabe en gras met en valeur la curiosité (dead end = phénomène phonétique intéressant)

### Prévention de régression

- Les tests existants T5.1.x dans `GameOver.test.tsx` utilisent `gameOverReason: 'timeout'` → `DeadEndMessage` ne doit PAS s'afficher dans ces cas → vérifier que le conditionnel est correct
- Le bouton "Rejouer" et le score doivent continuer à fonctionner identiquement

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.2] — Acceptance criteria complets
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#DeadEndMessage] — `role="status"`, fond amber, syllabe en gras, ton informatif
- [Source: _bmad-output/planning-artifacts/architecture.md#Mapping-Exigences-Structure] — `src/components/GameOver/` pour FR26-30
- [Source: src/game/gameTypes.ts] — `gameOverReason`, `deadSyllable` dans `GameState`
- [Source: src/game/gameReducer.ts] — Action `GAME_OVER` ligne 78-91
- [Source: src/components/GameOver/GameOver.tsx] — État actuel, point d'intégration
- [Source: src/components/GameOver/index.ts] — Barrel file à compléter

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage rencontré. Implémentation directe selon les specs de la story.

### Completion Notes List

- Créé `DeadEndMessage.tsx` avec prop `syllable: string` et `role="status"` sur le conteneur
- Créé `DeadEndMessage.module.css` avec variables CSS `--color-accent-bg`, `--color-accent`, `--color-text`
- Intégré dans `GameOver.tsx` avec affichage conditionnel `gameOverReason === 'dead-end' && deadSyllable`
- Mis à jour `index.ts` (barrel file) avec l'export `DeadEndMessage`
- Ajouté 4 tests T5.2.x dans `GameOver.test.tsx` — tous passent
- 208 tests au total — 0 régression

**Corrections code review (3 issues) :**
- [H1 WCAG] Couleur syllabe `#b45309` (ratio 4.8:1 ✓) au lieu de `--color-accent` (#d97706, ratio 3.1:1 insuffisant) — `DeadEndMessage.module.css`
- [M1] Ajout test T5.2.5 — edge case `gameOverReason === 'dead-end'` sans `deadSyllable` — `GameOver.test.tsx`
- [M2] T5.2.4 déplacé dans un `describe('DeadEndMessage')` dédié pour clarté de maintenance — `GameOver.test.tsx`

### File List

- src/components/GameOver/DeadEndMessage.tsx (créé)
- src/components/GameOver/DeadEndMessage.module.css (créé)
- src/components/GameOver/GameOver.tsx (modifié)
- src/components/GameOver/index.ts (modifié)
- src/components/GameOver/GameOver.test.tsx (modifié)

# Story 5.1 : GameOver Screen — Résumé & Rejouer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux voir mon score final et relancer facilement,
Afin que la fin de partie soit une transition naturelle vers une nouvelle session. (FR28, FR30)

## Acceptance Criteria

1. **Affichage GameOverScreen (phase game-over)**
   - **Given** la phase de jeu est 'game-over'
   - **When** `GameOverScreen` s'affiche
   - **Then** le score final est affiché de façon proéminente
   - **And** le record de session est affiché
   - **And** un bouton "Rejouer" proéminent est visible (FR30)
   - **And** cliquer "Rejouer" dispatche `RESTART` et retourne au StartScreen

2. **Réinitialisation au RESTART**
   - **Given** je clique "Rejouer"
   - **When** le jeu se réinitialise
   - **Then** `chain`, `score`, `currentWord`, `lastError` sont remis à zéro
   - **And** `sessionRecord` est préservé depuis localStorage
   - **And** le StartScreen s'affiche immédiatement (phase revient à 'idle')

3. **Mobile touch target**
   - **Given** l'écran sur mobile
   - **When** je tape "Rejouer"
   - **Then** le bouton a `min-height: 44px` et répond immédiatement (UX8)

## Tasks / Subtasks

- [x] Task 1 — Mettre à jour `App.tsx` pour passer `state` et `dispatch` à `GameOver` (AC: #1)
  - [x] Ajouter `state: GameState` et `dispatch: Dispatch<GameAction>` en props de `GameOver`
  - [x] Mettre à jour `App.tsx` : `<GameOver state={state} dispatch={dispatch} />`

- [x] Task 2 — Implémenter `GameOver.tsx` avec score, record et bouton Rejouer (AC: #1, #2, #3)
  - [x] Afficher `state.score` de façon proéminente (grand titre)
  - [x] Afficher `state.sessionRecord`
  - [x] Bouton "Rejouer" avec `min-height: 44px`, click → `dispatch({ type: 'RESTART' })`
  - [x] La phase reviendra automatiquement à 'idle' via le reducer existant

- [x] Task 3 — Styler `GameOver.module.css` (AC: #1, #3)
  - [x] Layout centré, score en grand (`font-size: clamp(3rem, 10vw, 6rem)`)
  - [x] Bouton "Rejouer" avec styles cohérents avec le bouton "Jouer" de StartScreen (`playButton`)
  - [x] `min-height: 44px` sur le bouton (UX8)
  - [x] Responsive 320px+ (NFR10)

- [x] Task 4 — Vérifier que `RESTART` dans le reducer fonctionne correctement (AC: #2)
  - [x] Confirmer que `gameReducer.ts` `RESTART` action réinitialise à `createInitialState()` et préserve `sessionRecord` ← déjà implémenté, lecture seule

## Dev Notes

### Contexte critique : État actuel du code

**`GameOver.tsx` est un stub** — fichier existant à remplacer :
```tsx
// AVANT (stub actuel)
export function GameOver() {
  return <div className={styles.root}>GameOver</div>
}
```

**`App.tsx` passe zéro props à `GameOver`** — à mettre à jour :
```tsx
// AVANT (App.tsx ligne 44)
{state.phase === 'game-over' && <GameOver />}

// APRÈS (à modifier)
{state.phase === 'game-over' && <GameOver state={state} dispatch={dispatch} />}
```

### Reducer RESTART déjà correct

Le `gameReducer.ts` gère déjà `RESTART` :
```ts
case 'RESTART':
  return {
    ...createInitialState(),
    sessionRecord: state.sessionRecord,  // ← record préservé
  }
```
`createInitialState()` lit `localStorage.getItem('syllabix-record')` mais le state.sessionRecord override cela. Phase revient à `'idle'` automatiquement → StartScreen s'affiche.

### GameState disponible pour GameOver

```ts
// Champs pertinents pour story 5.1
state.score          // score final
state.sessionRecord  // meilleur score session
state.gameOverReason // 'timeout' | 'dead-end' (utilisé en story 5.2)
state.deadSyllable   // syllabe bloquante (utilisé en story 5.2)
state.chain          // chaîne complète (utilisé en story 5.3)
```

### Patterns à suivre (architecture.md)

- **CSS Modules** uniquement — zéro lib externe
- **Nommage** : composant PascalCase, CSS `.module.css` même nom
- **Barrel file** `src/components/GameOver/index.ts` existe déjà avec `export { GameOver }`
- **Pas d'état local** pour la logique métier — tout passe via props `state` + `dispatch`
- **Immutabilité** : ne jamais muter state, uniquement dispatcher

### Pattern stylistique de référence

Référencer `StartScreen.module.css` pour le bouton "Jouer" existant :
```css
/* src/components/StartScreen/StartScreen.module.css — à consulter */
/* Le bouton "Jouer" est le modèle visuel pour "Rejouer" */
```

Variables CSS disponibles (`globals.css`) :
```
--color-bg: #fafafa
--color-text: #111111
--color-accent: #d97706
--color-accent-bg: #fffbeb
--color-muted: #9ca3af
--color-surface: #f7f7f5
```

### Structure de projet : fichiers à modifier/créer

```
MODIFIER :
  src/components/App/App.tsx                    ← ajouter props state/dispatch à <GameOver>
  src/components/GameOver/GameOver.tsx          ← remplacer le stub
  src/components/GameOver/GameOver.module.css   ← actuellement vide (.root {})

NE PAS TOUCHER :
  src/game/gameReducer.ts       ← RESTART déjà correct
  src/components/GameOver/index.ts  ← export déjà correct
```

### Scope de cette story (boundaries strictes)

**In scope story 5.1 :**
- Score final affiché
- Record session affiché
- Bouton Rejouer fonctionnel (dispatch RESTART)
- Styles de base centrés, responsifs

**Out of scope story 5.1 (faire en 5.2, 5.3, 5.4) :**
- `DeadEndMessage` (story 5.2)
- `WordChain` récap (story 5.3)
- `DefinitionPanel` (story 5.4)
- Tout affichage de `gameOverReason` / `deadSyllable` / `chain`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1] — Acceptance criteria complets
- [Source: _bmad-output/planning-artifacts/architecture.md#Patterns-d-Implementation] — Nommage, CSS Modules, barrel files
- [Source: _bmad-output/planning-artifacts/architecture.md#Mapping-Exigences-Structure] — `src/components/GameOver/` pour FR26-30
- [Source: src/game/gameReducer.ts] — Action RESTART ligne 93-97
- [Source: src/game/gameTypes.ts] — `GameState`, `GameAction` types
- [Source: src/components/App/App.tsx] — Point d'intégration, ligne 44 à modifier
- [Source: src/components/GameOver/GameOver.tsx] — Stub actuel à remplacer
- [Source: src/components/StartScreen/StartScreen.tsx] — Pattern de référence pour structure et style

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage. Tests RED → GREEN → suite complète 204/204 verts.

### Completion Notes List

- Task 1 : `App.tsx` mis à jour — `<GameOver state={state} dispatch={dispatch} />` ligne 44
- Task 2 : `GameOver.tsx` remplacé — affiche `state.score` (gros titre), `state.sessionRecord`, bouton "Rejouer" dispatche `{ type: 'RESTART' }`
- Task 3 : `GameOver.module.css` stylisté — layout centré flex-column, score `clamp(3rem, 10vw, 6rem)`, bouton `min-height: 44px`, responsive 380px
- Task 4 : Reducer `RESTART` confirmé correct (lecture seule — déjà implémenté en story 3.2)
- 7 nouveaux tests unitaires ajoutés dans `GameOver.test.tsx`
- Aucune régression : 204/204 tests passent

### Code Review Fixes (2026-03-10)

- [M1] `GameOver.test.tsx` T5.1.5 — commentaire clarifié : test de contrat de classe CSS (JSDOM ne calcule pas les valeurs CSS réelles)
- [M2] `GameOver.module.css` — couleur bouton passée de `var(--color-accent)` (#d97706, ratio 3.1:1) à `#b45309` (ratio ~4.56:1) → WCAG AA ✓ ; **note : StartScreen.module.css a le même problème de contraste, hors scope story 5.1**
- [M3] `GameOver.tsx` — `aria-labelledby` ajouté sur le `<p>` score + `id` sur le label → association sémantique pour lecteurs d'écran
- [L1] `GameOver.tsx` — `type="button"` explicite sur le bouton Rejouer
- [L2] `GameOver.test.tsx` T5.1.7 — nom corrigé et valeurs fixées (`score: 15, sessionRecord: 10`) pour tester réellement le cas "record inférieur au score"

### File List

- src/components/App/App.tsx
- src/components/GameOver/GameOver.tsx
- src/components/GameOver/GameOver.module.css
- src/components/GameOver/GameOver.test.tsx

## Change Log

- 2026-03-10 : Implémentation story 5.1 — GameOver Screen (score, record, bouton Rejouer)

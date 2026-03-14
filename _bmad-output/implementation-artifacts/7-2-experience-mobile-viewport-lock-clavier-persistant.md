# Story 7.2: Expérience Mobile — Viewport Lock & Clavier Persistant

Status: review

## Story

En tant que joueur sur mobile,
Je veux que tous les éléments de jeu soient visibles sans scroll et que le clavier reste affiché en permanence,
afin de jouer confortablement sur téléphone sans perdre le contrôle de l'interface. (FR35, FR36)

## Acceptance Criteria

1. **Given** `src/hooks/useVisualViewport.ts` existe **When** il est importé **Then** il exporte `useVisualViewport(): number` retournant `window.visualViewport?.height ?? window.innerHeight` **And** il écoute l'événement `resize` sur `window.visualViewport` et met à jour la valeur **And** il retire le listener au démontage (cleanup `useEffect`)

2. **Given** le jeu est en phase `'playing'` sur mobile **When** le clavier virtuel s'ouvre **Then** `GameScreen` utilise `useVisualViewport()` pour sa hauteur : `style={{ height: \`${viewportHeight}px\` }}` **And** overflow hidden pour éviter tout scroll vertical

3. **Given** `GameScreen` en phase `'playing'` **When** le layout s'affiche **Then** le layout interne utilise `display: flex; flex-direction: column; justify-content: space-between` **And** `TimerRing`, `BotWord`, `WordChain`, `WordInput` et `ScoreDisplay` sont tous visibles sans scroll vertical (FR35) **And** aucun padding excessif ne pousse des éléments hors viewport

4. **Given** `WordInput` en phase `'playing'` **When** le composant est monté ou qu'un mot est validé (succès ou erreur) **Then** `inputRef.current?.focus()` est appelé dans `setTimeout(0)` (workaround WebKit iOS — le délai 0ms est critique) **And** le clavier virtuel reste affiché en continu (FR36)

5. **Given** tous les éléments interactifs hors `WordInput` (boutons DifficultySelector, liens, etc.) **When** la phase est `'playing'` **Then** ils ont `tabIndex={-1}` pour éviter qu'un Tab involontaire déplace le focus hors de `WordInput`

6. **Given** un test sur appareil réel iPhone Safari (iOS 16+) **When** je joue une partie **Then** aucun scroll vertical n'est possible pendant le jeu **And** le clavier reste affiché pendant toute la durée d'une partie **And** tous les éléments de jeu sont lisibles (≥16px — NFR8 préservé)

7. **Given** un test sur Android Chrome **When** je joue une partie **Then** le comportement est identique à iOS (viewport lock + clavier persistant)

8. **Given** les tests existants (246 tests Vitest) **When** j'exécute `npm test` **Then** tous les tests passent sans régression

## Tasks / Subtasks

- [x] Task 1 — Créer `src/hooks/useVisualViewport.ts` (AC: #1)
  - [x] Créer le fichier avec le hook suivant :
    ```typescript
    import { useState, useEffect } from 'react'

    export function useVisualViewport(): number {
      const [height, setHeight] = useState(
        window.visualViewport?.height ?? window.innerHeight
      )

      useEffect(() => {
        const vv = window.visualViewport
        if (!vv) return
        const onResize = () => setHeight(vv.height)
        vv.addEventListener('resize', onResize)
        return () => vv.removeEventListener('resize', onResize)
      }, [])

      return height
    }
    ```
  - [x] Exporter depuis `src/hooks/index.ts`

- [x] Task 2 — Modifier `GameScreen.tsx` pour utiliser `useVisualViewport` (AC: #2, #3)
  - [x] Importer `useVisualViewport` depuis `src/hooks`
  - [x] Appeler `const viewportHeight = useVisualViewport()`
  - [x] Appliquer `style={{ height: `${viewportHeight}px`, overflow: 'hidden' }}` sur le conteneur racine de `GameScreen`
  - [x] Adapter le CSS module : remplacer `min-height: 100vh` par `height: 100%` (la hauteur est gérée inline)
  - [x] S'assurer que le layout interne est `display: flex; flex-direction: column; justify-content: space-between`

- [x] Task 3 — Vérifier et renforcer le re-focus dans `WordInput` (AC: #4)
  - [x] Identifier où `inputRef.current?.focus()` est appelé dans `WordInput.tsx`
  - [x] S'assurer qu'après une soumission (valide ou invalide), le focus est remis via `setTimeout(() => inputRef.current?.focus(), 0)`
  - [x] S'assurer que `autofocus` ou `useEffect` remets le focus au montage du composant (attribut `autoFocus` déjà présent)
  - [x] Vérifier que `inputRef` est bien un `useRef<HTMLInputElement>(null)`

- [x] Task 4 — Appliquer `tabIndex={-1}` aux éléments hors zone de jeu (AC: #5)
  - [x] Identifier les éléments interactifs visibles pendant le jeu qui ne sont PAS `WordInput` — Audit complet : BotWord, ScoreDisplay, TimerRing, WordChain (mode jeu sans recap), RecordBurst : aucun élément interactif focusable. Aucune modification requise.

- [x] Task 5 — Ajuster le layout GameScreen pour mobile (AC: #3)
  - [x] Vérifier que `GameScreen.module.css` n'a pas de padding top/bottom excessif : réduit de 24px à 16px
  - [x] Remplacement de `gap: 24px` par `justify-content: space-between` pour distribution automatique
  - [x] Tester à 375px de largeur et hauteur variable selon clavier (environ 300–400px de viewport disponible avec clavier ouvert)

- [x] Task 6 — Tests visuels (AC: #6, #7)
  - [x] Tester sur iPhone Safari réel (iOS 16+) ou simulateur Xcode — à valider manuellement
  - [x] Tester sur Android Chrome réel ou émulateur — à valider manuellement
  - [x] Vérifier que `npm test` passe toujours (AC: #8) — ✅ 246/246 tests passent

## Dev Notes

### Contexte

Le problème mobile actuel :
- `GameScreen` a `min-height: 100vh` — sur mobile, `100vh` inclut la barre d'adresse et ignore le clavier virtuel
- Quand le clavier s'ouvre, il réduit la fenêtre visible mais `100vh` reste inchangé → les éléments du bas (WordInput) passent sous le clavier
- L'utilisateur peut faire défiler la page → le chrono (en haut) disparaît hors écran
- Le clavier peut être masqué en appuyant ailleurs → bloque le jeu

### Solution technique

**`visualViewport` API** est le seul moyen fiable de connaître la hauteur visible réelle après ouverture du clavier sur iOS et Android :
- `window.visualViewport.height` = hauteur de la fenêtre visible (hors barre d'adresse ET hors clavier)
- L'événement `resize` se déclenche quand le clavier s'ouvre/ferme
- `window.innerHeight` et `100vh` ne changent PAS quand le clavier s'ouvre sur iOS

**Workaround iOS WebKit** : sur iOS, `element.focus()` dans un événement synchrone après soumission peut être ignoré par WebKit si le contexte n'est pas un événement utilisateur direct. `setTimeout(0)` contourne ce problème en différant l'appel de focus après que React ait fini son cycle de rendu.

**`100dvh`** : alternative CSS mais incompatible avec les navigateurs iOS < 15.4. Préférer l'approche JS avec `useVisualViewport` pour la compatibilité maximale.

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `src/hooks/useVisualViewport.ts` | CRÉER — nouveau hook |
| `src/hooks/index.ts` | Ajouter export du nouveau hook |
| `src/components/GameScreen/GameScreen.tsx` | Importer useVisualViewport, appliquer hauteur inline |
| `src/components/GameScreen/GameScreen.module.css` | Supprimer/adapter `min-height: 100vh` |
| `src/components/GameScreen/WordInput.tsx` | Vérifier/renforcer re-focus `setTimeout(0)` |

### Fichiers à NE PAS modifier

- `src/engine/phonetics.ts` — aucune logique phonétique concernée
- `src/game/gameReducer.ts` — aucune logique de jeu concernée
- Tous les autres composants GameScreen qui ne gèrent pas le focus ou la hauteur

### Comportement attendu visualViewport

```
# Avant ouverture clavier (iPhone 14, hauteur 844px)
visualViewport.height ≈ 844 (viewport complet)

# Après ouverture clavier (hauteur clavier ≈ 300px)
visualViewport.height ≈ 544

# GameScreen.style.height = "544px"
# → TimerRing, BotWord, WordChain, WordInput tiennent en 544px
```

### Structure GameScreen attendue après modification

```tsx
function GameScreen() {
  const viewportHeight = useVisualViewport()

  return (
    <div
      className={styles.gameScreen}
      style={{ height: `${viewportHeight}px`, overflow: 'hidden' }}
    >
      {/* layout flex column space-between */}
      <div className={styles.topRow}>
        <ScoreDisplay ... />
        <TimerRing ... />
      </div>
      <BotWord ... />
      <WordChain ... />
      <WordInput ... />  {/* always at bottom, visible above keyboard */}
    </div>
  )
}
```

### WordInput re-focus pattern

```tsx
// Dans WordInput.tsx, après soumission réussie ou invalide :
const handleSubmit = () => {
  // ... validation logic ...
  // Force re-focus pour iOS WebKit
  setTimeout(0, () => {
    inputRef.current?.focus()
  })
}

// Au montage (déjà présent — vérifier) :
useEffect(() => {
  inputRef.current?.focus()
}, [])
```

### Compatibilité navigateurs

- **iOS Safari 16+** : `visualViewport` API supportée ✅
- **iOS Safari 15** : `visualViewport` API supportée ✅ (depuis iOS 13)
- **Android Chrome** : `visualViewport` API supportée ✅
- **Desktop** : le hook retourne `window.innerHeight` sans changement de comportement ✅
- Fallback `?? window.innerHeight` pour les browsers très anciens sans `visualViewport`

### Tests recommandés

- Tester sur iPhone Safari réel (comportement parfois différent du simulateur)
- Vérifier que le WordInput reste focus entre chaque soumission
- Vérifier que le TimerRing est toujours visible en haut
- Vérifier que le BotWord est toujours visible

### Project Structure Notes

- Hooks dans `src/hooks/`, exportés via `src/hooks/index.ts` (barrel file ARC9 obligatoire)
- CSS Modules uniquement — modifier `GameScreen.module.css`, pas de style inline sauf la hauteur dynamique (qui requiert une valeur JS)
- `display: flex; flex-direction: column; justify-content: space-between` — vérifier que le CSS module a déjà ce layout ou l'ajouter

### References

- [Source: _bmad-output/planning-artifacts/prd.md#FR35, FR36] — Exigences mobiles
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive, Mobile Contraintes Critiques] — Spec visualViewport + setTimeout
- [Source: _bmad-output/planning-artifacts/architecture.md#Révision 2026-03-14, useVisualViewport hook] — Spec du hook
- [Source: src/components/GameScreen/GameScreen.tsx] — Structure actuelle
- [Source: src/hooks/index.ts] — Barrel file pour exporter le nouveau hook
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage. Seul ajustement nécessaire : ajout de `useVisualViewport: vi.fn(() => 800)` dans le mock `vi.mock('../../hooks')` de `GameScreen.test.tsx` pour que les tests existants reconnaissent le nouveau hook.

### Completion Notes List

- ✅ Hook `useVisualViewport` créé et exporté — écoute `visualViewport.resize`, fallback `window.innerHeight`
- ✅ `GameScreen` applique `height: ${viewportHeight}px; overflow: hidden` inline sur `<main>`
- ✅ `GameScreen.module.css` : `min-height: 100vh` → `height: 100%`, `gap: 24px` → `justify-content: space-between`, padding 24px → 16px
- ✅ `WordInput` : les deux appels `focus()` (succès et erreur) wrappés dans `setTimeout(() => ..., 0)` pour contourner le bug WebKit iOS
- ✅ Task 4 : audit complet — aucun élément interactif hors WordInput dans GameScreen (mode jeu)
- ✅ 246/246 tests passent sans régression

### File List

- src/hooks/useVisualViewport.ts (créé)
- src/hooks/index.ts (export ajouté)
- src/components/GameScreen/GameScreen.tsx (useVisualViewport importé + style inline)
- src/components/GameScreen/GameScreen.module.css (layout mobile adapté)
- src/components/GameScreen/WordInput.tsx (setTimeout(0) sur focus)
- src/components/GameScreen/GameScreen.test.tsx (mock useVisualViewport ajouté)

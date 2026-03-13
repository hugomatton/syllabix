# Story 5.3 : WordChain Récap — Chaîne Complète

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux voir tous les mots de ma chaîne en fin de partie,
Afin de revoir ma performance et découvrir les mots inconnus. (FR28)

## Acceptance Criteria

1. **Chaîne complète affichée en GameOverScreen**
   - **Given** la partie est terminée
   - **When** `GameOverScreen` s'affiche
   - **Then** `WordChain` affiche tous les mots de la chaîne complète en chips (FR28)
   - **And** la chaîne entière est visible (scrollable si longue)
   - **And** les mots du joueur et du bot sont visuellement distinguables

2. **Scrollabilité sur chaîne longue**
   - **Given** la chaîne est longue (>10 mots)
   - **When** je visualise le récap
   - **Then** je peux scroller à travers tous les mots
   - **And** le layout ne casse pas sur mobile (320px)

## Tasks / Subtasks

- [x] Task 1 — Ajouter prop `isBot?: boolean` à `WordChip` (AC: #1)
  - [x] Ajouter `isBot?: boolean = false` à l'interface `WordChipProps`
  - [x] Appliquer la classe `.bot` quand `isBot === true` dans le JSX
  - [x] Ajouter style `.bot` dans `WordChip.module.css` (fond `--color-surface`, bordure `--color-border`)

- [x] Task 2 — Ajouter prop `recap?: boolean` à `WordChain` (AC: #1, #2)
  - [x] Ajouter `recap?: boolean = false` à l'interface `WordChainProps`
  - [x] Quand `recap=true` : supprimer auto-scroll (`useEffect` conditionnel sur `!recap`)
  - [x] Quand `recap=true` : calculer `isBot` depuis index parity (`idx % 2 === 0`) et passer à `WordChip`
  - [x] Quand `recap=true` : ne pas passer `isLatest` (tous les chips en état neutre sauf distinction joueur/bot)

- [x] Task 3 — Intégrer `WordChain` dans `GameOver.tsx` (AC: #1, #2)
  - [x] Importer `WordChain` depuis `'../GameScreen'`
  - [x] Afficher `<WordChain chain={state.chain} recap />` si `state.chain.length > 0`
  - [x] Ajouter section avec label "Chaîne" dans le JSX
  - [x] Styler la section chaîne dans `GameOver.module.css`

- [x] Task 4 — Tests unitaires T5.3.x dans `GameOver.test.tsx` (AC: #1, #2)
  - [x] T5.3.1 — `WordChain` affiché quand chaîne non-vide
  - [x] T5.3.2 — chips contiennent les bons mots
  - [x] T5.3.3 — `WordChain` non-affiché si chaîne vide
  - [x] T5.3.4 — vérifier le `role="list"` et `aria-label` de `WordChain`

## Dev Notes

### Règle critique : ordre des mots dans `state.chain`

```
START_GAME     → chain = [firstWord]          ← bot (index 0)
SUBMIT_WORD    → chain = [...chain, playerWord] ← joueur (index 1, 3, 5, ...)
BOT_RESPOND    → chain = [...chain, botWord]   ← bot    (index 2, 4, 6, ...)
```

**Règle de parité :** `idx % 2 === 0` → mot du bot / `idx % 2 === 1` → mot du joueur

### Fichiers à modifier — liste exhaustive

```
MODIFIER :
  src/components/GameScreen/WordChip.tsx          ← ajouter isBot prop
  src/components/GameScreen/WordChip.module.css   ← ajouter .bot class
  src/components/GameScreen/WordChain.tsx         ← ajouter recap prop
  src/components/GameOver/GameOver.tsx            ← afficher WordChain recap
  src/components/GameOver/GameOver.module.css     ← styles section chaîne
  src/components/GameOver/GameOver.test.tsx       ← tests T5.3.x

NE PAS TOUCHER :
  src/game/gameReducer.ts      ← state.chain déjà correctement peuplé
  src/game/gameTypes.ts        ← chain: string[] suffit — pas de type nouveau
  src/components/GameScreen/index.ts  ← WordChain et WordChip déjà exportés
```

### État actuel des composants concernés

**`WordChip.tsx` (actuel) :**
```tsx
interface WordChipProps {
  word: string
  isLatest?: boolean        // ← seule prop actuellement
}
// Rendu : <span role="listitem" className={`${styles.chip} ${isLatest ? styles.latest : ''}`}>{word}</span>
```

**`WordChip.module.css` (actuel) :**
```css
.chip        → fond --color-accent-bg (#fffbeb amber), border transparent
.chip.latest → border-color: var(--color-accent)
/* PAS de classe .bot encore */
```

**`WordChain.tsx` (actuel) :**
```tsx
interface WordChainProps {
  chain: string[]           // ← seule prop actuellement
}
// useEffect → auto-scroll à droite à chaque changement de chain.length
// Rendu : chips avec isLatest={idx === chain.length - 1}
```

**`GameOver.tsx` (actuel) :**
```tsx
// Affiche : score, record session, bouton Rejouer
// N'affiche PAS state.chain — c'est ce qu'on ajoute dans cette story
```

### Implémentation attendue pour `WordChip.tsx`

```tsx
interface WordChipProps {
  word: string
  isLatest?: boolean
  isBot?: boolean           // ← nouveau
}

export function WordChip({ word, isLatest = false, isBot = false }: WordChipProps) {
  return (
    <span
      role="listitem"
      className={[
        styles.chip,
        isLatest ? styles.latest : '',
        isBot ? styles.bot : '',
      ].filter(Boolean).join(' ')}
    >
      {word}
    </span>
  )
}
```

### Implémentation attendue pour `WordChain.tsx`

```tsx
interface WordChainProps {
  chain: string[]
  recap?: boolean           // ← nouveau — désactive auto-scroll, active distinction joueur/bot
}

export function WordChain({ chain, recap = false }: WordChainProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!recap && containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [chain.length, recap])

  return (
    <div ref={containerRef} className={styles.container} role="list" aria-label="Chaîne de mots">
      {chain.map((word, idx) => (
        <WordChip
          key={`${word}-${idx}`}
          word={word}
          isLatest={!recap && idx === chain.length - 1}
          isBot={recap ? idx % 2 === 0 : false}
        />
      ))}
    </div>
  )
}
```

### Implémentation attendue pour `WordChip.module.css` (ajout uniquement)

```css
/* Ajouter après .chip.latest : */
.chip.bot {
  background: var(--color-surface);    /* #f7f7f5 — fond neutre */
  border-color: var(--color-border);   /* #e0e0e0 — bordure subtile */
  color: var(--color-muted);           /* #9ca3af — légèrement atténué */
}
```

### Intégration dans `GameOver.tsx`

```tsx
import { WordChain } from '../GameScreen'

// Dans le JSX, entre le record et le bouton Rejouer :
{state.chain.length > 0 && (
  <div className={styles.chainSection}>
    <p className={styles.chainLabel}>Chaîne</p>
    <WordChain chain={state.chain} recap />
  </div>
)}
```

### Styles `GameOver.module.css` à ajouter

```css
.chainSection {
  width: 100%;
  max-width: 560px;
}

.chainLabel {
  font-size: 1rem;
  color: var(--color-muted);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Règles architecture à respecter (ARC5, ARC9, ARC10)

- **CSS Modules uniquement** — zéro `style={}` inline, zéro lib externe
- **PascalCase** pour composants, `.module.css` même nom
- **Barrel files** : `GameScreen/index.ts` déjà exporte `WordChain` et `WordChip` — ne pas toucher
- **GameOver/index.ts** exporte déjà `GameOver` — ne pas toucher
- **Immutabilité** : aucune mutation de `state.chain`
- **Animations** : tout `@keyframes` dans `@media (prefers-reduced-motion: no-preference)` (UX7)

### Prévention des régressions (CRITIQUE)

**Mode jeu (GameScreen) :** `WordChain` y est utilisé SANS la prop `recap`. Le comportement actuel (auto-scroll, `isLatest` sur le dernier chip) **ne doit pas changer**.

```tsx
// GameScreen.tsx — usage existant, NE PAS MODIFIER
<WordChain chain={state.chain} />   // recap=false par défaut → comportement inchangé
```

**Vérifier que les tests existants de `GameScreen.test.tsx` passent toujours** après modification de `WordChain`.

### Scope strict de cette story

**In scope story 5.3 :**
- Afficher tous les mots de `state.chain` comme chips dans `GameOver`
- Distinction visuelle bot (fond neutre) / joueur (fond amber)
- Scrollable si chaîne longue
- Responsive mobile 320px

**Out of scope (story 5.4) :**
- `DefinitionPanel` — cliquer sur un chip pour voir la définition
- Rendre les chips cliquables (`role="button"`, `onClick`, `aria-label="voir définition"`)
- Tout fetch externe pour les définitions

### Variables CSS disponibles (`globals.css`)

```
--color-bg:        #fafafa
--color-surface:   #f7f7f5   ← fond bot chips
--color-text:      #111111
--color-muted:     #9ca3af   ← texte bot chips
--color-accent:    #d97706
--color-accent-bg: #fffbeb   ← fond joueur chips (déjà dans .chip)
--color-border:    #e0e0e0   ← bordure bot chips
--color-success:   #16a34a
--color-error:     #dc2626
```

### Contexte story 5.2 (précédente — pas de fichier story)

La story 5.2 (DeadEndMessage) est marquée "done" dans sprint-status mais n'a pas de fichier d'artefact. Inspecter le code existant pour vérifier si `DeadEndMessage` est déjà dans `GameOver.tsx`. Si oui, ne pas perturber son affichage en ajoutant la section `WordChain`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.3] — Acceptance criteria complets
- [Source: _bmad-output/planning-artifacts/architecture.md#Patterns-d-Implementation] — Nommage, CSS Modules, barrel files
- [Source: _bmad-output/planning-artifacts/architecture.md#Mapping-Exigences-Structure] — `src/components/GameOver/` pour FR26-30
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#WordChain] — `role="list"`, `aria-label="Chaîne de mots"`, `aria-label="[MOT] — voir définition"` (story 5.4)
- [Source: src/game/gameReducer.ts] — Logique de peuplement de `state.chain` (START_GAME, SUBMIT_WORD, BOT_RESPOND)
- [Source: src/game/gameTypes.ts] — `chain: string[]` dans `GameState`
- [Source: src/components/GameScreen/WordChain.tsx] — Composant existant à étendre
- [Source: src/components/GameScreen/WordChip.tsx] — Composant existant à étendre
- [Source: src/components/GameScreen/WordChip.module.css] — Styles existants à compléter
- [Source: src/components/GameOver/GameOver.tsx] — Intégration de WordChain récap

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage — implémentation directe selon les specs de la story.

### Completion Notes List

- ✅ Task 1 : Prop `isBot` ajoutée à `WordChip` avec classe CSS `.bot` (fond `--color-surface`, bordure `--color-border`, texte `--color-muted`)
- ✅ Task 2 : Prop `recap` ajoutée à `WordChain` — désactive l'auto-scroll et active la distinction bot/joueur par parité d'index
- ✅ Task 3 : `WordChain recap` intégré dans `GameOver.tsx` entre le record et le bouton Rejouer, affiché seulement si `state.chain.length > 0`
- ✅ Task 4 : 4 tests T5.3.x ajoutés dans `GameOver.test.tsx` — tous passent
- ✅ Aucune régression : 225 tests passent (15 fichiers)
- ✅ Mode jeu (GameScreen) non impacté — `WordChain` sans `recap` garde son comportement d'auto-scroll
- ✅ [Code Review] H1 : test T5.3.5 ajouté — vérifie la distinction visuelle bot/joueur par classe CSS
- ✅ [Code Review] H2 : `WordChain.test.tsx` créé — 9 tests couvrant le mode recap (isBot, noLatest, noAnimation)
- ✅ [Code Review] M1 : prop `noAnimation` ajoutée à `WordChip` — animation `chipEnter` désactivée en mode recap
- ✅ [Code Review] M2 : affordance de scroll ajoutée (gradient fade droit) dans `.chainSection::after`
- ✅ [Code Review] M3 : `.chainLabel` réduit à `margin` seulement — `.label` appliqué via JSX (supprime 5 propriétés dupliquées)

### File List

- src/components/GameScreen/WordChip.tsx
- src/components/GameScreen/WordChip.module.css
- src/components/GameScreen/WordChain.tsx
- src/components/GameScreen/WordChain.test.tsx
- src/components/GameOver/GameOver.tsx
- src/components/GameOver/GameOver.module.css
- src/components/GameOver/GameOver.test.tsx

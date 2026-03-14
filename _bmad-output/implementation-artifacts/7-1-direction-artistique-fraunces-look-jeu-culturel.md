# Story 7.1: Direction Artistique — Fraunces + Look "Jeu Culturel"

Status: done

## Story

En tant que joueur,
Je veux une interface visuellement distincte, dans l'esthétique des jeux culturels comme Pedantix/Semantix,
afin que Syllabix ait une identité propre, loin des codes SaaS génériques.

## Acceptance Criteria

1. **Given** `index.html` charge les fonts **When** la page se charge **Then** Fraunces (variable, weight 700) et Inter sont chargées via Google Fonts avec `<link rel="preconnect">` + feuille CSS `family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;500;600;700`

2. **Given** `src/styles/globals.css` **When** je l'inspecte **Then** `--font-display: 'Fraunces', Georgia, serif` et `--font-ui: 'Inter', system-ui, sans-serif` sont définis **And** tous les tokens de couleur existants (--color-bg, --color-accent, etc.) sont préservés intacts

3. **Given** le titre "Syllabix" dans `StartScreen` **When** il s'affiche **Then** il utilise `font-family: var(--font-display)`, `font-weight: 700`, taille `clamp(3rem, 10vw, 6rem)` **And** la couleur est `var(--color-accent)` (#d97706)

4. **Given** le mot du bot dans `BotWord` **When** il s'affiche **Then** il utilise `font-family: var(--font-display)`, `font-weight: 700`, taille `clamp(2.5rem, 8vw, 5rem)` **And** la couleur est `var(--color-text)` (#111111) **And** `font-weight: 800` est remplacé par `700`

5. **Given** tous les éléments UI (TimerRing, WordInput, ScoreDisplay, boutons, labels, erreurs) **When** je les inspecte **Then** ils utilisent tous `font-family: var(--font-ui)` (explicitement ou via héritage de `body`)

6. **Given** l'ensemble de l'interface **When** je l'inspecte visuellement **Then** aucun `background: linear-gradient` décoratif n'est présent sur les conteneurs principaux *(exception : le fade horizontal du WordChain recap dans GameOver est acceptable car fonctionnel)* **And** aucun `box-shadow` décoratif (drop shadow) n'est présent **And** aucun `backdrop-filter` / glassmorphism n'est présent **And** `border-radius` des conteneurs principaux est ≤ 8px

7. **Given** les éléments interactifs (boutons, input) **When** ils reçoivent le focus **Then** l'outline amber (`var(--color-accent)`) est visible avec 2px offset (UX8 préservé)

8. **Given** les tests existants (246 tests Vitest) **When** j'exécute `npm test` **Then** tous les tests passent sans régression

## Tasks / Subtasks

- [x] Task 1 — Charger Fraunces dans index.html (AC: #1)
  - [x] Ajouter `<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">` dans `<head>`
  - [x] Conserver les balises preconnect existantes pour googleapis et gstatic
  - [x] Remplacer l'ancien lien Inter-only

- [x] Task 2 — Ajouter les tokens font dans globals.css (AC: #2)
  - [x] Ajouter `--font-display: 'Fraunces', Georgia, serif;` dans `:root`
  - [x] Ajouter `--font-ui: 'Inter', system-ui, sans-serif;` dans `:root`
  - [x] Mettre à jour `font-family` sur `body` : `font-family: var(--font-ui);`
  - [x] Préserver tous les tokens de couleur et d'espacement existants

- [x] Task 3 — Appliquer Fraunces sur "Syllabix" dans StartScreen (AC: #3)
  - [x] Dans `StartScreen.module.css` (ou `StartScreen.tsx` inline), appliquer `font-family: var(--font-display)` sur le `<h1>`
  - [x] Taille : `clamp(3rem, 10vw, 6rem)`, weight: `700`, couleur: `var(--color-accent)`

- [x] Task 4 — Appliquer Fraunces sur BotWord (AC: #4)
  - [x] Dans `BotWord.module.css`, remplacer `font-weight: 800` par `font-weight: 700`
  - [x] Ajouter `font-family: var(--font-display)` sur l'élément `.word`
  - [x] Taille existante `clamp(2.5rem, 8vw, 5rem)` — préservée

- [x] Task 5 — Vérifier cohérence font-ui sur les éléments UI (AC: #5)
  - [x] Vérifier que `body { font-family: var(--font-ui) }` propage correctement à tous les composants
  - [x] Ajouter `font-family: var(--font-ui)` explicitement sur WordInput (remplace `inherit`)

- [x] Task 6 — Vérifier absence de gradients/shadows décoratifs (AC: #6)
  - [x] Parcourir tous les `.module.css` : aucun `box-shadow` décoratif confirmé
  - [x] Le fade `linear-gradient(to right, ...)` dans `GameOver.module.css` section recap est fonctionnel — conservé
  - [x] Aucun `backdrop-filter` présent — confirmé

- [x] Task 7 — Vérifier focus styles (AC: #7)
  - [x] `outline: 2px solid var(--color-accent)` + `outline-offset: 2px` présents sur tous les éléments interactifs — conformes

- [x] Task 8 — Tests de non-régression (AC: #8)
  - [x] `npm test` — 246/246 tests passent, zéro régression

## Dev Notes

### Contexte

L'identité visuelle actuelle utilise uniquement Inter (font UI générique). La DA validée le 2026-03-14 impose Fraunces pour le titre et le mot du bot — c'est la police qui donne à Syllabix son caractère "jeu culturel" (référence Pedantix/Semantix). Fraunces est une variable font avec un axe optique (`opsz`) qui lui donne un rendu très typographique à grande taille.

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `index.html` | Remplacer lien Google Fonts Inter → Fraunces + Inter |
| `src/styles/globals.css` | Ajouter `--font-display` + `--font-ui` tokens |
| `src/components/GameScreen/BotWord.module.css` | `font-family: var(--font-display)`, `font-weight: 700` |
| `src/components/StartScreen/StartScreen.module.css` | `font-family: var(--font-display)` sur `h1` |

### Fichiers à NE PAS modifier

- `src/engine/phonetics.ts` — aucune logique phonétique concernée
- `src/game/gameReducer.ts` — aucune logique de jeu concernée
- `src/config/constants.ts` — aucune constante concernée

### Contrainte typographique Fraunces

- **Fraunces** est une variable font avec l'axe `opsz` (optical size, range 9–144)
- URL Google Fonts : `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;500;600;700&display=swap`
- Utiliser uniquement `font-weight: 700` (le seul weight inclus) pour éviter les FOUT
- `display=swap` obligatoire pour éviter le FOIT

### Contrainte DA — règles strictes

Ces règles sont **non négociables** (décision 2026-03-14) :
- Zéro gradient CSS décoratif sur les conteneurs principaux
- Zéro drop shadow
- Zéro glassmorphism (`backdrop-filter`)
- `border-radius` conteneurs principaux ≤ 8px
- Amber (#d97706) utilisé uniquement sur les éléments clés : titre, mot du bot (non, le bot reste `--color-text`), accent UI, focus

**Note** : le `linear-gradient(to right, ...)` dans `GameOver.module.css` sert à masquer le scroll horizontal du récap — c'est fonctionnel, le conserver.

### État existant du codebase

À partir de l'exploration du 2026-03-14 :
- ✅ Aucun `box-shadow` décoratif actuel — pas de suppression nécessaire
- ✅ Aucun `backdrop-filter` — pas de suppression nécessaire
- ✅ Pas de gradients décoratifs sauf le fade recap (fonctionnel)
- ⚠️ `BotWord.module.css` a `font-weight: 800` → mettre à jour à `700`
- ⚠️ `StartScreen` n'utilise pas encore Fraunces → à ajouter
- ⚠️ `body` utilise `font-family: 'Inter', system-ui, sans-serif` directement → passer à `var(--font-ui)` après ajout du token

### Project Structure Notes

- CSS Modules uniquement — zéro lib externe de composants (ARC5)
- Les tokens CSS dans `globals.css` sont la source de vérité pour les styles partagés
- `index.html` est à la racine du projet (pas dans `src/`)

### References

- [Source: _bmad-output/planning-artifacts/prd.md#MVP Périmètre] — Contrainte DA non négociable
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typographie] — Fraunces + Inter spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Direction Design] — Règles DA strictes
- [Source: _bmad-output/planning-artifacts/architecture.md#Révision 2026-03-14] — Tokens CSS et Google Fonts
- [Source: src/styles/globals.css] — Tokens actuels
- [Source: src/components/GameScreen/BotWord.module.css] — font-weight 800 actuel

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage. Implémentation directe conforme aux spécifications du Dev Notes.

### Completion Notes List

- Fraunces chargée via Google Fonts (variable font, opsz 9–144, weight 700, display=swap)
- Tokens `--font-display` et `--font-ui` ajoutés dans `:root` ; `--font-family` conservé comme alias legacy
- `body` utilise désormais `var(--font-ui)` pour la propagation
- Titre "Syllabix" : Fraunces 700, `clamp(3rem, 10vw, 6rem)`, couleur `--color-accent`
- BotWord : Fraunces 700 (était 800), taille préservée
- WordInput : `font-family: var(--font-ui)` explicite (pour iOS Safari)
- Aucun gradient/shadow/backdrop-filter décoratif présent — confirmé par grep
- Focus styles amber déjà conformes — aucune modification nécessaire
- 246/246 tests Vitest passent sans régression

### File List

- `index.html`
- `src/styles/globals.css`
- `src/components/GameScreen/BotWord.module.css`
- `src/components/StartScreen/StartScreen.module.css`
- `src/components/StartScreen/DifficultySelector.module.css`
- `src/components/GameScreen/WordInput.module.css`
- `src/components/GameOver/GameOver.module.css`
- `src/components/shared/ErrorScreen.module.css`
- `src/components/shared/LoadingScreen.module.css`

## Change Log

- 2026-03-14 : Story 7.1 — Direction Artistique Fraunces. Ajout de la police Fraunces + Inter dans index.html ; tokens `--font-display`/`--font-ui` dans globals.css ; application Fraunces sur titre StartScreen et BotWord ; font-family explicite sur WordInput.
- 2026-03-14 : Code review — Migration `font-family` complète : `var(--font-family)` → `var(--font-ui)` dans StartScreen (.playButton), DifficultySelector, GameOver (.playButton, .suggestionWord) ; correction valeur hardcodée `'Inter', system-ui, sans-serif` → `var(--font-ui)` dans ErrorScreen et LoadingScreen.

# Story 3.1 : CSS Globals & Design Tokens

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux les variables CSS globales correspondant au design approuvé (Light Amber),
Afin que tous les composants partagent un langage visuel cohérent. (UX1, UX11)

## Acceptance Criteria

**AC1 — Design tokens dans `globals.css`**
- **Given** `src/styles/globals.css` existe et est importé dans `src/main.tsx`
- **When** j'inspecte le fichier
- **Then** tous les tokens suivants sont définis dans `:root` :
  - `--color-bg: #fafafa`
  - `--color-surface: #f7f7f5`
  - `--color-text: #111111`
  - `--color-muted: #9ca3af`
  - `--color-accent: #d97706`
  - `--color-accent-bg: #fffbeb`
  - `--color-border: #e0e0e0`
  - `--color-success: #16a34a`
  - `--color-error: #dc2626`

**AC2 — Police Inter via Google Fonts**
- **Given** `index.html` existe
- **When** je l'inspecte
- **Then** la police Inter est chargée via Google Fonts avec `<link rel="preconnect">` + `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
- **And** `font-family: 'Inter', system-ui, sans-serif` est appliqué globalement dans `globals.css`

**AC3 — Reset CSS de base**
- **Given** `globals.css` est chargé
- **When** la page s'affiche
- **Then** `box-sizing: border-box` est appliqué via `*, *::before, *::after`
- **And** `margin: 0` et `padding: 0` sont réinitialisés sur `body` (ou `*`)
- **And** `font-size: 16px` est défini comme base (NFR8)
- **And** `background-color: var(--color-bg)` et `color: var(--color-text)` sont appliqués sur `body`

**AC4 — Accessibilité contraste**
- **Given** les styles globaux définis
- **When** je vérifie les ratios de contraste
- **Then** texte `#111111` sur fond `#fafafa` atteint ≥4.5:1 (NFR7) — ratio réel : ~18.1:1 ✅
- **And** `font-size: 16px` est la taille de base (NFR8)

**AC5 — Import déjà présent**
- **Given** `src/main.tsx`
- **When** je l'inspecte
- **Then** `import './styles/globals.css'` est déjà présent (déjà fait en Story 1.1 — NE PAS dupliquer)

## Tasks / Subtasks

- [x] **T1 — Compléter `src/styles/globals.css`** (AC: 1, 3, 4)
  - [x] T1.1 — Définir `:root` avec les 9 tokens de couleur (AC1)
  - [x] T1.2 — Ajouter reset CSS : `*, *::before, *::after { box-sizing: border-box }` (AC3)
  - [x] T1.3 — Appliquer sur `body` : `margin: 0`, `font-family`, `font-size: 16px`, `background-color`, `color`, `-webkit-font-smoothing: antialiased` (AC3)
  - [x] T1.4 — Ajouter `line-height: 1.5` global
  - [x] T1.5 — Vérifier que le fichier est importé dans `main.tsx` (déjà fait — juste confirmer, ne pas dupliquer)

- [x] **T2 — Ajouter la police Inter dans `index.html`** (AC: 2)
  - [x] T2.1 — Ajouter `<link rel="preconnect" href="https://fonts.googleapis.com">` dans `<head>`
  - [x] T2.1 — Ajouter `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` dans `<head>`
  - [x] T2.2 — Ajouter le lien Google Fonts Inter : `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
  - [x] T2.3 — Vérifier que `lang="fr"` est déjà présent sur `<html>` (déjà fait — confirmer)

- [x] **T3 — Valider visuellement** (AC: 1, 2, 3, 4)
  - [x] T3.1 — Exécuter `npm run dev` et ouvrir le navigateur
  - [x] T3.2 — Inspecter les CSS custom properties via DevTools (`:root` → vérifier les 9 variables)
  - [x] T3.3 — Confirmer que la police "Inter" est chargée dans l'onglet Network
  - [x] T3.4 — Exécuter `npm run build` — vérifier que le build passe sans erreur

## Dev Notes

### Contexte Critique

Story 3.1 est la **première story de l'Epic 3** — elle pose la fondation visuelle pour TOUS les composants qui suivent (Stories 3.2 à 3.6, puis Epics 4, 5). C'est une story courte mais fondamentale : **ne pas improviser des valeurs**, utiliser exactement les tokens spécifiés.

**Ce que la story touche :**
- `src/styles/globals.css` — fichier existant mais vide (placeholder créé en Story 1.1, commentaire "à compléter en Story 3.1")
- `index.html` — ajout du lien Google Fonts uniquement
- Aucun autre fichier n'est modifié

**Ce que la story fournit à toutes les stories suivantes :**
- Variables CSS `--color-*` utilisables dans TOUS les CSS Modules
- Police Inter comme base typographique unifiée
- Reset CSS propre évitant les styles par défaut du navigateur

### État Actuel du Projet (ne pas casser)

**Fichiers stables à NE PAS modifier sauf indication :**
- `src/main.tsx` — déjà fonctionnel, import globals.css déjà présent ✅
- `src/engine/` — 91 tests passent, ne pas toucher
- `src/config/constants.ts` — stable ✅
- `src/game/`, `src/hooks/` — ne pas toucher (pas encore implémentés — structures vides avec barrel files)

**État actuel de `src/styles/globals.css` :**
```css
/* Global CSS reset and tokens — à compléter en Story 3.1 */

```
→ Le fichier existe mais est vide. **C'est le fichier principal à compléter.**

**État actuel de `index.html` :**
```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Syllabix</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
→ Pas encore de lien Google Fonts. **Ajouter les 3 `<link>` dans `<head>`.**

### Implémentation Complète Attendue

**`src/styles/globals.css` :**
```css
/* ============================================================
   Syllabix — Global CSS Reset & Design Tokens
   Story 3.1 | Light Amber Palette | UX1, UX11
   ============================================================ */

/* ── Design Tokens ─────────────────────────────────────────── */
:root {
  /* Couleurs */
  --color-bg: #fafafa;
  --color-surface: #f7f7f5;
  --color-text: #111111;
  --color-muted: #9ca3af;
  --color-accent: #d97706;
  --color-accent-bg: #fffbeb;
  --color-border: #e0e0e0;
  --color-success: #16a34a;
  --color-error: #dc2626;

  /* Typographie */
  --font-family: 'Inter', system-ui, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;
}

/* ── Reset CSS ──────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* ── Base Body ──────────────────────────────────────────────── */
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**`index.html` (ajout dans `<head>`) :**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Architecture CSS — Règles Obligatoires

**ARC5 : CSS Modules uniquement** pour les composants — zéro lib externe de composants UI. Les CSS Modules utilisent les variables définies ici :
```css
/* Exemple dans GameScreen.module.css */
.title {
  color: var(--color-text);      /* token global */
  background: var(--color-surface);  /* token global */
}
```

**Structure CSS attendue pour les stories suivantes :**
- `src/styles/globals.css` — tokens + reset (cette story)
- `src/components/App/App.module.css` — styles du composant App (Story 3.4+)
- `src/components/GameScreen/GameScreen.module.css` — styles GameScreen (Story 3.5)
- Etc. — chaque composant a son `.module.css` propre

**⚠️ Ne PAS ajouter de classes utilitaires Tailwind-style** — zéro `.flex`, `.text-center`, etc. dans globals.css. Uniquement le reset et les tokens.

### Tokens CSS — Utilisation Anticipée

| Token | Utilisation future |
|---|---|
| `--color-bg` | Fond du body, fond StartScreen/GameOverScreen |
| `--color-surface` | Fond des chips WordChain, panneaux |
| `--color-text` | Texte principal partout |
| `--color-muted` | Texte secondaire, labels, hints |
| `--color-accent` | Boutons CTA, focus outline, accent amber |
| `--color-accent-bg` | Fond des boutons, notifications record |
| `--color-border` | Bordures des inputs, séparateurs |
| `--color-success` | Flash vert après validation réussie (Story 3.6) |
| `--color-error` | Flash rouge validation invalide, ErrorMessage (Story 3.6) |

### Palettes de Contraste — Vérification Obligatoire

| Combinaison | Ratio | Conformité WCAG AA |
|---|---|---|
| `#111111` sur `#fafafa` | ~18.1:1 | ✅ (requis ≥4.5:1) |
| `#111111` sur `#fffbeb` | ~16.8:1 | ✅ |
| `#111111` sur `#f7f7f5` | ~17.4:1 | ✅ |
| `#d97706` sur `#fafafa` | ~3.1:1 | ⚠️ accent seul insuffisant — toujours doubler avec autre indicateur visuel |
| `#16a34a` sur `#fafafa` | ~5.3:1 | ✅ |
| `#dc2626` sur `#fafafa` | ~5.9:1 | ✅ |

**Note :** L'accent amber `#d97706` sur fond clair a un ratio de ~3.1:1 (insuffisant seul pour texte). Pour le focus outline et les indicateurs visuels, l'utiliser avec un border épais (3px+) ou combiné à une couleur de fond (`--color-accent-bg`).

### Project Structure Notes

#### Alignement avec l'architecture définie

```
src/
├── styles/
│   └── globals.css     ← MODIFIÉ ici (actuellement vide)
└── main.tsx            ← NE PAS MODIFIER (import déjà présent)

index.html              ← MODIFIÉ ici (ajout Google Fonts dans <head>)
```

[Source: architecture.md#Structure Complète du Projet — `src/styles/globals.css` documenté]
[Source: architecture.md#ARC5 — CSS Modules uniquement, zéro lib externe]

#### Dépendances inter-stories

- **Cette story ne consomme rien de l'Epic 2** — story purement CSS, indépendante du moteur phonétique
- **Cette story fournit à Stories 3.2–3.6** : les tokens CSS `var(--color-*)` disponibles dans tous les `.module.css`
- **Cette story fournit à Stories 4, 5, 6** : même chose — fondation visuelle globale

#### Conflits Potentiels Identifiés

1. **Google Fonts vs CSP** : Si une Content Security Policy est définie, les fonts Google doivent être dans la whitelist. En V1 sur GitHub Pages, pas de CSP custom — aucun problème.
2. **FOUC (Flash Of Unstyled Content)** : L'import CSS dans `main.tsx` (via Vite) est synchrone en dev et injecté dans le `<head>` en prod — pas de FOUC prévu. Les preconnect Google Fonts réduisent la latence de chargement font.
3. **`-webkit-font-smoothing`** : Propriété non-standard mais universellement supportée. L'inclure est une bonne pratique pour la lisibilité.

### Leçons des Stories Précédentes (Intelligence Héritée)

| Leçon Epics 1-2 | Application Story 3.1 |
|---|---|
| `resolveJsonModule: true` dans tsconfig (Story 1.1) | Sans impact sur cette story CSS |
| Vitest co-localisé (Stories 2.x) | Cette story n'a pas de tests Vitest — validation visuelle uniquement |
| Import depuis barrel file `index.ts` (Stories 2.x) | `globals.css` n'a pas de barrel — importé directement depuis `main.tsx` |
| `src/engine/` = zéro React (Architecture) | `src/styles/` = zéro JavaScript — CSS pur uniquement |

**Aucun test Vitest n'est requis pour cette story.** La validation est visuelle (DevTools) + build check (`npm run build`).

### References

- [Source: epics.md#Story 3.1] — User story complète, Acceptance Criteria (UX1, UX11, NFR7, NFR8)
- [Source: architecture.md#ARC5] — CSS Modules uniquement, zéro lib externe
- [Source: architecture.md#Structure Complète du Projet] — `src/styles/globals.css` documenté
- [Source: ux-design-specification.md#Design System] — Palette Light Amber, tokens couleur
- [Source: epics.md#Additional Requirements] — UX1 (palette), UX11 (Inter + fallback), NFR7 (contraste ≥4.5:1), NFR8 (16px min)
- [Source: architecture.md#Préoccupations Transversales] — Styling CSS Modules

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage rencontré.

### Completion Notes List

✅ T1 — `src/styles/globals.css` complété avec 9 tokens couleur dans `:root`, 3 tokens typo, reset CSS `box-sizing: border-box`, styles body complets (`margin: 0`, `font-family`, `font-size: 16px`, `line-height: 1.5`, `background-color`, `color`, `-webkit-font-smoothing`).
✅ T2 — `index.html` mis à jour avec 3 `<link>` Google Fonts Inter (preconnect ×2 + stylesheet). `lang="fr"` confirmé présent.
✅ T3 — Build production réussi sans erreur (`vite build` en 465ms). 91 tests Vitest existants passent sans régression.
✅ AC5 — Import `./styles/globals.css` confirmé dans `main.tsx` (déjà présent, non dupliqué).

### File List

- `src/styles/globals.css` — modifié (tokens + reset CSS, contenu complet ; M1: ajout `html { font-size }` pour rem-cohérence ; M3: commentaire WCAG sur `--color-accent`)
- `index.html` — modifié (ajout 3 liens Google Fonts Inter dans `<head>` ; M2: ajout `<link rel="icon">`)
- `public/favicon.svg` — créé (favicon SVG minimal, résout la 404)

### Change Log

- 2026-03-09 : Story 3.1 implémentée — CSS globals & design tokens (palette Light Amber) + police Inter via Google Fonts. Build OK, 91 tests passent.
- 2026-03-09 : Code review — 3 issues MEDIUM corrigés : (M1) `html { font-size }` ajouté pour cohérence rem, (M2) favicon SVG créé + lien dans index.html, (M3) commentaire WCAG ajouté sur `--color-accent`.

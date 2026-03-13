# Story 1.1 : Initialisation du Projet Vite + React + TypeScript

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux initialiser le projet Syllabix avec Vite + React + TypeScript,
Afin que la structure de projet soit prête au développement avec le bon outillage.

## Acceptance Criteria

**AC1 — Bootstrap Vite**
- **Given** je suis dans le répertoire parent du projet
- **When** j'exécute `npm create vite@latest syllabix -- --template react-ts && cd syllabix && npm install`
- **Then** le projet est créé avec `src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig.json`
- **And** `npm run dev` démarre le serveur sur localhost:5173 sans erreur

**AC2 — Vitest configuré**
- **Given** le projet est initialisé
- **When** j'exécute `npm install -D vitest @vitest/ui jsdom @testing-library/react`
- **Then** `npm run test` exécute la suite de tests sans erreur
- **And** `vitest.config.ts` est configuré avec l'environnement jsdom

**AC3 — Structure de dossiers et barrel files**
- **Given** la structure de projet
- **When** je crée les dossiers :
  - `src/config/`
  - `src/engine/`
  - `src/game/`
  - `src/hooks/`
  - `src/components/App/`
  - `src/components/StartScreen/`
  - `src/components/GameScreen/`
  - `src/components/GameOver/`
  - `src/components/shared/`
  - `src/styles/`
  - `scripts/`
- **Then** chaque dossier `src/**` contient un barrel file `index.ts` placeholder
- **And** `src/styles/globals.css` existe (même vide pour l'instant)

**AC4 — Build propre**
- **Given** le projet
- **When** j'exécute `npm run build`
- **Then** le build produit un dossier `dist/` sans erreur TypeScript ni Vite

## Tasks / Subtasks

- [x] **T1 — Bootstrap du projet Vite** (AC: 1)
  - [x] T1.1 — Exécuter `npm create vite@latest syllabix -- --template react-ts` dans le répertoire parent (`/Users/hugomatton/Desktop/`)
  - [x] T1.2 — Exécuter `npm install` dans le dossier `syllabix/`
  - [x] T1.3 — Vérifier que `npm run dev` démarre sur localhost:5173 sans erreur
  - [x] T1.4 — Supprimer le contenu boilerplate superflu de `src/App.tsx` et `src/App.css` (garder une structure minimale)

- [x] **T2 — Installation et configuration Vitest** (AC: 2)
  - [x] T2.1 — Exécuter `npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom`
  - [x] T2.2 — Créer `vitest.config.ts` avec environnement jsdom
  - [x] T2.3 — Ajouter le script `"test": "vitest"` dans `package.json`
  - [x] T2.4 — Vérifier que `npm run test` passe sans erreur (même sans tests — le runner doit s'initialiser)

- [x] **T3 — Création de la structure de dossiers** (AC: 3)
  - [x] T3.1 — Créer `src/config/` avec `index.ts` placeholder
  - [x] T3.2 — Créer `src/engine/` avec `index.ts` placeholder
  - [x] T3.3 — Créer `src/game/` avec `index.ts` placeholder
  - [x] T3.4 — Créer `src/hooks/` avec `index.ts` placeholder
  - [x] T3.5 — Créer `src/components/App/` avec `App.tsx` + `App.module.css` + `index.ts`
  - [x] T3.6 — Créer `src/components/StartScreen/` avec `StartScreen.tsx` stub + `StartScreen.module.css` + `index.ts`
  - [x] T3.7 — Créer `src/components/GameScreen/` avec `GameScreen.tsx` stub + `GameScreen.module.css` + `index.ts`
  - [x] T3.8 — Créer `src/components/GameOver/` avec `GameOver.tsx` stub + `GameOver.module.css` + `index.ts`
  - [x] T3.9 — Créer `src/components/shared/` avec `index.ts` placeholder
  - [x] T3.10 — Créer `src/styles/globals.css` (fichier vide ou reset minimal)
  - [x] T3.11 — Créer le dossier `scripts/` à la racine (vide, pour les scripts Python futurs)

- [x] **T4 — Vérification du build de production** (AC: 4)
  - [x] T4.1 — Exécuter `npm run build`
  - [x] T4.2 — Vérifier que `dist/` est généré sans erreur TypeScript ni Vite

## Dev Notes

### Contexte Critique

Cette story est la **première de tout le projet Syllabix**. Elle n'a aucune dépendance sur du code existant. L'objectif est d'établir un **squelette propre** sur lequel toutes les stories suivantes s'appuieront.

Le projet est **100% client-side** (SPA statique), sans backend, déployé sur GitHub Pages. Chaque décision prise ici engage toutes les stories suivantes.

### Emplacement du Projet

Le projet Vite doit être créé dans `/Users/hugomatton/Desktop/syllabix/` — ce répertoire existe déjà avec les artefacts BMAD. La commande Vite **créera** les fichiers dedans ou un sous-dossier `syllabix/`. ⚠️ Vérifier le comportement exact de la commande pour éviter de créer `syllabix/syllabix/`.

> **Action recommandée :** Exécuter la commande depuis `/Users/hugomatton/Desktop/` et confirmer que Vite crée bien le projet dans `/Users/hugomatton/Desktop/syllabix/`. Si le répertoire existe déjà avec des fichiers non-Vite, Vite peut demander confirmation.

### Stack Technique Arrêtée

| Technologie | Version | Source |
|---|---|---|
| Vite | 6.x (latest) | [Source: architecture.md#Évaluation du Starter Template] |
| React | ^19 (bundled with Vite template) | template react-ts |
| TypeScript | strict mode | template react-ts |
| Vitest | latest compatible | [Source: architecture.md#Tests] |
| jsdom | compatible Vitest | pour l'environnement de test browser |
| @testing-library/react | latest | tests composants React |
| CSS Modules | natif Vite | [Source: architecture.md#ARC5] — ZÉRO lib de composants externe |

### Configuration Vitest Requise

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
```

[Source: epics.md#Story 1.1 AC2]

### Structure de Projet Finale Attendue (après cette story)

```
syllabix/
├── public/                          # Assets statiques (vide pour l'instant)
├── scripts/                         # Scripts Python build-time (dossier vide créé)
├── src/
│   ├── config/
│   │   └── index.ts                 # Export placeholder
│   ├── engine/                      # Moteur phonétique (Stories 2.x)
│   │   └── index.ts                 # Export placeholder
│   ├── game/                        # State management (Stories 3.x)
│   │   └── index.ts                 # Export placeholder
│   ├── hooks/                       # Custom hooks
│   │   └── index.ts                 # Export placeholder
│   ├── components/
│   │   ├── App/
│   │   │   ├── App.tsx              # Root minimal (phase routing viendra en Epic 3)
│   │   │   ├── App.module.css       # Vide ou minimal
│   │   │   └── index.ts
│   │   ├── StartScreen/
│   │   │   ├── StartScreen.tsx      # Stub (retourne <div>StartScreen</div>)
│   │   │   ├── StartScreen.module.css
│   │   │   └── index.ts
│   │   ├── GameScreen/
│   │   │   ├── GameScreen.tsx       # Stub (retourne <div>GameScreen</div>)
│   │   │   ├── GameScreen.module.css
│   │   │   └── index.ts
│   │   ├── GameOver/
│   │   │   ├── GameOver.tsx         # Stub (retourne <div>GameOver</div>)
│   │   │   ├── GameOver.module.css
│   │   │   └── index.ts
│   │   └── shared/
│   │       └── index.ts             # Export placeholder
│   ├── styles/
│   │   └── globals.css              # Vide ou reset minimal
│   └── main.tsx                     # Point d'entrée React
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts                 # À créer manuellement
```

[Source: architecture.md#Structure Complète du Projet]

### Conventions de Nommage à Respecter (OBLIGATOIRE)

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | `PascalCase.tsx` | `App.tsx`, `GameScreen.tsx` |
| CSS Modules | Même nom que composant | `App.module.css` |
| Hooks | `camelCase` préfixé `use` | `useGameState.ts` |
| Modules engine/game | `camelCase.ts` | `phonetics.ts` |
| Tests | Co-localisés, suffixe `.test.ts` | `phonetics.test.ts` |
| Barrel files | `index.ts` par dossier | `src/engine/index.ts` |

[Source: architecture.md#Naming Patterns]

### Barrel Files — Format Placeholder

Pour les dossiers qui n'ont pas encore de contenu à exporter, le barrel file placeholder est :

```typescript
// index.ts placeholder
export {}
```

Pour les composants créés comme stubs :

```typescript
// src/components/StartScreen/index.ts
export { StartScreen } from './StartScreen'
```

[Source: architecture.md#ARC9]

### Règles Architecturales Critiques pour cette Story

1. **CSS Modules UNIQUEMENT** — Ne pas créer `App.css` global (sauf `src/styles/globals.css`). Supprimer `src/App.css` généré par Vite. [Source: architecture.md#ARC5]
2. **Barrel files obligatoires** dans chaque dossier `src/**`. [Source: architecture.md#ARC9]
3. **`scripts/` à la racine** — jamais dans `src/` — ce dossier est pour Python (hors bundle Vite). [Source: architecture.md#ARC8]
4. **Supprimer le boilerplate Vite** (`src/assets/`, `src/App.css`) — ne garder que ce qui est requis par l'architecture.
5. **Zéro lib de composants externe** (pas de MUI, shadcn, etc.) — CSS Modules uniquement.

### Nettoyage du Boilerplate Vite à Prévoir

Le template `react-ts` génère du contenu démo (compteur cliquable, logo Vite/React, etc.) à supprimer :
- `src/App.tsx` → Remplacer par un composant minimal propre
- `src/App.css` → **Supprimer** (remplacé par CSS Modules + globals.css)
- `src/assets/` → **Supprimer** le contenu (logos démo inutiles)
- `src/index.css` → Évaluer : peut devenir `src/styles/globals.css` ou être supprimé

### Project Structure Notes

#### Alignement avec l'architecture définie

La structure de projet à créer dans cette story s'aligne exactement avec l'arbre documenté dans `architecture.md#Structure Complète du Projet`. Aucune déviation n'est acceptée.

#### Conflits potentiels détectés

- **Conflit path :** Le répertoire `/Users/hugomatton/Desktop/syllabix/` contient déjà des fichiers BMAD (`_bmad/`, `_bmad-output/`, `docs/`). La commande `npm create vite@latest` ne doit pas écraser ces fichiers. Vérifier que Vite crée uniquement les fichiers Vite (src/, public/, package.json, etc.) et ne touche pas aux dossiers `_bmad*` et `docs/`.
- **Résolution :** Les fichiers Vite ont été créés manuellement dans le répertoire existant pour éviter les conflits avec les fichiers BMAD. La structure est identique à ce que `npm create vite@latest` aurait généré.

### References

- [Source: epics.md#Story 1.1] — User story complète et Acceptance Criteria
- [Source: architecture.md#Évaluation du Starter Template] — Justification stack Vite + React + TypeScript
- [Source: architecture.md#Structure Complète du Projet] — Arbre de fichiers complet
- [Source: architecture.md#Naming Patterns] — Conventions de nommage obligatoires
- [Source: architecture.md#ARC1] — Commande de bootstrap exacte
- [Source: architecture.md#ARC5] — CSS Modules uniquement
- [Source: architecture.md#ARC6] — Tests Vitest co-localisés
- [Source: architecture.md#ARC8] — scripts/ hors bundle Vite
- [Source: architecture.md#ARC9] — Barrel files index.ts obligatoires

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- T2.4: Vitest 4.x sort avec code 1 quand aucun test n'existe → ajout de `passWithNoTests: true` dans vitest.config.ts
- T4: `tsc -b` compilait les fichiers `.test.tsx` → ajout de `exclude` dans tsconfig.app.json pour exclure les fichiers test de la compilation TypeScript de production
- `@testing-library/dom` manquant comme dépendance directe → installé séparément

### Completion Notes List

- Fichiers Vite créés manuellement (équivalent `npm create vite@latest`) car le répertoire contenait déjà les fichiers BMAD qui auraient bloqué l'invite interactive de create-vite
- Stack installée : Vite 6.4.1, React 19, TypeScript 5.7, Vitest 4.0.18, jsdom 28.1.0, @testing-library/react 16.3.2
- Structure de dossiers conforme à l'architecture : 9 dossiers src/ + scripts/ à la racine
- Composants stubs créés (App, StartScreen, GameScreen, GameOver) avec CSS Modules et barrel files
- Test smoke sur App.test.tsx : 1 test passé
- `npm run build` : dist/ généré en 455ms, 0 erreur
- `npm run dev` : démarre sur localhost:5173 en 299ms

### File List

- package.json
- index.html
- vite.config.ts
- vitest.config.ts
- tsconfig.json
- tsconfig.app.json
- tsconfig.node.json
- .gitignore
- src/vite-env.d.ts
- src/main.tsx
- src/test-setup.ts
- src/config/index.ts
- src/engine/index.ts
- src/game/index.ts
- src/hooks/index.ts
- src/styles/globals.css
- src/components/App/App.tsx
- src/components/App/App.module.css
- src/components/App/index.ts
- src/components/App/App.test.tsx
- src/components/StartScreen/StartScreen.tsx
- src/components/StartScreen/StartScreen.module.css
- src/components/StartScreen/index.ts
- src/components/GameScreen/GameScreen.tsx
- src/components/GameScreen/GameScreen.module.css
- src/components/GameScreen/index.ts
- src/components/GameOver/GameOver.tsx
- src/components/GameOver/GameOver.module.css
- src/components/GameOver/index.ts
- src/components/shared/index.ts
- scripts/ (dossier créé — contenu géré par story 1-2)

## Change Log

- 2026-03-08 : Initialisation complète du projet Syllabix — bootstrap Vite 6 + React 19 + TypeScript strict, configuration Vitest 4 avec jsdom, création structure de dossiers conforme architecture.md
- 2026-03-08 : Code review — 4 corrections appliquées : (1) `src/test-setup.ts` créé + `vitest.config.ts` migré vers `mergeConfig` avec `setupFiles` configuré pour jest-dom ; (2) `App.test.tsx` assertion corrigée `toBeDefined` → `toBeInTheDocument` ; (3) CSS Modules importés dans les stubs StartScreen, GameScreen, GameOver ; (4) Repository git initialisé (branche `main`)

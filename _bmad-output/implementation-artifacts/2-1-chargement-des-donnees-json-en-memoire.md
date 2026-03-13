# Story 2.1 : Chargement des Données JSON en Mémoire

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que joueur,
Je veux que le jeu charge ses données phonétiques de façon transparente au démarrage,
Afin que la validation des mots soit instantanée pendant toute la partie.

## Acceptance Criteria

**AC1 — Chargement parallèle via Promise.all()**
- **Given** `public/dictionary.json` et `public/graph.json` existent
- **When** j'ouvre l'app
- **Then** `App.tsx` fetch les deux fichiers en parallèle via `Promise.all()` (ARC11)
- **And** dictionary.json est stocké en `Map<string, string>` en mémoire (ARC2)
- **And** graph.json est stocké en `Record<string, string[]>` en mémoire (ARC2)

**AC2 — Écran de chargement LoadingScreen**
- **Given** le chargement dépasse 300ms
- **When** le composant `LoadingScreen` s'affiche
- **Then** le texte "Chargement du dictionnaire…" apparaît en couleur muted, centré
- **And** le bouton "Jouer" n'est pas accessible pendant le chargement

**AC3 — Transition vers StartScreen**
- **Given** le chargement est réussi
- **When** les données sont prêtes
- **Then** l'app passe en phase idle (StartScreen) en moins de 2s (NFR2)
- **And** les lookups ultérieurs retournent un résultat en <1ms (NFR4)

**AC4 — Gestion des erreurs réseau**
- **Given** une erreur réseau ou fichier manquant
- **When** `fetch()` échoue
- **Then** un écran d'erreur bloquant affiche un message clair
- **And** le jeu n'essaie pas de démarrer

## Tasks / Subtasks

- [x] **T1 — Créer `src/engine/dataLoader.ts`** (AC: 1, 3, 4)
  - [x] T1.1 — Définir et exporter les types `GameData = { dictionary: Map<string, string>, graph: Record<string, string[]> }`
  - [x] T1.2 — Implémenter `loadGameData(): Promise<GameData>` qui fetch les deux JSON en parallèle via `Promise.all()`
  - [x] T1.3 — Convertir la réponse dictionary.json en `new Map<string, string>(Object.entries(raw))`
  - [x] T1.4 — Stocker graph.json directement en `Record<string, string[]>` (pas de conversion nécessaire)
  - [x] T1.5 — Laisser remonter les erreurs fetch naturellement (pas de catch interne — géré par App.tsx)

- [x] **T2 — Créer `src/components/shared/LoadingScreen.tsx`** (AC: 2)
  - [x] T2.1 — Composant fonctionnel simple affichant "Chargement du dictionnaire…" centré
  - [x] T2.2 — Texte en couleur `var(--color-muted)`, layout centré verticalement et horizontalement
  - [x] T2.3 — Créer `LoadingScreen.module.css` avec styles dédiés (CSS Modules — pas d'inline styles)
  - [x] T2.4 — Mettre à jour `src/components/shared/index.ts` pour ré-exporter `LoadingScreen`

- [x] **T3 — Créer `src/components/shared/ErrorScreen.tsx`** (AC: 4)
  - [x] T3.1 — Composant acceptant une prop `message: string`
  - [x] T3.2 — Afficher le message d'erreur de façon proéminente, centrée, avec `role="alert"` pour l'accessibilité
  - [x] T3.3 — Créer `ErrorScreen.module.css`
  - [x] T3.4 — Mettre à jour `src/components/shared/index.ts` pour ré-exporter `ErrorScreen`

- [x] **T4 — Modifier `src/components/App/App.tsx`** (AC: 1, 2, 3, 4)
  - [x] T4.1 — Ajouter un état `loadingState: 'loading' | 'ready' | 'error'` dans le composant
  - [x] T4.2 — Appeler `loadGameData()` dans un `useEffect` au montage
  - [x] T4.3 — Afficher `<LoadingScreen />` pendant le chargement (`loadingState === 'loading'`)
  - [x] T4.4 — Afficher `<ErrorScreen message="Impossible de charger les données du jeu." />` en cas d'erreur
  - [x] T4.5 — Créer un `GameDataContext` (React.createContext) dans `App.tsx` ou dans un fichier dédié
  - [x] T4.6 — Fournir `GameDataContext.Provider` avec `{ dictionary, graph }` une fois le chargement réussi
  - [x] T4.7 — Afficher `<StartScreen />` en phase idle (phase routing de base — juste idle pour l'instant)

- [x] **T5 — Mettre à jour `src/engine/index.ts`** (ARC9)
  - [x] T5.1 — Exporter `loadGameData` et `GameData` depuis `src/engine/index.ts`

- [x] **T6 — Créer `src/engine/dataLoader.test.ts`** (ARC6)
  - [x] T6.1 — Mock `globalThis.fetch` avec `vi.stubGlobal` ou `vi.fn()`
  - [x] T6.2 — Tester le cas succès : dictionary bien converti en `Map`, graph en `Record`
  - [x] T6.3 — Tester le cas erreur : `fetch` qui rejette → `loadGameData()` rejette aussi
  - [x] T6.4 — Vérifier que `Promise.all` est bien utilisé (les deux fetch s'exécutent en parallèle)
  - [x] T6.5 — Exécuter `npm run test` — tous les tests doivent passer

## Dev Notes

### Contexte Critique

Story 2.1 est la **première story de l'Epic 2 — Moteur Phonétique & Sélection Bot**. Elle constitue la fondation de données pour toutes les stories suivantes :
- Story 2.2 (`phonetics.ts`) utilisera le `dictionary: Map<string, string>` pour les lookups IPA
- Story 2.3 (`botSelector.ts`) utilisera le `graph: Record<string, string[]>` pour la sélection bot
- Epic 3 (game loop) consommera ces données via le contexte React

**Dépendances satisfaites (Epic 1 complète) :**
- ✅ `public/dictionary.json` — 121 028 entrées, format `{"mot": "ipastring"}` (ex: `"chocolat": "ʃokola"`)
- ✅ `public/graph.json` — 2 560 clés, format `{"syllabe_ipa": ["mot1", "mot2", ...]}` (ex: `"la": ["lapin", "lac", "laver", ...]`)
- ✅ `src/config/constants.ts` — `PHONETIC_TOLERANCE=2`, `TIMER_*` prêts
- ✅ Structure projet conforme : tous les dossiers `src/` existent avec barrel files

### Architecture de `dataLoader.ts`

Conformément à `architecture.md#Flux de Données` :

```typescript
// src/engine/dataLoader.ts

export type GameData = {
  dictionary: Map<string, string>      // ARC2 : mot → IPA
  graph: Record<string, string[]>      // ARC2 : syllabe_IPA → mots valides
}

export async function loadGameData(): Promise<GameData> {
  // ARC11 : Promise.all obligatoire — chargement parallèle
  const [dictResponse, graphResponse] = await Promise.all([
    fetch('/dictionary.json'),
    fetch('/graph.json'),
  ])

  // Laisser remonter les erreurs HTTP (pas de catch ici)
  const dictRaw: Record<string, string> = await dictResponse.json()
  const graph: Record<string, string[]> = await graphResponse.json()

  // Convertir l'objet JSON en Map pour O(1) lookup (architecture.md#Architecture des Données Client)
  const dictionary = new Map<string, string>(Object.entries(dictRaw))

  return { dictionary, graph }
}
```

**⚠️ Point important :** Ne pas utiliser `new Map(Object.entries(raw))` sur graph.json car le lookup sur graph est déjà O(1) avec un objet JS brut. La `Map` n'est requise **que** pour le dictionnaire (130k+ entrées).

### Structure du GameDataContext dans App.tsx

Le contexte doit être accessible par les composants enfants (notamment le moteur phonétique via hooks). Pattern recommandé :

```typescript
// src/components/App/App.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { loadGameData, type GameData } from '../../engine'

export const GameDataContext = createContext<GameData | null>(null)

// Hook utilitaire pour consommer le contexte (à exporter aussi)
export function useGameData(): GameData {
  const ctx = useContext(GameDataContext)
  if (!ctx) throw new Error('useGameData must be used within GameDataContext.Provider')
  return ctx
}

export function App() {
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [gameData, setGameData] = useState<GameData | null>(null)

  useEffect(() => {
    loadGameData()
      .then(data => {
        setGameData(data)
        setLoadingState('ready')
      })
      .catch(() => setLoadingState('error'))
  }, [])

  if (loadingState === 'loading') return <LoadingScreen />
  if (loadingState === 'error') return <ErrorScreen message="Impossible de charger les données du jeu." />

  return (
    <GameDataContext.Provider value={gameData!}>
      <StartScreen />  {/* phase routing complet en Story 3.x */}
    </GameDataContext.Provider>
  )
}
```

### LoadingScreen — Spec Visuelle Précise

D'après `ux-design-specification.md` et `epics.md#Story 2.1 AC2` :

```css
/* LoadingScreen.module.css */
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--color-bg);  /* #fafafa */
}

.message {
  color: var(--color-muted);           /* #9ca3af */
  font-size: 1rem;
  font-family: 'Inter', system-ui, sans-serif;
}
```

Les tokens CSS (`--color-bg`, `--color-muted`) sont définis dans `src/styles/globals.css` (Story 1.1 — fichier existant, peut être vide ou minimal). **Vérifier que les tokens sont définis avant de les utiliser.** Si `globals.css` est vide, définir les tokens dans cette story est optionnel — les composants complets seront créés en Epic 3 (Story 3.1).

**Alternative si globals.css vide :** utiliser les valeurs directement en CSS (`color: #9ca3af`) avec un TODO commentaire indiquant la migration vers tokens en Story 3.1.

### ErrorScreen — Spec Fonctionnelle

```tsx
// src/components/shared/ErrorScreen.tsx
interface ErrorScreenProps {
  message: string
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className={styles.container} role="alert">
      <p className={styles.message}>{message}</p>
    </div>
  )
}
```

L'attribut `role="alert"` est important pour l'accessibilité (NFR9 — focus clavier fonctionnel sur tous les éléments interactifs).

### Tests — Stratégie de Mocking

Vitest (v4.x installé) avec jsdom. Pour mocker `fetch` :

```typescript
// src/engine/dataLoader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadGameData } from './dataLoader'

describe('loadGameData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('charge dictionary en Map et graph en Record', async () => {
    const mockDict = { lapin: 'lapɛ̃', chocolat: 'ʃokola' }
    const mockGraph = { la: ['lapin', 'lac'], pɛ̃: ['pain', 'peindre'] }

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        json: async () => mockDict,
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        json: async () => mockGraph,
        ok: true,
      } as Response)
    )

    const { dictionary, graph } = await loadGameData()

    expect(dictionary).toBeInstanceOf(Map)
    expect(dictionary.get('lapin')).toBe('lapɛ̃')
    expect(dictionary.size).toBe(2)
    expect(graph).toEqual(mockGraph)
    expect(graph['la']).toContain('lapin')
  })

  it('rejette si fetch échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await expect(loadGameData()).rejects.toThrow()
  })
})
```

**⚠️ Contrainte Vitest :** `vi.stubGlobal` requiert `vi.restoreAllMocks()` dans `beforeEach` pour éviter les effets de bord entre tests. `vi.fn().mockResolvedValueOnce()` est la syntaxe correcte pour simuler des appels séquentiels de `Promise.all`.

### État Actuel du Projet (ne pas casser)

**Fichiers existants à NE PAS modifier sauf si indiqué :**
- `src/config/constants.ts` — stable ✓
- `src/config/index.ts` — stable ✓ (exporte déjà PHONETIC_TOLERANCE, TIMER_*)
- `public/dictionary.json` — stable ✓ (121 028 entrées)
- `public/graph.json` — stable ✓ (2 560 clés)
- `src/main.tsx` — stable ✓ (importe App depuis components/App)
- `src/components/App/App.module.css` — stable ✓

**Fichiers à créer :**
- `src/engine/dataLoader.ts`
- `src/engine/dataLoader.test.ts`
- `src/components/shared/LoadingScreen.tsx`
- `src/components/shared/LoadingScreen.module.css`
- `src/components/shared/ErrorScreen.tsx`
- `src/components/shared/ErrorScreen.module.css`

**Fichiers à modifier :**
- `src/engine/index.ts` — ajouter exports depuis `./dataLoader`
- `src/components/shared/index.ts` — ajouter exports LoadingScreen, ErrorScreen
- `src/components/App/App.tsx` — remplacer le stub par le chargement réel

**Fichier à NE PAS créer :** `src/context/` — pas de dossier `context/` dans l'architecture définie. Le GameDataContext vit dans `App.tsx`.

### Conventions de Nommage Obligatoires

| Élément | Convention | Exemple |
|---|---|---|
| Types | `PascalCase` | `GameData` |
| Fonctions | `camelCase` | `loadGameData()` |
| Hooks | `useXxx()` | `useGameData()` |
| Constantes | `SCREAMING_SNAKE_CASE` | `PHONETIC_TOLERANCE` |
| Composants | `PascalCase.tsx` | `LoadingScreen.tsx` |
| CSS Modules | Même nom | `LoadingScreen.module.css` |
| Tests | co-localisés `.test.ts` | `dataLoader.test.ts` |

[Source: architecture.md#Naming Patterns]

### Frontières Architecturales à Respecter

1. **`src/engine/` = pur TypeScript, zéro React** — `dataLoader.ts` ne doit pas importer de React. Les types `GameData` sont du TypeScript pur. [Source: architecture.md#Frontières Architecturales]
2. **Le contexte React (`GameDataContext`) vit dans `App.tsx`**, pas dans `src/engine/`. Les composants qui ont besoin des données utilisent `useGameData()` (défini aussi dans App.tsx ou dans `src/hooks/`).
3. **CSS Modules uniquement** — zéro inline styles, zéro lib de composants externe. [Source: architecture.md#ARC5]
4. **Barrel files obligatoires** — exporter via `src/engine/index.ts` et `src/components/shared/index.ts`. [Source: architecture.md#ARC9]

### Données JSON — Format Confirmé (Epic 1)

**dictionary.json** (`public/dictionary.json`) :
```json
{
  "chocolat": "ʃokola",
  "lapin": "lapɛ̃",
  "maison": "mɛzɔ̃",
  "pain": "pɛ̃"
}
```
- Clés : mots français en minuscules normalisées
- Valeurs : chaîne IPA sans espaces
- 121 028 entrées totales
- Taille : dans les limites NFR6 (<5MB gzip)

**graph.json** (`public/graph.json`) :
```json
{
  "la": ["lapin", "lac", "laver", "lampe", ...],
  "pɛ̃": ["pain", "peindre", "pintade", ...],
  "ʃo": ["chocolat", "choper", ...]
}
```
- Clés : syllabes IPA (dernière syllabe d'un mot)
- Valeurs : listes de mots valides commençant par cette syllabe
- 2 560 clés, toutes avec ≥ 2 valeurs (invariant garanti)
- `"la"` → 347 mots (confirmé en Story 1.3)

### Intelligence Héritée de l'Epic 1

**Leçons critiques à appliquer dans cette story :**

1. **IPA Unicode multi-code-points** — `ɛ̃` après NFC peut être 3 code points (`ɛ`, combining tilde, etc.). Cette normalisation est critique pour la Story 2.2 (Levenshtein). Pour cette story, les chaînes IPA sont stockées telles quelles depuis les JSON — pas de traitement IPA ici.

2. **Pas de `espeak-ng`** — le moteur phonétique TypeScript de cette story ne fait QUE des lookups Map/Record. Aucun calcul phonétique en temps réel (NFR4). La validation Levenshtein sera en Story 2.2.

3. **dictionary.json = objet JSON brut** → doit être converti en `Map` pour les performances O(1) sur 130k+ entrées. `new Map<string, string>(Object.entries(raw))` est la conversion correcte.

4. **graph.json = objet JSON brut** → **PAS** besoin de `Map`. Un objet JS brut est déjà O(1) en lookup. Stocker directement en `Record<string, string[]>`.

5. **Vitesse de chargement** — Le dictionnaire (121k entrées) se charge en <1s sur connexion standard en local. Avec CDN (NFR2 <2s), c'est bien dans les limites. Aucune optimisation supplémentaire nécessaire pour V1.

### Project Structure Notes

#### Alignement avec l'architecture définie

Cette story crée exactement les fichiers documentés dans `architecture.md#Structure Complète du Projet` :
```
src/engine/
├── dataLoader.ts      ← CRÉÉ ici — fetch() dictionary.json + graph.json → Map + objet
├── dataLoader.test.ts ← CRÉÉ ici — tests unitaires co-localisés (ARC6)
└── index.ts           ← MODIFIÉ — exports dataLoader
src/components/
├── App/
│   └── App.tsx        ← MODIFIÉ — root avec chargement + GameDataContext
└── shared/
    ├── LoadingScreen.tsx    ← CRÉÉ ici
    ├── LoadingScreen.module.css
    ├── ErrorScreen.tsx      ← CRÉÉ ici (non mentionné explicitement en architecture mais requis par AC4)
    ├── ErrorScreen.module.css
    └── index.ts             ← MODIFIÉ — exports
```

#### Dépendances inter-stories

- **Cette story fournit à Story 2.2** (`phonetics.ts`) : `Map<string, string>` accessible via `useGameData().dictionary`
- **Cette story fournit à Story 2.3** (`botSelector.ts`) : `Record<string, string[]>` accessible via `useGameData().graph`
- **Cette story fournit à Story 3.2** (`gameReducer.ts`) : GameDataContext accessible depuis n'importe quel composant
- **Aucune dépendance** sur le state management (Story 3.2 — `useReducer`) — cette story ne gère que le chargement de données

#### Conflits potentiels détectés

- **`src/styles/globals.css` potentiellement vide** (Story 1.1 la créait "vide ou reset minimal"). Si les CSS tokens ne sont pas encore définis (`--color-muted`, `--color-bg`), utiliser les valeurs hardcodées temporairement avec un commentaire `/* TODO: Story 3.1 migrera vers tokens CSS */`.
- **StartScreen.tsx est un stub** (`return <div>StartScreen</div>` depuis Story 1.1). `App.tsx` peut l'afficher tel quel après le chargement — le contenu réel arrive en Story 3.4.
- **React StrictMode** dans `main.tsx` → `useEffect` s'exécutera deux fois en développement. S'assurer que `loadGameData()` peut être appelé plusieurs fois sans effet de bord. Utiliser une cleanup function ou un flag d'annulation si nécessaire.

### References

- [Source: epics.md#Story 2.1] — User story complète et Acceptance Criteria (FR2, FR4, FR7, FR8, FR9, FR10, FR11 couverts par Epic 2)
- [Source: architecture.md#Architecture des Données Client] — `Map<string,string>` pour dictionary, `Record<string,string[]>` pour graph
- [Source: architecture.md#ARC2] — Structure mémoire des données JSON
- [Source: architecture.md#ARC11] — `Promise.all([fetch(dictionary), fetch(graph)])` obligatoire
- [Source: architecture.md#ARC5] — CSS Modules uniquement
- [Source: architecture.md#ARC6] — Tests co-localisés
- [Source: architecture.md#ARC9] — Barrel files index.ts obligatoires
- [Source: architecture.md#Flux de Données] — App.tsx → dataLoader.ts → Context
- [Source: architecture.md#Frontières Architecturales] — engine/ = pur TypeScript, zéro React
- [Source: architecture.md#NFR2] — Chargement initial <2s
- [Source: architecture.md#NFR4] — Zéro calcul phonétique en temps réel
- [Source: epic-1-retro-2026-03-09.md] — Leçons Epic 1 : IPA Unicode NFC, pas d'espeak-ng, formats JSON confirmés
- [Source: 1-4-harnais-de-tests-phonetiques-config-seuil.md#Dev Notes] — Format dictionary.json et graph.json confirmés

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage majeur. Ajout d'un flag `cancelled` dans le `useEffect` pour gérer le double-appel de React StrictMode proprement.

### Completion Notes List

- ✅ `src/engine/dataLoader.ts` créé : `loadGameData()` via `Promise.all`, dictionary converti en `Map<string, string>`, graph stocké en `Record<string, string[]>`
- ✅ `LoadingScreen` et `ErrorScreen` créés en CSS Modules (valeurs hex hardcodées avec TODO pour migration tokens Story 3.1)
- ✅ `App.tsx` refactorisé : état `loadingState`, `GameDataContext`, cleanup StrictMode. `React` default import supprimé (React 17+ JSX transform)
- ✅ `useGameData` hook déplacé vers `src/hooks/useGameData.ts` (conformité architecture)
- ✅ Barrel files `engine/index.ts`, `shared/index.ts`, `hooks/index.ts` mis à jour
- ✅ 11 tests passent (7 unitaires dataLoader + 4 intégration App) — zéro régression
- ✅ Code review appliqué : vérifications `response.ok`, parallélisation `.json()`, hook architecture-compliant, test HTTP error 404/500

**Note architecture** : `ErrorScreen.tsx` est le nom canonique retenu (vs `ErrorMessage.tsx` dans architecture.md) — nom plus précis pour un composant plein-écran. Architecture doc à mettre à jour en Story 3.x.

### File List

- src/engine/dataLoader.ts (créé, modifié post-review : response.ok + Promise.all json)
- src/engine/dataLoader.test.ts (créé, modifié post-review : tests HTTP errors)
- src/engine/index.ts (modifié)
- src/components/shared/LoadingScreen.tsx (créé)
- src/components/shared/LoadingScreen.module.css (créé)
- src/components/shared/ErrorScreen.tsx (créé)
- src/components/shared/ErrorScreen.module.css (créé)
- src/components/shared/index.ts (modifié)
- src/components/App/App.tsx (modifié, post-review : React import supprimé, useGameData extrait)
- src/components/App/App.test.tsx (modifié, post-review : tests HTTP error, promesse clean)
- src/hooks/useGameData.ts (créé post-review)
- src/hooks/index.ts (modifié post-review)

## Senior Developer Review (AI)

**Date :** 2026-03-09
**Reviewer :** claude-sonnet-4-6
**Outcome :** ✅ Approve (après corrections)

### Résumé

Story bien implémentée. 1 issue HIGH et 3 MEDIUM identifiés et corrigés dans la même session.

### Action Items (tous résolus)

- [x] [HIGH] `dataLoader.ts` — Absence de vérification `response.ok` : les erreurs HTTP (404) ne causent pas de throw sur `fetch()`. Fix : ajout des checks `if (!response.ok) throw new Error(...)` + parallélisation des `.json()` calls via `Promise.all`.
- [x] [MEDIUM] `App.tsx` — `useGameData` hook dans `App.tsx` au lieu de `src/hooks/` (violation architecture). Fix : déplacé vers `src/hooks/useGameData.ts`.
- [x] [MEDIUM] `App.test.tsx` — Pattern de test "loading" ambigu. Fix : promesse propre + nouveau test pour erreur HTTP 404 (AC4 vérification complète).
- [x] [MEDIUM] Naming `ErrorScreen` vs `ErrorMessage` dans architecture.md — décision documentée : `ErrorScreen` est le nom canonique retenu.

# Story 2.3 : Module BotSelector — Sélection Bot Sûre

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que système,
Je veux un module de sélection bot qui choisit un mot garantissant au moins une réponse valide du joueur,
Afin que le bot ne crée jamais une situation sans issue côté joueur. (FR2, FR9, FR11)

## Acceptance Criteria

**AC1 — `selectBotWord(lastSyllable, graph)` : sélection aléatoire sûre**
- **Given** `src/engine/botSelector.ts` existe
- **When** j'appelle `selectBotWord(lastSyllable, graph)`
- **Then** il retourne un mot aléatoire depuis `graph[lastSyllable]` (FR2)
- **And** chaque mot retourné a au moins 2 réponses joueur possibles dans `graph.json` (FR11, invariant garanti)
- **And** la sélection s'exécute en <1ms

**AC2 — `selectBotWord` : syllabe inconnue**
- **When** `lastSyllable` n'est pas une clé du graph
- **Then** retourne `null`

**AC3 — `selectInitialWord(graph, dictionary)` : mot de démarrage**
- **Given** le démarrage de partie (pas de mot précédent)
- **When** `selectInitialWord(graph, dictionary)` est appelé
- **Then** il retourne un mot français commun dont la dernière syllabe a au moins 5 réponses possibles dans `graph`
- **And** le mot varie entre les parties (`Math.random()`)
- **And** le mot est présent dans `dictionary`

**AC4 — Tests complets**
- **Given** `src/engine/botSelector.test.ts` existe
- **When** j'exécute `npm run test`
- **Then** tous les tests passent
- **And** aucun mot retourné ne crée un dead end côté joueur (FR9)

## Tasks / Subtasks

- [x] **T1 — Créer `src/engine/botSelector.ts`** (AC: 1, 2, 3)
  - [x] T1.1 — Implémenter `selectBotWord(lastSyllable: string, graph: Record<string, string[]>): string | null`
  - [x] T1.2 — Implémenter `selectInitialWord(graph: Record<string, string[]>, dictionary: Map<string, string>): string`
  - [x] T1.3 — Définir et exporter `STARTER_WORDS` (liste curatée de mots français communs)
  - [x] T1.4 — S'assurer que zéro import React, zéro calcul phonétique runtime

- [x] **T2 — Mettre à jour `src/engine/index.ts`** (ARC9)
  - [x] T2.1 — Ajouter `export { selectBotWord, selectInitialWord } from './botSelector'`

- [x] **T3 — Créer `src/engine/botSelector.test.ts`** (ARC6)
  - [x] T3.1 — Tester `selectBotWord` avec une syllabe valide (retourne un mot de `graph[syl]`)
  - [x] T3.2 — Tester `selectBotWord` avec une syllabe inconnue (retourne `null`)
  - [x] T3.3 — Tester `selectBotWord` : aléatoire (appels multiples produisent des résultats variés)
  - [x] T3.4 — Tester `selectBotWord` : aucun dead end — `getLastSyllable(result, dict, graph) !== null`
  - [x] T3.5 — Tester `selectInitialWord` avec les vrais JSON (retourne un mot valide dans dictionary)
  - [x] T3.6 — Tester `selectInitialWord` : dernière syllabe du mot retourné a ≥ 5 entrées dans graph
  - [x] T3.7 — Tester `selectInitialWord` : variété (Math.random(), résultats ne sont pas toujours identiques)
  - [x] T3.8 — Exécuter `npm run test` — tous les tests doivent passer

## Dev Notes

### Contexte Critique

Story 2.3 est le **dernier module de l'Epic 2**. Elle complète le moteur logique du jeu.

**Ce que la story consomme :**
- `getLastSyllable(word, dictionary, graph)` de Story 2.2 — pour `selectInitialWord` et les assertions de test
- `graph: Record<string, string[]>` de Story 2.1 — structure en mémoire pré-chargée
- `dictionary: Map<string, string>` de Story 2.1 — pour `selectInitialWord` et les tests

**Ce que la story fournit :**
- **Story 3.6** (`WordInput`) : `selectBotWord()` appelé après chaque soumission joueur réussie via le `gameReducer`
- **Story 3.4** (`StartScreen`) : `selectInitialWord()` appelé au démarrage de partie via `dispatch('START_GAME')`

**Dépendances satisfaites :**
- ✅ `public/graph.json` — 2 560 clés, chaque entrée ≥ 2 mots, invariant garanti par `build_graph.py`
- ✅ `public/dictionary.json` — 121 028 entrées format `{"mot": "ipastring"}`
- ✅ `src/engine/phonetics.ts` — `getLastSyllable()` disponible pour les tests
- ✅ `src/engine/index.ts` — barrel file existant à étendre

### Architecture de `botSelector.ts`

**Principe fondamental :** Le module s'appuie sur les **invariants de `graph.json`** :
1. Toute clé `syl` → `graph[syl]` existe avec ≥ 2 mots
2. Tout mot dans les valeurs de `graph` a sa dernière syllabe comme clé dans `graph` (garanti par `build_graph.py`)
3. Donc `selectBotWord(lastSyllable, graph)` est O(1) et safe sans vérification runtime supplémentaire

```typescript
// src/engine/botSelector.ts

import { getLastSyllable } from './phonetics'

/**
 * Mots français communs utilisés pour démarrer une partie.
 * Choisis car leur dernière syllabe a ≥ 5 réponses dans graph.json.
 * Vérifiés manuellement : graph["la"] = 347 entrées, graph["ɔ̃"] = 200+, etc.
 */
const STARTER_WORDS = [
  'chocolat',  // IPA: ʃokola → last syl: "la" (347 réponses)
  'lapin',     // IPA: lapɛ̃  → last syl: "pɛ̃" (vérifier count)
  'maison',    // IPA: mɛzɔ̃  → last syl: "zɔ̃" ou "ɔ̃"
  'canard',    // IPA: kanaʁ → last syl: à vérifier
  'poisson',   // IPA: pwasɔ̃ → last syl: "sɔ̃" ou "ɔ̃"
  'tambour',   // IPA: tɑ̃buʁ → last syl: à vérifier
  'guitare',   // IPA: gitaʁ → last syl: à vérifier
  'jardin',    // IPA: ʒaʁdɛ̃ → last syl: "dɛ̃" ou "ɛ̃"
  'balcon',    // IPA: balkɔ̃ → last syl: "kɔ̃" ou "ɔ̃"
  'mouton',    // IPA: mutɔ̃  → last syl: "tɔ̃" ou "ɔ̃"
]

/**
 * Sélectionne un mot bot aléatoire pour une syllabe donnée.
 * Repose sur l'invariant graph.json : tous les mots dans graph[syl] ont
 * leur dernière syllabe comme clé graph avec ≥ 2 entrées (FR11, FR9).
 *
 * @param lastSyllable - dernière syllabe IPA du mot précédent (clé graph)
 * @param graph        - Record<syllabe, mots[]> pré-chargé depuis graph.json
 * @returns mot bot aléatoire, ou null si lastSyllable inconnue
 */
export function selectBotWord(
  lastSyllable: string,
  graph: Record<string, string[]>
): string | null {
  const candidates = graph[lastSyllable]
  if (!candidates || candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Sélectionne le mot initial du bot pour démarrer une partie.
 * Choisit parmi STARTER_WORDS ceux dont la dernière syllabe a ≥ 5 réponses
 * dans graph.json, garantissant une bonne expérience de démarrage.
 *
 * @param graph      - Record<syllabe, mots[]> pré-chargé
 * @param dictionary - Map<mot, IPA> pré-chargée (pour getLastSyllable)
 * @returns mot initial français commun
 */
export function selectInitialWord(
  graph: Record<string, string[]>,
  dictionary: Map<string, string>
): string {
  const validStarters = STARTER_WORDS.filter(word => {
    const lastSyl = getLastSyllable(word, dictionary, graph)
    return lastSyl !== null && (graph[lastSyl]?.length ?? 0) >= 5
  })

  const pool = validStarters.length > 0 ? validStarters : STARTER_WORDS
  return pool[Math.floor(Math.random() * pool.length)]
}
```

### Décision Architecturale — Signature de `selectBotWord`

**Déviation intentionnelle par rapport à l'AC des epics :**

L'AC des epics spécifie `selectBotWord(lastSyllable, graph)` (sans `dictionary`). Cette signature est conservée car :
- L'invariant de `graph.json` garantit déjà FR11 (≥ 2 réponses) pour TOUS les mots dans les valeurs du graph
- O(1) — pas de lookup supplémentaire
- Suffit pour Story 3.6 : `selectBotWord(getLastSyllable(playerWord, dict, graph), graph)`

**Déviation pour `selectInitialWord` :**

L'AC spécifie `selectInitialWord(graph)` mais l'implémentation utilise `selectInitialWord(graph, dictionary)`. Raison : pour filtrer les `STARTER_WORDS` par richesse de leur dernière syllabe, `getLastSyllable()` nécessite `dictionary`. Sans `dictionary`, impossible de déterminer la dernière syllabe des mots candidates.

### Stratégie de Tests — Import des vrais JSON

```typescript
// src/engine/botSelector.test.ts
import { describe, it, expect } from 'vitest'
import { selectBotWord, selectInitialWord } from './botSelector'
import { getLastSyllable } from './phonetics'

import dictionaryRaw from '../../public/dictionary.json'
import graphRaw from '../../public/graph.json'

const dictionary = new Map<string, string>(Object.entries(dictionaryRaw))
const graph = graphRaw as Record<string, string[]>

describe('selectBotWord', () => {
  it('retourne un mot de graph["la"] pour lastSyllable="la"', () => {
    const word = selectBotWord('la', graph)
    expect(word).not.toBeNull()
    expect(graph['la']).toContain(word)
  })

  it('retourne null pour une syllabe inconnue', () => {
    const word = selectBotWord('syllabe_inconnue_xyz', graph)
    expect(word).toBeNull()
  })

  it('produit des résultats variés (Math.random)', () => {
    const results = new Set(Array.from({ length: 20 }, () => selectBotWord('la', graph)))
    expect(results.size).toBeGreaterThan(1) // très improbable d'avoir 1 seul résultat sur 20
  })

  it('aucun dead end — la dernière syllabe du mot retourné est une clé graph', () => {
    const word = selectBotWord('la', graph)
    expect(word).not.toBeNull()
    const lastSyl = getLastSyllable(word!, dictionary, graph)
    expect(lastSyl).not.toBeNull()
    expect(graph[lastSyl!]).toBeDefined()
    expect(graph[lastSyl!].length).toBeGreaterThanOrEqual(2)
  })
})

describe('selectInitialWord', () => {
  it('retourne un mot présent dans dictionary', () => {
    const word = selectInitialWord(graph, dictionary)
    expect(dictionary.has(word)).toBe(true)
  })

  it('retourne un mot dont la dernière syllabe a ≥ 5 réponses', () => {
    const word = selectInitialWord(graph, dictionary)
    const lastSyl = getLastSyllable(word, dictionary, graph)
    expect(lastSyl).not.toBeNull()
    expect(graph[lastSyl!].length).toBeGreaterThanOrEqual(5)
  })

  it('produit des résultats variés (Math.random)', () => {
    const results = new Set(Array.from({ length: 30 }, () => selectInitialWord(graph, dictionary)))
    expect(results.size).toBeGreaterThan(1)
  })
})
```

### État Actuel du Projet (ne pas casser)

**Fichiers existants à NE PAS modifier sauf si indiqué :**
- `src/engine/dataLoader.ts` — stable ✅ (GameData, loadGameData)
- `src/engine/dataLoader.test.ts` — stable ✅ (11 tests passent)
- `src/engine/phonetics.ts` — stable ✅ (83 tests phonetics passent post code review)
- `src/engine/phonetics.test.ts` — stable ✅
- `src/config/constants.ts` — stable ✅ (PHONETIC_TOLERANCE = 2, TIMER_*)
- `src/config/index.ts` — stable ✅
- `src/hooks/useGameData.ts` — stable ✅

**Fichiers à créer :**
- `src/engine/botSelector.ts`
- `src/engine/botSelector.test.ts`

**Fichiers à modifier :**
- `src/engine/index.ts` — ajouter `export { selectBotWord, selectInitialWord } from './botSelector'`

**Fichiers à NE PAS créer :**
- Pas de dossier `src/context/` (GameDataContext reste dans App.tsx — décision Story 2.1)
- Pas de dossier `src/__tests__/` (tests co-localisés — ARC6)

### Leçons Critiques de la Story 2.2 (Intelligence Héritée)

| Leçon Story 2.2 | Application en Story 2.3 |
|---|---|
| `getFirstSyllable` découvert nécessaire (préfixe fixe insuffisant) | Utiliser `getLastSyllable` depuis `./phonetics` — ne PAS réimplémenter |
| `normalizeIPAChars` NON exportée de `index.ts` (retirée en code review) | Ne pas l'importer depuis `index.ts` — elle est dans `phonetics.ts` mais privée |
| `getFirstSyllable` EST exportée de `phonetics.ts` mais pas de `index.ts` | Pour les tests : importer `getLastSyllable` depuis `'./phonetics'` directement |
| Tests importent les vrais JSON (dictionary.json ~2MB) | Même pattern — importer `dictionaryRaw` + `graphRaw` dans botSelector.test.ts |
| `resolveJsonModule: true` dans tsconfig — déjà configuré | Aucune action nécessaire |
| Vitest supporte imports JSON nativement | Aucune config supplémentaire |
| Déviation intentionnelle documentée dans Change Log | Documenter la déviation sur signatures de fonction |

### Conventions de Nommage Obligatoires

| Élément | Convention | Exemple |
|---|---|---|
| Fichier module | `camelCase.ts` | `botSelector.ts` |
| Fichier test | co-localisé `.test.ts` | `botSelector.test.ts` |
| Fonctions exportées | `camelCase` | `selectBotWord()`, `selectInitialWord()` |
| Constantes internes | `SCREAMING_SNAKE_CASE` | `STARTER_WORDS` |
| Types (si ajoutés) | `PascalCase` | `BotSelectorOptions` |

[Source: architecture.md#Naming Patterns]

### Frontières Architecturales à Respecter

1. **`src/engine/` = pur TypeScript, zéro React** — `botSelector.ts` ne doit importer ni React ni aucun hook. [Source: architecture.md#Frontières Architecturales]
2. **Imports internes** : `botSelector.ts` peut importer depuis `'./phonetics'` (même dossier engine/) pour `getLastSyllable`. Ne pas importer via `'../engine'` (le barrel — éviter circularité).
3. **Exports via barrel file** — exporter uniquement via `src/engine/index.ts`. [Source: architecture.md#ARC9]
4. **Zéro calcul phonétique** — `selectBotWord` ne fait aucun calcul IPA. Les invariants de graph.json font le travail. Uniquement `selectInitialWord` utilise `getLastSyllable` pour le filtrage de la liste de démarrage.
5. **State immutable** — ces fonctions retournent de nouvelles valeurs, ne modifient jamais graph ou dictionary.

### Données JSON — Format Rappel

**graph.json (structure clé pour ce module) :**
```json
{
  "la": ["lapin", "lac", "laver", "lampe", ...],  // 347 entrées
  "pɛ̃": ["pain", "peindre", "pintade", ...],
  "ʃo": ["chocolat", "choper", ...]
}
```
- 2 560 clés = dernières syllabes IPA
- INVARIANT CRITIQUE : chaque mot dans les valeurs a sa propre dernière syllabe comme clé dans graph (construit par `build_graph.py`)
- INVARIANT CRITIQUE : chaque clé a ≥ 2 mots dans sa liste

**Exemple de flux de jeu utilisant botSelector :**
```
1. Démarrage : selectInitialWord(graph, dictionary) → "chocolat"
2. Bot joue : "chocolat" → lastSyllable = getLastSyllable("chocolat", dict, graph) = "la"
3. Joueur répond : "lapin" → validateWord("lapin", "chocolat", dict, graph) → valid
4. Tour suivant : lastSyllable = getLastSyllable("lapin", dict, graph) = "pɛ̃"
5. Bot joue : selectBotWord("pɛ̃", graph) → "pain" ou autre
```

### Project Structure Notes

#### Alignement avec l'architecture définie

```
src/engine/
├── botSelector.ts      ← CRÉÉ ici — selectBotWord(), selectInitialWord()
├── botSelector.test.ts ← CRÉÉ ici — tests AC1-AC4 (ARC6)
├── phonetics.ts        ← stable (importé par botSelector.ts)
├── phonetics.test.ts   ← stable (83 tests)
├── dataLoader.ts       ← stable
├── dataLoader.test.ts  ← stable
└── index.ts            ← MODIFIÉ — + exports botSelector
```

[Source: architecture.md#Structure Complète du Projet — `src/engine/botSelector.ts` y est explicitement documenté]

#### Dépendances inter-stories

- **Cette story consomme** : `GameData` (dictionary + graph) de Story 2.1, `getLastSyllable` de Story 2.2
- **Cette story fournit à Story 3.4** (`StartScreen`) : `selectInitialWord()` appelé au `dispatch('START_GAME')`
- **Cette story fournit à Story 3.6** (`WordInput`) : `selectBotWord()` appelé après soumission joueur valide

#### Conflits Potentiels Détectés

- **Import circulaire potentiel** : `botSelector.ts` doit importer `getLastSyllable` depuis `'./phonetics'` (même dossier), PAS depuis `'../engine'` (barrel file du même dossier = circularité possible).
- **STARTER_WORDS à vérifier** : les IPA et syllabes indiquées dans les commentaires sont approximatives. Les tests vérifient automatiquement que chaque starter word a bien ≥ 5 réponses. Si un mot échoue au filtre, il est simplement écarté (fallback sur STARTER_WORDS brut). Aucune exception ne doit être levée.
- **Math.random() dans les tests** : utiliser un Set sur 20-30 appels pour vérifier la variété — ne pas mocker Math.random (ajoute de la complexité pour peu de valeur ici).

### References

- [Source: epics.md#Story 2.3] — User story complète, Acceptance Criteria (FR2, FR9, FR11)
- [Source: architecture.md#Frontières Architecturales] — engine/ = pur TypeScript, zéro React
- [Source: architecture.md#Naming Patterns] — camelCase pour modules engine/, SCREAMING_SNAKE pour constantes
- [Source: architecture.md#ARC6] — Tests co-localisés `.test.ts`
- [Source: architecture.md#ARC9] — Barrel files index.ts obligatoires
- [Source: architecture.md#Structure Complète du Projet] — `src/engine/botSelector.ts` documenté
- [Source: 2-2-module-phonetics-validation-phonetique.md#Completion Notes] — getFirstSyllable exportée, normalizeIPAChars non exposée, 83 tests passent
- [Source: 2-2-module-phonetics-validation-phonetique.md#Dev Notes] — Import JSON pattern, STARTER_WORDS approche, invariants graph.json
- [Source: 2-1-chargement-des-donnees-json-en-memoire.md#Dev Notes] — Format confirmé dictionary.json (121 028 entrées) + graph.json (2 560 clés), "la" → 347 mots
- [Source: architecture.md#NFR4] — Zéro calcul phonétique en temps réel

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage rencontré. Implémentation directe conforme aux Dev Notes.

### Completion Notes List

- ✅ `src/engine/botSelector.ts` créé : `selectBotWord()` (O(1), repose sur les invariants de graph.json) et `selectInitialWord()` (filtre STARTER_WORDS par richesse ≥ 5 réponses via `getLastSyllable`).
- ✅ `STARTER_WORDS` exportée — 10 mots français communs curatés.
- ✅ Zéro import React, zéro calcul IPA runtime dans `selectBotWord`. `selectInitialWord` utilise `getLastSyllable` uniquement pour filtrer les starters (hors gameplay temps réel).
- ✅ `src/engine/index.ts` mis à jour — barrel file ARC9 respecté.
- ✅ 7 nouveaux tests dans `botSelector.test.ts` — tous passent (90/90 total, aucune régression).
- ✅ Déviation documentée : `selectInitialWord(graph, dictionary)` au lieu de `selectInitialWord(graph)` — nécessaire pour `getLastSyllable`.

### File List

- `src/engine/botSelector.ts` (créé)
- `src/engine/botSelector.test.ts` (créé)
- `src/engine/index.ts` (modifié)

## Change Log

- **2026-03-09** : Implémentation complète de Story 2.3. Création de `botSelector.ts` avec `selectBotWord()` et `selectInitialWord()`. Déviation intentionnelle sur la signature de `selectInitialWord(graph, dictionary)` (vs `selectInitialWord(graph)` dans les epics) — nécessaire pour `getLastSyllable`. 7 tests ajoutés, 90/90 passent. Barrel file `index.ts` mis à jour.
- **2026-03-09** : Code review — 2 issues MEDIUM corrigés. (1) `selectInitialWord` fallback sécurisé : le fallback filtre désormais `dictionary.has(w)` avant de retomber sur `STARTER_WORDS` brut (AC3 garanti en production). (2) Test T3.4 renforcé : 20 appels sur 'la' + nouveau test sur 'pɛ̃' pour couvrir plusieurs syllabes. 91/91 tests passent.

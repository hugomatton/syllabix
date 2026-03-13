# Story 2.2 : Module Phonetics — Validation Phonétique

Status: done
<!-- Code review passed: 2026-03-09 -->

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que système,
Je veux un module TypeScript pur qui valide si un mot commence par la bonne syllabe,
Afin que les soumissions des joueurs soient vérifiées instantanément. (FR4, FR7, FR8, FR10)

## Acceptance Criteria

**AC1 — `getLastSyllable(word, dictionary, graph)` : extraction de la dernière syllabe**
- **Given** `src/engine/phonetics.ts` existe et exporte via `src/engine/index.ts`
- **When** j'appelle `getLastSyllable(word, dictionary, graph)`
- **Then** il retourne la dernière syllabe phonétique IPA du mot (FR7)
- **And** utilise la Map et le Record pré-chargés — pas de calcul temps réel (NFR4)
- **And** la syllabe retournée est une clé valide dans `graph`

**AC2 — `validateWord` : mot valide (match exact)**
- **Given** `validateWord(input, currentWord, dictionary, graph)` est appelé
- **When** le mot commence par la bonne syllabe (dist Levenshtein IPA = 0)
- **Then** retourne `{ valid: true, reason: null }`

**AC3 — `validateWord` : mot hors dictionnaire**
- **When** le mot n'est pas dans le dictionnaire
- **Then** retourne `{ valid: false, reason: 'not-in-dictionary' }` (FR10)

**AC4 — `validateWord` : mot dans le dictionnaire mais mauvaise syllabe**
- **When** le mot est dans le dictionnaire mais mauvaise syllabe (dist > PHONETIC_TOLERANCE)
- **Then** retourne `{ valid: false, reason: 'wrong-syllable' }` (FR7)

**AC5 — `validateWord` : zone de tolérance phonétique**
- **When** l'input est dans la zone de tolérance (dist IPA ≤ PHONETIC_TOLERANCE = 2)
- **Then** retourne `{ valid: true, reason: null }` (FR8)

**AC6 — Tests couvrant les 55 cas phonétiques**
- **Given** `src/engine/phonetics.test.ts` existe
- **When** j'exécute `npm run test`
- **Then** tous les tests passent, couvrant au minimum les 55 cas de `scripts/test_cases.json`
- **And** chaque validation s'exécute en <1ms (NFR1)

## Tasks / Subtasks

- [x] **T1 — Créer `src/engine/phonetics.ts`** (AC: 1, 2, 3, 4, 5)
  - [x] T1.1 — Définir et exporter `ValidationResult = { valid: boolean; reason: 'not-in-dictionary' | 'wrong-syllable' | null }`
  - [x] T1.2 — Implémenter `normalizeIPAChars(s: string): string[]` (NFC + spread en array de chars)
  - [x] T1.3 — Implémenter `levenshteinIPA(a: string, b: string): number` (algorithme DP, même logique que `run_tests.py`)
  - [x] T1.4 — Implémenter `getLastSyllable(word: string, dictionary: Map<string, string>, graph: Record<string, string[]>): string | null` (trouver la clé du graphe la plus longue qui est un suffixe de l'IPA du mot, NFC normalisé)
  - [x] T1.5 — Implémenter `validateWord(input: string, currentWord: string, dictionary: Map<string, string>, graph: Record<string, string[]>): ValidationResult` (logique en 4 étapes : dict check → getLastSyllable → getFirstSyllable → Levenshtein)

- [x] **T2 — Mettre à jour `src/engine/index.ts`** (ARC9)
  - [x] T2.1 — Exporter `validateWord`, `getLastSyllable`, `levenshteinIPA`, `type ValidationResult` depuis `src/engine/index.ts`

- [x] **T3 — Créer `src/engine/phonetics.test.ts`** (ARC6)
  - [x] T3.1 — Importer les 55 cas depuis `scripts/test_cases.json` via `import testCases from '../../scripts/test_cases.json'`
  - [x] T3.2 — Importer les vraies données JSON (dictionary.json + graph.json) pour couvrir fidèlement les 55 cas
  - [x] T3.3 — Tester `levenshteinIPA` : cas limite (strings vides, distance = 0, distance > 0, caractères IPA nasal `ɛ̃`, `ɔ̃`)
  - [x] T3.4 — Tester `getLastSyllable` : retourne null si mot absent, retourne bonne syllabe sur exemples connus (`'chocolat'` → `'la'`, `'lapin'` → `'pɛ̃'`)
  - [x] T3.5 — Tester `validateWord` avec les 55 cas de `test_cases.json` : chaque cas must match `expected`
  - [x] T3.6 — Tester AC3 explicitement : mot inexistant → `'not-in-dictionary'`
  - [x] T3.7 — Tester AC4 explicitement : mauvaise syllabe → `'wrong-syllable'`
  - [x] T3.8 — Exécuter `npm run test` — tous les tests doivent passer

## Dev Notes

### Contexte Critique

Story 2.2 est le **cœur logique de l'Epic 2**. Elle est **100% TypeScript pur** — zéro React, zéro DOM. Elle consomme les données fournies par Story 2.1 (Map + Record) et sera consommée par :
- **Story 2.3** (`botSelector.ts`) : utilisera `getLastSyllable` pour valider que le bot ne crée pas de dead end
- **Story 3.6** (`WordInput`) : appellera `validateWord` à chaque soumission joueur via `gameReducer`
- **Epic 3+** : tous les composants game passent par ce module pour toute validation phonétique

**Dépendances satisfaites :**
- ✅ `public/dictionary.json` — 121 028 entrées format `{"mot": "ipastring"}` (e.g., `"chocolat": "ʃokola"`)
- ✅ `public/graph.json` — 2 560 clés format `{"syllabe_ipa": ["mot1", "mot2", ...]}` (e.g., `"la": ["lapin", "lac", ...]`)
- ✅ `src/config/constants.ts` — `PHONETIC_TOLERANCE = 2`
- ✅ `src/engine/dataLoader.ts` — `loadGameData()` retourne `{ dictionary: Map<string, string>, graph: Record<string, string[]> }`
- ✅ `src/hooks/useGameData.ts` — `useGameData()` expose ces données via contexte
- ✅ `scripts/run_tests.py` — logique Python de référence à porter en TypeScript

### Architecture de `phonetics.ts`

Le module **ne doit PAS importer React** — il est pur TypeScript. Voici l'implémentation de référence complète, alignée sur `scripts/run_tests.py` :

```typescript
// src/engine/phonetics.ts
import { PHONETIC_TOLERANCE } from '../config'

export type ValidationResult = {
  valid: boolean
  reason: 'not-in-dictionary' | 'wrong-syllable' | null
}

/**
 * Normalise une chaîne IPA en NFC et la décompose en array de caractères.
 * Critique pour la gestion correcte des voyelles nasales (ɛ̃, ɔ̃, ɑ̃, œ̃).
 * Équivalent de normalize_ipa_chars() dans scripts/run_tests.py
 */
export function normalizeIPAChars(s: string): string[] {
  return [...s.normalize('NFC')]
}

/**
 * Distance de Levenshtein entre deux chaînes IPA, opérant sur des caractères NFC.
 * Algorithme DP optimisé O(m*n) — equivalent de levenshtein() dans scripts/run_tests.py
 * @returns distance d'édition entière ≥ 0
 */
export function levenshteinIPA(a: string, b: string): number {
  const aChars = normalizeIPAChars(a)
  const bChars = normalizeIPAChars(b)
  if (aChars.join('') === bChars.join('')) return 0
  if (!aChars.length) return bChars.length
  if (!bChars.length) return aChars.length

  const m = aChars.length
  const n = bChars.length
  const dp = Array.from({ length: n + 1 }, (_, i) => i)

  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = Math.min(
        dp[j] + 1,           // deletion
        dp[j - 1] + 1,       // insertion
        prev + (aChars[i - 1] === bChars[j - 1] ? 0 : 1) // substitution
      )
      prev = temp
    }
  }

  return dp[n]
}

/**
 * Retourne la dernière syllabe phonétique IPA d'un mot.
 * Stratégie : chercher la clé graph la plus longue qui est un suffixe de l'IPA du mot.
 * Les clés de graph.json sont exactement les dernières syllabes des mots valides.
 *
 * Ex: getLastSyllable("chocolat", dict, graph)
 *   → dict.get("chocolat") = "ʃokola"
 *   → graph key "la" est un suffixe de "ʃokola" → retourne "la"
 */
export function getLastSyllable(
  word: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>
): string | null {
  const ipa = dictionary.get(word.toLowerCase())
  if (!ipa) return null

  const normalizedIPA = ipa.normalize('NFC')
  let bestKey = ''

  for (const key of Object.keys(graph)) {
    const normalizedKey = key.normalize('NFC')
    if (
      normalizedIPA.endsWith(normalizedKey) &&
      normalizedKey.length > bestKey.length
    ) {
      bestKey = key
    }
  }

  return bestKey || null
}

/**
 * Valide si un mot soumis peut suivre le mot courant du bot.
 * Logique en 4 étapes alignée sur validate_word() de scripts/run_tests.py
 *
 * @param input     mot soumis par le joueur (non normalisé)
 * @param currentWord   mot courant du bot (dans le dictionnaire, last syllable = graph key)
 * @param dictionary    Map<mot, IPA> pré-chargée
 * @param graph         Record<syllabe, mots[]> pré-chargé
 */
export function validateWord(
  input: string,
  currentWord: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>
): ValidationResult {
  const normalizedInput = input.toLowerCase().trim()

  // Étape 1 : le mot doit être dans le dictionnaire (FR10)
  const inputIPA = dictionary.get(normalizedInput)
  if (!inputIPA) return { valid: false, reason: 'not-in-dictionary' }

  // Étape 2 : obtenir la dernière syllabe du mot courant (clé graph garantie car bot word)
  const targetSyl = getLastSyllable(currentWord, dictionary, graph)
  if (!targetSyl) return { valid: false, reason: 'wrong-syllable' }

  // Étape 3 : extraire le préfixe de l'IPA de l'input de même longueur que targetSyl
  const targetChars = normalizeIPAChars(targetSyl)
  const inputIPAChars = normalizeIPAChars(inputIPA)
  const inputStart = inputIPAChars.slice(0, targetChars.length).join('')

  // Étape 4 : distance de Levenshtein ≤ PHONETIC_TOLERANCE (FR8)
  const dist = levenshteinIPA(inputStart, targetSyl)
  if (dist <= PHONETIC_TOLERANCE) return { valid: true, reason: null }
  return { valid: false, reason: 'wrong-syllable' }
}
```

### Stratégie `getLastSyllable` — Explication de l'Algorithme

**Problème** : `dictionary.json` stocke l'IPA complet d'un mot (ex: `"chocolat": "ʃokola"`) mais pas la découpe syllabique. On a besoin de la DERNIÈRE syllabe pour comparer.

**Solution** : `graph.json` a été construit avec des CLÉS qui sont exactement les dernières syllabes des mots. Donc :

```
IPA("chocolat") = "ʃokola"
Graph clé "la" → "la" est un suffixe de "ʃokola" ✓ → last syllable = "la"

IPA("lapin") = "lapɛ̃"
Graph clé "pɛ̃" → "pɛ̃" est un suffixe de "lapɛ̃" ✓ → last syllable = "pɛ̃"
```

On prend la **plus longue** clé graph qui est suffixe de l'IPA, pour éviter les ambiguïtés (ex: si "la" ET "ola" étaient toutes deux des clés, on prendrait "ola").

**Invariant garanti** : le `currentWord` est toujours un mot sélectionné par le bot depuis les VALEURS de graph.json. Ces mots ont tous une dernière syllabe qui EST une clé dans graph.json. Donc `getLastSyllable(currentWord)` retourne toujours une valeur non-null.

### Stratégie de Validation — Préfixe IPA

Au lieu de calculer la première syllabe de l'input (ce qui nécessiterait Lexique.tsv au runtime), on compare le **préfixe de longueur `len(targetSyl)`** de l'IPA de l'input contre `targetSyl` :

```
targetSyl = "la" (2 chars NFC)
inputIPA("lapin") = "lapɛ̃" → inputIPAChars[0:2] = ['l','a'] → "la"
levenshteinIPA("la", "la") = 0 ≤ 2 → valid ✓

targetSyl = "pɛ̃" (3 chars NFC: p, ɛ, combining-tilde)
inputIPA("pain") = "pɛ̃" → inputIPAChars[0:3] = ['p','ɛ','̃'] → "pɛ̃"
levenshteinIPA("pɛ̃", "pɛ̃") = 0 ≤ 2 → valid ✓
```

Cette approche est O(n) pour l'extraction de préfixe et O(m*n) pour Levenshtein. Suffisamment rapide pour < 1ms (NFR1).

### NFC Normalization — Point Critique

Les voyelles nasales IPA comme `ɛ̃`, `ɔ̃`, `ɑ̃`, `œ̃` sont représentées en **deux code points** (ex: ɛ = U+025B + combining tilde U+0303). Après NFC :
- `'ɛ̃'.normalize('NFC')` → toujours 2 code points (pas de forme précomposée en Unicode)
- `[...'ɛ̃'.normalize('NFC')]` → `['ɛ', '̃']` — 2 éléments dans l'array

Donc `normalizeIPAChars('pɛ̃')` = `['p', 'ɛ', '̃']` = 3 chars (pas 2).

**⚠️ Importance** : Toujours appeler `.normalize('NFC')` AVANT de split/spread pour garantir la cohérence entre les valeurs de `dictionary.get()` et les clés de `Object.keys(graph)`.

[Source: epic-1-retro-2026-03-09.md — "IPA Unicode multi-code-points, normalisation NFC critique pour Levenshtein"]

### Stratégie de Tests — Importer `test_cases.json`

```typescript
// src/engine/phonetics.test.ts
import { describe, it, expect } from 'vitest'
import testCases from '../../scripts/test_cases.json'
import { validateWord, getLastSyllable, levenshteinIPA } from './phonetics'
import type { GameData } from './dataLoader'

// Note: les tests nécessitent les vraies données JSON chargées en mémoire
// Utiliser fetch mock via vitest ou charger directement les fichiers JSON
import dictionaryRaw from '../../public/dictionary.json'
import graphRaw from '../../public/graph.json'

const dictionary = new Map<string, string>(Object.entries(dictionaryRaw))
const graph = graphRaw as Record<string, string[]>

describe('levenshteinIPA', () => {
  it('retourne 0 pour des strings identiques', () => {
    expect(levenshteinIPA('la', 'la')).toBe(0)
    expect(levenshteinIPA('pɛ̃', 'pɛ̃')).toBe(0)
  })
  it('retourne la longueur de la string pour comparaison avec vide', () => {
    expect(levenshteinIPA('', 'la')).toBe(2)
    expect(levenshteinIPA('la', '')).toBe(2)
  })
  it('gère les voyelles nasales NFC (ɛ̃, ɔ̃)', () => {
    expect(levenshteinIPA('pɛ̃', 'pɔ̃')).toBe(1) // ɛ vs ɔ — 1 substitution
  })
})

describe('getLastSyllable', () => {
  it('retourne "la" pour "chocolat"', () => {
    expect(getLastSyllable('chocolat', dictionary, graph)).toBe('la')
  })
  it('retourne null pour un mot absent du dictionnaire', () => {
    expect(getLastSyllable('motinexistant', dictionary, graph)).toBeNull()
  })
})

describe('validateWord — 55 cas de test_cases.json', () => {
  it.each(testCases)('$word suit $previous → expected=$expected', ({ word, previous, expected }) => {
    const result = validateWord(word, previous, dictionary, graph)
    expect(result.valid).toBe(expected)
  })
})

describe('validateWord — cas unitaires', () => {
  it('retourne not-in-dictionary pour un mot absent', () => {
    const result = validateWord('zzzmotbidon', 'chocolat', dictionary, graph)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('not-in-dictionary')
  })
  it('retourne wrong-syllable pour mauvaise syllabe', () => {
    const result = validateWord('maison', 'chocolat', dictionary, graph) // "mɛ" ≠ "la"
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('wrong-syllable')
  })
})
```

**⚠️ Configuration Vitest pour JSON imports** : S'assurer que `vitest.config.ts` permet l'import JSON. Vite/Vitest supporte nativement les imports JSON, mais vérifier que `resolveJsonModule: true` est dans `tsconfig.json` (déjà présent dans les projets Vite standard).

**⚠️ Taille des JSON** : `dictionary.json` fait ~2MB. Les tests unitaires qui importent les vraies données seront légèrement plus lents au premier run (parsing JSON), mais les validations individuelles restent <1ms (NFR1). Utiliser les vraies données (pas de mock minimal) pour couvrir fidèlement les 55 cas de `test_cases.json`.

### État Actuel du Projet (ne pas casser)

**Fichiers existants à NE PAS modifier sauf si indiqué :**
- `src/engine/dataLoader.ts` — stable ✓ (GameData, loadGameData)
- `src/engine/dataLoader.test.ts` — stable ✓ (11 tests passent)
- `src/config/constants.ts` — stable ✓ (PHONETIC_TOLERANCE = 2)
- `src/config/index.ts` — stable ✓
- `src/hooks/useGameData.ts` — stable ✓ (hook React pour GameDataContext)

**Fichiers à créer :**
- `src/engine/phonetics.ts`
- `src/engine/phonetics.test.ts`

**Fichiers à modifier :**
- `src/engine/index.ts` — ajouter exports depuis `./phonetics`

**Fichiers à NE PAS créer :**
- Pas de dossier `src/context/` (GameDataContext reste dans App.tsx — décision Story 2.1)
- Pas de dossier `src/__tests__/` (tests co-localisés — ARC6)

### Leçons de la Story 2.1 (Intelligence Héritée)

| Leçon | Application en Story 2.2 |
|---|---|
| `response.ok` manquant → bug silencieux | Idem : ne pas ignorer les cas `null` dans getLastSyllable |
| `useGameData` dans hooks/ (pas App.tsx) | phonetics.ts DANS engine/ — pas de déplacement possible |
| React StrictMode double useEffect | Non applicable (module pur, pas de hooks) |
| Vitest : `vi.restoreAllMocks()` dans `beforeEach` | Pour les tests fetch si ajoutés plus tard |
| `ErrorScreen` vs `ErrorMessage` : décider tôt le nom canonique | `ValidationResult` est le nom canonique retenu |
| NFC : ɛ̃ = 2 code points après NFC | **Critique ici** : `normalizeIPAChars` doit spread en NFC |

### Intelligence Git (Patterns de Code)

Pas de commits git existants dans ce dépôt. Tous les patterns sont définis dans les stories et l'architecture :
- CSS Modules avec noms identiques au composant (non applicable ici — module pur)
- Tests co-localisés `.test.ts` au même niveau que `.ts` source [ARC6]
- Barrel file obligatoire via `src/engine/index.ts` [ARC9]
- Zéro `console.error` — erreurs via `ValidationResult.reason` [architecture.md#Patterns d'Erreur]

### Conventions de Nommage Obligatoires

| Élément | Convention | Exemple |
|---|---|---|
| Types | `PascalCase` | `ValidationResult` |
| Fonctions exportées | `camelCase` | `validateWord()`, `getLastSyllable()`, `levenshteinIPA()` |
| Fonctions internes | `camelCase` | `normalizeIPAChars()` |
| Constantes | `SCREAMING_SNAKE_CASE` (depuis `../config`) | `PHONETIC_TOLERANCE` |
| Tests | co-localisés `.test.ts` | `phonetics.test.ts` |

[Source: architecture.md#Naming Patterns]

### Frontières Architecturales à Respecter

1. **`src/engine/` = pur TypeScript, zéro React** — `phonetics.ts` ne doit importer ni React ni aucun hook. [Source: architecture.md#Frontières Architecturales]
2. **Constantes depuis `src/config/constants.ts`** — importer `PHONETIC_TOLERANCE` depuis `'../config'`, ne jamais hardcoder `2`.
3. **Exports via barrel file** — exporter uniquement via `src/engine/index.ts`. [Source: architecture.md#ARC9]
4. **Zéro appel réseau** — phonetics.ts reçoit les données en paramètre, ne fetch rien. Les données sont fournies par le contexte React (App.tsx via GameDataContext).
5. **Zéro mutation des données** — dictionary et graph sont en lecture seule.

### Données JSON — Format Rappel

**dictionary.json** (Map en mémoire) :
```json
{
  "chocolat": "ʃokola",
  "lapin": "lapɛ̃",
  "maison": "mɛzɔ̃",
  "pain": "pɛ̃"
}
```
- 121 028 entrées, mots en minuscules normalisées
- Valeurs : chaîne IPA complète SANS séparateurs de syllabes

**graph.json** (Record en mémoire) :
```json
{
  "la": ["lapin", "lac", "laver", "lampe", ...],
  "pɛ̃": ["pain", "peindre", "pintade", ...],
  "ʃo": ["chocolat", "choper", ...]
}
```
- 2 560 clés = dernières syllabes IPA des mots valides
- Chaque clé a ≥ 2 mots (invariant garanti par build_graph.py)
- `"la"` → 347 mots [Source: 2-1-chargement-des-donnees-json-en-memoire.md#Dev Notes]

### Project Structure Notes

#### Alignement avec l'architecture définie

```
src/engine/
├── phonetics.ts      ← CRÉÉ ici — getLastSyllable(), validateWord(), levenshteinIPA()
├── phonetics.test.ts ← CRÉÉ ici — 55 cas + tests unitaires (ARC6)
├── dataLoader.ts     ← stable
├── dataLoader.test.ts← stable
└── index.ts          ← MODIFIÉ — + exports phonetics
```

[Source: architecture.md#Structure Complète du Projet — `src/engine/phonetics.ts` y est explicitement documenté]

#### Dépendances inter-stories

- **Cette story consomme** : `GameData` (dictionary + graph) de Story 2.1
- **Cette story fournit à Story 2.3** (`botSelector.ts`) : `getLastSyllable()` pour vérifier les dead ends
- **Cette story fournit à Story 3.6** (`WordInput`) : `validateWord()` appelé depuis le `gameReducer`
- **Cette story fournit à l'Epic 3+** : module stable et testé pour toute validation phonétique

#### Conflits Potentiels Détectés

- **Import JSON volumineux dans les tests** : dictionary.json (~2MB) sera importé statiquement dans phonetics.test.ts. Vitest le parse une fois, performances correctes. Si le test runner est trop lent, envisager un `beforeAll` avec `fs.readFileSync` comme alternative.
- **tsconfig `resolveJsonModule`** : Vite/Vitest supporte les imports JSON nativement. Vérifier que `"resolveJsonModule": true` est dans `tsconfig.json` (ajouté par le template react-ts).
- **Ambiguïté de suffixe** : Si deux clés graph sont toutes deux des suffixes de l'IPA d'un mot (ex hypothétique: `"a"` et `"la"` toutes deux dans graph), l'algorithme prend le PLUS LONG suffixe. Ceci est le comportement correct (syllabe la plus spécifique).

### References

- [Source: epics.md#Story 2.2] — User story complète et Acceptance Criteria (FR4, FR7, FR8, FR10)
- [Source: architecture.md#Frontières Architecturales] — engine/ = pur TypeScript, zéro React
- [Source: architecture.md#Naming Patterns] — conventions de nommage
- [Source: architecture.md#ARC5] — CSS Modules (non applicable ici)
- [Source: architecture.md#ARC6] — Tests co-localisés
- [Source: architecture.md#ARC9] — Barrel files index.ts obligatoires
- [Source: architecture.md#Patterns d'Erreur] — erreurs via ValidationResult, jamais console.error
- [Source: architecture.md#NFR1] — Validation <300ms / <1ms par lookup
- [Source: architecture.md#NFR4] — Zéro calcul phonétique en temps réel
- [Source: scripts/run_tests.py] — Implémentation Python de référence (levenshtein, normalize_ipa_chars, validate_word)
- [Source: scripts/build_graph.py] — Logique de construction des clés graph (last_syllable_IPA = suffixe de IPA)
- [Source: scripts/test_cases.json] — 55 cas de test phonétiques à couvrir
- [Source: 2-1-chargement-des-donnees-json-en-memoire.md#Dev Notes] — Format confirmé dictionary.json + graph.json, intelligence Story 2.1
- [Source: epic-1-retro-2026-03-09.md] — IPA Unicode NFC critique, pas d'espeak-ng, dict 121 028 entrées, graph 2 560 clés

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Découverte clé : le référence de l'implémentation (préfixe de longueur fixe) échouait pour 5/55 cas phonétiques. Problème : (1) mots à première syllabe courte comme 'aicher' (IPA='ɛʃe', first_syl='ɛ') — le préfixe de 3 chars donnait 'ɛʃe' trop différent de 'pɛ̃' ; (2) mots avec voyelle nasale combinante comme 'pain' (IPA='pɛ̃', 3 NFC chars) comparé à 'le' (2 chars) — le préfixe coupait le combining tilde. Solution : `getFirstSyllable` (symétrique à `getLastSyllable`, recherche le plus long PRÉFIXE de l'IPA qui est une clé graph). Les clés graph couvrent les syllabes valides du français, y compris les premières syllabes — 100% des 55 cas passent avec cette approche.

### Completion Notes List

- ✅ `src/engine/phonetics.ts` créé : `ValidationResult`, `normalizeIPAChars`, `levenshteinIPA`, `getLastSyllable`, `getFirstSyllable` (exportée), `validateWord`
- ✅ `src/engine/index.ts` mis à jour : exports `validateWord`, `getLastSyllable`, `levenshteinIPA`, `ValidationResult` (normalizeIPAChars non exposée — helper interne)
- ✅ `src/engine/phonetics.test.ts` créé : 72 tests (55 cas test_cases.json + 17 unitaires levenshtein/getLastSyllable/getFirstSyllable/validateWord dont fallback)
- ✅ 83/83 tests passent (3 fichiers de test : dataLoader, App, phonetics)
- ✅ Déviation intentionnelle du référence : `getFirstSyllable` via clés graph (au lieu de préfixe fixe) — plus fidèle à l'approche Lexique Python sans dépendance runtime
- ✅ Module 100% TypeScript pur, zéro import React

### File List

- `src/engine/phonetics.ts` (créé, puis modifié code review — export getFirstSyllable)
- `src/engine/phonetics.test.ts` (créé, puis modifié code review — +4 tests getFirstSyllable/fallback)
- `src/engine/index.ts` (modifié — ajout exports phonetics, retrait normalizeIPAChars en code review)

## Change Log

- 2026-03-09 : Implémentation Story 2.2 — module phonetics.ts avec getLastSyllable, validateWord, levenshteinIPA, normalizeIPAChars. Découverte et résolution : getFirstSyllable via clés graph nécessaire pour couvrir 100% des 55 cas phonétiques (préfixe fixe insuffisant pour voyelles initiales et voyelles nasales combinantes). 79/79 tests passent.
- 2026-03-09 : Code review — 4 fixes : (1) getFirstSyllable exportée + 3 tests unitaires directs, (2) normalizeIPAChars retirée de l'API publique index.ts, (3) test du chemin fallback validateWord, (4) comptages de tests corrigés. 83/83 tests passent.

# Story 4.3 : Bonus Orthographe & Combo Syllabe Double

Status: done

## Story

En tant que joueur,
Je veux gagner des points bonus pour une orthographe parfaite et un match de double syllabe,
Afin que le jeu habile soit récompensé au-delà du simple matching phonétique. (FR16, FR17)

## Acceptance Criteria

**AC1 — Bonus orthographe : +2 points pour match phonétique exact**
- **Given** je soumets un mot phonétiquement valide
- **When** la première syllabe IPA de mon mot correspond EXACTEMENT à la dernière syllabe IPA du mot bot (distance de Levenshtein IPA = 0)
- **Then** le score s'incrémente de 2 au lieu de 1 (FR16)
- **And** un indicateur visuel subtil s'affiche 1.5s (badge "+2")

**AC2 — Combo syllabe double : +3 points**
- **Given** je soumets un mot phonétiquement valide
- **When** l'IPA de mon mot commence exactement par les 2 dernières syllabes IPA du mot bot (préfixe IPA exact)
- **Then** le score s'incrémente de 3 (FR17)
- **And** un indicateur visuel distinct s'affiche 1.5s (badge "+3 Combo !")

**AC3 — Cumul des bonus**
- **Given** un mot remplit les deux conditions simultanément (dist IPA = 0 ET préfixe 2 syllabes)
- **When** la validation réussit
- **Then** score +4 (1 base + 1 ortho + 2 combo)
- **And** l'indicateur affiche "+4 Combo !"

**AC4 — Comportement sans bonus inchangé**
- **Given** je soumets un mot valide dans la zone de tolérance (dist IPA > 0 mais ≤ PHONETIC_TOLERANCE)
- **When** la validation réussit
- **Then** score +1 comme avant — aucun changement au comportement existant
- **And** aucun indicateur bonus n'est affiché

**AC5 — Compatibilité RecordBurst**
- **Given** un mot bonus fait passer mon score au-delà du sessionRecord
- **When** score +2, +3, ou +4
- **Then** le RecordBurst se déclenche correctement (la logique `score > sessionRecord` dans GameScreen est agnostique du montant)

**AC6 — Tests**
- **Given** les fichiers de tests sont créés/mis à jour
- **When** j'exécute `npm run test`
- **Then** tous les tests passent sans régression (≥ 174 tests existants)
- **And** au moins 10 nouveaux tests couvrent : `getLastTwoSyllables`, bonus ortho, combo, cumul, cas bord, reducer mis à jour

## Tasks / Subtasks

- [x] **T1 — Étendre `src/engine/phonetics.ts`** (AC: 1, 2, 3, 4)
  - [x] T1.1 — Exporter `BonusType = 'none' | 'ortho' | 'combo' | 'both'`
  - [x] T1.2 — Enrichir `ValidationResult` : ajouter `bonusType: BonusType` et `scorePoints: number`
  - [x] T1.3 — Implémenter `getLastTwoSyllables(word, dictionary, graph): string | null` (cf. Dev Notes)
  - [x] T1.4 — Mettre à jour `validateWord()` pour calculer et retourner `bonusType` et `scorePoints`

- [x] **T2 — Mettre à jour `src/engine/index.ts`** (AC: -)
  - [x] T2.1 — Exporter `BonusType` et `getLastTwoSyllables`

- [x] **T3 — Mettre à jour `src/game/gameTypes.ts`** (AC: 1, 2, 3)
  - [x] T3.1 — Importer `BonusType` depuis `'../engine'`
  - [x] T3.2 — Étendre `SUBMIT_WORD` action : ajouter `scorePoints?: number` et `bonusType?: BonusType`

- [x] **T4 — Mettre à jour `src/game/gameReducer.ts`** (AC: 1, 2, 3, 4)
  - [x] T4.1 — `SUBMIT_WORD` valid path : `score: state.score + (action.scorePoints ?? 1)`

- [x] **T5 — Mettre à jour `src/components/GameScreen/WordInput.tsx`** (AC: 1, 2, 3, 4)
  - [x] T5.1 — Ajouter `useState<BonusType | null>(null)` pour `bonusIndicator`
  - [x] T5.2 — Ajouter `bonusTimerRef` pour nettoyage (pattern identique à `errorTimerRef`)
  - [x] T5.3 — Passer `scorePoints` et `bonusType` au dispatch `SUBMIT_WORD` quand valid
  - [x] T5.4 — Déclencher l'indicateur bonus (1.5s) via `setBonusIndicator(result.bonusType)` si bonusType ≠ 'none'
  - [x] T5.5 — Nettoyer `bonusTimerRef` dans le `useEffect` de cleanup au démontage

- [x] **T6 — Créer `src/components/GameScreen/BonusIndicator.tsx`** (AC: 1, 2, 3)
  - [x] T6.1 — Props : `bonusType: BonusType | null` — retourne `null` si `null` ou `'none'`
  - [x] T6.2 — Texte dynamique : `+2` (ortho), `+3 Combo !` (combo), `+4 Combo !` (both)
  - [x] T6.3 — `pointer-events: none`, `role="status"`, `aria-live="polite"`

- [x] **T7 — Créer `src/components/GameScreen/BonusIndicator.module.css`** (AC: 1, 2, 3)
  - [x] T7.1 — Positionnement flottant au-dessus de l'input (position: absolute, top: -2rem)
  - [x] T7.2 — Style ortho : badge amber (`--color-accent`) compact
  - [x] T7.3 — Style combo : badge vert-success (`--color-success`) plus large/gras
  - [x] T7.4 — Animation fade+scale via `@keyframes bonusPop` (300ms entrée + 900ms + 300ms sortie)
  - [x] T7.5 — `@media (prefers-reduced-motion: reduce)` : animation: none (UX7)

- [x] **T8 — Mettre à jour `src/components/GameScreen/WordInput.tsx`** (suite T5 — rendu)
  - [x] T8.1 — Importer et rendre `<BonusIndicator bonusType={bonusIndicator} />` dans le container

- [x] **T9 — Mettre à jour `src/components/GameScreen/index.ts`** (AC: -)
  - [x] T9.1 — Ajouter `export { BonusIndicator } from './BonusIndicator'`

- [x] **T10 — Créer `src/components/GameScreen/BonusIndicator.test.tsx`** (AC: 6)
  - [x] T10.1 — Test : `bonusType=null` → rien rendu
  - [x] T10.2 — Test : `bonusType='none'` → rien rendu
  - [x] T10.3 — Test : `bonusType='ortho'` → affiche "+2"
  - [x] T10.4 — Test : `bonusType='combo'` → affiche "+3 Combo !"
  - [x] T10.5 — Test : `bonusType='both'` → affiche "+4 Combo !"
  - [x] T10.6 — Test : présence `role="status"` et `aria-live="polite"`

- [x] **T11 — Mettre à jour `src/engine/phonetics.test.ts`** (AC: 6)
  - [x] T11.1 — Tests `getLastTwoSyllables` : cas normal, mot mono-syllabique, mot absent
  - [x] T11.2 — Tests `validateWord` enrichi : bonusType 'ortho' quand dist=0, 'none' quand dist>0
  - [x] T11.3 — Tests `validateWord` combo : 'combo' quand préfixe 2 syllabes correspond
  - [x] T11.4 — Tests `validateWord` cumul : 'both' et scorePoints=4

- [x] **T12 — Mettre à jour `src/game/gameReducer.test.ts`** (AC: 6)
  - [x] T12.1 — Test : `SUBMIT_WORD` avec `scorePoints: 2` → score = 0 + 2 = 2
  - [x] T12.2 — Test : `SUBMIT_WORD` avec `scorePoints: 3` → score correct
  - [x] T12.3 — Test : `SUBMIT_WORD` sans `scorePoints` → `score + 1` (rétro-compatibilité)

## Dev Notes

### État du Projet Post-Story 4.2

**Ce qui est en place et STABLE — NE PAS MODIFIER sauf indications ci-dessous :**

| Fichier | Statut | Note |
|---|---|---|
| `src/engine/phonetics.ts` | ✅ STABLE — MODIFIER | Ajouter `BonusType`, `getLastTwoSyllables`, enrichir `validateWord` |
| `src/engine/index.ts` | ✅ STABLE — MODIFIER | Exporter les nouveaux exports |
| `src/game/gameTypes.ts` | ✅ STABLE — MODIFIER | Importer `BonusType`, étendre `SUBMIT_WORD` |
| `src/game/gameReducer.ts` | ✅ STABLE — MODIFIER | 1 ligne : `score + (action.scorePoints ?? 1)` |
| `src/components/GameScreen/WordInput.tsx` | ✅ STABLE — MODIFIER | Ajouter bonus detection + BonusIndicator |
| `src/components/GameScreen/GameScreen.tsx` | ✅ STABLE — NE PAS MODIFIER | RecordBurst logic reste inchangée |
| `src/game/gameReducer.ts` — `GAME_OVER` | ✅ STABLE — NE PAS MODIFIER | `sessionRecord` update agnostique du scorePoints |
| `src/components/GameScreen/RecordBurst.*` | ✅ STABLE — NE PAS MODIFIER | Logique `score > sessionRecord` fonctionne avec n'importe quel incrément |

**174 tests passants actuellement. Target après story 4.3 : ≥ 184 tests.**

---

### Architecture Clé : Où Définir `BonusType`

**⚠️ DÉCISION : Définir `BonusType` dans `src/engine/phonetics.ts`**

Le bonus est déterminé par le moteur phonétique (c'est lui qui calcule `levenshtein` et détecte le préfixe syllabique). `BonusType` doit donc être défini là où il est calculé :

```typescript
// src/engine/phonetics.ts
export type BonusType = 'none' | 'ortho' | 'combo' | 'both'
```

Ensuite re-exporté depuis `src/engine/index.ts` :
```typescript
export type { BonusType } from './phonetics'
```

Et importé dans `src/game/gameTypes.ts` :
```typescript
import type { BonusType } from '../engine'
```

Cette dépendance `game/ → engine/` est acceptable (c'est déjà le cas dans `WordInput.tsx`). L'inverse `engine/ → game/` serait interdit.

---

### Implémentation `ValidationResult` Enrichi

```typescript
// src/engine/phonetics.ts

export type BonusType = 'none' | 'ortho' | 'combo' | 'both'

export type ValidationResult = {
  valid: boolean
  reason: 'not-in-dictionary' | 'wrong-syllable' | null
  bonusType: BonusType   // toujours présent (défaut 'none' si invalid)
  scorePoints: number    // 1 si invalid, 1/2/3/4 si valid
}
```

**⚠️ ATTENTION :** `bonusType` et `scorePoints` sont toujours présents (pas optionnels) pour simplifier les callers. Pour un mot invalide : `bonusType: 'none'`, `scorePoints: 1` (valeur ignorée par le reducer qui vérifie `isValid` d'abord).

---

### Implémentation `getLastTwoSyllables`

```typescript
// src/engine/phonetics.ts

/**
 * Retourne la concaténation des 2 dernières syllabes IPA d'un mot.
 * Utilise la même stratégie que getLastSyllable : cherche les suffixes les plus longs
 * dans les clés de graph.json.
 *
 * Ex: getLastTwoSyllables("chocolat", dict, graph)
 *   → IPA "ʃokola"
 *   → lastSyl = "la" → remaining = "ʃoko"
 *   → penultimateSyl = "ko" (suffixe le plus long de "ʃoko" dans graph)
 *   → retourne "kola"
 */
export function getLastTwoSyllables(
  word: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>,
): string | null {
  const ipa = dictionary.get(word.toLowerCase())
  if (!ipa) return null

  const normalizedIPA = ipa.normalize('NFC')

  // Obtenir la dernière syllabe (algorithme déjà implémenté)
  const lastSyl = getLastSyllable(word, dictionary, graph)
  if (!lastSyl) return null

  const normalizedLastSyl = lastSyl.normalize('NFC')
  const remaining = normalizedIPA.slice(0, normalizedIPA.length - normalizedLastSyl.length)

  // Mot mono-syllabique (ou IPA = lastSyl) : retourner la seule syllabe
  if (!remaining) return normalizedLastSyl

  // Chercher la "avant-dernière syllabe" = suffixe le plus long de `remaining` dans graph
  let bestKey = ''
  let bestKeyNormalizedLength = 0

  for (const key of Object.keys(graph)) {
    const normalizedKey = key.normalize('NFC')
    if (remaining.endsWith(normalizedKey) && normalizedKey.length > bestKeyNormalizedLength) {
      bestKey = key
      bestKeyNormalizedLength = normalizedKey.length
    }
  }

  // Si on ne trouve pas de deuxième syllabe : retourner seulement la dernière
  if (!bestKey) return normalizedLastSyl

  return bestKey.normalize('NFC') + normalizedLastSyl
}
```

---

### Implémentation `validateWord` Mis à Jour

Ajouter la détection bonus à la fin de la fonction, après les vérifications d'invalidité :

```typescript
export function validateWord(
  input: string,
  currentWord: string,
  dictionary: Map<string, string>,
  graph: Record<string, string[]>,
): ValidationResult {
  const normalizedInput = input.toLowerCase().trim()

  // Étape 1 : mot dans le dictionnaire (FR10)
  const inputIPA = dictionary.get(normalizedInput)
  if (!inputIPA) return { valid: false, reason: 'not-in-dictionary', bonusType: 'none', scorePoints: 1 }

  // Étape 2 : dernière syllabe du mot courant
  const targetSyl = getLastSyllable(currentWord, dictionary, graph)
  if (!targetSyl) return { valid: false, reason: 'wrong-syllable', bonusType: 'none', scorePoints: 1 }

  // Étape 3 : première syllabe de l'input
  const firstSyl = getFirstSyllable(normalizedInput, dictionary, graph)
  let inputStart: string
  if (firstSyl) {
    inputStart = firstSyl
  } else {
    const targetChars = normalizeIPAChars(targetSyl)
    const inputIPAChars = normalizeIPAChars(inputIPA)
    inputStart = inputIPAChars.slice(0, targetChars.length).join('')
  }

  // Étape 4 : distance de Levenshtein ≤ PHONETIC_TOLERANCE
  const dist = levenshteinIPA(inputStart, targetSyl)
  if (dist > PHONETIC_TOLERANCE) return { valid: false, reason: 'wrong-syllable', bonusType: 'none', scorePoints: 1 }

  // ✅ Mot valide — calculer les bonus
  const isOrthoBonus = dist === 0  // match phonétique exact (AC1)

  // Combo : l'IPA de l'input commence-t-il par les 2 dernières syllabes du mot courant ? (AC2)
  const lastTwoSyl = getLastTwoSyllables(currentWord, dictionary, graph)
  const isComboBonus = lastTwoSyl !== null
    && inputIPA.normalize('NFC').startsWith(lastTwoSyl.normalize('NFC'))

  // Calcul scorePoints et bonusType
  let bonusType: BonusType = 'none'
  let scorePoints = 1
  if (isOrthoBonus && isComboBonus) { bonusType = 'both'; scorePoints = 4 }
  else if (isComboBonus)            { bonusType = 'combo'; scorePoints = 3 }
  else if (isOrthoBonus)            { bonusType = 'ortho'; scorePoints = 2 }

  return { valid: true, reason: null, bonusType, scorePoints }
}
```

---

### Implémentation `BonusIndicator.tsx`

```tsx
// src/components/GameScreen/BonusIndicator.tsx
import type { BonusType } from '../../engine'
import styles from './BonusIndicator.module.css'

interface BonusIndicatorProps {
  bonusType: BonusType | null
}

const BONUS_TEXT: Record<Exclude<BonusType, 'none'>, string> = {
  ortho: '+2',
  combo: '+3 Combo !',
  both:  '+4 Combo !',
}

export function BonusIndicator({ bonusType }: BonusIndicatorProps) {
  if (!bonusType || bonusType === 'none') return null

  const text = BONUS_TEXT[bonusType]
  const isCombo = bonusType === 'combo' || bonusType === 'both'

  return (
    <div
      className={`${styles.indicator} ${isCombo ? styles.combo : styles.ortho}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {text}
    </div>
  )
}
```

---

### Implémentation `BonusIndicator.module.css`

```css
/* src/components/GameScreen/BonusIndicator.module.css */

.indicator {
  position: absolute;
  top: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  font-weight: 700;
  padding: 0.25em 0.75em;
  border-radius: 999px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;

  @media (prefers-reduced-motion: no-preference) {
    animation: bonusPop 1.5s ease-out forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.ortho {
  color: var(--color-accent);
  background: var(--color-accent-bg);
  border: 1.5px solid var(--color-accent);
}

.combo {
  color: var(--color-success);
  background: #f0fdf4;  /* vert très clair — absent des tokens, valeur inline OK */
  border: 1.5px solid var(--color-success);
  font-size: 1.1rem;
}

@keyframes bonusPop {
  0%   { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.8); }
  20%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.05); }
  30%  { transform: translateX(-50%) translateY(0) scale(1.0); }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.9); }
}
```

---

### Mise à Jour `WordInput.tsx`

Changements à apporter (minimal — ne pas réécrire le fichier) :

**Import ajouté :**
```tsx
import type { BonusType } from '../../engine'
import { BonusIndicator } from './BonusIndicator'
```

**State ajouté (après les states existants) :**
```tsx
const [bonusIndicator, setBonusIndicator] = useState<BonusType | null>(null)
const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

**Dans le useEffect de cleanup (ajouter la ligne) :**
```tsx
if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current)
```

**Dans `handleSubmit()` — happy path, après `flash('success')` :**
```tsx
// Bonus indicator
if (result.bonusType !== 'none') {
  if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current)
  setBonusIndicator(result.bonusType)
  bonusTimerRef.current = setTimeout(() => setBonusIndicator(null), 1500)
}
```

**Dans le dispatch `SUBMIT_WORD` — ajouter scorePoints et bonusType :**
```tsx
dispatch({
  type: 'SUBMIT_WORD',
  word: trimmed,
  isValid: true,
  scorePoints: result.scorePoints,
  bonusType: result.bonusType,
})
```

**Dans le JSX retourné — ajouter BonusIndicator dans le container :**
Le `container` div doit avoir `position: relative` (pour le positionnement absolu du BonusIndicator).
```tsx
<div className={styles.container} style={{ position: 'relative' }}>
  <BonusIndicator bonusType={bonusIndicator} />
  <input ... />
  <ErrorMessage ... />
</div>
```
OU ajouter `position: relative` dans `WordInput.module.css` sur `.container`.

---

### Mise à Jour `gameTypes.ts`

```typescript
// Ajouter en haut du fichier :
import type { BonusType } from '../engine'

// Re-exporter pour les consumers (optionnel mais pratique) :
export type { BonusType }

// Modifier SUBMIT_WORD dans GameAction :
| { type: 'SUBMIT_WORD'; word: string; isValid: boolean; error?: string; scorePoints?: number; bonusType?: BonusType }
```

---

### Mise à Jour `gameReducer.ts`

```typescript
case 'SUBMIT_WORD':
  if (state.phase !== 'playing') return state
  if (!action.isValid) {
    return { ...state, lastError: action.error ?? 'Mot invalide' }
  }
  return {
    ...state,
    chain: [...state.chain, action.word],
    score: state.score + (action.scorePoints ?? 1),  // ← SEUL CHANGEMENT
    lastError: null,
  }
```

---

### Calcul des Scores — Tableau de Référence

| Condition | `dist` | Préfixe 2 syllabes | `bonusType` | `scorePoints` |
|---|---|---|---|---|
| Tolérance (proche) | > 0, ≤ 2 | non | `'none'` | 1 |
| Ortho exact seulement | = 0 | non | `'ortho'` | 2 |
| Combo seulement | > 0, ≤ 2 | oui | `'combo'` | 3 |
| Ortho + Combo | = 0 | oui | `'both'` | 4 |

**Note :** Le combo (FR17) peut techniquement s'appliquer même si le match phonétique est approximatif (dist > 0 mais ≤ tolerance). Cela semble contre-intuitif mais est conforme aux ACs qui définissent les deux bonus indépendamment.

---

### Structure Finale Post-Story 4.3

```
src/
├── engine/
│   ├── phonetics.ts          ✅ MODIFIER — BonusType, getLastTwoSyllables, validateWord enrichi
│   ├── phonetics.test.ts     ✅ MODIFIER — tests getLastTwoSyllables + bonus
│   ├── index.ts              ✅ MODIFIER — export BonusType, getLastTwoSyllables
│   └── (reste inchangé)
├── game/
│   ├── gameTypes.ts          ✅ MODIFIER — import BonusType, étendre SUBMIT_WORD
│   ├── gameReducer.ts        ✅ MODIFIER — 1 ligne : scorePoints ?? 1
│   ├── gameReducer.test.ts   ✅ MODIFIER — tests scorePoints
│   └── (reste inchangé)
├── components/
│   └── GameScreen/
│       ├── BonusIndicator.tsx        🔲 CRÉER
│       ├── BonusIndicator.module.css 🔲 CRÉER
│       ├── BonusIndicator.test.tsx   🔲 CRÉER (6 tests)
│       ├── WordInput.tsx             ✅ MODIFIER — bonus detection + BonusIndicator
│       ├── index.ts                  ✅ MODIFIER — export BonusIndicator
│       ├── GameScreen.tsx            ✅ NE PAS MODIFIER
│       ├── RecordBurst.tsx           ✅ NE PAS MODIFIER
│       └── (reste inchangé)
```

---

### Ce que cette Story NE Touche PAS

- **`GameScreen.tsx`** — pas de changement (RecordBurst fonctionne sans modification pour des +2/+3/+4)
- **`RecordBurst.tsx`** — inchangé (compare `score > sessionRecord`, agnostique du montant)
- **`gameReducer.ts` — `GAME_OVER`** — inchangé (prend `state.score` quel qu'il soit)
- **`ScoreDisplay.tsx`** — inchangé (affiche juste le score numérique)
- **Scripts Python** — inchangés (génération des JSON, pas de logique bonus)
- **`timer.ts`, `botSelector.ts`** — inchangés

---

### Interactions avec les Stories Suivantes

**Story 5.x (GameOver screen) :**
- Le score final affiché sera le score cumulé avec les bonus — déjà correct via reducer
- Le `sessionRecord` sera correct si score avec bonus > record précédent

---

### Project Structure Notes

**Fichiers à créer :**
- `src/components/GameScreen/BonusIndicator.tsx`
- `src/components/GameScreen/BonusIndicator.module.css`
- `src/components/GameScreen/BonusIndicator.test.tsx` (6 tests)

**Fichiers à modifier :**
- `src/engine/phonetics.ts` (BonusType, getLastTwoSyllables, validateWord)
- `src/engine/index.ts` (exports)
- `src/engine/phonetics.test.ts` (nouveaux tests)
- `src/game/gameTypes.ts` (import BonusType, SUBMIT_WORD étendu)
- `src/game/gameReducer.ts` (scorePoints ?? 1)
- `src/game/gameReducer.test.ts` (tests scorePoints)
- `src/components/GameScreen/WordInput.tsx` (bonus detection + indicateur)
- `src/components/GameScreen/index.ts` (export BonusIndicator)

**Conventions respectées :**
- `BonusType` défini dans le layer engine (phonetics.ts) qui le calcule — cohérent avec l'architecture
- Test co-localisé avec le composant (ARC6)
- CSS Modules uniquement (ARC5)
- État local React pour effet UI temporaire (pattern RecordBurst / flashState)
- Barrel file mis à jour (ARC9)
- `prefers-reduced-motion` conforme (UX7)
- `pointer-events: none` sur BonusIndicator — gameplay non interrompu (UX6)

### References

- [Source: epics.md#Story 4.3] — User story, ACs (FR16, FR17)
- [Source: architecture.md#Patterns de State] — immutabilité, spread uniquement
- [Source: architecture.md#Mapping Exigences → Structure] — FR12-17 dans game/ + GameScreen/
- [Source: architecture.md#Naming Patterns] — conventions fichiers, constantes, types
- [Source: src/engine/phonetics.ts] — `validateWord`, `getLastSyllable`, `getFirstSyllable`, `levenshteinIPA` — lus directement
- [Source: src/game/gameTypes.ts] — `GameAction.SUBMIT_WORD` actuel — lu directement
- [Source: src/game/gameReducer.ts] — logique `SUBMIT_WORD`, `score + 1` à changer — lu directement
- [Source: src/components/GameScreen/WordInput.tsx] — pattern flash, dispatch SUBMIT_WORD — lu directement
- [Source: src/components/GameScreen/GameScreen.tsx] — logique RecordBurst (`score > sessionRecord`) — lu directement
- [Source: 4-2-recordburst-effet-visuel-record-battu.md#Interactions] — "Story 4.3 modifiera SUBMIT_WORD pour +2 ou +3 selon le type de match"
- [Source: 4-2-recordburst-effet-visuel-record-battu.md#DevNotes] — pattern état local (showBurst/burstTimerRef) à reproduire pour bonusIndicator
- [Source: ux-design-specification.md#Feedback Patterns] — non-bloquant, pointer-events: none

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage majeur. Deux tests ont nécessité une correction de mock : le cas 'ortho' déclenchait aussi 'combo' car le mot courant était mono-syllabique (lastTwoSyl = lastSyl), et le cas 'both' utilisait un mock où dist > 0. Résolu en concevant des mocks précis avec des IPAs contrôlées._

### Completion Notes List

- `BonusType = 'none' | 'ortho' | 'combo' | 'both'` défini et exporté depuis `phonetics.ts`
- `ValidationResult` enrichi avec `bonusType` et `scorePoints` (toujours présents, pas optionnels)
- `getLastTwoSyllables()` implémenté : cherche la pénultième syllabe comme suffixe le plus long du "reste" IPA dans les clés du graph, retourne lastSyl seule pour les mots mono-syllabiques
- `validateWord()` : isOrthoBonus = dist === 0, isComboBonus = inputIPA.startsWith(lastTwoSyl)
- Reducer : `score + (action.scorePoints ?? 1)` — fallback `?? 1` maintient la rétrocompatibilité
- `BonusIndicator.tsx` : composant stateless, pointer-events: none, role="status", aria-live="polite"
- `BonusIndicator.module.css` : badge amber (ortho), badge vert-success (combo), @keyframes bonusPop 1.5s, prefers-reduced-motion: no animation
- `WordInput.tsx` : bonusIndicator state + bonusTimerRef (pattern identique à errorTimerRef), déclenché 1.5s après validation avec bonus
- `WordInput.module.css` : position: relative ajouté sur .container (nécessaire pour le positioning absolu du BonusIndicator)
- 197 tests passants (174 existants + 23 nouveaux) — zéro régression

### File List

- src/engine/phonetics.ts (modifié — BonusType, getLastTwoSyllables, validateWord enrichi)
- src/engine/index.ts (modifié — exports BonusType, getLastTwoSyllables)
- src/engine/phonetics.test.ts (modifié — +9 tests)
- src/engine/index.ts (modifié — exports BonusType, getLastTwoSyllables, getFirstSyllable)
- src/game/gameTypes.ts (modifié — import BonusType, SUBMIT_WORD étendu + commentaire traceability)
- src/game/gameReducer.ts (modifié — scorePoints ?? 1)
- src/game/gameReducer.test.ts (modifié — +5 tests bonus scorePoints)
- src/components/GameScreen/BonusIndicator.tsx (créé)
- src/components/GameScreen/BonusIndicator.module.css (créé — background via --color-success-bg token)
- src/components/GameScreen/BonusIndicator.test.tsx (créé — 8 tests)
- src/components/GameScreen/WordInput.tsx (modifié — bonus detection + BonusIndicator)
- src/components/GameScreen/WordInput.module.css (modifié — position: relative sur .container)
- src/components/GameScreen/WordInput.test.tsx (modifié — mocks ValidationResult enrichi + assertions scorePoints/bonusType + test bonus indicator)
- src/components/GameScreen/index.ts (modifié — export BonusIndicator)
- src/styles/globals.css (modifié — ajout --color-success-bg token)

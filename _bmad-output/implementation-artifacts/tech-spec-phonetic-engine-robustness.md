---
title: 'Robustesse du moteur phonétique V1'
slug: 'phonetic-engine-robustness'
created: '2026-03-13'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'React', 'Vitest', 'Python 3', 'Vite']
files_to_modify:
  - 'scripts/build_graph.py'
  - 'src/engine/dataLoader.ts'
  - 'src/engine/phonetics.ts'
  - 'src/components/GameScreen/WordInput.tsx'
  - 'src/components/GameOver/GameOver.tsx'
  - 'scripts/test_cases.json'
  - 'src/engine/phonetics.test.ts'
files_to_create:
  - 'public/syllables.json'
code_patterns:
  - 'Map<string, string> pour lookups O(1)'
  - 'Promise.all pour chargement parallèle (dataLoader)'
  - 'useReducer + GameAction dispatch (gameReducer)'
  - 'NFC normalisation sur tous les IPA avant comparaison'
test_patterns:
  - 'Vitest describe/it/expect'
  - 'Mocks via new Map() et Record<> inline'
  - 'test_cases.json chargé dans phonetics.test.ts via import'
---

# Tech-Spec: Robustesse du moteur phonétique V1

**Created:** 2026-03-13

## Overview

### Problem Statement

Le moteur phonétique de Syllabix V1 produit des résultats incorrects lors de la validation des mots joueur. La cause racine est architecturale : `build_graph.py` calcule des `first_syl` et `last_syl` fiables depuis Lexique383, mais ces données ne sont pas exposées au runtime TypeScript. En conséquence, `getFirstSyllable` dans `phonetics.ts` tente de deviner la première syllabe d'un mot en cherchant des clés du graph comme préfixes IPA — or ces clés sont des `last_syl` d'autres mots, pas des `first_syl`. Ce mismatch produit :

1. **Faux négatifs** : mots valides rejetés (`rombière → repasser` : `getFirstSyllable` retourne null)
2. **Dead-ends silencieux** : quand `getLastSyllable` retourne null pour le mot du joueur (`terrible`, `fleuriste`), la partie se termine sans message
3. **Formes fléchies acceptées** : `songes → songe` (même IPA, forme singulier/pluriel du même mot)

Cas NON traités car valides selon les règles (même pattern que `lapin → pain` dans test_cases.json) :
- `néfaste → fastes`, `hideux → deux` : mots monosyllabiques qui matchent exactement la syllabe cible

### Solution

1. Faire exporter par `build_graph.py` un fichier `public/syllables.json` (`{mot → first_syl_IPA}`) depuis Lexique, en parallèle du graph.json existant
2. Charger `syllables.json` dans `dataLoader.ts` et le passer au moteur phonétique
3. Remplacer `getFirstSyllable` par un lookup direct dans cette map
4. Ajouter un filtre de formes fléchies dans `validateWord`
5. Corriger la détection de dead-end quand `lastSyl` est null

### Scope

**In Scope:**
- `scripts/build_graph.py` : ajouter export `public/syllables.json`
- `src/engine/dataLoader.ts` : charger syllables.json, étendre GameData
- `src/engine/phonetics.ts` : refactorer `getFirstSyllable`, ajouter filtre inflexion
- `src/components/GameScreen/WordInput.tsx` : dead-end quand lastSyl=null
- `src/components/GameOver/GameOver.tsx` : message dead-end quand deadSyllable=undefined
- `scripts/test_cases.json` + `src/engine/phonetics.test.ts` : nouveaux cas de test

**Out of Scope:**
- Refonte du graph.json ou de build_dictionary.py
- Modification des règles de jeu (scoring, timer)
- Composants UI hors GameOver/WordInput
- Cas `néfaste → fastes` / `hideux → deux` (valides selon les règles)

---

## Context for Development

### Codebase Patterns

- **Immutabilité du state** : spread operator uniquement dans gameReducer (commentaire ARC10)
- **Chargement des données** : `Promise.all` obligatoire (commentaire ARC11) dans `dataLoader.ts`
- **Lookups** : toujours convertir les JSON objects en `Map<string, string>` pour O(1)
- **NFC** : toute comparaison IPA passe par `.normalize('NFC')` et `[...str]` pour les chars combinés
- **Tolérance phonétique** : `PHONETIC_TOLERANCE = 2` dans `src/config/constants.ts` — ne pas modifier
- **Tests** : Vitest, mocks inline (new Map + Record), `test_cases.json` pour les cas paramétriques
- **Dispatch** : `GameAction` est un union type dans `gameTypes.ts` — ne pas ajouter de champs sans étendre le type

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `scripts/build_graph.py` | Génère graph.json depuis Lexique — à modifier pour ajouter syllables.json |
| `src/engine/phonetics.ts` | Moteur de validation — `getFirstSyllable`, `validateWord` à modifier |
| `src/engine/dataLoader.ts` | Chargement async des JSON — à étendre pour syllables.json |
| `src/engine/phonetics.test.ts` | Tests du moteur — à compléter |
| `scripts/test_cases.json` | Cas paramétriques — à compléter |
| `src/game/gameTypes.ts` | Types GameState / GameAction |
| `src/components/GameScreen/WordInput.tsx` | Validation + réponse bot + dead-end |
| `src/components/GameOver/GameOver.tsx` | Affichage DeadEndMessage |
| `src/components/GameOver/DeadEndMessage.tsx` | Composant message dead-end (IPA affiché, déjà correct) |
| `public/graph.json` | Données graph runtime |
| `public/dictionary.json` | Données dictionnaire runtime |
| `scripts/Lexique383.tsv` | Source de vérité syllabique |

### Technical Decisions

**TD1 — syllables.json comme source de vérité pour first_syl**
Raison : `build_graph.py` a déjà accès à `word_syllables[word][0]` (first_syl IPA calculée depuis Lexique). Il suffit de l'écrire. Le runtime TypeScript peut le charger exactement comme dictionary.json.

**TD2 — `getFirstSyllable` garde un fallback**
Si un mot est dans le dictionnaire mais absent de syllables.json (ne devrait pas arriver après la correction), le fallback graph-key actuel reste en place pour la robustesse.

**TD3 — Filtre inflexion par stem**
Normalisation : retirer `-s`, `-es`, `-e`, `-aux` du mot joueur (in order, first match). Si le stem résultant est dans le dictionnaire ET a le même IPA NFC que `currentWord` → rejeter avec reason `'inflection'`. Ceci couvre `songes → songe` et autres pluriels/féminins du même mot.

**TD4 — Dead-end quand lastSyl=null**
Dans `WordInput.tsx`, quand `getLastSyllable(trimmed)` retourne null après un mot valide, dispatcher `GAME_OVER` avec `deadSyllable: dictionary.get(trimmed.toLowerCase()) ?? undefined`. Le composant `DeadEndMessage` affichera l'IPA (ce qui est déjà ce qu'il reçoit). Si l'IPA n'est pas lisible par le joueur, adapter le texte pour afficher la forme orthographique : modifier `DeadEndMessage` pour accepter aussi `word?: string` en fallback.

**TD5 — `miroir` à investiguer à l'implémentation**
`miroir` a 439 successeurs pour sa lastSyl "aʁ" — `selectBotWord` ne devrait pas retourner null. Le blocage est à reproduire et diagnostiquer pendant l'implémentation.

---

## Implementation Plan

### Tasks

**T1 — build_graph.py : export syllables.json**

Fichier : `scripts/build_graph.py`

Après la boucle de construction de `word_syllables` (ligne ~148), ajouter :
```python
SYLLABLES_PATH = Path("public/syllables.json")
syllables_first: dict[str, str] = {
    word: first_syl
    for word, (first_syl, _last_syl) in word_syllables.items()
    if first_syl
}
with open(SYLLABLES_PATH, 'w', encoding='utf-8') as f:
    json.dump(syllables_first, f, ensure_ascii=False, separators=(',', ':'))
print(f"✓ syllables.json: {len(syllables_first):,} entries")
```
Ajouter aussi une vérification d'intégrité (lecture + count) à la suite, dans le même style que graph.json.

**T2 — dataLoader.ts : charger syllables.json**

Fichier : `src/engine/dataLoader.ts`

1. Étendre `GameData` : ajouter `syllables: Map<string, string>` (`mot → first_syl_IPA`)
2. Dans `loadGameData`, ajouter `fetch('/syllables.json')` dans le `Promise.all`
3. Convertir en `Map<string, string>` comme le dictionnaire

**T3 — phonetics.ts : refactorer getFirstSyllable**

Fichier : `src/engine/phonetics.ts`

Nouvelle signature :
```typescript
export function getFirstSyllable(
  word: string,
  syllables: Map<string, string>,         // ← nouveau param
  graph: Record<string, string[]>,         // ← conservé pour fallback
): string | null
```

Logique :
1. Chercher `syllables.get(word.toLowerCase())` → si trouvé, normaliser NFC et retourner
2. Sinon fallback : comportement actuel (préfixe le plus long dans les clés graph)

Mettre à jour tous les appels de `getFirstSyllable` dans `validateWord` pour passer `syllables`.

**T4 — phonetics.ts : ajouter filtre inflexions dans validateWord**

Fichier : `src/engine/phonetics.ts`

Après l'Étape 1 (vérification dictionnaire), ajouter l'Étape 1bis :
```typescript
// Étape 1bis : rejeter les formes fléchies du mot courant
const suffixes = ['aux', 'es', 's', 'e']  // ordre : plus long d'abord
for (const suffix of suffixes) {
  if (normalizedInput.endsWith(suffix)) {
    const stem = normalizedInput.slice(0, -suffix.length)
    const stemIPA = dictionary.get(stem)
    const currentIPA = dictionary.get(currentWord.toLowerCase())
    if (stemIPA && currentIPA && stemIPA.normalize('NFC') === currentIPA.normalize('NFC')) {
      return { valid: false, reason: 'wrong-syllable', bonusType: 'none', scorePoints: 1 }
    }
    break  // ne tester qu'un seul suffixe
  }
}
```

**T5 — ValidateWord signature : propager syllables**

Fichier : `src/engine/phonetics.ts`

Ajouter `syllables: Map<string, string>` comme 4ème paramètre de `validateWord`. Propager à `getFirstSyllable`.

Mettre à jour l'appel dans `WordInput.tsx` (déstructurer `syllables` depuis `GameDataContext`).

**T6 — WordInput.tsx : dead-end quand lastSyl=null**

Fichier : `src/components/GameScreen/WordInput.tsx`

Ligne 82-88 (section dead-end detection) :
```typescript
const lastSyl = getLastSyllable(trimmed, dictionary, graph)
// Si lastSyl est null, le mot du joueur n'a pas de successeurs possibles → dead-end immédiat
if (!lastSyl) {
  dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: undefined })
  // deadSyllable = undefined → GameOver affichera le message générique
} else {
  const botWord = selectBotWord(lastSyl, graph, [...state.chain, trimmed], trimmed)
  if (!botWord) {
    dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: lastSyl })
  } else {
    dispatch({ type: 'BOT_RESPOND', word: botWord })
  }
}
```

**T7 — GameOver.tsx : message dead-end sans syllabe**

Fichier : `src/components/GameOver/GameOver.tsx`

Modifier la condition d'affichage de `DeadEndMessage` :
```tsx
{state.gameOverReason === 'dead-end' && (
  <DeadEndMessage syllable={state.deadSyllable} />
)}
```

Modifier `DeadEndMessage.tsx` pour accepter `syllable: string | undefined` :
```tsx
<p>
  {syllable
    ? <>Aucun mot français ne commence par <strong>{syllable}</strong> — fin de chaîne !</>
    : <>Ce mot ne peut être suivi — fin de chaîne !</>
  }
</p>
```

**T8 — ValidationResult : ajouter reason 'inflection'**

Fichier : `src/engine/phonetics.ts`

Étendre le type `reason` dans `ValidationResult` :
```typescript
reason: 'not-in-dictionary' | 'wrong-syllable' | 'inflection' | null
```

Mettre à jour `WordInput.tsx` pour le message d'erreur inflexion :
```typescript
const errorMsg = result.reason === 'not-in-dictionary'
  ? 'Mot non reconnu dans le dictionnaire'
  : result.reason === 'inflection'
  ? 'Forme fléchie du mot courant non autorisée'
  : `Ne commence pas par ${targetSyl ?? '?'}`
```

**T9 — scripts/test_cases.json + phonetics.test.ts : nouveaux cas**

Ajouter dans `test_cases.json` :
```json
{ "word": "songe", "previous": "songes", "expected": false, "note": "inflexion : songe = singulier de songes, même IPA" },
{ "word": "terrible", "previous": "...", "note": "lastSyl=null → dead-end, pas un crash" }
```

Ajouter dans `phonetics.test.ts` :
- Test `getFirstSyllable` avec syllables map (happy path + fallback)
- Test `validateWord` avec inflexion → `reason: 'inflection'`

### Acceptance Criteria

**AC1 — syllables.json généré**
Given: `python scripts/build_graph.py` exécuté
When: le script se termine
Then: `public/syllables.json` existe avec ≥ 100 000 entrées `{mot: first_syl_IPA}`

**AC2 — getFirstSyllable utilise syllables map**
Given: `syllables.get('repasser') = 'ʁə'`
When: `getFirstSyllable('repasser', syllables, graph)` est appelé
Then: retourne `'ʁə'` (pas null)

**AC3 — Filtre inflexion**
Given: mot courant = `songes` (IPA `sɔ̃ʒ`)
When: joueur soumet `songe`
Then: `validateWord` retourne `{ valid: false, reason: 'inflection' }`

**AC4 — Dead-end avec message quand lastSyl=null**
Given: joueur soumet `terrible` (IPA `tɛʁibl`, lastSyl=null dans graph)
When: le mot est validé puis dead-end détecté
Then: `GAME_OVER { reason: 'dead-end', deadSyllable: undefined }` est dispatché ET le message "Ce mot ne peut être suivi — fin de chaîne !" est affiché

**AC5 — Dead-end avec syllabe quand lastSyl connue mais aucun successeur**
Given: joueur soumet un mot dont lastSyl existe dans graph mais tous candidats déjà joués
When: dead-end détecté
Then: message "Aucun mot français ne commence par X — fin de chaîne !" affiché avec la syllabe IPA

**AC6 — Tests existants passent toujours**
Given: tous les tests dans `phonetics.test.ts` et `botSelector.test.ts`
When: `npm test` exécuté après les modifications
Then: 0 régression

---

## Additional Context

### Dependencies

- `public/syllables.json` doit être généré AVANT toute modification TypeScript (T1 en premier)
- `dataLoader.ts` (T2) doit être fait avant `phonetics.ts` (T3/T4/T5) et `WordInput.tsx` (T6)
- T8 (type ValidationResult) doit être fait avant T9 (tests)

### Testing Strategy

1. Exécuter `python scripts/build_graph.py` et vérifier syllables.json
2. `npm test` → tous les tests existants doivent passer
3. Ajouter les nouveaux cas de test de T9
4. Tester manuellement : `songes → songe` (rejeté), `terrible` (dead-end avec message)

### Notes

- **miroir → blocage** : à reproduire en jeu pendant l'implémentation. 439 successeurs dans graph["aʁ"] → `selectBotWord` ne devrait pas retourner null. Peut-être un problème de UI freeze ou de race condition dans le dispatch. À investiguer.
- **machisme → mener** (dist=4 même avec syllables.json) : rejet phonétiquement correct, non corrigé
- **néfaste → fastes**, **hideux → deux** : valides selon les règles du jeu (même pattern que lapin → pain), non corrigés

## Review Notes
- Revue adversariale complétée
- Findings : 12 total, 4 corrigés (F1 commentaire, F7 budget gzip, F10 dead code, F12 NFC fallback), 8 ignorés (hors scope spec ou by design)
- Approche : auto-fix

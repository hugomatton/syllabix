---
title: 'Définitions Wiktionnaire en fin de partie'
slug: 'definition-wiktionnaire-game-over'
created: '2026-03-14'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'TypeScript', 'Vite', 'CSS Modules', 'Vitest', '@testing-library/react']
files_to_modify:
  - 'src/hooks/useDefinition.ts (créer)'
  - 'src/hooks/index.ts (exporter useDefinition)'
  - 'src/components/GameOver/DefinitionPanel.tsx (consommer le hook)'
  - 'src/components/GameOver/DefinitionPanel.module.css (ajouter .loading)'
  - 'src/components/GameOver/GameOver.test.tsx (mettre à jour T5.4.6 + ajouter tests fetch)'
code_patterns:
  - 'Hooks custom dans src/hooks/, exportés depuis src/hooks/index.ts'
  - 'CSS Modules pour tout styling'
  - 'fetch natif (pas de lib HTTP)'
  - 'Pas de Context API nécessaire — le hook est local au composant'
test_patterns:
  - 'Vitest + @testing-library/react'
  - 'vi.fn() pour mock fetch global'
  - 'Tests nommés T5.4.X — continuer la numérotation (T5.4.9+)'
  - 'Un seul describe par groupe fonctionnel'
---

# Tech-Spec: Définitions Wiktionnaire en fin de partie

**Created:** 2026-03-14

## Overview

### Problem Statement

En fin de partie, le `DefinitionPanel` s'affiche lors du clic sur un mot (chaîne ou suggestions), mais affiche seulement "Définition non disponible" — le fetch réel n'est pas implémenté.

### Solution

Brancher `DefinitionPanel` sur l'API Wiktionnaire (`fr.wiktionary.org`) pour récupérer une courte définition (1-2 phrases) via un appel `fetch` côté client, avec mise en cache `sessionStorage` pour éviter les doublons.

### Scope

**In Scope:**
- Hook `useDefinition(word)` : fetch Wiktionnaire + cache sessionStorage + états loading/error
- Mise à jour `DefinitionPanel` pour consommer le hook et afficher : spinner, définition courte, ou fallback gracieux
- Aucune clé API, aucun backend

**Out of Scope:**
- Classe grammaticale, étymologie, exemples
- Définitions hors session (pas de localStorage)
- Gestion de désambiguïsation complexe

---

## Context for Development

### Codebase Patterns

- App 100% statique (Vite + React 19 + TypeScript), déployée sur GitHub Pages → appels fetch client-side uniquement
- Hooks custom dans `src/hooks/`, chacun dans son fichier, exporté depuis `src/hooks/index.ts`
- CSS Modules pour tout le styling — variables CSS globales (`--color-surface`, `--color-muted`, etc.)
- `DefinitionPanel` est déjà monté dans `GameOver.tsx` avec `word` et `onClose` en props — **aucune modif dans GameOver.tsx**
- La classe `.definition` existe déjà dans `DefinitionPanel.module.css` — à réutiliser pour le texte définition
- Tests nommés `T5.4.X` — continuer à partir de T5.4.9

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/components/GameOver/DefinitionPanel.tsx` | Composant cible — affiche "Définition non disponible", à brancher sur le hook |
| `src/components/GameOver/DefinitionPanel.module.css` | CSS Module — `.definition` existant, ajouter `.loading` |
| `src/components/GameOver/GameOver.tsx` | Parent qui monte DefinitionPanel — aucune modif nécessaire |
| `src/components/GameOver/GameOver.test.tsx` | Tests existants T5.4.X — T5.4.6 à réécrire, ajouter T5.4.9-T5.4.12 |
| `src/hooks/useTimer.ts` | Modèle de hook custom (structure, useEffect, cleanup) |
| `src/hooks/index.ts` | Barrel export — y ajouter `useDefinition` |

### Technical Decisions

- **API** : `https://fr.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext&exsentences=2&titles={mot}&format=json&origin=*`
  - Champ utilisé : premier objet de `data.query.pages` (la clé est un ID numérique variable)
  - Si la page a `missing: ''` ou si `extract` est vide/absent → définition = `""` (fallback affiché)
- **Cache sessionStorage** : clé `wikt:{mot}`, valeur = string extract (chaîne vide autorisée pour "non trouvé")
  - `sessionStorage.getItem(key) === null` → pas encore fetchée
  - `sessionStorage.getItem(key) === ""` → fetchée mais absente
  - `sessionStorage.getItem(key) === "Texte..."` → définition en cache
- **États du hook** : union discriminée TypeScript
  ```ts
  type DefinitionState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'loaded'; definition: string }
    | { status: 'error' }
  ```
- **AbortController** : annuler le fetch si le composant se démonte ou si `word` change
- **Pas de lib externe** — fetch natif

---

## Implementation Plan

### Tasks

- [x] **Tâche 1 : Créer `src/hooks/useDefinition.ts`**
  - Fichier : `src/hooks/useDefinition.ts` (nouveau)
  - Action : Implémenter le hook avec la signature `useDefinition(word: string): DefinitionState`
  - Détails :
    1. Importer `useState`, `useEffect` depuis React
    2. Déclarer le type union `DefinitionState` localement dans le fichier
    3. Dans `useEffect([word])` :
       - Lire `sessionStorage.getItem('wikt:' + word)` → si non null, passer directement en `loaded` ou `loaded` avec `""` selon la valeur
       - Sinon : passer en `loading`, lancer `fetch` avec `AbortController`
       - On success : extraire `Object.values(data.query.pages)[0].extract ?? ''`, stocker en sessionStorage, passer en `loaded`
       - On error (sauf AbortError) : passer en `error`
    4. Retourner le `AbortController.abort` dans le cleanup

- [x] **Tâche 2 : Exporter depuis `src/hooks/index.ts`**
  - Fichier : `src/hooks/index.ts`
  - Action : Ajouter la ligne `export { useDefinition } from './useDefinition'`

- [x] **Tâche 3 : Ajouter `.loading` dans `DefinitionPanel.module.css`**
  - Fichier : `src/components/GameOver/DefinitionPanel.module.css`
  - Action : Ajouter à la fin du fichier :
    ```css
    .loading {
      font-size: 0.875rem;
      color: var(--color-muted);
      margin: 0;
      font-style: italic;
    }
    ```

- [x] **Tâche 4 : Mettre à jour `DefinitionPanel.tsx` pour consommer le hook**
  - Fichier : `src/components/GameOver/DefinitionPanel.tsx`
  - Action :
    1. Importer `useDefinition` depuis `'../../hooks'`
    2. Dans le composant, appeler `const defState = useDefinition(word)`
    3. Remplacer le `<p className={styles.definition}>Définition non disponible</p>` statique par un rendu conditionnel :
       - `status === 'loading'` → `<p className={styles.loading} aria-live="polite">Chargement…</p>`
       - `status === 'loaded' && definition` → `<p className={styles.definition}>{definition}</p>`
       - sinon (idle, error, loaded + vide) → `<p className={styles.definition}>Définition non disponible</p>`

- [x] **Tâche 5 : Mettre à jour `GameOver.test.tsx`**
  - Fichier : `src/components/GameOver/GameOver.test.tsx`
  - Action :
    1. **Réécrire T5.4.6** : le test doit désormais mocker `fetch` pour retourner une page `missing`, et vérifier que "Définition non disponible" s'affiche — au lieu de tester le placeholder statique V1
    2. **Ajouter T5.4.9** : Given fetch en cours (Promise non résolue), when panel monté, then "Chargement…" visible
    3. **Ajouter T5.4.10** : Given fetch retourne un extract non vide, when résolu, then le texte de la définition est affiché
    4. **Ajouter T5.4.11** : Given fetch rejette (erreur réseau), when panel monté, then "Définition non disponible" affiché
    5. **Ajouter T5.4.12** : Given sessionStorage contient déjà la définition (`wikt:chocolat`), when panel monté, then fetch n'est pas appelé et définition affichée directement
  - Pattern mock fetch :
    ```ts
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
      sessionStorage.clear()
    })
    afterEach(() => {
      vi.unstubAllGlobals()
    })
    ```

### Acceptance Criteria

- [x] **AC1** : Given le panel s'ouvre sur un mot non encore fetchée, when le composant monte, then "Chargement…" est visible immédiatement (état `loading`)

- [x] **AC2** : Given l'API retourne un `extract` non vide pour le mot, when le fetch se résout, then la définition est affichée à la place du spinner

- [x] **AC3** : Given l'API retourne une page avec `missing: ''` ou `extract: ""`, when le fetch se résout, then "Définition non disponible" est affiché (fallback gracieux)

- [x] **AC4** : Given une erreur réseau (fetch rejeté), when le composant tente de charger, then "Définition non disponible" est affiché sans crash ni console.error non géré

- [x] **AC5** : Given un mot déjà fetchée dans la session (sessionStorage `wikt:{mot}` non null), when le panel est remonté sur ce mot, then `fetch` n'est pas appelé et la valeur en cache est affichée directement

- [x] **AC6** : Given le panel se démonte pendant un fetch en cours (ex. : l'utilisateur ferme avant la réponse), when le composant se nettoie, then le fetch est annulé (AbortController) et aucune mise à jour de state n'est effectuée

---

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- API Wiktionnaire : `fr.wiktionary.org` — gratuit, sans clé, CORS `origin=*` activé
- Compatible GitHub Pages (aucun proxy, aucun backend)

### Testing Strategy

**Tests unitaires (Vitest + @testing-library/react) dans `GameOver.test.tsx` :**

- Mock `fetch` avec `vi.stubGlobal('fetch', vi.fn())` dans `beforeEach`
- `sessionStorage.clear()` dans `beforeEach` pour isoler les tests de cache
- `vi.unstubAllGlobals()` dans `afterEach`
- Utiliser `waitFor` / `findByText` de @testing-library pour les états asynchrones

**Tests à NE PAS écrire** (hors scope) :
- Tests d'intégration réels contre l'API Wiktionnaire
- Tests E2E

**Vérification manuelle :**
1. `npm run dev` → fin de partie → clic sur un mot → vérifier spinner puis définition
2. Fermer et rouvrir le panel sur le même mot → définition instantanée (cache)
3. Couper le réseau (DevTools) → vérifier fallback "Définition non disponible"

### Notes

- **Risque** : l'extract Wiktionnaire peut parfois commencer par "Formes de..." (forme fléchie) plutôt que la définition du lemme — acceptable pour V1, hors scope
- **Risque** : `sessionStorage` non disponible en mode privé strict sur certains navigateurs → entourer les appels sessionStorage d'un `try/catch` silencieux dans le hook
- **Future** : si la couverture s'avère insuffisante, envisager un fallback sur l'API Wikipedia (`fr.wikipedia.org/api/rest_v1/page/summary/{mot}`) pour les mots non trouvés sur Wiktionnaire

## Review Notes
- Adversarial review completed
- Findings: 12 total, 9 fixed, 3 skipped (bruit : F8, F9, F11)
- Resolution approach: auto-fix

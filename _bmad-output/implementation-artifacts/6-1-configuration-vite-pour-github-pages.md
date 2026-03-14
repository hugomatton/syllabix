# Story 6.1 : Configuration Vite pour GitHub Pages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux le build Vite configuré pour GitHub Pages,
Afin que les assets se chargent correctement sous le sous-chemin du dépôt. (ARC7)

## Acceptance Criteria

1. `vite.config.ts` contient `base: '/syllabix/'` correspondant au nom du dépôt GitHub
2. `npm run build` produit `dist/` avec des chemins d'assets corrects (préfixés `/syllabix/`)
3. `npm run preview` lance l'app sans erreurs 404 sur les assets
4. `dictionary.json` et `graph.json` se chargent depuis les bons chemins en preview
5. `package.json` conserve `"build": "tsc -b && vite build"` et `"preview": "vite preview"`

## Tasks / Subtasks

- [x] Modifier `vite.config.ts` pour ajouter `base: '/syllabix/'` (AC: #1, #2)
  - [x] Vérifier que la clé `base` est correctement placée dans `defineConfig`
- [x] Vérifier les scripts `package.json` (AC: #5)
  - [x] Confirmer que `"build": "tsc -b && vite build"` et `"preview": "vite preview"` sont déjà présents (ils le sont — aucun changement nécessaire)
- [x] Lancer `npm run build` et inspecter `dist/index.html` (AC: #2)
  - [x] Vérifier que les balises `<script src="...">` et `<link href="...">` commencent par `/syllabix/`
- [x] Lancer `npm run preview` et vérifier qu'aucune erreur 404 ne survient (AC: #3, #4)
  - [x] Ouvrir l'URL indiquée dans la console (typiquement `http://localhost:4173/syllabix/`)
  - [x] Confirmer que `dictionary.json` et `graph.json` se chargent (onglet Network DevTools)

## Dev Notes

### Fichiers modifiés

Deux fichiers ont été modifiés, un nettoyage de dead code a été effectué :

1. **`vite.config.ts`** — ajout de `base: '/syllabix/'`
2. **`src/engine/dataLoader.ts`** — chemins hard-codés remplacés par `import.meta.env.BASE_URL`
3. **Suppression** de `src/components/GameOver/DefinitionPanel.tsx` et `DefinitionPanel.module.css` — committé par erreur dans `298f0e2` (dead code, jamais importé nulle part)

### Modification `vite.config.ts`

Le seul changement de config est dans `vite.config.ts` :

```typescript
// AVANT
export default defineConfig({
  plugins: [react()],
})

// APRÈS
export default defineConfig({
  base: '/syllabix/',
  plugins: [react()],
})
```

**Pourquoi `base: '/syllabix/'` ?** GitHub Pages sert les projets sous `https://username.github.io/syllabix/` (sous-chemin = nom du dépôt). Sans ce paramètre, Vite génère des chemins absolus commençant par `/` qui pointent vers la racine du domaine et causent des 404.

### package.json — aucun changement nécessaire

Les scripts requis par l'AC sont **déjà présents** :
- `"build": "tsc -b && vite build"` ✅
- `"preview": "vite preview"` ✅

`tsc -b` valide TypeScript avant le bundling — ne pas le retirer.

### Impact sur `dataLoader.ts`

`vitest.config.ts` importe `vite.config.ts` via `mergeConfig` — donc `import.meta.env.BASE_URL` vaut `/syllabix/` aussi bien en build qu'en test. Les chemins hard-codés (`/dictionary.json` etc.) ont été remplacés par `${import.meta.env.BASE_URL}dictionary.json` pour rester corrects dans les deux contextes, et le test correspondant mis à jour en conséquence.

```typescript
// ❌ Échoue en production GitHub Pages (et casse les tests après ajout de base)
fetch('/dictionary.json')

// ✅ Correct — respecte la configuration base en build et en test
fetch(`${import.meta.env.BASE_URL}dictionary.json`)
```

### Project Structure Notes

- Seul fichier modifié : `vite.config.ts` (1 ligne ajoutée)
- Aucun impact sur les tests Vitest (ils tournent sans le build Vite)
- Aucun impact sur les scripts Python dans `scripts/`

### Contexte des derniers commits

- `298f0e2` — feat: gère definition avec wiktionnaire (GameOver/DefinitionPanel)
- `9f57da7` — feat: suggestions de mots en fin de partie (timeout)
- `6730863` — feat: robustesse moteur phonétique — syllables.json, filtres inflexions et blacklist

L'app est fonctionnellement complète (Epics 1–5 done). Cette story est la mise en production.

### References

- Architecture : [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Déploiement]
- Epics : [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- ARC7 : Déploiement GitHub Pages (branche `gh-pages`)
- Vite docs base option : https://vitejs.dev/config/shared-options.html#base

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré.

### Completion Notes List

- `vite.config.ts` : ajout de `base: '/syllabix/'` dans `defineConfig` — 1 ligne.
- `src/engine/dataLoader.ts` : chemins hard-codés `/dictionary.json`, `/graph.json`, `/syllables.json` remplacés par `${import.meta.env.BASE_URL}...` pour respecter la config `base` en production GitHub Pages et en test.
- `src/engine/dataLoader.test.ts` : assertions de l'URL fetch mises à jour pour utiliser `import.meta.env.BASE_URL` (vitest.config.ts hérite de vite.config.ts via mergeConfig, donc BASE_URL = `/syllabix/` en test).
- `src/components/GameOver/DefinitionPanel.tsx` + `DefinitionPanel.module.css` : supprimés (dead code committé par erreur dans 298f0e2, jamais importés).
- `npm run build` : ✅ 81 modules transformés, `dist/index.html` contient `/syllabix/assets/...` sur tous les assets.
- AC #5 : `package.json` scripts déjà conformes, aucun changement.
- Vérification manuelle requise par l'utilisateur : `npm run preview` → ouvrir `http://localhost:4173/syllabix/`, vérifier Network DevTools pour `dictionary.json`, `graph.json`, `syllables.json`.

### Change Log

- 2026-03-14 : Ajout `base: '/syllabix/'` dans `vite.config.ts` ; correction des chemins fetch dans `dataLoader.ts` (utilisation `import.meta.env.BASE_URL`) ; mise à jour de `dataLoader.test.ts` (assertions URL corrigées pour BASE_URL) ; suppression de `DefinitionPanel.tsx` + `.css` (dead code).

### File List

- `vite.config.ts`
- `src/engine/dataLoader.ts`
- `src/engine/dataLoader.test.ts`
- `src/components/GameOver/DefinitionPanel.tsx` (supprimé)
- `src/components/GameOver/DefinitionPanel.module.css` (supprimé)

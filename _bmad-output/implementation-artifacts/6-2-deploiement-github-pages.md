# Story 6.2 : Déploiement GitHub Pages

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux déployer Syllabix sur GitHub Pages,
Afin que le jeu soit accessible publiquement sans coût. (NFR5, NFR11)

## Acceptance Criteria

1. **Given** un dépôt GitHub existe pour le projet
   **When** j'exécute `npm run build` puis pousse `dist/` vers la branche `gh-pages`
   **Then** l'app est accessible à `https://hugomatton.github.io/syllabix/`
   **And** tous les assets (JS, CSS, dictionary.json, graph.json, syllables.json) chargent sans erreur 404

2. **Given** le déploiement est actif
   **When** je teste sur mobile (iPhone Safari + Android Chrome)
   **Then** le jeu est jouable sans scroll horizontal involontaire (NFR10)
   **And** le temps de chargement est inférieur à 2s sur connexion standard (NFR2)

3. **Given** le déploiement
   **When** j'exécute l'audit axe sur l'URL de production
   **Then** il n'y a aucune violation "critical" ou "serious" (NFR7–NFR9)

## Tasks / Subtasks

- [ ] Tâche 1 : Créer et configurer le dépôt GitHub (AC: #1)
  - [ ] 1.1 Créer un nouveau dépôt GitHub public nommé `syllabix`
  - [ ] 1.2 Ajouter le remote origin : `git remote add origin https://github.com/hugomatton/syllabix.git`
  - [ ] 1.3 Pousser la branche `main` : `git push -u origin main`

- [ ] Tâche 2 : Configurer le déploiement via `gh-pages` (AC: #1)
  - [ ] 2.1 Installer `gh-pages` en devDependency : `npm install --save-dev gh-pages`
  - [ ] 2.2 Ajouter le script `"deploy": "gh-pages -d dist"` dans `package.json`
  - [ ] 2.3 Exécuter `npm run build && npm run deploy` pour pousser `dist/` vers la branche `gh-pages`

- [ ] Tâche 3 : Activer GitHub Pages sur le dépôt (AC: #1)
  - [ ] 3.1 Dans Settings > Pages du dépôt GitHub, sélectionner la branche `gh-pages` comme source
  - [ ] 3.2 Vérifier que l'URL `https://hugomatton.github.io/syllabix/` est active (délai ~1-2 min)
  - [ ] 3.3 Ouvrir l'URL dans le navigateur et vérifier l'onglet Network : tous les assets doivent répondre 200

- [ ] Tâche 4 : Vérification mobile (AC: #2)
  - [ ] 4.1 Tester sur iPhone Safari (via DevTools mobile simulation ou vrai device)
  - [ ] 4.2 Tester sur Android Chrome
  - [ ] 4.3 Vérifier absence de scroll horizontal (viewport `width=device-width`)
  - [ ] 4.4 Mesurer le temps de chargement initial (Network tab → DOMContentLoaded < 2s)

- [ ] Tâche 5 : Audit accessibilité axe (AC: #3)
  - [ ] 5.1 Installer l'extension axe DevTools dans Chrome (ou utiliser axe-core CLI)
  - [ ] 5.2 Lancer l'audit sur `https://hugomatton.github.io/syllabix/`
  - [ ] 5.3 Corriger toute violation "critical" ou "serious" si trouvée

- [ ] Tâche 6 : (Optionnel) Automatiser via GitHub Actions
  - [ ] 6.1 Créer `.github/workflows/deploy.yml` pour déploiement automatique sur push main
  - [ ] 6.2 Voir Dev Notes section "GitHub Actions" pour le template

## Dev Notes

### Contexte de la Story 6.1 (prérequis accomplis)

La Story 6.1 est **done**. Les points suivants sont déjà en place et **ne doivent pas être modifiés** :

- `vite.config.ts` : `base: '/syllabix/'` ✅
- `src/engine/dataLoader.ts` : fetch utilise `import.meta.env.BASE_URL` ✅
- `npm run build` produit `dist/` avec chemins corrects (ex: `/syllabix/assets/index-xxx.js`) ✅
- `dist/index.html` contient déjà les assets préfixés `/syllabix/` ✅

**Ne pas modifier** `vite.config.ts`, `dataLoader.ts`, ni `dataLoader.test.ts` — tout fonctionne.

### Prérequis : Remote GitHub manquant

Aucun remote `origin` n'est configuré. L'ordre d'exécution obligatoire est :
```bash
# 1. Créer le dépôt GitHub via l'interface web (github.com > New repository > "syllabix", public)
# 2. Ajouter le remote
git remote add origin https://github.com/hugomatton/syllabix.git
# 3. Pousser main
git push -u origin main
```

Remplacer `hugomatton` par le vrai nom d'utilisateur GitHub.

### Déploiement via gh-pages (méthode recommandée)

```bash
# Installation
npm install --save-dev gh-pages

# Ajout dans package.json scripts :
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# Déploiement
npm run deploy
```

`gh-pages` pousse automatiquement le contenu de `dist/` vers la branche `gh-pages` du remote `origin`. Aucun commit manuel sur `gh-pages` n'est nécessaire.

**Important :** `gh-pages` pousse le contenu de `dist/` uniquement, pas la branche `main`. Le code source reste sur `main`.

### Activation GitHub Pages

Après le premier `npm run deploy` :
1. Aller sur `https://github.com/hugomatton/syllabix/settings/pages`
2. Dans "Source" : sélectionner branche `gh-pages`, dossier `/ (root)`
3. Sauvegarder — GitHub Pages sera actif après ~1-2 minutes
4. URL de production : `https://hugomatton.github.io/syllabix/`

### Assets à vérifier en production

Ouvrir le Network tab (DevTools) sur l'URL de production. Tous ces assets doivent retourner HTTP 200 :
- `/syllabix/assets/index-[hash].js`
- `/syllabix/assets/index-[hash].css`
- `/syllabix/dictionary.json`
- `/syllabix/graph.json`
- `/syllabix/syllables.json`

Si `dictionary.json`, `graph.json` ou `syllables.json` retournent 404, vérifier que `public/` contient bien ces fichiers avant le build (ils doivent être présents avant `npm run build`).

### GitHub Actions (optionnel — automatisation CI/CD)

Si Hugo souhaite que chaque push sur `main` déploie automatiquement :

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Note :** Cette étape est optionnelle pour cette story. Le déploiement manuel via `npm run deploy` est suffisant pour le MVP.

### Vérification mobile

Utiliser Chrome DevTools > Toggle Device Toolbar pour simuler :
- iPhone 14 Pro (390px) : vérifier pas de scroll horizontal
- Pixel 7 (412px) : idem
- Condition réseau "Fast 3G" : DOMContentLoaded doit rester < 2s

Le CSS utilise déjà `min-width: 320px` et les design tokens garantissent le responsive (Story 3.1 done).

### Audit accessibilité axe

Extensions gratuites :
- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd) (Chrome)
- [WAVE](https://wave.webaim.org/extension/) (alternative)

Violations à corriger si présentes :
- `color-contrast` : vérifier ratios de contraste sur les tokens CSS (déjà conçus en WCAG AA selon ux-design-spec)
- `aria-*` : labels manquants sur inputs
- `button-name` : boutons sans texte accessible

### Project Structure Notes

**Fichiers modifiés/créés par cette story :**
- `package.json` : ajout scripts `predeploy` et `deploy`, ajout devDependency `gh-pages`
- `.github/workflows/deploy.yml` : OPTIONNEL (GitHub Actions)
- Branche `gh-pages` (créée automatiquement par `gh-pages` package)

**Fichiers qui NE doivent PAS être modifiés :**
- `vite.config.ts` (Story 6.1 done)
- `src/engine/dataLoader.ts` (Story 6.1 done)
- `src/engine/dataLoader.test.ts` (Story 6.1 done)
- Tout le code source React et engine

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure]
- [Source: _bmad-output/implementation-artifacts/6-1-configuration-vite-pour-github-pages.md]
- gh-pages package: https://github.com/tschaub/gh-pages
- GitHub Pages docs: https://docs.github.com/en/pages

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

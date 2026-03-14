---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
lastStep: 8
status: 'complete'
completedAt: '2026-03-06'
lastEdited: '2026-03-14'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
editHistory:
  - date: '2026-03-14'
    changes: 'Ajout DA/Fraunces, useVisualViewport hook, DefinitionModal iframe Wiktionnaire + lemmatisation, lemmes.json, mise à jour FR count 34→36'
workflowType: 'architecture'
project_name: 'syllabix'
user_name: 'Hugo'
date: '2026-03-06'
---

# Architecture Decision Document

_Ce document se construit collaborativement étape par étape. Les sections sont ajoutées au fil des décisions architecturales._

---

## Analyse du Contexte Projet

### Vue d'ensemble des Exigences

**Exigences Fonctionnelles (34 FRs en 7 domaines) :**

| Domaine | FRs | Implications architecturales |
|---|---|---|
| Boucle de jeu | FR1–6 | Game loop state machine, bot selection, chaîne infinie |
| Moteur phonétique | FR7–11 | Lookup JSON (IPA pré-calculé), zone de tolérance configurable, graphe de transitions |
| Score & Progression | FR12–17 | State local (score courant, record session), bonus orthographe, combo syllabe double |
| Gestion du chrono | FR18–21 | Timer précis côté navigateur (performance.now()), 3 modes |
| Interface & Feedback | FR22–25 | UI réactive, retour visuel/sonore immédiat, messages d'erreur clairs |
| Fin de partie | FR26–30 | Écran récap, définitions cliquables, dead end detection |
| Administration & Build | FR31–34 | Script Python offline, harnais de tests, config seuil |

**Exigences Non-Fonctionnelles critiques :**

- Validation <300ms (lookup JSON, pas de calcul en temps réel)
- Chargement initial <2s (dictionary.json + graph.json, <5MB gzip total)
- Précision chrono ±100ms
- Responsive 320px+, contraste ≥4.5:1, focus clavier fonctionnel
- 100% statique — disponibilité >99% via CDN

**Périmètre & Complexité :**

- Domaine principal : SPA web — 100% client-side, zéro backend
- Niveau de complexité : Faible-Moyenne (logique de jeu concentrée côté navigateur)
- Modules architecturaux estimés : ~6-8

### Contraintes & Dépendances Techniques

- **Build-time** : Python + phonemize/espeak → génère `dictionary.json` (IPA par mot) et `graph.json` (transitions syllabe → mots valides)
- **Runtime** : navigateur uniquement — lookups Map/objet sur les JSON pré-chargés, zéro appel API
- **Dictionnaire** : Lexique (130k+ formes françaises) — embarqué intégralement, pas de curation manuelle
- **Hébergement** : statique (Netlify / Vercel / GitHub Pages) — coût ≤0€
- **Stockage** : localStorage (record de session uniquement, pas de compte utilisateur)
- **Zéro dépendance API externe en V1** (LLM réservé éventuellement V2)

### Préoccupations Transversales Identifiées

1. **State management** — game state centralisé (chaîne courante, score, record, mode, timer, phase)
2. **Moteur phonétique découplé** — module testable indépendamment (harnais 50+ cas)
3. **Performance lookups JSON** — préférer `Map` vs objet brut pour O(1) lookup sur 130k entrées
4. **Précision du timer** — `performance.now()` + `requestAnimationFrame` pour éviter la dérive `setInterval`
5. **Taille bundle JSON** — compression gzip CDN suffit ; pas de chargement paresseux nécessaire en V1
6. **Seuil de tolérance phonétique** — configurable sans toucher au code (fichier de config dédié)

---

## Évaluation du Starter Template

### Domaine Technologique Principal

SPA web 100% client-side — logique de jeu embarquée, hébergement statique CDN, zéro backend.

### Options Considérées

| Option | Score | Justification |
|---|---|---|
| **Vite + React + TypeScript** | ✅ Retenu | Écosystème mature, build statique optimisé, typage fort adapté au game state complexe |
| Vite + Svelte + TypeScript | ➖ | Léger mais écosystème plus limité, moins adapté aux animations de jeu |
| Vite + Vue 3 + TypeScript | ➖ | Solide mais moins idiomatique pour SPAs de type jeu |
| Vanilla Vite (TS only) | ➖ | Zéro overhead, mais trop de boilerplate UI à écrire manuellement |

### Starter Retenu : Vite + React + TypeScript

**Justification :**
- Référence du genre pour les word games web (Wordle, Semantix et clones)
- Build statique optimisé (`dist/`) déployable directement sur Netlify/Vercel/GitHub Pages
- TypeScript indispensable pour typer proprement le game state, les structures IPA et le graphe de transitions
- HMR Vite (esbuild) rend le cycle dev itératif très rapide
- Aucune infrastructure serveur, parfait pour l'objectif coût ≤0€

**Commande d'initialisation :**

```bash
npm create vite@latest syllabix -- --template react-ts
cd syllabix
npm install
npm run dev
```

**Décisions Architecturales Apportées par le Starter :**

**Langage & Runtime :**
TypeScript strict, compilé via esbuild (Vite) → bundle JS optimisé pour navigateur

**Build Tooling :**
Vite 6.x — dev server HMR ultra-rapide + build production statique (`npm run build` → `dist/`)

**Tests :**
Non inclus par défaut — Vitest sera ajouté (compatible Vite, même config, syntaxe Jest)

**Linting :**
ESLint préconfigurés avec règles React et TypeScript

**Structure de Projet :**
```
syllabix/
├── public/              # Assets statiques (dictionary.json, graph.json)
├── src/
│   ├── engine/          # Moteur phonétique (lookup, validation, bot)
│   ├── game/            # State management (game loop, score, timer)
│   ├── components/      # Composants React UI
│   ├── hooks/           # Custom hooks (useTimer, useGameState)
│   ├── config/          # Seuil de tolérance et constantes
│   └── main.tsx         # Point d'entrée
├── scripts/             # Scripts Python build-time (hors src)
└── vite.config.ts
```

**Expérience de Développement :**
- `npm run dev` → localhost:5173 avec HMR
- `npm run build` → `dist/` prêt pour déploiement statique
- `npm run preview` → preview du build de production en local

**Note :** L'initialisation du projet avec cette commande sera la première histoire d'implémentation.

---

## Décisions Architecturales Core

### Analyse des Priorités

**Décisions Critiques (bloquantes pour l'implémentation) :**
- Gestion des données JSON en mémoire (`Map` vs objet brut)
- State management du game loop (`useReducer`)
- Précision du timer (strategy `performance.now()`)

**Décisions Importantes (structurent l'architecture) :**
- Styling CSS Modules
- Tests Vitest
- Déploiement GitHub Pages

**Décisions Différées (Post-MVP) :**
- Animations avancées (Framer Motion)
- CI/CD automatisé
- PWA / offline support

### Architecture des Données Client

**Décision :** `Map` JS pour `dictionary`, objet brut pour `graph`

| Fichier | Structure mémoire | Justification |
|---|---|---|
| `dictionary.json` | `new Map<string, string>(entries)` | 130k entrées — lookup mot → IPA, O(1) garanti, sémantique explicite |
| `graph.json` | Objet brut `Record<string, string[]>` | Lookup syllabe → liste de mots, structure naturelle en objet JSON |

Chargement au démarrage via `fetch()` + `Promise.all()`, bloquant l'affichage tant que les deux fichiers ne sont pas prêts.

**Pas de base de données, pas de backend.** localStorage utilisé uniquement pour le record de session.

### Authentification & Sécurité

**Décision :** Pas d'authentification — application publique sans compte utilisateur.

Sécurité pertinente :
- Validation côté client uniquement (pas de surface d'attaque serveur)
- Données JSON statiques en lecture seule
- Pas de formulaire d'identifiants, pas de token, pas de session serveur

### API & Communication

**Décision :** Aucune API externe en V1.

Communication interne uniquement :
- `fetch('/dictionary.json')` et `fetch('/graph.json')` au démarrage (assets statiques Vite `public/`)
- Zéro WebSocket, zéro REST, zéro GraphQL
- Le "bot" est un algorithme de sélection locale (lookup `graph` + `Math.random()`)

### Architecture Frontend

**State Management — `useReducer` :**

```typescript
type GamePhase = 'idle' | 'playing' | 'game-over'

type GameState = {
  phase: GamePhase
  difficulty: 'easy' | 'medium' | 'hard'
  chain: string[]        // mots joués dans l'ordre
  currentWord: string    // mot affiché (du bot)
  score: number
  sessionRecord: number  // lu/écrit via localStorage
  timeLeft: number
  lastError: string | null
}
```

Reducer centralisé avec actions typées — pas de state dispersé entre composants.

**Routing :**
Pas de routing — SPA mono-page unique. Phases de jeu gérées via `GameState.phase`.

**Performance :**
- JSON pré-chargés en `Map` au démarrage — toutes les validations sont des lookups mémoire (<1ms)
- Timer : `performance.now()` + `requestAnimationFrame` pour précision ±100ms sans dérive
- Pas de code splitting nécessaire (SPA simple, bundle unique)

### Infrastructure & Déploiement

**Hébergement :** GitHub Pages

| Aspect | Décision |
|---|---|
| Plateforme | GitHub Pages (`gh-pages` branch ou `docs/`) |
| Build | `npm run build` → `dist/` → push vers branche `gh-pages` |
| Domaine | GitHub Pages gratuit (`username.github.io/syllabix`) |
| CDN | CDN GitHub intégré |
| Coût | 0€ |

Déploiement manuel V1 (`npm run build` + push) — CI/CD automatisé en V2 si nécessaire.

**Variables d'environnement :**
Aucune — pas de clés API, pas de secrets. Configuration phonétique dans `src/config/phonetics.ts`.

### Analyse d'Impact des Décisions

**Séquence d'implémentation recommandée :**
1. Init projet Vite + React + TS
2. Scripts Python build-time (dictionary.json + graph.json)
3. Chargement des JSON + structures Map/objet
4. Moteur phonétique (lookup + validation + harnais de tests Vitest)
5. Game state (useReducer + GameState)
6. Game loop + Timer
7. Composants UI
8. Déploiement GitHub Pages

**Dépendances croisées :**
- Le moteur phonétique dépend des JSON (step 2 avant step 3)
- Le game loop dépend du moteur phonétique (step 4 avant step 5)
- L'UI dépend du game state (step 5 avant step 6)

---

## Patterns d'Implémentation & Règles de Cohérence

### Points de Conflit Identifiés

6 zones où des agents IA différents pourraient faire des choix incompatibles — règles définies ci-dessous pour chacune.

### Naming Patterns

**Fichiers & Dossiers :**

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | `PascalCase.tsx` | `GameBoard.tsx`, `TimerBar.tsx` |
| CSS Modules | Même nom que composant | `GameBoard.module.css` |
| Hooks | `camelCase` préfixé `use` | `useGameState.ts`, `useTimer.ts` |
| Modules engine/game | `camelCase.ts` | `phonetics.ts`, `botSelector.ts` |
| Tests | Co-localisés, suffixe `.test.ts` | `phonetics.test.ts` |
| Barrel files | `index.ts` par dossier | `src/engine/index.ts` |

**Code TypeScript :**

| Élément | Convention | Exemple |
|---|---|---|
| Types/Interfaces | `PascalCase` | `GameState`, `GameAction`, `PhoneticEntry` |
| Constantes | `SCREAMING_SNAKE_CASE` | `TIMER_EASY = 15`, `MAX_TOLERANCE = 2` |
| Fonctions | `camelCase` | `getLastSyllable()`, `validateWord()` |
| Actions reducer | `SCREAMING_SNAKE_CASE` string | `'SUBMIT_WORD'`, `'TICK_TIMER'`, `'GAME_OVER'` |

**JSON statiques :**
- `dictionary.json` : clés = mots minuscules normalisés, valeurs = string IPA
- `graph.json` : clés = syllabes IPA, valeurs = `string[]` (liste de mots)

### Structure Patterns

**Tests co-localisés** (jamais de dossier `__tests__` séparé) :
```
src/engine/phonetics.ts
src/engine/phonetics.test.ts   ← co-localisé
```

**Barrel files obligatoires** dans chaque dossier `src/` :
```typescript
// src/engine/index.ts
export { validateWord, getLastSyllable } from './phonetics'
export { selectBotWord } from './botSelector'
```

**Zéro magic numbers** — toutes les constantes dans `src/config/constants.ts` :
```typescript
export const TIMER_EASY = 15
export const TIMER_MEDIUM = 10
export const TIMER_HARD = 6
export const PHONETIC_TOLERANCE = 2  // distance édition IPA max
```

### Patterns de State

**Mises à jour immutables uniquement** dans le reducer :
```typescript
// ✅ Correct — spread operator
case 'SUBMIT_WORD':
  return { ...state, chain: [...state.chain, action.word], score: state.score + 1 }

// ❌ Interdit — mutation directe
state.chain.push(action.word)
return state
```

**localStorage** : lu une seule fois dans l'état initial du reducer, écrit uniquement via l'action `'UPDATE_RECORD'`.

### Patterns d'Erreur

| Type d'erreur | Traitement |
|---|---|
| Mot hors dictionnaire | `state.lastError = 'Mot non reconnu'` — affiché dans UI, jamais `console.error` |
| Mauvaise syllabe | `state.lastError = 'Mauvaise syllabe'` — affiché dans UI |
| Dead end phonétique | Action `'GAME_OVER'` avec `reason: 'dead-end'` |
| Timeout chrono | Action `'GAME_OVER'` avec `reason: 'timeout'` |
| Fetch JSON échoué | Écran d'erreur de chargement bloquant avec message clair |

### Règles Obligatoires pour Tous les Agents

**Tous les agents DOIVENT :**
- Nommer les fichiers selon la convention du tableau ci-dessus
- Exporter via barrel file `index.ts` de chaque dossier
- Utiliser `SCREAMING_SNAKE_CASE` pour les actions reducer
- Ne jamais muter le state directement
- Co-localiser les tests avec leur fichier source
- Référencer les constantes depuis `src/config/constants.ts`
- Gérer les erreurs utilisateur via `state.lastError`, jamais via `console.error`

---

## Structure de Projet & Frontières

### Mapping Exigences → Structure

| Domaine FR | Localisation |
|---|---|
| Moteur phonétique (FR7-11) | `src/engine/` |
| Boucle de jeu + Chrono (FR1-6, FR18-21) | `src/game/` |
| Score & record (FR12-17) | `src/game/gameReducer.ts` + localStorage |
| Interface & Feedback (FR22-25) | `src/components/GameScreen/` |
| Fin de partie + Récap (FR26-30) | `src/components/GameOver/` |
| Build-time Python (FR31-34) | `scripts/` |
| Config seuil tolérance | `src/config/constants.ts` |

### Structure Complète du Projet

```
syllabix/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deploy (V2 - CI/CD)
├── public/
│   ├── dictionary.json         # IPA pré-calculé par mot (généré par scripts/)
│   └── graph.json              # Transitions syllabe → mots (généré par scripts/)
├── scripts/                    # Build-time Python (hors bundle Vite)
│   ├── build_dictionary.py     # Génère dictionary.json via phonemize/espeak
│   ├── build_graph.py          # Génère graph.json depuis dictionary.json
│   ├── run_tests.py            # Harnais de tests phonétiques (50+ cas)
│   ├── test_cases.json         # Jeux de tests (passants + non-passants)
│   └── requirements.txt        # Python deps (phonemize, espeak-ng)
├── src/
│   ├── config/
│   │   ├── constants.ts        # TIMER_*, PHONETIC_TOLERANCE, etc.
│   │   └── index.ts
│   ├── engine/                 # Moteur phonétique — FR7-11
│   │   ├── phonetics.ts        # getLastSyllable(), validateWord(), levenshteinIPA()
│   │   ├── phonetics.test.ts
│   │   ├── botSelector.ts      # selectBotWord() — lookup graph, Math.random()
│   │   ├── botSelector.test.ts
│   │   ├── dataLoader.ts       # fetch() dictionary.json + graph.json → Map + objet
│   │   └── index.ts
│   ├── game/                   # Game loop & state — FR1-6, FR12-21
│   │   ├── gameReducer.ts      # useReducer reducer + actions typées
│   │   ├── gameReducer.test.ts
│   │   ├── gameTypes.ts        # GameState, GameAction, GamePhase types
│   │   ├── timer.ts            # performance.now() + rAF timer logic
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useGameState.ts     # useReducer wrapper + dispatch helpers
│   │   ├── useTimer.ts         # Timer hook avec callbacks onTick / onExpire
│   │   └── index.ts
│   ├── components/
│   │   ├── App/
│   │   │   ├── App.tsx         # Root — chargement JSON + phase routing
│   │   │   └── App.module.css
│   │   ├── GameScreen/         # Phase 'playing' — FR3-5, FR21-24
│   │   │   ├── GameScreen.tsx
│   │   │   ├── GameScreen.module.css
│   │   │   ├── WordDisplay.tsx
│   │   │   ├── InputField.tsx
│   │   │   ├── TimerBar.tsx
│   │   │   └── ScoreBar.tsx
│   │   ├── GameOver/           # Phase 'game-over' — FR26-30
│   │   │   ├── GameOver.tsx
│   │   │   ├── GameOver.module.css
│   │   │   ├── ChainRecap.tsx
│   │   │   └── WordDefinition.tsx
│   │   ├── StartScreen/        # Phase 'idle' — FR1, FR18, FR22
│   │   │   ├── StartScreen.tsx
│   │   │   └── StartScreen.module.css
│   │   └── shared/
│   │       ├── ErrorMessage.tsx
│   │       └── LoadingScreen.tsx
│   ├── styles/
│   │   └── globals.css
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

### Frontières Architecturales

**Frontières de composants :**
- `src/engine/` — pur TypeScript, zéro React, zéro DOM ; testable en isolation
- `src/game/` — logique de state machine, zéro UI ; testable en isolation
- `src/components/` — React uniquement, zéro logique phonétique directe
- `scripts/` — Python pur, jamais importé par le bundle Vite

**Communication inter-couches :**
- `engine/` exposé uniquement via `src/engine/index.ts`
- `game/` exposé uniquement via `src/game/index.ts`
- Composants consomment `useGameState` hook — jamais import direct de `gameReducer`

### Flux de Données

**Démarrage :**
```
App.tsx → dataLoader.ts → fetch(dictionary.json + graph.json)
        → Map<string,string> + Record<string,string[]>
        → injecté via Context dans toute l'app
```

**Tour de jeu :**
```
InputField → dispatch('SUBMIT_WORD')
           → gameReducer → phonetics.validateWord() → lookup Map
           → si valide : botSelector.selectBotWord() → lookup Record
           → dispatch('BOT_RESPOND') → GameState mis à jour → UI re-render
```

**Timer :**
```
useTimer → performance.now() + rAF
         → dispatch('TICK') chaque frame → GameState.timeLeft
         → si 0 → dispatch('GAME_OVER', { reason: 'timeout' })
```

**localStorage :**
```
init reducer → getItem('syllabix-record') → sessionRecord
'UPDATE_RECORD' → setItem('syllabix-record', newRecord)
```

### Points d'Intégration

**Internes :** tout passe par `useGameState` hook (1 seul point d'entrée pour les composants)

**Externes :** aucune intégration externe en V1 — `fetch()` sur assets statiques uniquement

---

## Résultats de Validation Architecturale

### Cohérence des Décisions ✅

**Compatibilité des technologies :** Vite + React + TypeScript + CSS Modules + Vitest + GitHub Pages — aucun conflit, toutes les versions sont compatibles entre elles.

**Cohérence des patterns :** les patterns de nommage, d'immutabilité et de co-localisation des tests s'alignent parfaitement avec le stack choisi.

**Alignement structurel :** la séparation `engine/` / `game/` / `components/` garantit l'isolation testable de chaque couche et prévient les couplages indésirables.

### Couverture des Exigences ✅

**34 FRs — couverture complète :** chaque exigence fonctionnelle est adressée par un fichier ou module spécifique documenté dans la structure de projet.

**NFRs — couverture complète :** validation <300ms via lookups Map mémoire, chargement <2s via JSON gzip CDN, précision chrono via `performance.now()`, responsive via CSS Modules, disponibilité via GitHub Pages CDN.

### Readiness pour l'Implémentation ✅

Toutes les décisions sont documentées avec justifications, l'arbre de fichiers est complet et spécifique, les patterns couvrent les 6 zones de conflit potentiel identifiées, les flux de données sont documentés de bout en bout.

### Analyse des Manques

**Critiques :** aucun

**Non-bloquants :** format exact des schémas JSON (documenté dans les scripts Python) ; implémentation visuelle/sonore du feedback (décision UX laissée à l'implémenteur)

**Nice-to-have (V2) :** CI/CD GitHub Actions, Storybook composants

### Checklist de Complétude

**Analyse des Exigences**
- [x] Contexte projet analysé
- [x] Complexité évaluée
- [x] Contraintes techniques identifiées
- [x] Préoccupations transversales cartographiées

**Décisions Architecturales**
- [x] Stack technique (Vite + React + TS)
- [x] Données en mémoire (Map + Record)
- [x] State management (useReducer)
- [x] Styling (CSS Modules)
- [x] Tests (Vitest co-localisés)
- [x] Déploiement (GitHub Pages)

**Patterns d'Implémentation**
- [x] Naming conventions
- [x] Structure patterns + barrel files
- [x] Patterns de state (immutabilité)
- [x] Patterns d'erreur

**Structure de Projet**
- [x] Arbre complet avec tous les fichiers
- [x] Frontières inter-couches
- [x] Flux de données documentés
- [x] Mapping FRs → fichiers

### Statut : PRÊT POUR L'IMPLÉMENTATION

**Niveau de confiance :** Élevé

**Points forts :** séparation nette des couches, zéro backend = déploiement trivial, patterns anti-conflit IA exhaustifs, séquence d'implémentation claire.

**Axes d'amélioration futurs :** CI/CD automatisé, bot narquois expressif (V2), LLM fallback phonétique (V2).

---

## Révision Architecturale — 2026-03-14

_Trois nouveaux besoins issus de la révision PRD/UX : direction artistique (Fraunces), expérience mobile contrainte (visualViewport), définitions in-app (iframe Wiktionnaire + lemmatisation)._

### 1. Direction Artistique — Chargement des Polices

**Décision :** font pairing `Fraunces` (display) + `Inter` (UI), chargées via Google Fonts.

**Implémentation dans `index.html` :**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

**Mise à jour `globals.css` :**
```css
--font-display: 'Fraunces', Georgia, serif;   /* titre + mot du bot */
--font-ui:      'Inter', system-ui, sans-serif; /* tout le reste */
```

**Impact :** aucun changement structurel — uniquement `index.html` et `globals.css`.

---

### 2. Mobile Viewport — Hook `useVisualViewport`

**Problème :** le clavier virtuel mobile réduit le viewport disponible. Sans gestion explicite, le `TimerRing` sort de l'écran et le scroll devient possible.

**Décision :** nouveau hook `src/hooks/useVisualViewport.ts` écoutant `window.visualViewport.resize`.

```typescript
// src/hooks/useVisualViewport.ts
export function useVisualViewport() {
  const [height, setHeight] = useState(
    window.visualViewport?.height ?? window.innerHeight
  )
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setHeight(vv.height)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])
  return height
}
```

**Consommation dans `GameScreen` :**
```typescript
const viewportHeight = useVisualViewport()
// appliqué via style inline sur le conteneur de jeu
<div style={{ height: viewportHeight }} className={styles.gameContainer}>
```

**Règle de focus — clavier persistant :**
- `WordInput` ne perd jamais le focus pendant `phase === 'playing'`
- Re-focus via `inputRef.current?.focus()` dans un `setTimeout(0)` après chaque dispatch (contournement WebKit iOS)
- Tous les autres éléments : `tabindex="-1"` pendant `playing`

**Nouveaux fichiers :**
- `src/hooks/useVisualViewport.ts` ← nouveau

**Mise à jour barrel :**
- `src/hooks/index.ts` : exporter `useVisualViewport`

---

### 3. Définitions In-App — Iframe Wiktionnaire + Lemmatisation

#### 3a. Analyse CSP / X-Frame-Options

**Contrainte :** pour qu'une iframe vers `fr.wiktionary.org` fonctionne, Wiktionary ne doit pas envoyer `X-Frame-Options: DENY` ou `Content-Security-Policy: frame-ancestors 'none'`.

**Vérification :** Wikimedia (Wiktionary) n'envoie pas de header `X-Frame-Options` bloquant par défaut — les iframes vers `fr.wiktionary.org` sont autorisées côté serveur Wiktionary. ✅

**Côté Syllabix (GitHub Pages) :** aucune configuration CSP n'est envoyée par défaut. Aucun header à ajouter.

**Fallback obligatoire :** si l'iframe échoue à charger (`onerror`, timeout 5s), afficher un bouton "Ouvrir sur Wiktionnaire ↗" (`target="_blank"`, `rel="noopener"`).

#### 3b. Lemmatisation — `lemmes.json`

**Problème :** Wiktionary montre une définition pauvre pour les formes fléchies (ex. "chantions → forme conjuguée de chanter"). Il faut pointer vers le lemme.

**Décision :** générer `public/lemmes.json` (mot → lemme) à partir du champ `lemme` de `Lexique383.tsv`.

**Mise à jour `scripts/build_graph.py` :**
```python
# Extraire la correspondance mot → lemme depuis Lexique383
lemmes = {}
for row in lexique:
    word = row['ortho'].lower()
    lemme = row['lemme'].lower()
    if word != lemme:
        lemmes[word] = lemme
# Écrire public/lemmes.json
```

**Structure `lemmes.json` :**
```json
{
  "chantions": "chanter",
  "chevaux": "cheval",
  "beaux": "beau"
}
```

Mots absents du fichier = déjà un lemme (pas de lookup nécessaire).

**Chargement dans `dataLoader.ts` :**
```typescript
const [dict, graph, syllables, lemmes] = await Promise.all([
  fetch('/dictionary.json').then(r => r.json()),
  fetch('/graph.json').then(r => r.json()),
  fetch('/syllables.json').then(r => r.json()),
  fetch('/lemmes.json').then(r => r.json()),  // ← nouveau
])
```

**Nouvelle fonction dans `src/engine/phonetics.ts` :**
```typescript
export function getLemme(word: string, lemmes: Record<string, string>): string {
  return lemmes[word.toLowerCase()] ?? word.toLowerCase()
}
```

**URL Wiktionnaire construite dans `DefinitionModal` :**
```typescript
const lemme = getLemme(word, lemmes)
const url = `https://fr.wiktionary.org/wiki/${encodeURIComponent(lemme)}`
```

#### 3c. Composant `DefinitionModal`

**Remplacement de `WordDefinition.tsx`** par `DefinitionModal.tsx` — modale avec iframe.

```
src/components/GameOver/
├── GameOver.tsx
├── GameOver.module.css
├── ChainRecap.tsx
├── DefinitionModal.tsx    ← renommé + refactorisé (était WordDefinition.tsx)
└── DefinitionModal.module.css
```

**States du composant :**
- `hidden` — aucun DOM
- `loading` — iframe en cours, spinner discret
- `loaded` — iframe visible
- `error` — iframe échouée → bouton fallback

**Mapping FR → fichier mis à jour :**

| Domaine | FRs | Localisation |
|---|---|---|
| Fin de partie + Définitions (FR26-30, FR35-36) | Récap + modal iframe | `src/components/GameOver/` |
| Mobile viewport (FR35) | Hook visualViewport | `src/hooks/useVisualViewport.ts` |
| Lemmatisation | getLemme() | `src/engine/phonetics.ts` |
| Build lemmes | build_graph.py étendu | `scripts/build_graph.py` |

**Nouveaux fichiers :**
- `public/lemmes.json` ← généré par `build_graph.py`
- `src/hooks/useVisualViewport.ts`
- `src/components/GameOver/DefinitionModal.tsx`
- `src/components/GameOver/DefinitionModal.module.css`

**Note FR count :** le PRD compte désormais **36 FRs** (FR1-FR36) — FR37 a été déplacée en contrainte de design dans le Périmètre Produit.

### Handoff Implémentation

**Pour tout agent IA implémentant ce projet :**
- Suivre l'architecture documentée comme source de vérité unique
- Respecter les patterns de nommage et d'immutabilité sans exception
- Ne jamais importer `gameReducer` directement dans un composant
- Co-localiser systématiquement les tests avec leurs fichiers source

**Première action d'implémentation :**
```bash
npm create vite@latest syllabix -- --template react-ts
cd syllabix
npm install
```


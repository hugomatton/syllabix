---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflow_completed: true
completed_at: '2026-03-07'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
workflowType: 'epics-and-stories'
project_name: 'syllabix'
user_name: 'Hugo'
date: '2026-03-07'
---

# Syllabix - Epic Breakdown

## Overview

Ce document fournit le découpage complet en épics et stories pour Syllabix, décomposant les exigences du PRD, de l'UX Design et de l'Architecture en stories implémentables.

## Requirements Inventory

### Functional Requirements

FR1 : Le joueur peut démarrer une partie sans créer de compte ni s'inscrire
FR2 : Le bot peut proposer un mot valide du dictionnaire pour initier ou continuer une chaîne
FR3 : Le joueur peut soumettre un mot via le clavier pour répondre au mot du bot
FR4 : Le système peut valider si le mot soumis commence phonétiquement par la dernière syllabe du mot précédent
FR5 : Le joueur peut voir le mot actuel du bot clairement affiché pendant sa réflexion
FR6 : La chaîne peut continuer indéfiniment jusqu'à une condition d'arrêt
FR7 : Le système peut comparer les mots sur base phonétique (IPA) indépendamment de l'orthographe
FR8 : Le système peut appliquer une zone de tolérance pour les cas limites phonétiques
FR9 : Le système peut détecter si la syllabe finale d'un mot crée un dead end dans le graphe de transitions
FR10 : Le système peut vérifier si un mot soumis est présent dans le dictionnaire
FR11 : Le bot peut sélectionner uniquement des mots dont la syllabe finale garantit au moins une continuation possible
FR12 : Le système peut calculer un score égal au nombre de mots validés dans la chaîne courante
FR13 : Le joueur peut voir son score en temps réel pendant la partie
FR14 : Le joueur peut voir son meilleur score de la session courante
FR15 : Le système peut détecter et signaler lorsque le joueur bat son record de session
FR16 : Le joueur peut obtenir un bonus lorsque son mot est orthographiquement exact en plus d'être phonétiquement valide
FR17 : Le joueur peut réaliser un combo en matchant les 2 dernières syllabes du mot précédent
FR18 : Le joueur peut choisir un mode de difficulté (Facile 15s / Moyen 10s / Difficile 6s) avant de démarrer
FR19 : Le système peut décompter un chrono à partir du moment où c'est au joueur de répondre
FR20 : Le système peut mettre fin à la partie lorsque le chrono expire sans soumission valide
FR21 : Le joueur peut voir le chrono en cours pendant sa réflexion
FR22 : Le joueur peut lire une explication minimaliste des règles sur la page principale
FR23 : Le joueur peut recevoir un retour visuel immédiat après chaque validation
FR24 : Le joueur peut recevoir un retour sonore après chaque validation
FR25 : Le joueur peut voir clairement pourquoi son mot est refusé (hors dictionnaire ou mauvaise syllabe)
FR26 : Le système peut déclencher une fin de partie lorsque le joueur crée un dead end phonétique
FR27 : Le joueur peut lire un message explicatif en cas de défaite par dead end
FR28 : Le joueur peut accéder à un récap de tous les mots de la chaîne en fin de partie
FR29 : Le joueur peut consulter la définition de chaque mot du récap
FR30 : Le joueur peut relancer une nouvelle partie depuis l'écran de fin
FR31 : L'administrateur peut générer dictionary.json avec l'IPA pré-calculé de chaque mot
FR32 : L'administrateur peut générer graph.json avec les transitions valides entre syllabes
FR33 : L'administrateur peut exécuter un harnais de tests pour valider le moteur phonétique
FR34 : L'administrateur peut configurer le seuil de tolérance phonétique dans un fichier de config

### NonFunctional Requirements

NFR1 : Validation d'un mot soumis : <300ms côté joueur
NFR2 : Chargement initial (dictionary.json + graph.json) : <2s sur connexion standard
NFR3 : Précision chrono ±100ms
NFR4 : Zéro calcul phonétique en temps réel — toute comparaison est une lookup JSON
NFR5 : Architecture 100% statique — scalabilité gérée nativement par le CDN
NFR6 : Fichiers JSON (dictionary + graph) : <5MB total après compression gzip
NFR7 : Contraste texte principal : ratio ≥4.5:1
NFR8 : Taille de police minimale : 16px sur mobile
NFR9 : Focus clavier fonctionnel sur tous les éléments interactifs
NFR10 : Responsive : jouable sur mobile (320px+) et desktop
NFR11 : Disponibilité cible : >99% (hébergement statique CDN)
NFR12 : Zéro point de défaillance backend
NFR13 : Record de session persisté en localStorage — survit aux rafraîchissements
NFR14 : Seuil de tolérance phonétique configurable dans un fichier de config sans modification du code
NFR15 : Harnais de tests rejouable à chaque mise à jour du dictionnaire ou du moteur
NFR16 : Script de pré-calcul build-time documenté et reproductible

### Additional Requirements

**Architecture :**
- ARC1 : Starter = `npm create vite@latest syllabix -- --template react-ts` → Epic 1 Story 1
- ARC2 : Données en mémoire — `Map<string,string>` pour dictionary, `Record<string,string[]>` pour graph
- ARC3 : State management via `useReducer` centralisé (GameState)
- ARC4 : Timer via `performance.now()` + `requestAnimationFrame` (jamais setInterval)
- ARC5 : CSS Modules uniquement — zéro lib externe de composants
- ARC6 : Tests Vitest co-localisés avec fichiers source
- ARC7 : Déploiement GitHub Pages (branche `gh-pages`)
- ARC8 : Scripts Python dans `scripts/` (hors bundle Vite)
- ARC9 : Barrel files `index.ts` obligatoires dans chaque dossier `src/`
- ARC10 : State immutable — spread operator uniquement dans reducer
- ARC11 : `Promise.all([fetch(dictionary), fetch(graph)])` au démarrage
- ARC12 : localStorage clé `'syllabix-record'` pour record uniquement
- ARC13 : 50+ cas de test phonétiques (30 passants / 20 non-passants) dans test_cases.json

**UX :**
- UX1 : Palette Light Amber — fond `#fafafa`, texte `#111`, accent `#d97706`
- UX2 : Layout Arcade — TimerRing SVG circulaire + BotWord centré + WordChain chips + WordInput bas
- UX3 : `autofocus` + re-focus automatique sur WordInput après chaque validation
- UX4 : Soumission par `Enter` uniquement
- UX5 : Erreur inline sous input, disparaît après 2s
- UX6 : RecordBurst overlay (`pointer-events: none`) quand record battu
- UX7 : `prefers-reduced-motion` respecté pour toutes les animations
- UX8 : WCAG 2.1 AA — touch targets min 44px, outline focus amber
- UX9 : 11 composants spécifiés (TimerRing, BotWord, WordInput, ErrorMessage, WordChain, WordChip, ScoreDisplay, RecordBurst, DifficultySelector, DeadEndMessage, DefinitionPanel)
- UX10 : `inputmode="text"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"` sur WordInput
- UX11 : Police Inter (Google Fonts) avec fallback `system-ui`

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR31, FR32, FR33, FR34 | Epic 1 | Build-time Python + harnais de tests |
| FR2, FR4, FR7, FR8, FR9, FR10, FR11 | Epic 2 | Moteur phonétique + sélection bot |
| FR1, FR3, FR5, FR6 | Epic 3 | Boucle de jeu core |
| FR12, FR13, FR18, FR19, FR20, FR21 | Epic 3 | Score temps réel + timer |
| FR22, FR23, FR24, FR25 | Epic 3 | Interface + feedback visuel/sonore |
| FR14, FR15, FR16, FR17 | Epic 4 | Record de session + bonus + combo |
| FR26, FR27, FR28, FR29, FR30 | Epic 5 | Fin de partie + récap pédagogique |
| NFRs, ARC7 | Epic 6 | Déploiement + performance + accessibilité |

## Epic List

### Epic 1 : Fondation Projet & Données Phonétiques
L'administrateur peut initialiser le projet, générer le dictionnaire IPA et le graphe de transitions, et valider le moteur phonétique via un harnais de tests. C'est la fondation qui rend le jeu possible.
**FRs couverts :** FR31, FR32, FR33, FR34

### Epic 2 : Moteur Phonétique & Sélection Bot
Le système peut valider phonétiquement les mots soumis, détecter les dead ends, et le bot peut sélectionner un mot garantissant une continuation. Le cœur logique du jeu — testable indépendamment de l'UI.
**FRs couverts :** FR2, FR4, FR7, FR8, FR9, FR10, FR11

### Epic 3 : Boucle de Jeu & Interface Complète
Un joueur peut démarrer une partie, choisir sa difficulté, jouer sous contrainte de temps, soumettre des mots et recevoir un retour visuel et sonore immédiat. L'expérience de jeu de bout en bout.
**FRs couverts :** FR1, FR3, FR5, FR6, FR12, FR13, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25

### Epic 4 : Record de Session, Bonus & Progression
Un joueur peut suivre son record de session, le battre avec un effet mémorable, et bénéficier des mécaniques de bonus orthographe et combo syllabe double.
**FRs couverts :** FR14, FR15, FR16, FR17

### Epic 5 : Fin de Partie & Récap Pédagogique
Un joueur reçoit un récap complet de sa partie avec tous les mots de la chaîne, peut consulter les définitions, comprend le dead end phonétique, et peut relancer une nouvelle partie.
**FRs couverts :** FR26, FR27, FR28, FR29, FR30

### Epic 6 : Déploiement & Mise en Production
Syllabix est accessible publiquement via GitHub Pages, les assets sont optimisés pour la production, et le déploiement est documenté et reproductible.
**NFRs couverts :** NFR1–NFR16, ARC7

---

## Epic 1 : Fondation Projet & Données Phonétiques

L'administrateur peut initialiser le projet, générer le dictionnaire IPA et le graphe de transitions, et valider le moteur phonétique via un harnais de tests. C'est la fondation qui rend le jeu possible.

### Story 1.1 : Initialisation du Projet Vite + React + TypeScript

En tant que développeur,
Je veux initialiser le projet Syllabix avec Vite + React + TypeScript,
Afin que la structure de projet soit prête au développement avec le bon outillage.

**Acceptance Criteria :**

**Given** je suis dans le répertoire parent du projet
**When** j'exécute `npm create vite@latest syllabix -- --template react-ts && cd syllabix && npm install`
**Then** le projet est créé avec `src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig.json`
**And** `npm run dev` démarre le serveur sur localhost:5173 sans erreur

**Given** le projet est initialisé
**When** j'ajoute Vitest (`npm install -D vitest @vitest/ui jsdom @testing-library/react`)
**Then** `npm run test` exécute la suite de tests sans erreur
**And** `vitest.config.ts` est configuré avec l'environnement jsdom

**Given** la structure de projet
**When** je crée les dossiers : `src/config/`, `src/engine/`, `src/game/`, `src/hooks/`, `src/components/App/`, `src/components/StartScreen/`, `src/components/GameScreen/`, `src/components/GameOver/`, `src/components/shared/`, `src/styles/`, `scripts/`
**Then** chaque dossier contient un barrel file `index.ts` placeholder
**And** `src/styles/globals.css` existe

**Given** le projet
**When** j'exécute `npm run build`
**Then** le build produit un dossier `dist/` sans erreur

---

### Story 1.2 : Script Python build_dictionary.py — Génération dictionary.json

En tant qu'administrateur,
Je veux générer `dictionary.json` avec l'IPA pré-calculé pour chaque mot français,
Afin que le moteur phonétique puisse faire des lookups sans calcul en temps réel. (FR31)

**Acceptance Criteria :**

**Given** `scripts/requirements.txt` liste phonemize et espeak-ng
**When** j'exécute `pip install -r requirements.txt`
**Then** toutes les dépendances s'installent sans erreur

**Given** `scripts/build_dictionary.py` existe et le dictionnaire Lexique est disponible
**When** j'exécute `python scripts/build_dictionary.py`
**Then** `public/dictionary.json` est généré avec le format `{"mot": "chaine_IPA", ...}`
**And** le fichier contient au moins 100 000 entrées
**And** les mots sont stockés en minuscules normalisées

**Given** `public/dictionary.json` existe
**When** je vérifie le mot "chocolat"
**Then** sa représentation IPA est présente et phonétiquement correcte
**And** les variantes accentuées (é, è, à...) sont gérées

---

### Story 1.3 : Script Python build_graph.py — Génération graph.json

En tant qu'administrateur,
Je veux générer `graph.json` avec les transitions phonétiques (dernière syllabe → mots valides suivants),
Afin que le bot puisse toujours sélectionner un mot garantissant une continuation possible. (FR32)

**Acceptance Criteria :**

**Given** `public/dictionary.json` existe depuis la Story 1.2
**When** j'exécute `python scripts/build_graph.py`
**Then** `public/graph.json` est généré avec le format `{"syllabe_IPA": ["mot1", "mot2", ...], ...}`
**And** chaque mot dans les valeurs du graphe existe aussi dans dictionary.json
**And** chaque clé syllabe mappe vers au moins 2 mots possibles
**And** les mots dont la dernière syllabe n'a aucune continuation sont exclus

**Given** `public/graph.json` existe
**When** je vérifie la taille totale des fichiers
**Then** dictionary.json + graph.json totalisent moins de 5MB après compression gzip (NFR6)

**Given** `public/graph.json` existe
**When** je cherche la syllabe "la" (de "chocolat")
**Then** la liste inclut "lapin" ou des mots similaires commençant par le son "la"

---

### Story 1.4 : Harnais de Tests Phonétiques & Config Seuil

En tant qu'administrateur,
Je veux un harnais de tests validant le moteur phonétique avec 50+ cas,
Afin de détecter les régressions lors de chaque mise à jour du dictionnaire ou du seuil. (FR33, FR34)

**Acceptance Criteria :**

**Given** `scripts/test_cases.json` existe avec minimum 50 cas (30 valides, 20 invalides)
**When** j'examine la structure
**Then** chaque cas a : `{ "word": "lapin", "previous": "chocolat", "expected": true/false }`
**And** les cas couvrent : homophones, accents, liaisons, syllabes limites, mots hors dictionnaire

**Given** `scripts/run_tests.py` existe et les JSON sont générés
**When** j'exécute `python scripts/run_tests.py`
**Then** les 30 cas valides passent
**And** les 20 cas invalides sont correctement rejetés
**And** un rapport de synthèse est imprimé (X/50 passés)

**Given** `src/config/constants.ts` existe
**When** je consulte le fichier
**Then** il exporte `PHONETIC_TOLERANCE = 2` (distance d'édition IPA max)
**And** modifier cette valeur met à jour le comportement de validation sans toucher au code (NFR14)
**And** `TIMER_EASY = 15`, `TIMER_MEDIUM = 10`, `TIMER_HARD = 6` y sont aussi définis

---

## Epic 2 : Moteur Phonétique & Sélection Bot

Le système peut valider phonétiquement les mots soumis, détecter les dead ends, et le bot peut sélectionner un mot garantissant une continuation. Le cœur logique du jeu — testable indépendamment de l'UI.

### Story 2.1 : Chargement des Données JSON en Mémoire

En tant que joueur,
Je veux que le jeu charge ses données phonétiques de façon transparente au démarrage,
Afin que la validation des mots soit instantanée pendant toute la partie.

**Acceptance Criteria :**

**Given** `public/dictionary.json` et `public/graph.json` existent
**When** j'ouvre l'app
**Then** `App.tsx` fetch les deux fichiers en parallèle via `Promise.all()` (ARC11)
**And** dictionary.json est stocké en `Map<string, string>` en mémoire (ARC2)
**And** graph.json est stocké en `Record<string, string[]>` en mémoire (ARC2)

**Given** le chargement dépasse 300ms
**When** le composant `LoadingScreen` s'affiche
**Then** le texte "Chargement du dictionnaire…" apparaît en couleur muted, centré
**And** le bouton "Jouer" n'est pas accessible pendant le chargement

**Given** le chargement est réussi
**When** les données sont prêtes
**Then** l'app passe en phase idle (StartScreen) en moins de 2s (NFR2)
**And** les lookups ultérieurs retournent un résultat en <1ms (NFR4)

**Given** une erreur réseau ou fichier manquant
**When** `fetch()` échoue
**Then** un écran d'erreur bloquant affiche un message clair
**And** le jeu n'essaie pas de démarrer

---

### Story 2.2 : Module Phonetics — Validation Phonétique

En tant que système,
Je veux un module TypeScript pur qui valide si un mot commence par la bonne syllabe,
Afin que les soumissions des joueurs soient vérifiées instantanément. (FR4, FR7, FR8, FR10)

**Acceptance Criteria :**

**Given** `src/engine/phonetics.ts` existe et exporte via `src/engine/index.ts`
**When** j'appelle `getLastSyllable(word, dictionary)`
**Then** il retourne la dernière syllabe phonétique IPA du mot (FR7)
**And** utilise la Map pré-chargée — pas de calcul temps réel (NFR4)

**Given** `validateWord(input, currentWord, dictionary)` est appelé
**When** le mot commence par la bonne syllabe (match exact)
**Then** retourne `{ valid: true, reason: null }`

**When** le mot n'est pas dans le dictionnaire
**Then** retourne `{ valid: false, reason: 'not-in-dictionary' }` (FR10)

**When** le mot est dans le dictionnaire mais mauvaise syllabe
**Then** retourne `{ valid: false, reason: 'wrong-syllable' }` (FR7)

**When** l'input est dans la zone de tolérance (distance IPA ≤ PHONETIC_TOLERANCE)
**Then** retourne `{ valid: true, reason: null }` (FR8)

**Given** `src/engine/phonetics.test.ts` existe
**When** j'exécute `npm run test`
**Then** tous les tests passent, couvrant au minimum les 50 cas de `test_cases.json`
**And** chaque validation s'exécute en <1ms (NFR1)

---

### Story 2.3 : Module BotSelector — Sélection Bot Sûre

En tant que système,
Je veux un module de sélection bot qui choisit un mot garantissant au moins une réponse valide du joueur,
Afin que le bot ne crée jamais une situation sans issue côté bot. (FR2, FR9, FR11)

**Acceptance Criteria :**

**Given** `src/engine/botSelector.ts` existe
**When** j'appelle `selectBotWord(lastSyllable, graph)`
**Then** il retourne un mot aléatoire depuis l'entrée graph pour cette syllabe (FR2)
**And** chaque mot retourné a au moins 2 réponses joueur possibles dans graph.json (FR11)
**And** la sélection s'exécute en <1ms

**Given** le démarrage de partie (pas de mot précédent)
**When** `selectInitialWord(graph)` est appelé
**Then** il retourne un mot français commun dont la dernière syllabe a au moins 5 réponses possibles
**And** le mot varie entre les parties (Math.random())

**Given** `src/engine/botSelector.test.ts` existe
**When** j'exécute `npm run test`
**Then** tous les tests passent
**And** aucun mot retourné ne crée un dead end côté bot (FR9)

---

## Epic 3 : Boucle de Jeu & Interface Complète

Un joueur peut démarrer une partie, choisir sa difficulté, jouer sous contrainte de temps, soumettre des mots et recevoir un retour visuel et sonore immédiat. L'expérience de jeu de bout en bout.

### Story 3.1 : CSS Globals & Design Tokens

En tant que développeur,
Je veux les variables CSS globales correspondant au design approuvé (Light Amber),
Afin que tous les composants partagent un langage visuel cohérent. (UX1, UX11)

**Acceptance Criteria :**

**Given** `src/styles/globals.css` existe et est importé dans `src/main.tsx`
**When** j'inspecte le fichier
**Then** tous les tokens sont définis : `--color-bg: #fafafa`, `--color-surface: #f7f7f5`, `--color-text: #111111`, `--color-muted: #9ca3af`, `--color-accent: #d97706`, `--color-accent-bg: #fffbeb`, `--color-border: #e0e0e0`, `--color-success: #16a34a`, `--color-error: #dc2626`
**And** la police Inter est chargée via Google Fonts dans `index.html`
**And** `font-family: 'Inter', system-ui, sans-serif` est appliqué globalement
**And** `box-sizing: border-box` et `margin: 0` sont réinitialisés

**Given** les styles globaux
**When** je vérifie les ratios de contraste
**Then** texte `#111` sur `#fafafa` atteint ≥4.5:1 (NFR7)
**And** `font-size: 16px` est la taille de base (NFR8)

---

### Story 3.2 : GameState Architecture — useReducer

En tant que développeur,
Je veux un état de jeu centralisé géré via useReducer,
Afin que toute la logique de jeu passe par une machine à états unique et prévisible. (ARC3)

**Acceptance Criteria :**

**Given** `src/game/gameTypes.ts` existe
**When** je l'inspecte
**Then** il exporte `GamePhase = 'idle' | 'playing' | 'game-over'`
**And** `GameState` avec : `phase, difficulty, chain, currentWord, score, sessionRecord, timeLeft, lastError`
**And** `GameAction` couvre toutes les actions : `START_GAME`, `SUBMIT_WORD`, `BOT_RESPOND`, `TICK_TIMER`, `GAME_OVER`, `RESTART`

**Given** `src/game/gameReducer.ts` existe
**When** chaque action est dispatchée
**Then** le state est mis à jour de façon immutable — spread operator, jamais de mutation directe (ARC10)
**And** `SUBMIT_WORD` met à jour chain + score ou lastError selon validation
**And** `GAME_OVER` passe la phase en 'game-over' avec reason (timeout | dead-end)
**And** `RESTART` réinitialise tous les champs sauf sessionRecord

**Given** `src/hooks/useGameState.ts` existe
**When** un composant utilise le hook
**Then** il reçoit `{ state, dispatch }` avec accès typé
**And** `localStorage.getItem('syllabix-record')` est lu une seule fois à l'initialisation (ARC12)

**Given** `src/game/gameReducer.test.ts` existe
**When** j'exécute `npm run test`
**Then** toutes les transitions d'état sont couvertes et passent

---

### Story 3.3 : Timer — performance.now() + requestAnimationFrame

En tant que joueur,
Je veux un timer précis qui rythme la pression de jeu,
Afin que la contrainte de temps soit équitable et cohérente. (FR19, FR20, FR21)

**Acceptance Criteria :**

**Given** `src/game/timer.ts` exporte `createTimer(onTick, onExpire, durationMs)`
**When** le timer démarre
**Then** il utilise `performance.now()` pour le calcul du temps écoulé (NFR3, ARC4)
**And** `requestAnimationFrame` est utilisé pour la boucle de tick — jamais setInterval
**And** `onTick(timeLeft: number)` est appelé chaque frame avec le temps restant en ms
**And** `onExpire()` est appelé une seule fois quand timeLeft atteint 0

**Given** `src/hooks/useTimer.ts` enveloppe le timer
**When** le hook est utilisé dans un composant
**Then** le timer démarre automatiquement et se nettoie (cancel rAF) au démontage
**And** la précision est dans ±100ms (NFR3)

**Given** la difficulté est Easy / Medium / Hard
**When** la partie démarre
**Then** la durée est 15000ms / 10000ms / 6000ms respectivement (FR18)
**And** le timer se remet à la durée complète après chaque soumission réussie (FR19)

---

### Story 3.4 : StartScreen — Démarrage Sans Friction

En tant que joueur,
Je veux un écran de démarrage épuré où je choisis ma difficulté et lance la partie en un clic,
Afin de commencer à jouer immédiatement sans friction. (FR1, FR18, FR22)

**Acceptance Criteria :**

**Given** l'app est chargée et les données sont prêtes
**When** je vois le StartScreen
**Then** le titre "Syllabix" est affiché en `<h1>`
**And** la règle est affichée en une ligne : "Trouve un mot qui commence par la dernière syllabe du mot proposé." (FR22)
**And** `DifficultySelector` affiche 3 boutons : Facile (15s) / Moyen (10s) / Difficile (6s) (FR18)
**And** "Moyen" est sélectionné par défaut
**And** un bouton "Jouer" proéminent est visible

**Given** je clique "Jouer"
**When** la partie démarre
**Then** `dispatch({ type: 'START_GAME', difficulty })` est appelé
**And** le GameScreen s'affiche immédiatement avec le premier mot bot

**Given** je suis sur mobile (320px)
**When** je vois le DifficultySelector
**Then** les 3 boutons ont min-height 44px (UX8)
**And** le layout n'est pas cassé à 320px (NFR10)

---

### Story 3.5 : GameScreen — Affichage Jeu, BotWord & ScoreDisplay

En tant que joueur,
Je veux voir le mot du bot en grand, mon score et la chaîne pendant le jeu,
Afin d'avoir toujours une vision claire de l'état de partie. (FR5, FR6, FR12, FR13, FR21)

**Acceptance Criteria :**

**Given** le jeu est en phase 'playing'
**When** je vois le GameScreen
**Then** `BotWord` affiche le mot actuel en grand texte centré (`clamp(2.5rem, 8vw, 5rem)`) (FR5)
**And** `ScoreDisplay` affiche le score courant dans le coin (FR12, FR13)
**And** `WordChain` affiche les chips des mots déjà joués, scrollable horizontalement (FR6)
**And** `TimerRing` SVG affiche le compte à rebours en haut de l'écran (FR21)

**Given** un nouveau mot bot arrive
**When** `BotWord` se met à jour
**Then** le mot s'affiche immédiatement avec une animation d'entrée (150ms)
**And** l'animation respecte `prefers-reduced-motion` (UX7)

**Given** le timer tourne
**When** timeLeft passe sous 30% de la durée totale
**Then** la couleur du stroke `TimerRing` passe à `--color-error`

**Given** je joue sur mobile (375px)
**When** je vois le GameScreen
**Then** tous les éléments sont visibles sans scroll horizontal
**And** la taille de `BotWord` s'adapte via `clamp()` (UX2)

---

### Story 3.6 : WordInput — Saisie & Boucle de Validation Complète

En tant que joueur,
Je veux taper mon mot et le soumettre par Entrée pour une validation instantanée,
Afin que le flux de jeu soit continu et sans friction. (FR3, FR23, FR24, FR25)

**Acceptance Criteria :**

**Given** le jeu est en phase 'playing'
**When** le GameScreen monte
**Then** `WordInput` reçoit le focus automatiquement (`autofocus`) (UX3)
**And** les attributs `inputmode="text"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"` sont présents (UX10)

**Given** je tape un mot et appuie sur Entrée
**When** le mot est valide (bonne syllabe + dans le dictionnaire)
**Then** l'input flashe vert pendant 150ms (FR23)
**And** un son léger de succès est joué (FR24)
**And** le mot est ajouté en chip à `WordChain`
**And** le bot répond avec un nouveau mot via `botSelector.selectBotWord()`
**And** l'input se vide et reprend le focus automatiquement (UX3)
**And** le score s'incrémente de 1 (FR12)

**Given** je soumets un mot hors dictionnaire
**When** la validation échoue
**Then** l'input flashe rouge 150ms (FR23)
**And** `ErrorMessage` affiche "Mot non reconnu dans le dictionnaire" sous l'input (FR25)
**And** le texte de l'input est sélectionné pour correction facile
**And** le message disparaît après 2s (UX5)
**And** le timer continue de tourner

**Given** je soumets un mot avec mauvaise syllabe
**When** la validation échoue
**Then** `ErrorMessage` affiche "Ne commence pas par [SYLLABE]" (FR25)
**And** le même comportement de récupération s'applique

**Given** je soumets un mot valide
**When** la réponse bot a 0 continuation dans graph.json
**Then** `dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable })` est déclenché (FR26)
**And** le jeu transite vers GameOverScreen

**Given** le timer atteint 0
**When** aucune soumission valide n'a été faite
**Then** `dispatch({ type: 'GAME_OVER', reason: 'timeout' })` est déclenché (FR20)

---

## Epic 4 : Record de Session, Bonus & Progression

Un joueur peut suivre son record de session, le battre avec un effet mémorable, et bénéficier des mécaniques de bonus orthographe et combo syllabe double.

### Story 4.1 : Record de Session & Persistance localStorage

En tant que joueur,
Je veux que mon meilleur score persiste pendant toute ma session,
Afin de savoir quel score dépasser sans avoir besoin d'un compte. (FR14)

**Acceptance Criteria :**

**Given** j'ouvre l'app pour la première fois
**When** `useGameState` s'initialise
**Then** `sessionRecord` est lu depuis `localStorage.getItem('syllabix-record')` (ARC12)
**And** si aucun record n'existe, `sessionRecord` vaut 0

**Given** je termine une partie avec score > sessionRecord
**When** `GAME_OVER` est dispatché
**Then** `sessionRecord` est mis à jour au nouveau score
**And** `localStorage.setItem('syllabix-record', newRecord)` est appelé
**And** le record persiste après rafraîchissement de page (NFR13)

**Given** `ScoreDisplay` affiche le record de session
**When** il rend
**Then** le record est visible pendant le jeu (FR14)
**And** l'affichage utilise `font-variant-numeric: tabular-nums`

---

### Story 4.2 : RecordBurst — Effet Visuel Record Battu

En tant que joueur,
Je veux un effet visuel mémorable quand je bats mon record de session,
Afin que l'accomplissement soit marquant sans interrompre le gameplay. (FR15)

**Acceptance Criteria :**

**Given** je joue et mon score dépasse sessionRecord
**When** le record est battu
**Then** `RecordBurst` s'affiche en overlay avec le texte "Nouveau record !" (FR15)
**And** l'overlay a `pointer-events: none` — je peux continuer à taper (UX6)
**And** l'animation dure : 300ms entrée + 900ms visible + 300ms sortie
**And** l'animation respecte `prefers-reduced-motion` (UX7)
**And** `sessionRecord` dans `ScoreDisplay` se met à jour immédiatement

**Given** le RecordBurst est actif
**When** je soumets mon prochain mot
**Then** le gameplay continue sans interruption
**And** le burst termine son animation indépendamment

---

### Story 4.3 : Bonus Orthographe & Combo Syllabe Double

En tant que joueur,
Je veux gagner des points bonus pour une orthographe parfaite et un match de double syllabe,
Afin que le jeu habile soit récompensé au-delà du simple matching phonétique. (FR16, FR17)

**Acceptance Criteria :**

**Given** je soumets un mot phonétiquement valide
**When** l'orthographe de mon mot est aussi exacte (pas juste une approximation phonétique)
**Then** le score s'incrémente de 2 au lieu de 1 (FR16)
**And** un indicateur visuel subtil distingue le bonus d'un point normal

**Given** je soumets un mot qui commence par les 2 dernières syllabes du mot bot
**When** le match double syllabe est détecté
**Then** le score s'incrémente de 3 (FR17)
**And** un indicateur visuel distinct marque le combo

**Given** les deux conditions s'appliquent simultanément
**When** un mot cumule bonus orthographe et combo syllabe double
**Then** les bonus se cumulent de façon cohérente

---

## Epic 5 : Fin de Partie & Récap Pédagogique

Un joueur reçoit un récap complet de sa partie avec tous les mots de la chaîne, peut consulter les définitions, comprend le dead end phonétique, et peut relancer une nouvelle partie.

### Story 5.1 : GameOver Screen — Résumé & Rejouer

En tant que joueur,
Je veux voir mon score final et relancer facilement,
Afin que la fin de partie soit une transition naturelle vers une nouvelle session. (FR28, FR30)

**Acceptance Criteria :**

**Given** la phase de jeu est 'game-over'
**When** `GameOverScreen` s'affiche
**Then** le score final est affiché de façon proéminente
**And** le record de session est affiché
**And** un bouton "Rejouer" proéminent est visible (FR30)
**And** cliquer "Rejouer" dispatche `RESTART` et retourne au StartScreen

**Given** je clique "Rejouer"
**When** le jeu se réinitialise
**Then** chain, score, currentWord, lastError sont remis à zéro
**And** `sessionRecord` est préservé depuis localStorage
**And** le StartScreen s'affiche immédiatement

**Given** l'écran sur mobile
**When** je tape "Rejouer"
**Then** le bouton a min-height 44px et répond immédiatement (UX8)

---

### Story 5.2 : Dead End — Message Pédagogique

En tant que joueur,
Je veux comprendre pourquoi mon mot a terminé la partie,
Afin d'apprendre quelque chose d'intéressant plutôt que de me sentir lésé. (FR26, FR27)

**Acceptance Criteria :**

**Given** la partie s'est terminée par un dead end
**When** `GameOverScreen` s'affiche
**Then** `DeadEndMessage` est affiché de façon proéminente avant le récap (FR27)
**And** le message lit : "Aucun mot français ne commence par '[SYLLABE]' — fin de chaîne !"
**And** la syllabe problématique est en gras amber
**And** le ton est informatif, pas punitif

**Given** la partie s'est terminée par timeout
**When** `GameOverScreen` s'affiche
**Then** `DeadEndMessage` n'est PAS affiché
**And** l'écran montre uniquement score + chaîne + Rejouer

---

### Story 5.3 : WordChain Récap — Chaîne Complète

En tant que joueur,
Je veux voir tous les mots de ma chaîne en fin de partie,
Afin de revoir ma performance et découvrir les mots inconnus. (FR28)

**Acceptance Criteria :**

**Given** la partie est terminée
**When** `GameOverScreen` s'affiche
**Then** `WordChain` affiche tous les mots de la chaîne complète en chips (FR28)
**And** la chaîne entière est visible (scrollable si longue)
**And** les mots du joueur et du bot sont visuellement distinguables

**Given** la chaîne est longue (>10 mots)
**When** je visualise le récap
**Then** je peux scroller à travers tous les mots
**And** le layout ne casse pas sur mobile (320px)

---

### Story 5.4 : DefinitionPanel — Définitions Cliquables

En tant que joueur,
Je veux tapper sur n'importe quel mot du récap pour voir sa définition,
Afin d'apprendre de mes mots et des mots insolites du bot. (FR29)

**Acceptance Criteria :**

**Given** `GameOverScreen` affiche le récap de chaîne
**When** je clique/tape sur un `WordChip`
**Then** `DefinitionPanel` s'ouvre inline sous le chip cliqué (FR29)
**And** il affiche le mot en titre et le texte "Définition non disponible" *(comportement nominal V1 — décision Hugo 2026-03-07)*
**And** un seul panel est ouvert à la fois

**Given** `DefinitionPanel` est ouvert
**When** je clique le même chip à nouveau ou le bouton de fermeture
**Then** le panel se ferme

**Given** j'utilise la navigation clavier
**When** je focus un chip avec Tab et appuie sur Entrée
**Then** `DefinitionPanel` s'ouvre (NFR9)
**And** Escape le ferme

---

## Epic 6 : Déploiement & Mise en Production

Syllabix est accessible publiquement via GitHub Pages, les assets sont optimisés pour la production, et le déploiement est documenté et reproductible.

### Story 6.1 : Configuration Vite pour GitHub Pages

En tant que développeur,
Je veux le build Vite configuré pour GitHub Pages,
Afin que les assets se chargent correctement sous le sous-chemin du dépôt. (ARC7)

**Acceptance Criteria :**

**Given** `vite.config.ts` existe
**When** je vérifie la configuration
**Then** `base: '/syllabix/'` est défini (correspondant au nom du dépôt GitHub)
**And** `npm run build` produit `dist/` avec des chemins d'assets corrects

**Given** `package.json` existe
**When** je vérifie les scripts
**Then** `"build": "tsc && vite build"` compile TypeScript avant de bundler
**And** `"preview": "vite preview"` permet un aperçu local du build de production

**Given** le build de production
**When** j'exécute `npm run preview`
**Then** l'app charge sans erreurs 404 sur les assets
**And** `dictionary.json` et `graph.json` se chargent depuis les bons chemins

---

### Story 6.2 : Déploiement GitHub Pages

En tant que développeur,
Je veux déployer Syllabix sur GitHub Pages,
Afin que le jeu soit accessible publiquement sans coût. (NFR5, NFR11)

**Acceptance Criteria :**

**Given** un dépôt GitHub existe pour le projet
**When** j'exécute `npm run build` puis pousse `dist/` vers la branche `gh-pages`
**Then** l'app est accessible à `https://[username].github.io/syllabix/`
**And** tous les assets chargent sans erreur 404

**Given** le déploiement est actif
**When** je teste sur mobile (iPhone Safari + Android Chrome)
**Then** le jeu est jouable sans scroll horizontal involontaire (NFR10)
**And** le temps de chargement est inférieur à 2s sur connexion standard (NFR2)

**Given** le déploiement
**When** j'exécute l'audit axe sur l'URL de production
**Then** il n'y a aucune violation "critical" ou "serious" (NFR7–NFR9)

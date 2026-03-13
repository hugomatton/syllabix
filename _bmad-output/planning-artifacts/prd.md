---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflow_completed: true
completed_at: '2026-03-06'
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-03-06-2015.md']
workflowType: 'prd'
classification:
  projectType: 'web_app'
  domain: 'general'
  complexity: 'low-medium'
  projectContext: 'greenfield'
---

# Product Requirements Document — Syllabix

**Auteur :** Hugo
**Date :** 2026-03-06
**Type :** SPA web app · Domaine général · Complexité faible-moyenne · Greenfield

---

## Résumé Exécutif

Syllabix est un jeu de mots web grand public : un humain et un bot s'enchaînent des mots en rebondissant sur la dernière syllabe du mot précédent. La règle est phonétique — le son prime sur l'orthographe. La chaîne continue jusqu'à épuisement du joueur ; l'objectif est de battre son record de session.

Cible : francophones amateurs de jeux de mots accessibles, sans contrainte de progression ni streak. Public de référence : Semantix, Pedantix. Pas de compte requis, pas de dark patterns.

### Ce qui rend Syllabix spécial

Dans l'espace des jeux de mots français (Wordle, Semantix, Pedantix, Motus), aucun ne joue sur la **phonétique des syllabes**. Syllabix occupe un angle inédit : la chaîne de sons. Simple à comprendre en une partie, profonde via la pression du chrono et la richesse du dictionnaire.

Pari produit : une bonne expérience suffit. Pas d'addiction forcée, pas de notifications, pas de système de vies. Les joueurs reviennent parce que c'est bien fait.

---

## Critères de Succès

### Succès Utilisateur

- Validation d'un mot perçue comme quasi-instantanée (<300ms depuis la soumission)
- Chaque mot validé déclenche un retour visuel et/ou sonore immédiat sans interrompre le flux
- Chaîne sans bug ni comportement inattendu — le bot répond toujours, le chrono est prévisible
- En fin de partie, le joueur a envie de relancer

### Succès Business

- Projet personnel open access — aucun objectif de croissance ni de monétisation
- Coût infra : <5€/mois, idéalement zéro
- Zéro dépendance à une API payante en V1

### Succès Technique

- Moteur phonétique validé par un harnais de tests : mots valides, invalides, cas limites (homophones partiels, accents, liaisons)
- Harnais passe → moteur considéré calibré
- Graphe de transitions pré-calculé, chargé au démarrage sans latence perceptible

### Indicateurs Mesurables

- Latence de validation : <300ms
- Coût mensuel infra : <5€
- Harnais de tests : minimum 50 cas (30 passants / 20 non-passants)
- Zéro dead end côté bot en conditions normales de jeu

---

## Périmètre Produit

### MVP (Phase 1)

**Approche :** expérience complète dès la V1 — aucune fonctionnalité partielle. Développeur solo, hébergement statique gratuit.

**Architecture build-time / runtime :**
- **Build time (Python, offline)** : script de pré-calcul phonemize/espeak → deux fichiers JSON statiques :
  - `dictionary.json` — chaque mot avec son IPA pré-calculé
  - `graph.json` — pour chaque syllabe finale, liste des mots valides
- **Runtime (navigateur)** : lookup dans les JSON, zéro calcul phonétique en temps réel, zéro backend
- Mot hors dictionnaire → rejeté comme "mot non reconnu"

**Fonctionnalités :**
- Boucle de jeu complète : chaîne infinie, validation phonétique, chrono adaptatif
- 3 modes de difficulté : Facile (15s) / Moyen (10s) / Difficile (6s)
- Score = longueur de chaîne + record de session (localStorage, pas de compte)
- Bonus orthographe + combo double syllabe
- Détection dead end + message pédagogique
- Récap fin de partie avec définitions cliquables
- UI ultra-minimaliste, responsive
- Explication minimaliste des règles visible sur la page
- Retour visuel et sonore léger à chaque validation

### Post-MVP (Phase 2)

- Bot narquois expressif (réactions émotionnelles selon les perfs)
- Scoring enrichi (multiplicateurs, streaks, bonus mots rares)
- LLM en fallback pour les cas phonétiques ambigus

### Vision (Phase 3)

- Support multilingue (anglais, espagnol...)
- Partage de chaîne sur les réseaux sociaux
- Classement / scores publics

### Gestion des Risques

| Risque | Mitigation |
|---|---|
| Moteur phonétique mal calibré | Harnais de tests (50+ cas) ; seuil de tolérance configurable |
| Dictionnaire incomplet | Lexique (130k+ formes) embarqué dès le départ — pas de curation manuelle |
| Performances dégradées | JSON statiques pré-calculés ; zéro calcul en temps réel |
| Coût infra | 100% statique, zéro API externe — coût = 0€ |

---

## Parcours Utilisateur

### Parcours 1 — Première visite

**Marie, 34 ans, prof de français.** Elle tombe sur Syllabix partagé sur Twitter. La page charge. En haut, une ligne discrète : *"Trouve un mot qui commence par la dernière syllabe du mot proposé."* En dessous, en grand : **"CHOCOLAT"**. Un chrono démarre. Elle tape "LAPIN". Validé — petit effet visuel. Le bot répond : **"PINGOUIN"**. Elle sourit. L'explication était suffisante, le reste se comprend en jouant. Score : 6. Elle clique "Rejouer" immédiatement.

### Parcours 2 — Bonne session

**Thomas, 22 ans, étudiant.** Pas de compte, pas d'historique. Son meilleur score de cette session est affiché en coin : 14. Il choisit le mode Difficile (6s). À 17 mots il bat son record. Un effet visuel marque l'occasion. S'il ferme l'onglet, c'est reparti à zéro — et c'est bien comme ça.

### Parcours 3 — Cas limite

**Lucie, 28 ans, graphiste.** Elle répond **"SANDWICH"** au mot du bot. Syllabe finale : "WICH". Le graphe de transitions ne trouve aucune continuation. La partie s'arrête : *"Aucun mot français ne commence par 'WICH' — fin de chaîne !"* Lucie réalise qu'elle a créé un cul-de-sac. Elle parcourt le récap, clique sur quelques définitions. Elle apprend. Elle rejoue.

### Parcours 4 — Hugo en admin

Hugo déploie la V1. Le dictionnaire (Lexique, 130k+ formes) est embarqué. Le graphe de transitions est pré-calculé une fois à l'installation. Si un bug phonétique remonte, il met à jour le seuil de tolérance dans la config et redéploie. Coût mensuel : 0€.

### Capacités révélées par les parcours

| Capacité | Parcours |
|---|---|
| Explication minimaliste visible sur la page | 1 |
| Démarrage sans friction ni inscription | 1 |
| Feedback visuel/sonore sur validation | 1, 2 |
| Record de session (localStorage, pas de compte) | 2 |
| 3 modes de difficulté | 2 |
| Détection dead end + message pédagogique | 3 |
| Récap fin de partie avec définitions cliquables | 3 |
| Dictionnaire exhaustif + graphe pré-calculé | 4 |
| Seuil de tolérance configurable | 4 |

---

## Spécificités Web App

- **Rendu :** SPA — une seule page, pas de navigation entre routes
- **Logique :** 100% client-side (dictionnaire + moteur phonétique embarqués)
- **Stockage :** localStorage pour le record de session uniquement
- **Serveur :** Hébergement statique (Netlify, Vercel, GitHub Pages) — coût zéro
- **Navigateurs :** Chrome, Firefox, Safari, Edge (2 dernières versions majeures) — pas de support IE
- **Responsive :** expérience jouable sur mobile (320px+) et desktop sans version dédiée
- **SEO :** `<title>` et `<meta description>` uniquement
- **Accessibilité :** niveau de base — contrastes lisibles, police lisible, focus clavier fonctionnel

---

## Exigences Fonctionnelles

### Boucle de Jeu

- **FR1 :** Le joueur peut démarrer une partie sans créer de compte ni s'inscrire
- **FR2 :** Le bot peut proposer un mot valide du dictionnaire pour initier ou continuer une chaîne
- **FR3 :** Le joueur peut soumettre un mot via le clavier pour répondre au mot du bot
- **FR4 :** Le système peut valider si le mot soumis commence phonétiquement par la dernière syllabe du mot précédent
- **FR5 :** Le joueur peut voir le mot actuel du bot clairement affiché pendant sa réflexion
- **FR6 :** La chaîne peut continuer indéfiniment jusqu'à une condition d'arrêt

### Moteur de Validation Phonétique

- **FR7 :** Le système peut comparer les mots sur base phonétique (IPA) indépendamment de l'orthographe
- **FR8 :** Le système peut appliquer une zone de tolérance pour les cas limites phonétiques
- **FR9 :** Le système peut détecter si la syllabe finale d'un mot crée un dead end dans le graphe de transitions
- **FR10 :** Le système peut vérifier si un mot soumis est présent dans le dictionnaire
- **FR11 :** Le bot peut sélectionner uniquement des mots dont la syllabe finale garantit au moins une continuation possible

### Score & Progression

- **FR12 :** Le système peut calculer un score égal au nombre de mots validés dans la chaîne courante
- **FR13 :** Le joueur peut voir son score en temps réel pendant la partie
- **FR14 :** Le joueur peut voir son meilleur score de la session courante
- **FR15 :** Le système peut détecter et signaler lorsque le joueur bat son record de session
- **FR16 :** Le joueur peut obtenir un bonus lorsque son mot est orthographiquement exact en plus d'être phonétiquement valide
- **FR17 :** Le joueur peut réaliser un combo en matchant les 2 dernières syllabes du mot précédent

### Gestion du Chrono

- **FR18 :** Le joueur peut choisir un mode de difficulté (Facile / Moyen / Difficile) avant de démarrer
- **FR19 :** Le système peut décompter un chrono à partir du moment où c'est au joueur de répondre
- **FR20 :** Le système peut mettre fin à la partie lorsque le chrono expire sans soumission valide
- **FR21 :** Le joueur peut voir le chrono en cours pendant sa réflexion

### Interface & Feedback

- **FR22 :** Le joueur peut lire une explication minimaliste des règles sur la page principale
- **FR23 :** Le joueur peut recevoir un retour visuel immédiat après chaque validation
- **FR24 :** Le joueur peut recevoir un retour sonore après chaque validation
- **FR25 :** Le joueur peut voir clairement pourquoi son mot est refusé (hors dictionnaire ou mauvaise syllabe)

### Fin de Partie

- **FR26 :** Le système peut déclencher une fin de partie lorsque le joueur crée un dead end phonétique
- **FR27 :** Le joueur peut lire un message explicatif en cas de défaite par dead end (*"Aucun mot français ne commence par X"*)
- **FR28 :** Le joueur peut accéder à un récap de tous les mots de la chaîne en fin de partie
- **FR29 :** Le joueur peut consulter la définition de chaque mot du récap
- **FR30 :** Le joueur peut relancer une nouvelle partie depuis l'écran de fin

### Administration & Build

- **FR31 :** L'administrateur peut générer `dictionary.json` avec l'IPA pré-calculé de chaque mot
- **FR32 :** L'administrateur peut générer `graph.json` avec les transitions valides entre syllabes
- **FR33 :** L'administrateur peut exécuter un harnais de tests pour valider le moteur phonétique
- **FR34 :** L'administrateur peut configurer le seuil de tolérance phonétique (distance d'édition IPA maximale) dans un fichier de config

---

## Exigences Non-Fonctionnelles

### Performance

- Validation d'un mot soumis : <300ms côté joueur
- Chargement initial (dictionary.json + graph.json) : <2s sur connexion standard
- Chrono : précision ±100ms
- Zéro calcul phonétique en temps réel — toute comparaison est une lookup JSON

### Scalabilité

- Architecture 100% statique — scalabilité gérée nativement par le CDN
- Fichiers JSON (dictionary + graph) : <5MB total après compression gzip

### Accessibilité

- Contraste texte principal : ratio ≥4.5:1
- Taille de police minimale : 16px sur mobile
- Focus clavier fonctionnel sur tous les éléments interactifs
- Responsive : jouable sur mobile (320px+) et desktop

### Fiabilité

- Disponibilité cible : >99% (hébergement statique CDN)
- Zéro point de défaillance backend
- Record de session persisté en localStorage — survit aux rafraîchissements

### Maintenabilité

- Seuil de tolérance phonétique configurable dans un fichier de config sans modification du code
- Harnais de tests rejouable à chaque mise à jour du dictionnaire ou du moteur
- Script de pré-calcul build-time documenté et reproductible

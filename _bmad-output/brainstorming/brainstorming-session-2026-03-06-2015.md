---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Syllabix - jeu de mots web basé sur les syllabes'
session_goals: 'Exploration large : mécaniques de jeu, fonctionnalités techniques, UX, fun factor — pas trop sophistiqué, expérience de jeu agréable'
selected_approach: 'ai-recommended'
techniques_used: ['What If Scenarios']
ideas_generated: 15
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitateur:** Hugo
**Date:** 2026-03-06

## Session Overview

**Sujet:** Syllabix — jeu de mots web où un bot propose un mot, le joueur répond avec un mot commençant par la dernière syllabe du mot précédent, formant une chaîne continue jusqu'à épuisement du joueur.

**Objectifs:** Exploration large — mécaniques de jeu, fonctionnalités techniques, UX, fun factor. Contrainte principale : rester simple, expérience de jeu agréable avant tout.

---

## Sélection de Techniques

**Approche :** Recommandations IA
**Contexte d'analyse :** Syllabix — nouveau produit, exploration large, ton joueur et décontracté

**Techniques recommandées :**
- **What If Scenarios** — exploration des mécaniques et possibilités sans contraintes
- **SCAMPER Method** — couverture systématique de tous les angles produit *(non utilisé — V1 suffisamment claire)*
- **Reverse Brainstorming** — révéler les risques UX *(non utilisé — V1 suffisamment claire)*

---

## Idées Générées

### Mécanique #1 — La Phonétique Prime
*Concept :* La règle de chaîne est basée sur la phonétique, pas l'orthographe. "CHOCOLAT" → "LA" → "LAPIN" → "PIN" → "PINGOUIN". Si ça sonne pareil, c'est valide — même si l'écriture diffère.
*Nouveauté :* Élimine la frustration "c'est mal orthographié" et ouvre un champ de mots bien plus large.

### Mécanique #2 — La Zone de Tolérance
*Concept :* Un système de validation flexible — si la phonétique est proche (mais pas exacte), le jeu accepte avec un feedback léger du type "borderline !" plutôt que "REFUSÉ". En dehors de la zone, c'est raté.
*Nouveauté :* Évite les règles casses-pieds sans supprimer tout défi.

### Mécanique #3 — Le Chrono Adaptatif
*Concept :* 10 secondes par défaut, adaptable selon le mode — Facile (15s), Moyen (10s), Difficile (6s). La pression du chrono est le moteur principal du fun.
*Nouveauté :* La difficulté est dans le temps, pas dans la complexité des règles — ça reste accessible.

### Mécanique #4 — Bonus Orthographe
*Concept :* La phonétique valide le coup, mais si l'orthographe est également correcte, le joueur gagne des points bonus. Double système de récompense sans double contrainte.
*Nouveauté :* Récompense les bons joueurs sans punir les autres.

### Mécanique #5 — Syllabe Double
*Concept :* Matcher les 2 dernières syllabes donne un "combo" — plus rare donc plus gratifiant. Ex : "pa-PA-ILLON" → trouver un mot qui commence par "PAILLON". Optionnel, pas obligatoire.
*Nouveauté :* Crée des moments de jubilation sans complexifier les règles de base.

### Structure #1 — Infinite Chain
*Concept :* Pas de fin de partie. La chaîne continue jusqu'à ce que le joueur sèche ou rate le chrono. Le score = longueur de la chaîne. Record personnel à battre à chaque session.
*Nouveauté :* Zéro friction sur la structure — on joue, on voit jusqu'où on va, on recommence.

### Score V1 #1 — Score = Longueur de Chaîne
*Concept :* 1 mot validé = 1 point. Record = max de mots enchaînés en une session. Rien de plus.
*Nouveauté :* Zéro friction cognitive — le joueur comprend son score instantanément.

### Input #1 — Clavier Only
*Concept :* Le joueur tape sa réponse, le bot propose un seul mot. Interface épurée — un mot affiché, une zone de saisie, un chrono.
*Nouveauté :* Minimalisme total, zéro distraction.

### Validation V1 — Le Moteur Phonétique *(défi central)*
*Concept :* Le système doit détecter si le mot du joueur commence par la (ou les) dernière(s) syllabe(s) du mot du bot, sur base phonétique. C'est le problème technique n°1 de la V1.

### Tech V1 #1 — Stack Validation 100% Locale
*Concept :* Dictionnaire français open source (Lexique ou wordlist) + librairie phonétique locale (phonemize + espeak) pour convertir les mots en phonèmes IPA et comparer. Le bot pioche aléatoirement un mot valide dans le dico. Coût : zéro.
*Nouveauté :* Gratuit, rapide, déterministe. LLM réservé pour une éventuelle V2.

### Tech #2 — Graphe de Transitions
*Concept :* Au démarrage de l'appli, on pré-calcule quels mots du dictionnaire ont au moins une continuation valide. Le bot ne pioche jamais dans les mots "sans issue". Les dead ends sont donc impossibles côté bot.
*Nouveauté :* Garantit que la chaîne peut toujours continuer — le seul qui peut bloquer c'est le joueur.

### UX #1 — Interface Ultra-Minimaliste
*Concept :* Écran de jeu épuré : mot du bot en gros au centre, zone de saisie en dessous, chrono visible, score/record en coin. Pas de tutoriel long — on comprend en jouant.
*Nouveauté :* Zéro friction à l'entrée dans le jeu.

### UX #2 — Feedback Dead End
*Concept :* Si le joueur propose un mot dont la syllabe finale n'a aucune continuation dans le dictionnaire, la partie s'arrête avec le message "Aucun mot français ne commence par '[syllabe]' — fin de chaîne !" Le joueur perd mais apprend quelque chose.
*Nouveauté :* La défaite a du sens. Crée un effet "wow je savais pas ça".

### UX #3 — Récap Pédagogique
*Concept :* En fin de partie, un écran "récap" affiche tous les mots de la chaîne. Le joueur peut cliquer sur n'importe quel mot pour voir sa définition. Particulièrement utile quand le bot sort un mot inconnu.
*Nouveauté :* Transforme chaque partie en micro-session d'apprentissage passive — sans jamais interrompre le flow de jeu.

---

## Idées V2 *(réservées — ne pas implémenter en V1)*

| Idée | Raison du report |
|---|---|
| **Bot Narquois Expressif** — émotions selon les perfs du joueur | Complexité d'implémentation |
| **Scoring Enrichi** — multiplicateurs, streaks, bonus mots rares | Risque de surcharger la V1 |
| **LLM en fallback** — validation des cas ambigus via API | Coût + complexité |

---

## Organisation et Priorisation

### V1 — Vision Complète

> *Tape un mot qui commence par la dernière syllabe du mot précédent — le plus vite possible, le plus longtemps possible.*

| Dimension | Décision V1 |
|---|---|
| Règle | Phonétique, souple (zone de tolérance) + bonus si orthographe exacte |
| Input | Clavier uniquement, bot propose 1 seul mot |
| Chrono | 10s par défaut — 15s/10s/6s selon easy/medium/hard |
| Score | 1 mot = 1 point, record personnel |
| Structure | Infinite chain, pas de fin de partie |
| Tech | Dico français + phonemize/espeak + graphe de transitions pré-calculé |
| UI | Ultra-minimaliste |
| Feedback | Dead end explicatif + récap pédagogique en fin de partie |

### Défi technique principal
La validation phonétique est le coeur du produit — trouver le bon seuil de tolérance entre "trop strict" (frustrant) et "trop laxiste" (sans intérêt).

---

## Prochaines Étapes

1. Créer un **Product Brief** (`/bmad-bmm-create-product-brief`) pour formaliser la vision
2. Puis un **PRD** (`/bmad-bmm-create-prd`) avec les specs détaillées
3. Puis l'**Architecture technique** (`/bmad-bmm-create-architecture`) pour le moteur de validation phonétique
4. Développement V1

---

## Insights de Session

**Points forts identifiés :** Hugo a une vision très claire du produit dès le départ — simple, fun, accessible. Les décisions sont rapides et cohérentes.
**Breakthrough principal :** Le moteur de validation phonétique est le vrai coeur du produit, pas les mécaniques de jeu.
**Principe directeur :** "Règles souples mais fermes — le juste milieu."

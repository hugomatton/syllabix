# Story 1.2 : Script Python build_dictionary.py — Génération dictionary.json

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'administrateur,
Je veux générer `dictionary.json` avec l'IPA pré-calculé pour chaque mot français,
Afin que le moteur phonétique puisse faire des lookups sans calcul en temps réel. (FR31)

## Acceptance Criteria

**AC1 — Dépendances Python**
- **Given** `scripts/requirements.txt` liste phonemize et espeak-ng
- **When** j'exécute `pip install -r requirements.txt`
- **Then** toutes les dépendances s'installent sans erreur

**AC2 — Génération dictionary.json**
- **Given** `scripts/build_dictionary.py` existe et le dictionnaire Lexique est disponible
- **When** j'exécute `python scripts/build_dictionary.py`
- **Then** `public/dictionary.json` est généré avec le format `{"mot": "chaine_IPA", ...}`
- **And** le fichier contient au moins 100 000 entrées
- **And** les mots sont stockés en minuscules normalisées

**AC3 — Validité du contenu IPA**
- **Given** `public/dictionary.json` existe
- **When** je vérifie le mot "chocolat"
- **Then** sa représentation IPA est présente et phonétiquement correcte
- **And** les variantes accentuées (é, è, à...) sont gérées

## Tasks / Subtasks

- [x] **T1 — Créer le dossier public/** (AC: 2)
  - [x] T1.1 — Créer `/Users/hugomatton/Desktop/syllabix/public/` s'il n'existe pas

- [x] **T2 — Configurer les dépendances Python** (AC: 1)
  - [x] T2.1 — Créer `scripts/requirements.txt` avec : `phonemizer>=3.0.0`
  - [x] T2.2 — Documenter dans le script la nécessité d'installer espeak-ng en système (`brew install espeak-ng` sur macOS)
  - [x] T2.3 — Vérifier que `pip install -r scripts/requirements.txt` passe sans erreur

- [x] **T3 — Télécharger et préparer le dictionnaire source** (AC: 2)
  - [x] T3.1 — Télécharger Lexique 3.83 depuis http://www.lexique.org/databases/Lexique383/Lexique383.tsv (fichier TSV ~25MB)
  - [x] T3.2 — Placer le fichier dans `scripts/Lexique383.tsv` (non commité — ajouté à .gitignore)
  - [x] T3.3 — Identifier les colonnes utiles : `ortho` (col 1) et `phon` (col 2, notation SAMPA française)

- [x] **T4 — Écrire scripts/build_dictionary.py** (AC: 2, 3)
  - [x] T4.1 — Lire et parser `scripts/Lexique383.tsv` (encodage UTF-8, séparateur tab)
  - [x] T4.2 — Pour chaque entrée : normaliser le mot en minuscules, convertir SAMPA → IPA via mapping table
  - [x] T4.3 — Dédupliquer (garder une seule entrée par mot orthographique)
  - [x] T4.4 — Filtrer : garder uniquement les mots alphabétiques (exclure chiffres, ponctuations, mots trop courts <2 lettres)
  - [x] T4.5 — Vérifier la présence de "chocolat" dans les entrées
  - [x] T4.6 — Écrire `public/dictionary.json` avec `json.dump(dict, f, ensure_ascii=False, separators=(',', ':'))` (sans indentation pour taille minimale)
  - [x] T4.7 — Afficher statistiques : nombre d'entrées générées, durée de génération, taille du fichier

- [x] **T5 — Validation** (AC: 2, 3)
  - [x] T5.1 — `public/dictionary.json` contient 121 028 entrées ≥ 100 000 ✓
  - [x] T5.2 — "chocolat" → 'ʃokola' présent ✓
  - [x] T5.3 — Mots accentués : "éléphant" → 'elefɑ̃', "être" → 'ɛtʁ', "café" → 'kafe' ✓
  - [x] T5.4 — Taille : 2.84 MB brut / ~0.56 MB gzip ← bien en dessous des limites NFR6 ✓

## Dev Notes

### Contexte Critique

Cette story est la **deuxième de l'Epic 1** — elle dépend de la structure projet créée en Story 1.1 (dossier `scripts/`, dossier `src/`, etc.) mais ne modifie aucun fichier TypeScript/React.

L'objectif est 100% Python hors bundle Vite : créer un script build-time qui génère `public/dictionary.json`. Ce fichier sera ensuite consommé par le moteur phonétique (Epic 2) via `fetch('/dictionary.json')`.

**⚠️ CRITIQUE : Le dossier `public/` n'existe PAS encore dans le projet.** La Story 1.1 ne l'a pas créé (les fichiers Vite ont été créés manuellement et `public/` n'était pas dans la liste des fichiers créés). Il faut le créer en T1.1.

### Stack et Dépendances Exactes

| Technologie | Rôle | Notes |
|---|---|---|
| Python 3.9+ | Langage du script | Disponible sur macOS via Homebrew |
| `phonemize` | Conversion texte → IPA | Version ≥3.0, wrapper Python d'espeak-ng |
| `espeak-ng` | Moteur TTS sous-jacent | **Dépendance SYSTÈME**, pas pip — `brew install espeak-ng` sur macOS |
| Lexique 3.83 | Source du dictionnaire français | ~140k formes, TSV, téléchargeable sur lexique.org |

**Installation espeak-ng (système requis avant pip) :**
```bash
# macOS
brew install espeak-ng

# Ubuntu/Debian
sudo apt-get install espeak-ng

# Vérifier l'installation
espeak-ng --version
```

### Source du Dictionnaire : Lexique 3.83

**URL de téléchargement :** http://www.lexique.org/databases/Lexique383/Lexique383.tsv

**Format du fichier TSV (colonnes pertinentes) :**
- `ortho` (col 0) : forme orthographique du mot (ex: "chocolat")
- `phon` (col 22 ou `phon`) : représentation phonémique (format X-SAMPA, ex: "SOkOla")
- Alternative : utiliser `phonemize` directement sur `ortho` pour obtenir de l'IPA au lieu du format X-SAMPA de Lexique

**Recommandation :** Utiliser `phonemize` sur le champ `ortho` pour obtenir directement de l'IPA standard. Le champ `phon` de Lexique est en X-SAMPA (format interne), pas en IPA unicode.

### Format de dictionary.json

```json
{
  "chocolat": "ʃɔkɔla",
  "lapin": "lapɛ̃",
  "éléphant": "elefɑ̃",
  "maison": "mɛzɔ̃"
}
```

**Points importants :**
- Clés = mots en **minuscules normalisées** (`str.lower()`)
- Valeurs = string IPA **sans espaces** (phonemize peut produire des espaces entre syllabes — les supprimer avec `ipa.replace(' ', '')`)
- Encodage : UTF-8 (IPA contient des caractères non-ASCII)
- Pas d'indentation JSON pour minimiser la taille du fichier

### Implémentation Recommandée de build_dictionary.py

```python
#!/usr/bin/env python3
"""
Build dictionary.json from Lexique 3.83
Usage: python scripts/build_dictionary.py
Output: public/dictionary.json
"""

import json
import os
import re
import time
from pathlib import Path

try:
    from phonemize import phonemize
except ImportError:
    print("ERROR: phonemize not installed. Run: pip install -r scripts/requirements.txt")
    print("Also ensure espeak-ng is installed: brew install espeak-ng")
    exit(1)

LEXIQUE_PATH = Path("scripts/Lexique383.tsv")
OUTPUT_PATH = Path("public/dictionary.json")
MIN_WORD_LENGTH = 2

def normalize_word(word: str) -> str:
    """Normalize word to lowercase."""
    return word.lower().strip()

def is_valid_word(word: str) -> bool:
    """Filter: only alphabetic words (including accented chars), min length."""
    return len(word) >= MIN_WORD_LENGTH and re.match(r'^[a-zA-ZÀ-ÿ]+$', word)

def main():
    start = time.time()

    if not LEXIQUE_PATH.exists():
        print(f"ERROR: {LEXIQUE_PATH} not found.")
        print("Download from: http://www.lexique.org/databases/Lexique383/Lexique383.tsv")
        exit(1)

    # Create public/ if needed
    OUTPUT_PATH.parent.mkdir(exist_ok=True)

    # Load words from Lexique
    print("Loading Lexique...")
    words = set()
    with open(LEXIQUE_PATH, 'r', encoding='utf-8') as f:
        header = f.readline().strip().split('\t')
        ortho_idx = header.index('ortho')
        for line in f:
            cols = line.strip().split('\t')
            if len(cols) > ortho_idx:
                word = normalize_word(cols[ortho_idx])
                if is_valid_word(word):
                    words.add(word)

    word_list = sorted(words)
    print(f"Unique valid words: {len(word_list)}")

    # Generate IPA via phonemize (batched for performance)
    print("Generating IPA (this may take several minutes)...")
    BATCH_SIZE = 1000
    dictionary = {}

    for i in range(0, len(word_list), BATCH_SIZE):
        batch = word_list[i:i + BATCH_SIZE]
        ipa_batch = phonemize(
            batch,
            language='fr-fr',
            backend='espeak',
            separator=phonemize.Separator(phone='', syllable='', word=' '),
            strip=True,
            preserve_punctuation=False,
            with_stress=False,
        )
        for word, ipa in zip(batch, ipa_batch):
            ipa_clean = ipa.replace(' ', '').strip()
            if ipa_clean:  # Only add if IPA was generated
                dictionary[word] = ipa_clean

        if (i // BATCH_SIZE) % 10 == 0:
            print(f"  Progress: {i}/{len(word_list)} words processed...")

    # Write output
    print(f"Writing {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, separators=(',', ':'))

    # Stats
    elapsed = time.time() - start
    size_mb = OUTPUT_PATH.stat().st_size / 1024 / 1024
    print(f"\n✓ Done in {elapsed:.1f}s")
    print(f"✓ Entries: {len(dictionary)}")
    print(f"✓ File size: {size_mb:.2f} MB")

    # Validation spot check
    for test_word in ["chocolat", "lapin", "maison"]:
        if test_word in dictionary:
            print(f"✓ '{test_word}' → '{dictionary[test_word]}'")
        else:
            print(f"⚠ '{test_word}' NOT FOUND in dictionary")

if __name__ == '__main__':
    main()
```

**⚠️ Note sur l'API phonemize :** La signature exacte de `Separator` et les paramètres peuvent varier selon la version. Consulter la doc de la version installée avec `python -c "import phonemize; help(phonemize)"`. Si l'API change, adapter en conséquence — l'objectif est d'obtenir une string IPA sans espaces par mot.

### requirements.txt

```
phonemize>=3.0.0
```

**Note :** `espeak-ng` est une dépendance **système** (C library), pas une dépendance pip. Elle ne peut pas être listée dans requirements.txt. La documenter dans le script et/ou un fichier README.

### Localisation des Fichiers

| Fichier | Chemin absolu | Statut |
|---|---|---|
| Script | `/Users/hugomatton/Desktop/syllabix/scripts/build_dictionary.py` | À créer |
| Requirements | `/Users/hugomatton/Desktop/syllabix/scripts/requirements.txt` | À créer |
| Source Lexique | `/Users/hugomatton/Desktop/syllabix/scripts/Lexique383.tsv` | À télécharger |
| Output | `/Users/hugomatton/Desktop/syllabix/public/dictionary.json` | Généré |
| Dossier public | `/Users/hugomatton/Desktop/syllabix/public/` | À créer (inexistant) |

### Règles Architecturales à Respecter

1. **ARC8 — scripts/ hors bundle Vite** : Le script Python est dans `scripts/` à la racine, jamais dans `src/`. Vite ignore complètement ce dossier.
2. **NFR4 — Zéro calcul en temps réel** : dictionary.json pré-calcule tout l'IPA au build-time. Le runtime ne fait que des lookups.
3. **NFR6 — Taille <5MB gzip** : dictionary.json doit viser <10MB non-compressé (le CDN gzip fera le reste). Surveiller la taille après génération.
4. **public/ = assets Vite statiques** : Tout fichier dans `public/` est servi statiquement par Vite et accessible via `/fichier.json` en dev et en prod.
5. **Pas de TypeScript** dans cette story — uniquement Python hors bundle.

### Intelligence de la Story 1.1

**Acquis de la story précédente :**
- Le projet Vite est installé dans `/Users/hugomatton/Desktop/syllabix/` (pas de sous-dossier)
- Stack : Vite 6.4.1, React 19, TypeScript 5.7, Vitest 4.0.18
- `scripts/` existe à la racine avec `.gitkeep` (peut être remplacé)
- `public/` **n'existe pas** (non créé lors de la Story 1.1 — à créer maintenant)
- `src/config/index.ts` est un placeholder vide — ne pas modifier dans cette story
- `tsconfig.app.json` exclut les fichiers `.test.ts` de la compilation TypeScript

**Aucun fichier TypeScript/React ne doit être modifié dans cette story.** Seuls les fichiers Python et JSON sont concernés.

### Considérations Performances

- **Durée de génération** : phonemize sur 100k+ mots peut prendre 10-30 minutes sur un CPU standard. Prévoir un traitement en batch pour afficher la progression.
- **Mode test** : pour le développement, on peut d'abord tester avec un sous-ensemble de 1000 mots pour valider le pipeline.
- **Idempotence** : le script peut être relancé sans problème (écrase `public/dictionary.json`).

### .gitignore Recommandations

Lexique383.tsv est un fichier de ~10MB à ajouter à `.gitignore` si la politique du repo l'exige :
```
scripts/Lexique383.tsv
public/dictionary.json
public/graph.json
```

(les JSON générés peuvent être dans git ou exclus selon la stratégie choisie — pour GitHub Pages, ils doivent être dans `public/` au moment du build)

### Project Structure Notes

#### Alignement avec l'architecture définie

- `scripts/build_dictionary.py` → conforme à [Source: architecture.md#Structure Complète du Projet]
- `scripts/requirements.txt` → conforme à [Source: architecture.md#Structure Complète du Projet]
- `public/dictionary.json` → conforme à [Source: architecture.md#Structure Complète du Projet]
- Logique : moteur de génération Python offline → JSON statique → lookup runtime O(1) [Source: architecture.md#Architecture des Données Client]

#### Conflits potentiels détectés

- **public/ absent** : La Story 1.1 n'a pas créé `public/`. Vite génère normalement ce dossier mais il n'apparaît pas dans les fichiers listés de la Story 1.1. Créer explicitement ce dossier en T1.1.
- **phonemize API changes** : L'API phonemize a changé entre les versions (0.x vs 3.x). Utiliser `phonemize>=3.0.0` et vérifier la signature.
- **espeak-ng sur macOS M1/M2** : Peut nécessiter Rosetta ou une installation native ARM. Si `brew install espeak-ng` échoue, essayer via conda ou compilation depuis source.

### References

- [Source: epics.md#Story 1.2] — User story complète et Acceptance Criteria
- [Source: architecture.md#Architecture des Données Client] — Format Map<string,string>, JSON pré-calculé
- [Source: architecture.md#Structure Complète du Projet] — Localisation scripts/ et public/
- [Source: architecture.md#ARC8] — scripts/ hors bundle Vite
- [Source: architecture.md#NFR4] — Zéro calcul phonétique en temps réel
- [Source: architecture.md#NFR6] — Taille fichiers JSON <5MB gzip
- [Source: 1-1-initialisation-du-projet-vite-react-typescript.md#Completion Notes] — État actuel du projet, public/ absent

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

**Adaptation phonemize → SAMPA mapping :**
- `phonemizer>=3.0.0` installé correctement via pip (AC1 ✓)
- `espeak-ng` non installable via brew (erreur licence Xcode) ni conda (non disponible pour macOS ARM64)
- Solution : conversion directe de la colonne `phon` (notation SAMPA française de Lexique) vers IPA via mapping table
- La notation SAMPA de Lexique est différente du X-SAMPA standard (ex: `@`=ɑ̃, `°`=ə, `§`=ɔ̃, `5`=ɛ̃, `1`=œ̃, `8`=ɥ)
- Mapping complet vérifié sur 36 symboles phonétiques du fichier Lexique383.tsv
- Cette approche est supérieure : données linguistiques curées, pas de dépendance système, génération en <1s vs 10-30 min avec espeak-ng

### Completion Notes List

- **AC1 ✓** : `pip install -r scripts/requirements.txt` → phonemizer 3.3.0 installé sans erreur
- **AC2 ✓** : `public/dictionary.json` généré avec 121 028 entrées (> 100 000 requis), format `{"mot":"ipastring",...}`
- **AC3 ✓** : "chocolat" → 'ʃokola', "éléphant" → 'elefɑ̃', "être" → 'ɛtʁ', "café" → 'kafe', "maison" → 'mɛzɔ̃'
- **NFR6 ✓** : 2.84 MB brut / ~0.56 MB gzip (objectif : <5 MB gzip avec graph.json)
- Durée de génération : < 1 seconde (vs 10-30 min estimés avec phonemizer/espeak-ng)
- Tous les mots en minuscules normalisées, valeurs IPA sans espaces

### File List

- `scripts/build_dictionary.py` — Script Python de génération du dictionnaire (CRÉÉ, MODIFIÉ par code review)
- `scripts/requirements.txt` — Dépendances Python : phonemizer>=3.0.0 (CRÉÉ)
- `scripts/Lexique383.tsv` — Source Lexique 3.83, 142 694 lignes (TÉLÉCHARGÉ, dans .gitignore)
- `public/dictionary.json` — Dictionnaire IPA généré, 121 028 entrées, 2.84 MB (GÉNÉRÉ)
- `public/` — Dossier de ressources statiques Vite (CRÉÉ)
- `.gitignore` — Ajout de `scripts/Lexique383.tsv` (MODIFIÉ)

## Change Log

- 2026-03-08 : Story 1.2 implémentée — Script `build_dictionary.py` crée `public/dictionary.json` à partir de Lexique 3.83 avec conversion SAMPA→IPA. 121 028 entrées françaises avec IPA correct. Approche alternative validée : conversion directe SAMPA→IPA via mapping table (sans espeak-ng). Tous les ACs satisfaits.
- 2026-03-08 : Code review — Ajout validation post-écriture dans `build_dictionary.py` : re-lecture du JSON et vérification du nombre d'entrées après écriture (M4). Story passée en `done`.

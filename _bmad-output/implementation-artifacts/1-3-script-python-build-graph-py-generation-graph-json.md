# Story 1.3 : Script Python build_graph.py — Génération graph.json

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'administrateur,
Je veux générer `graph.json` avec les transitions phonétiques (dernière syllabe → mots valides suivants),
Afin que le bot puisse toujours sélectionner un mot garantissant une continuation possible. (FR32)

## Acceptance Criteria

**AC1 — Génération graph.json**
- **Given** `public/dictionary.json` existe depuis la Story 1.2 (121 028 entrées, format `{"mot": "chaine_IPA"}`)
- **When** j'exécute `python scripts/build_graph.py`
- **Then** `public/graph.json` est généré avec le format `{"syllabe_IPA": ["mot1", "mot2", ...], ...}`
- **And** chaque mot dans les valeurs du graphe existe aussi dans dictionary.json
- **And** chaque clé syllabe mappe vers au moins 2 mots possibles
- **And** les mots dont la dernière syllabe n'a aucune continuation dans le graphe sont exclus des valeurs

**AC2 — Taille des fichiers**
- **Given** `public/graph.json` existe
- **When** je vérifie la taille totale des fichiers
- **Then** dictionary.json + graph.json totalisent moins de 5MB après compression gzip (NFR6)

**AC3 — Vérification de la syllabe "la" (de "chocolat")**
- **Given** `public/graph.json` existe
- **When** je cherche la syllabe "la" (dernière syllabe de "chocolat", IPA = `ʃokola`)
- **Then** la liste inclut "lapin" ou des mots similaires commençant par le son "la"

## Tasks / Subtasks

- [x] **T1 — Réutiliser le mapping SAMPA→IPA** (AC: 1)
  - [x] T1.1 — Copier/importer le mapping `SAMPA_TO_IPA` depuis `build_dictionary.py` (ne pas le réinventer — réutiliser exactement le même dict)
  - [x] T1.2 — Réutiliser la fonction `sampa_to_ipa(sampa: str) -> str` (même logique)

- [x] **T2 — Charger les données sources** (AC: 1)
  - [x] T2.1 — Charger `public/dictionary.json` → `dict[str, str]` (word → IPA)
  - [x] T2.2 — Lire `scripts/Lexique383.tsv` via `csv.DictReader` pour extraire la colonne `syll`
  - [x] T2.3 — Pour chaque ligne Lexique : normaliser `ortho`, lire `syll` (skip si absent)
  - [x] T2.4 — Ne traiter que les mots présents dans dictionary.json (skip les autres)

- [x] **T3 — Extraire les syllabes par mot** (AC: 1)
  - [x] T3.1 — Splitter `syll` par `-` pour obtenir les syllabes en notation SAMPA de Lexique
  - [x] T3.2 — `first_syl(word)` = `sampa_to_ipa(syll_parts[0])` (première syllabe)
  - [x] T3.3 — `last_syl(word)` = `sampa_to_ipa(syll_parts[-1])` (dernière syllabe)
  - [x] T3.4 — Stocker `word_syllables[word] = (first_syl, last_syl)` pour tous les mots traités
  - [x] T3.5 — Logger un warning si un mot de dictionary.json n'a pas d'entrée dans `syll` (ne pas le bloquer)

- [x] **T4 — Construire le graphe brut** (AC: 1)
  - [x] T4.1 — Pour chaque mot W dans `word_syllables` : `raw_graph[last_syl(W)].append(W)`
  - [x] T4.2 — Le graphe brut = {dernière_syllabe_IPA → [mots_dont_première_syl == cette_syllabe]}
  - [x] T4.3 — Afficher statistiques : nombre de clés, taille moyenne des listes, clé la plus grande

- [x] **T5 — Filtrage en deux passes** (AC: 1)
  - [x] T5.1 — **Passe 1** : supprimer les clés avec moins de 2 mots (pas assez de continuations)
  - [x] T5.2 — **Passe 2** : pour chaque mot W dans les valeurs du graphe, vérifier que `last_syl(W)` est une clé valide dans le graphe (filtré); si non → retirer W de toutes les valeurs
  - [x] T5.3 — **Passe 1 bis** : re-supprimer les clés avec moins de 2 mots après la Passe 2
  - [x] T5.4 — Répéter jusqu'à stabilisation (en pratique : 2-3 itérations suffisent — s'arrêter quand aucun changement)
  - [x] T5.5 — Logger : nombre de mots retirés à chaque passe, nombre de clés supprimées

- [x] **T6 — Écrire graph.json** (AC: 1, 2)
  - [x] T6.1 — Écrire `public/graph.json` avec `json.dump(graph, f, ensure_ascii=False, separators=(',', ':'))`
  - [x] T6.2 — Post-write integrity check : re-lire le JSON et vérifier le nombre de clés
  - [x] T6.3 — Afficher taille du fichier, nombre de clés totales

- [x] **T7 — Validation** (AC: 1, 2, 3)
  - [x] T7.1 — Vérifier que "la" (syllabe finale de "chocolat" = IPA `ʃokola`) est une clé du graphe
  - [x] T7.2 — Vérifier que "lapin" ou des mots commençant par "la" sont dans `graph["la"]`
  - [x] T7.3 — Vérifier que `len(dictionary.json) + len(graph.json)` < 5MB gzip (AC2)
  - [x] T7.4 — Spot check : 3-5 syllabes connues et leurs mots associés

## Dev Notes

### Contexte Critique

Story 1.3 est la **troisième story de l'Epic 1**, directement après :
- Story 1.1 : structure projet Vite + React + TS (base du projet)
- Story 1.2 : `build_dictionary.py` → `public/dictionary.json` (121 028 entrées, IPA sans espaces)

**Dépendance directe :** `public/dictionary.json` DOIT exister avant de lancer `build_graph.py`. ✓ Déjà généré.

**L'objectif de graph.json :**
Le bot (Story 2.3 - `src/engine/botSelector.ts`) utilise ce graphe pour sélectionner le prochain mot. La structure est :
```json
{
  "la": ["lapin", "lac", "laver", "lame", ...],
  "pɛ̃": ["pain", "peintre", ...],
  "ɔ̃": ["on", "ombre", ...]
}
```
Le bot reçoit le `last_syl(mot_courant)` et cherche dans `graph[last_syl]` un mot aléatoire. Ce mot doit garantir que le joueur a aussi ≥ 2 réponses possibles (d'où le filtre).

### Source de Données : Colonne `syll` de Lexique 3.83

**Lexique383.tsv est disponible** à `scripts/Lexique383.tsv` (utilisé dans Story 1.2).

La colonne `syll` contient la forme syllabifiée en notation SAMPA de Lexique, avec `-` comme séparateur de syllabes. **Même notation SAMPA que la colonne `phon`.**

Exemples (estimés d'après la documentation Lexique) :
| `ortho` | `phon` | `syll` | Dernière syllabe SAMPA → IPA |
|---|---|---|---|
| chocolat | SOkOla | SO-kO-la | la → `la` |
| lapin | lap5 | la-p5 | p5 → `pɛ̃` |
| maison | mEz§ | mE-z§ | z§ → `zɔ̃` |
| éléphant | elef@ | e-le-f@ | f@ → `fɑ̃` |
| être | EtR | Et-R | R → `ʁ` (consonne seule — cas limite) |

**⚠️ Cas limite — syllabe terminale consonne seule :** certains mots se terminent par une consonne sans voyelle dans la notation SAMPA de Lexique (ex: `R` pour certains mots). Ces syllabes sonantiques génèrent des clés IPA consonantiques. Les laisser en l'état — le filtre (min 2 continuations) éliminera naturellement les dead ends.

**⚠️ Colonne `syll` manquante :** certains mots de Lexique peuvent avoir `syll` vide. Dans ce cas, utiliser `phon` entier comme fallback (le mot est mono-syllabique ou la syllabification est inconnue). Logger un warning sans bloquer.

**🔑 Comment vérifier le nom exact des colonnes :** Lexique383.tsv a ~25MB. Le header (ligne 1) contient tous les noms de colonnes séparés par `\t`. Les colonnes clés pour cette story sont `ortho`, `phon`, `syll`. Lire la première ligne pour les confirmer avant de coder.

### Mapping SAMPA→IPA (à réutiliser depuis build_dictionary.py)

**NE PAS réécrire le mapping** — copier/adapter depuis `scripts/build_dictionary.py` lignes 35-78. Le mapping complet est :

```python
SAMPA_TO_IPA = {
    # Voyelles orales
    'a':'a', 'e':'e', 'E':'ɛ', 'i':'i', 'o':'o', 'O':'ɔ',
    'u':'u', 'y':'y', '2':'ø', '9':'œ', '°':'ə', '8':'ɥ',
    # Voyelles nasales
    '@':'ɑ̃', '§':'ɔ̃', '5':'ɛ̃', '1':'œ̃',
    # Consonnes
    'p':'p', 'b':'b', 't':'t', 'd':'d', 'k':'k', 'g':'g',
    'f':'f', 'v':'v', 's':'s', 'z':'z', 'S':'ʃ', 'Z':'ʒ',
    'm':'m', 'n':'n', 'N':'ɲ', 'G':'ŋ', 'l':'l', 'R':'ʁ',
    'j':'j', 'w':'w', 'x':'x',
}
```

### Implémentation Recommandée

```python
#!/usr/bin/env python3
"""
Build graph.json from dictionary.json + Lexique 3.83 syll column.
Usage: python scripts/build_graph.py
Output: public/graph.json
Prerequisite: public/dictionary.json must exist (run build_dictionary.py first)
"""

import csv, json, sys, time
from pathlib import Path
from collections import defaultdict

LEXIQUE_PATH = Path("scripts/Lexique383.tsv")
DICTIONARY_PATH = Path("public/dictionary.json")
OUTPUT_PATH = Path("public/graph.json")
MIN_CONTINUATIONS = 2  # minimum words per graph key

SAMPA_TO_IPA = { ... }  # copy from build_dictionary.py

def sampa_to_ipa(sampa: str) -> str:
    return ''.join(SAMPA_TO_IPA.get(ch, ch) for ch in sampa)

def get_syllables(syll_str: str, phon_str: str) -> tuple[str, str]:
    """Returns (first_syl_ipa, last_syl_ipa) from Lexique syll column."""
    raw = syll_str.strip() if syll_str.strip() else phon_str.strip()
    parts = raw.split('-') if '-' in raw else [raw]
    first = sampa_to_ipa(parts[0])
    last = sampa_to_ipa(parts[-1])
    return first, last

def main():
    # 1. Load dictionary
    if not DICTIONARY_PATH.exists():
        print(f"ERROR: {DICTIONARY_PATH} not found. Run build_dictionary.py first.")
        sys.exit(1)
    with open(DICTIONARY_PATH, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    print(f"Loaded dictionary: {len(dictionary):,} words")

    # 2. Load Lexique syll data
    word_syllables = {}  # word -> (first_syl, last_syl)
    with open(LEXIQUE_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            word = row.get('ortho', '').lower().strip()
            if word not in dictionary:
                continue
            syll = row.get('syll', '')
            phon = row.get('phon', '')
            if not phon and not syll:
                continue
            first_syl, last_syl = get_syllables(syll, phon)
            if first_syl and last_syl and word not in word_syllables:
                word_syllables[word] = (first_syl, last_syl)

    no_syll_count = len(dictionary) - len(word_syllables)
    print(f"Words with syllable data: {len(word_syllables):,} ({no_syll_count:,} skipped - no syll)")

    # 3. Build raw graph: last_syl -> [words with that first_syl]
    # Wait - the graph maps last_syl(W) to words that can FOLLOW W.
    # A word X can follow W if first_syl(X) == last_syl(W).
    # So: index by first_syl, then for each word W, look up words with first_syl == last_syl(W).

    first_syl_index = defaultdict(list)  # first_syl -> [words]
    for word, (first_syl, last_syl) in word_syllables.items():
        if first_syl:
            first_syl_index[first_syl].append(word)

    # Build raw graph
    raw_graph = {}
    for word, (first_syl, last_syl) in word_syllables.items():
        if last_syl and last_syl in first_syl_index:
            if last_syl not in raw_graph:
                raw_graph[last_syl] = list(set(first_syl_index[last_syl]))

    print(f"Raw graph: {len(raw_graph):,} syllable keys")

    # 4. Filter: iterative until stable
    graph = {k: list(v) for k, v in raw_graph.items()}
    for iteration in range(10):  # max 10 iterations (convergence expected in 2-3)
        # Pass 1: remove keys with < MIN_CONTINUATIONS
        keys_before = len(graph)
        graph = {k: v for k, v in graph.items() if len(v) >= MIN_CONTINUATIONS}

        # Pass 2: remove words from values where last_syl not in graph
        words_removed = 0
        valid_keys = set(graph.keys())
        new_graph = {}
        for syl, words in graph.items():
            safe_words = [w for w in words
                         if word_syllables.get(w, ('', ''))[1] in valid_keys]
            if safe_words != words:
                words_removed += len(words) - len(safe_words)
            new_graph[syl] = safe_words
        graph = new_graph

        print(f"  Iteration {iteration+1}: {keys_before-len(graph)} keys removed, {words_removed} words removed")
        if keys_before == len(graph) and words_removed == 0:
            print(f"  Converged after {iteration+1} iterations")
            break

    # Final pass 1
    graph = {k: v for k, v in graph.items() if len(v) >= MIN_CONTINUATIONS}
    print(f"Final graph: {len(graph):,} keys")

    # 5. Write output
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(graph, f, ensure_ascii=False, separators=(',', ':'))

    # Integrity check
    with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
        written = json.load(f)
    assert len(written) == len(graph), f"Integrity error: {len(graph)} vs {len(written)}"

    # Stats
    size_mb = OUTPUT_PATH.stat().st_size / 1024 / 1024
    print(f"✓ graph.json: {size_mb:.2f} MB, {len(graph):,} keys")

    # AC3 spot check
    if 'la' in graph:
        sample = graph['la'][:5]
        print(f"✓ graph['la'] ({len(graph['la'])} words): {sample}...")
    else:
        print("⚠ 'la' not found in graph keys!")

    # NFR6 check
    dict_size = DICTIONARY_PATH.stat().st_size / 1024 / 1024
    total_mb = dict_size + size_mb
    print(f"✓ Total size: {total_mb:.2f} MB uncompressed (gzip target: <5MB)")

if __name__ == '__main__':
    main()
```

**⚠️ Note d'implémentation :** L'algorithme pseudo-code ci-dessus est une guide, pas du code à copier tel quel. Le développeur doit adapter les imports, vérifier les noms de colonnes Lexique, et tester. En particulier :
- Vérifier que `syll` est bien le nom de la colonne dans le header TSV (avec `reader.fieldnames`)
- La colonne `syll` peut ne pas exister pour tous les mots — gérer le fallback sur `phon`

### Localisation des Fichiers

| Fichier | Chemin | Statut |
|---|---|---|
| Script source | `/Users/hugomatton/Desktop/syllabix/scripts/build_graph.py` | À CRÉER |
| Input: dictionary | `/Users/hugomatton/Desktop/syllabix/public/dictionary.json` | ✓ Existe (121 028 entrées) |
| Input: Lexique | `/Users/hugomatton/Desktop/syllabix/scripts/Lexique383.tsv` | ✓ Existe |
| Output: graph | `/Users/hugomatton/Desktop/syllabix/public/graph.json` | À GÉNÉRER |

### Règles Architecturales à Respecter

1. **ARC8 — scripts/ hors bundle Vite** : `build_graph.py` dans `scripts/`, jamais dans `src/`
2. **NFR6 — Taille <5MB gzip** : `dictionary.json` fait ~0.56 MB gzip. `graph.json` doit donc rester sous ~4.5 MB gzip. En pratique graph.json sera nettement plus petit que dictionary.json.
3. **FR32** : Le graphe est la fondation du bot — chaque clé doit avoir ≥ 2 mots pour garantir la sélection aléatoire non-bloquante.
4. **NFR4 — Zéro calcul en temps réel** : graph.json est pré-calculé. Le runtime (botSelector.ts) fait uniquement un lookup `graph[syllabe]`.
5. **Idempotence** : le script peut être relancé sans problème (écrase `public/graph.json`).
6. **Pas de TypeScript** dans cette story — Python pur uniquement.

### Intelligence de la Story 1.2 (Leçons Apprises)

**Leçon critique : espeak-ng ne fonctionne PAS sur macOS ARM64** (erreur licence Xcode, brew échoue, conda unavailable pour ARM). Ne pas tenter d'utiliser phonemize en temps réel — utiliser exclusivement le mapping SAMPA→IPA depuis le fichier Lexique.

**Stack exact installé :**
- Python 3.9+ (disponible)
- `phonemizer>=3.0.0` installé via `pip install -r scripts/requirements.txt` (mais non utilisé finalement)
- Aucune dépendance système supplémentaire requise pour build_graph.py

**Approche validée :** `csv.DictReader(f, delimiter='\t')` avec accès par nom de colonne fonctionne parfaitement sur Lexique383.tsv (UTF-8, ~140k lignes, parsé en < 1 seconde).

**Format dictionary.json confirmé :**
- 121 028 entrées
- Format : `{"mot": "ipastring"}` (clés minuscules, valeurs IPA sans espaces)
- Taille : 2.84 MB brut / ~0.56 MB gzip
- Exemples : `"chocolat" → "ʃokola"`, `"lapin" → "lapɛ̃"`, `"maison" → "mɛzɔ̃"`

**Fichiers créés par Story 1.2 (ne pas modifier dans Story 1.3) :**
- `scripts/build_dictionary.py` — source SAMPA→IPA mapping à réutiliser
- `scripts/requirements.txt` — ne pas modifier
- `public/dictionary.json` — input de cette story
- `.gitignore` — scripts/Lexique383.tsv déjà exclu

### Considérations de Performance

- Lecture Lexique383.tsv (~140k lignes) : < 1 seconde
- Traitement et construction du graphe : < 5 secondes
- Pas de timeout attendu — opération rapide contrairement à phonemize

### Taille Attendue du graph.json

Le graphe brut (avant filtrage) aura N_unique_last_syllables clés. Avec 121 028 mots français et ~500-1000 syllabes terminales uniques, graph.json sera typiquement :
- ~500-2000 clés
- Taille brute estimée : 0.5-3 MB (nettement sous les 5 MB cibles)

### Project Structure Notes

#### Alignement avec l'architecture définie

- `scripts/build_graph.py` → conforme à [Source: architecture.md#Structure Complète du Projet]
- `public/graph.json` → conforme à [Source: architecture.md#Structure Complète du Projet]
- Format `Record<string, string[]>` pour graph → conforme à [Source: architecture.md#Architecture des Données Client]
- Logique bot côté runtime utilise `graph[syllabe]` → conforme à [Source: architecture.md#Flux de Données, Tour de jeu]

#### Dépendances de cette story

- **Dépend de** : Story 1.2 (`public/dictionary.json` doit exister) ✓ DONE
- **Est requise par** : Story 1.4 (harnais de tests — nécessite les deux JSON pour valider le moteur)
- **Est requise par** : Epic 2, Story 2.1 (chargement des données en mémoire)
- **Est requise par** : Epic 2, Story 2.3 (botSelector.ts utilise graph.json)

#### Conflits potentiels détectés

- **Colonne `syll` vs `phon` :** Si `syll` n'existe pas dans le header Lexique ou est systématiquement vide, utiliser `phon` directement (le mot est traité comme mono-syllabique, last_syl = phon entier). Peu probable mais possible.
- **Mots 1 syllabe :** Si `syll` = "la" (pas de `-`), then first_syl = last_syl = "la". Ces mots sont valides dans le graphe.
- **Convergence du filtre :** Dans de rares cas, le filtre itératif pourrait faire baisser le graphe sous un seuil critique (ex: très peu de syllabes terminales). Monitorer avec les logs et ajuster MIN_CONTINUATIONS si nécessaire (valeur défaut : 2, conforme à Story 2.3 AC).

### References

- [Source: epics.md#Story 1.3] — User story complète et Acceptance Criteria (FR32)
- [Source: architecture.md#Architecture des Données Client] — Format `Record<string, string[]>` pour graph
- [Source: architecture.md#Structure Complète du Projet] — Localisation `scripts/build_graph.py` et `public/graph.json`
- [Source: architecture.md#ARC8] — scripts/ hors bundle Vite
- [Source: architecture.md#NFR6] — Taille fichiers JSON <5MB gzip total
- [Source: architecture.md#Flux de Données] — Tour de jeu : `botSelector.selectBotWord()` → lookup Record
- [Source: 1-2-script-python-build-dictionary-py-generation-dictionary-json.md#Dev Notes] — SAMPA→IPA mapping, approche Lexique validée, format dictionary.json
- [Source: 1-2-script-python-build-dictionary-py-generation-dictionary-json.md#Completion Notes] — Résultats validés Story 1.2
- [Source: epics.md#Story 2.3] — BotSelector attend graph.json avec ≥ 2 mots par clé

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème bloquant rencontré. Tous les 121 028 mots du dictionnaire avaient des données syllabiques dans Lexique383.tsv — aucun fallback `phon` nécessaire.

### Completion Notes List

- ✅ **T1-T3** : SAMPA_TO_IPA mapping copié exactement de `build_dictionary.py` (lignes 35-78). `sampa_to_ipa()` et `get_syllables()` implémentés. Colonnes Lexique confirmées : `ortho`, `phon`, `syll`.
- ✅ **T4** : Graphe brut construit via index `first_syl → [mots]`. 3 348 clés initiales, taille moyenne 33.5 mots/clé, clé la plus grande : `'a'` (7 527 mots).
- ✅ **T5** : Filtrage itératif convergé en 3 itérations. Iter 1 : 788 clés et 20 877 mots retirés. Iter 2 : 391 mots retirés. Iter 3 : stable.
- ✅ **T6** : `public/graph.json` écrit — 2 560 clés, 1.079 MB brut, integrity check OK.
- ✅ **T7** : Toutes les validations AC passent. `graph['la']` = 347 mots, 'lapin' présent ✓. Total gzip : 0.86 MB (bien sous 5 MB NFR6 ✓).
- ✅ **Tests** : 22 tests (14 unitaires + 8 intégration) — tous verts en 0.064s.

### File List

- `scripts/build_graph.py` (créé + review fixes)
- `scripts/test_build_graph.py` (créé + review fixes)
- `public/graph.json` (généré — 1.079 MB, 2 560 clés)
- `package.json` (modifié — ajout script `test:python`)

## Change Log

- 2026-03-08 : Implémentation Story 1.3 — création de `scripts/build_graph.py` et génération de `public/graph.json`. Script Python pur utilisant le mapping SAMPA→IPA de Story 1.2 + la colonne `syll` de Lexique383.tsv. Filtrage itératif jusqu'à convergence (3 passes). 22 tests unitaires et d'intégration écrits et passants.
- 2026-03-09 : Code review — 6 fixes appliqués (2 HIGH, 4 MEDIUM) : (1) vérification gzip réelle pour NFR6/AC2 dans build_graph.py et test ; (2) `assert` → `RuntimeError` pour integrity check ; (3) `list(set(...))` → `sorted(set(...))` pour builds reproductibles ; (4) assertion `lapin` explicite dans test AC3 ; (5) dead code supprimé dans test_unknown_char_passthrough ; (6) `test:python` ajouté dans package.json. 22/22 tests verts.

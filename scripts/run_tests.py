#!/usr/bin/env python3
"""
Harnais de tests phonétiques — Story 1.4.
Valide 50+ cas de test contre la logique de correspondance phonétique.
Usage: python scripts/run_tests.py
Prérequis: public/dictionary.json et public/graph.json doivent exister (Stories 1.2 et 1.3)
"""
import json
import csv
import sys
import unicodedata
from pathlib import Path

DICTIONARY_PATH = Path("public/dictionary.json")
LEXIQUE_PATH = Path("scripts/Lexique383.tsv")
TEST_CASES_PATH = Path("scripts/test_cases.json")
PHONETIC_TOLERANCE = 2  # Synchronisé avec src/config/constants.ts

# ---------------------------------------------------------------------------
# Mapping SAMPA → IPA (copié depuis scripts/build_graph.py — NE PAS RÉINVENTER)
# ---------------------------------------------------------------------------
SAMPA_TO_IPA = {
    'a': 'a', 'e': 'e', 'E': 'ɛ', 'i': 'i', 'o': 'o', 'O': 'ɔ',
    'u': 'u', 'y': 'y', '2': 'ø', '9': 'œ', '°': 'ə', '8': 'ɥ',
    '@': 'ɑ̃', '§': 'ɔ̃', '5': 'ɛ̃', '1': 'œ̃',
    'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g',
    'f': 'f', 'v': 'v', 's': 's', 'z': 'z', 'S': 'ʃ', 'Z': 'ʒ',
    'm': 'm', 'n': 'n', 'N': 'ɲ', 'G': 'ŋ', 'l': 'l', 'R': 'ʁ',
    'j': 'j', 'w': 'w', 'x': 'x',
}


def sampa_to_ipa(sampa: str) -> str:
    return ''.join(SAMPA_TO_IPA.get(ch, ch) for ch in sampa)


def get_syllables(syll_str: str, phon_str: str) -> tuple[str, str]:
    """Retourne (first_syl_ipa, last_syl_ipa) depuis la colonne syll de Lexique."""
    raw = syll_str.strip() if syll_str.strip() else phon_str.strip()
    parts = raw.split('-') if '-' in raw else [raw]
    first = sampa_to_ipa(parts[0])
    last = sampa_to_ipa(parts[-1])
    return first, last


# ---------------------------------------------------------------------------
# Distance de Levenshtein (Python pur — aucune dépendance externe)
# ---------------------------------------------------------------------------
def normalize_ipa_chars(s: str) -> list[str]:
    """Segmente une chaîne IPA en unités phonétiques (graphèmes).

    Normalise en NFC pour tenter de composer les caractères combinants,
    puis traite chaque code point NFC comme une unité phonétique.
    """
    s = unicodedata.normalize('NFC', s)
    return list(s)


def levenshtein(a: str, b: str) -> int:
    """Distance d'édition entre deux chaînes IPA. O(len(a)*len(b))."""
    a_chars = normalize_ipa_chars(a)
    b_chars = normalize_ipa_chars(b)
    if a_chars == b_chars:
        return 0
    if not a_chars:
        return len(b_chars)
    if not b_chars:
        return len(a_chars)
    m, n = len(a_chars), len(b_chars)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            temp = dp[j]
            dp[j] = min(
                dp[j] + 1,
                dp[j - 1] + 1,
                prev + (0 if a_chars[i - 1] == b_chars[j - 1] else 1),
            )
            prev = temp
    return dp[n]


# ---------------------------------------------------------------------------
# Chargement des données
# ---------------------------------------------------------------------------
def load_dictionary() -> dict[str, str]:
    if not DICTIONARY_PATH.exists():
        print(f"ERREUR : {DICTIONARY_PATH} introuvable. Lancez d'abord build_dictionary.py.")
        sys.exit(1)
    with open(DICTIONARY_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_word_syllables(dictionary: dict[str, str]) -> dict[str, tuple[str, str]]:
    """Construit word -> (first_syl_ipa, last_syl_ipa) depuis Lexique383.tsv."""
    if not LEXIQUE_PATH.exists():
        print(f"ERREUR : {LEXIQUE_PATH} introuvable.")
        sys.exit(1)
    word_syllables: dict[str, tuple[str, str]] = {}
    with open(LEXIQUE_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            word = row['ortho'].lower().strip()
            if word not in dictionary:
                continue
            syll = row.get('syll', '')
            phon = row.get('phon', '')
            if not phon and not syll:
                continue
            first_syl, last_syl = get_syllables(syll, phon)
            if first_syl and last_syl and word not in word_syllables:
                word_syllables[word] = (first_syl, last_syl)
    return word_syllables


def load_test_cases() -> list[dict]:
    if not TEST_CASES_PATH.exists():
        print(f"ERREUR : {TEST_CASES_PATH} introuvable.")
        sys.exit(1)
    with open(TEST_CASES_PATH, 'r', encoding='utf-8') as f:
        cases = json.load(f)
    required_fields = ('word', 'previous', 'expected')
    for i, case in enumerate(cases, 1):
        missing = [field for field in required_fields if field not in case]
        if missing:
            print(f"ERREUR : cas {i} manque les champs obligatoires : {missing}")
            sys.exit(1)
        if not isinstance(case['expected'], bool):
            print(f"ERREUR : cas {i} — 'expected' doit être bool, reçu : {type(case['expected']).__name__}")
            sys.exit(1)
    return cases


# ---------------------------------------------------------------------------
# Logique de validation phonétique
# ---------------------------------------------------------------------------
def validate_word(
    word: str,
    previous: str,
    dictionary: dict[str, str],
    word_syllables: dict[str, tuple[str, str]],
    tolerance: int,
) -> tuple[bool, str]:
    """Valide si `word` peut suivre `previous` selon les règles phonétiques.

    Retourne (result, reason) pour le rapport de synthèse.
    """
    # Étape 1 : word doit être dans le dictionnaire
    if not word or word not in dictionary:
        return False, f'hors-dictionnaire: {repr(word)}'

    # Étape 2 : Obtenir last_syl_ipa de previous
    if previous not in word_syllables:
        return False, f'previous hors-Lexique: {repr(previous)}'
    last_syl = word_syllables[previous][1]

    # Étape 3 : Obtenir first_syl_ipa de word
    if word not in word_syllables:
        return False, f'word hors-Lexique: {repr(word)}'
    first_syl = word_syllables[word][0]

    # Étape 4 : Distance de Levenshtein
    dist = levenshtein(first_syl, last_syl)
    if dist <= tolerance:
        return True, f'last_syl={repr(last_syl)}, first_syl={repr(first_syl)}, dist={dist}'
    return False, f'mauvaise-syllabe: last={repr(last_syl)}, first={repr(first_syl)}, dist={dist}'


# ---------------------------------------------------------------------------
# Rapport de synthèse
# ---------------------------------------------------------------------------
def run_tests() -> int:
    """Lance tous les tests et imprime un rapport. Retourne 0 si tous passent."""
    print("=== Harnais de Tests Phonétiques Syllabix ===")
    print(f"Tolérance IPA : {PHONETIC_TOLERANCE} (distance d'édition max)")
    print()

    # Chargement
    print("Chargement des données...", end=' ')
    dictionary = load_dictionary()
    word_syllables = load_word_syllables(dictionary)
    test_cases = load_test_cases()
    print(f"OK ({len(dictionary)} mots, {len(word_syllables)} entrées Lexique, {len(test_cases)} cas de test)")
    print()

    # Exécution des cas
    passed = 0
    failed = 0
    valid_passed = 0   # expected: true && result: true
    valid_failed = 0   # expected: true && result: false
    invalid_passed = 0  # expected: false && result: false
    invalid_failed = 0  # expected: false && result: true
    failures: list[str] = []

    print("Résultats :")
    for i, case in enumerate(test_cases, 1):
        word = case.get('word', '')
        previous = case.get('previous', '')
        expected = case.get('expected', False)

        result, reason = validate_word(word, previous, dictionary, word_syllables, PHONETIC_TOLERANCE)
        ok = result == expected

        if ok:
            passed += 1
            symbol = '✓'
            if expected:
                valid_passed += 1
            else:
                invalid_passed += 1
        else:
            failed += 1
            symbol = '✗'
            if expected:
                valid_failed += 1
            else:
                invalid_failed += 1
            failures.append(
                f'  CAS {i:02d}: {repr(word)} suit {repr(previous)} → attendu={expected}, obtenu={result} [{reason}]'
            )

        word_disp = repr(word) if len(word) < 15 else repr(word[:12] + '...')
        prev_disp = repr(previous) if len(previous) < 12 else repr(previous[:9] + '...')
        exp_str = 'true ' if expected else 'false'
        status_str = 'OK  ' if ok else 'FAIL'
        print(f"  {symbol} [{status_str}] {word_disp:<20} suit {prev_disp:<16} [expected: {exp_str}]  {reason}")

    # Rapport final
    total = len(test_cases)
    valid_total = sum(1 for c in test_cases if c.get('expected'))
    invalid_total = sum(1 for c in test_cases if not c.get('expected'))
    pct = passed / total * 100 if total > 0 else 0

    print()
    print("=== Synthèse ===")
    print(f"  Cas valides   : {valid_passed}/{valid_total} passés {'✓' if valid_failed == 0 else '✗'}")
    print(f"  Cas invalides : {invalid_passed}/{invalid_total} passés {'✓' if invalid_failed == 0 else '✗'}")
    print(f"  TOTAL         : {passed}/{total} ({pct:.1f}%) {'✓' if failed == 0 else '✗'}")

    if failures:
        print()
        print(f"  {len(failures)} échec(s) détecté(s) :")
        for line in failures:
            print(line)

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(run_tests())

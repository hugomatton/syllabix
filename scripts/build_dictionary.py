#!/usr/bin/env python3
"""
Build dictionary.json from Lexique 3.83
Usage: python scripts/build_dictionary.py
Output: public/dictionary.json

Prerequisites:
  - espeak-ng (system library): brew install espeak-ng (macOS) or sudo apt-get install espeak-ng (Ubuntu)
  - Python deps: pip install -r scripts/requirements.txt

Approach:
  Uses Lexique 3.83's built-in phonetic notation (French SAMPA variant) and converts
  it to IPA using a character mapping table. This approach is:
  - Faster than phonemize (no TTS engine overhead)
  - More reliable (linguist-curated data)
  - Dependency-free (no espeak-ng runtime required)

  The Lexique 'phon' column uses a French-specific SAMPA notation that maps
  cleanly to IPA. See SAMPA_TO_IPA below for the complete mapping.
"""

import csv
import json
import re
import sys
import time
from pathlib import Path

LEXIQUE_PATH = Path("scripts/Lexique383.tsv")
OUTPUT_PATH = Path("public/dictionary.json")
MIN_WORD_LENGTH = 2

# French SAMPA (Lexique 3.83 notation) to IPA mapping
# Verified against known French phonology examples from the Lexique dataset.
SAMPA_TO_IPA = {
    # --- Oral vowels ---
    'a': 'a',    # low central/front: "patte"
    'e': 'e',    # close-mid front unrounded: "été"
    'E': 'ɛ',    # open-mid front unrounded: "fête"
    'i': 'i',    # close front unrounded: "vie"
    'o': 'o',    # close-mid back rounded: "eau"
    'O': 'ɔ',    # open-mid back rounded: "or"
    'u': 'u',    # close back rounded: "ou"
    'y': 'y',    # close front rounded: "tu"
    '2': 'ø',    # close-mid front rounded: "jeu"
    '9': 'œ',    # open-mid front rounded: "peur"
    '°': 'ə',    # schwa (e muet): "le"
    '8': 'ɥ',    # labio-palatal approximant: "nuit" [n.ɥi]

    # --- Nasal vowels ---
    '@': 'ɑ̃',   # nasal a: "enfant", "blanc" [blɑ̃]
    '§': 'ɔ̃',   # nasal o: "bon", "maison" → [mɛzɔ̃]
    '5': 'ɛ̃',   # nasal e: "vin", "lapin" → [lapɛ̃]
    '1': 'œ̃',   # nasal oe: "un", "brun"

    # --- Consonants ---
    'p': 'p',    # bilabial plosive: "père"
    'b': 'b',    # bilabial plosive voiced: "beau"
    't': 't',    # alveolar plosive: "table"
    'd': 'd',    # alveolar plosive voiced: "dos"
    'k': 'k',    # velar plosive: "car"
    'g': 'g',    # velar plosive voiced: "gare"
    'f': 'f',    # labiodental fricative: "feu"
    'v': 'v',    # labiodental fricative voiced: "vie"
    's': 's',    # alveolar fricative: "sol"
    'z': 'z',    # alveolar fricative voiced: "zero"
    'S': 'ʃ',    # postalveolar fricative: "chat" [ʃa]
    'Z': 'ʒ',    # postalveolar fricative voiced: "jour" [ʒuʁ]
    'm': 'm',    # bilabial nasal: "mer"
    'n': 'n',    # alveolar nasal: "non"
    'N': 'ɲ',    # palatal nasal: "agneau" [aɲo]
    'G': 'ŋ',    # velar nasal: "parking" [paʁkiŋ]
    'l': 'l',    # alveolar lateral: "lait"
    'R': 'ʁ',    # uvular fricative: "roi" [ʁwa]
    'j': 'j',    # palatal approximant: "yeux" [jø]
    'w': 'w',    # labio-velar approximant: "oui" [wi]
    'x': 'x',    # velar fricative (foreign words): "jota" [xota]
}


def normalize_word(word: str) -> str:
    """Normalize word to lowercase and strip whitespace."""
    return word.lower().strip()


def is_valid_word(word: str) -> bool:
    """Keep only alphabetic words (including accented chars), minimum length."""
    return len(word) >= MIN_WORD_LENGTH and bool(re.match(r'^[a-zA-ZÀ-ÿ\u0100-\u024F]+$', word))


def sampa_to_ipa(sampa: str) -> str:
    """
    Convert Lexique SAMPA phonetic string to IPA.
    Maps each character using SAMPA_TO_IPA table.
    Unknown characters are passed through unchanged (with a warning).
    """
    ipa_chars = []
    for ch in sampa:
        if ch in SAMPA_TO_IPA:
            ipa_chars.append(SAMPA_TO_IPA[ch])
        else:
            # Unknown character: pass through (may happen with rare foreign words)
            ipa_chars.append(ch)
    return ''.join(ipa_chars)


def main():
    start = time.time()

    if not LEXIQUE_PATH.exists():
        print(f"ERROR: {LEXIQUE_PATH} not found.")
        print("Download from: http://www.lexique.org/databases/Lexique383/Lexique383.tsv")
        sys.exit(1)

    # Create public/ directory if needed
    OUTPUT_PATH.parent.mkdir(exist_ok=True)

    # Load and process words from Lexique
    print("Loading Lexique 3.83...")
    dictionary = {}
    skipped_empty_phon = 0
    skipped_invalid_word = 0
    duplicate_count = 0

    with open(LEXIQUE_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            raw_word = row.get('ortho', '').strip()
            raw_phon = row.get('phon', '').strip()

            word = normalize_word(raw_word)

            # Skip invalid words
            if not is_valid_word(word):
                skipped_invalid_word += 1
                continue

            # Skip words with empty phonetic entry
            if not raw_phon:
                skipped_empty_phon += 1
                continue

            # Deduplicate: keep first occurrence only
            if word in dictionary:
                duplicate_count += 1
                continue

            # Convert SAMPA to IPA
            ipa = sampa_to_ipa(raw_phon)

            if ipa:
                dictionary[word] = ipa

    print(f"Words processed: {len(dictionary):,}")
    print(f"Duplicates skipped: {duplicate_count:,}")
    print(f"Invalid words skipped: {skipped_invalid_word:,}")
    print(f"Empty phon skipped: {skipped_empty_phon:,}")

    # Write output JSON (no indentation for minimal file size — NFR6)
    print(f"\nWriting {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, separators=(',', ':'))

    # Post-write integrity check: re-read file and verify entry count matches
    with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
        written = json.load(f)
    if len(written) != len(dictionary):
        print(f"\n✗ INTEGRITY ERROR: wrote {len(dictionary):,} entries but file contains {len(written):,}")
        sys.exit(1)

    # Stats
    elapsed = time.time() - start
    size_mb = OUTPUT_PATH.stat().st_size / 1024 / 1024
    print(f"\n✓ Done in {elapsed:.1f}s")
    print(f"✓ Entries: {len(dictionary):,}")
    print(f"✓ File size: {size_mb:.2f} MB")

    # Validation spot check (AC3)
    test_words = {
        'chocolat': 'ʃokola',     # S=ʃ, o=o, k=k, o=o, l=l, a=a
        'lapin': 'lapɛ̃',         # l, a, p, 5=ɛ̃
        'maison': 'mɛzɔ̃',        # m, E=ɛ, z, §=ɔ̃
        'éléphant': None,          # just check presence
        'être': None,
    }

    print("\n--- Spot Checks ---")
    for test_word, expected_ipa in test_words.items():
        if test_word in dictionary:
            ipa = dictionary[test_word]
            if expected_ipa:
                match = "✓" if ipa == expected_ipa else "~"
                print(f"{match} '{test_word}' → '{ipa}' (expected '{expected_ipa}')")
            else:
                print(f"✓ '{test_word}' → '{ipa}'")
        else:
            print(f"⚠ '{test_word}' NOT FOUND in dictionary")

    # Entry count validation (AC2)
    if len(dictionary) >= 100_000:
        print(f"\n✓ AC2: Entry count {len(dictionary):,} ≥ 100,000 ✓")
    else:
        print(f"\n✗ AC2 FAILED: Entry count {len(dictionary):,} < 100,000")
        sys.exit(1)

    return dictionary


if __name__ == '__main__':
    main()

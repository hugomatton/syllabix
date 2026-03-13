#!/usr/bin/env python3
"""
Build graph.json from dictionary.json + Lexique 3.83 syll column.

Usage: python scripts/build_graph.py
Output: public/graph.json

Prerequisite: public/dictionary.json must exist (run build_dictionary.py first)

The graph structure: {last_syllable_IPA: [words_that_start_with_that_syllable, ...]}
A word X can follow word W in the game if first_syl(X) == last_syl(W).
Each key has >= 2 valid continuations to prevent dead ends.
Words whose own last syllable has no valid continuations are excluded.
"""

import csv
import gzip
import json
import sys
import time
from collections import defaultdict
from pathlib import Path

LEXIQUE_PATH = Path("scripts/Lexique383.tsv")
DICTIONARY_PATH = Path("public/dictionary.json")
OUTPUT_PATH = Path("public/graph.json")
MIN_CONTINUATIONS = 2  # minimum words per graph key (FR32)

# T1.1 — SAMPA→IPA mapping copied exactly from build_dictionary.py (lines 35-78)
# DO NOT modify — this must match build_dictionary.py to stay consistent
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


# T1.2 — sampa_to_ipa function reused from build_dictionary.py (same logic)
def sampa_to_ipa(sampa: str) -> str:
    """Convert Lexique SAMPA phonetic string to IPA character by character."""
    return ''.join(SAMPA_TO_IPA.get(ch, ch) for ch in sampa)


def get_syllables(syll_str: str, phon_str: str) -> tuple[str, str]:
    """
    Extract (first_syllable_IPA, last_syllable_IPA) from Lexique syll column.
    Falls back to phon if syll is missing (treats word as monosyllabic).
    Returns ('', '') if no phonetic data available.
    """
    raw = syll_str.strip() if syll_str.strip() else phon_str.strip()
    if not raw:
        return ('', '')
    parts = raw.split('-') if '-' in raw else [raw]
    first = sampa_to_ipa(parts[0])
    last = sampa_to_ipa(parts[-1])
    return first, last


def main():
    start = time.time()

    # T2.1 — Load public/dictionary.json
    if not DICTIONARY_PATH.exists():
        print(f"ERROR: {DICTIONARY_PATH} not found. Run build_dictionary.py first.")
        sys.exit(1)

    with open(DICTIONARY_PATH, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    print(f"Loaded dictionary: {len(dictionary):,} words")

    # T2.2-T3.4 — Read Lexique383.tsv via csv.DictReader, extract syll column
    # Build word_syllables: word -> (first_syl_IPA, last_syl_IPA)
    word_syllables: dict[str, tuple[str, str]] = {}
    no_syll_words: list[str] = []

    with open(LEXIQUE_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')

        # Verify expected columns exist
        assert reader.fieldnames is not None
        fieldnames = reader.fieldnames
        print(f"Lexique columns confirmed: ortho={'ortho' in fieldnames}, "
              f"phon={'phon' in fieldnames}, syll={'syll' in fieldnames}")

        for row in reader:
            # T2.3 — Normalize ortho, read syll
            word = row.get('ortho', '').lower().strip()
            syll = row.get('syll', '')
            phon = row.get('phon', '')

            # T2.4 — Only process words present in dictionary.json
            if word not in dictionary:
                continue

            # T3.5 — Skip if both syll and phon are missing; log warning
            if not syll.strip() and not phon.strip():
                no_syll_words.append(word)
                continue

            # T3.1-T3.3 — Split syll by '-', compute first/last syl IPA
            first_syl, last_syl = get_syllables(syll, phon)

            if not first_syl or not last_syl:
                no_syll_words.append(word)
                continue

            # T3.4 — Store word_syllables (first occurrence only, like build_dictionary.py)
            if word not in word_syllables:
                word_syllables[word] = (first_syl, last_syl)

    no_syll_count = len(dictionary) - len(word_syllables)
    print(f"Words with syllable data: {len(word_syllables):,} "
          f"({no_syll_count:,} skipped — no syll/phon data)")

    if no_syll_words:
        sample = no_syll_words[:5]
        print(f"WARNING: {len(no_syll_words)} words had no syll data (sample: {sample})")

    # T4.1-T4.2 — Build raw graph: last_syl(W) → [words X where first_syl(X) == last_syl(W)]
    # First build an index: first_syl → [words that start with that syllable]
    first_syl_index: dict[str, list[str]] = defaultdict(list)
    for word, (first_syl, _last_syl) in word_syllables.items():
        if first_syl:
            first_syl_index[first_syl].append(word)

    # For each unique last syllable, the graph entry = words starting with that syllable
    raw_graph: dict[str, list[str]] = {}
    for _word, (_first_syl, last_syl) in word_syllables.items():
        if last_syl and last_syl not in raw_graph and last_syl in first_syl_index:
            raw_graph[last_syl] = sorted(set(first_syl_index[last_syl]))

    # T4.3 — Statistics on raw graph
    if raw_graph:
        list_sizes = [len(v) for v in raw_graph.values()]
        avg_size = sum(list_sizes) / len(list_sizes)
        max_key = max(raw_graph, key=lambda k: len(raw_graph[k]))
        print(f"Raw graph: {len(raw_graph):,} syllable keys, "
              f"avg {avg_size:.1f} words/key, "
              f"largest: '{max_key}' ({len(raw_graph[max_key])} words)")
    else:
        print("ERROR: Raw graph is empty — check data pipeline")
        sys.exit(1)

    # T5 — Iterative filtering until stable
    graph = {k: list(v) for k, v in raw_graph.items()}

    for iteration in range(10):  # max 10 iterations; convergence expected in 2-3
        keys_before = len(graph)
        words_before = sum(len(v) for v in graph.values())

        # T5.1 — Pass 1: remove keys with < MIN_CONTINUATIONS words
        graph = {k: v for k, v in graph.items() if len(v) >= MIN_CONTINUATIONS}
        keys_removed_p1 = keys_before - len(graph)

        # T5.2 — Pass 2: remove words whose own last_syl is not a valid key
        valid_keys = set(graph.keys())
        new_graph: dict[str, list[str]] = {}
        for syl, words in graph.items():
            safe_words = [
                w for w in words
                if word_syllables.get(w, ('', ''))[1] in valid_keys
            ]
            new_graph[syl] = safe_words
        graph = new_graph

        # T5.3 — Pass 1 bis: re-remove keys with < MIN_CONTINUATIONS
        graph = {k: v for k, v in graph.items() if len(v) >= MIN_CONTINUATIONS}

        words_after = sum(len(v) for v in graph.values())
        words_removed = words_before - words_after
        keys_removed = keys_before - len(graph)

        # T5.5 — Log progress
        print(f"  Iteration {iteration + 1}: "
              f"{keys_removed} keys removed ({keys_removed_p1} in P1), "
              f"{words_removed} words removed")

        # T5.4 — Stop when stable (no changes)
        if keys_removed == 0 and words_removed == 0:
            print(f"  Converged after {iteration + 1} iteration(s)")
            break

    print(f"Final graph: {len(graph):,} keys, "
          f"{sum(len(v) for v in graph.values()):,} total word entries")

    # T6.1 — Write public/graph.json
    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(graph, f, ensure_ascii=False, separators=(',', ':'))

    # T6.2 — Post-write integrity check
    with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
        written = json.load(f)
    if len(written) != len(graph):
        raise RuntimeError(
            f"Integrity error: wrote {len(graph)} keys but file contains {len(written)}"
        )

    # T6.3 — File stats
    size_bytes = OUTPUT_PATH.stat().st_size
    size_mb = size_bytes / 1024 / 1024
    print(f"\n✓ graph.json: {size_mb:.3f} MB ({size_bytes:,} bytes), {len(graph):,} keys")

    # T7 — Validation
    print("\n--- Validation ---")

    # T7.1 — Check 'la' key (last syllable of "chocolat" → IPA "la")
    if 'la' in graph:
        print(f"✓ T7.1: 'la' key found in graph ({len(graph['la'])} words)")
    else:
        print("⚠ T7.1: 'la' NOT found in graph keys")

    # T7.2 — Check that words starting with 'la' (like "lapin") are present
    if 'la' in graph:
        sample_la = graph['la'][:10]
        lapin_present = 'lapin' in graph['la']
        la_words_sample = [w for w in graph['la'] if w.startswith('la')][:5]
        print(f"✓ T7.2: graph['la'] sample: {sample_la[:5]}...")
        print(f"  'lapin' in graph['la']: {lapin_present}")
        print(f"  Words starting 'la': {la_words_sample}")

    # T7.3 — Size check: dictionary.json + graph.json < 5MB gzip (NFR6 — actual gzip measurement)
    dict_size_mb = DICTIONARY_PATH.stat().st_size / 1024 / 1024
    total_raw_mb = dict_size_mb + size_mb
    gz_combined = len(gzip.compress(DICTIONARY_PATH.read_bytes() + OUTPUT_PATH.read_bytes()))
    gz_mb = gz_combined / 1024 / 1024
    status_size = "✓" if gz_mb < 5.0 else "⚠ FAIL"
    print(f"{status_size} T7.3: dictionary.json={dict_size_mb:.2f}MB + "
          f"graph.json={size_mb:.3f}MB = {total_raw_mb:.2f}MB raw | {gz_mb:.3f}MB gzip (target <5MB)")
    if gz_mb >= 5.0:
        print(f"  ⚠ NFR6 VIOLATION: combined gzip size {gz_mb:.3f}MB exceeds 5MB target")
        sys.exit(1)

    # T7.4 — Spot check: 3-5 known syllables
    print("\n--- Spot checks (known syllables) ---")
    spot_syllables = ['la', 'pɛ̃', 'ɔ̃', 'ʃo', 'mɛ']
    for syl in spot_syllables:
        if syl in graph:
            sample = graph[syl][:4]
            print(f"  graph['{syl}'] ({len(graph[syl])} words): {sample}...")
        else:
            print(f"  graph['{syl}']: NOT FOUND")

    # Final timing
    elapsed = time.time() - start
    print(f"\n✓ Completed in {elapsed:.1f}s")
    print(f"✓ graph.json written to {OUTPUT_PATH}")


if __name__ == '__main__':
    main()

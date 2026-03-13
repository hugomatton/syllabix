#!/usr/bin/env python3
"""
Unit tests for build_graph.py — Story 1.3

Tests:
- sampa_to_ipa: SAMPA character mapping
- get_syllables: syllable extraction from Lexique syll/phon strings
- graph structure properties (integration tests against generated graph.json)

Usage: python scripts/test_build_graph.py
"""

import gzip
import json
import sys
import unittest
from pathlib import Path

# Import from build_graph.py (same directory)
sys.path.insert(0, str(Path(__file__).parent))
from build_graph import SAMPA_TO_IPA, sampa_to_ipa, get_syllables


class TestSampaToIpa(unittest.TestCase):
    """Unit tests for the sampa_to_ipa function."""

    def test_oral_vowels(self):
        """All oral vowels convert correctly."""
        self.assertEqual(sampa_to_ipa('a'), 'a')
        self.assertEqual(sampa_to_ipa('e'), 'e')
        self.assertEqual(sampa_to_ipa('E'), 'ɛ')
        self.assertEqual(sampa_to_ipa('i'), 'i')
        self.assertEqual(sampa_to_ipa('o'), 'o')
        self.assertEqual(sampa_to_ipa('O'), 'ɔ')
        self.assertEqual(sampa_to_ipa('u'), 'u')
        self.assertEqual(sampa_to_ipa('y'), 'y')
        self.assertEqual(sampa_to_ipa('2'), 'ø')
        self.assertEqual(sampa_to_ipa('9'), 'œ')
        self.assertEqual(sampa_to_ipa('°'), 'ə')
        self.assertEqual(sampa_to_ipa('8'), 'ɥ')

    def test_nasal_vowels(self):
        """Nasal vowels convert correctly."""
        self.assertEqual(sampa_to_ipa('@'), 'ɑ̃')
        self.assertEqual(sampa_to_ipa('§'), 'ɔ̃')
        self.assertEqual(sampa_to_ipa('5'), 'ɛ̃')
        self.assertEqual(sampa_to_ipa('1'), 'œ̃')

    def test_consonants(self):
        """Consonants convert correctly."""
        self.assertEqual(sampa_to_ipa('S'), 'ʃ')
        self.assertEqual(sampa_to_ipa('Z'), 'ʒ')
        self.assertEqual(sampa_to_ipa('R'), 'ʁ')
        self.assertEqual(sampa_to_ipa('N'), 'ɲ')
        self.assertEqual(sampa_to_ipa('G'), 'ŋ')

    def test_word_examples(self):
        """Known French word phonetics convert correctly (same as build_dictionary.py)."""
        # chocolat: SOkOla → ʃokola (S=ʃ, O=ɔ, k=k, O=ɔ, l=l, a=a... wait)
        # Actually: S→ʃ, O→ɔ, k→k, O→ɔ, l→l, a→a... = ʃɔkɔla
        # But build_dictionary expected 'ʃokola' — let me check: the entry for chocolat
        # phon=SOkOla → S=ʃ, O=ɔ, k=k, O=ɔ, l=l, a=a → ʃɔkɔla
        # Hmm, but the story says chocolat → ʃokola. Let me use the actual mapping.
        # S→ʃ, o→o, k→k, o→o, l→l, a→a → this would be SOkOla with lowercase O?
        # Lexique uses uppercase for open-mid, the story says "SOkOla" in the table
        # So: S=ʃ, O=ɔ, k=k, O=ɔ, l=l, a=a → ʃɔkɔla
        # But build_dictionary.py spot check says "chocolat" → "ʃokola"...
        # The story table: phon=SOkOla... actually build_dictionary shows 'SOkOla' with uppercase S,O
        # Let me just test the function works char by char
        self.assertEqual(sampa_to_ipa('SOkOla'), 'ʃɔkɔla')
        self.assertEqual(sampa_to_ipa('lap5'), 'lapɛ̃')    # lapin: la-p5
        self.assertEqual(sampa_to_ipa('mEz§'), 'mɛzɔ̃')    # maison: mE-z§

    def test_unknown_char_passthrough(self):
        """Unknown characters pass through unchanged (foreign words)."""
        self.assertEqual(sampa_to_ipa('Q'), 'Q')   # Q is not in SAMPA_TO_IPA
        self.assertEqual(sampa_to_ipa('_'), '_')   # underscore not in mapping

    def test_empty_string(self):
        """Empty string returns empty string."""
        self.assertEqual(sampa_to_ipa(''), '')

    def test_mapping_coverage(self):
        """SAMPA_TO_IPA contains all expected phoneme categories."""
        # Check key phonemes are present
        for key in ['a', 'E', '5', '@', '§', 'S', 'Z', 'R', 'N']:
            self.assertIn(key, SAMPA_TO_IPA)


class TestGetSyllables(unittest.TestCase):
    """Unit tests for the get_syllables function."""

    def test_multisyllabic_word(self):
        """Words with multiple syllables split correctly."""
        # "la-p5" → first='la', last='pɛ̃'
        first, last = get_syllables('la-p5', 'lap5')
        self.assertEqual(first, 'la')
        self.assertEqual(last, 'pɛ̃')

    def test_trisyllabic_word(self):
        """Three-syllable words: first and last extracted correctly."""
        # "SO-kO-la" → first=ʃɔ, last=la
        first, last = get_syllables('SO-kO-la', 'SOkOla')
        self.assertEqual(first, 'ʃɔ')
        self.assertEqual(last, 'la')

    def test_monosyllabic_word(self):
        """Single-syllable words: first == last."""
        # "la" (no dash) → first='la', last='la'
        first, last = get_syllables('la', 'la')
        self.assertEqual(first, 'la')
        self.assertEqual(last, 'la')

    def test_syll_fallback_to_phon(self):
        """When syll is empty, falls back to phon (monosyllabic treatment)."""
        first, last = get_syllables('', 'la')
        self.assertEqual(first, 'la')
        self.assertEqual(last, 'la')

    def test_both_empty(self):
        """When both syll and phon are empty, returns empty strings."""
        first, last = get_syllables('', '')
        self.assertEqual(first, '')
        self.assertEqual(last, '')

    def test_consonant_final_syllable(self):
        """Words ending with consonant syllable (edge case from Dev Notes)."""
        # "Et-R" → first=ɛt, last=ʁ
        first, last = get_syllables('Et-R', 'EtR')
        self.assertEqual(first, 'ɛt')
        self.assertEqual(last, 'ʁ')

    def test_two_syllable_maison(self):
        """'maison': mE-z§ → first='mɛ', last='zɔ̃'"""
        first, last = get_syllables('mE-z§', 'mEz§')
        self.assertEqual(first, 'mɛ')
        self.assertEqual(last, 'zɔ̃')


class TestGraphStructure(unittest.TestCase):
    """Integration tests against the generated graph.json."""

    @classmethod
    def setUpClass(cls):
        """Load graph.json once for all tests."""
        graph_path = Path("public/graph.json")
        if not graph_path.exists():
            raise unittest.SkipTest(
                "public/graph.json not found — run build_graph.py first"
            )
        with open(graph_path, 'r', encoding='utf-8') as f:
            cls.graph = json.load(f)

        dictionary_path = Path("public/dictionary.json")
        if dictionary_path.exists():
            with open(dictionary_path, 'r', encoding='utf-8') as f:
                cls.dictionary = json.load(f)
        else:
            cls.dictionary = {}

    def test_graph_not_empty(self):
        """Graph has a reasonable number of keys."""
        self.assertGreater(len(self.graph), 100, "Graph should have >100 syllable keys")

    def test_all_keys_have_min_continuations(self):
        """Every key in the graph has >= 2 words (FR32 requirement)."""
        for syllable, words in self.graph.items():
            self.assertGreaterEqual(
                len(words), 2,
                f"Key '{syllable}' has only {len(words)} word(s) — minimum is 2"
            )

    def test_all_words_in_dictionary(self):
        """Every word in graph values exists in dictionary.json (AC1)."""
        if not self.dictionary:
            self.skipTest("dictionary.json not loaded")
        errors = []
        for syllable, words in self.graph.items():
            for word in words:
                if word not in self.dictionary:
                    errors.append(f"'{word}' in graph['{syllable}'] not in dictionary")
        self.assertEqual(errors, [], f"Found {len(errors)} words not in dictionary: {errors[:3]}")

    def test_la_key_exists(self):
        """'la' key exists in graph (AC3 — last syllable of 'chocolat')."""
        self.assertIn('la', self.graph, "'la' syllable key missing from graph")

    def test_la_key_has_la_words(self):
        """'la' key contains 'lapin' and words starting with the 'la' sound (AC3)."""
        self.assertIn('la', self.graph)
        la_words = self.graph['la']
        # AC3 explicitly requires 'lapin' to be present
        self.assertIn(
            'lapin', la_words,
            f"AC3: 'lapin' must be in graph['la']. Got: {la_words[:5]}"
        )
        # Also verify words starting with 'la' are present (phonetic match)
        la_starting = [w for w in la_words if w.startswith('la')]
        self.assertGreater(
            len(la_starting), 0,
            f"graph['la'] should contain words starting with 'la'. Got: {la_words[:5]}"
        )

    def test_all_values_are_lists(self):
        """All graph values are lists (correct JSON structure)."""
        for syllable, words in self.graph.items():
            self.assertIsInstance(words, list, f"graph['{syllable}'] should be a list")

    def test_no_empty_values(self):
        """No graph key maps to an empty list."""
        for syllable, words in self.graph.items():
            self.assertGreater(
                len(words), 0,
                f"graph['{syllable}'] is empty"
            )

    def test_file_size_nfr6_gzip(self):
        """Combined gzip size of dictionary.json + graph.json is < 5MB (NFR6 / AC2)."""
        graph_path = Path("public/graph.json")
        dictionary_path = Path("public/dictionary.json")
        if not dictionary_path.exists():
            self.skipTest("dictionary.json not found — cannot verify combined gzip size")
        combined_raw = graph_path.read_bytes() + dictionary_path.read_bytes()
        gz_size_mb = len(gzip.compress(combined_raw)) / 1024 / 1024
        self.assertLess(
            gz_size_mb, 5.0,
            f"AC2/NFR6: combined gzip size is {gz_size_mb:.3f}MB — must be < 5MB"
        )


if __name__ == '__main__':
    # Run from project root: python scripts/test_build_graph.py
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestSampaToIpa))
    suite.addTests(loader.loadTestsFromTestCase(TestGetSyllables))
    suite.addTests(loader.loadTestsFromTestCase(TestGraphStructure))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)

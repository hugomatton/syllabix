# Syllabix — Guide pour agents Claude

## Présentation

Jeu de chaîne de mots phonétique en français. Le joueur et le bot s'enchaînent des mots dont la **première syllabe IPA** doit correspondre à la **dernière syllabe IPA** du mot précédent (tolérance Levenshtein ≤ 2).

## Architecture clé

### Données runtime (`public/`)
- `dictionary.json` — mot → IPA (source: Lexique383)
- `graph.json` — last_syl_IPA → [mots valides] (graphe de continuations)
- `syllables.json` — mot → first_syl_IPA (source de vérité Lexique pour `getFirstSyllable`)

> ⚠️ `syllables.json` est généré par `python scripts/build_graph.py` — à relancer après toute modification de `build_graph.py` ou `Lexique383.tsv`.

### Moteur phonétique (`src/engine/phonetics.ts`)
- `getFirstSyllable(word, dict, graph, syllables)` — lookup `syllables.json` en priorité, fallback graph-prefix
- `getLastSyllable(word, dict, graph)` — suffixe le plus long dans les clés graph
- `validateWord(input, currentWord, dict, graph, syllables)` — validation en étapes :
  0. Blacklist (`BLACKLIST`)
  1. Dictionnaire
  1bis. Inflexions bidirectionnelles (pluriel/féminin du mot courant)
  2. Syllabe cible (last_syl du currentWord)
  3. Distance Levenshtein ≤ `PHONETIC_TOLERANCE`

### Sélection bot (`src/engine/botSelector.ts`)
- `selectBotWord(lastSyl, graph, chain, prevWord, dictionary)` — filtre : doublons chaîne + terminaisons orthographiques + **homophones IPA** (pluriels/féminins) + **blacklist**

### Blacklist (`src/config/blacklist.ts`)
Mots exclus du jeu pour **bot et joueur** (onomatopées, formes parasites présentes dans Lexique mais indésirables en jeu). Pour ajouter un mot : ouvrir ce fichier et l'ajouter au `Set`. Tous les mots doivent être en minuscules.

Mots actuellement bloqués : `zzz`, `zzzz`, `zzzzz` (générés par Lexique, confus pour le joueur).

### Règles importantes
- `PHONETIC_TOLERANCE = 2` dans `src/config/constants.ts` — **ne pas modifier** sans discussion
- Toutes les comparaisons IPA passent par `.normalize('NFC')` et `[...str]` (voyelles nasales combinées)
- `Promise.all` obligatoire dans `dataLoader.ts` (commentaire ARC11)
- Les mots du graph sont garantis sans dead-end (≥ 2 continuations chacun)

## Commandes utiles

```bash
python scripts/build_graph.py   # Régénère graph.json + syllables.json
npm test                         # Tests Vitest (246 tests)
npm run dev                      # Dev server
```

## Ce qui N'est PAS couvert (hors scope voulu)

- Formes fléchies irrégulières (`cheval → chevaux`) — non gérées
- Mots phonétiquement corrects mais sémantiquement proches (`néfaste → fastes`) — valides par les règles
- Cas `théoricienne → neveu` : refusé à juste titre (last_syl `sjɛn`, first_syl `nə`, dist=4)

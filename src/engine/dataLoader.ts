export type GameData = {
  dictionary: Map<string, string>   // ARC2 : mot → IPA
  graph: Record<string, string[]>   // ARC2 : syllabe_IPA → mots valides
  syllables: Map<string, string>    // mot → first_syl_IPA (depuis syllables.json, Lexique)
}

export async function loadGameData(): Promise<GameData> {
  // ARC11 : Promise.all obligatoire — chargement parallèle
  const [dictResponse, graphResponse, syllablesResponse] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}dictionary.json`),
    fetch(`${import.meta.env.BASE_URL}graph.json`),
    fetch(`${import.meta.env.BASE_URL}syllables.json`),
  ])

  // Vérification explicite des erreurs HTTP (404, 500, etc.) — fetch() ne throw pas sur les erreurs HTTP
  if (!dictResponse.ok) throw new Error(`Échec du chargement du dictionnaire : ${dictResponse.status}`)
  if (!graphResponse.ok) throw new Error(`Échec du chargement du graphe : ${graphResponse.status}`)
  if (!syllablesResponse.ok) throw new Error(`Échec du chargement des syllabes : ${syllablesResponse.status}`)

  // Parallélisation du parsing JSON pour les trois fichiers
  const [dictRaw, graph, syllablesRaw] = await Promise.all([
    dictResponse.json() as Promise<Record<string, string>>,
    graphResponse.json() as Promise<Record<string, string[]>>,
    syllablesResponse.json() as Promise<Record<string, string>>,
  ])

  // Convertir les objets JSON en Map pour O(1) lookup (architecture.md#Architecture des Données Client)
  const dictionary = new Map<string, string>(Object.entries(dictRaw))
  const syllables = new Map<string, string>(Object.entries(syllablesRaw))

  return { dictionary, graph, syllables }
}

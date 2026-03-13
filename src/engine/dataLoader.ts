export type GameData = {
  dictionary: Map<string, string>   // ARC2 : mot → IPA
  graph: Record<string, string[]>   // ARC2 : syllabe_IPA → mots valides
}

export async function loadGameData(): Promise<GameData> {
  // ARC11 : Promise.all obligatoire — chargement parallèle
  const [dictResponse, graphResponse] = await Promise.all([
    fetch('/dictionary.json'),
    fetch('/graph.json'),
  ])

  // Vérification explicite des erreurs HTTP (404, 500, etc.) — fetch() ne throw pas sur les erreurs HTTP
  if (!dictResponse.ok) throw new Error(`Échec du chargement du dictionnaire : ${dictResponse.status}`)
  if (!graphResponse.ok) throw new Error(`Échec du chargement du graphe : ${graphResponse.status}`)

  // Parallélisation du parsing JSON pour les deux fichiers
  const [dictRaw, graph] = await Promise.all([
    dictResponse.json() as Promise<Record<string, string>>,
    graphResponse.json() as Promise<Record<string, string[]>>,
  ])

  // Convertir l'objet JSON en Map pour O(1) lookup (architecture.md#Architecture des Données Client)
  const dictionary = new Map<string, string>(Object.entries(dictRaw))

  return { dictionary, graph }
}

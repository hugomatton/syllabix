/**
 * Mots exclus du jeu pour les deux joueurs (bot et humain).
 * Ajouter ici tout mot présent dans le dictionnaire mais indésirable en jeu
 * (onomatopées, abréviations, formes parasites, etc.).
 * Tous les mots doivent être en minuscules.
 */
export const BLACKLIST = new Set<string>([
  'zzz',
  'zzzz',
  'zzzzz',
])

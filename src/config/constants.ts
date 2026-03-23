// Configuration du moteur phonétique et du timer
// NFR14 : Modifier PHONETIC_TOLERANCE ici suffit à changer le comportement de validation
// ARC9 : Ce fichier est ré-exporté via src/config/index.ts

export const PHONETIC_TOLERANCE = 1 // distance d'édition IPA max (Levenshtein) — abaissé de 2 à 1 (review cas 1)

// Durées du timer en secondes (FR18)
export const TIMER_EASY = 15
export const TIMER_MEDIUM = 10
export const TIMER_HARD = 6

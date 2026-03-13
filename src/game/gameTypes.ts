// src/game/gameTypes.ts
// ARC3 : State management via useReducer centralisé

import type { BonusType } from '../engine'
export type { BonusType }

export type GamePhase = 'idle' | 'playing' | 'game-over'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameState {
  phase: GamePhase
  difficulty: Difficulty
  chain: string[]           // mots joués dans l'ordre (alternance bot/joueur)
  currentWord: string       // mot actuellement affiché (proposé par le bot)
  score: number             // nombre de mots validés par le joueur
  sessionRecord: number     // meilleur score de la session (lu depuis localStorage)
  timeLeft: number          // temps restant en millisecondes
  lastError: string | null  // message d'erreur actuel (null = pas d'erreur)
  gameOverReason?: 'timeout' | 'dead-end'  // raison de fin de partie (undefined hors game-over)
  deadSyllable?: string                     // syllabe bloquante en cas de dead-end
}

export type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty; firstWord: string }
  /** scorePoints: points accordés (1 base, 2 ortho, 3 combo, 4 both). bonusType: pour audit/traçabilité uniquement — non stocké dans GameState. */
  | { type: 'SUBMIT_WORD'; word: string; isValid: boolean; error?: string; scorePoints?: number; bonusType?: BonusType }
  | { type: 'BOT_RESPOND'; word: string }
  | { type: 'TICK_TIMER'; elapsed: number }
  | { type: 'GAME_OVER'; reason: 'timeout' | 'dead-end'; deadSyllable?: string }
  | { type: 'RESTART' }

// src/game/gameReducer.ts
// ARC10 : State immutable — spread operator uniquement, jamais de mutation directe
// ARC12 : localStorage clé 'syllabix-record' — lecture une seule fois à l'init

import { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD } from '../config'
import type { GameState, GameAction, Difficulty } from './gameTypes'

function getTimerMs(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':   return TIMER_EASY   * 1000
    case 'medium': return TIMER_MEDIUM * 1000
    case 'hard':   return TIMER_HARD   * 1000
  }
}

export function createInitialState(): GameState {
  const stored = Number(localStorage.getItem('syllabix-record'))
  return {
    phase: 'idle',
    difficulty: 'medium',
    chain: [],
    currentWord: '',
    score: 0,
    sessionRecord: isNaN(stored) ? 0 : stored,
    timeLeft: TIMER_MEDIUM * 1000,
    lastError: null,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      if (state.phase === 'playing') return state
      return {
        ...state,
        phase: 'playing',
        difficulty: action.difficulty,
        chain: [action.firstWord],
        currentWord: action.firstWord,
        score: 0,
        lastError: null,
        timeLeft: getTimerMs(action.difficulty),
        gameOverReason: undefined,
        deadSyllable: undefined,
      }

    case 'SUBMIT_WORD':
      if (state.phase !== 'playing') return state
      if (!action.isValid) {
        return {
          ...state,
          lastError: action.error ?? 'Mot invalide',
        }
      }
      return {
        ...state,
        chain: [...state.chain, action.word],
        score: state.score + (action.scorePoints ?? 1),
        lastError: null,
      }

    case 'BOT_RESPOND':
      if (state.phase !== 'playing') return state
      return {
        ...state,
        chain: [...state.chain, action.word],
        currentWord: action.word,
        timeLeft: getTimerMs(state.difficulty),
      }

    case 'TICK_TIMER':
      if (state.phase !== 'playing') return state
      return {
        ...state,
        timeLeft: Math.max(0, state.timeLeft - action.elapsed),
      }

    case 'GAME_OVER': {
      if (state.phase !== 'playing') return state
      const newRecord = Math.max(state.sessionRecord, state.score)
      if (newRecord > state.sessionRecord) {
        localStorage.setItem('syllabix-record', String(newRecord))
      }
      return {
        ...state,
        phase: 'game-over',
        sessionRecord: newRecord,
        gameOverReason: action.reason,
        deadSyllable: action.deadSyllable,
      }
    }

    case 'RESTART':
      return {
        ...createInitialState(),
        sessionRecord: state.sessionRecord,
      }

    default:
      return state
  }
}

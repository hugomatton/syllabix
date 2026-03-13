// src/hooks/useGameState.ts
import { useReducer } from 'react'
import type { Dispatch } from 'react'
import { gameReducer, createInitialState } from '../game'
import type { GameState, GameAction } from '../game'

export function useGameState(): { state: GameState; dispatch: Dispatch<GameAction> } {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState())
  return { state, dispatch }
}

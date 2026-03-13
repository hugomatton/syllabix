// src/game/index.ts
export type { GamePhase, Difficulty, GameState, GameAction } from './gameTypes'
export { gameReducer, createInitialState } from './gameReducer'
export type { TimerHandle } from './timer'
export { createTimer } from './timer'

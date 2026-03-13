// src/game/gameReducer.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { gameReducer, createInitialState } from './gameReducer'
import type { GameState } from './gameTypes'
import { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD } from '../config'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('gameReducer', () => {
  let baseState: GameState

  beforeEach(() => {
    localStorageMock.clear()
    baseState = {
      phase: 'idle',
      difficulty: 'medium',
      chain: [],
      currentWord: '',
      score: 0,
      sessionRecord: 0,
      timeLeft: TIMER_MEDIUM * 1000,
      lastError: null,
    }
  })

  // T6.1 — Initial state
  it('createInitialState : phase idle, score 0, chain vide', () => {
    const state = createInitialState()
    expect(state.phase).toBe('idle')
    expect(state.score).toBe(0)
    expect(state.chain).toEqual([])
    expect(state.currentWord).toBe('')
    expect(state.lastError).toBeNull()
    expect(state.difficulty).toBe('medium')
    expect(state.timeLeft).toBe(TIMER_MEDIUM * 1000)
    expect(state.sessionRecord).toBe(0)
  })

  it('createInitialState : sessionRecord lu depuis localStorage', () => {
    localStorageMock.setItem('syllabix-record', '42')
    const state = createInitialState()
    expect(state.sessionRecord).toBe(42)
  })

  it('createInitialState : sessionRecord vaut 0 si localStorage contient une valeur non numérique', () => {
    localStorageMock.setItem('syllabix-record', 'abc')
    const state = createInitialState()
    expect(state.sessionRecord).toBe(0)
  })

  // T6.2 — START_GAME
  it('START_GAME en phase playing → state inchangé (guard)', () => {
    const playing: GameState = { ...baseState, phase: 'playing', score: 3, chain: ['chat'] }
    const next = gameReducer(playing, { type: 'START_GAME', difficulty: 'easy', firstWord: 'table' })
    expect(next).toBe(playing)
    expect(next.score).toBe(3)
  })

  it('START_GAME (easy) → phase playing, difficulty easy, timeLeft TIMER_EASY * 1000', () => {
    const next = gameReducer(baseState, { type: 'START_GAME', difficulty: 'easy', firstWord: 'chat' })
    expect(next.phase).toBe('playing')
    expect(next.difficulty).toBe('easy')
    expect(next.timeLeft).toBe(TIMER_EASY * 1000)
    expect(next.chain).toEqual(['chat'])
    expect(next.currentWord).toBe('chat')
    expect(next.score).toBe(0)
    expect(next.lastError).toBeNull()
  })

  it('START_GAME (medium) → timeLeft TIMER_MEDIUM * 1000', () => {
    const next = gameReducer(baseState, { type: 'START_GAME', difficulty: 'medium', firstWord: 'balle' })
    expect(next.timeLeft).toBe(TIMER_MEDIUM * 1000)
  })

  it('START_GAME (hard) → timeLeft TIMER_HARD * 1000', () => {
    const next = gameReducer(baseState, { type: 'START_GAME', difficulty: 'hard', firstWord: 'sac' })
    expect(next.timeLeft).toBe(TIMER_HARD * 1000)
  })

  // T6.3 — SUBMIT_WORD valide
  it('SUBMIT_WORD valide → chain+1, score+1, lastError null', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'], score: 0 }
    const next = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'table', isValid: true })
    expect(next.chain).toEqual(['chat', 'table'])
    expect(next.score).toBe(1)
    expect(next.lastError).toBeNull()
  })

  // T6.4 — SUBMIT_WORD invalide
  it('SUBMIT_WORD invalide → lastError non null, chain inchangée', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'], score: 2 }
    const next = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'xyz', isValid: false, error: 'Mot inconnu' })
    expect(next.lastError).toBe('Mot inconnu')
    expect(next.chain).toEqual(['chat'])
    expect(next.score).toBe(2)
  })

  it('SUBMIT_WORD invalide sans message → lastError "Mot invalide"', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'] }
    const next = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'xyz', isValid: false })
    expect(next.lastError).toBe('Mot invalide')
  })

  // T6.5 — BOT_RESPOND
  it('BOT_RESPOND → currentWord mis à jour, chain étendue, timer remis', () => {
    const playing: GameState = {
      ...baseState,
      phase: 'playing',
      difficulty: 'easy',
      chain: ['chat', 'table'],
      currentWord: 'table',
      timeLeft: 3000,
    }
    const next = gameReducer(playing, { type: 'BOT_RESPOND', word: 'eleve' })
    expect(next.currentWord).toBe('eleve')
    expect(next.chain).toEqual(['chat', 'table', 'eleve'])
    expect(next.timeLeft).toBe(TIMER_EASY * 1000)
  })

  // T6.6 — TICK_TIMER
  it('TICK_TIMER → timeLeft décrémenté', () => {
    const playing: GameState = { ...baseState, phase: 'playing', timeLeft: 5000 }
    const next = gameReducer(playing, { type: 'TICK_TIMER', elapsed: 100 })
    expect(next.timeLeft).toBe(4900)
  })

  it('TICK_TIMER → timeLeft ne descend pas sous 0', () => {
    const playing: GameState = { ...baseState, phase: 'playing', timeLeft: 50 }
    const next = gameReducer(playing, { type: 'TICK_TIMER', elapsed: 200 })
    expect(next.timeLeft).toBe(0)
  })

  // T6.7 — GAME_OVER timeout
  it('GAME_OVER timeout → phase game-over, gameOverReason "timeout"', () => {
    const playing: GameState = { ...baseState, phase: 'playing', score: 3, sessionRecord: 2 }
    const next = gameReducer(playing, { type: 'GAME_OVER', reason: 'timeout' })
    expect(next.phase).toBe('game-over')
    expect(next.sessionRecord).toBe(3) // score (3) > sessionRecord (2) → nouveau record
    expect(next.gameOverReason).toBe('timeout')
    expect(next.deadSyllable).toBeUndefined()
  })

  // T6.8 — GAME_OVER dead-end
  it('GAME_OVER dead-end → phase game-over, gameOverReason "dead-end"', () => {
    const playing: GameState = { ...baseState, phase: 'playing', score: 1, sessionRecord: 5 }
    const next = gameReducer(playing, { type: 'GAME_OVER', reason: 'dead-end', deadSyllable: 'tion' })
    expect(next.phase).toBe('game-over')
    expect(next.sessionRecord).toBe(5) // sessionRecord (5) > score (1) → pas de nouveau record
    expect(next.gameOverReason).toBe('dead-end')
    expect(next.deadSyllable).toBe('tion')
  })

  it('GAME_OVER avec nouveau record → localStorage mis à jour', () => {
    const playing: GameState = { ...baseState, phase: 'playing', score: 10, sessionRecord: 5 }
    gameReducer(playing, { type: 'GAME_OVER', reason: 'timeout' })
    expect(localStorageMock.getItem('syllabix-record')).toBe('10')
  })

  it('GAME_OVER sans nouveau record → localStorage non modifié', () => {
    localStorageMock.setItem('syllabix-record', '7')
    const playing: GameState = { ...baseState, phase: 'playing', score: 3, sessionRecord: 7 }
    gameReducer(playing, { type: 'GAME_OVER', reason: 'timeout' })
    expect(localStorageMock.getItem('syllabix-record')).toBe('7')
  })

  it('GAME_OVER avec score égal au sessionRecord → localStorage non modifié', () => {
    localStorageMock.setItem('syllabix-record', '5')
    const playing: GameState = { ...baseState, phase: 'playing', score: 5, sessionRecord: 5 }
    gameReducer(playing, { type: 'GAME_OVER', reason: 'timeout' })
    expect(localStorageMock.getItem('syllabix-record')).toBe('5')
  })

  it('START_GAME réinitialise gameOverReason et deadSyllable', () => {
    const gameOver: GameState = { ...baseState, phase: 'game-over', gameOverReason: 'timeout', deadSyllable: 'tion' }
    const next = gameReducer(gameOver, { type: 'START_GAME', difficulty: 'easy', firstWord: 'chat' })
    expect(next.gameOverReason).toBeUndefined()
    expect(next.deadSyllable).toBeUndefined()
  })

  // T6.9 — RESTART
  it('RESTART → chain vide, score 0, phase idle, sessionRecord préservé', () => {
    const gameOver: GameState = {
      ...baseState,
      phase: 'game-over',
      chain: ['chat', 'table'],
      score: 5,
      sessionRecord: 10,
      currentWord: 'table',
      lastError: 'Temps écoulé',
    }
    const next = gameReducer(gameOver, { type: 'RESTART' })
    expect(next.phase).toBe('idle')
    expect(next.chain).toEqual([])
    expect(next.score).toBe(0)
    expect(next.sessionRecord).toBe(10) // préservé
    expect(next.lastError).toBeNull()
  })

  // T6.10 — Immutabilité
  it('immutabilité : le state original n\'est pas muté par SUBMIT_WORD', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'], score: 0 }
    const originalChain = playing.chain
    gameReducer(playing, { type: 'SUBMIT_WORD', word: 'table', isValid: true })
    expect(playing.chain).toBe(originalChain)
    expect(playing.chain).toEqual(['chat'])
    expect(playing.score).toBe(0)
  })

  it('immutabilité : le state original n\'est pas muté par BOT_RESPOND', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'] }
    const originalChain = playing.chain
    gameReducer(playing, { type: 'BOT_RESPOND', word: 'table' })
    expect(playing.chain).toBe(originalChain)
    expect(playing.chain).toEqual(['chat'])
  })

  it('immutabilité : le state original n\'est pas muté par START_GAME', () => {
    const originalPhase = baseState.phase
    gameReducer(baseState, { type: 'START_GAME', difficulty: 'easy', firstWord: 'chat' })
    expect(baseState.phase).toBe(originalPhase)
  })

  it('immutabilité : le state original n\'est pas muté par TICK_TIMER', () => {
    const playing: GameState = { ...baseState, phase: 'playing', timeLeft: 5000 }
    gameReducer(playing, { type: 'TICK_TIMER', elapsed: 100 })
    expect(playing.timeLeft).toBe(5000)
  })

  it('immutabilité : le state original n\'est pas muté par GAME_OVER', () => {
    const playing: GameState = { ...baseState, phase: 'playing', score: 3 }
    gameReducer(playing, { type: 'GAME_OVER', reason: 'timeout' })
    expect(playing.phase).toBe('playing')
    expect(playing.score).toBe(3)
  })

  it('immutabilité : le state original n\'est pas muté par RESTART', () => {
    const gameOver: GameState = { ...baseState, phase: 'game-over', score: 5, sessionRecord: 10 }
    gameReducer(gameOver, { type: 'RESTART' })
    expect(gameOver.phase).toBe('game-over')
    expect(gameOver.score).toBe(5)
  })

  // Guards de phase
  it('SUBMIT_WORD en phase idle → state inchangé', () => {
    const next = gameReducer(baseState, { type: 'SUBMIT_WORD', word: 'chat', isValid: true })
    expect(next).toBe(baseState)
  })

  it('BOT_RESPOND en phase game-over → state inchangé', () => {
    const gameOver: GameState = { ...baseState, phase: 'game-over' }
    const next = gameReducer(gameOver, { type: 'BOT_RESPOND', word: 'chat' })
    expect(next).toBe(gameOver)
  })

  it('TICK_TIMER en phase idle → state inchangé', () => {
    const next = gameReducer(baseState, { type: 'TICK_TIMER', elapsed: 100 })
    expect(next).toBe(baseState)
  })

  // ─── Tests Story 4.3 : Bonus scorePoints (FR16, FR17) ───

  it('SUBMIT_WORD avec scorePoints=2 (bonus ortho) → score + 2', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'], score: 0 }
    const next = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'table', isValid: true, scorePoints: 2 })
    expect(next.score).toBe(2)
    expect(next.chain).toEqual(['chat', 'table'])
    expect(next.lastError).toBeNull()
  })

  it('SUBMIT_WORD avec scorePoints=3 (combo) → score + 3', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'], score: 5 }
    const next = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'table', isValid: true, scorePoints: 3 })
    expect(next.score).toBe(8)
  })

  it('SUBMIT_WORD avec scorePoints=4 (both) → score + 4', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'], score: 0 }
    const next = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'table', isValid: true, scorePoints: 4 })
    expect(next.score).toBe(4)
  })

  it('SUBMIT_WORD sans scorePoints → score + 1 (rétrocompatibilité)', () => {
    const playing: GameState = { ...baseState, phase: 'playing', chain: ['chat'], score: 3 }
    const next = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'table', isValid: true })
    expect(next.score).toBe(4)
  })

  it('SUBMIT_WORD avec scorePoints=2 ne déclenche pas record prématurément (GAME_OVER met à jour sessionRecord)', () => {
    // score=3, sessionRecord=3, +2 → score=5 > sessionRecord=3 → nouveau record attendu au GAME_OVER
    const playing: GameState = { ...baseState, phase: 'playing', score: 3, sessionRecord: 3 }
    const after = gameReducer(playing, { type: 'SUBMIT_WORD', word: 'table', isValid: true, scorePoints: 2 })
    expect(after.score).toBe(5)
    expect(after.sessionRecord).toBe(3) // sessionRecord mis à jour uniquement au GAME_OVER
    const gameOver = gameReducer(after, { type: 'GAME_OVER', reason: 'timeout' })
    expect(gameOver.sessionRecord).toBe(5) // maintenant mis à jour
  })
})

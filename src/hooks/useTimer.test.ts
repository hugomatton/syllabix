// src/hooks/useTimer.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTimer } from './useTimer'
import type { GameState } from '../game'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    difficulty: 'medium',
    chain: [],
    currentWord: 'lapin',
    score: 0,
    sessionRecord: 0,
    timeLeft: 10000,
    lastError: null,
    ...overrides,
  }
}

describe('useTimer', () => {
  let nextRafId = 0
  let pendingCallbacks: Map<number, (time: number) => void>
  let currentTime = 0

  beforeEach(() => {
    nextRafId = 0
    pendingCallbacks = new Map()
    currentTime = 0

    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      const id = nextRafId++
      pendingCallbacks.set(id, cb)
      return id
    })

    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      pendingCallbacks.delete(id)
    })

    vi.stubGlobal('performance', { now: () => currentTime })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function advanceTime(ms: number) {
    currentTime += ms
    const callbacks = [...pendingCallbacks.values()]
    pendingCallbacks.clear()
    callbacks.forEach(cb => cb(currentTime))
  }

  it('dispatche TICK_TIMER à chaque frame avec le delta correct (AC2, AC4)', () => {
    const dispatch = vi.fn()
    const state = makeState({ timeLeft: 10000 })
    renderHook(() => useTimer(dispatch, state))

    act(() => advanceTime(100))

    expect(dispatch).toHaveBeenCalledWith({ type: 'TICK_TIMER', elapsed: 100 })
  })

  it('dispatche GAME_OVER avec reason timeout quand le timer expire (AC4)', () => {
    const dispatch = vi.fn()
    const state = makeState({ timeLeft: 500 })
    renderHook(() => useTimer(dispatch, state))

    act(() => advanceTime(600))

    expect(dispatch).toHaveBeenCalledWith({ type: 'GAME_OVER', reason: 'timeout' })
  })

  it('annule le rAF au démontage du composant — aucun dispatch après unmount (AC2)', () => {
    const dispatch = vi.fn()
    const state = makeState({ timeLeft: 10000 })
    const { unmount } = renderHook(() => useTimer(dispatch, state))

    act(() => advanceTime(100))
    dispatch.mockClear()

    unmount()

    act(() => advanceTime(100))
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('arrête le timer quand la phase passe à game-over (AC4)', () => {
    const dispatch = vi.fn()
    const state1 = makeState({ phase: 'playing', timeLeft: 10000 })
    const { rerender } = renderHook(
      ({ s }: { s: GameState }) => useTimer(dispatch, s),
      { initialProps: { s: state1 } }
    )

    act(() => advanceTime(100))
    dispatch.mockClear()

    rerender({ s: makeState({ phase: 'game-over', timeLeft: 0 }) })

    act(() => advanceTime(100))
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('ne dispatche pas quand la phase est idle', () => {
    const dispatch = vi.fn()
    const state = makeState({ phase: 'idle' })
    renderHook(() => useTimer(dispatch, state))

    act(() => advanceTime(100))
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('recrée le timer quand currentWord change — reset après BOT_RESPOND (AC3)', () => {
    const dispatch = vi.fn()
    const state1 = makeState({ timeLeft: 10000, currentWord: 'lapin' })
    const { rerender } = renderHook(
      ({ s }: { s: GameState }) => useTimer(dispatch, s),
      { initialProps: { s: state1 } }
    )

    // Avancer le timer partiellement
    act(() => advanceTime(3000))
    dispatch.mockClear()

    // Simuler BOT_RESPOND : nouveau mot, timeLeft remis à la durée complète
    const state2 = makeState({ timeLeft: 10000, currentWord: 'chat' })
    rerender({ s: state2 })

    // Le timer repart de 10000ms — le delta suivant doit être ~100ms
    act(() => advanceTime(100))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TICK_TIMER', elapsed: 100 })
    )
  })
})

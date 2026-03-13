// src/game/timer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTimer } from './timer'

describe('createTimer', () => {
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
    // Exécuter les callbacks rAF en attente (snapshot avant clear)
    const callbacks = [...pendingCallbacks.values()]
    pendingCallbacks.clear()
    callbacks.forEach(cb => cb(currentTime))
  }

  it('appelle onTick avec durationMs au premier tick (0 elapsed)', () => {
    const onTick = vi.fn()
    const onExpire = vi.fn()
    const timer = createTimer(onTick, onExpire, 10000)
    timer.start()
    advanceTime(0)
    expect(onTick).toHaveBeenCalledWith(10000)
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('appelle onTick avec des valeurs décroissantes', () => {
    const ticks: number[] = []
    const timer = createTimer((t) => ticks.push(t), vi.fn(), 10000)
    timer.start()
    advanceTime(16)   // frame 1
    advanceTime(16)   // frame 2
    advanceTime(16)   // frame 3
    expect(ticks[0]).toBeCloseTo(9984, 0)
    expect(ticks[1]).toBeCloseTo(9968, 0)
    expect(ticks[2]).toBeCloseTo(9952, 0)
    expect(ticks[0] > ticks[1]).toBe(true)
  })

  it('appelle onExpire exactement une fois quand totalElapsed >= durationMs', () => {
    const onExpire = vi.fn()
    const timer = createTimer(vi.fn(), onExpire, 1000)
    timer.start()
    advanceTime(500)
    expect(onExpire).not.toHaveBeenCalled()
    advanceTime(600)  // total 1100ms > 1000ms
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('cancel() arrête la boucle', () => {
    const onTick = vi.fn()
    const timer = createTimer(onTick, vi.fn(), 10000)
    timer.start()
    advanceTime(16)
    expect(onTick).toHaveBeenCalledTimes(1)
    timer.cancel()
    advanceTime(16)
    expect(onTick).toHaveBeenCalledTimes(1)  // toujours 1 après cancel
  })

  it('onTick reçoit 0 au frame final avant expiration', () => {
    const ticks: number[] = []
    const timer = createTimer((t) => ticks.push(t), vi.fn(), 100)
    timer.start()
    advanceTime(110)  // dépasse durationMs
    expect(ticks[ticks.length - 1]).toBe(0)
  })
})

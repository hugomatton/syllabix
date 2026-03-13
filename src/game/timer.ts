// src/game/timer.ts
// ARC4 : performance.now() + requestAnimationFrame — jamais setInterval
// Utilitaire pur : zéro React, testable en isolation

export interface TimerHandle {
  start(): void
  cancel(): void
}

export function createTimer(
  onTick: (timeLeft: number) => void,
  onExpire: () => void,
  durationMs: number
): TimerHandle {
  let rafId: number | null = null
  let startTime = 0
  let totalElapsed = 0
  let expired = false

  function tick(now: number) {
    const frameDelta = now - startTime
    startTime = now  // reset startTime pour le prochain frame
    totalElapsed += frameDelta

    if (totalElapsed >= durationMs) {
      onTick(0)
      if (!expired) {
        expired = true
        onExpire()
      }
      return  // stopper la boucle
    }

    onTick(durationMs - totalElapsed)
    rafId = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (rafId !== null) cancelAnimationFrame(rafId)  // protège contre double start()
      startTime = performance.now()  // capturer le temps de départ
      totalElapsed = 0
      expired = false
      rafId = requestAnimationFrame(tick)
    },
    cancel() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },
  }
}

// src/hooks/useTimer.ts
// Intègre createTimer avec le GameState via dispatch
// Reset automatique sur BOT_RESPOND (détecté via state.currentWord)

import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import { createTimer } from '../game'
import type { GameAction, GameState } from '../game'

export function useTimer(dispatch: Dispatch<GameAction>, state: GameState): void {
  const prevTimeLeftRef = useRef<number>(state.timeLeft)
  const timerRef = useRef<ReturnType<typeof createTimer> | null>(null)

  useEffect(() => {
    // Arrêter le timer si la phase n'est pas 'playing'
    if (state.phase !== 'playing') {
      timerRef.current?.cancel()
      timerRef.current = null
      return
    }

    // Créer et démarrer un nouveau timer
    // Déclenché par : transition vers 'playing' ET changement de currentWord (BOT_RESPOND)
    prevTimeLeftRef.current = state.timeLeft

    timerRef.current?.cancel()

    timerRef.current = createTimer(
      (timeLeft) => {
        // Calculer le delta elapsed depuis le dernier tick
        const elapsed = prevTimeLeftRef.current - timeLeft
        prevTimeLeftRef.current = timeLeft

        if (elapsed > 0) {
          dispatch({ type: 'TICK_TIMER', elapsed })
        }
      },
      () => {
        // Timer expiré — déclencher GAME_OVER
        dispatch({ type: 'GAME_OVER', reason: 'timeout' })
      },
      state.timeLeft  // Utiliser le timeLeft actuel du state comme durée
    )

    timerRef.current.start()

    return () => {
      timerRef.current?.cancel()
      timerRef.current = null
    }
  }, [state.phase, state.currentWord, dispatch])
  // Dépendances : phase (transitions idle/playing/game-over) + currentWord (BOT_RESPOND reset)
  // NE PAS ajouter state.timeLeft dans les deps : cela recréerait le timer à chaque TICK_TIMER !
}

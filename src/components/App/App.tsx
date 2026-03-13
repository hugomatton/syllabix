import { createContext, useEffect, useState } from 'react'
import { loadGameData, type GameData } from '../../engine'
import { LoadingScreen, ErrorScreen } from '../shared'
import { StartScreen } from '../StartScreen'
import { GameScreen } from '../GameScreen'
import { GameOver } from '../GameOver'
import { useGameState } from '../../hooks'

export const GameDataContext = createContext<GameData | null>(null)

export function App() {
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [gameData, setGameData] = useState<GameData | null>(null)
  const { state, dispatch } = useGameState()

  useEffect(() => {
    let cancelled = false

    loadGameData()
      .then(data => {
        if (!cancelled) {
          setGameData(data)
          setLoadingState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingState('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loadingState === 'loading') return <LoadingScreen />
  if (loadingState === 'error') return <ErrorScreen message="Impossible de charger les données du jeu." />

  return (
    <GameDataContext.Provider value={gameData!}>
      {state.phase === 'idle' && <StartScreen dispatch={dispatch} />}
      {state.phase === 'playing' && <GameScreen state={state} dispatch={dispatch} />}
      {state.phase === 'game-over' && <GameOver state={state} dispatch={dispatch} />}
    </GameDataContext.Provider>
  )
}

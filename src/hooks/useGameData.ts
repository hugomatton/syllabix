import { useContext } from 'react'
import { GameDataContext } from '../components/App/App'
import type { GameData } from '../engine'

export function useGameData(): GameData {
  const ctx = useContext(GameDataContext)
  if (!ctx) throw new Error('useGameData must be used within GameDataContext.Provider')
  return ctx
}

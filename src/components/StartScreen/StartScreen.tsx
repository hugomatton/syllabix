import { useContext, useState } from 'react'
import type { Dispatch } from 'react'
import { GameDataContext } from '../App/App'
import { selectInitialWord } from '../../engine'
import type { GameAction, Difficulty } from '../../game'
import { DifficultySelector } from './DifficultySelector'
import styles from './StartScreen.module.css'

interface StartScreenProps {
  dispatch: Dispatch<GameAction>
}

export function StartScreen({ dispatch }: StartScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const gameData = useContext(GameDataContext)

  function handleStart() {
    if (!gameData) return
    const firstWord = selectInitialWord(gameData.graph, gameData.dictionary)
    dispatch({ type: 'START_GAME', difficulty, firstWord })
  }

  return (
    <main className={styles.root}>
      <div>
        <h1 className={styles.title}>Syllabix</h1>
        <p className={styles.subtitle}>Jeu de syllabes</p>
      </div>
      <p className={styles.rule}>
        Trouve un mot qui commence par la dernière syllabe du mot proposé.
      </p>
      <DifficultySelector value={difficulty} onChange={setDifficulty} />
      <button
        className={styles.playButton}
        onClick={handleStart}
        type="button"
      >
        Jouer
      </button>
    </main>
  )
}

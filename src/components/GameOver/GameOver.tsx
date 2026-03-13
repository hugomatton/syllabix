import { useState, useCallback, type Dispatch } from 'react'
import type { GameState, GameAction } from '../../game/gameTypes'
import styles from './GameOver.module.css'
import { DeadEndMessage } from './DeadEndMessage'
import { DefinitionPanel } from './DefinitionPanel'
import { WordChain } from '../GameScreen'

interface GameOverProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function GameOver({ state, dispatch }: GameOverProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  const handleWordClick = useCallback((word: string) => {
    setSelectedWord(prev => prev === word ? null : word)
  }, [])

  const handleClose = useCallback(() => setSelectedWord(null), [])

  return (
    <div className={styles.root}>
      {state.gameOverReason === 'dead-end' && state.deadSyllable && (
        <DeadEndMessage syllable={state.deadSyllable} />
      )}
      <p className={styles.label} id="gameover-score-label">Score final</p>
      <p className={styles.score} aria-labelledby="gameover-score-label">{state.score}</p>
      <p className={styles.record}>Record : {state.sessionRecord}</p>
      {state.chain.length > 0 && (
        <div className={styles.chainSection}>
          <p className={`${styles.label} ${styles.chainLabel}`}>Chaîne</p>
          <WordChain
            chain={state.chain}
            recap
            onWordClick={handleWordClick}
            selectedWord={selectedWord}
          />
        </div>
      )}
      {selectedWord !== null && (
        <DefinitionPanel
          word={selectedWord}
          onClose={handleClose}
        />
      )}
      <button
        type="button"
        className={styles.playButton}
        onClick={() => dispatch({ type: 'RESTART' })}
      >
        Rejouer
      </button>
    </div>
  )
}

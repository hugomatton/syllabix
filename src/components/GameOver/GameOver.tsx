import { useCallback, useMemo, type Dispatch } from 'react'
import type { GameState, GameAction } from '../../game/gameTypes'
import styles from './GameOver.module.css'
import { DeadEndMessage } from './DeadEndMessage'
import { WordChain } from '../GameScreen'
import { useGameData } from '../../hooks'
import { getSuggestions } from '../../engine'

interface GameOverProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function GameOver({ state, dispatch }: GameOverProps) {
  const { graph, dictionary } = useGameData()

  const handleWordClick = useCallback((word: string) => {
    window.open(`https://fr.wiktionary.org/wiki/${encodeURIComponent(word)}`, '_blank', 'noopener,noreferrer')
  }, [])

  const suggestions = useMemo(
    () => state.gameOverReason === 'timeout'
      ? getSuggestions(state.currentWord, state.chain, graph, dictionary)
      : [],
    [state.currentWord, state.chain, state.gameOverReason, graph, dictionary],
  )

  return (
    <div className={styles.root}>
      {state.gameOverReason === 'dead-end' && (
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
            selectedWord={null}
          />
        </div>
      )}
      {state.gameOverReason === 'timeout' && suggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <p className={styles.label} id="suggestions-label">Vous auriez pu jouer</p>
          <ul className={styles.suggestionsList} aria-labelledby="suggestions-label">
            {suggestions.map(word => (
              <li key={word}>
                <button
                  type="button"
                  className={styles.suggestionWord}
                  aria-label={`Voir la définition de ${word}`}
                  onClick={() => handleWordClick(word)}
                >
                  {word}
                </button>
              </li>
            ))}
          </ul>
        </div>
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

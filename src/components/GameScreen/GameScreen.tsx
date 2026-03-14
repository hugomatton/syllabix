import { useState, useRef, useEffect, type Dispatch } from 'react'
import type { GameAction, GameState, Difficulty } from '../../game'
import { useTimer, useVisualViewport } from '../../hooks'
import { TIMER_EASY, TIMER_MEDIUM, TIMER_HARD } from '../../config'
import { TimerRing } from './TimerRing'
import { BotWord } from './BotWord'
import { WordChain } from './WordChain'
import { ScoreDisplay } from './ScoreDisplay'
import { WordInput } from './WordInput'
import { RecordBurst } from './RecordBurst'
import styles from './GameScreen.module.css'

function getTotalDuration(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':   return TIMER_EASY   * 1000
    case 'medium': return TIMER_MEDIUM * 1000
    case 'hard':   return TIMER_HARD   * 1000
    default: throw new Error(`Difficulty inconnue : ${difficulty as string}`)
  }
}

interface GameScreenProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function GameScreen({ state, dispatch }: GameScreenProps) {
  useTimer(dispatch, state)
  const viewportHeight = useVisualViewport()

  const totalDuration = getTotalDuration(state.difficulty)

  const [showBurst, setShowBurst] = useState(false)
  const prevScoreRef = useRef(state.score)
  const hasBeatenRecordRef = useRef(false)
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (state.score === 0) {
      hasBeatenRecordRef.current = false
      prevScoreRef.current = 0
      return
    }
    if (!hasBeatenRecordRef.current && state.score > prevScoreRef.current && state.score > state.sessionRecord) {
      hasBeatenRecordRef.current = true
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
      setShowBurst(true)
      burstTimerRef.current = setTimeout(() => setShowBurst(false), 1500)
    }
    prevScoreRef.current = state.score
  }, [state.score, state.sessionRecord])

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
    }
  }, [])

  return (
    <main className={styles.root} style={{ height: `${viewportHeight}px`, overflow: 'hidden' }}>
      <RecordBurst active={showBurst} />
      <div className={styles.topRow}>
        <ScoreDisplay score={state.score} sessionRecord={state.sessionRecord} />
        <TimerRing timeLeft={state.timeLeft} totalDuration={totalDuration} />
      </div>
      <BotWord key={state.currentWord} word={state.currentWord} />
      <WordChain chain={state.chain} />
      <WordInput state={state} dispatch={dispatch} />
    </main>
  )
}

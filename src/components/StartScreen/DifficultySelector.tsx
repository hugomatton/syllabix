import type { KeyboardEvent } from 'react'
import type { Difficulty } from '../../game'
import styles from './DifficultySelector.module.css'

interface DifficultySelectorProps {
  value: Difficulty
  onChange: (d: Difficulty) => void
}

const DIFFICULTIES: { key: Difficulty; label: string; seconds: number }[] = [
  { key: 'easy', label: 'Facile', seconds: 15 },
  { key: 'medium', label: 'Moyen', seconds: 10 },
  { key: 'hard', label: 'Difficile', seconds: 6 },
]

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  const currentIndex = DIFFICULTIES.findIndex(d => d.key === value)

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(DIFFICULTIES[(currentIndex + 1) % DIFFICULTIES.length].key)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(DIFFICULTIES[(currentIndex - 1 + DIFFICULTIES.length) % DIFFICULTIES.length].key)
    }
  }

  return (
    <div
      className={styles.container}
      role="radiogroup"
      aria-label="Mode de difficulté"
    >
      {DIFFICULTIES.map(({ key, label, seconds }) => (
        <button
          key={key}
          role="radio"
          aria-checked={value === key}
          tabIndex={value === key ? 0 : -1}
          className={`${styles.button} ${value === key ? styles.selected : ''}`}
          onClick={() => onChange(key)}
          onKeyDown={handleKeyDown}
          type="button"
        >
          {label}
          <span className={styles.duration}>{seconds}s</span>
        </button>
      ))}
    </div>
  )
}

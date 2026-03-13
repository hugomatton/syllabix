import styles from './ScoreDisplay.module.css'

interface ScoreDisplayProps {
  score: number
  sessionRecord: number
}

export function ScoreDisplay({ score, sessionRecord }: ScoreDisplayProps) {
  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <span className={styles.label}>Score</span>
        <span
          className={styles.value}
          aria-live="polite"
          aria-label={`Score : ${score}`}
        >
          {score}
        </span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Record</span>
        <span className={styles.value} aria-label={`Record de session : ${sessionRecord}`}>
          {sessionRecord}
        </span>
      </div>
    </div>
  )
}

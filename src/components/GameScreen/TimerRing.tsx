import styles from './TimerRing.module.css'

const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface TimerRingProps {
  timeLeft: number
  totalDuration: number
}

export function TimerRing({ timeLeft, totalDuration }: TimerRingProps) {
  const fraction = totalDuration > 0 ? Math.max(0, timeLeft / totalDuration) : 0
  const offset = CIRCUMFERENCE * (1 - fraction)
  const seconds = Math.max(0, Math.ceil(timeLeft / 1000))
  const isWarning = fraction < 0.3

  return (
    <div
      className={styles.container}
      role="timer"
      aria-live="polite"
      aria-label={`Temps restant : ${seconds}s`}
      data-warning={isWarning}
    >
      <svg
        viewBox="0 0 100 100"
        className={styles.svg}
        aria-hidden="true"
      >
        <circle
          cx="50" cy="50" r={RADIUS}
          className={styles.track}
        />
        <circle
          cx="50" cy="50" r={RADIUS}
          className={`${styles.arc} ${isWarning ? styles.warning : ''}`}
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: offset,
          }}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className={styles.value} aria-hidden="true">
        {seconds}
      </span>
    </div>
  )
}

import styles from './RecordBurst.module.css'

interface RecordBurstProps {
  active: boolean
}

export function RecordBurst({ active }: RecordBurstProps) {
  if (!active) return null

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={styles.message}>Nouveau record !</span>
    </div>
  )
}

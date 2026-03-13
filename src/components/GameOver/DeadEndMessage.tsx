import styles from './DeadEndMessage.module.css'

interface DeadEndMessageProps {
  syllable: string
}

export function DeadEndMessage({ syllable }: DeadEndMessageProps) {
  return (
    <div role="status" className={styles.container}>
      <p className={styles.text}>
        Aucun mot français ne commence par <strong className={styles.syllable}>{syllable}</strong> — fin de chaîne !
      </p>
    </div>
  )
}

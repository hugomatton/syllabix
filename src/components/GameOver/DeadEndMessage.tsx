import styles from './DeadEndMessage.module.css'

interface DeadEndMessageProps {
  syllable: string | undefined
}

export function DeadEndMessage({ syllable }: DeadEndMessageProps) {
  return (
    <div role="status" className={styles.container}>
      <p className={styles.text}>
        {syllable
          ? <>Aucun mot français ne commence par <strong className={styles.syllable}>{syllable}</strong> — fin de chaîne !</>
          : <>Ce mot ne peut être suivi — fin de chaîne !</>
        }
      </p>
    </div>
  )
}

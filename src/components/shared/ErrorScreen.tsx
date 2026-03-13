import styles from './ErrorScreen.module.css'

interface ErrorScreenProps {
  message: string
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className={styles.container} role="alert">
      <p className={styles.message}>{message}</p>
    </div>
  )
}

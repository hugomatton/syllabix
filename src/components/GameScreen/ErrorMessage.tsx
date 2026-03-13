import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  id?: string
  message: string | null
}

export function ErrorMessage({ id, message }: ErrorMessageProps) {
  // Toujours rendu pour éviter le layout shift — contenu conditionnel
  // Note: aria-hidden ne doit JAMAIS être posé sur un live region (role="alert")
  return (
    <p
      id={id}
      role="alert"
      aria-live="assertive"
      className={`${styles.message}${message ? ` ${styles.visible}` : ''}`}
    >
      {message ?? ''}
    </p>
  )
}

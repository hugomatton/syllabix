import styles from './LoadingScreen.module.css'

export function LoadingScreen() {
  return (
    <div className={styles.container}>
      <p className={styles.message}>Chargement du dictionnaire…</p>
    </div>
  )
}

import styles from './BotWord.module.css'

interface BotWordProps {
  word: string
}

export function BotWord({ word }: BotWordProps) {
  return (
    <p
      className={styles.word}
      aria-live="assertive"
      aria-label={`Mot du bot : ${word}`}
    >
      {word}
    </p>
  )
}

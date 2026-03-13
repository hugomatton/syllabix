import styles from './WordChip.module.css'

interface WordChipProps {
  word: string
  isLatest?: boolean
  isBot?: boolean
  noAnimation?: boolean
  onClick?: (word: string) => void
  isSelected?: boolean
}

export function WordChip({ word, isLatest = false, isBot = false, noAnimation = false, onClick, isSelected = false }: WordChipProps) {
  const className = [
    styles.chip,
    isLatest ? styles.latest : '',
    isBot ? styles.bot : '',
    noAnimation ? styles.noAnimation : '',
    isSelected ? styles.selected : '',
  ].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onClick(word)}
        aria-label={`${word} — voir définition`}
        aria-expanded={isSelected}
      >
        {word}
      </button>
    )
  }

  return (
    <span role="listitem" className={className}>
      {word}
    </span>
  )
}

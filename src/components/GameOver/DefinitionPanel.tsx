import { useEffect, useRef } from 'react'
import styles from './DefinitionPanel.module.css'

interface DefinitionPanelProps {
  word: string
  onClose: () => void
}

export function DefinitionPanel({ word, onClose }: DefinitionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Définition de ${word}`}
      tabIndex={-1}
      className={styles.panel}
    >
      <div className={styles.header}>
        <h3 className={styles.word}>{word}</h3>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer la définition"
        >
          ✕
        </button>
      </div>
      <p className={styles.definition}>Définition non disponible</p>
    </div>
  )
}

import { useRef, useEffect } from 'react'
import { WordChip } from './WordChip'
import styles from './WordChain.module.css'

interface WordChainProps {
  chain: string[]
  recap?: boolean
  onWordClick?: (word: string) => void
  selectedWord?: string | null
}

export function WordChain({ chain, recap = false, onWordClick, selectedWord }: WordChainProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!recap && containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [chain.length, recap])

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="list"
      aria-label="Chaîne de mots"
    >
      {chain.map((word, idx) => {
        const isClickable = recap && !!onWordClick
        if (isClickable) {
          return (
            <span key={`${word}-${idx}`} role="listitem">
              <WordChip
                word={word}
                isLatest={false}
                isBot={idx % 2 === 0}
                noAnimation={true}
                onClick={onWordClick}
                isSelected={selectedWord === word}
              />
            </span>
          )
        }
        return (
          <WordChip
            key={`${word}-${idx}`}
            word={word}
            isLatest={!recap && idx === chain.length - 1}
            isBot={recap ? idx % 2 === 0 : false}
            noAnimation={recap}
          />
        )
      })}
    </div>
  )
}

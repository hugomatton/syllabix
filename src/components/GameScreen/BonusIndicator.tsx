// src/components/GameScreen/BonusIndicator.tsx
import type { BonusType } from '../../engine'
import styles from './BonusIndicator.module.css'

interface BonusIndicatorProps {
  bonusType: BonusType | null
}

const BONUS_TEXT: Record<Exclude<BonusType, 'none'>, string> = {
  ortho: '+2',
  combo: '+3 Combo !',
  both: '+4 Combo !',
}

export function BonusIndicator({ bonusType }: BonusIndicatorProps) {
  if (!bonusType || bonusType === 'none') return null

  const text = BONUS_TEXT[bonusType]
  const isCombo = bonusType === 'combo' || bonusType === 'both'

  return (
    <div
      className={`${styles.indicator} ${isCombo ? styles.combo : styles.ortho}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {text}
    </div>
  )
}

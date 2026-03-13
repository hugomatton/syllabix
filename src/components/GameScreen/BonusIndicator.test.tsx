// src/components/GameScreen/BonusIndicator.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BonusIndicator } from './BonusIndicator'

describe('BonusIndicator', () => {
  it('ne rend rien quand bonusType=null', () => {
    const { container } = render(<BonusIndicator bonusType={null} />)
    expect(container.firstChild).toBeNull()
  })

  it("ne rend rien quand bonusType='none'", () => {
    const { container } = render(<BonusIndicator bonusType="none" />)
    expect(container.firstChild).toBeNull()
  })

  it("affiche '+2' pour bonusType='ortho'", () => {
    render(<BonusIndicator bonusType="ortho" />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it("affiche '+3 Combo !' pour bonusType='combo'", () => {
    render(<BonusIndicator bonusType="combo" />)
    expect(screen.getByText('+3 Combo !')).toBeInTheDocument()
  })

  it("affiche '+4 Combo !' pour bonusType='both'", () => {
    render(<BonusIndicator bonusType="both" />)
    expect(screen.getByText('+4 Combo !')).toBeInTheDocument()
  })

  it("a role='status' et aria-live='polite' quand visible", () => {
    render(<BonusIndicator bonusType="ortho" />)
    const el = screen.getByRole('status')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-live', 'polite')
    expect(el).toHaveAttribute('aria-atomic', 'true')
  })

  it("applique la classe combo pour bonusType='combo'", () => {
    render(<BonusIndicator bonusType="combo" />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('combo')
  })

  it("applique la classe ortho pour bonusType='ortho'", () => {
    render(<BonusIndicator bonusType="ortho" />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('ortho')
  })
})

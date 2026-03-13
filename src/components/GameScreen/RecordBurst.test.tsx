import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RecordBurst } from './RecordBurst'

describe('RecordBurst', () => {
  it('ne rend rien quand active=false', () => {
    const { container } = render(<RecordBurst active={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche "Nouveau record !" quand active=true', () => {
    render(<RecordBurst active={true} />)
    expect(screen.getByText('Nouveau record !')).toBeInTheDocument()
  })

  it('a role="status" et aria-live="polite"', () => {
    render(<RecordBurst active={true} />)
    const overlay = screen.getByRole('status')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveAttribute('aria-live', 'polite')
  })

  it("l'overlay contient la classe overlay (pointer-events: none via CSS Module)", () => {
    render(<RecordBurst active={true} />)
    const overlay = screen.getByRole('status')
    expect(overlay).toBeInTheDocument()
    expect(overlay.className).toContain('overlay')
  })

  it('disparaît quand active passe de true à false', () => {
    const { rerender } = render(<RecordBurst active={true} />)
    expect(screen.getByText('Nouveau record !')).toBeInTheDocument()
    rerender(<RecordBurst active={false} />)
    expect(screen.queryByText('Nouveau record !')).not.toBeInTheDocument()
  })
})

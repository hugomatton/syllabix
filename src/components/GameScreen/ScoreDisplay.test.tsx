import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScoreDisplay } from './ScoreDisplay'

describe('ScoreDisplay', () => {
  it('affiche le score courant', () => {
    render(<ScoreDisplay score={5} sessionRecord={10} />)
    expect(screen.getByLabelText('Score : 5')).toBeInTheDocument()
  })

  it('affiche le record de session', () => {
    render(<ScoreDisplay score={5} sessionRecord={10} />)
    expect(screen.getByLabelText('Record de session : 10')).toBeInTheDocument()
  })

  it('affiche correctement des valeurs à zéro', () => {
    render(<ScoreDisplay score={0} sessionRecord={0} />)
    expect(screen.getByLabelText('Score : 0')).toBeInTheDocument()
    expect(screen.getByLabelText('Record de session : 0')).toBeInTheDocument()
  })

  it('affiche correctement de grandes valeurs', () => {
    render(<ScoreDisplay score={42} sessionRecord={99} />)
    expect(screen.getByLabelText('Score : 42')).toBeInTheDocument()
    expect(screen.getByLabelText('Record de session : 99')).toBeInTheDocument()
  })

  it('le container rend les labels Score et Record', () => {
    render(<ScoreDisplay score={5} sessionRecord={10} />)
    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('Record')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WordChain } from './WordChain'

describe('WordChain — mode jeu (recap=false)', () => {
  it('rend autant de chips que chain.length', () => {
    render(<WordChain chain={['chocolat', 'lapin', 'nuit']} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('le dernier chip a la classe "latest"', () => {
    render(<WordChain chain={['chocolat', 'lapin', 'nuit']} />)
    const chips = screen.getAllByRole('listitem')
    expect(chips[2].className).toMatch(/latest/)
  })

  it('les chips non-finaux n\'ont pas la classe "latest"', () => {
    render(<WordChain chain={['chocolat', 'lapin', 'nuit']} />)
    const chips = screen.getAllByRole('listitem')
    expect(chips[0].className).not.toMatch(/latest/)
    expect(chips[1].className).not.toMatch(/latest/)
  })

  it('aucun chip n\'a la classe "bot" en mode jeu', () => {
    render(<WordChain chain={['chocolat', 'lapin', 'nuit']} />)
    screen.getAllByRole('listitem').forEach(chip =>
      expect(chip.className).not.toMatch(/bot/)
    )
  })

  it('aucun chip n\'a la classe "noAnimation" en mode jeu', () => {
    render(<WordChain chain={['chocolat', 'lapin']} />)
    screen.getAllByRole('listitem').forEach(chip =>
      expect(chip.className).not.toMatch(/noAnimation/)
    )
  })
})

describe('WordChain — mode recap (recap=true)', () => {
  it('les chips d\'index pair (mots du bot) ont la classe "bot"', () => {
    render(<WordChain chain={['chocolat', 'lapin', 'nuit']} recap />)
    const chips = screen.getAllByRole('listitem')
    expect(chips[0].className).toMatch(/bot/) // index 0 → bot
    expect(chips[2].className).toMatch(/bot/) // index 2 → bot
  })

  it('les chips d\'index impair (mots du joueur) n\'ont pas la classe "bot"', () => {
    render(<WordChain chain={['chocolat', 'lapin', 'nuit']} recap />)
    const chips = screen.getAllByRole('listitem')
    expect(chips[1].className).not.toMatch(/bot/) // index 1 → joueur
  })

  it('aucun chip n\'a la classe "latest" en mode recap', () => {
    render(<WordChain chain={['chocolat', 'lapin']} recap />)
    screen.getAllByRole('listitem').forEach(chip =>
      expect(chip.className).not.toMatch(/latest/)
    )
  })

  it('tous les chips ont la classe "noAnimation" en mode recap', () => {
    render(<WordChain chain={['chocolat', 'lapin', 'nuit']} recap />)
    screen.getAllByRole('listitem').forEach(chip =>
      expect(chip.className).toMatch(/noAnimation/)
    )
  })
})

describe('WordChain — accessibilité', () => {
  it('a role="list" et aria-label="Chaîne de mots"', () => {
    render(<WordChain chain={['chocolat']} />)
    const list = screen.getByRole('list', { name: 'Chaîne de mots' })
    expect(list).toHaveAttribute('aria-label', 'Chaîne de mots')
  })

  it('rend une liste vide quand chain est vide', () => {
    render(<WordChain chain={[]} />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})

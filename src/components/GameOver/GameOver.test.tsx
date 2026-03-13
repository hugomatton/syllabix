import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GameOver } from './GameOver'
import { DeadEndMessage } from './DeadEndMessage'
import type { GameState } from '../../game/gameTypes'

const mockDispatch = vi.fn()

const baseState: GameState = {
  phase: 'game-over',
  difficulty: 'medium',
  chain: ['chocolat', 'lapin'],
  currentWord: 'lapin',
  score: 7,
  sessionRecord: 12,
  timeLeft: 0,
  lastError: null,
  gameOverReason: 'timeout',
}

function renderGameOver(state = baseState) {
  return render(<GameOver state={state} dispatch={mockDispatch} />)
}

describe('GameOver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('T5.1.1 — affiche le score final de façon proéminente', () => {
    renderGameOver()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('T5.1.2 — affiche le record de session', () => {
    renderGameOver()
    expect(screen.getByText(/12/)).toBeInTheDocument()
  })

  it('T5.1.3 — affiche le bouton "Rejouer"', () => {
    renderGameOver()
    expect(screen.getByRole('button', { name: /rejouer/i })).toBeInTheDocument()
  })

  it('T5.1.4 — clic "Rejouer" dispatche RESTART', () => {
    renderGameOver()
    fireEvent.click(screen.getByRole('button', { name: /rejouer/i }))
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESTART' })
    expect(mockDispatch).toHaveBeenCalledTimes(1)
  })

  it('T5.1.5 — bouton "Rejouer" a la classe playButton appliquée (contract CSS min-height 44px — UX8)', () => {
    // JSDOM ne calcule pas les valeurs CSS réelles → test de contrat de classe CSS
    // La règle min-height: 44px est déclarée dans GameOver.module.css (.playButton)
    renderGameOver()
    const btn = screen.getByRole('button', { name: /rejouer/i })
    expect(btn.className).toMatch(/playButton/)
  })

  it('T5.1.6 — score 0 affiché correctement', () => {
    renderGameOver({ ...baseState, score: 0 })
    // "0" must appear in the document
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })

  it('T5.1.7 — score et record affichés correctement quand le record est inférieur au score', () => {
    renderGameOver({ ...baseState, score: 15, sessionRecord: 10 })
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/10/)).toBeInTheDocument()
  })

  it('T5.2.1 — DeadEndMessage affiché quand gameOverReason === "dead-end"', () => {
    renderGameOver({ ...baseState, gameOverReason: 'dead-end', deadSyllable: 'wɪtʃ' })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/Aucun mot français ne commence par/)).toBeInTheDocument()
  })

  it('T5.2.2 — la syllabe bloquante apparaît dans le message', () => {
    renderGameOver({ ...baseState, gameOverReason: 'dead-end', deadSyllable: 'wɪtʃ' })
    expect(screen.getByText('wɪtʃ')).toBeInTheDocument()
  })

  it('T5.2.3 — DeadEndMessage absent quand gameOverReason === "timeout"', () => {
    renderGameOver({ ...baseState, gameOverReason: 'timeout' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('T5.2.5 — DeadEndMessage absent quand gameOverReason === "dead-end" mais deadSyllable undefined', () => {
    renderGameOver({ ...baseState, gameOverReason: 'dead-end', deadSyllable: undefined })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('DeadEndMessage', () => {
  it('T5.2.4 — role="status" présent sur le composant', () => {
    render(<DeadEndMessage syllable="ba" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('WordChain recap in GameOver (T5.3)', () => {
  it('T5.3.1 — WordChain affiché quand la chaîne est non-vide', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    expect(screen.getByRole('list', { name: /chaîne de mots/i })).toBeInTheDocument()
  })

  it('T5.3.2 — les chips contiennent les bons mots', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin', 'nuit'] })
    expect(screen.getByText('chocolat')).toBeInTheDocument()
    expect(screen.getByText('lapin')).toBeInTheDocument()
    expect(screen.getByText('nuit')).toBeInTheDocument()
  })

  it('T5.3.3 — WordChain non-affiché si la chaîne est vide', () => {
    renderGameOver({ ...baseState, chain: [] })
    expect(screen.queryByRole('list', { name: /chaîne de mots/i })).not.toBeInTheDocument()
  })

  it('T5.3.4 — WordChain a role="list" et aria-label="Chaîne de mots"', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    const list = screen.getByRole('list', { name: 'Chaîne de mots' })
    expect(list).toBeInTheDocument()
    expect(list).toHaveAttribute('aria-label', 'Chaîne de mots')
  })

  it('T5.3.5 — chips d\'index pair (bot) ont la classe "bot", index impair (joueur) non', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin', 'nuit'] })
    // Les chips en recap sont des <button> — queryable via aria-label
    const chips = screen.getAllByRole('button', { name: /voir définition/i })
    expect(chips[0].className).toMatch(/bot/)   // index 0 → bot
    expect(chips[1].className).not.toMatch(/bot/) // index 1 → joueur
    expect(chips[2].className).toMatch(/bot/)   // index 2 → bot
  })
})

describe('DefinitionPanel in GameOver (T5.4)', () => {
  it('T5.4.1 — DefinitionPanel absent au montage (aucun chip sélectionné)', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('T5.4.2 — clic sur un chip ouvre le panel avec le bon mot', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    fireEvent.click(screen.getByRole('button', { name: /chocolat — voir définition/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Définition de chocolat')
  })

  it('T5.4.3 — clic sur le même chip ferme le panel (toggle)', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    const chip = screen.getByRole('button', { name: /chocolat — voir définition/i })
    fireEvent.click(chip)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(chip)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('T5.4.4 — clic sur un chip différent remplace le panel (un seul panel à la fois)', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    fireEvent.click(screen.getByRole('button', { name: /chocolat — voir définition/i }))
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Définition de chocolat')
    fireEvent.click(screen.getByRole('button', { name: /lapin — voir définition/i }))
    expect(screen.queryAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Définition de lapin')
  })

  it('T5.4.5 — clic sur le bouton "Fermer" ferme le panel', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    fireEvent.click(screen.getByRole('button', { name: /chocolat — voir définition/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /fermer la définition/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('T5.4.6 — le panel affiche "Définition non disponible" en V1', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    fireEvent.click(screen.getByRole('button', { name: /chocolat — voir définition/i }))
    expect(screen.getByText('Définition non disponible')).toBeInTheDocument()
  })

  it('T5.4.7 — touche Escape ferme le panel', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    fireEvent.click(screen.getByRole('button', { name: /chocolat — voir définition/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('T5.4.8 — chips ont aria-expanded="true" quand sélectionnés', () => {
    renderGameOver({ ...baseState, chain: ['chocolat', 'lapin'] })
    const chip = screen.getByRole('button', { name: /chocolat — voir définition/i })
    expect(chip).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-expanded', 'true')
  })
})

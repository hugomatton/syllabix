import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameDataContext } from '../App/App'
import { StartScreen } from './StartScreen'

const mockDispatch = vi.fn()
const mockGameData = {
  dictionary: new Map([['chocolat', 'ʃɔkɔla']]),
  graph: { la: ['lapin', 'lac'] },
}

vi.mock('../../engine', () => ({
  selectInitialWord: vi.fn(() => 'chocolat'),
  loadGameData: vi.fn(),
}))

function renderStartScreen() {
  return render(
    <GameDataContext.Provider value={mockGameData}>
      <StartScreen dispatch={mockDispatch} />
    </GameDataContext.Provider>,
  )
}

describe('StartScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('T7.1 — affiche le titre "Syllabix" en h1', () => {
    renderStartScreen()
    const heading = screen.getByRole('heading', { level: 1, name: 'Syllabix' })
    expect(heading).toBeInTheDocument()
  })

  it('T7.2 — affiche la règle phonétique', () => {
    renderStartScreen()
    expect(
      screen.getByText(
        'Trouve un mot qui commence par la dernière syllabe du mot proposé.',
      ),
    ).toBeInTheDocument()
  })

  it('T7.3 — DifficultySelector affiche 3 boutons', () => {
    renderStartScreen()
    const radioGroup = screen.getByRole('radiogroup')
    expect(radioGroup).toBeInTheDocument()
    const difficultyButtons = within(radioGroup).getAllByRole('radio')
    expect(difficultyButtons).toHaveLength(3)
  })

  it('T7.4 — "Moyen" est sélectionné par défaut', () => {
    renderStartScreen()
    const radioGroup = screen.getByRole('radiogroup')
    const radios = within(radioGroup).getAllByRole('radio')
    const moyenRadio = radios.find((b) => b.textContent?.includes('Moyen'))
    expect(moyenRadio).toBeDefined()
    expect(moyenRadio).toHaveAttribute('aria-checked', 'true')
  })

  it('T7.5 — clic "Jouer" dispatche START_GAME avec difficulty medium par défaut', () => {
    renderStartScreen()
    fireEvent.click(screen.getByText('Jouer'))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'START_GAME',
      difficulty: 'medium',
      firstWord: 'chocolat',
    })
  })

  it('T7.6 — changer en Difficile puis cliquer "Jouer" dispatche START_GAME avec hard', () => {
    renderStartScreen()
    const radioGroup = screen.getByRole('radiogroup')
    const difficileButton = within(radioGroup).getAllByRole('radio').find((b) =>
      b.textContent?.includes('Difficile'),
    )
    fireEvent.click(difficileButton!)
    fireEvent.click(screen.getByText('Jouer'))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'START_GAME',
      difficulty: 'hard',
      firstWord: 'chocolat',
    })
  })

  it('T7.7 — ArrowRight depuis Moyen sélectionne Difficile', () => {
    renderStartScreen()
    const radioGroup = screen.getByRole('radiogroup')
    const moyenRadio = within(radioGroup).getAllByRole('radio').find((b) =>
      b.textContent?.includes('Moyen'),
    )!
    fireEvent.keyDown(moyenRadio, { key: 'ArrowRight' })
    const difficileRadio = within(radioGroup).getAllByRole('radio').find((b) =>
      b.textContent?.includes('Difficile'),
    )!
    expect(difficileRadio).toHaveAttribute('aria-checked', 'true')
  })

  it('T7.8 — ArrowLeft depuis Moyen sélectionne Facile', () => {
    renderStartScreen()
    const radioGroup = screen.getByRole('radiogroup')
    const moyenRadio = within(radioGroup).getAllByRole('radio').find((b) =>
      b.textContent?.includes('Moyen'),
    )!
    fireEvent.keyDown(moyenRadio, { key: 'ArrowLeft' })
    const facileRadio = within(radioGroup).getAllByRole('radio').find((b) =>
      b.textContent?.includes('Facile'),
    )!
    expect(facileRadio).toHaveAttribute('aria-checked', 'true')
  })
})

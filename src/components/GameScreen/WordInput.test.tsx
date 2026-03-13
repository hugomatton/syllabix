import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WordInput } from './WordInput'
import { GameDataContext } from '../App/App'
import type { GameState } from '../../game'

// Mock useTimer — pattern établi en 3.5
vi.mock('../../hooks', () => ({
  useTimer: vi.fn(),
  useGameState: vi.fn(() => ({
    state: {
      phase: 'idle',
      difficulty: 'medium',
      chain: [],
      currentWord: '',
      score: 0,
      sessionRecord: 0,
      timeLeft: 0,
      lastError: null,
    },
    dispatch: vi.fn(),
  })),
  useGameData: vi.fn(),
}))

// Mock sons — AudioContext n'existe pas en jsdom
vi.mock('./sounds', () => ({
  playSuccessSound: vi.fn(),
  playErrorSound: vi.fn(),
}))

// Mock engine — contrôler les résultats de validation
vi.mock('../../engine', () => ({
  validateWord: vi.fn(),
  getLastSyllable: vi.fn(),
  selectBotWord: vi.fn(),
  selectInitialWord: vi.fn(),
  loadGameData: vi.fn(),
}))

import { validateWord, getLastSyllable, selectBotWord } from '../../engine'

const mockDispatch = vi.fn()

const mockGameData = {
  dictionary: new Map([['chocolat', 'ʃɔkɔla'], ['lapin', 'lapɛ̃'], ['sandwich', 'sɑ̃dwitʃ']]),
  graph: {
    'la': ['lapin', 'lavabo'],
    'pɛ̃': ['pingouin'],
    'wich': [],
  },
}

const mockState: GameState = {
  phase: 'playing',
  difficulty: 'medium',
  chain: ['chocolat'],
  currentWord: 'chocolat',
  score: 0,
  sessionRecord: 0,
  timeLeft: 10000,
  lastError: null,
}

function renderWordInput(stateOverride?: Partial<GameState>) {
  const state = { ...mockState, ...stateOverride }
  return render(
    <GameDataContext.Provider value={mockGameData as never}>
      <WordInput state={state} dispatch={mockDispatch} />
    </GameDataContext.Provider>
  )
}

function typeInInput(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } })
}

describe('WordInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // T10.2 — Autofocus
  it('T10.2 — a le focus automatique au rendu', () => {
    renderWordInput()
    const input = screen.getByRole('textbox')
    expect(document.activeElement).toBe(input)
  })

  it('T10.2b — a les attributs d\'accessibilité corrects', () => {
    renderWordInput()
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('inputmode', 'text')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('autocorrect', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
    expect(input).toHaveAttribute('aria-label', 'Tape ton mot')
  })

  // T10.3 — Soumission valide (sans bonus)
  it('T10.3 — soumet un mot valide → SUBMIT_WORD avec scorePoints:1 bonusType:none puis BOT_RESPOND', () => {
    vi.mocked(validateWord).mockReturnValue({ valid: true, reason: null, bonusType: 'none', scorePoints: 1 })
    vi.mocked(getLastSyllable).mockReturnValue('la')
    vi.mocked(selectBotWord).mockReturnValue('lapin')

    renderWordInput()
    const input = screen.getByRole('textbox')
    typeInInput(input, 'lapin')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT_WORD', word: 'lapin', isValid: true, scorePoints: 1, bonusType: 'none' })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'BOT_RESPOND', word: 'lapin' })
  })

  // T10.3b — Soumission valide avec bonus ortho
  it('T10.3b — bonus ortho → SUBMIT_WORD scorePoints:2 bonusType:ortho + BonusIndicator "+2" affiché', async () => {
    vi.useFakeTimers()
    vi.mocked(validateWord).mockReturnValue({ valid: true, reason: null, bonusType: 'ortho', scorePoints: 2 })
    vi.mocked(getLastSyllable).mockReturnValue('la')
    vi.mocked(selectBotWord).mockReturnValue('lapin')

    renderWordInput()
    const input = screen.getByRole('textbox')
    typeInInput(input, 'lapin')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT_WORD', word: 'lapin', isValid: true, scorePoints: 2, bonusType: 'ortho' })
    expect(screen.getByText('+2')).toBeInTheDocument()

    // Indicateur disparaît après 1.5s
    act(() => { vi.advanceTimersByTime(1500) })
    expect(screen.queryByText('+2')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  // T10.7 — Input vidé et re-focus après soumission réussie (AC7)
  it('T10.7 — input vidé et re-focus après soumission réussie', () => {
    vi.mocked(validateWord).mockReturnValue({ valid: true, reason: null, bonusType: 'none', scorePoints: 1 })
    vi.mocked(getLastSyllable).mockReturnValue('la')
    vi.mocked(selectBotWord).mockReturnValue('lapin')

    renderWordInput()
    const input = screen.getByRole('textbox') as HTMLInputElement
    typeInInput(input, 'lapin')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(input.value).toBe('')
    expect(document.activeElement).toBe(input)
  })

  // T10.4 — Mot hors dictionnaire
  it('T10.4 — mot hors dictionnaire → SUBMIT_WORD isValid:false + message "Mot non reconnu"', () => {
    vi.mocked(validateWord).mockReturnValue({ valid: false, reason: 'not-in-dictionary', bonusType: 'none', scorePoints: 1 })
    vi.mocked(getLastSyllable).mockReturnValue('la')

    renderWordInput()
    const input = screen.getByRole('textbox')
    typeInInput(input, 'blabla')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SUBMIT_WORD',
      word: 'blabla',
      isValid: false,
      error: 'Mot non reconnu dans le dictionnaire',
    })

    expect(screen.getByText(/Mot non reconnu dans le dictionnaire/i)).toBeInTheDocument()
  })

  // T10.5 — Mauvaise syllabe
  it('T10.5 — mauvaise syllabe → message "Ne commence pas par..."', () => {
    vi.mocked(validateWord).mockReturnValue({ valid: false, reason: 'wrong-syllable', bonusType: 'none', scorePoints: 1 })
    vi.mocked(getLastSyllable).mockReturnValue('la')

    renderWordInput()
    const input = screen.getByRole('textbox')
    typeInInput(input, 'tortue')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText(/Ne commence pas par la/i)).toBeInTheDocument()
  })

  // T10.6 — Dead-end
  it('T10.6 — dead-end → GAME_OVER reason:dead-end', () => {
    vi.mocked(validateWord).mockReturnValue({ valid: true, reason: null, bonusType: 'none', scorePoints: 1 })
    vi.mocked(getLastSyllable).mockReturnValue('wich')
    vi.mocked(selectBotWord).mockReturnValue(null) // dead-end

    renderWordInput()
    const input = screen.getByRole('textbox')
    typeInInput(input, 'sandwich')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT_WORD', word: 'sandwich', isValid: true, scorePoints: 1, bonusType: 'none' })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'GAME_OVER',
      reason: 'dead-end',
      deadSyllable: 'wich',
    })
  })

  // T10.8 — Message d'erreur disparaît après 2s
  it('T10.8 — message d\'erreur disparaît après 2s', () => {
    vi.useFakeTimers()
    vi.mocked(validateWord).mockReturnValue({ valid: false, reason: 'not-in-dictionary', bonusType: 'none', scorePoints: 1 })
    vi.mocked(getLastSyllable).mockReturnValue(null)

    renderWordInput()
    const input = screen.getByRole('textbox')
    typeInInput(input, 'blabla')
    fireEvent.keyDown(input, { key: 'Enter' })

    // Message présent
    expect(screen.getByText(/Mot non reconnu/i)).toBeInTheDocument()

    // Avancer le timer de 2s
    act(() => { vi.advanceTimersByTime(2000) })

    // Message disparu (le texte devient vide)
    expect(screen.queryByText(/Mot non reconnu/i)).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('message d\'erreur disparaît dès la prochaine frappe', () => {
    vi.mocked(validateWord).mockReturnValue({ valid: false, reason: 'not-in-dictionary', bonusType: 'none', scorePoints: 1 })
    vi.mocked(getLastSyllable).mockReturnValue(null)

    renderWordInput()
    const input = screen.getByRole('textbox')
    typeInInput(input, 'blabla')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText(/Mot non reconnu/i)).toBeInTheDocument()

    // Taper un nouveau caractère
    fireEvent.change(input, { target: { value: 'b' } })

    expect(screen.queryByText(/Mot non reconnu/i)).not.toBeInTheDocument()
  })

  it('soumission vide ne dispatche rien', () => {
    renderWordInput()
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})

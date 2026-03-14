import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameScreen } from './GameScreen'
import { GameDataContext } from '../App/App'
import { useTimer } from '../../hooks'
import type { GameState } from '../../game'

// ⚠️ CRITIQUE : mocker useTimer pour éviter rAF + dispatch dans les tests
vi.mock('../../hooks', () => ({
  useTimer: vi.fn(),
  useVisualViewport: vi.fn(() => 800),
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

const mockDispatch = vi.fn()

const mockState: GameState = {
  phase: 'playing',
  difficulty: 'medium',
  chain: ['chocolat', 'lapin'],
  currentWord: 'lapin',
  score: 1,
  sessionRecord: 5,
  timeLeft: 8000,
  lastError: null,
}

const mockGameData = {
  dictionary: new Map([['chocolat', 'ʃɔkɔla'], ['lapin', 'lapɛ̃']]),
  graph: { 'pɛ̃': ['pingouin'] },
}

function renderGameScreen(stateOverride?: Partial<GameState>) {
  const state = { ...mockState, ...stateOverride }
  return render(
    <GameDataContext.Provider value={mockGameData as never}>
      <GameScreen state={state} dispatch={mockDispatch} />
    </GameDataContext.Provider>
  )
}

describe('GameScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('T10.1 — appelle useTimer avec dispatch et state', () => {
    const state = { ...mockState }
    render(
      <GameDataContext.Provider value={mockGameData as never}>
        <GameScreen state={state} dispatch={mockDispatch} />
      </GameDataContext.Provider>
    )
    expect(vi.mocked(useTimer)).toHaveBeenCalledWith(
      mockDispatch,
      expect.objectContaining({ phase: 'playing' })
    )
  })

  it('T10.2 — affiche le currentWord via BotWord', () => {
    renderGameScreen()
    expect(screen.getByLabelText('Mot du bot : lapin')).toBeInTheDocument()
  })

  it('T10.3 — affiche le score courant via ScoreDisplay', () => {
    renderGameScreen()
    expect(screen.getByLabelText('Score : 1')).toBeInTheDocument()
  })

  it('T10.3b — affiche le record de session via ScoreDisplay', () => {
    renderGameScreen()
    expect(screen.getByLabelText('Record de session : 5')).toBeInTheDocument()
  })

  it('T10.4 — WordChain rend autant de chips que chain.length', () => {
    renderGameScreen()
    const chips = screen.getAllByRole('listitem')
    expect(chips).toHaveLength(2) // ['chocolat', 'lapin']
  })

  it('T10.5 — TimerRing est rendu avec le bon aria-label', () => {
    renderGameScreen({ timeLeft: 8000 }) // 8000ms → Math.ceil(8000/1000) = 8
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.getByLabelText('Temps restant : 8s')).toBeInTheDocument()
  })

  it('T10.6 — TimerRing porte data-warning=true quand fraction < 0.3', () => {
    // medium = 10s (10000ms), warning sous 30% = 3000ms
    // timeLeft = 2000ms → fraction = 0.2 → warning
    renderGameScreen({ timeLeft: 2000, difficulty: 'medium' })
    const timer = screen.getByRole('timer')
    expect(timer).toHaveAttribute('data-warning', 'true')
  })

  it('T10.6b — TimerRing porte data-warning=false quand fraction >= 0.3', () => {
    // timeLeft = 8000ms → fraction = 0.8 → pas de warning
    renderGameScreen({ timeLeft: 8000, difficulty: 'medium' })
    const timer = screen.getByRole('timer')
    expect(timer).toHaveAttribute('data-warning', 'false')
  })

  it('T10.5b — TimerRing affiche la valeur numérique correcte', () => {
    renderGameScreen({ timeLeft: 5500 }) // Math.ceil(5500/1000) = 6
    expect(screen.getByLabelText('Temps restant : 6s')).toBeInTheDocument()
  })

  it('TimerRing affiche 0s quand timeLeft <= 0 (pas de valeur négative)', () => {
    renderGameScreen({ timeLeft: 0 })
    expect(screen.getByLabelText('Temps restant : 0s')).toBeInTheDocument()
  })

  it('WordChain a le bon role et aria-label', () => {
    renderGameScreen()
    const list = screen.getByRole('list', { name: 'Chaîne de mots' })
    expect(list).toBeInTheDocument()
  })

  it('BotWord a aria-live="assertive"', () => {
    renderGameScreen()
    const botWord = screen.getByLabelText('Mot du bot : lapin')
    expect(botWord).toHaveAttribute('aria-live', 'assertive')
  })

  it('TimerRing a aria-live="polite"', () => {
    renderGameScreen()
    const timer = screen.getByRole('timer')
    expect(timer).toHaveAttribute('aria-live', 'polite')
  })

  it('GameScreen rend correctement avec une chain vide', () => {
    renderGameScreen({ chain: [] })
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('AC4 — le burst ne se redéclenche pas sur les mots suivants après avoir battu le record', () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <GameDataContext.Provider value={mockGameData as never}>
        <GameScreen state={{ ...mockState, score: 5, sessionRecord: 5 }} dispatch={mockDispatch} />
      </GameDataContext.Provider>
    )
    rerender(
      <GameDataContext.Provider value={mockGameData as never}>
        <GameScreen state={{ ...mockState, score: 6, sessionRecord: 5 }} dispatch={mockDispatch} />
      </GameDataContext.Provider>
    )
    expect(screen.getByText('Nouveau record !')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1500) })
    expect(screen.queryByText('Nouveau record !')).not.toBeInTheDocument()
    rerender(
      <GameDataContext.Provider value={mockGameData as never}>
        <GameScreen state={{ ...mockState, score: 7, sessionRecord: 5 }} dispatch={mockDispatch} />
      </GameDataContext.Provider>
    )
    expect(screen.queryByText('Nouveau record !')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})

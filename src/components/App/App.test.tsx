import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche le LoadingScreen au démarrage (état initial synchrone)', () => {
    // La promesse ne se résout jamais pendant ce test — le flag cancelled dans
    // useEffect cleanup empêche toute mise à jour d'état au démontage du composant
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    render(<App />)
    expect(screen.getByText('Chargement du dictionnaire…')).toBeInTheDocument()
  })

  it('affiche ErrorScreen si le chargement échoue (erreur réseau)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render(<App />)
    const errorMsg = await screen.findByText('Impossible de charger les données du jeu.')
    expect(errorMsg).toBeInTheDocument()
  })

  it('affiche ErrorScreen si le serveur retourne une erreur HTTP (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response))
    render(<App />)
    const errorMsg = await screen.findByText('Impossible de charger les données du jeu.')
    expect(errorMsg).toBeInTheDocument()
  })

  it('affiche StartScreen une fois le chargement réussi', async () => {
    const mockDict = { lapin: 'lapɛ̃' }
    const mockGraph = { 'pɛ̃': ['lapin'] }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockDict } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockGraph } as Response)
    )
    render(<App />)
    const title = await screen.findByRole('heading', { level: 1, name: 'Syllabix' })
    expect(title).toBeInTheDocument()
  })
})

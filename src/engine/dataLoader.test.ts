import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadGameData } from './dataLoader'

describe('loadGameData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('charge dictionary en Map et graph en Record', async () => {
    const mockDict = { lapin: 'lapɛ̃', chocolat: 'ʃokola' }
    const mockGraph = { la: ['lapin', 'lac'], 'pɛ̃': ['pain', 'peindre'] }

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        json: async () => mockDict,
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        json: async () => mockGraph,
        ok: true,
      } as Response)
    )

    const { dictionary, graph } = await loadGameData()

    expect(dictionary).toBeInstanceOf(Map)
    expect(dictionary.get('lapin')).toBe('lapɛ̃')
    expect(dictionary.size).toBe(2)
    expect(graph).toEqual(mockGraph)
    expect(graph['la']).toContain('lapin')
  })

  it('rejette si fetch échoue (erreur réseau)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await expect(loadGameData()).rejects.toThrow()
  })

  it('rejette si le serveur retourne une erreur HTTP (ex: 404 dictionnaire)', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}), } as Response)
    )
    await expect(loadGameData()).rejects.toThrow('404')
  })

  it('rejette si le serveur retourne une erreur HTTP (ex: 500 graphe)', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ mot: 'ipa' }) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
    )
    await expect(loadGameData()).rejects.toThrow('500')
  })

  it('utilise Promise.all — les deux fetch sont appelés en parallèle', async () => {
    const mockDict = { mot: 'ipa' }
    const mockGraph = { ipa: ['mot'] }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: async () => mockDict, ok: true } as Response)
      .mockResolvedValueOnce({ json: async () => mockGraph, ok: true } as Response)

    vi.stubGlobal('fetch', fetchMock)

    await loadGameData()

    // Les deux fetch ont été déclenchés
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith('/dictionary.json')
    expect(fetchMock).toHaveBeenCalledWith('/graph.json')
  })

  it('convertit correctement le dictionnaire en Map avec toutes les entrées', async () => {
    const mockDict = { a: 'a', b: 'b', c: 'c' }
    const mockGraph = {}

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ json: async () => mockDict, ok: true } as Response)
      .mockResolvedValueOnce({ json: async () => mockGraph, ok: true } as Response)
    )

    const { dictionary } = await loadGameData()

    expect(dictionary).toBeInstanceOf(Map)
    expect(dictionary.size).toBe(3)
    expect(dictionary.get('a')).toBe('a')
    expect(dictionary.get('b')).toBe('b')
    expect(dictionary.get('c')).toBe('c')
  })

  it('stocke graph directement en Record sans conversion', async () => {
    const mockDict = {}
    const mockGraph = { 'ʃo': ['chocolat', 'choper'], 'la': ['lapin'] }

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ json: async () => mockDict, ok: true } as Response)
      .mockResolvedValueOnce({ json: async () => mockGraph, ok: true } as Response)
    )

    const { graph } = await loadGameData()

    expect(graph).not.toBeInstanceOf(Map)
    expect(graph['ʃo']).toEqual(['chocolat', 'choper'])
    expect(graph['la']).toContain('lapin')
  })
})

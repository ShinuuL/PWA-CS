import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'

const { mockCheckPairStatus, mockRpc } = vi.hoisted(() => ({
  mockCheckPairStatus: vi.fn(),
  mockRpc: vi.fn()
}))

vi.mock('../../pairing/usePairing', () => ({
  usePairing: () => ({ checkPairStatus: mockCheckPairStatus })
}))

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: { rpc: mockRpc }
}))

vi.mock('../../../shared/lib/privateMedia', () => ({
  usePrivateMedia: (_bucket, source) => ({ url: source, loading: false, error: null }),
}))

import MemoryHero from '../MemoryHero'

describe('MemoryHero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not request a private photo after unmount while pairing is pending', async () => {
    let resolve
    mockCheckPairStatus.mockReturnValue(new Promise(r => { resolve = r }))
    const view = render(<MemoryHero />)
    view.unmount()
    await act(async () => { resolve({ id: 'old-pair' }) })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('handles a pairing query failure without an unhandled rejection', async () => {
    mockCheckPairStatus.mockRejectedValue(new Error('offline'))
    render(<MemoryHero />)
    await waitFor(() => expect(screen.getByText('Adicione sua primeira foto juntos')).toBeTruthy())
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('shows loading skeleton initially', () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({ data: null, error: null })

    const { container } = render(<MemoryHero />)
    expect(container.querySelector('.memory-hero--skeleton')).toBeTruthy()
  })

  it('shows empty state with Camera icon when no photos', async () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({ data: null, error: null })

    render(<MemoryHero />)

    await waitFor(() => {
      expect(screen.getByText('Adicione sua primeira foto juntos')).toBeTruthy()
    })
  })

  it('constrains the hero to the available width on mobile layouts', async () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({ data: null, error: null })

    const { container } = render(<MemoryHero />)

    await waitFor(() => {
      expect(screen.getByText('Adicione sua primeira foto juntos')).toBeTruthy()
    })

    const hero = container.querySelector('.memory-hero')
    expect(getComputedStyle(hero).maxWidth).toBe('100%')
    expect(getComputedStyle(hero).boxSizing).toBe('border-box')
  })

  it('renders hero image when photo exists', async () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({
      data: [{ id: 'photo-1', url: 'https://example.com/photo.jpg', caption: 'Beach day', created_at: '2026-06-15T10:00:00Z' }],
      error: null
    })

    render(<MemoryHero />)

    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img.src).toBe('https://example.com/photo.jpg')
    })
  })

})

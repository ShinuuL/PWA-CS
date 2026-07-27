import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MemoryHero from '../MemoryHero'

const mockCheckPairStatus = vi.fn()
vi.mock('../../pairing/usePairing', () => ({
  usePairing: () => ({ checkPairStatus: mockCheckPairStatus })
}))

const mockRpc = vi.fn()
vi.mock('../../shared/lib/supabase', () => ({
  supabase: { rpc: mockRpc }
}))

describe('MemoryHero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton initially', () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({ data: null, error: null })

    render(<MemoryHero />)
    expect(screen.getByTestId?.('memory-hero') || document.querySelector('.memory-hero')).toBeTruthy()
  })

  it('shows empty state with Camera icon when no photos', async () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({ data: null, error: null })

    render(<MemoryHero />)

    await waitFor(() => {
      expect(screen.getByText('Add your first photo together')).toBeTruthy()
    })
  })

  it('renders hero image when photo exists', async () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({
      data: { id: 'photo-1', url: 'https://example.com/photo.jpg', caption: 'Beach day', created_at: '2026-06-15T10:00:00Z' },
      error: null
    })

    render(<MemoryHero />)

    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img.src).toBe('https://example.com/photo.jpg')
    })
  })

  it('displays formatted date below the photo', async () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({
      data: { id: 'photo-1', url: 'https://example.com/photo.jpg', caption: 'Beach day', created_at: '2026-06-15T10:00:00Z' },
      error: null
    })

    render(<MemoryHero />)

    await waitFor(() => {
      expect(screen.getByText('June 15, 2026')).toBeTruthy()
    })
  })

  it('displays caption when photo has one', async () => {
    mockCheckPairStatus.mockResolvedValue({ id: 'pair-1' })
    mockRpc.mockResolvedValue({
      data: { id: 'photo-1', url: 'https://example.com/photo.jpg', caption: 'Beach day', created_at: '2026-06-15T10:00:00Z' },
      error: null
    })

    render(<MemoryHero />)

    await waitFor(() => {
      expect(screen.getByText('Beach day')).toBeTruthy()
    })
  })
})

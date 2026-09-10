import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SpotifySearch from '../features/spotify/SpotifySearch'

const mocks = vi.hoisted(() => ({
  searchTracks: vi.fn(),
  addTrack: vi.fn(),
  state: { searchResults: [] }
}))

vi.mock('../stores/spotifyStore', () => ({
  default: (selector) => selector({ ...mocks.state, searchTracks: mocks.searchTracks, addTrack: mocks.addTrack })
}))

describe('busca do Spotify', () => {
  afterEach(() => {
    vi.useRealTimers()
    mocks.searchTracks.mockReset()
    mocks.state.searchResults = []
  })

  it('sai do loading quando a busca falha', async () => {
    mocks.searchTracks.mockRejectedValue(new Error('indisponível'))
    render(<SpotifySearch onClose={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'amor' } })

    await waitFor(() => expect(mocks.searchTracks).toHaveBeenCalledWith('amor'), { timeout: 2000 })
    await waitFor(() => expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument(), { timeout: 2000 })
  })
})

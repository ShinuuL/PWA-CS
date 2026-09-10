import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('../shared/lib/supabase', () => ({
  supabase: { from: mocks.from }
}))
vi.mock('../stores/authStore', () => ({
  default: { getState: () => ({ user: { id: 'user-a' } }) }
}))

import useSpotifyStore from '../stores/spotifyStore'

describe('persistência da configuração Spotify', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    useSpotifyStore.getState().resetLocalSession()
    useSpotifyStore.setState({
      pairId: 'pair-a',
      config: { interval: 3, is_enabled: false }
    })
  })

  it('mantém o intervalo local quando o update remoto falha', async () => {
    const error = new Error('offline')
    mocks.from.mockReturnValue({
      update: () => ({ eq: vi.fn().mockResolvedValue({ error }) })
    })

    await useSpotifyStore.getState().setAutoRotateInterval(15)

    expect(useSpotifyStore.getState().config.interval).toBe(3)
    expect(useSpotifyStore.getState().error).toBe('offline')
  })
})

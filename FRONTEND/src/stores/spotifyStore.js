import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

async function invokeEdgeFunction(name, body) {
  const session = await supabase.auth.getSession()
  const token = session.data?.session?.access_token
  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let parsed
  try { parsed = JSON.parse(text) } catch { parsed = { _raw: text } }
  if (parsed._debug) console.log(`[DEBUG] edge ${name} debug:`, parsed._debug)
  if (!res.ok) throw new Error(`${name} ${res.status}: ${text}`)
  return parsed
}

const useSpotifyStore = create((set, get) => ({
  // State
  config: null,
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  searchResults: [],
  playlistTracks: [],
  isConnected: false,
  isLoading: false,
  error: null,
  deviceId: null,
  autoRotateTimer: null,
  accessToken: null,
  pairId: null,
  _refreshPromise: null,

  // Actions
  initializeSpotify: async (pairId) => {
    const { user } = useAuthStore.getState()
    if (!user || !pairId) return

    set({ isLoading: true, pairId, error: null })

    try {
      const { data: config, error } = await supabase
        .from('spotify_config')
        .select('*')
        .eq('pair_id', pairId)
        .maybeSingle()

      if (error) throw error

      if (config) {
        set({
          config: {
            playlist_id: config.spotify_playlist_id,
            playlist_name: config.playlist_name,
            interval: config.auto_rotate_interval,
            is_enabled: config.is_enabled,
          },
          isConnected: true,
        })

        // Restore access token from sessionStorage
        const savedToken = sessionStorage.getItem('spotify_access_token')
        const savedExpiresAt = sessionStorage.getItem('spotify_token_expires_at')

        if (savedToken && savedExpiresAt) {
          const expiresAt = Number(savedExpiresAt)
          if (expiresAt > Date.now() + 5 * 60 * 1000) {
            // Token still valid — use it
            set({ accessToken: savedToken, tokenExpiresAt: expiresAt, isLoading: false })
          } else {
            // Token expired — refresh it
            set({ isLoading: false })
            await get().refreshTokenIfNeeded()
          }
        } else {
          // No saved token — try refresh from DB
          set({ isLoading: false })
          await get().refreshTokenIfNeeded()
        }
      } else {
        set({ isConnected: false, isLoading: false })
      }
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  connect: () => {
    // OAuth redirect is handled by useSpotifyAuth hook
    set({ isLoading: true })
  },

  disconnect: async () => {
    const { pairId } = get()
    if (pairId) {
      await supabase
        .from('spotify_config')
        .delete()
        .eq('pair_id', pairId)
    }
    get().stopAutoRotate()
    sessionStorage.removeItem('spotify_access_token')
    sessionStorage.removeItem('spotify_token_expires_at')
    set({
      config: null,
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      searchResults: [],
      playlistTracks: [],
      isConnected: false,
      isLoading: false,
      error: null,
      accessToken: null,
      tokenExpiresAt: null,
      _refreshPromise: null,
    })
  },

  fetchConfig: async () => {
    const { pairId } = get()
    if (!pairId) return

    try {
      const { data: config, error } = await supabase
        .from('spotify_config')
        .select('*')
        .eq('pair_id', pairId)
        .maybeSingle()

      if (error) throw error

      if (config) {
        set({
          config: {
            playlist_id: config.spotify_playlist_id,
            playlist_name: config.playlist_name,
            interval: config.auto_rotate_interval,
            is_enabled: config.is_enabled,
          },
          isConnected: true,
        })
      }
    } catch (err) {
      set({ error: err.message })
    }
  },

  setPlaylist: async (playlistId, name) => {
    const { pairId } = get()
    if (!pairId) return

    try {
      const { error } = await supabase
        .from('spotify_config')
        .update({
          spotify_playlist_id: playlistId,
          playlist_name: name,
          updated_at: new Date().toISOString(),
        })
        .eq('pair_id', pairId)

      if (error) throw error

      set({
        config: {
          ...get().config,
          playlist_id: playlistId,
          playlist_name: name,
        },
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  testToken: async () => {
    const { pairId } = get()
    if (!pairId) return
    try {
      const data = await invokeEdgeFunction('spotify-playlist', {
        action: 'test_token',
        pair_id: pairId,
      })
      console.log('[DEBUG] testToken result:', data)
      return data
    } catch (err) {
      console.error('[DEBUG] testToken error:', err.message)
      return { error: err.message }
    }
  },

  fetchPlaylist: async () => {
    const { pairId, config } = get()
    if (!pairId || !config?.playlist_id) return

    await get().refreshTokenIfNeeded()
    set({ isLoading: true })
    try {
      const data = await invokeEdgeFunction('spotify-playlist', {
        action: 'get_tracks',
        playlist_id: config.playlist_id,
        pair_id: pairId,
      })

      set({ playlistTracks: data.tracks || [], isLoading: false })
    } catch (err) {
      console.error('[DEBUG] fetchPlaylist error:', err.message)
      set({ error: err.message, isLoading: false })
    }
  },

  searchTracks: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] })
      return
    }
    await get().refreshTokenIfNeeded()
    const { accessToken } = get()
    if (!accessToken) {
      set({ searchResults: [] })
      return
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      const tracks = data.tracks?.items?.map((track) => ({
        uri: track.uri,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown',
        albumArt: track.album?.images?.[0]?.url || null,
        duration_ms: track.duration_ms,
      })) || []

      set({ searchResults: tracks })
    } catch (err) {
      set({ error: err.message })
    }
  },

  addTrack: async (uri) => {
    const { pairId, config } = get()
    if (!pairId || !config?.playlist_id) return

    await get().refreshTokenIfNeeded()
    try {
      await invokeEdgeFunction('spotify-playlist', {
        action: 'add_track',
        playlist_id: config.playlist_id,
        track_uri: uri,
        pair_id: pairId,
      })

      // Refetch playlist to get full track details
      await get().fetchPlaylist()
    } catch (err) {
      set({ error: err.message })
    }
  },

  removeTrack: async (uri) => {
    const { pairId, config, playlistTracks } = get()
    if (!pairId || !config?.playlist_id) return

    await get().refreshTokenIfNeeded()
    // Optimistic removal
    set({ playlistTracks: playlistTracks.filter((t) => t.uri !== uri) })

    try {
      await invokeEdgeFunction('spotify-playlist', {
        action: 'remove_track',
        playlist_id: config.playlist_id,
        track_uri: uri,
        pair_id: pairId,
      })
    } catch (err) {
      // Rollback on error
      set({ playlistTracks, error: err.message })
    }
  },

  clearPlaylist: async () => {
    const { pairId } = get()
    if (!pairId) return
    await supabase
      .from('spotify_config')
      .update({ spotify_playlist_id: '', playlist_name: '' })
      .eq('pair_id', pairId)
    set({ config: { ...get().config, playlist_id: '', playlist_name: '' } })
  },

  playRandom: async () => {
    const { playlistTracks, pairId, deviceId } = get()
    if (!playlistTracks.length || !pairId) return

    try {
      // Fetch recent play history for deduplication
      const { data: history } = await supabase
        .from('spotify_play_history')
        .select('track_uri')
        .eq('pair_id', pairId)
        .order('played_at', { ascending: false })
        .limit(50)

      const recentUris = new Set((history || []).map((h) => h.track_uri))
      const candidates = playlistTracks.filter((t) => !recentUris.has(t.uri))

      // If all tracks played recently, allow repeats (full cycle reset)
      const pool = candidates.length > 0 ? candidates : playlistTracks
      const randomTrack = pool[Math.floor(Math.random() * pool.length)]

      if (!randomTrack) return

      // Start playback via Spotify API
      const { accessToken } = get()
      if (accessToken) {
        const qs = deviceId ? `?device_id=${deviceId}` : ''
        await fetch(`https://api.spotify.com/v1/me/player/play${qs}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [randomTrack.uri] }),
        })
      }

      // Record in play history
      await supabase.from('spotify_play_history').insert({
        pair_id: pairId,
        track_uri: randomTrack.uri,
        track_name: randomTrack.name,
        track_artist: randomTrack.artist,
      })

      // Clean up entries older than 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      await supabase
        .from('spotify_play_history')
        .delete()
        .eq('pair_id', pairId)
        .lt('played_at', weekAgo)

      set({ currentTrack: randomTrack })
    } catch (err) {
      set({ error: err.message })
    }
  },

  playPlaylistContext: async () => {
    const { playlistTracks, accessToken, deviceId } = get()
    if (!playlistTracks.length || !accessToken) return

    try {
      const uris = playlistTracks.map((t) => t.uri)
      const qs = deviceId ? `?device_id=${deviceId}` : ''
      await fetch(`https://api.spotify.com/v1/me/player/play${qs}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris }),
      })
      set({ isPlaying: true, currentTrack: playlistTracks[0] })
    } catch (err) {
      set({ error: err.message })
    }
  },

  togglePlay: async () => {
    const { isPlaying, accessToken } = get()
    if (!accessToken) return

    try {
      await fetch(`https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      set({ isPlaying: !isPlaying })
    } catch (err) {
      set({ error: err.message })
    }
  },

  playUri: async (uri) => {
    const { accessToken, deviceId } = get()
    if (!accessToken) return

    const qs = deviceId ? `?device_id=${deviceId}` : ''
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play${qs}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [uri] }),
      })
      set({ isPlaying: true })
    } catch (err) {
      set({ error: err.message })
    }
  },

  nextTrack: async () => {
    const { accessToken } = get()
    if (!accessToken) return

    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  setShuffle: async (on) => {
    const { accessToken } = get()
    if (!accessToken) return

    try {
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${on}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  setAutoRotateInterval: async (minutes) => {
    const { pairId } = get()
    if (!pairId) return

    try {
      await supabase
        .from('spotify_config')
        .update({
          auto_rotate_interval: minutes,
          updated_at: new Date().toISOString(),
        })
        .eq('pair_id', pairId)

      set({
        config: { ...get().config, interval: minutes },
      })

      // Restart auto-rotate with new interval
      get().stopAutoRotate()
      get().startAutoRotate()
    } catch (err) {
      set({ error: err.message })
    }
  },

  startAutoRotate: () => {
    const { config } = get()
    if (!config?.is_enabled) return

    // Play the full playlist context so Spotify auto-advances sequentially
    get().playPlaylistContext()
  },

  stopAutoRotate: () => {
    // No-op: sequential playback is handled by Spotify natively
  },

  setupVisibilityHandler: () => {
    // No-op: sequential playback is handled by Spotify natively
  },

  cleanupVisibilityHandler: () => {
    // No-op: sequential playback is handled by Spotify natively
  },

  setAccessToken: (token, expiresIn) => {
    const expiresAt = Date.now() + expiresIn * 1000
    sessionStorage.setItem('spotify_access_token', token)
    sessionStorage.setItem('spotify_token_expires_at', String(expiresAt))
    set({ accessToken: token, tokenExpiresAt: expiresAt })
  },

  refreshTokenIfNeeded: async () => {
    const { tokenExpiresAt, pairId, _refreshPromise } = get()
    if (!pairId) return
    if (_refreshPromise) return _refreshPromise
    if (!tokenExpiresAt || tokenExpiresAt < Date.now() + 5 * 60 * 1000) {
      const promise = (async () => {
        try {
          const data = await invokeEdgeFunction('spotify-auth', {
            action: 'refresh',
            pair_id: pairId,
          })

          if (data.error === 'reconnect_required') {
            get().disconnect()
            set({ error: 'Spotify token expired. Please reconnect.', _refreshPromise: null })
            return
          }

          const expiresAt = Date.now() + data.expires_in * 1000
          sessionStorage.setItem('spotify_access_token', data.access_token)
          sessionStorage.setItem('spotify_token_expires_at', String(expiresAt))
          set({ accessToken: data.access_token, tokenExpiresAt: expiresAt, _refreshPromise: null })
        } catch (err) {
          console.error('[DEBUG] refreshTokenIfNeeded error:', err.message)
          set({ error: err.message, _refreshPromise: null })
        }
      })()
      set({ _refreshPromise: promise })
      return promise
    }
  },

  setDeviceId: (id) => set({ deviceId: id }),

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setProgress: (ms) => set({ progress: ms }),

  setError: (err) => set({ error: err }),

  fetchUserPlaylists: async () => {
    const { accessToken } = get()
    console.log('[DEBUG] fetchUserPlaylists, accessToken existe?', !!accessToken)
    if (!accessToken) {
      // Token missing — try refresh
      await get().refreshTokenIfNeeded()
      const retryToken = get().accessToken
      if (!retryToken) return []
      return get().fetchUserPlaylists()
    }

    try {
      const response = await fetch(
        'https://api.spotify.com/v1/me/playlists?limit=50',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      console.log('[DEBUG] status /me/playlists:', response.status)

      if (response.status === 401) {
        // Token expired — refresh and retry once
        await get().refreshTokenIfNeeded()
        const retryToken = get().accessToken
        if (!retryToken) return []
        const retryResponse = await fetch(
          'https://api.spotify.com/v1/me/playlists?limit=50',
          { headers: { Authorization: `Bearer ${retryToken}` } }
        )
        if (!retryResponse.ok) throw new Error('Failed to fetch playlists')
        const retryData = await retryResponse.json()
        return retryData.items?.map((pl) => ({
          id: pl.id,
          name: pl.name,
          trackCount: pl.items?.total ?? 0,
          image: pl.images?.[0]?.url || null,
        })) || []
      }

      if (!response.ok) throw new Error('Failed to fetch playlists')

      const data = await response.json()
      console.log('[DEBUG] total:', data.total, 'items.length:', data.items?.length)
      console.log('[DEBUG] full:', JSON.stringify(data, null, 2))
      return data.items?.map((pl) => ({
        id: pl.id,
        name: pl.name,
        trackCount: pl.items?.total ?? 0,
        image: pl.images?.[0]?.url || null,
      })) || []
    } catch (err) {
      set({ error: err.message })
      return []
    }
  },

  cleanup: () => {
    get().stopAutoRotate()
    get().cleanupVisibilityHandler()
    sessionStorage.removeItem('spotify_access_token')
    sessionStorage.removeItem('spotify_token_expires_at')
    set({
      config: null,
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      searchResults: [],
      playlistTracks: [],
      isConnected: false,
      isLoading: false,
      error: null,
      deviceId: null,
      accessToken: null,
      tokenExpiresAt: null,
      pairId: null,
      _refreshPromise: null,
    })
  },
}))

export default useSpotifyStore

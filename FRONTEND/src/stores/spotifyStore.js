import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

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
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (config) {
        set({
          config: {
            playlist_id: config.spotify_playlist_id,
            playlist_name: config.playlist_name,
            interval: config.auto_rotate_interval,
            is_enabled: config.is_enabled,
          },
          isConnected: true,
          isLoading: false,
        })
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
        .single()

      if (error) throw error

      set({
        config: {
          playlist_id: config.spotify_playlist_id,
          playlist_name: config.playlist_name,
          interval: config.auto_rotate_interval,
          is_enabled: config.is_enabled,
        },
        isConnected: true,
      })
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

  fetchPlaylist: async () => {
    const { pairId, config } = get()
    if (!pairId || !config?.playlist_id) return

    set({ isLoading: true })
    try {
      const { data, error } = await supabase.functions.invoke('spotify-playlist', {
        body: {
          action: 'get_tracks',
          playlist_id: config.playlist_id,
          pair_id: pairId,
        },
      })

      if (error) throw error

      set({ playlistTracks: data.tracks || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  searchTracks: async (query) => {
    const { accessToken } = get()
    if (!accessToken || !query.trim()) {
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

    try {
      const { error } = await supabase.functions.invoke('spotify-playlist', {
        body: {
          action: 'add_track',
          playlist_id: config.playlist_id,
          track_uri: uri,
          pair_id: pairId,
        },
      })

      if (error) throw error

      // Refetch playlist to get full track details
      await get().fetchPlaylist()
    } catch (err) {
      set({ error: err.message })
    }
  },

  removeTrack: async (uri) => {
    const { pairId, config, playlistTracks } = get()
    if (!pairId || !config?.playlist_id) return

    // Optimistic removal
    set({ playlistTracks: playlistTracks.filter((t) => t.uri !== uri) })

    try {
      const { error } = await supabase.functions.invoke('spotify-playlist', {
        body: {
          action: 'remove_track',
          playlist_id: config.playlist_id,
          track_uri: uri,
          pair_id: pairId,
        },
      })

      if (error) throw error
    } catch (err) {
      // Rollback on error
      set({ playlistTracks, error: err.message })
    }
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
        await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [randomTrack.uri],
            ...(deviceId ? { device_id: deviceId } : {}),
          }),
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
    const { config, autoRotateTimer } = get()
    if (!config?.is_enabled) return

    // Clear existing timer
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer)
    }

    const intervalMs = (config.interval || 3) * 60 * 1000
    const timer = setInterval(() => {
      get().playRandom()
    }, intervalMs)

    set({ autoRotateTimer: timer })
    get().setupVisibilityHandler()
  },

  stopAutoRotate: () => {
    const { autoRotateTimer } = get()
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer)
      set({ autoRotateTimer: null })
    }
  },

  setupVisibilityHandler: () => {
    const { visibilityHandler } = get()
    if (visibilityHandler) return // already set up

    const handler = () => {
      const { config, autoRotateTimer } = get()
      if (!config?.is_enabled) return

      if (document.hidden) {
        // Pause auto-rotate when tab hidden
        if (autoRotateTimer) {
          clearInterval(autoRotateTimer)
          set({ autoRotateTimer: null })
        }
      } else {
        // Resume auto-rotate when tab visible
        if (!autoRotateTimer) {
          get().startAutoRotate()
        }
      }
    }

    document.addEventListener('visibilitychange', handler)
    set({ visibilityHandler: handler })
  },

  cleanupVisibilityHandler: () => {
    const { visibilityHandler } = get()
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      set({ visibilityHandler: null })
    }
  },

  setAccessToken: (token, expiresIn) => {
    const expiresAt = Date.now() + expiresIn * 1000
    set({ accessToken: token, tokenExpiresAt: expiresAt })
  },

  refreshTokenIfNeeded: async () => {
    const { tokenExpiresAt, pairId } = get()
    if (!tokenExpiresAt || !pairId) return

    // Refresh if token expires in less than 5 minutes
    if (tokenExpiresAt < Date.now() + 5 * 60 * 1000) {
      try {
        const { data, error } = await supabase.functions.invoke('spotify-auth', {
          body: { action: 'refresh', pair_id: pairId },
        })

        if (error) throw error

        if (data.error === 'reconnect_required') {
          get().disconnect()
          set({ error: 'Spotify token expired. Please reconnect.' })
          return
        }

        get().setAccessToken(data.access_token, data.expires_in)
      } catch (err) {
        set({ error: err.message })
      }
    }
  },

  setDeviceId: (id) => set({ deviceId: id }),

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setProgress: (ms) => set({ progress: ms }),

  setError: (err) => set({ error: err }),

  fetchUserPlaylists: async () => {
    const { accessToken } = get()
    if (!accessToken) return []

    try {
      const response = await fetch(
        'https://api.spotify.com/v1/me/playlists?limit=50',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch playlists')

      const data = await response.json()
      return data.items?.map((pl) => ({
        id: pl.id,
        name: pl.name,
        trackCount: pl.tracks.total,
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
      pairId: null,
      visibilityHandler: null,
    })
  },
}))

export default useSpotifyStore

import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useSpotifyStore = create((set, get) => ({
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
  _autoResume: false,
  _sdkAction: null,

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

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          set({ isConnected: false, isLoading: false })
          return
        }
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
        })

        const savedToken = sessionStorage.getItem('spotify_access_token')
        const savedExpiresAt = sessionStorage.getItem('spotify_token_expires_at')

        if (savedToken && savedExpiresAt) {
          const expiresAt = Number(savedExpiresAt)
          if (expiresAt > Date.now() + 5 * 60 * 1000) {
            set({ accessToken: savedToken, tokenExpiresAt: expiresAt, isLoading: false })
          } else {
            set({ isLoading: false })
            await get().refreshTokenIfNeeded()
          }
        } else {
          set({ isLoading: false })
          await get().refreshTokenIfNeeded()
        }
      } else {
        set({ isConnected: false, isLoading: false })
      }
    } catch (err) {
      console.error('[spotify] initializeSpotify error', err)
      set({ error: err.message, isLoading: false })
    }
  },

  connect: () => {
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

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          set({ isConnected: false })
          return
        }
        throw error
      }

      if (!config) {
        set({ isConnected: false })
        return
      }

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

    await get().refreshTokenIfNeeded()
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
      console.error('[spotify] fetchPlaylist error', err)
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
      const { error } = await supabase.functions.invoke('spotify-playlist', {
        body: {
          action: 'add_track',
          playlist_id: config.playlist_id,
          track_uri: uri,
          pair_id: pairId,
        },
      })

      if (error) throw error

      await get().fetchPlaylist()
    } catch (err) {
      set({ error: err.message })
    }
  },

  removeTrack: async (uri) => {
    const { pairId, config, playlistTracks } = get()
    if (!pairId || !config?.playlist_id) return

    await get().refreshTokenIfNeeded()
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
      set({ playlistTracks, error: err.message })
    }
  },

  playRandom: async () => {
    const { playlistTracks, pairId, deviceId } = get()
    if (!playlistTracks.length || !pairId) return

    try {
      const { data: history } = await supabase
        .from('spotify_play_history')
        .select('track_uri')
        .eq('pair_id', pairId)
        .order('played_at', { ascending: false })
        .limit(50)

      const recentUris = new Set((history || []).map((h) => h.track_uri))
      const candidates = playlistTracks.filter((t) => !recentUris.has(t.uri))
      const pool = candidates.length > 0 ? candidates : playlistTracks
      const randomTrack = pool[Math.floor(Math.random() * pool.length)]

      if (!randomTrack) return

      await get().refreshTokenIfNeeded()
      const { accessToken } = get()
      if (accessToken) {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
        if (deviceId) {
          await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ device_ids: [deviceId], play: false }),
          })
          await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ uris: [randomTrack.uri] }),
          })
          set({ _autoResume: true })
        } else {
          await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ uris: [randomTrack.uri] }),
          })
        }
      }

      await supabase.from('spotify_play_history').insert({
        pair_id: pairId,
        track_uri: randomTrack.uri,
        track_name: randomTrack.name,
        track_artist: randomTrack.artist,
      })

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

  playUri: async (uri) => {
    const { accessToken, deviceId } = get()
    if (!accessToken) return

    await get().refreshTokenIfNeeded()
    const { accessToken: freshToken } = get()

    const headers = {
      Authorization: `Bearer ${freshToken}`,
      'Content-Type': 'application/json',
    }

    if (deviceId) {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      })

      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ uris: [uri] }),
      })

      setTimeout(() => {
        set({ _autoResume: true })
      }, 300)
    } else {
      const res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ uris: [uri] }),
      })
      if (res.ok || res.status === 204) {
        set({ isPlaying: true })
      }
    }
  },

  togglePlay: async () => {
    const { accessToken, deviceId } = get()
    if (!accessToken) return

    await get().refreshTokenIfNeeded()
    const { accessToken: freshToken } = get()

    try {
      const statusRes = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${freshToken}` },
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        const currentlyPlaying = statusData?.is_playing

        if (currentlyPlaying) {
          if (deviceId) {
            set({ _autoResume: 'pause' })
          } else {
            await fetch('https://api.spotify.com/v1/me/player/pause', {
              method: 'PUT',
              headers: { Authorization: `Bearer ${freshToken}` },
            })
            set({ isPlaying: false })
          }
        } else {
          set({ _autoResume: true })
        }
      } else {
        set({ _autoResume: true })
      }
    } catch (err) {
      console.error('[spotify] togglePlay error', err)
      set({ error: err.message })
    }
  },

  nextTrack: async () => {
    const { accessToken, deviceId } = get()
    if (!accessToken) return

    if (deviceId) {
      set({ _sdkAction: 'next' })
    } else {
      try {
        await fetch('https://api.spotify.com/v1/me/player/next', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      } catch (err) {
        set({ error: err.message })
      }
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

      get().stopAutoRotate()
      get().startAutoRotate()
    } catch (err) {
      set({ error: err.message })
    }
  },

  startAutoRotate: () => {
    const { config, autoRotateTimer } = get()
    if (!config?.is_enabled) return

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
    if (visibilityHandler) return

    const handler = () => {
      const { config, autoRotateTimer } = get()
      if (!config?.is_enabled) return

      if (document.hidden) {
        if (autoRotateTimer) {
          clearInterval(autoRotateTimer)
          set({ autoRotateTimer: null })
        }
      } else {
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
          const { data, error } = await supabase.functions.invoke('spotify-auth', {
            body: { action: 'refresh', pair_id: pairId },
          })

          if (error) throw error

          if (data.error === 'reconnect_required') {
            get().disconnect()
            set({ error: 'Spotify token expired. Please reconnect.', _refreshPromise: null })
            return
          }

          get().setAccessToken(data.access_token, data.expires_in)
          set({ _refreshPromise: null })
        } catch (err) {
          console.error('[spotify] refreshTokenIfNeeded error', err)
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

    if (!accessToken) {
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

      if (response.status === 401) {
        await get().refreshTokenIfNeeded()
        const retryToken = get().accessToken
        if (!retryToken) return []
        const retryResponse = await fetch(
          'https://api.spotify.com/v1/me/playlists?limit=50',
          { headers: { Authorization: `Bearer ${retryToken}` } }
        )
        if (!retryResponse.ok) throw new Error('Failed to fetch playlists')
        const retryData = await retryResponse.json()
        return (retryData.items || [])
          .filter((pl) => pl && pl.id)
          .map((pl) => ({
            id: pl.id,
            name: pl.name,
            trackCount: pl.items?.total ?? pl.tracks?.total ?? 0,
            image: pl.images?.[0]?.url || null,
          }))
      }

      if (!response.ok) throw new Error('Failed to fetch playlists')

      const data = await response.json()
      return (data.items || [])
        .filter((pl) => pl && pl.id)
        .map((pl) => ({
          id: pl.id,
          name: pl.name,
          trackCount: pl.items?.total ?? pl.tracks?.total ?? 0,
          image: pl.images?.[0]?.url || null,
        }))
    } catch (err) {
      console.error('[spotify] fetchUserPlaylists error', err)
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
      visibilityHandler: null,
    })
  },
}))

export default useSpotifyStore

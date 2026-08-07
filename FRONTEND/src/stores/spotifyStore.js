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
  _refreshPromise: null,

  // Actions
  initializeSpotify: async (pairId) => {
    const { user } = useAuthStore.getState()
    if (!user || !pairId) {
      console.log('[spotify] initializeSpotify skipped', { hasUser: !!user, pairId })
      return
    }

    console.log('[spotify] initializeSpotify started', { pairId })
    set({ isLoading: true, pairId, error: null })

    try {
      const { data: config, error } = await supabase
        .from('spotify_config')
        .select('*')
        .eq('pair_id', pairId)
        .maybeSingle()

      if (error) {
        // PGRST116 = no rows found (expected before first Spotify connect)
        // 406 = Not Acceptable (RLS or content negotiation issue — treat as no config)
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          console.log('[spotify] no config found (expected before first connect)', { code: error.code })
          set({ isConnected: false, isLoading: false })
          return
        }
        console.error('[spotify] config query error', error)
        throw error
      }

      console.log('[spotify] config query result', {
        found: !!config,
        has_playlist_id: !!config?.spotify_playlist_id,
        playlist_id: config?.spotify_playlist_id || '(null)',
        has_access_token: !!config?.access_token,
        has_refresh_token: !!config?.refresh_token,
      })

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

        console.log('[spotify] sessionStorage check', {
          hasToken: !!savedToken,
          tokenLength: savedToken?.length,
          hasExpiresAt: !!savedExpiresAt,
          expiresAt: savedExpiresAt ? new Date(Number(savedExpiresAt)).toISOString() : '(none)',
          now: new Date().toISOString(),
          isExpired: savedExpiresAt ? Number(savedExpiresAt) < Date.now() + 5 * 60 * 1000 : '(no expiry)',
        })

        if (savedToken && savedExpiresAt) {
          const expiresAt = Number(savedExpiresAt)
          if (expiresAt > Date.now() + 5 * 60 * 1000) {
            console.log('[spotify] restoring valid token from sessionStorage')
            set({ accessToken: savedToken, tokenExpiresAt: expiresAt, isLoading: false })
          } else {
            console.log('[spotify] token expired, refreshing...')
            set({ isLoading: false })
            await get().refreshTokenIfNeeded()
            console.log('[spotify] refresh completed, accessToken:', !!get().accessToken)
          }
        } else {
          console.log('[spotify] no token in sessionStorage, refreshing...')
          set({ isLoading: false })
          await get().refreshTokenIfNeeded()
          console.log('[spotify] refresh completed, accessToken:', !!get().accessToken)
        }
      } else {
        console.log('[spotify] no config found for pair_id:', pairId)
        set({ isConnected: false, isLoading: false })
      }
    } catch (err) {
      console.error('[spotify] initializeSpotify error', err)
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
    if (!pairId || !config?.playlist_id) {
      console.log('[spotify] fetchPlaylist skipped', { pairId, playlistId: config?.playlist_id })
      return
    }

    console.log('[spotify] fetchPlaylist started', { playlistId: config.playlist_id })
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

      if (error) {
        console.error('[spotify] fetchPlaylist edge function error', error)
        throw error
      }

      console.log('[spotify] fetchPlaylist result', {
        trackCount: data.tracks?.length || 0,
        hasError: !!data.error,
        error: data.error,
      })

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
      await get().refreshTokenIfNeeded()
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
            ...(deviceId ? { device_ids: [deviceId] } : {}),
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

  playUri: async (uri) => {
    const { accessToken, deviceId } = get()
    if (!accessToken) return

    await get().refreshTokenIfNeeded()
    const { accessToken: freshToken } = get()

    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${freshToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [uri],
          ...(deviceId ? { device_ids: [deviceId] } : {}),
        }),
      })
      set({ isPlaying: true })
    } catch (err) {
      set({ error: err.message })
    }
  },

  togglePlay: async () => {
    const { accessToken, deviceId } = get()
    if (!accessToken) return

    await get().refreshTokenIfNeeded()
    const { accessToken: freshToken } = get()

    try {
      // Check real playback state before toggling
      let shouldPlay = false
      const statusRes = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${freshToken}` },
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        shouldPlay = !statusData?.is_playing
      } else {
        // No device — always try to start playback
        shouldPlay = true
      }

      const url = shouldPlay
        ? 'https://api.spotify.com/v1/me/player/play'
        : 'https://api.spotify.com/v1/me/player/pause'
      const body = deviceId
        ? JSON.stringify({ device_ids: [deviceId] })
        : undefined
      await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${freshToken}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
      })
      set({ isPlaying: shouldPlay })
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
    console.log('[spotify] setAccessToken', {
      tokenLength: token?.length,
      expiresIn,
      expiresAt: new Date(expiresAt).toISOString(),
    })
    sessionStorage.setItem('spotify_access_token', token)
    sessionStorage.setItem('spotify_token_expires_at', String(expiresAt))
    set({ accessToken: token, tokenExpiresAt: expiresAt })
  },

  refreshTokenIfNeeded: async () => {
    const { tokenExpiresAt, pairId, _refreshPromise } = get()
    if (!pairId) {
      console.log('[spotify] refreshTokenIfNeeded skipped: no pairId')
      return
    }
    if (_refreshPromise) {
      console.log('[spotify] refreshTokenIfNeeded: reusing existing promise')
      return _refreshPromise
    }
    if (!tokenExpiresAt || tokenExpiresAt < Date.now() + 5 * 60 * 1000) {
      console.log('[spotify] refreshTokenIfNeeded: refresh needed', {
        hasTokenExpiresAt: !!tokenExpiresAt,
        expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : '(none)',
      })
      const promise = (async () => {
        try {
          console.log('[spotify] calling spotify-auth refresh...')
          const { data, error } = await supabase.functions.invoke('spotify-auth', {
            body: { action: 'refresh', pair_id: pairId },
          })

          if (error) {
            console.error('[spotify] refresh edge function error', error)
            throw error
          }

          console.log('[spotify] refresh response', {
            hasError: !!data.error,
            error: data.error,
            hasAccessToken: !!data.access_token,
            expiresIn: data.expires_in,
          })

          if (data.error === 'reconnect_required') {
            console.log('[spotify] refresh: reconnect required, disconnecting')
            get().disconnect()
            set({ error: 'Spotify token expired. Please reconnect.', _refreshPromise: null })
            return
          }

          get().setAccessToken(data.access_token, data.expires_in)
          set({ _refreshPromise: null })
          console.log('[spotify] refresh completed successfully')
        } catch (err) {
          console.error('[spotify] refreshTokenIfNeeded error', err)
          set({ error: err.message, _refreshPromise: null })
        }
      })()
      set({ _refreshPromise: promise })
      return promise
    } else {
      console.log('[spotify] refreshTokenIfNeeded: token still valid')
    }
  },

  setDeviceId: (id) => set({ deviceId: id }),

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setProgress: (ms) => set({ progress: ms }),

  setError: (err) => set({ error: err }),

  fetchUserPlaylists: async () => {
    const { accessToken } = get()
    console.log('[spotify] fetchUserPlaylists called', { hasAccessToken: !!accessToken })

    if (!accessToken) {
      console.log('[spotify] fetchUserPlaylists: no token, attempting refresh...')
      await get().refreshTokenIfNeeded()
      const retryToken = get().accessToken
      console.log('[spotify] fetchUserPlaylists: after refresh', { hasRetryToken: !!retryToken })
      if (!retryToken) return []
      return get().fetchUserPlaylists()
    }

    try {
      console.log('[spotify] fetchUserPlaylists: fetching from Spotify API...')
      const response = await fetch(
        'https://api.spotify.com/v1/me/playlists?limit=50',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      console.log('[spotify] fetchUserPlaylists: response', {
        status: response.status,
        ok: response.ok,
      })

      if (response.status === 401) {
        console.log('[spotify] fetchUserPlaylists: 401, refreshing token...')
        await get().refreshTokenIfNeeded()
        const retryToken = get().accessToken
        if (!retryToken) return []
        const retryResponse = await fetch(
          'https://api.spotify.com/v1/me/playlists?limit=50',
          { headers: { Authorization: `Bearer ${retryToken}` } }
        )
        if (!retryResponse.ok) throw new Error('Failed to fetch playlists')
        const retryData = await retryResponse.json()
        const playlists = (retryData.items || [])
          .filter((pl) => pl && pl.id)
          .map((pl) => ({
            id: pl.id,
            name: pl.name,
            trackCount: pl.items?.total ?? pl.tracks?.total ?? 0,
            image: pl.images?.[0]?.url || null,
          }))
        console.log('[spotify] fetchUserPlaylists: success (after refresh)', { count: playlists.length })
        return playlists
      }

      if (!response.ok) {
        const errBody = await response.text()
        console.error('[spotify] fetchUserPlaylists: error', { status: response.status, body: errBody })
        throw new Error('Failed to fetch playlists')
      }

      const data = await response.json()
      if (data.items?.length > 0) {
        const first = data.items[0]
        console.log('[spotify] fetchUserPlaylists: first item keys', Object.keys(first))
        console.log('[spotify] fetchUserPlaylists: tracks?', JSON.stringify(first.tracks), 'items?', JSON.stringify(first.items))
      }
      console.log('[spotify] fetchUserPlaylists: totalItems', data.items?.length)
      const playlists = (data.items || [])
        .filter((pl) => pl && pl.id)
        .map((pl) => ({
          id: pl.id,
          name: pl.name,
          trackCount: pl.items?.total ?? pl.tracks?.total ?? 0,
          image: pl.images?.[0]?.url || null,
        }))
      console.log('[spotify] fetchUserPlaylists: success', { count: playlists.length })
      return playlists
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

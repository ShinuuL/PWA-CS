import { useState, useEffect, useRef, useCallback } from 'react'
import useSpotifyStore from '../../stores/spotifyStore'

const loadSpotifySDK = () => {
  return new Promise((resolve) => {
    if (window.Spotify) {
      resolve(window.Spotify)
      return
    }

    // Define callback BEFORE loading SDK to prevent "onSpotifyWebPlaybackSDKReady is not defined" error
    window.onSpotifyWebPlaybackSDKReady = () => {}

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.onload = () => {
      // Wait for window.Spotify to be defined by the SDK
      const check = setInterval(() => {
        if (window.Spotify) {
          clearInterval(check)
          resolve(window.Spotify)
        }
      }, 100)
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(check)
        if (!window.Spotify) {
          console.error('Spotify SDK failed to load')
        }
      }, 5000)
    }
    script.onerror = () => {
      console.error('Failed to load Spotify SDK script')
    }
    document.body.appendChild(script)
  })
}

export default function useSpotifyPlayer() {
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasPremium, setHasPremium] = useState(true)
  const cancelledRef = useRef(false)

  const accessToken = useSpotifyStore((s) => s.accessToken)
  const autoResume = useSpotifyStore((s) => s._autoResume)
  const isPlaying = useSpotifyStore((s) => s.isPlaying)
  const setDeviceId = useSpotifyStore((s) => s.setDeviceId)
  const setCurrentTrack = useSpotifyStore((s) => s.setCurrentTrack)
  const setIsPlaying = useSpotifyStore((s) => s.setIsPlaying)
  const setProgress = useSpotifyStore((s) => s.setProgress)
  const setError = useSpotifyStore((s) => s.setError)

  useEffect(() => {
    if (!accessToken) return

    cancelledRef.current = false

    const initPlayer = async () => {
      try {
        const Spotify = await loadSpotifySDK()
        if (cancelledRef.current) return

        const player = new Spotify.Player({
          name: 'CoupleSpace',
          getOAuthToken: async (cb) => {
            const store = useSpotifyStore.getState()
            const { tokenExpiresAt } = store
            if (!tokenExpiresAt || tokenExpiresAt < Date.now() + 5 * 60 * 1000) {
              await useSpotifyStore.getState().refreshTokenIfNeeded()
            }
            const currentToken = useSpotifyStore.getState().accessToken
            cb(currentToken)
          },
          volume: 0.8,
        })

        player.addListener('ready', ({ device_id }) => {
          if (cancelledRef.current) return
          console.log('[spotify-sdk] player ready', { device_id })
          setDeviceId(device_id)
          setIsReady(true)
        })

        player.addListener('player_state_changed', (state) => {
          if (cancelledRef.current) return
          if (!state) return // null state means player is not active
          console.log('[spotify-sdk] state changed', { paused: state.paused, position: state.position })

          const track = state.track_window?.current_track
          if (track) {
            setCurrentTrack({
              name: track.name,
              artist: track.artists[0]?.name || 'Unknown',
              albumArt: track.album?.images?.[0]?.url || null,
              uri: track.uri,
              duration_ms: track.duration_ms,
            })
          }
          setIsPlaying(!state.paused)
          setProgress(state.position)
        })

        player.addListener('account_error', ({ message }) => {
          if (cancelledRef.current) return
          console.error('[spotify-sdk] account_error:', message)
          setHasPremium(false)
          setError('premium_required')
        })

        player.addListener('authentication_error', ({ message }) => {
          if (cancelledRef.current) return
          console.error('[spotify-sdk] authentication_error:', message)
          setError('auth_expired')
        })

        player.addListener('playback_error', ({ message }) => {
          console.error('[spotify-sdk] playback_error:', message)
        })

        console.log('[spotify-sdk] connecting...')
        player.connect().then((success) => {
          console.log('[spotify-sdk] connect result:', success)
          if (success) {
            playerRef.current = player
          }
        })
      } catch (err) {
        console.error('Failed to initialize Spotify player:', err)
      }
    }

    initPlayer()

    return () => {
      cancelledRef.current = true
      if (playerRef.current) {
        playerRef.current.disconnect()
        playerRef.current = null
      }
      setIsReady(false)
    }
  }, [accessToken, setDeviceId, setCurrentTrack, setIsPlaying, setProgress, setError])

  // Progress polling
  useEffect(() => {
    if (!isReady) return

    const interval = setInterval(async () => {
      const player = playerRef.current
      if (!player) return

      try {
        const state = await player.getCurrentState()
        if (state && !state.paused) {
          setProgress(state.position)
        }
      } catch {
        // ignore polling errors
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isReady, setProgress])

  // Auto-resume / auto-pause via SDK when store requests it
  useEffect(() => {
    if (!isReady || !playerRef.current) return

    if (autoResume) {
      console.log('[spotify-sdk] autoResume triggered — calling player.resume()')
      playerRef.current.resume()
      useSpotifyStore.setState({ _autoResume: false })
    }
  }, [autoResume, isReady])

  // Sync pause from store (togglePlay sets isPlaying=false)
  useEffect(() => {
    if (!isReady || !playerRef.current) return
    // This runs when isPlaying changes — the SDK's player_state_changed handles the actual state
  }, [isPlaying, isReady])

  const play = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.resume()
    }
  }, [])

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause()
    }
  }, [])

  const next = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.nextTrack()
    }
  }, [])

  const previous = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.previousTrack()
    }
  }, [])

  const seek = useCallback((positionMs) => {
    if (playerRef.current) {
      playerRef.current.seek(positionMs)
    }
  }, [])

  return {
    play,
    pause,
    next,
    previous,
    seek,
    isReady,
    hasPremium,
  }
}
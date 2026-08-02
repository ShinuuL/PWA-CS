import { useState, useEffect, useRef, useCallback } from 'react'
import useSpotifyStore from '../../stores/spotifyStore'

const loadSpotifySDK = () => {
  return new Promise((resolve) => {
    if (window.Spotify) {
      resolve(window.Spotify)
      return
    }
    // Spotify SDK requires this global callback before script loads
    window.onSpotifyWebPlaybackSDKReady = () => {
      resolve(window.Spotify)
    }
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    script.onerror = () => {
      console.error('Failed to load Spotify SDK script')
    }
    document.body.appendChild(script)
    // Fallback timeout in case callback never fires
    setTimeout(() => {
      if (window.Spotify) {
        resolve(window.Spotify)
      }
    }, 5000)
  })
}

export default function useSpotifyPlayer() {
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasPremium, setHasPremium] = useState(true)
  const cancelledRef = useRef(false)

  const accessToken = useSpotifyStore((s) => s.accessToken)
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
          setDeviceId(device_id)
          setIsReady(true)
        })

        player.addListener('player_state_changed', (state) => {
          if (cancelledRef.current) return
          if (!state) return

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
          setHasPremium(false)
          setError('premium_required')
        })

        player.addListener('authentication_error', async ({ message }) => {
          if (cancelledRef.current) return
          if (message.includes('scopes') || message.includes('Invalid')) {
            return
          }
          await useSpotifyStore.getState().refreshTokenIfNeeded()
          const newToken = useSpotifyStore.getState().accessToken
          if (newToken) {
            player.disconnect()
            player.connect()
          }
        })

        player.addListener('playback_error', ({ message }) => {
          console.error('Playback error:', message)
        })

        player.connect().then((success) => {
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

  // Progress polling — updates every second while playing
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
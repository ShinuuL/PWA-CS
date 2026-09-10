import { useState, useEffect, useRef, useCallback } from 'react'
import useSpotifyStore from '../../stores/spotifyStore'

let sdkPromise = null

function loadSpotifySDK() {
  if (window.Spotify) return Promise.resolve(window.Spotify)
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-spotify-web-playback-sdk="true"]')
    const script = existingScript || document.createElement('script')
    const previousReadyHandler = window.onSpotifyWebPlaybackSDKReady
    const timeout = window.setTimeout(() => {
      fail(new Error('O player do Spotify demorou para responder. Verifique sua conexão e tente novamente.'))
    }, 10_000)

    const cleanup = () => {
      window.clearTimeout(timeout)
      script.removeEventListener('error', onError)
    }

    const ready = () => {
      if (typeof previousReadyHandler === 'function') previousReadyHandler()
      if (!window.Spotify) return
      cleanup()
      resolve(window.Spotify)
    }

    const fail = (error) => {
      cleanup()
      reject(error)
    }

    const onError = () => {
      fail(new Error('Não foi possível carregar o player do Spotify. Desative bloqueadores e tente novamente.'))
    }

    window.onSpotifyWebPlaybackSDKReady = ready
    script.addEventListener('error', onError, { once: true })

    if (!existingScript) {
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      script.dataset.spotifyWebPlaybackSdk = 'true'
      document.body.appendChild(script)
    }
  })

  sdkPromise.catch(() => {
    sdkPromise = null
  })

  return sdkPromise
}

function toTrack(track) {
  if (!track) return null
  return {
    name: track.name,
    artist: track.artists?.[0]?.name || 'Artista desconhecido',
    albumArt: track.album?.images?.[0]?.url || null,
    uri: track.uri,
    duration_ms: track.duration_ms,
  }
}

export default function useSpotifyPlayer() {
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasPremium, setHasPremium] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [connectionMessage, setConnectionMessage] = useState(null)
  const cancelledRef = useRef(false)

  const accessToken = useSpotifyStore((s) => s.accessToken)
  const autoResume = useSpotifyStore((s) => s._autoResume)
  const setDeviceId = useSpotifyStore((s) => s.setDeviceId)
  const setCurrentTrack = useSpotifyStore((s) => s.setCurrentTrack)
  const setIsPlaying = useSpotifyStore((s) => s.setIsPlaying)
  const setProgress = useSpotifyStore((s) => s.setProgress)
  const setError = useSpotifyStore((s) => s.setError)

  useEffect(() => {
    if (!accessToken) {
      setConnectionStatus('idle')
      return
    }

    cancelledRef.current = false
    setConnectionStatus('loading')
    setConnectionMessage(null)
    setHasPremium(true)

    const syncPlaybackState = (state) => {
      if (!state || cancelledRef.current) return
      const track = toTrack(state.track_window?.current_track)
      if (track) setCurrentTrack(track)
      setIsPlaying(!state.paused)
      setProgress(state.position || 0)
    }

    const reportError = (message) => {
      if (cancelledRef.current) return
      setConnectionStatus('error')
      setConnectionMessage(message)
      setError(message)
    }

    const initPlayer = async () => {
      try {
        const Spotify = await loadSpotifySDK()
        if (cancelledRef.current) return

        const player = new Spotify.Player({
          name: 'CoupleSpace',
          getOAuthToken: async (callback) => {
            const store = useSpotifyStore.getState()
            if (!store.tokenExpiresAt || store.tokenExpiresAt < Date.now() + 5 * 60 * 1000) {
              await store.refreshTokenIfNeeded()
            }
            callback(useSpotifyStore.getState().accessToken || '')
          },
          volume: 0.8,
        })

        playerRef.current = player

        player.addListener('ready', async ({ device_id }) => {
          if (cancelledRef.current) return
          setDeviceId(device_id)
          setIsReady(true)
          setConnectionStatus('ready')
          setConnectionMessage(null)
          setError(null)
          try {
            syncPlaybackState(await player.getCurrentState())
          } catch {
            setConnectionMessage('O player está pronto. Escolha uma música para começar.')
          }
        })

        player.addListener('not_ready', () => {
          if (cancelledRef.current) return
          setIsReady(false)
          setConnectionStatus('offline')
          setConnectionMessage('O player do Spotify ficou indisponível. Tentando reconectar…')
        })

        player.addListener('player_state_changed', (state) => {
          syncPlaybackState(state)
          if (!cancelledRef.current) {
            setConnectionStatus('ready')
            setConnectionMessage(null)
          }
        })

        player.addListener('initialization_error', () => {
          reportError('Este navegador não consegue iniciar o player do Spotify.')
        })

        player.addListener('authentication_error', () => {
          reportError('A sessão do Spotify expirou. Conecte sua conta novamente.')
        })

        player.addListener('account_error', () => {
          if (cancelledRef.current) return
          setHasPremium(false)
          setConnectionStatus('error')
          setConnectionMessage('A reprodução no navegador requer uma conta Spotify Premium.')
          setError('A reprodução no navegador requer uma conta Spotify Premium.')
        })

        player.addListener('playback_error', () => {
          reportError('O Spotify não conseguiu reproduzir esta faixa. Tente outra música.')
        })

        player.addListener('autoplay_failed', () => {
          if (cancelledRef.current) return
          setConnectionStatus('blocked')
          setConnectionMessage('Toque em reproduzir para permitir o áudio neste navegador.')
        })

        const connected = await player.connect()
        if (!connected) {
          reportError('Não foi possível conectar o player do Spotify. Tente novamente.')
        }
      } catch (error) {
        reportError(error.message || 'Não foi possível iniciar o player do Spotify.')
      }
    }

    void initPlayer()

    return () => {
      cancelledRef.current = true
      if (playerRef.current) {
        playerRef.current.disconnect()
        playerRef.current = null
      }
      setIsReady(false)
    }
  }, [accessToken, setDeviceId, setCurrentTrack, setIsPlaying, setProgress, setError])

  useEffect(() => {
    if (!isReady) return

    const interval = setInterval(async () => {
      const player = playerRef.current
      if (!player) return

      try {
        const state = await player.getCurrentState()
        if (state && !state.paused) setProgress(state.position)
      } catch {
        // A próxima alteração de estado do SDK atualiza a interface.
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isReady, setProgress])

  useEffect(() => {
    if (!isReady || !playerRef.current || !autoResume) return

    if (autoResume === 'pause') {
      void playerRef.current.pause()
    } else {
      void playerRef.current.resume()
    }
    useSpotifyStore.setState({ _autoResume: false })
  }, [autoResume, isReady])

  const sdkAction = useSpotifyStore((s) => s._sdkAction)
  useEffect(() => {
    if (!isReady || !playerRef.current || !sdkAction) return

    if (sdkAction === 'next') {
      void playerRef.current.nextTrack()
    } else if (sdkAction === 'previous') {
      void playerRef.current.previousTrack()
    }
    useSpotifyStore.setState({ _sdkAction: null })
  }, [sdkAction, isReady])

  const runPlayerAction = useCallback(async (action) => {
    if (!playerRef.current) {
      setConnectionMessage('O player ainda está sendo conectado.')
      return false
    }

    try {
      await action(playerRef.current)
      return true
    } catch {
      const message = 'O Spotify não respondeu a esse controle. Tente novamente.'
      setConnectionStatus('error')
      setConnectionMessage(message)
      setError(message)
      return false
    }
  }, [setError])

  const play = useCallback(() => runPlayerAction((player) => player.resume()), [runPlayerAction])
  const pause = useCallback(() => runPlayerAction((player) => player.pause()), [runPlayerAction])
  const next = useCallback(() => runPlayerAction((player) => player.nextTrack()), [runPlayerAction])
  const previous = useCallback(() => runPlayerAction((player) => player.previousTrack()), [runPlayerAction])
  const seek = useCallback((positionMs) => runPlayerAction((player) => player.seek(positionMs)), [runPlayerAction])

  return {
    play,
    pause,
    next,
    previous,
    seek,
    isReady,
    hasPremium,
    connectionStatus,
    connectionMessage,
  }
}

import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'
import useSpotifyStore from '../../stores/spotifyStore'

function base64url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default function useSpotifyAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState(null)

  const setAccessToken = useSpotifyStore((s) => s.setAccessToken)
  const setDeviceId = useSpotifyStore((s) => s.setDeviceId)

  const startAuth = useCallback(async () => {
    try {
      setIsAuthenticating(true)
      setAuthError(null)

      // Generate PKCE code_verifier
      const verifierArray = new Uint8Array(64)
      crypto.getRandomValues(verifierArray)
      const codeVerifier = base64url(verifierArray)

      // Generate code_challenge from verifier (SHA-256)
      const encoder = new TextEncoder()
      const verifierData = encoder.encode(codeVerifier)
      const hashBuffer = await crypto.subtle.digest('SHA-256', verifierData)
      const codeChallenge = base64url(hashBuffer)

      // Generate random state for CSRF protection
      const stateArray = new Uint8Array(16)
      crypto.getRandomValues(stateArray)
      const state = base64url(stateArray)

      // Store verifier and state in localStorage
      localStorage.setItem('spotify_code_verifier', codeVerifier)
      localStorage.setItem('spotify_auth_state', state)

      // Build authorization URL
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
      const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: [
          'playlist-read-private',
          'playlist-modify-public',
          'playlist-modify-private',
          'streaming',
          'user-read-playback-state',
          'user-modify-playback-state',
          'user-read-currently-playing',
          'user-read-email',
          'user-read-private',
        ].join(' '),
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state,
      })

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

      // Redirect to Spotify
      window.location.href = authUrl
    } catch (err) {
      setAuthError(err.message)
      setIsAuthenticating(false)
    }
  }, [])

  const handleCallback = useCallback(async (code, state) => {
    try {
      setIsAuthenticating(true)
      setAuthError(null)

      // Verify state for CSRF protection
      const savedState = localStorage.getItem('spotify_auth_state')
      if (state !== savedState) {
        throw new Error('State mismatch — possible CSRF attack')
      }

      // Get user from authStore
      const { user } = (await import('../../stores/authStore')).default.getState()
      if (!user) throw new Error('Not authenticated')

      // Fetch user's pair_id from pairs table
      const { data: pair } = await supabase
        .from('pairs')
        .select('id')
        .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .eq('code_used', true)
        .single()

      if (!pair) throw new Error('No pair found')

      // Get code_verifier from localStorage (PKCE)
      const codeVerifier = localStorage.getItem('spotify_code_verifier')

      // Call Edge Function to exchange code for tokens
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'exchange',
          code,
          code_verifier: codeVerifier,
          redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
          pair_id: pair.id,
        },
      })

      if (error) throw error

      if (data.error) {
        throw new Error(data.error_description || data.error)
      }

      // Store access_token in memory (not localStorage)
      setAccessToken(data.access_token, data.expires_in)

      // Initialize Spotify SDK
      if (window.Spotify) {
        const player = new window.Spotify.Player({
          name: 'CoupleSpace',
          getOAuthToken: (cb) => cb(data.access_token),
          volume: 0.8,
        })

        player.addListener('ready', ({ device_id }) => {
          setDeviceId(device_id)
        })

        player.connect()
      }

      // Clean up localStorage
      localStorage.removeItem('spotify_code_verifier')
      localStorage.removeItem('spotify_auth_state')

      setIsAuthenticating(false)
      return true
    } catch (err) {
      setAuthError(err.message)
      setIsAuthenticating(false)
      localStorage.removeItem('spotify_code_verifier')
      localStorage.removeItem('spotify_auth_state')
      return false
    }
  }, [setAccessToken, setDeviceId])

  return {
    startAuth,
    handleCallback,
    isAuthenticating,
    authError,
  }
}

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useSpotifyAuth from './useSpotifyAuth'

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback, isAuthenticating, authError } = useSpotifyAuth()
  const [error, setError] = useState(null)
  const exchangedRef = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(errorParam)
      return
    }

    if (code && state && !exchangedRef.current) {
      exchangedRef.current = true
      handleCallback(code, state).then((success) => {
        if (success) {
          navigate('/', { replace: true })
        } else {
          setError('Falha na autenticação')
        }
      })
    } else if (!code && !state) {
      setError('Parâmetros de callback inválidos')
    }
  }, [searchParams, handleCallback, navigate])

  if (isAuthenticating) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Conectando ao Spotify...</p>
      </div>
    )
  }

  if (error || authError) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#ff3b30' }}>{error || authError}</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Voltar ao início
        </button>
      </div>
    )
  }

  return null
}
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useSpotifyAuth from './useSpotifyAuth'

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback, isAuthenticating, authError } = useSpotifyAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(errorParam)
      return
    }

    if (code && state) {
      handleCallback(code, state).then((success) => {
        if (success) {
          navigate('/home', { replace: true })
        } else {
          setError('Falha na autenticação')
        }
      })
    } else {
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
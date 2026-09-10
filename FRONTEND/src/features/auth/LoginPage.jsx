import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../shared/lib/supabase'
import './auth.css'

export default function LoginPage() {
  const location = useLocation()
  const from = location.state?.from?.pathname || '/home'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogleLogin = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      try {
        sessionStorage.setItem('couplespace-login-next', from.startsWith('/') && !from.startsWith('//') && !from.includes('\\') ? from : '/home')
      } catch { /* Login remains available when browser storage is blocked. */ }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback' }
      })
      if (error) throw error
    } catch {
      setError('Não foi possível entrar com Google. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <h1>CoupleSpace</h1>
      <p>Um espaço só de vocês.</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button onClick={handleGoogleLogin} className="login-button" disabled={busy}>
        {busy ? 'Conectando…' : 'Entrar com Google'}
      </button>
    </div>
  )
}

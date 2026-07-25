import { supabase } from '../../shared/lib/supabase'
import './auth.css'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    })
    if (error) console.error('Login error:', error.message)
  }

  return (
    <div className="login-page">
      <h1>CoupleSpace</h1>
      <p>Your private shared space</p>
      <button onClick={handleGoogleLogin} className="login-button">
        Sign in with Google
      </button>
    </div>
  )
}

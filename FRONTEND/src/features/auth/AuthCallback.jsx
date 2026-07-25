import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../shared/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate('/home')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="callback-page">
      <p>Signing you in...</p>
    </div>
  )
}

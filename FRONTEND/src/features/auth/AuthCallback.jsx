import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../shared/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/home', { replace: true })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/home', { replace: true })
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

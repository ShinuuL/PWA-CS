import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../shared/lib/supabase'
import './auth.css'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const finish = session => {
      if (!active || !session) return
      let next = '/home'
      try {
        const saved = sessionStorage.getItem('couplespace-login-next')
        sessionStorage.removeItem('couplespace-login-next')
        if (saved?.startsWith('/') && !saved.startsWith('//') && !saved.includes('\\') && !saved.startsWith('/auth/') && saved !== '/login') next = saved
      } catch { /* Storage must not prevent login. */ }
      navigate(next, { replace: true })
    }
    const query = new URLSearchParams(window.location.search)
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    if (query.has('error') || fragment.has('error')) {
      setFailed(true)
      return
    }
    const timeout = setTimeout(() => { if (active) setFailed(true) }, 10000)
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setFailed(true)
      else finish(data?.session)
    }).catch(() => { if (active) setFailed(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => finish(session))
    return () => { active = false; clearTimeout(timeout); subscription.unsubscribe() }
  }, [navigate])

  return (
    <div className="login-page">
      <h1>CoupleSpace</h1>
      {failed ? <>
        <p role="alert">Não foi possível concluir o login. Tente novamente.</p>
        <Link className="login-button" to="/login">Tentar novamente</Link>
      </> : <p role="status">Conectando ao seu espaço…</p>}
    </div>
  )
}

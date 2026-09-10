import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../shared/lib/supabase'

export default function PartnerProfile() {
  const { user } = useAuth()
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    const fetchPartner = async () => {
      const { data: pair, error: pairError } = await supabase
        .from('pairs')
        .select('*')
        .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .not('code_used', 'eq', false)
        .single()

      if (pairError) throw pairError

      if (!pair) {
        setLoading(false)
        return
      }

      const partnerId = pair.user_one === user.id ? pair.user_two : pair.user_one

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single()

      if (profileError) throw profileError

      setPartner(profile)
      setLoading(false)
    }

    fetchPartner().catch(() => {
      setError('Não foi possível carregar o perfil do seu par.')
      setLoading(false)
    })
  }, [user])

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return <div className="profile-page"><p style={{ color: 'var(--color-text-secondary)' }}>Carregando…</p></div>
  }

  if (error) return <div className="profile-page"><p role="alert" style={{ color: 'var(--color-danger, #ff6b6b)' }}>{error}</p></div>

  if (!partner) {
    return (
      <div className="profile-page">
        <h2>Seu par</h2>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Vocês ainda não estão conectados
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Conecte seu par para ver o perfil dele.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <h2>Seu par</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--color-bg-input)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--color-border)',
        }}>
          {partner.avatar_url ? (
            <img
              src={partner.avatar_url}
              alt={partner.display_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '2rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              {getInitials(partner.display_name)}
            </span>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            Seu par
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {partner.display_name || 'Nome não informado'}
          </p>
        </div>
      </div>
    </div>
  )
}

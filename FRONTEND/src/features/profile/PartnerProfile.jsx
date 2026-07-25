import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../shared/lib/supabase'

export default function PartnerProfile() {
  const { user } = useAuth()
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchPartner = async () => {
      const { data: pair } = await supabase
        .from('pairs')
        .select('*')
        .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .not('code_used', 'eq', false)
        .single()

      if (!pair) {
        setLoading(false)
        return
      }

      const partnerId = pair.user_one === user.id ? pair.user_two : pair.user_one

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single()

      setPartner(profile)
      setLoading(false)
    }

    fetchPartner()
  }, [user])

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return <div className="profile-page"><p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p></div>
  }

  if (!partner) {
    return (
      <div className="profile-page">
        <h2>Your Partner</h2>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
          No partner paired yet.
        </p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <h2>Your Partner</h2>

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
            Your Partner
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {partner.display_name || 'No name set'}
          </p>
        </div>
      </div>
    </div>
  )
}

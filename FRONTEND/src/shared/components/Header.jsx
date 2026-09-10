import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { usePairing } from '../../features/pairing/usePairing'
import { useAuth } from '../../features/auth/useAuth'
import { supabase } from '../lib/supabase'
import { usePresence } from '../../hooks/usePresence'
import PartnerProfileModal from '../../features/profile/PartnerProfileModal'
import StatusDot from './StatusDot'
import './header.css'

export default function Header({ onMenuClick }) {
  const { user } = useAuth()
  const { pair } = usePairing()
  const pairId = pair?.id
  const partnerId = pair ? (pair.user_one === user?.id ? pair.user_two : pair.user_one) : null
  const [partnerResult, setPartnerResult] = useState(null)
  const partner = partnerResult?.id && partnerResult.id === partnerId ? partnerResult.profile : null
  const [showPartnerProfile, setShowPartnerProfile] = useState(false)

  const { isOnline } = usePresence(pairId, partnerId, user?.id)

  useEffect(() => {
    let cancelled = false
    if (!partnerId) return
    const fetchPartner = async () => {
      const { data: profile, error } = await supabase.from('profiles')
        .select('display_name, avatar_url').eq('id', partnerId).maybeSingle()
      if (error) throw error
      if (!cancelled) setPartnerResult({ id: partnerId, profile })
    }
    void fetchPartner().catch(() => {
      if (!cancelled) setPartnerResult(null)
    })
    return () => { cancelled = true }
  }, [partnerId])

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="header">
      <button className="header-menu" onClick={onMenuClick} aria-label="Abrir menu">
        <Menu size={22} />
      </button>

      <div className="header-center">
        {partner ? (
          <>
            <div
              className="header-avatar-wrapper"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPartnerProfile(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setShowPartnerProfile(true)
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Abrir perfil de ${partner.display_name || 'seu par'}`}
            >
              <div className="header-avatar">
                {partner.avatar_url ? (
                  <img src={partner.avatar_url} alt={partner.display_name} />
                ) : (
                  <span className="header-avatar-initials">
                    {getInitials(partner.display_name)}
                  </span>
                )}
              </div>
              <div className="header-status-dot">
                <StatusDot isOnline={isOnline} size={8} />
              </div>
            </div>
            <span className="header-partner-name">{partner.display_name}</span>
          </>
        ) : (
          <span className="header-branding">CoupleSpace</span>
        )}
      </div>

      <div style={{ width: 32 }} />

      <PartnerProfileModal
        isOpen={showPartnerProfile}
        onClose={() => setShowPartnerProfile(false)}
      />
    </header>
  )
}

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { useAuth } from '../../features/auth/useAuth'
import { supabase } from '../lib/supabase'
import './header.css'

export default function Header({ onMenuClick }) {
  const { user } = useAuth()
  const [partner, setPartner] = useState(null)

  useEffect(() => {
    if (!user) return

    const fetchPartner = async () => {
      const { data: pair } = await supabase
        .from('pairs')
        .select('*')
        .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .not('code_used', 'eq', false)
        .maybeSingle()

      if (!pair) return

      const partnerId = pair.user_one === user.id ? pair.user_two : pair.user_one

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', partnerId)
        .maybeSingle()

      setPartner(profile)
    }

    fetchPartner()
  }, [user])

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="header">
      <button className="header-menu" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div className="header-center">
        {partner ? (
          <>
            <div className="header-avatar">
              {partner.avatar_url ? (
                <img src={partner.avatar_url} alt={partner.display_name} />
              ) : (
                <span className="header-avatar-initials">
                  {getInitials(partner.display_name)}
                </span>
              )}
            </div>
            <span className="header-partner-name">{partner.display_name}</span>
          </>
        ) : (
          <span className="header-branding">CoupleSpace</span>
        )}
      </div>

      <div style={{ width: 32 }} />
    </header>
  )
}

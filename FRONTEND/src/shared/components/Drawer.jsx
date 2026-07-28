import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Home, MessageCircle, Images, CalendarDays, Settings, LogOut } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { useAuth } from '../../features/auth/useAuth'
import { supabase } from '../lib/supabase'
import PartnerProfileModal from '../../features/profile/PartnerProfileModal'
import './drawer.css'

const NAV_ITEMS = [
  { path: '/home', label: 'Homepage', icon: Home, requiresPairing: false },
  { path: '/chat', label: 'Chat', icon: MessageCircle, requiresPairing: true },
  { path: '/album', label: 'Album', icon: Images, requiresPairing: true },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays, requiresPairing: true },
  { path: '/settings', label: 'Settings', icon: Settings, requiresPairing: false },
]

export default function Drawer({ open, onClose, isPaired }) {
  const navigate = useNavigate()
  const location = useLocation()
  const signOut = useAuthStore((s) => s.signOut)
  const { user } = useAuth()
  const [partner, setPartner] = useState(null)
  const [showPartnerModal, setShowPartnerModal] = useState(false)

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

  const handleNav = (item) => {
    if (item.requiresPairing && !isPaired) return
    navigate(item.path)
    onClose()
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="drawer-header">
              <h2>CoupleSpace</h2>
            </div>

            <nav className="drawer-nav">
              {isPaired && partner && (
                <button
                  className="drawer-partner"
                  onClick={() => setShowPartnerModal(true)}
                >
                  <div className="drawer-partner-avatar">
                    {partner.avatar_url ? (
                      <img src={partner.avatar_url} alt={partner.display_name} />
                    ) : (
                      <span className="drawer-partner-initials">
                        {getInitials(partner.display_name)}
                      </span>
                    )}
                  </div>
                  <span className="drawer-partner-name">{partner.display_name}</span>
                </button>
              )}

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const locked = item.requiresPairing && !isPaired
                const active = location.pathname === item.path

                return (
                  <button
                    key={item.path}
                    className={`drawer-nav-item${active ? ' active' : ''}${locked ? ' locked' : ''}`}
                    onClick={() => handleNav(item)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    {locked && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>🔒</span>}
                  </button>
                )
              })}
            </nav>

            <div className="drawer-footer">
              <button className="drawer-signout" onClick={handleSignOut}>
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}

      <PartnerProfileModal
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />
    </AnimatePresence>
  )
}

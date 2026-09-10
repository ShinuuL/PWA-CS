import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Home, MessageCircle, Images, CalendarDays, Settings, LogOut } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { useAuth } from '../../features/auth/useAuth'
import { supabase } from '../lib/supabase'
import PartnerProfileModal from '../../features/profile/PartnerProfileModal'
import './drawer.css'
import { useDialogFocus } from '../../hooks/useDialogFocus'

const NAV_ITEMS = [
  { path: '/home', label: 'Início', icon: Home, requiresPairing: false },
  { path: '/chat', label: 'Chat', icon: MessageCircle, requiresPairing: true },
  { path: '/album', label: 'Álbum', icon: Images, requiresPairing: true },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays, requiresPairing: true },
  { path: '/settings', label: 'Configurações', icon: Settings, requiresPairing: false },
]

export default function Drawer({ open, onClose, isPaired }) {
  const navigate = useNavigate()
  const location = useLocation()
  const signOut = useAuthStore((s) => s.signOut)
  const { user, profile } = useAuth()
  const [partner, setPartner] = useState(null)
  const [showPartnerModal, setShowPartnerModal] = useState(false)
  const [signOutError, setSignOutError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const drawerRef = useDialogFocus(open && !showPartnerModal, onClose)

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
    setSigningOut(true)
    setSignOutError(null)
    try { await signOut(); onClose() }
    catch { setSignOutError('Não foi possível sair. Tente novamente.') }
    finally { setSigningOut(false) }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
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
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal"
              tabIndex={-1}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="drawer-header">
                <h2>CoupleSpace</h2>
                <button className="drawer-close" onClick={onClose} aria-label="Fechar menu">×</button>
              </div>

              <nav className="drawer-nav">
                <button
                  className="drawer-user-profile"
                  onClick={() => { navigate('/profile'); onClose() }}
                >
                  <div className="drawer-user-avatar">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name} />
                    ) : (
                      <span className="drawer-user-initials">
                        {getInitials(profile?.display_name || user?.email)}
                      </span>
                    )}
                  </div>
                  <span className="drawer-user-name">{profile?.display_name || user?.email}</span>
                </button>

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
                      disabled={locked}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                      {locked && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>🔒</span>}
                    </button>
                  )
                })}
              </nav>

              <div className="drawer-footer">
                {signOutError && <p role="alert">{signOutError}</p>}
                <button className="drawer-signout" onClick={handleSignOut} disabled={signingOut}>
                  <LogOut size={20} />
                  <span>{signingOut ? 'Saindo…' : 'Sair da conta'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PartnerProfileModal
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />
    </>
  )
}

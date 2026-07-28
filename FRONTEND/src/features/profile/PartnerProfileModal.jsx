import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../shared/lib/supabase'
import { usePresence } from '../../hooks/usePresence'
import StatusDot from '../../shared/components/StatusDot'
import './profile.css'

export default function PartnerProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [partner, setPartner] = useState(null)
  const [pairId, setPairId] = useState(null)
  const [partnerId, setPartnerId] = useState(null)
  const [loading, setLoading] = useState(true)

  const { isOnline } = usePresence(pairId, partnerId)

  useEffect(() => {
    if (!user || !isOpen) return

    const fetchPartner = async () => {
      setLoading(true)
      const { data: pair } = await supabase
        .from('pairs')
        .select('*')
        .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .not('code_used', 'eq', false)
        .maybeSingle()

      if (!pair) {
        setLoading(false)
        return
      }

      const pid = pair.user_one === user.id ? pair.user_two : pair.user_one

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', pid)
        .maybeSingle()

      setPartner(profile)
      setPairId(pair.id)
      setPartnerId(pid)
      setLoading(false)
    }

    fetchPartner()
  }, [user, isOpen])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleMessage = () => {
    navigate('/chat')
    onClose()
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="partner-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="partner-modal-content"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {loading ? (
              <div className="partner-modal-loading">Loading...</div>
            ) : !partner ? (
              <div className="partner-modal-empty">
                <h3>No partner paired yet</h3>
                <p>Pair with your partner to see their profile</p>
              </div>
            ) : (
              <div className="partner-modal-body">
                <div className="partner-modal-avatar">
                  {partner.avatar_url ? (
                    <img src={partner.avatar_url} alt={partner.display_name} />
                  ) : (
                    <span className="partner-modal-avatar-initials">
                      {getInitials(partner.display_name)}
                    </span>
                  )}
                  <div className="partner-modal-status-dot">
                    <StatusDot isOnline={isOnline} size={12} />
                  </div>
                </div>

                <h3 className="partner-modal-name">{partner.display_name || 'No name set'}</h3>

                <span className="partner-modal-status-text">
                  {isOnline ? 'Online' : 'Offline'}
                </span>

                <button className="partner-modal-message-btn" onClick={handleMessage}>
                  Message
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
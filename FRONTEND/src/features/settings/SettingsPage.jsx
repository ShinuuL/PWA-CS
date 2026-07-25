import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { usePairing } from '../pairing/usePairing'
import useAuthStore from '../../stores/authStore'
import './settings.css'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { unpair } = usePairing()
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [unpairing, setUnpairing] = useState(false)

  const handleUnpair = async () => {
    setUnpairing(true)
    await unpair()
    setUnpairing(false)
    setShowConfirm(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <div className="settings-section">
        <p className="settings-section-title">Account</p>
        <div className="settings-info-row">
          <span className="settings-info-label">Email</span>
          <span className="settings-info-value">{user?.email || '—'}</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Display Name</span>
          <span className="settings-info-value">{profile?.display_name || '—'}</span>
        </div>
      </div>

      <div className="settings-section">
        <p className="settings-section-title">Relationship</p>
        <button
          className="btn-danger"
          onClick={() => setShowConfirm(true)}
        >
          Unpair from Partner
        </button>
      </div>

      <div className="settings-section">
        <p className="settings-section-title">Session</p>
        <button className="btn-secondary" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      {showConfirm && (
        <div className="settings-confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="settings-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Unpair from Partner?</h3>
            <p>
              This will remove your pairing connection. You will need a new invite code to pair again.
            </p>
            <div className="settings-confirm-actions">
              <button
                className="btn-confirm-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={unpairing}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-danger"
                onClick={handleUnpair}
                disabled={unpairing}
              >
                {unpairing ? 'Unpairing...' : 'Unpair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

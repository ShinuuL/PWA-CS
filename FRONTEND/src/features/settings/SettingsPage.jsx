import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { usePairing } from '../pairing/usePairing'
import useAuthStore from '../../stores/authStore'
import { isPushSupported, isIOSStandalone, subscribeToPush, unsubscribeFromPush, getPushSubscription } from '../../shared/lib/pushSubscription'
import BugReportModal from './BugReportModal'
import './settings.css'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { unpair } = usePairing()
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [unpairing, setUnpairing] = useState(false)
  const [showBugReport, setShowBugReport] = useState(false)

  // Push notification state
  const [pushSupported] = useState(() => isPushSupported())
  const [iosStandalone] = useState(() => isIOSStandalone())
  const [pushEnabled, setPushEnabled] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('default')
  const [togglingPush, setTogglingPush] = useState(false)

  useEffect(() => {
    if (!pushSupported) return
    // Check current subscription state on mount
    const checkPushState = async () => {
      const subscription = await getPushSubscription()
      setPushEnabled(!!subscription)
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission)
      }
    }
    checkPushState()
  }, [pushSupported])

  const handleTogglePush = useCallback(async () => {
    if (togglingPush) return
    setTogglingPush(true)
    try {
      if (pushEnabled) {
        // Turn off — unsubscribe
        await unsubscribeFromPush()
        setPushEnabled(false)
      } else {
        // Turn on — request permission if needed, then subscribe
        if ('Notification' in window && Notification.permission !== 'granted') {
          const result = await Notification.requestPermission()
          setPermissionStatus(result)
          if (result !== 'granted') return
        }
        const subscription = await subscribeToPush()
        setPushEnabled(!!subscription)
        if ('Notification' in window) {
          setPermissionStatus(Notification.permission)
        }
      }
    } catch {
      // Silently handle — UI reflects actual state
    } finally {
      setTogglingPush(false)
    }
  }, [pushEnabled, togglingPush])

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
        <p className="settings-section-title">Notificações</p>
        {!pushSupported && iosStandalone === false && (
          <p className="settings-push-message">
            Instale o CoupleSpace na tela inicial para receber notificações
          </p>
        )}
        {pushSupported && (
          <>
            <div className="settings-section-toggle">
              <span className="settings-toggle-label">Notificações push</span>
              <button
                className={`settings-toggle-switch ${pushEnabled ? 'active' : ''}`}
                onClick={handleTogglePush}
                disabled={togglingPush || permissionStatus === 'denied'}
                aria-label="Toggle push notifications"
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
            {permissionStatus === 'granted' && (
              <p className="settings-toggle-status status-granted">Permitido</p>
            )}
            {permissionStatus === 'denied' && (
              <p className="settings-toggle-status status-denied">
                Notificações bloqueadas. Permita nas configurações do navegador.
              </p>
            )}
            {permissionStatus === 'default' && (
              <p className="settings-toggle-status status-default">Não solicitado</p>
            )}
            {!pushEnabled && permissionStatus !== 'denied' && (
              <p className="settings-toggle-hint">
                Para desativar, altere nas configurações do navegador
              </p>
            )}
          </>
        )}
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
        <p className="settings-section-title">Suporte</p>
        <button className="btn-secondary" onClick={() => setShowBugReport(true)}>
          Reportar Problema
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

      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
    </div>
  )
}

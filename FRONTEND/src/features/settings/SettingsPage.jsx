import { useState, useEffect, useCallback } from 'react'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { useAuth } from '../auth/useAuth'
import { usePairing } from '../pairing/usePairing'
import useAuthStore from '../../stores/authStore'
import { isPushSupported, isIOSStandalone, subscribeToPush, unsubscribeFromPush, getPushSubscription } from '../../shared/lib/pushSubscription'
import BugReportModal from './BugReportModal'
import './settings.css'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { unpair, pair } = usePairing()
  const signOut = useAuthStore((s) => s.signOut)
  const [showConfirm, setShowConfirm] = useState(false)
  const [unpairing, setUnpairing] = useState(false)
  const [showBugReport, setShowBugReport] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const closeConfirm = () => { if (!unpairing) setShowConfirm(false) }
  const confirmRef = useDialogFocus(showConfirm, closeConfirm)

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
    checkPushState().catch(() => setActionError('Não foi possível consultar as notificações.'))
  }, [pushSupported])

  const handleTogglePush = useCallback(async () => {
    if (togglingPush) return
    setTogglingPush(true)
    setActionError(null)
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
        if (!subscription) throw new Error('Inscrição indisponível')
        setPushEnabled(!!subscription)
        if ('Notification' in window) {
          setPermissionStatus(Notification.permission)
        }
      }
    } catch {
      setActionError('Não foi possível alterar as notificações. Verifique sua conexão e tente novamente.')
    } finally {
      setTogglingPush(false)
    }
  }, [pushEnabled, togglingPush])

  const handleUnpair = async () => {
    setUnpairing(true)
    setActionError(null)
    try {
      await unpair()
      setShowConfirm(false)
    } catch {
      setActionError('Não foi possível desvincular. Tente novamente.')
    } finally { setUnpairing(false) }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    setActionError(null)
    try { await signOut() }
    catch { setActionError('Não foi possível sair. Tente novamente.') }
    finally { setSigningOut(false) }
  }

  return (
    <div className="settings-page">
      <h2>Configurações</h2>
      {actionError && !showConfirm && <p className="settings-error" role="alert">{actionError}</p>}

      <div className="settings-section">
        <p className="settings-section-title">Conta</p>
        <div className="settings-info-row">
          <span className="settings-info-label">Email</span>
          <span className="settings-info-value">{user?.email || '—'}</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Nome</span>
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
                aria-label="Notificações push"
                role="switch"
                aria-checked={pushEnabled}
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
                Ative para receber avisos neste dispositivo.
              </p>
            )}
          </>
        )}
      </div>

      {pair && <div className="settings-section">
        <p className="settings-section-title">Relacionamento</p>
        <button
          className="btn-danger"
          onClick={() => { setActionError(null); setShowConfirm(true) }}
        >
          Desvincular parceiro
        </button>
      </div>}

      <div className="settings-section">
        <p className="settings-section-title">Suporte</p>
        <button className="btn-secondary" onClick={() => setShowBugReport(true)}>
          Reportar Problema
        </button>
      </div>

      <div className="settings-section">
        <p className="settings-section-title">Sessão</p>
        <button className="btn-secondary" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Saindo…' : 'Sair da conta'}
        </button>
      </div>

      {showConfirm && (
        <div className="settings-confirm-overlay" onClick={closeConfirm}>
          <div className="settings-confirm-dialog" ref={confirmRef} role="dialog" aria-modal="true" aria-labelledby="unpair-title" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
            <h3 id="unpair-title">Desvincular parceiro?</h3>
            <p>
              Isso encerra o vínculo e remove os dados compartilhados associados a ele. Para se conectar novamente, será necessário um novo convite.
            </p>
            {actionError && <p className="settings-error" role="alert">{actionError}</p>}
            <div className="settings-confirm-actions">
              <button
                className="btn-confirm-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={unpairing}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm-danger"
                onClick={handleUnpair}
                disabled={unpairing}
              >
                {unpairing ? 'Desvinculando…' : 'Desvincular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
    </div>
  )
}

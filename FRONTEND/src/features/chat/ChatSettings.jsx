import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import useChatStore from '../../stores/chatStore'
import './chatSettings.css'

const FONT_SIZES = [
  { value: 14, label: 'Small' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'X-Large' }
]

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      className={`chat-settings-toggle ${checked ? 'on' : 'off'}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
    >
      <span className="chat-settings-toggle__knob" />
    </button>
  )
}

export default function ChatSettings() {
  const navigate = useNavigate()
  const { settings, updateSetting, notificationPermission, requestNotificationPermission } = useChatStore()

  const handleEnableNotifications = async () => {
    await requestNotificationPermission()
  }

  return (
    <div className="chat-settings-page">
      <div className="chat-settings-header">
        <button className="chat-settings-back" onClick={() => navigate('/chat')} aria-label="Back to chat">
          <ArrowLeft size={24} />
        </button>
        <h2>Chat Settings</h2>
      </div>

      <div className="chat-settings-section">
        <p className="chat-settings-section-title">Notifications</p>

        {notificationPermission !== 'granted' && (
          <button className="chat-settings-enable-notif" onClick={handleEnableNotifications}>
            Enable Notifications
          </button>
        )}

        <div className="chat-settings-row">
          <span className="chat-settings-label">Notification Sounds</span>
          <Toggle
            checked={settings.notificationSounds}
            onChange={(v) => updateSetting('notificationSounds', v)}
          />
        </div>
        <div className="chat-settings-row">
          <span className="chat-settings-label">Message Preview</span>
          <Toggle
            checked={settings.messagePreview}
            onChange={(v) => updateSetting('messagePreview', v)}
          />
        </div>
        <p className="chat-settings-note">Notifications are global for all chats</p>
      </div>

      <div className="chat-settings-section">
        <p className="chat-settings-section-title">Appearance</p>

        <div className="chat-settings-theme-group">
          {THEMES.map(t => (
            <button
              key={t.value}
              className={`chat-settings-theme-btn ${settings.theme === t.value ? 'active' : ''}`}
              onClick={() => updateSetting('theme', t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="chat-settings-section-subtitle">Font Size</p>
        <div className="chat-settings-font-group">
          {FONT_SIZES.map(f => (
            <button
              key={f.value}
              className={`chat-settings-font-btn ${settings.fontSize === f.value ? 'active' : ''}`}
              onClick={() => updateSetting('fontSize', f.value)}
              style={{ fontSize: `${f.value}px` }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-settings-section">
        <p className="chat-settings-section-title">Chat</p>

        <div className="chat-settings-row">
          <span className="chat-settings-label">Read Receipts</span>
          <Toggle
            checked={settings.readReceipts}
            onChange={(v) => updateSetting('readReceipts', v)}
          />
        </div>
        <p className="chat-settings-note">When off, delivery indicators are hidden for both users</p>
      </div>
    </div>
  )
}

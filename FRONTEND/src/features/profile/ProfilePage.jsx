import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../shared/lib/supabase'
import AvatarUpload from './AvatarUpload'
import './profile.css'

export default function ProfilePage() {
  const { user, profile, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      await fetchProfile(user.id)
      setMessage({ type: 'success', text: 'Profile updated!' })
    }

    setSaving(false)
  }

  return (
    <div className="profile-page">
      <h2>Edit Profile</h2>

      <AvatarUpload />

      <form className="profile-form" onSubmit={handleSave}>
        <div className="profile-field">
          <label htmlFor="display-name">Display Name</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            disabled={saving}
          />
        </div>

        {message && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !displayName.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}

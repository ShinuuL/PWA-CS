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
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
    }
  }, [profile])

  const handleBlur = async () => {
    if (!user || !displayName.trim()) return
    if (displayName.trim() === (profile?.display_name || '')) return

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id)

    if (!error) {
      await fetchProfile(user.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  return (
    <div className="profile-page">
      <h2>Edit Profile</h2>

      <AvatarUpload />

      <div className="profile-form">
        <div className="profile-field">
          <label htmlFor="display-name">Display Name</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={handleBlur}
            placeholder="Your name"
            maxLength={30}
          />
          {saved && <span className="profile-saved-check">&#10003;</span>}
        </div>

        <div className="profile-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

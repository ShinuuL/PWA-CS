import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import AvatarCropModal from './AvatarCropModal'

export default function AvatarUpload() {
  const { user, profile, fetchProfile } = useAuth()
  const [showCropModal, setShowCropModal] = useState(false)
  const [preview, setPreview] = useState(null)

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleAvatarUpdated = (newUrl) => {
    setPreview(newUrl)
    fetchProfile(user.id)
  }

  // Clear preview once the profile's avatar_url has been updated via fetchProfile
  useEffect(() => {
    if (preview && profile?.avatar_url && profile.avatar_url !== preview) {
      setPreview(null)
    }
  }, [preview, profile?.avatar_url])

  const avatarUrl = preview || profile?.avatar_url

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
      <div
        onClick={() => setShowCropModal(true)}
        style={{
          position: 'relative',
          width: 96,
          height: 96,
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'pointer',
          background: 'var(--color-bg-input)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--color-border)',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '2rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {getInitials(profile?.display_name)}
          </span>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
            fontSize: '0.75rem',
            color: '#fff',
          }}
          className="avatar-overlay"
        >
          Upload Photo
        </div>
      </div>

      <style>{`
        div:hover > .avatar-overlay { opacity: 1 !important; }
      `}</style>

      <AvatarCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onAvatarUpdated={handleAvatarUpdated}
      />
    </div>
  )
}

import { useState, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../shared/lib/supabase'

const MAX_SIZE = 5 * 1024 * 1024

export default function AvatarUpload() {
  const { user, profile, fetchProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > MAX_SIZE) {
      setError('Image must be under 5MB.')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)

    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      await fetchProfile(user.id)
    }

    setUploading(false)
  }

  const avatarUrl = preview || profile?.avatar_url

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
      <div
        onClick={handleClick}
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
          {uploading ? 'Uploading...' : 'Change Photo'}
        </div>
      </div>

      <style>{`
        div:hover > .avatar-overlay { opacity: 1 !important; }
      `}</style>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  )
}

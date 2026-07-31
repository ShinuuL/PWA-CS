import { useState, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'
import { supabase } from '../../shared/lib/supabase'
import { useAuth } from '../auth/useAuth'
import './AvatarCropModal.css'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

function getCroppedImg(imageSrc, crop, displayWidth, displayHeight) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const scaleX = image.naturalWidth / displayWidth
      const scaleY = image.naturalHeight / displayHeight

      canvas.width = crop.width * scaleX
      canvas.height = crop.height * scaleY
      const ctx = canvas.getContext('2d')

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.8
      )
    }
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = imageSrc
  })
}

export default function AvatarCropModal({ isOpen, onClose, onAvatarUpdated }) {
  const { user, fetchProfile } = useAuth()
  const [imgSrc, setImgSrc] = useState(null)
  const [crop, setCrop] = useState(null)
  const [completedCrop, setCompletedCrop] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const imgRef = useRef(null)
  const fileInputRef = useRef(null)

  const getInitialCrop = useCallback((width, height) => {
    return centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    )
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 15MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setImgSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const handleImageLoad = (e) => {
    const { width, height } = e.currentTarget
    const initialCrop = getInitialCrop(width, height)
    setCrop(initialCrop)
    setCompletedCrop(initialCrop)
  }

  const handleUpload = async () => {
    if (!completedCrop || !imgSrc) return

    setUploading(true)
    setError(null)

    try {
      const imgElement = imgRef.current
      if (!imgElement) return
      const blob = await getCroppedImg(imgSrc, completedCrop, imgElement.clientWidth, imgElement.clientHeight)

      const filePath = `${user.id}/avatar.${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true })

      if (uploadError) {
        toast.error('Upload failed. Tap to retry.')
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

      if (updateError) {
        toast.error('Upload failed. Tap to retry.')
        setUploading(false)
        return
      }

      await fetchProfile(user.id)
      toast.success('Profile photo updated')
      onAvatarUpdated?.(avatarUrl)
      handleClose()
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload failed. Tap to retry.')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setImgSrc(null)
    setCrop(null)
    setCompletedCrop(null)
    setError(null)
    onClose()
  }

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="avatar-crop-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="avatar-crop-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="avatar-crop-header">
              <h3>Upload Photo</h3>
              <button className="avatar-crop-close" onClick={handleClose}>
                ×
              </button>
            </div>

            <div className="avatar-crop-body">
              {!imgSrc ? (
                <div className="avatar-crop-placeholder">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="avatar-crop-select-btn"
                    onClick={handleOpenFilePicker}
                  >
                    Select Photo
                  </button>
                  <p className="avatar-crop-hint">
                    JPG, PNG. Max 15MB.
                  </p>
                </div>
              ) : (
                <div className="avatar-crop-crop-area">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    circularCrop
                    aspect={1}
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      onLoad={handleImageLoad}
                      alt="Crop preview"
                      style={{ maxHeight: '400px', maxWidth: '100%' }}
                    />
                  </ReactCrop>
                </div>
              )}

              {error && (
                <div className="avatar-crop-error">{error}</div>
              )}
            </div>

            <div className="avatar-crop-actions">
              {imgSrc ? (
                <>
                  <button
                    className="avatar-crop-select-btn"
                    onClick={handleOpenFilePicker}
                    disabled={uploading}
                  >
                    Choose Different Photo
                  </button>
                  <button
                    className="avatar-crop-upload-btn"
                    onClick={handleUpload}
                    disabled={uploading || !completedCrop}
                  >
                    {uploading ? (
                      <span className="avatar-crop-spinner" />
                    ) : (
                      'Upload'
                    )}
                  </button>
                </>
              ) : (
                <button
                  className="avatar-crop-cancel-btn"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

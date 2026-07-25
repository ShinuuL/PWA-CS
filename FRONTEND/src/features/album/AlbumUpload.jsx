import { useState, useRef } from 'react'
import { Plus, Camera, Loader2 } from 'lucide-react'
import { compressImage } from '../../shared/lib/imageCompress'
import useAlbumStore from '../../stores/albumStore'
import './album.css'

export default function AlbumUpload() {
  const [preview, setPreview] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [savings, setSavings] = useState(null)
  const [caption, setCaption] = useState('')
  const fileInputRef = useRef(null)
  const uploading = useAlbumStore((s) => s.uploading)
  const uploadAlbumPhoto = useAlbumStore((s) => s.uploadAlbumPhoto)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so same file can be re-selected
    e.target.value = ''

    // Show preview with compression info
    try {
      const result = await compressImage(file)
      setPreview(file)
      setPreviewUrl(URL.createObjectURL(result.blob))
      const pct = result.originalSize > 0
        ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
        : 0
      setSavings(pct > 0 ? `Compressed ${pct}%` : null)
    } catch {
      // Fallback: show original
      setPreview(file)
      setPreviewUrl(URL.createObjectURL(file))
      setSavings(null)
    }
  }

  const handleUpload = async () => {
    if (!preview) return
    await uploadAlbumPhoto(preview, caption)
    handleClose()
  }

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreview(null)
    setPreviewUrl(null)
    setSavings(null)
    setCaption('')
  }

  return (
    <>
      <button
        className="album-upload-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Add photo"
      >
        {uploading ? <Loader2 size={24} className="spin" /> : <Plus size={24} />}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {preview && (
        <div className="album-upload-preview" onClick={handleClose}>
          <div className="album-upload-preview-card" onClick={(e) => e.stopPropagation()}>
            <img
              className="album-upload-preview-img"
              src={previewUrl}
              alt="Preview"
            />
            {savings && (
              <div className="album-upload-preview-savings">{savings}</div>
            )}
            <input
              className="album-upload-preview-caption"
              type="text"
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
            />
            <div className="album-upload-preview-actions">
              <button
                className="album-upload-preview-cancel"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                className="album-upload-preview-confirm"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

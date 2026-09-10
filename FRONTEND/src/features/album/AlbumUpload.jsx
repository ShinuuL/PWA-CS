import { useState, useRef } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import useAlbumStore from '../../stores/albumStore'
import './album.css'

export default function AlbumUpload() {
  const [preview, setPreview] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [caption, setCaption] = useState('')
  const fileInputRef = useRef(null)
  const uploading = useAlbumStore((s) => s.uploading)
  const uploadAlbumPhoto = useAlbumStore((s) => s.uploadAlbumPhoto)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so same file can be re-selected
    e.target.value = ''

    // Keep the original for preview; the store compresses exactly once on upload.
    setPreview(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!preview) return
    const uploaded = await uploadAlbumPhoto(preview, caption)
    if (uploaded) handleClose()
  }

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreview(null)
    setPreviewUrl(null)
    setCaption('')
  }

  return (
    <>
      <button
        className="album-upload-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Adicionar foto"
        aria-label="Adicionar foto"
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
          <div className="album-upload-preview-card" role="dialog" aria-modal="true" aria-labelledby="album-upload-title" onClick={(e) => e.stopPropagation()}>
            <h2 className="sr-only" id="album-upload-title">Enviar foto para o álbum</h2>
            <img
              className="album-upload-preview-img"
              src={previewUrl}
              alt="Preview"
            />
            <label className="sr-only" htmlFor="album-caption">Legenda (opcional)</label>
            <input
              id="album-caption"
              className="album-upload-preview-caption"
              type="text"
              placeholder="Adicione uma legenda (opcional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
            />
            <div className="album-upload-preview-actions">
              <button
                className="album-upload-preview-cancel"
                onClick={handleClose}
              >
                Cancelar
              </button>
              <button
                className="album-upload-preview-confirm"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

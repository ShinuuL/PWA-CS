import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Trash2 } from 'lucide-react'
import { usePairing } from '../pairing/usePairing'
import useAuthStore from '../../stores/authStore'
import useAlbumStore from '../../stores/albumStore'
import AlbumGrid from './AlbumGrid'
import AlbumUpload from './AlbumUpload'
import PrivateImage from '../../shared/components/PrivateImage'
import './album.css'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

export default function AlbumPage() {
  const navigate = useNavigate()
  const { pair } = usePairing()
  const activePairId = pair?.id
  const { user } = useAuthStore()
  const {
    photos, loading, error,
    initializeAlbum, deletePhoto, cleanup
  } = useAlbumStore()

  const [viewerPhoto, setViewerPhoto] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (activePairId) void Promise.resolve(initializeAlbum(activePairId)).catch(error => toast.error(error.message || 'Não foi possível carregar o álbum.'))
    return () => cleanup()
  }, [activePairId, initializeAlbum, cleanup])

  const handlePhotoTap = (photo) => {
    setViewerPhoto(photo)
  }

  const handleDeleteRequest = (photo) => {
    setConfirmDelete(photo)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    await deletePhoto(confirmDelete.id, confirmDelete.storage_path)
    setConfirmDelete(null)
    setViewerPhoto(null)
  }

  return (
    <div className="album-page">
      {/* Header */}
      <div className="album-header">
        <button className="album-header-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div className="album-header-info">
          <h1 className="album-header-title">Shared Album</h1>
          <div className="album-header-count">
            {loading ? 'Carregando…' : `${photos.length} ${photos.length !== 1 ? 'fotos' : 'foto'}`}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="chat-error-banner">{error}</div>
      )}

      {/* Content */}
      <div className="album-content">
        {loading ? (
          <div className="album-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="album-grid__skeleton" />
            ))}
          </div>
        ) : (
          <AlbumGrid
            photos={photos}
            onPhotoTap={handlePhotoTap}
            onDeletePhoto={handleDeleteRequest}
            currentUserId={user?.id}
          />
        )}
      </div>

      {/* Upload FAB */}
      <AlbumUpload />

      {/* Lightbox viewer */}
      {viewerPhoto && (
        <div className="album-lightbox" role="dialog" aria-modal="true" aria-label="Visualização da foto" onClick={() => setViewerPhoto(null)}>
          <div className="album-lightbox-header">
            <div className="album-lightbox-meta">
              {viewerPhoto.caption && (
                <div className="album-lightbox-caption">{viewerPhoto.caption}</div>
              )}
              <div className="album-lightbox-date">{formatDate(viewerPhoto.created_at)}</div>
            </div>
            <button
              className="album-lightbox-close"
              onClick={() => setViewerPhoto(null)}
              aria-label="Fechar foto"
            >
              <X size={20} />
            </button>
          </div>

          <PrivateImage
            className="album-lightbox-img"
            src={viewerPhoto.url}
            storagePath={viewerPhoto.storage_path}
            alt={viewerPhoto.caption || 'Foto do álbum'}
            onClick={(e) => e.stopPropagation()}
          />

          {viewerPhoto.user_id === user?.id && (
            <div className="album-lightbox-footer">
              <button
                className="album-lightbox-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteRequest(viewerPhoto)
                }}
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="album-upload-preview" onClick={() => setConfirmDelete(null)}>
          <div className="album-upload-preview-card" role="dialog" aria-modal="true" aria-labelledby="delete-photo-title" onClick={(e) => e.stopPropagation()}>
            <p id="delete-photo-title" style={{ color: 'var(--color-text-primary)', fontSize: '0.9375rem', fontWeight: 600 }}>
              Excluir esta foto?
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="album-upload-preview-actions">
              <button
                className="album-upload-preview-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="album-upload-preview-confirm"
                style={{ background: '#FF6B6B' }}
                onClick={handleConfirmDelete}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { Trash2 } from 'lucide-react'
import PrivateImage from '../../shared/components/PrivateImage'
import './album.css'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AlbumGrid({ photos, onPhotoTap, onDeletePhoto, currentUserId }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="album-grid">
        <div className="album-grid__empty">
          <div className="album-grid__empty-icon">📷</div>
          <div className="album-grid__empty-text">
            Ainda não há fotos — comecem a montar o álbum de vocês.
          </div>
          <div className="album-grid__empty-sub">
            Toque no botão + para adicionar a primeira foto
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="album-grid">
      {photos.map((photo) => {
        const isOwn = photo.user_id === currentUserId
        return (
          <div
            key={photo.id}
            className="album-grid__cell"
            onClick={() => onPhotoTap?.(photo)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onPhotoTap?.(photo)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={photo.caption || 'Abrir foto'}
          >
            <PrivateImage
              className="album-grid__img"
              src={photo.url}
              storagePath={photo.storage_path}
              alt={photo.caption || 'Album photo'}
              loading="lazy"
            />
            <div className="album-grid__overlay">
              {photo.caption && (
                <div className="album-grid__overlay-text">{photo.caption}</div>
              )}
              <div className="album-grid__overlay-date">{formatDate(photo.created_at)}</div>
            </div>
            {isOwn && (
              <button
                className="album-grid__delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePhoto?.(photo)
                }}
                title="Excluir foto"
                aria-label="Excluir foto"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

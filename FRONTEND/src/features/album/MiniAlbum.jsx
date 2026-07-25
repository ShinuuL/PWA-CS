import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, X } from 'lucide-react'
import { usePairing } from '../pairing/usePairing'
import useAlbumStore from '../../stores/albumStore'
import './album.css'

export default function MiniAlbum() {
  const navigate = useNavigate()
  const { checkPairStatus } = usePairing()
  const { photos, loading, initializeAlbum, cleanup } = useAlbumStore()
  const [viewerPhoto, setViewerPhoto] = useState(null)

  useEffect(() => {
    checkPairStatus().then(pair => {
      if (pair) {
        initializeAlbum(pair.id)
      }
    })
    return () => cleanup()
  }, [checkPairStatus, initializeAlbum, cleanup])

  const recentPhotos = photos.slice(0, 10)

  if (loading) {
    return (
      <div className="mini-album">
        <div className="mini-album__header">
          <h3 className="mini-album__title">Our Album</h3>
        </div>
        <div className="mini-album__scroll">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mini-album__skeleton" />
          ))}
        </div>
      </div>
    )
  }

  if (recentPhotos.length === 0) {
    return (
      <div className="mini-album">
        <div className="mini-album__header">
          <h3 className="mini-album__title">Our Album</h3>
        </div>
        <div
          className="mini-album__empty"
          onClick={() => navigate('/album')}
          style={{ cursor: 'pointer' }}
        >
          <div className="mini-album__empty-icon">
            <Camera size={32} />
          </div>
          <div className="mini-album__empty-text">
            Add your first photo together
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mini-album">
        <div className="mini-album__header">
          <h3 className="mini-album__title">Our Album</h3>
          <button
            className="mini-album__see-all"
            onClick={() => navigate('/album')}
          >
            See All
          </button>
        </div>
        <div className="mini-album__scroll">
          {recentPhotos.map((photo) => (
            <div
              key={photo.id}
              className="mini-album__thumb"
              onClick={() => setViewerPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption || 'Album photo'}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {viewerPhoto && (
        <div className="album-lightbox" onClick={() => setViewerPhoto(null)}>
          <div className="album-lightbox-header">
            <div className="album-lightbox-meta">
              {viewerPhoto.caption && (
                <div className="album-lightbox-caption">{viewerPhoto.caption}</div>
              )}
            </div>
            <button
              className="album-lightbox-close"
              onClick={() => setViewerPhoto(null)}
            >
              <X size={20} />
            </button>
          </div>
          <img
            className="album-lightbox-img"
            src={viewerPhoto.url}
            alt={viewerPhoto.caption || 'Album photo'}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

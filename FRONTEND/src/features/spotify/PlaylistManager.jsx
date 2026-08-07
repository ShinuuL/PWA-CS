import { useEffect } from 'react'
import { X, Trash2, Plus, Music, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import useSpotifyStore from '../../stores/spotifyStore'
import './PlaylistManager.css'

export default function PlaylistManager({ onClose, onAddMusic }) {
  const playlistTracks = useSpotifyStore((s) => s.playlistTracks)
  const removeTrack = useSpotifyStore((s) => s.removeTrack)
  const playUri = useSpotifyStore((s) => s.playUri)

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleRemove = (track) => {
    removeTrack(track.uri)
  }

  return (
    <motion.div
      className="playlist-manager__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="playlist-manager__modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="playlist-manager__header">
          <h3 className="playlist-manager__title">Nossa Playlist ({playlistTracks.length})</h3>
          <button className="playlist-manager__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="playlist-manager__list">
          {playlistTracks.length === 0 ? (
            <div className="playlist-manager__empty">
              <Music size={32} className="playlist-manager__empty-icon" />
              <p>Playlist vazia</p>
            </div>
          ) : (
            playlistTracks.map((track) => (
              <div key={track.uri} className="playlist-manager__track">
                {track.albumArt && (
                  <img src={track.albumArt} alt={track.name} className="playlist-manager__track-art" />
                )}
                <div className="playlist-manager__track-info">
                  <p className="playlist-manager__track-name">{track.name}</p>
                  <p className="playlist-manager__track-artist">{track.artist}</p>
                </div>
                <button className="playlist-manager__play-btn" onClick={() => playUri(track.uri)}>
                  <Play size={16} />
                </button>
                <button className="playlist-manager__remove-btn" onClick={() => handleRemove(track)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <button className="playlist-manager__add-btn" onClick={onAddMusic}>
          <Plus size={16} />
          Adicionar música
        </button>
      </motion.div>
    </motion.div>
  )
}
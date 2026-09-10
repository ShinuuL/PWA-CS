import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, Check, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import useSpotifyStore from '../../stores/spotifyStore'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import './SpotifySearch.css'

export default function SpotifySearch({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [addedTrackId, setAddedTrackId] = useState(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const dialogRef = useDialogFocus(true, onClose)

  const searchTracks = useSpotifyStore((s) => s.searchTracks)
  const addTrack = useSpotifyStore((s) => s.addTrack)
  const searchResults = useSpotifyStore((s) => s.searchResults)

  // Debounced search
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (query.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    timerRef.current = setTimeout(() => {
      Promise.resolve(searchTracks(query))
        .catch(() => {})
        .finally(() => setIsLoading(false))
    }, 300)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [query, searchTracks])

  // Update results when store results change
  useEffect(() => {
    setResults(searchResults)
    setIsLoading(false)
  }, [searchResults])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAdd = useCallback(
    async (track) => {
      await addTrack(track.uri)
      setAddedTrackId(track.id)
      setTimeout(() => {
        setAddedTrackId(null)
      }, 1500)
    },
    [addTrack]
  )

  return (
    <motion.div
      className="spotify-search__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        className="spotify-search__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotify-search-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spotify-search__header">
          <h3 id="spotify-search-title" className="spotify-search__title">Buscar música</h3>
          <button className="spotify-search__close" onClick={onClose} aria-label="Fechar busca">
            <X size={20} />
          </button>
        </div>
        <div className="spotify-search__input-container">
          <Search size={16} className="spotify-search__search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="spotify-search__input"
            aria-label="Buscar música"
            placeholder="Buscar música…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="spotify-search__results">
          {isLoading && (
            <div className="spotify-search__loading">
              <Loader2 size={24} className="spinner" />
              <span>Carregando…</span>
            </div>
          )}
          {!isLoading && results.length === 0 && query.length >= 2 && (
            <div className="spotify-search__empty">Nenhum resultado encontrado</div>
          )}
          {!isLoading &&
            results.map((track) => (
              <div key={track.id || track.uri} className="spotify-search__track">
                {track.albumArt && (
                  <img src={track.albumArt} alt={track.name} className="spotify-search__track-art" />
                )}
                <div className="spotify-search__track-info">
                  <p className="spotify-search__track-name">{track.name}</p>
                  <p className="spotify-search__track-artist">{track.artist}</p>
                </div>
                <button
                  className={`spotify-search__add-btn ${addedTrackId === track.id ? 'spotify-search__add-btn--added' : ''}`}
                  onClick={() => handleAdd(track)}
                  disabled={addedTrackId === track.id}
                >
                  {addedTrackId === track.id ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Music, Play, Pause, SkipForward, SkipBack, Shuffle, List, ExternalLink, Link2 } from 'lucide-react'
import useSpotifyStore from '../../stores/spotifyStore'
import useSpotifyAuth from './useSpotifyAuth'
import useSpotifyPlayer from './useSpotifyPlayer'
import SpotifySearch from './SpotifySearch'
import PlaylistManager from './PlaylistManager'
import './SpotifyPlayer.css'

export default function SpotifyPlayer() {
  const [showSearch, setShowSearch] = useState(false)
  const [showPlaylistManager, setShowPlaylistManager] = useState(false)
  const [countdown, setCountdown] = useState(null)

  const config = useSpotifyStore((s) => s.config)
  const currentTrack = useSpotifyStore((s) => s.currentTrack)
  const isPlaying = useSpotifyStore((s) => s.isPlaying)
  const progress = useSpotifyStore((s) => s.progress)
  const playlistTracks = useSpotifyStore((s) => s.playlistTracks)
  const isConnected = useSpotifyStore((s) => s.isConnected)
  const isLoading = useSpotifyStore((s) => s.isLoading)

  const autoRotateTimer = useSpotifyStore((s) => s.autoRotateTimer)
  const togglePlay = useSpotifyStore((s) => s.togglePlay)

  const setShuffle = useSpotifyStore((s) => s.setShuffle)
  const setAutoRotateInterval = useSpotifyStore((s) => s.setAutoRotateInterval)
  const startAutoRotate = useSpotifyStore((s) => s.startAutoRotate)
  const stopAutoRotate = useSpotifyStore((s) => s.stopAutoRotate)
  const fetchPlaylist = useSpotifyStore((s) => s.fetchPlaylist)
  const fetchUserPlaylists = useSpotifyStore((s) => s.fetchUserPlaylists)
  const setPlaylist = useSpotifyStore((s) => s.setPlaylist)

  const { startAuth } = useSpotifyAuth()
  const { next, previous, hasPremium } = useSpotifyPlayer()

  const [userPlaylists, setUserPlaylists] = useState([])

  // Determine current state
  const getState = () => {
    if (!isConnected) return 'not_connected'
    if (!config?.playlist_id) return 'no_playlist'
    if (playlistTracks.length === 0) return 'empty_playlist'
    if (!hasPremium) return 'premium_required'
    return 'playing'
  }

  const state = getState()

  // Fetch user playlists when connected but no playlist selected
  useEffect(() => {
    if (isConnected && !config?.playlist_id) {
      fetchUserPlaylists().then((playlists) => {
        setUserPlaylists(playlists)
      })
    }
  }, [isConnected, config?.playlist_id, fetchUserPlaylists])

  // Fetch playlist tracks when playlist is selected
  useEffect(() => {
    if (config?.playlist_id) {
      fetchPlaylist()
    }
  }, [config?.playlist_id, fetchPlaylist])

  // Start auto-rotate when connected and has playlist
  useEffect(() => {
    if (isConnected && config?.playlist_id && config?.is_enabled) {
      startAutoRotate()
    }
    return () => {
      stopAutoRotate()
    }
  }, [isConnected, config?.playlist_id, config?.is_enabled, startAutoRotate, stopAutoRotate])

  // Countdown timer for auto-rotate
  useEffect(() => {
    if (!autoRotateTimer || !config?.is_enabled) {
      setCountdown(null)
      return
    }

    const intervalMs = (config.interval || 3) * 60 * 1000
    let startTime = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, intervalMs - elapsed)
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)

      if (remaining <= 0) {
        startTime = Date.now()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRotateTimer, config?.is_enabled, config?.interval])

  // Format time mm:ss
  const formatTime = (ms) => {
    if (!ms) return '0:00'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Handle playlist selection
  const handleSelectPlaylist = async (playlistId, name) => {
    await setPlaylist(playlistId, name)
    await fetchPlaylist()
  }

  // Render based on state
  const renderContent = () => {
    switch (state) {
      case 'not_connected':
        return (
          <div className="spotify-player__state">
            <Music size={32} className="spotify-player__icon" />
            <p className="spotify-player__text">Vincule seu Spotify</p>
            <button className="spotify-player__btn spotify-player__btn--primary" onClick={startAuth}>
              <Link2 size={16} />
              Conectar
            </button>
          </div>
        )

      case 'no_playlist':
        return (
          <div className="spotify-player__state">
            <Music size={32} className="spotify-player__icon" />
            <p className="spotify-player__text">Selecione uma playlist</p>
            <div className="spotify-player__playlists">
              {userPlaylists.length > 0 ? (
                userPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    className="spotify-player__playlist-item"
                    onClick={() => handleSelectPlaylist(pl.id, pl.name)}
                  >
                    {pl.name} ({pl.trackCount} músicas)
                  </button>
                ))
              ) : (
                <p className="spotify-player__text">Carregando playlists...</p>
              )}
            </div>
          </div>
        )

      case 'empty_playlist':
        return (
          <div className="spotify-player__state">
            <Music size={32} className="spotify-player__icon" />
            <p className="spotify-player__text">Adicione músicas à playlist</p>
            <button className="spotify-player__btn spotify-player__btn--primary" onClick={() => setShowSearch(true)}>
              Buscar Música
            </button>
          </div>
        )

      case 'premium_required':
        return (
          <div className="spotify-player__state">
            <Music size={32} className="spotify-player__icon" />
            <p className="spotify-player__text">Requer Spotify Premium</p>
            <a
              href="https://spotify.com/premium"
              target="_blank"
              rel="noopener noreferrer"
              className="spotify-player__btn spotify-player__btn--primary"
            >
              Assine Premium
            </a>
            {currentTrack && (
              <div className="spotify-player__fallback">
                <p className="spotify-player__track-name">{currentTrack.name}</p>
                <p className="spotify-player__track-artist">{currentTrack.artist}</p>
                <a
                  href={`https://open.spotify.com/track/${currentTrack.uri?.split(':').pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-player__btn spotify-player__btn--secondary"
                >
                  <ExternalLink size={14} />
                  Abrir no Spotify
                </a>
              </div>
            )}
          </div>
        )

      case 'playing':
        return (
          <div className="spotify-player__playing">
            {currentTrack?.albumArt && (
              <img src={currentTrack.albumArt} alt={currentTrack.name} className="spotify-player__album-art" />
            )}
            <div className="spotify-player__track-info">
              <p className="spotify-player__track-name">{currentTrack?.name || 'Nenhuma música'}</p>
              <p className="spotify-player__track-artist">{currentTrack?.artist || ''}</p>
            </div>
            <div className="spotify-player__controls">
              <button className="spotify-player__control-btn" onClick={previous}>
                <SkipBack size={18} />
              </button>
              <button className="spotify-player__control-btn spotify-player__control-btn--play" onClick={togglePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button className="spotify-player__control-btn" onClick={next}>
                <SkipForward size={18} />
              </button>
              <button className="spotify-player__control-btn" onClick={() => setShuffle(true)}>
                <Shuffle size={16} />
              </button>
            </div>
            <div className="spotify-player__progress-container">
              <div className="spotify-player__progress-bar">
                <div
                  className="spotify-player__progress-fill"
                  style={{ width: `${(progress / (currentTrack?.duration_ms || 1)) * 100}%` }}
                />
              </div>
              <span className="spotify-player__time">
                {formatTime(progress)} / {formatTime(currentTrack?.duration_ms)}
              </span>
            </div>
            {config?.is_enabled && countdown && (
              <p className="spotify-player__countdown">Próxima em: {countdown}</p>
            )}
            <div className="spotify-player__interval">
              <label>Intervalo:</label>
              <select
                value={config?.interval || 3}
                onChange={(e) => setAutoRotateInterval(parseInt(e.target.value))}
              >
                {[1, 2, 3, 5, 10, 15, 20, 30].map((min) => (
                  <option key={min} value={min}>
                    {min} min
                  </option>
                ))}
              </select>
            </div>
            <button className="spotify-player__btn spotify-player__btn--secondary" onClick={() => setShowPlaylistManager(true)}>
              <List size={14} />
              Nossa Playlist ({playlistTracks.length})
            </button>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="spotify-player">
        <div className="spotify-player__loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="spotify-player">
      <div className="spotify-player__header">
        <h3 className="spotify-player__title">Nossa Playlist</h3>
        {isConnected && config?.playlist_id && (
          <button className="spotify-player__header-btn" onClick={() => setShowPlaylistManager(true)}>
            <List size={16} />
          </button>
        )}
      </div>
      {renderContent()}
      <AnimatePresence>
        {showSearch && (
          <SpotifySearch onClose={() => setShowSearch(false)} />
        )}
        {showPlaylistManager && (
          <PlaylistManager onClose={() => setShowPlaylistManager(false)} onAddMusic={() => {
            setShowPlaylistManager(false)
            setShowSearch(true)
          }} />
        )}
      </AnimatePresence>
    </div>
  )
}
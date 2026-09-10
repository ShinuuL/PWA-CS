import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { usePairing } from '../pairing/usePairing'
import useSpotifyStore from '../../stores/spotifyStore'
import SpotifyPlayer from './SpotifyPlayer'
import './spotify-page.css'

export default function SpotifyPage() {
  const { pair } = usePairing()
  const activePairId = pair?.id
  const initializeSpotify = useSpotifyStore((s) => s.initializeSpotify)

  useEffect(() => {
    if (activePairId) {
      void Promise.resolve(initializeSpotify(activePairId)).catch(error => toast.error(error.message || 'Não foi possível carregar os dados.'))
    }

    return () => {
      useSpotifyStore.getState().stopAutoRotate()
      useSpotifyStore.getState().cleanupVisibilityHandler()
    }
  }, [activePairId, initializeSpotify])

  return (
    <div className="spotify-page">
      <header className="spotify-page__header">
        <div className="spotify-page__heading-group">
          <p className="spotify-page__eyebrow">Ritual compartilhado</p>
          <h1 className="spotify-page__title">Uma trilha para o momento de vocês.</h1>
          <p className="spotify-page__subtitle">
            O Spotify ganha um palco próprio, com a playlist do casal e controles simples para ouvir juntos.
          </p>
        </div>
      </header>
      <SpotifyPlayer />
    </div>
  )
}

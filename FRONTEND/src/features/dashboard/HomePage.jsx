import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { usePairing } from '../pairing/usePairing'
import useDashboardStore from '../../stores/dashboardStore'
import useSpotifyStore from '../../stores/spotifyStore'
import './dashboard.css'

import MemoryHero from './MemoryHero'
import MoodSelector from './MoodSelector'
import PartnerMood from './PartnerMood'
import MiniAlbum from '../album/MiniAlbum'
import SpotifyPlayer from '../spotify/SpotifyPlayer'

export default function HomePage() {
  const { pair } = usePairing()
  const activePairId = pair?.id
  const initializeDashboard = useDashboardStore((s) => s.initializeDashboard)
  const cleanup = useDashboardStore((s) => s.cleanup)

  const initializeSpotify = useSpotifyStore((s) => s.initializeSpotify)

  useEffect(() => {
    if (activePairId) {
        void Promise.resolve(initializeDashboard(activePairId)).catch(error => toast.error(error.message || 'Não foi possível carregar os dados.'))
        void Promise.resolve(initializeSpotify(activePairId)).catch(error => toast.error(error.message || 'Não foi possível carregar os dados.'))
    }
    return () => {
      cleanup()
      // cleanupSpotify() removido — não deve apagar sessão só por desmontar a tela
      useSpotifyStore.getState().stopAutoRotate()
      useSpotifyStore.getState().cleanupVisibilityHandler()
    }
  }, [activePairId, initializeDashboard, cleanup, initializeSpotify])

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <MemoryHero />
        <div className="right-column">
          <div className="right-top">
            <PartnerMood />
            <MoodSelector />
          </div>
          <SpotifyPlayer />
          <MiniAlbum />
        </div>
      </div>
    </div>
  )
}

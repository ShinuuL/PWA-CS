import { useEffect } from 'react'
import { usePairing } from '../pairing/usePairing'
import useDashboardStore from '../../stores/dashboardStore'
import useSpotifyStore from '../../stores/spotifyStore'
import CosmicBackground from './CosmicBackground'
import './dashboard.css'

import MemoryHero from './MemoryHero'
import MoodSelector from './MoodSelector'
import PartnerMood from './PartnerMood'
import MiniAlbum from '../album/MiniAlbum'
import SpotifyPlayer from '../spotify/SpotifyPlayer'

export default function HomePage() {
  const { checkPairStatus } = usePairing()
  const initializeDashboard = useDashboardStore((s) => s.initializeDashboard)
  const cleanup = useDashboardStore((s) => s.cleanup)

  const initializeSpotify = useSpotifyStore((s) => s.initializeSpotify)

  useEffect(() => {
    let cancelled = false
    checkPairStatus().then((pair) => {
      if (!cancelled && pair) {
        initializeDashboard(pair.id)
        initializeSpotify(pair.id)
      }
    })
    return () => {
      cancelled = true
      cleanup()
      // cleanupSpotify() removido — não deve apagar sessão só por desmontar a tela
      useSpotifyStore.getState().stopAutoRotate()
      useSpotifyStore.getState().cleanupVisibilityHandler()
    }
  }, [checkPairStatus, initializeDashboard, cleanup, initializeSpotify])

  return (
    <div className="dashboard">
      <CosmicBackground />
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

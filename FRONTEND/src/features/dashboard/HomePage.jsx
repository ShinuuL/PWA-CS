import { useEffect } from 'react'
import { usePairing } from '../pairing/usePairing'
import useDashboardStore from '../../stores/dashboardStore'
import './dashboard.css'

import MemoryHero from './MemoryHero'
import MoodSelector from './MoodSelector'
import PartnerMood from './PartnerMood'
import MiniAlbum from '../album/MiniAlbum'

export default function HomePage() {
  const { checkPairStatus } = usePairing()
  const initializeDashboard = useDashboardStore((s) => s.initializeDashboard)
  const cleanup = useDashboardStore((s) => s.cleanup)

  useEffect(() => {
    let cancelled = false
    checkPairStatus().then((pair) => {
      if (!cancelled && pair) {
        initializeDashboard(pair.id)
      }
    })
    return () => {
      cancelled = true
      cleanup()
    }
  }, [checkPairStatus, initializeDashboard, cleanup])

  return (
    <div className="dashboard">
      <MemoryHero />
      <PartnerMood />
      <MoodSelector />
      <MiniAlbum />
    </div>
  )
}

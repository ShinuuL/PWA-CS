import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { usePairing } from '../pairing/usePairing'
import useDashboardStore from '../../stores/dashboardStore'
import './dashboard.css'

import MemoryHero from './MemoryHero'
import MoodSelector from './MoodSelector'
import PartnerMood from './PartnerMood'
import MiniAlbum from '../album/MiniAlbum'

export default function HomePage() {
  const { pair } = usePairing()
  const activePairId = pair?.id
  const initializeDashboard = useDashboardStore((s) => s.initializeDashboard)
  const cleanup = useDashboardStore((s) => s.cleanup)

  useEffect(() => {
    if (activePairId) {
      void Promise.resolve(initializeDashboard(activePairId)).catch(error => toast.error(error.message || 'Não foi possível carregar os dados.'))
    }
    return () => {
      cleanup()
    }
  }, [activePairId, initializeDashboard, cleanup])

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <MemoryHero />
        <div className="right-column">
          <div className="right-top">
            <PartnerMood />
            <MoodSelector />
          </div>
          <MiniAlbum />
        </div>
      </div>
    </div>
  )
}

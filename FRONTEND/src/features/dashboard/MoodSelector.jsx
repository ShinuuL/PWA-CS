import React, { Suspense, lazy } from 'react'
import { AnimatePresence } from 'framer-motion'
import useDashboardStore from '../../stores/dashboardStore'
import MoodModal from './MoodModal'
import useBreakpoint from '../../hooks/useBreakpoint'

// Lazy-load the resolution-specific selectors to reduce initial bundle size
const MoodSelectorMobile = lazy(() => import('./MoodSelectorMobile'))
const MoodSelectorTablet = lazy(() => import('./MoodSelectorTablet'))
const MoodSelectorDesktop = lazy(() => import('./MoodSelectorDesktop'))

export default function MoodSelector() {
  const bp = useBreakpoint()
  const myMood = useDashboardStore((s) => s.myMood)
  const setMood = useDashboardStore((s) => s.setMood)
  const [showCustomModal, setShowCustomModal] = React.useState(false)

  const openCustom = () => setShowCustomModal(true)
  const closeCustom = () => setShowCustomModal(false)

  // Render the appropriate variant inside Suspense so it loads on demand
  const renderVariant = () => {
    if (bp === 'mobile') return <MoodSelectorMobile onOpenCustom={openCustom} />
    if (bp === 'tablet') return <MoodSelectorTablet onOpenCustom={openCustom} />
    return <MoodSelectorDesktop onOpenCustom={openCustom} />
  }

  return (
    <div>
      <Suspense fallback={<div style={{ minHeight: 88 }} />}>
        {renderVariant()}
      </Suspense>
      <AnimatePresence>
        {showCustomModal && (
          <MoodModal onClose={closeCustom} />
        )}
      </AnimatePresence>
    </div>
  )
}

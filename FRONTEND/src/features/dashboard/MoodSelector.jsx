import React from 'react'
import { AnimatePresence } from 'framer-motion'
import useDashboardStore from '../../stores/dashboardStore'
import MoodModal from './MoodModal'
import useBreakpoint from '../../hooks/useBreakpoint'
import MoodSelectorMobile from './MoodSelectorMobile'
import MoodSelectorTablet from './MoodSelectorTablet'
import MoodSelectorDesktop from './MoodSelectorDesktop'

export default function MoodSelector() {
  const bp = useBreakpoint()
  const myMood = useDashboardStore((s) => s.myMood)
  const setMood = useDashboardStore((s) => s.setMood)
  const [showCustomModal, setShowCustomModal] = React.useState(false)

  // delegate to resolution-specific components (pass handler for custom modal)
  let content = null
  const openCustom = () => setShowCustomModal(true)
  const closeCustom = () => setShowCustomModal(false)
  if (bp === 'mobile') content = <MoodSelectorMobile onOpenCustom={openCustom} />
  else if (bp === 'tablet') content = <MoodSelectorTablet onOpenCustom={openCustom} />
  else content = <MoodSelectorDesktop onOpenCustom={openCustom} />

  return (
    <div>
      {content}
      <AnimatePresence>
        {showCustomModal && (
          <MoodModal onClose={closeCustom} />
        )}
      </AnimatePresence>
    </div>
  )
}

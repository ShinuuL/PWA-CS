import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import useDashboardStore from '../../stores/dashboardStore'
import MoodModal from './MoodModal'

const MOODS = [
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'tired', emoji: '😴', label: 'Tired' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'missing', emoji: '💕', label: 'Missing' },
  { type: 'needy', emoji: '🥺', label: 'Needy' },
  { type: 'custom', emoji: '✏️', label: 'Custom' }
]

export default function MoodSelector() {
  const myMood = useDashboardStore((s) => s.myMood)
  const setMood = useDashboardStore((s) => s.setMood)
  const [showCustomModal, setShowCustomModal] = useState(false)

  const handleMoodSelect = (moodType) => {
    if (moodType === 'custom') {
      setShowCustomModal(true)
    } else {
      setMood(moodType)
    }
  }

  return (
    <div className="mood-section">
      <h3 className="mood-section__title">How are you feeling?</h3>
      <div className="mood-grid">
        {MOODS.map((mood) => (
          <motion.button
            key={mood.type}
            className={`mood-card ${myMood?.mood_type === mood.type ? 'mood-card--selected' : ''}`}
            onClick={() => handleMoodSelect(mood.type)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="mood-card__emoji">{mood.emoji}</span>
            <span className="mood-card__label">{mood.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showCustomModal && (
          <MoodModal onClose={() => setShowCustomModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

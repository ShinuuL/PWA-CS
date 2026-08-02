import { motion } from 'motion/react'
import useDashboardStore from '../../stores/dashboardStore'
import { MOODS } from './moodsData'

export default function MoodSelectorTablet({ onOpenCustom }) {
  const myMood = useDashboardStore((s) => s.myMood)
  const setMood = useDashboardStore((s) => s.setMood)

  const handleMoodSelect = (moodType) => {
    if (moodType === 'custom') {
      if (onOpenCustom) onOpenCustom()
      return
    }
    setMood(moodType)
  }

  return (
    <div className="mood-section">
      <h3 className="mood-section__title">Como você está se sentindo?</h3>
      <div className="mood-grid mood-grid--tablet">
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
    </div>
  )
}

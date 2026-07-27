import { motion, AnimatePresence } from 'motion/react'
import useDashboardStore from '../../stores/dashboardStore'
import useAuthStore from '../../stores/authStore'

const MOOD_EMOJIS = {
  happy: '😊',
  tired: '😴',
  sad: '😢',
  missing: '💕',
  needy: '🥺'
}

function getMoodEmoji(type) {
  return MOOD_EMOJIS[type] || '😊'
}

export default function PartnerMood() {
  const partnerMood = useDashboardStore((s) => s.partnerMood)
  const profile = useAuthStore((s) => s.profile)

  return (
    <div className="partner-mood">
      <AnimatePresence mode="wait">
        {partnerMood ? (
          <motion.div
            key={partnerMood.mood_type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="partner-mood__header">
              <img
                className="partner-mood__avatar"
                src={profile?.avatar_url}
                alt={profile?.display_name}
              />
              <span className="partner-mood__name">
                {profile?.display_name || 'Partner'} is feeling
              </span>
            </div>
            <div className="partner-mood__emoji">
              {partnerMood.custom_emoji || getMoodEmoji(partnerMood.mood_type)}
            </div>
            {partnerMood.custom_text && (
              <div className="partner-mood__text">
                &ldquo;{partnerMood.custom_text}&rdquo;
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="partner-mood__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="partner-mood__empty-emoji">💭</span>
            <span>Ask how they&apos;re feeling...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

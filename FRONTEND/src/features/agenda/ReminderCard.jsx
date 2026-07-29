import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Pencil } from 'lucide-react'
import './ReminderCard.css'

const PRIORITY_COLORS = {
  high: '#FF6B6B',
  normal: '#FFD93D',
  low: '#8B8FA3'
}

export default function ReminderCard({ reminder, onComplete, onEdit }) {
  const reminderDate = new Date(reminder.reminder_at)
  const day = format(reminderDate, 'd')
  const month = format(reminderDate, 'MMM', { locale: ptBR }).toUpperCase()
  const time = format(reminderDate, 'HH:mm')

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -80) {
      onComplete(reminder.id)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="reminder-card"
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        exit={{ x: -300, opacity: 0, transition: { duration: 0.3 } }}
        style={{ touchAction: 'pan-y', position: 'relative' }}
      >
        <div className="reminder-card__swipe-bg">
          <Check size={20} color="white" />
        </div>
        <div className="reminder-card__date">
          <span className="reminder-card__date-day">{day}</span>
          <span className="reminder-card__date-month">{month}</span>
        </div>
        <div className="reminder-card__info">
          <div className="reminder-card__info-title">
            <span
              className="reminder-card__priority-dot"
              style={{ background: PRIORITY_COLORS[reminder.priority] || PRIORITY_COLORS.normal }}
            />
            {reminder.title}
          </div>
          <div className="reminder-card__info-time">{time}</div>
          {reminder.notes && (
            <div className="reminder-card__info-notes">{reminder.notes}</div>
          )}
        </div>
        <div className="reminder-card__creator">
          {reminder.creator_avatar ? (
            <img
              className="reminder-card__avatar"
              src={reminder.creator_avatar}
              alt={reminder.creator_name || ''}
            />
          ) : (
            <div className="reminder-card__avatar reminder-card__avatar--initials">
              {(reminder.creator_name || '?')[0]?.toUpperCase()}
            </div>
          )}
          <span className="reminder-card__creator-name">{reminder.creator_name}</span>
        </div>
        <button
          className="reminder-card__edit-btn"
          onClick={() => onEdit(reminder)}
          type="button"
        >
          <Pencil size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

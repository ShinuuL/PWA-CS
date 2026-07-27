import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'motion/react'

const WEEKDAY_HEADERS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export default function CalendarGrid({ currentMonth, onMonthChange, events = [], onDayClick }) {
  const [dragStartX, setDragStartX] = useState(0)

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(currentMonth)
    const lastDay = endOfMonth(currentMonth)
    const startDate = startOfWeek(firstDay, { weekStartsOn: 0 })
    const endDate = endOfWeek(lastDay, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const daysWithEvents = useMemo(() => {
    const map = {}
    events.forEach(event => {
      const key = format(new Date(event.event_date), 'yyyy-MM-dd')
      map[key] = true
    })
    return map
  }, [events])

  const handleDragEnd = (event, info) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      onMonthChange(subMonths(currentMonth, 1))
    } else if (info.offset.x < -threshold) {
      onMonthChange(addMonths(currentMonth, 1))
    }
  }

  return (
    <div className="calendar-grid">
      <div className="calendar-grid__month-label">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </div>
      <motion.div
        className="calendar-grid__swipe-container"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="calendar-grid__weekdays">
          {WEEKDAY_HEADERS.map(day => (
            <div key={day} className="calendar-grid__weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid__days">
          {calendarDays.map((day, i) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayCell = isToday(day)
            const hasEvent = daysWithEvents[dayKey]

            return (
              <button
                key={i}
                className={`calendar-grid__day ${!isCurrentMonth ? 'calendar-grid__day--outside' : ''} ${isTodayCell ? 'calendar-grid__day--today' : ''}`}
                onClick={() => onDayClick && onDayClick(day)}
                type="button"
              >
                <span className="calendar-grid__day-number">{format(day, 'd')}</span>
                {hasEvent && <span className="calendar-grid__day-dot" />}
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

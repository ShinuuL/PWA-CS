import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function EventRow({ event }) {
  const eventDate = new Date(event.event_date)
  const day = format(eventDate, 'd')
  const month = format(eventDate, 'MMM', { locale: ptBR }).toUpperCase()

  const CATEGORY_ICONS = {
    'Noite de Date': '❤',
    'Consulta': '★',
    'Aniversário': '🎂',
    'Viagem': '✈',
    'Outro': '✦'
  }

  return (
    <div className="event-row">
      <div className="event-row__date">
        <span className="event-row__date-day">{day}</span>
        <span className="event-row__date-month">{month}</span>
      </div>
      <div className="event-row__info">
        <div className="event-row__info-title">{event.title}</div>
        {event.description && (
          <div className="event-row__info-desc">{event.description}</div>
        )}
      </div>
      <span className="event-row__category">
        {CATEGORY_ICONS[event.category] || '✦'}
      </span>
    </div>
  )
}

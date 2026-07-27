import { useState, useMemo, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import useAgendaStore from '../../stores/agendaStore'
import CalendarGrid from './CalendarGrid'
import EventRow from './EventRow'
import EventForm from './EventForm'

export default function EventsTab() {
  const { events, loading, error, createEvent, deleteEvent } = useAgendaStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm] = useState(false)

  const groupedEvents = useMemo(() => {
    const groups = {}
    events.forEach(event => {
      const key = format(new Date(event.event_date), 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = []
      groups[key].push(event)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  const handleCreateEvent = async (formData) => {
    const result = await createEvent(formData)
    if (result.error) {
      toast.error('Erro ao criar evento')
    } else {
      toast.success('Evento criado com sucesso!')
      setShowForm(false)
    }
  }

  if (loading) {
    return (
      <div className="events-tab">
        <div className="events-tab__skeleton">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="event-row-skeleton" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="events-tab events-tab--error">
        <p>Algo deu errado — Tente novamente</p>
        <button className="events-tab__retry" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="events-tab">
      <CalendarGrid
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        events={events}
        onDayClick={setSelectedDate}
      />
      {groupedEvents.length === 0 ? (
        <div className="events-tab__empty">
          <p className="events-tab__empty-title">Nenhum evento</p>
          <span className="events-tab__empty-text">Adicione seu primeiro evento</span>
        </div>
      ) : (
        <div className="events-tab__list">
          {groupedEvents.map(([dateKey, dayEvents]) => (
            <div key={dateKey} className="events-tab__group">
              <div className="events-tab__group-date">
                {format(new Date(dateKey), "d 'de' MMMM", { locale: ptBR })}
              </div>
              {dayEvents.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          ))}
        </div>
      )}
      <button className="events-tab__fab" onClick={() => setShowForm(true)} type="button">
        <Plus size={24} />
      </button>
      {showForm && (
        <div className="events-tab__modal-overlay" onClick={() => setShowForm(false)}>
          <div className="events-tab__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="events-tab__modal-title">Criar evento</h3>
            <EventForm
              onSubmit={handleCreateEvent}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

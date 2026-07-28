import { useState } from 'react'

const CATEGORIES = [
  { value: 'Noite de Date', label: 'Noite de Date' },
  { value: 'Consulta', label: 'Consulta' },
  { value: 'Aniversário', label: 'Aniversário' },
  { value: 'Viagem', label: 'Viagem' },
  { value: 'Outro', label: 'Outro' }
]

const REMINDERS = [
  { value: null, label: 'Nenhum' },
  { value: '1h', label: '1 hora antes' },
  { value: '1d', label: '1 dia antes' },
  { value: '1w', label: '1 semana antes' }
]

export default function EventForm({ onSubmit, initialEvent, onCancel }) {
  const [title, setTitle] = useState(initialEvent?.title || '')
  const [eventDate, setEventDate] = useState(initialEvent?.event_date || '')
  const [description, setDescription] = useState(initialEvent?.description || '')
  const [category, setCategory] = useState(initialEvent?.category || 'Outro')
  const [reminder, setReminder] = useState(initialEvent?.reminder || null)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!initialEvent
  const canSubmit = title.trim() && eventDate

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        event_date: eventDate,
        description: description.trim(),
        category,
        reminder
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <input
        className="event-form__input"
        type="text"
        placeholder="Nome do evento"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="event-form__input"
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />
      <textarea
        className="event-form__textarea"
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <div className="event-form__row">
        <select
          className="event-form__select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          className="event-form__select"
          value={reminder || ''}
          onChange={(e) => setReminder(e.target.value || null)}
        >
          {REMINDERS.map(r => (
            <option key={r.label} value={r.value || ''}>{r.label}</option>
          ))}
        </select>
      </div>
      <div className="event-form__actions">
        <button
          type="button"
          className="event-form__btn event-form__btn--cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="event-form__btn event-form__btn--submit"
          disabled={!canSubmit || submitting}
        >
          {isEdit ? 'Salvar' : 'Criar evento'}
        </button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import DateTimePicker from './DateTimePicker'
import './ReminderForm.css'

const PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' }
]

const CATEGORIES = [
  { value: 'Geral', label: 'Geral' },
  { value: 'Trabalho', label: 'Trabalho' },
  { value: 'Pessoal', label: 'Pessoal' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Outro', label: 'Outro' }
]

export default function ReminderForm({ onSubmit, onCancel, initialReminder }) {
  const [title, setTitle] = useState(initialReminder?.title || '')
  const [notes, setNotes] = useState(initialReminder?.notes || '')
  const [priority, setPriority] = useState(initialReminder?.priority || 'normal')
  const [category, setCategory] = useState(initialReminder?.category || 'Geral')
  const [reminderAt, setReminderAt] = useState(
    initialReminder?.reminder_at ? new Date(initialReminder.reminder_at) : null
  )
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!initialReminder
  const canSubmit = title.trim() && reminderAt

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        reminder_at: reminderAt.toISOString(),
        notes: notes.trim(),
        priority,
        category
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDateConfirm = (date) => {
    setReminderAt(date)
    setShowDatePicker(false)
  }

  const formattedDate = reminderAt
    ? format(reminderAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : 'Selecionar data e hora'

  return (
    <form className="reminder-form" onSubmit={handleSubmit}>
      <input
        className="reminder-form__input"
        type="text"
        placeholder="Título do lembrete"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button
        type="button"
        className="reminder-form__date-btn"
        onClick={() => setShowDatePicker(true)}
      >
        <Calendar size={16} />
        <span className="reminder-form__date-text">{formattedDate}</span>
      </button>
      {showDatePicker && (
        <DateTimePicker
          value={reminderAt}
          onChange={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
        />
      )}
      <textarea
        className="reminder-form__textarea"
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <div className="reminder-form__row">
        <select
          className="reminder-form__select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {PRIORITIES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          className="reminder-form__select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="reminder-form__actions">
        <button
          type="button"
          className="reminder-form__btn reminder-form__btn--cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="reminder-form__btn reminder-form__btn--submit"
          disabled={!canSubmit || submitting}
        >
          {isEdit ? 'Salvar' : 'Criar lembrete'}
        </button>
      </div>
    </form>
  )
}

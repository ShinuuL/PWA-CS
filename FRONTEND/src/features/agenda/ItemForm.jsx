import { useState } from 'react'
import DateTimePicker from './DateTimePicker'
import './ItemForm.css'

export default function ItemForm({ onSubmit, onCancel, initialItem }) {
  const [title, setTitle] = useState(initialItem?.title || '')
  const [assignedTo, setAssignedTo] = useState(initialItem?.assigned_to || null)
  const [dueAt, setDueAt] = useState(initialItem?.due_at || null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), assigned_to: assignedTo, due_at: dueAt })
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="item-form__input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titulo do item"
        autoFocus
      />

      <div className="item-form__section">
        <span className="item-form__label">Atribuir a</span>
        <div className="item-form__assignee-group">
          <button
            type="button"
            className={`item-form__assignee-btn ${assignedTo === 'me' ? 'item-form__assignee-btn--active' : ''}`}
            onClick={() => setAssignedTo(assignedTo === 'me' ? null : 'me')}
          >
            Eu
          </button>
          <button
            type="button"
            className={`item-form__assignee-btn ${assignedTo === 'partner' ? 'item-form__assignee-btn--active' : ''}`}
            onClick={() => setAssignedTo(assignedTo === 'partner' ? null : 'partner')}
          >
            Parceiro
          </button>
        </div>
      </div>

      <div className="item-form__section">
        <span className="item-form__label">Data (opcional)</span>
        {dueAt ? (
          <div className="item-form__date-display">
            <span className="item-form__date-text">
              {new Date(dueAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <button
              type="button"
              className="item-form__date-remove"
              onClick={() => setDueAt(null)}
            >
              Remover data
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="item-form__date-picker-toggle"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            Selecionar data
          </button>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={dueAt}
            onChange={(date) => { setDueAt(date.toISOString()); setShowDatePicker(false) }}
            onCancel={() => setShowDatePicker(false)}
          />
        )}
      </div>

      <div className="item-form__actions">
        <button className="item-form__cancel" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="item-form__submit" type="submit" disabled={!title.trim()}>
          {initialItem ? 'Salvar' : 'Criar item'}
        </button>
      </div>
    </form>
  )
}

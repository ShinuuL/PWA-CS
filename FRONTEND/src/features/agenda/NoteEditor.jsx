import { useState } from 'react'

export default function NoteEditor({ onSubmit, initialNote, onCancel }) {
  const [title, setTitle] = useState(initialNote?.title || '')
  const [body, setBody] = useState(initialNote?.body || '')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!initialNote
  const canSubmit = title.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(title.trim(), body.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="note-editor" onSubmit={handleSubmit}>
      <input
        className="note-editor__input"
        type="text"
        placeholder="Título da nota"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="note-editor__textarea"
        placeholder="Escreva aqui... (opcional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
      />
      <div className="note-editor__actions">
        <button
          type="button"
          className="note-editor__btn note-editor__btn--cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="note-editor__btn note-editor__btn--submit"
          disabled={!canSubmit || submitting}
        >
          {isEdit ? 'Salvar' : 'Criar nota'}
        </button>
      </div>
    </form>
  )
}

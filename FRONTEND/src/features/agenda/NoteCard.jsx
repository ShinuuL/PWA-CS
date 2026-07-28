import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'

export default function NoteCard({ note, onEdit, onDelete }) {
  const isUpdated = note.updated_at && note.updated_at !== note.created_at
  const dateLabel = isUpdated
    ? `Editada em ${format(new Date(note.updated_at), "d 'de' MMMM", { locale: ptBR })}`
    : `Criada em ${format(new Date(note.created_at), "d 'de' MMMM", { locale: ptBR })}`

  return (
    <div className="note-card">
      <div className="note-card__content">
        <h4 className="note-card__title">{note.title}</h4>
        {note.body && (
          <p className="note-card__body">{note.body}</p>
        )}
        <span className="note-card__meta">{dateLabel}</span>
      </div>
      <div className="note-card__actions">
        <button className="note-card__action" onClick={() => onEdit(note)} type="button">
          <Pencil size={16} />
        </button>
        <button className="note-card__action note-card__action--danger" onClick={() => onDelete(note)} type="button">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

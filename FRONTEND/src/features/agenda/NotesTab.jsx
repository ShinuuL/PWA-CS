import { useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import useNotesStore from '../../stores/notesStore'
import NoteCard from './NoteCard'
import NoteEditor from './NoteEditor'

export default function NotesTab() {
  const { notes, loading, error, createNote, updateNote, deleteNote } = useNotesStore()
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleCreate = async (title, body) => {
    const result = await createNote(title, body)
    if (result.error) {
      toast.error('Erro ao criar nota')
    } else {
      toast.success('Nota criada com sucesso!')
      setShowEditor(false)
    }
  }

  const handleEdit = async (title, body) => {
    if (!editingNote) return
    const result = await updateNote(editingNote.id, title, body)
    if (result.error) {
      toast.error('Erro ao salvar nota')
    } else {
      toast.success('Nota salva com sucesso!')
      setEditingNote(null)
      setShowEditor(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const result = await deleteNote(confirmDelete.id)
    if (result.error) {
      toast.error('Erro ao excluir nota')
    } else {
      toast.success('Nota excluída com sucesso!')
      setConfirmDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="notes-tab">
        <div className="notes-tab__skeleton">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="note-card-skeleton" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="notes-tab notes-tab--error">
        <p>Algo deu errado — Tente novamente</p>
        <button className="notes-tab__retry" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="notes-tab">
      {notes.length === 0 ? (
        <div className="notes-tab__empty">
          <p className="notes-tab__empty-title">Nenhuma nota ainda</p>
          <span className="notes-tab__empty-text">Crie sua primeira nota compartilhada</span>
        </div>
      ) : (
        <div className="notes-tab__list">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={(n) => {
                setEditingNote(n)
                setShowEditor(true)
              }}
              onDelete={(n) => setConfirmDelete(n)}
            />
          ))}
        </div>
      )}
      <button className="notes-tab__fab" onClick={() => setShowEditor(true)} type="button">
        <Plus size={24} />
      </button>
      {showEditor && (
        <div className="notes-tab__modal-overlay" onClick={() => { setShowEditor(false); setEditingNote(null); }}>
          <div className="notes-tab__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="notes-tab__modal-title">{editingNote ? 'Editar nota' : 'Criar nota'}</h3>
            <NoteEditor
              onSubmit={editingNote ? handleEdit : handleCreate}
              initialNote={editingNote}
              onCancel={() => { setShowEditor(false); setEditingNote(null); }}
            />
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="notes-tab__modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="notes-tab__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="notes-tab__modal-title">Excluir nota</h3>
            <p className="notes-tab__confirm-text">
              Essa ação não pode ser desfeita.
            </p>
            <div className="notes-tab__confirm-actions">
              <button
                className="notes-tab__btn notes-tab__btn--cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="notes-tab__btn notes-tab__btn--danger"
                onClick={handleDelete}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

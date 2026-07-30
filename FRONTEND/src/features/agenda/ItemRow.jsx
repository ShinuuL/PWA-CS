import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import './ItemRow.css'

export default function ItemRow({ item, profiles, currentUser, partnerId, onToggle, onEdit, onDelete, editMode, selected, onSelect }) {
  const isOverdue = useMemo(() => {
    if (!item.due_at || item.completed) return false
    return new Date(item.due_at) < new Date()
  }, [item.due_at, item.completed])

  const resolvedAssignee = useMemo(() => {
    if (!item.assigned_to) return null
    if (item.assigned_to === 'me') {
      return currentUser?.id || null
    }
    if (item.assigned_to === 'partner') {
      return partnerId || null
    }
    return null
  }, [item.assigned_to, currentUser, partnerId])

  const assigneeProfile = resolvedAssignee ? profiles[resolvedAssignee] : null

  const handleClick = () => {
    if (editMode) {
      onSelect(item.id)
    } else {
      onEdit(item)
    }
  }

  return (
    <div
      className={`item-row ${editMode ? 'item-row--edit' : ''} ${selected ? 'item-row--selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick() }}
    >
      {editMode ? (
        <input
          type="checkbox"
          className="item-row__checkbox"
          checked={selected}
          onChange={(e) => { e.stopPropagation(); onSelect(item.id) }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <label className="item-row__checkbox-wrapper">
          <input
            type="checkbox"
            className="item-row__checkbox"
            checked={item.completed}
            onChange={(e) => { e.stopPropagation(); onToggle(item.id) }}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="item-row__checkmark" />
        </label>
      )}

      <span className={`item-row__title ${item.completed ? 'item-row__title--done' : ''}`}>
        {item.title}
      </span>

      {assigneeProfile && (
        <span className="item-row__badge">
          {assigneeProfile.avatar_url ? (
            <img
              src={assigneeProfile.avatar_url}
              alt={assigneeProfile.display_name}
              className="item-row__avatar"
            />
          ) : (
            <span className="item-row__avatar item-row__avatar--initial">
              {(assigneeProfile.display_name || '?')[0].toUpperCase()}
            </span>
          )}
        </span>
      )}

      {item.due_at && (
        <span className={`item-row__date ${isOverdue ? 'item-row__date--overdue' : ''}`}>
          {format(new Date(item.due_at), 'd MMM', { locale: ptBR })}
        </span>
      )}

      {!editMode && (
        <button
          className="item-row__delete"
          onClick={(e) => { e.stopPropagation(); onDelete(item) }}
          type="button"
          aria-label="Excluir item"
        >
          &times;
        </button>
      )}
    </div>
  )
}

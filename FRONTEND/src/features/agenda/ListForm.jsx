import { useState } from 'react'
import ColorPicker from './ColorPicker'
import './ListForm.css'

export default function ListForm({ onSubmit, onCancel, initialList }) {
  const [name, setName] = useState(initialList?.name || '')
  const [color, setColor] = useState(initialList?.color || '#B87CFF')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color })
  }

  return (
    <form className="list-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="list-form__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da lista"
        autoFocus
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="list-form__actions">
        <button className="list-form__cancel" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="list-form__submit" type="submit" disabled={!name.trim()}>
          {initialList ? 'Salvar' : 'Criar lista'}
        </button>
      </div>
    </form>
  )
}

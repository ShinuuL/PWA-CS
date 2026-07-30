import { useState } from 'react'
import useDashboardStore from '../../stores/dashboardStore'

export default function MoodModal({ onClose }) {
  const [emoji, setEmoji] = useState('')
  const [text, setText] = useState('')
  const setMood = useDashboardStore((s) => s.setMood)

  const handleSave = async () => {
    if (text.trim()) {
      const result = await setMood('custom', text.trim(), emoji.trim() || null)
      if (!result?.error) {
        onClose()
      }
    }
  }

  return (
    <div className="mood-modal-overlay" onClick={onClose}>
      <div className="mood-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="mood-modal__title">Como você está se sentindo?</h3>
        <input
          className="mood-modal__emoji-input"
          placeholder="Escreva um emoji"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
        />
        <textarea
          className="mood-modal__input"
          placeholder="Conte ao seu parceiro como você se sente"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mood-modal__actions">
          <button
            className="mood-modal__btn mood-modal__btn--secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="mood-modal__btn mood-modal__btn--primary"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

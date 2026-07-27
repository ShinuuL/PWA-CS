import { useState } from 'react'
import useDashboardStore from '../../stores/dashboardStore'

export default function MoodModal({ onClose }) {
  const [text, setText] = useState('')
  const setMood = useDashboardStore((s) => s.setMood)

  const handleSave = async () => {
    if (text.trim()) {
      const result = await setMood('custom', text.trim())
      if (!result?.error) {
        onClose()
      }
    }
  }

  return (
    <div className="mood-modal-overlay" onClick={onClose}>
      <div className="mood-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="mood-modal__title">How are you feeling</h3>
        <textarea
          className="mood-modal__input"
          placeholder="Tell your partner how you feel"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mood-modal__actions">
          <button
            className="mood-modal__btn mood-modal__btn--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="mood-modal__btn mood-modal__btn--primary"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

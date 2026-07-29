import { Bell } from 'lucide-react'
import './agenda.css'

export default function RemindersTab() {
  return (
    <div className="reminders-tab">
      <div className="reminders-tab__empty">
        <Bell size={40} strokeWidth={1.5} color="var(--color-text-secondary)" />
        <p className="reminders-tab__empty-title">Nenhum lembrete ainda</p>
        <span className="reminders-tab__empty-text">Crie lembretes compartilhados com seu parceiro</span>
      </div>
    </div>
  )
}

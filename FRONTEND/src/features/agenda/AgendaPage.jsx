import { useState, useEffect } from 'react'
import { usePairing } from '../pairing/usePairing'
import useNotesStore from '../../stores/notesStore'
import useAgendaStore from '../../stores/agendaStore'
import useReminderStore from '../../stores/reminderStore'
import SegmentedTabs from './SegmentedTabs'
import EventsTab from './EventsTab'
import RemindersTab from './RemindersTab'
import NotesTab from './NotesTab'
import './agenda.css'

export default function AgendaPage() {
  const { checkPairStatus } = usePairing()
  const initializeAgenda = useAgendaStore((s) => s.initializeAgenda)
  const cleanupAgenda = useAgendaStore((s) => s.cleanup)
  const initializeNotes = useNotesStore((s) => s.initializeNotes)
  const cleanupNotes = useNotesStore((s) => s.cleanup)
  const initializeReminders = useReminderStore((s) => s.initializeReminders)
  const cleanupReminders = useReminderStore((s) => s.cleanup)

  const [activeTab, setActiveTab] = useState('events')

  useEffect(() => {
    let cancelled = false
    checkPairStatus().then((pair) => {
      if (!cancelled && pair) {
        initializeAgenda(pair.id)
        initializeReminders(pair.id)
        initializeNotes(pair.id)
      }
    })
    return () => {
      cancelled = true
      cleanupAgenda()
      cleanupReminders()
      cleanupNotes()
    }
  }, [checkPairStatus, initializeAgenda, cleanupAgenda, initializeReminders, cleanupReminders, initializeNotes, cleanupNotes])

  const tabs = [
    { id: 'events', label: 'Eventos' },
    { id: 'reminders', label: 'Lembretes' },
    { id: 'notes', label: 'Notas' }
  ]

  return (
    <div className="agenda">
      <div className="agenda__tabs">
        <SegmentedTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="agenda__content">
        {activeTab === 'events' && (
          <div className="agenda__tab-content">
            <EventsTab />
          </div>
        )}
        {activeTab === 'reminders' && (
          <div className="agenda__tab-content">
            <RemindersTab />
          </div>
        )}
        {activeTab === 'notes' && (
          <div className="agenda__tab-content">
            <NotesTab />
          </div>
        )}
      </div>
    </div>
  )
}

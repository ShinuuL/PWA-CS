import { useState, useEffect } from 'react'
import { usePairing } from '../pairing/usePairing'
import useNotesStore from '../../stores/notesStore'
import useAgendaStore from '../../stores/agendaStore'
import useReminderStore from '../../stores/reminderStore'
import useTodoStore from '../../stores/todoStore'
import SegmentedTabs from './SegmentedTabs'
import EventsTab from './EventsTab'
import RemindersTab from './RemindersTab'
import NotesTab from './NotesTab'
import ListsTab from './ListsTab'
import './agenda.css'

export default function AgendaPage() {
  const { checkPairStatus } = usePairing()
  const initializeAgenda = useAgendaStore((s) => s.initializeAgenda)
  const cleanupAgenda = useAgendaStore((s) => s.cleanup)
  const initializeNotes = useNotesStore((s) => s.initializeNotes)
  const cleanupNotes = useNotesStore((s) => s.cleanup)
  const initializeReminders = useReminderStore((s) => s.initializeReminders)
  const cleanupReminders = useReminderStore((s) => s.cleanup)
  const initializeTodos = useTodoStore((s) => s.initializeTodos)
  const cleanupTodos = useTodoStore((s) => s.cleanup)

  const [activeTab, setActiveTab] = useState('events')

  useEffect(() => {
    let cancelled = false
    checkPairStatus().then((pair) => {
      if (!cancelled && pair) {
        initializeAgenda(pair.id)
        initializeReminders(pair.id)
        initializeNotes(pair.id)
        initializeTodos(pair.id)
      }
    })
    return () => {
      cancelled = true
      cleanupAgenda()
      cleanupReminders()
      cleanupNotes()
      cleanupTodos()
    }
  }, [checkPairStatus, initializeAgenda, cleanupAgenda, initializeReminders, cleanupReminders, initializeNotes, cleanupNotes, initializeTodos, cleanupTodos])

  const tabs = [
    { id: 'events', label: 'Eventos' },
    { id: 'reminders', label: 'Lembretes' },
    { id: 'lists', label: 'Listas' },
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
        {activeTab === 'lists' && (
          <div className="agenda__tab-content">
            <ListsTab />
          </div>
        )}
      </div>
    </div>
  )
}

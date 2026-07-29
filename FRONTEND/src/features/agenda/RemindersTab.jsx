import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Bell, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import useReminderStore from '../../stores/reminderStore'
import { supabase } from '../../shared/lib/supabase'
import ReminderCard from './ReminderCard'
import ReminderForm from './ReminderForm'
import './RemindersTab.css'

export default function RemindersTab() {
  const { reminders, loading, error, createReminder, updateReminder, completeReminder } = useReminderStore()
  const [showForm, setShowForm] = useState(false)
  const [editReminder, setEditReminder] = useState(null)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [profiles, setProfiles] = useState({})

  // Fetch profiles for unique created_by IDs
  useEffect(() => {
    const userIds = [...new Set(reminders.map(r => r.created_by).filter(Boolean))]
    const missing = userIds.filter(id => !profiles[id])
    if (missing.length === 0) return

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', missing)
      if (data) {
        const map = {}
        data.forEach(p => { map[p.id] = p })
        setProfiles(prev => ({ ...prev, ...map }))
      }
    }
    fetchProfiles()
  }, [reminders, profiles])

  // Split reminders into upcoming and completed
  const { upcoming, completed } = useMemo(() => {
    const up = []
    const done = []
    reminders.forEach(r => {
      if (r.completed_at || r.status === 'sent') {
        done.push(r)
      } else {
        up.push(r)
      }
    })
    return { upcoming: up, completed: done }
  }, [reminders])

  // Group upcoming by date
  const groupedUpcoming = useMemo(() => {
    const groups = {}
    upcoming.forEach(r => {
      const key = format(new Date(r.reminder_at), 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [upcoming])

  const enrichReminder = (r) => ({
    ...r,
    creator_name: profiles[r.created_by]?.display_name || 'Parceiro',
    creator_avatar: profiles[r.created_by]?.avatar_url || null
  })

  const handleCreate = async (formData) => {
    const result = await createReminder(formData)
    if (result.error) {
      toast.error('Erro ao criar lembrete')
    } else {
      toast.success('Lembrete criado!')
      setShowForm(false)
      // D-09: Push permission request on first creation
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        toast((t) => (
          <span>
            Ative notificações para receber lembretes{' '}
            <button
              onClick={() => {
                Notification.requestPermission()
                toast.dismiss(t.id)
              }}
              style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Ativar
            </button>
          </span>
        ), { duration: 8000 })
      }
    }
  }

  const handleEdit = async (formData) => {
    if (!editReminder) return
    const result = await updateReminder(editReminder.id, {
      title: formData.title,
      reminder_at: formData.reminder_at,
      notes: formData.notes,
      priority: formData.priority,
      category: formData.category
    })
    if (result.error) {
      toast.error('Erro ao atualizar lembrete')
    } else {
      toast.success('Lembrete atualizado!')
      setEditReminder(null)
      setShowForm(false)
    }
  }

  const handleComplete = async (id) => {
    const result = await completeReminder(id)
    if (result.error) {
      toast.error('Erro ao concluir lembrete')
    }
  }

  const openEdit = (reminder) => {
    setEditReminder(reminder)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditReminder(null)
  }

  if (loading) {
    return (
      <div className="reminders-tab">
        <div className="reminders-tab__skeleton">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="reminder-row-skeleton" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reminders-tab reminders-tab--error">
        <p>Algo deu errado — Tente novamente</p>
        <button className="reminders-tab__retry" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="reminders-tab">
      {reminders.length === 0 ? (
        <div className="reminders-tab__empty">
          <Bell size={40} strokeWidth={1.5} color="var(--color-text-secondary)" />
          <p className="reminders-tab__empty-title">Nenhum lembrete</p>
          <span className="reminders-tab__empty-text">Crie seu primeiro lembrete compartilhado</span>
          <button className="reminders-tab__empty-cta" onClick={() => setShowForm(true)} type="button">
            Criar lembrete
          </button>
        </div>
      ) : (
        <div className="reminders-tab__list">
          {/* Upcoming reminders grouped by date */}
          {groupedUpcoming.map(([dateKey, dayReminders]) => (
            <div key={dateKey} className="reminders-tab__group">
              <div className="reminders-tab__group-date">
                {format(new Date(dateKey), "d 'de' MMMM", { locale: ptBR })}
              </div>
              {dayReminders.map(r => (
                <ReminderCard
                  key={r.id}
                  reminder={enrichReminder(r)}
                  onComplete={handleComplete}
                  onEdit={openEdit}
                />
              ))}
            </div>
          ))}

          {/* Collapsible completed section */}
          {completed.length > 0 && (
            <div className="reminders-tab__completed-section">
              <button
                className="reminders-tab__completed-header"
                onClick={() => setCompletedExpanded(!completedExpanded)}
                type="button"
              >
                <span className="reminders-tab__completed-label">Concluídos</span>
                <span className="reminders-tab__completed-badge">{completed.length}</span>
                {completedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {completedExpanded && (
                <div className="reminders-tab__completed-list">
                  {completed.map(r => (
                    <ReminderCard
                      key={r.id}
                      reminder={enrichReminder(r)}
                      onComplete={handleComplete}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button className="reminders-tab__fab" onClick={() => setShowForm(true)} type="button">
        <Plus size={24} />
      </button>

      {showForm && (
        <div className="reminders-tab__modal-overlay" onClick={closeForm}>
          <div className="reminders-tab__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="reminders-tab__modal-title">
              {editReminder ? 'Editar lembrete' : 'Criar lembrete'}
            </h3>
            <ReminderForm
              onSubmit={editReminder ? handleEdit : handleCreate}
              onCancel={closeForm}
              initialReminder={editReminder}
            />
          </div>
        </div>
      )}
    </div>
  )
}

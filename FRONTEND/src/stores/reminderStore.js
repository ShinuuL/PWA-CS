import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useReminderStore = create((set, get) => ({
  reminders: [],
  loading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeReminders: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId, error: null })

    try {
      const { data: reminders, error } = await supabase
        .from('shared_reminders')
        .select('*')
        .eq('pair_id', pairId)
        .order('reminder_at', { ascending: true })

      if (error) throw error
      set({ reminders: reminders || [], loading: false })

      // D-08: Client fallback — check for pending_send on app open
      const pendingReminders = (reminders || []).filter(r => r.status === 'pending_send')
      if (pendingReminders.length > 0) {
        pendingReminders.forEach(r => {
          // Show in-app notification for missed reminders
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Lembrete pendente', {
              body: r.title,
              icon: '/favicon.ico'
            })
          }
        })
      }

      // Clean up old subscription
      const oldChannel = get().subscription
      if (oldChannel) {
        supabase.removeChannel(oldChannel)
      }

      // Subscribe to Realtime changes
      const channel = supabase
        .channel(`reminders:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'shared_reminders',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            const alreadyPresent = state.reminders.some(r => r.id === payload.new.id)
            if (!alreadyPresent) {
              set({ reminders: [...state.reminders, payload.new].sort((a, b) =>
                new Date(a.reminder_at) - new Date(b.reminder_at)
              ) })
            }
          } else if (payload.eventType === 'UPDATE') {
            set({ reminders: state.reminders.map(r =>
              r.id === payload.new.id ? payload.new : r
            ).sort((a, b) => new Date(a.reminder_at) - new Date(b.reminder_at)) })
          } else if (payload.eventType === 'DELETE') {
            set({ reminders: state.reminders.filter(r => r.id !== payload.old.id) })
          }
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  createReminder: async ({ title, reminder_at, notes = '', priority = 'normal', category = '' }) => {
    const { user } = useAuthStore.getState()
    const { pairId } = get()
    if (!user || !pairId || !title.trim() || !reminder_at) return { error: 'Title and reminder time are required' }

    const tempId = `temp-${Date.now()}`
    const optimisticReminder = {
      id: tempId,
      pair_id: pairId,
      title: title.trim(),
      reminder_at,
      created_by: user.id,
      notes,
      priority,
      category,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    // Optimistic insert
    set({ reminders: [...get().reminders, optimisticReminder].sort((a, b) =>
      new Date(a.reminder_at) - new Date(b.reminder_at)
    ) })

    try {
      const { data: newReminder, error } = await supabase
        .from('shared_reminders')
        .insert({
          pair_id: pairId,
          title: title.trim(),
          reminder_at,
          created_by: user.id,
          notes,
          priority,
          category,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic with real data
      set({ reminders: get().reminders.map(r => r.id === tempId ? newReminder : r) })
      return { success: true, reminder: newReminder }
    } catch (err) {
      // Rollback optimistic update
      set({ reminders: get().reminders.filter(r => r.id !== tempId) })
      return { error: err.message }
    }
  },

  updateReminder: async (reminderId, updates) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousReminders = get().reminders

    // Optimistic update
    set({ reminders: get().reminders.map(r =>
      r.id === reminderId ? { ...r, ...updates } : r
    ).sort((a, b) => new Date(a.reminder_at) - new Date(b.reminder_at)) })

    try {
      const { error } = await supabase
        .from('shared_reminders')
        .update(updates)
        .eq('id', reminderId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ reminders: previousReminders })
      return { error: err.message }
    }
  },

  completeReminder: async (reminderId) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousReminders = get().reminders

    // Optimistic update
    set({ reminders: get().reminders.map(r =>
      r.id === reminderId
        ? { ...r, completed_at: new Date().toISOString(), status: 'sent' }
        : r
    ) })

    try {
      const { error } = await supabase
        .from('shared_reminders')
        .update({ completed_at: new Date().toISOString(), status: 'sent' })
        .eq('id', reminderId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ reminders: previousReminders })
      return { error: err.message }
    }
  },

  deleteReminder: async (reminderId) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousReminders = get().reminders

    // Optimistic removal
    set({ reminders: get().reminders.filter(r => r.id !== reminderId) })

    try {
      const { error } = await supabase
        .from('shared_reminders')
        .delete()
        .eq('id', reminderId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ reminders: previousReminders })
      return { error: err.message }
    }
  },

  cleanup: () => {
    const { subscription } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    set({
      reminders: [],
      loading: false,
      error: null,
      pairId: null,
      subscription: null
    })
  }
}))

export default useReminderStore

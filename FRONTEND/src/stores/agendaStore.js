import { create } from 'zustand'
import { isSameDay } from 'date-fns'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useAgendaStore = create((set, get) => ({
  events: [],
  generation: 0,
  sessionUserId: null,
  loading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeAgenda: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.sessionUserId === user.id && current.subscription) return

    get().cleanup()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user.id

    set({ loading: true, sessionUserId: user.id, pairId, error: null })

    try {
      const { data: events, error } = await supabase
        .from('agenda_events')
        .select('*')
        .eq('pair_id', pairId)
        .order('event_date', { ascending: true })

      if (!isCurrent()) return { error: 'Sessão alterada' }
      if (error) throw error
      set({ events: events || [], loading: false })

      // Clean up old subscription
      const oldChannel = get().subscription
      if (oldChannel) {
        supabase.removeChannel(oldChannel)
      }

      // Subscribe to Realtime changes
      const channel = supabase
        .channel(`agenda:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'agenda_events',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          if (!isCurrent()) return
          const state = get()
          if (payload.eventType === 'INSERT') {
            const alreadyPresent = state.events.some(e => e.id === payload.new.id)
            if (!alreadyPresent) {
              set({ events: [...state.events, payload.new].sort((a, b) =>
                new Date(a.event_date) - new Date(b.event_date)
              ) })
            }
          } else if (payload.eventType === 'UPDATE') {
            set({ events: state.events.map(e =>
              e.id === payload.new.id ? payload.new : e
            ).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)) })
          } else if (payload.eventType === 'DELETE') {
            set({ events: state.events.filter(e => e.id !== payload.old.id) })
          }
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      if (!isCurrent()) return { error: 'Sessão alterada' }
      set({ error: err.message, loading: false })
    }
  },

  createEvent: async ({ title, description = '', event_date, category = 'Outro', reminder = null }) => {
    const { user } = useAuthStore.getState()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user?.id
    const { pairId } = get()
    if (!user || !pairId || !title.trim() || !event_date) return { error: 'Title and date are required' }

    const tempId = `temp-${Date.now()}`
    const optimisticEvent = {
      id: tempId,
      pair_id: pairId,
      user_id: user.id,
      title: title.trim(),
      description,
      event_date,
      category,
      reminder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Optimistic insert
    set({ events: [...get().events, optimisticEvent].sort((a, b) =>
      new Date(a.event_date) - new Date(b.event_date)
    ) })

    try {
      const { data: newEvent, error } = await supabase
        .from('agenda_events')
        .insert({
          pair_id: pairId,
          user_id: user.id,
          title: title.trim(),
          description,
          event_date,
          category,
          reminder
        })
        .select()
        .single()

      if (!isCurrent()) return { error: 'Sessão alterada' }
      if (error) throw error

      // Replace optimistic with real data
      set({ events: get().events.map(e => e.id === tempId ? newEvent : e) })
      return { success: true, event: newEvent }
    } catch (err) {
      if (!isCurrent()) return { error: 'Sessão alterada' }
      // Rollback optimistic update
      set({ events: get().events.filter(e => e.id !== tempId) })
      return { error: err.message }
    }
  },

  updateEvent: async (eventId, updates) => {
    const { user } = useAuthStore.getState()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user?.id
    if (!user) return { error: 'Not authenticated' }

    const previousEvents = get().events

    // Optimistic update
    set({ events: get().events.map(e =>
      e.id === eventId
        ? { ...e, ...updates, updated_at: new Date().toISOString() }
        : e
    ).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)) })

    try {
      const { error } = await supabase
        .from('agenda_events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', eventId)

      if (!isCurrent()) return { error: 'Sessão alterada' }
      if (error) throw error
      return { success: true }
    } catch (err) {
      if (!isCurrent()) return { error: 'Sessão alterada' }
      // Rollback on error
      set({ events: previousEvents })
      return { error: err.message }
    }
  },

  deleteEvent: async (eventId) => {
    const { user } = useAuthStore.getState()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user?.id
    if (!user) return { error: 'Not authenticated' }

    const previousEvents = get().events

    // Optimistic removal
    set({ events: get().events.filter(e => e.id !== eventId) })

    try {
      const { error } = await supabase
        .from('agenda_events')
        .delete()
        .eq('id', eventId)

      if (!isCurrent()) return { error: 'Sessão alterada' }
      if (error) throw error
      return { success: true }
    } catch (err) {
      if (!isCurrent()) return { error: 'Sessão alterada' }
      // Rollback on error
      set({ events: previousEvents })
      return { error: err.message }
    }
  },

  getEventsForDate: (date) => {
    const { events } = get()
    return events.filter(event => isSameDay(new Date(event.event_date), date))
  },

  cleanup: () => {
    const { subscription } = get()
    set({ generation: get().generation + 1, sessionUserId: null, error: null })
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    set({
      events: [],
      loading: false,
      error: null,
      pairId: null,
      subscription: null
    })
  }
}))

export default useAgendaStore

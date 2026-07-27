import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useNotesStore = create((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeNotes: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId, error: null })

    try {
      const { data: notes, error } = await supabase
        .from('shared_notes')
        .select('*')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ notes: notes || [], loading: false })

      // Clean up old subscription
      const oldChannel = get().subscription
      if (oldChannel) {
        supabase.removeChannel(oldChannel)
      }

      // Subscribe to Realtime changes
      const channel = supabase
        .channel(`notes:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'shared_notes',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            const alreadyPresent = state.notes.some(n => n.id === payload.new.id)
            if (!alreadyPresent) {
              set({ notes: [payload.new, ...state.notes] })
            }
          } else if (payload.eventType === 'UPDATE') {
            set({ notes: state.notes.map(n => n.id === payload.new.id ? payload.new : n) })
          } else if (payload.eventType === 'DELETE') {
            set({ notes: state.notes.filter(n => n.id !== payload.old.id) })
          }
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  createNote: async (title, body = '') => {
    const { user } = useAuthStore.getState()
    const { pairId } = get()
    if (!user || !pairId || !title.trim()) return { error: 'Title is required' }

    const tempId = `temp-${Date.now()}`
    const optimisticNote = {
      id: tempId,
      pair_id: pairId,
      user_id: user.id,
      title: title.trim(),
      body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Optimistic insert
    set({ notes: [optimisticNote, ...get().notes] })

    try {
      const { data: newNote, error } = await supabase
        .from('shared_notes')
        .insert({
          pair_id: pairId,
          user_id: user.id,
          title: title.trim(),
          body
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic with real data
      set({ notes: get().notes.map(n => n.id === tempId ? newNote : n) })
      return { success: true, note: newNote }
    } catch (err) {
      // Rollback optimistic update
      set({ notes: get().notes.filter(n => n.id !== tempId) })
      return { error: err.message }
    }
  },

  updateNote: async (noteId, title, body) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousNotes = get().notes

    // Optimistic update
    set({ notes: get().notes.map(n =>
      n.id === noteId
        ? { ...n, title: title.trim(), body, updated_at: new Date().toISOString() }
        : n
    ) })

    try {
      const { error } = await supabase
        .from('shared_notes')
        .update({ title: title.trim(), body, updated_at: new Date().toISOString() })
        .eq('id', noteId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ notes: previousNotes })
      return { error: err.message }
    }
  },

  deleteNote: async (noteId) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousNotes = get().notes

    // Optimistic removal
    set({ notes: get().notes.filter(n => n.id !== noteId) })

    try {
      const { error } = await supabase
        .from('shared_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ notes: previousNotes })
      return { error: err.message }
    }
  },

  cleanup: () => {
    const { subscription } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    set({
      notes: [],
      loading: false,
      error: null,
      pairId: null,
      subscription: null
    })
  }
}))

export default useNotesStore

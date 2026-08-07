import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useTodoStore = create((set, get) => ({
  lists: [],
  items: [],
  loading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeTodos: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId, error: null })

    try {
      // Fetch lists
      const { data: lists, error: listsError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: true })

      if (listsError) throw listsError
      set({ lists: lists || [] })

      // Fetch items for all lists
      const listIds = (lists || []).map(l => l.id)
      let items = []
      if (listIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('todo_items')
          .select('*')
          .in('list_id', listIds)
          .order('due_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })

        if (itemsError) throw itemsError
        items = itemsData || []
      }
      set({ items, loading: false })

      // Clean up old subscription
      const oldChannel = get().subscription
      if (oldChannel) {
        supabase.removeChannel(oldChannel)
      }

      // Subscribe to Realtime on todo_lists
      const channel = supabase
        .channel(`todos:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'todo_lists',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            const alreadyPresent = state.lists.some(l => l.id === payload.new.id)
            if (!alreadyPresent) {
              set({ lists: [...state.lists, payload.new].sort((a, b) =>
                new Date(a.created_at) - new Date(b.created_at)
              ) })
            }
          } else if (payload.eventType === 'UPDATE') {
            set({ lists: state.lists.map(l =>
              l.id === payload.new.id ? payload.new : l
            ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) })
          } else if (payload.eventType === 'DELETE') {
            set({ lists: state.lists.filter(l => l.id !== payload.old.id) })
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'todo_items',
          filter: `list_id=in.(${listIds.join(',')})`
        }, (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            const alreadyPresent = state.items.some(i => i.id === payload.new.id)
            if (!alreadyPresent) {
              set({ items: [...state.items, payload.new] })
            }
          } else if (payload.eventType === 'UPDATE') {
            set({ items: state.items.map(i =>
              i.id === payload.new.id ? payload.new : i
            ) })
          } else if (payload.eventType === 'DELETE') {
            set({ items: state.items.filter(i => i.id !== payload.old.id) })
          }
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  createList: async ({ name, color = '#B87CFF' }) => {
    const { user } = useAuthStore.getState()
    const { pairId } = get()
    if (!user || !pairId || !name.trim()) return { error: 'Name is required' }

    const tempId = `temp-${Date.now()}`
    const optimisticList = {
      id: tempId,
      pair_id: pairId,
      name: name.trim(),
      color,
      created_by: user.id,
      created_at: new Date().toISOString()
    }

    // Optimistic insert
    set({ lists: [...get().lists, optimisticList].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    ) })

    try {
      const { data: newList, error } = await supabase
        .from('todo_lists')
        .insert({
          pair_id: pairId,
          name: name.trim(),
          color,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic with real data
      set({ lists: get().lists.map(l => l.id === tempId ? newList : l) })
      return { success: true, list: newList }
    } catch (err) {
      // Rollback optimistic update
      set({ lists: get().lists.filter(l => l.id !== tempId) })
      return { error: err.message }
    }
  },

  updateList: async (listId, updates) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousLists = get().lists

    // Optimistic update
    set({ lists: get().lists.map(l =>
      l.id === listId ? { ...l, ...updates } : l
    ) })

    try {
      const { error } = await supabase
        .from('todo_lists')
        .update(updates)
        .eq('id', listId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ lists: previousLists })
      return { error: err.message }
    }
  },

  deleteList: async (listId) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousLists = get().lists
    const previousItems = get().items

    // Optimistic removal
    set({
      lists: get().lists.filter(l => l.id !== listId),
      items: get().items.filter(i => i.list_id !== listId)
    })

    try {
      const { error } = await supabase
        .from('todo_lists')
        .delete()
        .eq('id', listId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ lists: previousLists, items: previousItems })
      return { error: err.message }
    }
  },

  createItem: async ({ list_id, title, assigned_to = null, due_at = null }) => {
    const { user } = useAuthStore.getState()
    const { pairId } = get()
    if (!user || !pairId || !title.trim()) return { error: 'Title is required' }

    const tempId = `temp-${Date.now()}`
    const optimisticItem = {
      id: tempId,
      list_id,
      title: title.trim(),
      completed: false,
      assigned_to,
      due_at,
      created_at: new Date().toISOString()
    }

    // Optimistic insert
    set({ items: [...get().items, optimisticItem] })

    try {
      const { data: newItem, error } = await supabase
        .from('todo_items')
        .insert({
          list_id,
          title: title.trim(),
          completed: false,
          assigned_to,
          due_at
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic with real data
      set({ items: get().items.map(i => i.id === tempId ? newItem : i) })
      return { success: true, item: newItem }
    } catch (err) {
      // Rollback optimistic update
      set({ items: get().items.filter(i => i.id !== tempId) })
      return { error: err.message }
    }
  },

  updateItem: async (itemId, updates) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousItems = get().items

    // Optimistic update
    set({ items: get().items.map(i =>
      i.id === itemId ? { ...i, ...updates } : i
    ) })

    try {
      const { error } = await supabase
        .from('todo_items')
        .update(updates)
        .eq('id', itemId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ items: previousItems })
      return { error: err.message }
    }
  },

  toggleItem: async (itemId) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const item = get().items.find(i => i.id === itemId)
    if (!item) return { error: 'Item not found' }

    const previousItems = get().items

    // Optimistic update
    set({ items: get().items.map(i =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    ) })

    try {
      const { error } = await supabase
        .from('todo_items')
        .update({ completed: !item.completed })
        .eq('id', itemId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ items: previousItems })
      return { error: err.message }
    }
  },

  deleteItem: async (itemId) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'Not authenticated' }

    const previousItems = get().items

    // Optimistic removal
    set({ items: get().items.filter(i => i.id !== itemId) })

    try {
      const { error } = await supabase
        .from('todo_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Rollback on error
      set({ items: previousItems })
      return { error: err.message }
    }
  },

  getItemsForList: (listId) => {
    const { items } = get()
    return items
      .filter(i => i.list_id === listId)
      .sort((a, b) => {
        // Items with due dates first
        if (a.due_at && !b.due_at) return -1
        if (!a.due_at && b.due_at) return 1
        if (a.due_at && b.due_at) return new Date(a.due_at) - new Date(b.due_at)
        // Then by creation order
        return new Date(a.created_at) - new Date(b.created_at)
      })
  },

  cleanup: () => {
    const { subscription } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    set({
      lists: [],
      items: [],
      loading: false,
      error: null,
      pairId: null,
      subscription: null
    })
  }
}))

export default useTodoStore

import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useChatStore = create((set, get) => ({
  messages: [],
  loading: false,
  sending: false,
  error: null,
  partnerTyping: false,
  isAtBottom: true,
  offlineQueue: [],
  pairId: null,
  subscription: null,
  typingTimeout: null,

  initializeChat: async (pairId) => {
    const { user } = useAuthStore.getState()
    if (!user || !pairId) return

    set({ loading: true, pairId, error: null })

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, reactions(*), profiles!sender_id(display_name, avatar_url)')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: true })

      if (error) throw error

      set({ messages: messages || [], loading: false })

      await supabase.rpc('mark_messages_read', {
        p_pair_id: pairId,
        p_user_id: user.id
      })

      const channel = supabase
        .channel(`chat:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const { eventType, new: newMsg, old: oldMsg } = payload
          const state = get()

          if (eventType === 'INSERT') {
            if (newMsg.sender_id === user.id) {
              set({
                messages: state.messages.map(m =>
                  m.id === newMsg.temp_id ? { ...newMsg, temp_id: undefined } : m
                )
              })
            } else {
              set({ messages: [...state.messages, newMsg] })
            }
          } else if (eventType === 'UPDATE') {
            set({
              messages: state.messages.map(m =>
                m.id === newMsg.id ? { ...m, ...newMsg } : m
              )
            })
          } else if (eventType === 'DELETE') {
            set({
              messages: state.messages.filter(m => m.id !== oldMsg.id)
            })
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reactions'
        }, (payload) => {
          const { eventType, new: newReaction, old: oldReaction } = payload
          const state = get()

          if (eventType === 'INSERT') {
            set({
              messages: state.messages.map(m =>
                m.id === newReaction.message_id
                  ? { ...m, reactions: [...(m.reactions || []), newReaction] }
                  : m
              )
            })
          } else if (eventType === 'DELETE') {
            set({
              messages: state.messages.map(m =>
                m.id === oldReaction.message_id
                  ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== oldReaction.id) }
                  : m
              )
            })
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const { new: status } = payload
          if (status.user_id !== user.id) {
            set({ partnerTyping: status.is_typing })
          }
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  sendMessage: async (content, replyTo = null) => {
    const { user } = useAuthStore.getState()
    const { pairId, messages, offlineQueue } = get()
    if (!user || !pairId || !content.trim()) return

    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      temp_id: tempId,
      pair_id: pairId,
      sender_id: user.id,
      content: content.trim(),
      reply_to: replyTo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_at: null,
      deleted: false,
      deleted_for_everyone: false,
      profiles: user.user_metadata || {},
      reactions: []
    }

    set({ sending: true, messages: [...messages, optimisticMessage] })

    if (!navigator.onLine) {
      set({
        offlineQueue: [...offlineQueue, optimisticMessage],
        sending: false
      })
      return
    }

    try {
      const { error } = await supabase.from('messages').insert({
        pair_id: pairId,
        sender_id: user.id,
        content: content.trim(),
        reply_to: replyTo
      })
      if (error) throw error
    } catch (err) {
      set({ error: err.message, sending: false })
    } finally {
      set({ sending: false })
    }
  },

  syncOfflineQueue: async () => {
    const { offlineQueue } = get()
    if (offlineQueue.length === 0) return

    set({ sending: true })

    for (const msg of offlineQueue) {
      try {
        const { error } = await supabase.from('messages').insert({
          pair_id: msg.pair_id,
          sender_id: msg.sender_id,
          content: msg.content,
          reply_to: msg.reply_to
        })
        if (error) throw error
      } catch (err) {
        set({ error: `Failed to sync: ${err.message}` })
      }
    }

    set({ offlineQueue: [], sending: false })
  },

  deleteMessage: async (messageId, forEveryone = false) => {
    const { user } = useAuthStore.getState()
    const { messages } = get()
    if (!user) return

    set({
      messages: messages.map(m =>
        m.id === messageId
          ? { ...m, deleted: true, deleted_for_everyone: forEveryone }
          : m
      )
    })

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted: true, deleted_for_everyone: forEveryone })
        .eq('id', messageId)
        .eq('sender_id', user.id)
      if (error) throw error
    } catch (err) {
      set({ error: err.message })
    }
  },

  addReaction: async (messageId, emoji) => {
    const { user } = useAuthStore.getState()
    const { messages } = get()
    if (!user) return

    const existing = messages
      .find(m => m.id === messageId)
      ?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji)

    if (existing) {
      set({
        messages: messages.map(m =>
          m.id === messageId
            ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== existing.id) }
            : m
        )
      })
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      try {
        const { data, error } = await supabase
          .from('reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji })
          .select()
          .single()
        if (error) throw error
        set({
          messages: messages.map(m =>
            m.id === messageId
              ? { ...m, reactions: [...(m.reactions || []), data] }
              : m
          )
        })
      } catch (err) {
        set({ error: err.message })
      }
    }
  },

  removeReaction: async (reactionId) => {
    const { messages } = get()
    set({
      messages: messages.map(m => ({
        ...m,
        reactions: (m.reactions || []).filter(r => r.id !== reactionId)
      }))
    })
    await supabase.from('reactions').delete().eq('id', reactionId)
  },

  setTyping: async (isTyping) => {
    const { user } = useAuthStore.getState()
    const { pairId, typingTimeout } = get()
    if (!user || !pairId) return

    if (typingTimeout) clearTimeout(typingTimeout)

    await supabase.from('typing_status').upsert({
      pair_id: pairId,
      user_id: user.id,
      is_typing: isTyping,
      updated_at: new Date().toISOString()
    }, { onConflict: 'pair_id,user_id' })

    if (isTyping) {
      const timeout = setTimeout(() => {
        get().setTyping(false)
      }, 3000)
      set({ typingTimeout: timeout })
    }
  },

  setIsAtBottom: (isAtBottom) => set({ isAtBottom }),

  cleanup: () => {
    const { subscription, typingTimeout } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    if (typingTimeout) clearTimeout(typingTimeout)
    set({ subscription: null, typingTimeout: null, messages: [], pairId: null })
  }
}))

export default useChatStore

import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const DEFAULT_SETTINGS = {
  theme: 'system',
  fontSize: 16,
  notificationSounds: true,
  messagePreview: true,
  readReceipts: true
}

function loadSettings() {
  try {
    const stored = localStorage.getItem('couplespace-chat-settings')
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem('couplespace-chat-settings', JSON.stringify(settings))
  } catch { /* ignore */ }
}

function applyThemeToDOM(theme) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.remove('dark')
    root.classList.add('light')
  } else if (theme === 'dark') {
    root.classList.remove('light')
    root.classList.add('dark')
  } else {
    root.classList.remove('light', 'dark')
  }
}

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
  pendingTempIds: {},

  replyTo: null,
  showDeleteConfirm: false,
  deleteTarget: null,
  deleteForEveryone: false,
  showReactionPicker: null,

  settings: loadSettings(),
  notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  isInChat: false,

  initializeChat: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId, error: null })

    const { settings } = get()
    applyThemeToDOM(settings.theme)

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, reactions(*), profiles(display_name, avatar_url)')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: true })

      if (error) throw error

      set({ messages: messages || [], loading: false })

      await supabase.rpc('mark_messages_read', {
        p_pair_id: pairId,
        p_user_id: user.id
      })

      // Clean up any existing subscription first
      const oldChannel = get().subscription
      if (oldChannel) {
        await supabase.removeChannel(oldChannel)
      }

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
              const pendingIds = state.pendingTempIds
              const matchIdx = state.messages.findIndex(m => m.temp_id && pendingIds[m.temp_id])
              if (matchIdx >= 0) {
                const newMessages = [...state.messages]
                const { temp_id, ...realMsg } = newMsg
                newMessages[matchIdx] = { ...realMsg }
                const newPending = { ...pendingIds }
                delete newPending[state.messages[matchIdx].temp_id]
                set({ messages: newMessages, pendingTempIds: newPending })
              } else {
                set({ messages: [...state.messages, newMsg] })
              }
            } else {
              set({ messages: [...state.messages, newMsg] })
              const isAppInForeground =
                typeof document !== 'undefined' &&
                document.visibilityState === 'visible'

              console.log('[Push] Message received. isInChat:', state.isInChat, 'foreground:', isAppInForeground)

              if (isAppInForeground) {
                // Foreground: in-app toast (D-25)
                // Push for background is handled by startGlobalMessageListener in pushSubscription.js
                const { settings: s } = state
                if (!state.isInChat && (s.notificationSounds || s.messagePreview)) {
                  get().showNotification(
                    newMsg.profiles?.display_name || 'Partner',
                    s.messagePreview ? newMsg.content : 'New message'
                  )
                }
              }
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

  sendMessage: async (content, replyToId = null) => {
    const { user } = useAuthStore.getState()
    const { pairId, messages, offlineQueue, replyTo } = get()
    if (!user || !pairId || !content.trim()) return

    const replyId = replyToId || replyTo?.id || null
    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      temp_id: tempId,
      pair_id: pairId,
      sender_id: user.id,
      content: content.trim(),
      reply_to: replyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_at: null,
      deleted: false,
      deleted_for_everyone: false,
      profiles: user.user_metadata || {},
      reactions: []
    }

    set({
      sending: true,
      messages: [...messages, optimisticMessage],
      pendingTempIds: { ...get().pendingTempIds, [tempId]: true }
    })
    get().cancelReply()

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
        reply_to: replyId
      })
      if (error) throw error
    } catch (err) {
      set({ error: err.message, sending: false })
    } finally {
      set({ sending: false })
    }
  },

  sendVoiceMessage: async (voiceBlob, durationSeconds = 0) => {
    const { user } = useAuthStore.getState()
    const { pairId, messages } = get()
    if (!user || !pairId || !voiceBlob) return

    const tempId = `temp-${Date.now()}`
    const tempBlobUrl = URL.createObjectURL(voiceBlob)

    // Optimistic message with local blob URL for instant display
    const optimisticMessage = {
      id: tempId,
      temp_id: tempId,
      pair_id: pairId,
      sender_id: user.id,
      content: '',
      message_type: 'voice',
      media_url: tempBlobUrl,
      media_duration: durationSeconds,
      reply_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_at: null,
      deleted: false,
      deleted_for_everyone: false,
      profiles: user.user_metadata || {},
      reactions: []
    }

    set({
      sending: true,
      messages: [...messages, optimisticMessage],
      pendingTempIds: { ...get().pendingTempIds, [tempId]: true }
    })

    if (!navigator.onLine) {
      set({
        offlineQueue: [...get().offlineQueue, { ...optimisticMessage, _blob: voiceBlob }],
        sending: false
      })
      return
    }

    try {
      // Upload to Supabase Storage
      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2, 8)
      const filePath = `${pairId}/${timestamp}-${random}.webm`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, voiceBlob, { contentType: voiceBlob.type || 'audio/webm' })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath)

      const publicUrl = urlData?.publicUrl
      if (!publicUrl) throw new Error('Failed to get public URL')

      // Insert message into database
      const { error: insertError } = await supabase.from('messages').insert({
        pair_id: pairId,
        sender_id: user.id,
        content: '',
        message_type: 'voice',
        media_url: publicUrl,
        media_duration: durationSeconds
      })
      if (insertError) throw insertError

      // Blob URL will be cleaned up when component unmounts or realtime replaces it
    } catch (err) {
      set({ error: err.message, sending: false })
    } finally {
      set({ sending: false })
    }
  },

  sendImageMessage: async (imageBlob, dimensions = {}) => {
    const { user } = useAuthStore.getState()
    const { pairId, messages } = get()
    if (!user || !pairId || !imageBlob) return

    const tempId = `temp-${Date.now()}`
    const tempBlobUrl = URL.createObjectURL(imageBlob)

    // Optimistic message with local blob URL for instant display
    const optimisticMessage = {
      id: tempId,
      temp_id: tempId,
      pair_id: pairId,
      sender_id: user.id,
      content: '',
      message_type: 'image',
      media_url: tempBlobUrl,
      media_width: dimensions.width || null,
      media_height: dimensions.height || null,
      reply_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_at: null,
      deleted: false,
      deleted_for_everyone: false,
      profiles: user.user_metadata || {},
      reactions: []
    }

    set({
      sending: true,
      messages: [...messages, optimisticMessage],
      pendingTempIds: { ...get().pendingTempIds, [tempId]: true }
    })

    if (!navigator.onLine) {
      set({
        offlineQueue: [...get().offlineQueue, { ...optimisticMessage, _blob: imageBlob }],
        sending: false
      })
      return
    }

    try {
      // Upload to Supabase Storage
      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2, 8)
      const ext = imageBlob.type === 'image/png' ? 'png' : 'jpg'
      const filePath = `${pairId}/${timestamp}-${random}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, imageBlob, { contentType: imageBlob.type || 'image/jpeg' })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath)

      const publicUrl = urlData?.publicUrl
      if (!publicUrl) throw new Error('Failed to get public URL')

      // Insert message into database
      const { error: insertError } = await supabase.from('messages').insert({
        pair_id: pairId,
        sender_id: user.id,
        content: '',
        message_type: 'image',
        media_url: publicUrl,
        media_width: dimensions.width || null,
        media_height: dimensions.height || null
      })
      if (insertError) throw insertError

      // Blob URL will be cleaned up when component unmounts or realtime replaces it
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
      // Skip voice/image messages that can't be synced (blob no longer available)
      if (msg.message_type === 'voice' || msg.message_type === 'image') {
        set({ error: 'Media messages cannot be synced offline. Please resend when online.' })
        continue
      }
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

  setReplyTo: (message) => set({ replyTo: message }),
  cancelReply: () => set({ replyTo: null }),

  openDeleteConfirm: (message, forEveryone = false) => set({
    showDeleteConfirm: true,
    deleteTarget: message,
    deleteForEveryone: forEveryone
  }),
  closeDeleteConfirm: () => set({
    showDeleteConfirm: false,
    deleteTarget: null,
    deleteForEveryone: false
  }),
  confirmDelete: async () => {
    const { deleteTarget, deleteForEveryone } = get()
    if (deleteTarget) {
      await get().deleteMessage(deleteTarget.id, deleteForEveryone)
    }
    get().closeDeleteConfirm()
  },

  setShowReactionPicker: (messageId) => set({ showReactionPicker: messageId }),

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

  updateSetting: (key, value) => {
    const { settings } = get()
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
    set({ settings: newSettings })
    if (key === 'theme') {
      applyThemeToDOM(value)
    }
  },

  applyTheme: (theme) => {
    applyThemeToDOM(theme)
    const { settings } = get()
    saveSettings({ ...settings, theme })
    set({ settings: { ...settings, theme } })
  },

  setNotificationPermission: (permission) => set({ notificationPermission: permission }),

  requestNotificationPermission: async () => {
    if (typeof Notification === 'undefined') return 'denied'
    const permission = await Notification.requestPermission()
    set({ notificationPermission: permission })
    return permission
  },

  setIsInChat: (isInChat) => set({ isInChat }),

  showNotification: (title, body) => {
    const { settings, notificationPermission } = get()
    if (notificationPermission !== 'granted') return
    if (!settings.notificationSounds && !settings.messagePreview) return

    try {
      new Notification(title, {
        body: settings.messagePreview ? body : 'New message',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'couplespace-message',
        renotify: true
      })
    } catch { /* notification not supported */ }
  },

  cleanup: () => {
    const { subscription, typingTimeout } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    if (typingTimeout) clearTimeout(typingTimeout)
    set({
      subscription: null, typingTimeout: null, messages: [], pairId: null,
      replyTo: null, showDeleteConfirm: false, deleteTarget: null, showReactionPicker: null,
      isInChat: false
    })
  }
}))

export default useChatStore

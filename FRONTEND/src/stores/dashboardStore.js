import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useDashboardStore = create((set, get) => ({
  myMood: null,
  partnerMood: null,
  loading: false,
  pairId: null,
  subscription: null,
  realtimeConnected: false,

  initializeDashboard: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId })

    try {
      const oldChannel = get().subscription
      if (oldChannel) {
        await supabase.removeChannel(oldChannel)
      }

      const channel = supabase
        .channel(`moods:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'moods',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const { new: newMood } = payload
          if (!newMood) return
          if (newMood.user_id === user.id) {
            set({ myMood: newMood })
          } else {
            set({ partnerMood: newMood })
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            set({ realtimeConnected: true })
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Dashboard] Realtime subscription error')
            set({ realtimeConnected: false })
          }
        })

      set({ subscription: channel })

      const { data: myMood } = await supabase
        .from('moods')
        .select('*')
        .eq('pair_id', pairId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: partnerMood } = await supabase
        .from('moods')
        .select('*')
        .eq('pair_id', pairId)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      set({ myMood, partnerMood, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  setMood: async (moodType, customText = null, customEmoji = null) => {
    const { user } = useAuthStore.getState()
    const { myMood, pairId } = get()
    if (!user || !pairId) return

    const previousMood = myMood

    const optimisticMood = {
      id: myMood?.id || `temp-${Date.now()}`,
      pair_id: pairId,
      user_id: user.id,
      mood_type: moodType,
      custom_text: customText,
      custom_emoji: customEmoji,
      created_at: new Date().toISOString()
    }
    set({ myMood: optimisticMood })

    const { error } = await supabase
      .from('moods')
      .upsert({
        pair_id: pairId,
        user_id: user.id,
        mood_type: moodType,
        custom_text: customText,
        custom_emoji: customEmoji,
        updated_at: new Date().toISOString()
      }, { onConflict: 'pair_id,user_id' })

    if (error) {
      set({ myMood: previousMood })
      return { error: error.message }
    }
    return { success: true }
  },

  cleanup: () => {
    const { subscription } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    set({
      myMood: null,
      partnerMood: null,
      loading: false,
      pairId: null,
      subscription: null,
      realtimeConnected: false
    })
  }
}))

export default useDashboardStore

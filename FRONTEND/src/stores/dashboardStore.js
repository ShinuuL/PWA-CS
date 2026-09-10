import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useDashboardStore = create((set, get) => ({
  myMood: null,
  partnerMood: null,
  generation: 0,
  sessionUserId: null,
  loading: false,
  moodSaving: false,
  moodError: null,
  pairId: null,
  subscription: null,
  realtimeConnected: false,

  initializeDashboard: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.sessionUserId === user.id && current.subscription) return

    get().cleanup()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user.id

    set({ loading: true, sessionUserId: user.id, pairId })

    try {
      const oldChannel = get().subscription
      if (oldChannel) {
        await supabase.removeChannel(oldChannel)
        if (!isCurrent()) return
      }

      const channel = supabase
        .channel(`moods:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'moods',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          if (!isCurrent()) return
          const { new: newMood } = payload
          if (!newMood) return
          if (newMood.user_id === user.id) {
            set({ myMood: newMood })
          } else {
            set({ partnerMood: newMood })
          }
        })
        .subscribe((status) => {
          if (!isCurrent()) return
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

      if (!isCurrent()) return
      const { data: partnerMood } = await supabase
        .from('moods')
        .select('*')
        .eq('pair_id', pairId)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!isCurrent()) return
      set({ myMood, partnerMood, loading: false })
    } catch (err) {
      if (!isCurrent()) return { error: 'Sessão alterada' }
      set({ error: err.message, loading: false })
    }
  },

  setMood: async (moodType, customText = null, customEmoji = null) => {
    const { user } = useAuthStore.getState()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user?.id
    const { myMood, pairId } = get()
    if (!user || !pairId) return { error: 'Aguarde o vínculo terminar de carregar.' }

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
    set({ myMood: optimisticMood, moodSaving: true, moodError: null })

    let error = null
    try {
      ({ error } = await supabase
        .from('moods')
        .upsert({
          pair_id: pairId,
          user_id: user.id,
          mood_type: moodType,
          custom_text: customText,
          custom_emoji: customEmoji,
          updated_at: new Date().toISOString()
        }, { onConflict: 'pair_id,user_id' }))
    } catch (requestError) {
      error = requestError
    }

    if (!isCurrent()) return { error: 'Sessão alterada' }
    if (error) {
      set({ myMood: previousMood, moodSaving: false, moodError: error.message || 'Não foi possível atualizar seu humor.' })
      return { error: error.message }
    }
    set({ moodSaving: false, moodError: null })
    return { success: true }
  },

  cleanup: () => {
    const { subscription } = get()
    set({ generation: get().generation + 1, sessionUserId: null, error: null, moodError: null, moodSaving: false })
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

import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'
import { subscribeToPush, unsubscribeFromPush } from '../shared/lib/pushSubscription'

let generation = 0
let observers = 0
let stopObserving = null

export const usePairingStore = create((set, get) => ({
  userId: null,
  pair: null,
  statusLoading: true,
  statusError: null,
  reset: (userId = null) => {
    generation++
    set({ userId, pair: null, statusLoading: !!userId, statusError: null })
  },
  checkPairStatus: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) { get().reset(); return null }
    if (get().userId !== userId) get().reset(userId)
    const request = generation
    try {
      const { data, error } = await supabase.from('pairs').select('*')
        .or(`user_one.eq.${userId},user_two.eq.${userId}`)
        .not('code_used', 'eq', false).maybeSingle()
      if (error) throw error
      if (request !== generation || useAuthStore.getState().user?.id !== userId) return null
      const previousPairId = get().pair?.id
      set({ pair: data, statusLoading: false, statusError: null })
      if (data?.id && data.id !== previousPairId) void subscribeToPush(userId)
      if (previousPairId && !data) void unsubscribeFromPush(userId)
      return data
    } catch (error) {
      if (request === generation && useAuthStore.getState().user?.id === userId) {
        set({ statusLoading: false, statusError: error.message })
      }
      throw error
    }
  },
  unpair: async () => {
    const userId = useAuthStore.getState().user?.id
    const pair = await get().checkPairStatus()
    if (!pair) return { success: true }
    if (useAuthStore.getState().user?.id !== userId) throw new Error('A sessão mudou. Tente novamente.')
    const { error } = await supabase.from('pairs').delete().eq('id', pair.id)
    if (error) {
      if (useAuthStore.getState().user?.id === userId) set({ statusError: error.message })
      throw error
    }
    if (useAuthStore.getState().user?.id === userId) {
      generation++
      set({ pair: null, statusError: null, statusLoading: false })
      void unsubscribeFromPush(userId)
    }
    return { success: true }
  },
}))

export function observePairing() {
  observers++
  if (!stopObserving) {
    const refresh = () => { void usePairingStore.getState().checkPairStatus().catch(() => {}) }
    const onVisibility = () => { if (!document.hidden) refresh() }
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.user?.id !== previous.user?.id) {
        usePairingStore.getState().reset(state.user?.id)
        refresh()
      }
    })
    const timer = setInterval(onVisibility, 5000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibility)
    refresh()
    stopObserving = () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibility)
      unsubscribe()
    }
  }
  return () => {
    observers--
    if (!observers) { stopObserving?.(); stopObserving = null; generation++ }
  }
}

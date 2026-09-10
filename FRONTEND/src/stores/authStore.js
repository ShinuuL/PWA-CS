import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import { subscribeToPush, unsubscribeFromPush, cancelPushSubscription } from '../shared/lib/pushSubscription'
import useSpotifyStore from './spotifyStore'

let sessionGeneration = 0
let initializationGeneration = 0
let pushUserId = null

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    const initialization = ++initializationGeneration
    let disposed = false
    let authEventReceived = false
    const applySession = (session) => {
      if (disposed || initialization !== initializationGeneration) return
      const previousId = get().user?.id
      const nextId = session?.user?.id
      let cleanup = Promise.resolve()
      if (previousId !== nextId) {
        sessionGeneration++
        cancelPushSubscription()
        useSpotifyStore.getState().resetLocalSession({ preserveOAuth: !previousId && !!nextId })
        pushUserId = null
        if (previousId) cleanup = unsubscribeFromPush(previousId).catch(error => console.error('Push cleanup error:', error))
      }
      set({ session, user: session?.user ?? null, loading: false, ...(previousId !== nextId ? { profile: null } : {}) })
      const generation = sessionGeneration
      // Defer client work outside the Supabase auth callback lock.
      setTimeout(() => {
        if (disposed || generation !== sessionGeneration || get().user?.id !== nextId || !nextId) return
        void get().fetchProfile(nextId).catch(error => console.error('Profile error:', error))
        void cleanup.then(() => {
          if (disposed || generation !== sessionGeneration || get().user?.id !== nextId || pushUserId === nextId) return
          pushUserId = nextId
          void Promise.resolve(subscribeToPush(nextId)).catch(error => console.error('Push error:', error)).finally(() => {
            if (generation === sessionGeneration) pushUserId = null
          })
        }).catch(error => console.error('Push error:', error))
      }, 0)
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true
      applySession(session)
    })
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!authEventReceived) applySession(session)
    } catch (error) {
      console.error('Initialize error:', error)
      if (!disposed && initialization === initializationGeneration) set({ loading: false })
    }
    return () => { disposed = true; subscription.unsubscribe() }
  },

  fetchProfile: async (userId) => {
    const generation = sessionGeneration
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!error && generation === sessionGeneration && get().user?.id === userId) set({ profile: data })
    return { data, error }
  },

  signOut: async () => {
    const userId = get().user?.id
    cancelPushSubscription()
    await unsubscribeFromPush(userId)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    if (get().user?.id && get().user.id !== userId) return
    sessionGeneration++
    pushUserId = null
    useSpotifyStore.getState().resetLocalSession()
    set({ session: null, user: null, profile: null })
  },
}))

export default useAuthStore

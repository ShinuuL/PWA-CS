import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import { subscribeToPush, startGlobalMessageListener, stopGlobalMessageListener } from '../shared/lib/pushSubscription'

let pushSubscriptionInProgress = false

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Session error:', error)
      }
      set({ session, user: session?.user ?? null, loading: false })

      // Subscribe to push and start global listener for existing session
      if (session?.user) {
        if (!pushSubscriptionInProgress) {
          pushSubscriptionInProgress = true
          subscribeToPush().finally(() => { pushSubscriptionInProgress = false })
        }
        startGlobalMessageListener()
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          set({ session, user: session?.user ?? null })
          if (session?.user) {
            await get().fetchProfile(session.user.id)
            if (!pushSubscriptionInProgress) {
              pushSubscriptionInProgress = true
              console.log('[Push] User logged in, attempting subscription...')
              subscribeToPush()
                .then((result) => console.log('[Push] subscribeToPush result:', result ? 'success' : 'failed/null'))
                .finally(() => { pushSubscriptionInProgress = false })
            }
            startGlobalMessageListener()
          } else {
            set({ profile: null })
            stopGlobalMessageListener()
          }
        }
      )

      return () => subscription.unsubscribe()
    } catch (err) {
      console.error('Initialize error:', err)
      set({ loading: false })
    }
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error) set({ profile: data })
  },

  signOut: async () => {
    await stopGlobalMessageListener()
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  }
}))

export default useAuthStore

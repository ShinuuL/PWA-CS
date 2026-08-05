import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import { subscribeToPush } from '../shared/lib/pushSubscription'

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

      // Subscribe to push for existing session
      if (session?.user) {
        if (!pushSubscriptionInProgress) {
          pushSubscriptionInProgress = true
          subscribeToPush()
        }
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
            }
          } else {
            set({ profile: null })
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
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  }
}))

export default useAuthStore

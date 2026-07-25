import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, loading: false })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        set({ session, user: session?.user ?? null })
        if (session?.user) {
          await get().fetchProfile(session.user.id)
        } else {
          set({ profile: null })
        }
      }
    )

    return () => subscription.unsubscribe()
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

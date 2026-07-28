import useAuthStore from '../../stores/authStore'

export function useAuth() {
  const { session, user, profile, loading, signOut, fetchProfile } = useAuthStore()

  return {
    session,
    user,
    profile,
    loading,
    isAuthenticated: !!session,
    signOut,
    fetchProfile
  }
}

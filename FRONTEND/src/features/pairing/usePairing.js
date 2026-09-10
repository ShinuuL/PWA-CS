import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../shared/lib/supabase'
import useAuthStore from '../../stores/authStore'
import { usePairingStore, observePairing } from '../../stores/pairingStore'

export function usePairing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userId = useAuthStore(state => state.user?.id)
  const state = usePairingStore()
  useEffect(observePairing, [])
  const generateCode = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      if (!userId) throw new Error('Entre na sua conta para gerar um convite.')
      const { data, error } = await supabase.rpc('create_invite_code', { p_user_id: userId })
      if (error) throw error
      if (useAuthStore.getState().user?.id !== userId) return null
      return { code: data }
    } catch (err) { setError(err.message); return null }
    finally { setLoading(false) }
  }, [userId])
  const consumeCode = useCallback(async (code) => {
    setLoading(true); setError(null)
    try {
      if (!userId) throw new Error('Entre na sua conta para aceitar um convite.')
      const { data, error } = await supabase.rpc('consume_invite_code', { p_code: code, p_user_id: userId })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      if (useAuthStore.getState().user?.id !== userId) return null
      await useAuthStore.getState().fetchProfile(userId)
      await usePairingStore.getState().checkPairStatus()
      return { success: true, pairId: data.pair_id }
    } catch (err) { setError(err.message); return null }
    finally { setLoading(false) }
  }, [userId])
  return { ...state, pair: state.userId === userId ? state.pair : null, loading, error, generateCode, consumeCode }
}

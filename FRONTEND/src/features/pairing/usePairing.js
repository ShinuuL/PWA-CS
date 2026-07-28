import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'
import useAuthStore from '../../stores/authStore'

export function usePairing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, fetchProfile } = useAuthStore()

  const generateCode = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.rpc('create_invite_code', { p_user_id: user.id })
      if (error) throw error
      return { code: data }
    } catch (err) { setError(err.message); return null }
    finally { setLoading(false) }
  }, [user])

  const consumeCode = useCallback(async (code) => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.rpc('consume_invite_code', { p_code: code, p_user_id: user.id })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      await fetchProfile(user.id)
      return { success: true, pairId: data.pair_id }
    } catch (err) { setError(err.message); return null }
    finally { setLoading(false) }
  }, [user, fetchProfile])

  const checkPairStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('pairs')
        .select('*').or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .not('code_used', 'eq', false).maybeSingle()
      if (error) throw error
      return data
    } catch {
      return null
    }
  }, [user])

  const unpair = useCallback(async () => {
    const pair = await checkPairStatus()
    if (pair) await supabase.from('pairs').delete().eq('id', pair.id)
  }, [checkPairStatus])

  return { loading, error, generateCode, consumeCode, checkPairStatus, unpair }
}

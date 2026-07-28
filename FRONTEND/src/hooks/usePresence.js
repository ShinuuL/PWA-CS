import { useEffect, useState } from 'react'
import { supabase } from '../shared/lib/supabase'

/**
 * Custom hook to track partner online status via Supabase Realtime Presence.
 *
 * @param {string|null} pairId - The pair ID (from the user's pairing)
 * @param {string|null} userId - The partner's user ID to track
 * @returns {{ isOnline: boolean, lastSeen: Date|null }}
 */
export function usePresence(pairId, userId) {
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState(null)

  useEffect(() => {
    if (!pairId || !userId) return

    const channel = supabase.channel(`pair:${pairId}`, {
      config: { presence: { key: userId } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const partnerPresences = Object.values(state).flat()

        // Check if the tracked user (partner) is in the presence state
        if (partnerPresences.length > 0) {
          setIsOnline(true)
          setLastSeen(new Date(partnerPresences[0].online_at))
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setIsOnline(false)
        if (leftPresences.length > 0) {
          setLastSeen(new Date(leftPresences[0].online_at))
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track THIS user's presence (so partner can see us online)
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    // Cleanup: remove channel to prevent memory leaks (Pitfall 3)
    return () => {
      supabase.removeChannel(channel)
    }
  }, [pairId, userId])

  return { isOnline, lastSeen }
}

export default usePresence

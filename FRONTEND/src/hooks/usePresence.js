import { useEffect, useState, useRef } from 'react'
import { supabase } from '../shared/lib/supabase'

// Shared state for presence channels — multiple hook instances share the same channel
const channelRefs = new Map()

/**
 * Custom hook to track partner online status via Supabase Realtime Presence.
 *
 * @param {string|null} pairId - The pair ID (from the user's pairing)
 * @param {string|null} partnerId - The partner's user ID to track
 * @param {string|null} myUserId - The current user's ID (to filter out own presence)
 * @returns {{ isOnline: boolean, lastSeen: Date|null }}
 */
export function usePresence(pairId, partnerId, myUserId) {
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState(null)
  const callbackIdRef = useRef(null)

  useEffect(() => {
    if (!pairId || !partnerId) return

    const channelName = `pair:${pairId}`
    const callbackId = Symbol('presence')
    callbackIdRef.current = callbackId

    // Get or create shared channel ref
    if (!channelRefs.has(channelName)) {
      channelRefs.set(channelName, {
        channel: supabase.channel(channelName, {
          config: { presence: { key: myUserId || partnerId } }
        }),
        subscribers: new Map(),
        subscribed: false
      })
    }

    const ref = channelRefs.get(channelName)

    // Register this instance's callbacks
    ref.subscribers.set(callbackId, { setIsOnline, setLastSeen, partnerId, myUserId })

    // Initialize new subscriber from current presence state if channel already subscribed
    if (ref.subscribed) {
      const state = ref.channel.presenceState()
      const allPresences = Object.values(state).flat()
      const partnerPresence = allPresences.find((p) => p.user_id === partnerId)
      if (partnerPresence) {
        setIsOnline(true)
        setLastSeen(new Date(partnerPresence.online_at))
      }
    }

    // Only attach presence listeners once (on first subscriber)
    if (ref.subscribers.size === 1) {
      ref.channel
        .on('presence', { event: 'sync' }, () => {
          const state = ref.channel.presenceState()
          // Notify all subscribers, each filtering for their own partner
          ref.subscribers.forEach(({ setIsOnline, setLastSeen, partnerId: subPartnerId }) => {
            const allPresences = Object.values(state).flat()
            // Find the partner's presence (not our own)
            const partnerPresence = allPresences.find((p) => p.user_id === subPartnerId)
            if (partnerPresence) {
              setIsOnline(true)
              setLastSeen(new Date(partnerPresence.online_at))
            } else {
              setIsOnline(false)
            }
          })
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          ref.subscribers.forEach(({ setIsOnline, setLastSeen, partnerId: subPartnerId }) => {
            const leftPartner = leftPresences.find((p) => p.user_id === subPartnerId)
            if (leftPartner) {
              setIsOnline(false)
              setLastSeen(new Date(leftPartner.online_at))
            }
          })
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            ref.subscribed = true
            await ref.channel.track({ user_id: myUserId, online_at: new Date().toISOString() })
          }
        })
    }

    // Cleanup: remove this subscriber
    return () => {
      ref.subscribers.delete(callbackId)
      // If last subscriber, remove the channel entirely
      if (ref.subscribers.size === 0) {
        supabase.removeChannel(ref.channel)
        channelRefs.delete(channelName)
      }
    }
  }, [pairId, partnerId, myUserId])

  return { isOnline, lastSeen }
}

export default usePresence

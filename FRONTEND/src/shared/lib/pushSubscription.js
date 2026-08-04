import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

let globalMessageChannel = null
let globalPairId = null

/**
 * Check if push notifications are supported on this platform/device.
 * Returns false for iOS Safari not running as standalone PWA.
 */
export function isPushSupported() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }
  // iOS Safari only supports push in standalone mode (installed PWA)
  if (isIOSStandalone() === false && /iphone|ipad/i.test(navigator.userAgent)) {
    return false
  }
  return true
}

/**
 * Returns true if running on iOS in standalone mode (installed to home screen).
 * Returns false if iOS but NOT standalone. Returns null if not iOS.
 */
export function isIOSStandalone() {
  const isIOS = /iphone|ipad/i.test(navigator.userAgent)
  if (!isIOS) return null
  return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Convert a VAPID public key from base64url to Uint8Array
 * for use with the Push API.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Subscribe to push notifications.
 * Stores subscription in the push_subscriptions table.
 * Returns the subscription object or null on failure.
 */
export async function subscribeToPush() {
  console.log('[Push] subscribeToPush called')
  if (!isPushSupported()) {
    console.warn('[Push] isPushSupported() returned false')
    return null
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY not configured')
    return null
  }

  // Explicitly request notification permission
  console.log('[Push] Current permission:', Notification.permission)
  if (Notification.permission === 'default') {
    console.log('[Push] Requesting notification permission...')
    const permission = await Notification.requestPermission()
    console.log('[Push] Permission result:', permission)
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission not granted:', permission)
      return null
    }
  } else if (Notification.permission === 'denied') {
    console.warn('[Push] Notification permission denied by user')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    console.log('[Push] Service worker ready, scope:', registration.scope)

    let subscription = await registration.pushManager.getSubscription()
    console.log('[Push] Existing subscription:', subscription ? 'yes' : 'no')

    if (subscription) {
      const existingKey = subscription.options.applicationServerKey
        ? btoa(String.fromCharCode(...new Uint8Array(subscription.options.applicationServerKey))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        : null
      console.log('[Push] Existing sub key matches:', existingKey === VAPID_PUBLIC_KEY)

      if (existingKey !== VAPID_PUBLIC_KEY) {
        console.log('[Push] VAPID key changed, unsubscribing old subscription...')
        await subscription.unsubscribe()
        subscription = null
      }
    }

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      console.log('[Push] Subscribing to push...')
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
      console.log('[Push] Push subscription created successfully')
    }

    // Ensure subscription is saved in Supabase (idempotent)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const endpoint = subscription.endpoint

      // Check if this endpoint is already stored
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', endpoint)
        .maybeSingle()

      if (existing) {
        console.log('[Push] Subscription already in database')
        return subscription
      }

      // Get user's active pair_id (code_used = true)
      let pairId = null

      const { data: pairOne } = await supabase
        .from('pairs')
        .select('id')
        .eq('user_one', user.id)
        .eq('code_used', true)
        .maybeSingle()

      if (pairOne?.id) {
        pairId = pairOne.id
      } else {
        const { data: pairTwo } = await supabase
          .from('pairs')
          .select('id')
          .eq('user_two', user.id)
          .eq('code_used', true)
          .maybeSingle()
        if (pairTwo?.id) pairId = pairTwo.id
      }

      console.log('[Push] Found pair_id:', pairId)

      if (!pairId) {
        console.error('[Push] No active pair found for push subscription')
        return subscription
      }

      const subscriptionJson = subscription.toJSON()
      const { data: insertData, error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        pair_id: pairId,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth
      }).select()
      if (error) {
        console.error('[Push] Failed to store push subscription:', error.message, error.details)
      } else {
        console.log('[Push] Subscription saved to database:', insertData)
      }
    }

    return subscription
  } catch (err) {
    console.error('[Push] Push subscription failed:', err)
    return null
  }
}

/**
 * Unsubscribe from push notifications.
 * Removes subscription from the push_subscriptions table.
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return false

    const endpoint = subscription.endpoint

    // Unsubscribe from browser
    await subscription.unsubscribe()

    // Remove from Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Failed to remove push subscription:', error)
    }

    return true
  } catch (err) {
    console.error('Push unsubscribe failed:', err)
    return false
  }
}

/**
 * Get the current push subscription, if one exists.
 */
export async function getPushSubscription() {
  if (!isPushSupported()) return null

  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

/**
 * Find the active pair_id for the given user.
 */
async function findPairId(userId) {
  const { data: pairOne } = await supabase
    .from('pairs')
    .select('id')
    .eq('user_one', userId)
    .eq('code_used', true)
    .maybeSingle()

  if (pairOne?.id) return pairOne.id

  const { data: pairTwo } = await supabase
    .from('pairs')
    .select('id')
    .eq('user_two', userId)
    .eq('code_used', true)
    .maybeSingle()

  return pairTwo?.id || null
}

/**
 * Global message listener that sends push notifications
 * when the app is in background. Runs independently of
 * the chat page — active as long as the user is logged in.
 */
export async function startGlobalMessageListener() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const pairId = await findPairId(user.id)
  if (!pairId) {
    console.warn('[Push] No active pair for global message listener')
    return
  }

  // Skip if already listening for this pair
  if (globalMessageChannel && globalPairId === pairId) {
    console.log('[Push:Global] Already listening for pair:', pairId)
    return
  }

  // Clean up existing channel if any
  await stopGlobalMessageListener()

  globalPairId = pairId

  const channel = supabase
    .channel(`global-push:${pairId}-${Date.now()}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `pair_id=eq.${pairId}`
    }, (payload) => {
      const { new: newMsg } = payload
      if (newMsg.sender_id === user.id) return

      const isForeground =
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'

      console.log('[Push:Global] Message received. foreground:', isForeground)

      if (!isForeground) {
        console.log('[Push:Global] App in background, invoking send-chat-push')
        supabase.functions
          .invoke('send-chat-push', {
            body: {
              recipient_id: user.id,
              sender_name: 'Partner',
              message_text: newMsg.content
                ? newMsg.content.substring(0, 50)
                : 'New message'
            }
          })
          .then(async (res) => {
            if (res.error) {
              const body = await res.response?.json().catch(() => null)
              console.error('[Push:Global] send-chat-push error:', res.error.message, 'Body:', body)
            } else {
              console.log('[Push:Global] send-chat-push success:', res.data)
            }
          })
          .catch((err) => console.error('[Push:Global] send-chat-push failed:', err))
      }
    })
    .subscribe()

  globalMessageChannel = channel
  console.log('[Push:Global] Listener started for pair:', pairId)
}

/**
 * Stop the global message listener.
 */
export async function stopGlobalMessageListener() {
  if (globalMessageChannel) {
    await supabase.removeChannel(globalMessageChannel)
    globalMessageChannel = null
    globalPairId = null
    console.log('[Push:Global] Listener stopped')
  }
}

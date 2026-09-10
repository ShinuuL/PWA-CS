import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

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
let pushGeneration = 0
let pendingSubscription = null
let pendingGeneration = null

export function cancelPushSubscription() {
  pushGeneration++
}

export async function subscribeToPush(expectedUserId) {
  const generation = pushGeneration
  if (pendingSubscription) {
    if (pendingGeneration === generation) return pendingSubscription
    await pendingSubscription
    if (generation !== pushGeneration) return null
    return subscribeToPush(expectedUserId)
  }
  const current = () => generation === pushGeneration
  const task = (async () => {
    if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || !current() || (expectedUserId && user.id !== expectedUserId)) return null
      if (Notification.permission === 'default') await Notification.requestPermission()
      if (!current() || Notification.permission !== 'granted') return null
      const registration = await navigator.serviceWorker.getRegistration()
      if (!current() || !registration) return null
      let subscription = await registration.pushManager.getSubscription()
      if (!current()) return null
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }
      if (!current()) { await subscription.unsubscribe(); return null }
      const { data: pair, error: pairError } = await supabase.from('pairs')
        .select('id').or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .eq('code_used', true).maybeSingle()
      if (pairError) throw pairError
      if (!current() || !pair) return null
      const json = subscription.toJSON()
      if (!current()) return null
      const values = { user_id: user.id, pair_id: pair.id, endpoint: json.endpoint,
        p256dh: json.keys?.p256dh, auth: json.keys?.auth }
      // The schema allows one active subscription per user. Upsert avoids a
      // duplicate-key race when auth and pairing observers register together.
      const result = await supabase.from('push_subscriptions').upsert(values, { onConflict: 'user_id' })
      if (result.error) throw result.error
      if (!current()) {
        await subscription.unsubscribe()
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint).eq('user_id', user.id)
        return null
      }
      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  })()
  pendingSubscription = task
  pendingGeneration = generation
  try { return await task } finally { if (pendingSubscription === task) pendingSubscription = null }
}

export async function unsubscribeFromPush(userId) {
  cancelPushSubscription()
  if (!isPushSupported()) return false
  try {
    // Do not block logout on a notification permission prompt left open by the user.
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return false
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return false
    await subscription.unsubscribe()
    if (userId) {
      const { error } = await supabase.from('push_subscriptions').delete()
        .eq('endpoint', subscription.endpoint).eq('user_id', userId)
      if (error) console.error('Failed to remove push subscription:', error)
    }
    return true
  } catch (error) {
    console.error('Push unsubscribe failed:', error)
    return false
  }
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    return registration ? await registration.pushManager.getSubscription() : null
  } catch { return null }
}



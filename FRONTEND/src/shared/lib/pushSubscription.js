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
export async function subscribeToPush() {
  if (!isPushSupported()) return null
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VITE_VAPID_PUBLIC_KEY not configured')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const existingSubscription = await registration.pushManager.getSubscription()

    // Already subscribed — return existing
    if (existingSubscription) {
      return existingSubscription
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    })

    // Store in Supabase
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const subscriptionJson = subscription.toJSON()
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint,
        keys_p256dh: subscriptionJson.keys?.p256dh,
        keys_auth: subscriptionJson.keys?.auth
      })
      if (error) {
        console.error('Failed to store push subscription:', error)
      }
    }

    return subscription
  } catch (err) {
    console.error('Push subscription failed:', err)
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

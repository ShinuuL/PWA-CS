import { precacheAndRoute } from 'workbox-precaching'

// Let workbox precache all assets
precacheAndRoute(self.__WB_MANIFEST)

// Push event handler (REMN-08)
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    return
  }

  const { title, body, icon, tag, url } = payload

  const options = {
    body,
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: url || '/' },
    tag: tag || 'couplespace-notification',
    renotify: true
  }

  event.waitUntil(self.registration.showNotification(title || 'CoupleSpace', options))
})

// Notification click deep-link (D-20)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Check if there is already a window open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Open a new window if none exists
      return self.clients.openWindow(targetUrl)
    })
  )
})

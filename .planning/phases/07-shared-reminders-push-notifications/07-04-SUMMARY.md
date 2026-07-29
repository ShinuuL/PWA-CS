---
phase: 07-shared-reminders-push-notifications
plan: "04"
subsystem: client-push-infrastructure
tags: [push-notifications, service-worker, pwa, settings, vite-plugin-pwa]
dependency_graph:
  requires: []
  provides: [sw.js, pushSubscription.js, settings-push-toggle]
  affects: [vite.config.js, SettingsPage.jsx, settings.css]
tech_stack:
  added: [workbox-precaching]
  patterns: [service-worker, push-api, vite-plugin-pwa-custom-sw]
key_files:
  created:
    - FRONTEND/src/sw.js
    - FRONTEND/src/shared/lib/pushSubscription.js
  modified:
    - FRONTEND/vite.config.js
    - FRONTEND/src/features/settings/SettingsPage.jsx
    - FRONTEND/src/features/settings/settings.css
    - FRONTEND/.env.example
decisions:
  - "Custom SW extends workbox rather than replacing it — keeps precaching + runtimeCaching"
  - "iOS standalone detection via display-mode media query per research pitfall"
  - "VAPID key read from VITE_VAPID_PUBLIC_KEY env var — no hard-coding"
metrics:
  duration: "5m"
  completed: "2026-07-29"
  tasks: 1
  files: 6
status: complete
---

# Phase 7 Plan 04: Client Push Infrastructure Summary

Custom service worker with push event handling, client-side push subscription management, and Settings notification toggle.

## What Was Built

### Custom Service Worker (`src/sw.js`)
- Workbox precaching via `precacheAndRoute(self.__WB_MANIFEST)`
- `push` event listener parses JSON payload, calls `self.registration.showNotification()` with title, body, icon, badge, tag, renotify
- `notificationclick` listener closes notification and deep-links to URL from `notification.data.url` — focuses existing window or opens new one
- Data format supports reminder notifications (`/agenda` deep-link, unique tag per reminder ID) and chat notifications (`/chat` deep-link, grouped tag)

### Push Subscription Utility (`src/shared/lib/pushSubscription.js`)
- `urlBase64ToUint8Array()` — VAPID key conversion for Push API
- `subscribeToPush()` — gets SW registration, calls `pushManager.subscribe()`, stores subscription in `push_subscriptions` table via Supabase
- `unsubscribeFromPush()` — calls `subscription.unsubscribe()`, removes from `push_subscriptions` table
- `getPushSubscription()` — returns current subscription if exists
- `isPushSupported()` — checks `PushManager` availability and SW registration; returns false for iOS Safari not in standalone mode
- `isIOSStandalone()` — detects iOS + standalone via `display-mode` media query
- VAPID public key read from `import.meta.env.VITE_VAPID_PUBLIC_KEY`

### Vite Config Update
- Added `swSrc: 'src/sw.js'` to VitePWA config — tells vite-plugin-pwa to use the custom SW instead of the auto-generated one
- All existing workbox config (globPatterns, navigateFallback, runtimeCaching) preserved

### SettingsPage Push Toggle
- New "Notificações" section between Account and Relationship
- Custom toggle switch (44x24px, rounded, animated knob) with active/inactive states
- Permission status display: "Permitido" (green), "Negado" (red with explanation), "Não solicitado" (gray)
- Toggle ON: requests permission if needed, subscribes to push
- Toggle OFF: unsubscribes from push
- Denied state disables toggle and shows browser settings explanation
- iOS not-installed state shows install prompt message
- Hint text shown when toggle is off: "Para desativar, altere nas configurações do navegador"

### CSS Additions (`settings.css`)
- `.settings-section-toggle` — flex row with label + toggle
- `.settings-toggle-switch` — 44x24px custom toggle with `.active` state
- `.settings-toggle-knob` — animated white circle
- `.settings-toggle-status` — permission status text with `.status-granted` (green), `.settings-toggle-status.status-denied` (red), `.status-default` (gray)
- `.settings-push-message` — iOS install prompt message
- `.settings-toggle-hint` — deactivation hint text

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added VAPID key to .env.example**
- **Found during:** Task 1 (file creation)
- **Issue:** `VITE_VAPID_PUBLIC_KEY` was referenced in code but not documented in `.env.example`
- **Fix:** Added `VITE_VAPID_PUBLIC_KEY=your-vapid-public-key` to `.env.example`
- **Files modified:** FRONTEND/.env.example
- **Commit:** bf36c40

## Known Stubs

None — all push subscription functions are fully wired. The VAPID public key itself is an env variable that must be provided by the user in `.env.local` (Plan 05 handles the server-side key generation).

## Threat Flags

None — this plan adds client-side push handling only. No new server endpoints, auth paths, or schema changes at trust boundaries.

## Self-Check: PASSED

- [x] `src/sw.js` created — push event + notificationclick handlers
- [x] `src/shared/lib/pushSubscription.js` created — full subscription lifecycle
- [x] `vite.config.js` updated — swSrc added
- [x] `SettingsPage.jsx` updated — Notificações section with toggle
- [x] `settings.css` updated — toggle + status styles
- [x] `.env.example` updated — VAPID key placeholder
- [x] Commit exists: bf36c40
- [x] `npm run lint` passes (no new errors)

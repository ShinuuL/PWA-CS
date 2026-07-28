# Pitfalls Research — v2.0 Profile & Shared Utilities

## Avatar Upload Pitfalls

### 1. No Image Compression Before Upload
**Problem:** The current `AvatarUpload.jsx` accepts files up to 5MB raw. On mobile, camera photos are 3-8MB. Uploading uncompressed means slow uploads on cellular, wasted Supabase storage (billed), and slow loading everywhere the avatar appears (chat header, messages, profile page).

**Specific to this codebase:** The `profiles` table already has `avatar_url`, the `avatars` bucket exists with public RLS. The upload path `${user.id}/avatar.${ext}` with `upsert: true` is correct — but the file goes straight from `<input>` to Supabase with no processing.

**Fix:** Compress client-side before upload. Target 200KB max, 400x400px. Use `canvas` API or a lightweight lib like `browser-image-compression`. Crop tool must output compressed result, not raw.

### 2. Crop Tool Mobile UX
**Problem:** Most crop libraries (react-image-crop, react-easy-crop) use mouse drag handlers. On mobile, drag conflicts with scroll, pinch-to-zoom, and back gestures. The crop circle/square must work with touch events.

**Specific to this codebase:** The app is mobile-first PWA. The current avatar click opens a raw file input — no crop step. Adding crop means a full-screen modal on mobile, which must handle:
- Touch drag for positioning
- Pinch for zoom
- Orientation lock (portrait for avatars)
- Back button / swipe-to-dismiss

**Fix:** Use `react-easy-crop` (touch-native). Full-screen crop modal on mobile, centered modal on desktop. Test on iOS Safari specifically — `position: fixed` + virtual keyboard causes layout shift.

### 3. Cache Busting for Updated Avatars
**Problem:** When a user updates their avatar, the URL changes (`avatar.jpg` → same path with `upsert: true`). But Supabase Storage returns the same URL. The browser and service worker cache the old image. The Workbox `StaleWhileRevalidate` policy in `vite.config.js:27-32` will serve the cached version for the revalidation window.

**Specific to this codebase:** `vite.config.js:29` caches `supabase.co/storage` with `StaleWhileRevalidate`. The avatar URL is the same path on every upload (upsert), so the service worker won't know the content changed.

**Fix:** Append `?t=${Date.now()}` query param to avatar URLs after upload. The service worker ignores query params in its `urlPattern` regex, but the browser fetch cache will treat it as a new resource. Alternative: use Supabase storage's `transform` API to generate versioned URLs.

### 4. Avatar Display in Chat Messages
**Problem:** Chat messages load `profiles(display_name, avatar_url)` via Supabase join. If a user updates their avatar, old messages still show the old URL. The `profiles` table stores the current URL, not historical ones.

**Specific to this codebase:** `chatStore.js:78` does `.select('*, reactions(*), profiles(display_name, avatar_url)')`. The avatar_url is fetched at query time, so old messages will show the *current* avatar — which is actually the desired behavior for a couples app (you want to see the current person, not a historical avatar). But if the old avatar URL is deleted from storage (it's not with upsert), messages would show broken images.

**Fix:** Since `upsert: true` overwrites the same path, old URLs remain valid. No issue here unless you add versioned paths. Keep upsert behavior.

### 5. Storage Cost at Scale
**Problem:** Supabase free tier: 1GB storage, 2GB bandwidth/month. A couple uploading avatars (500KB × 2) + chat images (1MB × 100) + voice messages (500KB × 50) = ~60MB/year. Not a problem at small scale, but the 5MB upload limit without compression means a single不小心 photo can eat 5% of free tier storage.

**Fix:** Enforce compression. Consider adding a storage usage indicator in settings. Supabase Pro tier ($25/mo) gives 100GB — adequate for growth.

---

## Push Notification Pitfalls

### 1. Dual Service Worker Registration (Critical)
**Problem:** The app registers a service worker TWO ways:
- `vite.config.js:8-35` — vite-plugin-pwa generates a service worker with `registerType: 'autoUpdate'`
- `main.jsx:7-10` — Manual `navigator.serviceWorker.register('/sw.js')`

These are **different service workers**. vite-plugin-pwa generates a workbox-based SW at build time. The manual registration points to `/sw.js` which doesn't exist in the repo (no file found). This creates a race condition: two SWs fighting for scope, and the manual one may fail silently.

**Specific to this codebase:** The `workbox-window` dependency in `package.json:37` is for vite-plugin-pwa's SW communication. But `main.jsx` doesn't use it — it registers a raw SW. These conflict.

**Fix:** Remove the manual registration in `main.jsx`. Let vite-plugin-pwa handle everything. If you need custom SW logic (push handling), add it via vite-plugin-pwa's `additionalManifestEntries` or a custom `sw.src` file that vite-plugin-pwa builds.

### 2. Push Notification Permission UX
**Problem:** The current flow in `chatStore.js:578-583` calls `Notification.requestPermission()` directly. This triggers the browser's native permission dialog immediately. If the user denies, they can't re-enable without going to browser settings. No pre-permission UI explains *why* notifications are needed.

**Specific to this codebase:** `chatStore.js:61` reads `Notification.permission` at store creation time. `chatStore.js:588-600` shows notifications only when `notificationPermission === 'granted'`. But there's no educational prompt before the browser dialog — users are more likely to deny.

**Fix:** Show a custom "Enable notifications?" screen with explanation before calling `Notification.requestPermission()`. The explanation should say: "Get notified when your partner sends a message or when reminders are due." Only show the native dialog after the user clicks "Enable" on your custom screen.

### 3. Push Subscription Management Missing
**Problem:** The app uses `new Notification()` (local notifications) but has no push subscription. This means:
- Notifications only appear when the app tab is open
- No background notifications when the app is closed
- No notifications when the PWA is installed but not open

For a couples app, the killer feature is getting notified when your partner messages you while the app is closed. Local notifications don't do this.

**Specific to this codebase:** The chatStore `showNotification()` at line 587 uses `new Notification()` — a local notification. There's no `pushManager.subscribe()` call anywhere. No Supabase Edge Function to send push payloads.

**Fix:** This is a multi-step effort:
1. Register push subscription in the service worker (`pushManager.subscribe()`)
2. Store the subscription endpoint + keys in a `push_subscriptions` table
3. Create a Supabase Edge Function that sends push payloads via Web Push Protocol
4. Trigger the Edge Function from Supabase database webhooks or from the client after mutations
5. This is complex — consider deferring to a later phase if v2.0 scope is tight

### 4. iOS Safari PWA Push Limitations
**Problem:** iOS 16.4+ supports push notifications for home-screen PWAs, but with caveats:
- User must add the PWA to home screen first
- Permission is scoped to the home-screen app, not the browser
- `Notification.permission` returns `'default'` even after grant in some iOS versions
- Push subscription is managed by the OS, not the browser

**Specific to this codebase:** The PWA is designed for mobile-first. A significant portion of couples will use iPhones. The `registerType: 'autoUpdate'` in vite-plugin-pwa works, but push on iOS requires the user to have installed the PWA.

**Fix:** Detect if running as installed PWA vs browser. On iOS, show "Add to Home Screen" prompt before asking for notification permission. Use `navigator.standalone` or `window.matchMedia('(display-mode: standalone)')` to detect.

### 5. Supabase Edge Function Cold Starts
**Problem:** If you use Supabase Edge Functions for push delivery, cold starts can add 500ms-2s latency. For a "partner just sent a message" notification, this delay is noticeable but acceptable. For time-sensitive reminders, it could mean the notification arrives after the reminder time.

**Specific to this codebase:** The project already has FastAPI planned for external APIs. Push notification delivery could live there instead of Edge Functions, avoiding Supabase-specific limitations.

**Fix:** For v2.0, use Supabase Edge Functions for push (simpler). Plan to migrate to FastAPI if latency is unacceptable. Pre-warm Edge Functions with a cron ping if needed.

### 6. Web Push Payload Size Limits
**Problem:** Web Push has a 4KB payload limit (encrypted). If you try to send rich notification data (partner name, message preview, avatar URL, deep link), you can hit this limit.

**Fix:** Keep push payloads minimal. Send only: `type`, `title`, `body`, `deepLink`. Let the client fetch full data when the user taps the notification.

---

## To-Do List Pitfalls

### 1. Realtime Sync Conflicts
**Problem:** Both partners can edit the same to-do list simultaneously. Supabase Realtime broadcasts changes, but there's no operational transform or conflict resolution. If both partners check off the same item at the same time, the last write wins.

**Specific to this codebase:** The existing `shared_notes` table has no conflict resolution — it uses simple `UPDATE` with RLS allowing both partners. The same pattern will be used for todos. Supabase Realtime's `postgres_changes` broadcasts the final state, not the intent.

**Fix:** For a couples app, conflicts are rare (two people, low concurrency). Use optimistic updates + Supabase Realtime to broadcast the final state. Add a `version` column or `updated_at` check to detect stale writes. If a conflict is detected, show "Partner made a change" and offer to refresh. Don't build a full CRDT — overkill for two users.

### 2. Due Date Timezone Handling
**Problem:** `agenda_events` uses `TIMESTAMPTZ` which stores UTC. But users think in local time. If a user in UTC+8 sets a reminder for "3pm", it should fire at 3pm their time, not 3pm UTC.

**Specific to this codebase:** The existing `agenda_events` table has `event_date TIMESTAMPTZ` — good, it stores UTC. But the client must convert local time → UTC on save, and UTC → local on display. `date-fns` handles this, but only if you use `format` with the user's timezone, not `toISOString()`.

**Fix:** Store all dates as UTC (already the case with TIMESTAMPTZ). On the client:
- When creating: `new Date(localDateTimeString)` → sends local time as UTC via Supabase
- When displaying: `format(new Date(utcString), 'MMM d, h:mm a')` — date-fns uses local timezone by default
- For push notifications: calculate `triggerTime = dueDate - now` in the Edge Function using the user's stored timezone

### 3. Offline Support for Todos
**Problem:** The chatStore has an `offlineQueue` pattern for messages. Todos need similar treatment — but todos have more state (checked/unchecked, reordered, edited). Offline edits must sync when reconnected.

**Specific to this codebase:** The chatStore's `syncOfflineQueue` at line 409 only handles text messages, not media. For todos, the offline queue must handle:
- Create todo (needs temp ID)
- Toggle check status
- Edit title/due date
- Delete todo

**Fix:** Use the same `pendingTempIds` pattern from chatStore. Store offline mutations in a queue. On reconnect, replay in order. Use Supabase's `upsert` with `onConflict` to handle cases where the server version differs. For v2.0, consider a simpler approach: just refetch all todos on reconnect and show a "Synced" indicator.

### 4. Todo Assignment and RLS Complexity
**Problem:** Todos need to be readable by both partners but editable by either. The assignment (`assigned_to`) must be one of the two pair members. RLS must enforce:
- SELECT: both partners can see all todos in their pair
- INSERT: creator can create, `assigned_to` must be NULL or one of the pair members
- UPDATE: both partners can update (check/uncheck, edit)
- DELETE: both partners can delete

**Specific to this codebase:** The existing RLS pattern uses a subquery on `pairs`:
```sql
pair_id IN (SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid())
```
This works but is expensive for complex policies. For todos, add a CHECK constraint on `assigned_to`:
```sql
CONSTRAINT valid_assignee CHECK (assigned_to IS NULL OR assigned_to IN (
  SELECT user_one FROM pairs WHERE id = pair_id
  UNION SELECT user_two FROM pairs WHERE id = pair_id
))
```
But this subquery-per-row is slow. Better to handle in the application layer.

**Fix:** Keep RLS simple (pair membership check). Validate `assigned_to` in the client and in a database trigger if needed. Don't add CHECK constraints with subqueries — performance impact on every INSERT/UPDATE.

### 5. Checkbox State Optimistic Updates
**Problem:** Toggling a checkbox should feel instant. If you wait for the Supabase round-trip (100-300ms on cellular), the UI feels laggy. But optimistic updates can show the wrong state if the write fails.

**Specific to this codebase:** The chatStore uses optimistic updates with `pendingTempIds` for messages. For todos, the pattern is simpler — just toggle the local state and revert on error.

**Fix:** Optimistic update the checkbox immediately. On error, revert and show toast. Use Supabase Realtime to sync the partner's view. The `updated_at` column handles ordering.

---

## Integration Pitfalls

### 1. Profile Fetch Race Condition
**Problem:** The `authStore.fetchProfile()` is called on auth state change. If a user navigates to profile page before the fetch completes, `profile` is null. The AvatarUpload component accesses `profile?.avatar_url` — this works with optional chaining, but the UI shows nothing until the fetch completes.

**Specific to this codebase:** `authStore.js:28-36` fetches profile on auth change. `AvatarUpload.jsx:8` destructures `profile` from `useAuth()`. There's no loading state check — if `profile` is null, it shows initials but no avatar.

**Fix:** Add a loading state to the profile fetch. Show a skeleton spinner in AvatarUpload while `profile === null && loading === true`.

### 2. Zustand Store Subscription Leaks
**Problem:** Each new feature (todos, reminders) will create new Zustand stores. If stores subscribe to Supabase Realtime channels and don't clean up on unmount, you get memory leaks and duplicate subscriptions.

**Specific to this codebase:** `chatStore.js:603-614` has a `cleanup()` method that removes the Supabase channel. This pattern must be followed for all new stores. But there's no automatic cleanup on component unmount — it's manual.

**Fix:** Use `useEffect` cleanup in components that initialize stores. Or add a `destroy` method to each store and call it in the component's cleanup function. Consider a custom hook `useRealtimeCleanup` that handles this automatically.

### 3. PWA Offline Cache Stale Data
**Problem:** The Workbox config caches Supabase Storage with `StaleWhileRevalidate`. If a user goes offline, they see cached avatars/images. But the todo list and reminders are dynamic — showing stale todos when offline is confusing.

**Specific to this codebase:** `vite.config.js:27-32` only caches Supabase Storage, not the API. Supabase API calls go to `*.supabase.co/rest/v1/` and `*.supabase.co/auth/v1/` — these aren't cached by Workbox. So the app will fail gracefully on offline for data fetches (network error). But there's no offline UI indicator.

**Fix:** Add an offline detection hook (`navigator.onLine` + `online`/`offline` events). Show a banner "You're offline — changes will sync when reconnected." The chatStore already has this pattern partially (line 221-227). Extend it to all features.

### 4. Avatar URL in Messages After Profile Update
**Problem:** When `chatStore.js:78` fetches messages with `profiles(display_name, avatar_url)`, it gets a snapshot of the profile at query time. If the user later changes their avatar, old message batches show the old URL (from the joined data), but the `authStore.profile` shows the new URL.

**Specific to this codebase:** This is actually fine for the current architecture — Supabase joins return the current profile state, not historical. Messages fetched after the avatar change will show the new avatar. Only messages fetched *before* the change (and still in the Zustand store) show the old URL. This is acceptable behavior.

**Fix:** No fix needed — the current behavior is correct. Old messages in memory show the avatar that was current when they were loaded. New messages show the new avatar. This is standard behavior for chat apps.

### 5. Service Worker Update Lifecycle
**Problem:** vite-plugin-pwa with `registerType: 'autoUpdate'` automatically updates the SW. But if the user has the app open during an update, the new SW activates and the old page is now stale. React components may reference deleted routes or changed API contracts.

**Specific to this codebase:** The PWA config at `vite.config.js:9` uses `registerType: 'autoUpdate'`. This means the new SW takes control immediately, but the old page is still running. If the update changes a Zustand store shape or API endpoint, the running page crashes.

**Fix:** Use `registerType: 'prompt'` instead. Show an "Update available" toast. Let the user click to apply. This gives you control over when the update happens — ideally when the user isn't mid-chat.

---

## Prevention Strategy

### Phase Allocation

| Pitfall | Severity | Phase | Prevention |
|---------|----------|-------|------------|
| Dual SW registration | **Critical** | Phase 1 (Foundation) | Remove manual SW reg, let vite-plugin-pwa handle it |
| Image compression | High | Phase 1 (Avatar) | Add `browser-image-compression` to upload flow |
| Crop tool mobile UX | High | Phase 1 (Avatar) | Use `react-easy-crop`, test on iOS Safari |
| Cache busting for avatars | Medium | Phase 1 (Avatar) | Append `?v=${timestamp}` to avatar URLs |
| Push subscription management | High | Phase 2 (Reminders) | Register push in SW, store subscription in DB |
| Permission UX | Medium | Phase 2 (Reminders) | Custom pre-permission screen before browser dialog |
| iOS PWA push | High | Phase 2 (Reminders) | Detect standalone mode, guide home screen install |
| Due date timezone | Medium | Phase 2 (Reminders) | Store UTC, display local, calculate trigger in Edge Function |
| Offline todo sync | Medium | Phase 3 (Todos) | Optimistic updates + refetch on reconnect |
| Realtime conflict | Low | Phase 3 (Todos) | Last-write-wins + version check for stale writes |
| RLS for todos | Medium | Phase 3 (Todos) | Simple pair membership, validate assignee in client |
| Offline indicator | Medium | Phase 1 (Foundation) | `useOnlineStatus` hook, banner component |
| SW update lifecycle | Medium | Phase 1 (Foundation) | Switch to `registerType: 'prompt'` |
| Store subscription leaks | Medium | All phases | Cleanup hooks, consistent pattern across stores |
| Profile fetch race condition | Low | Phase 1 (Avatar) | Loading state in profile-dependent components |

### Implementation Order

1. **Phase 1 (Foundation fixes first):**
   - Fix dual SW registration (remove `main.jsx` SW code)
   - Switch to `registerType: 'prompt'`
   - Add `useOnlineStatus` hook + offline banner
   - Add image compression to avatar upload
   - Add crop tool (react-easy-crop)
   - Add cache busting to avatar URLs
   - Add profile loading state

2. **Phase 2 (Push notifications):**
   - Custom permission UX screen
   - Push subscription registration in service worker
   - `push_subscriptions` table + RLS
   - Supabase Edge Function for push delivery
   - iOS standalone detection
   - Due date timezone handling (UTC storage, local display)

3. **Phase 3 (To-do lists):**
   - Optimistic checkbox updates
   - Simple offline: refetch on reconnect
   - RLS with pair membership + client-side assignee validation
   - Realtime sync for partner view

### Testing Checklist

- [ ] Upload 5MB image → verify compression to <200KB
- [ ] Crop on iOS Safari → verify touch drag, no scroll conflict
- [ ] Update avatar → verify all views show new image (cache bust)
- [ ] Deny notification permission → verify graceful degradation
- [ ] Close app → verify push notification arrives (if implemented)
- [ ] Toggle todo checkbox offline → verify sync on reconnect
- [ ] Both partners edit same todo simultaneously → verify no data loss
- [ ] Set reminder in different timezone → verify correct trigger time
- [ ] Check todo across timezone boundary → verify correct due date display

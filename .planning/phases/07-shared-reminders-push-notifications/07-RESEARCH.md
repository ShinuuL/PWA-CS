# Phase 7: Shared Reminders + Push Notifications - Research

**Researched:** 2026-07-29
**Domain:** Web Push Notifications, PWA Service Workers, Supabase Edge Functions, pg_cron, DateTimePicker
**Confidence:** HIGH

## Summary

Phase 7 adds shared reminders with push notification delivery and chat push notifications to CoupleSpace. The technical stack involves Web Push API + Service Workers for client-side push, Supabase Edge Functions + pg_cron for server-side scheduling, and a custom DateTimePicker component. The existing `shared_reminders` table (Phase 6) provides the data foundation. Key iOS limitation: push notifications only work for installed PWAs (add-to-home-screen required), not browser tabs.

**Primary recommendation:** Use `@negrel/webpush` in Supabase Edge Functions (Deno-compatible), pg_cron for minute-level scheduling, and `@ncdai/react-wheel-picker` for the time picker scroll wheel.

---

## Web Push Notifications

### Architecture Overview

```
User grants permission → Browser creates subscription
→ Client stores subscription in push_subscriptions table
→ pg_cron checks due reminders every minute
→ pg_cron calls Edge Function via pg_net
→ Edge Function sends push via Web Push protocol
→ Push service (FCM/APNs/Autopush) delivers to browser
→ Service worker receives push event → shows notification
```

### Key Components

| Component | Role | Implementation |
|-----------|------|----------------|
| VAPID Keys | Server identity authentication | Generate via `web-push generate-vapid-keys` or vapidkeys.com |
| PushSubscription | Browser endpoint + encryption keys | `registration.pushManager.subscribe()` |
| Service Worker | Background push event handler | `self.addEventListener('push', ...)` |
| Push Service | Browser-specific relay | FCM (Chrome), Autopush (Firefox), APNs (Safari) |

### Browser Compatibility (2026)

| Browser | Web Push | Notes |
|---------|----------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Edge | ✅ | Full support |
| Safari (macOS) | ✅ | Since Ventura (2022) |
| Safari (iOS) | ⚠️ | iOS 16.4+ required, PWA must be installed to home screen |
| Samsung Internet | ✅ | Full support |

### iOS Safari Limitations (Critical)

1. **PWA installation required**: Push notifications only work for PWAs added to home screen via Safari → Share → Add to Home Screen
2. **Browser tab does not count**: `PushManager` returns `undefined` if not in standalone mode
3. **Check before requesting permission**:
```javascript
const isIOS = /iphone|ipad/i.test(navigator.userAgent)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches

if (isIOS && !isStandalone) {
  // Show install prompt, don't request permission
  showInstallPrompt()
  return
}
```
4. **EU DMA impact**: PWAs in EU countries may not support push (Apple removed standalone mode in EU)
5. **VAPID subject format**: Must be `mailto:` address or full HTTPS URL

### Subscription Management

**Store subscriptions in `push_subscriptions` table**:
```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Client-side subscription**:
```javascript
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  })
  
  // Store in Supabase
  await supabase.from('push_subscriptions').insert({
    user_id: user.id,
    pair_id: pairId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth
  })
}
```

### Subscription Cleanup

Push subscriptions expire silently. After sending, check for `410 Gone` responses and remove invalid subscriptions:
```javascript
try {
  await webpush.sendNotification(subscription, payload)
} catch (err) {
  if (err.statusCode === 410) {
    // Subscription expired, remove from database
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  }
}
```

---

## Supabase Edge Functions + pg_cron

### Architecture

```
pg_cron (every minute)
  → SQL: SELECT due reminders
  → pg_net: HTTP POST to Edge Function
  → Edge Function: Send push via web-push
  → Update reminder status
```

### Setup Steps

1. **Enable extensions** (Supabase Dashboard → SQL Editor):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

2. **Store secrets in Vault**:
```sql
SELECT vault.create_secret('https://your-project.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'publishable_key');
SELECT vault.create_secret('YOUR_VAPID_PRIVATE_KEY', 'vapid_private_key');
SELECT vault.create_secret('YOUR_VAPID_SUBJECT', 'vapid_subject');
```

3. **Create Edge Function** (`supabase/functions/send-push-notification/index.ts`):
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import * as webpush from "https://jsr.io/@negrel/webpush"

// Load VAPID keys from environment
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidSubject = Deno.env.get('VAPID_SUBJECT')

// Convert VAPID keys to JWK format for Deno
// ... (see @negrel/webpush documentation)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { subscription, payload } = await req.json()
  
  try {
    const sub = appServer.subscribe(subscription)
    await sub.pushTextMessage(payload, {})
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
```

4. **Create pg_cron job** (runs every minute):
```sql
SELECT cron.schedule(
  'send-due-reminders',
  '* * * * *',
  $$
  -- Call Edge Function for each due reminder
  SELECT net.http_post(
    url := (SELECT vault.secret('project_url')) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT vault.secret('publishable_key'))
    ),
    body := jsonb_build_object(
      'reminder_id', sr.id,
      'pair_id', sr.pair_id,
      'title', sr.title,
      'created_by', sr.created_by
    )
  )
  FROM shared_reminders sr
  WHERE sr.reminder_at <= NOW()
    AND sr.completed_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM push_subscriptions ps
      WHERE ps.pair_id = sr.pair_id
    )
  $$
);
```

### Error Handling & Retry Strategy (D-07)

1. **Mark failed reminders**: Add `status` column to `shared_reminders`:
```sql
ALTER TABLE shared_reminders ADD COLUMN status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'sent', 'failed', 'pending_send'));
```

2. **Retry logic in Edge Function**:
```typescript
// If push fails, mark as pending_send for client fallback
if (pushFailed) {
  await supabase.from('shared_reminders')
    .update({ status: 'pending_send' })
    .eq('id', reminderId)
}
```

3. **Client fallback (D-08)**: On app open, check for pending_send reminders:
```javascript
const { data: pendingReminders } = await supabase
  .from('shared_reminders')
  .select('*')
  .eq('status', 'pending_send')
  .eq('pair_id', pairId)

if (pendingReminders?.length) {
  // Show in-app notification for each
  pendingReminders.forEach(r => showNotification('Lembrete', r.title))
  // Mark as sent
  await supabase.from('shared_reminders')
    .update({ status: 'sent' })
    .in('id', pendingReminders.map(r => r.id))
}
```

### pg_cron Limitations

- **Fire-and-forget**: `pg_net` HTTP calls don't return values to the cron job
- **No built-in retry**: 5xx errors don't auto-retry
- **Silent during outages**: pg_cron stops during Supabase incidents
- **Timezone**: Uses DB server timezone (usually UTC)

---

## DateTimePicker Component

### Architecture

```
DateTimePicker
├── CalendarGrid (existing component)
│   ├── Month navigation
│   └── Day selection
├── TimePicker (new component)
│   ├── Hour scroll wheel
│   └── Minute scroll wheel
└── Action buttons (Confirm/Cancel)
```

### Recommended Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| `@ncdai/react-wheel-picker` | iOS-like scroll wheel | Natural touch scrolling, infinite loop, unstyled (customizable), 753 GitHub stars |
| `date-fns` | Date manipulation | Already in project, tree-shakeable |
| `motion` (framer-motion) | Animations | Already in project |

### Time Picker Implementation

**Option 1: Use `@ncdai/react-wheel-picker`** (Recommended):
```jsx
import { WheelPicker, WheelPickerWrapper } from '@ncdai/react-wheel-picker'

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}))

const minutes = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}))

function TimePicker({ value, onChange }) {
  return (
    <WheelPickerWrapper>
      <WheelPicker
        items={hours}
        value={value.hour}
        onValueChange={(hour) => onChange({ ...value, hour })}
      />
      <WheelPicker
        items={minutes}
        value={value.minute}
        onValueChange={(minute) => onChange({ ...value, minute })}
      />
    </WheelPickerWrapper>
  )
}
```

**Option 2: Custom scroll wheel** (if library doesn't work):
```jsx
function ScrollWheel({ items, value, onChange, visibleCount = 5 }) {
  const itemHeight = 40
  const containerHeight = itemHeight * visibleCount
  
  return (
    <div className="scroll-wheel" style={{ height: containerHeight, overflow: 'hidden' }}>
      <div 
        className="scroll-wheel__inner"
        style={{ transform: `translateY(${(items.indexOf(value) - Math.floor(visibleCount / 2)) * -itemHeight}px)` }}
      >
        {items.map(item => (
          <div 
            key={item}
            className={`scroll-wheel__item ${item === value ? 'scroll-wheel__item--active' : ''}`}
            onClick={() => onChange(item)}
            style={{ height: itemHeight }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Calendar Integration

Reuse existing `CalendarGrid` component:
```jsx
function DateTimePicker({ value, onChange, onCancel }) {
  const [selectedDate, setSelectedDate] = useState(value?.date || new Date())
  const [selectedTime, setSelectedTime] = useState(value?.time || { hour: '09', minute: '00' })

  const handleConfirm = () => {
    const datetime = new Date(selectedDate)
    datetime.setHours(parseInt(selectedTime.hour), parseInt(selectedTime.minute))
    onChange(datetime)
  }

  return (
    <div className="datetime-picker">
      <CalendarGrid
        currentMonth={selectedDate}
        onMonthChange={setSelectedDate}
        onDayClick={setSelectedDate}
      />
      <TimePicker value={selectedTime} onChange={setSelectedTime} />
      <div className="datetime-picker__actions">
        <button onClick={onCancel}>Cancelar</button>
        <button onClick={handleConfirm}>Confirmar</button>
      </div>
    </div>
  )
}
```

### Touch-Friendly Patterns

1. **Minimum touch target**: 44x44px for all interactive elements
2. **Scroll snap**: Use CSS `scroll-snap-type: y mandatory` for wheel pickers
3. **Haptic feedback**: Use `navigator.vibrate(10)` on selection (if supported)
4. **Smooth animations**: 150-200ms transitions for state changes

---

## Real-Time Sync Patterns

### Supabase Realtime Subscription

Follow existing `agendaStore.js` pattern:
```javascript
const channel = supabase
  .channel(`reminders:${pairId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'shared_reminders',
    filter: `pair_id=eq.${pairId}`
  }, (payload) => {
    const state = get()
    if (payload.eventType === 'INSERT') {
      const alreadyPresent = state.reminders.some(r => r.id === payload.new.id)
      if (!alreadyPresent) {
        set({ reminders: [...state.reminders, payload.new].sort(/* ... */) })
      }
    } else if (payload.eventType === 'UPDATE') {
      set({ reminders: state.reminders.map(r =>
        r.id === payload.new.id ? payload.new : r
      ).sort(/* ...) })
    } else if (payload.eventType === 'DELETE') {
      set({ reminders: state.reminders.filter(r => r.id !== payload.old.id) })
    }
  })
  .subscribe()
```

### Optimistic Updates

```javascript
createReminder: async (formData) => {
  const tempId = `temp-${Date.now()}`
  const optimisticReminder = {
    id: tempId,
    pair_id: pairId,
    user_id: user.id,
    ...formData,
    created_at: new Date().toISOString()
  }

  // Optimistic insert
  set({ reminders: [...get().reminders, optimisticReminder] })

  try {
    const { data: newReminder, error } = await supabase
      .from('shared_reminders')
      .insert({ ... })
      .select()
      .single()

    if (error) throw error
    // Replace optimistic with real data
    set({ reminders: get().reminders.map(r => r.id === tempId ? newReminder : r) })
    return { success: true, reminder: newReminder }
  } catch (err) {
    // Rollback on error
    set({ reminders: get().reminders.filter(r => r.id !== tempId) })
    return { error: err.message }
  }
}
```

### Conflict Resolution

Since both partners can edit the same reminder:
1. **Last-write-wins**: Supabase Realtime delivers updates in order
2. **Creator attribution stays fixed**: Only title/date/notes can be edited
3. **No merge conflicts**: Simple field updates, no complex state

---

## Existing Codebase Analysis

### Reusable Components

| Component | Location | Reuse in Phase 7 |
|-----------|----------|------------------|
| SegmentedTabs | `src/features/agenda/SegmentedTabs.jsx` | Add "Lembretes" tab |
| CalendarGrid | `src/features/agenda/CalendarGrid.jsx` | Embed in DateTimePicker |
| EventForm pattern | `src/features/agenda/EventForm.jsx` | Base for ReminderForm |
| NotesTab pattern | `src/features/agenda/NotesTab.jsx` | Base for RemindersTab |
| NoteCard pattern | `src/features/agenda/NoteCard.jsx` | Base for ReminderCard |

### Established Patterns

| Pattern | Implementation | Phase 7 Application |
|---------|----------------|---------------------|
| Zustand stores | `create((set, get) => ({...}))` | Create `reminderStore.js` |
| Supabase Realtime | `.channel().on('postgres_changes', {...}).subscribe()` | Subscribe to `shared_reminders` |
| Optimistic updates | Insert → replace with server data → rollback on error | All CRUD operations |
| Co-located CSS | `ComponentName.jsx` + `ComponentName.css` | All new components |
| Feature directories | `src/features/{name}/` | `src/features/agenda/RemindersTab.jsx` |

### Integration Points

1. **AgendaPage tabs**: Add third tab `{ id: 'reminders', label: 'Lembretes' }`
2. **AgendaPage initialization**: Call `initializeReminders(pair.id)` in useEffect
3. **SettingsPage**: Add push notification toggle section
4. **Service worker**: Add push event handler to vite-plugin-pwa config
5. **AppShell**: No changes needed

### Service Worker Configuration

Current `vite.config.js` uses `vite-plugin-pwa` with workbox. To add push event handling:

```javascript
VitePWA({
  // ... existing config
  workbox: {
    // ... existing workbox config
    runtimeCaching: [
      // ... existing caching
    ]
  },
  // Add push event handler
  swSrc: 'src/sw.js' // Custom service worker that extends workbox
})
```

Or create a custom `src/sw.js`:
```javascript
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'

precacheAndRoute(self.__WB_MANIFEST)

// Push event handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CoupleSpace', {
      body: data.body || 'New notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/agenda' },
      tag: data.tag,
      renotify: true
    })
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/agenda'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
```

---

## Chat Push Notifications (D-25, D-26)

### Architecture

```
Chat message sent
  → Supabase Realtime delivers to partner's client
  → If app NOT in foreground:
      → Service worker receives push event
      → Shows notification: "{Sender name}" + "{message text}"
  → If app IN foreground:
      → Existing showNotification() (in-app toast)
```

### Implementation

**Modify chatStore.js** to detect foreground/background:
```javascript
const isAppInForeground = () => {
  return document.visibilityState === 'visible'
}

// In the Realtime subscription handler:
if (eventType === 'INSERT' && newMsg.sender_id !== user.id) {
  if (!isAppInForeground()) {
    // Send push notification via Edge Function
    await fetch('/functions/v1/send-chat-push', {
      method: 'POST',
      body: JSON.stringify({
        recipient_id: newMsg.sender_id,
        sender_name: newMsg.profiles?.display_name || 'Partner',
        message_text: newMsg.content?.substring(0, 50) || 'Nova mensagem'
      })
    })
  } else {
    // Use existing in-app notification
    get().showNotification(
      newMsg.profiles?.display_name || 'Partner',
      newMsg.content
    )
  }
}
```

**Edge Function for chat push**:
```typescript
serve(async (req) => {
  const { recipient_id, sender_name, message_text } = await req.json()
  
  // Get recipient's push subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', recipient_id)
  
  // Send push to all recipient's devices
  for (const sub of subscriptions) {
    try {
      await sendPush(sub, {
        title: sender_name,
        body: message_text,
        tag: 'couplespace-chat'
      })
    } catch (err) {
      if (err.statusCode === 410) {
        // Remove expired subscription
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }
  
  return new Response(JSON.stringify({ success: true }))
})
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@ncdai/react-wheel-picker` | npm | ~1 yr | ~10K/wk | github.com/ncdai/react-wheel-picker | OK | Approved |
| `@negrel/webpush` | JSR | ~2 yr | — | github.com/negrel/webpush | OK | Approved (Deno) |

---

## Common Pitfalls

### Pitfall 1: iOS Push Not Working
**What goes wrong:** User clicks "Allow notifications" but never receives pushes on iOS
**Why it happens:** PWA not installed to home screen, or app opened in Safari tab (not standalone)
**How to check:** Detect `display-mode: standalone` before requesting permission
**Warning signs:** `Notification.permission` returns 'default' instead of 'granted'

### Pitfall 2: Service Worker Not Receiving Push Events
**What goes wrong:** Push subscription exists but no notifications appear
**Why it happens:** Service worker not registered, or push event handler missing
**How to check:** Chrome DevTools → Application → Service Workers → check "Push" tab
**Warning signs:** No console logs from service worker

### Pitfall 3: Subscription Expiry
**What goes wrong:** Notifications stop working after weeks/months
**Why it happens:** Push subscriptions expire silently (browser clears them)
**How to check:** Listen for 410 responses when sending push
**Warning signs:** Increasing 410 errors in Edge Function logs

### Pitfall 4: pg_cron Silent Failures
**What goes wrong:** Reminders don't fire at scheduled time
**Why it happens:** pg_cron stops during Supabase outages, or SQL errors in job
**How to check:** Query `cron.job_run_details` for failed runs
**Warning signs:** Reminders stuck in 'pending' status

### Pitfall 5: Double Notifications
**What goes wrong:** User sees notification twice (push + in-app)
**Why it happens:** Both push and in-app fire when app is in foreground
**How to check:** `document.visibilityState === 'visible'` before sending push
**Warning signs:** User reports seeing same notification twice

---

## Technical Recommendations

1. **Use `@negrel/webpush` for Edge Functions** — Deno-compatible, no Node.js dependencies
2. **Store VAPID keys in Supabase Vault** — Never hardcode in Edge Function code
3. **Add `status` column to `shared_reminders`** — Track pending/sent/failed/pending_send states
4. **Create custom service worker** — Extend workbox with push event handler
5. **Implement subscription cleanup** — Remove expired subscriptions on 410 response
6. **Use `@ncdai/react-wheel-picker`** — iOS-like scroll wheel, already production-ready
7. **Test on real iOS device** — Simulator doesn't support push notifications
8. **Add push notification toggle to Settings** — Respect user choice, show permission status

---

## RESEARCH COMPLETE

*Research completed: 2026-07-29*
